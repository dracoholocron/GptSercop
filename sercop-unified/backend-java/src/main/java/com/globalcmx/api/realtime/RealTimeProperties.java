package com.globalcmx.api.realtime;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for the Real-Time Notification system.
 *
 * Supports multiple cloud providers:
 * - SIGNALR: Azure SignalR Service
 * - WEBSOCKET: AWS API Gateway WebSocket
 * - PUBSUB: GCP Pub/Sub with Push
 * - NONE: Disabled (no real-time notifications)
 */
@Data
@Component
@ConfigurationProperties(prefix = "globalcmx.realtime")
public class RealTimeProperties {

    /**
     * Whether real-time notifications are enabled.
     * When false, uses NoOpRealTimeNotificationService.
     */
    private boolean enabled = false;

    /**
     * The real-time provider to use.
     */
    private RealTimeProvider provider = RealTimeProvider.NONE;

    /**
     * Azure SignalR configuration.
     */
    private SignalRProperties signalr = new SignalRProperties();

    /**
     * AWS WebSocket configuration.
     */
    private WebSocketProperties websocket = new WebSocketProperties();

    /**
     * GCP Pub/Sub configuration.
     */
    private PubSubProperties pubsub = new PubSubProperties();

    /**
     * Enum for supported real-time providers.
     */
    public enum RealTimeProvider {
        SIGNALR,   // Azure SignalR Service
        WEBSOCKET, // AWS API Gateway WebSocket
        PUBSUB,    // GCP Pub/Sub with Push
        NONE       // Disabled
    }

    /**
     * Azure SignalR Service configuration.
     */
    @Data
    public static class SignalRProperties {
        /**
         * Azure SignalR connection string.
         * Format: Endpoint=https://xxx.service.signalr.net;AccessKey=xxx
         */
        private String connectionString;

        /**
         * SignalR hub name for notifications.
         */
        private String hubName = "notifications";

        /**
         * Access token expiration in minutes.
         */
        private int tokenExpirationMinutes = 60;
    }

    /**
     * AWS API Gateway WebSocket configuration.
     */
    @Data
    public static class WebSocketProperties {
        /**
         * AWS WebSocket API ID.
         */
        private String apiId;

        /**
         * API Gateway stage (e.g., prod, dev).
         */
        private String stage = "prod";

        /**
         * AWS region.
         */
        private String region = "us-east-1";

        /**
         * Connection table name in DynamoDB (for tracking connections).
         */
        private String connectionTableName = "websocket-connections";
    }

    /**
     * GCP Pub/Sub configuration.
     */
    @Data
    public static class PubSubProperties {
        /**
         * GCP project ID.
         */
        private String projectId;

        /**
         * Pub/Sub topic for real-time notifications.
         */
        private String topic = "realtime-notifications";

        /**
         * Push endpoint base URL for receiving messages.
         */
        private String pushEndpoint;
    }
}
