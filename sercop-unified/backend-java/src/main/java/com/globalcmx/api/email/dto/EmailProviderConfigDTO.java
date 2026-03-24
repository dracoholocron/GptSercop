package com.globalcmx.api.email.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailProviderConfigDTO {
    private Long id;
    private String tenantId;
    private String name;
    private String providerType;
    private String smtpHost;
    private String smtpPort;
    private String smtpUsername;
    private String smtpPassword;
    private Boolean smtpUseTls;
    private Boolean smtpUseSsl;
    private String apiKey;
    private String apiEndpoint;
    private String apiRegion;
    private String fromEmail;
    private String fromName;
    private String replyToEmail;
    private Integer rateLimitPerMinute;
    private Integer rateLimitPerHour;
    private Integer rateLimitPerDay;
    private Boolean isActive;
    private Boolean isDefault;
    private Integer priority;
}
