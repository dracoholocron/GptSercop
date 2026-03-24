package com.globalcmx.api.alerts.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating alert progress notes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertProgressRequest {

    @NotBlank(message = "Las notas de progreso son requeridas")
    @Size(max = 5000, message = "Las notas no pueden exceder 5000 caracteres")
    private String notes;
}
