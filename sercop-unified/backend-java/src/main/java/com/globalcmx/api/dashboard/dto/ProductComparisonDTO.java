package com.globalcmx.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Product Comparison DTO for product performance analysis
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductComparisonDTO {
    private String productType;
    private String productLabel;
    private Integer totalOperations;
    private Integer activeOperations;
    private BigDecimal totalVolume;
    private BigDecimal pendingBalance;  // Saldo pendiente de GLE (después de utilizaciones/pagos)
    private BigDecimal avgOperationSize;
    private BigDecimal volumePercentage;
    private Integer uniqueClients;
    private BigDecimal growthPercent;
    private String color;
    private String icon;
}
