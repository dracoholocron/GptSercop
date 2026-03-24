package com.globalcmx.api.service;

import com.globalcmx.api.dto.command.ExecuteEventCommand;
import com.globalcmx.api.dto.query.OperationQueryDTO;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.*;
import com.globalcmx.api.readmodel.repository.*;
import com.globalcmx.api.customfields.service.OperationCustomDataService;
import com.globalcmx.api.service.command.OperationLockCommandService;
import com.globalcmx.api.service.query.OperationAnalyzerService;
import com.globalcmx.api.alerts.service.OperationAlertService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias completas para OperationCommandService.
 *
 * Organización por alcance:
 * 1. SEGURIDAD - Validaciones de entrada y permisos
 * 2. FUNCIONALIDAD - Lógica de negocio correcta
 * 3. OPERACIÓN - Flujos de trabajo completos
 * 4. REGRESIÓN - Garantizar que funcionalidad existente no se rompe
 *
 * @author GlobalCMX Team
 * @version 1.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OperationCommandService - Pruebas Unitarias")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class OperationCommandServiceTest {

    // ==================== MOCKS ====================

    @Mock private OperationReadModelRepository operationRepository;
    @Mock private SwiftDraftReadModelRepository draftRepository;
    @Mock private OperationEventLogReadModelRepository eventLogRepository;
    @Mock private EventTypeConfigReadModelRepository eventTypeRepository;
    @Mock private SwiftResponseConfigReadModelRepository responseConfigRepository;
    @Mock private EventSnapshotFieldConfigRepository snapshotFieldConfigRepository;
    @Mock private SwiftFieldConfigRepository swiftFieldConfigRepository;
    @Mock private SwiftMessageReadModelRepository swiftMessageRepository;
    @Mock private EventStoreService eventStoreService;
    @Mock private ParticipanteReadModelRepository participanteRepository;
    @Mock private FinancialInstitutionReadModelRepository financialInstitutionRepository;
    @Mock private OperationAnalyzerService operationAnalyzerService;
    @Mock private OperationLockCommandService operationLockService;
    @Mock private ProductTypeConfigRepository productTypeConfigRepository;
    @Mock private OperationCustomDataService operationCustomDataService;
    @Mock private OperationAlertService operationAlertService;
    @Mock private ObjectMapper objectMapper;

    // ==================== CAPTORES ====================

    @Captor private ArgumentCaptor<SwiftMessageReadModel> swiftMessageCaptor;
    @Captor private ArgumentCaptor<OperationReadModel> operationCaptor;
    @Captor private ArgumentCaptor<OperationEventLogReadModel> eventLogCaptor;

    private OperationCommandService service;

    // ==================== SETUP ====================

    @BeforeEach
    void setUp() {
        service = new OperationCommandService(
                operationRepository,
                draftRepository,
                eventLogRepository,
                eventTypeRepository,
                responseConfigRepository,
                snapshotFieldConfigRepository,
                swiftFieldConfigRepository,
                swiftMessageRepository,
                eventStoreService,
                participanteRepository,
                financialInstitutionRepository,
                operationAnalyzerService,
                operationLockService,
                productTypeConfigRepository,
                operationCustomDataService,
                operationAlertService,
                objectMapper
        );

        // By default, allow all lock operations
        lenient().when(operationLockService.canUserOperate(anyString(), anyString())).thenReturn(true);
    }

    // ==================================================================================
    // 1. SEGURIDAD - Validaciones de entrada, permisos y protección de datos
    // ==================================================================================

    @Nested
    @Order(1)
    @DisplayName("1. SEGURIDAD - Validaciones y Protección")
    class SecurityTests {

        @Nested
        @DisplayName("1.1 Validación de Operación")
        class OperationValidation {

            @Test
            @DisplayName("Debe rechazar operación inexistente")
            void shouldRejectNonExistentOperation() {
                // Arrange
                when(operationRepository.findByOperationId("INVALID-ID")).thenReturn(Optional.empty());

                ExecuteEventCommand command = ExecuteEventCommand.builder()
                        .operationId("INVALID-ID")
                        .eventCode("ADVISE")
                        .executedBy("user@test.com")
                        .build();

                // Act & Assert
                assertThatThrownBy(() -> service.executeEvent(command))
                        .isInstanceOf(RuntimeException.class)
                        .hasMessageContaining("Operation not found");

                verify(operationRepository, never()).save(any());
            }

            @Test
            @DisplayName("Debe rechazar evento inexistente para tipo de operación")
            void shouldRejectNonExistentEventForOperationType() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ISSUED");
                when(operationRepository.findByOperationId("LCI-2025-001")).thenReturn(Optional.of(operation));
                when(eventTypeRepository.findByEventCodeAndOperationTypeAndLanguage(
                        "INVALID_EVENT", "LC_IMPORT", "en")).thenReturn(Optional.empty());

                ExecuteEventCommand command = ExecuteEventCommand.builder()
                        .operationId("LCI-2025-001")
                        .eventCode("INVALID_EVENT")
                        .executedBy("user@test.com")
                        .build();

                // Act & Assert
                assertThatThrownBy(() -> service.executeEvent(command))
                        .isInstanceOf(RuntimeException.class)
                        .hasMessageContaining("Event not found");
            }
        }

        @Nested
        @DisplayName("1.2 Validación de Etapas")
        class StageValidation {

            @ParameterizedTest
            @DisplayName("Debe rechazar evento desde etapa no válida")
            @CsvSource({
                    "UTILIZE, ISSUED",      // UTILIZE no válido desde ISSUED
                    "CLOSE, ISSUED",        // CLOSE no válido desde ISSUED
                    "AMEND, CLOSED"         // AMEND no válido desde CLOSED
            })
            void shouldRejectEventFromInvalidStage(String eventCode, String currentStage) {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", currentStage);
                EventTypeConfigReadModel eventConfig = EventTypeConfigReadModel.builder()
                        .eventCode(eventCode)
                        .validFromStages(List.of("ADVISED", "CONFIRMED")) // No incluye ISSUED ni CLOSED
                        .build();

                when(operationRepository.findByOperationId("LCI-2025-001")).thenReturn(Optional.of(operation));
                when(eventTypeRepository.findByEventCodeAndOperationTypeAndLanguage(
                        eventCode, "LC_IMPORT", "en")).thenReturn(Optional.of(eventConfig));

                ExecuteEventCommand command = ExecuteEventCommand.builder()
                        .operationId("LCI-2025-001")
                        .eventCode(eventCode)
                        .executedBy("user@test.com")
                        .build();

                // Act & Assert
                assertThatThrownBy(() -> service.executeEvent(command))
                        .isInstanceOf(RuntimeException.class)
                        .hasMessageContaining("cannot be executed from stage");
            }
        }

        @Nested
        @DisplayName("1.3 Validación de markResponseReceived")
        class MarkResponseValidation {

            @Test
            @DisplayName("Debe rechazar operación no encontrada al marcar respuesta")
            void shouldRejectMarkResponseForNonExistentOperation() {
                // Arrange
                when(operationRepository.findByOperationId("INVALID")).thenReturn(Optional.empty());

                // Act & Assert
                assertThatThrownBy(() -> service.markResponseReceived("INVALID", "MT730"))
                        .isInstanceOf(RuntimeException.class)
                        .hasMessageContaining("Operation not found");
            }

            @Test
            @DisplayName("No debe modificar operación si tipo de respuesta no coincide")
            void shouldNotModifyWhenResponseTypeDoesNotMatch() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ADVISED");
                operation.setAwaitingResponse(true);
                operation.setAwaitingMessageType("MT730");

                when(operationRepository.findByOperationId("LCI-2025-001")).thenReturn(Optional.of(operation));

                // Act
                service.markResponseReceived("LCI-2025-001", "MT799"); // Tipo diferente

                // Assert
                verify(operationRepository, never()).save(any());
            }

            @Test
            @DisplayName("No debe modificar operación si no está esperando respuesta")
            void shouldNotModifyWhenNotAwaitingResponse() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ADVISED");
                operation.setAwaitingResponse(false);

                when(operationRepository.findByOperationId("LCI-2025-001")).thenReturn(Optional.of(operation));

                // Act
                service.markResponseReceived("LCI-2025-001", "MT730");

                // Assert
                verify(operationRepository, never()).save(any());
            }
        }
    }

    // ==================================================================================
    // 2. FUNCIONALIDAD - Lógica de negocio y comportamiento correcto
    // ==================================================================================

    @Nested
    @Order(2)
    @DisplayName("2. FUNCIONALIDAD - Lógica de Negocio")
    class FunctionalityTests {

        @Nested
        @DisplayName("2.1 Ejecución de Eventos")
        class EventExecution {

            @Test
            @DisplayName("Debe cambiar etapa según configuración del evento")
            void shouldChangeStageAccordingToEventConfig() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ISSUED");
                EventTypeConfigReadModel eventConfig = createEventConfig("ADVISE", "ADVISED", null, "MT710");

                setupMocksForEventExecution(operation, eventConfig);

                ExecuteEventCommand command = createCommand("LCI-2025-001", "ADVISE", Map.of());

                // Act
                OperationQueryDTO result = service.executeEvent(command);

                // Assert
                verify(operationRepository).save(operationCaptor.capture());
                assertThat(operationCaptor.getValue().getStage()).isEqualTo("ADVISED");
            }

            @Test
            @DisplayName("Debe cambiar estado según configuración del evento")
            void shouldChangeStatusAccordingToEventConfig() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ADVISED");
                EventTypeConfigReadModel eventConfig = createEventConfig("CANCEL", null, "CANCELLED", null);

                setupMocksForEventExecution(operation, eventConfig);

                ExecuteEventCommand command = createCommand("LCI-2025-001", "CANCEL", Map.of());

                // Act
                service.executeEvent(command);

                // Assert
                verify(operationRepository).save(operationCaptor.capture());
                assertThat(operationCaptor.getValue().getStatus()).isEqualTo("CANCELLED");
            }

            @Test
            @DisplayName("Debe incrementar contador de mensajes cuando hay outboundMessageType")
            void shouldIncrementMessageCountWhenOutboundMessageType() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ISSUED");
                operation.setMessageCount(1);
                EventTypeConfigReadModel eventConfig = createEventConfig("ADVISE", "ADVISED", null, "MT710");

                setupMocksForEventExecution(operation, eventConfig);

                ExecuteEventCommand command = createCommand("LCI-2025-001", "ADVISE", Map.of());

                // Act
                service.executeEvent(command);

                // Assert
                verify(operationRepository).save(operationCaptor.capture());
                assertThat(operationCaptor.getValue().getMessageCount()).isEqualTo(2);
            }

            @ParameterizedTest
            @DisplayName("Debe incrementar contador de enmiendas para eventos AMEND")
            @ValueSource(strings = {"AMEND", "AMEND_REQUEST", "AMEND_ACCEPTED"})
            void shouldIncrementAmendmentCountForAmendEvents(String eventCode) {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ADVISED");
                operation.setAmendmentCount(0);
                EventTypeConfigReadModel eventConfig = createEventConfig(eventCode, null, null, "MT707");

                setupMocksForEventExecution(operation, eventConfig);

                ExecuteEventCommand command = createCommand("LCI-2025-001", eventCode, Map.of());

                // Act
                service.executeEvent(command);

                // Assert
                verify(operationRepository).save(operationCaptor.capture());
                assertThat(operationCaptor.getValue().getAmendmentCount()).isEqualTo(1);
            }

            @Test
            @DisplayName("Debe actualizar modifiedBy y modifiedAt")
            void shouldUpdateModifiedByAndModifiedAt() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ISSUED");
                EventTypeConfigReadModel eventConfig = createEventConfig("ADVISE", "ADVISED", null, null);

                setupMocksForEventExecution(operation, eventConfig);

                ExecuteEventCommand command = ExecuteEventCommand.builder()
                        .operationId("LCI-2025-001")
                        .eventCode("ADVISE")
                        .executedBy("admin@globalcmx.com")
                        .build();

                // Act
                service.executeEvent(command);

                // Assert
                verify(operationRepository).save(operationCaptor.capture());
                OperationReadModel saved = operationCaptor.getValue();
                assertThat(saved.getModifiedBy()).isEqualTo("admin@globalcmx.com");
                assertThat(saved.getModifiedAt()).isNotNull();
            }
        }

        @Nested
        @DisplayName("2.2 Configuración de Espera de Respuesta")
        class ResponseAwaitingConfig {

            @Test
            @DisplayName("Debe configurar espera de respuesta cuando hay responseConfig")
            void shouldConfigureAwaitingResponseWhenConfigExists() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ISSUED");
                EventTypeConfigReadModel eventConfig = createEventConfig("ADVISE", "ADVISED", null, "MT710");
                SwiftResponseConfigReadModel responseConfig = SwiftResponseConfigReadModel.builder()
                        .expectedResponseType("MT730")
                        .expectedResponseDays(5)
                        .build();

                setupMocksForEventExecution(operation, eventConfig);
                when(responseConfigRepository.findBySentMessageTypeAndOperationTypeAndLanguageAndIsActiveTrue(
                        "MT710", "LC_IMPORT", "en")).thenReturn(Optional.of(responseConfig));

                ExecuteEventCommand command = createCommand("LCI-2025-001", "ADVISE", Map.of());

                // Act
                service.executeEvent(command);

                // Assert
                verify(operationRepository).save(operationCaptor.capture());
                OperationReadModel saved = operationCaptor.getValue();

                assertThat(saved.getAwaitingResponse()).isTrue();
                assertThat(saved.getAwaitingMessageType()).isEqualTo("MT730");
                assertThat(saved.getResponseDueDate()).isEqualTo(LocalDate.now().plusDays(5));
            }

            @Test
            @DisplayName("No debe configurar espera si no hay responseConfig")
            void shouldNotConfigureAwaitingWhenNoConfig() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ISSUED");
                EventTypeConfigReadModel eventConfig = createEventConfig("ADVISE", "ADVISED", null, "MT710");

                setupMocksForEventExecution(operation, eventConfig);
                when(responseConfigRepository.findBySentMessageTypeAndOperationTypeAndLanguageAndIsActiveTrue(
                        anyString(), anyString(), anyString())).thenReturn(Optional.empty());

                ExecuteEventCommand command = createCommand("LCI-2025-001", "ADVISE", Map.of());

                // Act
                service.executeEvent(command);

                // Assert
                verify(operationRepository).save(operationCaptor.capture());
                // When no response config, awaitingResponse remains false (not set to true)
                assertThat(operationCaptor.getValue().getAwaitingResponse()).isFalse();
            }
        }

        @Nested
        @DisplayName("2.3 Marcar Respuesta Recibida")
        class MarkResponseReceived {

            @Test
            @DisplayName("Debe limpiar campos de espera al recibir respuesta correcta")
            void shouldClearAwaitingFieldsOnCorrectResponse() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ADVISED");
                operation.setAwaitingResponse(true);
                operation.setAwaitingMessageType("MT730");
                operation.setResponseDueDate(LocalDate.now().plusDays(3));

                when(operationRepository.findByOperationId("LCI-2025-001")).thenReturn(Optional.of(operation));
                when(operationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

                // Act
                service.markResponseReceived("LCI-2025-001", "MT730");

                // Assert
                verify(operationRepository).save(operationCaptor.capture());
                OperationReadModel saved = operationCaptor.getValue();

                assertThat(saved.getAwaitingResponse()).isFalse();
                assertThat(saved.getAwaitingMessageType()).isNull();
                assertThat(saved.getResponseDueDate()).isNull();
            }

            @Test
            @DisplayName("Debe actualizar summary después de marcar respuesta")
            void shouldUpdateSummaryAfterMarkingResponse() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ADVISED");
                operation.setAwaitingResponse(true);
                operation.setAwaitingMessageType("MT730");

                when(operationRepository.findByOperationId("LCI-2025-001")).thenReturn(Optional.of(operation));
                when(operationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

                // Act
                service.markResponseReceived("LCI-2025-001", "MT730");

                // Assert
                verify(operationAnalyzerService).updateAndPersistSummary("LCI-2025-001");
            }
        }
    }

    // ==================================================================================
    // 3. OPERACIÓN - Registro de mensajes SWIFT y flujos completos
    // ==================================================================================

    @Nested
    @Order(3)
    @DisplayName("3. OPERACIÓN - Registro de Mensajes SWIFT")
    class OperationTests {

        @Nested
        @DisplayName("3.1 Registro de Mensajes SWIFT")
        class SwiftMessageRegistration {

            @Test
            @DisplayName("Debe registrar mensaje SWIFT cuando evento tiene outboundMessageType")
            void shouldRegisterSwiftMessageWhenOutboundMessageType() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ADVISED");
                EventTypeConfigReadModel eventConfig = createEventConfig("AMEND", null, null, "MT707");

                setupMocksForEventExecution(operation, eventConfig);
                when(swiftFieldConfigRepository.findFieldsWithDraftMapping("MT707"))
                        .thenReturn(createFieldConfigs());

                ExecuteEventCommand command = createCommand("LCI-2025-001", "AMEND",
                        Map.of("expiryDate", "20250119", "amount", "150000"));

                // Act
                service.executeEvent(command);

                // Assert
                verify(swiftMessageRepository).save(swiftMessageCaptor.capture());
                SwiftMessageReadModel saved = swiftMessageCaptor.getValue();

                assertThat(saved.getMessageType()).isEqualTo("MT707");
                assertThat(saved.getDirection()).isEqualTo("OUTBOUND");
                assertThat(saved.getOperationId()).isEqualTo("LCI-2025-001");
                assertThat(saved.getTriggeredByEvent()).isEqualTo("AMEND");
                assertThat(saved.getStatus()).isEqualTo("SENT");
            }

            @Test
            @DisplayName("No debe registrar mensaje SWIFT si evento no tiene outboundMessageType")
            void shouldNotRegisterSwiftMessageWhenNoOutboundType() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ADVISED");
                EventTypeConfigReadModel eventConfig = createEventConfig("INTERNAL_NOTE", null, null, null);

                setupMocksForEventExecution(operation, eventConfig);

                ExecuteEventCommand command = createCommand("LCI-2025-001", "INTERNAL_NOTE", Map.of());

                // Act
                service.executeEvent(command);

                // Assert
                verify(swiftMessageRepository, never()).save(any());
            }

            @Test
            @DisplayName("Debe usar swift_field_config para mapear campos a códigos SWIFT")
            void shouldUseFieldConfigForMapping() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ADVISED");
                EventTypeConfigReadModel eventConfig = createEventConfig("AMEND", null, null, "MT707");

                List<SwiftFieldConfig> fieldConfigs = List.of(
                        createSwiftFieldConfig(":31D:", "expiryDate"),
                        createSwiftFieldConfig(":32B:", "amount")
                );

                setupMocksForEventExecution(operation, eventConfig);
                when(swiftFieldConfigRepository.findFieldsWithDraftMapping("MT707")).thenReturn(fieldConfigs);

                ExecuteEventCommand command = createCommand("LCI-2025-001", "AMEND",
                        Map.of("expiryDate", "20250119"));

                // Act
                service.executeEvent(command);

                // Assert
                verify(swiftMessageRepository).save(swiftMessageCaptor.capture());
                String swiftContent = swiftMessageCaptor.getValue().getSwiftContent();

                assertThat(swiftContent).contains(":31D:20250119");
            }

            @Test
            @DisplayName("Debe manejar campos en formato SWIFT directo (ej: 31D)")
            void shouldHandleDirectSwiftCodeFormat() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ADVISED");
                EventTypeConfigReadModel eventConfig = createEventConfig("AMEND", null, null, "MT707");

                setupMocksForEventExecution(operation, eventConfig);
                when(swiftFieldConfigRepository.findFieldsWithDraftMapping("MT707")).thenReturn(List.of());

                // Usar código SWIFT directo como clave
                ExecuteEventCommand command = createCommand("LCI-2025-001", "AMEND",
                        Map.of("31D", "20250119"));

                // Act
                service.executeEvent(command);

                // Assert
                verify(swiftMessageRepository).save(swiftMessageCaptor.capture());
                String swiftContent = swiftMessageCaptor.getValue().getSwiftContent();

                assertThat(swiftContent).contains(":31D:20250119");
            }

            @Test
            @DisplayName("Debe incluir referencia en mensaje SWIFT")
            void shouldIncludeReferenceInSwiftMessage() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ADVISED");
                operation.setReference("REF-LCI-2025-001");
                EventTypeConfigReadModel eventConfig = createEventConfig("AMEND", null, null, "MT707");

                setupMocksForEventExecution(operation, eventConfig);
                when(swiftFieldConfigRepository.findFieldsWithDraftMapping("MT707")).thenReturn(List.of());

                ExecuteEventCommand command = createCommand("LCI-2025-001", "AMEND", Map.of());

                // Act
                service.executeEvent(command);

                // Assert
                verify(swiftMessageRepository).save(swiftMessageCaptor.capture());
                String swiftContent = swiftMessageCaptor.getValue().getSwiftContent();

                assertThat(swiftContent).contains(":20:REF-LCI-2025-001");
                assertThat(swiftContent).contains(":21:REF-LCI-2025-001");
            }
        }

        @Nested
        @DisplayName("3.2 Configuración de Respuesta en Mensaje")
        class MessageResponseConfig {

            @Test
            @DisplayName("Debe marcar mensaje como expectsResponse cuando hay configuración")
            void shouldMarkMessageAsExpectsResponse() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ISSUED");
                EventTypeConfigReadModel eventConfig = createEventConfig("ADVISE", "ADVISED", null, "MT710");
                SwiftResponseConfigReadModel responseConfig = SwiftResponseConfigReadModel.builder()
                        .expectedResponseType("MT730")
                        .expectedResponseDays(5)
                        .build();

                setupMocksForEventExecution(operation, eventConfig);
                // Note: swiftFieldConfigRepository stub is already set by setupMocksForEventExecution
                when(responseConfigRepository.findBySentMessageTypeAndOperationTypeAndLanguageAndIsActiveTrue(
                        "MT710", "LC_IMPORT", "en")).thenReturn(Optional.of(responseConfig));

                ExecuteEventCommand command = createCommand("LCI-2025-001", "ADVISE", Map.of());

                // Act
                service.executeEvent(command);

                // Assert
                verify(swiftMessageRepository).save(swiftMessageCaptor.capture());
                SwiftMessageReadModel saved = swiftMessageCaptor.getValue();

                assertThat(saved.getExpectsResponse()).isTrue();
                assertThat(saved.getExpectedResponseType()).isEqualTo("MT730");
                assertThat(saved.getResponseDueDate()).isEqualTo(LocalDate.now().plusDays(5));
            }
        }
    }

    // ==================================================================================
    // 4. REGRESIÓN - Garantizar que funcionalidad existente sigue funcionando
    // ==================================================================================

    @Nested
    @Order(4)
    @DisplayName("4. REGRESIÓN - Funcionalidad Existente")
    class RegressionTests {

        @Nested
        @DisplayName("4.1 Flujo Básico de Eventos")
        class BasicEventFlow {

            @Test
            @DisplayName("Evento simple sin mensaje SWIFT debe funcionar")
            void simpleEventWithoutSwiftShouldWork() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ADVISED");
                EventTypeConfigReadModel eventConfig = createEventConfig("ADD_NOTE", null, null, null);

                setupMocksForEventExecution(operation, eventConfig);

                ExecuteEventCommand command = createCommand("LCI-2025-001", "ADD_NOTE",
                        Map.of("note", "Nota de prueba"));

                // Act
                OperationQueryDTO result = service.executeEvent(command);

                // Assert
                assertThat(result).isNotNull();
                verify(operationRepository).save(any());
                verify(swiftMessageRepository, never()).save(any());
            }

            @Test
            @DisplayName("Evento con cambio de etapa debe preservar otros campos")
            void eventShouldPreserveOtherFields() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ISSUED");
                operation.setCurrency("USD");
                operation.setAmount(new BigDecimal("100000"));
                operation.setApplicantName("Test Applicant");
                operation.setBeneficiaryName("Test Beneficiary");

                EventTypeConfigReadModel eventConfig = createEventConfig("ADVISE", "ADVISED", null, null);

                setupMocksForEventExecution(operation, eventConfig);

                ExecuteEventCommand command = createCommand("LCI-2025-001", "ADVISE", Map.of());

                // Act
                service.executeEvent(command);

                // Assert
                verify(operationRepository).save(operationCaptor.capture());
                OperationReadModel saved = operationCaptor.getValue();

                // Campos originales preservados
                assertThat(saved.getCurrency()).isEqualTo("USD");
                assertThat(saved.getAmount()).isEqualByComparingTo(new BigDecimal("100000"));
                assertThat(saved.getApplicantName()).isEqualTo("Test Applicant");
                assertThat(saved.getBeneficiaryName()).isEqualTo("Test Beneficiary");
                // Etapa cambiada
                assertThat(saved.getStage()).isEqualTo("ADVISED");
            }

            @Test
            @DisplayName("Múltiples eventos secuenciales deben funcionar")
            void sequentialEventsShouldWork() {
                // Arrange - Primer evento
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ISSUED");
                EventTypeConfigReadModel adviseConfig = createEventConfig("ADVISE", "ADVISED", null, null);

                when(operationRepository.findByOperationId("LCI-2025-001")).thenReturn(Optional.of(operation));
                when(eventTypeRepository.findByEventCodeAndOperationTypeAndLanguage("ADVISE", "LC_IMPORT", "en"))
                        .thenReturn(Optional.of(adviseConfig));
                when(operationRepository.save(any())).thenAnswer(inv -> {
                    OperationReadModel op = inv.getArgument(0);
                    op.setStage("ADVISED");
                    return op;
                });
                when(eventLogRepository.getNextSequenceNumber(anyString())).thenReturn(1);

                // Act - Primer evento
                ExecuteEventCommand adviseCommand = createCommand("LCI-2025-001", "ADVISE", Map.of());
                service.executeEvent(adviseCommand);

                // Arrange - Segundo evento
                operation.setStage("ADVISED");
                EventTypeConfigReadModel confirmConfig = createEventConfig("CONFIRM", "CONFIRMED", null, null);
                confirmConfig.setValidFromStages(List.of("ADVISED"));

                when(eventTypeRepository.findByEventCodeAndOperationTypeAndLanguage("CONFIRM", "LC_IMPORT", "en"))
                        .thenReturn(Optional.of(confirmConfig));
                when(eventLogRepository.getNextSequenceNumber(anyString())).thenReturn(2);

                // Act - Segundo evento
                ExecuteEventCommand confirmCommand = createCommand("LCI-2025-001", "CONFIRM", Map.of());
                service.executeEvent(confirmCommand);

                // Assert
                verify(operationRepository, times(2)).save(any());
            }
        }

        @Nested
        @DisplayName("4.2 Compatibilidad con Diferentes Tipos de Operación")
        class OperationTypeCompatibility {

            @ParameterizedTest
            @DisplayName("Debe funcionar con diferentes tipos de producto")
            @CsvSource({
                    "LC_IMPORT, MT700",
                    "LC_EXPORT, MT710",
                    "GUARANTEE, MT760"
            })
            void shouldWorkWithDifferentProductTypes(String productType, String messageType) {
                // Arrange
                OperationReadModel operation = OperationReadModel.builder()
                        .operationId("OP-2025-001")
                        .productType(productType)
                        .messageType(messageType)
                        .stage("ISSUED")
                        .status("ACTIVE")
                        .reference("REF-001")
                        .amendmentCount(0)
                        .messageCount(1)
                        .build();

                EventTypeConfigReadModel eventConfig = EventTypeConfigReadModel.builder()
                        .eventCode("ADVISE")
                        .operationType(productType)
                        .validFromStages(List.of("ISSUED"))
                        .resultingStage("ADVISED")
                        .language("en")
                        .build();

                when(operationRepository.findByOperationId("OP-2025-001")).thenReturn(Optional.of(operation));
                when(eventTypeRepository.findByEventCodeAndOperationTypeAndLanguage("ADVISE", productType, "en"))
                        .thenReturn(Optional.of(eventConfig));
                when(operationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
                when(eventLogRepository.getNextSequenceNumber(anyString())).thenReturn(1);

                ExecuteEventCommand command = createCommand("OP-2025-001", "ADVISE", Map.of());

                // Act
                OperationQueryDTO result = service.executeEvent(command);

                // Assert
                assertThat(result).isNotNull();
            }
        }

        @Nested
        @DisplayName("4.3 Manejo de Errores")
        class ErrorHandling {

            @Test
            @DisplayName("Debe manejar error en updateAndPersistSummary sin fallar")
            void shouldHandleSummaryUpdateError() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ISSUED");
                EventTypeConfigReadModel eventConfig = createEventConfig("ADVISE", "ADVISED", null, null);

                setupMocksForEventExecution(operation, eventConfig);
                doThrow(new RuntimeException("Summary error"))
                        .when(operationAnalyzerService).updateAndPersistSummary(anyString());

                ExecuteEventCommand command = createCommand("LCI-2025-001", "ADVISE", Map.of());

                // Act - No debe lanzar excepción
                OperationQueryDTO result = service.executeEvent(command);

                // Assert
                assertThat(result).isNotNull();
                verify(operationRepository).save(any()); // Operación guardada
            }

            @Test
            @DisplayName("Debe propagar error en registro de mensaje SWIFT")
            void shouldPropagateSwiftMessageRegistrationError() {
                // Arrange
                OperationReadModel operation = createOperation("LCI-2025-001", "LC_IMPORT", "ISSUED");
                EventTypeConfigReadModel eventConfig = createEventConfig("ADVISE", "ADVISED", null, "MT710");

                when(operationRepository.findByOperationId("LCI-2025-001")).thenReturn(Optional.of(operation));
                when(eventTypeRepository.findByEventCodeAndOperationTypeAndLanguage("ADVISE", "LC_IMPORT", "en"))
                        .thenReturn(Optional.of(eventConfig));
                when(operationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
                // Note: swiftFieldConfigRepository throws before eventLogRepository is called
                when(swiftFieldConfigRepository.findFieldsWithDraftMapping(anyString()))
                        .thenThrow(new RuntimeException("DB Error"));

                ExecuteEventCommand command = createCommand("LCI-2025-001", "ADVISE", Map.of());

                // Act & Assert - El error se propaga
                assertThatThrownBy(() -> service.executeEvent(command))
                        .isInstanceOf(RuntimeException.class)
                        .hasMessageContaining("DB Error");
            }
        }
    }

    // ==================================================================================
    // MÉTODOS AUXILIARES
    // ==================================================================================

    private OperationReadModel createOperation(String operationId, String productType, String stage) {
        return OperationReadModel.builder()
                .operationId(operationId)
                .productType(productType)
                .messageType("MT700")
                .reference("REF-" + operationId)
                .stage(stage)
                .status("ACTIVE")
                .currency("USD")
                .amount(new BigDecimal("100000"))
                .issueDate(LocalDate.now())
                .expiryDate(LocalDate.now().plusMonths(3))
                .issuingBankBic("ISSUBANK")
                .advisingBankBic("ADVBANK")
                .amendmentCount(0)
                .messageCount(1)
                .createdAt(LocalDateTime.now())
                .modifiedAt(LocalDateTime.now())
                .build();
    }

    private EventTypeConfigReadModel createEventConfig(String eventCode, String resultingStage,
                                                         String resultingStatus, String outboundMessageType) {
        return EventTypeConfigReadModel.builder()
                .eventCode(eventCode)
                .operationType("LC_IMPORT")
                .validFromStages(List.of("ISSUED", "ADVISED", "CONFIRMED"))
                .resultingStage(resultingStage)
                .resultingStatus(resultingStatus)
                .outboundMessageType(outboundMessageType)
                .language("en")
                .build();
    }

    private ExecuteEventCommand createCommand(String operationId, String eventCode, Map<String, Object> eventData) {
        return ExecuteEventCommand.builder()
                .operationId(operationId)
                .eventCode(eventCode)
                .executedBy("user@test.com")
                .eventData(eventData)
                .build();
    }

    private void setupMocksForEventExecution(OperationReadModel operation, EventTypeConfigReadModel eventConfig) {
        when(operationRepository.findByOperationId(operation.getOperationId())).thenReturn(Optional.of(operation));
        when(eventTypeRepository.findByEventCodeAndOperationTypeAndLanguage(
                eventConfig.getEventCode(), operation.getProductType(), "en"))
                .thenReturn(Optional.of(eventConfig));
        when(operationRepository.save(any(OperationReadModel.class))).thenAnswer(inv -> inv.getArgument(0));
        when(eventLogRepository.getNextSequenceNumber(operation.getOperationId())).thenReturn(1);

        if (eventConfig.getOutboundMessageType() != null) {
            when(swiftFieldConfigRepository.findFieldsWithDraftMapping(eventConfig.getOutboundMessageType()))
                    .thenReturn(Collections.emptyList());
        }
    }

    private List<SwiftFieldConfig> createFieldConfigs() {
        return List.of(
                createSwiftFieldConfig(":31D:", "expiryDate"),
                createSwiftFieldConfig(":32B:", "currency,amount"),
                createSwiftFieldConfig(":44C:", "latestShipmentDate")
        );
    }

    private SwiftFieldConfig createSwiftFieldConfig(String fieldCode, String draftFieldMapping) {
        return SwiftFieldConfig.builder()
                .id(UUID.randomUUID().toString())
                .fieldCode(fieldCode)
                .draftFieldMapping(draftFieldMapping)
                .messageType("MT707")
                .isActive(true)
                .build();
    }
}
