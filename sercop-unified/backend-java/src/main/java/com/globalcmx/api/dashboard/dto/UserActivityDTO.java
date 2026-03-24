package com.globalcmx.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * User Activity DTO for tracking operator productivity
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserActivityDTO {
    private String username;
    private String fullName;
    private Integer operationsToday;
    private Integer operationsThisWeek;
    private Integer operationsThisMonth;
    private BigDecimal volumeThisMonth;
    private String lastActivityDate;
    private String mostUsedProduct;
}
