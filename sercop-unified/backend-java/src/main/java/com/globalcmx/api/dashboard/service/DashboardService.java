package com.globalcmx.api.dashboard.service;

import com.globalcmx.api.dashboard.dto.*;
import com.globalcmx.api.readmodel.repository.GleReadModelRepository;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Dashboard Service
 * Provides real-time analytics and KPIs for the Business Intelligence Dashboard
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true, transactionManager = "readModelTransactionManager")
public class DashboardService {

    @PersistenceContext(unitName = "readModel")
    private EntityManager entityManager;

    private final OperationReadModelRepository operationRepository;
    private final GleReadModelRepository gleRepository;

    private static final Map<String, String> CURRENCY_COLORS = Map.of(
            "USD", "#3B82F6",
            "EUR", "#10B981",
            "MXN", "#F59E0B",
            "GBP", "#8B5CF6",
            "JPY", "#EC4899",
            "CHF", "#06B6D4",
            "CAD", "#EF4444"
    );

    private static final Map<String, String> STATUS_COLORS = Map.of(
            "ACTIVE", "#10B981",
            "PENDING_RESPONSE", "#F59E0B",
            "PENDING_DOCUMENTS", "#FBBF24",
            "ON_HOLD", "#6B7280",
            "COMPLETED", "#3B82F6",
            "CANCELLED", "#EF4444"
    );

    private static final Map<String, String> PRODUCT_COLORS = Map.of(
            "LC_IMPORT", "#3B82F6",
            "LC_EXPORT", "#10B981",
            "GUARANTEE", "#8B5CF6",
            "STANDBY_LC", "#F59E0B",
            "COLLECTION", "#EC4899"
    );

