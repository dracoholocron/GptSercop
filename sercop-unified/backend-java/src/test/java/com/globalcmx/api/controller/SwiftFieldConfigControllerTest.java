package com.globalcmx.api.controller;

import com.globalcmx.api.dto.swift.SwiftFieldConfigDTO;
import com.globalcmx.api.service.SwiftFieldConfigService;
import com.globalcmx.api.service.SwiftSpecVersionResolver;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para SwiftFieldConfigController.
 *
 * Cubre:
 * 1. Resolución automática de versión por fecha actual
 * 2. Resolución de versión por fecha de creación del mensaje
 * 3. Forzar versión (solo ADMIN)
 * 4. Endpoint de versiones disponibles
 * 5. Control de acceso por rol
 *
 * @author GlobalCMX Team
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SwiftFieldConfigController - Pruebas Unitarias")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SwiftFieldConfigControllerTest {

    @Mock
    private SwiftFieldConfigService service;

    @Mock
    private SwiftSpecVersionResolver specVersionResolver;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private SwiftFieldConfigController controller;

    // ==================== GET ALL - RESOLUCIÓN AUTOMÁTICA ====================

    @Nested
    @DisplayName("GET /swift-field-configs - Resolución automática")
    class GetAllResolucionAutomatica {

        @Test
        @Order(1)
        @DisplayName("Debe usar versión actual para mensajes nuevos (sin messageCreatedAt)")
        void debeUsarVersionActualParaMensajesNuevos() {
            // Given
            when(specVersionResolver.getCurrentActiveVersion()).thenReturn("2024");
            when(service.findAllWithVersion("MT700", true, "2024"))
                .thenReturn(createFieldConfigDTOs(3, "2024"));

            // When
            ResponseEntity<List<SwiftFieldConfigDTO>> response = controller.getAll(
                "MT700", true, null, null, authentication
            );

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).hasSize(3);
            verify(specVersionResolver).getCurrentActiveVersion();
            verify(service).findAllWithVersion("MT700", true, "2024");
        }

        @Test
        @Order(2)
        @DisplayName("Debe resolver versión por fecha de creación del mensaje")
        void debeResolverVersionPorFechaCreacion() {
            // Given
            LocalDateTime messageCreatedAt = LocalDateTime.of(2025, 3, 15, 10, 30);
            when(specVersionResolver.resolveSpecVersion(messageCreatedAt.toLocalDate()))
                .thenReturn("2024");
            when(service.findAllWithVersion("MT700", true, "2024"))
                .thenReturn(createFieldConfigDTOs(5, "2024"));

            // When
            ResponseEntity<List<SwiftFieldConfigDTO>> response = controller.getAll(
                "MT700", true, messageCreatedAt, null, authentication
            );

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).hasSize(5);
            verify(specVersionResolver).resolveSpecVersion(messageCreatedAt.toLocalDate());
        }

        @Test
        @Order(3)
        @DisplayName("Debe resolver versión 2026 para mensaje creado después de noviembre 2026")
        void debeResolverVersion2026ParaMensajePosterior() {
            // Given
            LocalDateTime messageCreatedAt = LocalDateTime.of(2027, 1, 10, 14, 0);
            when(specVersionResolver.resolveSpecVersion(messageCreatedAt.toLocalDate()))
                .thenReturn("2026");
            when(service.findAllWithVersion("MT700", true, "2026"))
                .thenReturn(createFieldConfigDTOs(8, "2026"));

            // When
            ResponseEntity<List<SwiftFieldConfigDTO>> response = controller.getAll(
                "MT700", true, messageCreatedAt, null, authentication
            );

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).hasSize(8);
            assertThat(response.getBody()).allMatch(dto -> "2026".equals(dto.getSpecVersion()));
        }
    }

    // ==================== GET ALL - FORZAR VERSIÓN (ADMIN) ====================

    @Nested
    @DisplayName("GET /swift-field-configs - Forzar versión (ADMIN)")
    class GetAllForzarVersion {

        @Test
        @Order(10)
        @DisplayName("ADMIN debe poder forzar versión específica")
        void adminDebeForzarVersion() {
            // Given
            setupAdminAuthentication();
            when(service.findAllWithVersion("MT700", true, "2026"))
                .thenReturn(createFieldConfigDTOs(10, "2026"));

            // When
            ResponseEntity<List<SwiftFieldConfigDTO>> response = controller.getAll(
                "MT700", true, null, "2026", authentication
            );

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).hasSize(10);
            verify(service).findAllWithVersion("MT700", true, "2026");
            // No debe llamar a resolveSpecVersion ni getCurrentActiveVersion
            verify(specVersionResolver, never()).resolveSpecVersion(any());
            verify(specVersionResolver, never()).getCurrentActiveVersion();
        }

        @Test
        @Order(11)
        @DisplayName("ADMIN con rol ROLE_ADMIN debe poder forzar versión")
        void adminConRoleAdminDebeForzarVersion() {
            // Given
            setupAuthenticationWithRole("ROLE_ADMIN");
            when(service.findAllWithVersion("MT700", true, "2026"))
                .thenReturn(createFieldConfigDTOs(5, "2026"));

            // When
            ResponseEntity<List<SwiftFieldConfigDTO>> response = controller.getAll(
                "MT700", true, null, "2026", authentication
            );

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        @Order(12)
        @DisplayName("Usuario NO ADMIN debe recibir FORBIDDEN al intentar forzar versión")
        void usuarioNoAdminDebeRecibirForbidden() {
            // Given
            setupUserAuthentication();

            // When
            ResponseEntity<List<SwiftFieldConfigDTO>> response = controller.getAll(
                "MT700", true, null, "2026", authentication
            );

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            verify(service, never()).findAllWithVersion(any(), any(), any());
        }

        @Test
        @Order(13)
        @DisplayName("Usuario sin autenticación debe recibir FORBIDDEN al forzar versión")
        void usuarioSinAutenticacionDebeRecibirForbidden() {
            // When
            ResponseEntity<List<SwiftFieldConfigDTO>> response = controller.getAll(
                "MT700", true, null, "2026", null
            );

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        }

        @Test
        @Order(14)
        @DisplayName("forceSpecVersion vacío debe tratarse como ausente")
        void forceSpecVersionVacioDebeTratarseComoAusente() {
            // Given
            when(specVersionResolver.getCurrentActiveVersion()).thenReturn("2024");
            when(service.findAllWithVersion("MT700", true, "2024"))
                .thenReturn(createFieldConfigDTOs(3, "2024"));

            // When
            ResponseEntity<List<SwiftFieldConfigDTO>> response = controller.getAll(
                "MT700", true, null, "", authentication
            );

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(specVersionResolver).getCurrentActiveVersion();
        }
    }

    // ==================== GET SPEC VERSIONS ====================

    @Nested
    @DisplayName("GET /swift-field-configs/spec-versions")
    class GetSpecVersions {

        @Test
        @Order(20)
        @DisplayName("Debe retornar información de versiones disponibles")
        void debeRetornarVersionesDisponibles() {
            // Given
            when(specVersionResolver.getAvailableVersions("MT700"))
                .thenReturn(Arrays.asList("2024", "2026"));
            when(specVersionResolver.getCurrentActiveVersion()).thenReturn("2024");
            when(specVersionResolver.isVersionOverrideActive()).thenReturn(false);
            when(specVersionResolver.getConfiguredVersionOverride()).thenReturn(Optional.empty());

            // When
            ResponseEntity<Map<String, Object>> response = controller.getSpecVersions("MT700");

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().get("messageType")).isEqualTo("MT700");
            assertThat(response.getBody().get("currentActiveVersion")).isEqualTo("2024");
            assertThat(response.getBody().get("availableVersions")).isEqualTo(Arrays.asList("2024", "2026"));
            assertThat(response.getBody().get("overrideActive")).isEqualTo(false);
        }

        @Test
        @Order(21)
        @DisplayName("Debe indicar cuando override está activo")
        void debeIndicarOverrideActivo() {
            // Given
            when(specVersionResolver.getAvailableVersions("MT700"))
                .thenReturn(Arrays.asList("2024", "2026"));
            when(specVersionResolver.getCurrentActiveVersion()).thenReturn("2026");
            when(specVersionResolver.isVersionOverrideActive()).thenReturn(true);
            when(specVersionResolver.getConfiguredVersionOverride()).thenReturn(Optional.of("2026"));

            // When
            ResponseEntity<Map<String, Object>> response = controller.getSpecVersions("MT700");

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody().get("overrideActive")).isEqualTo(true);
            assertThat(response.getBody().get("overrideVersion")).isEqualTo("2026");
            assertThat(response.getBody().get("hint").toString()).contains("Override ACTIVO");
        }

        @Test
        @Order(22)
        @DisplayName("Debe incluir código del catálogo de override")
        void debeIncluirCodigoCatalogoOverride() {
            // Given
            when(specVersionResolver.getAvailableVersions("MT700"))
                .thenReturn(Arrays.asList("2024", "2026"));
            when(specVersionResolver.getCurrentActiveVersion()).thenReturn("2024");
            when(specVersionResolver.isVersionOverrideActive()).thenReturn(false);
            when(specVersionResolver.getConfiguredVersionOverride()).thenReturn(Optional.empty());

            // When
            ResponseEntity<Map<String, Object>> response = controller.getSpecVersions("MT700");

            // Then
            assertThat(response.getBody().get("overrideCatalogCode")).isEqualTo("SWIFT_SPEC_VERSION_OVERRIDE");
        }
    }

    // ==================== MANEJO DE ERRORES ====================

    @Nested
    @DisplayName("Manejo de errores")
    class ManejoDeErrores {

        @Test
        @Order(30)
        @DisplayName("Debe retornar INTERNAL_SERVER_ERROR cuando servicio falla")
        void debeRetornarErrorCuandoServicioFalla() {
            // Given
            when(specVersionResolver.getCurrentActiveVersion()).thenReturn("2024");
            when(service.findAllWithVersion(any(), any(), any()))
                .thenThrow(new RuntimeException("Database error"));

            // When
            ResponseEntity<List<SwiftFieldConfigDTO>> response = controller.getAll(
                "MT700", true, null, null, authentication
            );

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        @Test
        @Order(31)
        @DisplayName("Debe retornar INTERNAL_SERVER_ERROR cuando spec-versions falla")
        void debeRetornarErrorCuandoSpecVersionsFalla() {
            // Given
            when(specVersionResolver.getAvailableVersions(any()))
                .thenThrow(new RuntimeException("Database error"));

            // When
            ResponseEntity<Map<String, Object>> response = controller.getSpecVersions("MT700");

            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ==================== PARÁMETROS POR DEFECTO ====================

    @Nested
    @DisplayName("Valores por defecto de parámetros")
    class ValoresPorDefecto {

        @Test
        @Order(40)
        @DisplayName("Debe usar activeOnly=true por defecto")
        void debeUsarActiveOnlyTruePorDefecto() {
            // Given
            when(specVersionResolver.getCurrentActiveVersion()).thenReturn("2024");
            when(service.findAllWithVersion("MT700", true, "2024"))
                .thenReturn(Collections.emptyList());

            // When
            controller.getAll("MT700", true, null, null, authentication);

            // Then
            verify(service).findAllWithVersion("MT700", true, "2024");
        }

        @Test
        @Order(41)
        @DisplayName("Debe soportar activeOnly=false cuando se especifica")
        void debeSoportarActiveOnlyFalse() {
            // Given
            when(specVersionResolver.getCurrentActiveVersion()).thenReturn("2024");
            when(service.findAllWithVersion("MT700", false, "2024"))
                .thenReturn(Collections.emptyList());

            // When
            controller.getAll("MT700", false, null, null, authentication);

            // Then
            verify(service).findAllWithVersion("MT700", false, "2024");
        }
    }

    // ==================== HELPERS ====================

    private void setupAdminAuthentication() {
        setupAuthenticationWithRole("ADMIN");
    }

    private void setupUserAuthentication() {
        setupAuthenticationWithRole("USER");
    }

    private void setupAuthenticationWithRole(String role) {
        Collection<GrantedAuthority> authorities = Collections.singletonList(
            new SimpleGrantedAuthority(role)
        );
        when(authentication.getAuthorities()).thenAnswer(inv -> authorities);
    }

    private List<SwiftFieldConfigDTO> createFieldConfigDTOs(int count, String specVersion) {
        List<SwiftFieldConfigDTO> dtos = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            dtos.add(SwiftFieldConfigDTO.builder()
                .id(UUID.randomUUID().toString())
                .fieldCode(":20" + i + ":")
                .fieldNameKey("Test Field " + i)
                .messageType("MT700")
                .specVersion(specVersion)
                .effectiveDate(LocalDate.of(2024, 11, 17))
                .isActive(true)
                .isRequired(false)
                .section("TEST")
                .displayOrder(i)
                .build());
        }
        return dtos;
    }
}
