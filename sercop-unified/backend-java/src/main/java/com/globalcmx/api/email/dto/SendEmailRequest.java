package com.globalcmx.api.email.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendEmailRequest {
    private List<String> to;
    private List<String> cc;
    private List<String> bcc;
    private String subject;
    private String bodyHtml;
    private String bodyText;
    private String templateCode;
    private Map<String, Object> templateVariables;
    private String priority;
    private String referenceType;
    private String referenceId;
    private LocalDateTime scheduledAt;
}
