package com.globalcmx.api.clientportal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity tracking multi-level approval chain for client requests.
 * Each record represents one approval level in the chain.
 * Following CQRS pattern - stores approval state per request.
 */
@Entity
@Table(name = "stage_approval_chain",
       indexes = {
           @Index(name = "idx_request_id", columnList = "request_id"),
           @Index(name = "idx_stage_code", columnList = "stage_code"),
           @Index(name = "idx_status", columnList = "status"),
           @Index(name = "idx_approval_level", columnList = "approval_level")
       })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StageApprovalChain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false, length = 36)
    private String requestId;

    @Column(name = "stage_code", nullable = false, length = 50)
    private String stageCode;

    @Column(name = "approval_level", nullable = false)
    private Integer approvalLevel;

    @Column(name = "required_role", nullable = false, length = 50)
    private String requiredRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ApprovalStatus status = ApprovalStatus.PENDING;

    // Approver information
    @Column(name = "approved_by_user_id", length = 100)
    private String approvedByUserId;

    @Column(name = "approved_by_user_name", length = 200)
    private String approvedByUserName;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    // Audit
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = ApprovalStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Approval status enum.
     */
    public enum ApprovalStatus {
        PENDING,
        APPROVED,
        REJECTED,
        SKIPPED
    }

    /**
     * Check if this approval level is pending.
     */
    public boolean isPending() {
        return status == ApprovalStatus.PENDING;
    }

    /**
     * Check if this approval level was approved.
     */
    public boolean isApproved() {
        return status == ApprovalStatus.APPROVED;
    }

    /**
     * Check if this approval level was rejected.
     */
    public boolean isRejected() {
        return status == ApprovalStatus.REJECTED;
    }

    /**
     * Approve this level.
     */
    public void approve(String userId, String userName, String comments) {
        this.status = ApprovalStatus.APPROVED;
        this.approvedByUserId = userId;
        this.approvedByUserName = userName;
        this.approvedAt = LocalDateTime.now();
        this.comments = comments;
    }

    /**
     * Reject this level.
     */
    public void reject(String userId, String userName, String comments) {
        this.status = ApprovalStatus.REJECTED;
        this.approvedByUserId = userId;
        this.approvedByUserName = userName;
        this.approvedAt = LocalDateTime.now();
        this.comments = comments;
    }

    /**
     * Skip this level (e.g., when amount is below threshold).
     */
    public void skip(String reason) {
        this.status = ApprovalStatus.SKIPPED;
        this.comments = reason;
        this.approvedAt = LocalDateTime.now();
    }
}
