package com.globalcmx.api.compraspublicas.methodology.controller;

import com.globalcmx.api.compraspublicas.legal.entity.CPKnownEntity;
import com.globalcmx.api.compraspublicas.legal.entity.CPLegalContext;
import com.globalcmx.api.compraspublicas.legal.entity.CPProcurementThreshold;
import com.globalcmx.api.compraspublicas.legal.service.CPLegalContextService;
import com.globalcmx.api.compraspublicas.methodology.entity.CPPAAMethodology;
import com.globalcmx.api.compraspublicas.methodology.service.CPPAAMethodologyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/compras-publicas/ai/methodology")
@RequiredArgsConstructor
@Tag(name = "Compras Publicas - Metodologia PAA", description = "Metodologias configurables para PAA")
public class CPPAAMethodologyController {

    private final CPPAAMethodologyService methodologyService;
    private final CPLegalContextService legalContextService;

    @GetMapping("/active")
    @Operation(summary = "Obtener todas las metodologias activas (usuario puede elegir)")
    @PreAuthorize("hasAuthority('CP_PAA_VIEW')")
    public ResponseEntity<List<CPPAAMethodology>> getActiveMethodologies(
            @RequestParam(defaultValue = "EC") String countryCode) {
        return ResponseEntity.ok(methodologyService.getActiveMethodologies(countryCode));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener metodologia por ID con fases y mappings")
    @PreAuthorize("hasAuthority('CP_PAA_VIEW')")
    public ResponseEntity<CPPAAMethodology> getMethodology(@PathVariable Long id) {
        return ResponseEntity.ok(methodologyService.getMethodology(id));
    }

    @GetMapping("/by-code/{code}")
    @Operation(summary = "Obtener metodologia por codigo")
    @PreAuthorize("hasAuthority('CP_PAA_VIEW')")
    public ResponseEntity<CPPAAMethodology> getMethodologyByCode(@PathVariable String code) {
        return ResponseEntity.ok(methodologyService.getMethodologyByCode(code));
    }

    @GetMapping("/default")
    @Operation(summary = "Obtener la metodologia por defecto")
    @PreAuthorize("hasAuthority('CP_PAA_VIEW')")
    public ResponseEntity<CPPAAMethodology> getDefaultMethodology(
            @RequestParam(defaultValue = "EC") String countryCode) {
        return ResponseEntity.ok(methodologyService.getDefaultMethodology(countryCode));
    }

    // ========================================================================
    // Legal context endpoints
    // ========================================================================

    @GetMapping("/legal-context")
    @Operation(summary = "Obtener todo el marco legal activo")
    @PreAuthorize("hasAuthority('CP_PAA_VIEW')")
    public ResponseEntity<List<CPLegalContext>> getLegalContext() {
        return ResponseEntity.ok(legalContextService.getAllActiveLegalContext());
    }

    @GetMapping("/legal-context/phase/{phaseCode}")
    @Operation(summary = "Obtener marco legal aplicable a una fase especifica")
    @PreAuthorize("hasAuthority('CP_PAA_VIEW')")
    public ResponseEntity<Map<String, String>> getLegalContextForPhase(@PathVariable String phaseCode) {
        return ResponseEntity.ok(Map.of("legalContext", legalContextService.getLegalContextForPhase(phaseCode)));
    }

    @GetMapping("/known-entities")
    @Operation(summary = "Obtener entidades publicas conocidas")
    @PreAuthorize("hasAuthority('CP_PAA_VIEW')")
    public ResponseEntity<List<CPKnownEntity>> getKnownEntities() {
        return ResponseEntity.ok(legalContextService.getAllKnownEntities());
    }

    @GetMapping("/procurement-thresholds")
    @Operation(summary = "Obtener umbrales de contratacion vigentes")
    @PreAuthorize("hasAuthority('CP_PAA_VIEW')")
    public ResponseEntity<List<CPProcurementThreshold>> getProcurementThresholds() {
        return ResponseEntity.ok(legalContextService.getCurrentThresholds());
    }
}
