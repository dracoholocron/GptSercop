package com.globalcmx.api.externalapi.service;

import com.globalcmx.api.externalapi.entity.ExternalApiResponseMapping;
import com.globalcmx.api.externalapi.entity.ExternalApiResponseMapping.DataType;
import com.globalcmx.api.externalapi.entity.ExternalApiResponseMapping.TransformationType;
import com.globalcmx.api.externalapi.exception.ApiMappingException;
import com.globalcmx.api.externalapi.repository.ExternalApiResponseMappingRepository;
import com.jayway.jsonpath.DocumentContext;
import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.PathNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Service for extracting and mapping data from external API responses.
 * Uses JSONPath to extract values and applies transformations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalApiResponseMappingService {

    private final ExternalApiResponseMappingRepository mappingRepository;

    /**
     * Extracts and maps values from an API response according to the configured mappings.
     *
     * @param apiConfigId The API configuration ID
     * @param responseBody The JSON response body
     * @return Map of internal names to extracted values
     */
    public Map<String, Object> extractResponseData(Long apiConfigId, String responseBody) {
        List<ExternalApiResponseMapping> mappings = mappingRepository
                .findByApiConfigIdAndIsActiveTrueOrderByDisplayOrderAsc(apiConfigId);

        Map<String, Object> extractedData = new LinkedHashMap<>();

        if (responseBody == null || responseBody.isBlank()) {
            log.warn("Response body is empty, cannot extract data");
            return extractedData;
        }

        try {
            DocumentContext jsonContext = JsonPath.parse(responseBody);

            for (ExternalApiResponseMapping mapping : mappings) {
                try {
                    Object value = extractAndProcessValue(jsonContext, mapping);
                    extractedData.put(mapping.getInternalName(), value);

                    log.debug("Extracted {} -> {}", mapping.getInternalName(), value);
                } catch (PathNotFoundException e) {
                    handlePathNotFound(mapping, extractedData);
                } catch (Exception e) {
                    log.error("Error processing response mapping for {}: {}",
                            mapping.getInternalName(), e.getMessage());
                    if (Boolean.TRUE.equals(mapping.getIsRequired())) {
                        throw e;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error parsing API response: {}", e.getMessage());
            throw new ApiMappingException("Failed to parse API response", e);
        }

        return extractedData;
    }

    /**
     * Extracts, converts, transforms, and validates a single value.
     */
    private Object extractAndProcessValue(DocumentContext jsonContext,
                                           ExternalApiResponseMapping mapping) {
        // Extract raw value using JSONPath
        Object value = jsonContext.read(mapping.getResponseJsonPath());

        if (value == null) {
            return handleNullValue(mapping);
        }

        // Convert to target type
        value = convertToTargetType(value, mapping);

        // Apply transformation
        value = applyTransformation(value, mapping);

        // Validate
        validateValue(value, mapping);

        return value;
    }

    /**
     * Handles the case when a path is not found in the response.
     */
    private void handlePathNotFound(ExternalApiResponseMapping mapping,
                                     Map<String, Object> extractedData) {
        if (Boolean.TRUE.equals(mapping.getIsRequired())) {
            throw ApiMappingException.requiredResponseFieldNotFound(mapping.getResponseJsonPath());
        }

        if (mapping.getDefaultValue() != null) {
            Object defaultValue = convertDefaultValue(mapping.getDefaultValue(), mapping.getDataType());
            extractedData.put(mapping.getInternalName(), defaultValue);
        }

        log.debug("Path {} not found, using default", mapping.getResponseJsonPath());
    }

    /**
     * Handles null value from extraction.
     */
    private Object handleNullValue(ExternalApiResponseMapping mapping) {
        if (mapping.getDefaultValue() != null) {
            return convertDefaultValue(mapping.getDefaultValue(), mapping.getDataType());
        }

        if (Boolean.TRUE.equals(mapping.getIsRequired())) {
            throw ApiMappingException.requiredResponseFieldNotFound(mapping.getResponseJsonPath());
        }

        return null;
    }

    /**
     * Converts a value to the target data type.
     */
    private Object convertToTargetType(Object value, ExternalApiResponseMapping mapping) {
        if (value == null) return null;

        try {
            return switch (mapping.getDataType()) {
                case STRING -> String.valueOf(value);
                case NUMBER, DECIMAL -> convertToDecimal(value);
                case INTEGER -> convertToInteger(value);
                case BOOLEAN -> convertToBoolean(value);
                case DATE -> parseDate(value, mapping.getParseFormat());
                case DATETIME -> parseDateTime(value, mapping.getParseFormat());
                case JSON, ARRAY -> value; // Keep as-is
            };
        } catch (Exception e) {
            throw ApiMappingException.invalidDataType(
                    mapping.getInternalName(), mapping.getDataType().name(), value);
        }
    }

    /**
     * Converts a value to BigDecimal.
     */
    private BigDecimal convertToDecimal(Object value) {
        if (value instanceof BigDecimal) {
            return (BigDecimal) value;
        } else if (value instanceof Number) {
            return BigDecimal.valueOf(((Number) value).doubleValue());
        } else {
            return new BigDecimal(String.valueOf(value));
        }
    }

    /**
     * Converts a value to Integer.
     */
    private Integer convertToInteger(Object value) {
        if (value instanceof Integer) {
            return (Integer) value;
        } else if (value instanceof Number) {
            return ((Number) value).intValue();
        } else {
            return Integer.parseInt(String.valueOf(value));
        }
    }

    /**
     * Converts a value to Boolean.
     */
    private Boolean convertToBoolean(Object value) {
        if (value instanceof Boolean) {
            return (Boolean) value;
        } else {
            String str = String.valueOf(value).toLowerCase();
            return "true".equals(str) || "1".equals(str) || "yes".equals(str);
        }
    }

    /**
     * Parses a date value.
     */
    private LocalDate parseDate(Object value, String format) {
        if (value instanceof LocalDate) {
            return (LocalDate) value;
        }

        String strValue = String.valueOf(value);
        String parseFormat = format != null ? format : "yyyy-MM-dd";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(parseFormat);
        return LocalDate.parse(strValue, formatter);
    }

    /**
     * Parses a datetime value.
     */
    private LocalDateTime parseDateTime(Object value, String format) {
        if (value instanceof LocalDateTime) {
            return (LocalDateTime) value;
        }

        String strValue = String.valueOf(value);
        String parseFormat = format != null ? format : "yyyy-MM-dd'T'HH:mm:ss";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(parseFormat);
        return LocalDateTime.parse(strValue, formatter);
    }

    /**
     * Converts a default value string to the appropriate type.
     */
    private Object convertDefaultValue(String defaultValue, DataType dataType) {
        if (defaultValue == null) return null;

        try {
            return switch (dataType) {
                case STRING -> defaultValue;
                case NUMBER, DECIMAL -> new BigDecimal(defaultValue);
                case INTEGER -> Integer.parseInt(defaultValue);
                case BOOLEAN -> Boolean.parseBoolean(defaultValue);
                case DATE -> LocalDate.parse(defaultValue);
                case DATETIME -> LocalDateTime.parse(defaultValue);
                case JSON, ARRAY -> defaultValue;
            };
        } catch (Exception e) {
            log.warn("Could not convert default value '{}' to {}", defaultValue, dataType);
            return defaultValue;
        }
    }

    /**
     * Applies transformation to a value.
     */
    private Object applyTransformation(Object value, ExternalApiResponseMapping mapping) {
        if (value == null || mapping.getTransformationType() == TransformationType.NONE) {
            return value;
        }

        try {
            return switch (mapping.getTransformationType()) {
                case UPPERCASE -> String.valueOf(value).toUpperCase();
                case LOWERCASE -> String.valueOf(value).toLowerCase();
                case TRIM -> String.valueOf(value).trim();
                case ROUND -> roundValue(value, mapping.getTransformationValue());
                case MULTIPLY -> multiplyValue(value, mapping.getTransformationValue());
                case DIVIDE -> divideValue(value, mapping.getTransformationValue());
                case CUSTOM -> value; // Custom not implemented yet
                default -> value;
            };
        } catch (Exception e) {
            throw ApiMappingException.transformationFailed(
                    mapping.getInternalName(), mapping.getTransformationType().name(), e);
        }
    }

    /**
     * Rounds a numeric value.
     */
    private Object roundValue(Object value, String decimalPlaces) {
        BigDecimal decimal = convertToDecimal(value);
        int places = decimalPlaces != null ? Integer.parseInt(decimalPlaces) : 2;
        return decimal.setScale(places, RoundingMode.HALF_UP);
    }

    /**
     * Multiplies a numeric value.
     */
    private Object multiplyValue(Object value, String multiplier) {
        BigDecimal decimal = convertToDecimal(value);
        BigDecimal factor = new BigDecimal(multiplier);
        return decimal.multiply(factor);
    }

    /**
     * Divides a numeric value.
     */
    private Object divideValue(Object value, String divisor) {
        BigDecimal decimal = convertToDecimal(value);
        BigDecimal factor = new BigDecimal(divisor);
        return decimal.divide(factor, 6, RoundingMode.HALF_UP);
    }

    /**
     * Validates a value according to the mapping configuration.
     */
    private void validateValue(Object value, ExternalApiResponseMapping mapping) {
        if (value == null) return;

        // Regex validation
        if (mapping.getValidationRegex() != null && !mapping.getValidationRegex().isBlank()) {
            if (!Pattern.matches(mapping.getValidationRegex(), String.valueOf(value))) {
                throw ApiMappingException.validationFailed(
                        mapping.getInternalName(),
                        "Value does not match pattern: " + mapping.getValidationRegex());
            }
        }

        // Min/max validation for numbers
        if (value instanceof Number || value instanceof BigDecimal) {
            BigDecimal decimal = convertToDecimal(value);

            if (mapping.getValidationMinValue() != null &&
                decimal.compareTo(mapping.getValidationMinValue()) < 0) {
                throw ApiMappingException.validationFailed(
                        mapping.getInternalName(),
                        "Value " + decimal + " is less than minimum " + mapping.getValidationMinValue());
            }

            if (mapping.getValidationMaxValue() != null &&
                decimal.compareTo(mapping.getValidationMaxValue()) > 0) {
                throw ApiMappingException.validationFailed(
                        mapping.getInternalName(),
                        "Value " + decimal + " is greater than maximum " + mapping.getValidationMaxValue());
            }
        }
    }

    /**
     * Gets all mappings for an API config (for admin UI).
     */
    public List<ExternalApiResponseMapping> getMappings(Long apiConfigId) {
        return mappingRepository.findByApiConfigIdOrderByDisplayOrderAsc(apiConfigId);
    }

    /**
     * Saves a mapping.
     */
    public ExternalApiResponseMapping saveMapping(ExternalApiResponseMapping mapping) {
        return mappingRepository.save(mapping);
    }

    /**
     * Deletes a mapping.
     */
    public void deleteMapping(Long mappingId) {
        mappingRepository.deleteById(mappingId);
    }

    /**
     * Deletes all mappings for an API config.
     */
    public void deleteMappings(Long apiConfigId) {
        mappingRepository.deleteByApiConfigId(apiConfigId);
    }
}
