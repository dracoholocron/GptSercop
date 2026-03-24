package com.globalcmx.api.service;

import com.globalcmx.api.dto.event.CuentaBancariaEvent;
import com.globalcmx.api.readmodel.entity.CuentaBancariaReadModel;
import com.globalcmx.api.readmodel.projection.CuentaBancariaProjection;
import com.globalcmx.api.readmodel.repository.CuentaBancariaReadModelRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para CuentaBancariaProjection.
 *
 * Detecta:
 * - Errores en el mapeo de campos de cuenta bancaria
 * - UPDATE de cuenta no existente debe lanzar excepción
 * - DELETE usa hard delete (deleteById)
 * - Campo activo debe persistirse correctamente
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CuentaBancariaProjection - Pruebas Unitarias")
class CuentaBancariaProjectionTest {

    @Mock
    private CuentaBancariaReadModelRepository repository;

    @InjectMocks
    private CuentaBancariaProjection projection;

    // ==================== EVENTO CREATED ====================

    @Test
    @DisplayName("handleCreated - debe crear cuenta bancaria con todos los campos")
    void handleCreated_shouldCreateReadModelWithAllFields() {
        CuentaBancariaEvent event = CuentaBancariaEvent.builder()
                .eventType(CuentaBancariaEvent.EventType.CREATED)
                .cuentaBancariaId(1L)
                .identificacionParticipante("1712345678")
                .nombresParticipante("Juan Carlos")
                .apellidosParticipante("García López")
                .numeroCuenta("2200123456")
                .identificacionCuenta("BANK-001-USD")
                .tipo("AHORRO")
                .activo(true)
                .performedBy("admin")
                .build();

        projection.handleCuentaBancariaEvent(event);

        ArgumentCaptor<CuentaBancariaReadModel> captor = ArgumentCaptor.forClass(CuentaBancariaReadModel.class);
        verify(repository).save(captor.capture());

        CuentaBancariaReadModel saved = captor.getValue();
        assertThat(saved.getId()).isEqualTo(1L);
        assertThat(saved.getIdentificacionParticipante()).isEqualTo("1712345678");
        assertThat(saved.getNombresParticipante()).isEqualTo("Juan Carlos");
        assertThat(saved.getApellidosParticipante()).isEqualTo("García López");
        assertThat(saved.getNumeroCuenta()).isEqualTo("2200123456");
        assertThat(saved.getIdentificacionCuenta()).isEqualTo("BANK-001-USD");
        assertThat(saved.getTipo()).isEqualTo("AHORRO");
        assertThat(saved.getActivo()).isTrue();
        assertThat(saved.getCreatedBy()).isEqualTo("admin");
    }

    @Test
    @DisplayName("handleCreated - cuenta inactiva debe persistir activo=false")
    void handleCreated_withInactive_shouldPersistInactiveState() {
        CuentaBancariaEvent event = CuentaBancariaEvent.builder()
                .eventType(CuentaBancariaEvent.EventType.CREATED)
                .cuentaBancariaId(2L)
                .identificacionParticipante("1798765432001")
                .nombresParticipante("Empresa")
                .apellidosParticipante("ABC")
                .numeroCuenta("3300654321")
                .identificacionCuenta("BANK-002-EUR")
                .tipo("CORRIENTE")
                .activo(false)
                .performedBy("admin")
                .build();

        projection.handleCuentaBancariaEvent(event);

        ArgumentCaptor<CuentaBancariaReadModel> captor = ArgumentCaptor.forClass(CuentaBancariaReadModel.class);
        verify(repository).save(captor.capture());

        assertThat(captor.getValue().getActivo()).isFalse();
    }

    // ==================== EVENTO UPDATED ====================

    @Test
    @DisplayName("handleUpdated - debe actualizar cuenta bancaria existente")
    void handleUpdated_shouldUpdateExistingCuenta() {
        CuentaBancariaReadModel existing = CuentaBancariaReadModel.builder()
                .id(1L)
                .identificacionParticipante("1712345678")
                .nombresParticipante("Juan")
                .apellidosParticipante("García")
                .numeroCuenta("2200123456")
                .identificacionCuenta("BANK-001-USD")
                .tipo("AHORRO")
                .activo(true)
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        CuentaBancariaEvent event = CuentaBancariaEvent.builder()
                .eventType(CuentaBancariaEvent.EventType.UPDATED)
                .cuentaBancariaId(1L)
                .identificacionParticipante("1712345678")
                .nombresParticipante("Juan Carlos")
                .apellidosParticipante("García López")
                .numeroCuenta("2200123456")
                .identificacionCuenta("BANK-001-USD")
                .tipo("CORRIENTE")
                .activo(true)
                .performedBy("admin")
                .build();

        projection.handleCuentaBancariaEvent(event);

        verify(repository).save(existing);
        assertThat(existing.getNombresParticipante()).isEqualTo("Juan Carlos");
        assertThat(existing.getApellidosParticipante()).isEqualTo("García López");
        assertThat(existing.getTipo()).isEqualTo("CORRIENTE");
        assertThat(existing.getUpdatedBy()).isEqualTo("admin");
    }

