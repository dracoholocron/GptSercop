package com.globalcmx.api.alerts.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for completing an alert.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertCompleteRequest {

    private String notes;
}
