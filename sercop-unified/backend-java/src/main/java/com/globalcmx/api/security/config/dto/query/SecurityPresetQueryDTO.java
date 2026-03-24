package com.globalcmx.api.security.config.dto.query;

import com.globalcmx.api.security.config.entity.SecurityPresetReadModel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityPresetQueryDTO {

    private Long id;
    private String code;
    private String nameKey;
    private String descriptionKey;
    private String icon;
    private Map<String, Object> configJson;
    private Boolean isSystem;
    private Integer displayOrder;
    private LocalDateTime createdAt;

    public static SecurityPresetQueryDTO fromEntity(SecurityPresetReadModel entity) {
        return SecurityPresetQueryDTO.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .nameKey(entity.getNameKey())
                .descriptionKey(entity.getDescriptionKey())
                .icon(entity.getIcon())
                .configJson(entity.getConfigJson())
                .isSystem(entity.getIsSystem())
                .displayOrder(entity.getDisplayOrder())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
