package com.globalcmx.api.scheduler.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "scheduled_job_config_readmodel", indexes = {
    @Index(name = "idx_scheduled_job_code", columnList = "code"),
    @Index(name = "idx_scheduled_job_enabled", columnList = "is_enabled"),
    @Index(name = "idx_scheduled_job_type", columnList = "job_type"),
    @Index(name = "idx_scheduled_job_status", columnList = "last_execution_status"),
    @Index(name = "idx_scheduled_job_next_exec", columnList = "next_execution_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledJobConfigReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Schedule configuration
    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_type", nullable = false)
    private ScheduleType scheduleType;

    @Column(name = "cron_expression", length = 100)
    private String cronExpression;

    @Column(name = "fixed_rate_ms")
    private Long fixedRateMs;

    @Column(name = "fixed_delay_ms")
    private Long fixedDelayMs;

    @Column(name = "initial_delay_ms")
    private Long initialDelayMs;

    @Column(name = "timezone", length = 50)
    private String timezone;

    // Job type and execution target
    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", nullable = false)
    private JobType jobType;

    @Column(name = "service_bean_name")
    private String serviceBeanName;

    @Column(name = "service_method_name")
    private String serviceMethodName;

    @Column(name = "external_api_config_code", length = 100)
    private String externalApiConfigCode;

    @Column(name = "rule_code", length = 100)
    private String ruleCode;

    @Column(name = "sql_query", columnDefinition = "TEXT")
    private String sqlQuery;

    // Parameters (JSON)
    @Column(name = "job_parameters", columnDefinition = "JSON")
    private String jobParameters;

    @Column(name = "api_request_context", columnDefinition = "JSON")
    private String apiRequestContext;

    // Retry configuration
    @Column(name = "retry_on_failure")
    @JsonProperty("retryOnFailure")
    private Boolean retryOnFailure;

    @Column(name = "max_retries")
    private Integer maxRetries;

    @Column(name = "retry_delay_seconds")
    private Integer retryDelaySeconds;

    @Column(name = "retry_backoff_multiplier", precision = 3, scale = 1)
    private BigDecimal retryBackoffMultiplier;

    // Alerting configuration
    @Column(name = "alert_on_failure")
    @JsonProperty("alertOnFailure")
    private Boolean alertOnFailure;

    @Column(name = "alert_email_recipients", columnDefinition = "TEXT")
    private String alertEmailRecipients;

    @Column(name = "consecutive_failures_threshold")
    private Integer consecutiveFailuresThreshold;

    // Circuit breaker
    @Column(name = "circuit_breaker_enabled")
    @JsonProperty("circuitBreakerEnabled")
    private Boolean circuitBreakerEnabled;

    @Column(name = "circuit_breaker_threshold")
    private Integer circuitBreakerThreshold;

    @Column(name = "circuit_breaker_reset_timeout_seconds")
    private Integer circuitBreakerResetTimeoutSeconds;

    // Timeout configuration
    @Column(name = "timeout_seconds")
    private Integer timeoutSeconds;

    @Column(name = "lock_at_most_seconds")
    private Integer lockAtMostSeconds;

    @Column(name = "lock_at_least_seconds")
    private Integer lockAtLeastSeconds;

    // Status
    @Column(name = "is_enabled")
    @JsonProperty("isEnabled")
    private Boolean isEnabled;

    @Column(name = "is_system_job")
    @JsonProperty("isSystemJob")
    private Boolean isSystemJob;

    @Column(name = "is_cluster_safe")
    @JsonProperty("isClusterSafe")
    private Boolean isClusterSafe;

    // Execution tracking
    @Enumerated(EnumType.STRING)
    @Column(name = "last_execution_status")
    private ExecutionStatus lastExecutionStatus;

    @Column(name = "last_execution_at")
    private LocalDateTime lastExecutionAt;

    @Column(name = "last_success_at")
    private LocalDateTime lastSuccessAt;

    @Column(name = "last_failure_at")
    private LocalDateTime lastFailureAt;

    @Column(name = "next_execution_at")
    private LocalDateTime nextExecutionAt;

    @Column(name = "consecutive_failures")
    private Integer consecutiveFailures;

    @Column(name = "total_executions")
    private Integer totalExecutions;

    @Column(name = "total_successes")
    private Integer totalSuccesses;

    @Column(name = "total_failures")
    private Integer totalFailures;

    // Audit fields
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Version
    private Integer version;

    @Column(name = "tenant_id", length = 50)
    private String tenantId;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (scheduleType == null) scheduleType = ScheduleType.CRON;
        if (jobType == null) jobType = JobType.INTERNAL_SERVICE;
        if (isEnabled == null) isEnabled = true;
        if (isSystemJob == null) isSystemJob = false;
        if (isClusterSafe == null) isClusterSafe = true;
        if (retryOnFailure == null) retryOnFailure = true;
        if (maxRetries == null) maxRetries = 3;
        if (retryDelaySeconds == null) retryDelaySeconds = 60;
        if (alertOnFailure == null) alertOnFailure = true;
        if (consecutiveFailuresThreshold == null) consecutiveFailuresThreshold = 3;
        if (timeoutSeconds == null) timeoutSeconds = 300;
        if (lockAtMostSeconds == null) lockAtMostSeconds = 300;
        if (lockAtLeastSeconds == null) lockAtLeastSeconds = 15;
        if (initialDelayMs == null) initialDelayMs = 0L;
        if (timezone == null) timezone = "America/Guatemala";
        if (consecutiveFailures == null) consecutiveFailures = 0;
        if (totalExecutions == null) totalExecutions = 0;
        if (totalSuccesses == null) totalSuccesses = 0;
        if (totalFailures == null) totalFailures = 0;
        if (lastExecutionStatus == null) lastExecutionStatus = ExecutionStatus.PENDING;
        if (version == null) version = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ScheduleType {
        CRON,
        FIXED_RATE,
        FIXED_DELAY
    }

    public enum JobType {
        INTERNAL_SERVICE,
        EXTERNAL_API,
        RULE_ENGINE,
        SQL_QUERY
    }

    public enum ExecutionStatus {
        PENDING,
        RUNNING,
        SUCCESS,
        FAILED,
        SKIPPED,
        TIMEOUT,
        CIRCUIT_OPEN
    }
}
