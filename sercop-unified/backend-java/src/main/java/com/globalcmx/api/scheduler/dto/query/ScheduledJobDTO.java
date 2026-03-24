package com.globalcmx.api.scheduler.dto.query;

import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel;
import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledJobDTO {

    private Long id;
    private String code;
    private String name;
    private String description;

    // Schedule configuration
    private ScheduleType scheduleType;
    private String cronExpression;
    private Long fixedRateMs;
    private Long fixedDelayMs;
    private Long initialDelayMs;
    private String timezone;

    // Job type and execution target
    private JobType jobType;
    private String serviceBeanName;
    private String serviceMethodName;
    private String externalApiConfigCode;
    private String ruleCode;

    // Parameters
    private String jobParameters;
    private String apiRequestContext;

    // Retry configuration
    private Boolean retryOnFailure;
    private Integer maxRetries;
    private Integer retryDelaySeconds;
    private BigDecimal retryBackoffMultiplier;

    // Alerting configuration
    private Boolean alertOnFailure;
    private String alertEmailRecipients;
    private Integer consecutiveFailuresThreshold;

    // Circuit breaker
    private Boolean circuitBreakerEnabled;
    private Integer circuitBreakerThreshold;
    private Integer circuitBreakerResetTimeoutSeconds;

    // Timeout configuration
    private Integer timeoutSeconds;
    private Integer lockAtMostSeconds;
    private Integer lockAtLeastSeconds;

    // Status
    private Boolean isEnabled;
    private Boolean isSystemJob;
    private Boolean isClusterSafe;

    // Execution tracking
    private ExecutionStatus lastExecutionStatus;
    private LocalDateTime lastExecutionAt;
    private LocalDateTime lastSuccessAt;
    private LocalDateTime lastFailureAt;
    private LocalDateTime nextExecutionAt;
    private Integer consecutiveFailures;
    private Integer totalExecutions;
    private Integer totalSuccesses;
    private Integer totalFailures;

    // Computed fields
    private Double successRate;
    private String scheduleDescription;

    // Audit fields
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
    private Integer version;
    private String tenantId;

    public static ScheduledJobDTO fromEntity(ScheduledJobConfigReadModel entity) {
        if (entity == null) return null;

        double successRate = 0.0;
        if (entity.getTotalExecutions() != null && entity.getTotalExecutions() > 0) {
            successRate = (entity.getTotalSuccesses() != null ? entity.getTotalSuccesses() : 0) * 100.0 / entity.getTotalExecutions();
        }

        return ScheduledJobDTO.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .scheduleType(entity.getScheduleType())
                .cronExpression(entity.getCronExpression())
                .fixedRateMs(entity.getFixedRateMs())
                .fixedDelayMs(entity.getFixedDelayMs())
                .initialDelayMs(entity.getInitialDelayMs())
                .timezone(entity.getTimezone())
                .jobType(entity.getJobType())
                .serviceBeanName(entity.getServiceBeanName())
                .serviceMethodName(entity.getServiceMethodName())
                .externalApiConfigCode(entity.getExternalApiConfigCode())
                .ruleCode(entity.getRuleCode())
                .jobParameters(entity.getJobParameters())
                .apiRequestContext(entity.getApiRequestContext())
                .retryOnFailure(entity.getRetryOnFailure())
                .maxRetries(entity.getMaxRetries())
                .retryDelaySeconds(entity.getRetryDelaySeconds())
                .retryBackoffMultiplier(entity.getRetryBackoffMultiplier())
                .alertOnFailure(entity.getAlertOnFailure())
                .alertEmailRecipients(entity.getAlertEmailRecipients())
                .consecutiveFailuresThreshold(entity.getConsecutiveFailuresThreshold())
                .circuitBreakerEnabled(entity.getCircuitBreakerEnabled())
                .circuitBreakerThreshold(entity.getCircuitBreakerThreshold())
                .circuitBreakerResetTimeoutSeconds(entity.getCircuitBreakerResetTimeoutSeconds())
                .timeoutSeconds(entity.getTimeoutSeconds())
                .lockAtMostSeconds(entity.getLockAtMostSeconds())
                .lockAtLeastSeconds(entity.getLockAtLeastSeconds())
                .isEnabled(entity.getIsEnabled())
                .isSystemJob(entity.getIsSystemJob())
                .isClusterSafe(entity.getIsClusterSafe())
                .lastExecutionStatus(entity.getLastExecutionStatus())
                .lastExecutionAt(entity.getLastExecutionAt())
                .lastSuccessAt(entity.getLastSuccessAt())
                .lastFailureAt(entity.getLastFailureAt())
                .nextExecutionAt(entity.getNextExecutionAt())
                .consecutiveFailures(entity.getConsecutiveFailures())
                .totalExecutions(entity.getTotalExecutions())
                .totalSuccesses(entity.getTotalSuccesses())
                .totalFailures(entity.getTotalFailures())
                .successRate(successRate)
                .scheduleDescription(buildScheduleDescription(entity))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
                .version(entity.getVersion())
                .tenantId(entity.getTenantId())
                .build();
    }

    private static String buildScheduleDescription(ScheduledJobConfigReadModel entity) {
        if (entity.getScheduleType() == null) return "";

        return switch (entity.getScheduleType()) {
            case CRON -> "Cron: " + entity.getCronExpression();
            case FIXED_RATE -> "Every " + formatDuration(entity.getFixedRateMs());
            case FIXED_DELAY -> "After " + formatDuration(entity.getFixedDelayMs()) + " delay";
        };
    }

    private static String formatDuration(Long ms) {
        if (ms == null) return "N/A";
        if (ms < 1000) return ms + "ms";
        if (ms < 60000) return (ms / 1000) + "s";
        if (ms < 3600000) return (ms / 60000) + "m";
        return (ms / 3600000) + "h";
    }
}
