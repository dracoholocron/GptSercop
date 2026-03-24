package com.globalcmx.api.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FilterOperatorDTO {
    private String id;
    private String label;
    private Boolean requiresValue;
    private Boolean requiresTwoValues;
}
