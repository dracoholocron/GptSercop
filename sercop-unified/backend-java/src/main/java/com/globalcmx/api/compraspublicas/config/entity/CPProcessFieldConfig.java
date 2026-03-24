package com.globalcmx.api.compraspublicas.config.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "cp_process_field_config",
    uniqueConstraints = @UniqueConstraint(name = "uk_cp_field", columnNames = {"field_code", "section_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPProcessFieldConfig {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "field_code", nullable = false, length = 50)
    private String fieldCode;

    @Column(name = "field_name_key", nullable = false, length = 100)
    private String fieldNameKey;

    @Column(name = "field_description_key", columnDefinition = "TEXT")
    private String fieldDescriptionKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    private CPProcessSectionConfig section;

    @Column(name = "field_type", nullable = false, length = 30)
    @Builder.Default
    private String fieldType = "TEXT";

    @Column(name = "component_type", length = 50)
    @Builder.Default
    private String componentType = "TEXT_INPUT";

    @Column(name = "data_source_type", length = 20)
    private String dataSourceType;

    @Column(name = "data_source_code", length = 50)
    private String dataSourceCode;

    @Column(name = "data_source_filters", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String dataSourceFilters;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "placeholder_key", length = 100)
    private String placeholderKey;

    @Column(name = "help_text_key", length = 200)
    private String helpTextKey;

    @Column(name = "is_required")
    @Builder.Default
    private Boolean isRequired = false;

    @Column(name = "required_condition", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String requiredCondition;

    @Column(name = "validation_rules", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String validationRules;

    @Column(name = "dependencies", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String dependencies;

    @Column(name = "field_options", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String fieldOptions;

    @Column(name = "default_value", length = 500)
    private String defaultValue;

    @Column(name = "default_value_expression", length = 200)
    private String defaultValueExpression;

    @Column(name = "legal_reference", length = 200)
    private String legalReference;

    @Column(name = "ai_assist_enabled")
    @Builder.Default
    private Boolean aiAssistEnabled = false;

    @Column(name = "maps_to_external_field", length = 100)
    private String mapsToExternalField;

    @Column(name = "show_in_wizard")
    @Builder.Default
    private Boolean showInWizard = true;

    @Column(name = "show_in_expert")
    @Builder.Default
    private Boolean showInExpert = true;

    @Column(name = "show_in_view")
    @Builder.Default
    private Boolean showInView = true;

    @Column(name = "show_in_list")
    @Builder.Default
    private Boolean showInList = false;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

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
