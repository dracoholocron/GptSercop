package com.globalcmx.api.externalapi.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateResponseListenerCommand {

    @NotNull(message = "API config ID is required")
    private Long apiConfigId;

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    @NotBlank(message = "Action type is required")
    private String actionType; // UPDATE_CATALOG, UPDATE_OPERATION, UPDATE_ENTITY, TRIGGER_RULE, SEND_NOTIFICATION, QUEUE_JOB, CUSTOM_SERVICE

    @NotBlank(message = "Action configuration is required")
    private String actionConfigJson;

    private String conditionExpression; // SpEL expression

    private Boolean executeOnSuccess = true;

    private Boolean executeOnFailure = false;

    private Boolean executeAsync = true;

    private Integer executionOrder = 0;

    private Integer retryCount = 0;

    private Integer retryDelayMs = 1000;

    private Boolean active = true;
}
