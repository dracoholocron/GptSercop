package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.SwiftFieldConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para gestionar configuraciones de campos SWIFT
 */
@Repository
public interface SwiftFieldConfigRepository extends JpaRepository<SwiftFieldConfig, String> {

    /**
     * Obtiene todas las configuraciones de campos para un tipo de mensaje específico
     * filtradas por estado activo
     *
     * @param messageType Tipo de mensaje (ej: "MT700")
     * @param isActive Estado activo
     * @return Lista de configuraciones
     */
    List<SwiftFieldConfig> findByMessageTypeAndIsActive(String messageType, Boolean isActive);

    /**
     * Obtiene todas las configuraciones activas de un tipo de mensaje ordenadas por sección y orden
     *
     * @param messageType Tipo de mensaje
     * @return Lista ordenada de configuraciones
     */
    @Query("SELECT s FROM SwiftFieldConfig s WHERE s.messageType = :messageType AND s.isActive = true " +
           "ORDER BY s.section, s.displayOrder")
    List<SwiftFieldConfig> findActiveByMessageTypeOrdered(@Param("messageType") String messageType);

    /**
     * Busca una configuración por código de campo y tipo de mensaje
     *
     * @param fieldCode Código del campo (ej: ":39A:")
     * @param messageType Tipo de mensaje
     * @return Configuración si existe
     */
    Optional<SwiftFieldConfig> findByFieldCodeAndMessageType(String fieldCode, String messageType);

    /**
     * Busca una configuración por código de campo y tipo de mensaje,
     * devolviendo la versión más reciente.
     *
     * @param fieldCode Código del campo (ej: ":39A:")
     * @param messageType Tipo de mensaje
     * @return Configuración de la versión más reciente si existe
     */
    @Query("SELECT s FROM SwiftFieldConfig s WHERE s.fieldCode = :fieldCode " +
           "AND s.messageType = :messageType " +
           "ORDER BY s.specVersion DESC LIMIT 1")
    Optional<SwiftFieldConfig> findLatestByFieldCodeAndMessageType(
        @Param("fieldCode") String fieldCode,
        @Param("messageType") String messageType
    );

    /**
     * Obtiene todas las configuraciones de una sección específica ordenadas por displayOrder
     *
     * @param messageType Tipo de mensaje
     * @param section Sección (ej: "MONTOS", "BANCOS")
     * @return Lista ordenada de configuraciones
     */
    List<SwiftFieldConfig> findByMessageTypeAndSectionOrderByDisplayOrder(
        String messageType,
        String section
    );

    /**
     * Obtiene todas las configuraciones de una sección específica que estén activas
     *
     * @param messageType Tipo de mensaje
     * @param section Sección
     * @param isActive Estado activo
     * @return Lista ordenada de configuraciones
     */
    List<SwiftFieldConfig> findByMessageTypeAndSectionAndIsActiveOrderByDisplayOrder(
        String messageType,
        String section,
        Boolean isActive
    );

    /**
     * Obtiene todas las configuraciones de una sección específica para una versión
     *
     * @param messageType Tipo de mensaje
     * @param section Sección
     * @param specVersion Versión de especificación
     * @param isActive Estado activo
     * @return Lista ordenada de configuraciones
     */
    List<SwiftFieldConfig> findByMessageTypeAndSectionAndSpecVersionAndIsActiveOrderByDisplayOrder(
        String messageType,
        String section,
        String specVersion,
        Boolean isActive
    );

    /**
     * Obtiene solo los campos obligatorios de un tipo de mensaje
     *
     * @param messageType Tipo de mensaje
     * @param isRequired Estado de obligatoriedad
     * @param isActive Estado activo
     * @return Lista de campos obligatorios
     */
    List<SwiftFieldConfig> findByMessageTypeAndIsRequiredAndIsActiveOrderByDisplayOrder(
        String messageType,
        Boolean isRequired,
        Boolean isActive
    );

    /**
     * Obtiene solo los campos opcionales de un tipo de mensaje
     *
     * @param messageType Tipo de mensaje
     * @return Lista de campos opcionales activos
     */
    @Query("SELECT s FROM SwiftFieldConfig s WHERE s.messageType = :messageType " +
           "AND s.isRequired = false AND s.isActive = true " +
           "ORDER BY s.section, s.displayOrder")
    List<SwiftFieldConfig> findOptionalFieldsByMessageType(@Param("messageType") String messageType);

    /**
     * Verifica si existe una configuración con el código de campo y tipo de mensaje dados
     *
     * @param fieldCode Código del campo
     * @param messageType Tipo de mensaje
     * @return true si existe
     */
    boolean existsByFieldCodeAndMessageType(String fieldCode, String messageType);

