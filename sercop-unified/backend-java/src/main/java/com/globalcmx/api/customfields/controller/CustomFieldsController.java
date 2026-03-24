package com.globalcmx.api.customfields.controller;

import com.globalcmx.api.customfields.dto.*;
import com.globalcmx.api.customfields.entity.*;
import com.globalcmx.api.customfields.service.*;
import com.globalcmx.api.readmodel.entity.SwiftDraftReadModel;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import com.globalcmx.api.readmodel.repository.SwiftDraftReadModelRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Custom Fields API.
 */
@RestController
@RequestMapping("/custom-fields")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Custom Fields", description = "API for custom fields configuration and data")
public class CustomFieldsController {

    private final CustomFieldConfigService configService;
    private final OperationCustomDataService dataService;
    private final OperationReadModelRepository operationRepository;
    private final SwiftDraftReadModelRepository draftRepository;
    private final com.globalcmx.api.service.query.OperationAnalyzerService operationAnalyzerService;

    // ==================== Configuration Endpoints ====================

    @GetMapping("/config")
    @Operation(summary = "Get custom fields configuration for a product")
    @PreAuthorize("hasPermission(null, 'custom_fields:read')")
    public ResponseEntity<CustomFieldsConfigurationDTO> getConfiguration(
            @RequestParam String productType,
            @RequestParam(required = false) String tenantId,
            @RequestParam(defaultValue = "WIZARD") String mode) {

        var config = configService.getFullConfiguration(productType, tenantId, mode);
        return ResponseEntity.ok(config);
    }

    @GetMapping("/config/steps")
    @Operation(summary = "Get all steps for a product")
    @PreAuthorize("hasPermission(null, 'custom_fields:read')")
    public ResponseEntity<List<CustomFieldStepConfig>> getSteps(
            @RequestParam String productType,
            @RequestParam(required = false) String tenantId) {

        var steps = configService.getStepsForProduct(productType, tenantId);
        return ResponseEntity.ok(steps);
    }

    @GetMapping("/config/steps/separate")
    @Operation(summary = "Get separate steps (not embedded in SWIFT)")
    @PreAuthorize("hasPermission(null, 'custom_fields:read')")
    public ResponseEntity<List<CustomFieldStepConfig>> getSeparateSteps(
            @RequestParam String productType,
            @RequestParam(required = false) String tenantId) {

        var steps = configService.getSeparateSteps(productType, tenantId);
        return ResponseEntity.ok(steps);
    }

    @GetMapping("/config/steps/embedded/{swiftStep}")
    @Operation(summary = "Get steps embedded in a SWIFT step")
    @PreAuthorize("hasPermission(null, 'custom_fields:read')")
    public ResponseEntity<List<CustomFieldStepConfig>> getEmbeddedSteps(
            @PathVariable String swiftStep,
            @RequestParam String productType,
            @RequestParam(required = false) String tenantId) {

        var steps = configService.getStepsEmbeddedInSwift(swiftStep, productType, tenantId);
        return ResponseEntity.ok(steps);
    }

    @GetMapping("/config/sections")
    @Operation(summary = "Get sections for a step")
    @PreAuthorize("hasPermission(null, 'custom_fields:read')")
    public ResponseEntity<List<CustomFieldSectionConfig>> getSectionsForStep(
            @RequestParam String stepId) {

        var sections = configService.getSectionsForStep(stepId);
        return ResponseEntity.ok(sections);
    }

    @GetMapping("/config/sections/embed-after/{sectionCode}")
    @Operation(summary = "Get sections to embed after a SWIFT section")
    @PreAuthorize("hasPermission(null, 'custom_fields:read')")
    public ResponseEntity<List<CustomFieldSectionConfig>> getSectionsToEmbed(
            @PathVariable String sectionCode,
            @RequestParam String productType,
            @RequestParam(required = false) String tenantId) {

        var sections = configService.getSectionsToEmbedAfterSwiftSection(sectionCode, productType, tenantId);
        return ResponseEntity.ok(sections);
    }

    @GetMapping("/config/fields")
    @Operation(summary = "Get fields for a section")
    @PreAuthorize("hasPermission(null, 'custom_fields:read')")
    public ResponseEntity<List<CustomFieldConfig>> getFieldsForSection(
            @RequestParam String sectionId) {

        var fields = configService.getFieldsForSection(sectionId);
        return ResponseEntity.ok(fields);
    }

