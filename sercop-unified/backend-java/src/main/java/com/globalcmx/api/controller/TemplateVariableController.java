package com.globalcmx.api.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.readmodel.entity.TemplateVariable;
import com.globalcmx.api.readmodel.repository.TemplateVariableRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST Controller for managing Template Variables.
 * Provides CRUD operations for template_variable table.
 * These variables are used in action configurations for dynamic placeholders.
 * Labels and descriptions use i18n keys that the frontend resolves.
 */
@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
@Slf4j
public class TemplateVariableController {

    private final TemplateVariableRepository repository;

    // ==================== Admin Endpoints ====================

    /**
     * Get all template variables (admin).
     */
    @GetMapping("/admin/template-variables")
    @PreAuthorize("hasPermission(null, 'VIEW_TEMPLATE_VARIABLES')")
    public ResponseEntity<ApiResponse<List<TemplateVariable>>> findAll() {
        List<TemplateVariable> variables = repository.findAllByOrderByCategoryAscDisplayOrderAsc();
        return ResponseEntity.ok(ApiResponse.success("OK", variables));
    }

    /**
     * Get template variable by ID.
     */
    @GetMapping("/admin/template-variables/{id}")
    @PreAuthorize("hasPermission(null, 'VIEW_TEMPLATE_VARIABLES')")
    public ResponseEntity<ApiResponse<TemplateVariable>> findById(@PathVariable Long id) {
        TemplateVariable variable = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("TemplateVariable not found: " + id));
        return ResponseEntity.ok(ApiResponse.success("OK", variable));
    }

    /**
     * Get template variables by category.
     */
    @GetMapping("/admin/template-variables/category/{category}")
    @PreAuthorize("hasPermission(null, 'VIEW_TEMPLATE_VARIABLES')")
    public ResponseEntity<ApiResponse<List<TemplateVariable>>> findByCategory(
            @PathVariable String category) {
        List<TemplateVariable> variables = repository.findByCategoryAndIsActiveTrueOrderByDisplayOrderAsc(category);
        return ResponseEntity.ok(ApiResponse.success("OK", variables));
    }

    /**
     * Get distinct categories.
     */
    @GetMapping("/admin/template-variables/categories")
    @PreAuthorize("hasPermission(null, 'VIEW_TEMPLATE_VARIABLES')")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        List<String> categories = repository.findDistinctCategories();
        return ResponseEntity.ok(ApiResponse.success("OK", categories));
    }

    /**
     * Search variables by code or label key.
     */
    @GetMapping("/admin/template-variables/search")
    @PreAuthorize("hasPermission(null, 'VIEW_TEMPLATE_VARIABLES')")
    public ResponseEntity<ApiResponse<List<TemplateVariable>>> search(@RequestParam String q) {
        List<TemplateVariable> variables = repository.searchByCodeOrLabelKey(q);
        return ResponseEntity.ok(ApiResponse.success("OK", variables));
    }

    /**
     * Create a new template variable.
     */
    @PostMapping("/admin/template-variables")
    @PreAuthorize("hasPermission(null, 'MANAGE_TEMPLATE_VARIABLES')")
    public ResponseEntity<ApiResponse<TemplateVariable>> create(
            @RequestBody TemplateVariableDTO dto) {
        log.info("Creating template variable: {}", dto.getCode());

        // Check for duplicate
        if (repository.existsByCode(dto.getCode())) {
            throw new RuntimeException("Template variable already exists: " + dto.getCode());
        }

        TemplateVariable variable = TemplateVariable.builder()
                .code(dto.getCode())
                .labelKey(dto.getLabelKey())
                .descriptionKey(dto.getDescriptionKey())
                .category(dto.getCategory())
                .color(dto.getColor() != null ? dto.getColor() : "gray")
                .sourceTable(dto.getSourceTable())
                .sourceColumn(dto.getSourceColumn())
                .dataType(dto.getDataType() != null ? dto.getDataType() : "STRING")
                .formatPattern(dto.getFormatPattern())
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .createdAt(LocalDateTime.now())
                .createdBy("system")
                .build();

        variable = repository.save(variable);
        log.info("Created template variable with ID: {}", variable.getId());

        return ResponseEntity.ok(ApiResponse.success("Created", variable));
    }

    /**
     * Update an existing template variable.
     */
    @PutMapping("/admin/template-variables/{id}")
    @PreAuthorize("hasPermission(null, 'MANAGE_TEMPLATE_VARIABLES')")
    public ResponseEntity<ApiResponse<TemplateVariable>> update(
            @PathVariable Long id,
            @RequestBody TemplateVariableDTO dto) {
        log.info("Updating template variable ID: {}", id);

        TemplateVariable variable = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("TemplateVariable not found: " + id));

        // Check for duplicate if code changed
        if (!variable.getCode().equals(dto.getCode()) && repository.existsByCode(dto.getCode())) {
            throw new RuntimeException("Template variable already exists: " + dto.getCode());
        }

        variable.setCode(dto.getCode());
        variable.setLabelKey(dto.getLabelKey());
        variable.setDescriptionKey(dto.getDescriptionKey());
        variable.setCategory(dto.getCategory());
        if (dto.getColor() != null) {
            variable.setColor(dto.getColor());
        }
        variable.setSourceTable(dto.getSourceTable());
        variable.setSourceColumn(dto.getSourceColumn());
        if (dto.getDataType() != null) {
            variable.setDataType(dto.getDataType());
        }
        variable.setFormatPattern(dto.getFormatPattern());
        if (dto.getDisplayOrder() != null) {
            variable.setDisplayOrder(dto.getDisplayOrder());
        }
        if (dto.getIsActive() != null) {
            variable.setIsActive(dto.getIsActive());
        }

        variable = repository.save(variable);
        log.info("Updated template variable ID: {}", id);

        return ResponseEntity.ok(ApiResponse.success("Updated", variable));
    }

    /**
     * Delete a template variable.
     */
    @DeleteMapping("/admin/template-variables/{id}")
    @PreAuthorize("hasPermission(null, 'MANAGE_TEMPLATE_VARIABLES')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        log.info("Deleting template variable ID: {}", id);

        if (!repository.existsById(id)) {
            throw new RuntimeException("TemplateVariable not found: " + id);
        }

        repository.deleteById(id);
        log.info("Deleted template variable ID: {}", id);

        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }

    /**
     * Toggle active status.
     */
    @PostMapping("/admin/template-variables/{id}/toggle-active")
    @PreAuthorize("hasPermission(null, 'MANAGE_TEMPLATE_VARIABLES')")
    public ResponseEntity<ApiResponse<TemplateVariable>> toggleActive(@PathVariable Long id) {
        log.info("Toggling active status for template variable ID: {}", id);

        TemplateVariable variable = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("TemplateVariable not found: " + id));

        variable.setIsActive(!variable.getIsActive());
        variable = repository.save(variable);

        log.info("Template variable ID: {} is now active={}", id, variable.getIsActive());

        return ResponseEntity.ok(ApiResponse.success("OK", variable));
    }

    // ==================== Public Endpoint for Action Editor ====================

    /**
     * Get active template variables grouped by category.
     * Used by the frontend ActionEditor component.
     */
    @GetMapping("/template-variables/active")
    @PreAuthorize("hasPermission(null, 'VIEW_TEMPLATE_VARIABLES')")
    public ResponseEntity<ApiResponse<List<CategoryVariablesDTO>>> getActiveVariablesGrouped() {
        List<TemplateVariable> variables = repository.findByIsActiveTrueOrderByCategoryAscDisplayOrderAsc();

        // Group by category
        Map<String, List<TemplateVariable>> grouped = variables.stream()
                .collect(Collectors.groupingBy(TemplateVariable::getCategory));

        // Convert to DTO with category info
        List<CategoryVariablesDTO> result = grouped.entrySet().stream()
                .map(entry -> {
                    String category = entry.getKey();
                    List<TemplateVariable> vars = entry.getValue();
                    String color = vars.isEmpty() ? "gray" : vars.get(0).getColor();
                    return new CategoryVariablesDTO(category, color, vars);
                })
                .sorted((a, b) -> getCategoryOrder(a.getCategory()) - getCategoryOrder(b.getCategory()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }

    /**
     * Get category display order for sorting.
     */
    private int getCategoryOrder(String category) {
        return switch (category) {
            case "OPERATION" -> 1;
            case "AMOUNTS" -> 2;
            case "APPLICANT" -> 3;
            case "BENEFICIARY" -> 4;
            case "BANKS" -> 5;
            case "DATES" -> 6;
            case "USER" -> 7;
            case "SWIFT" -> 8;
            default -> 99;
        };
    }

    // ==================== DTOs ====================

    @lombok.Data
    public static class TemplateVariableDTO {
        private String code;
        private String labelKey;
        private String descriptionKey;
        private String category;
        private String color;
        private String sourceTable;
        private String sourceColumn;
        private String dataType;
        private String formatPattern;
        private Integer displayOrder;
        private Boolean isActive;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class CategoryVariablesDTO {
        private String category;
        private String color;
        private List<TemplateVariable> variables;
    }
}