    /**
     * Cuenta cuántos campos obligatorios hay para un tipo de mensaje
     *
     * @param messageType Tipo de mensaje
     * @param isRequired Estado de obligatoriedad
     * @param isActive Estado activo
     * @return Cantidad de campos
     */
    long countByMessageTypeAndIsRequiredAndIsActive(
        String messageType,
        Boolean isRequired,
        Boolean isActive
    );

    /**
     * Obtiene todas las secciones únicas de un tipo de mensaje
     *
     * @param messageType Tipo de mensaje
     * @param isActive Estado activo
     * @return Lista de secciones únicas
     */
    @Query("SELECT DISTINCT s.section FROM SwiftFieldConfig s " +
           "WHERE s.messageType = :messageType AND s.isActive = :isActive " +
           "ORDER BY s.section")
    List<String> findDistinctSectionsByMessageType(
        @Param("messageType") String messageType,
        @Param("isActive") Boolean isActive
    );

    /**
     * Busca configuraciones que tengan un validador personalizado específico
     *
     * @param validatorName Nombre del validador
     * @param messageType Tipo de mensaje
     * @return Lista de configuraciones
     */
    @Query("SELECT s FROM SwiftFieldConfig s WHERE s.messageType = :messageType " +
           "AND s.validationRules LIKE %:validatorName% AND s.isActive = true")
    List<SwiftFieldConfig> findByCustomValidator(
        @Param("validatorName") String validatorName,
        @Param("messageType") String messageType
    );

    /**
     * Obtiene todas las configuraciones activas que tienen mapeo a campos del draft
     *
     * @param messageType Tipo de mensaje
     * @return Lista de configuraciones con draft_field_mapping no nulo
     */
    @Query("SELECT s FROM SwiftFieldConfig s WHERE s.messageType = :messageType " +
           "AND s.isActive = true AND s.draftFieldMapping IS NOT NULL")
    List<SwiftFieldConfig> findFieldsWithDraftMapping(@Param("messageType") String messageType);

    // ==================== Version-aware queries (SRG2026+) ====================

    /**
     * Obtiene todas las configuraciones para una versión específica de especificación
     *
     * @param messageType Tipo de mensaje
     * @param specVersion Versión de especificación (ej: "2024", "2026")
     * @param isActive Estado activo
     * @return Lista ordenada de configuraciones
     */
    @Query("SELECT s FROM SwiftFieldConfig s WHERE s.messageType = :messageType " +
           "AND s.specVersion = :specVersion AND s.isActive = :isActive " +
           "AND s.deprecatedDate IS NULL " +
           "ORDER BY s.section, s.displayOrder")
    List<SwiftFieldConfig> findByMessageTypeAndSpecVersionAndIsActiveOrdered(
        @Param("messageType") String messageType,
        @Param("specVersion") String specVersion,
        @Param("isActive") Boolean isActive
    );

    /**
     * Obtiene configuraciones activas de la versión más reciente disponible
     * (Excluye campos deprecados)
     *
     * @param messageType Tipo de mensaje
     * @return Lista ordenada de configuraciones de la versión más reciente
     */
    @Query("SELECT s FROM SwiftFieldConfig s WHERE s.messageType = :messageType " +
           "AND s.isActive = true AND s.deprecatedDate IS NULL " +
           "AND s.specVersion = (SELECT MAX(s2.specVersion) FROM SwiftFieldConfig s2 " +
           "    WHERE s2.messageType = :messageType " +
           "    AND s2.isActive = true AND s2.deprecatedDate IS NULL) " +
           "ORDER BY s.section, s.displayOrder")
    List<SwiftFieldConfig> findActiveLatestVersionByMessageType(
        @Param("messageType") String messageType
    );

    /**
     * Busca una configuración por código de campo, tipo de mensaje y versión
     *
     * @param fieldCode Código del campo
     * @param messageType Tipo de mensaje
     * @param specVersion Versión de especificación
     * @return Configuración si existe
     */
    Optional<SwiftFieldConfig> findByFieldCodeAndMessageTypeAndSpecVersion(
        String fieldCode,
        String messageType,
        String specVersion
    );

    /**
     * Obtiene campos deprecados en una versión específica
     *
     * @param messageType Tipo de mensaje
     * @param specVersion Versión donde se deprecaron
     * @return Lista de campos deprecados
     */
    @Query("SELECT s FROM SwiftFieldConfig s WHERE s.messageType = :messageType " +
           "AND s.specVersion = :specVersion AND s.deprecatedDate IS NOT NULL " +
           "ORDER BY s.fieldCode")
    List<SwiftFieldConfig> findDeprecatedFieldsByMessageTypeAndVersion(
        @Param("messageType") String messageType,
        @Param("specVersion") String specVersion
    );

