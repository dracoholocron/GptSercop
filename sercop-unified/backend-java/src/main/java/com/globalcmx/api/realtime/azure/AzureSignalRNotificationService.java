package com.globalcmx.api.realtime.azure;

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

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Azure SignalR Service implementation for real-time notifications.
 *
 * Uses Azure SignalR Service REST API to send messages to clients.
 * Supports the free tier (20 connections, 20K messages/day).
 *
 * Connection string format: Endpoint=https://xxx.service.signalr.net;AccessKey=xxx
 */
@Slf4j
public class AzureSignalRNotificationService implements RealTimeNotificationService {

    private final RealTimeProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String endpoint;
    private final String accessKey;
    private final String hubName;

    // Track connected users (approximation based on recent activity)
    private final Map<String, Long> connectedUsers = new ConcurrentHashMap<>();
    private static final long CONNECTION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

    public AzureSignalRNotificationService(RealTimeProperties properties) {
        this.properties = properties;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        this.httpClient = HttpClient.newHttpClient();
        this.hubName = properties.getSignalr().getHubName();

        // Parse connection string
        String connectionString = properties.getSignalr().getConnectionString();
        if (connectionString == null || connectionString.isEmpty()) {
            throw new IllegalArgumentException("Azure SignalR connection string is required");
        }

        Map<String, String> parsed = parseConnectionString(connectionString);
        this.endpoint = parsed.get("Endpoint");
        this.accessKey = parsed.get("AccessKey");

        if (endpoint == null || accessKey == null) {
            throw new IllegalArgumentException("Invalid Azure SignalR connection string format");
        }

        log.info("RealTime: Azure SignalR initialized. Endpoint: {}, Hub: {}", endpoint, hubName);
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

    /**
     * Check if a user is connected using Azure SignalR REST API.
     * HEAD /api/v1/hubs/{hub}/users/{userId} returns:
     * - 200: User has active connections
     * - 404: User has no connections
     */
    @Override
    public boolean isUserConnected(String userId) {
        try {
            String url = String.format("%s/api/v1/hubs/%s/users/%s", endpoint, hubName, userId);
            String accessToken = generateAccessToken(url);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Bearer " + accessToken)
                .method("HEAD", HttpRequest.BodyPublishers.noBody())
                .timeout(Duration.ofSeconds(5))
                .build();

            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            boolean connected = response.statusCode() == 200;

            log.debug("SignalR: User {} connection check: {}", userId, connected ? "CONNECTED" : "NOT CONNECTED");
            return connected;

        } catch (Exception e) {
            log.warn("SignalR: Error checking user {} connection status: {}", userId, e.getMessage());
            // Fallback to local cache
            Long lastSeen = connectedUsers.get(userId);
            return lastSeen != null && System.currentTimeMillis() - lastSeen < CONNECTION_TIMEOUT_MS;
        }
    }

    /**
     * Check multiple users' connection status efficiently.
     */
    public Map<String, Boolean> checkUsersConnectionStatus(List<String> userIds) {
        Map<String, Boolean> result = new ConcurrentHashMap<>();

        // Check each user in parallel
        userIds.parallelStream().forEach(userId -> {
            result.put(userId, isUserConnected(userId));
        });

        return result;
    }

    @Override
    public int getConnectedUserCount() {
        // Return cached count - for accurate count, use checkUsersConnectionStatus
        cleanupStaleConnections();
        return connectedUsers.size();
    }

    @Override
    public List<String> getConnectedUserIds() {
        // Return cached list - for accurate list, use checkUsersConnectionStatus
        cleanupStaleConnections();
        return new ArrayList<>(connectedUsers.keySet());
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public String getProviderName() {
        return "SignalR";
    }

    /**
     * Register a user connection (called when client negotiates).
     */
    public void registerUserConnection(String userId) {
        connectedUsers.put(userId, System.currentTimeMillis());
        log.debug("SignalR: User {} connected. Total users: {}", userId, connectedUsers.size());
    }

    /**
     * Unregister a user connection.
     */
    public void unregisterUserConnection(String userId) {
        connectedUsers.remove(userId);
        log.debug("SignalR: User {} disconnected. Total users: {}", userId, connectedUsers.size());
    }

    private void sendToUser(String userId, String eventName, Object data) {
        log.info("SignalR REST: Sending {} to user {}", eventName, userId);
        try {
            String url = String.format("%s/api/v1/hubs/%s/users/%s", endpoint, hubName, userId);
            String json = objectMapper.writeValueAsString(new SignalRMessage(eventName, new Object[]{data}));
            log.info("SignalR REST: URL={}", url);

            // IMPORTANT: For REST API, audience MUST match the exact URL being called (without query params)
            // See: https://learn.microsoft.com/en-us/azure/azure-signalr/signalr-reference-data-plane-rest-api
            String accessToken = generateAccessToken(url);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + accessToken)
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

            httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenAccept(response -> {
                    if (response.statusCode() >= 200 && response.statusCode() < 300) {
                        log.info("SignalR REST: Successfully sent {} to user {}. Status: {}",
                            eventName, userId, response.statusCode());
                    } else {
                        log.warn("SignalR REST: Failed to send {} to user {}. Status: {}, Body: {}",
                            eventName, userId, response.statusCode(), response.body());
                    }
                })
                .exceptionally(e -> {
                    log.error("SignalR REST: Error sending {} to user {}: {}", eventName, userId, e.getMessage());
                    return null;
                });

        } catch (JsonProcessingException e) {
            log.error("SignalR: Error serializing message for user {}: {}", userId, e.getMessage());
        }
    }

    private void broadcast(String eventName, Object data) {
        try {
            String url = String.format("%s/api/v1/hubs/%s", endpoint, hubName);
            String json = objectMapper.writeValueAsString(new SignalRMessage(eventName, new Object[]{data}));

            // IMPORTANT: For REST API, audience MUST match the exact URL being called
            String accessToken = generateAccessToken(url);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + accessToken)
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

            httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenAccept(response -> {
                    if (response.statusCode() >= 200 && response.statusCode() < 300) {
                        log.info("SignalR: Broadcast {} to all users", eventName);
                    } else {
                        log.warn("SignalR: Failed to broadcast {}. Status: {}", eventName, response.statusCode());
                    }
                })
                .exceptionally(e -> {
                    log.error("SignalR: Error broadcasting {}: {}", eventName, e.getMessage());
                    return null;
                });

        } catch (JsonProcessingException e) {
            log.error("SignalR: Error serializing broadcast message: {}", e.getMessage());
        }
    }

