package com.globalcmx.api.customfields.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for complete custom fields configuration.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomFieldsConfigurationDTO {
    private String productType;
    private String tenantId;
    private String mode;
    private List<CustomFieldStepDTO> steps;
}
