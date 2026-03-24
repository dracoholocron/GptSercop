package com.globalcmx.api.alerts.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for starting work on an alert (changing status to IN_PROGRESS).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertStartRequest {

    @Size(max = 1000, message = "Las notas no pueden exceder 1000 caracteres")
    private String notes;
}
