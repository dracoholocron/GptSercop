package com.globalcmx.api.security.config.dto.command;

import com.globalcmx.api.security.config.entity.SecurityConfigurationReadModel.ConfigType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSecurityConfigCommand {

    @NotNull(message = "Config type is required")
    private ConfigType configType;

    @NotBlank(message = "Config key is required")
    private String configKey;

    @NotNull(message = "Config value is required")
    private Map<String, Object> configValue;

    private String environment;
}
