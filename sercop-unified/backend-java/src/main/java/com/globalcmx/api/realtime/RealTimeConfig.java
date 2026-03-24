package com.globalcmx.api.realtime;

import com.globalcmx.api.realtime.azure.AzureSignalRNotificationService;
import com.globalcmx.api.realtime.aws.AwsWebSocketNotificationService;
import com.globalcmx.api.realtime.gcp.GcpPubSubNotificationService;
import com.globalcmx.api.realtime.noop.NoOpRealTimeNotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Configuration for the Real-Time Notification system.
 *
 * Automatically selects the appropriate implementation based on configuration:
 * - globalcmx.realtime.enabled=false -> NoOpRealTimeNotificationService
 * - globalcmx.realtime.provider=SIGNALR -> AzureSignalRNotificationService
 * - globalcmx.realtime.provider=WEBSOCKET -> AwsWebSocketNotificationService
 * - globalcmx.realtime.provider=PUBSUB -> GcpPubSubNotificationService
 * - globalcmx.realtime.provider=NONE -> NoOpRealTimeNotificationService
 *
 * If a provider is configured but required credentials are missing,
 * falls back to NoOp with a warning.
 */
@Slf4j
@Configuration
public class RealTimeConfig {

    /**
     * NoOp implementation when real-time is disabled.
     */
    @Bean
    @Primary
    @ConditionalOnProperty(name = "globalcmx.realtime.enabled", havingValue = "false", matchIfMissing = true)
    public RealTimeNotificationService noOpRealTimeNotificationService() {
        log.info("RealTime: Initializing NoOp provider (real-time disabled)");
        return new NoOpRealTimeNotificationService();
    }

    /**
     * NoOp implementation when provider is NONE.
     */
    @Bean
    @ConditionalOnProperty(name = "globalcmx.realtime.provider", havingValue = "NONE")
    public RealTimeNotificationService noneRealTimeNotificationService() {
        log.info("RealTime: Initializing NoOp provider (provider=NONE)");
        return new NoOpRealTimeNotificationService();
    }

    /**
     * Azure SignalR implementation.
     * Falls back to NoOp if connection string is not configured.
     */
    @Bean
    @ConditionalOnProperty(name = "globalcmx.realtime.provider", havingValue = "SIGNALR")
    public RealTimeNotificationService azureSignalRNotificationService(RealTimeProperties properties) {
        String connectionString = properties.getSignalr().getConnectionString();
        if (connectionString == null || connectionString.isEmpty()) {
            log.warn("RealTime: SignalR provider configured but connection string is missing. " +
                     "Set AZURE_SIGNALR_CONNECTION_STRING to enable. Falling back to NoOp.");
            return new NoOpRealTimeNotificationService();
        }
        log.info("RealTime: Initializing Azure SignalR provider");
        return new AzureSignalRNotificationService(properties);
    }

    /**
     * AWS WebSocket implementation.
     * Falls back to NoOp if API ID is not configured.
     */
    @Bean
    @ConditionalOnProperty(name = "globalcmx.realtime.provider", havingValue = "WEBSOCKET")
    public RealTimeNotificationService awsWebSocketNotificationService(RealTimeProperties properties) {
        String apiId = properties.getWebsocket().getApiId();
        if (apiId == null || apiId.isEmpty()) {
            log.warn("RealTime: WebSocket provider configured but API ID is missing. " +
                     "Set AWS_WEBSOCKET_API_ID to enable. Falling back to NoOp.");
            return new NoOpRealTimeNotificationService();
        }
        log.info("RealTime: Initializing AWS WebSocket provider");
        return new AwsWebSocketNotificationService(properties);
    }

    /**
     * GCP Pub/Sub implementation.
     * Falls back to NoOp if project ID is not configured.
     */
    @Bean
    @ConditionalOnProperty(name = "globalcmx.realtime.provider", havingValue = "PUBSUB")
    public RealTimeNotificationService gcpPubSubNotificationService(RealTimeProperties properties) {
        String projectId = properties.getPubsub().getProjectId();
        if (projectId == null || projectId.isEmpty()) {
            log.warn("RealTime: Pub/Sub provider configured but project ID is missing. " +
                     "Set GCP_PROJECT_ID to enable. Falling back to NoOp.");
            return new NoOpRealTimeNotificationService();
        }
        log.info("RealTime: Initializing GCP Pub/Sub provider");
        return new GcpPubSubNotificationService(properties);
    }
}
