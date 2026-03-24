package com.globalcmx.api.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Main Dashboard Summary DTO
 * Contains all KPIs and aggregated data for the Business Intelligence Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDTO {

    // === KPI Cards ===
    private List<KPICardDTO> volumeByC;  // Volume KPIs per currency
    private List<KPICardDTO> operationsByC;  // Operations KPIs per currency
    private List<KPICardDTO> clientsByC;  // Active clients KPIs per currency
    private KPICardDTO operationsToday;
    private KPICardDTO pendingApprovals;
    private KPICardDTO operationsWithAlerts;

    // === Charts Data ===
    private List<VolumeByProductDTO> volumeByProduct;
    private List<CurrencyDistributionDTO> currencyDistribution;
    private List<TrendDataDTO> monthlyTrend;
    private List<StatusBreakdownDTO> statusBreakdown;
    private List<TopClientDTO> topClients;
    private List<ActivityHeatmapDTO> activityHeatmap;
    private List<ExpiryCountdownDTO> upcomingExpiries;
    private List<ProductComparisonDTO> productComparison;
    private UserActivitySummaryDTO userActivity;

    // === Metadata ===
    private String lastUpdated;
    private String periodLabel;
}
