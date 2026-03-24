package com.globalcmx.api.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO para representar un mensaje individual en una conversación.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDTO {

    private Long id;
    private Long conversationId;
    private String role; // USER o ASSISTANT
    private String content;
    private Instant createdAt;
    private String metadata; // JSON string con metadatos adicionales
}





