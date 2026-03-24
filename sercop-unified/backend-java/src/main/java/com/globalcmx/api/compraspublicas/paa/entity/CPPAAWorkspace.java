package com.globalcmx.api.compraspublicas.paa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cp_paa_workspace")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPPAAWorkspace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workspace_code", nullable = false, unique = true, length = 50)
    private String workspaceCode;

    @Column(name = "entity_ruc", nullable = false, length = 13)
    private String entityRuc;

    @Column(name = "entity_name", nullable = false, length = 300)
    private String entityName;

    @Column(name = "fiscal_year", nullable = false)
    private Integer fiscalYear;

    @Column(name = "sector_code", length = 50)
    private String sectorCode;

    @Column(name = "methodology_id")
    private Long methodologyId;

    @Column(name = "coordinator_user_id", length = 100)
    private String coordinatorUserId;

    @Column(name = "coordinator_user_name", length = 200)
    private String coordinatorUserName;

    @Column(name = "total_budget", precision = 18, scale = 2)
    private BigDecimal totalBudget;

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "ABIERTO";

    @Column(name = "consolidated_data", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String consolidatedData;

    @Column(name = "consolidated_paa_id", columnDefinition = "CHAR(36)")
    private String consolidatedPaaId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "workspace", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @Builder.Default
    @EqualsAndHashCode.Exclude
    private List<CPPAADepartmentPlan> departmentPlans = new ArrayList<>();

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
