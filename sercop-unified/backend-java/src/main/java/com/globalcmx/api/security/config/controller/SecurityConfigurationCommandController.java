package com.globalcmx.api.security.config.controller;

import com.globalcmx.api.security.config.dto.command.*;
import com.globalcmx.api.security.config.entity.*;
import com.globalcmx.api.security.config.service.command.SecurityConfigurationCommandService;
import com.globalcmx.api.security.engine.AuthorizationCombiner;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1/admin/security-configuration")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Security Configuration", description = "Security configuration management")
@PreAuthorize("hasRole('ADMIN') or hasAuthority('SECURITY_CONFIG_MANAGE')")
public class SecurityConfigurationCommandController {

    private final SecurityConfigurationCommandService commandService;
    private final AuthorizationCombiner authorizationCombiner;

    @PostMapping("/config")
    @Operation(summary = "Update security configuration")
    public ResponseEntity<SecurityConfigurationReadModel> updateConfiguration(
            @RequestBody UpdateSecurityConfigCommand command) {
        return ResponseEntity.ok(commandService.updateConfiguration(command));
    }

    @PostMapping("/presets/{code}/apply")
    @Operation(summary = "Apply security preset")
    public ResponseEntity<Void> applyPreset(
            @PathVariable String code,
            @RequestBody(required = false) ApplySecurityPresetCommand command) {
        if (command == null) {
            command = new ApplySecurityPresetCommand();
        }
        command.setPresetCode(code);
        commandService.applyPreset(command);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/four-eyes")
    @Operation(summary = "Create or update 4-Eyes configuration")
    public ResponseEntity<FourEyesConfig> updateFourEyesConfig(
            @Valid @RequestBody UpdateFourEyesConfigCommand command) {
        return ResponseEntity.ok(commandService.updateFourEyesConfig(command));
    }

    @PutMapping("/four-eyes/{id}")
    @Operation(summary = "Update existing 4-Eyes configuration")
    public ResponseEntity<FourEyesConfig> updateFourEyesConfigById(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFourEyesConfigCommand command) {
        command.setId(id);
        return ResponseEntity.ok(commandService.updateFourEyesConfig(command));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Force refresh of security configuration cache",
               description = "Manually triggers a refresh of all cached security configurations. " +
                           "Use this if configurations were changed directly in the database or " +
                           "if automatic refresh didn't work as expected.")
    public ResponseEntity<Map<String, Object>> refreshConfiguration() {
        String currentUser = getCurrentUser();
        log.info("Manual security configuration refresh requested by: {}", currentUser);

        try {
            authorizationCombiner.refreshConfiguration();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Security configuration refreshed successfully",
                    "refreshedBy", currentUser,
                    "timestamp", java.time.Instant.now().toString()
            ));
        } catch (Exception e) {
            log.error("Failed to refresh security configuration: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Failed to refresh configuration: " + e.getMessage(),
                    "refreshedBy", currentUser
            ));
        }
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }
}
