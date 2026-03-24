package com.globalcmx.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para enviar un mensaje en una conversación de chat.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageRequest {

    @NotBlank(message = "El mensaje no puede estar vacío")
    private String message;
    
    // Nota: El conversationId se obtiene del path variable, no del body
}


