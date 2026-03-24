package com.globalcmx.api.externalapi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entity for logging all external API calls.
 * Stores complete request/response data for auditing and debugging.
 */
@Entity
@Table(name = "external_api_call_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalApiCallLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique identifier for this API call (UUID)
     */
    @Column(name = "call_id", length = 36)
    private String callId;

    @Column(name = "api_config_id", nullable = false)
    private Long apiConfigId;

    @Column(name = "api_config_code", nullable = false, length = 50)
    private String apiConfigCode;

    @Column(name = "request_url", length = 2000)
    private String requestUrl;

    @Column(name = "request_method", length = 10)
    private String requestMethod;

    @Column(name = "request_headers_json", columnDefinition = "TEXT")
    private String requestHeadersJson;

    @Column(name = "request_body", columnDefinition = "TEXT")
    private String requestBody;

    @Column(name = "response_status_code")
    private Integer responseStatusCode;

    @Column(name = "response_headers_json", columnDefinition = "TEXT")
    private String responseHeadersJson;

    @Column(name = "response_body", columnDefinition = "TEXT")
    private String responseBody;

    /**
     * When the response was received
     */
    @Column(name = "response_timestamp")
    private LocalDateTime responseTimestamp;

    /**
     * Mapped data extracted from the response using ExternalApiResponseMapping
     */
    @Column(name = "mapped_response_data", columnDefinition = "JSON")
    private String mappedResponseData;

    /**
     * Results of listeners that were executed (JSON array)
     */
    @Column(name = "listeners_executed", columnDefinition = "JSON")
    private String listenersExecuted;

    @Column(name = "execution_time_ms")
    private Long executionTimeMs;

    @Column(name = "attempt_number")
    @Builder.Default
    private Integer attemptNumber = 1;

    @Column(nullable = false)
    private Boolean success;

    /**
     * Status of the API call
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "error_type", length = 100)
    private String errorType;

    @Column(name = "correlation_id", length = 100)
    private String correlationId;

    @Column(name = "operation_id", length = 100)
    private String operationId;

    @Column(name = "operation_type", length = 50)
    private String operationType;

    @Column(name = "event_type", length = 50)
    private String eventType;

    @Column(name = "triggered_by", length = 100)
    private String triggeredBy;

    /**
     * Aggregate ID for Event Sourcing (EXTERNAL_API_CALL-{uuid})
     */
    @Column(name = "aggregate_id", length = 100)
    private String aggregateId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * Status of the API call
     */
    public enum Status {
        PENDING,    // Call initiated
        SUCCESS,    // Call completed successfully
        FAILED,     // Call failed
        TIMEOUT,    // Call timed out
        RETRY       // Being retried
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (attemptNumber == null) attemptNumber = 1;
        if (status == null) status = Status.PENDING;
        if (callId == null) callId = java.util.UUID.randomUUID().toString();
        if (aggregateId == null && callId != null) {
            aggregateId = "EXTERNAL_API_CALL-" + callId;
        }
    }
}
