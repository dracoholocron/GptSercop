package com.globalcmx.api.externalapi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.actions.ActionExecutionResult;
import com.globalcmx.api.externalapi.dto.ApiRequestParameters;
import com.globalcmx.api.externalapi.dto.ExternalApiCallContext;
import com.globalcmx.api.externalapi.dto.ListenerExecutionResult;
import com.globalcmx.api.externalapi.entity.ExternalApiCallLog;
import com.globalcmx.api.externalapi.entity.ExternalApiConfigReadModel;
import com.globalcmx.api.externalapi.event.ExternalApiCallEvent;
import com.globalcmx.api.externalapi.event.ExternalApiEventPublisher;
import com.globalcmx.api.externalapi.repository.ExternalApiConfigRepository;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * External API executor service with variable mapping support.
 * Extends the base ExternalApiExecutorService with:
 * - Request variable mapping (from template_variable_read_model)
 * - Response data extraction using JSONPath
 * - Listener execution after API calls
 * - CQRS event publishing via Kafka
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalApiMappedExecutorService {

    private final ExternalApiConfigRepository configRepository;
    private final ExternalApiCallLogService callLogService;
    private final OperationReadModelRepository operationRepository;
    private final ExternalApiRequestMappingService requestMappingService;
    private final ExternalApiResponseMappingService responseMappingService;
    private final ExternalApiResponseListenerService listenerService;
    private final AuthenticationHandler authHandler;
    private final ExternalApiEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    /**
     * Executes an external API call with full mapping support.
     * Note: No @Transactional here - the only DB write (call log) uses REQUIRES_NEW in ExternalApiCallLogService.
     *
     * @param apiConfigCode The API configuration code
     * @param context The API call context
     * @return Action execution result
     */
    public ActionExecutionResult executeWithMappings(String apiConfigCode, ExternalApiCallContext context) {
        String callId = UUID.randomUUID().toString();
        context.setCallId(callId);
        long startTime = System.currentTimeMillis();

        log.info("[{}] Executing external API with mappings: {}", callId, apiConfigCode);

        try {
            // Load API configuration
            ExternalApiConfigReadModel config = configRepository.findByCodeWithAllRelations(apiConfigCode)
                    .orElseThrow(() -> new IllegalArgumentException("API config not found: " + apiConfigCode));

            if (!config.getActive()) {
                return ActionExecutionResult.failure("EXTERNAL_API",
                        "API configuration is disabled: " + apiConfigCode, null);
            }

            context.setApiConfig(config);

            // Resolve request parameters using mappings
            ApiRequestParameters params = requestMappingService.resolveRequestParameters(config.getId(), context);

            // Build the request
            String url = buildUrl(config, params);
            HttpHeaders headers = buildHeaders(config, params, context);
            HttpMethod method = HttpMethod.valueOf(config.getHttpMethod().name());
            Object body = buildBody(config, params);

            // Publish INITIATED event
            publishInitiatedEvent(callId, config, url, method.name(), headers, body, context);

            // Execute with retry
            return executeWithRetry(config, url, method, headers, body, context, callId, startTime);

        } catch (Exception e) {
            log.error("[{}] Error executing API {}: {}", callId, apiConfigCode, e.getMessage());
            return ActionExecutionResult.failure("EXTERNAL_API",
                    "Error calling external API: " + e.getMessage(), e);
        }
    }

    /**
     * Executes an external API call for a specific operation.
     */
    public ActionExecutionResult executeForOperation(String apiConfigCode, Long operationId,
                                                      String triggerSource, String triggerCode,
                                                      String executingUser) {
        // Load operation
        OperationReadModel operation = operationRepository.findById(operationId)
                .orElse(null);

        ExternalApiCallContext context = ExternalApiCallContext.builder()
                .operation(operation)
                .executingUser(executingUser)
                .triggerSource(triggerSource)
                .triggerCode(triggerCode)
                .correlationId(UUID.randomUUID().toString())
                .build();

        return executeWithMappings(apiConfigCode, context);
    }

    /**
     * Executes the API call with retry logic.
     */
    private ActionExecutionResult executeWithRetry(ExternalApiConfigReadModel config,
                                                    String url, HttpMethod method,
                                                    HttpHeaders headers, Object body,
                                                    ExternalApiCallContext context,
                                                    String callId, long startTime) {
        int maxRetries = config.getRetryCount() != null ? config.getRetryCount() : 3;
        int retryDelay = config.getRetryInitialDelayMs() != null ? config.getRetryInitialDelayMs() : 1000;
        double backoffMultiplier = config.getRetryBackoffMultiplier() != null ? config.getRetryBackoffMultiplier() : 2.0;

        Exception lastException = null;

        for (int attempt = 1; attempt <= maxRetries + 1; attempt++) {
            try {
                HttpEntity<Object> entity = new HttpEntity<>(body, headers);
                ResponseEntity<String> response = restTemplate.exchange(url, method, entity, String.class);

                long executionTime = System.currentTimeMillis() - startTime;

                // Extract and map response data
                Map<String, Object> mappedData = responseMappingService.extractResponseData(
                        config.getId(), response.getBody());

                // Save call log
                ExternalApiCallLog callLog = saveCallLog(config, callId, url, method.name(),
                        headers, body, response, true, null, context, attempt, executionTime, mappedData);

                // Publish SUCCESS event
                publishSuccessEvent(callId, config, response, executionTime, mappedData, context);

                // Trigger listeners asynchronously
                Long callLogId = callLog != null ? callLog.getId() : null;
                triggerListeners(config.getId(), context, mappedData, true, callLogId, callId);

                // Build result
                Map<String, Object> resultData = new HashMap<>();
                resultData.put("statusCode", response.getStatusCode().value());
                resultData.put("responseBody", response.getBody());
                resultData.put("mappedData", mappedData);
                resultData.put("callId", callId);
                resultData.put("correlationId", context.getCorrelationId());

                return ActionExecutionResult.success("EXTERNAL_API", resultData);

            } catch (Exception e) {
                lastException = e;
                log.warn("[{}] Attempt {} failed: {}", callId, attempt, e.getMessage());

                if (attempt <= maxRetries) {
                    try {
                        Thread.sleep(retryDelay);
                        retryDelay = (int) (retryDelay * backoffMultiplier);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }

        // All retries failed
        long executionTime = System.currentTimeMillis() - startTime;
        String errorType = classifyError(lastException);
        String errorMessage = lastException.getMessage();

        // Save failed call log
        ExternalApiCallLog callLog = saveCallLog(config, callId, url, method.name(),
                headers, body, null, false, errorMessage, context, maxRetries + 1, executionTime, null);

        // Publish FAILED event
        publishFailedEvent(callId, config, lastException, executionTime, context);

        // Trigger failure listeners
        Long callLogId = callLog != null ? callLog.getId() : null;
        triggerListeners(config.getId(), context, null, false, callLogId, callId);

        return ActionExecutionResult.failure("EXTERNAL_API",
                "API call failed after " + (maxRetries + 1) + " attempts: " + errorMessage,
                lastException);
    }

    /**
     * Builds the URL with resolved parameters.
     */
    private String buildUrl(ExternalApiConfigReadModel config, ApiRequestParameters params) {
        StringBuilder url = new StringBuilder(config.getBaseUrl());

        String path = config.getPath();
        if (path != null && !path.isEmpty()) {
            // Replace path parameters
            path = params.buildPath(path);

            if (!config.getBaseUrl().endsWith("/") && !path.startsWith("/")) {
                url.append("/");
            }
            url.append(path);
        }

        // Add query parameters
        String queryString = params.buildQueryString();
        if (!queryString.isEmpty()) {
            url.append(url.toString().contains("?") ? "&" : "?");
            url.append(queryString);
        }

        // Add API key if configured
        String apiKeyParam = authHandler.getQueryParamApiKey(config.getAuthConfig());
        if (apiKeyParam != null) {
            url.append(url.toString().contains("?") ? "&" : "?").append(apiKeyParam);
        }

        return url.toString();
    }

    /**
     * Builds HTTP headers.
     */
    private HttpHeaders buildHeaders(ExternalApiConfigReadModel config,
                                      ApiRequestParameters params,
                                      ExternalApiCallContext context) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                config.getContentType() != null ? config.getContentType() : "application/json"));

        // Add auth headers
        if (config.getAuthConfig() != null) {
            // Note: This would need to be updated to work without RuleContext
            // For now, just add basic auth headers
            authHandler.applyBasicHeaders(headers, config.getAuthConfig());
        }

        // Add mapped headers
        params.getHeaders().forEach(headers::add);

        return headers;
    }

    /**
     * Builds request body.
     */
    private Object buildBody(ExternalApiConfigReadModel config, ApiRequestParameters params) {
        if (!params.hasBodyParameters()) {
            return null;
        }

        // Combine body fields and JSON path values
        Map<String, Object> body = new HashMap<>(params.getBodyFields());

        // TODO: Apply JSON path values to nested structure
        // For now, just merge at top level
        params.getJsonPathValues().forEach((path, value) -> {
            // Extract last segment of path as field name
            String fieldName = path.contains(".") ?
                    path.substring(path.lastIndexOf('.') + 1) : path;
            body.put(fieldName, value);
        });

        return body;
    }

    /**
     * Saves the API call log using a separate transaction.
     */
    private ExternalApiCallLog saveCallLog(ExternalApiConfigReadModel config, String callId,
                                            String url, String method,
                                            HttpHeaders headers, Object body,
                                            ResponseEntity<String> response,
                                            boolean success, String errorMessage,
                                            ExternalApiCallContext context,
                                            int attempt, long executionTime,
                                            Map<String, Object> mappedData) {
        try {
            ExternalApiCallLog callLog = ExternalApiCallLog.builder()
                    .callId(callId)
                    .apiConfigId(config.getId())
                    .apiConfigCode(config.getCode())
                    .requestUrl(url)
                    .requestMethod(method)
                    .requestHeadersJson(sanitizeHeaders(headers))
                    .requestBody(body != null ? objectMapper.writeValueAsString(body) : null)
                    .responseStatusCode(response != null ? response.getStatusCode().value() : null)
                    .responseBody(response != null ? response.getBody() : null)
                    .mappedResponseData(mappedData != null ? objectMapper.writeValueAsString(mappedData) : null)
                    .executionTimeMs(executionTime)
                    .attemptNumber(attempt)
                    .success(success)
                    .status(success ? ExternalApiCallLog.Status.SUCCESS : ExternalApiCallLog.Status.FAILED)
                    .errorMessage(errorMessage)
                    .correlationId(context.getCorrelationId())
                    .operationId(context.getOperation() != null ?
                            context.getOperation().getId().toString() : null)
                    .triggeredBy(context.getTriggerSource())
                    .aggregateId("EXTERNAL_API_CALL-" + callId)
                    .build();

            // Use separate transaction to avoid rollback issues
            return callLogService.saveCallLog(callLog);
        } catch (Exception e) {
            log.error("Error preparing API call log: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Sanitizes headers for logging.
     */
    private String sanitizeHeaders(HttpHeaders headers) {
        if (headers == null) return null;

        try {
            Map<String, String> sanitized = new HashMap<>();
            headers.forEach((key, values) -> {
                if (key.equalsIgnoreCase("Authorization") || key.equalsIgnoreCase("X-API-Key")) {
                    sanitized.put(key, "****");
                } else {
                    sanitized.put(key, String.join(", ", values));
                }
            });
            return objectMapper.writeValueAsString(sanitized);
        } catch (Exception e) {
            return "{}";
        }
    }

    /**
     * Publishes INITIATED event.
     */
    private void publishInitiatedEvent(String callId, ExternalApiConfigReadModel config,
                                        String url, String method,
                                        HttpHeaders headers, Object body,
                                        ExternalApiCallContext context) {
        try {
            Map<String, String> headerMap = new HashMap<>();
            if (headers != null) {
                headers.forEach((key, values) -> {
                    if (!key.equalsIgnoreCase("Authorization") && !key.equalsIgnoreCase("X-API-Key")) {
                        headerMap.put(key, String.join(", ", values));
                    }
                });
            }

            ExternalApiCallEvent event = ExternalApiCallEvent.initiated(
                    callId,
                    config.getCode(),
                    config.getName(),
                    url,
                    method,
                    headerMap,
                    body != null ? objectMapper.writeValueAsString(body) : null,
                    context.getOperation() != null ? context.getOperation().getId() : null,
                    context.getOperation() != null ? context.getOperation().getReference() : null,
                    context.getTriggerSource(),
                    context.getTriggerCode(),
                    context.getExecutingUser(),
                    context.getCorrelationId()
            );

            eventPublisher.publish(event);
        } catch (Exception e) {
            log.error("Error publishing INITIATED event: {}", e.getMessage());
        }
    }

    /**
     * Publishes SUCCESS event.
     */
    private void publishSuccessEvent(String callId, ExternalApiConfigReadModel config,
                                      ResponseEntity<String> response,
                                      long executionTime,
                                      Map<String, Object> mappedData,
                                      ExternalApiCallContext context) {
        try {
            ExternalApiCallEvent event = ExternalApiCallEvent.success(
                    callId,
                    config.getCode(),
                    response.getStatusCode().value(),
                    null, // Response headers
                    response.getBody(),
                    executionTime,
                    mappedData,
                    context.getExecutingUser()
            );

            eventPublisher.publish(event);
        } catch (Exception e) {
            log.error("Error publishing SUCCESS event: {}", e.getMessage());
        }
    }

    /**
     * Publishes FAILED event.
     */
    private void publishFailedEvent(String callId, ExternalApiConfigReadModel config,
                                     Exception exception, long executionTime,
                                     ExternalApiCallContext context) {
        try {
            Integer statusCode = getStatusCode(exception);
            String errorCode = classifyError(exception);

            ExternalApiCallEvent event = ExternalApiCallEvent.failed(
                    callId,
                    config.getCode(),
                    statusCode,
                    null,
                    executionTime,
                    exception.getMessage(),
                    errorCode,
                    context.getExecutingUser()
            );

            eventPublisher.publish(event);
        } catch (Exception e) {
            log.error("Error publishing FAILED event: {}", e.getMessage());
        }
    }

    /**
     * Triggers listeners asynchronously.
     */
    private void triggerListeners(Long apiConfigId, ExternalApiCallContext context,
                                   Map<String, Object> mappedData, boolean wasSuccessful,
                                   Long callLogId, String callId) {
        try {
            CompletableFuture<List<ListenerExecutionResult>> future =
                    listenerService.executeListeners(apiConfigId, context, mappedData,
                            wasSuccessful, callLogId, callId);

            future.thenAccept(results -> {
                log.info("Executed {} listeners for call {}", results.size(), callId);
            }).exceptionally(e -> {
                log.error("Error executing listeners for call {}: {}", callId, e.getMessage());
                return null;
            });
        } catch (Exception e) {
            log.error("Error triggering listeners: {}", e.getMessage());
        }
    }

    /**
     * Classifies an error by type.
     */
    private String classifyError(Exception e) {
        if (e instanceof ResourceAccessException) {
            if (e.getMessage() != null && e.getMessage().contains("timeout")) {
                return "TIMEOUT";
            }
            return "CONNECTION";
        } else if (e instanceof HttpClientErrorException) {
            int status = ((HttpClientErrorException) e).getStatusCode().value();
            if (status == 401 || status == 403) {
                return "AUTH";
            }
            return "CLIENT";
        } else if (e instanceof HttpServerErrorException) {
            return "SERVER";
        }
        return "UNKNOWN";
    }

    /**
     * Gets status code from exception.
     */
    private Integer getStatusCode(Exception e) {
        if (e instanceof HttpClientErrorException) {
            return ((HttpClientErrorException) e).getStatusCode().value();
        } else if (e instanceof HttpServerErrorException) {
            return ((HttpServerErrorException) e).getStatusCode().value();
        }
        return null;
    }
}
