package com.globalcmx.api.service;

import com.globalcmx.api.dto.event.FinancialInstitutionEvent;
import com.globalcmx.api.readmodel.entity.FinancialInstitutionReadModel;
import com.globalcmx.api.readmodel.enums.FinancialInstitutionType;
import com.globalcmx.api.readmodel.projection.FinancialInstitutionProjection;
import com.globalcmx.api.readmodel.repository.FinancialInstitutionReadModelRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
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
 * Pruebas unitarias para FinancialInstitutionProjection.
 *
 * Estas pruebas verifican que la proyección procesa correctamente los eventos
 * del bus de mensajes y actualiza el Read Model.
 *
 * Detecta:
 * - Mismatch entre tipos enviados por el frontend y el enum del backend
 * - Errores en el procesamiento de eventos CREATED, UPDATED, DELETED
 * - Manejo de valores nulos
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FinancialInstitutionProjection - Pruebas Unitarias")
class FinancialInstitutionProjectionTest {

    @Mock
    private FinancialInstitutionReadModelRepository repository;

    @InjectMocks
    private FinancialInstitutionProjection projection;

    // ==================== TIPOS DEL FRONTEND ====================

    /**
     * Verifica que TODOS los tipos que envía el frontend son valores válidos del enum.
     * Esta prueba habría detectado el bug BANCO vs BANCO_COMERCIAL.
     */
    @ParameterizedTest(name = "El tipo \"{0}\" del frontend debe ser un valor válido del enum")
    @ValueSource(strings = {"BANCO", "CORRESPONSAL", "FINTECH"})
    @DisplayName("Los tipos del frontend deben existir en FinancialInstitutionType")
    void frontendTypes_shouldBeValidEnumValues(String frontendType) {
        FinancialInstitutionType type = FinancialInstitutionType.valueOf(frontendType);
        assertThat(type).isNotNull();
        assertThat(type.name()).isEqualTo(frontendType);
    }

    /**
     * Verifica que los tipos legacy también son válidos.
     */
    @ParameterizedTest(name = "El tipo legacy \"{0}\" debe ser un valor válido del enum")
    @ValueSource(strings = {"BANCO_COMERCIAL", "BANCO_CORRESPONSAL", "BANCO_CENTRAL", "INSTITUCION_FINANCIERA"})
    @DisplayName("Los tipos legacy deben seguir existiendo en FinancialInstitutionType")
    void legacyTypes_shouldBeValidEnumValues(String legacyType) {
        FinancialInstitutionType type = FinancialInstitutionType.valueOf(legacyType);
        assertThat(type).isNotNull();
    }

    // ==================== EVENTO CREATED ====================

    @Test
    @DisplayName("handleCreated - debe crear institución en read model con tipo BANCO")
    void handleCreated_withTipoBANCO_shouldCreateReadModel() {
        FinancialInstitutionEvent event = buildCreatedEvent(1L, "001", "Banco Test", "BANCO");

        projection.handleFinancialInstitutionEvent(event);

        ArgumentCaptor<FinancialInstitutionReadModel> captor = ArgumentCaptor.forClass(FinancialInstitutionReadModel.class);
        verify(repository).save(captor.capture());

        FinancialInstitutionReadModel saved = captor.getValue();
        assertThat(saved.getId()).isEqualTo(1L);
        assertThat(saved.getCodigo()).isEqualTo("001");
        assertThat(saved.getNombre()).isEqualTo("Banco Test");
        assertThat(saved.getTipo()).isEqualTo(FinancialInstitutionType.BANCO);
        assertThat(saved.getActivo()).isTrue();
    }

    @Test
    @DisplayName("handleCreated - debe crear institución con tipo CORRESPONSAL")
    void handleCreated_withTipoCORRESPONSAL_shouldCreateReadModel() {
        FinancialInstitutionEvent event = buildCreatedEvent(2L, "002", "Corresponsal Test", "CORRESPONSAL");

        projection.handleFinancialInstitutionEvent(event);

        ArgumentCaptor<FinancialInstitutionReadModel> captor = ArgumentCaptor.forClass(FinancialInstitutionReadModel.class);
        verify(repository).save(captor.capture());

        assertThat(captor.getValue().getTipo()).isEqualTo(FinancialInstitutionType.CORRESPONSAL);
    }

    @Test
    @DisplayName("handleCreated - debe crear institución con tipo FINTECH")
    void handleCreated_withTipoFINTECH_shouldCreateReadModel() {
        FinancialInstitutionEvent event = buildCreatedEvent(3L, "003", "Fintech Test", "FINTECH");

        projection.handleFinancialInstitutionEvent(event);

        ArgumentCaptor<FinancialInstitutionReadModel> captor = ArgumentCaptor.forClass(FinancialInstitutionReadModel.class);
        verify(repository).save(captor.capture());

        assertThat(captor.getValue().getTipo()).isEqualTo(FinancialInstitutionType.FINTECH);
    }

