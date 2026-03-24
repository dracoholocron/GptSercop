package com.globalcmx.api.scheduler.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scheduled_job_dead_letter", indexes = {
    @Index(name = "idx_dead_letter_job_code", columnList = "job_code"),
    @Index(name = "idx_dead_letter_status", columnList = "status"),
    @Index(name = "idx_dead_letter_created", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledJobDeadLetter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_code", nullable = false, length = 100)
    private String jobCode;

    @Column(name = "job_config_id")
    private Long jobConfigId;

    @Column(name = "original_execution_id", nullable = false, length = 36)
    private String originalExecutionId;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    // Error information
    @Column(name = "error_message", nullable = false, columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "error_stack_trace", columnDefinition = "TEXT")
    private String errorStackTrace;

    @Column(name = "error_code", length = 100)
    private String errorCode;

    // Retry tracking
    @Column(name = "retry_count")
    private Integer retryCount;

    @Column(name = "max_retries_reached")
    private Boolean maxRetriesReached;

    @Column(name = "last_retry_at")
    private LocalDateTime lastRetryAt;

    // Original execution data
    @Column(name = "original_parameters", columnDefinition = "JSON")
    private String originalParameters;

    @Column(name = "original_started_at")
    private LocalDateTime originalStartedAt;

    @Column(name = "original_triggered_by", length = 50)
    private String originalTriggeredBy;

    // Resolution
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolved_by", length = 100)
    private String resolvedBy;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    // Audit fields
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Tenant support
    @Column(name = "tenant_id", length = 50)
    private String tenantId;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = Status.PENDING;
        if (retryCount == null) retryCount = 0;
        if (maxRetriesReached == null) maxRetriesReached = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void markAsRetrying() {
        this.status = Status.RETRYING;
        this.lastRetryAt = LocalDateTime.now();
        this.retryCount = this.retryCount != null ? this.retryCount + 1 : 1;
    }

    public void resolve(String resolvedBy, String notes) {
        this.status = Status.RESOLVED;
        this.resolvedAt = LocalDateTime.now();
        this.resolvedBy = resolvedBy;
        this.resolutionNotes = notes;
    }

    public void abandon(String abandonedBy, String notes) {
        this.status = Status.ABANDONED;
        this.resolvedAt = LocalDateTime.now();
        this.resolvedBy = abandonedBy;
        this.resolutionNotes = notes;
    }

    public enum Status {
        PENDING,
        RETRYING,
        RESOLVED,
        ABANDONED
    }
}
