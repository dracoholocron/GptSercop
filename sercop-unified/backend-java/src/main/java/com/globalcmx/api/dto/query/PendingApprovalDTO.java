package com.globalcmx.api.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO for pending approval items (unified view).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingApprovalDTO {

    private Long id;
    private String approvalId;

    // Type: NEW_OPERATION or OPERATION_EVENT
    private String approvalType;
    private String status;

    // Context
    private String operationId;
    private String draftId;
    private String productType;
    private String reference;

    // Event details
    private String eventCode;
    private String eventName;
    private String eventDescription;
    private String messageType;
    private String swiftMessage;
    private Map<String, Object> eventData;
    private String submitterComments;

    // Financial
    private String currency;
    private BigDecimal amount;

    // Parties
    private String applicantName;
    private String beneficiaryName;

    // Submission
    private String submittedBy;
    private LocalDateTime submittedAt;

    // Review
    private String reviewedBy;
    private LocalDateTime reviewedAt;
    private String reviewComments;
    private String rejectionReason;
    private Map<String, Object> fieldComments;

    // UI
    private String icon;
    private String color;
    private Integer priority;

    // Computed fields for display
    private String productTypeLabel;
    private String approvalTypeLabel;
    private String statusLabel;

    // Post-approval actions
    private boolean hasPostApprovalActions;
    private int postApprovalActionCount;
    private String postApprovalTriggerEvent;

    // Risk evaluation data
    private Integer riskScore;
    private String riskLevel;
    private List<Map<String, Object>> triggeredRiskRules;
    private String riskAction;
    private String approvalInstructions;
    private Boolean riskTriggered;

    // Multi-approver support
    private Integer requiredApprovers;
    private Integer currentApprovalCount;
    private List<Map<String, Object>> approvalHistory;
}
