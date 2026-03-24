package com.globalcmx.api.compraspublicas.risk.controller;

import com.globalcmx.api.compraspublicas.risk.entity.CPRiskAssessment;
import com.globalcmx.api.compraspublicas.risk.entity.CPRiskItem;
import com.globalcmx.api.compraspublicas.risk.service.CPRiskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/compras-publicas/risk")
@RequiredArgsConstructor
@Tag(name = "Compras Públicas - Riesgos", description = "Gestión de evaluaciones y matrices de riesgo")
public class CPRiskController {

    private final CPRiskService riskService;

    @PostMapping("/assessments")
    @Operation(summary = "Crear evaluación de riesgos")
    @PreAuthorize("hasAuthority('CP_AI_RISK_DETECTION')")
    public ResponseEntity<CPRiskAssessment> createAssessment(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails user) {

        String processId = (String) request.get("processId");
        String assessor = (String) request.get("assessor");

        CPRiskAssessment assessment = riskService.createAssessment(processId, assessor, user.getUsername());
        return ResponseEntity.ok(assessment);
    }

    @GetMapping("/assessments/{id}")
    @Operation(summary = "Obtener evaluación de riesgos por ID")
    @PreAuthorize("hasAuthority('CP_AI_RISK_DETECTION')")
    public ResponseEntity<CPRiskAssessment> getAssessment(@PathVariable String id) {
        return ResponseEntity.ok(riskService.getAssessment(id));
    }

    @GetMapping("/assessments/process/{processId}")
    @Operation(summary = "Obtener evaluaciones de riesgo por proceso")
    @PreAuthorize("hasAuthority('CP_AI_RISK_DETECTION')")
    public ResponseEntity<List<CPRiskAssessment>> getAssessmentsByProcess(@PathVariable String processId) {
        return ResponseEntity.ok(riskService.getAssessmentsByProcess(processId));
    }

    @PostMapping("/assessments/{assessmentId}/items")
    @Operation(summary = "Agregar ítem de riesgo a evaluación")
    @PreAuthorize("hasAuthority('CP_AI_RISK_DETECTION')")
    public ResponseEntity<CPRiskItem> addRiskItem(
            @PathVariable String assessmentId,
            @RequestBody Map<String, Object> request) {

        String indicatorCode = (String) request.get("indicatorCode");
        Integer probability = Integer.valueOf(request.get("probability").toString());
        Integer impact = Integer.valueOf(request.get("impact").toString());
        Boolean detected = request.get("detected") != null
                ? Boolean.valueOf(request.get("detected").toString()) : false;
        String evidence = (String) request.get("evidence");
        String mitigationPlan = (String) request.get("mitigationPlan");
        String responsible = (String) request.get("responsible");
        String allocation = (String) request.getOrDefault("allocation", "ESTADO");

        CPRiskItem item = riskService.addRiskItem(
                assessmentId, indicatorCode, probability, impact, detected,
                evidence, mitigationPlan, responsible, allocation);
        return ResponseEntity.ok(item);
    }

    @PutMapping("/items/{itemId}")
    @Operation(summary = "Actualizar ítem de riesgo")
    @PreAuthorize("hasAuthority('CP_AI_RISK_DETECTION')")
    public ResponseEntity<CPRiskItem> updateRiskItem(
            @PathVariable String itemId,
            @RequestBody Map<String, Object> updates) {

        return ResponseEntity.ok(riskService.updateRiskItem(itemId, updates));
    }

    @PostMapping("/assessments/{id}/calculate")
    @Operation(summary = "Recalcular puntuación general de riesgo")
    @PreAuthorize("hasAuthority('CP_AI_RISK_DETECTION')")
    public ResponseEntity<CPRiskAssessment> calculateOverallScore(@PathVariable String id) {
        return ResponseEntity.ok(riskService.calculateOverallScore(id));
    }

    @GetMapping("/assessments/{id}/heatmap")
    @Operation(summary = "Obtener datos de mapa de calor de riesgos")
    @PreAuthorize("hasAuthority('CP_AI_RISK_DETECTION')")
    public ResponseEntity<List<Map<String, Object>>> getHeatMapData(@PathVariable String id) {
        return ResponseEntity.ok(riskService.getHeatMapData(id));
    }
}
