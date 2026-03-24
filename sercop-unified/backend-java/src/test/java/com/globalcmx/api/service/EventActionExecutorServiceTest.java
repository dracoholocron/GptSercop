package com.globalcmx.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.readmodel.entity.*;
import com.globalcmx.api.readmodel.entity.EventActionExecutionLog.ExecutionStatus;
import com.globalcmx.api.readmodel.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EventActionExecutorService.
 * Tests post-approval automatic action execution.
 *
 * Test organization:
 * 1. RULE MATCHING - Finding and matching rules for events
 * 2. ACTION EXECUTION - Executing different action types
 * 3. LOGGING - Execution logging and tracking
 * 4. ERROR HANDLING - Failure scenarios and recovery
 *
 * @author GlobalCMX Team
 * @version 1.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("EventActionExecutorService - Unit Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class EventActionExecutorServiceTest {

    // ==================== MOCKS ====================

    @Mock private ReglaEventoReadModelRepository ruleRepository;
    @Mock private EventActionExecutionLogRepository executionLogRepository;
    @Mock private OperationReadModelRepository operationRepository;
    @Mock private SwiftDraftReadModelRepository draftRepository;
    @Mock private SwiftMessageReadModelRepository swiftMessageRepository;
    @Mock private SwiftMessageCommandService swiftMessageCommandService;
    @Mock private PendingEventApprovalRepository pendingApprovalRepository;
    @Mock private TemplateVariableResolverService templateVariableResolver;
    @Mock private ObjectMapper objectMapper;
    @Mock private RestTemplate restTemplate;
    @Mock private com.globalcmx.api.externalapi.service.ExternalApiExecutorService externalApiExecutorService;

    // ==================== CAPTORS ====================

    @Captor private ArgumentCaptor<EventActionExecutionLog> logCaptor;

    private EventActionExecutorService service;

    // ==================== SETUP ====================

    @BeforeEach
    void setUp() {
        // Use real ObjectMapper for JSON parsing
        ObjectMapper realMapper = new ObjectMapper();
        service = new EventActionExecutorService(
                ruleRepository,
                executionLogRepository,
                operationRepository,
                draftRepository,
                swiftMessageRepository,
                swiftMessageCommandService,
                pendingApprovalRepository,
                templateVariableResolver,
                realMapper,
                restTemplate,
                externalApiExecutorService
        );
    }

    // ==================================================================================
    // 1. RULE MATCHING - Finding and matching rules for events
    // ==================================================================================

    @Nested
    @Order(1)
    @DisplayName("1. RULE MATCHING - Finding Rules for Events")
    class RuleMatchingTests {

        @Test
        @DisplayName("Should return null when no rules found for event")
        void shouldReturnNullWhenNoRulesFound() {
            // Arrange
            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "UNKNOWN_EVENT", true))
                    .thenReturn(Collections.emptyList());

            // Act
            String executionId = service.executeRulesForEvent(
                    "LC_IMPORT", "UNKNOWN_EVENT", "OP-001", null, "user@test.com");

            // Assert
            assertThat(executionId).isNull();
            verify(executionLogRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should find rules by operation type and trigger event")
        void shouldFindRulesByOperationTypeAndTrigger() {
            // Arrange
            ReglaEventoReadModel rule = createRule("LC_IMPORT_ISSUE_APPROVED", "LC_IMPORT", "ISSUE_APPROVED");
            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(List.of(rule));
            when(executionLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            String executionId = service.executeRulesForEvent(
                    "LC_IMPORT", "ISSUE_APPROVED", "OP-001", null, "user@test.com");

            // Assert
            assertThat(executionId).isNotNull();
            assertThat(executionId).startsWith("EXE-");
            verify(ruleRepository).findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true);
        }

        @ParameterizedTest
        @DisplayName("Should find rules for different operation types")
        @CsvSource({
                "LC_IMPORT, ISSUE_APPROVED",
                "LC_EXPORT, AMEND_APPROVED",
                "GUARANTEE, NEW_OPERATION_APPROVED"
        })
        void shouldFindRulesForDifferentOperationTypes(String operationType, String triggerEvent) {
            // Arrange
            ReglaEventoReadModel rule = createRule("RULE_" + operationType, operationType, triggerEvent);
            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    operationType, triggerEvent, true))
                    .thenReturn(List.of(rule));
            when(executionLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            String executionId = service.executeRulesForEvent(
                    operationType, triggerEvent, "OP-001", null, "user@test.com");

            // Assert
            assertThat(executionId).isNotNull();
        }

        @Test
        @DisplayName("Should only find active rules")
        void shouldOnlyFindActiveRules() {
            // Arrange
            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(Collections.emptyList());

            // Act
            String executionId = service.executeRulesForEvent(
                    "LC_IMPORT", "ISSUE_APPROVED", "OP-001", null, "user@test.com");

            // Assert
            assertThat(executionId).isNull();
            // Verify that we're looking for active rules (activo=true)
            verify(ruleRepository).findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    eq("LC_IMPORT"), eq("ISSUE_APPROVED"), eq(true));
        }
    }

    // ==================================================================================
    // 2. ACTION EXECUTION - Executing different action types
    // ==================================================================================

    @Nested
    @Order(2)
    @DisplayName("2. ACTION EXECUTION - Different Action Types")
    class ActionExecutionTests {

        @Test
        @DisplayName("Should execute AUDITORIA action successfully")
        void shouldExecuteAuditoriaAction() {
            // Arrange
            String actionsJson = """
                [{"tipo":"AUDITORIA","orden":1,"async":false,"continueOnError":true,
                  "config":{"categoria":"LC_EMITIDA","severidad":"INFO","mensaje":"LC emitida"}}]
            """;
            ReglaEventoReadModel rule = createRuleWithActions("RULE_001", "LC_IMPORT", "ISSUE_APPROVED", actionsJson);

            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(List.of(rule));
            when(executionLogRepository.save(any())).thenAnswer(inv -> {
                EventActionExecutionLog log = inv.getArgument(0);
                log.setId(1L);
                return log;
            });

            // Act
            String executionId = service.executeRulesForEvent(
                    "LC_IMPORT", "ISSUE_APPROVED", "OP-001", null, "user@test.com");

            // Assert
            assertThat(executionId).isNotNull();
            verify(executionLogRepository, atLeast(1)).save(logCaptor.capture());

            List<EventActionExecutionLog> savedLogs = logCaptor.getAllValues();
            assertThat(savedLogs).isNotEmpty();

            // Check that we have a SUCCESS status in one of the saves
            boolean hasSuccess = savedLogs.stream()
                    .anyMatch(log -> log.getStatus() == ExecutionStatus.SUCCESS);
            assertThat(hasSuccess).isTrue();
        }

        @Test
        @DisplayName("Should log PENDING status before execution")
        void shouldLogPendingStatusBeforeExecution() {
            // Arrange
            String actionsJson = """
                [{"tipo":"AUDITORIA","orden":1,"async":false,"config":{"categoria":"TEST"}}]
            """;
            ReglaEventoReadModel rule = createRuleWithActions("RULE_001", "LC_IMPORT", "ISSUE_APPROVED", actionsJson);

            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(List.of(rule));

            // Capture status at the moment of each save
            List<ExecutionStatus> statusesAtSaveTime = new ArrayList<>();
            when(executionLogRepository.save(any())).thenAnswer(inv -> {
                EventActionExecutionLog log = inv.getArgument(0);
                log.setId(1L);
                // Capture status at this exact moment
                statusesAtSaveTime.add(log.getStatus());
                return log;
            });

            // Act
            service.executeRulesForEvent("LC_IMPORT", "ISSUE_APPROVED", "OP-001", null, "user@test.com");

            // Assert - First save should be PENDING
            assertThat(statusesAtSaveTime).isNotEmpty();
            assertThat(statusesAtSaveTime.get(0)).isEqualTo(ExecutionStatus.PENDING);
        }

        @Test
        @DisplayName("Should execute multiple actions in order")
        void shouldExecuteMultipleActionsInOrder() {
            // Arrange
            String actionsJson = """
                [
                  {"tipo":"AUDITORIA","orden":1,"async":false,"config":{"categoria":"STEP_1"}},
                  {"tipo":"AUDITORIA","orden":2,"async":false,"config":{"categoria":"STEP_2"}}
                ]
            """;
            ReglaEventoReadModel rule = createRuleWithActions("RULE_001", "LC_IMPORT", "ISSUE_APPROVED", actionsJson);

            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(List.of(rule));
            when(executionLogRepository.save(any())).thenAnswer(inv -> {
                EventActionExecutionLog log = inv.getArgument(0);
                log.setId(System.currentTimeMillis());
                return log;
            });

            // Act
            service.executeRulesForEvent("LC_IMPORT", "ISSUE_APPROVED", "OP-001", null, "user@test.com");

            // Assert
            verify(executionLogRepository, atLeast(4)).save(logCaptor.capture()); // 2 actions x 2 saves each
        }

        @Test
        @DisplayName("Should handle unknown action type gracefully")
        void shouldHandleUnknownActionTypeGracefully() {
            // Arrange
            String actionsJson = """
                [{"tipo":"UNKNOWN_TYPE","orden":1,"async":false,"config":{}}]
            """;
            ReglaEventoReadModel rule = createRuleWithActions("RULE_001", "LC_IMPORT", "ISSUE_APPROVED", actionsJson);

            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(List.of(rule));
            when(executionLogRepository.save(any())).thenAnswer(inv -> {
                EventActionExecutionLog log = inv.getArgument(0);
                log.setId(1L);
                return log;
            });

            // Act - Should not throw
            String executionId = service.executeRulesForEvent(
                    "LC_IMPORT", "ISSUE_APPROVED", "OP-001", null, "user@test.com");

            // Assert
            assertThat(executionId).isNotNull();
            verify(executionLogRepository, atLeastOnce()).save(any());
        }
    }

    // ==================================================================================
    // 3. LOGGING - Execution logging and tracking
    // ==================================================================================

    @Nested
    @Order(3)
    @DisplayName("3. LOGGING - Execution Tracking")
    class LoggingTests {

        @Test
        @DisplayName("Should generate unique execution ID")
        void shouldGenerateUniqueExecutionId() {
            // Arrange
            String actionsJson = "[{\"tipo\":\"AUDITORIA\",\"orden\":1,\"config\":{}}]";
            ReglaEventoReadModel rule = createRuleWithActions("RULE_001", "LC_IMPORT", "ISSUE_APPROVED", actionsJson);

            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(List.of(rule));
            when(executionLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            String executionId1 = service.executeRulesForEvent(
                    "LC_IMPORT", "ISSUE_APPROVED", "OP-001", null, "user@test.com");
            String executionId2 = service.executeRulesForEvent(
                    "LC_IMPORT", "ISSUE_APPROVED", "OP-002", null, "user@test.com");

            // Assert
            assertThat(executionId1).isNotEqualTo(executionId2);
            assertThat(executionId1).startsWith("EXE-");
            assertThat(executionId2).startsWith("EXE-");
        }

        @Test
        @DisplayName("Should log rule code in execution log")
        void shouldLogRuleCodeInExecutionLog() {
            // Arrange
            String actionsJson = "[{\"tipo\":\"AUDITORIA\",\"orden\":1,\"config\":{}}]";
            ReglaEventoReadModel rule = createRuleWithActions("LC_IMPORT_ISSUE_APPROVED", "LC_IMPORT", "ISSUE_APPROVED", actionsJson);

            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(List.of(rule));
            when(executionLogRepository.save(any())).thenAnswer(inv -> {
                EventActionExecutionLog log = inv.getArgument(0);
                log.setId(1L);
                return log;
            });

            // Act
            service.executeRulesForEvent("LC_IMPORT", "ISSUE_APPROVED", "OP-001", null, "user@test.com");

            // Assert
            verify(executionLogRepository, atLeastOnce()).save(logCaptor.capture());
            EventActionExecutionLog log = logCaptor.getValue();
            assertThat(log.getRuleCode()).isEqualTo("LC_IMPORT_ISSUE_APPROVED");
        }

        @Test
        @DisplayName("Should log operation ID in execution log")
        void shouldLogOperationIdInExecutionLog() {
            // Arrange
            String actionsJson = "[{\"tipo\":\"AUDITORIA\",\"orden\":1,\"config\":{}}]";
            ReglaEventoReadModel rule = createRuleWithActions("RULE_001", "LC_IMPORT", "ISSUE_APPROVED", actionsJson);

            OperationReadModel operation = createOperation("OP-TEST-001");
            when(operationRepository.findByOperationId("OP-TEST-001")).thenReturn(Optional.of(operation));
            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(List.of(rule));
            when(executionLogRepository.save(any())).thenAnswer(inv -> {
                EventActionExecutionLog log = inv.getArgument(0);
                log.setId(1L);
                return log;
            });

            // Act
            service.executeRulesForEvent("LC_IMPORT", "ISSUE_APPROVED", "OP-TEST-001", null, "user@test.com");

            // Assert
            verify(executionLogRepository, atLeastOnce()).save(logCaptor.capture());
            EventActionExecutionLog log = logCaptor.getValue();
            assertThat(log.getOperationId()).isEqualTo("OP-TEST-001");
        }

        @Test
        @DisplayName("Should log createdBy in execution log")
        void shouldLogCreatedByInExecutionLog() {
            // Arrange
            String actionsJson = "[{\"tipo\":\"AUDITORIA\",\"orden\":1,\"config\":{}}]";
            ReglaEventoReadModel rule = createRuleWithActions("RULE_001", "LC_IMPORT", "ISSUE_APPROVED", actionsJson);

            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(List.of(rule));
            when(executionLogRepository.save(any())).thenAnswer(inv -> {
                EventActionExecutionLog log = inv.getArgument(0);
                log.setId(1L);
                return log;
            });

            // Act
            service.executeRulesForEvent("LC_IMPORT", "ISSUE_APPROVED", "OP-001", null, "admin@globalcmx.com");

            // Assert
            verify(executionLogRepository, atLeastOnce()).save(logCaptor.capture());
            EventActionExecutionLog log = logCaptor.getValue();
            assertThat(log.getCreatedBy()).isEqualTo("admin@globalcmx.com");
        }

        @Test
        @DisplayName("Should log duration in milliseconds")
        void shouldLogDurationInMilliseconds() {
            // Arrange - Use valid config with required categoria field
            String actionsJson = "[{\"tipo\":\"AUDITORIA\",\"orden\":1,\"config\":{\"categoria\":\"TEST\",\"severidad\":\"INFO\",\"mensaje\":\"Test message\"}}]";
            ReglaEventoReadModel rule = createRuleWithActions("RULE_001", "LC_IMPORT", "ISSUE_APPROVED", actionsJson);

            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(List.of(rule));

            // Track if we captured a SUCCESS with duration
            List<Integer> durationsOnSuccess = new ArrayList<>();
            when(executionLogRepository.save(any())).thenAnswer(inv -> {
                EventActionExecutionLog log = inv.getArgument(0);
                log.setId(1L);
                // Capture duration when status is SUCCESS
                if (log.getStatus() == ExecutionStatus.SUCCESS && log.getDurationMs() != null) {
                    durationsOnSuccess.add(log.getDurationMs());
                }
                return log;
            });

            // Act
            service.executeRulesForEvent("LC_IMPORT", "ISSUE_APPROVED", "OP-001", null, "user@test.com");

            // Assert - Should have captured at least one SUCCESS with duration
            assertThat(durationsOnSuccess).isNotEmpty();
            assertThat(durationsOnSuccess.get(0)).isGreaterThanOrEqualTo(0);
        }
    }

    // ==================================================================================
    // 4. ERROR HANDLING - Failure scenarios and recovery
    // ==================================================================================

    @Nested
    @Order(4)
    @DisplayName("4. ERROR HANDLING - Failure Scenarios")
    class ErrorHandlingTests {

        @Test
        @DisplayName("Should continue on error when continueOnError is true")
        void shouldContinueOnErrorWhenFlagIsTrue() {
            // Arrange
            String actionsJson = """
                [
                  {"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":true,"config":{"messageType":"MT700"}},
                  {"tipo":"AUDITORIA","orden":2,"async":false,"config":{"categoria":"STEP_2"}}
                ]
            """;
            ReglaEventoReadModel rule = createRuleWithActions("RULE_001", "LC_IMPORT", "ISSUE_APPROVED", actionsJson);

            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(List.of(rule));
            when(executionLogRepository.save(any())).thenAnswer(inv -> {
                EventActionExecutionLog log = inv.getArgument(0);
                log.setId(System.currentTimeMillis());
                return log;
            });
            // No operation found - SWIFT_MESSAGE will fail

            // Act - Should not throw, should continue to second action
            String executionId = service.executeRulesForEvent(
                    "LC_IMPORT", "ISSUE_APPROVED", "OP-001", null, "user@test.com");

            // Assert
            assertThat(executionId).isNotNull();
            // Both actions should be logged (even if first one failed)
            verify(executionLogRepository, atLeast(2)).save(any());
        }

        @Test
        @DisplayName("Should log FAILED status on action error")
        void shouldLogFailedStatusOnActionError() {
            // Arrange
            String actionsJson = """
                [{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":true,
                  "config":{"messageType":"MT700"}}]
            """;
            ReglaEventoReadModel rule = createRuleWithActions("RULE_001", "LC_IMPORT", "ISSUE_APPROVED", actionsJson);

            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(List.of(rule));
            when(executionLogRepository.save(any())).thenAnswer(inv -> {
                EventActionExecutionLog log = inv.getArgument(0);
                log.setId(1L);
                return log;
            });
            // No operation - will fail

            // Act
            service.executeRulesForEvent("LC_IMPORT", "ISSUE_APPROVED", "OP-001", null, "user@test.com");

            // Assert
            verify(executionLogRepository, atLeast(2)).save(logCaptor.capture());
            List<EventActionExecutionLog> logs = logCaptor.getAllValues();

            boolean hasFailed = logs.stream()
                    .anyMatch(l -> l.getStatus() == ExecutionStatus.FAILED);
            assertThat(hasFailed).isTrue();
        }

        @Test
        @DisplayName("Should log error message on failure")
        void shouldLogErrorMessageOnFailure() {
            // Arrange
            String actionsJson = """
                [{"tipo":"SWIFT_MESSAGE","orden":1,"async":false,"continueOnError":true,
                  "config":{"messageType":"MT700"}}]
            """;
            ReglaEventoReadModel rule = createRuleWithActions("RULE_001", "LC_IMPORT", "ISSUE_APPROVED", actionsJson);

            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(List.of(rule));
            when(executionLogRepository.save(any())).thenAnswer(inv -> {
                EventActionExecutionLog log = inv.getArgument(0);
                log.setId(1L);
                return log;
            });

            // Act
            service.executeRulesForEvent("LC_IMPORT", "ISSUE_APPROVED", "OP-001", null, "user@test.com");

            // Assert
            verify(executionLogRepository, atLeast(2)).save(logCaptor.capture());
            List<EventActionExecutionLog> logs = logCaptor.getAllValues();

            EventActionExecutionLog failedLog = logs.stream()
                    .filter(l -> l.getStatus() == ExecutionStatus.FAILED)
                    .findFirst()
                    .orElse(null);

            assertThat(failedLog).isNotNull();
            assertThat(failedLog.getErrorMessage()).isNotNull();
            assertThat(failedLog.getErrorMessage()).isNotEmpty();
        }

        @Test
        @DisplayName("Should handle malformed JSON gracefully")
        void shouldHandleMalformedJsonGracefully() {
            // Arrange
            ReglaEventoReadModel rule = createRuleWithActions("RULE_001", "LC_IMPORT", "ISSUE_APPROVED", "invalid json");

            when(ruleRepository.findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
                    "LC_IMPORT", "ISSUE_APPROVED", true))
                    .thenReturn(List.of(rule));

            // Act - Should not throw
            String executionId = service.executeRulesForEvent(
                    "LC_IMPORT", "ISSUE_APPROVED", "OP-001", null, "user@test.com");

            // Assert
            assertThat(executionId).isNotNull();
            // No actions should be logged since JSON parsing failed
        }
    }

    // ==================================================================================
    // 5. QUERY METHODS - Getting execution logs
    // ==================================================================================

    @Nested
    @Order(5)
    @DisplayName("5. QUERY METHODS - Retrieving Logs")
    class QueryMethodsTests {

        @Test
        @DisplayName("Should get execution logs for operation")
        void shouldGetExecutionLogsForOperation() {
            // Arrange
            List<EventActionExecutionLog> expectedLogs = List.of(
                    createExecutionLog("EXE-001", "OP-001", ExecutionStatus.SUCCESS),
                    createExecutionLog("EXE-002", "OP-001", ExecutionStatus.FAILED)
            );
            when(executionLogRepository.findByOperationIdOrderByCreatedAtDesc("OP-001"))
                    .thenReturn(expectedLogs);

            // Act
            List<EventActionExecutionLog> result = service.getExecutionLogsForOperation("OP-001");

            // Assert
            assertThat(result).hasSize(2);
            verify(executionLogRepository).findByOperationIdOrderByCreatedAtDesc("OP-001");
        }

        @Test
        @DisplayName("Should get execution logs by execution ID")
        void shouldGetExecutionLogsByExecutionId() {
            // Arrange
            List<EventActionExecutionLog> expectedLogs = List.of(
                    createExecutionLog("EXE-001", "OP-001", ExecutionStatus.SUCCESS)
            );
            when(executionLogRepository.findByExecutionIdOrderByActionOrder("EXE-001"))
                    .thenReturn(expectedLogs);

            // Act
            List<EventActionExecutionLog> result = service.getExecutionLogsByExecutionId("EXE-001");

            // Assert
            assertThat(result).hasSize(1);
            verify(executionLogRepository).findByExecutionIdOrderByActionOrder("EXE-001");
        }
    }

    // ==================================================================================
    // HELPER METHODS
    // ==================================================================================

    private ReglaEventoReadModel createRule(String code, String operationType, String triggerEvent) {
        return createRuleWithActions(code, operationType, triggerEvent,
                "[{\"tipo\":\"AUDITORIA\",\"orden\":1,\"config\":{\"categoria\":\"TEST\"}}]");
    }

    private ReglaEventoReadModel createRuleWithActions(String code, String operationType,
                                                         String triggerEvent, String actionsJson) {
        return ReglaEventoReadModel.builder()
                .id(1L)
                .codigo(code)
                .nombre("Test Rule " + code)
                .tipoOperacion(operationType)
                .eventoTrigger(triggerEvent)
                .accionesJson(actionsJson)
                .prioridad(10)
                .activo(true)
                .build();
    }

    private OperationReadModel createOperation(String operationId) {
        return OperationReadModel.builder()
                .operationId(operationId)
                .productType("LC_IMPORT")
                .reference("REF-" + operationId)
                .stage("ISSUED")
                .status("ACTIVE")
                .currency("USD")
                .amount(new BigDecimal("100000"))
                .issuingBankBic("ISSUBANK")
                .advisingBankBic("ADVBANK")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private EventActionExecutionLog createExecutionLog(String executionId, String operationId,
                                                         ExecutionStatus status) {
        return EventActionExecutionLog.builder()
                .id(1L)
                .executionId(executionId)
                .operationId(operationId)
                .ruleCode("TEST_RULE")
                .actionType("AUDITORIA")
                .actionOrder(1)
                .status(status)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
