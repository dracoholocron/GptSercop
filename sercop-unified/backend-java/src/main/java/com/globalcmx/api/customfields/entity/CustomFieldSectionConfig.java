package com.globalcmx.api.customfields.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Configuration for custom field sections within steps.
 * Supports single and repeatable (multi-record) sections.
 */
@Entity
@Table(name = "custom_field_section_config_readmodel", indexes = {
    @Index(name = "idx_section_step_display_order", columnList = "step_id,display_order"),
    @Index(name = "idx_section_embed_mode", columnList = "embed_mode"),
    @Index(name = "idx_section_embed_target", columnList = "embed_target_type,embed_target_code"),
    @Index(name = "idx_section_active", columnList = "is_active")
},
uniqueConstraints = {
    @UniqueConstraint(name = "uk_section_step", columnNames = {"section_code", "step_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CustomFieldSectionConfig {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    // ==================== Identification ====================

    /**
     * Unique section code within the step (e.g., "GUARANTORS", "CODEBTORS")
     */
    @Column(name = "section_code", nullable = false, length = 50)
    private String sectionCode;

    /**
     * i18n key for the section name (e.g., "customFields.sections.GUARANTORS.name")
     */
    @Column(name = "section_name_key", nullable = false, length = 100)
    private String sectionNameKey;

    /**
     * i18n key for the section description
     */
    @Column(name = "section_description_key", columnDefinition = "TEXT")
    private String sectionDescriptionKey;

    // ==================== Parent Relationship ====================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_id", nullable = false)
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    private CustomFieldStepConfig step;

    // ==================== Section Type ====================

    /**
     * Section type: SINGLE or REPEATABLE (for grids/tables)
     */
    @Column(name = "section_type", length = 20)
    @Builder.Default
    private String sectionType = "SINGLE";

    /**
     * Minimum rows required (for REPEATABLE sections)
     */
    @Column(name = "min_rows")
    @Builder.Default
    private Integer minRows = 0;

    /**
     * Maximum rows allowed (for REPEATABLE sections)
     */
    @Column(name = "max_rows")
    @Builder.Default
    private Integer maxRows = 100;

    // ==================== Display Settings ====================

    /**
     * Display order within the step
     */
    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    /**
     * Whether the section can be collapsed
     */
    @Column(name = "collapsible")
    @Builder.Default
    private Boolean collapsible = false;

    /**
     * Whether the section is collapsed by default
     */
    @Column(name = "default_collapsed")
    @Builder.Default
    private Boolean defaultCollapsed = false;

    /**
     * Number of columns for field layout
     */
    @Column(name = "columns")
    @Builder.Default
    private Integer columns = 2;

    // ==================== Embed Configuration ====================

    /**
     * How this section is embedded within SWIFT
     * (NONE, AFTER_SECTION, BEFORE_SECTION, AFTER_FIELD, BEFORE_FIELD, FLOATING, SIDEBAR)
     */
    @Column(name = "embed_mode", length = 30)
    @Builder.Default
    private String embedMode = "NONE";

    /**
     * Target type for embedding (SECTION or FIELD)
     */
    @Column(name = "embed_target_type", length = 20)
    private String embedTargetType;

    /**
     * SWIFT section code or field code to embed relative to
     */
    @Column(name = "embed_target_code", length = 50)
    private String embedTargetCode;

    /**
     * Whether to show a visual separator
     */
    @Column(name = "embed_show_separator")
    @Builder.Default
    private Boolean embedShowSeparator = true;

    /**
     * Whether the embedded section can be collapsed
     */
    @Column(name = "embed_collapsible")
    @Builder.Default
    private Boolean embedCollapsible = false;

    /**
     * i18n key for the separator title
     */
    @Column(name = "embed_separator_title_key", length = 100)
    private String embedSeparatorTitleKey;

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

    // ==================== Status ====================

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    // ==================== Relationships ====================

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @SQLRestriction("is_active = true")
    @Builder.Default
    @EqualsAndHashCode.Exclude
    private Set<CustomFieldConfig> fields = new HashSet<>();

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
