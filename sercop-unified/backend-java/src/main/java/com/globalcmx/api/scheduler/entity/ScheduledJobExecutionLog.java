package com.globalcmx.api.scheduler.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scheduled_job_execution_log", indexes = {
    @Index(name = "idx_execution_job_code", columnList = "job_code"),
    @Index(name = "idx_execution_status", columnList = "status"),
    @Index(name = "idx_execution_started", columnList = "started_at"),
    @Index(name = "idx_execution_job_started", columnList = "job_code, started_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledJobExecutionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "execution_id", nullable = false, unique = true, length = 36)
    private String executionId;

    @Column(name = "job_code", nullable = false, length = 100)
    private String jobCode;

    @Column(name = "job_config_id")
    private Long jobConfigId;

    // Execution status
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    // Timing
    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "duration_ms")
    private Long durationMs;

    // Results
    @Column(name = "items_processed")
    private Integer itemsProcessed;

    @Column(name = "items_success")
    private Integer itemsSuccess;

    @Column(name = "items_failed")
    private Integer itemsFailed;

    @Column(name = "result_summary", columnDefinition = "TEXT")
    private String resultSummary;

    @Column(name = "result_data", columnDefinition = "JSON")
    private String resultData;

    // Error information
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "error_stack_trace", columnDefinition = "TEXT")
    private String errorStackTrace;

    @Column(name = "error_code", length = 100)
    private String errorCode;

    // Retry information
    @Column(name = "retry_attempt")
    private Integer retryAttempt;

    @Column(name = "is_retry")
    @JsonProperty("isRetry")
    private Boolean isRetry;

    @Column(name = "original_execution_id", length = 36)
    private String originalExecutionId;

    // Trigger information
    @Enumerated(EnumType.STRING)
    @Column(name = "triggered_by", nullable = false)
    private TriggerType triggeredBy;

    @Column(name = "triggered_by_user", length = 100)
    private String triggeredByUser;

    // Server information
    @Column(name = "server_instance")
    private String serverInstance;

    @Column(name = "server_ip", length = 50)
    private String serverIp;

    @Column(name = "thread_name")
    private String threadName;

    // Tenant support
    @Column(name = "tenant_id", length = 50)
    private String tenantId;

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) startedAt = LocalDateTime.now();
        if (status == null) status = Status.RUNNING;
        if (triggeredBy == null) triggeredBy = TriggerType.SCHEDULER;
        if (itemsProcessed == null) itemsProcessed = 0;
        if (itemsSuccess == null) itemsSuccess = 0;
        if (itemsFailed == null) itemsFailed = 0;
        if (retryAttempt == null) retryAttempt = 0;
        if (isRetry == null) isRetry = false;
    }

    public void complete(Status status) {
        this.status = status;
        this.completedAt = LocalDateTime.now();
        if (this.startedAt != null) {
            this.durationMs = java.time.Duration.between(this.startedAt, this.completedAt).toMillis();
        }
    }

    public enum Status {
        RUNNING,
        SUCCESS,
        FAILED,
        SKIPPED,
        TIMEOUT,
        CANCELLED
    }

    public enum TriggerType {
        SCHEDULER,
        MANUAL,
        SYSTEM,
        RETRY,
        API
    }
}