    @Test
    @DisplayName("handleCreated - debe setear todos los campos correctamente")
    void handleCreated_shouldSetAllFieldsCorrectly() {
        FinancialInstitutionEvent event = FinancialInstitutionEvent.builder()
                .eventType(FinancialInstitutionEvent.EventType.CREATED)
                .institucionId(10L)
                .codigo("BNK-001")
                .nombre("Banco Nacional")
                .swiftCode("BNECECLX")
                .pais("Ecuador")
                .ciudad("Guayaquil")
                .direccion("Av. 9 de Octubre 100")
                .tipo("BANCO")
                .rating("AA+")
                .esCorresponsal(true)
                .activo(true)
                .timestamp(LocalDateTime.now())
                .performedBy("admin")
                .build();

        projection.handleFinancialInstitutionEvent(event);

        ArgumentCaptor<FinancialInstitutionReadModel> captor = ArgumentCaptor.forClass(FinancialInstitutionReadModel.class);
        verify(repository).save(captor.capture());

        FinancialInstitutionReadModel saved = captor.getValue();
        assertThat(saved.getCodigo()).isEqualTo("BNK-001");
        assertThat(saved.getNombre()).isEqualTo("Banco Nacional");
        assertThat(saved.getSwiftCode()).isEqualTo("BNECECLX");
        assertThat(saved.getPais()).isEqualTo("Ecuador");
        assertThat(saved.getCiudad()).isEqualTo("Guayaquil");
        assertThat(saved.getDireccion()).isEqualTo("Av. 9 de Octubre 100");
        assertThat(saved.getRating()).isEqualTo("AA+");
        assertThat(saved.getEsCorresponsal()).isTrue();
        assertThat(saved.getAggregateId()).isEqualTo("INSTITUCION_FINANCIERA-10");
    }

    // ==================== EVENTO UPDATED ====================

    @Test
    @DisplayName("handleUpdated - debe actualizar institución existente")
    void handleUpdated_shouldUpdateExistingInstitution() {
        FinancialInstitutionReadModel existing = FinancialInstitutionReadModel.builder()
                .id(1L)
                .codigo("001")
                .nombre("Banco Viejo")
                .tipo(FinancialInstitutionType.BANCO)
                .activo(true)
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        FinancialInstitutionEvent event = FinancialInstitutionEvent.builder()
                .eventType(FinancialInstitutionEvent.EventType.UPDATED)
                .institucionId(1L)
                .codigo("001")
                .nombre("Banco Actualizado")
                .tipo("CORRESPONSAL")
                .activo(true)
                .pais("Ecuador")
                .ciudad("Quito")
                .build();

        projection.handleFinancialInstitutionEvent(event);

        verify(repository).save(existing);
        assertThat(existing.getNombre()).isEqualTo("Banco Actualizado");
        assertThat(existing.getTipo()).isEqualTo(FinancialInstitutionType.CORRESPONSAL);
        assertThat(existing.getCiudad()).isEqualTo("Quito");
    }

    @Test
    @DisplayName("handleUpdated - debe lanzar excepción si no existe la institución")
    void handleUpdated_whenNotFound_shouldThrowException() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        FinancialInstitutionEvent event = FinancialInstitutionEvent.builder()
                .eventType(FinancialInstitutionEvent.EventType.UPDATED)
                .institucionId(999L)
                .tipo("BANCO")
                .build();

        assertThatThrownBy(() -> projection.handleFinancialInstitutionEvent(event))
                .isInstanceOf(RuntimeException.class);
    }

    // ==================== EVENTO DELETED ====================

    @Test
    @DisplayName("handleDeleted - debe eliminar institución del read model")
    void handleDeleted_shouldDeleteFromReadModel() {
        FinancialInstitutionEvent event = FinancialInstitutionEvent.builder()
                .eventType(FinancialInstitutionEvent.EventType.DELETED)
                .institucionId(1L)
                .build();

        projection.handleFinancialInstitutionEvent(event);

        verify(repository).deleteById(1L);
    }

    // ==================== TIPO INVÁLIDO ====================

    @Test
    @DisplayName("handleCreated - debe fallar con tipo inválido")
    void handleCreated_withInvalidType_shouldThrowException() {
        FinancialInstitutionEvent event = buildCreatedEvent(1L, "001", "Test", "TIPO_INEXISTENTE");

        assertThatThrownBy(() -> projection.handleFinancialInstitutionEvent(event))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ==================== HELPERS ====================

    private FinancialInstitutionEvent buildCreatedEvent(Long id, String codigo, String nombre, String tipo) {
        return FinancialInstitutionEvent.builder()
                .eventType(FinancialInstitutionEvent.EventType.CREATED)
                .institucionId(id)
                .codigo(codigo)
                .nombre(nombre)
                .tipo(tipo)
                .activo(true)
                .esCorresponsal(false)
                .pais("Ecuador")
                .timestamp(LocalDateTime.now())
                .performedBy("test")
                .build();
    }
}
