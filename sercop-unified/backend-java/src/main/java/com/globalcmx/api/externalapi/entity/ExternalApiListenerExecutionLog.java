package com.globalcmx.api.externalapi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entity for logging the execution of API response listeners.
 * Tracks the outcome of each listener execution.
 */
@Entity
@Table(name = "external_api_listener_execution_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalApiListenerExecutionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Reference to the API call log
     */
    @Column(name = "api_call_log_id", nullable = false)
    private Long apiCallLogId;

    /**
     * UUID of the API call
     */
    @Column(name = "call_id", nullable = false, length = 36)
    private String callId;

    /**
     * Reference to the listener that was executed
     */
    @Column(name = "listener_id", nullable = false)
    private Long listenerId;

    /**
     * Name of the listener (denormalized for easy querying)
     */
    @Column(name = "listener_name", length = 255)
    private String listenerName;

    /**
     * Type of action executed (denormalized)
     */
    @Column(name = "action_type", length = 50)
    private String actionType;

    /**
     * Execution status
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private Status status = Status.PENDING;

    /**
     * Result data from the execution (JSON)
     */
    @Column(name = "result_data", columnDefinition = "JSON")
    private String resultData;

    /**
     * Error message if execution failed
     */
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /**
     * Execution time in milliseconds
     */
    @Column(name = "execution_time_ms")
    private Long executionTimeMs;

    /**
     * Number of retry attempts
     */
    @Column(name = "retry_count")
    @Builder.Default
    private Integer retryCount = 0;

    /**
     * When execution started
     */
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    /**
     * When execution completed
     */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * Status of listener execution
     */
    public enum Status {
        PENDING,    // Not yet executed
        SUCCESS,    // Executed successfully
        FAILED,     // Execution failed
        SKIPPED,    // Skipped (condition not met)
        RETRYING    // Being retried
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = Status.PENDING;
        if (retryCount == null) retryCount = 0;
    }
}
