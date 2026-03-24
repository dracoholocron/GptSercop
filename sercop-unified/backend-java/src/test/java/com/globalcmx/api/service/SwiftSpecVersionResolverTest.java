package com.globalcmx.api.service;

import com.globalcmx.api.readmodel.entity.CatalogoPersonalizadoReadModel;
import com.globalcmx.api.readmodel.entity.SwiftFieldConfig;
import com.globalcmx.api.readmodel.repository.CatalogoPersonalizadoReadModelRepository;
import com.globalcmx.api.readmodel.repository.SwiftFieldConfigRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para SwiftSpecVersionResolver.
 *
 * Cubre:
 * 1. Override de versión via catálogo
 * 2. Obtención de campos por versión
 * 3. Fallback cuando no hay datos
 * 4. Versiones disponibles
 *
 * Nota: Las pruebas de resolución por fecha que requieren JdbcTemplate
 * se cubren en pruebas de integración debido a limitaciones de Mockito con Java 25.
 *
 * @author GlobalCMX Team
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SwiftSpecVersionResolver - Pruebas Unitarias")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SwiftSpecVersionResolverTest {

    @Mock
    private SwiftFieldConfigRepository fieldConfigRepository;

    @Mock
    private CatalogoPersonalizadoReadModelRepository catalogoRepository;

    private SwiftSpecVersionResolver resolver;

    @BeforeEach
    void setUp() {
        // Pass null for JdbcTemplate since we test override scenarios which don't use it
        resolver = new SwiftSpecVersionResolver(fieldConfigRepository, catalogoRepository, null);
    }

    // ==================== OVERRIDE VIA CATÁLOGO ====================

    @Nested
    @DisplayName("Override de versión via catálogo")
    class OverrideViaCatalogo {

        @Test
        @Order(10)
        @DisplayName("Debe retornar override cuando catálogo está activo con valor")
        void debeRetornarOverrideCuandoCatalogoActivoConValor() {
            // Given
            CatalogoPersonalizadoReadModel catalogo = CatalogoPersonalizadoReadModel.builder()
                .codigo("SWIFT_SPEC_VERSION_OVERRIDE")
                .nombre("2026")
                .activo(true)
                .build();
            when(catalogoRepository.findByCodigo("SWIFT_SPEC_VERSION_OVERRIDE"))
                .thenReturn(Optional.of(catalogo));

            // When
            Optional<String> override = resolver.getConfiguredVersionOverride();

            // Then
            assertThat(override).isPresent();
            assertThat(override.get()).isEqualTo("2026");
        }

        @Test
        @Order(11)
        @DisplayName("Debe retornar empty cuando catálogo está inactivo")
        void debeRetornarEmptyCuandoCatalogoInactivo() {
            // Given
            CatalogoPersonalizadoReadModel catalogo = CatalogoPersonalizadoReadModel.builder()
                .codigo("SWIFT_SPEC_VERSION_OVERRIDE")
                .nombre("2026")
                .activo(false)
                .build();
            when(catalogoRepository.findByCodigo("SWIFT_SPEC_VERSION_OVERRIDE"))
                .thenReturn(Optional.of(catalogo));

            // When
            Optional<String> override = resolver.getConfiguredVersionOverride();

            // Then
            assertThat(override).isEmpty();
        }

        @Test
        @Order(12)
        @DisplayName("Debe retornar empty cuando nombre está vacío")
        void debeRetornarEmptyCuandoNombreVacio() {
            // Given
            CatalogoPersonalizadoReadModel catalogo = CatalogoPersonalizadoReadModel.builder()
                .codigo("SWIFT_SPEC_VERSION_OVERRIDE")
                .nombre("")
                .activo(true)
                .build();
            when(catalogoRepository.findByCodigo("SWIFT_SPEC_VERSION_OVERRIDE"))
                .thenReturn(Optional.of(catalogo));

            // When
            Optional<String> override = resolver.getConfiguredVersionOverride();

            // Then
            assertThat(override).isEmpty();
        }

        @Test
        @Order(13)
        @DisplayName("Debe retornar empty cuando catálogo no existe")
        void debeRetornarEmptyCuandoCatalogoNoExiste() {
            // Given
            when(catalogoRepository.findByCodigo("SWIFT_SPEC_VERSION_OVERRIDE"))
                .thenReturn(Optional.empty());

            // When
            Optional<String> override = resolver.getConfiguredVersionOverride();

            // Then
            assertThat(override).isEmpty();
        }

        @Test
        @Order(14)
        @DisplayName("Debe usar override sobre resolución por fecha cuando está activo")
        void debeUsarOverrideSobreResolucionPorFecha() {
            // Given
            CatalogoPersonalizadoReadModel catalogo = CatalogoPersonalizadoReadModel.builder()
                .codigo("SWIFT_SPEC_VERSION_OVERRIDE")
                .nombre("2026")
                .activo(true)
                .build();
            when(catalogoRepository.findByCodigo("SWIFT_SPEC_VERSION_OVERRIDE"))
                .thenReturn(Optional.of(catalogo));

            LocalDate fecha = LocalDate.of(2025, 6, 15); // Fecha que normalmente sería 2024

            // When
            String version = resolver.resolveSpecVersion(fecha);

            // Then
            assertThat(version).isEqualTo("2026"); // Usa override, no fecha
        }

        @Test
        @Order(15)
        @DisplayName("isVersionOverrideActive debe retornar true cuando override está configurado")
        void isVersionOverrideActiveDebeRetornarTrue() {
            // Given
            CatalogoPersonalizadoReadModel catalogo = CatalogoPersonalizadoReadModel.builder()
                .codigo("SWIFT_SPEC_VERSION_OVERRIDE")
                .nombre("2026")
                .activo(true)
                .build();
            when(catalogoRepository.findByCodigo("SWIFT_SPEC_VERSION_OVERRIDE"))
                .thenReturn(Optional.of(catalogo));

            // When
            boolean isActive = resolver.isVersionOverrideActive();

            // Then
            assertThat(isActive).isTrue();
        }

        @Test
        @Order(16)
        @DisplayName("isVersionOverrideActive debe retornar false cuando no hay override")
        void isVersionOverrideActiveDebeRetornarFalse() {
            // Given
            when(catalogoRepository.findByCodigo("SWIFT_SPEC_VERSION_OVERRIDE"))
                .thenReturn(Optional.empty());

            // When
            boolean isActive = resolver.isVersionOverrideActive();

            // Then
            assertThat(isActive).isFalse();
        }

        @Test
        @Order(17)
        @DisplayName("Debe manejar excepción en catálogo retornando empty")
        void debeManejarExcepcionEnCatalogo() {
            // Given
            when(catalogoRepository.findByCodigo("SWIFT_SPEC_VERSION_OVERRIDE"))
                .thenThrow(new RuntimeException("Database error"));

            // When
            Optional<String> override = resolver.getConfiguredVersionOverride();

            // Then
            assertThat(override).isEmpty();
        }

        @Test
        @Order(18)
        @DisplayName("Debe retornar empty cuando nombre es solo espacios en blanco")
        void debeRetornarEmptyCuandoNombreSoloEspacios() {
            // Given
            CatalogoPersonalizadoReadModel catalogo = CatalogoPersonalizadoReadModel.builder()
                .codigo("SWIFT_SPEC_VERSION_OVERRIDE")
                .nombre("   ")
                .activo(true)
                .build();
            when(catalogoRepository.findByCodigo("SWIFT_SPEC_VERSION_OVERRIDE"))
                .thenReturn(Optional.of(catalogo));

            // When
            Optional<String> override = resolver.getConfiguredVersionOverride();

            // Then
            assertThat(override).isEmpty();
        }

        @Test
        @Order(19)
        @DisplayName("Debe retornar empty cuando nombre es null")
        void debeRetornarEmptyCuandoNombreNull() {
            // Given
            CatalogoPersonalizadoReadModel catalogo = CatalogoPersonalizadoReadModel.builder()
                .codigo("SWIFT_SPEC_VERSION_OVERRIDE")
                .nombre(null)
                .activo(true)
                .build();
            when(catalogoRepository.findByCodigo("SWIFT_SPEC_VERSION_OVERRIDE"))
                .thenReturn(Optional.of(catalogo));

            // When
            Optional<String> override = resolver.getConfiguredVersionOverride();

            // Then
            assertThat(override).isEmpty();
        }
    }

    // ==================== FALLBACK SIN OVERRIDE ====================

    @Nested
    @DisplayName("Fallback a versión por defecto")
    class FallbackVersionDefecto {

        @Test
        @Order(25)
        @DisplayName("Debe usar fallback 2024 cuando no hay override y JdbcTemplate es null")
        void debeUsarFallbackCuandoNoHayOverrideYJdbcTemplateNull() {
            // Given - no override configured
            when(catalogoRepository.findByCodigo("SWIFT_SPEC_VERSION_OVERRIDE"))
                .thenReturn(Optional.empty());

            LocalDate fecha = LocalDate.of(2025, 6, 15);

            // When
            String version = resolver.resolveSpecVersion(fecha);

            // Then - should fallback to 2024 due to exception handling
            assertThat(version).isEqualTo("2024");
        }
    }

    // ==================== OBTENCIÓN DE CAMPOS ====================

    @Nested
    @DisplayName("Obtención de campos por versión")
    class ObtencionDeCampos {

        @Test
        @Order(22)
        @DisplayName("Debe obtener campos con versión forzada")
        void debeObtenerCamposConVersionForzada() {
            // Given
            List<SwiftFieldConfig> fields2026 = Arrays.asList(
                createFieldConfig(":50N:", "MT700", "2026"),
                createFieldConfig(":50S:", "MT700", "2026")
            );
            when(fieldConfigRepository.findByMessageTypeAndSpecVersionAndIsActiveOrdered(
                "MT700", "2026", true
            )).thenReturn(fields2026);

            // When
            List<SwiftFieldConfig> fields = resolver.getFieldsWithForcedVersion("MT700", "2026");

            // Then
            assertThat(fields).hasSize(2);
            assertThat(fields.get(0).getFieldCode()).isEqualTo(":50N:");
        }

        @Test
        @Order(23)
        @DisplayName("Debe hacer fallback a última versión cuando versión forzada no tiene campos")
        void debeFallbackCuandoVersionForzadaSinCampos() {
            // Given
            when(fieldConfigRepository.findByMessageTypeAndSpecVersionAndIsActiveOrdered(
                "MT700", "2030", true
            )).thenReturn(Collections.emptyList());

            List<SwiftFieldConfig> latestFields = Collections.singletonList(
                createFieldConfig(":20:", "MT700", "2026")
            );
            when(fieldConfigRepository.findActiveLatestVersionByMessageType("MT700"))
                .thenReturn(latestFields);

            // When
            List<SwiftFieldConfig> fields = resolver.getFieldsWithForcedVersion("MT700", "2030");

            // Then
            assertThat(fields).hasSize(1);
            verify(fieldConfigRepository).findActiveLatestVersionByMessageType("MT700");
        }

        @Test
        @Order(24)
        @DisplayName("No debe hacer fallback cuando versión forzada tiene campos")
        void noDebeFallbackCuandoVersionForzadaTieneCampos() {
            // Given
            List<SwiftFieldConfig> fields2026 = Collections.singletonList(
                createFieldConfig(":20:", "MT700", "2026")
            );
            when(fieldConfigRepository.findByMessageTypeAndSpecVersionAndIsActiveOrdered(
                "MT700", "2026", true
            )).thenReturn(fields2026);

            // When
            List<SwiftFieldConfig> fields = resolver.getFieldsWithForcedVersion("MT700", "2026");

            // Then
            assertThat(fields).hasSize(1);
            verify(fieldConfigRepository, never()).findActiveLatestVersionByMessageType(any());
        }
    }

    // ==================== VERSIONES DISPONIBLES ====================

    @Nested
    @DisplayName("Consulta de versiones disponibles")
    class VersionesDisponibles {

        @Test
        @Order(30)
        @DisplayName("Debe obtener lista de versiones disponibles")
        void debeObtenerVersionesDisponibles() {
            // Given
            when(fieldConfigRepository.findAvailableSpecVersions("MT700"))
                .thenReturn(Arrays.asList("2024", "2026"));

            // When
            List<String> versions = resolver.getAvailableVersions("MT700");

            // Then
            assertThat(versions).containsExactly("2024", "2026");
        }

        @Test
        @Order(32)
        @DisplayName("Debe verificar si versión está disponible")
        void debeVerificarSiVersionDisponible() {
            // Given
            when(fieldConfigRepository.countByMessageTypeAndSpecVersionAndIsActive("MT700", "2026", true))
                .thenReturn(15L);

            // When
            boolean available = resolver.isVersionAvailable("MT700", "2026");

            // Then
            assertThat(available).isTrue();
        }

        @Test
        @Order(33)
        @DisplayName("Debe retornar false si versión no tiene campos")
        void debeRetornarFalseSiVersionSinCampos() {
            // Given
            when(fieldConfigRepository.countByMessageTypeAndSpecVersionAndIsActive("MT700", "2030", true))
                .thenReturn(0L);

            // When
            boolean available = resolver.isVersionAvailable("MT700", "2030");

            // Then
            assertThat(available).isFalse();
        }

        @Test
        @Order(34)
        @DisplayName("Debe retornar lista vacía si no hay versiones")
        void debeRetornarListaVaciaSiNoHayVersiones() {
            // Given
            when(fieldConfigRepository.findAvailableSpecVersions("MT999"))
                .thenReturn(Collections.emptyList());

            // When
            List<String> versions = resolver.getAvailableVersions("MT999");

            // Then
            assertThat(versions).isEmpty();
        }

        @Test
        @Order(35)
        @DisplayName("Debe retornar versión activa usando fallback cuando no hay override")
        void debeRetornarVersionActivaFallback() {
            // Given
            when(catalogoRepository.findByCodigo("SWIFT_SPEC_VERSION_OVERRIDE"))
                .thenReturn(Optional.empty());

            // When
            String version = resolver.getCurrentActiveVersion();

            // Then - fallback to 2024 because JdbcTemplate is null
            assertThat(version).isEqualTo("2024");
        }

        @Test
        @Order(36)
        @DisplayName("Debe retornar versión activa usando override cuando está configurado")
        void debeRetornarVersionActivaConOverride() {
            // Given
            CatalogoPersonalizadoReadModel catalogo = CatalogoPersonalizadoReadModel.builder()
                .codigo("SWIFT_SPEC_VERSION_OVERRIDE")
                .nombre("2026")
                .activo(true)
                .build();
            when(catalogoRepository.findByCodigo("SWIFT_SPEC_VERSION_OVERRIDE"))
                .thenReturn(Optional.of(catalogo));

            // When
            String version = resolver.getCurrentActiveVersion();

            // Then
            assertThat(version).isEqualTo("2026");
        }
    }

    // ==================== HELPERS ====================

    private SwiftFieldConfig createFieldConfig(String fieldCode, String messageType, String specVersion) {
        return SwiftFieldConfig.builder()
            .id(java.util.UUID.randomUUID().toString())
            .fieldCode(fieldCode)
            .fieldNameKey("Test Field")
            .messageType(messageType)
            .specVersion(specVersion)
            .isActive(true)
            .isRequired(false)
            .section("TEST")
            .displayOrder(1)
            .build();
    }
}
