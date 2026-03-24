package com.globalcmx.api.customfields.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.customfields.entity.CustomFieldConfig;
import com.globalcmx.api.customfields.repository.CustomFieldConfigRepository;
import com.globalcmx.api.readmodel.entity.CatalogoPersonalizadoReadModel;
import com.globalcmx.api.readmodel.repository.CatalogoPersonalizadoReadModelRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Service for mapping fields from Client Portal requests to Operation fields.
 * Uses the mapping configuration stored in custom_field_config_readmodel.
 */
@Service
public class FieldMappingService {

    private static final Logger logger = LoggerFactory.getLogger(FieldMappingService.class);
    private static final String PRODUCT_TYPE_MAPPING_CATALOG = "PRODUCT_TYPE_MAPPING";

    private final CustomFieldConfigRepository fieldConfigRepository;
    private final CatalogoPersonalizadoReadModelRepository catalogRepository;
    private final ObjectMapper objectMapper;

    public FieldMappingService(CustomFieldConfigRepository fieldConfigRepository,
                               CatalogoPersonalizadoReadModelRepository catalogRepository,
                               ObjectMapper objectMapper) {
        this.fieldConfigRepository = fieldConfigRepository;
        this.catalogRepository = catalogRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Get all field mappings for a source product type to a target product type.
     */
    public List<CustomFieldConfig> getMappings(String sourceProductType, String targetProductType) {
        return fieldConfigRepository.findByMapsToProductType(targetProductType);
    }

    /**
     * Apply field mappings to transform source data to target operation data.
     *
     * @param sourceProductType The source product type (e.g., CLIENT_LC_IMPORT_REQUEST)
     * @param targetProductType The target product type (e.g., LC_IMPORT)
     * @param sourceData The source form data from the client request
     * @return Mapped data ready for the operation
     */
    public Map<String, Object> applyMappings(String sourceProductType, String targetProductType, Map<String, Object> sourceData) {
        logger.info("Applying field mappings from {} to {}", sourceProductType, targetProductType);

        Map<String, Object> targetData = new HashMap<>();

        // Get all fields that have mapping configuration for the target product type
        List<CustomFieldConfig> mappedFields = fieldConfigRepository.findByMapsToProductType(targetProductType);

        for (CustomFieldConfig field : mappedFields) {
            String sourceFieldCode = field.getFieldCode();
            Object sourceValue = sourceData.get(sourceFieldCode);

            if (sourceValue == null) {
                continue;
            }

            String targetFieldCode = field.getMapsToFieldCode();
            String transformation = field.getMappingTransformation();
            String paramsJson = field.getMappingParams();

            // Apply transformation
            Object transformedValue = applyTransformation(sourceValue, transformation, paramsJson);

            if (transformedValue != null) {
                targetData.put(targetFieldCode, transformedValue);

                // Also store SWIFT tag mapping info if available
                if (field.getMapsToSwiftTag() != null) {
                    String swiftTagKey = "swift_" + field.getMapsToSwiftTag().replace(":", "");
                    if (field.getMapsToSwiftLine() != null && field.getMapsToSwiftLine() > 0) {
                        swiftTagKey += "_line" + field.getMapsToSwiftLine();
                    }
                    targetData.put(swiftTagKey, transformedValue);
                }
            }
        }

        logger.info("Mapped {} fields from source to target", targetData.size());
        return targetData;
    }

    /**
     * Apply a transformation to a value.
     */
    private Object applyTransformation(Object value, String transformation, String paramsJson) {
        if (transformation == null || transformation.isEmpty() || "DIRECT".equals(transformation)) {
            return value;
        }

        Map<String, Object> params = parseParams(paramsJson);

        try {
            switch (transformation) {
                case "UPPERCASE":
                    return applyUppercase(value, params);

                case "LOWERCASE":
                    return applyLowercase(value, params);

                case "FORMAT_DATE":
                    return applyFormatDate(value, params);

                case "TRUNCATE":
                    return applyTruncate(value, params);

                case "LOOKUP":
                    return applyLookup(value, params);

                default:
                    logger.warn("Unknown transformation type: {}", transformation);
                    return value;
            }
        } catch (Exception e) {
            logger.error("Error applying transformation {}: {}", transformation, e.getMessage());
            return value;
        }
    }

    private Map<String, Object> parseParams(String paramsJson) {
        if (paramsJson == null || paramsJson.isEmpty()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(paramsJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            logger.error("Error parsing transformation params: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    private Object applyUppercase(Object value, Map<String, Object> params) {
        String strValue = String.valueOf(value).toUpperCase();
        Integer maxLength = (Integer) params.get("maxLength");
        if (maxLength != null && strValue.length() > maxLength) {
            strValue = strValue.substring(0, maxLength);
        }
        return strValue;
    }

    private Object applyLowercase(Object value, Map<String, Object> params) {
        String strValue = String.valueOf(value).toLowerCase();
        Integer maxLength = (Integer) params.get("maxLength");
        if (maxLength != null && strValue.length() > maxLength) {
            strValue = strValue.substring(0, maxLength);
        }
        return strValue;
    }

    private Object applyFormatDate(Object value, Map<String, Object> params) {
        String inputFormat = (String) params.getOrDefault("inputFormat", "yyyy-MM-dd");
        String outputFormat = (String) params.getOrDefault("outputFormat", "yyMMdd");

        try {
            DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern(inputFormat);
            DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern(outputFormat);

            LocalDate date = LocalDate.parse(String.valueOf(value), inputFormatter);
            return date.format(outputFormatter);
        } catch (Exception e) {
            logger.error("Error formatting date: {}", e.getMessage());
            return value;
        }
    }

    private Object applyTruncate(Object value, Map<String, Object> params) {
        Integer maxLength = (Integer) params.getOrDefault("maxLength", 35);
        String strValue = String.valueOf(value);
        if (strValue.length() > maxLength) {
            return strValue.substring(0, maxLength);
        }
        return strValue;
    }

    private Object applyLookup(Object value, Map<String, Object> params) {
        // For lookup transformation, we would need to query the catalog
        // For now, return the original value - this can be enhanced to query custom_catalog_read_model
        String catalog = (String) params.get("catalog");
        String sourceField = (String) params.get("sourceField");
        String targetField = (String) params.get("targetField");

        logger.debug("Lookup transformation requested: catalog={}, sourceField={}, targetField={}",
                     catalog, sourceField, targetField);

        // TODO: Implement actual catalog lookup
        // For now, return the original value
        return value;
    }

    /**
     * Get the target product type for a source product type.
     * Reads mapping from PRODUCT_TYPE_MAPPING catalog in database.
     *
     * Catalog structure:
     * - code = sourceProductType (e.g., LC_IMPORT_REQUEST)
     * - name = targetProductType (e.g., LC_IMPORT)
     * - parent_catalog_code = PRODUCT_TYPE_MAPPING
     */
    public String getTargetProductType(String sourceProductType) {
        if (sourceProductType == null) {
            return null;
        }

        try {
            // Find the parent catalog
            Optional<CatalogoPersonalizadoReadModel> parentCatalog =
                catalogRepository.findByCodigo(PRODUCT_TYPE_MAPPING_CATALOG);

            if (parentCatalog.isEmpty()) {
                logger.warn("Product type mapping catalog not found: {}", PRODUCT_TYPE_MAPPING_CATALOG);
                return null;
            }

            // Find the mapping entry by source product type code
            List<CatalogoPersonalizadoReadModel> mappings =
                catalogRepository.findByCatalogoPadreIdAndActivoOrderByOrdenAsc(
                    parentCatalog.get().getId(), true);

            for (CatalogoPersonalizadoReadModel mapping : mappings) {
                if (sourceProductType.equals(mapping.getCodigo())) {
                    // name contains the target product type
                    logger.debug("Found mapping: {} -> {}", sourceProductType, mapping.getNombre());
                    return mapping.getNombre();
                }
            }

            logger.warn("No mapping found for source product type: {}", sourceProductType);
            return null;
        } catch (Exception e) {
            logger.error("Error getting target product type for: {}", sourceProductType, e);
            return null;
        }
    }
}
