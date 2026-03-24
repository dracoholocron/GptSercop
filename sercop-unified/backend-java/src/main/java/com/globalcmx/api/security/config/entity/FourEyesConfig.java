package com.globalcmx.api.security.config.entity;

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

@Entity
@Table(name = "four_eyes_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FourEyesConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    @Column(name = "is_enabled")
    @Builder.Default
    private Boolean isEnabled = true;

    @Column(name = "min_approvers")
    @Builder.Default
    private Integer minApprovers = 1;

    @Column(name = "amount_threshold", precision = 19, scale = 4)
    private BigDecimal amountThreshold;

    @Column(name = "require_different_department")
    @Builder.Default
    private Boolean requireDifferentDepartment = false;

    @Column(name = "require_higher_role")
    @Builder.Default
    private Boolean requireHigherRole = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "excluded_roles", columnDefinition = "json")
    private List<String> excludedRoles;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
