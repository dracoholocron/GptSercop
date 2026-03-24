package com.globalcmx.api.service;

import com.globalcmx.api.dto.event.CotizacionEvent;
import com.globalcmx.api.readmodel.entity.CotizacionReadModel;
import com.globalcmx.api.readmodel.projection.CotizacionProjection;
import com.globalcmx.api.readmodel.repository.CotizacionReadModelRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para CotizacionProjection.
 *
 * Detecta:
 * - Errores en el mapeo de campos del evento al read model
 * - Valores de compra/venta incorrectos
 * - Manejo de cotizaciones no encontradas en UPDATED (debe crear nueva)
 * - Estrategia de delete (hard delete via repository.delete)
 * - Versioning incorrecto
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CotizacionProjection - Pruebas Unitarias")
class CotizacionProjectionTest {

    @Mock
    private CotizacionReadModelRepository repository;

    @InjectMocks
    private CotizacionProjection projection;

    // ==================== EVENTO CREATED ====================

    @Test
    @DisplayName("handleCreated - debe crear cotización con todos los campos")
    void handleCreated_shouldCreateReadModelWithAllFields() {
        LocalDate fecha = LocalDate.of(2025, 6, 15);
        CotizacionEvent event = CotizacionEvent.builder()
                .eventType(CotizacionEvent.EventType.CREATED)
                .cotizacionId(1L)
                .codigoMoneda("USD")
                .fecha(fecha)
                .valorCompra(new BigDecimal("35.500000"))
                .valorVenta(new BigDecimal("36.200000"))
                .performedBy("admin")
                .build();

        projection.handleCotizacionEvent(event);

        ArgumentCaptor<CotizacionReadModel> captor = ArgumentCaptor.forClass(CotizacionReadModel.class);
        verify(repository).save(captor.capture());

        CotizacionReadModel saved = captor.getValue();
        assertThat(saved.getId()).isEqualTo(1L);
        assertThat(saved.getCodigoMoneda()).isEqualTo("USD");
        assertThat(saved.getFecha()).isEqualTo(fecha);
        assertThat(saved.getValorCompra()).isEqualByComparingTo(new BigDecimal("35.500000"));
        assertThat(saved.getValorVenta()).isEqualByComparingTo(new BigDecimal("36.200000"));
        assertThat(saved.getCreatedBy()).isEqualTo("admin");
        assertThat(saved.getVersion()).isEqualTo(1L);
    }

    @Test
    @DisplayName("handleCreated - debe setear createdAt y updatedAt a LocalDateTime.now()")
    void handleCreated_shouldSetTimestamps() {
        CotizacionEvent event = CotizacionEvent.builder()
                .eventType(CotizacionEvent.EventType.CREATED)
                .cotizacionId(2L)
                .codigoMoneda("EUR")
                .fecha(LocalDate.now())
                .valorCompra(new BigDecimal("1.0"))
                .valorVenta(new BigDecimal("1.1"))
                .performedBy("system")
                .build();

        projection.handleCotizacionEvent(event);

        ArgumentCaptor<CotizacionReadModel> captor = ArgumentCaptor.forClass(CotizacionReadModel.class);
        verify(repository).save(captor.capture());

        CotizacionReadModel saved = captor.getValue();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("handleCreated - valor compra debe ser menor que valor venta (validación lógica)")
    void handleCreated_buyRateShouldBeLessThanSellRate() {
        BigDecimal buyRate = new BigDecimal("35.50");
        BigDecimal sellRate = new BigDecimal("36.20");

        CotizacionEvent event = CotizacionEvent.builder()
                .eventType(CotizacionEvent.EventType.CREATED)
                .cotizacionId(3L)
                .codigoMoneda("USD")
                .fecha(LocalDate.now())
                .valorCompra(buyRate)
                .valorVenta(sellRate)
                .performedBy("admin")
                .build();

        projection.handleCotizacionEvent(event);

        ArgumentCaptor<CotizacionReadModel> captor = ArgumentCaptor.forClass(CotizacionReadModel.class);
        verify(repository).save(captor.capture());

        // Validar que buy < sell (regla de negocio)
        assertThat(captor.getValue().getValorCompra())
                .isLessThan(captor.getValue().getValorVenta());
    }

    // ==================== EVENTO UPDATED ====================

    @Test
    @DisplayName("handleUpdated - debe actualizar cotización existente")
    void handleUpdated_shouldUpdateExistingCotizacion() {
        CotizacionReadModel existing = CotizacionReadModel.builder()
                .id(1L)
                .codigoMoneda("USD")
                .fecha(LocalDate.of(2025, 6, 15))
                .valorCompra(new BigDecimal("35.50"))
                .valorVenta(new BigDecimal("36.20"))
                .version(1L)
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        CotizacionEvent event = CotizacionEvent.builder()
                .eventType(CotizacionEvent.EventType.UPDATED)
                .cotizacionId(1L)
                .codigoMoneda("USD")
                .fecha(LocalDate.of(2025, 6, 15))
                .valorCompra(new BigDecimal("35.80"))
                .valorVenta(new BigDecimal("36.50"))
                .performedBy("admin")
                .build();

        projection.handleCotizacionEvent(event);

        verify(repository).save(existing);
        assertThat(existing.getValorCompra()).isEqualByComparingTo(new BigDecimal("35.80"));
        assertThat(existing.getValorVenta()).isEqualByComparingTo(new BigDecimal("36.50"));
        assertThat(existing.getUpdatedBy()).isEqualTo("admin");
        assertThat(existing.getVersion()).isEqualTo(2L);
    }

    @Test
    @DisplayName("handleUpdated - si no existe, debe crear nueva (no lanzar excepción)")
    void handleUpdated_whenNotFound_shouldCreateNew() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        CotizacionEvent event = CotizacionEvent.builder()
                .eventType(CotizacionEvent.EventType.UPDATED)
                .cotizacionId(999L)
                .codigoMoneda("GBP")
                .fecha(LocalDate.now())
                .valorCompra(new BigDecimal("45.00"))
                .valorVenta(new BigDecimal("46.00"))
                .performedBy("admin")
                .build();

        // CotizacionProjection crea nueva si no existe (no lanza excepción)
        projection.handleCotizacionEvent(event);

        ArgumentCaptor<CotizacionReadModel> captor = ArgumentCaptor.forClass(CotizacionReadModel.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getCodigoMoneda()).isEqualTo("GBP");
        assertThat(captor.getValue().getVersion()).isEqualTo(1L);
    }

    // ==================== EVENTO DELETED ====================

    @Test
    @DisplayName("handleDeleted - debe hacer hard delete (repository.delete)")
    void handleDeleted_shouldHardDelete() {
        CotizacionReadModel existing = CotizacionReadModel.builder()
                .id(1L)
                .codigoMoneda("USD")
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        CotizacionEvent event = CotizacionEvent.builder()
                .eventType(CotizacionEvent.EventType.DELETED)
                .cotizacionId(1L)
                .build();

        projection.handleCotizacionEvent(event);

        // Cotizacion usa hard delete (repository.delete), NO soft delete
        verify(repository).delete(existing);
        verify(repository, never()).deleteById(any());
    }

    @Test
    @DisplayName("handleDeleted - si no existe, no debe lanzar excepción")
    void handleDeleted_whenNotFound_shouldNotThrow() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        CotizacionEvent event = CotizacionEvent.builder()
                .eventType(CotizacionEvent.EventType.DELETED)
                .cotizacionId(999L)
                .build();

        // No debe lanzar excepción
        projection.handleCotizacionEvent(event);

        verify(repository, never()).delete(any());
        verify(repository, never()).deleteById(any());
    }
}
