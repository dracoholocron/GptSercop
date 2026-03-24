package com.globalcmx.api.realtime.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for system messages broadcast to all users via real-time notifications.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RealTimeSystemMessage {

    /**
     * The message content.
     */
    private String message;

    /**
     * Message level: "info", "warning", or "error".
     */
    private String level;

    /**
     * Timestamp when the message was sent (epoch milliseconds).
     */
    private long timestamp;

    /**
     * Create an info-level system message.
     */
    public static RealTimeSystemMessage info(String message) {
        return RealTimeSystemMessage.builder()
            .message(message)
            .level("info")
            .timestamp(System.currentTimeMillis())
            .build();
    }

    /**
     * Create a warning-level system message.
     */
    public static RealTimeSystemMessage warning(String message) {
        return RealTimeSystemMessage.builder()
            .message(message)
            .level("warning")
            .timestamp(System.currentTimeMillis())
            .build();
    }

    /**
     * Create an error-level system message.
     */
    public static RealTimeSystemMessage error(String message) {
        return RealTimeSystemMessage.builder()
            .message(message)
            .level("error")
            .timestamp(System.currentTimeMillis())
            .build();
    }
}
