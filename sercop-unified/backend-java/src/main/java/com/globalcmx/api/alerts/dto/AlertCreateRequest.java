package com.globalcmx.api.alerts.dto;

import com.globalcmx.api.alerts.entity.UserAlertReadModel.AlertPriority;
import com.globalcmx.api.alerts.entity.UserAlertReadModel.AlertType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Request DTO for creating a new alert.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertCreateRequest {

    @NotBlank(message = "El título es requerido")
    @Size(max = 300, message = "El título no puede exceder 300 caracteres")
    private String title;

    @Size(max = 5000, message = "La descripción no puede exceder 5000 caracteres")
    private String description;

    @NotNull(message = "El tipo de alerta es requerido")
    private AlertType alertType;

    @Builder.Default
    private AlertPriority priority = AlertPriority.NORMAL;

    @NotNull(message = "La fecha programada es requerida")
    private LocalDate scheduledDate;

    private LocalTime scheduledTime;

    // Optional: assign to another user (requires permission)
    private String assignToUserId;

    // Optional: assign to a role (creates alert for all users with that role)
    private String assignToRole;

    // Linking (optional)
    private String operationId;
    private String clientId;
    private String clientName;
    private String draftId;

    // For alerts created from business requests
    private String requestId;

    // Tags for categorization
    private List<String> tags;
}
