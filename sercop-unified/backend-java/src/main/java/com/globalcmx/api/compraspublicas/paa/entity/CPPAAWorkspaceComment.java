package com.globalcmx.api.compraspublicas.paa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cp_paa_workspace_comment")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPPAAWorkspaceComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workspace_id", nullable = false)
    private Long workspaceId;

    @Column(name = "department_plan_id")
    private Long departmentPlanId;

    @Column(name = "author_user_id", nullable = false, length = 100)
    private String authorUserId;

    @Column(name = "author_user_name", nullable = false, length = 200)
    private String authorUserName;

    @Column(name = "author_role", nullable = false, length = 30)
    @Builder.Default
    private String authorRole = "COORDINATOR";

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "anchor_field", length = 100)
    private String anchorField;

    @Column(name = "anchor_phase_index")
    private Integer anchorPhaseIndex;

    @Column(name = "parent_comment_id")
    private Long parentCommentId;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
