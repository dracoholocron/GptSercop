package com.globalcmx.api.externalapi.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRequestMappingCommand {

    @NotNull(message = "API config ID is required")
    private Long apiConfigId;

    /**
     * Source type for the parameter value
     * TEMPLATE_VARIABLE - Value from operation template variable
     * CONSTANT - Fixed constant value
     * CALCULATED - Calculated/computed value using expressions
     */
    @Builder.Default
    private String sourceType = "TEMPLATE_VARIABLE";

    /**
     * Variable code (required for TEMPLATE_VARIABLE source type)
     */
    private String variableCode;

    /**
     * Constant value (required for CONSTANT source type)
     */
    private String constantValue;

    /**
     * Expression/formula (required for CALCULATED source type)
     * Examples: NOW(), TODAY(), UUID(), DATE_ADD(7), etc.
     */
    private String calculatedExpression;

    @NotBlank(message = "Parameter name is required")
    private String parameterName;

    @NotBlank(message = "Parameter location is required")
    private String parameterLocation; // PATH, QUERY, HEADER, BODY, BODY_JSON_PATH

    private String defaultValue;

    private Boolean required = false;

    private String transformationType; // NONE, UPPERCASE, LOWERCASE, DATE_FORMAT, NUMBER_FORMAT, CUSTOM

    private String transformationPattern;

    private Integer displayOrder = 0;

    private Boolean active = true;

    /**
     * Validates that required fields are present based on sourceType
     */
    public boolean isValid() {
        if (sourceType == null) return false;
        return switch (sourceType) {
            case "TEMPLATE_VARIABLE" -> variableCode != null && !variableCode.isBlank();
            case "CONSTANT" -> constantValue != null && !constantValue.isBlank();
            case "CALCULATED" -> calculatedExpression != null && !calculatedExpression.isBlank();
            default -> false;
        };
    }
}
