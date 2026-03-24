package com.globalcmx.api.controller;

import com.globalcmx.api.dto.command.ReviewApprovalCommand;
import com.globalcmx.api.dto.command.SubmitEventForApprovalCommand;
import com.globalcmx.api.dto.query.PendingApprovalDTO;
import com.globalcmx.api.service.PendingApprovalCommandService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for pending approval commands (CQRS Write side).
 */
@RestController
@RequestMapping("/v1/pending-approvals")
@RequiredArgsConstructor
public class PendingApprovalCommandController {

    private final PendingApprovalCommandService commandService;

    /**
     * Submit an event for approval.
     */
    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitForApproval(
            @RequestBody SubmitEventForApprovalCommand command) {

        Map<String, Object> response = new HashMap<>();
        try {
            PendingApprovalDTO approval = commandService.submitForApproval(command);
            response.put("success", true);
            response.put("data", approval);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Approve a pending approval.
     */
    @PostMapping("/{approvalId}/approve")
    public ResponseEntity<Map<String, Object>> approve(
            @PathVariable String approvalId,
            @RequestParam String reviewedBy,
            @RequestParam(required = false) String comments) {

        Map<String, Object> response = new HashMap<>();
        try {
            ReviewApprovalCommand command = ReviewApprovalCommand.builder()
                    .approvalId(approvalId)
                    .action("APPROVE")
                    .reviewedBy(reviewedBy)
                    .comments(comments)
                    .build();

            PendingApprovalDTO approval = commandService.reviewApproval(command);
            response.put("success", true);
            response.put("data", approval);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Reject a pending approval.
     */
    @PostMapping("/{approvalId}/reject")
    public ResponseEntity<Map<String, Object>> reject(
            @PathVariable String approvalId,
            @RequestParam String reviewedBy,
            @RequestParam String rejectionReason,
            @RequestParam(required = false) String comments) {

        Map<String, Object> response = new HashMap<>();
        try {
            ReviewApprovalCommand command = ReviewApprovalCommand.builder()
                    .approvalId(approvalId)
                    .action("REJECT")
                    .reviewedBy(reviewedBy)
                    .comments(comments)
                    .rejectionReason(rejectionReason)
                    .build();

            PendingApprovalDTO approval = commandService.reviewApproval(command);
            response.put("success", true);
            response.put("data", approval);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Review a pending approval (generic endpoint).
     */
    @PostMapping("/{approvalId}/review")
    public ResponseEntity<Map<String, Object>> review(
            @PathVariable String approvalId,
            @RequestBody ReviewApprovalCommand command) {

        Map<String, Object> response = new HashMap<>();
        try {
            command.setApprovalId(approvalId);
            PendingApprovalDTO approval = commandService.reviewApproval(command);
            response.put("success", true);
            response.put("data", approval);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
