package com.globalcmx.api.compraspublicas.paa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cp_paa_field_change_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPPAAFieldChangeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workspace_id", nullable = false)
    private Long workspaceId;

    @Column(name = "department_plan_id", nullable = false)
    private Long departmentPlanId;

    @Column(name = "field_code", nullable = false, length = 100)
    private String fieldCode;

    @Column(name = "phase_index", nullable = false)
    private Integer phaseIndex;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "changed_by_user_id", nullable = false, length = 100)
    private String changedByUserId;

    @Column(name = "changed_by_name", nullable = false, length = 200)
    private String changedByName;

    @Column(name = "changed_at", updatable = false)
    @Builder.Default
    private LocalDateTime changedAt = LocalDateTime.now();
}
