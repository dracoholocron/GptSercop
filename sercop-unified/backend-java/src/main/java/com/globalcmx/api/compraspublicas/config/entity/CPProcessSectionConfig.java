package com.globalcmx.api.compraspublicas.config.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "cp_process_section_config",
    uniqueConstraints = @UniqueConstraint(name = "uk_cp_section", columnNames = {"section_code", "step_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPProcessSectionConfig {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "section_code", nullable = false, length = 50)
    private String sectionCode;

    @Column(name = "section_name_key", nullable = false, length = 100)
    private String sectionNameKey;

    @Column(name = "section_description_key", columnDefinition = "TEXT")
    private String sectionDescriptionKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_id", nullable = false)
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    private CPProcessStepConfig step;

    @Column(name = "section_type", length = 20)
    @Builder.Default
    private String sectionType = "SINGLE";

    @Column(name = "min_rows")
    @Builder.Default
    private Integer minRows = 0;

    @Column(name = "max_rows")
    @Builder.Default
    private Integer maxRows = 100;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "columns_count")
    @Builder.Default
    private Integer columnsCount = 2;

    @Column(name = "collapsible")
    @Builder.Default
    private Boolean collapsible = false;

    @Column(name = "default_collapsed")
    @Builder.Default
    private Boolean defaultCollapsed = false;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    @SQLRestriction("is_active = true")
    @Builder.Default
    @EqualsAndHashCode.Exclude
    private Set<CPProcessFieldConfig> fields = new HashSet<>();

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
