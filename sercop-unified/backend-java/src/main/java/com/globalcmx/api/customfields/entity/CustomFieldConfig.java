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
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Configuration for individual custom fields.
 * Supports various field types and data sources.
 */
@Entity
@Table(name = "custom_field_config_readmodel", indexes = {
    @Index(name = "idx_field_section_display_order", columnList = "section_id,display_order"),
    @Index(name = "idx_field_type", columnList = "field_type"),
    @Index(name = "idx_component_type", columnList = "component_type"),
    @Index(name = "idx_data_source", columnList = "data_source_type,data_source_code"),
    @Index(name = "idx_embed_swift", columnList = "embed_after_swift_field"),
    @Index(name = "idx_field_active", columnList = "is_active"),
    @Index(name = "idx_custom_field_mapping", columnList = "maps_to_product_type,maps_to_field_code")
},
uniqueConstraints = {
    @UniqueConstraint(name = "uk_field_section", columnNames = {"field_code", "section_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CustomFieldConfig {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    // ==================== Identification ====================

    /**
     * Unique field code within the section (e.g., "GUARANTOR_NAME", "PRIORITY_LEVEL")
     */
    @Column(name = "field_code", nullable = false, length = 50)
    private String fieldCode;

    /**
     * i18n key for the field name (e.g., "customFields.fields.GUARANTOR_NAME.name")
     */
    @Column(name = "field_name_key", nullable = false, length = 100)
    private String fieldNameKey;

    /**
     * i18n key for the field description
     */
    @Column(name = "field_description_key", columnDefinition = "TEXT")
    private String fieldDescriptionKey;

    // ==================== Parent Relationship ====================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    private CustomFieldSectionConfig section;

    // ==================== Type Configuration ====================

    /**
     * Field data type (TEXT, NUMBER, DATE, BOOLEAN, SELECT, TEXTAREA, etc.)
     */
    @Column(name = "field_type", nullable = false, length = 30)
    private String fieldType;

    /**
     * UI component type to render
     * (TEXT_INPUT, NUMBER_INPUT, DATE_PICKER, SELECT, CATALOG_LISTBOX, USER_LISTBOX, etc.)
     */
    @Column(name = "component_type", nullable = false, length = 50)
    private String componentType;

    // ==================== Data Source (for CATALOG_LISTBOX, USER_LISTBOX) ====================

    /**
     * Data source type (CATALOG, USER, API)
     */
    @Column(name = "data_source_type", length = 30)
    private String dataSourceType;

    /**
     * Catalog code or API endpoint
     */
    @Column(name = "data_source_code", length = 100)
    private String dataSourceCode;

    /**
     * Additional filters for the data source (JSON)
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data_source_filters", columnDefinition = "json")
    private String dataSourceFilters;

    // ==================== Display Settings ====================

    /**
     * Display order within the section
     */
    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    /**
     * i18n key for placeholder text
     */
    @Column(name = "placeholder_key", length = 200)
    private String placeholderKey;

    /**
     * i18n key for help text shown below the field
     */
    @Column(name = "help_text_key", columnDefinition = "TEXT")
    private String helpTextKey;

    /**
     * Number of columns this field spans (1 or 2)
     */
    @Column(name = "span_columns")
    @Builder.Default
    private Integer spanColumns = 1;

    // ==================== Validation ====================

    /**
     * Whether the field is required
     */
    @Column(name = "is_required")
    @Builder.Default
    private Boolean isRequired = false;

    /**
     * Conditional required rule (JSON)
     * Example: {"field": "OTHER_FIELD", "operator": "EQUALS", "value": "X"}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "required_condition", columnDefinition = "json")
    private String requiredCondition;

    /**
     * Validation rules (JSON)
     * Example: {"pattern": "^[A-Z]+$", "min": 0, "max": 100, "maxLength": 200}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "validation_rules", columnDefinition = "json")
    private String validationRules;

    // ==================== Dependencies ====================

    /**
     * Field dependencies and visibility rules (JSON)
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dependencies", columnDefinition = "json")
    private String dependencies;

    // ==================== Default Value ====================

    /**
     * Default value for the field
     */
    @Column(name = "default_value", length = 500)
    private String defaultValue;

    /**
     * Dynamic default value expression (JSON)
     * Example: {"type": "EXPRESSION", "value": "TODAY()"}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "default_value_expression", columnDefinition = "json")
    private String defaultValueExpression;

    // ==================== Options (for SELECT, RADIO, CHECKBOX) ====================

    /**
     * Options for selection fields (JSON array)
     * Example: [{"value": "A", "label": "Option A"}, {"value": "B", "label": "Option B"}]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "field_options", columnDefinition = "json")
    private String fieldOptions;

    // ==================== Embed Configuration ====================

    /**
     * SWIFT field code to appear after (inline embed)
     */
    @Column(name = "embed_after_swift_field", length = 20)
    private String embedAfterSwiftField;

    /**
     * Whether to show inline with the SWIFT field
     */
    @Column(name = "embed_inline")
    @Builder.Default
    private Boolean embedInline = false;

    // ==================== Field Mapping (Portal → Operation) ====================

    /**
     * Target product type for mapping (e.g., LC_IMPORT, GUARANTEE)
     * When set, this field can be mapped to an operation field
     */
    @Column(name = "maps_to_product_type", length = 50)
    private String mapsToProductType;

    /**
     * Target field code in the operation form (e.g., F59_BENEFICIARY_NAME)
     */
    @Column(name = "maps_to_field_code", length = 100)
    private String mapsToFieldCode;

    /**
     * SWIFT message tag (e.g., :59, :32B, :45A)
     */
    @Column(name = "maps_to_swift_tag", length = 20)
    private String mapsToSwiftTag;

    /**
     * Line number within multi-line SWIFT tags (1-4)
     */
    @Column(name = "maps_to_swift_line")
    private Integer mapsToSwiftLine;

    /**
     * Transformation type: DIRECT, UPPERCASE, FORMAT_DATE, LOOKUP, TRUNCATE
     */
    @Column(name = "mapping_transformation", length = 50)
    private String mappingTransformation;

    /**
     * Transformation parameters as JSON
     * Example: {"maxLength": 35, "catalog": "COUNTRIES"}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "mapping_params", columnDefinition = "json")
    private String mappingParams;

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

    /**
     * Whether to show this field in operation list/grid
     */
    @Column(name = "show_in_list")
    @Builder.Default
    private Boolean showInList = false;

    // ==================== AI Assistance ====================

    @Column(name = "ai_enabled")
    @Builder.Default
    private Boolean aiEnabled = false;

    @Column(name = "ai_help_prompt", columnDefinition = "TEXT")
    private String aiHelpPrompt;

    @Column(name = "ai_validation_prompt", columnDefinition = "TEXT")
    private String aiValidationPrompt;

    // ==================== Status ====================

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

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
