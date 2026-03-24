package com.globalcmx.api.customfields.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Configuration for custom field wizard steps.
 * Defines steps that can be separate or embedded in SWIFT steps.
 */
@Entity
@Table(name = "custom_field_step_config_readmodel", indexes = {
    @Index(name = "idx_product_type", columnList = "product_type"),
    @Index(name = "idx_tenant_display_order", columnList = "tenant_id,display_order"),
    @Index(name = "idx_embed_mode", columnList = "embed_mode"),
    @Index(name = "idx_step_active", columnList = "is_active")
},
uniqueConstraints = {
    @UniqueConstraint(name = "uk_step_product_tenant", columnNames = {"step_code", "product_type", "tenant_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CustomFieldStepConfig {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    // ==================== Identification ====================

    /**
     * Unique step code (e.g., "ADDITIONAL_PARTIES", "INTERNAL_INFO")
     */
    @Column(name = "step_code", nullable = false, length = 50)
    private String stepCode;

    /**
     * i18n key for the step name (e.g., "customFields.steps.ADDITIONAL_PARTIES.name")
     */
    @Column(name = "step_name_key", nullable = false, length = 100)
    private String stepNameKey;

    /**
     * i18n key for the step description
     */
    @Column(name = "step_description_key", columnDefinition = "TEXT")
    private String stepDescriptionKey;

    // ==================== Scope ====================

    /**
     * Product type this step applies to
     * (LC_IMPORT, LC_EXPORT, GUARANTEE, STANDBY_LC, COLLECTION, ALL)
     */
    @Column(name = "product_type", nullable = false, length = 30)
    private String productType;

    /**
     * Tenant ID for multi-tenant override (NULL for global)
     */
    @Column(name = "tenant_id", columnDefinition = "CHAR(36)")
    private String tenantId;

    // ==================== Display Settings ====================

    /**
     * Display order within the wizard
     */
    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    /**
     * Icon to display (e.g., "FiFileText", "FiUsers")
     */
    @Column(name = "icon", length = 50)
    @Builder.Default
    private String icon = "FiFileText";

    // ==================== Visibility ====================

    @Column(name = "show_in_wizard")
    @Builder.Default
    private Boolean showInWizard = true;

    @Column(name = "show_in_expert")
    @Builder.Default
    private Boolean showInExpert = true;

    @Column(name = "show_in_custom")
    @Builder.Default
    private Boolean showInCustom = true;

    @Column(name = "show_in_view")
    @Builder.Default
    private Boolean showInView = true;

    // ==================== Embed Configuration ====================

    /**
     * How this step is embedded (SEPARATE_STEP, EMBEDDED_IN_SWIFT)
     */
    @Column(name = "embed_mode", length = 30)
    @Builder.Default
    private String embedMode = "SEPARATE_STEP";

    /**
     * SWIFT step code to embed in (e.g., "PARTIES", "AMOUNTS")
     */
    @Column(name = "embed_swift_step", length = 50)
    private String embedSwiftStep;

    // ==================== Status ====================

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    // ==================== Relationships ====================

    @OneToMany(mappedBy = "step", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @SQLRestriction("is_active = true")
    @Builder.Default
    @EqualsAndHashCode.Exclude
    private Set<CustomFieldSectionConfig> sections = new HashSet<>();

    // ==================== Audit ====================

    @Column(name = "created_at", nullable = false, updatable = false)
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
