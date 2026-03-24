package com.globalcmx.api.compraspublicas.paa.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cp_paa_department_plan")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPPAADepartmentPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    private CPPAAWorkspace workspace;

    /** Exposed workspace ID for JSON responses (avoids serializing the full workspace). */
    @Column(name = "workspace_id", insertable = false, updatable = false)
    private Long workspaceId;

    @Column(name = "department_name", nullable = false, length = 200)
    private String departmentName;

    @Column(name = "department_code", length = 50)
    private String departmentCode;

    @Column(name = "assigned_user_id", length = 100)
    private String assignedUserId;

    @Column(name = "assigned_user_name", length = 200)
    private String assignedUserName;

    @Column(name = "department_budget", precision = 18, scale = 2)
    private BigDecimal departmentBudget;

    @Column(name = "current_phase")
    @Builder.Default
    private Integer currentPhase = 0;

    @Column(name = "total_phases")
    @Builder.Default
    private Integer totalPhases = 7;

    @Column(name = "phase_data", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String phaseData;

    @Column(name = "items_data", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String itemsData;

    @Column(name = "items_count")
    @Builder.Default
    private Integer itemsCount = 0;

    @Column(name = "items_total_budget", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal itemsTotalBudget = BigDecimal.ZERO;

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "PENDIENTE";

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "last_modified_by", length = 100)
    private String lastModifiedBy;

    @Column(name = "last_modified_by_name", length = 200)
    private String lastModifiedByName;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
