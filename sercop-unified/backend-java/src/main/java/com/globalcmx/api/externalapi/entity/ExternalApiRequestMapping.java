package com.globalcmx.api.externalapi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entity for mapping system variables to external API request parameters.
 * Allows configuring which variables to send to an API and how to transform them.
 */
@Entity
@Table(name = "external_api_request_mapping")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalApiRequestMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "api_config_id", nullable = false)
    private Long apiConfigId;

    /**
     * Source type for the parameter value
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    @Builder.Default
    private SourceType sourceType = SourceType.TEMPLATE_VARIABLE;

    /**
     * Reference to template_variable_read_model.code
     * The system variable to use as the source value (for TEMPLATE_VARIABLE)
     */
    @Column(name = "variable_code", length = 100)
    private String variableCode;

    /**
     * Constant value to use (for CONSTANT source type)
     */
    @Column(name = "constant_value", length = 1000)
    private String constantValue;

    /**
     * Expression/formula to evaluate (for CALCULATED source type)
     * Supports predefined functions like NOW(), TODAY(), UUID(), etc.
     */
    @Column(name = "calculated_expression", length = 500)
    private String calculatedExpression;

    /**
     * Default parameter name in the API (GlobalCMX standard name)
     */
    @Column(name = "api_parameter_name", nullable = false, length = 255)
    private String apiParameterName;

    /**
     * Whether to use a custom name defined by the client (bank)
     */
    @Column(name = "use_custom_name")
    @Builder.Default
    private Boolean useCustomName = false;

    /**
     * Custom parameter name defined by the client (bank)
     */
    @Column(name = "custom_name", length = 255)
    private String customName;

    /**
     * Where to place this parameter in the HTTP request
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "parameter_location", nullable = false)
    @Builder.Default
    private ParameterLocation parameterLocation = ParameterLocation.BODY;

    /**
     * For BODY_JSON_PATH: the JSON path where to insert the value
     * Example: "$.data.currency"
     */
    @Column(name = "json_path", length = 500)
    private String jsonPath;

    /**
     * Type of transformation to apply before sending
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "transformation_type")
    @Builder.Default
    private TransformationType transformationType = TransformationType.NONE;

    /**
     * Pattern for transformation (e.g., date format, number format)
     */
    @Column(name = "transformation_pattern", length = 255)
    private String transformationPattern;

    /**
     * Default value to use if the variable is null
     */
    @Column(name = "default_value", length = 500)
    private String defaultValue;

    /**
     * Whether this parameter is required for the API call
     */
    @Column(name = "is_required")
    @Builder.Default
    private Boolean isRequired = true;

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
     * Source type for the parameter value
     */
    public enum SourceType {
        TEMPLATE_VARIABLE,  // Value from operation template variable
        CONSTANT,           // Fixed constant value
        CALCULATED          // Calculated/computed value using expressions
    }

    /**
     * Location of the parameter in the HTTP request
     */
    public enum ParameterLocation {
        PATH,           // URL path parameter (e.g., /users/{id})
        QUERY,          // URL query parameter (e.g., ?name=value)
        HEADER,         // HTTP header
        BODY,           // Request body (top-level field)
        BODY_JSON_PATH  // Request body at specific JSON path
    }

    /**
     * Type of transformation to apply to the value
     */
    public enum TransformationType {
        NONE,           // No transformation
        UPPERCASE,      // Convert to uppercase
        LOWERCASE,      // Convert to lowercase
        DATE_FORMAT,    // Format date using pattern
        NUMBER_FORMAT,  // Format number using pattern
        CUSTOM          // Custom transformation via SpEL
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (sourceType == null) sourceType = SourceType.TEMPLATE_VARIABLE;
        if (useCustomName == null) useCustomName = false;
        if (parameterLocation == null) parameterLocation = ParameterLocation.BODY;
        if (transformationType == null) transformationType = TransformationType.NONE;
        if (isRequired == null) isRequired = true;
        if (displayOrder == null) displayOrder = 0;
        if (isActive == null) isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Gets the effective parameter name to use in the API call.
     * Returns custom name if useCustomName is true and custom name is set,
     * otherwise returns the default apiParameterName.
     */
    public String getEffectiveParameterName() {
        if (Boolean.TRUE.equals(useCustomName) && customName != null && !customName.isBlank()) {
            return customName;
        }
        return apiParameterName;
    }
}
