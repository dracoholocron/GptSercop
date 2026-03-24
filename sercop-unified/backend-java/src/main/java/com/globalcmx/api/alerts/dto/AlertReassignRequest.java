package com.globalcmx.api.alerts.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for reassigning an alert to a different user.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertReassignRequest {

    /**
     * The new user ID to assign the alert to.
     */
    @NotBlank(message = "El usuario destino es requerido")
    private String newUserId;

    /**
     * The new user's display name (for read model).
     */
    private String newUserName;

    /**
     * Optional reason for the reassignment.
     */
    private String reason;
}
