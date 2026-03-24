package com.globalcmx.api.externalapi.dto.query;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiCallLogResponse {

    private Long id;
    private Long apiConfigId;
    private String apiConfigCode;
    private String requestUrl;
    private String requestMethod;
    private Integer responseStatusCode;
    private Long executionTimeMs;
    private Integer attemptNumber;
    private Boolean success;
    private String errorMessage;
    private String errorType;
    private String correlationId;
    private String operationId;
    private String operationType;
    private String eventType;
    private String triggeredBy;
    private LocalDateTime createdAt;

    private String requestHeadersJson;
    private String requestBody;
    private String responseHeadersJson;
    private String responseBody;
}
