package com.globalcmx.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Expiry Countdown DTO for upcoming expirations widget
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpiryCountdownDTO {
    private String range; // "3_DAYS", "7_DAYS", "15_DAYS", "30_DAYS"
    private String rangeLabel;
    private Integer count;
    private BigDecimal totalVolume;
    private String urgencyLevel; // "CRITICAL", "HIGH", "MEDIUM", "LOW"
    private String color;
    private List<ExpiryProductBreakdownDTO> productBreakdown;
}
