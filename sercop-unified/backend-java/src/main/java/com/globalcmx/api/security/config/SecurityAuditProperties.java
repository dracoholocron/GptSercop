package com.globalcmx.api.security.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Externalized configuration for security audit.
 * All values configurable via application.yml or environment variables.
 */
@Configuration
@ConfigurationProperties(prefix = "security.audit")
@Validated
@Data
public class SecurityAuditProperties {

    /**
     * Enable/disable security audit logging
     */
    private boolean enabled = true;

    /**
     * Thresholds for brute force detection
     */
    @NotNull
    private BruteForceThresholds bruteForce = new BruteForceThresholds();

    /**
     * Thresholds for suspicious activity detection
     */
    @NotNull
    private SuspiciousActivityThresholds suspiciousActivity = new SuspiciousActivityThresholds();

    /**
     * Log retention settings
     */
    @NotNull
    private RetentionSettings retention = new RetentionSettings();

    /**
     * Alert notification settings
     */
    @NotNull
    private AlertSettings alerts = new AlertSettings();

    @Data
    public static class BruteForceThresholds {
        /**
         * Max failed login attempts per user before alert
         */
        @Min(1)
        private int maxFailedLoginsPerUser = 5;

        /**
         * Max failed login attempts per IP before alert
         */
        @Min(1)
        private int maxFailedLoginsPerIp = 10;

        /**
         * Time window in minutes for counting failed attempts
         */
        @Min(1)
        private int windowMinutes = 15;

        /**
         * Auto-lock account after max failed attempts
         */
        private boolean autoLockEnabled = false;

        /**
         * Lock duration in minutes (0 = permanent until manual unlock)
         */
        @Min(0)
        private int lockDurationMinutes = 30;
    }

    @Data
    public static class SuspiciousActivityThresholds {
        /**
         * Max permission denials before alert
         */
        @Min(1)
        private int maxPermissionDenials = 20;

        /**
         * Time window in minutes for counting denials
         */
        @Min(1)
        private int windowMinutes = 15;

        /**
         * Max rate of API calls per minute before alert
         */
        @Min(1)
        private int maxApiCallsPerMinute = 100;
    }

    @Data
    public static class RetentionSettings {
        /**
         * Days to retain audit logs
         */
        @Min(1)
        private int days = 90;

        /**
         * Cron expression for cleanup job
         */
        private String cleanupCron = "0 0 2 * * *";
    }

    @Data
    public static class AlertSettings {
        /**
         * Enable email alerts for critical events
         */
        private boolean emailEnabled = false;

        /**
         * Email addresses for security alerts (comma-separated)
         */
        private String alertEmails = "";

        /**
         * Enable Slack/webhook notifications
         */
        private boolean webhookEnabled = false;

        /**
         * Webhook URL for notifications
         */
        private String webhookUrl = "";
    }
}
