package com.globalcmx.api.compraspublicas.config.dto;

import com.globalcmx.api.compraspublicas.config.entity.CPCountryConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CPProcessConfigurationDTO {

    private CPCountryConfig country;
    private String processType;
    private List<StepDTO> steps;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StepDTO {
        private String id;
        private String stepCode;
        private String stepNameKey;
        private String stepDescriptionKey;
        private String phase;
        private Integer displayOrder;
        private String icon;
        private String color;
        private Boolean showInWizard;
        private Boolean showInExpert;
        private String requiredRole;
        private List<SectionDTO> sections;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SectionDTO {
        private String id;
        private String sectionCode;
        private String sectionNameKey;
        private String sectionDescriptionKey;
        private String sectionType;
        private Integer minRows;
        private Integer maxRows;
        private Integer displayOrder;
        private Integer columnsCount;
        private Boolean collapsible;
        private Boolean defaultCollapsed;
        private List<FieldDTO> fields;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FieldDTO {
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
        private Boolean isRequired;
        private String requiredCondition;
        private String validationRules;
        private String dependencies;
        private String fieldOptions;
        private String defaultValue;
        private String defaultValueExpression;
        private String legalReference;
        private Boolean aiAssistEnabled;
        private String mapsToExternalField;
        private Boolean showInWizard;
        private Boolean showInExpert;
        private Boolean showInView;
        private Boolean showInList;
    }
}
