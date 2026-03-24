package com.globalcmx.api.customfields.service;

import com.globalcmx.api.customfields.dto.*;
import com.globalcmx.api.customfields.entity.*;
import com.globalcmx.api.customfields.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing custom field configuration.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomFieldConfigService {

    private final CustomFieldStepConfigRepository stepRepository;
    private final CustomFieldSectionConfigRepository sectionRepository;
    private final CustomFieldConfigRepository fieldRepository;

    // ==================== Step Configuration ====================

    /**
     * Get all steps for a product type.
     */
    @Transactional(readOnly = true)
    public List<CustomFieldStepConfig> getStepsForProduct(String productType, String tenantId) {
        return stepRepository.findActiveStepsForProduct(productType, tenantId);
    }

    /**
     * Get separate steps (not embedded in SWIFT).
     */
    @Transactional(readOnly = true)
    public List<CustomFieldStepConfig> getSeparateSteps(String productType, String tenantId) {
        return stepRepository.findByEmbedMode("SEPARATE_STEP", productType, tenantId);
    }

    /**
     * Get steps embedded in a specific SWIFT step.
     */
    @Transactional(readOnly = true)
    public List<CustomFieldStepConfig> getStepsEmbeddedInSwift(String swiftStep, String productType, String tenantId) {
        return stepRepository.findEmbeddedInSwiftStep(swiftStep, productType, tenantId);
    }

    /**
     * Create a new step.
     */
    @Transactional
    public CustomFieldStepConfig createStep(CustomFieldStepConfig step, String userId) {
        step.setId(UUID.randomUUID().toString());
        step.setCreatedAt(LocalDateTime.now());
        step.setCreatedBy(userId);
        return stepRepository.save(step);
    }

    /**
     * Update a step.
     */
    @Transactional
    public CustomFieldStepConfig updateStep(String stepId, CustomFieldStepConfig updates, String userId) {
        CustomFieldStepConfig step = stepRepository.findById(stepId)
            .orElseThrow(() -> new IllegalArgumentException("Step not found: " + stepId));

        step.setStepNameKey(updates.getStepNameKey());
        step.setStepDescriptionKey(updates.getStepDescriptionKey());
        step.setProductType(updates.getProductType());
        step.setDisplayOrder(updates.getDisplayOrder());
        step.setIcon(updates.getIcon());
        step.setShowInWizard(updates.getShowInWizard());
        step.setShowInExpert(updates.getShowInExpert());
        step.setShowInCustom(updates.getShowInCustom());
        step.setShowInView(updates.getShowInView());
        step.setEmbedMode(updates.getEmbedMode());
        step.setEmbedSwiftStep(updates.getEmbedSwiftStep());
        step.setIsActive(updates.getIsActive());
        step.setUpdatedBy(userId);

        return stepRepository.save(step);
    }

    /**
     * Delete a step (soft delete). Cascades to deactivate child sections and fields.
     */
    @Transactional
    public void deleteStep(String stepId, String userId) {
        CustomFieldStepConfig step = stepRepository.findById(stepId)
            .orElseThrow(() -> new IllegalArgumentException("Step not found: " + stepId));
        step.setIsActive(false);
        step.setUpdatedBy(userId);
        // Cascade soft-delete to child sections and their fields
        List<CustomFieldSectionConfig> allSections = sectionRepository.findAllByStepId(stepId);
        for (CustomFieldSectionConfig section : allSections) {
            section.setIsActive(false);
            section.setUpdatedBy(userId);
            List<CustomFieldConfig> allFields = fieldRepository.findAllBySectionId(section.getId());
            for (CustomFieldConfig field : allFields) {
                field.setIsActive(false);
                field.setUpdatedBy(userId);
            }
            fieldRepository.saveAll(allFields);
        }
        sectionRepository.saveAll(allSections);
        stepRepository.save(step);
    }

    // ==================== Section Configuration ====================

    /**
     * Get sections for a step.
     */
    @Transactional(readOnly = true)
    public List<CustomFieldSectionConfig> getSectionsForStep(String stepId) {
        return sectionRepository.findActiveSectionsByStepId(stepId);
    }

    /**
     * Get sections to embed after a SWIFT section.
     */
    @Transactional(readOnly = true)
    public List<CustomFieldSectionConfig> getSectionsToEmbedAfterSwiftSection(
            String sectionCode, String productType, String tenantId) {
        return sectionRepository.findSectionsToEmbedAfterSwiftSection(sectionCode, productType, tenantId);
    }

    /**
     * Create a new section.
     */
    @Transactional
    public CustomFieldSectionConfig createSection(CustomFieldSectionConfig section, String userId) {
        section.setId(UUID.randomUUID().toString());
        section.setCreatedAt(LocalDateTime.now());
        section.setCreatedBy(userId);
        return sectionRepository.save(section);
    }

    /**
     * Update a section.
     */
    @Transactional
    public CustomFieldSectionConfig updateSection(String sectionId, CustomFieldSectionConfig updates, String userId) {
        CustomFieldSectionConfig section = sectionRepository.findById(sectionId)
            .orElseThrow(() -> new IllegalArgumentException("Section not found: " + sectionId));

        section.setSectionNameKey(updates.getSectionNameKey());
        section.setSectionDescriptionKey(updates.getSectionDescriptionKey());
        section.setSectionType(updates.getSectionType());
        section.setMinRows(updates.getMinRows());
        section.setMaxRows(updates.getMaxRows());
        section.setDisplayOrder(updates.getDisplayOrder());
        section.setCollapsible(updates.getCollapsible());
        section.setDefaultCollapsed(updates.getDefaultCollapsed());
        section.setColumns(updates.getColumns());
        section.setEmbedMode(updates.getEmbedMode());
        section.setEmbedTargetType(updates.getEmbedTargetType());
        section.setEmbedTargetCode(updates.getEmbedTargetCode());
        section.setEmbedShowSeparator(updates.getEmbedShowSeparator());
        section.setEmbedCollapsible(updates.getEmbedCollapsible());
        section.setEmbedSeparatorTitleKey(updates.getEmbedSeparatorTitleKey());
        section.setShowInWizard(updates.getShowInWizard());
        section.setShowInExpert(updates.getShowInExpert());
        section.setShowInCustom(updates.getShowInCustom());
        section.setShowInView(updates.getShowInView());
        section.setIsActive(updates.getIsActive());
        section.setUpdatedBy(userId);

        return sectionRepository.save(section);
    }

    /**
     * Delete a section (soft delete). Cascades to deactivate child fields.
     */
    @Transactional
    public void deleteSection(String sectionId, String userId) {
        CustomFieldSectionConfig section = sectionRepository.findById(sectionId)
            .orElseThrow(() -> new IllegalArgumentException("Section not found: " + sectionId));
        section.setIsActive(false);
        section.setUpdatedBy(userId);
        // Cascade soft-delete to child fields
        List<CustomFieldConfig> allFields = fieldRepository.findAllBySectionId(sectionId);
        for (CustomFieldConfig field : allFields) {
            field.setIsActive(false);
            field.setUpdatedBy(userId);
        }
        fieldRepository.saveAll(allFields);
        sectionRepository.save(section);
    }

    // ==================== Field Configuration ====================

    /**
     * Get fields for a section.
     */
    @Transactional(readOnly = true)
    public List<CustomFieldConfig> getFieldsForSection(String sectionId) {
        return fieldRepository.findActiveFieldsBySectionId(sectionId);
    }

    /**
     * Get fields for a section based on mode.
     */
    @Transactional(readOnly = true)
    public List<CustomFieldConfig> getFieldsForMode(String sectionId, String mode) {
        return switch (mode.toUpperCase()) {
            case "WIZARD" -> fieldRepository.findWizardFieldsBySectionId(sectionId);
            case "EXPERT" -> fieldRepository.findExpertFieldsBySectionId(sectionId);
            case "VIEW" -> fieldRepository.findViewFieldsBySectionId(sectionId);
            default -> fieldRepository.findActiveFieldsBySectionId(sectionId);
        };
    }

    /**
     * Get fields to show in operation list.
     */
    @Transactional(readOnly = true)
    public List<CustomFieldConfig> getListFields(String productType, String tenantId) {
        return fieldRepository.findListFieldsForProduct(productType, tenantId);
    }

    /**
     * Get fields to embed after a SWIFT field.
     */
    @Transactional(readOnly = true)
    public List<CustomFieldConfig> getFieldsToEmbedAfterSwiftField(
            String swiftFieldCode, String productType, String tenantId) {
        return fieldRepository.findFieldsToEmbedAfterSwiftField(swiftFieldCode, productType, tenantId);
    }

    /**
     * Create a new field.
     */
    @Transactional
    public CustomFieldConfig createField(CustomFieldConfig field, String userId) {
        field.setId(UUID.randomUUID().toString());
        field.setCreatedAt(LocalDateTime.now());
        field.setCreatedBy(userId);
        // Sanitize JSON fields - empty strings are invalid JSON in MySQL
        sanitizeJsonFields(field);
        return fieldRepository.save(field);
    }

    /**
     * Sanitize JSON fields to convert empty strings to null.
     */
    private void sanitizeJsonFields(CustomFieldConfig field) {
        field.setDataSourceFilters(emptyToNull(field.getDataSourceFilters()));
        field.setRequiredCondition(emptyToNull(field.getRequiredCondition()));
        field.setValidationRules(emptyToNull(field.getValidationRules()));
        field.setDependencies(emptyToNull(field.getDependencies()));
        field.setDefaultValueExpression(emptyToNull(field.getDefaultValueExpression()));
        field.setFieldOptions(emptyToNull(field.getFieldOptions()));
    }

    /**
     * Update a field.
     */
    @Transactional
    public CustomFieldConfig updateField(String fieldId, CustomFieldConfig updates, String userId) {
        CustomFieldConfig field = fieldRepository.findById(fieldId)
            .orElseThrow(() -> new IllegalArgumentException("Field not found: " + fieldId));

        field.setFieldNameKey(updates.getFieldNameKey());
        field.setFieldDescriptionKey(updates.getFieldDescriptionKey());
        field.setFieldType(updates.getFieldType());
        field.setComponentType(updates.getComponentType());
        field.setDataSourceType(emptyToNull(updates.getDataSourceType()));
        field.setDataSourceCode(emptyToNull(updates.getDataSourceCode()));
        field.setDataSourceFilters(emptyToNull(updates.getDataSourceFilters()));
        field.setDisplayOrder(updates.getDisplayOrder());
        field.setPlaceholderKey(emptyToNull(updates.getPlaceholderKey()));
        field.setHelpTextKey(emptyToNull(updates.getHelpTextKey()));
        field.setSpanColumns(updates.getSpanColumns());
        field.setIsRequired(updates.getIsRequired());
        field.setRequiredCondition(emptyToNull(updates.getRequiredCondition()));
        field.setValidationRules(emptyToNull(updates.getValidationRules()));
        field.setDependencies(emptyToNull(updates.getDependencies()));
        field.setDefaultValue(emptyToNull(updates.getDefaultValue()));
        field.setDefaultValueExpression(emptyToNull(updates.getDefaultValueExpression()));
        field.setFieldOptions(emptyToNull(updates.getFieldOptions()));
        field.setEmbedAfterSwiftField(emptyToNull(updates.getEmbedAfterSwiftField()));
        field.setEmbedInline(updates.getEmbedInline());
        field.setShowInWizard(updates.getShowInWizard());
        field.setShowInExpert(updates.getShowInExpert());
        field.setShowInCustom(updates.getShowInCustom());
        field.setShowInView(updates.getShowInView());
        field.setShowInList(updates.getShowInList());
        field.setIsActive(updates.getIsActive());
        field.setUpdatedBy(userId);

        return fieldRepository.save(field);
    }

    /**
     * Convert empty string to null (for JSON fields that can't be empty strings in MySQL).
     */
    private String emptyToNull(String value) {
        return (value == null || value.trim().isEmpty()) ? null : value;
    }

    /**
     * Delete a field (soft delete).
     */
    @Transactional
    public void deleteField(String fieldId, String userId) {
        CustomFieldConfig field = fieldRepository.findById(fieldId)
            .orElseThrow(() -> new IllegalArgumentException("Field not found: " + fieldId));
        field.setIsActive(false);
        field.setUpdatedBy(userId);
        fieldRepository.save(field);
    }

    // ==================== Full Configuration ====================

    /**
     * Get complete custom fields configuration for a product.
     */
    @Transactional(readOnly = true)
    public CustomFieldsConfigurationDTO getFullConfiguration(String productType, String tenantId, String mode) {
        List<CustomFieldStepConfig> steps = getStepsForProduct(productType, tenantId);

        List<CustomFieldStepDTO> stepDTOs = steps.stream()
            .filter(step -> isVisibleInMode(step, mode))
            .map(step -> {
                CustomFieldStepDTO stepDTO = mapStepToDTO(step);
                List<CustomFieldSectionConfig> sections = getSectionsForStep(step.getId());

                List<CustomFieldSectionDTO> sectionDTOs = sections.stream()
                    .filter(section -> isVisibleInMode(section, mode))
                    .map(section -> {
                        CustomFieldSectionDTO sectionDTO = mapSectionToDTO(section);
                        List<CustomFieldConfig> fields = getFieldsForMode(section.getId(), mode);
                        sectionDTO.setFields(fields.stream()
                            .map(this::mapFieldToDTO)
                            .collect(Collectors.toList()));
                        return sectionDTO;
                    })
                    .collect(Collectors.toList());

                stepDTO.setSections(sectionDTOs);
                return stepDTO;
            })
            .collect(Collectors.toList());

        return CustomFieldsConfigurationDTO.builder()
            .productType(productType)
            .tenantId(tenantId)
            .mode(mode)
            .steps(stepDTOs)
            .build();
    }

    // ==================== Helper Methods ====================

    private boolean isVisibleInMode(CustomFieldStepConfig step, String mode) {
        return switch (mode.toUpperCase()) {
            case "WIZARD" -> Boolean.TRUE.equals(step.getShowInWizard());
            case "EXPERT" -> Boolean.TRUE.equals(step.getShowInExpert());
            case "CUSTOM" -> Boolean.TRUE.equals(step.getShowInCustom());
            case "VIEW" -> Boolean.TRUE.equals(step.getShowInView());
            default -> true;
        };
    }

    private boolean isVisibleInMode(CustomFieldSectionConfig section, String mode) {
        return switch (mode.toUpperCase()) {
            case "WIZARD" -> Boolean.TRUE.equals(section.getShowInWizard());
            case "EXPERT" -> Boolean.TRUE.equals(section.getShowInExpert());
            case "CUSTOM" -> Boolean.TRUE.equals(section.getShowInCustom());
            case "VIEW" -> Boolean.TRUE.equals(section.getShowInView());
            default -> true;
        };
    }

    private CustomFieldStepDTO mapStepToDTO(CustomFieldStepConfig step) {
        return CustomFieldStepDTO.builder()
            .id(step.getId())
            .stepCode(step.getStepCode())
            .stepNameKey(step.getStepNameKey())
            .stepDescriptionKey(step.getStepDescriptionKey())
            .productType(step.getProductType())
            .displayOrder(step.getDisplayOrder())
            .icon(step.getIcon())
            .embedMode(step.getEmbedMode())
            .embedSwiftStep(step.getEmbedSwiftStep())
            .build();
    }

    private CustomFieldSectionDTO mapSectionToDTO(CustomFieldSectionConfig section) {
        return CustomFieldSectionDTO.builder()
            .id(section.getId())
            .sectionCode(section.getSectionCode())
            .sectionNameKey(section.getSectionNameKey())
            .sectionDescriptionKey(section.getSectionDescriptionKey())
            .sectionType(section.getSectionType())
            .minRows(section.getMinRows())
            .maxRows(section.getMaxRows())
            .displayOrder(section.getDisplayOrder())
            .collapsible(section.getCollapsible())
            .defaultCollapsed(section.getDefaultCollapsed())
            .columns(section.getColumns())
            .embedMode(section.getEmbedMode())
            .embedTargetType(section.getEmbedTargetType())
            .embedTargetCode(section.getEmbedTargetCode())
            .embedShowSeparator(section.getEmbedShowSeparator())
            .embedCollapsible(section.getEmbedCollapsible())
            .embedSeparatorTitleKey(section.getEmbedSeparatorTitleKey())
            .build();
    }

    private CustomFieldDTO mapFieldToDTO(CustomFieldConfig field) {
        return CustomFieldDTO.builder()
            .id(field.getId())
            .fieldCode(field.getFieldCode())
            .fieldNameKey(field.getFieldNameKey())
            .fieldDescriptionKey(field.getFieldDescriptionKey())
            .fieldType(field.getFieldType())
            .componentType(field.getComponentType())
            .dataSourceType(field.getDataSourceType())
            .dataSourceCode(field.getDataSourceCode())
            .dataSourceFilters(field.getDataSourceFilters())
            .displayOrder(field.getDisplayOrder())
            .placeholderKey(field.getPlaceholderKey())
            .helpTextKey(field.getHelpTextKey())
            .spanColumns(field.getSpanColumns())
            .isRequired(field.getIsRequired())
            .requiredCondition(field.getRequiredCondition())
            .validationRules(field.getValidationRules())
            .dependencies(field.getDependencies())
            .defaultValue(field.getDefaultValue())
            .defaultValueExpression(field.getDefaultValueExpression())
            .fieldOptions(field.getFieldOptions())
            .embedAfterSwiftField(field.getEmbedAfterSwiftField())
            .embedInline(field.getEmbedInline())
            .aiEnabled(field.getAiEnabled())
            .aiHelpPrompt(field.getAiHelpPrompt())
            .aiValidationPrompt(field.getAiValidationPrompt())
            .build();
    }
}
