package com.globalcmx.api.security.config.service.command;

import com.globalcmx.api.security.config.dto.command.*;
import com.globalcmx.api.security.config.entity.*;
import com.globalcmx.api.security.config.event.SecurityConfigurationChangedEvent;
import com.globalcmx.api.security.config.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SecurityConfigurationCommandService {

    private final SecurityConfigurationRepository configRepository;
    private final SecurityPresetRepository presetRepository;
    private final FourEyesConfigRepository fourEyesRepository;
    private final SecurityConfigAuditLogRepository auditLogRepository;
    private final ApplicationEventPublisher eventPublisher;

    public SecurityConfigurationReadModel updateConfiguration(UpdateSecurityConfigCommand command) {
        String currentUser = getCurrentUser();
        String environment = command.getEnvironment() != null ? command.getEnvironment() : "production";

        SecurityConfigurationReadModel config = configRepository
                .findByConfigTypeAndConfigKeyAndEnvironment(
                        command.getConfigType(),
                        command.getConfigKey(),
                        environment)
                .orElseGet(() -> SecurityConfigurationReadModel.builder()
                        .configType(command.getConfigType())
                        .configKey(command.getConfigKey())
                        .environment(environment)
                        .createdBy(currentUser)
                        .build());

        Map<String, Object> previousValue = config.getConfigValue();

        config.setConfigValue(command.getConfigValue());
        config.setUpdatedBy(currentUser);
        config.setIsActive(true);

        SecurityConfigurationReadModel saved = configRepository.save(config);

        logAuditEvent(
                command.getConfigType().name(),
                command.getConfigKey(),
                previousValue == null ? "CREATE" : "UPDATE",
                previousValue,
                command.getConfigValue(),
                currentUser
        );

        log.info("Security configuration updated: type={}, key={}, by={}",
                command.getConfigType(), command.getConfigKey(), currentUser);

        // Publish event for live refresh
        publishConfigurationChangedEvent(command.getConfigType(), command.getConfigKey(), currentUser);

        return saved;
    }

    public void applyPreset(ApplySecurityPresetCommand command) {
        String currentUser = getCurrentUser();

        SecurityPresetReadModel preset = presetRepository.findByCode(command.getPresetCode())
                .orElseThrow(() -> new EntityNotFoundException("Preset not found: " + command.getPresetCode()));

        Map<String, Object> presetConfig = preset.getConfigJson();
        String environment = command.getEnvironment() != null ? command.getEnvironment() : "production";

        if (command.getOverrides() != null) {
            mergeConfigs(presetConfig, command.getOverrides());
        }

        applyPresetConfigurations(presetConfig, environment, currentUser);

        logAuditEvent(
                "PRESET",
                command.getPresetCode(),
                "APPLY",
                null,
                presetConfig,
                currentUser
        );

        log.info("Security preset applied: code={}, by={}", command.getPresetCode(), currentUser);

        // Publish events for all affected config types in the preset
        publishPresetChangedEvents(presetConfig, currentUser);
    }

    public FourEyesConfig updateFourEyesConfig(UpdateFourEyesConfigCommand command) {
        String currentUser = getCurrentUser();

        FourEyesConfig config = command.getId() != null
                ? fourEyesRepository.findById(command.getId())
                    .orElseThrow(() -> new EntityNotFoundException("4-Eyes config not found"))
                : fourEyesRepository.findByEntityTypeAndActionType(command.getEntityType(), command.getActionType())
                    .orElseGet(() -> FourEyesConfig.builder()
                            .entityType(command.getEntityType())
                            .actionType(command.getActionType())
                            .createdBy(currentUser)
                            .build());

        if (command.getIsEnabled() != null) config.setIsEnabled(command.getIsEnabled());
        if (command.getMinApprovers() != null) config.setMinApprovers(command.getMinApprovers());
        if (command.getAmountThreshold() != null) config.setAmountThreshold(command.getAmountThreshold());
        if (command.getRequireDifferentDepartment() != null) config.setRequireDifferentDepartment(command.getRequireDifferentDepartment());
        if (command.getRequireHigherRole() != null) config.setRequireHigherRole(command.getRequireHigherRole());
        if (command.getExcludedRoles() != null) config.setExcludedRoles(command.getExcludedRoles());

        FourEyesConfig saved = fourEyesRepository.save(config);

        log.info("4-Eyes config updated: entity={}, action={}, by={}",
                command.getEntityType(), command.getActionType(), currentUser);

        return saved;
    }

    private void applyPresetConfigurations(Map<String, Object> presetConfig, String environment, String user) {
        presetConfig.forEach((category, value) -> {
            if (value instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> categoryConfig = (Map<String, Object>) value;

                SecurityConfigurationReadModel.ConfigType configType = mapCategoryToConfigType(category);
                if (configType != null) {
                    SecurityConfigurationReadModel config = configRepository
                            .findByConfigTypeAndConfigKeyAndEnvironment(configType, category, environment)
                            .orElseGet(() -> SecurityConfigurationReadModel.builder()
                                    .configType(configType)
                                    .configKey(category)
                                    .environment(environment)
                                    .createdBy(user)
                                    .build());

                    config.setConfigValue(categoryConfig);
                    config.setUpdatedBy(user);
                    config.setIsActive(true);
                    configRepository.save(config);
                }
            }
        });
    }

    private SecurityConfigurationReadModel.ConfigType mapCategoryToConfigType(String category) {
        return switch (category.toLowerCase()) {
            case "authentication" -> SecurityConfigurationReadModel.ConfigType.AUTHENTICATION;
            case "authorization" -> SecurityConfigurationReadModel.ConfigType.AUTHORIZATION;
            case "mfa" -> SecurityConfigurationReadModel.ConfigType.MFA;
            case "risk", "riskengine" -> SecurityConfigurationReadModel.ConfigType.RISK;
            case "audit" -> SecurityConfigurationReadModel.ConfigType.AUDIT;
            case "session" -> SecurityConfigurationReadModel.ConfigType.SESSION;
            default -> null;
        };
    }

    @SuppressWarnings("unchecked")
    private void mergeConfigs(Map<String, Object> base, Map<String, Object> overrides) {
        overrides.forEach((key, value) -> {
            if (value instanceof Map && base.get(key) instanceof Map) {
                mergeConfigs((Map<String, Object>) base.get(key), (Map<String, Object>) value);
            } else {
                base.put(key, value);
            }
        });
    }

    private void logAuditEvent(String configType, String configKey, String action,
                               Map<String, Object> previousValue, Map<String, Object> newValue, String user) {
        SecurityConfigAuditLog.ChangeType changeType = switch (action.toUpperCase()) {
            case "CREATE" -> SecurityConfigAuditLog.ChangeType.CREATE;
            case "DELETE" -> SecurityConfigAuditLog.ChangeType.DELETE;
            case "PRESET_APPLIED" -> SecurityConfigAuditLog.ChangeType.PRESET_APPLIED;
            default -> SecurityConfigAuditLog.ChangeType.UPDATE;
        };

        SecurityConfigAuditLog auditLog = SecurityConfigAuditLog.builder()
                .configType(configType)
                .configKey(configKey)
                .changeType(changeType)
                .previousValue(previousValue)
                .newValue(newValue)
                .changedBy(user)
                .build();
        auditLogRepository.save(auditLog);
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }

    /**
     * Publish event when a single configuration changes
     */
    private void publishConfigurationChangedEvent(SecurityConfigurationReadModel.ConfigType configType,
                                                   String configKey, String changedBy) {
        try {
            SecurityConfigurationChangedEvent event = new SecurityConfigurationChangedEvent(
                    this, configType, configKey, changedBy);
            eventPublisher.publishEvent(event);
            log.debug("Published configuration changed event: {}", event);
        } catch (Exception e) {
            log.error("Failed to publish configuration changed event: {}", e.getMessage());
        }
    }

    /**
     * Publish events for all config types affected by a preset application
     */
    private void publishPresetChangedEvents(Map<String, Object> presetConfig, String changedBy) {
        presetConfig.keySet().forEach(category -> {
            SecurityConfigurationReadModel.ConfigType configType = mapCategoryToConfigType(category);
            if (configType != null) {
                publishConfigurationChangedEvent(configType, category, changedBy);
            }
        });
    }
}
