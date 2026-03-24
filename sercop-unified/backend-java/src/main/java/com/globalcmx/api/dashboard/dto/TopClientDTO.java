package com.globalcmx.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Top Client DTO for client analysis table
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopClientDTO {
    private Long clientId;
    private String clientName;
    private String clientType; // APPLICANT, BENEFICIARY
    private BigDecimal totalVolume;
    private String primaryCurrency;
    private Integer operationCount;
    private String preferredProduct;
    private TrendDirection trend;
    private BigDecimal activityScore; // 0-100
    private BigDecimal changePercent;
    private String lastActivityDate;

    public enum TrendDirection {
        STRONG_UP, UP, STABLE, DOWN, STRONG_DOWN
    }
}
