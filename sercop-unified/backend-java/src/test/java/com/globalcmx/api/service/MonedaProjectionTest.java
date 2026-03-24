package com.globalcmx.api.service;

import com.globalcmx.api.dto.event.MonedaEvent;
import com.globalcmx.api.readmodel.entity.MonedaReadModel;
import com.globalcmx.api.readmodel.projection.MonedaProjection;
import com.globalcmx.api.readmodel.repository.MonedaReadModelRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para MonedaProjection.
 *
 * Detecta:
 * - Errores en el mapeo de campos del evento al read model
 * - Comportamiento incorrecto en soft delete vs hard delete
 * - Manejo de monedas no encontradas en UPDATED (debe crear nueva)
 * - Versioning incorrecto
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MonedaProjection - Pruebas Unitarias")
class MonedaProjectionTest {

    @Mock
    private MonedaReadModelRepository repository;

    @InjectMocks
    private MonedaProjection projection;

    // ==================== EVENTO CREATED ====================

    @Test
    @DisplayName("handleCreated - debe crear moneda en read model con todos los campos")
    void handleCreated_shouldCreateReadModelWithAllFields() {
        LocalDateTime now = LocalDateTime.now();
        MonedaEvent event = MonedaEvent.builder()
                .eventType(MonedaEvent.EventType.CREATED)
                .monedaId(1L)
                .codigo("USD")
                .nombre("Dólar Estadounidense")
                .simbolo("$")
                .activo(true)
                .timestamp(now)
                .performedBy("admin")
                .build();

        projection.handleMonedaEvent(event);

        ArgumentCaptor<MonedaReadModel> captor = ArgumentCaptor.forClass(MonedaReadModel.class);
        verify(repository).save(captor.capture());

        MonedaReadModel saved = captor.getValue();
        assertThat(saved.getId()).isEqualTo(1L);
        assertThat(saved.getCodigo()).isEqualTo("USD");
        assertThat(saved.getNombre()).isEqualTo("Dólar Estadounidense");
        assertThat(saved.getSimbolo()).isEqualTo("$");
        assertThat(saved.getActivo()).isTrue();
        assertThat(saved.getCreatedBy()).isEqualTo("admin");
        assertThat(saved.getVersion()).isEqualTo(1L);
    }

    @Test
    @DisplayName("handleCreated - debe usar timestamp del evento como createdAt y updatedAt")
    void handleCreated_shouldUseEventTimestamp() {
        LocalDateTime eventTime = LocalDateTime.of(2025, 1, 15, 10, 30);
        MonedaEvent event = MonedaEvent.builder()
                .eventType(MonedaEvent.EventType.CREATED)
                .monedaId(2L)
                .codigo("EUR")
                .nombre("Euro")
                .simbolo("€")
                .activo(true)
                .timestamp(eventTime)
                .performedBy("system")
                .build();

        projection.handleMonedaEvent(event);

        ArgumentCaptor<MonedaReadModel> captor = ArgumentCaptor.forClass(MonedaReadModel.class);
        verify(repository).save(captor.capture());

        MonedaReadModel saved = captor.getValue();
        assertThat(saved.getCreatedAt()).isEqualTo(eventTime);
        assertThat(saved.getUpdatedAt()).isEqualTo(eventTime);
    }

    @Test
    @DisplayName("handleCreated - moneda inactiva debe persistir activo=false")
    void handleCreated_withInactive_shouldPersistInactiveState() {
        MonedaEvent event = MonedaEvent.builder()
                .eventType(MonedaEvent.EventType.CREATED)
                .monedaId(3L)
                .codigo("VEF")
                .nombre("Bolívar")
                .simbolo("Bs")
                .activo(false)
                .timestamp(LocalDateTime.now())
                .performedBy("admin")
                .build();

        projection.handleMonedaEvent(event);

        ArgumentCaptor<MonedaReadModel> captor = ArgumentCaptor.forClass(MonedaReadModel.class);
        verify(repository).save(captor.capture());

        assertThat(captor.getValue().getActivo()).isFalse();
    }

    // ==================== EVENTO UPDATED ====================

