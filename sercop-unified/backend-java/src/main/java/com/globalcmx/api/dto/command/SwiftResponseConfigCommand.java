package com.globalcmx.api.dto.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

/**
 * Command DTO for creating/updating SWIFT response configurations.
 * Used in CQRS command operations for response configuration management.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwiftResponseConfigCommand {

    private Long id;

    @NotBlank(message = "Sent message type is required")
    @Size(max = 10, message = "Sent message type must not exceed 10 characters")
    private String sentMessageType;

    @NotBlank(message = "Operation type is required")
    @Size(max = 50, message = "Operation type must not exceed 50 characters")
    private String operationType;

    @NotBlank(message = "Expected response type is required")
    @Size(max = 10, message = "Expected response type must not exceed 10 characters")
    private String expectedResponseType;

    @Size(max = 50, message = "Response event code must not exceed 50 characters")
    private String responseEventCode;

    @Min(value = 1, message = "Expected response days must be at least 1")
    @Max(value = 365, message = "Expected response days must not exceed 365")
    private Integer expectedResponseDays;

    @Min(value = 1, message = "Alert after days must be at least 1")
    @Max(value = 365, message = "Alert after days must not exceed 365")
    private Integer alertAfterDays;

    @Min(value = 1, message = "Escalate after days must be at least 1")
    @Max(value = 365, message = "Escalate after days must not exceed 365")
    private Integer escalateAfterDays;

    @Size(max = 5, message = "Language must not exceed 5 characters")
    private String language;

    @Size(max = 200, message = "Response description must not exceed 200 characters")
    private String responseDescription;

    @Size(max = 200, message = "Timeout message must not exceed 200 characters")
    private String timeoutMessage;

    @NotNull(message = "Active status is required")
    private Boolean isActive;
}