    @Test
    @DisplayName("handleUpdated - si no existe, debe lanzar RuntimeException")
    void handleUpdated_whenNotFound_shouldThrowException() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        CuentaBancariaEvent event = CuentaBancariaEvent.builder()
                .eventType(CuentaBancariaEvent.EventType.UPDATED)
                .cuentaBancariaId(999L)
                .identificacionParticipante("0000000000")
                .nombresParticipante("No Existe")
                .apellidosParticipante("Test")
                .numeroCuenta("0000000000")
                .identificacionCuenta("NONE")
                .tipo("AHORRO")
                .activo(true)
                .performedBy("admin")
                .build();

        // CuentaBancariaProjection lanza excepción si no encuentra
        assertThatThrownBy(() -> projection.handleCuentaBancariaEvent(event))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("999");
    }

    @Test
    @DisplayName("handleUpdated - debe poder desactivar cuenta")
    void handleUpdated_shouldDeactivateAccount() {
        CuentaBancariaReadModel existing = CuentaBancariaReadModel.builder()
                .id(1L)
                .identificacionParticipante("1712345678")
                .nombresParticipante("Juan")
                .apellidosParticipante("García")
                .numeroCuenta("2200123456")
                .identificacionCuenta("BANK-001")
                .tipo("AHORRO")
                .activo(true)
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        CuentaBancariaEvent event = CuentaBancariaEvent.builder()
                .eventType(CuentaBancariaEvent.EventType.UPDATED)
                .cuentaBancariaId(1L)
                .identificacionParticipante("1712345678")
                .nombresParticipante("Juan")
                .apellidosParticipante("García")
                .numeroCuenta("2200123456")
                .identificacionCuenta("BANK-001")
                .tipo("AHORRO")
                .activo(false)
                .performedBy("admin")
                .build();

        projection.handleCuentaBancariaEvent(event);

        assertThat(existing.getActivo()).isFalse();
    }

    // ==================== EVENTO DELETED ====================

    @Test
    @DisplayName("handleDeleted - debe hacer hard delete (deleteById)")
    void handleDeleted_shouldHardDelete() {
        CuentaBancariaEvent event = CuentaBancariaEvent.builder()
                .eventType(CuentaBancariaEvent.EventType.DELETED)
                .cuentaBancariaId(1L)
                .performedBy("admin")
                .build();

        projection.handleCuentaBancariaEvent(event);

        // CuentaBancariaProjection usa hard delete (deleteById)
        verify(repository).deleteById(1L);
        verify(repository, never()).save(any());
    }

    // ==================== CONSISTENCIA ====================

    @Test
    @DisplayName("handleUpdated - todos los campos del participante deben actualizarse")
    void handleUpdated_shouldUpdateAllParticipantFields() {
        CuentaBancariaReadModel existing = CuentaBancariaReadModel.builder()
                .id(1L)
                .identificacionParticipante("OLD-ID")
                .nombresParticipante("Old Name")
                .apellidosParticipante("Old Last")
                .numeroCuenta("OLD-NUM")
                .identificacionCuenta("OLD-IDENT")
                .tipo("AHORRO")
                .activo(true)
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        CuentaBancariaEvent event = CuentaBancariaEvent.builder()
                .eventType(CuentaBancariaEvent.EventType.UPDATED)
                .cuentaBancariaId(1L)
                .identificacionParticipante("NEW-ID")
                .nombresParticipante("New Name")
                .apellidosParticipante("New Last")
                .numeroCuenta("NEW-NUM")
                .identificacionCuenta("NEW-IDENT")
                .tipo("CORRIENTE")
                .activo(false)
                .performedBy("updater")
                .build();

        projection.handleCuentaBancariaEvent(event);

        assertThat(existing.getIdentificacionParticipante()).isEqualTo("NEW-ID");
        assertThat(existing.getNombresParticipante()).isEqualTo("New Name");
        assertThat(existing.getApellidosParticipante()).isEqualTo("New Last");
        assertThat(existing.getNumeroCuenta()).isEqualTo("NEW-NUM");
        assertThat(existing.getIdentificacionCuenta()).isEqualTo("NEW-IDENT");
        assertThat(existing.getTipo()).isEqualTo("CORRIENTE");
        assertThat(existing.getActivo()).isFalse();
        assertThat(existing.getUpdatedBy()).isEqualTo("updater");
    }
}
