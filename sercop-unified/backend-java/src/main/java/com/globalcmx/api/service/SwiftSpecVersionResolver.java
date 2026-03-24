package com.globalcmx.api.service;

import com.globalcmx.api.readmodel.entity.CatalogoPersonalizadoReadModel;
import com.globalcmx.api.readmodel.entity.SwiftFieldConfig;
import com.globalcmx.api.readmodel.repository.CatalogoPersonalizadoReadModelRepository;
import com.globalcmx.api.readmodel.repository.SwiftFieldConfigRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Servicio para resolver la versión de especificación SWIFT basada en fechas.
 *
 * Estrategia:
 * - Para mensajes NUEVOS: usa la fecha actual del sistema
 * - Para mensajes EXISTENTES: usa la fecha de creación del mensaje
 * - Para PRUEBAS (admin): permite forzar una versión específica via catálogo
 *
 * Override via Catálogo:
 * - Código: SWIFT_SPEC_VERSION_OVERRIDE
 * - Campo 'nombre': versión a forzar (ej: "2026")
 * - Campo 'activo': true para habilitar override
 */
@Slf4j
@Service
public class SwiftSpecVersionResolver {

    private static final String OVERRIDE_CATALOG_CODE = "SWIFT_SPEC_VERSION_OVERRIDE";

    private final SwiftFieldConfigRepository fieldConfigRepository;
    private final CatalogoPersonalizadoReadModelRepository catalogoRepository;
    private final JdbcTemplate jdbcTemplate;

