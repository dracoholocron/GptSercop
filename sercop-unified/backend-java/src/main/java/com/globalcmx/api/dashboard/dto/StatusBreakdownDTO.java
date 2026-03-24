package com.globalcmx.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Status Breakdown for horizontal bar chart
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusBreakdownDTO {
    private String status;
    private String statusLabel;
    private Integer count;
    private BigDecimal percentage;
    private BigDecimal volume;
    private String color;
}
