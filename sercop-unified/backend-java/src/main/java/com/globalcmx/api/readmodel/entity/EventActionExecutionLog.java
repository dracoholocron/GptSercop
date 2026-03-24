package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entity for tracking execution of automatic actions triggered by events.
 * Stores the status and result of each action execution for monitoring and debugging.
 */
@Entity
@Table(name = "event_action_execution_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventActionExecutionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "execution_id", nullable = false, length = 50)
    private String executionId;

    @Column(name = "rule_code", nullable = false, length = 50)
    private String ruleCode;

    @Column(name = "operation_id", length = 50)
    private String operationId;

    @Column(name = "trigger_event", nullable = false, length = 50)
    private String triggerEvent;

    @Column(name = "action_type", nullable = false, length = 30)
    private String actionType;

    @Column(name = "action_order", nullable = false)
    private Integer actionOrder;

    @Column(name = "action_config", columnDefinition = "JSON")
    private String actionConfig;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private ExecutionStatus status;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "result_data", columnDefinition = "JSON")
    private String resultData;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "retry_count")
    @Builder.Default
    private Integer retryCount = 0;

    @Column(name = "max_retries")
    @Builder.Default
    private Integer maxRetries = 3;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    public enum ExecutionStatus {
        PENDING, RUNNING, SUCCESS, FAILED, SKIPPED
    }
}
