package com.globalcmx.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.globalcmx.api.dto.command.CreateParticipantCommand;
import com.globalcmx.api.dto.event.ParticipanteEvent;
import com.globalcmx.api.entity.Participante;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.entity.ParticipanteReadModel;
import com.globalcmx.api.readmodel.repository.ParticipanteReadModelRepository;
import com.globalcmx.api.service.command.ParticipanteCommandService;
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
 * Pruebas unitarias para ParticipanteCommandService.
 *
 * Detecta:
 * - Topic incorrecto en la publicación de eventos
 * - Validación de duplicados por identificación + tipoReferencia
 * - Publisher opcional no manejado
 * - Aggregate type incorrecto en Event Store
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ParticipanteCommandService - Pruebas Unitarias")
class ParticipanteCommandServiceTest {

    @Mock private EventStoreService eventStoreService;
    @Mock private ParticipanteReadModelRepository readModelRepository;
    @Mock private GenericEventPublisher<ParticipanteEvent> eventPublisher;

    private ParticipanteCommandService commandService;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        commandService = new ParticipanteCommandService(eventStoreService, readModelRepository, objectMapper);
        try {
            var field = ParticipanteCommandService.class.getDeclaredField("eventPublisher");
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
        when(readModelRepository.findByIdentificacionAndTipoReferencia("1712345678", "RUC"))
                .thenReturn(Optional.empty());

        CreateParticipantCommand command = new CreateParticipantCommand();
        command.setIdentificacion("1712345678");
        command.setTipo("IMPORTADOR");
        command.setTipoReferencia("RUC");
        command.setNombres("Juan Carlos");
        command.setApellidos("García");
        command.setEmail("juan@empresa.com");
        command.setCreatedBy("admin");

        Participante result = commandService.createParticipante(command);

        assertThat(result).isNotNull();
        assertThat(result.getIdentificacion()).isEqualTo("1712345678");

        // Verificar Event Store
        verify(eventStoreService).saveEvent(
                contains("PARTICIPANTE-"),
                eq("PARTICIPANTE"),
                eq("PARTICIPANTE_CREATED"),
                any(),
                eq("admin")
        );

        // Verificar topic correcto
        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        verify(eventPublisher).publish(topicCaptor.capture(), anyString(), any(ParticipanteEvent.class));
        assertThat(topicCaptor.getValue()).isEqualTo("participante-events");
    }

    @Test
    @DisplayName("create - debe rechazar identificación + tipoReferencia duplicados")
    void create_withDuplicateIdentification_shouldThrowException() {
        ParticipanteReadModel existing = ParticipanteReadModel.builder()
                .id(1L)
                .identificacion("1712345678")
                .tipoReferencia("RUC")
                .build();

        when(readModelRepository.findByIdentificacionAndTipoReferencia("1712345678", "RUC"))
                .thenReturn(Optional.of(existing));

        CreateParticipantCommand command = new CreateParticipantCommand();
        command.setIdentificacion("1712345678");
        command.setTipoReferencia("RUC");
        command.setTipo("IMPORTADOR");
        command.setNombres("Duplicado");
        command.setApellidos("Test");
        command.setEmail("dup@test.com");

        assertThatThrownBy(() -> commandService.createParticipante(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("1712345678");
    }

    @Test
    @DisplayName("create - sin publisher debe funcionar sin publicar")
    void create_withoutPublisher_shouldWorkWithoutPublishing() {
        try {
            var field = ParticipanteCommandService.class.getDeclaredField("eventPublisher");
            field.setAccessible(true);
            field.set(commandService, null);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        when(readModelRepository.findByIdentificacionAndTipoReferencia("9999999999", "CEDULA"))
                .thenReturn(Optional.empty());

        CreateParticipantCommand command = new CreateParticipantCommand();
        command.setIdentificacion("9999999999");
        command.setTipo("EXPORTADOR");
        command.setTipoReferencia("CEDULA");
        command.setNombres("Test");
        command.setApellidos("NoPublisher");
        command.setEmail("no@pub.com");
        command.setCreatedBy("admin");

        Participante result = commandService.createParticipante(command);

        assertThat(result).isNotNull();
        verify(eventStoreService).saveEvent(anyString(), anyString(), anyString(), any(), any());
        verifyNoInteractions(eventPublisher);
    }

    // ==================== DELETE ====================

    @Test
    @DisplayName("delete - debe publicar evento de eliminación al topic correcto")
    void delete_shouldPublishDeleteEventToCorrectTopic() {
        Long id = 100L;
        String aggregateId = "PARTICIPANTE-" + id;

        EventStoreEntity createdEvent = new EventStoreEntity();
        createdEvent.setEventType("PARTICIPANTE_CREATED");
        createdEvent.setEventData("{\"participanteId\":100,\"identificacion\":\"1712345678\",\"tipo\":\"IMPORTADOR\",\"tipoReferencia\":\"RUC\",\"nombres\":\"Juan\",\"apellidos\":\"Garcia\",\"email\":\"j@g.com\",\"performedBy\":\"admin\",\"eventType\":\"PARTICIPANTE_CREATED\",\"timestamp\":[2025,1,1,0,0,0]}");

        when(eventStoreService.getEvents(aggregateId)).thenReturn(List.of(createdEvent));

        commandService.deleteParticipante(id, "admin");

        verify(eventPublisher).publish(
                eq("participante-events"),
                eq(id.toString()),
                argThat(event -> event.getEventType() == ParticipanteEvent.EventType.DELETED)
        );
    }

    @Test
    @DisplayName("delete - debe fallar si no existe el participante")
    void delete_whenNotFound_shouldThrowException() {
        when(eventStoreService.getEvents("PARTICIPANTE-999")).thenReturn(List.of());

        assertThatThrownBy(() -> commandService.deleteParticipante(999L, "admin"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
