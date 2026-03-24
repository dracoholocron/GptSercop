package com.globalcmx.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.globalcmx.api.dto.command.CreateBankAccountCommand;
import com.globalcmx.api.dto.event.CuentaBancariaEvent;
import com.globalcmx.api.entity.CuentaBancaria;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.entity.CuentaBancariaReadModel;
import com.globalcmx.api.readmodel.repository.CuentaBancariaReadModelRepository;
import com.globalcmx.api.service.command.CuentaBancariaCommandService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para CuentaBancariaCommandService.
 *
 * Detecta:
 * - Topic incorrecto en la publicación de eventos
 * - Validación de identificacionCuenta única faltante
 * - Publisher opcional no manejado
 * - Aggregate type incorrecto en Event Store
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CuentaBancariaCommandService - Pruebas Unitarias")
class CuentaBancariaCommandServiceTest {

    @Mock private EventStoreService eventStoreService;
    @Mock private CuentaBancariaReadModelRepository readModelRepository;
    @Mock private GenericEventPublisher<CuentaBancariaEvent> eventPublisher;

    private CuentaBancariaCommandService commandService;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        commandService = new CuentaBancariaCommandService(eventStoreService, readModelRepository, objectMapper);
        try {
            var field = CuentaBancariaCommandService.class.getDeclaredField("eventPublisher");
            field.setAccessible(true);
            field.set(commandService, eventPublisher);
        } catch (Exception e) {
            throw new RuntimeException("Failed to inject eventPublisher", e);
        }
    }

    // ==================== CREATE ====================

    @Test
    @DisplayName("create - debe guardar evento y publicar al topic correcto")
    void create_shouldSaveEventAndPublishToCorrectTopic() {
        when(readModelRepository.findByIdentificacionCuenta("BANK-001-USD"))
                .thenReturn(Optional.empty());

        CreateBankAccountCommand command = CreateBankAccountCommand.builder()
                .identificacionParticipante("1712345678")
                .nombresParticipante("Juan Carlos")
                .apellidosParticipante("García")
                .numeroCuenta("2200123456")
                .identificacionCuenta("BANK-001-USD")
                .tipo("AHORRO")
                .activo(true)
                .createdBy("admin")
                .build();

        CuentaBancaria result = commandService.createCuentaBancaria(command);

        assertThat(result).isNotNull();
        assertThat(result.getNumeroCuenta()).isEqualTo("2200123456");

        // Verificar Event Store
        verify(eventStoreService).saveEvent(
                contains("CUENTA_BANCARIA-"),
                eq("CUENTA_BANCARIA"),
                eq("CUENTA_BANCARIA_CREATED"),
                any(),
                eq("admin")
        );

        // Verificar topic correcto
        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        verify(eventPublisher).publish(topicCaptor.capture(), anyString(), any(CuentaBancariaEvent.class));
        assertThat(topicCaptor.getValue()).isEqualTo("cuenta-bancaria-events");
    }

    @Test
    @DisplayName("create - debe rechazar identificacionCuenta duplicada")
    void create_withDuplicateIdentification_shouldThrowException() {
        CuentaBancariaReadModel existing = CuentaBancariaReadModel.builder()
                .id(1L)
                .identificacionCuenta("BANK-001-USD")
                .build();

        when(readModelRepository.findByIdentificacionCuenta("BANK-001-USD"))
                .thenReturn(Optional.of(existing));

        CreateBankAccountCommand command = CreateBankAccountCommand.builder()
                .identificacionParticipante("1712345678")
                .nombresParticipante("Test")
                .numeroCuenta("0000000")
                .identificacionCuenta("BANK-001-USD")
                .tipo("AHORRO")
                .activo(true)
                .build();

        assertThatThrownBy(() -> commandService.createCuentaBancaria(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("BANK-001-USD");
    }

    @Test
    @DisplayName("create - sin publisher debe funcionar sin publicar")
    void create_withoutPublisher_shouldWorkWithoutPublishing() {
        try {
            var field = CuentaBancariaCommandService.class.getDeclaredField("eventPublisher");
            field.setAccessible(true);
            field.set(commandService, null);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        when(readModelRepository.findByIdentificacionCuenta("BANK-NO-PUB"))
                .thenReturn(Optional.empty());

        CreateBankAccountCommand command = CreateBankAccountCommand.builder()
                .identificacionParticipante("9999999999")
                .nombresParticipante("Test")
                .apellidosParticipante("NoPub")
                .numeroCuenta("0000001")
                .identificacionCuenta("BANK-NO-PUB")
                .tipo("CORRIENTE")
                .activo(true)
                .createdBy("admin")
                .build();

        CuentaBancaria result = commandService.createCuentaBancaria(command);

        assertThat(result).isNotNull();
        verify(eventStoreService).saveEvent(anyString(), anyString(), anyString(), any(), any());
        verifyNoInteractions(eventPublisher);
    }

    // ==================== DELETE ====================

    @Test
    @DisplayName("delete - debe publicar evento de eliminación al topic correcto")
    void delete_shouldPublishDeleteEventToCorrectTopic() {
        Long id = 100L;
        String aggregateId = "CUENTA_BANCARIA-" + id;

        EventStoreEntity createdEvent = new EventStoreEntity();
        createdEvent.setEventType("CUENTA_BANCARIA_CREATED");
        createdEvent.setEventData("{\"cuentaBancariaId\":100,\"identificacionParticipante\":\"1712345678\",\"nombresParticipante\":\"Juan\",\"apellidosParticipante\":\"Garcia\",\"numeroCuenta\":\"2200123456\",\"identificacionCuenta\":\"BANK-001\",\"tipo\":\"AHORRO\",\"activo\":true,\"performedBy\":\"admin\",\"eventType\":\"CUENTA_BANCARIA_CREATED\",\"timestamp\":[2025,1,1,0,0,0]}");

        when(eventStoreService.getEvents(aggregateId)).thenReturn(List.of(createdEvent));

        commandService.deleteCuentaBancaria(id, "admin");

        verify(eventPublisher).publish(
                eq("cuenta-bancaria-events"),
                eq(id.toString()),
                argThat(event -> event.getEventType() == CuentaBancariaEvent.EventType.DELETED)
        );
    }

    @Test
    @DisplayName("delete - debe fallar si no existe la cuenta")
    void delete_whenNotFound_shouldThrowException() {
        when(eventStoreService.getEvents("CUENTA_BANCARIA-999")).thenReturn(List.of());

        assertThatThrownBy(() -> commandService.deleteCuentaBancaria(999L, "admin"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
