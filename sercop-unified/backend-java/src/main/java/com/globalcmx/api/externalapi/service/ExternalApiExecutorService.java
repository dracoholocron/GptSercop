package com.globalcmx.api.externalapi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.actions.ActionExecutionResult;
import com.globalcmx.api.dto.drools.RuleContext;
import com.globalcmx.api.externalapi.dto.command.TestApiConnectionCommand;
import com.globalcmx.api.externalapi.dto.query.TestResultResponse;
import com.globalcmx.api.externalapi.entity.*;
import com.globalcmx.api.externalapi.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalApiExecutorService {

    private final ExternalApiConfigRepository configRepository;
    private final ExternalApiCallLogRepository callLogRepository;
    private final ExternalApiTestResultRepository testResultRepository;
    private final ExternalApiMetricsRepository metricsRepository;
    private final AuthenticationHandler authHandler;
    private final TemplateProcessor templateProcessor;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public ActionExecutionResult execute(String apiConfigCode, RuleContext context) {
        return executeWithOperationId(apiConfigCode, context, null);
    }

    /**
     * Execute API with explicit operationId for logging.
     * Use this for CLIENT_REQUEST where the operationId is a UUID string.
     */
    public ActionExecutionResult executeWithOperationId(String apiConfigCode, RuleContext context, String operationIdOverride) {
        String correlationId = UUID.randomUUID().toString();
        long startTime = System.currentTimeMillis();

        log.info("[{}] Executing external API: {} with operationId: {}", correlationId, apiConfigCode, operationIdOverride);

        try {
            ExternalApiConfigReadModel config = configRepository.findByCodeWithAllRelations(apiConfigCode)
                .orElseThrow(() -> new IllegalArgumentException("API config not found: " + apiConfigCode));

            if (!config.getActive()) {
                return ActionExecutionResult.failure("EXTERNAL_API", "API configuration is disabled: " + apiConfigCode, null);
            }

            return executeWithRetry(config, context, correlationId, startTime, operationIdOverride);

        } catch (Exception e) {
            log.error("[{}] Error executing API {}: {}", correlationId, apiConfigCode, e.getMessage());
            return ActionExecutionResult.failure("EXTERNAL_API", "Error calling external API: " + e.getMessage(), e);
        }
    }

    public TestResultResponse testConnection(ExternalApiConfigReadModel config, TestApiConnectionCommand command) {
        long startTime = System.currentTimeMillis();
        String correlationId = UUID.randomUUID().toString();

        try {
            RuleContext testContext = buildTestContext(command);
            boolean isMock = Boolean.TRUE.equals(config.getMockEnabled());

            String url = isMock ? resolveMockUrl(config) : buildUrl(config, testContext);
            HttpHeaders headers;
            if (isMock) {
                headers = new HttpHeaders();
                headers.setContentType(MediaType.parseMediaType(
                    config.getContentType() != null ? config.getContentType() : "application/json"));
                log.info("[{}] MOCK MODE TEST: Redirecting to {} (provider: {})",
                    correlationId, url, config.getMockProvider());
            } else {
                headers = buildHeaders(config, testContext);
            }
            HttpMethod method = HttpMethod.valueOf(config.getHttpMethod().name());
            Object body = method == HttpMethod.GET ? null : buildBody(config, testContext);

            HttpEntity<Object> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, method, entity, String.class);

            long executionTime = System.currentTimeMillis() - startTime;

            // Save to test results table
            saveTestResult(config.getId(), true, response.getStatusCode().value(),
                response.getBody(), executionTime, null, command.getTestedBy());

            // Also save to call log for audit trail
            logApiCall(config, url, method.name(), headers, body, response, true,
                null, correlationId, testContext, 1, executionTime, null);

            return TestResultResponse.builder()
                .success(true)
                .message("Conexion exitosa")
                .responseStatusCode(response.getStatusCode().value())
                .responseBody(response.getBody())
                .executionTimeMs(executionTime)
                .requestUrl(url)
                .requestMethod(method.name())
                .testedBy(command.getTestedBy())
                .testedAt(LocalDateTime.now())
                .build();

        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            String errorMessage = extractErrorMessage(e);

            // Save to test results table
            saveTestResult(config.getId(), false, getStatusCode(e),
                null, executionTime, errorMessage, command.getTestedBy());

            // Also save to call log for audit trail
            String errorUrl;
            try {
                errorUrl = Boolean.TRUE.equals(config.getMockEnabled()) ? resolveMockUrl(config) : buildUrl(config, buildTestContext(command));
            } catch (Exception urlEx) {
                errorUrl = config.getBaseUrl();
            }
            logApiCall(config, errorUrl,
                config.getHttpMethod().name(), null, null, null, false,
                errorMessage, correlationId, buildTestContext(command), 1, executionTime, null);

            return TestResultResponse.builder()
                .success(false)
                .message("Error de conexion: " + errorMessage)
                .responseStatusCode(getStatusCode(e))
                .executionTimeMs(executionTime)
                .errorDetails(e.getMessage())
                .testedBy(command.getTestedBy())
                .testedAt(LocalDateTime.now())
                .build();
        }
    }

    private ActionExecutionResult executeWithRetry(ExternalApiConfigReadModel config, RuleContext context,
                                                    String correlationId, long startTime, String operationIdOverride) {
        int maxRetries = config.getRetryCount() != null ? config.getRetryCount() : 3;
        int retryDelay = config.getRetryInitialDelayMs() != null ? config.getRetryInitialDelayMs() : 1000;
        double backoffMultiplier = config.getRetryBackoffMultiplier() != null ? config.getRetryBackoffMultiplier() : 2.0;

        Exception lastException = null;

        boolean isMock = Boolean.TRUE.equals(config.getMockEnabled());

        for (int attempt = 1; attempt <= maxRetries + 1; attempt++) {
            try {
                String url = isMock ? resolveMockUrl(config) : buildUrl(config, context);
                HttpHeaders headers;
                if (isMock) {
                    headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(
                        config.getContentType() != null ? config.getContentType() : "application/json"));
                    log.info("[{}] MOCK MODE: Redirecting to {} (provider: {})",
                        correlationId, url, config.getMockProvider());
                } else {
                    headers = buildHeaders(config, context);
                }
                HttpMethod method = HttpMethod.valueOf(config.getHttpMethod().name());
                Object body = method == HttpMethod.GET ? null : buildBody(config, context);

                HttpEntity<Object> entity = new HttpEntity<>(body, headers);
                ResponseEntity<String> response = restTemplate.exchange(url, method, entity, String.class);

                long executionTime = System.currentTimeMillis() - startTime;

                logApiCall(config, url, method.name(), headers, body, response, true,
                    null, correlationId, context, attempt, executionTime, operationIdOverride);

                updateMetrics(config, true, executionTime, null);

                Map<String, Object> resultData = new HashMap<>();
                resultData.put("statusCode", response.getStatusCode().value());
                resultData.put("responseBody", response.getBody());
                resultData.put("correlationId", correlationId);

                return ActionExecutionResult.success("EXTERNAL_API", resultData);

            } catch (Exception e) {
                lastException = e;
                log.warn("[{}] Attempt {} failed: {}", correlationId, attempt, e.getMessage());

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

        long executionTime = System.currentTimeMillis() - startTime;
        String errorType = classifyError(lastException);

        String failedUrl;
        try {
            failedUrl = isMock ? resolveMockUrl(config) : buildUrl(config, context);
        } catch (Exception urlEx) {
            failedUrl = config.getBaseUrl();
        }
        logApiCall(config, failedUrl, config.getHttpMethod().name(),
            null, null, null, false, lastException.getMessage(),
            correlationId, context, maxRetries + 1, executionTime, operationIdOverride);

        updateMetrics(config, false, executionTime, errorType);

        return ActionExecutionResult.failure("EXTERNAL_API",
            "API call failed after " + (maxRetries + 1) + " attempts: " + lastException.getMessage(),
            lastException);
    }

    private String resolveMockUrl(ExternalApiConfigReadModel config) {
        if ("HTTPBIN".equalsIgnoreCase(config.getMockProvider())) {
            return "https://httpbin.org/" + config.getHttpMethod().name().toLowerCase();
        }
        String customUrl = config.getMockCustomUrl();
        if (customUrl == null || customUrl.isBlank()) {
            throw new IllegalStateException("Mock enabled but no URL for provider: " + config.getMockProvider());
        }
        return customUrl;
    }

    private String buildUrl(ExternalApiConfigReadModel config, RuleContext context) {
        StringBuilder url = new StringBuilder(config.getBaseUrl());

        if (config.getPath() != null && !config.getPath().isEmpty()) {
            if (!config.getBaseUrl().endsWith("/") && !config.getPath().startsWith("/")) {
                url.append("/");
            }
            url.append(templateProcessor.process(config.getPath(), context));
        }

        String apiKeyParam = authHandler.getQueryParamApiKey(config.getAuthConfig());
        if (apiKeyParam != null) {
            url.append(url.toString().contains("?") ? "&" : "?").append(apiKeyParam);
        }

        return url.toString();
    }

    private HttpHeaders buildHeaders(ExternalApiConfigReadModel config, RuleContext context) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
            config.getContentType() != null ? config.getContentType() : "application/json"));

        if (config.getAuthConfig() != null) {
            authHandler.applyAuthentication(headers, config.getAuthConfig(), context);
        }

        if (config.getRequestTemplates() != null && !config.getRequestTemplates().isEmpty()) {
            ExternalApiRequestTemplate template = config.getRequestTemplates().stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsDefault()))
                .findFirst()
                .orElse(config.getRequestTemplates().get(0));

            if (template.getStaticHeadersJson() != null) {
                try {
                    @SuppressWarnings("unchecked")
                    Map<String, String> staticHeaders = objectMapper.readValue(
                        template.getStaticHeadersJson(), Map.class);
                    staticHeaders.forEach(headers::add);
                } catch (Exception e) {
                    log.warn("Error parsing static headers", e);
                }
            }
        }

        return headers;
    }

    private Object buildBody(ExternalApiConfigReadModel config, RuleContext context) {
        if (config.getRequestTemplates() == null || config.getRequestTemplates().isEmpty()) {
            return templateProcessor.processBody(null, context);
        }

        ExternalApiRequestTemplate template = config.getRequestTemplates().stream()
            .filter(t -> Boolean.TRUE.equals(t.getIsDefault()))
            .findFirst()
            .orElse(config.getRequestTemplates().get(0));

        return templateProcessor.processBody(template.getBodyTemplate(), context);
    }

    private RuleContext buildTestContext(TestApiConnectionCommand command) {
        RuleContext context = new RuleContext();
        context.setOperationId(0L);  // Test operation ID
        context.setOperationType("TEST");
        context.setOperationAmount(java.math.BigDecimal.valueOf(1000));
        context.setCurrency("USD");
        context.setOperationStatus("ACTIVE");
        context.setEventType("TEST");
        context.setEventDateTime(LocalDateTime.now());

        if (command != null && command.getTestData() != null) {
            context.setAdditionalData(command.getTestData());
        }

        return context;
    }

    private void logApiCall(ExternalApiConfigReadModel config, String url, String method,
                           HttpHeaders headers, Object body, ResponseEntity<String> response,
                           boolean success, String errorMessage, String correlationId,
                           RuleContext context, int attempt, long executionTime, String operationIdOverride) {
        try {
            // Use operationIdOverride if provided, otherwise fall back to context operationId
            String operationId = operationIdOverride != null ? operationIdOverride :
                    (context != null && context.getOperationId() != null ? context.getOperationId().toString() : null);

            ExternalApiCallLog log = ExternalApiCallLog.builder()
                .apiConfigId(config.getId())
                .apiConfigCode(config.getCode())
                .requestUrl(url)
                .requestMethod(method)
                .requestHeadersJson(headers != null ? sanitizeHeaders(headers) : null)
                .requestBody(body != null ? objectMapper.writeValueAsString(body) : null)
                .responseStatusCode(response != null ? response.getStatusCode().value() : null)
                .responseBody(response != null ? response.getBody() : null)
                .executionTimeMs(executionTime)
                .attemptNumber(attempt)
                .success(success)
                .errorMessage(errorMessage)
                .correlationId(correlationId)
                .operationId(operationId)
                .operationType(context != null ? context.getOperationType() : null)
                .eventType(context != null ? context.getEventType() : null)
                .triggeredBy(context != null ? context.getUserCode() : null)
                .build();

            callLogRepository.save(log);
        } catch (Exception e) {
            ExternalApiExecutorService.log.error("Error saving API call log", e);
        }
    }

    private String sanitizeHeaders(HttpHeaders headers) {
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

    private void saveTestResult(Long apiConfigId, boolean success, Integer statusCode,
                               String responseBody, long executionTime, String errorMessage, String testedBy) {
        ExternalApiTestResult result = ExternalApiTestResult.builder()
            .apiConfigId(apiConfigId)
            .testType("CONNECTION")
            .success(success)
            .responseStatusCode(statusCode)
            .responseBody(responseBody)
            .executionTimeMs(executionTime)
            .errorMessage(errorMessage)
            .testedBy(testedBy)
            .build();

        testResultRepository.save(result);
    }

    private void updateMetrics(ExternalApiConfigReadModel config, boolean success,
                              long executionTime, String errorType) {
        try {
            LocalDate today = LocalDate.now();
            int hour = LocalDateTime.now().getHour();

            ExternalApiMetrics metrics = metricsRepository
                .findByApiConfigIdAndMetricDateAndMetricHour(config.getId(), today, hour)
                .orElse(ExternalApiMetrics.builder()
                    .apiConfigId(config.getId())
                    .apiConfigCode(config.getCode())
                    .metricDate(today)
                    .metricHour(hour)
                    .build());

            metrics.setTotalCalls((metrics.getTotalCalls() != null ? metrics.getTotalCalls() : 0) + 1);

            if (success) {
                metrics.setSuccessfulCalls((metrics.getSuccessfulCalls() != null ? metrics.getSuccessfulCalls() : 0) + 1);
            } else {
                metrics.setFailedCalls((metrics.getFailedCalls() != null ? metrics.getFailedCalls() : 0) + 1);

                if ("TIMEOUT".equals(errorType)) {
                    metrics.setTimeoutErrors((metrics.getTimeoutErrors() != null ? metrics.getTimeoutErrors() : 0) + 1);
                } else if ("CONNECTION".equals(errorType)) {
                    metrics.setConnectionErrors((metrics.getConnectionErrors() != null ? metrics.getConnectionErrors() : 0) + 1);
                } else if ("AUTH".equals(errorType)) {
                    metrics.setAuthErrors((metrics.getAuthErrors() != null ? metrics.getAuthErrors() : 0) + 1);
                } else if ("SERVER".equals(errorType)) {
                    metrics.setServerErrors((metrics.getServerErrors() != null ? metrics.getServerErrors() : 0) + 1);
                } else if ("CLIENT".equals(errorType)) {
                    metrics.setClientErrors((metrics.getClientErrors() != null ? metrics.getClientErrors() : 0) + 1);
                }
            }

            Long currentAvg = metrics.getAvgResponseTimeMs();
            int count = metrics.getTotalCalls();
            metrics.setAvgResponseTimeMs(currentAvg == null ?
                executionTime : ((currentAvg * (count - 1)) + executionTime) / count);

            if (metrics.getMaxResponseTimeMs() == null || executionTime > metrics.getMaxResponseTimeMs()) {
                metrics.setMaxResponseTimeMs(executionTime);
            }
            if (metrics.getMinResponseTimeMs() == null || executionTime < metrics.getMinResponseTimeMs()) {
                metrics.setMinResponseTimeMs(executionTime);
            }

            metricsRepository.save(metrics);
        } catch (Exception e) {
            log.error("Error updating metrics", e);
        }
    }

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

    private String extractErrorMessage(Exception e) {
        if (e instanceof HttpClientErrorException || e instanceof HttpServerErrorException) {
            return e.getMessage();
        }
        return e.getMessage();
    }

    private Integer getStatusCode(Exception e) {
        if (e instanceof HttpClientErrorException) {
            return ((HttpClientErrorException) e).getStatusCode().value();
        } else if (e instanceof HttpServerErrorException) {
            return ((HttpServerErrorException) e).getStatusCode().value();
        }
        return null;
    }
}
