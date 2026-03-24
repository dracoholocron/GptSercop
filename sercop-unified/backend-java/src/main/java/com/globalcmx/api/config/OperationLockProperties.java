package com.globalcmx.api.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for operation locks.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "operation-lock")
public class OperationLockProperties {

    /**
     * Default lock duration in seconds (15 minutes)
     */
    private int defaultDurationSeconds = 900;

    /**
     * Maximum lock duration in seconds (60 minutes)
     */
    private int maxDurationSeconds = 3600;

    /**
     * Minimum lock duration in seconds (1 minute)
     */
    private int minDurationSeconds = 60;

    /**
     * Cleanup interval for expired locks in seconds
     */
    private int cleanupIntervalSeconds = 60;

    /**
     * Whether to auto-extend locks when executing actions
     */
    private boolean autoExtendOnAction = true;

    /**
     * Maximum number of active locks per user
     */
    private int maxLocksPerUser = 5;
}
