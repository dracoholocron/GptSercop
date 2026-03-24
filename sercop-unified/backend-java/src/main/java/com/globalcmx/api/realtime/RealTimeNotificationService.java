package com.globalcmx.api.realtime;

import com.globalcmx.api.alerts.dto.AlertResponse;
import com.globalcmx.api.realtime.dto.RealTimeMessage;
import com.globalcmx.api.realtime.dto.RealTimeSystemMessage;

import java.util.List;

/**
 * Interface for real-time notification services.
 *
 * This abstraction allows switching between different real-time providers
 * (Azure SignalR, AWS WebSocket, GCP Pub/Sub) without changing the business logic.
 *
 * Implementations:
 * - AzureSignalRNotificationService: Uses Azure SignalR Service
 * - AwsWebSocketNotificationService: Uses AWS API Gateway WebSocket
 * - GcpPubSubNotificationService: Uses GCP Pub/Sub with push
 * - NoOpRealTimeNotificationService: Disabled (no-op implementation)
 */
public interface RealTimeNotificationService {

    /**
     * Send an alert notification to a specific user.
     *
     * @param userId The user ID to send the alert to
     * @param alert The alert to send
     */
    void sendAlertToUser(String userId, AlertResponse alert);

    /**
     * Send a video call invitation to a specific user.
     * This is a high-priority notification that should be delivered immediately.
     *
     * @param userId The user ID to send the invitation to
     * @param alert The video call alert with meeting details
     */
    void sendVideoCallInvitation(String userId, AlertResponse alert);

    /**
     * Send an instant message to a specific user.
     *
     * @param userId The user ID to send the message to
     * @param message The message to send
     */
    void sendInstantMessage(String userId, RealTimeMessage message);

    /**
     * Broadcast a system message to all connected users.
     *
     * @param message The system message to broadcast
     */
    void broadcastSystemMessage(RealTimeSystemMessage message);

    /**
     * Check if a user has active connections.
     * Note: This may not be accurate for all providers (e.g., Pub/Sub).
     *
     * @param userId The user ID to check
     * @return true if the user has active connections, false otherwise
     */
    boolean isUserConnected(String userId);

    /**
     * Get the count of connected users.
     * Note: This may not be accurate for all providers.
     *
     * @return The number of connected users
     */
    int getConnectedUserCount();

    /**
     * Get list of connected user IDs.
     * Note: This may not be accurate for all providers.
     *
     * @return List of connected user IDs
     */
    List<String> getConnectedUserIds();

    /**
     * Check if the real-time service is enabled and available.
     *
     * @return true if the service is enabled and operational
     */
    boolean isEnabled();

    /**
     * Get the provider name for logging/debugging.
     *
     * @return The provider name (e.g., "SignalR", "WebSocket", "PubSub", "NoOp")
     */
    String getProviderName();
}
