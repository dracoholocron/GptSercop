package com.globalcmx.api.dto.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Command to approve or reject a pending approval (CQRS Write side).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewApprovalCommand {

    /**
     * Approval ID to review
     */
    private String approvalId;

    /**
     * Action: APPROVE or REJECT
     */
    private String action;

    /**
     * User reviewing
     */
    private String reviewedBy;

    /**
     * Comments from reviewer
     */
    private String comments;

    /**
     * Rejection reason (required when action = REJECT)
     */
    private String rejectionReason;

    /**
     * Per-field comments from approver (optional, used with REJECT)
     * JSON: {":20:": {"comment": "..."}, ":32B:": {"comment": "..."}}
     */
    private Map<String, Object> fieldComments;
}
