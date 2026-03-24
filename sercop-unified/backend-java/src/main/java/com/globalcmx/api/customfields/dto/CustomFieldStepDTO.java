package com.globalcmx.api.customfields.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for custom field step configuration.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomFieldStepDTO {
    private String id;
    private String stepCode;
    private String stepNameKey;
    private String stepDescriptionKey;
    private String productType;
    private Integer displayOrder;
    private String icon;
    private String embedMode;
    private String embedSwiftStep;
    private List<CustomFieldSectionDTO> sections;
}
