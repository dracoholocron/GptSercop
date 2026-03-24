package com.globalcmx.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Currency Distribution for donut chart
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrencyDistributionDTO {
    private String currency;
    private BigDecimal amount;
    private BigDecimal percentage;
    private Integer operationCount;
    private String color;
}