    @Test
    @DisplayName("handleUpdated - debe actualizar moneda existente")
    void handleUpdated_shouldUpdateExistingMoneda() {
        MonedaReadModel existing = MonedaReadModel.builder()
                .id(1L)
                .codigo("USD")
                .nombre("Dolar")
                .simbolo("$")
                .activo(true)
                .version(1L)
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        MonedaEvent event = MonedaEvent.builder()
                .eventType(MonedaEvent.EventType.UPDATED)
                .monedaId(1L)
                .codigo("USD")
                .nombre("Dólar Estadounidense")
                .simbolo("US$")
                .activo(true)
                .performedBy("admin")
                .build();

        projection.handleMonedaEvent(event);

        verify(repository).save(existing);
        assertThat(existing.getNombre()).isEqualTo("Dólar Estadounidense");
        assertThat(existing.getSimbolo()).isEqualTo("US$");
        assertThat(existing.getUpdatedBy()).isEqualTo("admin");
        assertThat(existing.getVersion()).isEqualTo(2L);
    }

    @Test
    @DisplayName("handleUpdated - si no existe, debe crear nueva (no lanzar excepción)")
    void handleUpdated_whenNotFound_shouldCreateNew() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        MonedaEvent event = MonedaEvent.builder()
                .eventType(MonedaEvent.EventType.UPDATED)
                .monedaId(999L)
                .codigo("GBP")
                .nombre("Libra Esterlina")
                .simbolo("£")
                .activo(true)
                .timestamp(LocalDateTime.now())
                .performedBy("admin")
                .build();

        // MonedaProjection crea nueva si no existe (no lanza excepción)
        projection.handleMonedaEvent(event);

        ArgumentCaptor<MonedaReadModel> captor = ArgumentCaptor.forClass(MonedaReadModel.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getCodigo()).isEqualTo("GBP");
        assertThat(captor.getValue().getVersion()).isEqualTo(1L);
    }

    @Test
    @DisplayName("handleUpdated - debe incrementar versión")
    void handleUpdated_shouldIncrementVersion() {
        MonedaReadModel existing = MonedaReadModel.builder()
                .id(1L)
                .codigo("USD")
                .nombre("Dolar")
                .version(5L)
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        MonedaEvent event = MonedaEvent.builder()
                .eventType(MonedaEvent.EventType.UPDATED)
                .monedaId(1L)
                .codigo("USD")
                .nombre("Dolar Updated")
                .performedBy("admin")
                .build();

        projection.handleMonedaEvent(event);

        assertThat(existing.getVersion()).isEqualTo(6L);
    }

    // ==================== EVENTO DELETED ====================

    @Test
    @DisplayName("handleDeleted - debe hacer soft delete (activo=false), NO hard delete")
    void handleDeleted_shouldSoftDelete() {
        MonedaReadModel existing = MonedaReadModel.builder()
                .id(1L)
                .codigo("USD")
                .nombre("Dolar")
                .activo(true)
                .version(1L)
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        MonedaEvent event = MonedaEvent.builder()
                .eventType(MonedaEvent.EventType.DELETED)
                .monedaId(1L)
                .performedBy("admin")
                .build();

        projection.handleMonedaEvent(event);

        // Debe ser soft delete: activo=false, NO deleteById
        verify(repository).save(existing);
        verify(repository, never()).deleteById(any());
        verify(repository, never()).delete(any());
        assertThat(existing.getActivo()).isFalse();
        assertThat(existing.getUpdatedBy()).isEqualTo("admin");
        assertThat(existing.getVersion()).isEqualTo(2L);
    }

    @Test
    @DisplayName("handleDeleted - si no existe, no debe lanzar excepción")
    void handleDeleted_whenNotFound_shouldNotThrow() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        MonedaEvent event = MonedaEvent.builder()
                .eventType(MonedaEvent.EventType.DELETED)
                .monedaId(999L)
                .performedBy("admin")
                .build();

        // No debe lanzar excepción
        projection.handleMonedaEvent(event);

        verify(repository, never()).save(any());
        verify(repository, never()).deleteById(any());
    }
}
