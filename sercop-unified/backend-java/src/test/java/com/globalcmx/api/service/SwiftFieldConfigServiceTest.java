package com.globalcmx.api.service;

import com.globalcmx.api.dto.swift.SwiftFieldConfigDTO;
import com.globalcmx.api.readmodel.entity.SwiftFieldConfig;
import com.globalcmx.api.readmodel.enums.FieldType;
import com.globalcmx.api.readmodel.repository.SwiftFieldConfigRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para SwiftFieldConfigService.
 *
 * Cubre:
 * 1. Consulta de campos por versión
 * 2. Fallback cuando versión no tiene campos
 * 3. Operaciones CRUD básicas
 * 4. Activación/desactivación de campos
 *
 * @author GlobalCMX Team
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SwiftFieldConfigService - Pruebas Unitarias")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SwiftFieldConfigServiceTest {

    @Mock
    private SwiftFieldConfigRepository repository;

    private SwiftFieldConfigService service;

    // Stub simple para SwiftSpecVersionResolver
    private final SwiftSpecVersionResolver specVersionResolver = new StubSwiftSpecVersionResolver();

    @BeforeEach
    void setUp() {
        service = new SwiftFieldConfigService(repository, specVersionResolver);
    }

    // ==================== CONSULTA CON VERSIÓN ====================

    @Nested
    @DisplayName("Consulta de campos por versión específica")
    class ConsultaPorVersion {

        @Test
        @Order(1)
        @DisplayName("Debe retornar campos para versión específica")
        void debeRetornarCamposParaVersionEspecifica() {
            // Given
            List<SwiftFieldConfig> expectedFields = Arrays.asList(
                createFieldConfig(":20:", "MT700", "2024"),
                createFieldConfig(":31D:", "MT700", "2024")
            );
            when(repository.findByMessageTypeAndSpecVersionAndIsActiveOrdered(
                "MT700", "2024", true
            )).thenReturn(expectedFields);

            // When
            List<SwiftFieldConfigDTO> result = service.findAllWithVersion("MT700", true, "2024");

            // Then
            assertThat(result).hasSize(2);
            assertThat(result.get(0).getFieldCode()).isEqualTo(":20:");
            assertThat(result.get(0).getSpecVersion()).isEqualTo("2024");
            verify(repository).findByMessageTypeAndSpecVersionAndIsActiveOrdered(
                "MT700", "2024", true
            );
        }

        @Test
        @Order(2)
        @DisplayName("Debe retornar campos 2026 cuando se solicita versión 2026")
        void debeRetornarCampos2026() {
            // Given
            List<SwiftFieldConfig> fields2026 = Arrays.asList(
                createFieldConfig(":50N:", "MT700", "2026"),
                createFieldConfig(":50S:", "MT700", "2026"),
                createFieldConfig(":59N:", "MT700", "2026")
            );
            when(repository.findByMessageTypeAndSpecVersionAndIsActiveOrdered(
                "MT700", "2026", true
            )).thenReturn(fields2026);

            // When
            List<SwiftFieldConfigDTO> result = service.findAllWithVersion("MT700", true, "2026");

            // Then
            assertThat(result).hasSize(3);
            assertThat(result).extracting(SwiftFieldConfigDTO::getFieldCode)
                .containsExactly(":50N:", ":50S:", ":59N:");
            assertThat(result).allMatch(dto -> "2026".equals(dto.getSpecVersion()));
        }

        @Test
        @Order(3)
        @DisplayName("Debe hacer fallback a última versión cuando versión solicitada no tiene campos")
        void debeFallbackCuandoVersionSinCampos() {
            // Given
            when(repository.findByMessageTypeAndSpecVersionAndIsActiveOrdered(
                "MT700", "2030", true
            )).thenReturn(Collections.emptyList());

            List<SwiftFieldConfig> latestFields = Collections.singletonList(
                createFieldConfig(":20:", "MT700", "2026")
            );
            when(repository.findActiveLatestVersionByMessageType("MT700"))
                .thenReturn(latestFields);

            // When
            List<SwiftFieldConfigDTO> result = service.findAllWithVersion("MT700", true, "2030");

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getSpecVersion()).isEqualTo("2026");
            verify(repository).findActiveLatestVersionByMessageType("MT700");
        }

        @Test
        @Order(4)
        @DisplayName("Debe incluir campos inactivos cuando activeOnly es false")
        void debeIncluirCamposInactivos() {
            // Given
            List<SwiftFieldConfig> allFields = Arrays.asList(
                createFieldConfig(":20:", "MT700", "2024", true),
                createFieldConfig(":50:", "MT700", "2024", false)
            );
            when(repository.findByMessageTypeAndSpecVersionAndIsActiveOrdered(
                "MT700", "2024", false
            )).thenReturn(allFields);

            // When
            List<SwiftFieldConfigDTO> result = service.findAllWithVersion("MT700", false, "2024");

            // Then
            assertThat(result).hasSize(2);
        }
    }

    // ==================== CONSULTA SIN VERSIÓN ====================

    @Nested
    @DisplayName("Consulta de campos sin versión específica")
    class ConsultaSinVersion {

        @Test
        @Order(10)
        @DisplayName("Debe retornar todos los campos activos ordenados usando versión vigente")
        void debeRetornarCamposActivosOrdenados() {
            // Given - StubSwiftSpecVersionResolver returns "2026"
            List<SwiftFieldConfig> activeFields = Arrays.asList(
                createFieldConfig(":20:", "MT700", "2026"),
                createFieldConfig(":31C:", "MT700", "2026"),
                createFieldConfig(":31D:", "MT700", "2026")
            );
            when(repository.findByMessageTypeAndSpecVersionAndIsActiveOrdered("MT700", "2026", true))
                .thenReturn(activeFields);

            // When
            List<SwiftFieldConfigDTO> result = service.findAll("MT700", true);

            // Then
            assertThat(result).hasSize(3);
            verify(repository).findByMessageTypeAndSpecVersionAndIsActiveOrdered("MT700", "2026", true);
        }

        @Test
        @Order(11)
        @DisplayName("Debe hacer fallback a query legacy cuando versión vigente no tiene campos")
        void debeFallbackAQueryLegacy() {
            // Given
            when(repository.findByMessageTypeAndSpecVersionAndIsActiveOrdered("MT700", "2026", true))
                .thenReturn(Collections.emptyList());

            List<SwiftFieldConfig> legacyFields = Collections.singletonList(
                createFieldConfig(":20:", "MT700", "2024")
            );
            when(repository.findActiveByMessageTypeOrdered("MT700"))
                .thenReturn(legacyFields);

            // When
            List<SwiftFieldConfigDTO> result = service.findAll("MT700", true);

            // Then
            assertThat(result).hasSize(1);
            verify(repository).findActiveByMessageTypeOrdered("MT700");
        }
    }

    // ==================== CONSULTA POR ID ====================

    @Nested
    @DisplayName("Consulta por ID")
    class ConsultaPorId {

        @Test
        @Order(20)
        @DisplayName("Debe retornar campo cuando existe")
        void debeRetornarCampoCuandoExiste() {
            // Given
            String id = "uuid-123";
            SwiftFieldConfig config = createFieldConfig(":20:", "MT700", "2024");
            config.setId(id);
            when(repository.findById(id)).thenReturn(Optional.of(config));

            // When
            SwiftFieldConfigDTO result = service.findById(id);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(id);
            assertThat(result.getFieldCode()).isEqualTo(":20:");
        }

        @Test
        @Order(21)
        @DisplayName("Debe lanzar excepción cuando campo no existe")
        void debeLanzarExcepcionCuandoNoExiste() {
            // Given
            String id = "uuid-no-existe";
            when(repository.findById(id)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> service.findById(id))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("no encontrada");
        }
    }

    // ==================== CONSULTA POR CÓDIGO ====================

    @Nested
    @DisplayName("Consulta por código de campo")
    class ConsultaPorCodigo {

        @Test
        @Order(30)
        @DisplayName("Debe retornar campo por código y tipo de mensaje")
        void debeRetornarCampoPorCodigoYTipo() {
            // Given
            SwiftFieldConfig config = createFieldConfig(":20:", "MT700", "2024");
            when(repository.findLatestByFieldCodeAndMessageType(":20:", "MT700"))
                .thenReturn(Optional.of(config));

            // When
            SwiftFieldConfigDTO result = service.findByCode(":20:", "MT700");

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getFieldCode()).isEqualTo(":20:");
            assertThat(result.getMessageType()).isEqualTo("MT700");
        }

        @Test
        @Order(31)
        @DisplayName("Debe lanzar excepción cuando campo no existe")
        void debeLanzarExcepcionCuandoCampoNoExiste() {
            // Given
            when(repository.findLatestByFieldCodeAndMessageType(":99Z:", "MT700"))
                .thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> service.findByCode(":99Z:", "MT700"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("no encontrada");
        }
    }

    // ==================== CONSULTA POR SECCIÓN ====================

    @Nested
    @DisplayName("Consulta por sección")
    class ConsultaPorSeccion {

        @Test
        @Order(40)
        @DisplayName("Debe retornar campos de una sección específica")
        void debeRetornarCamposPorSeccion() {
            // Given - StubSwiftSpecVersionResolver returns "2026"
            List<SwiftFieldConfig> sectionFields = Arrays.asList(
                createFieldConfigWithSection(":32B:", "MT700", "2026", "MONTOS"),
                createFieldConfigWithSection(":39A:", "MT700", "2026", "MONTOS")
            );
            when(repository.findByMessageTypeAndSectionAndSpecVersionAndIsActiveOrderByDisplayOrder(
                "MT700", "MONTOS", "2026", true
            )).thenReturn(sectionFields);

            // When
            List<SwiftFieldConfigDTO> result = service.findBySection("MONTOS", "MT700");

            // Then
            assertThat(result).hasSize(2);
            assertThat(result).allMatch(dto -> "MONTOS".equals(dto.getSection()));
        }

        @Test
        @Order(41)
        @DisplayName("Debe hacer fallback cuando versión actual no tiene campos de sección")
        void debeFallbackCuandoVersionNoTieneCamposSeccion() {
            // Given
            when(repository.findByMessageTypeAndSectionAndSpecVersionAndIsActiveOrderByDisplayOrder(
                "MT700", "MONTOS", "2026", true
            )).thenReturn(Collections.emptyList());

            List<SwiftFieldConfig> fallbackFields = Collections.singletonList(
                createFieldConfigWithSection(":32B:", "MT700", "2024", "MONTOS")
            );
            when(repository.findByMessageTypeAndSectionAndIsActiveOrderByDisplayOrder(
                "MT700", "MONTOS", true
            )).thenReturn(fallbackFields);

            // When
            List<SwiftFieldConfigDTO> result = service.findBySection("MONTOS", "MT700");

            // Then
            assertThat(result).hasSize(1);
            verify(repository).findByMessageTypeAndSectionAndIsActiveOrderByDisplayOrder(
                "MT700", "MONTOS", true
            );
        }
    }

    // ==================== OPERACIONES DE ACTIVACIÓN ====================

    @Nested
    @DisplayName("Activación y desactivación de campos")
    class ActivacionDesactivacion {

        @Test
        @Order(50)
        @DisplayName("Debe activar un campo")
        void debeActivarCampo() {
            // Given
            String id = "uuid-123";
            SwiftFieldConfig config = createFieldConfig(":20:", "MT700", "2024");
            config.setId(id);
            config.setIsActive(false);
            when(repository.findById(id)).thenReturn(Optional.of(config));
            when(repository.save(any(SwiftFieldConfig.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            service.activate(id);

            // Then
            verify(repository).save(argThat(saved -> saved.getIsActive() == true));
        }

        @Test
        @Order(51)
        @DisplayName("Debe desactivar un campo")
        void debeDesactivarCampo() {
            // Given
            String id = "uuid-123";
            SwiftFieldConfig config = createFieldConfig(":20:", "MT700", "2024");
            config.setId(id);
            config.setIsActive(true);
            when(repository.findById(id)).thenReturn(Optional.of(config));
            when(repository.save(any(SwiftFieldConfig.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            service.deactivate(id);

            // Then
            verify(repository).save(argThat(saved -> saved.getIsActive() == false));
        }

        @Test
        @Order(52)
        @DisplayName("Debe lanzar excepción al activar campo inexistente")
        void debeLanzarExcepcionAlActivarInexistente() {
            // Given
            String id = "uuid-no-existe";
            when(repository.findById(id)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> service.activate(id))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("no encontrada");
        }
    }

    // ==================== ELIMINACIÓN ====================

    @Nested
    @DisplayName("Eliminación de campos")
    class EliminacionDeCampos {

        @Test
        @Order(60)
        @DisplayName("Debe eliminar un campo existente")
        void debeEliminarCampoExistente() {
            // Given
            String id = "uuid-123";
            when(repository.existsById(id)).thenReturn(true);

            // When
            service.delete(id);

            // Then
            verify(repository).deleteById(id);
        }

        @Test
        @Order(61)
        @DisplayName("Debe lanzar excepción al eliminar campo inexistente")
        void debeLanzarExcepcionAlEliminarInexistente() {
            // Given
            String id = "uuid-no-existe";
            when(repository.existsById(id)).thenReturn(false);

            // When/Then
            assertThatThrownBy(() -> service.delete(id))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("no encontrada");
        }
    }

    // ==================== HELPERS ====================

    private SwiftFieldConfig createFieldConfig(String fieldCode, String messageType, String specVersion) {
        return createFieldConfig(fieldCode, messageType, specVersion, true);
    }

    private SwiftFieldConfig createFieldConfig(String fieldCode, String messageType, String specVersion, boolean isActive) {
        return SwiftFieldConfig.builder()
            .id(java.util.UUID.randomUUID().toString())
            .fieldCode(fieldCode)
            .fieldNameKey("swift." + messageType.toLowerCase() + "." + fieldCode.replaceAll(":", "") + ".fieldName")
            .messageType(messageType)
            .specVersion(specVersion)
            .effectiveDate(LocalDate.of(2024, 11, 17))
            .isActive(isActive)
            .isRequired(false)
            .section("TEST")
            .displayOrder(1)
            .fieldType(FieldType.TEXT)
            .componentType("INPUT")
            .build();
    }

    private SwiftFieldConfig createFieldConfigWithSection(String fieldCode, String messageType, String specVersion, String section) {
        SwiftFieldConfig config = createFieldConfig(fieldCode, messageType, specVersion);
        config.setSection(section);
        return config;
    }

    /**
     * Stub implementation of SwiftSpecVersionResolver for testing.
     * Always returns "2026" as the current active version.
     */
    private static class StubSwiftSpecVersionResolver extends SwiftSpecVersionResolver {

        public StubSwiftSpecVersionResolver() {
            super(null, null, null);
        }

        @Override
        public String getCurrentActiveVersion() {
            return "2026";
        }

        @Override
        public String resolveSpecVersion(LocalDate referenceDate) {
            return "2026";
        }
    }
}
