package com.globalcmx.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * KPI Card DTO for dashboard metrics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KPICardDTO {
    private String label;
    private String value;
    private String formattedValue;
    private BigDecimal numericValue;
    private String currency;
    private BigDecimal changePercent;
    private String changeLabel;
    private TrendDirection trend;
    private String icon;
    private String color;

    public enum TrendDirection {
        UP, DOWN, STABLE
    }
}
