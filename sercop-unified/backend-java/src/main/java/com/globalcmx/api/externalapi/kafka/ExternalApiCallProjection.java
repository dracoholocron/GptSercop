package com.globalcmx.api.externalapi.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.externalapi.dto.ExternalApiCallContext;
import com.globalcmx.api.externalapi.dto.ListenerExecutionResult;
import com.globalcmx.api.externalapi.entity.ExternalApiCallLog;
import com.globalcmx.api.externalapi.entity.ExternalApiConfigReadModel;
import com.globalcmx.api.externalapi.event.ExternalApiCallEvent;
import com.globalcmx.api.externalapi.repository.ExternalApiCallLogRepository;
import com.globalcmx.api.externalapi.repository.ExternalApiConfigRepository;
import com.globalcmx.api.externalapi.service.ExternalApiResponseListenerService;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Kafka consumer for external API call events.
 * Updates the read model and triggers listeners based on events.
 */
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = true)
@Component
@RequiredArgsConstructor
@Slf4j
public class ExternalApiCallProjection {

    private final ExternalApiCallLogRepository callLogRepository;
    private final ExternalApiConfigRepository configRepository;
    private final OperationReadModelRepository operationRepository;
    private final ExternalApiResponseListenerService listenerService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = "${messaging.topics.external-api-call-events:external-api-call-events}",
            groupId = "${messaging.consumer-groups.external-api-projection:external-api-projection-group}"
    )
    @Transactional
    public void handleApiCallEvent(String message) {
        try {
            ExternalApiCallEvent event = objectMapper.readValue(message, ExternalApiCallEvent.class);

            log.info("Processing external API call event: {} for aggregate: {}",
                    event.getEventType(), event.getAggregateId());

            switch (event.getEventType()) {
                case API_CALL_INITIATED -> handleCallInitiated(event);
                case API_CALL_SUCCESS -> handleCallSuccess(event);
                case API_CALL_FAILED -> handleCallFailed(event);
                case API_CALL_TIMEOUT -> handleCallTimeout(event);
                case LISTENERS_EXECUTED -> handleListenersExecuted(event);
            }
        } catch (Exception e) {
            log.error("Error processing external API call event: {}", e.getMessage(), e);
            // Don't rethrow to prevent infinite retry loops
            // In production, you might want to send to a dead letter queue
        }
    }

    /**
     * Handles API_CALL_INITIATED event - creates initial log entry.
     */
    private void handleCallInitiated(ExternalApiCallEvent event) {
        String callId = extractCallId(event.getAggregateId());

        // Check if already exists (idempotency)
        if (callLogRepository.findByCallId(callId).isPresent()) {
            log.warn("Call log already exists for callId: {}", callId);
            return;
        }

        // Find the API config
        Optional<ExternalApiConfigReadModel> apiConfig = configRepository.findByCode(event.getApiConfigCode());
        Long apiConfigId = apiConfig.map(ExternalApiConfigReadModel::getId).orElse(null);

        ExternalApiCallLog callLog = ExternalApiCallLog.builder()
                .callId(callId)
                .apiConfigId(apiConfigId)
                .apiConfigCode(event.getApiConfigCode())
                .operationId(event.getOperationId() != null ? event.getOperationId().toString() : null)
                .triggeredBy(event.getTriggerSource())
                .correlationId(event.getCorrelationId())
                .requestUrl(event.getRequestUrl())
                .requestMethod(event.getRequestMethod())
                .requestHeadersJson(serializeJson(event.getRequestHeaders()))
                .requestBody(event.getRequestBody())
                .success(false)
                .status(ExternalApiCallLog.Status.PENDING)
                .aggregateId(event.getAggregateId())
                .attemptNumber(1)
                .build();

        callLogRepository.save(callLog);
        log.info("Created call log for API call: {}", callId);
    }

    /**
     * Handles API_CALL_SUCCESS event - updates log and triggers listeners.
     */
    private void handleCallSuccess(ExternalApiCallEvent event) {
        String callId = extractCallId(event.getAggregateId());

        callLogRepository.findByCallId(callId).ifPresentOrElse(
                callLog -> {
                    callLog.setResponseStatusCode(event.getResponseStatusCode());
                    callLog.setResponseHeadersJson(serializeJson(event.getResponseHeaders()));
                    callLog.setResponseBody(event.getResponseBody());
                    callLog.setResponseTimestamp(event.getTimestamp());
                    callLog.setMappedResponseData(serializeJson(event.getMappedResponseData()));
                    callLog.setExecutionTimeMs(event.getDurationMs());
                    callLog.setSuccess(true);
                    callLog.setStatus(ExternalApiCallLog.Status.SUCCESS);
                    callLogRepository.save(callLog);

                    log.info("Updated call log for successful API call: {}", callId);

                    // Trigger listeners
                    triggerListeners(callLog, event, true);
                },
                () -> log.warn("Call log not found for callId: {}", callId)
        );
    }

    /**
     * Handles API_CALL_FAILED event - updates log and triggers failure listeners.
     */
    private void handleCallFailed(ExternalApiCallEvent event) {
        String callId = extractCallId(event.getAggregateId());

        callLogRepository.findByCallId(callId).ifPresentOrElse(
                callLog -> {
                    callLog.setResponseStatusCode(event.getResponseStatusCode());
                    callLog.setResponseBody(event.getResponseBody());
                    callLog.setResponseTimestamp(event.getTimestamp());
                    callLog.setExecutionTimeMs(event.getDurationMs());
                    callLog.setSuccess(false);
                    callLog.setStatus(ExternalApiCallLog.Status.FAILED);
                    callLog.setErrorMessage(event.getErrorMessage());
                    callLog.setErrorType(event.getErrorCode());
                    callLogRepository.save(callLog);

                    log.info("Updated call log for failed API call: {}", callId);

                    // Trigger failure listeners
                    triggerListeners(callLog, event, false);
                },
                () -> log.warn("Call log not found for callId: {}", callId)
        );
    }

    /**
     * Handles API_CALL_TIMEOUT event.
     */
    private void handleCallTimeout(ExternalApiCallEvent event) {
        String callId = extractCallId(event.getAggregateId());

        callLogRepository.findByCallId(callId).ifPresentOrElse(
                callLog -> {
                    callLog.setResponseTimestamp(event.getTimestamp());
                    callLog.setExecutionTimeMs(event.getDurationMs());
                    callLog.setSuccess(false);
                    callLog.setStatus(ExternalApiCallLog.Status.TIMEOUT);
                    callLog.setErrorMessage("Request timed out");
                    callLog.setErrorType("TIMEOUT");
                    callLogRepository.save(callLog);

                    log.info("Updated call log for timed out API call: {}", callId);
                },
                () -> log.warn("Call log not found for callId: {}", callId)
        );
    }

    /**
     * Handles LISTENERS_EXECUTED event - updates log with listener results.
     */
    private void handleListenersExecuted(ExternalApiCallEvent event) {
        String callId = extractCallId(event.getAggregateId());

        callLogRepository.findByCallId(callId).ifPresentOrElse(
                callLog -> {
                    callLog.setListenersExecuted(serializeJson(event.getListenerResults()));
                    callLogRepository.save(callLog);

                    log.info("Updated call log with listener results for: {}", callId);
                },
                () -> log.warn("Call log not found for callId: {}", callId)
        );
    }

    /**
     * Triggers listeners for an API call.
     */
    private void triggerListeners(ExternalApiCallLog callLog, ExternalApiCallEvent event, boolean wasSuccessful) {
        if (callLog.getApiConfigId() == null) {
            log.warn("No API config ID for call log, cannot trigger listeners");
            return;
        }

        try {
            // Build context for listeners
            ExternalApiCallContext context = buildContext(callLog, event);

            // Parse mapped response data
            Map<String, Object> mappedData = event.getMappedResponseData();

            // Execute listeners asynchronously
            listenerService.executeListeners(
                    callLog.getApiConfigId(),
                    context,
                    mappedData,
                    wasSuccessful,
                    callLog.getId(),
                    callLog.getCallId()
            ).thenAccept(results -> {
                // Update call log with listener results
                updateCallLogWithListenerResults(callLog.getId(), results);
            });
        } catch (Exception e) {
            log.error("Error triggering listeners for call {}: {}", callLog.getCallId(), e.getMessage());
        }
    }

    /**
     * Builds the context for listener execution.
     */
    private ExternalApiCallContext buildContext(ExternalApiCallLog callLog, ExternalApiCallEvent event) {
        ExternalApiCallContext context = ExternalApiCallContext.builder()
                .callId(callLog.getCallId())
                .executingUser(event.getPerformedBy())
                .triggerSource(callLog.getTriggeredBy())
                .correlationId(callLog.getCorrelationId())
                .build();

        // Load API config
        if (callLog.getApiConfigId() != null) {
            configRepository.findById(callLog.getApiConfigId())
                    .ifPresent(context::setApiConfig);
        }

        // Load operation if available
        if (callLog.getOperationId() != null) {
            try {
                Long operationId = Long.parseLong(callLog.getOperationId());
                operationRepository.findById(operationId)
                        .ifPresent(context::setOperation);
            } catch (NumberFormatException e) {
                log.warn("Invalid operation ID: {}", callLog.getOperationId());
            }
        }

        return context;
    }

    /**
     * Updates the call log with listener results.
     */
    private void updateCallLogWithListenerResults(Long callLogId, List<ListenerExecutionResult> results) {
        try {
            callLogRepository.findById(callLogId).ifPresent(callLog -> {
                callLog.setListenersExecuted(serializeJson(results));
                callLogRepository.save(callLog);
                log.debug("Updated call log {} with {} listener results", callLogId, results.size());
            });
        } catch (Exception e) {
            log.error("Error updating call log with listener results: {}", e.getMessage());
        }
    }

    /**
     * Extracts the call ID from the aggregate ID.
     */
    private String extractCallId(String aggregateId) {
        if (aggregateId != null && aggregateId.startsWith("EXTERNAL_API_CALL-")) {
            return aggregateId.substring("EXTERNAL_API_CALL-".length());
        }
        return aggregateId;
    }

    /**
     * Serializes an object to JSON string.
     */
    private String serializeJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("Error serializing to JSON: {}", e.getMessage());
            return null;
        }
    }
}
