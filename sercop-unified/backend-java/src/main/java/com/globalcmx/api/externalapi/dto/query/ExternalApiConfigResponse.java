package com.globalcmx.api.externalapi.dto.query;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalApiConfigResponse {

    private Long id;
    private String code;
    private String name;
    private String description;
    private String baseUrl;
    private String path;
    private String httpMethod;
    private String contentType;
    private Integer timeoutMs;
    private Integer retryCount;
    private Double retryBackoffMultiplier;
    private Integer retryInitialDelayMs;
    private Integer retryMaxDelayMs;
    private Boolean circuitBreakerEnabled;
    private Integer circuitBreakerThreshold;
    private Integer circuitBreakerTimeoutMs;
    private Boolean active;
    private String environment;

    private Boolean mockEnabled;
    private String mockProvider;
    private String mockCustomUrl;

    private AuthConfigResponse authConfig;
    private List<RequestTemplateResponse> requestTemplates;
    private ResponseConfigResponse responseConfig;

    private ApiMetricsSummary metricsSummary;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
