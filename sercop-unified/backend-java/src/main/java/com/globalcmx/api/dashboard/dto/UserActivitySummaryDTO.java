package com.globalcmx.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * User Activity Summary DTO
 * Includes both the list of top users and the overall totals
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserActivitySummaryDTO {
    // Totals across ALL users (not just the top users in the list)
    private Integer totalOperationsToday;
    private Integer totalOperationsPeriod;
    private BigDecimal totalVolumePeriod;
    private Integer totalActiveUsers;

    // List of top users (limited to top 15)
    private List<UserActivityDTO> users;
}