    /**
     * Get complete dashboard summary
     * @param statusFilter OPEN (exclude closed), CLOSED (only closed), ALL (no filter)
     */
    public DashboardSummaryDTO getDashboardSummary(String period, String productType, String currency, Integer topClientsLimit, String statusFilter, AdvancedFilters advanced) {
        LocalDate startDate = calculateStartDate(period);
        LocalDate endDate = calculateEndDate(period);
        int clientsLimit = topClientsLimit != null ? topClientsLimit : 10;
        String normalizedStatusFilter = normalizeStatusFilter(statusFilter);
        if (advanced == null) advanced = AdvancedFilters.empty();

        return DashboardSummaryDTO.builder()
                .volumeByC(getVolumeKPIsByCurrency(startDate, endDate, productType, currency, normalizedStatusFilter, advanced))
                .operationsByC(getOperationsByCurrency(startDate, endDate, productType, currency, normalizedStatusFilter, advanced))
                .clientsByC(getClientsByCurrency(startDate, endDate, productType, currency, normalizedStatusFilter, advanced))
                .operationsToday(getOperationsTodayKPI(productType, currency, normalizedStatusFilter, advanced))
                .pendingApprovals(getPendingApprovalsKPI(productType, advanced))
                .operationsWithAlerts(getOperationsWithAlertsKPI(productType, currency, normalizedStatusFilter, advanced))
                .volumeByProduct(getVolumeByProduct(period, currency, normalizedStatusFilter, advanced))
                .currencyDistribution(getCurrencyDistribution(startDate, endDate, productType, currency, normalizedStatusFilter, advanced))
                .monthlyTrend(getMonthlyTrend(12, currency, normalizedStatusFilter, advanced))
                .statusBreakdown(getStatusBreakdown(productType, currency, normalizedStatusFilter, advanced))
                .topClients(getTopClients(startDate, endDate, clientsLimit, productType, currency, normalizedStatusFilter, advanced))
                .activityHeatmap(getActivityHeatmap(90, currency, normalizedStatusFilter, advanced))
                .upcomingExpiries(getUpcomingExpiries(productType, currency, normalizedStatusFilter, advanced))
                .productComparison(getProductComparison(startDate, endDate, currency, normalizedStatusFilter, advanced))
                .userActivity(getUserActivity(startDate, endDate, productType, currency, normalizedStatusFilter, advanced))
                .lastUpdated(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .periodLabel(getPeriodLabel(period))
                .build();
    }

    /**
     * Normalize status filter and return SQL condition
     */
    private String normalizeStatusFilter(String statusFilter) {
        if (statusFilter == null) return "OPEN";
        return switch (statusFilter.toUpperCase()) {
            case "CLOSED" -> "CLOSED";
            case "ALL" -> "ALL";
            default -> "OPEN";
        };
    }

    /**
     * Build SQL status condition based on filter
     */
    private String buildStatusCondition(String statusFilter) {
        return switch (statusFilter) {
            case "CLOSED" -> " AND status = 'CLOSED'";
            case "ALL" -> "";
            default -> " AND status != 'CLOSED'"; // OPEN
        };
    }

    // ==================== KPI CARDS ====================

    private List<KPICardDTO> getVolumeKPIsByCurrency(LocalDate startDate, LocalDate endDate, String productType, String currency, String statusFilter, AdvancedFilters advanced) {
        String statusCondition = buildStatusCondition(statusFilter);
        List<KPICardDTO> volumeKPIs = new ArrayList<>();

        // If a specific currency is selected, only show that one
        if (currency != null) {
            volumeKPIs.add(buildVolumeKPIForCurrency(startDate, endDate, productType, currency, statusCondition, advanced));
            return volumeKPIs;
        }

        // Get all currencies with data in the period
        String currencySql = """
            SELECT DISTINCT currency
            FROM operation_readmodel
            WHERE created_at >= :startDate AND created_at <= :endDate
            AND currency IS NOT NULL
            """ + statusCondition +
            (productType != null ? " AND product_type = :productType" : "") +
            advanced.toSqlConditions() + """
            ORDER BY currency
            """;

        Query currencyQuery = entityManager.createNativeQuery(currencySql);
        currencyQuery.setParameter("startDate", startDate.atStartOfDay());
        currencyQuery.setParameter("endDate", endDate.plusDays(1).atStartOfDay());
        if (productType != null) currencyQuery.setParameter("productType", productType);
        advanced.applyToQuery(currencyQuery);

        @SuppressWarnings("unchecked")
        List<String> currencies = currencyQuery.getResultList();

        // Build a KPI for each currency
        for (String curr : currencies) {
            volumeKPIs.add(buildVolumeKPIForCurrency(startDate, endDate, productType, curr, statusCondition, advanced));
        }

        return volumeKPIs;
    }

    private KPICardDTO buildVolumeKPIForCurrency(LocalDate startDate, LocalDate endDate, String productType, String currency, String statusCondition, AdvancedFilters advanced) {
        String sql = """
            SELECT COALESCE(SUM(amount), 0) as current_volume
            FROM operation_readmodel
            WHERE created_at >= :startDate AND created_at <= :endDate
            AND currency = :currency
            """ + statusCondition +
            (productType != null ? " AND product_type = :productType" : "") +
            advanced.toSqlConditions();

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", startDate.atStartOfDay());
        query.setParameter("endDate", endDate.plusDays(1).atStartOfDay());
        query.setParameter("currency", currency);
        if (productType != null) query.setParameter("productType", productType);
        advanced.applyToQuery(query);

        BigDecimal currentVolume = toBigDecimal(query.getSingleResult());

        // Previous period for comparison
        long daysDiff = ChronoUnit.DAYS.between(startDate, endDate);
        LocalDate prevStart = startDate.minusDays(daysDiff + 1);
        LocalDate prevEnd = startDate.minusDays(1);

        query.setParameter("startDate", prevStart.atStartOfDay());
        query.setParameter("endDate", prevEnd.plusDays(1).atStartOfDay());
        BigDecimal previousVolume = toBigDecimal(query.getSingleResult());

        // Build descriptive change label based on data availability
        String changeLabel;
        BigDecimal changePercent;
        KPICardDTO.TrendDirection trend;

        if (previousVolume == null || previousVolume.compareTo(BigDecimal.ZERO) == 0) {
            changePercent = BigDecimal.ZERO;
            changeLabel = "sin datos previos";
            trend = KPICardDTO.TrendDirection.STABLE;
        } else {
            changePercent = calculateChangePercent(currentVolume, previousVolume);
            changeLabel = buildPeriodComparisonLabel(daysDiff);
            trend = changePercent.compareTo(BigDecimal.ZERO) > 0 ? KPICardDTO.TrendDirection.UP :
                    changePercent.compareTo(BigDecimal.ZERO) < 0 ? KPICardDTO.TrendDirection.DOWN :
                    KPICardDTO.TrendDirection.STABLE;
        }

        return KPICardDTO.builder()
                .label("Volumen " + currency)
                .value(currentVolume.toString())
                .formattedValue(formatCurrency(currentVolume, currency))
                .numericValue(currentVolume)
                .currency(currency)
                .changePercent(changePercent)
                .changeLabel(changeLabel)
                .trend(trend)
                .icon("dollar")
                .color(getCurrencyColor(currency))
                .build();
    }

    private String getCurrencyColor(String currency) {
        // Generate consistent color based on currency code hash
        String[] colors = {"#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#EC4899", "#14B8A6", "#F97316"};
        int index = Math.abs(currency.hashCode()) % colors.length;
        return colors[index];
    }

    // ==================== OPERATIONS BY CURRENCY ====================

    private List<KPICardDTO> getOperationsByCurrency(LocalDate startDate, LocalDate endDate, String productType, String currency, String statusFilter, AdvancedFilters advanced) {
        String statusCondition = buildStatusCondition(statusFilter);
        List<KPICardDTO> operationsKPIs = new ArrayList<>();

        // If a specific currency is selected, only show that one
        if (currency != null) {
            operationsKPIs.add(buildOperationsKPIForCurrency(startDate, endDate, productType, currency, statusCondition, advanced));
            return operationsKPIs;
        }

        // Get all currencies with data in the period
        String currencySql = """
            SELECT DISTINCT currency
            FROM operation_readmodel
            WHERE created_at >= :startDate AND created_at <= :endDate
            AND currency IS NOT NULL
            """ + statusCondition +
            (productType != null ? " AND product_type = :productType" : "") +
            advanced.toSqlConditions() + """
            ORDER BY currency
            """;

        Query currencyQuery = entityManager.createNativeQuery(currencySql);
        currencyQuery.setParameter("startDate", startDate.atStartOfDay());
        currencyQuery.setParameter("endDate", endDate.plusDays(1).atStartOfDay());
        if (productType != null) currencyQuery.setParameter("productType", productType);
        advanced.applyToQuery(currencyQuery);

        @SuppressWarnings("unchecked")
        List<String> currencies = currencyQuery.getResultList();

        // Build a KPI for each currency
        for (String curr : currencies) {
            operationsKPIs.add(buildOperationsKPIForCurrency(startDate, endDate, productType, curr, statusCondition, advanced));
        }

        return operationsKPIs;
    }

    private KPICardDTO buildOperationsKPIForCurrency(LocalDate startDate, LocalDate endDate, String productType, String currency, String statusCondition, AdvancedFilters advanced) {
        String sql = """
            SELECT COUNT(*) as total
            FROM operation_readmodel
            WHERE created_at >= :startDate AND created_at <= :endDate
            AND currency = :currency
            """ + statusCondition +
            (productType != null ? " AND product_type = :productType" : "") +
            advanced.toSqlConditions();

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", startDate.atStartOfDay());
        query.setParameter("endDate", endDate.plusDays(1).atStartOfDay());
        query.setParameter("currency", currency);
        if (productType != null) query.setParameter("productType", productType);
        advanced.applyToQuery(query);

        Long currentCount = toLong(query.getSingleResult());

        // Previous period for comparison
        long daysDiff = ChronoUnit.DAYS.between(startDate, endDate);
        LocalDate prevStart = startDate.minusDays(daysDiff + 1);
        LocalDate prevEnd = startDate.minusDays(1);

        query.setParameter("startDate", prevStart.atStartOfDay());
        query.setParameter("endDate", prevEnd.plusDays(1).atStartOfDay());
        Long previousCount = toLong(query.getSingleResult());

        // Build descriptive change label based on data availability
        String changeLabel;
        BigDecimal changePercent;
        KPICardDTO.TrendDirection trend;

        if (previousCount == null || previousCount == 0) {
            changePercent = BigDecimal.ZERO;
            changeLabel = "sin datos previos";
            trend = KPICardDTO.TrendDirection.STABLE;
        } else {
            changePercent = calculateChangePercent(BigDecimal.valueOf(currentCount), BigDecimal.valueOf(previousCount));
            changeLabel = buildPeriodComparisonLabel(daysDiff);
            trend = changePercent.compareTo(BigDecimal.ZERO) > 0 ? KPICardDTO.TrendDirection.UP :
                    changePercent.compareTo(BigDecimal.ZERO) < 0 ? KPICardDTO.TrendDirection.DOWN :
                    KPICardDTO.TrendDirection.STABLE;
        }

        return KPICardDTO.builder()
                .label(currency)
                .value(currentCount.toString())
                .formattedValue(formatNumber(currentCount))
                .numericValue(BigDecimal.valueOf(currentCount))
                .currency(currency)
                .changePercent(changePercent)
                .changeLabel(changeLabel)
                .trend(trend)
                .icon("activity")
                .color(getCurrencyColor(currency))
                .build();
    }

    // ==================== CLIENTS BY CURRENCY ====================

    private List<KPICardDTO> getClientsByCurrency(LocalDate startDate, LocalDate endDate, String productType, String currency, String statusFilter, AdvancedFilters advanced) {
        String statusCondition = buildStatusCondition(statusFilter);
        List<KPICardDTO> clientsKPIs = new ArrayList<>();

        // If a specific currency is selected, only show that one
        if (currency != null) {
            clientsKPIs.add(buildClientsKPIForCurrency(startDate, endDate, productType, currency, statusCondition, advanced));
            return clientsKPIs;
        }

        // Get all currencies with data in the period
        String currencySql = """
            SELECT DISTINCT currency
            FROM operation_readmodel
            WHERE created_at >= :startDate AND created_at <= :endDate
            AND currency IS NOT NULL
            """ + statusCondition +
            (productType != null ? " AND product_type = :productType" : "") +
            advanced.toSqlConditions() + """
            ORDER BY currency
            """;

        Query currencyQuery = entityManager.createNativeQuery(currencySql);
        currencyQuery.setParameter("startDate", startDate.atStartOfDay());
        currencyQuery.setParameter("endDate", endDate.plusDays(1).atStartOfDay());
        if (productType != null) currencyQuery.setParameter("productType", productType);
        advanced.applyToQuery(currencyQuery);

        @SuppressWarnings("unchecked")
        List<String> currencies = currencyQuery.getResultList();

        // Build a KPI for each currency
        for (String curr : currencies) {
            clientsKPIs.add(buildClientsKPIForCurrency(startDate, endDate, productType, curr, statusCondition, advanced));
        }

        return clientsKPIs;
    }

    private KPICardDTO buildClientsKPIForCurrency(LocalDate startDate, LocalDate endDate, String productType, String currency, String statusCondition, AdvancedFilters advanced) {
        String sql = """
            SELECT COUNT(DISTINCT applicant_name) as clients
            FROM operation_readmodel
            WHERE created_at >= :startDate AND created_at <= :endDate
            AND currency = :currency
            AND applicant_name IS NOT NULL AND applicant_name != ''
            """ + statusCondition +
            (productType != null ? " AND product_type = :productType" : "") +
            advanced.toSqlConditions();

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", startDate.atStartOfDay());
        query.setParameter("endDate", endDate.plusDays(1).atStartOfDay());
        query.setParameter("currency", currency);
        if (productType != null) query.setParameter("productType", productType);
        advanced.applyToQuery(query);

        Long currentClients = toLong(query.getSingleResult());

        // Previous period for comparison
        long daysDiff = ChronoUnit.DAYS.between(startDate, endDate);
        LocalDate prevStart = startDate.minusDays(daysDiff + 1);
        LocalDate prevEnd = startDate.minusDays(1);

        query.setParameter("startDate", prevStart.atStartOfDay());
        query.setParameter("endDate", prevEnd.plusDays(1).atStartOfDay());
        Long previousClients = toLong(query.getSingleResult());

        // Build descriptive change label based on data availability
        String changeLabel;
        BigDecimal changePercent;
        KPICardDTO.TrendDirection trend;

        if (previousClients == null || previousClients == 0) {
            changePercent = BigDecimal.ZERO;
            changeLabel = "sin datos previos";
            trend = KPICardDTO.TrendDirection.STABLE;
        } else {
            changePercent = calculateChangePercent(BigDecimal.valueOf(currentClients), BigDecimal.valueOf(previousClients));
            changeLabel = buildPeriodComparisonLabel(daysDiff);
            trend = changePercent.compareTo(BigDecimal.ZERO) > 0 ? KPICardDTO.TrendDirection.UP :
                    changePercent.compareTo(BigDecimal.ZERO) < 0 ? KPICardDTO.TrendDirection.DOWN :
                    KPICardDTO.TrendDirection.STABLE;
        }

        return KPICardDTO.builder()
                .label(currency)
                .value(currentClients.toString())
                .formattedValue(formatNumber(currentClients))
                .numericValue(BigDecimal.valueOf(currentClients))
                .currency(currency)
                .changePercent(changePercent)
                .changeLabel(changeLabel)
                .trend(trend)
                .icon("users")
                .color(getCurrencyColor(currency))
                .build();
    }

    private KPICardDTO getOperationsTodayKPI(String productType, String currency, String statusFilter, AdvancedFilters advanced) {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        String statusCondition = buildStatusCondition(statusFilter);

        String sql = """
            SELECT COUNT(*) as total
            FROM operation_readmodel
            WHERE DATE(created_at) = :targetDate
            """ + statusCondition +
            (productType != null ? " AND product_type = :productType" : "") +
            (currency != null ? " AND currency = :currency" : "") +
            advanced.toSqlConditions();

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("targetDate", today);
        if (productType != null) query.setParameter("productType", productType);
        if (currency != null) query.setParameter("currency", currency);
        advanced.applyToQuery(query);

        Long todayCount = toLong(query.getSingleResult());

        query.setParameter("targetDate", yesterday);
        Long yesterdayCount = toLong(query.getSingleResult());

        BigDecimal changePercent = calculateChangePercent(BigDecimal.valueOf(todayCount), BigDecimal.valueOf(yesterdayCount));

        return KPICardDTO.builder()
                .label("Operaciones Hoy")
                .value(todayCount.toString())
                .formattedValue(formatNumber(todayCount))
                .numericValue(BigDecimal.valueOf(todayCount))
                .changePercent(changePercent)
                .changeLabel("vs ayer")
                .trend(changePercent.compareTo(BigDecimal.ZERO) > 0 ? KPICardDTO.TrendDirection.UP :
                       changePercent.compareTo(BigDecimal.ZERO) < 0 ? KPICardDTO.TrendDirection.DOWN :
                       KPICardDTO.TrendDirection.STABLE)
                .icon("zap")
                .color("#F59E0B")
                .build();
    }

    private KPICardDTO getPendingApprovalsKPI(String productType, AdvancedFilters advanced) {
        if (advanced == null) advanced = AdvancedFilters.empty();

        String sql;
        if (advanced.hasAny()) {
            // JOIN with operation_readmodel to apply advanced filters (beneficiary, issuingBank, etc.)
            sql = """
                SELECT COUNT(*) as total
                FROM pending_event_approval_readmodel p
                JOIN operation_readmodel o ON p.operation_id = o.operation_id
                WHERE p.status = 'PENDING'
                """ + (productType != null ? " AND p.product_type = :productType" : "") +
                advanced.toSqlConditions("o");
        } else {
            sql = """
                SELECT COUNT(*) as total
                FROM pending_event_approval_readmodel
                WHERE status = 'PENDING'
                """ + (productType != null ? " AND product_type = :productType" : "");
        }

        Query query = entityManager.createNativeQuery(sql);
        if (productType != null) query.setParameter("productType", productType);
        advanced.applyToQuery(query);

        Long pendingCount = toLong(query.getSingleResult());

        return KPICardDTO.builder()
                .label("Pendientes")
                .value(pendingCount.toString())
                .formattedValue(formatNumber(pendingCount))
                .numericValue(BigDecimal.valueOf(pendingCount))
                .changePercent(BigDecimal.ZERO)
                .changeLabel("requieren atención")
                .trend(pendingCount > 0 ? KPICardDTO.TrendDirection.UP : KPICardDTO.TrendDirection.STABLE)
                .icon("clock")
                .color("#EF4444")
                .build();
    }

    private KPICardDTO getOperationsWithAlertsKPI(String productType, String currency, String statusFilter, AdvancedFilters advanced) {
        String statusCondition = buildStatusCondition(statusFilter);
        String sql = """
            SELECT COUNT(*) as total
            FROM operation_readmodel
            WHERE has_alerts = true
            """ + statusCondition +
            (productType != null ? " AND product_type = :productType" : "") +
            (currency != null ? " AND currency = :currency" : "") +
            advanced.toSqlConditions();

        Query query = entityManager.createNativeQuery(sql);
        if (productType != null) query.setParameter("productType", productType);
        if (currency != null) query.setParameter("currency", currency);
        advanced.applyToQuery(query);

        Long alertCount = toLong(query.getSingleResult());

        return KPICardDTO.builder()
                .label("Con Alertas")
                .value(alertCount.toString())
                .formattedValue(formatNumber(alertCount))
                .numericValue(BigDecimal.valueOf(alertCount))
                .changePercent(BigDecimal.ZERO)
                .changeLabel("requieren revisión")
                .trend(alertCount > 0 ? KPICardDTO.TrendDirection.UP : KPICardDTO.TrendDirection.STABLE)
                .icon("alert-triangle")
                .color("#F97316")
                .build();
    }

    // ==================== CHART DATA ====================

    public List<VolumeByProductDTO> getVolumeByProduct(String period, String currency, String statusFilter, AdvancedFilters advanced) {
        LocalDate startDate = calculateStartDate(period);
        LocalDate endDate = calculateEndDate(period);
        String statusCondition = buildStatusCondition(statusFilter);
        if (advanced == null) advanced = AdvancedFilters.empty();

        // Query dinámica que agrupa por product_type real de la base de datos
        String dynamicSql = """
            SELECT
                DATE_FORMAT(created_at, '%Y-%m') as period,
                DATE_FORMAT(created_at, '%b %Y') as period_label,
                product_type,
                SUM(amount) as total_amount,
                COUNT(*) as operation_count
            FROM operation_readmodel
            WHERE created_at >= :startDate AND created_at <= :endDate
            AND product_type IS NOT NULL
            """ + statusCondition +
            (currency != null ? " AND currency = :currency " : "") +
            advanced.toSqlConditions() + """
            GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y'), product_type
            ORDER BY period ASC, product_type ASC
            """;

        Query dynamicQuery = entityManager.createNativeQuery(dynamicSql);
        dynamicQuery.setParameter("startDate", startDate.atStartOfDay());
        dynamicQuery.setParameter("endDate", endDate.plusDays(1).atStartOfDay());
        if (currency != null) dynamicQuery.setParameter("currency", currency);
        advanced.applyToQuery(dynamicQuery);

        @SuppressWarnings("unchecked")
        List<Object[]> dynamicResults = dynamicQuery.getResultList();

        // Agrupar resultados por período
        Map<String, VolumeByProductDTO> periodMap = new LinkedHashMap<>();

        for (Object[] row : dynamicResults) {
            String periodKey = (String) row[0];
            String periodLabel = (String) row[1];
            String productType = (String) row[2];
            BigDecimal amount = toBigDecimal(row[3]);
            Integer count = toInt(row[4]);

            VolumeByProductDTO dto = periodMap.computeIfAbsent(periodKey, k ->
                VolumeByProductDTO.builder()
                    .period(periodKey)
                    .periodLabel(periodLabel)
                    .lcImport(BigDecimal.ZERO)
                    .lcExport(BigDecimal.ZERO)
                    .guarantee(BigDecimal.ZERO)
                    .collection(BigDecimal.ZERO)
                    .total(BigDecimal.ZERO)
                    .lcImportCount(0)
                    .lcExportCount(0)
                    .guaranteeCount(0)
                    .collectionCount(0)
                    .productVolumes(new HashMap<>())
                    .productCounts(new HashMap<>())
                    .build()
            );

            // Agregar al mapa dinámico
            dto.getProductVolumes().put(productType, amount);
            dto.getProductCounts().put(productType, count);

            // Actualizar total
            dto.setTotal(dto.getTotal().add(amount));

            // Mantener compatibilidad con campos legacy
            switch (productType) {
                case "LC_IMPORT" -> {
                    dto.setLcImport(dto.getLcImport().add(amount));
                    dto.setLcImportCount(dto.getLcImportCount() + count);
                }
                case "LC_EXPORT" -> {
                    dto.setLcExport(dto.getLcExport().add(amount));
                    dto.setLcExportCount(dto.getLcExportCount() + count);
                }
                case "GUARANTEE", "GUARANTEE_ISSUED", "GUARANTEE_RECEIVED", "AVAL", "STANDBY_LC" -> {
                    dto.setGuarantee(dto.getGuarantee().add(amount));
                    dto.setGuaranteeCount(dto.getGuaranteeCount() + count);
                }
                case "COLLECTION", "COLLECTION_IMPORT", "COLLECTION_EXPORT" -> {
                    dto.setCollection(dto.getCollection().add(amount));
                    dto.setCollectionCount(dto.getCollectionCount() + count);
                }
            }
        }

        return new ArrayList<>(periodMap.values());
    }

    public List<CurrencyDistributionDTO> getCurrencyDistribution(LocalDate startDate, LocalDate endDate, String productType, String currency, String statusFilter, AdvancedFilters advanced) {
        String statusCondition = buildStatusCondition(statusFilter);
        if (advanced == null) advanced = AdvancedFilters.empty();
        // Note: Currency distribution should always show ALL currencies, not filtered by selected currency
        // This allows users to see the full distribution even when filtering other views by currency
        String sql = """
            SELECT
                currency,
                SUM(amount) as total_amount,
                COUNT(*) as operation_count
            FROM operation_readmodel
            WHERE created_at >= :startDate AND created_at <= :endDate
            AND currency IS NOT NULL
            """ + statusCondition +
            (productType != null ? " AND product_type = :productType " : "") +
            advanced.toSqlConditions() + """
            GROUP BY currency
            ORDER BY total_amount DESC
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", startDate.atStartOfDay());
        query.setParameter("endDate", endDate.plusDays(1).atStartOfDay());
        if (productType != null) query.setParameter("productType", productType);
        advanced.applyToQuery(query);

        @SuppressWarnings("unchecked")
        List<Object[]> results = query.getResultList();

        BigDecimal totalVolume = results.stream()
                .map(row -> toBigDecimal(row[1]))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return results.stream().map(row -> {
            String curr = (String) row[0];
            BigDecimal amount = toBigDecimal(row[1]);
            BigDecimal percentage = totalVolume.compareTo(BigDecimal.ZERO) > 0
                    ? amount.multiply(BigDecimal.valueOf(100)).divide(totalVolume, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            return CurrencyDistributionDTO.builder()
                    .currency(curr)
                    .amount(amount)
                    .percentage(percentage)
                    .operationCount(toInt(row[2]))
                    .color(CURRENCY_COLORS.getOrDefault(curr, "#6B7280"))
                    .build();
        }).collect(Collectors.toList());
    }

    public List<TrendDataDTO> getMonthlyTrend(int months, String currency, String statusFilter, AdvancedFilters advanced) {
        String statusCondition = buildStatusCondition(statusFilter);
        if (advanced == null) advanced = AdvancedFilters.empty();
        String sql = """
            SELECT
                DATE_FORMAT(created_at, '%Y-%m') as month,
                DATE_FORMAT(created_at, '%b') as month_label,
                YEAR(created_at) as year,
                COALESCE(SUM(amount), 0) as volume,
                COUNT(*) as operation_count,
                COUNT(DISTINCT applicant_name) as unique_clients,
                COALESCE(AVG(amount), 0) as avg_size
            FROM operation_readmodel
            WHERE created_at >= :startDate
            """ + statusCondition +
            (currency != null ? " AND currency = :currency " : "") +
            advanced.toSqlConditions() + """
            GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b'), YEAR(created_at)
            ORDER BY month ASC
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", LocalDate.now().minusMonths(months).atStartOfDay());
        if (currency != null) query.setParameter("currency", currency);
        advanced.applyToQuery(query);

        @SuppressWarnings("unchecked")
        List<Object[]> results = query.getResultList();

        return results.stream().map(row -> TrendDataDTO.builder()
                .month((String) row[0])
                .monthLabel((String) row[1])
                .year(toInt(row[2]))
                .volume(toBigDecimal(row[3]))
                .operationCount(toInt(row[4]))
                .newClients(toInt(row[5]))
                .avgOperationSize(toBigDecimal(row[6]))
                .build()
        ).collect(Collectors.toList());
    }

    public List<StatusBreakdownDTO> getStatusBreakdown(String productType, String currency, String statusFilter, AdvancedFilters advanced) {
        String statusCondition = buildStatusCondition(statusFilter);
        if (advanced == null) advanced = AdvancedFilters.empty();
        String sql = """
            SELECT
                status,
                COUNT(*) as count,
                COALESCE(SUM(amount), 0) as volume
            FROM operation_readmodel
            WHERE 1=1
            """ + statusCondition +
            (productType != null ? " AND product_type = :productType " : "") +
            (currency != null ? " AND currency = :currency " : "") +
            advanced.toSqlConditions() + """
            GROUP BY status
            ORDER BY count DESC
            """;

        Query query = entityManager.createNativeQuery(sql);
        if (productType != null) query.setParameter("productType", productType);
        if (currency != null) query.setParameter("currency", currency);
        advanced.applyToQuery(query);

        @SuppressWarnings("unchecked")
        List<Object[]> results = query.getResultList();

        long totalCount = results.stream().mapToLong(row -> toLong(row[1])).sum();

        Map<String, String> statusLabels = Map.of(
                "ACTIVE", "Activas",
                "PENDING_RESPONSE", "Pendiente Respuesta",
                "PENDING_DOCUMENTS", "Pendiente Documentos",
                "ON_HOLD", "En Espera",
                "COMPLETED", "Completadas",
                "CANCELLED", "Canceladas"
        );

        return results.stream().map(row -> {
            String status = (String) row[0];
            Integer count = toInt(row[1]);
            BigDecimal percentage = totalCount > 0
                    ? BigDecimal.valueOf(count * 100.0 / totalCount).setScale(1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            return StatusBreakdownDTO.builder()
                    .status(status)
                    .statusLabel(statusLabels.getOrDefault(status, status))
                    .count(count)
                    .percentage(percentage)
                    .volume(toBigDecimal(row[2]))
                    .color(STATUS_COLORS.getOrDefault(status, "#6B7280"))
                    .build();
        }).collect(Collectors.toList());
    }

    public List<TopClientDTO> getTopClients(LocalDate startDate, LocalDate endDate, int limit, String productType, String currency, String statusFilter, AdvancedFilters advanced) {
        String statusCondition = buildStatusCondition(statusFilter);
        if (advanced == null) advanced = AdvancedFilters.empty();
        String sql = """
            SELECT
                COALESCE(MAX(applicant_id), 0) as applicant_id,
                applicant_name,
                SUM(amount) as total_volume,
                COUNT(*) as operation_count,
                MAX(currency) as primary_currency,
                MAX(product_type) as preferred_product,
                MAX(created_at) as last_activity
            FROM operation_readmodel
            WHERE created_at >= :startDate AND created_at <= :endDate
            AND applicant_name IS NOT NULL AND TRIM(applicant_name) != ''
            """ + statusCondition +
            (productType != null ? " AND product_type = :productType " : "") +
            (currency != null ? " AND currency = :currency " : "") +
            advanced.toSqlConditions() + """
            GROUP BY applicant_name
            ORDER BY total_volume DESC
            LIMIT :limit
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", startDate.atStartOfDay());
        query.setParameter("endDate", endDate.plusDays(1).atStartOfDay());
        query.setParameter("limit", limit);
        if (productType != null) query.setParameter("productType", productType);
        if (currency != null) query.setParameter("currency", currency);
        advanced.applyToQuery(query);

        @SuppressWarnings("unchecked")
        List<Object[]> results = query.getResultList();

        // Get max volume for activity score calculation
        BigDecimal maxVolume = results.stream()
                .map(row -> toBigDecimal(row[2]))
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ONE);

        return results.stream().map(row -> {
            BigDecimal volume = toBigDecimal(row[2]);
            BigDecimal activityScore = maxVolume.compareTo(BigDecimal.ZERO) > 0
                    ? volume.multiply(BigDecimal.valueOf(100)).divide(maxVolume, 0, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            Object lastActivityRaw = row[6];
            String lastActivity = lastActivityRaw != null
                    ? (lastActivityRaw instanceof java.sql.Timestamp
                        ? ((java.sql.Timestamp) lastActivityRaw).toLocalDateTime().format(DateTimeFormatter.ISO_DATE)
                        : lastActivityRaw.toString())
                    : null;

            return TopClientDTO.builder()
                    .clientId(toLong(row[0]))
                    .clientName((String) row[1])
                    .clientType("APPLICANT")
                    .totalVolume(volume)
                    .primaryCurrency((String) row[4])
                    .operationCount(toInt(row[3]))
                    .preferredProduct((String) row[5])
                    .trend(TopClientDTO.TrendDirection.STABLE)
                    .activityScore(activityScore)
                    .changePercent(BigDecimal.ZERO)
                    .lastActivityDate(lastActivity)
                    .build();
        }).collect(Collectors.toList());
    }

    public List<ActivityHeatmapDTO> getActivityHeatmap(int days, String currency, String statusFilter, AdvancedFilters advanced) {
        String statusCondition = buildStatusCondition(statusFilter);
        if (advanced == null) advanced = AdvancedFilters.empty();
        String sql = """
            SELECT
                d.date,
                (DAYOFWEEK(d.date) - 1) as day_of_week,
                WEEK(d.date) as week_number,
                d.operation_count
            FROM (
                SELECT
                    DATE(created_at) as date,
                    COUNT(*) as operation_count
                FROM operation_readmodel
                WHERE created_at >= :startDate
                """ + statusCondition +
                (currency != null ? " AND currency = :currency " : "") +
                advanced.toSqlConditions() + """
                GROUP BY DATE(created_at)
            ) d
            ORDER BY d.date ASC
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", LocalDate.now().minusDays(days).atStartOfDay());
        if (currency != null) query.setParameter("currency", currency);
        advanced.applyToQuery(query);

        @SuppressWarnings("unchecked")
        List<Object[]> results = query.getResultList();

        // Get max count for level calculation
        int maxCount = results.stream().mapToInt(row -> toInt(row[3])).max().orElse(1);

        return results.stream().map(row -> {
            int count = toInt(row[3]);
            int level = maxCount > 0 ? Math.min(4, (count * 4) / maxCount) : 0;
            if (count > 0 && level == 0) level = 1;

            Object dateRaw = row[0];
            String dateStr = dateRaw instanceof java.sql.Date
                    ? ((java.sql.Date) dateRaw).toLocalDate().format(DateTimeFormatter.ISO_DATE)
                    : dateRaw.toString();

            return ActivityHeatmapDTO.builder()
                    .date(dateStr)
                    .dayOfWeek(toInt(row[1]))
                    .weekNumber(toInt(row[2]))
                    .operationCount(count)
                    .level(level)
                    .tooltip(count + " operaciones")
                    .build();
        }).collect(Collectors.toList());
    }

    public List<ExpiryCountdownDTO> getUpcomingExpiries(String productType, String currency, String statusFilter, AdvancedFilters advanced) {
        LocalDate today = LocalDate.now();
        if (advanced == null) advanced = AdvancedFilters.empty();

        List<ExpiryCountdownDTO> result = new ArrayList<>();

        // For CLOSED filter, upcoming expiries don't make sense - return empty
        if ("CLOSED".equals(statusFilter)) {
            return result;
        }

        // Define ranges
        int[][] ranges = {
                {0, 3, 1}, // 0-3 days - CRITICAL
                {4, 7, 2}, // 4-7 days - HIGH
                {8, 15, 3}, // 8-15 days - MEDIUM
                {16, 30, 4} // 16-30 days - LOW
        };

        String[] rangeLabels = {"3 días", "7 días", "15 días", "30 días"};
        String[] rangeKeys = {"3_DAYS", "7_DAYS", "15_DAYS", "30_DAYS"};
        String[] urgencyLevels = {"CRITICAL", "HIGH", "MEDIUM", "LOW"};
        String[] colors = {"#EF4444", "#F97316", "#FBBF24", "#10B981"};

        Map<String, String> productLabels = Map.of(
                "LC_IMPORT", "LC Import",
                "LC_EXPORT", "LC Export",
                "GUARANTEE", "Garantías",
                "STANDBY_LC", "Standby LC",
                "COLLECTION", "Cobranzas"
        );

        // For ALL or OPEN, filter active operations only (not closed, cancelled, completed)
        String expiryStatusCondition = " AND status NOT IN ('CLOSED', 'CANCELLED', 'COMPLETED')";

        for (int i = 0; i < ranges.length; i++) {
            int fromDays = ranges[i][0];
            int toDays = ranges[i][1];

            // Get totals
            String sql = """
                SELECT COUNT(*), COALESCE(SUM(amount), 0)
                FROM operation_readmodel
                WHERE expiry_date BETWEEN :fromDate AND :toDate
                """ + expiryStatusCondition +
                (productType != null ? " AND product_type = :productType" : "") +
                (currency != null ? " AND currency = :currency" : "") +
                advanced.toSqlConditions();

            Query query = entityManager.createNativeQuery(sql);
            query.setParameter("fromDate", today.plusDays(fromDays));
            query.setParameter("toDate", today.plusDays(toDays));
            if (productType != null) query.setParameter("productType", productType);
            if (currency != null) query.setParameter("currency", currency);
            advanced.applyToQuery(query);

            Object[] row = (Object[]) query.getSingleResult();

            // Get product breakdown
            String breakdownSql = """
                SELECT product_type, COUNT(*), COALESCE(SUM(amount), 0)
                FROM operation_readmodel
                WHERE expiry_date BETWEEN :fromDate AND :toDate
                """ + expiryStatusCondition +
                (productType != null ? " AND product_type = :productType " : "") +
                (currency != null ? " AND currency = :currency " : "") +
                advanced.toSqlConditions() + """
                GROUP BY product_type
                ORDER BY COUNT(*) DESC
                """;

            Query breakdownQuery = entityManager.createNativeQuery(breakdownSql);
            breakdownQuery.setParameter("fromDate", today.plusDays(fromDays));
            breakdownQuery.setParameter("toDate", today.plusDays(toDays));
            if (productType != null) breakdownQuery.setParameter("productType", productType);
            if (currency != null) breakdownQuery.setParameter("currency", currency);
            advanced.applyToQuery(breakdownQuery);

            @SuppressWarnings("unchecked")
            List<Object[]> breakdownResults = breakdownQuery.getResultList();

            List<ExpiryProductBreakdownDTO> productBreakdown = breakdownResults.stream()
                    .map(br -> {
                        String pt = (String) br[0];
                        return ExpiryProductBreakdownDTO.builder()
                                .productType(pt)
                                .productLabel(productLabels.getOrDefault(pt, pt))
                                .count(toInt(br[1]))
                                .volume(toBigDecimal(br[2]))
                                .color(PRODUCT_COLORS.getOrDefault(pt, "#6B7280"))
                                .build();
                    })
                    .collect(Collectors.toList());

            result.add(ExpiryCountdownDTO.builder()
                    .range(rangeKeys[i])
                    .rangeLabel(rangeLabels[i])
                    .count(toInt(row[0]))
                    .totalVolume(toBigDecimal(row[1]))
                    .urgencyLevel(urgencyLevels[i])
                    .color(colors[i])
                    .productBreakdown(productBreakdown)
                    .build());
        }

        return result;
    }

    public List<ProductComparisonDTO> getProductComparison(LocalDate startDate, LocalDate endDate, String currency, String statusFilter, AdvancedFilters advanced) {
        String statusCondition = buildStatusCondition(statusFilter);
        if (advanced == null) advanced = AdvancedFilters.empty();
        String sql = """
            SELECT
                product_type,
                COUNT(*) as total_ops,
                SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_ops,
                COALESCE(SUM(amount), 0) as total_volume,
                COALESCE(AVG(amount), 0) as avg_size,
                COUNT(DISTINCT applicant_name) as unique_clients
            FROM operation_readmodel
            WHERE created_at >= :startDate AND created_at <= :endDate
            """ + statusCondition +
            (currency != null ? " AND currency = :currency " : "") +
            advanced.toSqlConditions() + """
            GROUP BY product_type
            ORDER BY total_volume DESC
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("startDate", startDate.atStartOfDay());
        query.setParameter("endDate", endDate.plusDays(1).atStartOfDay());
        if (currency != null) query.setParameter("currency", currency);
        advanced.applyToQuery(query);

        @SuppressWarnings("unchecked")
        List<Object[]> results = query.getResultList();

        // Get pending balances from GLE by product type
        Map<String, BigDecimal> pendingBalanceByProduct = getPendingBalanceByProductType(currency);

        BigDecimal totalVolume = results.stream()
                .map(row -> toBigDecimal(row[3]))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, String> productLabels = Map.of(
                "LC_IMPORT", "LC Import",
                "LC_EXPORT", "LC Export",
                "GUARANTEE", "Garantías",
                "STANDBY_LC", "Standby LC",
                "COLLECTION", "Cobranzas"
        );

        Map<String, String> productIcons = Map.of(
                "LC_IMPORT", "download",
                "LC_EXPORT", "upload",
                "GUARANTEE", "shield",
                "STANDBY_LC", "shield-check",
                "COLLECTION", "file-text"
        );

        return results.stream().map(row -> {
            String productType = (String) row[0];
            BigDecimal volume = toBigDecimal(row[3]);
            BigDecimal volumePercentage = totalVolume.compareTo(BigDecimal.ZERO) > 0
                    ? volume.multiply(BigDecimal.valueOf(100)).divide(totalVolume, 1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            return ProductComparisonDTO.builder()
                    .productType(productType)
                    .productLabel(productLabels.getOrDefault(productType, productType))
                    .totalOperations(toInt(row[1]))
                    .activeOperations(toInt(row[2]))
                    .totalVolume(volume)
                    .pendingBalance(pendingBalanceByProduct.getOrDefault(productType, BigDecimal.ZERO))
                    .avgOperationSize(toBigDecimal(row[4]))
                    .volumePercentage(volumePercentage)
                    .uniqueClients(toInt(row[5]))
                    .growthPercent(BigDecimal.ZERO)
                    .color(PRODUCT_COLORS.getOrDefault(productType, "#6B7280"))
                    .icon(productIcons.getOrDefault(productType, "file"))
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Get pending balance by product type from GLE.
     * Uses accounting_nature from product_type_config to determine calculation direction:
     * - DEBIT: pendingBalance = SUM(debits) - SUM(credits) (default for LC, Guarantees)
     * - CREDIT: pendingBalance = SUM(credits) - SUM(debits) (for Collections)
     * Filters by currency if provided.
     */
    private Map<String, BigDecimal> getPendingBalanceByProductType(String currency) {
        Map<String, BigDecimal> result = new HashMap<>();
        try {
            // Join with product_type_config to get accounting_nature for correct calculation
            String sql = """
                SELECT
                    o.product_type,
                    SUM(
                        CASE
                            WHEN COALESCE(ptc.accounting_nature, 'DEBIT') = 'CREDIT' THEN
                                CASE WHEN g.dbtcdt = 'C' THEN g.amt ELSE -g.amt END
                            ELSE
                                CASE WHEN g.dbtcdt = 'D' THEN g.amt ELSE -g.amt END
                        END
                    ) as pending_balance
                FROM gle_read_model g
                JOIN operation_readmodel o ON g.reference = o.reference
                LEFT JOIN product_type_config ptc ON o.product_type = ptc.product_type
                WHERE LEFT(g.act, 4) IN ('6301', '6302', '6303', '7301', '7390')
                AND o.product_type IS NOT NULL
                AND g.reference IS NOT NULL AND g.reference != ''
                """ + (currency != null ? " AND g.cur = :currency " : "") + """
                GROUP BY o.product_type
                HAVING ABS(pending_balance) > 0.01
                """;

            Query query = entityManager.createNativeQuery(sql);
            if (currency != null) {
                query.setParameter("currency", currency);
            }

            @SuppressWarnings("unchecked")
            List<Object[]> rows = query.getResultList();

            for (Object[] row : rows) {
                String productType = (String) row[0];
                BigDecimal balance = toBigDecimal(row[1]);
                result.put(productType, balance);
            }
        } catch (Exception e) {
            log.error("Error getting pending balance by product type: {}", e.getMessage());
        }
        return result;
    }

    public UserActivitySummaryDTO getUserActivity(LocalDate startDate, LocalDate endDate, String productType, String currency, String statusFilter, AdvancedFilters advanced) {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(7);
        String statusCondition = buildStatusCondition(statusFilter);
        if (advanced == null) advanced = AdvancedFilters.empty();

        // First, get the totals across ALL users
        String totalsSql = """
            SELECT
                SUM(CASE WHEN DATE(created_at) = :today THEN 1 ELSE 0 END) as total_ops_today,
                COUNT(*) as total_ops_period,
                COALESCE(SUM(amount), 0) as total_volume_period,
                COUNT(DISTINCT created_by) as total_active_users
            FROM operation_readmodel
            WHERE created_by IS NOT NULL AND TRIM(created_by) != ''
            AND created_at >= :startDate AND created_at <= :endDate
            """ + statusCondition +
            (productType != null ? " AND product_type = :productType " : "") +
            (currency != null ? " AND currency = :currency " : "") +
            advanced.toSqlConditions();

        Query totalsQuery = entityManager.createNativeQuery(totalsSql);
        totalsQuery.setParameter("today", today);
        totalsQuery.setParameter("startDate", startDate.atStartOfDay());
        totalsQuery.setParameter("endDate", endDate.plusDays(1).atStartOfDay());
        if (productType != null) totalsQuery.setParameter("productType", productType);
        if (currency != null) totalsQuery.setParameter("currency", currency);
        advanced.applyToQuery(totalsQuery);

        Object[] totalsRow = (Object[]) totalsQuery.getSingleResult();
        Integer totalOpsToday = toInt(totalsRow[0]);
        Integer totalOpsPeriod = toInt(totalsRow[1]);
        BigDecimal totalVolumePeriod = toBigDecimal(totalsRow[2]);
        Integer totalActiveUsers = toInt(totalsRow[3]);

        // Then, get the top 15 users
        String sql = """
            SELECT
                o.created_by as username,
                COALESCE(u.name, o.created_by) as full_name,
                SUM(CASE WHEN DATE(o.created_at) = :today THEN 1 ELSE 0 END) as ops_today,
                SUM(CASE WHEN o.created_at >= :weekStart THEN 1 ELSE 0 END) as ops_week,
                COUNT(*) as ops_period,
                COALESCE(SUM(o.amount), 0) as volume_period,
                MAX(o.created_at) as last_activity,
                (SELECT product_type FROM operation_readmodel o2
                 WHERE o2.created_by = o.created_by
                 AND o2.created_at >= :startDate AND o2.created_at <= :endDate
                 GROUP BY product_type ORDER BY COUNT(*) DESC LIMIT 1) as most_used_product
            FROM operation_readmodel o
            LEFT JOIN user_read_model u ON o.created_by = u.username
            WHERE o.created_by IS NOT NULL AND TRIM(o.created_by) != ''
            AND o.created_at >= :startDate AND o.created_at <= :endDate
            """ + statusCondition.replace("status", "o.status") +
            (productType != null ? " AND o.product_type = :productType " : "") +
            (currency != null ? " AND o.currency = :currency " : "") +
            advanced.toSqlConditions("o") + """
            GROUP BY o.created_by, u.name
            ORDER BY ops_period DESC, ops_today DESC
            LIMIT 15
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("today", today);
        query.setParameter("weekStart", weekStart.atStartOfDay());
        query.setParameter("startDate", startDate.atStartOfDay());
        query.setParameter("endDate", endDate.plusDays(1).atStartOfDay());
        if (productType != null) query.setParameter("productType", productType);
        if (currency != null) query.setParameter("currency", currency);
        advanced.applyToQuery(query);

        @SuppressWarnings("unchecked")
        List<Object[]> results = query.getResultList();

        List<UserActivityDTO> users = results.stream().map(row -> {
            Object lastActivityRaw = row[6];
            String lastActivity = lastActivityRaw != null
                    ? (lastActivityRaw instanceof java.sql.Timestamp
                        ? ((java.sql.Timestamp) lastActivityRaw).toLocalDateTime().format(DateTimeFormatter.ISO_DATE)
                        : lastActivityRaw.toString())
                    : null;

            String fullName = (String) row[1];
            // Trim the full name and fallback to username if empty
            if (fullName != null) {
                fullName = fullName.trim();
                if (fullName.isEmpty()) {
                    fullName = (String) row[0];
                }
            }

            return UserActivityDTO.builder()
                    .username((String) row[0])
                    .fullName(fullName)
                    .operationsToday(toInt(row[2]))
                    .operationsThisWeek(toInt(row[3]))
                    .operationsThisMonth(toInt(row[4]))
                    .volumeThisMonth(toBigDecimal(row[5]))
                    .lastActivityDate(lastActivity)
                    .mostUsedProduct((String) row[7])
                    .build();
        }).collect(Collectors.toList());

        return UserActivitySummaryDTO.builder()
                .totalOperationsToday(totalOpsToday)
                .totalOperationsPeriod(totalOpsPeriod)
                .totalVolumePeriod(totalVolumePeriod)
                .totalActiveUsers(totalActiveUsers)
                .users(users)
                .build();
    }

    // ==================== FILTER OPTIONS ====================

    /**
     * Get distinct currencies from registered operations
     */
    public List<String> getDistinctCurrencies() {
        String sql = """
            SELECT DISTINCT currency
            FROM operation_readmodel
            WHERE currency IS NOT NULL AND TRIM(currency) != ''
            ORDER BY currency ASC
            """;

        Query query = entityManager.createNativeQuery(sql);

        @SuppressWarnings("unchecked")
        List<String> results = query.getResultList();

        return results;
    }

    /**
     * Get distinct product types from registered operations
     */
    public List<String> getDistinctProductTypes() {
        String sql = """
            SELECT DISTINCT product_type
            FROM operation_readmodel
            WHERE product_type IS NOT NULL AND TRIM(product_type) != ''
            ORDER BY product_type ASC
            """;

        Query query = entityManager.createNativeQuery(sql);

        @SuppressWarnings("unchecked")
        List<String> results = query.getResultList();

        return results;
    }

    /**
     * Get distinct created_by values from registered operations
     */
    public List<String> getDistinctCreatedBy() {
        String sql = """
            SELECT DISTINCT created_by
            FROM operation_readmodel
            WHERE created_by IS NOT NULL AND TRIM(created_by) != ''
            ORDER BY created_by ASC
            """;

        Query query = entityManager.createNativeQuery(sql);

        @SuppressWarnings("unchecked")
        List<String> results = query.getResultList();

        return results;
    }

    /**
     * Get distinct beneficiary names from registered operations
     */
    public List<String> getDistinctBeneficiaries() {
        String sql = """
            SELECT DISTINCT beneficiary_name
            FROM operation_readmodel
            WHERE beneficiary_name IS NOT NULL AND TRIM(beneficiary_name) != ''
            ORDER BY beneficiary_name ASC
            """;

        Query query = entityManager.createNativeQuery(sql);

        @SuppressWarnings("unchecked")
        List<String> results = query.getResultList();

        return results;
    }

    /**
     * Get distinct issuing bank BICs from registered operations
     */
    public List<String> getDistinctIssuingBanks() {
        String sql = """
            SELECT DISTINCT issuing_bank_bic
            FROM operation_readmodel
            WHERE issuing_bank_bic IS NOT NULL AND TRIM(issuing_bank_bic) != ''
            ORDER BY issuing_bank_bic ASC
            """;

        Query query = entityManager.createNativeQuery(sql);

        @SuppressWarnings("unchecked")
        List<String> results = query.getResultList();

        return results;
    }

    /**
     * Get distinct advising bank BICs from registered operations
     */
    public List<String> getDistinctAdvisingBanks() {
        String sql = """
            SELECT DISTINCT advising_bank_bic
            FROM operation_readmodel
            WHERE advising_bank_bic IS NOT NULL AND TRIM(advising_bank_bic) != ''
            ORDER BY advising_bank_bic ASC
            """;

        Query query = entityManager.createNativeQuery(sql);

        @SuppressWarnings("unchecked")
        List<String> results = query.getResultList();

        return results;
    }

    /**
     * Get distinct applicant names from registered operations
     */
    public List<String> getDistinctApplicants() {
        String sql = """
            SELECT DISTINCT applicant_name
            FROM operation_readmodel
            WHERE applicant_name IS NOT NULL AND TRIM(applicant_name) != ''
            ORDER BY applicant_name ASC
            """;

        Query query = entityManager.createNativeQuery(sql);

        @SuppressWarnings("unchecked")
        List<String> results = query.getResultList();

        return results;
    }

    // ==================== HELPER METHODS ====================

    private LocalDate calculateStartDate(String period) {
        return switch (period) {
            case "today" -> LocalDate.now();
            case "week" -> LocalDate.now().minusWeeks(1);
            case "month" -> LocalDate.now().minusMonths(1);
            case "quarter" -> LocalDate.now().minusMonths(3);
            case "semester" -> LocalDate.now().minusMonths(6);
            case "year" -> LocalDate.now().minusYears(1);
            case "more_than_year" -> LocalDate.now().minusYears(10); // Histórico antiguo
            case "all" -> LocalDate.of(2000, 1, 1); // Incluir todo el histórico
            default -> LocalDate.now().minusMonths(1);
        };
    }

    private LocalDate calculateEndDate(String period) {
        // Para "more_than_year" la fecha de fin es hace 1 año (operaciones antiguas)
        if ("more_than_year".equals(period)) {
            return LocalDate.now().minusYears(1);
        }
        return LocalDate.now();
    }

    private String getPeriodLabel(String period) {
        return switch (period) {
            case "today" -> "Hoy";
            case "week" -> "Última Semana";
            case "month" -> "Último Mes";
            case "quarter" -> "Último Trimestre";
            case "semester" -> "Último Semestre";
            case "year" -> "Último Año";
            case "more_than_year" -> "Mayor a 1 Año";
            case "all" -> "Todo el Histórico";
            default -> "Último Mes";
        };
    }

    private BigDecimal calculateChangePercent(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? BigDecimal.valueOf(100) : BigDecimal.ZERO;
        }
        return current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous, 1, RoundingMode.HALF_UP);
    }

