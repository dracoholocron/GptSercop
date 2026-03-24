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
public class CreateResponseMappingCommand {

    @NotNull(message = "API config ID is required")
    private Long apiConfigId;

    @NotBlank(message = "Field name is required")
    private String fieldName;

    @NotBlank(message = "JSON path is required")
    private String jsonPath;

    private String dataType = "STRING"; // STRING, NUMBER, BOOLEAN, DATE, JSON_OBJECT, JSON_ARRAY

    private String defaultValue;

    private Boolean required = false;

    private String transformationType; // NONE, UPPERCASE, LOWERCASE, DATE_FORMAT, NUMBER_FORMAT, CUSTOM

    private String transformationPattern;

    private String validationRegex;

    private String description;

    private Integer displayOrder = 0;

    private Boolean active = true;
}
