package com.globalcmx.api.externalapi.service.query;

import com.globalcmx.api.externalapi.dto.query.*;
import com.globalcmx.api.externalapi.entity.*;
import com.globalcmx.api.externalapi.repository.*;
import com.globalcmx.api.externalapi.service.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExternalApiConfigQueryService {

    private final ExternalApiConfigRepository configRepository;
    private final ExternalApiCallLogRepository callLogRepository;
    private final ExternalApiMetricsRepository metricsRepository;
    private final ExternalApiTestResultRepository testResultRepository;
    private final EncryptionService encryptionService;

    public List<ExternalApiConfigResponse> findAll(Boolean active, String environment) {
        List<ExternalApiConfigReadModel> configs = configRepository.findByFilters(active, environment);
        return configs.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public ExternalApiConfigResponse findById(Long id) {
        ExternalApiConfigReadModel config = configRepository.findByIdWithAllRelations(id)
            .orElseThrow(() -> new IllegalArgumentException("Configuracion no encontrada: " + id));
        return mapToDetailedResponse(config);
    }

    public ExternalApiConfigResponse findByCode(String code) {
        ExternalApiConfigReadModel config = configRepository.findByCodeWithAllRelations(code)
            .orElseThrow(() -> new IllegalArgumentException("Configuracion no encontrada: " + code));
        return mapToDetailedResponse(config);
    }

    public Page<ApiCallLogResponse> findLogs(Long apiConfigId, LocalDateTime from, LocalDateTime to,
                                              Boolean success, Pageable pageable) {
        Page<ExternalApiCallLog> logs = callLogRepository.findByFilters(apiConfigId, from, to, success, pageable);
        return logs.map(this::mapToLogResponse);
    }

    public Page<ApiCallLogResponse> findAllLogs(Long apiConfigId, LocalDateTime from, LocalDateTime to,
                                                 Boolean success, Pageable pageable) {
        Page<ExternalApiCallLog> logs = callLogRepository.findAllByFilters(apiConfigId, from, to, success, pageable);
        return logs.map(this::mapToLogResponse);
    }

    public Page<TestResultResponse> findAllTestResults(Long apiConfigId, Pageable pageable) {
        Page<ExternalApiTestResult> results = testResultRepository.findAllByFilters(apiConfigId, pageable);
        return results.map(this::mapToTestResultResponse);
    }

    public ApiMetricsResponse getMetrics(Long apiConfigId, String period) {
        ExternalApiConfigReadModel config = configRepository.findById(apiConfigId)
            .orElseThrow(() -> new IllegalArgumentException("Configuracion no encontrada: " + apiConfigId));

        LocalDate fromDate = switch (period != null ? period.toUpperCase() : "7D") {
            case "24H" -> LocalDate.now().minusDays(1);
            case "7D" -> LocalDate.now().minusDays(7);
            case "30D" -> LocalDate.now().minusDays(30);
            case "90D" -> LocalDate.now().minusDays(90);
            default -> LocalDate.now().minusDays(7);
        };

        ApiMetricsSummary summary = buildMetricsSummary(apiConfigId, fromDate);

        List<Object[]> dailyData = metricsRepository.getDailyMetrics(apiConfigId, fromDate);
        List<ApiMetricsResponse.DailyMetrics> dailyMetrics = dailyData.stream()
            .map(row -> ApiMetricsResponse.DailyMetrics.builder()
                .date(row[0].toString())
                .totalCalls(((Number) row[1]).longValue())
                .successfulCalls(((Number) row[2]).longValue())
                .failedCalls(((Number) row[3]).longValue())
                .successRate(calculateSuccessRate(((Number) row[2]).longValue(), ((Number) row[1]).longValue()))
                .build())
            .collect(Collectors.toList());

        return ApiMetricsResponse.builder()
            .apiConfigId(apiConfigId)
            .apiConfigCode(config.getCode())
            .apiConfigName(config.getName())
            .period(period)
            .summary(summary)
            .dailyMetrics(dailyMetrics)
            .build();
    }

    public List<AuthTypeInfo> getAuthTypes() {
        return Arrays.stream(ExternalApiAuthConfig.AuthType.values())
            .map(type -> new AuthTypeInfo(
                type.name(),
                getAuthTypeLabel(type),
                getAuthTypeDescription(type)))
            .collect(Collectors.toList());
    }

    public List<String> getHttpMethods() {
        return Arrays.stream(ExternalApiConfigReadModel.HttpMethod.values())
            .map(Enum::name)
            .collect(Collectors.toList());
    }

    private ExternalApiConfigResponse mapToResponse(ExternalApiConfigReadModel config) {
        return ExternalApiConfigResponse.builder()
            .id(config.getId())
            .code(config.getCode())
            .name(config.getName())
            .description(config.getDescription())
            .baseUrl(config.getBaseUrl())
            .path(config.getPath())
            .httpMethod(config.getHttpMethod().name())
            .contentType(config.getContentType())
            .timeoutMs(config.getTimeoutMs())
            .retryCount(config.getRetryCount())
            .circuitBreakerEnabled(config.getCircuitBreakerEnabled())
            .active(config.getActive())
            .environment(config.getEnvironment())
            .mockEnabled(config.getMockEnabled())
            .mockProvider(config.getMockProvider())
            .mockCustomUrl(config.getMockCustomUrl())
            .createdAt(config.getCreatedAt())
            .updatedAt(config.getUpdatedAt())
            .metricsSummary(buildQuickMetricsSummary(config.getId()))
            .build();
    }

    private ExternalApiConfigResponse mapToDetailedResponse(ExternalApiConfigReadModel config) {
        ExternalApiConfigResponse response = mapToResponse(config);

        response.setRetryBackoffMultiplier(config.getRetryBackoffMultiplier());
        response.setRetryInitialDelayMs(config.getRetryInitialDelayMs());
        response.setRetryMaxDelayMs(config.getRetryMaxDelayMs());
        response.setCircuitBreakerThreshold(config.getCircuitBreakerThreshold());
        response.setCircuitBreakerTimeoutMs(config.getCircuitBreakerTimeoutMs());
        response.setCreatedBy(config.getCreatedBy());
        response.setUpdatedBy(config.getUpdatedBy());

        if (config.getAuthConfig() != null) {
            response.setAuthConfig(mapToAuthResponse(config.getAuthConfig()));
        }

        if (config.getRequestTemplates() != null) {
            response.setRequestTemplates(config.getRequestTemplates().stream()
                .map(this::mapToTemplateResponse)
                .collect(Collectors.toList()));
        }

        if (config.getResponseConfig() != null) {
            response.setResponseConfig(mapToResponseConfigResponse(config.getResponseConfig()));
        }

        return response;
    }

    private AuthConfigResponse mapToAuthResponse(ExternalApiAuthConfig auth) {
        return AuthConfigResponse.builder()
            .id(auth.getId())
            .authType(auth.getAuthType().name())
            .apiKeyName(auth.getApiKeyName())
            .apiKeyValueMasked(auth.getApiKeyValueEncrypted() != null ? "****" : null)
            .apiKeyLocation(auth.getApiKeyLocation() != null ? auth.getApiKeyLocation().name() : null)
            .username(auth.getUsername())
            .hasPassword(auth.getPasswordEncrypted() != null)
            .hasStaticToken(auth.getStaticTokenEncrypted() != null)
            .oauth2TokenUrl(auth.getOauth2TokenUrl())
            .oauth2ClientId(auth.getOauth2ClientId())
            .hasOauth2ClientSecret(auth.getOauth2ClientSecretEncrypted() != null)
            .oauth2Scope(auth.getOauth2Scope())
            .oauth2Audience(auth.getOauth2Audience())
            .oauth2AuthUrl(auth.getOauth2AuthUrl())
            .oauth2RedirectUri(auth.getOauth2RedirectUri())
            .hasJwtSecret(auth.getJwtSecretEncrypted() != null)
            .jwtAlgorithm(auth.getJwtAlgorithm())
            .jwtIssuer(auth.getJwtIssuer())
            .jwtAudience(auth.getJwtAudience())
            .jwtExpirationSeconds(auth.getJwtExpirationSeconds())
            .jwtClaimsTemplate(auth.getJwtClaimsTemplate())
            .mtlsCertPath(auth.getMtlsCertPath())
            .mtlsKeyPath(auth.getMtlsKeyPath())
            .mtlsCaCertPath(auth.getMtlsCaCertPath())
            .hasMtlsKeyPassword(auth.getMtlsKeyPasswordEncrypted() != null)
            .customHeadersJson(auth.getCustomHeadersJson())
            .active(auth.getActive())
            .build();
    }

    private RequestTemplateResponse mapToTemplateResponse(ExternalApiRequestTemplate template) {
        return RequestTemplateResponse.builder()
            .id(template.getId())
            .name(template.getName())
            .description(template.getDescription())
            .staticHeadersJson(template.getStaticHeadersJson())
            .queryParamsTemplate(template.getQueryParamsTemplate())
            .bodyTemplate(template.getBodyTemplate())
            .testPayloadExample(template.getTestPayloadExample())
            .variableMappingsJson(template.getVariableMappingsJson())
            .isDefault(template.getIsDefault())
            .active(template.getActive())
            .createdAt(template.getCreatedAt())
            .updatedAt(template.getUpdatedAt())
            .build();
    }

    private ResponseConfigResponse mapToResponseConfigResponse(ExternalApiResponseConfig responseConfig) {
        return ResponseConfigResponse.builder()
            .id(responseConfig.getId())
            .successCodes(responseConfig.getSuccessCodes())
            .responseType(responseConfig.getResponseType().name())
            .successFieldPath(responseConfig.getSuccessFieldPath())
            .successExpectedValue(responseConfig.getSuccessExpectedValue())
            .errorMessagePath(responseConfig.getErrorMessagePath())
            .transactionIdPath(responseConfig.getTransactionIdPath())
            .extractionMappingsJson(responseConfig.getExtractionMappingsJson())
            .validationRulesJson(responseConfig.getValidationRulesJson())
            .build();
    }

    private ApiCallLogResponse mapToLogResponse(ExternalApiCallLog log) {
        return ApiCallLogResponse.builder()
            .id(log.getId())
            .apiConfigId(log.getApiConfigId())
            .apiConfigCode(log.getApiConfigCode())
            .requestUrl(log.getRequestUrl())
            .requestMethod(log.getRequestMethod())
            .responseStatusCode(log.getResponseStatusCode())
            .executionTimeMs(log.getExecutionTimeMs())
            .attemptNumber(log.getAttemptNumber())
            .success(log.getSuccess())
            .errorMessage(log.getErrorMessage())
            .errorType(log.getErrorType())
            .correlationId(log.getCorrelationId())
            .operationId(log.getOperationId())
            .operationType(log.getOperationType())
            .eventType(log.getEventType())
            .triggeredBy(log.getTriggeredBy())
            .createdAt(log.getCreatedAt())
            .build();
    }

    private TestResultResponse mapToTestResultResponse(ExternalApiTestResult result) {
        return TestResultResponse.builder()
            .id(result.getId())
            .apiConfigId(result.getApiConfigId())
            .testType(result.getTestType())
            .success(result.getSuccess())
            .message(result.getErrorMessage())
            .responseStatusCode(result.getResponseStatusCode())
            .responseBody(result.getResponseBody())
            .executionTimeMs(result.getExecutionTimeMs())
            .errorDetails(result.getErrorMessage())
            .testedBy(result.getTestedBy())
            .testedAt(result.getTestedAt())
            .build();
    }

    private ApiMetricsSummary buildQuickMetricsSummary(Long apiConfigId) {
        LocalDateTime since = LocalDateTime.now().minusDays(1);
        Long totalCalls = callLogRepository.countByApiConfigIdSince(apiConfigId, since);
        Long successfulCalls = callLogRepository.countSuccessfulByApiConfigIdSince(apiConfigId, since);
        Double avgTime = callLogRepository.avgExecutionTimeByApiConfigIdSince(apiConfigId, since);

        return ApiMetricsSummary.builder()
            .totalCalls(totalCalls)
            .successfulCalls(successfulCalls)
            .failedCalls(totalCalls - successfulCalls)
            .successRate(calculateSuccessRate(successfulCalls, totalCalls))
            .avgResponseTimeMs(avgTime != null ? avgTime.longValue() : null)
            .build();
    }

    private ApiMetricsSummary buildMetricsSummary(Long apiConfigId, LocalDate fromDate) {
        Object[] aggregated = metricsRepository.getAggregatedMetrics(apiConfigId, fromDate);

        if (aggregated == null || aggregated[0] == null) {
            return ApiMetricsSummary.builder()
                .totalCalls(0L)
                .successfulCalls(0L)
                .failedCalls(0L)
                .successRate(0.0)
                .build();
        }

        Long totalCalls = ((Number) aggregated[0]).longValue();
        Long successfulCalls = ((Number) aggregated[1]).longValue();
        Long failedCalls = ((Number) aggregated[2]).longValue();
        Long avgTime = aggregated[3] != null ? ((Number) aggregated[3]).longValue() : null;

        return ApiMetricsSummary.builder()
            .totalCalls(totalCalls)
            .successfulCalls(successfulCalls)
            .failedCalls(failedCalls)
            .successRate(calculateSuccessRate(successfulCalls, totalCalls))
            .avgResponseTimeMs(avgTime)
            .build();
    }

    private Double calculateSuccessRate(Long successful, Long total) {
        if (total == null || total == 0) return 0.0;
        return (successful != null ? successful : 0) * 100.0 / total;
    }

    private String getAuthTypeLabel(ExternalApiAuthConfig.AuthType type) {
        return switch (type) {
            case NONE -> "Sin autenticacion";
            case API_KEY -> "API Key";
            case BASIC_AUTH -> "Basic Auth";
            case BEARER_TOKEN -> "Bearer Token";
            case OAUTH2_CLIENT_CREDENTIALS -> "OAuth2 Client Credentials";
            case OAUTH2_AUTHORIZATION_CODE -> "OAuth2 Authorization Code";
            case JWT -> "JWT";
            case MTLS -> "mTLS (Certificados)";
            case CUSTOM_HEADER -> "Headers Personalizados";
        };
    }

    private String getAuthTypeDescription(ExternalApiAuthConfig.AuthType type) {
        return switch (type) {
            case NONE -> "No se requiere autenticacion";
            case API_KEY -> "Autenticacion mediante API Key en header o query param";
            case BASIC_AUTH -> "Autenticacion HTTP Basic con usuario y contrasena";
            case BEARER_TOKEN -> "Token Bearer estatico";
            case OAUTH2_CLIENT_CREDENTIALS -> "OAuth2 con Client ID y Secret";
            case OAUTH2_AUTHORIZATION_CODE -> "OAuth2 con flujo de autorizacion";
            case JWT -> "Generacion dinamica de JWT";
            case MTLS -> "Autenticacion mutua TLS con certificados";
            case CUSTOM_HEADER -> "Headers de autenticacion personalizados";
        };
    }

    public record AuthTypeInfo(String code, String label, String description) {}
}