    private String buildPeriodComparisonLabel(long daysDiff) {
        if (daysDiff <= 1) {
            return "vs día anterior";
        } else if (daysDiff <= 7) {
            return "vs semana anterior";
        } else if (daysDiff <= 31) {
            return "vs mes anterior";
        } else if (daysDiff <= 93) {
            return "vs trimestre anterior";
        } else if (daysDiff <= 186) {
            return "vs semestre anterior";
        } else {
            return "vs año anterior";
        }
    }

    private String formatCurrency(BigDecimal amount, String currency) {
        if (amount == null) return "$0";
        if (amount.compareTo(BigDecimal.valueOf(1_000_000)) >= 0) {
            return "$" + amount.divide(BigDecimal.valueOf(1_000_000), 1, RoundingMode.HALF_UP) + "M " + currency;
        } else if (amount.compareTo(BigDecimal.valueOf(1_000)) >= 0) {
            return "$" + amount.divide(BigDecimal.valueOf(1_000), 1, RoundingMode.HALF_UP) + "K " + currency;
        }
        return "$" + amount.setScale(0, RoundingMode.HALF_UP) + " " + currency;
    }

    private String formatNumber(Long number) {
        if (number == null) return "0";
        if (number >= 1_000_000) {
            return String.format("%.1fM", number / 1_000_000.0);
        } else if (number >= 1_000) {
            return String.format("%.1fK", number / 1_000.0);
        }
        return number.toString();
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        if (value instanceof Number) return BigDecimal.valueOf(((Number) value).doubleValue());
        return BigDecimal.ZERO;
    }

    private Long toLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number) return ((Number) value).longValue();
        return 0L;
    }

    private Integer toInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number) return ((Number) value).intValue();
        return 0;
    }
}
