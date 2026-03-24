package com.globalcmx.api.ai.dto;

import com.globalcmx.api.ai.entity.AIPromptConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para transferencia de datos de configuración de prompts de IA.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIPromptConfigDTO {

    private Long id;
    private String promptKey;
    private String displayName;
    private String description;
    private String category;
    private String language;
    private String messageType;
    private String promptTemplate;
    private String availableVariables;
    private String config;
    private Integer version;
    private Boolean isActive;
    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;

    /**
     * Convierte una entidad a DTO
     */
    public static AIPromptConfigDTO fromEntity(AIPromptConfig entity) {
        if (entity == null) return null;

        return AIPromptConfigDTO.builder()
                .id(entity.getId())
                .promptKey(entity.getPromptKey())
                .displayName(entity.getDisplayName())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .language(entity.getLanguage())
                .messageType(entity.getMessageType())
                .promptTemplate(entity.getPromptTemplate())
                .availableVariables(entity.getAvailableVariables())
                .config(entity.getConfig())
                .version(entity.getVersion())
                .isActive(entity.getIsActive())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedBy(entity.getUpdatedBy())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    /**
     * Convierte DTO a entidad
     */
    public AIPromptConfig toEntity() {
        return AIPromptConfig.builder()
                .id(this.id)
                .promptKey(this.promptKey)
                .displayName(this.displayName)
                .description(this.description)
                .category(this.category != null ? this.category : "OTHER")
                .language(this.language != null ? this.language : "all")
                .messageType(this.messageType != null ? this.messageType : "ALL")
                .promptTemplate(this.promptTemplate)
                .availableVariables(this.availableVariables)
                .config(this.config)
                .version(this.version != null ? this.version : 1)
                .isActive(this.isActive != null ? this.isActive : true)
                .createdBy(this.createdBy)
                .createdAt(this.createdAt)
                .updatedBy(this.updatedBy)
                .updatedAt(this.updatedAt)
                .build();
    }
}
