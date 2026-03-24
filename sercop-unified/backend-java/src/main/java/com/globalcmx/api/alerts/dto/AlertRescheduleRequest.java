package com.globalcmx.api.alerts.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Request DTO for rescheduling an alert.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertRescheduleRequest {

    @NotNull(message = "La nueva fecha es requerida")
    private LocalDate newDate;

    private LocalTime newTime;

    private String notes;
}
