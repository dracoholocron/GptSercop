package com.globalcmx.api.externalapi.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResponseMappingDTO {
    private Long id;
    private Long apiConfigId;
    private String fieldName;
    private String jsonPath;
    private String dataType;
    private String defaultValue;
    private Boolean required;
    private String transformationType;
    private String transformationPattern;
    private String validationRegex;
    private String description;
    private Integer displayOrder;
    private Boolean active;
}
