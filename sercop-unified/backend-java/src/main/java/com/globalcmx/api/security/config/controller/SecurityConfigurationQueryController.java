package com.globalcmx.api.security.config.controller;

import com.globalcmx.api.security.config.dto.query.*;
import com.globalcmx.api.security.config.entity.*;
import com.globalcmx.api.security.config.service.query.SecurityConfigurationQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/v1/admin/security-configuration")
@RequiredArgsConstructor
@Tag(name = "Security Configuration", description = "Security configuration queries")
@PreAuthorize("hasRole('ADMIN') or hasAuthority('SECURITY_CONFIG_VIEW')")
public class SecurityConfigurationQueryController {

    private final SecurityConfigurationQueryService queryService;

    @GetMapping("/config")
    @Operation(summary = "Get all active configurations")
    public ResponseEntity<List<SecurityConfigurationQueryDTO>> getAllConfigurations() {
        return ResponseEntity.ok(queryService.getAllActiveConfigurations());
    }

    @GetMapping("/config/{type}")
    @Operation(summary = "Get configurations by type")
    public ResponseEntity<List<SecurityConfigurationQueryDTO>> getConfigurationsByType(
            @PathVariable SecurityConfigurationReadModel.ConfigType type) {
        return ResponseEntity.ok(queryService.getConfigurationsByType(type));
    }

    @GetMapping("/presets")
    @Operation(summary = "Get all security presets")
    public ResponseEntity<List<SecurityPresetQueryDTO>> getAllPresets() {
        return ResponseEntity.ok(queryService.getAllPresets());
    }

    @GetMapping("/presets/system")
    @Operation(summary = "Get system presets")
    public ResponseEntity<List<SecurityPresetQueryDTO>> getSystemPresets() {
        return ResponseEntity.ok(queryService.getSystemPresets());
    }

    @GetMapping("/four-eyes")
    @Operation(summary = "Get all 4-Eyes configurations")
    public ResponseEntity<List<FourEyesConfigQueryDTO>> getAllFourEyesConfigs() {
        return ResponseEntity.ok(queryService.getAllFourEyesConfigs());
    }

    @GetMapping("/four-eyes/{entityType}")
    @Operation(summary = "Get 4-Eyes configurations by entity type")
    public ResponseEntity<List<FourEyesConfigQueryDTO>> getFourEyesConfigsByEntity(
            @PathVariable String entityType) {
        return ResponseEntity.ok(queryService.getFourEyesConfigsByEntity(entityType));
    }

    @GetMapping("/audit-log")
    @Operation(summary = "Get security configuration audit log")
    public ResponseEntity<Page<SecurityConfigAuditLog>> getAuditLog(Pageable pageable) {
        return ResponseEntity.ok(queryService.getAuditLog(pageable));
    }

    @GetMapping("/risk-rules")
    @Operation(summary = "Get active risk scoring rules")
    public ResponseEntity<List<RiskScoringRule>> getActiveRiskRules() {
        return ResponseEntity.ok(queryService.getActiveRiskRules());
    }
}
