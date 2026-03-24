package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Read model for pending event approvals.
 *
 * This entity stores events that require approval before execution.
 * It unifies the approval workflow for both:
 * - New operations (from drafts)
 * - Events on existing operations
 *
 * Status flow: PENDING -> APPROVED / REJECTED
 */
@Entity
@Table(name = "pending_event_approval_readmodel",
       indexes = {
           @Index(name = "idx_pending_event_status", columnList = "status"),
           @Index(name = "idx_pending_event_operation", columnList = "operation_id"),
           @Index(name = "idx_pending_event_product", columnList = "product_type"),
           @Index(name = "idx_pending_event_submitted", columnList = "submitted_at")
       })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingEventApprovalReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique identifier for the pending approval request
     * Format: PEA-{PRODUCT_TYPE}-{TIMESTAMP}
     */
    @Column(name = "approval_id", length = 100, unique = true, nullable = false)
    private String approvalId;

    // ========================================
    // APPROVAL TYPE - Distinguishes draft vs event
    // ========================================

    /**
     * Type of approval: NEW_OPERATION (from draft) or OPERATION_EVENT
     */
    @Column(name = "approval_type", length = 30, nullable = false)
    private String approvalType;

    /**
     * Status: PENDING, APPROVED, REJECTED
     */
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private String status = "PENDING";

    // ========================================
    // OPERATION CONTEXT
    // ========================================

    /**
     * Operation ID (null for NEW_OPERATION, set for OPERATION_EVENT)
     */
    @Column(name = "operation_id", length = 50)
    private String operationId;

    /**
     * Draft ID (set for NEW_OPERATION, null for OPERATION_EVENT)
     */
    @Column(name = "draft_id", length = 100)
    private String draftId;

    /**
     * Product type (LC_IMPORT, LC_EXPORT, GUARANTEE, etc.)
     */
    @Column(name = "product_type", length = 50, nullable = false)
    private String productType;

    /**
     * Operation reference for display
     */
    @Column(name = "reference", length = 100)
    private String reference;

    // ========================================
    // EVENT DETAILS
    // ========================================

    /**
     * Event code being requested (e.g., ISSUE, AMEND, SEND_MT700)
     */
    @Column(name = "event_code", length = 50, nullable = false)
    private String eventCode;

    /**
     * Localized event name for display
     */
    @Column(name = "event_name", length = 100)
    private String eventName;

    /**
     * Event description
     */
    @Column(name = "event_description", columnDefinition = "TEXT")
    private String eventDescription;

    /**
     * Message type (MT700, MT707, etc.)
     */
    @Column(name = "message_type", length = 10)
    private String messageType;

    /**
     * SWIFT message content (if applicable)
     */
    @Column(name = "swift_message", columnDefinition = "TEXT")
    private String swiftMessage;

    /**
     * Event data (JSON) - form data submitted with the event
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "event_data", columnDefinition = "JSON")
    private Map<String, Object> eventData;

    /**
     * Comments from the submitter
     */
    @Column(name = "submitter_comments", columnDefinition = "TEXT")
    private String submitterComments;

    // ========================================
    // FINANCIAL DATA (for display/filtering)
    // ========================================

    @Column(name = "currency", length = 3)
    private String currency;

    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;

    // ========================================
    // PARTIES (for display)
    // ========================================

    @Column(name = "applicant_name", length = 200)
    private String applicantName;

    @Column(name = "beneficiary_name", length = 200)
    private String beneficiaryName;

    // ========================================
    // SUBMISSION INFO
    // ========================================

    @Column(name = "submitted_by", length = 100, nullable = false)
    private String submittedBy;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    // ========================================
    // APPROVAL/REJECTION INFO
    // ========================================

    @Column(name = "reviewed_by", length = 100)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_comments", columnDefinition = "TEXT")
    private String reviewComments;

    /**
     * Rejection reason (when status = REJECTED)
     */
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    /**
     * Per-field comments from approver (when status = REJECTED)
     * JSON: {":20:": {"comment": "...", "commentedAt": "...", "commentedBy": "..."}}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "field_comments", columnDefinition = "JSON")
    private Map<String, Object> fieldComments;

    // ========================================
    // UI HINTS
    // ========================================

    /**
     * Icon for the event (from event config)
     */
    @Column(name = "icon", length = 50)
    private String icon;

    /**
     * Color for the event (from event config)
     */
    @Column(name = "color", length = 20)
    private String color;

    /**
     * Priority level (1=low, 2=medium, 3=high)
     */
    @Column(name = "priority")
    @Builder.Default
    private Integer priority = 2;

    // ========================================
    // RISK EVALUATION
    // ========================================

    /**
     * Risk score from Risk Engine evaluation (0-100)
     */
    @Column(name = "risk_score")
    private Integer riskScore;

    /**
     * Risk level: LOW, MEDIUM, HIGH, CRITICAL
     */
    @Column(name = "risk_level", length = 20)
    private String riskLevel;

    /**
     * JSON array of triggered risk rules
     * Each rule contains: code, name, points, reason
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "triggered_risk_rules", columnDefinition = "JSON")
    private List<Map<String, Object>> triggeredRiskRules;

    /**
     * Action recommended by Risk Engine: ALLOW, MFA_REQUIRED, STEP_UP_AUTH, BLOCK
     */
    @Column(name = "risk_action", length = 30)
    private String riskAction;

    /**
     * Instructions for the approver based on risk evaluation
     */
    @Column(name = "approval_instructions", columnDefinition = "TEXT")
    private String approvalInstructions;

    /**
     * Whether this approval was triggered by risk evaluation (vs normal 4-eyes)
     */
    @Column(name = "risk_triggered")
    @Builder.Default
    private Boolean riskTriggered = false;

    // ========================================
    // MULTI-APPROVER SUPPORT
    // ========================================

    /**
     * Number of approvers required (from 4-eyes config)
     */
    @Column(name = "required_approvers")
    @Builder.Default
    private Integer requiredApprovers = 1;

    /**
     * Current number of approvals received
     */
    @Column(name = "current_approval_count")
    @Builder.Default
    private Integer currentApprovalCount = 0;

    /**
     * History of approvals received
     * JSON array: [{user, timestamp, comments}]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "approval_history", columnDefinition = "JSON")
    private List<Map<String, Object>> approvalHistory;

    // ========================================
    // AUDIT
    // ========================================

    @Version
    @Column(name = "version")
    @Builder.Default
    private Long version = 0L;

    @PrePersist
    protected void onCreate() {
        if (submittedAt == null) {
            submittedAt = LocalDateTime.now();
        }
    }
}
