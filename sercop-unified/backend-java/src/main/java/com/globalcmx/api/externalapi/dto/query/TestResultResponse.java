package com.globalcmx.api.externalapi.dto.query;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestResultResponse {

    private Long id;
    private Long apiConfigId;
    private String testType;
    private Boolean success;
    private String message;
    private Integer responseStatusCode;
    private String responseBody;
    private Long executionTimeMs;
    private String errorDetails;

    private String requestUrl;
    private String requestMethod;
    private String requestHeaders;
    private String requestBody;

    private String testedBy;
    private LocalDateTime testedAt;
}
