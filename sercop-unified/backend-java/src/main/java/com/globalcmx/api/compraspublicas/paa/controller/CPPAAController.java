package com.globalcmx.api.compraspublicas.paa.controller;

import com.globalcmx.api.compraspublicas.paa.entity.CPPAA;
import com.globalcmx.api.compraspublicas.paa.entity.CPPAAItem;
import com.globalcmx.api.compraspublicas.paa.service.CPPAAService;
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
@RequestMapping("/compras-publicas/paa")
@RequiredArgsConstructor
@Tag(name = "Compras Públicas - PAA", description = "Plan Anual de Adquisiciones")
public class CPPAAController {

    private final CPPAAService paaService;

    @PostMapping
    @Operation(summary = "Crear Plan Anual de Adquisiciones")
    @PreAuthorize("hasAuthority('CP_PAA_EDIT')")
    public ResponseEntity<CPPAA> createPAA(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails user) {

        String entityRuc = (String) request.get("entityRuc");
        String entityName = (String) request.get("entityName");
        String countryCode = (String) request.getOrDefault("countryCode", "EC");
        Integer fiscalYear = (Integer) request.get("fiscalYear");

        CPPAA paa = paaService.createPAA(entityRuc, entityName, countryCode, fiscalYear, user.getUsername());
        return ResponseEntity.ok(paa);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener PAA por ID")
    @PreAuthorize("hasAuthority('CP_PAA_VIEW')")
    public ResponseEntity<CPPAA> getPAA(@PathVariable String id) {
        return ResponseEntity.ok(paaService.getPAA(id));
    }

    @GetMapping
    @Operation(summary = "Listar PAA por país y año fiscal")
    @PreAuthorize("hasAuthority('CP_PAA_VIEW')")
    public ResponseEntity<List<CPPAA>> listPAA(
            @RequestParam(defaultValue = "EC") String countryCode,
            @RequestParam Integer fiscalYear) {

        return ResponseEntity.ok(paaService.listPAAByCountryAndYear(countryCode, fiscalYear));
    }

    @PostMapping("/{paaId}/items")
    @Operation(summary = "Agregar ítem al PAA")
    @PreAuthorize("hasAuthority('CP_PAA_EDIT')")
    public ResponseEntity<CPPAAItem> addItem(
            @PathVariable String paaId,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails user) {

        Integer lineNumber = (Integer) request.get("lineNumber");
        String cpcCode = (String) request.get("cpcCode");
        String cpcDescription = (String) request.get("cpcDescription");
        String itemDescription = (String) request.get("itemDescription");
        String processType = (String) request.get("processType");
        BigDecimal budgetAmount = request.get("budgetAmount") != null
                ? new BigDecimal(request.get("budgetAmount").toString()) : null;
        String budgetPartition = (String) request.get("budgetPartition");
        String fundingSource = (String) request.get("fundingSource");
        String department = (String) request.get("department");
        LocalDate estimatedPublicationDate = request.get("estimatedPublicationDate") != null
                ? LocalDate.parse((String) request.get("estimatedPublicationDate")) : null;
        LocalDate estimatedAdjudicationDate = request.get("estimatedAdjudicationDate") != null
                ? LocalDate.parse((String) request.get("estimatedAdjudicationDate")) : null;
        Integer estimatedContractDurationDays = (Integer) request.get("estimatedContractDurationDays");
        String priority = (String) request.get("priority");

        CPPAAItem item = paaService.addItem(paaId, lineNumber, cpcCode, cpcDescription,
                itemDescription, processType, budgetAmount, budgetPartition, fundingSource,
                department, estimatedPublicationDate, estimatedAdjudicationDate,
                estimatedContractDurationDays, priority, user.getUsername());
        return ResponseEntity.ok(item);
    }

    @PutMapping("/items/{itemId}")
    @Operation(summary = "Actualizar ítem del PAA")
    @PreAuthorize("hasAuthority('CP_PAA_EDIT')")
    public ResponseEntity<CPPAAItem> updateItem(
            @PathVariable String itemId,
            @RequestBody Map<String, Object> updates,
            @AuthenticationPrincipal UserDetails user) {

        CPPAAItem item = paaService.updateItem(itemId, updates, user.getUsername());
        return ResponseEntity.ok(item);
    }

    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "Eliminar ítem del PAA")
    @PreAuthorize("hasAuthority('CP_PAA_EDIT')")
    public ResponseEntity<Void> removeItem(@PathVariable String itemId) {
        paaService.removeItem(itemId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{paaId}/demand-aggregation")
    @Operation(summary = "Obtener agregación de demanda del PAA")
    @PreAuthorize("hasAuthority('CP_PAA_VIEW')")
    public ResponseEntity<List<Map<String, Object>>> getDemandAggregation(@PathVariable String paaId) {
        return ResponseEntity.ok(paaService.getDemandAggregation(paaId));
    }

    @GetMapping("/{paaId}/budget-by-department")
    @Operation(summary = "Obtener presupuesto por departamento del PAA")
    @PreAuthorize("hasAuthority('CP_PAA_VIEW')")
    public ResponseEntity<List<Map<String, Object>>> getBudgetByDepartment(@PathVariable String paaId) {
        return ResponseEntity.ok(paaService.getBudgetByDepartment(paaId));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar datos del PAA")
    @PreAuthorize("hasAuthority('CP_PAA_EDIT')")
    public ResponseEntity<CPPAA> updatePAA(
            @PathVariable String id,
            @RequestBody Map<String, Object> updates,
            @AuthenticationPrincipal UserDetails user) {

        CPPAA paa = paaService.updatePAA(id, updates, user.getUsername());
        return ResponseEntity.ok(paa);
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Actualizar estado del PAA")
    @PreAuthorize("hasAuthority('CP_PAA_EDIT')")
    public ResponseEntity<CPPAA> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails user) {

        String newStatus = (String) request.get("status");
        CPPAA paa = paaService.updateStatus(id, newStatus, user.getUsername());
        return ResponseEntity.ok(paa);
    }
}
