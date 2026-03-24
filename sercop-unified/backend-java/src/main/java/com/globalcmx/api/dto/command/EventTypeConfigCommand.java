package com.globalcmx.api.dto.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Command DTO for creating/updating event type configurations.
 * Used in CQRS command operations for event type management.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventTypeConfigCommand {

    private Long id;

    @NotBlank(message = "Event code is required")
    @Size(max = 50, message = "Event code must not exceed 50 characters")
    private String eventCode;

    @NotBlank(message = "Operation type is required")
    @Size(max = 50, message = "Operation type must not exceed 50 characters")
    private String operationType;

    @NotBlank(message = "Language is required")
    @Size(max = 5, message = "Language must not exceed 5 characters")
    private String language;

    @NotBlank(message = "Event name is required")
    @Size(max = 100, message = "Event name must not exceed 100 characters")
    private String eventName;

    private String eventDescription;

    private String helpText;

    @Size(max = 10, message = "Outbound message type must not exceed 10 characters")
    private String outboundMessageType;

    @Size(max = 10, message = "Inbound message type must not exceed 10 characters")
    private String inboundMessageType;

    private List<String> validFromStages;

    private List<String> validFromStatuses;

    @Size(max = 50, message = "Resulting stage must not exceed 50 characters")
    private String resultingStage;

    @Size(max = 50, message = "Resulting status must not exceed 50 characters")
    private String resultingStatus;

    @Size(max = 50, message = "Icon must not exceed 50 characters")
    private String icon;

    @Size(max = 20, message = "Color must not exceed 20 characters")
    private String color;

    private Integer displayOrder;

    @NotNull(message = "Active status is required")
    private Boolean isActive;

    private Boolean requiresApproval;

    private Integer approvalLevels;

    private Boolean isReversible;

    private Boolean generatesNotification;

    private List<String> allowedRoles;

    // Message direction fields
    @Size(max = 30, message = "Message sender must not exceed 30 characters")
    private String messageSender;

    @Size(max = 30, message = "Message receiver must not exceed 30 characters")
    private String messageReceiver;

    @Size(max = 10, message = "Our role must not exceed 10 characters")
    private String ourRole;

    private Boolean requiresSwiftMessage;

    @Size(max = 30, message = "Event category must not exceed 30 characters")
    private String eventCategory;

    // Initial event configuration
    private Boolean isInitialEvent;

    @Size(max = 30, message = "Initial event role must not exceed 30 characters")
    private String initialEventRole;
}
