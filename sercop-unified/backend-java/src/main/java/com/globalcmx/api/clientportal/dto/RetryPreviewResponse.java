package com.globalcmx.api.clientportal.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class RetryPreviewResponse {
    private String apiConfigCode;
    private String apiName;
    private String httpMethod;
    private String resolvedUrl;
    private String bodyTemplate;
    private Map<String, Object> contextData;
    private Map<String, String> fieldLabels;
}
