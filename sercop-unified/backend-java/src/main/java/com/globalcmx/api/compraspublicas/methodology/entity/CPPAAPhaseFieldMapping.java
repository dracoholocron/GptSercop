package com.globalcmx.api.compraspublicas.methodology.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cp_paa_phase_field_mapping")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPPAAPhaseFieldMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phase_id", nullable = false)
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    private CPPAAMethodologyPhase phase;

    @Column(name = "field_code", nullable = false, length = 100)
    private String fieldCode;

    @Column(name = "extraction_path", length = 200)
    private String extractionPath;

    @Column(name = "transform_type", length = 30)
    @Builder.Default
    private String transformType = "DIRECT";

    @Column(name = "default_value", length = 500)
    private String defaultValue;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    // --- Enhanced fields for DB-driven UI rendering ---

    @Column(name = "component_type", length = 50)
    @Builder.Default
    private String componentType = "TEXT";

    @Column(name = "card_size", length = 10)
    @Builder.Default
    private String cardSize = "md";

    @Column(name = "grid_span")
    @Builder.Default
    private Integer gridSpan = 1;

    @Column(name = "label", length = 200)
    private String label;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "placeholder", columnDefinition = "TEXT")
    private String placeholder;

    @Column(name = "help_text", columnDefinition = "TEXT")
    private String helpText;

    @Column(name = "is_editable")
    @Builder.Default
    private Boolean isEditable = true;

    @Column(name = "is_required")
    @Builder.Default
    private Boolean isRequired = false;

    @Column(name = "min_length")
    @Builder.Default
    private Integer minLength = 0;

    @Column(name = "max_length")
    @Builder.Default
    private Integer maxLength = 10000;

    @Column(name = "ai_assist_enabled")
    @Builder.Default
    private Boolean aiAssistEnabled = false;

    @Column(name = "ai_validation_on_blur")
    @Builder.Default
    private Boolean aiValidationOnBlur = false;

    @Column(name = "ai_step", length = 100)
    private String aiStep;

    @Column(name = "ai_field_id", length = 100)
    private String aiFieldId;

    @Column(name = "ai_validation_prompt", columnDefinition = "TEXT")
    private String aiValidationPrompt;

    @Column(name = "ai_suggestion_prompt", columnDefinition = "TEXT")
    private String aiSuggestionPrompt;

    @Column(name = "data_schema", columnDefinition = "JSON")
    private String dataSchema;
}
