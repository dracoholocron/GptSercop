package com.globalcmx.api.compraspublicas.paa.controller;

import com.globalcmx.api.compraspublicas.paa.entity.CPPAADepartmentPlan;
import com.globalcmx.api.compraspublicas.paa.entity.CPPAAWorkspace;
import com.globalcmx.api.compraspublicas.paa.entity.CPPAAWorkspaceComment;
import com.globalcmx.api.compraspublicas.paa.entity.CPPAAWorkspaceObserver;
import com.globalcmx.api.compraspublicas.paa.entity.CPPAAWorkspaceProposal;
import com.globalcmx.api.compraspublicas.paa.entity.CPPAAFieldChangeLog;
import com.globalcmx.api.compraspublicas.paa.service.CPPAAWorkspaceService;
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
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/compras-publicas/paa/workspaces")
@RequiredArgsConstructor
@Tag(name = "Compras Publicas - PAA Workspaces", description = "Gestion colaborativa de PAA por departamentos")
public class CPPAAWorkspaceController {

    private final CPPAAWorkspaceService workspaceService;

    // ========================================================================
    // Workspace endpoints
    // ========================================================================

    @PostMapping
    @Operation(summary = "Crear workspace PAA colaborativo")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_MANAGE')")
    public ResponseEntity<CPPAAWorkspace> createWorkspace(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails user) {

        CPPAAWorkspace workspace = workspaceService.createWorkspace(
                (String) request.get("entityRuc"),
                (String) request.get("entityName"),
                (Integer) request.get("fiscalYear"),
                (String) request.get("sectorCode"),
                request.get("methodologyId") != null ? ((Number) request.get("methodologyId")).longValue() : null,
                request.get("totalBudget") != null ? new BigDecimal(request.get("totalBudget").toString()) : null,
                user.getUsername(),
                (String) request.getOrDefault("coordinatorUserName", user.getUsername())
        );
        return ResponseEntity.ok(workspace);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener workspace con planes departamentales")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<CPPAAWorkspace> getWorkspace(@PathVariable Long id) {
        return ResponseEntity.ok(workspaceService.getWorkspace(id));
    }

    @GetMapping
    @Operation(summary = "Listar workspaces por anio fiscal")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<List<CPPAAWorkspace>> listWorkspaces(
            @RequestParam(defaultValue = "2026") Integer fiscalYear) {
        return ResponseEntity.ok(workspaceService.listWorkspaces(fiscalYear));
    }

