package com.globalcmx.api.compraspublicas.methodology.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cp_paa_methodology_phase")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPPAAMethodologyPhase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "methodology_id", nullable = false)
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    private CPPAAMethodology methodology;

    @Column(name = "phase_number", nullable = false)
    private Integer phaseNumber;

    @Column(name = "phase_code", nullable = false, length = 50)
    private String phaseCode;

    @Column(name = "phase_name", nullable = false, length = 200)
    private String phaseName;

    @Column(name = "phase_subtitle", length = 300)
    private String phaseSubtitle;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "color", length = 30)
    private String color;

    @Column(name = "guidance_prompt_key", length = 100)
    private String guidancePromptKey;

    @Column(name = "validation_prompt_key", length = 100)
    private String validationPromptKey;

    @Column(name = "extraction_prompt_key", length = 100)
    private String extractionPromptKey;

    @Column(name = "confirmation_prompt_key", length = 100)
    private String confirmationPromptKey;

    @Column(name = "result_display_type", length = 30)
    @Builder.Default
    private String resultDisplayType = "BADGES";

    @Column(name = "result_template", columnDefinition = "TEXT")
    private String resultTemplate;

    @Column(name = "input_type", length = 30)
    @Builder.Default
    private String inputType = "TEXT";

    @Column(name = "input_placeholder", length = 300)
    private String inputPlaceholder;

    @Column(name = "options_source", length = 200)
    private String optionsSource;

    @Column(name = "is_required")
    @Builder.Default
    private Boolean isRequired = true;

    @Column(name = "can_skip")
    @Builder.Default
    private Boolean canSkip = false;

    @Column(name = "auto_advance")
    @Builder.Default
    private Boolean autoAdvance = false;

    @Column(name = "requires_ai_call")
    @Builder.Default
    private Boolean requiresAiCall = true;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @OneToMany(mappedBy = "phase", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    @EqualsAndHashCode.Exclude
    private List<CPPAAPhaseFieldMapping> fieldMappings = new ArrayList<>();
}
