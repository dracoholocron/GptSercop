package com.globalcmx.api.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO for event flow configuration queries (CQRS read side).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventFlowConfigQueryDTO {

    private Long id;
    private String operationType;
    private String fromEventCode;
    private String fromStage;
    private String toEventCode;
    private Map<String, Object> conditions;
    private Boolean isRequired;
    private Boolean isOptional;
    private Integer sequenceOrder;
    private String language;
    private String transitionLabel;
    private String transitionHelp;
    private Boolean isActive;

    // Enriched from event type config (for display)
    private String toEventName;
    private String toEventDescription;
    private String toEventHelpText;
    private String toEventIcon;
    private String toEventColor;
}
