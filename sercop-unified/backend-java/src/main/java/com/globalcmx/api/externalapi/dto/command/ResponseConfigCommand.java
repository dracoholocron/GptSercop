package com.globalcmx.api.externalapi.dto.command;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResponseConfigCommand {

    private String successCodes;
    private String responseType;
    private String successFieldPath;
    private String successExpectedValue;
    private String errorMessagePath;
    private String transactionIdPath;
    private String extractionMappingsJson;
    private String validationRulesJson;
}
