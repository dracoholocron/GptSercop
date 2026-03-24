package com.globalcmx.api.externalapi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity for mapping external API response fields to internal system values.
 * Uses JSONPath to extract values from the API response.
 */
@Entity
@Table(name = "external_api_response_mapping")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalApiResponseMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "api_config_id", nullable = false)
    private Long apiConfigId;

    /**
     * JSONPath expression to extract value from response
     * Example: "$.data.exchangeRate", "$.rates[0].value"
     */
    @Column(name = "response_json_path", nullable = false, length = 500)
    private String responseJsonPath;

    /**
     * Internal name to reference this extracted value
     * This name is used in listeners and other configurations
     */
    @Column(name = "internal_name", nullable = false, length = 100)
    private String internalName;

    /**
     * Expected data type of the extracted value
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "data_type", nullable = false)
    @Builder.Default
    private DataType dataType = DataType.STRING;

    /**
     * Format pattern for parsing (e.g., "yyyy-MM-dd" for dates)
     */
    @Column(name = "parse_format", length = 100)
    private String parseFormat;

    /**
     * Type of transformation to apply after extraction
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "transformation_type")
    @Builder.Default
    private TransformationType transformationType = TransformationType.NONE;

    /**
     * Value for transformation (e.g., multiplier for MULTIPLY)
     */
    @Column(name = "transformation_value", length = 255)
    private String transformationValue;

    /**
     * Regex pattern for validation
     */
    @Column(name = "validation_regex", length = 500)
    private String validationRegex;

    /**
     * Minimum value for numeric validation
     */
    @Column(name = "validation_min_value", precision = 20, scale = 6)
    private BigDecimal validationMinValue;

    /**
     * Maximum value for numeric validation
     */
    @Column(name = "validation_max_value", precision = 20, scale = 6)
    private BigDecimal validationMaxValue;

    /**
     * Default value if the path is not found in the response
     */
    @Column(name = "default_value", length = 500)
    private String defaultValue;

    /**
     * Whether this field is required in the response
     */
    @Column(name = "is_required")
    @Builder.Default
    private Boolean isRequired = false;

    /**
     * Description for documentation purposes
     */
    @Column(name = "description", length = 500)
    private String description;

    /**
     * Order for processing mappings
     */
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    /**
     * Whether this mapping is active
     */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Data types supported for response mapping
     */
    public enum DataType {
        STRING,     // Text value
        NUMBER,     // Any number
        DECIMAL,    // Decimal/BigDecimal value
        INTEGER,    // Integer value
        BOOLEAN,    // Boolean value
        DATE,       // Date without time
        DATETIME,   // Date with time
        JSON,       // JSON object
        ARRAY       // JSON array
    }

    /**
     * Transformations that can be applied to extracted values
     */
    public enum TransformationType {
        NONE,       // No transformation
        UPPERCASE,  // Convert to uppercase
        LOWERCASE,  // Convert to lowercase
        TRIM,       // Trim whitespace
        ROUND,      // Round to N decimal places (value = decimal places)
        MULTIPLY,   // Multiply by value
        DIVIDE,     // Divide by value
        CUSTOM      // Custom transformation via SpEL
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (dataType == null) dataType = DataType.STRING;
        if (transformationType == null) transformationType = TransformationType.NONE;
        if (isRequired == null) isRequired = false;
        if (displayOrder == null) displayOrder = 0;
        if (isActive == null) isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
