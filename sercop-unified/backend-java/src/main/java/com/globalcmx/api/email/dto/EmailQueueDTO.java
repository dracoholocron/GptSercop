package com.globalcmx.api.email.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailQueueDTO {
    private Long id;
    private String uuid;
    private String tenantId;
    private List<String> toAddresses;
    private List<String> ccAddresses;
    private List<String> bccAddresses;
    private String fromEmail;
    private String fromName;
    private String subject;
    private String bodyHtml;
    private String bodyText;
    private String templateCode;
    private Object templateVariables;
    private String priority;
    private String status;
    private Integer retryCount;
    private Integer maxRetries;
    private String lastError;
    private String referenceType;
    private String referenceId;
    private Long providerId;
    private String providerUsed;
    private String providerMessageId;
    private LocalDateTime scheduledAt;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
    private String createdBy;
}