    @GetMapping("/config/fields/list")
    @Operation(summary = "Get fields to show in operation list")
    @PreAuthorize("hasPermission(null, 'custom_fields:read')")
    public ResponseEntity<List<CustomFieldConfig>> getListFields(
            @RequestParam String productType,
            @RequestParam(required = false) String tenantId) {

        var fields = configService.getListFields(productType, tenantId);
        return ResponseEntity.ok(fields);
    }

    @GetMapping("/config/fields/embed-after/{swiftFieldCode}")
    @Operation(summary = "Get fields to embed after a SWIFT field")
    @PreAuthorize("hasPermission(null, 'custom_fields:read')")
    public ResponseEntity<List<CustomFieldConfig>> getFieldsToEmbed(
            @PathVariable String swiftFieldCode,
            @RequestParam String productType,
            @RequestParam(required = false) String tenantId) {

        var fields = configService.getFieldsToEmbedAfterSwiftField(swiftFieldCode, productType, tenantId);
        return ResponseEntity.ok(fields);
    }

    // ==================== Admin Configuration Endpoints ====================

    @PostMapping("/config/steps")
    @Operation(summary = "Create a new step")
    @PreAuthorize("hasPermission(null, 'custom_fields:write')")
    public ResponseEntity<CustomFieldStepConfig> createStep(
            @RequestBody CustomFieldStepConfig step,
            @AuthenticationPrincipal UserDetails user) {

        var created = configService.createStep(step, user.getUsername());
        return ResponseEntity.ok(created);
    }

