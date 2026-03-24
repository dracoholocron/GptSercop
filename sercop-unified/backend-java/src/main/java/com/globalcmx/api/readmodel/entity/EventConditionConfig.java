package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity for configurable event conditions.
 * Allows defining conditions that control when events are available
 * without code changes - everything is database-driven.
 */
@Entity
@Table(name = "event_condition_config",
    indexes = {
        @Index(name = "idx_condition_type", columnList = "condition_type"),
        @Index(name = "idx_message_type", columnList = "message_type"),
        @Index(name = "idx_category", columnList = "category"),
        @Index(name = "idx_is_active", columnList = "is_active")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_condition_code_lang", columnNames = {"condition_code", "language"})
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventConditionConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ==================== Identification ====================

    @Column(name = "condition_code", nullable = false, length = 50)
    private String conditionCode;

    @Column(name = "condition_name", nullable = false, length = 100)
    private String conditionName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // ==================== Condition Type ====================

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_type", nullable = false, length = 20)
    private ConditionType conditionType;

    // ==================== For SWIFT_FIELD type ====================

    @Column(name = "message_type", length = 10)
    private String messageType;

    @Column(name = "field_code", length = 20)
    private String fieldCode;

    @Column(name = "field_subfield", length = 20)
    private String fieldSubfield;

    // ==================== For OPERATION_FIELD type ====================

    @Column(name = "entity_type", length = 50)
    private String entityType;

    @Column(name = "field_path", length = 100)
    private String fieldPath;

    // ==================== Comparison ====================

    @Enumerated(EnumType.STRING)
    @Column(name = "comparison_operator", nullable = false, length = 30)
    private ComparisonOperator comparisonOperator;

    @Column(name = "comparison_value", columnDefinition = "TEXT")
    private String comparisonValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "comparison_value_type", length = 20)
    @Builder.Default
    private ValueType comparisonValueType = ValueType.STRING;

    // ==================== For COMPOSITE type ====================

    @Enumerated(EnumType.STRING)
    @Column(name = "composite_operator", length = 10)
    private CompositeOperator compositeOperator;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "child_condition_codes", columnDefinition = "JSON")
    private List<String> childConditionCodes;

    // ==================== For EXPRESSION type ====================

    @Enumerated(EnumType.STRING)
    @Column(name = "expression_language", length = 20)
    private ExpressionLanguage expressionLanguage;

    @Column(name = "expression_text", columnDefinition = "TEXT")
    private String expressionText;

    // ==================== Caching ====================

    @Column(name = "is_cacheable")
    @Builder.Default
    private Boolean isCacheable = true;

    @Column(name = "cache_ttl_seconds")
    @Builder.Default
    private Integer cacheTtlSeconds = 300;

    // ==================== Metadata ====================

    @Column(name = "category", length = 50)
    private String category;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "operation_types", columnDefinition = "JSON")
    private List<String> operationTypes;

    @Column(name = "language", length = 5)
    @Builder.Default
    private String language = "en";

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

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

    // ==================== Enums ====================

    public enum ConditionType {
        SWIFT_FIELD,        // Check field in SWIFT message
        OPERATION_FIELD,    // Check field in operation entity
        MESSAGE_FIELD,      // Check field in any message
        COMPOSITE,          // Combine multiple conditions
        EXPRESSION          // Custom expression (SpEL, Drools, etc.)
    }

    public enum ComparisonOperator {
        EXISTS,
        NOT_EXISTS,
        EQUALS,
        NOT_EQUALS,
        CONTAINS,
        NOT_CONTAINS,
        STARTS_WITH,
        ENDS_WITH,
        MATCHES_REGEX,
        GREATER_THAN,
        GREATER_THAN_OR_EQUALS,
        LESS_THAN,
        LESS_THAN_OR_EQUALS,
        IN_LIST,
        NOT_IN_LIST,
        IS_EMPTY,
        IS_NOT_EMPTY,
        IS_NULL,
        IS_NOT_NULL
    }

    public enum CompositeOperator {
        AND,
        OR,
        NOT,
        XOR
    }

    public enum ValueType {
        STRING,
        NUMBER,
        BOOLEAN,
        DATE,
        LIST,
        REGEX
    }

    public enum ExpressionLanguage {
        SPEL,
        DROOLS,
        MVEL,
        JAVASCRIPT
    }
}
