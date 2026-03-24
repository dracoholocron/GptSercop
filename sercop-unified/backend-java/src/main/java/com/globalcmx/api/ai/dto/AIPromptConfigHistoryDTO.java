package com.globalcmx.api.ai.dto;

import com.globalcmx.api.ai.entity.AIPromptConfigHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para historial de versiones de prompts de IA.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIPromptConfigHistoryDTO {

    private Long id;
    private Long promptConfigId;
    private String promptKey;
    private Integer version;
    private String promptTemplate;
    private String availableVariables;
    private String config;
    private String changedBy;
    private LocalDateTime changedAt;
    private String changeReason;

    /**
     * Convierte una entidad a DTO
     */
    public static AIPromptConfigHistoryDTO fromEntity(AIPromptConfigHistory entity) {
        if (entity == null) return null;

        return AIPromptConfigHistoryDTO.builder()
                .id(entity.getId())
                .promptConfigId(entity.getPromptConfigId())
                .promptKey(entity.getPromptKey())
                .version(entity.getVersion())
                .promptTemplate(entity.getPromptTemplate())
                .availableVariables(entity.getAvailableVariables())
                .config(entity.getConfig())
                .changedBy(entity.getChangedBy())
                .changedAt(entity.getChangedAt())
                .changeReason(entity.getChangeReason())
                .build();
    }
}