    @PutMapping("/config/steps/{stepId}")
    @Operation(summary = "Update a step")
    @PreAuthorize("hasPermission(null, 'custom_fields:write')")
    public ResponseEntity<CustomFieldStepConfig> updateStep(
            @PathVariable String stepId,
            @RequestBody CustomFieldStepConfig step,
            @AuthenticationPrincipal UserDetails user) {

        var updated = configService.updateStep(stepId, step, user.getUsername());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/config/steps/{stepId}")
    @Operation(summary = "Delete a step (soft delete)")
    @PreAuthorize("hasPermission(null, 'custom_fields:delete')")
    public ResponseEntity<Void> deleteStep(
            @PathVariable String stepId,
            @AuthenticationPrincipal UserDetails user) {

        configService.deleteStep(stepId, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/config/sections")
    @Operation(summary = "Create a new section")
    @PreAuthorize("hasPermission(null, 'custom_fields:write')")
    public ResponseEntity<CustomFieldSectionConfig> createSection(
            @RequestBody CustomFieldSectionConfig section,
            @AuthenticationPrincipal UserDetails user) {

        var created = configService.createSection(section, user.getUsername());
        return ResponseEntity.ok(created);
    }

    @PutMapping("/config/sections/{sectionId}")
    @Operation(summary = "Update a section")
    @PreAuthorize("hasPermission(null, 'custom_fields:write')")
    public ResponseEntity<CustomFieldSectionConfig> updateSection(
            @PathVariable String sectionId,
            @RequestBody CustomFieldSectionConfig section,
            @AuthenticationPrincipal UserDetails user) {

        var updated = configService.updateSection(sectionId, section, user.getUsername());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/config/sections/{sectionId}")
    @Operation(summary = "Delete a section (soft delete)")
    @PreAuthorize("hasPermission(null, 'custom_fields:delete')")
    public ResponseEntity<Void> deleteSection(
            @PathVariable String sectionId,
            @AuthenticationPrincipal UserDetails user) {

        configService.deleteSection(sectionId, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/config/fields")
    @Operation(summary = "Create a new field")
    @PreAuthorize("hasPermission(null, 'custom_fields:write')")
    public ResponseEntity<CustomFieldConfig> createField(
            @RequestBody CustomFieldConfig field,
            @AuthenticationPrincipal UserDetails user) {

        var created = configService.createField(field, user.getUsername());
        return ResponseEntity.ok(created);
    }

    @PutMapping("/config/fields/{fieldId}")
    @Operation(summary = "Update a field")
    @PreAuthorize("hasPermission(null, 'custom_fields:write')")
    public ResponseEntity<CustomFieldConfig> updateField(
            @PathVariable String fieldId,
            @RequestBody CustomFieldConfig field,
            @AuthenticationPrincipal UserDetails user) {

        var updated = configService.updateField(fieldId, field, user.getUsername());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/config/fields/{fieldId}")
    @Operation(summary = "Delete a field (soft delete)")
    @PreAuthorize("hasPermission(null, 'custom_fields:delete')")
    public ResponseEntity<Void> deleteField(
            @PathVariable String fieldId,
            @AuthenticationPrincipal UserDetails user) {

        configService.deleteField(fieldId, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    // ==================== Operation Data Endpoints ====================

    @GetMapping("/data/{operationId}")
    @Operation(summary = "Get custom data for an operation")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getOperationCustomData(
            @PathVariable String operationId) {

        var data = dataService.getCustomData(operationId);

        // If no custom data in operation, try to recover from draft
        if (data.isEmpty()) {
            var operation = operationRepository.findByOperationId(operationId);
            if (operation.isPresent() && operation.get().getOriginalDraftId() != null) {
                var draft = draftRepository.findByDraftId(operation.get().getOriginalDraftId());
                if (draft.isPresent()) {
                    String cd = draft.get().getCustomData();
                    if (cd != null && !cd.isBlank() && !cd.equals("{}")) {
                        log.info("Recovering custom data from draft {} for operation {}",
                                draft.get().getDraftId(), operationId);
                        try {
                            var objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                            Map<String, Object> draftData = objectMapper.readValue(cd,
                                    new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
                            dataService.saveCustomData(operationId,
                                    operation.get().getProductType(), draftData, "system-recovery");
                            return ResponseEntity.ok(draftData);
                        } catch (Exception e) {
                            log.warn("Error recovering custom data from draft: {}", e.getMessage());
                        }
                    }
                }
            }
        }

        return ResponseEntity.ok(data);
    }

    @PutMapping("/data/{operationId}")
    @Operation(summary = "Save custom data for an operation")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OperationCustomData> saveOperationCustomData(
            @PathVariable String operationId,
            @RequestParam String operationType,
            @RequestBody Map<String, Object> customData,
            @AuthenticationPrincipal UserDetails user) {

        var saved = dataService.saveCustomData(operationId, operationType, customData, user.getUsername());

        // Resync: re-extraer parties del SWIFT al readmodel (contingencia)
        try {
            operationAnalyzerService.resyncOperationFromSwift(operationId);
        } catch (Exception e) {
            log.warn("Error during resync after saving custom fields for {}: {}", operationId, e.getMessage());
        }

        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/data/{operationId}/field/{fieldCode}")
    @Operation(summary = "Update a single field value")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OperationCustomData> updateFieldValue(
            @PathVariable String operationId,
            @PathVariable String fieldCode,
            @RequestParam String operationType,
            @RequestBody Object value,
            @AuthenticationPrincipal UserDetails user) {

        var saved = dataService.updateFieldValue(operationId, operationType, fieldCode, value, user.getUsername());
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/data/{operationId}/section/{sectionCode}/row")
    @Operation(summary = "Add a row to a repeatable section")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OperationCustomData> addRepeatableSectionRow(
            @PathVariable String operationId,
            @PathVariable String sectionCode,
            @RequestParam String operationType,
            @RequestBody Map<String, Object> rowData,
            @AuthenticationPrincipal UserDetails user) {

        var saved = dataService.addRepeatableSectionRow(operationId, operationType, sectionCode, rowData, user.getUsername());
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/data/{operationId}/section/{sectionCode}/row/{rowIndex}")
    @Operation(summary = "Update a row in a repeatable section")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OperationCustomData> updateRepeatableSectionRow(
            @PathVariable String operationId,
            @PathVariable String sectionCode,
            @PathVariable int rowIndex,
            @RequestParam String operationType,
            @RequestBody Map<String, Object> rowData,
            @AuthenticationPrincipal UserDetails user) {

        var saved = dataService.updateRepeatableSectionRow(operationId, operationType, sectionCode, rowIndex, rowData, user.getUsername());
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/data/{operationId}/section/{sectionCode}/row/{rowIndex}")
    @Operation(summary = "Remove a row from a repeatable section")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OperationCustomData> removeRepeatableSectionRow(
            @PathVariable String operationId,
            @PathVariable String sectionCode,
            @PathVariable int rowIndex,
            @RequestParam String operationType,
            @AuthenticationPrincipal UserDetails user) {

        var saved = dataService.removeRepeatableSectionRow(operationId, operationType, sectionCode, rowIndex, user.getUsername());
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/data/{operationId}/validate")
    @Operation(summary = "Validate custom data against configuration")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<String>> validateCustomData(
            @PathVariable String operationId,
            @RequestParam String productType,
            @RequestParam(required = false) String tenantId,
            @RequestBody Map<String, Object> customData) {

        var errors = dataService.validateCustomData(operationId, productType, tenantId, customData);
        return ResponseEntity.ok(errors);
    }
}