    /**
     * Obtiene campos nuevos introducidos en una versión específica
     *
     * @param messageType Tipo de mensaje
     * @param specVersion Versión de especificación
     * @return Lista de campos nuevos (que no existían en versiones anteriores)
     */
    @Query("SELECT s FROM SwiftFieldConfig s WHERE s.messageType = :messageType " +
           "AND s.specVersion = :specVersion AND s.isActive = true " +
           "AND NOT EXISTS (SELECT 1 FROM SwiftFieldConfig s2 WHERE s2.fieldCode = s.fieldCode " +
           "    AND s2.messageType = s.messageType " +
           "    AND s2.specVersion < s.specVersion) " +
           "ORDER BY s.section, s.displayOrder")
    List<SwiftFieldConfig> findNewFieldsInVersion(
        @Param("messageType") String messageType,
        @Param("specVersion") String specVersion
    );

    /**
     * Obtiene todas las versiones de especificación disponibles para un tipo de mensaje
     *
     * @param messageType Tipo de mensaje
     * @return Lista de versiones disponibles
     */
    @Query("SELECT DISTINCT s.specVersion FROM SwiftFieldConfig s " +
           "WHERE s.messageType = :messageType " +
           "ORDER BY s.specVersion")
    List<String> findAvailableSpecVersions(@Param("messageType") String messageType);

    /**
     * Cuenta campos por versión de especificación
     *
     * @param messageType Tipo de mensaje
     * @param specVersion Versión de especificación
     * @param isActive Estado activo
     * @return Cantidad de campos
     */
    long countByMessageTypeAndSpecVersionAndIsActive(
        String messageType,
        String specVersion,
        Boolean isActive
    );

    /**
     * Obtiene todos los tipos de componente únicos utilizados en la configuración
     *
     * @return Lista de tipos de componente únicos ordenados alfabéticamente
     */
    @Query("SELECT DISTINCT s.componentType FROM SwiftFieldConfig s " +
           "WHERE s.componentType IS NOT NULL " +
           "ORDER BY s.componentType")
    List<String> findDistinctComponentTypes();

    /**
     * Obtiene todas las secciones únicas utilizadas en la configuración
     *
     * @return Lista de secciones únicas ordenadas alfabéticamente
     */
    @Query("SELECT DISTINCT s.section FROM SwiftFieldConfig s " +
           "WHERE s.section IS NOT NULL " +
           "ORDER BY s.section")
    List<String> findDistinctSections();

    /**
     * Obtiene todos los tipos de campo únicos utilizados en la configuración
     *
     * @return Lista de tipos de campo únicos ordenados alfabéticamente
     */
    @Query("SELECT DISTINCT s.fieldType FROM SwiftFieldConfig s " +
           "WHERE s.fieldType IS NOT NULL " +
           "ORDER BY s.fieldType")
    List<String> findDistinctFieldTypes();

    /**
     * Obtiene todos los tipos de mensaje únicos que tienen campos configurados
     *
     * @return Lista de tipos de mensaje únicos ordenados alfabéticamente
     */
    @Query("SELECT DISTINCT s.messageType FROM SwiftFieldConfig s " +
           "WHERE s.messageType IS NOT NULL " +
           "ORDER BY s.messageType")
    List<String> findDistinctMessageTypes();

    /**
     * Obtiene todos los códigos de campo únicos utilizados en la configuración
     *
     * @return Lista de códigos de campo únicos ordenados
     */
    @Query("SELECT DISTINCT s.fieldCode FROM SwiftFieldConfig s " +
           "WHERE s.fieldCode IS NOT NULL " +
           "ORDER BY s.fieldCode")
    List<String> findDistinctFieldCodes();

    /**
     * Obtiene todas las configuraciones de un código de campo específico ordenadas por tipo de mensaje.
     * Útil para sincronización de campos a través de diferentes tipos de mensaje.
     *
     * @param fieldCode Código del campo (ej: ":20:")
     * @return Lista de configuraciones ordenadas por tipo de mensaje
     */
    @Query("SELECT s FROM SwiftFieldConfig s " +
           "WHERE s.fieldCode = :fieldCode AND s.isActive = true " +
           "ORDER BY s.messageType, s.specVersion DESC")
    List<SwiftFieldConfig> findByFieldCodeOrderByMessageType(@Param("fieldCode") String fieldCode);
}
