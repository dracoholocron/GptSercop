package com.globalcmx.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.readmodel.entity.ActionTypeConfig;
import com.globalcmx.api.readmodel.entity.EventActionExecutionLog;
import com.globalcmx.api.readmodel.entity.EventActionExecutionLog.ExecutionStatus;
import com.globalcmx.api.readmodel.entity.ReglaEventoReadModel;
import com.globalcmx.api.readmodel.repository.ActionTypeConfigRepository;
import com.globalcmx.api.readmodel.repository.EventActionExecutionLogRepository;
import com.globalcmx.api.readmodel.repository.ReglaEventoReadModelRepository;
import com.globalcmx.api.security.filter.ApiPermissionFilter;
import com.globalcmx.api.security.jwt.JwtAuthenticationFilter;
import com.globalcmx.api.security.jwt.JwtTokenProvider;
import com.globalcmx.api.security.service.ApiEndpointCacheService;
import com.globalcmx.api.security.service.CustomUserDetailsService;
import com.globalcmx.api.service.EventActionExecutorService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for EventActionController.
 * Tests REST API endpoints for post-approval actions.
 *
 * @author GlobalCMX Team
 * @version 1.0
 */
@WebMvcTest(controllers = EventActionController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
        classes = {JwtAuthenticationFilter.class, ApiPermissionFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("EventActionController - REST API Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class EventActionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReglaEventoReadModelRepository ruleRepository;

    @MockBean
    private EventActionExecutionLogRepository executionLogRepository;

    @MockBean
    private ActionTypeConfigRepository actionTypeConfigRepository;

    @MockBean
    private EventActionExecutorService actionExecutorService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private ApiEndpointCacheService apiEndpointCacheService;

    // ==================================================================================
    // 1. PREVIEW ENDPOINT - GET /api/v1/event-actions/preview
    // ==================================================================================

    @Nested
    @Order(1)
    @DisplayName("1. PREVIEW - GET /api/v1/event-actions/preview")
    class PreviewEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should return empty actions when no rules found")
        void shouldReturnEmptyActionsWhenNoRulesFound() throws Exception {
            // Arrange
            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(List.of());

            // Act & Assert
            mockMvc.perform(get("/v1/event-actions/preview")
                            .param("operationType", "LC_IMPORT")
                            .param("triggerEvent", "ISSUE_APPROVED"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.totalActions").value(0))
                    .andExpect(jsonPath("$.data.actions", hasSize(0)));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return actions from matching rules")
        void shouldReturnActionsFromMatchingRules() throws Exception {
            // Arrange
            String actionsJson = """
                [{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":false,
                  "config":{"messageType":"MT700","description":"Generate MT700"}}]
            """;
            ReglaEventoReadModel rule = createRule("LC_IMPORT_ISSUE", actionsJson);

            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(List.of(rule));

            // Act & Assert
            mockMvc.perform(get("/v1/event-actions/preview")
                            .param("operationType", "LC_IMPORT")
                            .param("triggerEvent", "ISSUE_APPROVED"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.totalActions").value(1))
                    .andExpect(jsonPath("$.data.actions[0].actionType").value("SWIFT_MESSAGE"))
                    .andExpect(jsonPath("$.data.actions[0].order").value(1));
        }

        @Test
        @WithMockUser
        @DisplayName("Should include operation type in response")
        void shouldIncludeOperationTypeInResponse() throws Exception {
            // Arrange
            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    anyString(), anyString(), anyBoolean()))
                    .thenReturn(List.of());

            // Act & Assert
            mockMvc.perform(get("/v1/event-actions/preview")
                            .param("operationType", "GUARANTEE")
                            .param("triggerEvent", "ISSUE_APPROVED"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.operationType").value("GUARANTEE"));
        }
    }

    // ==================================================================================
    // 2. EXECUTE ENDPOINT - POST /api/v1/event-actions/execute
    // ==================================================================================

    @Nested
    @Order(2)
    @DisplayName("2. EXECUTE - POST /api/v1/event-actions/execute")
    class ExecuteEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should execute actions and return execution ID")
        void shouldExecuteActionsAndReturnExecutionId() throws Exception {
            // Arrange
            when(actionExecutorService.executeRulesForEvent(
                    eq("LC_IMPORT"), eq("ISSUE_APPROVED"), eq("OP-001"), isNull(), eq("user@test.com")))
                    .thenReturn("EXE-123456");
            when(executionLogRepository.findByExecutionIdOrderByActionOrder("EXE-123456"))
                    .thenReturn(List.of(createExecutionLog("EXE-123456", ExecutionStatus.SUCCESS)));

            String requestBody = """
                {
                    "operationType": "LC_IMPORT",
                    "triggerEvent": "ISSUE_APPROVED",
                    "operationId": "OP-001",
                    "executedBy": "user@test.com"
                }
            """;

            // Act & Assert
            mockMvc.perform(post("/v1/event-actions/execute")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.executionId").value("EXE-123456"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return success and failed counts")
        void shouldReturnSuccessAndFailedCounts() throws Exception {
            // Arrange
            when(actionExecutorService.executeRulesForEvent(any(), any(), any(), any(), any()))
                    .thenReturn("EXE-123");

            List<EventActionExecutionLog> logs = List.of(
                    createExecutionLog("EXE-123", ExecutionStatus.SUCCESS),
                    createExecutionLog("EXE-123", ExecutionStatus.SUCCESS),
                    createExecutionLog("EXE-123", ExecutionStatus.FAILED)
            );
            when(executionLogRepository.findByExecutionIdOrderByActionOrder("EXE-123"))
                    .thenReturn(logs);

            String requestBody = """
                {
                    "operationType": "LC_IMPORT",
                    "triggerEvent": "ISSUE_APPROVED",
                    "operationId": "OP-001",
                    "executedBy": "user@test.com"
                }
            """;

            // Act & Assert
            mockMvc.perform(post("/v1/event-actions/execute")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.totalActions").value(3))
                    .andExpect(jsonPath("$.data.successCount").value(2))
                    .andExpect(jsonPath("$.data.failedCount").value(1));
        }
    }

    // ==================================================================================
    // 3. RETRY ENDPOINT - POST /api/v1/event-actions/retry/{logId}
    // ==================================================================================

    @Nested
    @Order(3)
    @DisplayName("3. RETRY - POST /api/v1/event-actions/retry/{logId}")
    class RetryEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should retry failed action")
        void shouldRetryFailedAction() throws Exception {
            // Arrange
            EventActionExecutionLog log = createExecutionLog("EXE-123", ExecutionStatus.FAILED);
            log.setId(1L);
            log.setRetryCount(0);
            log.setMaxRetries(3);

            when(executionLogRepository.findById(1L)).thenReturn(Optional.of(log));
            when(executionLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act & Assert
            mockMvc.perform(post("/v1/event-actions/retry/1")
                            .with(csrf())
                            .param("executedBy", "user@test.com"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @WithMockUser
        @DisplayName("Should reject retry when not failed")
        void shouldRejectRetryWhenNotFailed() throws Exception {
            // Arrange
            EventActionExecutionLog log = createExecutionLog("EXE-123", ExecutionStatus.SUCCESS);
            log.setId(1L);

            when(executionLogRepository.findById(1L)).thenReturn(Optional.of(log));

            // Act & Assert - Returns 4xx client error when validation fails
            mockMvc.perform(post("/v1/event-actions/retry/1")
                            .with(csrf())
                            .param("executedBy", "user@test.com"))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @WithMockUser
        @DisplayName("Should reject retry when max retries reached")
        void shouldRejectRetryWhenMaxRetriesReached() throws Exception {
            // Arrange
            EventActionExecutionLog log = createExecutionLog("EXE-123", ExecutionStatus.FAILED);
            log.setId(1L);
            log.setRetryCount(3);
            log.setMaxRetries(3);

            when(executionLogRepository.findById(1L)).thenReturn(Optional.of(log));

            // Act & Assert - Returns 4xx client error when validation fails
            mockMvc.perform(post("/v1/event-actions/retry/1")
                            .with(csrf())
                            .param("executedBy", "user@test.com"))
                    .andExpect(status().is4xxClientError());
        }
    }

    // ==================================================================================
    // 4. SKIP ENDPOINT - POST /api/v1/event-actions/skip/{logId}
    // ==================================================================================

    @Nested
    @Order(4)
    @DisplayName("4. SKIP - POST /api/v1/event-actions/skip/{logId}")
    class SkipEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should skip action with reason")
        void shouldSkipActionWithReason() throws Exception {
            // Arrange
            EventActionExecutionLog log = createExecutionLog("EXE-123", ExecutionStatus.FAILED);
            log.setId(1L);

            when(executionLogRepository.findById(1L)).thenReturn(Optional.of(log));
            when(executionLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act & Assert
            mockMvc.perform(post("/v1/event-actions/skip/1")
                            .with(csrf())
                            .param("executedBy", "admin@test.com")
                            .param("reason", "Manual override"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.status").value("SKIPPED"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should reject skip for successful action")
        void shouldRejectSkipForSuccessfulAction() throws Exception {
            // Arrange
            EventActionExecutionLog log = createExecutionLog("EXE-123", ExecutionStatus.SUCCESS);
            log.setId(1L);

            when(executionLogRepository.findById(1L)).thenReturn(Optional.of(log));

            // Act & Assert - Returns 4xx client error when validation fails
            mockMvc.perform(post("/v1/event-actions/skip/1")
                            .with(csrf())
                            .param("executedBy", "admin@test.com"))
                    .andExpect(status().is4xxClientError());
        }
    }

    // ==================================================================================
    // 5. STATUS ENDPOINT - GET /api/v1/event-actions/status/{operationId}
    // ==================================================================================

    @Nested
    @Order(5)
    @DisplayName("5. STATUS - GET /api/v1/event-actions/status/{operationId}")
    class StatusEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should return execution status for operation")
        void shouldReturnExecutionStatusForOperation() throws Exception {
            // Arrange
            List<EventActionExecutionLog> logs = List.of(
                    createExecutionLog("EXE-001", ExecutionStatus.SUCCESS),
                    createExecutionLog("EXE-002", ExecutionStatus.FAILED)
            );
            when(executionLogRepository.findByOperationIdOrderByCreatedAtDesc("OP-001"))
                    .thenReturn(logs);

            // Act & Assert
            mockMvc.perform(get("/v1/event-actions/status/OP-001"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(2)));
        }
    }

    // ==================================================================================
    // 6. ACTION TYPES ENDPOINT - GET /api/v1/event-actions/action-types
    // ==================================================================================

    @Nested
    @Order(6)
    @DisplayName("6. ACTION TYPES - GET /api/v1/event-actions/action-types")
    class ActionTypesEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should return action type configs for language")
        void shouldReturnActionTypeConfigsForLanguage() throws Exception {
            // Arrange
            List<ActionTypeConfig> configs = List.of(
                    createActionTypeConfig("SWIFT_MESSAGE", "es", "Generar Mensaje SWIFT"),
                    createActionTypeConfig("EMAIL", "es", "Enviar Email")
            );
            when(actionTypeConfigRepository.findByLanguageAndIsActiveTrueOrderByDisplayOrder("es"))
                    .thenReturn(configs);

            // Act & Assert
            mockMvc.perform(get("/v1/event-actions/action-types")
                            .param("language", "es"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(2)))
                    .andExpect(jsonPath("$.data[0].actionType").value("SWIFT_MESSAGE"))
                    .andExpect(jsonPath("$.data[0].displayName").value("Generar Mensaje SWIFT"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should use Spanish as default language")
        void shouldUseSpanishAsDefaultLanguage() throws Exception {
            // Arrange
            when(actionTypeConfigRepository.findByLanguageAndIsActiveTrueOrderByDisplayOrder("es"))
                    .thenReturn(List.of());

            // Act & Assert
            mockMvc.perform(get("/v1/event-actions/action-types"))
                    .andExpect(status().isOk());

            verify(actionTypeConfigRepository).findByLanguageAndIsActiveTrueOrderByDisplayOrder("es");
        }
    }

    // ==================================================================================
    // HELPER METHODS
    // ==================================================================================

    private ReglaEventoReadModel createRule(String code, String actionsJson) {
        return ReglaEventoReadModel.builder()
                .id(1L)
                .codigo(code)
                .nombre("Test Rule")
                .tipoOperacion("LC_IMPORT")
                .eventoTrigger("ISSUE_APPROVED")
                .accionesJson(actionsJson)
                .prioridad(10)
                .activo(true)
                .build();
    }

    private EventActionExecutionLog createExecutionLog(String executionId, ExecutionStatus status) {
        return EventActionExecutionLog.builder()
                .id(1L)
                .executionId(executionId)
                .operationId("OP-001")
                .ruleCode("RULE-001")
                .actionType("SWIFT_MESSAGE")
                .actionOrder(1)
                .status(status)
                .retryCount(0)
                .maxRetries(3)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private ActionTypeConfig createActionTypeConfig(String actionType, String language, String displayName) {
        return ActionTypeConfig.builder()
                .id(1L)
                .actionType(actionType)
                .language(language)
                .displayName(displayName)
                .description("Test description")
                .icon("FiSend")
                .color("blue")
                .successMessage("Success")
                .errorMessage("Error")
                .isActive(true)
                .build();
    }
}
