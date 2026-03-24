package com.globalcmx.api.externalapi.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResponseListenerDTO {
    private Long id;
    private Long apiConfigId;
    private String name;
    private String description;
    private String actionType;
    private String actionConfigJson;
    private String conditionExpression;
    private Boolean executeOnSuccess;
    private Boolean executeOnFailure;
    private Boolean executeAsync;
    private Integer executionOrder;
    private Integer retryCount;
    private Integer retryDelayMs;
    private Boolean active;
}
