package com.globalcmx.api.realtime.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for instant messages sent via real-time notifications.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RealTimeMessage {

    /**
     * The sender's user ID.
     */
    private String senderId;

    /**
     * The sender's display name.
     */
    private String senderName;

    /**
     * The message content.
     */
    private String message;

    /**
     * Timestamp when the message was sent (epoch milliseconds).
     */
    private long timestamp;

    /**
     * Create a new message with the current timestamp.
     */
    public static RealTimeMessage of(String senderId, String senderName, String message) {
        return RealTimeMessage.builder()
            .senderId(senderId)
            .senderName(senderName)
            .message(message)
            .timestamp(System.currentTimeMillis())
            .build();
    }
}
