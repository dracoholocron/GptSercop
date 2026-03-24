package com.globalcmx.api.customfields.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.customfields.entity.OperationCustomData;
import com.globalcmx.api.customfields.repository.OperationCustomDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for managing operation custom data.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OperationCustomDataService {

    private final OperationCustomDataRepository repository;
    private final CustomFieldConfigService configService;
    private final ObjectMapper objectMapper;

    /**
     * Get custom data for an operation.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getCustomData(String operationId) {
        return repository.findByOperationId(operationId)
            .map(this::parseCustomData)
            .orElse(new HashMap<>());
    }

    /**
     * Get custom data as entity.
     */
    @Transactional(readOnly = true)
    public Optional<OperationCustomData> getCustomDataEntity(String operationId) {
        return repository.findByOperationId(operationId);
    }

    /**
     * Save custom data for an operation.
     */
    @Transactional
    public OperationCustomData saveCustomData(
            String operationId,
            String operationType,
            Map<String, Object> customData,
            String userId) {

        OperationCustomData entity = repository.findByOperationId(operationId)
            .orElseGet(() -> OperationCustomData.builder()
                .id(UUID.randomUUID().toString())
                .operationId(operationId)
                .operationType(operationType)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build());

        entity.setCustomData(serializeCustomData(customData));
        entity.setUpdatedAt(LocalDateTime.now());
        entity.setUpdatedBy(userId);

        return repository.save(entity);
    }

    /**
     * Update a specific field value.
     */
    @Transactional
    public OperationCustomData updateFieldValue(
            String operationId,
            String operationType,
            String fieldCode,
            Object value,
            String userId) {

        Map<String, Object> customData = getCustomData(operationId);
        customData.put(fieldCode, value);
        return saveCustomData(operationId, operationType, customData, userId);
    }

    /**
     * Update a repeatable section row.
     */
    @Transactional
    public OperationCustomData updateRepeatableSectionRow(
            String operationId,
            String operationType,
            String sectionCode,
            int rowIndex,
            Map<String, Object> rowData,
            String userId) {

        Map<String, Object> customData = getCustomData(operationId);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> sectionData = (List<Map<String, Object>>) customData
            .getOrDefault(sectionCode, new ArrayList<>());

        // Ensure list is large enough
        while (sectionData.size() <= rowIndex) {
            sectionData.add(new HashMap<>());
        }

        sectionData.set(rowIndex, rowData);
        customData.put(sectionCode, sectionData);

        return saveCustomData(operationId, operationType, customData, userId);
    }

    /**
     * Add a row to a repeatable section.
     */
    @Transactional
    public OperationCustomData addRepeatableSectionRow(
            String operationId,
            String operationType,
            String sectionCode,
            Map<String, Object> rowData,
            String userId) {

        Map<String, Object> customData = getCustomData(operationId);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> sectionData = (List<Map<String, Object>>) customData
            .getOrDefault(sectionCode, new ArrayList<>());

        sectionData.add(rowData);
        customData.put(sectionCode, sectionData);

        return saveCustomData(operationId, operationType, customData, userId);
    }

    /**
     * Remove a row from a repeatable section.
     */
    @Transactional
    public OperationCustomData removeRepeatableSectionRow(
            String operationId,
            String operationType,
            String sectionCode,
            int rowIndex,
            String userId) {

        Map<String, Object> customData = getCustomData(operationId);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> sectionData = (List<Map<String, Object>>) customData
            .getOrDefault(sectionCode, new ArrayList<>());

        if (rowIndex >= 0 && rowIndex < sectionData.size()) {
            sectionData.remove(rowIndex);
        }

        customData.put(sectionCode, sectionData);
        return saveCustomData(operationId, operationType, customData, userId);
    }

    /**
     * Get value for a specific field.
     */
    @Transactional(readOnly = true)
    public Object getFieldValue(String operationId, String fieldCode) {
        Map<String, Object> customData = getCustomData(operationId);
        return customData.get(fieldCode);
    }

    /**
     * Get values for a repeatable section.
     */
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getRepeatableSectionData(String operationId, String sectionCode) {
        Map<String, Object> customData = getCustomData(operationId);
        Object sectionData = customData.get(sectionCode);

        if (sectionData instanceof List) {
            return (List<Map<String, Object>>) sectionData;
        }
        return new ArrayList<>();
    }

    /**
     * Validate custom data against configuration.
     */
    @Transactional(readOnly = true)
    public List<String> validateCustomData(
            String operationId,
            String productType,
            String tenantId,
            Map<String, Object> customData) {

        List<String> errors = new ArrayList<>();
        var configuration = configService.getFullConfiguration(productType, tenantId, "WIZARD");

        for (var step : configuration.getSteps()) {
            for (var section : step.getSections()) {
                if ("REPEATABLE".equals(section.getSectionType())) {
                    // Validate repeatable section
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> rows = (List<Map<String, Object>>) customData
                        .getOrDefault(section.getSectionCode(), new ArrayList<>());

                    // Check min/max rows
                    if (rows.size() < section.getMinRows()) {
                        errors.add(String.format("Section %s requires at least %d rows",
                            section.getSectionCode(), section.getMinRows()));
                    }
                    if (rows.size() > section.getMaxRows()) {
                        errors.add(String.format("Section %s allows at most %d rows",
                            section.getSectionCode(), section.getMaxRows()));
                    }

                    // Validate each row
                    for (int i = 0; i < rows.size(); i++) {
                        Map<String, Object> row = rows.get(i);
                        for (var field : section.getFields()) {
                            validateField(field, row.get(field.getFieldCode()), errors,
                                String.format("%s[%d].%s", section.getSectionCode(), i, field.getFieldCode()));
                        }
                    }
                } else {
                    // Validate single section fields
                    for (var field : section.getFields()) {
                        validateField(field, customData.get(field.getFieldCode()), errors, field.getFieldCode());
                    }
                }
            }
        }

        return errors;
    }

    private void validateField(
            com.globalcmx.api.customfields.dto.CustomFieldDTO field,
            Object value,
            List<String> errors,
            String fieldPath) {

        // Check required
        if (Boolean.TRUE.equals(field.getIsRequired())) {
            if (value == null || (value instanceof String && ((String) value).isBlank())) {
                errors.add(String.format("Field %s is required", fieldPath));
            }
        }

        // Additional validation based on validationRules JSON
        // This would parse the JSON and apply pattern/min/max/etc. rules
    }

    // ==================== Helper Methods ====================

    private Map<String, Object> parseCustomData(OperationCustomData entity) {
        try {
            return objectMapper.readValue(entity.getCustomData(),
                new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            log.error("Error parsing custom data for operation {}", entity.getOperationId(), e);
            return new HashMap<>();
        }
    }

    private String serializeCustomData(Map<String, Object> customData) {
        try {
            return objectMapper.writeValueAsString(customData);
        } catch (JsonProcessingException e) {
            log.error("Error serializing custom data", e);
            return "{}";
        }
    }
}
