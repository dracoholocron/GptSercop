package com.globalcmx.api.service;

import com.globalcmx.api.dto.event.ParticipanteEvent;
import com.globalcmx.api.readmodel.entity.ParticipanteReadModel;
import com.globalcmx.api.readmodel.projection.ParticipanteProjection;
import com.globalcmx.api.readmodel.repository.ParticipanteReadModelRepository;
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
 * Pruebas unitarias para ParticipanteProjection.
 *
 * Detecta:
 * - Errores en el mapeo de campos (identificación, ejecutivo, agencia, etc.)
 * - UPDATE de participante no existente debe lanzar excepción (a diferencia de Moneda/Cotizacion)
 * - DELETE usa hard delete (deleteById)
 * - Campos de ejecutivo y autenticador deben persistirse correctamente
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ParticipanteProjection - Pruebas Unitarias")
class ParticipanteProjectionTest {

    @Mock
    private ParticipanteReadModelRepository repository;

    @InjectMocks
    private ParticipanteProjection projection;

    // ==================== EVENTO CREATED ====================

    @Test
    @DisplayName("handleCreated - debe crear participante con todos los campos")
    void handleCreated_shouldCreateReadModelWithAllFields() {
        ParticipanteEvent event = ParticipanteEvent.builder()
                .eventType(ParticipanteEvent.EventType.CREATED)
                .participanteId(1L)
                .identificacion("1712345678")
                .tipo("IMPORTADOR")
                .tipoReferencia("RUC")
                .nombres("Juan Carlos")
                .apellidos("García López")
                .email("juan@empresa.com")
                .telefono("0991234567")
                .direccion("Av. 10 de Agosto N45-12")
                .agencia("Quito Norte")
                .ejecutivoAsignado("María Pérez")
                .ejecutivoId("exec-001")
                .correoEjecutivo("maria@banco.com")
                .autenticador("LDAP")
                .performedBy("admin")
                .build();

        projection.handleParticipanteEvent(event);

        ArgumentCaptor<ParticipanteReadModel> captor = ArgumentCaptor.forClass(ParticipanteReadModel.class);
        verify(repository).save(captor.capture());

        ParticipanteReadModel saved = captor.getValue();
        assertThat(saved.getId()).isEqualTo(1L);
        assertThat(saved.getIdentificacion()).isEqualTo("1712345678");
        assertThat(saved.getTipo()).isEqualTo("IMPORTADOR");
        assertThat(saved.getTipoReferencia()).isEqualTo("RUC");
        assertThat(saved.getNombres()).isEqualTo("Juan Carlos");
        assertThat(saved.getApellidos()).isEqualTo("García López");
        assertThat(saved.getEmail()).isEqualTo("juan@empresa.com");
        assertThat(saved.getTelefono()).isEqualTo("0991234567");
        assertThat(saved.getDireccion()).isEqualTo("Av. 10 de Agosto N45-12");
        assertThat(saved.getAgencia()).isEqualTo("Quito Norte");
        assertThat(saved.getEjecutivoAsignado()).isEqualTo("María Pérez");
        assertThat(saved.getEjecutivoId()).isEqualTo("exec-001");
        assertThat(saved.getCorreoEjecutivo()).isEqualTo("maria@banco.com");
        assertThat(saved.getAutenticador()).isEqualTo("LDAP");
        assertThat(saved.getCreatedBy()).isEqualTo("admin");
    }

    @Test
    @DisplayName("handleCreated - debe funcionar con campos opcionales nulos")
    void handleCreated_withNullOptionalFields_shouldWork() {
        ParticipanteEvent event = ParticipanteEvent.builder()
                .eventType(ParticipanteEvent.EventType.CREATED)
                .participanteId(2L)
                .identificacion("1798765432001")
                .tipo("EXPORTADOR")
                .nombres("Empresa ABC")
                .apellidos("")
                .email("info@abc.com")
                .performedBy("admin")
                .build();

        projection.handleParticipanteEvent(event);

        ArgumentCaptor<ParticipanteReadModel> captor = ArgumentCaptor.forClass(ParticipanteReadModel.class);
        verify(repository).save(captor.capture());

        ParticipanteReadModel saved = captor.getValue();
        assertThat(saved.getTelefono()).isNull();
        assertThat(saved.getDireccion()).isNull();
        assertThat(saved.getAgencia()).isNull();
        assertThat(saved.getEjecutivoAsignado()).isNull();
    }

    // ==================== EVENTO UPDATED ====================

