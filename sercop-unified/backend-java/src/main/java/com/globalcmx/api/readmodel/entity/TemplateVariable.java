package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Template variables that can be used in action configurations.
 * Variables are populated from operation_readmodel and related tables.
 * Used for dynamic placeholder replacement in emails, API calls, etc.
 * Labels and descriptions use i18n keys that the frontend resolves.
 */
@Entity
@Table(name = "template_variable_read_model")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateVariable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 100)
    private String code;

    @Column(name = "label_key", nullable = false, length = 200)
    private String labelKey;

    @Column(name = "description_key", length = 200)
    private String descriptionKey;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "color", nullable = false, length = 20)
    @Builder.Default
    private String color = "gray";

    @Column(name = "source_table", nullable = false, length = 100)
    private String sourceTable;

    @Column(name = "source_column", nullable = false, length = 100)
    private String sourceColumn;

    @Column(name = "data_type", nullable = false, length = 50)
    @Builder.Default
    private String dataType = "STRING";

    @Column(name = "format_pattern", length = 100)
    private String formatPattern;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by", length = 100)
    @Builder.Default
    private String createdBy = "system";
}
