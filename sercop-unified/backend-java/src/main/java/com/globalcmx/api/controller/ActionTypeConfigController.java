package com.globalcmx.api.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.readmodel.entity.ActionTypeConfig;
import com.globalcmx.api.readmodel.repository.ActionTypeConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * REST Controller for managing Action Type Configurations.
 * Provides CRUD operations for action_type_config table.
 */
@RestController
@RequestMapping("/v1/admin/action-type-config")
@RequiredArgsConstructor
@Slf4j
public class ActionTypeConfigController {

    private final ActionTypeConfigRepository repository;

    /**
     * Get all action type configurations.
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'VIEW_ACTION_TYPE_CONFIG')")
    public ResponseEntity<ApiResponse<List<ActionTypeConfig>>> findAll() {
        List<ActionTypeConfig> configs = repository.findAll();
        return ResponseEntity.ok(ApiResponse.success("OK", configs));
    }

    /**
     * Get action type configurations by language.
     */
    @GetMapping("/language/{language}")
    @PreAuthorize("hasPermission(null, 'VIEW_ACTION_TYPE_CONFIG')")
    public ResponseEntity<ApiResponse<List<ActionTypeConfig>>> findByLanguage(
            @PathVariable String language) {
        List<ActionTypeConfig> configs = repository.findByLanguageAndIsActiveTrueOrderByDisplayOrder(language);
        return ResponseEntity.ok(ApiResponse.success("OK", configs));
    }

    /**
     * Get action type configuration by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'VIEW_ACTION_TYPE_CONFIG')")
    public ResponseEntity<ApiResponse<ActionTypeConfig>> findById(@PathVariable Long id) {
        ActionTypeConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("ActionTypeConfig not found: " + id));
        return ResponseEntity.ok(ApiResponse.success("OK", config));
    }

    /**
     * Create a new action type configuration.
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'MANAGE_ACTION_TYPE_CONFIG')")
    public ResponseEntity<ApiResponse<ActionTypeConfig>> create(
            @RequestBody ActionTypeConfigDTO dto) {
        log.info("Creating action type config: {} - {}", dto.getActionType(), dto.getLanguage());

        // Check for duplicate
        if (repository.existsByActionTypeAndLanguage(dto.getActionType(), dto.getLanguage())) {
            throw new RuntimeException("Action type config already exists for: " +
                    dto.getActionType() + " / " + dto.getLanguage());
        }

        ActionTypeConfig config = ActionTypeConfig.builder()
                .actionType(dto.getActionType())
                .language(dto.getLanguage())
                .displayName(dto.getDisplayName())
                .description(dto.getDescription())
                .helpText(dto.getHelpText())
                .icon(dto.getIcon())
                .color(dto.getColor())
                .successMessage(dto.getSuccessMessage())
                .errorMessage(dto.getErrorMessage())
                .retryMessage(dto.getRetryMessage())
                .skipMessage(dto.getSkipMessage())
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .createdAt(LocalDateTime.now())
                .build();

        config = repository.save(config);
        log.info("Created action type config with ID: {}", config.getId());

        return ResponseEntity.ok(ApiResponse.success("Created", config));
    }

    /**
     * Update an existing action type configuration.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'MANAGE_ACTION_TYPE_CONFIG')")
    public ResponseEntity<ApiResponse<ActionTypeConfig>> update(
            @PathVariable Long id,
            @RequestBody ActionTypeConfigDTO dto) {
        log.info("Updating action type config ID: {}", id);

        ActionTypeConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("ActionTypeConfig not found: " + id));

        // Check for duplicate if action_type or language changed
        if (!config.getActionType().equals(dto.getActionType()) ||
            !config.getLanguage().equals(dto.getLanguage())) {
            if (repository.existsByActionTypeAndLanguage(dto.getActionType(), dto.getLanguage())) {
                throw new RuntimeException("Action type config already exists for: " +
                        dto.getActionType() + " / " + dto.getLanguage());
            }
        }

        config.setActionType(dto.getActionType());
        config.setLanguage(dto.getLanguage());
        config.setDisplayName(dto.getDisplayName());
        config.setDescription(dto.getDescription());
        config.setHelpText(dto.getHelpText());
        config.setIcon(dto.getIcon());
        config.setColor(dto.getColor());
        config.setSuccessMessage(dto.getSuccessMessage());
        config.setErrorMessage(dto.getErrorMessage());
        config.setRetryMessage(dto.getRetryMessage());
        config.setSkipMessage(dto.getSkipMessage());
        if (dto.getDisplayOrder() != null) {
            config.setDisplayOrder(dto.getDisplayOrder());
        }
        if (dto.getIsActive() != null) {
            config.setIsActive(dto.getIsActive());
        }

        config = repository.save(config);
        log.info("Updated action type config ID: {}", id);

        return ResponseEntity.ok(ApiResponse.success("Updated", config));
    }

    /**
     * Delete an action type configuration.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'MANAGE_ACTION_TYPE_CONFIG')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        log.info("Deleting action type config ID: {}", id);

        if (!repository.existsById(id)) {
            throw new RuntimeException("ActionTypeConfig not found: " + id);
        }

        repository.deleteById(id);
        log.info("Deleted action type config ID: {}", id);

        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }

    /**
     * Toggle active status.
     */
    @PostMapping("/{id}/toggle-active")
    @PreAuthorize("hasPermission(null, 'MANAGE_ACTION_TYPE_CONFIG')")
    public ResponseEntity<ApiResponse<ActionTypeConfig>> toggleActive(@PathVariable Long id) {
        log.info("Toggling active status for action type config ID: {}", id);

        ActionTypeConfig config = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("ActionTypeConfig not found: " + id));

        config.setIsActive(!config.getIsActive());
        config = repository.save(config);

        log.info("Action type config ID: {} is now active={}", id, config.getIsActive());

        return ResponseEntity.ok(ApiResponse.success("OK", config));
    }

    /**
     * Get distinct action types.
     */
    @GetMapping("/action-types")
    @PreAuthorize("hasPermission(null, 'VIEW_ACTION_TYPE_CONFIG')")
    public ResponseEntity<ApiResponse<List<String>>> getDistinctActionTypes() {
        List<String> actionTypes = repository.findDistinctActionTypes();
        return ResponseEntity.ok(ApiResponse.success("OK", actionTypes));
    }

    // ==================== DTO ====================

    @lombok.Data
    public static class ActionTypeConfigDTO {
        private String actionType;
        private String language;
        private String displayName;
        private String description;
        private String helpText;
        private String icon;
        private String color;
        private String successMessage;
        private String errorMessage;
        private String retryMessage;
        private String skipMessage;
        private Integer displayOrder;
        private Boolean isActive;
    }
}
