package com.globalcmx.api.realtime.gcp;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.globalcmx.api.alerts.dto.AlertResponse;
import com.globalcmx.api.realtime.RealTimeNotificationService;
import com.globalcmx.api.realtime.RealTimeProperties;
import com.globalcmx.api.realtime.dto.RealTimeMessage;
import com.globalcmx.api.realtime.dto.RealTimeSystemMessage;
import com.google.cloud.pubsub.v1.Publisher;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.PubsubMessage;
import com.google.pubsub.v1.TopicName;
import lombok.extern.slf4j.Slf4j;

import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * GCP Pub/Sub implementation for real-time notifications.
 *
 * Uses Google Cloud Pub/Sub to publish messages that are pushed to clients
 * via Cloud Run or Cloud Functions.
 *
 * Supports the free tier (10GB/month).
 *
 * Architecture:
 * 1. This service publishes messages to a Pub/Sub topic
 * 2. A push subscription delivers messages to a Cloud Run/Functions endpoint
 * 3. The endpoint forwards messages to connected clients via WebSocket or SSE
 */
@Slf4j
public class GcpPubSubNotificationService implements RealTimeNotificationService {

    private final RealTimeProperties properties;
    private final ObjectMapper objectMapper;
    private Publisher publisher;

    // Track connected users (approximation, managed by the push endpoint)
    private final Map<String, Long> connectedUsers = new ConcurrentHashMap<>();
    private static final long CONNECTION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

    public GcpPubSubNotificationService(RealTimeProperties properties) {
        this.properties = properties;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        String projectId = properties.getPubsub().getProjectId();
        String topicId = properties.getPubsub().getTopic();

        if (projectId == null || projectId.isEmpty()) {
            throw new IllegalArgumentException("GCP project ID is required");
        }

        try {
            TopicName topicName = TopicName.of(projectId, topicId);
            this.publisher = Publisher.newBuilder(topicName).build();
            log.info("RealTime: GCP Pub/Sub initialized. Project: {}, Topic: {}", projectId, topicId);
        } catch (IOException e) {
            throw new RuntimeException("Failed to create Pub/Sub publisher", e);
        }
    }

    @PreDestroy
    public void shutdown() {
        if (publisher != null) {
            try {
                publisher.shutdown();
                publisher.awaitTermination(30, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("PubSub: Interrupted while shutting down publisher");
            }
        }
    }

    @Override
    public void sendAlertToUser(String userId, AlertResponse alert) {
        publishMessage(userId, "alert", alert);
    }

    @Override
    public void sendVideoCallInvitation(String userId, AlertResponse alert) {
        publishMessage(userId, "video_call", alert);
    }

    @Override
    public void sendInstantMessage(String userId, RealTimeMessage message) {
        publishMessage(userId, "message", message);
    }

    @Override
    public void broadcastSystemMessage(RealTimeSystemMessage message) {
        publishMessage(null, "system", message);
    }

    @Override
    public boolean isUserConnected(String userId) {
        Long lastSeen = connectedUsers.get(userId);
        if (lastSeen == null) {
            return false;
        }
        return System.currentTimeMillis() - lastSeen < CONNECTION_TIMEOUT_MS;
    }

    @Override
    public int getConnectedUserCount() {
        cleanupStaleConnections();
        return connectedUsers.size();
    }

    @Override
    public List<String> getConnectedUserIds() {
        cleanupStaleConnections();
        return new ArrayList<>(connectedUsers.keySet());
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public String getProviderName() {
        return "PubSub";
    }

    /**
     * Register a user connection (called by push endpoint on connect).
     */
    public void registerUserConnection(String userId) {
        connectedUsers.put(userId, System.currentTimeMillis());
        log.debug("PubSub: User {} registered. Total users: {}", userId, connectedUsers.size());
    }

    /**
     * Unregister a user connection (called by push endpoint on disconnect).
     */
    public void unregisterUserConnection(String userId) {
        connectedUsers.remove(userId);
        log.debug("PubSub: User {} unregistered. Total users: {}", userId, connectedUsers.size());
    }

    private void publishMessage(String userId, String eventType, Object data) {
        try {
            PubSubNotification notification = new PubSubNotification(
                userId,
                eventType,
                data,
                System.currentTimeMillis()
            );

            String json = objectMapper.writeValueAsString(notification);

            PubsubMessage.Builder messageBuilder = PubsubMessage.newBuilder()
                .setData(ByteString.copyFromUtf8(json))
                .putAttributes("eventType", eventType);

            if (userId != null) {
                messageBuilder.putAttributes("userId", userId);
            } else {
                messageBuilder.putAttributes("broadcast", "true");
            }

            PubsubMessage pubsubMessage = messageBuilder.build();

            publisher.publish(pubsubMessage)
                .addListener(() -> {
                    if (userId != null) {
                        log.debug("PubSub: Published {} for user {}", eventType, userId);
                    } else {
                        log.info("PubSub: Published broadcast {}", eventType);
                    }
                }, Runnable::run);

        } catch (JsonProcessingException e) {
            log.error("PubSub: Error serializing message: {}", e.getMessage());
        }
    }

    private void cleanupStaleConnections() {
        long now = System.currentTimeMillis();
        connectedUsers.entrySet().removeIf(entry -> now - entry.getValue() > CONNECTION_TIMEOUT_MS);
    }

    /**
     * Pub/Sub notification format.
     */
    private record PubSubNotification(
        String userId,
        String eventType,
        Object data,
        long timestamp
    ) {}
}
