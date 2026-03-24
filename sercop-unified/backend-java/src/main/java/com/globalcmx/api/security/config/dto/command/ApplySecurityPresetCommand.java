package com.globalcmx.api.security.config.dto.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplySecurityPresetCommand {

    private String presetCode;

    private String environment;

    private Map<String, Object> overrides;

    private Boolean backupCurrent;
}
