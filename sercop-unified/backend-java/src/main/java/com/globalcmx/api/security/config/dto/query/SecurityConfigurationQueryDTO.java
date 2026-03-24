package com.globalcmx.api.security.config.dto.query;

import com.globalcmx.api.security.config.entity.SecurityConfigurationReadModel;
import com.globalcmx.api.security.config.entity.SecurityConfigurationReadModel.ConfigType;
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
public class SecurityConfigurationQueryDTO {

    private Long id;
    private ConfigType configType;
    private String configKey;
    private Map<String, Object> configValue;
    private Boolean isActive;
    private String environment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;

    public static SecurityConfigurationQueryDTO fromEntity(SecurityConfigurationReadModel entity) {
        return SecurityConfigurationQueryDTO.builder()
                .id(entity.getId())
                .configType(entity.getConfigType())
                .configKey(entity.getConfigKey())
                .configValue(entity.getConfigValue())
                .isActive(entity.getIsActive())
                .environment(entity.getEnvironment())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
                .build();
    }
}
