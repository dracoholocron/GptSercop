package com.globalcmx.api.clientportal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity representing role permissions per processing stage.
 * Configurable via database - no hardcoded permissions.
 * Following CQRS pattern as a read model for stage permissions.
 */
@Entity
@Table(name = "stage_role_assignment",
       uniqueConstraints = @UniqueConstraint(columnNames = {"stage_code", "role_name"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StageRoleAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stage_code", nullable = false, length = 50)
    private String stageCode;

    @Column(name = "role_name", nullable = false, length = 50)
    private String roleName;

    // Permissions
    @Column(name = "can_view", nullable = false)
    @Builder.Default
    private Boolean canView = true;

    @Column(name = "can_execute", nullable = false)
    @Builder.Default
    private Boolean canExecute = false;

    @Column(name = "can_approve", nullable = false)
    @Builder.Default
    private Boolean canApprove = false;

    @Column(name = "can_reject", nullable = false)
    @Builder.Default
    private Boolean canReject = false;

    @Column(name = "can_return", nullable = false)
    @Builder.Default
    private Boolean canReturn = false;

    // Multi-level approval
    @Column(name = "approval_level")
    private Integer approvalLevel;

    @Column(name = "min_amount", precision = 18, scale = 2)
    private BigDecimal minAmount;

    @Column(name = "max_amount", precision = 18, scale = 2)
    private BigDecimal maxAmount;

    // Metadata
    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
        if (canView == null) canView = true;
        if (canExecute == null) canExecute = false;
        if (canApprove == null) canApprove = false;
        if (canReject == null) canReject = false;
        if (canReturn == null) canReturn = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Check if this role can perform any action in the stage.
     */
    public boolean canPerformAnyAction() {
        return Boolean.TRUE.equals(canExecute) ||
               Boolean.TRUE.equals(canApprove) ||
               Boolean.TRUE.equals(canReject) ||
               Boolean.TRUE.equals(canReturn);
    }

    /**
     * Check if the given amount is within this role's approval limits.
     */
    public boolean isAmountWithinLimits(BigDecimal amount) {
        if (amount == null) return true;
        if (minAmount != null && amount.compareTo(minAmount) < 0) return false;
        if (maxAmount != null && amount.compareTo(maxAmount) > 0) return false;
        return true;
    }
}
