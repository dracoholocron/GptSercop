package com.globalcmx.api.compraspublicas.paa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "cp_paa_workspace_proposal")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPPAAWorkspaceProposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workspace_id", nullable = false)
    private Long workspaceId;

    @Column(name = "department_plan_id", nullable = false)
    private Long departmentPlanId;

    @Column(name = "anchor_field", nullable = false, length = 100)
    private String anchorField;

    @Column(name = "anchor_phase_index", nullable = false)
    @Builder.Default
    private Integer anchorPhaseIndex = 0;

    @Column(name = "proposer_user_id", nullable = false, length = 100)
    private String proposerUserId;

    @Column(name = "proposer_name", nullable = false, length = 200)
    private String proposerName;

    @Column(name = "current_value", columnDefinition = "TEXT")
    private String currentValue;

    @Column(name = "proposed_value", columnDefinition = "TEXT", nullable = false)
    private String proposedValue;

    @Column(name = "justification", columnDefinition = "TEXT")
    private String justification;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "OPEN";

    @Column(name = "votes_required", nullable = false)
    @Builder.Default
    private Integer votesRequired = 1;

    @Column(name = "votes_approve", nullable = false)
    @Builder.Default
    private Integer votesApprove = 0;

    @Column(name = "votes_reject", nullable = false)
    @Builder.Default
    private Integer votesReject = 0;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolved_by", length = 100)
    private String resolvedBy;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "proposal", fetch = FetchType.LAZY)
    @JsonIgnoreProperties("proposal")
    private List<CPPAAWorkspaceProposalVote> votes;
}
