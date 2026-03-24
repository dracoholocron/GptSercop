package com.globalcmx.api.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para crear una nueva conversación.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateConversationRequest {

    private String title;
    private Long contextId; // ID del contexto de IA a usar
    private String folderName; // Nombre de la carpeta (opcional)
}





