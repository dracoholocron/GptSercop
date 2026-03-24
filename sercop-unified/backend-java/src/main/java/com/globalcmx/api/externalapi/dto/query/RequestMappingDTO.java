package com.globalcmx.api.externalapi.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequestMappingDTO {
    private Long id;
    private Long apiConfigId;

    // Source type and values
    private String sourceType; // TEMPLATE_VARIABLE, CONSTANT, CALCULATED
    private String variableCode;
    private String variableName; // Resolved label for TEMPLATE_VARIABLE
    private String constantValue;
    private String calculatedExpression;

    // Parameter config
    private String parameterName;
    private String parameterLocation;
    private String defaultValue;
    private Boolean required;
    private String transformationType;
    private String transformationPattern;
    private Integer displayOrder;
    private Boolean active;

    /**
     * Gets a display-friendly description of the source value
     */
    public String getSourceDescription() {
        if (sourceType == null) return variableName != null ? variableName : variableCode;
        return switch (sourceType) {
            case "TEMPLATE_VARIABLE" -> variableName != null ? variableName : variableCode;
            case "CONSTANT" -> "\"" + constantValue + "\"";
            case "CALCULATED" -> "=" + calculatedExpression;
            default -> "";
        };
    }
}
