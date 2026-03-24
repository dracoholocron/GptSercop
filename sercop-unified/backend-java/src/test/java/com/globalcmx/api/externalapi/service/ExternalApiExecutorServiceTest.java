package com.globalcmx.api.externalapi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.actions.ActionExecutionResult;
import com.globalcmx.api.dto.drools.RuleContext;
import com.globalcmx.api.externalapi.dto.command.TestApiConnectionCommand;
import com.globalcmx.api.externalapi.dto.query.TestResultResponse;
import com.globalcmx.api.externalapi.entity.*;
import com.globalcmx.api.externalapi.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ExternalApiExecutorService.
 * Tests external API execution, retry logic, and error handling.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ExternalApiExecutorService - Unit Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ExternalApiExecutorServiceTest {

    @Mock
    private ExternalApiConfigRepository configRepository;

    @Mock
    private ExternalApiCallLogRepository callLogRepository;

    @Mock
    private ExternalApiTestResultRepository testResultRepository;

    @Mock
    private ExternalApiMetricsRepository metricsRepository;

    @Mock
    private AuthenticationHandler authHandler;

    @Mock
    private TemplateProcessor templateProcessor;

    @Mock
    private RestTemplate restTemplate;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private ExternalApiExecutorService executorService;

    // ==================================================================================
    // 1. EXECUTE API TESTS
    // ==================================================================================

    @Nested
    @Order(1)
    @DisplayName("1. Execute API")
    class ExecuteApiTests {

        @Test
        @DisplayName("Should execute API call successfully")
        void shouldExecuteApiCallSuccessfully() {
            // Arrange
            String apiConfigCode = "MAILGUN_EMAIL";
            RuleContext context = createRuleContext();
            ExternalApiConfigReadModel config = createApiConfig(apiConfigCode);

            when(configRepository.findByCodeWithAllRelations(apiConfigCode))
                    .thenReturn(Optional.of(config));
            when(templateProcessor.process(anyString(), any(RuleContext.class)))
                    .thenReturn("/messages");
            when(templateProcessor.processBody(any(), any(RuleContext.class)))
                    .thenReturn("{\"test\": \"data\"}");

            ResponseEntity<String> response = new ResponseEntity<>("{\"success\": true}", HttpStatus.OK);
            when(restTemplate.exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(response);

            when(metricsRepository.findByApiConfigIdAndMetricDateAndMetricHour(anyLong(), any(), anyInt()))
                    .thenReturn(Optional.empty());

            // Act
            ActionExecutionResult result = executorService.execute(apiConfigCode, context);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getSuccess()).isTrue();
            assertThat(result.getActionType()).isEqualTo("EXTERNAL_API");

            verify(callLogRepository).save(any(ExternalApiCallLog.class));
            verify(metricsRepository).save(any(ExternalApiMetrics.class));
        }

        @Test
        @DisplayName("Should return failure when API config not found")
        void shouldReturnFailureWhenConfigNotFound() {
            // Arrange
            String apiConfigCode = "UNKNOWN_API";
            RuleContext context = createRuleContext();

            when(configRepository.findByCodeWithAllRelations(apiConfigCode))
                    .thenReturn(Optional.empty());

            // Act
            ActionExecutionResult result = executorService.execute(apiConfigCode, context);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getSuccess()).isFalse();
            assertThat(result.getErrorMessage()).contains("API config not found");
        }

        @Test
        @DisplayName("Should return failure when API config is disabled")
        void shouldReturnFailureWhenConfigDisabled() {
            // Arrange
            String apiConfigCode = "DISABLED_API";
            RuleContext context = createRuleContext();
            ExternalApiConfigReadModel config = createApiConfig(apiConfigCode);
            config.setActive(false);

            when(configRepository.findByCodeWithAllRelations(apiConfigCode))
                    .thenReturn(Optional.of(config));

            // Act
            ActionExecutionResult result = executorService.execute(apiConfigCode, context);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getSuccess()).isFalse();
            assertThat(result.getErrorMessage()).contains("disabled");
        }

        @Test
        @DisplayName("Should retry on failure and eventually succeed")
        void shouldRetryOnFailureAndSucceed() {
            // Arrange
            String apiConfigCode = "RETRY_API";
            RuleContext context = createRuleContext();
            ExternalApiConfigReadModel config = createApiConfig(apiConfigCode);
            config.setRetryCount(2);
            config.setRetryInitialDelayMs(10); // Short delay for test

            when(configRepository.findByCodeWithAllRelations(apiConfigCode))
                    .thenReturn(Optional.of(config));
            when(templateProcessor.process(anyString(), any(RuleContext.class)))
                    .thenReturn("/messages");
            when(templateProcessor.processBody(any(), any(RuleContext.class)))
                    .thenReturn("{}");

            // First call fails, second succeeds
            ResponseEntity<String> successResponse = new ResponseEntity<>("{\"ok\": true}", HttpStatus.OK);
            when(restTemplate.exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), eq(String.class)))
                    .thenThrow(new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR))
                    .thenReturn(successResponse);

            when(metricsRepository.findByApiConfigIdAndMetricDateAndMetricHour(anyLong(), any(), anyInt()))
                    .thenReturn(Optional.empty());

            // Act
            ActionExecutionResult result = executorService.execute(apiConfigCode, context);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getSuccess()).isTrue();

            // Should have called RestTemplate twice (first failure, second success)
            verify(restTemplate, times(2)).exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), eq(String.class));
        }

        @Test
        @DisplayName("Should fail after max retries exhausted")
        void shouldFailAfterMaxRetriesExhausted() {
            // Arrange
            String apiConfigCode = "FAIL_API";
            RuleContext context = createRuleContext();
            ExternalApiConfigReadModel config = createApiConfig(apiConfigCode);
            config.setRetryCount(2);
            config.setRetryInitialDelayMs(10);

            when(configRepository.findByCodeWithAllRelations(apiConfigCode))
                    .thenReturn(Optional.of(config));
            when(templateProcessor.process(anyString(), any(RuleContext.class)))
                    .thenReturn("/messages");
            when(templateProcessor.processBody(any(), any(RuleContext.class)))
                    .thenReturn("{}");

            // All calls fail
            when(restTemplate.exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), eq(String.class)))
                    .thenThrow(new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR));

            when(metricsRepository.findByApiConfigIdAndMetricDateAndMetricHour(anyLong(), any(), anyInt()))
                    .thenReturn(Optional.empty());

            // Act
            ActionExecutionResult result = executorService.execute(apiConfigCode, context);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getSuccess()).isFalse();
            assertThat(result.getErrorMessage()).contains("failed after");

            // Should have called RestTemplate 3 times (initial + 2 retries)
            verify(restTemplate, times(3)).exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), eq(String.class));
        }
    }

    // ==================================================================================
    // 2. TEST CONNECTION TESTS
    // ==================================================================================

    @Nested
    @Order(2)
    @DisplayName("2. Test Connection")
    class TestConnectionTests {

        @Test
        @DisplayName("Should test connection successfully")
        void shouldTestConnectionSuccessfully() {
            // Arrange
            ExternalApiConfigReadModel config = createApiConfig("TEST_API");
            TestApiConnectionCommand command = TestApiConnectionCommand.builder()
                    .testedBy("admin@test.com")
                    .build();

            when(templateProcessor.process(anyString(), any(RuleContext.class)))
                    .thenReturn("/test");
            when(templateProcessor.processBody(any(), any(RuleContext.class)))
                    .thenReturn("{}");

            ResponseEntity<String> response = new ResponseEntity<>("{\"status\": \"ok\"}", HttpStatus.OK);
            when(restTemplate.exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), eq(String.class)))
                    .thenReturn(response);

            // Act
            TestResultResponse result = executorService.testConnection(config, command);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getSuccess()).isTrue();
            assertThat(result.getResponseStatusCode()).isEqualTo(200);
            assertThat(result.getMessage()).contains("exitosa");
            assertThat(result.getTestedBy()).isEqualTo("admin@test.com");

            verify(testResultRepository).save(any(ExternalApiTestResult.class));
            verify(callLogRepository).save(any(ExternalApiCallLog.class));
        }

        @Test
        @DisplayName("Should handle connection test failure with client error")
        void shouldHandleConnectionTestFailureWithClientError() {
            // Arrange
            ExternalApiConfigReadModel config = createApiConfig("TEST_API");
            TestApiConnectionCommand command = TestApiConnectionCommand.builder()
                    .testedBy("admin@test.com")
                    .build();

            when(templateProcessor.process(anyString(), any(RuleContext.class)))
                    .thenReturn("/test");
            when(templateProcessor.processBody(any(), any(RuleContext.class)))
                    .thenReturn("{}");

            when(restTemplate.exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), eq(String.class)))
                    .thenThrow(new HttpClientErrorException(HttpStatus.UNAUTHORIZED, "Invalid API Key"));

            // Act
            TestResultResponse result = executorService.testConnection(config, command);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getSuccess()).isFalse();
            assertThat(result.getResponseStatusCode()).isEqualTo(401);
            assertThat(result.getMessage()).contains("Error de conexion");

            verify(testResultRepository).save(any(ExternalApiTestResult.class));
        }

        @Test
        @DisplayName("Should handle connection timeout")
        void shouldHandleConnectionTimeout() {
            // Arrange
            ExternalApiConfigReadModel config = createApiConfig("TEST_API");
            TestApiConnectionCommand command = TestApiConnectionCommand.builder()
                    .testedBy("admin@test.com")
                    .build();

            when(templateProcessor.process(anyString(), any(RuleContext.class)))
                    .thenReturn("/test");
            when(templateProcessor.processBody(any(), any(RuleContext.class)))
                    .thenReturn("{}");

            when(restTemplate.exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), eq(String.class)))
                    .thenThrow(new ResourceAccessException("Connection timed out"));

            // Act
            TestResultResponse result = executorService.testConnection(config, command);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getSuccess()).isFalse();
            assertThat(result.getMessage()).contains("Error de conexion");
        }
    }

    // ==================================================================================
    // 3. ERROR CLASSIFICATION TESTS
    // ==================================================================================

    @Nested
    @Order(3)
    @DisplayName("3. Error Classification")
    class ErrorClassificationTests {

        @Test
        @DisplayName("Should classify 401/403 as AUTH error")
        void shouldClassifyUnauthorizedAsAuthError() {
            // Arrange
            String apiConfigCode = "AUTH_FAIL_API";
            RuleContext context = createRuleContext();
            ExternalApiConfigReadModel config = createApiConfig(apiConfigCode);
            config.setRetryCount(0);

            when(configRepository.findByCodeWithAllRelations(apiConfigCode))
                    .thenReturn(Optional.of(config));
            when(templateProcessor.process(anyString(), any(RuleContext.class)))
                    .thenReturn("/test");
            when(templateProcessor.processBody(any(), any(RuleContext.class)))
                    .thenReturn("{}");

            when(restTemplate.exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), eq(String.class)))
                    .thenThrow(new HttpClientErrorException(HttpStatus.UNAUTHORIZED));

            when(metricsRepository.findByApiConfigIdAndMetricDateAndMetricHour(anyLong(), any(), anyInt()))
                    .thenReturn(Optional.of(createMetrics(config)));

            // Act
            ActionExecutionResult result = executorService.execute(apiConfigCode, context);

            // Assert
            assertThat(result.getSuccess()).isFalse();
            // Metrics should record AUTH error
            verify(metricsRepository).save(argThat(metrics ->
                metrics.getAuthErrors() != null && metrics.getAuthErrors() > 0
            ));
        }

        @Test
        @DisplayName("Should classify 5xx as SERVER error")
        void shouldClassifyServerErrorAsServerError() {
            // Arrange
            String apiConfigCode = "SERVER_FAIL_API";
            RuleContext context = createRuleContext();
            ExternalApiConfigReadModel config = createApiConfig(apiConfigCode);
            config.setRetryCount(0);

            when(configRepository.findByCodeWithAllRelations(apiConfigCode))
                    .thenReturn(Optional.of(config));
            when(templateProcessor.process(anyString(), any(RuleContext.class)))
                    .thenReturn("/test");
            when(templateProcessor.processBody(any(), any(RuleContext.class)))
                    .thenReturn("{}");

            when(restTemplate.exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), eq(String.class)))
                    .thenThrow(new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR));

            when(metricsRepository.findByApiConfigIdAndMetricDateAndMetricHour(anyLong(), any(), anyInt()))
                    .thenReturn(Optional.of(createMetrics(config)));

            // Act
            ActionExecutionResult result = executorService.execute(apiConfigCode, context);

            // Assert
            assertThat(result.getSuccess()).isFalse();
            verify(metricsRepository).save(argThat(metrics ->
                metrics.getServerErrors() != null && metrics.getServerErrors() > 0
            ));
        }
    }

    // ==================================================================================
    // HELPER METHODS
    // ==================================================================================

    private RuleContext createRuleContext() {
        RuleContext context = new RuleContext();
        context.setOperationId(1L);
        context.setOperationType("GUARANTEE");
        context.setOperationAmount(BigDecimal.valueOf(100000));
        context.setCurrency("USD");
        context.setOperationStatus("APPROVED");
        context.setEventType("ISSUE_APPROVED");
        context.setEventDateTime(LocalDateTime.now());
        context.setUserCode("admin@test.com");
        return context;
    }

    private ExternalApiConfigReadModel createApiConfig(String code) {
        return ExternalApiConfigReadModel.builder()
                .id(1L)
                .code(code)
                .name("Test API - " + code)
                .description("Test API configuration")
                .baseUrl("https://api.test.com")
                .path("/v1/messages")
                .httpMethod(ExternalApiConfigReadModel.HttpMethod.POST)
                .contentType("application/json")
                .timeoutMs(30000)
                .retryCount(3)
                .retryInitialDelayMs(1000)
                .retryBackoffMultiplier(2.0)
                .active(true)
                .environment("development")
                .createdAt(LocalDateTime.now())
                .createdBy("system")
                .build();
    }

    private ExternalApiMetrics createMetrics(ExternalApiConfigReadModel config) {
        return ExternalApiMetrics.builder()
                .id(1L)
                .apiConfigId(config.getId())
                .apiConfigCode(config.getCode())
                .metricDate(java.time.LocalDate.now())
                .metricHour(LocalDateTime.now().getHour())
                .totalCalls(0)
                .successfulCalls(0)
                .failedCalls(0)
                .build();
    }
}
