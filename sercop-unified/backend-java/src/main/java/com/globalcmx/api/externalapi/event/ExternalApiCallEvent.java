package com.globalcmx.api.externalapi.event;

import com.globalcmx.api.externalapi.dto.ListenerExecutionResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Event representing an external API call for CQRS/Event Sourcing.
 * Published to Kafka for async processing and auditing.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalApiCallEvent {

    /**
     * Unique event identifier
     */
    private String eventId;

    /**
     * Aggregate ID for event sourcing (EXTERNAL_API_CALL-{callId})
     */
    private String aggregateId;

    /**
     * Type of event
     */
    private EventType eventType;

    /**
     * When the event occurred
     */
    private LocalDateTime timestamp;

    /**
     * User who initiated the call
     */
    private String performedBy;

    // --- API Config Info ---

    /**
     * API configuration ID
     */
    private Long apiConfigId;

    /**
     * API configuration code
     */
    private String apiConfigCode;

    /**
     * API configuration name
     */
    private String apiConfigName;

    // --- Context ---

    /**
     * Associated operation ID (if any)
     */
    private Long operationId;

    /**
     * Associated operation reference
     */
    private String operationReference;

    /**
     * What triggered this call (RULE, SCHEDULED_JOB, MANUAL, SYSTEM)
     */
    private String triggerSource;

    /**
     * Code of the trigger (rule code, job code, etc.)
     */
    private String triggerCode;

    /**
     * Correlation ID for tracing
     */
    private String correlationId;

    // --- Request ---

    /**
     * Request URL
     */
    private String requestUrl;

    /**
     * HTTP method
     */
    private String requestMethod;

    /**
     * Request headers (JSON)
     */
    private Map<String, String> requestHeaders;

    /**
     * Request body
     */
    private String requestBody;

    // --- Response ---

    /**
     * HTTP response status code
     */
    private Integer responseStatusCode;

    /**
     * Response headers (JSON)
     */
    private Map<String, String> responseHeaders;

    /**
     * Response body
     */
    private String responseBody;

    /**
     * Duration of the API call in milliseconds
     */
    private Long durationMs;

    // --- Mapped Data ---

    /**
     * Data extracted from response using ExternalApiResponseMapping
     */
    private Map<String, Object> mappedResponseData;

    // --- Error Info ---

    /**
     * Error message if the call failed
     */
    private String errorMessage;

    /**
     * Error code/type
     */
    private String errorCode;

    // --- Listener Results ---

    /**
     * Results of listener executions
     */
    private List<ListenerExecutionResult> listenerResults;

    /**
     * Types of events
     */
    public enum EventType {
        /**
         * API call has been initiated
         */
        API_CALL_INITIATED,

        /**
         * API call completed successfully
         */
        API_CALL_SUCCESS,

        /**
         * API call failed
         */
        API_CALL_FAILED,

        /**
         * API call timed out
         */
        API_CALL_TIMEOUT,

        /**
         * Listeners executed
         */
        LISTENERS_EXECUTED
    }

    /**
     * Creates an INITIATED event
     */
    public static ExternalApiCallEvent initiated(String callId, String apiConfigCode, String apiConfigName,
                                                  String requestUrl, String requestMethod,
                                                  Map<String, String> requestHeaders, String requestBody,
                                                  Long operationId, String operationReference,
                                                  String triggerSource, String triggerCode,
                                                  String performedBy, String correlationId) {
        return ExternalApiCallEvent.builder()
                .eventId(java.util.UUID.randomUUID().toString())
                .aggregateId("EXTERNAL_API_CALL-" + callId)
                .eventType(EventType.API_CALL_INITIATED)
                .timestamp(LocalDateTime.now())
                .performedBy(performedBy)
                .apiConfigCode(apiConfigCode)
                .apiConfigName(apiConfigName)
                .operationId(operationId)
                .operationReference(operationReference)
                .triggerSource(triggerSource)
                .triggerCode(triggerCode)
                .correlationId(correlationId)
                .requestUrl(requestUrl)
                .requestMethod(requestMethod)
                .requestHeaders(requestHeaders)
                .requestBody(requestBody)
                .build();
    }

    /**
     * Creates a SUCCESS event
     */
    public static ExternalApiCallEvent success(String callId, String apiConfigCode,
                                                Integer responseStatusCode,
                                                Map<String, String> responseHeaders,
                                                String responseBody,
                                                Long durationMs,
                                                Map<String, Object> mappedResponseData,
                                                String performedBy) {
        return ExternalApiCallEvent.builder()
                .eventId(java.util.UUID.randomUUID().toString())
                .aggregateId("EXTERNAL_API_CALL-" + callId)
                .eventType(EventType.API_CALL_SUCCESS)
                .timestamp(LocalDateTime.now())
                .performedBy(performedBy)
                .apiConfigCode(apiConfigCode)
                .responseStatusCode(responseStatusCode)
                .responseHeaders(responseHeaders)
                .responseBody(responseBody)
                .durationMs(durationMs)
                .mappedResponseData(mappedResponseData)
                .build();
    }

    /**
     * Creates a FAILED event
     */
    public static ExternalApiCallEvent failed(String callId, String apiConfigCode,
                                               Integer responseStatusCode,
                                               String responseBody,
                                               Long durationMs,
                                               String errorMessage,
                                               String errorCode,
                                               String performedBy) {
        return ExternalApiCallEvent.builder()
                .eventId(java.util.UUID.randomUUID().toString())
                .aggregateId("EXTERNAL_API_CALL-" + callId)
                .eventType(EventType.API_CALL_FAILED)
                .timestamp(LocalDateTime.now())
                .performedBy(performedBy)
                .apiConfigCode(apiConfigCode)
                .responseStatusCode(responseStatusCode)
                .responseBody(responseBody)
                .durationMs(durationMs)
                .errorMessage(errorMessage)
                .errorCode(errorCode)
                .build();
    }
}
