package com.globalcmx.api.alerts.dto;

import com.globalcmx.api.alerts.entity.BusinessRequestReadModel.AlertConfig;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Request DTO for creating a business request from AI extraction.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessRequestCreateRequest {

    @NotBlank(message = "El título es requerido")
    @Size(max = 300, message = "El título no puede exceder 300 caracteres")
    private String title;

    @Size(max = 5000, message = "La descripción no puede exceder 5000 caracteres")
    private String description;

    // AI extraction link
    private String extractionId;

    // Extracted data from AI
    private Map<String, Object> extractedData;

    // Client info
    private String clientId;
    private String clientName;

    // Operation type to create
    private String operationType;

    // Alerts to create when approved
    private List<AlertConfig> alertsConfig;
}
