package com.globalcmx.api.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for event type configuration queries (CQRS read side).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventTypeConfigQueryDTO {

    private Long id;
    private String eventCode;
    private String operationType;
    private String language;
    private String eventName;
    private String eventDescription;
    private String helpText;

    // SWIFT messages
    private String outboundMessageType;
    private String inboundMessageType;

    // Flow rules
    private List<String> validFromStages;
    private List<String> validFromStatuses;
    private String resultingStage;
    private String resultingStatus;

    // UI
    private String icon;
    private String color;
    private Integer displayOrder;

    // Message direction
    private String messageSender;
    private String messageReceiver;
    private String ourRole;
    private Boolean requiresSwiftMessage;
    private String eventCategory;

    // Initial event configuration
    private Boolean isInitialEvent;
    private String initialEventRole;

    // Client portal configuration
    private Boolean isClientRequestable;
    private String eventSource;

    // Flags
    private Boolean isActive;
    private Boolean requiresApproval;
    private Integer approvalLevels;
    private Boolean isReversible;
    private Boolean generatesNotification;

    // Permissions
    private List<String> allowedRoles;

    // Form fields configuration for client portal
    private List<java.util.Map<String, Object>> formFieldsConfig;

    // Audit
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private Integer version;
}
