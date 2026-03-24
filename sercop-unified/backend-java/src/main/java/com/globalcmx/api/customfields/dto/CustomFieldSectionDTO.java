package com.globalcmx.api.customfields.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for custom field section configuration.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomFieldSectionDTO {
    private String id;
    private String sectionCode;
    private String sectionNameKey;
    private String sectionDescriptionKey;
    private String sectionType;
    private Integer minRows;
    private Integer maxRows;
    private Integer displayOrder;
    private Boolean collapsible;
    private Boolean defaultCollapsed;
    private Integer columns;
    private String embedMode;
    private String embedTargetType;
    private String embedTargetCode;
    private Boolean embedShowSeparator;
    private Boolean embedCollapsible;
    private String embedSeparatorTitleKey;
    private List<CustomFieldDTO> fields;
}
