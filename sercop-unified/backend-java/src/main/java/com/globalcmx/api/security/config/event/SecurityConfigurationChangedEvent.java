package com.globalcmx.api.security.config.event;

import com.globalcmx.api.security.config.entity.SecurityConfigurationReadModel.ConfigType;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Event published when security configuration changes.
 * Components can listen to this event to refresh their cached configuration.
 */
@Getter
public class SecurityConfigurationChangedEvent extends ApplicationEvent {

    private final ConfigType configType;
    private final String configKey;
    private final String changedBy;

    public SecurityConfigurationChangedEvent(Object source, ConfigType configType, String configKey, String changedBy) {
        super(source);
        this.configType = configType;
        this.configKey = configKey;
        this.changedBy = changedBy;
    }

    /**
     * Check if this event is for a specific config type
     */
    public boolean isForType(ConfigType type) {
        return this.configType == type;
    }

    /**
     * Check if this event affects authorization configuration
     */
    public boolean affectsAuthorization() {
        return configType == ConfigType.AUTHORIZATION || configType == ConfigType.RISK;
    }

    /**
     * Check if this event affects authentication configuration
     */
    public boolean affectsAuthentication() {
        return configType == ConfigType.AUTHENTICATION || configType == ConfigType.MFA || configType == ConfigType.SESSION;
    }

    @Override
    public String toString() {
        return String.format("SecurityConfigurationChangedEvent[type=%s, key=%s, by=%s]",
                configType, configKey, changedBy);
    }
}
