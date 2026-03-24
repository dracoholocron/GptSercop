package com.globalcmx.api.security.config.dto.command;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFourEyesConfigCommand {

    private Long id;

    @NotBlank(message = "Entity type is required")
    private String entityType;

    @NotBlank(message = "Action type is required")
    private String actionType;

    private Boolean isEnabled;

    @Min(value = 1, message = "Minimum approvers must be at least 1")
    private Integer minApprovers;

    private BigDecimal amountThreshold;

    private Boolean requireDifferentDepartment;

    private Boolean requireHigherRole;

    private List<String> excludedRoles;
}
