package com.globalcmx.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.globalcmx.api.dto.command.CreateCurrencyCommand;
import com.globalcmx.api.dto.event.MonedaEvent;
import com.globalcmx.api.entity.Moneda;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.messaging.GenericEventPublisher;
import com.globalcmx.api.readmodel.repository.MonedaReadModelRepository;
import com.globalcmx.api.service.command.MonedaCommandService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para MonedaCommandService.
 *
 * Detecta:
 * - Topic incorrecto en la publicación de eventos
 * - Validación de código único faltante
 * - Publisher opcional no manejado (NullPointerException)
 * - Aggregate type incorrecto en Event Store
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MonedaCommandService - Pruebas Unitarias")
class MonedaCommandServiceTest {

    @Mock private EventStoreService eventStoreService;
    @Mock private MonedaReadModelRepository readModelRepository;
    @Mock private GenericEventPublisher<MonedaEvent> eventPublisher;

    private MonedaCommandService commandService;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        commandService = new MonedaCommandService(eventStoreService, readModelRepository, objectMapper);
        try {
            var field = MonedaCommandService.class.getDeclaredField("eventPublisher");
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
        when(readModelRepository.existsByCodigo("USD")).thenReturn(false);

        CreateCurrencyCommand command = CreateCurrencyCommand.builder()
                .codigo("USD")
                .nombre("Dólar Estadounidense")
                .simbolo("$")
                .activo(true)
                .createdBy("admin")
                .build();

        Moneda result = commandService.createMoneda(command);

        assertThat(result).isNotNull();
        assertThat(result.getCodigo()).isEqualTo("USD");
        assertThat(result.getNombre()).isEqualTo("Dólar Estadounidense");

        // Verificar Event Store
        verify(eventStoreService).saveEvent(
                contains("MONEDA-"),
                eq("MONEDA"),
                eq("MONEDA_CREATED"),
                any(),
                eq("admin")
        );

        // Verificar topic correcto
        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        verify(eventPublisher).publish(topicCaptor.capture(), anyString(), any(MonedaEvent.class));
        assertThat(topicCaptor.getValue()).isEqualTo("moneda-events");
    }

    @Test
    @DisplayName("create - debe rechazar código duplicado")
    void create_withDuplicateCode_shouldThrowException() {
        when(readModelRepository.existsByCodigo("USD")).thenReturn(true);

        CreateCurrencyCommand command = CreateCurrencyCommand.builder()
                .codigo("USD")
                .nombre("Dólar")
                .build();

        assertThatThrownBy(() -> commandService.createMoneda(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("USD");
    }

    @Test
    @DisplayName("create - sin publisher debe funcionar sin publicar")
    void create_withoutPublisher_shouldWorkWithoutPublishing() {
        try {
            var field = MonedaCommandService.class.getDeclaredField("eventPublisher");
            field.setAccessible(true);
            field.set(commandService, null);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        when(readModelRepository.existsByCodigo("EUR")).thenReturn(false);

        CreateCurrencyCommand command = CreateCurrencyCommand.builder()
                .codigo("EUR")
                .nombre("Euro")
                .simbolo("€")
                .activo(true)
                .createdBy("admin")
                .build();

        Moneda result = commandService.createMoneda(command);

        assertThat(result).isNotNull();
        verify(eventStoreService).saveEvent(anyString(), anyString(), anyString(), any(), any());
        verifyNoInteractions(eventPublisher);
    }

    @Test
    @DisplayName("create - activo debe ser true por defecto si es null")
    void create_withNullActivo_shouldDefaultToTrue() {
        when(readModelRepository.existsByCodigo("GBP")).thenReturn(false);

        CreateCurrencyCommand command = CreateCurrencyCommand.builder()
                .codigo("GBP")
                .nombre("Libra Esterlina")
                .activo(null)
                .createdBy("admin")
                .build();

        Moneda result = commandService.createMoneda(command);

        assertThat(result.getActivo()).isTrue();
    }

    // ==================== DELETE ====================

    @Test
    @DisplayName("delete - debe fallar si no existe la moneda")
    void delete_whenNotFound_shouldThrowException() {
        when(eventStoreService.getEvents("MONEDA-999")).thenReturn(List.of());

        assertThatThrownBy(() -> commandService.deleteMoneda(999L, "admin"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
