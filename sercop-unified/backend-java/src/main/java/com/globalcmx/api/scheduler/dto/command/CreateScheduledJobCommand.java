package com.globalcmx.api.scheduler.dto.command;

import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel.JobType;
import com.globalcmx.api.scheduler.entity.ScheduledJobConfigReadModel.ScheduleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateScheduledJobCommand {

    @NotBlank(message = "Job code is required")
    @Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "Code must be uppercase with underscores, starting with a letter")
    private String code;

    @NotBlank(message = "Job name is required")
    private String name;

    private String description;

    // Schedule configuration
    @NotNull(message = "Schedule type is required")
    private ScheduleType scheduleType;

    private String cronExpression;
    private Long fixedRateMs;
    private Long fixedDelayMs;
    private Long initialDelayMs;
    private String timezone;

    // Job type and execution target
    @NotNull(message = "Job type is required")
    private JobType jobType;

    private String serviceBeanName;
    private String serviceMethodName;
    private String externalApiConfigCode;
    private String ruleCode;
    private String sqlQuery;

    // Parameters (JSON strings)
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
    private Boolean isClusterSafe;

    private String createdBy;
    private String tenantId;
}
