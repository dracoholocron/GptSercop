package com.globalcmx.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Monthly Trend Data for line chart
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendDataDTO {
    private String month;
    private String monthLabel;
    private Integer year;
    private BigDecimal volume;
    private Integer operationCount;
    private Integer newClients;
    private BigDecimal avgOperationSize;
}
