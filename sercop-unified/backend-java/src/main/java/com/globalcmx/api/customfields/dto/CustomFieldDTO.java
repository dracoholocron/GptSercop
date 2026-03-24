package com.globalcmx.api.customfields.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for custom field configuration.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomFieldDTO {
    private String id;
    private String fieldCode;
    private String fieldNameKey;
    private String fieldDescriptionKey;
    private String fieldType;
    private String componentType;
    private String dataSourceType;
    private String dataSourceCode;
    private String dataSourceFilters;
    private Integer displayOrder;
    private String placeholderKey;
    private String helpTextKey;
    private Integer spanColumns;
    private Boolean isRequired;
    private String requiredCondition;
    private String validationRules;
    private String dependencies;
    private String defaultValue;
    private String defaultValueExpression;
    private String fieldOptions;
    private String embedAfterSwiftField;
    private Boolean embedInline;
    private Boolean aiEnabled;
    private String aiHelpPrompt;
    private String aiValidationPrompt;
}
