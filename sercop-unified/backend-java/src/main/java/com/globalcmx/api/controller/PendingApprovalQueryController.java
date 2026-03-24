package com.globalcmx.api.controller;

import com.globalcmx.api.dto.query.PendingApprovalDTO;
import com.globalcmx.api.service.PendingApprovalQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for pending approval queries (CQRS Read side).
 */
@RestController
@RequestMapping("/v1/pending-approvals")
@RequiredArgsConstructor
public class PendingApprovalQueryController {

    private final PendingApprovalQueryService queryService;

    /**
     * Get all pending approvals (unified view).
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllPending(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String approvalType,
            @RequestParam(required = false) String search) {

        List<PendingApprovalDTO> approvals;

        if (search != null && !search.isBlank()) {
            approvals = queryService.search(search);
        } else if (productType != null) {
            approvals = queryService.getByProductType(productType);
        } else if (approvalType != null) {
            approvals = queryService.getByApprovalType(approvalType);
        } else if (status != null) {
            approvals = queryService.getByStatus(status);
        } else {
            approvals = queryService.getAllPending();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", approvals);
        return ResponseEntity.ok(response);
    }

    /**
     * Get approval by ID.
     */
    @GetMapping("/{approvalId}")
    public ResponseEntity<Map<String, Object>> getByApprovalId(@PathVariable String approvalId) {
        PendingApprovalDTO approval = queryService.getByApprovalId(approvalId);

        Map<String, Object> response = new HashMap<>();
        if (approval != null) {
            response.put("success", true);
            response.put("data", approval);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("error", "Approval not found");
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get statistics.
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> stats = queryService.getStatistics();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);
        return ResponseEntity.ok(response);
    }

    /**
     * Get approvals submitted by current user.
     */
    @GetMapping("/submitted-by/{username}")
    public ResponseEntity<Map<String, Object>> getSubmittedBy(@PathVariable String username) {
        List<PendingApprovalDTO> approvals = queryService.getSubmittedBy(username);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", approvals);
        return ResponseEntity.ok(response);
    }

    /**
     * Get approvals reviewed by a user.
     */
    @GetMapping("/reviewed-by/{username}")
    public ResponseEntity<Map<String, Object>> getReviewedBy(@PathVariable String username) {
        List<PendingApprovalDTO> approvals = queryService.getReviewedBy(username);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", approvals);
        return ResponseEntity.ok(response);
    }

    /**
     * Get latest rejected approval for a draft (to load field comments).
     */
    @GetMapping("/rejected-by-draft/{draftId}")
    public ResponseEntity<Map<String, Object>> getRejectedByDraft(@PathVariable String draftId) {
        PendingApprovalDTO approval = queryService.getLatestRejectedByDraftId(draftId);

        Map<String, Object> response = new HashMap<>();
        if (approval != null) {
            response.put("success", true);
            response.put("data", approval);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", true);
            response.put("data", null);
            return ResponseEntity.ok(response);
        }
    }

    /**
     * Get list of operation IDs that have pending approvals.
     * Used by workbox to show pending approval badge on operations.
     */
    @GetMapping("/pending-operation-ids")
    public ResponseEntity<Map<String, Object>> getPendingOperationIds() {
        List<String> operationIds = queryService.getPendingOperationIds();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", operationIds);
        return ResponseEntity.ok(response);
    }
}
