package com.globalcmx.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Product breakdown for expiry countdown
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpiryProductBreakdownDTO {
    private String productType;
    private String productLabel;
    private Integer count;
    private BigDecimal volume;
    private String color;
}
