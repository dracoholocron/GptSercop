package com.globalcmx.api.dashboard.controller;

import com.globalcmx.api.customfields.entity.CustomFieldConfig;
import com.globalcmx.api.customfields.repository.CustomFieldConfigRepository;
import com.globalcmx.api.dashboard.dto.*;
import com.globalcmx.api.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Dashboard Controller
 * REST API endpoints for the Business Intelligence Dashboard
 */
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    private final DashboardService dashboardService;
    private final CustomFieldConfigRepository customFieldConfigRepository;

    /**
     * Get complete dashboard summary with all KPIs and chart data
     */
    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDTO> getDashboardSummary(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String currency,
            @RequestParam(defaultValue = "10") Integer topClientsLimit,
            @RequestParam(defaultValue = "OPEN") String statusFilter,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) String beneficiary,
            @RequestParam(required = false) String issuingBank,
            @RequestParam(required = false) String advisingBank,
            @RequestParam(required = false) String applicant,
            @RequestParam(required = false) String swiftFieldSearch,
            @RequestParam(required = false) String swiftFreeText,
            @RequestParam(required = false) String customFieldValue,
            @RequestParam(required = false) String customFieldFilters
    ) {
        log.info("Getting dashboard summary for period: {}, productType: {}, currency: {}, statusFilter: {}, swiftFieldSearch: {}, swiftFreeText: {}, customFieldFilters: {}",
                period, productType, currency, statusFilter,
                swiftFieldSearch, swiftFreeText, customFieldFilters);
        var advanced = AdvancedFilters.builder()
                .createdBy(createdBy).beneficiary(beneficiary)
                .issuingBank(issuingBank).advisingBank(advisingBank)
                .applicant(applicant)
                .swiftFieldSearch(swiftFieldSearch)
                .swiftFreeText(swiftFreeText)
                .customFieldValue(customFieldValue)
                .customFieldFilters(customFieldFilters)
                .build();
        return ResponseEntity.ok(dashboardService.getDashboardSummary(period, productType, currency, topClientsLimit, statusFilter, advanced));
    }

    /**
     * Get volume by product over time (for stacked area chart)
     */
    @GetMapping("/volume-by-product")
    public ResponseEntity<List<VolumeByProductDTO>> getVolumeByProduct(
            @RequestParam(defaultValue = "semester") String period,
            @RequestParam(required = false) String currency,
            @RequestParam(defaultValue = "OPEN") String statusFilter,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) String beneficiary,
            @RequestParam(required = false) String issuingBank,
            @RequestParam(required = false) String advisingBank,
            @RequestParam(required = false) String applicant
    ) {
        log.debug("Getting volume by product for period: {}, currency: {}, statusFilter: {}", period, currency, statusFilter);
        var advanced = buildAdvancedFilters(createdBy, beneficiary, issuingBank, advisingBank, applicant);
        return ResponseEntity.ok(dashboardService.getVolumeByProduct(period, currency, statusFilter, advanced));
    }

    /**
     * Get currency distribution (for donut chart)
     */
    @GetMapping("/currency-distribution")
    public ResponseEntity<List<CurrencyDistributionDTO>> getCurrencyDistribution(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String currency,
            @RequestParam(defaultValue = "OPEN") String statusFilter,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) String beneficiary,
            @RequestParam(required = false) String issuingBank,
            @RequestParam(required = false) String advisingBank,
            @RequestParam(required = false) String applicant
    ) {
        log.debug("Getting currency distribution for period: {}, currency: {}, statusFilter: {}", period, currency, statusFilter);
        LocalDate startDate = calculateStartDate(period);
        LocalDate endDate = LocalDate.now();
        var advanced = buildAdvancedFilters(createdBy, beneficiary, issuingBank, advisingBank, applicant);
        return ResponseEntity.ok(dashboardService.getCurrencyDistribution(startDate, endDate, productType, currency, statusFilter, advanced));
    }

    /**
     * Get monthly trend data (for line chart)
     */
    @GetMapping("/trend")
    public ResponseEntity<List<TrendDataDTO>> getMonthlyTrend(
            @RequestParam(defaultValue = "12") int months,
            @RequestParam(required = false) String currency,
            @RequestParam(defaultValue = "OPEN") String statusFilter,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) String beneficiary,
            @RequestParam(required = false) String issuingBank,
            @RequestParam(required = false) String advisingBank,
            @RequestParam(required = false) String applicant
    ) {
        log.debug("Getting monthly trend for {} months, currency: {}, statusFilter: {}", months, currency, statusFilter);
        var advanced = buildAdvancedFilters(createdBy, beneficiary, issuingBank, advisingBank, applicant);
        return ResponseEntity.ok(dashboardService.getMonthlyTrend(months, currency, statusFilter, advanced));
    }

    /**
     * Get status breakdown (for horizontal bar chart)
     */
    @GetMapping("/status-breakdown")
    public ResponseEntity<List<StatusBreakdownDTO>> getStatusBreakdown(
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String currency,
            @RequestParam(defaultValue = "OPEN") String statusFilter,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) String beneficiary,
            @RequestParam(required = false) String issuingBank,
            @RequestParam(required = false) String advisingBank,
            @RequestParam(required = false) String applicant
    ) {
        log.debug("Getting status breakdown, currency: {}, statusFilter: {}", currency, statusFilter);
        var advanced = buildAdvancedFilters(createdBy, beneficiary, issuingBank, advisingBank, applicant);
        return ResponseEntity.ok(dashboardService.getStatusBreakdown(productType, currency, statusFilter, advanced));
    }

    /**
     * Get top clients (for client analysis table)
     */
    @GetMapping("/top-clients")
    public ResponseEntity<List<TopClientDTO>> getTopClients(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String currency,
            @RequestParam(defaultValue = "OPEN") String statusFilter,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) String beneficiary,
            @RequestParam(required = false) String issuingBank,
            @RequestParam(required = false) String advisingBank,
            @RequestParam(required = false) String applicant
    ) {
        log.debug("Getting top {} clients for period: {}, currency: {}, statusFilter: {}", limit, period, currency, statusFilter);
        LocalDate startDate = calculateStartDate(period);
        LocalDate endDate = LocalDate.now();
        var advanced = buildAdvancedFilters(createdBy, beneficiary, issuingBank, advisingBank, applicant);
        return ResponseEntity.ok(dashboardService.getTopClients(startDate, endDate, limit, productType, currency, statusFilter, advanced));
    }

    /**
     * Get activity heatmap (for GitHub-style calendar)
     */
    @GetMapping("/activity-heatmap")
    public ResponseEntity<List<ActivityHeatmapDTO>> getActivityHeatmap(
            @RequestParam(defaultValue = "90") int days,
            @RequestParam(required = false) String currency,
            @RequestParam(defaultValue = "OPEN") String statusFilter,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) String beneficiary,
            @RequestParam(required = false) String issuingBank,
            @RequestParam(required = false) String advisingBank,
            @RequestParam(required = false) String applicant
    ) {
        log.debug("Getting activity heatmap for {} days, currency: {}, statusFilter: {}", days, currency, statusFilter);
        var advanced = buildAdvancedFilters(createdBy, beneficiary, issuingBank, advisingBank, applicant);
        return ResponseEntity.ok(dashboardService.getActivityHeatmap(days, currency, statusFilter, advanced));
    }

    /**
     * Get upcoming expiries countdown
     */
    @GetMapping("/upcoming-expiries")
    public ResponseEntity<List<ExpiryCountdownDTO>> getUpcomingExpiries(
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String currency,
            @RequestParam(defaultValue = "OPEN") String statusFilter,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) String beneficiary,
            @RequestParam(required = false) String issuingBank,
            @RequestParam(required = false) String advisingBank,
            @RequestParam(required = false) String applicant
    ) {
        log.debug("Getting upcoming expiries, currency: {}, statusFilter: {}", currency, statusFilter);
        var advanced = buildAdvancedFilters(createdBy, beneficiary, issuingBank, advisingBank, applicant);
        return ResponseEntity.ok(dashboardService.getUpcomingExpiries(productType, currency, statusFilter, advanced));
    }

    /**
     * Get product comparison
     */
    @GetMapping("/product-comparison")
    public ResponseEntity<List<ProductComparisonDTO>> getProductComparison(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) String currency,
            @RequestParam(defaultValue = "OPEN") String statusFilter,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) String beneficiary,
            @RequestParam(required = false) String issuingBank,
            @RequestParam(required = false) String advisingBank,
            @RequestParam(required = false) String applicant
    ) {
        log.debug("Getting product comparison for period: {}, currency: {}, statusFilter: {}", period, currency, statusFilter);
        LocalDate startDate = calculateStartDate(period);
        LocalDate endDate = LocalDate.now();
        var advanced = buildAdvancedFilters(createdBy, beneficiary, issuingBank, advisingBank, applicant);
        return ResponseEntity.ok(dashboardService.getProductComparison(startDate, endDate, currency, statusFilter, advanced));
    }

    /**
     * Get available filter options - currencies, product types, and advanced filter values from registered operations
     */
    @GetMapping("/filters")
    public ResponseEntity<Map<String, Object>> getFilterOptions() {
        // Get currencies from registered operations
        List<String> currencies = dashboardService.getDistinctCurrencies();

        // Get product types from registered operations with labels
        List<String> productTypes = dashboardService.getDistinctProductTypes();
        Map<String, String> productLabels = Map.of(
                "LC_IMPORT", "LC Import",
                "LC_EXPORT", "LC Export",
                "GUARANTEE", "Garantías",
                "STANDBY_LC", "Standby LC",
                "COLLECTION", "Cobranzas"
        );

        List<Map<String, String>> productTypeOptions = productTypes.stream()
                .map(pt -> Map.of("value", pt, "label", productLabels.getOrDefault(pt, pt)))
                .toList();

        // Advanced filter options
        List<String> createdByOptions = dashboardService.getDistinctCreatedBy();
        List<String> beneficiaryOptions = dashboardService.getDistinctBeneficiaries();
        List<String> issuingBankOptions = dashboardService.getDistinctIssuingBanks();
        List<String> advisingBankOptions = dashboardService.getDistinctAdvisingBanks();
        List<String> applicantOptions = dashboardService.getDistinctApplicants();

        Map<String, Object> filters = new HashMap<>();
        filters.put("periods", List.of(
                Map.of("value", "today", "label", "Hoy"),
                Map.of("value", "week", "label", "Última Semana"),
                Map.of("value", "month", "label", "Último Mes"),
                Map.of("value", "quarter", "label", "Último Trimestre"),
                Map.of("value", "semester", "label", "Último Semestre"),
                Map.of("value", "year", "label", "Último Año"),
                Map.of("value", "more_than_year", "label", "Mayor a 1 Año"),
                Map.of("value", "all", "label", "Todo")
        ));
        filters.put("productTypes", productTypeOptions);
        filters.put("currencies", currencies);
        filters.put("statusFilters", List.of(
                Map.of("value", "OPEN", "label", "Solo Abiertas"),
                Map.of("value", "CLOSED", "label", "Solo Cerradas"),
                Map.of("value", "ALL", "label", "Todas")
        ));
        filters.put("createdByOptions", createdByOptions);
        filters.put("beneficiaryOptions", beneficiaryOptions);
        filters.put("issuingBankOptions", issuingBankOptions);
        filters.put("advisingBankOptions", advisingBankOptions);
        filters.put("applicantOptions", applicantOptions);

        // Custom field configs for extended filters — all showInList=true fields
        List<CustomFieldConfig> listFields = customFieldConfigRepository.findAllListFields();
        filters.put("customFieldConfigs", listFields.stream()
                .map(f -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("fieldCode", f.getFieldCode());
                    m.put("fieldNameKey", f.getFieldNameKey());
                    m.put("componentType", f.getComponentType());
                    m.put("fieldOptions", f.getFieldOptions() != null ? f.getFieldOptions() : "[]");
                    if (f.getDataSourceCode() != null) {
                        m.put("dataSourceCode", f.getDataSourceCode());
                    }
                    var step = f.getSection() != null ? f.getSection().getStep() : null;
                    m.put("stepNameKey", step != null ? step.getStepNameKey() : "customFields.steps.OTHER.name");
                    m.put("productType", step != null ? step.getProductType() : "ALL");
                    return m;
                }).toList());

        return ResponseEntity.ok(filters);
    }

    private AdvancedFilters buildAdvancedFilters(String createdBy, String beneficiary, String issuingBank, String advisingBank, String applicant) {
        return AdvancedFilters.builder()
                .createdBy(createdBy).beneficiary(beneficiary)
                .issuingBank(issuingBank).advisingBank(advisingBank)
                .applicant(applicant).build();
    }

    private LocalDate calculateStartDate(String period) {
        return switch (period) {
            case "today" -> LocalDate.now();
            case "week" -> LocalDate.now().minusWeeks(1);
            case "month" -> LocalDate.now().minusMonths(1);
            case "quarter" -> LocalDate.now().minusMonths(3);
            case "semester" -> LocalDate.now().minusMonths(6);
            case "year" -> LocalDate.now().minusYears(1);
            case "more_than_year" -> LocalDate.now().minusYears(10); // Fecha antigua para incluir todo lo histórico
            case "all" -> LocalDate.of(2000, 1, 1); // Incluir todo el histórico
            default -> LocalDate.now().minusMonths(1);
        };
    }
}
