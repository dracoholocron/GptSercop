package com.globalcmx.api.externalapi.dto.query;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequestTemplateResponse {

    private Long id;
    private String name;
    private String description;
    private String staticHeadersJson;
    private String queryParamsTemplate;
    private String bodyTemplate;
    private String testPayloadExample;
    private String variableMappingsJson;
    private Boolean isDefault;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