    @Test
    @DisplayName("handleUpdated - debe actualizar participante existente")
    void handleUpdated_shouldUpdateExistingParticipante() {
        ParticipanteReadModel existing = ParticipanteReadModel.builder()
                .id(1L)
                .identificacion("1712345678")
                .tipo("IMPORTADOR")
                .nombres("Juan")
                .apellidos("García")
                .email("juan@old.com")
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        ParticipanteEvent event = ParticipanteEvent.builder()
                .eventType(ParticipanteEvent.EventType.UPDATED)
                .participanteId(1L)
                .identificacion("1712345678")
                .tipo("IMPORTADOR")
                .nombres("Juan Carlos")
                .apellidos("García López")
                .email("juan@new.com")
                .telefono("0991234567")
                .agencia("Guayaquil")
                .ejecutivoAsignado("Pedro Muñoz")
                .ejecutivoId("exec-002")
                .correoEjecutivo("pedro@banco.com")
                .autenticador("OAUTH")
                .performedBy("admin")
                .build();

        projection.handleParticipanteEvent(event);

        verify(repository).save(existing);
        assertThat(existing.getNombres()).isEqualTo("Juan Carlos");
        assertThat(existing.getApellidos()).isEqualTo("García López");
        assertThat(existing.getEmail()).isEqualTo("juan@new.com");
        assertThat(existing.getAgencia()).isEqualTo("Guayaquil");
        assertThat(existing.getEjecutivoAsignado()).isEqualTo("Pedro Muñoz");
        assertThat(existing.getCorreoEjecutivo()).isEqualTo("pedro@banco.com");
        assertThat(existing.getAutenticador()).isEqualTo("OAUTH");
        assertThat(existing.getUpdatedBy()).isEqualTo("admin");
    }

    @Test
    @DisplayName("handleUpdated - si no existe, debe lanzar RuntimeException")
    void handleUpdated_whenNotFound_shouldThrowException() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        ParticipanteEvent event = ParticipanteEvent.builder()
                .eventType(ParticipanteEvent.EventType.UPDATED)
                .participanteId(999L)
                .identificacion("0000000000")
                .tipo("IMPORTADOR")
                .nombres("No Existe")
                .apellidos("Test")
                .email("no@existe.com")
                .performedBy("admin")
                .build();

        // ParticipanteProjection lanza excepción si no encuentra (a diferencia de MonedaProjection)
        assertThatThrownBy(() -> projection.handleParticipanteEvent(event))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("999");
    }

    // ==================== EVENTO DELETED ====================

    @Test
    @DisplayName("handleDeleted - debe hacer hard delete (deleteById)")
    void handleDeleted_shouldHardDelete() {
        ParticipanteEvent event = ParticipanteEvent.builder()
                .eventType(ParticipanteEvent.EventType.DELETED)
                .participanteId(1L)
                .performedBy("admin")
                .build();

        projection.handleParticipanteEvent(event);

        // ParticipanteProjection usa hard delete (deleteById)
        verify(repository).deleteById(1L);
        verify(repository, never()).save(any());
    }

    // ==================== CONSISTENCIA ====================

    @Test
    @DisplayName("handleUpdated - todos los campos del ejecutivo deben actualizarse")
    void handleUpdated_shouldUpdateAllExecutiveFields() {
        ParticipanteReadModel existing = ParticipanteReadModel.builder()
                .id(1L)
                .identificacion("1712345678")
                .tipo("IMPORTADOR")
                .nombres("Test")
                .apellidos("Test")
                .email("test@test.com")
                .ejecutivoAsignado("Viejo Ejecutivo")
                .ejecutivoId("old-exec")
                .correoEjecutivo("old@banco.com")
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        ParticipanteEvent event = ParticipanteEvent.builder()
                .eventType(ParticipanteEvent.EventType.UPDATED)
                .participanteId(1L)
                .identificacion("1712345678")
                .tipo("IMPORTADOR")
                .nombres("Test")
                .apellidos("Test")
                .email("test@test.com")
                .ejecutivoAsignado("Nuevo Ejecutivo")
                .ejecutivoId("new-exec")
                .correoEjecutivo("new@banco.com")
                .performedBy("admin")
                .build();

        projection.handleParticipanteEvent(event);

        // Todos los campos de ejecutivo deben actualizarse juntos
        assertThat(existing.getEjecutivoAsignado()).isEqualTo("Nuevo Ejecutivo");
        assertThat(existing.getEjecutivoId()).isEqualTo("new-exec");
        assertThat(existing.getCorreoEjecutivo()).isEqualTo("new@banco.com");
    }
}
