package com.globalcmx.api.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO para representar una conversación de chat.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationDTO {

    private Long id;
    private String title;
    private Long contextId;
    private String contextName;
    private Boolean isFavorite;
    private String folderName;
    private Instant createdAt;
    private Instant updatedAt;
    private Long messageCount;
    private String lastMessagePreview; // Vista previa del último mensaje
}