    @GetMapping("/my")
    @Operation(summary = "Listar mis workspaces como coordinador")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<List<CPPAAWorkspace>> listMyWorkspaces(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(workspaceService.listMyWorkspaces(user.getUsername()));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Cambiar estado del workspace")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_MANAGE')")
    public ResponseEntity<CPPAAWorkspace> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(workspaceService.updateWorkspaceStatus(id, request.get("status"), user.getUsername()));
    }

    @GetMapping("/{id}/dashboard")
    @Operation(summary = "Dashboard consolidado del workspace")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<Map<String, Object>> getWorkspaceDashboard(@PathVariable Long id) {
        return ResponseEntity.ok(workspaceService.getWorkspaceDashboard(id));
    }

    @PostMapping("/{id}/consolidate")
    @Operation(summary = "Consolidar todos los planes aprobados en un PAA")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_COORDINATE')")
    public ResponseEntity<CPPAAWorkspace> consolidateWorkspace(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(workspaceService.consolidateWorkspace(id, user.getUsername()));
    }

    // ========================================================================
    // Department plan endpoints
    // ========================================================================

    @PostMapping("/{workspaceId}/departments")
    @Operation(summary = "Agregar departamento al workspace")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_MANAGE')")
    public ResponseEntity<CPPAADepartmentPlan> addDepartment(
            @PathVariable Long workspaceId,
            @RequestBody Map<String, Object> request) {

        CPPAADepartmentPlan plan = workspaceService.addDepartment(
                workspaceId,
                (String) request.get("departmentName"),
                (String) request.get("departmentCode"),
                (String) request.get("assignedUserId"),
                (String) request.get("assignedUserName"),
                request.get("departmentBudget") != null ? new BigDecimal(request.get("departmentBudget").toString()) : null
        );
        return ResponseEntity.ok(plan);
    }

    @GetMapping("/departments/{id}")
    @Operation(summary = "Obtener plan departamental")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<CPPAADepartmentPlan> getDepartmentPlan(@PathVariable Long id) {
        return ResponseEntity.ok(workspaceService.getDepartmentPlan(id));
    }

    @GetMapping("/departments/my")
    @Operation(summary = "Listar mis planes departamentales asignados")
    @PreAuthorize("hasAuthority('CP_PAA_VIEW')")
    public ResponseEntity<List<CPPAADepartmentPlan>> getMyDepartmentPlans(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(workspaceService.getMyDepartmentPlans(user.getUsername()));
    }

    @PutMapping("/departments/{id}/phase-data")
    @Operation(summary = "Actualizar datos de fase del departamento (notifica real-time)")
    @PreAuthorize("hasAuthority('CP_PAA_EDIT')")
    public ResponseEntity<CPPAADepartmentPlan> updatePhaseData(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(workspaceService.updatePhaseData(
                id,
                (Integer) request.get("phaseNumber"),
                (String) request.get("phaseData"),
                user.getUsername()
        ));
    }

    @PutMapping("/departments/{id}/items-data")
    @Operation(summary = "Actualizar items del departamento sin cambiar estado")
    @PreAuthorize("hasAuthority('CP_PAA_EDIT')")
    public ResponseEntity<CPPAADepartmentPlan> updateItemsData(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(workspaceService.updateItemsData(
                id,
                (String) request.get("itemsData"),
                request.get("itemsCount") != null ? (Integer) request.get("itemsCount") : 0,
                request.get("itemsTotalBudget") != null ? new BigDecimal(request.get("itemsTotalBudget").toString()) : BigDecimal.ZERO,
                user.getUsername()
        ));
    }

    @PutMapping("/departments/{id}/submit")
    @Operation(summary = "Enviar plan departamental para revision")
    @PreAuthorize("hasAuthority('CP_PAA_EDIT')")
    public ResponseEntity<CPPAADepartmentPlan> submitDepartmentPlan(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(workspaceService.submitDepartmentPlan(
                id,
                (String) request.get("itemsData"),
                request.get("itemsCount") != null ? (Integer) request.get("itemsCount") : 0,
                request.get("itemsTotalBudget") != null ? new BigDecimal(request.get("itemsTotalBudget").toString()) : BigDecimal.ZERO,
                user.getUsername()
        ));
    }

    @PutMapping("/departments/{id}/approve")
    @Operation(summary = "Aprobar plan departamental")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_COORDINATE')")
    public ResponseEntity<CPPAADepartmentPlan> approveDepartmentPlan(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(workspaceService.approveDepartmentPlan(id, user.getUsername()));
    }

    @PutMapping("/departments/{id}/reject")
    @Operation(summary = "Rechazar plan departamental")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_COORDINATE')")
    public ResponseEntity<CPPAADepartmentPlan> rejectDepartmentPlan(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(workspaceService.rejectDepartmentPlan(
                id, request.get("reason"), user.getUsername()));
    }

    // ========================================================================
    // Comments endpoints
    // ========================================================================

    @PostMapping("/{id}/comments")
    @Operation(summary = "Agregar observacion al workspace")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<CPPAAWorkspaceComment> addComment(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(workspaceService.addComment(
                id,
                request.get("departmentPlanId") != null ? Long.parseLong(request.get("departmentPlanId")) : null,
                user.getUsername(),
                request.getOrDefault("authorUserName", user.getUsername()),
                request.get("authorRole"),
                request.get("content")
        ));
    }

    @GetMapping("/{id}/comments")
    @Operation(summary = "Obtener observaciones del workspace")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<List<CPPAAWorkspaceComment>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(workspaceService.getComments(id));
    }

    // ========================================================================
    // Field-level (inline) comment endpoints
    // ========================================================================

    @PostMapping("/{id}/field-comments")
    @Operation(summary = "Agregar comentario anclado a un campo de fase")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<CPPAAWorkspaceComment> addFieldComment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(workspaceService.addFieldComment(
                id,
                request.get("departmentPlanId") != null ? ((Number) request.get("departmentPlanId")).longValue() : null,
                (String) request.get("anchorField"),
                request.get("anchorPhaseIndex") != null ? ((Number) request.get("anchorPhaseIndex")).intValue() : null,
                user.getUsername(),
                (String) request.getOrDefault("authorUserName", user.getUsername()),
                (String) request.get("authorRole"),
                (String) request.get("content"),
                request.get("parentCommentId") != null ? ((Number) request.get("parentCommentId")).longValue() : null
        ));
    }

    @GetMapping("/{id}/field-comments")
    @Operation(summary = "Obtener comentarios de un campo de fase")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<List<CPPAAWorkspaceComment>> getFieldComments(
            @PathVariable Long id,
            @RequestParam Long departmentPlanId,
            @RequestParam String anchorField,
            @RequestParam Integer anchorPhaseIndex) {
        return ResponseEntity.ok(workspaceService.getFieldComments(id, departmentPlanId, anchorField, anchorPhaseIndex));
    }

    @GetMapping("/{id}/field-comment-counts")
    @Operation(summary = "Conteo de comentarios por campo (para badges)")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<Map<String, Integer>> getFieldCommentCounts(
            @PathVariable Long id,
            @RequestParam Long departmentPlanId) {
        return ResponseEntity.ok(workspaceService.getFieldCommentCounts(id, departmentPlanId));
    }

    // ========================================================================
    // Participants endpoint
    // ========================================================================

    @GetMapping("/{id}/participants")
    @Operation(summary = "Obtener participantes del workspace con estado online")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<List<Map<String, Object>>> getParticipants(@PathVariable Long id) {
        return ResponseEntity.ok(workspaceService.getWorkspaceParticipants(id));
    }

    // ========================================================================
    // Observers endpoints
    // ========================================================================

    @PostMapping("/{id}/observers")
    @Operation(summary = "Agregar observador externo al workspace")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_COORDINATE')")
    public ResponseEntity<CPPAAWorkspaceObserver> addObserver(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(workspaceService.addObserver(
                id,
                request.get("userId"),
                request.get("userName"),
                request.get("role"),
                user.getUsername()
        ));
    }

    @GetMapping("/{id}/observers")
    @Operation(summary = "Listar observadores del workspace")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<List<CPPAAWorkspaceObserver>> getObservers(@PathVariable Long id) {
        return ResponseEntity.ok(workspaceService.getObservers(id));
    }

    @DeleteMapping("/{id}/observers/{userId}")
    @Operation(summary = "Eliminar observador del workspace")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_COORDINATE')")
    public ResponseEntity<Void> removeObserver(
            @PathVariable Long id,
            @PathVariable String userId,
            @AuthenticationPrincipal UserDetails user) {
        workspaceService.removeObserver(id, userId, user.getUsername());
        return ResponseEntity.ok().build();
    }

    // ========================================================================
    // Proposal endpoints
    // ========================================================================

    @PostMapping("/{id}/proposals")
    @Operation(summary = "Crear propuesta de cambio a un campo")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<CPPAAWorkspaceProposal> createProposal(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(workspaceService.createProposal(
                id,
                request.get("departmentPlanId") != null ? ((Number) request.get("departmentPlanId")).longValue() : null,
                (String) request.get("anchorField"),
                request.get("anchorPhaseIndex") != null ? ((Number) request.get("anchorPhaseIndex")).intValue() : 0,
                user.getUsername(),
                (String) request.getOrDefault("proposerName", user.getUsername()),
                (String) request.get("currentValue"),
                (String) request.get("proposedValue"),
                (String) request.get("justification")
        ));
    }

    @GetMapping("/{id}/proposals")
    @Operation(summary = "Listar propuestas del workspace")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<List<CPPAAWorkspaceProposal>> getProposals(
            @PathVariable Long id,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(workspaceService.getProposals(id, status));
    }

    @GetMapping("/{id}/proposals/{proposalId}")
    @Operation(summary = "Detalle de propuesta con votos")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<CPPAAWorkspaceProposal> getProposalDetail(
            @PathVariable Long id,
            @PathVariable Long proposalId) {
        return ResponseEntity.ok(workspaceService.getProposalDetail(proposalId));
    }

    @PostMapping("/{id}/proposals/{proposalId}/vote")
    @Operation(summary = "Votar en una propuesta")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<CPPAAWorkspaceProposal> voteOnProposal(
            @PathVariable Long id,
            @PathVariable Long proposalId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(workspaceService.voteOnProposal(
                proposalId,
                user.getUsername(),
                request.getOrDefault("voterName", user.getUsername()),
                request.get("voteType"),
                request.get("comment")
        ));
    }

    @PostMapping("/{id}/proposals/{proposalId}/apply")
    @Operation(summary = "Aplicar propuesta aprobada (solo coordinador)")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_COORDINATE')")
    public ResponseEntity<CPPAAWorkspaceProposal> applyProposal(
            @PathVariable Long id,
            @PathVariable Long proposalId,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(workspaceService.applyProposal(proposalId, user.getUsername()));
    }

    @DeleteMapping("/{id}/proposals/{proposalId}")
    @Operation(summary = "Retirar propuesta (solo el proponente)")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<Void> withdrawProposal(
            @PathVariable Long id,
            @PathVariable Long proposalId,
            @AuthenticationPrincipal UserDetails user) {
        workspaceService.withdrawProposal(proposalId, user.getUsername());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/proposal-counts")
    @Operation(summary = "Conteo de propuestas abiertas por campo (para badges)")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<Map<String, Integer>> getProposalCounts(
            @PathVariable Long id,
            @RequestParam Long departmentPlanId) {
        return ResponseEntity.ok(workspaceService.getProposalCounts(id, departmentPlanId));
    }

    // ========================================================================
    // Field Change Log — Track Changes
    // ========================================================================

    @GetMapping("/{id}/field-changes")
    @Operation(summary = "Obtener ultimos cambios por campo para diff visual")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<List<CPPAAFieldChangeLog>> getLatestFieldChanges(
            @PathVariable Long id,
            @RequestParam Long departmentPlanId) {
        return ResponseEntity.ok(workspaceService.getLatestFieldChanges(departmentPlanId));
    }

    @GetMapping("/{id}/field-change-history")
    @Operation(summary = "Historial de cambios de un campo especifico")
    @PreAuthorize("hasAuthority('CP_PAA_WORKSPACE_VIEW')")
    public ResponseEntity<List<CPPAAFieldChangeLog>> getFieldChangeHistory(
            @PathVariable Long id,
            @RequestParam Long departmentPlanId,
            @RequestParam String fieldCode,
            @RequestParam Integer phaseIndex) {
        return ResponseEntity.ok(workspaceService.getFieldChangeHistory(departmentPlanId, fieldCode, phaseIndex));
    }
}
