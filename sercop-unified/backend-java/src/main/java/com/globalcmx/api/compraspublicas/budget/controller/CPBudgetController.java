package com.globalcmx.api.compraspublicas.budget.controller;

import com.globalcmx.api.compraspublicas.budget.entity.CPBudgetCertificate;
import com.globalcmx.api.compraspublicas.budget.entity.CPBudgetExecution;
import com.globalcmx.api.compraspublicas.budget.service.CPBudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/compras-publicas/budget")
@RequiredArgsConstructor
@Tag(name = "Compras Públicas - Presupuesto", description = "Gestión de certificaciones y ejecuciones presupuestarias")
public class CPBudgetController {

    private final CPBudgetService budgetService;

    @PostMapping("/certificates")
    @Operation(summary = "Crear certificación presupuestaria")
    @PreAuthorize("hasAuthority('CP_BUDGET_MANAGE')")
    public ResponseEntity<CPBudgetCertificate> createCertificate(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails user) {

        String processId = (String) request.get("processId");
        String paaItemId = (String) request.get("paaItemId");
        String certificateNumber = (String) request.get("certificateNumber");
        LocalDate certificateDate = LocalDate.parse((String) request.get("certificateDate"));
        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        String budgetPartition = (String) request.get("budgetPartition");
        String fundingSource = (String) request.get("fundingSource");
        Integer fiscalYear = Integer.valueOf(request.get("fiscalYear").toString());

        CPBudgetCertificate certificate = budgetService.createCertificate(
                processId, paaItemId, certificateNumber, certificateDate, amount,
                budgetPartition, fundingSource, fiscalYear, user.getUsername());
        return ResponseEntity.ok(certificate);
    }

    @GetMapping("/certificates/{id}")
    @Operation(summary = "Obtener certificación presupuestaria por ID")
    @PreAuthorize("hasAuthority('CP_BUDGET_VIEW')")
    public ResponseEntity<CPBudgetCertificate> getCertificate(@PathVariable String id) {
        return ResponseEntity.ok(budgetService.getCertificate(id));
    }

    @GetMapping("/certificates/process/{processId}")
    @Operation(summary = "Obtener certificaciones por proceso")
    @PreAuthorize("hasAuthority('CP_BUDGET_VIEW')")
    public ResponseEntity<List<CPBudgetCertificate>> getCertificatesByProcess(@PathVariable String processId) {
        return ResponseEntity.ok(budgetService.getCertificatesByProcess(processId));
    }

    @PutMapping("/certificates/{id}/status")
    @Operation(summary = "Actualizar estado de certificación presupuestaria")
    @PreAuthorize("hasAuthority('CP_BUDGET_MANAGE')")
    public ResponseEntity<CPBudgetCertificate> updateCertificateStatus(
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {

        String status = (String) request.get("status");
        return ResponseEntity.ok(budgetService.updateCertificateStatus(id, status));
    }

    @PostMapping("/certificates/{certId}/executions")
    @Operation(summary = "Agregar ejecución presupuestaria")
    @PreAuthorize("hasAuthority('CP_BUDGET_MANAGE')")
    public ResponseEntity<CPBudgetExecution> addExecution(
            @PathVariable String certId,
            @RequestBody Map<String, Object> request) {

        String executionType = (String) request.get("executionType");
        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        LocalDate executionDate = LocalDate.parse((String) request.get("executionDate"));
        String documentNumber = (String) request.get("documentNumber");

        CPBudgetExecution execution = budgetService.addExecution(
                certId, executionType, amount, executionDate, documentNumber);
        return ResponseEntity.ok(execution);
    }

    @GetMapping("/certificates/{certId}/executions")
    @Operation(summary = "Obtener ejecuciones de una certificación")
    @PreAuthorize("hasAuthority('CP_BUDGET_VIEW')")
    public ResponseEntity<List<CPBudgetExecution>> getExecutions(@PathVariable String certId) {
        return ResponseEntity.ok(budgetService.getExecutions(certId));
    }
}
