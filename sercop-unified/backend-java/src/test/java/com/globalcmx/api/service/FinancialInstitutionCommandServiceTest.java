package com.globalcmx.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.command.CreateFinancialInstitutionCommand;
import com.globalcmx.api.dto.command.UpdateFinancialInstitutionCommand;
import com.globalcmx.api.dto.event.FinancialInstitutionEvent;
import com.globalcmx.api.entity.FinancialInstitution;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.repository.FinancialInstitutionReadModelRepository;
import com.globalcmx.api.service.command.FinancialInstitutionCommandService;
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
 * Pruebas unitarias para FinancialInstitutionCommandService.
 *
 * Detecta:
 * - Errores en la creación de eventos
 * - Validación de código único
 * - Publicación correcta de eventos al bus de mensajes
 * - Reconstrucción de agregados desde Event Store
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FinancialInstitutionCommandService - Pruebas Unitarias")
class FinancialInstitutionCommandServiceTest {

    @Mock private EventStoreService eventStoreService;
    @Mock private FinancialInstitutionReadModelRepository readModelRepository;
    @Mock private GenericEventPublisher<FinancialInstitutionEvent> eventPublisher;

    private FinancialInstitutionCommandService commandService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        commandService = new FinancialInstitutionCommandService(
                eventStoreService, readModelRepository, objectMapper);
        // Inyectar publisher via reflection ya que usa @Autowired(required = false)
        try {
            var field = FinancialInstitutionCommandService.class.getDeclaredField("eventPublisher");
            field.setAccessible(true);
            field.set(commandService, eventPublisher);
        } catch (Exception e) {
            throw new RuntimeException("Failed to inject eventPublisher", e);
        }
    }

    // ==================== CREATE ====================

    @Test
    @DisplayName("create - debe guardar evento y publicar al bus de mensajes")
    void create_shouldSaveEventAndPublish() {
        when(readModelRepository.findByCodigo("123")).thenReturn(Optional.empty());

        CreateFinancialInstitutionCommand command = new CreateFinancialInstitutionCommand();
        command.setCodigo("123");
        command.setNombre("Banco Test");
        command.setSwiftCode("BNECECLX");
        command.setPais("Ecuador");
        command.setTipo("BANCO");
        command.setActivo(true);
        command.setCreatedBy("admin");

        FinancialInstitution result = commandService.createInstitucionFinanciera(command);

        assertThat(result).isNotNull();
        assertThat(result.getCodigo()).isEqualTo("123");
        assertThat(result.getNombre()).isEqualTo("Banco Test");
        assertThat(result.getTipo()).isEqualTo("BANCO");

        // Verificar que se guardó el evento en Event Store
        verify(eventStoreService).saveEvent(
                contains("INSTITUCION_FINANCIERA-"),
                eq("INSTITUCION_FINANCIERA"),
                eq("INSTITUCION_FINANCIERA_CREATED"),
                any(),
                eq("admin")
        );

        // Verificar que se publicó al bus de mensajes
        verify(eventPublisher).publish(
                eq("institucion-financiera-events"),
                anyString(),
                any(FinancialInstitutionEvent.class)
        );
    }

    @Test
    @DisplayName("create - debe rechazar código duplicado")
    void create_withDuplicateCode_shouldThrowException() {
        when(readModelRepository.findByCodigo("123")).thenReturn(Optional.of(mock()));

        CreateFinancialInstitutionCommand command = new CreateFinancialInstitutionCommand();
        command.setCodigo("123");
        command.setNombre("Duplicado");
        command.setTipo("BANCO");

        assertThatThrownBy(() -> commandService.createInstitucionFinanciera(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("123");
    }

    @Test
    @DisplayName("create - debe publicar evento con topic correcto")
    void create_shouldPublishToCorrectTopic() {
        when(readModelRepository.findByCodigo("456")).thenReturn(Optional.empty());

        CreateFinancialInstitutionCommand command = new CreateFinancialInstitutionCommand();
        command.setCodigo("456");
        command.setNombre("Test");
        command.setTipo("CORRESPONSAL");
        command.setPais("EC");
        command.setCreatedBy("user1");

        commandService.createInstitucionFinanciera(command);

        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<FinancialInstitutionEvent> eventCaptor = ArgumentCaptor.forClass(FinancialInstitutionEvent.class);

        verify(eventPublisher).publish(topicCaptor.capture(), anyString(), eventCaptor.capture());

        assertThat(topicCaptor.getValue()).isEqualTo("institucion-financiera-events");
        assertThat(eventCaptor.getValue().getEventType()).isEqualTo(FinancialInstitutionEvent.EventType.CREATED);
        assertThat(eventCaptor.getValue().getTipo()).isEqualTo("CORRESPONSAL");
    }

    @Test
    @DisplayName("create - sin publisher debe funcionar sin publicar")
    void create_withoutPublisher_shouldWorkWithoutPublishing() {
        // Simular que no hay publisher (required = false)
        try {
            var field = FinancialInstitutionCommandService.class.getDeclaredField("eventPublisher");
            field.setAccessible(true);
            field.set(commandService, null);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        when(readModelRepository.findByCodigo("789")).thenReturn(Optional.empty());

        CreateFinancialInstitutionCommand command = new CreateFinancialInstitutionCommand();
        command.setCodigo("789");
        command.setNombre("Test No Publisher");
        command.setTipo("BANCO");
        command.setPais("EC");

        FinancialInstitution result = commandService.createInstitucionFinanciera(command);

        assertThat(result).isNotNull();
        verify(eventStoreService).saveEvent(anyString(), anyString(), anyString(), any(), any());
        verifyNoInteractions(eventPublisher);
    }

    @Test
    @DisplayName("create - activo debe ser true por defecto si es null")
    void create_withNullActivo_shouldDefaultToTrue() {
        when(readModelRepository.findByCodigo("DEF")).thenReturn(Optional.empty());

        CreateFinancialInstitutionCommand command = new CreateFinancialInstitutionCommand();
        command.setCodigo("DEF");
        command.setNombre("Default Test");
        command.setTipo("BANCO");
        command.setPais("EC");
        command.setActivo(null);

        FinancialInstitution result = commandService.createInstitucionFinanciera(command);

        assertThat(result.getActivo()).isTrue();
    }

    // ==================== DELETE ====================

    @Test
    @DisplayName("delete - debe publicar evento de eliminación")
    void delete_shouldPublishDeleteEvent() {
        Long id = 100L;
        String aggregateId = "INSTITUCION_FINANCIERA-" + id;

        EventStoreEntity createdEvent = new EventStoreEntity();
        createdEvent.setEventType("INSTITUCION_FINANCIERA_CREATED");
        createdEvent.setEventData("{\"institucionId\":100,\"codigo\":\"DEL\",\"nombre\":\"Delete Test\",\"tipo\":\"BANCO\",\"pais\":\"EC\",\"activo\":true,\"performedBy\":\"admin\",\"eventType\":\"INSTITUCION_FINANCIERA_CREATED\"}");

        when(eventStoreService.getEvents(aggregateId)).thenReturn(List.of(createdEvent));

        commandService.deleteInstitucionFinanciera(id, "admin");

        verify(eventPublisher).publish(
                eq("institucion-financiera-events"),
                eq(id.toString()),
                argThat(event -> event.getEventType() == FinancialInstitutionEvent.EventType.DELETED)
        );
    }

    @Test
    @DisplayName("delete - debe fallar si no existe la institución")
    void delete_whenNotFound_shouldThrowException() {
        when(eventStoreService.getEvents("INSTITUCION_FINANCIERA-999")).thenReturn(List.of());

        assertThatThrownBy(() -> commandService.deleteInstitucionFinanciera(999L, "admin"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
