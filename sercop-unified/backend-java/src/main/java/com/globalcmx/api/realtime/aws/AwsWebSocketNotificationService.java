package com.globalcmx.api.realtime.aws;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.globalcmx.api.alerts.dto.AlertResponse;
import com.globalcmx.api.realtime.RealTimeNotificationService;
import com.globalcmx.api.realtime.RealTimeProperties;
import com.globalcmx.api.realtime.dto.RealTimeMessage;
import com.globalcmx.api.realtime.dto.RealTimeSystemMessage;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.apigatewaymanagementapi.ApiGatewayManagementApiClient;
import software.amazon.awssdk.services.apigatewaymanagementapi.model.PostToConnectionRequest;
import software.amazon.awssdk.services.apigatewaymanagementapi.model.GoneException;

import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * AWS API Gateway WebSocket implementation for real-time notifications.
 *
 * Uses AWS API Gateway WebSocket API to send messages to connected clients.
 * Connections are tracked in a DynamoDB table (managed by Lambda on connect/disconnect).
 *
 * Supports the free tier (1M messages/month).
 */
@Slf4j
public class AwsWebSocketNotificationService implements RealTimeNotificationService {

    private final RealTimeProperties properties;
    private final ObjectMapper objectMapper;
    private final ApiGatewayManagementApiClient apiClient;

    // In-memory connection tracking (should be backed by DynamoDB in production)
    // Map: userId -> Set<connectionId>
    private final Map<String, Set<String>> userConnections = new ConcurrentHashMap<>();
    private final Map<String, String> connectionToUser = new ConcurrentHashMap<>();

    public AwsWebSocketNotificationService(RealTimeProperties properties) {
        this.properties = properties;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        String apiId = properties.getWebsocket().getApiId();
        String stage = properties.getWebsocket().getStage();
        String region = properties.getWebsocket().getRegion();

        if (apiId == null || apiId.isEmpty()) {
            throw new IllegalArgumentException("AWS WebSocket API ID is required");
        }

        // Build the endpoint URL: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
        String endpoint = String.format("https://%s.execute-api.%s.amazonaws.com/%s", apiId, region, stage);

        this.apiClient = ApiGatewayManagementApiClient.builder()
            .endpointOverride(URI.create(endpoint))
            .region(Region.of(region))
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();

        log.info("RealTime: AWS WebSocket initialized. API: {}, Stage: {}, Region: {}", apiId, stage, region);
    }

    @Override
    public void sendAlertToUser(String userId, AlertResponse alert) {
        sendToUser(userId, "alert", alert);
    }

    @Override
    public void sendVideoCallInvitation(String userId, AlertResponse alert) {
        sendToUser(userId, "video_call", alert);
    }

    @Override
    public void sendInstantMessage(String userId, RealTimeMessage message) {
        sendToUser(userId, "message", message);
    }

    @Override
    public void broadcastSystemMessage(RealTimeSystemMessage message) {
        broadcast("system", message);
    }

    @Override
    public boolean isUserConnected(String userId) {
        Set<String> connections = userConnections.get(userId);
        return connections != null && !connections.isEmpty();
    }

    @Override
    public int getConnectedUserCount() {
        return userConnections.size();
    }

    @Override
    public List<String> getConnectedUserIds() {
        return new ArrayList<>(userConnections.keySet());
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public String getProviderName() {
        return "WebSocket";
    }

    /**
     * Register a WebSocket connection for a user.
     * Called by Lambda on $connect.
     */
    public void registerConnection(String connectionId, String userId) {
        userConnections.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(connectionId);
        connectionToUser.put(connectionId, userId);
        log.debug("WebSocket: User {} connected with connectionId {}. Total: {}",
            userId, connectionId, getTotalConnectionCount());
    }

    /**
     * Unregister a WebSocket connection.
     * Called by Lambda on $disconnect.
     */
    public void unregisterConnection(String connectionId) {
        String userId = connectionToUser.remove(connectionId);
        if (userId != null) {
            Set<String> connections = userConnections.get(userId);
            if (connections != null) {
                connections.remove(connectionId);
                if (connections.isEmpty()) {
                    userConnections.remove(userId);
                }
            }
            log.debug("WebSocket: Connection {} (user {}) disconnected. Total: {}",
                connectionId, userId, getTotalConnectionCount());
        }
    }

    private void sendToUser(String userId, String eventType, Object data) {
        Set<String> connections = userConnections.get(userId);
        if (connections == null || connections.isEmpty()) {
            log.debug("WebSocket: No connections for user {}. Message will be fetched on next poll.", userId);
            return;
        }

        WebSocketMessage message = new WebSocketMessage(eventType, data);
        String json;
        try {
            json = objectMapper.writeValueAsString(message);
        } catch (JsonProcessingException e) {
            log.error("WebSocket: Error serializing message for user {}: {}", userId, e.getMessage());
            return;
        }

        Set<String> deadConnections = new HashSet<>();
        for (String connectionId : connections) {
            try {
                PostToConnectionRequest request = PostToConnectionRequest.builder()
                    .connectionId(connectionId)
                    .data(SdkBytes.fromUtf8String(json))
                    .build();

                apiClient.postToConnection(request);
                log.debug("WebSocket: Sent {} to user {} (connection {})", eventType, userId, connectionId);

            } catch (GoneException e) {
                // Connection is stale, mark for removal
                deadConnections.add(connectionId);
                log.debug("WebSocket: Connection {} is gone, removing", connectionId);
            } catch (Exception e) {
                log.warn("WebSocket: Error sending to connection {}: {}", connectionId, e.getMessage());
            }
        }

        // Clean up dead connections
        for (String deadConnection : deadConnections) {
            unregisterConnection(deadConnection);
        }
    }

    private void broadcast(String eventType, Object data) {
        int userCount = userConnections.size();
        if (userCount == 0) {
            log.debug("WebSocket: No connected users for broadcast");
            return;
        }

        log.info("WebSocket: Broadcasting {} to {} users", eventType, userCount);
        for (String userId : new ArrayList<>(userConnections.keySet())) {
            sendToUser(userId, eventType, data);
        }
    }

    private int getTotalConnectionCount() {
        return userConnections.values().stream().mapToInt(Set::size).sum();
    }

    /**
     * WebSocket message format.
     */
    private record WebSocketMessage(String type, Object data) {}
}