    private String generateAccessToken(String audience) {
        try {
            long now = Instant.now().getEpochSecond();
            long expirationTime = now +
                (properties.getSignalr().getTokenExpirationMinutes() * 60L);

            // Compute kid exactly like working client token
            String kid = computeKeyId();

            String headerJson = String.format("{\"alg\":\"HS256\",\"typ\":\"JWT\",\"kid\":\"%s\"}", kid);
            String header = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(headerJson.getBytes(StandardCharsets.UTF_8));

            // Include iat (issued at) claim like working client token
            String payloadJson = String.format("{\"aud\":\"%s\",\"iat\":%d,\"exp\":%d}",
                audience, now, expirationTime);
            String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));

            String signature = sign(header + "." + payload);

            log.info("SignalR REST: Generated token for audience={}, kid={}", audience, kid);

            return header + "." + payload + "." + signature;

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate SignalR access token", e);
        }
    }

    private String computeKeyId() throws Exception {
        java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(accessKey.getBytes(StandardCharsets.UTF_8));
        String base64Hash = Base64.getEncoder().encodeToString(hash);
        return base64Hash.substring(0, Math.min(32, base64Hash.length()));
    }

    private String sign(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        // Use access key as UTF-8 bytes (same as working client token)
        byte[] keyBytes = accessKey.getBytes(StandardCharsets.UTF_8);
        mac.init(new SecretKeySpec(keyBytes, "HmacSHA256"));
        byte[] signatureBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(signatureBytes);
    }

    private Map<String, String> parseConnectionString(String connectionString) {
        Map<String, String> result = new HashMap<>();
        for (String part : connectionString.split(";")) {
            String[] keyValue = part.split("=", 2);
            if (keyValue.length == 2) {
                result.put(keyValue[0].trim(), keyValue[1].trim());
            }
        }
        return result;
    }

    private void cleanupStaleConnections() {
        long now = System.currentTimeMillis();
        connectedUsers.entrySet().removeIf(entry -> now - entry.getValue() > CONNECTION_TIMEOUT_MS);
    }

    /**
     * SignalR message format.
     */
    private record SignalRMessage(String target, Object[] arguments) {}
}
