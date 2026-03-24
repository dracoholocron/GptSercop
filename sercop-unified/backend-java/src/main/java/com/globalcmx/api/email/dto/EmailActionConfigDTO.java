package com.globalcmx.api.email.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailActionConfigDTO {
    private Long id;
    private String actionType;
    private String eventTypeCode;
    private String productTypeCode;
    private Boolean isActive;
    private String templateCode;
    private String recipientType;
    private List<String> customRecipients;
    private Object conditions;
    private String createdBy;
}
