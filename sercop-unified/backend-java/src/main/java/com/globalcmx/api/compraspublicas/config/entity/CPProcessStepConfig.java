package com.globalcmx.api.compraspublicas.config.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "cp_process_step_config",
    uniqueConstraints = @UniqueConstraint(name = "uk_cp_step", columnNames = {"step_code", "country_code", "process_type", "tenant_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPProcessStepConfig {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "step_code", nullable = false, length = 50)
    private String stepCode;

    @Column(name = "step_name_key", nullable = false, length = 100)
    private String stepNameKey;

    @Column(name = "step_description_key", columnDefinition = "TEXT")
    private String stepDescriptionKey;

    @Column(name = "country_code", length = 3)
    private String countryCode;

    @Column(name = "process_type", length = 30)
    private String processType;

    @Column(name = "tenant_id", columnDefinition = "CHAR(36)")
    private String tenantId;

    @Column(name = "phase", nullable = false, length = 30)
    @Builder.Default
    private String phase = "PREPARATORIA";

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "icon", length = 50)
    @Builder.Default
    private String icon = "FiFileText";

    @Column(name = "color", length = 20)
    private String color;

    @Column(name = "show_in_wizard")
    @Builder.Default
    private Boolean showInWizard = true;

    @Column(name = "show_in_expert")
    @Builder.Default
    private Boolean showInExpert = true;

    @Column(name = "required_role", length = 50)
    private String requiredRole;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @OneToMany(mappedBy = "step", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    @SQLRestriction("is_active = true")
    @Builder.Default
    @EqualsAndHashCode.Exclude
    private Set<CPProcessSectionConfig> sections = new HashSet<>();

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
