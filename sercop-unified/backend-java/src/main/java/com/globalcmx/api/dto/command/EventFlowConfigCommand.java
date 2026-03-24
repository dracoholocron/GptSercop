package com.globalcmx.api.dto.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Map;

/**
 * Command DTO for creating/updating event flow configurations.
 * Used in CQRS command operations for event flow management.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventFlowConfigCommand {

    private Long id;

    @NotBlank(message = "Operation type is required")
    @Size(max = 50, message = "Operation type must not exceed 50 characters")
    private String operationType;

    @Size(max = 50, message = "From event code must not exceed 50 characters")
    private String fromEventCode;

    @Size(max = 50, message = "From stage must not exceed 50 characters")
    private String fromStage;

    @NotBlank(message = "To event code is required")
    @Size(max = 50, message = "To event code must not exceed 50 characters")
    private String toEventCode;

    private Map<String, Object> conditions;

    @NotNull(message = "Required status is required")
    private Boolean isRequired;

    @NotNull(message = "Optional status is required")
    private Boolean isOptional;

    private Integer sequenceOrder;

    @Size(max = 5, message = "Language must not exceed 5 characters")
    private String language;

    @Size(max = 100, message = "Transition label must not exceed 100 characters")
    private String transitionLabel;

    private String transitionHelp;

    @NotNull(message = "Active status is required")
    private Boolean isActive;
}
