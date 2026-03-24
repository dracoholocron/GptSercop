package com.globalcmx.api.service;

import com.globalcmx.api.dto.command.CreateSwiftFieldConfigCommand;
import com.globalcmx.api.dto.command.UpdateSwiftFieldConfigCommand;
import com.globalcmx.api.dto.swift.SwiftFieldConfigDTO;
import com.globalcmx.api.dto.swift.SwiftVersionComparisonDTO;
import com.globalcmx.api.dto.swift.SwiftVersionComparisonDTO.FieldDifference;
import com.globalcmx.api.dto.swift.SwiftVersionComparisonDTO.ComparisonSummary;
import com.globalcmx.api.readmodel.entity.SwiftFieldConfig;
import com.globalcmx.api.readmodel.repository.SwiftFieldConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio para gestionar configuraciones de campos SWIFT
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SwiftFieldConfigService {

    private final SwiftFieldConfigRepository repository;
    private final SwiftSpecVersionResolver specVersionResolver;

    /**
     * Obtiene todas las configuraciones de campos para un tipo de mensaje
     *
     * @param messageType Tipo de mensaje SWIFT
     * @param activeOnly Si true, solo retorna configuraciones activas
     * @return Lista de configuraciones
     */
    @Transactional(readOnly = true)
    public List<SwiftFieldConfigDTO> findAll(String messageType, Boolean activeOnly) {
        log.info("Finding all Swift field configs for messageType: {}, activeOnly: {}",
                messageType, activeOnly);

        List<SwiftFieldConfig> configs;
        if (activeOnly) {
            // Use the CURRENT ACTIVE version based on system date (not the latest version)
            String currentVersion = specVersionResolver.getCurrentActiveVersion();
            log.info("Using current active spec version: {}", currentVersion);

            configs = repository.findByMessageTypeAndSpecVersionAndIsActiveOrdered(
                    messageType, currentVersion, true);

            // If no fields found for current version, fall back to legacy query
            if (configs.isEmpty()) {
                log.info("No fields found for version {}, falling back to legacy query", currentVersion);
                configs = repository.findActiveByMessageTypeOrdered(messageType);
            }
        } else {
            configs = repository.findByMessageTypeAndIsActive(messageType, true);
        }

        log.info("Repository returned {} configs for messageType {}", configs.size(), messageType);
        if (!configs.isEmpty()) {
            log.info("First config fieldCode: {}, specVersion: {}",
                    configs.get(0).getFieldCode(), configs.get(0).getSpecVersion());
        }

        return configs.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Deduplica una lista de configuraciones por fieldCode, manteniendo solo la primera ocurrencia.
     * Preserva el orden original de la lista.
     *
     * @param configs Lista de configuraciones
     * @return Lista deduplicada
     */
    private List<SwiftFieldConfig> deduplicateByFieldCode(List<SwiftFieldConfig> configs) {
        Map<String, SwiftFieldConfig> uniqueByFieldCode = new LinkedHashMap<>();
        for (SwiftFieldConfig config : configs) {
            uniqueByFieldCode.putIfAbsent(config.getFieldCode(), config);
        }
        return new ArrayList<>(uniqueByFieldCode.values());
    }

    /**
     * Obtiene todas las configuraciones de campos para un tipo de mensaje y versión específica.
     * Este método permite filtrar por versión de especificación SWIFT.
     *
     * @param messageType Tipo de mensaje SWIFT
     * @param activeOnly Si true, solo retorna configuraciones activas
     * @param specVersion Versión de especificación (ej: "2024", "2026")
     * @return Lista de configuraciones
     */
    @Transactional(readOnly = true)
    public List<SwiftFieldConfigDTO> findAllWithVersion(String messageType, Boolean activeOnly, String specVersion) {
        log.info("Finding Swift field configs for messageType: {}, activeOnly: {}, specVersion: {}",
                messageType, activeOnly, specVersion);

        List<SwiftFieldConfig> configs = repository.findByMessageTypeAndSpecVersionAndIsActiveOrdered(
                messageType, specVersion, activeOnly
        );

        log.info("Repository returned {} configs for spec version {}", configs.size(), specVersion);

        // Si no hay campos para la versión solicitada, intentar con la versión más reciente disponible
        if (configs.isEmpty()) {
            log.warn("No configs found for version {}, falling back to latest available", specVersion);
            configs = repository.findActiveLatestVersionByMessageType(messageType);
            log.info("Fallback returned {} configs", configs.size());
        }

        // Deduplicate by fieldCode
        configs = deduplicateByFieldCode(configs);
        log.info("After deduplication: {} configs", configs.size());

        return configs.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene una configuración por ID
     *
     * @param id ID de la configuración
     * @return Configuración
     * @throws RuntimeException si no se encuentra
     */
    @Transactional(readOnly = true)
    public SwiftFieldConfigDTO findById(String id) {
        log.debug("Finding Swift field config by id: {}", id);

        SwiftFieldConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Configuración de campo SWIFT no encontrada: " + id));

        return toDTO(config);
    }

    /**
     * Obtiene una configuración por código de campo y tipo de mensaje
     *
     * @param fieldCode Código del campo
     * @param messageType Tipo de mensaje
     * @return Configuración
     * @throws RuntimeException si no se encuentra
     */
    @Transactional(readOnly = true)
    public SwiftFieldConfigDTO findByCode(String fieldCode, String messageType) {
        log.debug("Finding Swift field config by code: {}, messageType: {}",
                fieldCode, messageType);

        // Use latest version to handle multiple spec versions
        SwiftFieldConfig config = repository.findLatestByFieldCodeAndMessageType(fieldCode, messageType)
                .orElseThrow(() -> new RuntimeException(
                        "Configuración de campo SWIFT no encontrada: " + fieldCode + " - " + messageType));

        return toDTO(config);
    }

    /**
     * Obtiene todas las configuraciones de una sección específica.
     * Filtra por la versión vigente actual según la fecha del sistema.
     *
     * @param section Sección
     * @param messageType Tipo de mensaje
     * @return Lista de configuraciones
     */
    @Transactional(readOnly = true)
    public List<SwiftFieldConfigDTO> findBySection(String section, String messageType) {
        // Obtener la versión vigente actual
        String currentVersion = specVersionResolver.getCurrentActiveVersion();
        log.info("Finding Swift field configs by section: {}, messageType: {}, specVersion: {}",
                section, messageType, currentVersion);

        List<SwiftFieldConfig> configs = repository.findByMessageTypeAndSectionAndSpecVersionAndIsActiveOrderByDisplayOrder(
                messageType, section, currentVersion, true);

        // Fallback: si no hay campos para la versión actual, usar query sin versión
        if (configs.isEmpty()) {
            log.warn("No configs found for version {}, falling back to all versions", currentVersion);
            configs = repository.findByMessageTypeAndSectionAndIsActiveOrderByDisplayOrder(
                    messageType, section, true);
            // Deduplicar por fieldCode
            configs = deduplicateByFieldCode(configs);
        }

        log.info("Returning {} configs for section {} (version {})", configs.size(), section, currentVersion);

        return configs.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Crea una nueva configuración de campo
     *
     * @param command Comando con datos del campo
     * @return Configuración creada
     */
    @Transactional
    public SwiftFieldConfigDTO create(CreateSwiftFieldConfigCommand command) {
        log.info("Creating Swift field config: {}", command.getFieldCode());

        // Verificar que no exista ya
        if (repository.existsByFieldCodeAndMessageType(command.getFieldCode(), command.getMessageType())) {
            throw new RuntimeException("Ya existe una configuración para el campo: " +
                    command.getFieldCode() + " - " + command.getMessageType());
        }

        // Convertir strings vacíos a null para campos JSON
        String validationRules = command.getValidationRules() != null && !command.getValidationRules().trim().isEmpty()
                ? command.getValidationRules() : null;
        String dependencies = command.getDependencies() != null && !command.getDependencies().trim().isEmpty()
                ? command.getDependencies() : null;
        String contextualAlerts = command.getContextualAlerts() != null && !command.getContextualAlerts().trim().isEmpty()
                ? command.getContextualAlerts() : null;
        String fieldOptions = command.getFieldOptions() != null && !command.getFieldOptions().trim().isEmpty()
                ? command.getFieldOptions() : null;

        SwiftFieldConfig config = SwiftFieldConfig.builder()
                .id(UUID.randomUUID().toString())
                .fieldCode(command.getFieldCode())
                .fieldNameKey(command.getFieldNameKey())
                .descriptionKey(command.getDescriptionKey())
                .messageType(command.getMessageType())
                .section(command.getSection())
                .displayOrder(command.getDisplayOrder())
                .isRequired(command.getIsRequired())
                .isActive(true)
                .fieldType(command.getFieldType())
                .componentType(command.getComponentType())
                .placeholderKey(command.getPlaceholderKey())
                .validationRules(validationRules)
                .dependencies(dependencies)
                .contextualAlerts(contextualAlerts)
                .fieldOptions(fieldOptions)
                .defaultValue(command.getDefaultValue())
                .helpTextKey(command.getHelpTextKey())
                .draftFieldMapping(command.getDraftFieldMapping())
                .documentationUrl(command.getDocumentationUrl())
                .createdBy(command.getCreatedBy())
                .build();

        config = repository.save(config);

        log.info("Swift field config created successfully: {}", config.getId());
        return toDTO(config);
    }

    /**
     * Actualiza una configuración existente
     *
     * @param id ID de la configuración
     * @param command Comando con datos a actualizar
     * @return Configuración actualizada
     */
    @Transactional
    public SwiftFieldConfigDTO update(String id, UpdateSwiftFieldConfigCommand command) {
        log.info("Updating Swift field config: {}", id);

        SwiftFieldConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Configuración de campo SWIFT no encontrada: " + id));

        // Actualizar campos si están presentes
        if (command.getFieldNameKey() != null) {
            config.setFieldNameKey(command.getFieldNameKey());
        }
        if (command.getDescriptionKey() != null) {
            config.setDescriptionKey(command.getDescriptionKey());
        }
        if (command.getSection() != null) {
            config.setSection(command.getSection());
        }
        if (command.getDisplayOrder() != null) {
            config.setDisplayOrder(command.getDisplayOrder());
        }
        if (command.getIsRequired() != null) {
            config.setIsRequired(command.getIsRequired());
        }
        if (command.getFieldType() != null) {
            config.setFieldType(command.getFieldType());
        }
        if (command.getComponentType() != null) {
            config.setComponentType(command.getComponentType());
        }
        if (command.getPlaceholderKey() != null) {
            config.setPlaceholderKey(command.getPlaceholderKey());
        }
        // Convertir strings vacíos a null para campos JSON
        if (command.getValidationRules() != null) {
            config.setValidationRules(command.getValidationRules().trim().isEmpty() ? null : command.getValidationRules());
        }
        if (command.getDependencies() != null) {
            config.setDependencies(command.getDependencies().trim().isEmpty() ? null : command.getDependencies());
        }
        if (command.getContextualAlerts() != null) {
            config.setContextualAlerts(command.getContextualAlerts().trim().isEmpty() ? null : command.getContextualAlerts());
        }
        if (command.getFieldOptions() != null) {
            config.setFieldOptions(command.getFieldOptions().trim().isEmpty() ? null : command.getFieldOptions());
        }
        if (command.getDefaultValue() != null) {
            config.setDefaultValue(command.getDefaultValue());
        }
        if (command.getHelpTextKey() != null) {
            config.setHelpTextKey(command.getHelpTextKey());
        }
        if (command.getDraftFieldMapping() != null) {
            config.setDraftFieldMapping(command.getDraftFieldMapping().trim().isEmpty() ? null : command.getDraftFieldMapping());
        }
        if (command.getDocumentationUrl() != null) {
            config.setDocumentationUrl(command.getDocumentationUrl());
        }

        config.setUpdatedBy(command.getUpdatedBy());
        config = repository.save(config);

        log.info("Swift field config updated successfully: {}", id);
        return toDTO(config);
    }

    /**
     * Elimina una configuración
     *
     * @param id ID de la configuración
     */
    @Transactional
    public void delete(String id) {
        log.info("Deleting Swift field config: {}", id);

        if (!repository.existsById(id)) {
            throw new RuntimeException("Configuración de campo SWIFT no encontrada: " + id);
        }

        repository.deleteById(id);
        log.info("Swift field config deleted successfully: {}", id);
    }

    /**
     * Activa una configuración
     *
     * @param id ID de la configuración
     */
    @Transactional
    public void activate(String id) {
        log.info("Activating Swift field config: {}", id);

        SwiftFieldConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Configuración de campo SWIFT no encontrada: " + id));

        config.setIsActive(true);
        repository.save(config);

        log.info("Swift field config activated successfully: {}", id);
    }

    /**
     * Desactiva una configuración
     *
     * @param id ID de la configuración
     */
    @Transactional
    public void deactivate(String id) {
        log.info("Deactivating Swift field config: {}", id);

        SwiftFieldConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Configuración de campo SWIFT no encontrada: " + id));

        config.setIsActive(false);
        repository.save(config);

        log.info("Swift field config deactivated successfully: {}", id);
    }

    /**
     * Obtiene todos los tipos de componente únicos utilizados en la configuración
     *
     * @return Lista de tipos de componente únicos ordenados alfabéticamente
     */
    @Transactional(readOnly = true)
    public List<String> getDistinctComponentTypes() {
        log.info("Getting distinct component types");
        return repository.findDistinctComponentTypes();
    }

    /**
     * Obtiene todas las secciones únicas utilizadas en la configuración
     *
     * @return Lista de secciones únicas ordenadas alfabéticamente
     */
    @Transactional(readOnly = true)
    public List<String> getDistinctSections() {
        log.info("Getting distinct sections");
        return repository.findDistinctSections();
    }

    /**
     * Obtiene todos los tipos de campo únicos utilizados en la configuración
     *
     * @return Lista de tipos de campo únicos ordenados alfabéticamente
     */
    @Transactional(readOnly = true)
    public List<String> getDistinctFieldTypes() {
        log.info("Getting distinct field types");
        return repository.findDistinctFieldTypes();
    }

    /**
     * Obtiene todos los tipos de mensaje únicos que tienen campos configurados
     *
     * @return Lista de tipos de mensaje únicos ordenados alfabéticamente
     */
    @Transactional(readOnly = true)
    public List<String> getDistinctMessageTypes() {
        log.info("Getting distinct message types from field configs");
        return repository.findDistinctMessageTypes();
    }

    /**
     * Obtiene todos los códigos de campo únicos utilizados en la configuración
     *
     * @return Lista de códigos de campo únicos ordenados
     */
    @Transactional(readOnly = true)
    public List<String> getDistinctFieldCodes() {
        log.info("Getting distinct field codes");
        return repository.findDistinctFieldCodes();
    }

    /**
     * Obtiene todas las configuraciones de un código de campo específico a través de todos los tipos de mensaje.
     * Útil para ver y sincronizar configuraciones del mismo campo en diferentes mensajes.
     *
     * @param fieldCode Código del campo (ej: ":20:")
     * @return Lista de configuraciones ordenadas por tipo de mensaje
     */
    @Transactional(readOnly = true)
    public List<SwiftFieldConfigDTO> findByFieldCode(String fieldCode) {
        log.info("Finding all configs for field code: {}", fieldCode);
        List<SwiftFieldConfig> configs = repository.findByFieldCodeOrderByMessageType(fieldCode);
        // Deduplicate by messageType (keep first/latest version)
        Map<String, SwiftFieldConfig> uniqueByMessageType = new LinkedHashMap<>();
        for (SwiftFieldConfig config : configs) {
            uniqueByMessageType.putIfAbsent(config.getMessageType(), config);
        }
        return new ArrayList<>(uniqueByMessageType.values()).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Sincroniza configuraciones de campo desde un campo fuente a campos destino.
     * Copia las propiedades configurables del campo fuente a los campos destino.
     *
     * @param sourceId ID del campo fuente
     * @param targetIds IDs de los campos destino
     * @param properties Propiedades específicas a sincronizar (null = todas las configurables)
     * @return Número de campos actualizados
     */
    @Transactional
    public int syncFieldConfigs(String sourceId, List<String> targetIds, List<String> properties) {
        log.info("Syncing field configs from source {} to {} targets", sourceId, targetIds.size());

        SwiftFieldConfig source = repository.findById(sourceId)
                .orElseThrow(() -> new RuntimeException("Campo fuente no encontrado: " + sourceId));

        int updatedCount = 0;
        for (String targetId : targetIds) {
            if (targetId.equals(sourceId)) {
                continue; // Skip source
            }

            SwiftFieldConfig target = repository.findById(targetId).orElse(null);
            if (target == null) {
                log.warn("Target field not found: {}", targetId);
                continue;
            }

            // Sync configurable properties
            boolean shouldSync = properties == null || properties.isEmpty();

            if (shouldSync || properties.contains("section")) {
                target.setSection(source.getSection());
            }
            if (shouldSync || properties.contains("fieldType")) {
                target.setFieldType(source.getFieldType());
            }
            if (shouldSync || properties.contains("componentType")) {
                target.setComponentType(source.getComponentType());
            }
            if (shouldSync || properties.contains("isRequired")) {
                target.setIsRequired(source.getIsRequired());
            }
            if (shouldSync || properties.contains("validationRules")) {
                target.setValidationRules(source.getValidationRules());
            }
            if (shouldSync || properties.contains("fieldOptions")) {
                target.setFieldOptions(source.getFieldOptions());
            }
            if (shouldSync || properties.contains("contextualAlerts")) {
                target.setContextualAlerts(source.getContextualAlerts());
            }
            if (shouldSync || properties.contains("swiftFormat")) {
                target.setSwiftFormat(source.getSwiftFormat());
            }
            if (shouldSync || properties.contains("swiftStatus")) {
                target.setSwiftStatus(source.getSwiftStatus());
            }

            target.setUpdatedBy("SYNC_FROM_" + source.getMessageType());
            repository.save(target);
            updatedCount++;

            log.debug("Synced {} -> {}", source.getMessageType(), target.getMessageType());
        }

        log.info("Successfully synced {} field configs", updatedCount);
        return updatedCount;
    }

    /**
     * Compara dos versiones de especificación SWIFT y retorna las diferencias
     *
     * @param messageType Tipo de mensaje (ej: MT700)
     * @param version1 Primera versión (ej: 2024)
     * @param version2 Segunda versión (ej: 2026)
     * @return DTO con las diferencias encontradas
     */
    @Transactional(readOnly = true)
    public SwiftVersionComparisonDTO compareVersions(
            String messageType,
            String version1,
            String version2) {

        log.info("Comparing SWIFT spec versions {} vs {} for messageType: {}",
                version1, version2, messageType);

        // Obtener campos de ambas versiones
        List<SwiftFieldConfig> fieldsV1 = repository.findByMessageTypeAndSpecVersionAndIsActiveOrdered(
                messageType, version1, true);
        List<SwiftFieldConfig> fieldsV2 = repository.findByMessageTypeAndSpecVersionAndIsActiveOrdered(
                messageType, version2, true);

        // Crear mapas por fieldCode para comparación
        Map<String, SwiftFieldConfig> mapV1 = fieldsV1.stream()
                .collect(Collectors.toMap(SwiftFieldConfig::getFieldCode, f -> f, (a, b) -> a));
        Map<String, SwiftFieldConfig> mapV2 = fieldsV2.stream()
                .collect(Collectors.toMap(SwiftFieldConfig::getFieldCode, f -> f, (a, b) -> a));

        List<FieldDifference> newFields = new ArrayList<>();
        List<FieldDifference> removedFields = new ArrayList<>();
        List<FieldDifference> modifiedFields = new ArrayList<>();
        List<FieldDifference> unchangedFields = new ArrayList<>();
        int formatChangesCount = 0;
        int statusChangesCount = 0;

        // Buscar campos eliminados y modificados
        for (SwiftFieldConfig fieldV1 : fieldsV1) {
            SwiftFieldConfig fieldV2 = mapV2.get(fieldV1.getFieldCode());

            if (fieldV2 == null) {
                // Campo eliminado en V2
                removedFields.add(createFieldDifference(fieldV1, null));
            } else {
                // Campo existe en ambas versiones - verificar cambios
                List<String> changes = compareFields(fieldV1, fieldV2);

                if (changes.isEmpty()) {
                    unchangedFields.add(createFieldDifference(fieldV1, fieldV2));
                } else {
                    FieldDifference diff = createFieldDifference(fieldV1, fieldV2);
                    diff.setChangedAttributes(changes);
                    modifiedFields.add(diff);

                    if (changes.contains("swiftFormat")) formatChangesCount++;
                    if (changes.contains("swiftStatus")) statusChangesCount++;
                }
            }
        }

        // Buscar campos nuevos en V2
        for (SwiftFieldConfig fieldV2 : fieldsV2) {
            if (!mapV1.containsKey(fieldV2.getFieldCode())) {
                newFields.add(createFieldDifference(null, fieldV2));
            }
        }

        // Crear resumen
        ComparisonSummary summary = ComparisonSummary.builder()
                .totalFieldsV1(fieldsV1.size())
                .totalFieldsV2(fieldsV2.size())
                .newFieldsCount(newFields.size())
                .removedFieldsCount(removedFields.size())
                .modifiedFieldsCount(modifiedFields.size())
                .unchangedFieldsCount(unchangedFields.size())
                .formatChangesCount(formatChangesCount)
                .statusChangesCount(statusChangesCount)
                .build();

        log.info("Version comparison complete - New: {}, Removed: {}, Modified: {}, Unchanged: {}",
                newFields.size(), removedFields.size(), modifiedFields.size(), unchangedFields.size());

        return SwiftVersionComparisonDTO.builder()
                .messageType(messageType)
                .version1(version1)
                .version2(version2)
                .newFields(newFields)
                .removedFields(removedFields)
                .modifiedFields(modifiedFields)
                .unchangedFields(unchangedFields)
                .summary(summary)
                .build();
    }

    /**
     * Compara dos campos y retorna lista de atributos que cambiaron
     */
    private List<String> compareFields(SwiftFieldConfig v1, SwiftFieldConfig v2) {
        List<String> changes = new ArrayList<>();

        if (!Objects.equals(v1.getFieldNameKey(), v2.getFieldNameKey())) changes.add("fieldNameKey");
        if (!Objects.equals(v1.getSwiftFormat(), v2.getSwiftFormat())) changes.add("swiftFormat");
        if (!Objects.equals(v1.getSwiftStatus(), v2.getSwiftStatus())) changes.add("swiftStatus");
        if (!Objects.equals(v1.getIsRequired(), v2.getIsRequired())) changes.add("isRequired");
        if (!Objects.equals(v1.getDescriptionKey(), v2.getDescriptionKey())) changes.add("descriptionKey");
        if (!Objects.equals(v1.getSection(), v2.getSection())) changes.add("section");
        if (!Objects.equals(v1.getComponentType(), v2.getComponentType())) changes.add("componentType");
        if (!Objects.equals(v1.getValidationRules(), v2.getValidationRules())) changes.add("validationRules");

        return changes;
    }

    /**
     * Crea un FieldDifference a partir de los campos de dos versiones
     */
    private FieldDifference createFieldDifference(SwiftFieldConfig v1, SwiftFieldConfig v2) {
        return FieldDifference.builder()
                .fieldCode(v1 != null ? v1.getFieldCode() : v2.getFieldCode())
                .fieldNameKeyV1(v1 != null ? v1.getFieldNameKey() : null)
                .fieldNameKeyV2(v2 != null ? v2.getFieldNameKey() : null)
                .swiftFormatV1(v1 != null ? v1.getSwiftFormat() : null)
                .swiftFormatV2(v2 != null ? v2.getSwiftFormat() : null)
                .swiftStatusV1(v1 != null ? v1.getSwiftStatus() : null)
                .swiftStatusV2(v2 != null ? v2.getSwiftStatus() : null)
                .isRequiredV1(v1 != null ? v1.getIsRequired() : null)
                .isRequiredV2(v2 != null ? v2.getIsRequired() : null)
                .descriptionKeyV1(v1 != null ? v1.getDescriptionKey() : null)
                .descriptionKeyV2(v2 != null ? v2.getDescriptionKey() : null)
                .sectionV1(v1 != null ? v1.getSection() : null)
                .sectionV2(v2 != null ? v2.getSection() : null)
                .successorFieldCode(v1 != null ? v1.getSuccessorFieldCode() : null)
                .specNotes(v2 != null ? v2.getSpecNotes() : (v1 != null ? v1.getSpecNotes() : null))
                .build();
    }

    /**
     * Convierte una entidad a DTO
     *
     * @param entity Entidad
     * @return DTO
     */
    private SwiftFieldConfigDTO toDTO(SwiftFieldConfig entity) {
        return SwiftFieldConfigDTO.builder()
                .id(entity.getId())
                .fieldCode(entity.getFieldCode())
                .fieldNameKey(entity.getFieldNameKey())
                .descriptionKey(entity.getDescriptionKey())
                .messageType(entity.getMessageType())
                .section(entity.getSection())
                .displayOrder(entity.getDisplayOrder())
                .isRequired(entity.getIsRequired())
                .isActive(entity.getIsActive())
                .fieldType(entity.getFieldType())
                .draftFieldMapping(entity.getDraftFieldMapping())
                .componentType(entity.getComponentType())
                .placeholderKey(entity.getPlaceholderKey())
                .validationRules(entity.getValidationRules())
                .dependencies(entity.getDependencies())
                .contextualAlerts(entity.getContextualAlerts())
                .fieldOptions(entity.getFieldOptions())
                .defaultValue(entity.getDefaultValue())
                .helpTextKey(entity.getHelpTextKey())
                .documentationUrl(entity.getDocumentationUrl())
                // Versioning fields
                .specVersion(entity.getSpecVersion())
                .effectiveDate(entity.getEffectiveDate())
                .deprecatedDate(entity.getDeprecatedDate())
                .successorFieldCode(entity.getSuccessorFieldCode())
                .specNotes(entity.getSpecNotes())
                // Raw SWIFT Specification fields
                .swiftFormat(entity.getSwiftFormat())
                .swiftStatus(entity.getSwiftStatus())
                .swiftUsageNotes(entity.getSwiftUsageNotes())
                // AI Assistance
                .aiEnabled(entity.getAiEnabled())
                .aiHelpPrompt(entity.getAiHelpPrompt())
                .aiValidationPrompt(entity.getAiValidationPrompt())
                // Audit fields
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
                .build();
    }
}