    public SwiftSpecVersionResolver(
            SwiftFieldConfigRepository fieldConfigRepository,
            CatalogoPersonalizadoReadModelRepository catalogoRepository,
            @Qualifier("readModelJdbcTemplate") JdbcTemplate jdbcTemplate) {
        this.fieldConfigRepository = fieldConfigRepository;
        this.catalogoRepository = catalogoRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Obtiene el override de versión configurado en el catálogo.
     * Retorna la versión forzada si el catálogo está activo y tiene valor.
     *
     * @return Optional con la versión forzada, o empty si no hay override
     */
    public Optional<String> getConfiguredVersionOverride() {
        try {
            Optional<CatalogoPersonalizadoReadModel> override = catalogoRepository.findByCodigo(OVERRIDE_CATALOG_CODE);

            if (override.isPresent()) {
                CatalogoPersonalizadoReadModel config = override.get();

                // Solo aplicar override si está activo Y tiene un valor en 'nombre'
                if (Boolean.TRUE.equals(config.getActivo()) &&
                    config.getNombre() != null &&
                    !config.getNombre().trim().isEmpty()) {

                    String forcedVersion = config.getNombre().trim();
                    log.info("SWIFT spec version override ACTIVE: forcing version {}", forcedVersion);
                    return Optional.of(forcedVersion);
                }
            }

            return Optional.empty();

        } catch (Exception e) {
            log.warn("Error checking version override catalog: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Verifica si hay un override de versión activo en el catálogo.
     *
     * @return true si hay un override activo
     */
    public boolean isVersionOverrideActive() {
        return getConfiguredVersionOverride().isPresent();
    }

    /**
     * Resuelve la versión de especificación basada en una fecha de referencia.
     * Primero verifica si hay un override configurado en el catálogo.
     * Si no hay override, busca la versión más reciente cuya effective_date sea <= referenceDate.
     *
     * @param referenceDate Fecha de referencia (creación del mensaje o fecha actual)
     * @return Código de versión (ej: "2024", "2026")
     */
    public String resolveSpecVersion(LocalDate referenceDate) {
        // Primero verificar si hay un override configurado
        Optional<String> override = getConfiguredVersionOverride();
        if (override.isPresent()) {
            return override.get();
        }

        // Si no hay override, resolver por fecha
        try {
            String sql = """
                SELECT version_code
                FROM swift_spec_version_readmodel
                WHERE effective_date <= ?
                ORDER BY effective_date DESC
                LIMIT 1
                """;

            String version = jdbcTemplate.queryForObject(sql, String.class, referenceDate);
            log.debug("Resolved spec version {} for date {}", version, referenceDate);
            return version != null ? version : "2024"; // Default fallback

        } catch (Exception e) {
            log.warn("Error resolving spec version for date {}, defaulting to 2024: {}",
                    referenceDate, e.getMessage());
            return "2024";
        }
    }

    /**
     * Obtiene los campos de configuración para un NUEVO mensaje SWIFT.
     * Usa la fecha actual del sistema para determinar la versión.
     *
     * @param messageType Tipo de mensaje (MT700, MT710, etc.)
     * @return Lista de configuraciones de campos
     */
    public List<SwiftFieldConfig> getFieldsForNewMessage(String messageType) {
        String specVersion = resolveSpecVersion(LocalDate.now());
        log.info("Loading fields for NEW message {} with spec version {} (based on current date)",
                messageType, specVersion);

        return fieldConfigRepository.findByMessageTypeAndSpecVersionAndIsActiveOrdered(
            messageType, specVersion, true
        );
    }

    /**
     * Obtiene los campos de configuración para un mensaje EXISTENTE.
     * Usa la fecha de creación del mensaje para determinar la versión.
     *
     * @param messageType Tipo de mensaje
     * @param messageCreatedAt Fecha de creación del mensaje
     * @return Lista de configuraciones de campos
     */
    public List<SwiftFieldConfig> getFieldsForExistingMessage(
            String messageType,
            LocalDateTime messageCreatedAt) {

        String specVersion = resolveSpecVersion(messageCreatedAt.toLocalDate());
        log.info("Loading fields for EXISTING message {} created at {} with spec version {}",
                messageType, messageCreatedAt, specVersion);

        return fieldConfigRepository.findByMessageTypeAndSpecVersionAndIsActiveOrdered(
            messageType, specVersion, true
        );
    }

    /**
     * Obtiene los campos de configuración forzando una versión específica.
     * SOLO para uso administrativo/pruebas.
     *
     * @param messageType Tipo de mensaje
     * @param forcedVersion Versión a forzar (ej: "2026")
     * @return Lista de configuraciones de campos
     */
    public List<SwiftFieldConfig> getFieldsWithForcedVersion(
            String messageType,
            String forcedVersion) {

        log.warn("ADMIN MODE: Loading fields for {} with FORCED spec version {}",
                messageType, forcedVersion);

        List<SwiftFieldConfig> fields = fieldConfigRepository
            .findByMessageTypeAndSpecVersionAndIsActiveOrdered(
                messageType, forcedVersion, true
            );

        if (fields.isEmpty()) {
            log.warn("No fields found for version {}, falling back to latest available", forcedVersion);
            return fieldConfigRepository.findActiveLatestVersionByMessageType(messageType);
        }

        return fields;
    }

    /**
     * Obtiene todas las versiones de especificación disponibles para un tipo de mensaje.
     *
     * @param messageType Tipo de mensaje
     * @return Lista de versiones disponibles
     */
    public List<String> getAvailableVersions(String messageType) {
        return fieldConfigRepository.findAvailableSpecVersions(messageType);
    }

    /**
     * Obtiene la versión actualmente vigente según la fecha del sistema.
     *
     * @return Código de versión vigente
     */
    public String getCurrentActiveVersion() {
        return resolveSpecVersion(LocalDate.now());
    }

    /**
     * Verifica si una versión específica está disponible para un tipo de mensaje.
     *
     * @param messageType Tipo de mensaje
     * @param specVersion Versión a verificar
     * @return true si hay campos configurados para esa versión
     */
    public boolean isVersionAvailable(String messageType, String specVersion) {
        return fieldConfigRepository.countByMessageTypeAndSpecVersionAndIsActive(
            messageType, specVersion, true
        ) > 0;
    }

    /**
     * Obtiene los detalles de todas las versiones de especificación registradas.
     * Incluye código de versión, nombre, fecha de vigencia y estado.
     *
     * @return Lista de mapas con detalles de cada versión
     */
    public List<java.util.Map<String, Object>> getVersionDetails() {
        try {
            String sql = """
                SELECT version_code, version_name, effective_date, is_current, release_notes
                FROM swift_spec_version_readmodel
                ORDER BY effective_date ASC
                """;

            return jdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            log.warn("Error getting version details: {}", e.getMessage());
            return List.of();
        }
    }
}
