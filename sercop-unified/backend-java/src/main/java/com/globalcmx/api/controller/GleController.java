package com.globalcmx.api.controller;

import com.globalcmx.api.readmodel.entity.GleReadModel;
import com.globalcmx.api.readmodel.repository.GleReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller para consultas del General Ledger (GLE)
 */
@RestController
@RequestMapping("/gle")
@RequiredArgsConstructor
@Slf4j
public class GleController {

    private final GleReadModelRepository gleRepository;

    @PersistenceContext(unitName = "readModel")
    private EntityManager entityManager;

    /**
     * Obtiene resumen general del libro mayor
     */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        log.info("Getting GLE summary");

        Map<String, Object> summary = new HashMap<>();

        // Totales por tipo (D/C)
        List<Object[]> totals = gleRepository.getTotalsByType();
        Map<String, Map<String, Object>> byType = new HashMap<>();
        for (Object[] row : totals) {
            String type = (String) row[0];
            BigDecimal total = (BigDecimal) row[1];
            Long count = (Long) row[2];
            Map<String, Object> typeData = new HashMap<>();
            typeData.put("total", total);
            typeData.put("count", count);
            byType.put("D".equals(type) ? "debits" : "credits", typeData);
        }
        summary.put("totals", byType);

        // Total de registros
        summary.put("totalEntries", gleRepository.count());

        // Resumen por moneda
        List<Object[]> byCurrency = gleRepository.getSummaryByCurrency();
        List<Map<String, Object>> currencySummary = byCurrency.stream().map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put("currency", row[0]);
            m.put("type", "D".equals(row[1]) ? "debit" : "credit");
            m.put("total", row[2]);
            m.put("count", row[3]);
            return m;
        }).collect(Collectors.toList());
        summary.put("byCurrency", currencySummary);

        return ResponseEntity.ok(summary);
    }

    /**
     * Obtiene resumen mensual
     */
    @GetMapping("/monthly")
    public ResponseEntity<List<Map<String, Object>>> getMonthlySummary() {
        log.info("Getting monthly GLE summary");

        List<Object[]> monthly = gleRepository.getMonthlySummary();
        List<Map<String, Object>> result = monthly.stream().map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put("month", row[0]);
            m.put("type", "D".equals(row[1]) ? "debit" : "credit");
            m.put("currency", row[2]);
            m.put("total", row[3]);
            m.put("count", row[4]);
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Obtiene resumen por cuenta
     */
    @GetMapping("/by-account")
    public ResponseEntity<List<Map<String, Object>>> getByAccount() {
        log.info("Getting GLE summary by account");

        List<Object[]> byAccount = gleRepository.getSummaryByAccount();
        List<Map<String, Object>> result = byAccount.stream().map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put("account", row[0]);
            m.put("type", "D".equals(row[1]) ? "debit" : "credit");
            m.put("currency", row[2]);
            m.put("total", row[3]);
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Obtiene las últimas entradas
     */
    @GetMapping("/recent")
    public ResponseEntity<List<GleReadModel>> getRecentEntries() {
        log.info("Getting recent GLE entries");
        return ResponseEntity.ok(gleRepository.findTop100ByOrderByValdatDesc());
    }

    /**
     * Busca entradas por texto
     */
    @GetMapping("/search")
    public ResponseEntity<List<GleReadModel>> searchByText(@RequestParam String text) {
        log.info("Searching GLE by text: {}", text);
        return ResponseEntity.ok(gleRepository.findByTextContaining(text));
    }

    /**
     * Obtiene entradas por rango de fechas
     */
    @GetMapping("/by-date-range")
    public ResponseEntity<List<GleReadModel>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        log.info("Getting GLE entries from {} to {}", start, end);
        return ResponseEntity.ok(gleRepository.findByValdatBetween(start, end));
    }

    /**
     * Obtiene entradas por cuenta (contiene)
     */
    @GetMapping("/by-account/{account}")
    public ResponseEntity<List<GleReadModel>> getByAccountNumber(@PathVariable String account) {
        log.info("Getting GLE entries for account containing: {}", account);
        return ResponseEntity.ok(gleRepository.findByActContainingIgnoreCase(account));
    }

    /**
     * Obtiene entradas por cuenta que inicie con prefijo
     */
    @GetMapping("/by-account-prefix/{prefix}")
    public ResponseEntity<List<GleReadModel>> getByAccountPrefix(@PathVariable String prefix) {
        log.info("Getting GLE entries for accounts starting with: {}", prefix);
        return ResponseEntity.ok(gleRepository.findByActStartingWithIgnoreCase(prefix));
    }

    /**
     * Obtiene entradas por moneda
     */
    @GetMapping("/by-currency/{currency}")
    public ResponseEntity<List<GleReadModel>> getByCurrency(@PathVariable String currency) {
        log.info("Getting GLE entries for currency: {}", currency);
        return ResponseEntity.ok(gleRepository.findByCur(currency.toUpperCase()));
    }

    /**
     * Obtiene estadísticas para el dashboard de IA
     */
    @GetMapping("/ai-stats")
    public ResponseEntity<Map<String, Object>> getAIStats() {
        log.info("Getting GLE stats for AI dashboard");

        Map<String, Object> stats = new HashMap<>();

        // Total entries
        stats.put("totalEntries", gleRepository.count());

        // Totals by type
        List<Object[]> totals = gleRepository.getTotalsByType();
        for (Object[] row : totals) {
            String type = (String) row[0];
            BigDecimal total = (BigDecimal) row[1];
            Long count = (Long) row[2];
            if ("D".equals(type)) {
                stats.put("totalDebits", total);
                stats.put("debitCount", count);
            } else {
                stats.put("totalCredits", total);
                stats.put("creditCount", count);
            }
        }

        // By currency summary
        List<Object[]> byCurrency = gleRepository.getSummaryByCurrency();
        Map<String, Map<String, Object>> currencyMap = new HashMap<>();
        for (Object[] row : byCurrency) {
            String currency = (String) row[0];
            String type = (String) row[1];
            BigDecimal total = (BigDecimal) row[2];
            Long count = (Long) row[3];

            currencyMap.computeIfAbsent(currency, k -> new HashMap<>());
            Map<String, Object> curData = currencyMap.get(currency);
            if ("D".equals(type)) {
                curData.put("debits", total);
                curData.put("debitCount", count);
            } else {
                curData.put("credits", total);
                curData.put("creditCount", count);
            }
        }
        stats.put("byCurrency", currencyMap);

        // Monthly trend (last 12 months)
        List<Object[]> monthly = gleRepository.getMonthlySummary();
        stats.put("monthlyTrend", monthly.stream().limit(24).map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put("month", row[0]);
            m.put("type", row[1]);
            m.put("currency", row[2]);
            m.put("total", row[3]);
            m.put("count", row[4]);
            return m;
        }).collect(Collectors.toList()));

        return ResponseEntity.ok(stats);
    }

    /**
     * Obtiene entradas por referencia de operación
     */
    @GetMapping("/by-reference/{reference}")
    public ResponseEntity<List<GleReadModel>> getByReference(@PathVariable String reference) {
        log.info("Getting GLE entries for reference: {}", reference);
        return ResponseEntity.ok(gleRepository.findByReference(reference.toUpperCase()));
    }

    /**
     * Busca entradas por referencia (búsqueda parcial)
     */
    @GetMapping("/search-reference")
    public ResponseEntity<List<GleReadModel>> searchByReference(@RequestParam String reference) {
        log.info("Searching GLE by reference: {}", reference);
        return ResponseEntity.ok(gleRepository.findByReferenceContainingIgnoreCase(reference));
    }

    /**
     * Obtiene resumen contable por referencia de operación
     * Busca operaciones que INICIEN con la referencia proporcionada
     * Devuelve débitos, créditos y saldo neto por moneda
     */
    @GetMapping("/balance/{reference}")
    public ResponseEntity<Map<String, Object>> getBalanceByReference(@PathVariable String reference) {
        log.info("Getting balance for reference starting with: {}", reference);

        Map<String, Object> result = new HashMap<>();
        result.put("reference", reference.toUpperCase());

        // Get entries - buscar por prefijo (que inicie con)
        List<GleReadModel> entries = gleRepository.findByReferenceStartingWithIgnoreCase(reference.toUpperCase());
        result.put("totalEntries", entries.size());

        if (entries.isEmpty()) {
            result.put("found", false);
            result.put("message", "No se encontraron asientos contables para operaciones que inicien con: " + reference);
            return ResponseEntity.ok(result);
        }

        result.put("found", true);

        // Get summary by reference prefix
        List<Object[]> summary = gleRepository.getSummaryByReferencePrefix(reference.toUpperCase());

        // Process by currency
        Map<String, Map<String, Object>> byCurrency = new HashMap<>();
        for (Object[] row : summary) {
            String cur = (String) row[2];
            String type = (String) row[1];
            BigDecimal total = (BigDecimal) row[3];
            Long count = (Long) row[4];

            byCurrency.computeIfAbsent(cur, k -> {
                Map<String, Object> m = new HashMap<>();
                m.put("currency", cur);
                m.put("debits", BigDecimal.ZERO);
                m.put("credits", BigDecimal.ZERO);
                m.put("debitCount", 0L);
                m.put("creditCount", 0L);
                return m;
            });

            Map<String, Object> curData = byCurrency.get(cur);
            if ("D".equals(type)) {
                curData.put("debits", total);
                curData.put("debitCount", count);
            } else {
                curData.put("credits", total);
                curData.put("creditCount", count);
            }
        }

        // Calculate net balance for each currency
        for (Map<String, Object> curData : byCurrency.values()) {
            BigDecimal debits = (BigDecimal) curData.get("debits");
            BigDecimal credits = (BigDecimal) curData.get("credits");
            curData.put("netBalance", debits.subtract(credits));
        }

        result.put("byCurrency", byCurrency.values());

        // Include all entries for timeline visualization (limit 100 for performance)
        result.put("entries", entries.stream().limit(100).map(e -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", e.getId());
            m.put("account", e.getAct());
            m.put("type", e.getDbtcdt());
            m.put("currency", e.getCur());
            m.put("amount", e.getAmt());
            m.put("valueDate", e.getValdat());
            m.put("description", e.getTxt1());
            m.put("description2", e.getTxt2());
            return m;
        }).collect(Collectors.toList()));

        return ResponseEntity.ok(result);
    }

    /**
     * Informe Global por Cuenta Contable
     * Análisis financiero agrupado por moneda y cuenta
     * Solo cuentas con longitud >= 15 caracteres y saldo positivo (débitos > créditos)
     */
    @GetMapping("/global-account-report")
    public ResponseEntity<Map<String, Object>> getGlobalAccountReport(
            @RequestParam(defaultValue = "true") boolean positiveOnly) {
        log.info("Getting global account report, positiveOnly: {}", positiveOnly);

        Map<String, Object> result = new HashMap<>();

        List<Object[]> balances = positiveOnly
            ? gleRepository.getGlobalAccountBalances()
            : gleRepository.getGlobalAccountBalancesAll();

        // Transform to list of maps
        List<Map<String, Object>> accounts = balances.stream().map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put("currency", row[0]);
            m.put("account", row[1]);
            m.put("debits", row[2]);
            m.put("credits", row[3]);
            m.put("balance", row[4]);
            m.put("operationCount", row[5] != null ? ((Number) row[5]).intValue() : 0);
            m.put("productType", row[6] != null ? row[6].toString() : "");
            return m;
        }).collect(Collectors.toList());

        result.put("accounts", accounts);
        result.put("totalAccounts", accounts.size());

        // Calculate totals by currency
        Map<String, Map<String, BigDecimal>> byCurrency = new HashMap<>();
        for (Object[] row : balances) {
            String cur = (String) row[0];
            BigDecimal debits = row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;
            BigDecimal credits = row[3] != null ? new BigDecimal(row[3].toString()) : BigDecimal.ZERO;
            BigDecimal balance = row[4] != null ? new BigDecimal(row[4].toString()) : BigDecimal.ZERO;

            byCurrency.computeIfAbsent(cur, k -> {
                Map<String, BigDecimal> m = new HashMap<>();
                m.put("debits", BigDecimal.ZERO);
                m.put("credits", BigDecimal.ZERO);
                m.put("balance", BigDecimal.ZERO);
                return m;
            });

            Map<String, BigDecimal> curData = byCurrency.get(cur);
            curData.put("debits", curData.get("debits").add(debits));
            curData.put("credits", curData.get("credits").add(credits));
            curData.put("balance", curData.get("balance").add(balance));
        }

        // Convert currency summary to list
        List<Map<String, Object>> currencySummary = byCurrency.entrySet().stream().map(e -> {
            Map<String, Object> m = new HashMap<>();
            m.put("currency", e.getKey());
            m.put("debits", e.getValue().get("debits"));
            m.put("credits", e.getValue().get("credits"));
            m.put("balance", e.getValue().get("balance"));
            return m;
        }).sorted((a, b) -> ((String) a.get("currency")).compareTo((String) b.get("currency")))
          .collect(Collectors.toList());

        result.put("byCurrency", currencySummary);

        // Calculate grand totals
        BigDecimal totalDebits = BigDecimal.ZERO;
        BigDecimal totalCredits = BigDecimal.ZERO;
        BigDecimal totalBalance = BigDecimal.ZERO;
        for (Map<String, BigDecimal> cur : byCurrency.values()) {
            totalDebits = totalDebits.add(cur.get("debits"));
            totalCredits = totalCredits.add(cur.get("credits"));
            totalBalance = totalBalance.add(cur.get("balance"));
        }

        result.put("totalDebits", totalDebits);
        result.put("totalCredits", totalCredits);
        result.put("totalBalance", totalBalance);

        return ResponseEntity.ok(result);
    }

    /**
     * Obtiene las comisiones cobradas al cliente
     * Busca asientos donde acttyp = 'LO' (comisiones) y prn = 36
     * Agrupa las transacciones relacionadas
     * Une con operation_readmodel para obtener product_type
     *
     * IMPORTANTE: Los totales (byCurrency, byProductType, totalCommissions) siempre
     * se calculan sobre TODOS los datos (sin LIMIT). Solo las entries para mostrar
     * tienen límite.
     */
    @GetMapping("/commissions")
    public ResponseEntity<Map<String, Object>> getCommissionsCharged(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) java.time.LocalDate endDate,
            @RequestParam(required = false, defaultValue = "3") Integer months,
            @RequestParam(required = false) List<String> accounts) {

        log.info("Commissions request - startDate: {}, endDate: {}, months: {}, accounts: {}", startDate, endDate, months, accounts);

        // months = 0 significa "todo el historial" (sin filtro de fechas)
        boolean allTime = (months != null && months == 0);

        // Si no hay fechas y no es "todo", usar los últimos N meses
        if (!allTime && startDate == null && endDate == null) {
            endDate = java.time.LocalDate.now();
            startDate = endDate.minusMonths(months);
        } else if (!allTime && startDate == null && endDate != null) {
            startDate = endDate.minusMonths(months);
        } else if (!allTime && endDate == null) {
            endDate = java.time.LocalDate.now();
        }

        log.info("Calculated date range - startDate: {}, endDate: {}, allTime: {}", startDate, endDate, allTime);

        Map<String, Object> result = new HashMap<>();
        if (!allTime) {
            result.put("startDate", startDate.toString());
            result.put("endDate", endDate.toString());
        } else {
            result.put("startDate", null);
            result.put("endDate", null);
        }

        // ========================================================================
        // 0. OBTENER LISTA DE CUENTAS DISPONIBLES (COMISIONES COBRADAS)
        // Cuentas: 52% (ingresos comisiones), 64% (LC Import comisiones)
        // ========================================================================
        String chargedAccountCriteria = "(grm.act LIKE '52%' OR grm.act LIKE '64%' OR grm.acttyp = 'LO')";

        String availableAccountsSql = """
            SELECT
                grm.act as account,
                COUNT(*) as cnt,
                SUM(grm.amt) as total
            FROM gle_read_model grm
            WHERE grm.prn = 36
            AND """ + chargedAccountCriteria + """
            AND grm.dbtcdt = 'C'
            GROUP BY grm.act
            ORDER BY SUM(grm.amt) DESC
            """;
        Query availableAccountsQuery = entityManager.createNativeQuery(availableAccountsSql);
        @SuppressWarnings("unchecked")
        List<Object[]> availableAccountsRows = availableAccountsQuery.getResultList();

        List<Map<String, Object>> availableAccounts = availableAccountsRows.stream()
            .map(row -> {
                Map<String, Object> m = new HashMap<>();
                m.put("account", row[0] != null ? row[0].toString() : null);
                m.put("count", row[1] != null ? ((Number) row[1]).longValue() : 0L);
                m.put("total", row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO);
                return m;
            })
            .collect(Collectors.toList());
        result.put("availableAccounts", availableAccounts);

        // ========================================================================
        // 1. QUERY DE TOTALES - SIN LIMIT (para obtener totales reales)
        // ========================================================================
        String dateFilter = "";
        if (!allTime) {
            dateFilter = " AND grm.bucdat >= '" + startDate + "' AND grm.bucdat < '" + endDate.plusDays(1) + "' ";
        }

        // Filtro por cuentas seleccionadas
        String accountFilter = "";
        if (accounts != null && !accounts.isEmpty()) {
            String accountList = accounts.stream()
                .map(a -> "'" + a.replace("'", "''") + "'")
                .collect(Collectors.joining(","));
            accountFilter = " AND grm.act IN (" + accountList + ") ";
        }

        // 1a. Totales por moneda (comisiones cobradas - cuentas 52%)
        String totalsByCurrencySql = """
            SELECT
                grm.cur as currency,
                SUM(CASE WHEN grm.dbtcdt = 'D' THEN grm.amt ELSE 0 END) as debits,
                SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE 0 END) as credits,
                COUNT(*) as cnt
            FROM gle_read_model grm
            WHERE grm.prn = 36
            AND """ + chargedAccountCriteria + """
            """ + dateFilter + accountFilter + """
            GROUP BY grm.cur
            """;
        Query totalsByCurrencyQuery = entityManager.createNativeQuery(totalsByCurrencySql);
        @SuppressWarnings("unchecked")
        List<Object[]> totalsByCurrencyRows = totalsByCurrencyQuery.getResultList();

        Map<String, Map<String, Object>> realTotalsByCurrency = new HashMap<>();
        BigDecimal realTotalCommissions = BigDecimal.ZERO;
        long realTotalCount = 0;

        for (Object[] row : totalsByCurrencyRows) {
            String cur = row[0] != null ? row[0].toString() : "USD";
            BigDecimal debits = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            BigDecimal credits = row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;
            long count = row[3] != null ? ((Number) row[3]).longValue() : 0;

            // Para comisiones, el saldo neto es créditos - débitos (lo que queda pendiente o cobrado)
            BigDecimal netAmount = credits.subtract(debits);

            Map<String, Object> m = new HashMap<>();
            m.put("currency", cur);
            m.put("debits", debits);
            m.put("credits", credits);
            m.put("count", count);
            realTotalsByCurrency.put(cur, m);

            realTotalCommissions = realTotalCommissions.add(netAmount);
            realTotalCount += count;
        }

        // 1b. Totales por tipo de producto (saldo neto = créditos - débitos)
        String totalsByProductTypeSql = """
            SELECT
                COALESCE(orm.product_type, 'UNKNOWN') as productType,
                grm.cur as currency,
                SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE -grm.amt END) as amount,
                COUNT(*) as cnt
            FROM gle_read_model grm
            LEFT JOIN operation_readmodel orm ON SUBSTRING(grm.referencia, 1, LENGTH(orm.reference)) = orm.reference AND LENGTH(grm.referencia) >= LENGTH(orm.reference)
            WHERE grm.prn = 36
            AND """ + chargedAccountCriteria + """
            """ + dateFilter + accountFilter + """
            GROUP BY COALESCE(orm.product_type, 'UNKNOWN'), grm.cur
            """;
        Query totalsByProductTypeQuery = entityManager.createNativeQuery(totalsByProductTypeSql);
        @SuppressWarnings("unchecked")
        List<Object[]> totalsByProductTypeRows = totalsByProductTypeQuery.getResultList();

        List<Map<String, Object>> realTotalsByProductType = totalsByProductTypeRows.stream()
            .map(row -> {
                Map<String, Object> m = new HashMap<>();
                m.put("productType", row[0] != null ? row[0].toString() : "UNKNOWN");
                m.put("currency", row[1] != null ? row[1].toString() : "USD");
                m.put("amount", row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO);
                m.put("count", row[3] != null ? ((Number) row[3]).longValue() : 0L);
                return m;
            })
            .filter(m -> ((BigDecimal) m.get("amount")).compareTo(BigDecimal.ZERO) > 0)
            .sorted((a, b) -> ((BigDecimal) b.get("amount")).compareTo((BigDecimal) a.get("amount")))
            .collect(Collectors.toList());

        // 1c. Totales mensuales (para gráfico de tendencia) - saldo neto
        String monthlyTotalsSql = """
            SELECT
                DATE_FORMAT(grm.bucdat, '%Y-%m') as month,
                SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE -grm.amt END) as amount,
                COUNT(*) as cnt
            FROM gle_read_model grm
            WHERE grm.prn = 36
            AND """ + chargedAccountCriteria + """
            """ + dateFilter + accountFilter + """
            GROUP BY DATE_FORMAT(grm.bucdat, '%Y-%m')
            ORDER BY month ASC
            """;
        Query monthlyTotalsQuery = entityManager.createNativeQuery(monthlyTotalsSql);
        @SuppressWarnings("unchecked")
        List<Object[]> monthlyTotalsRows = monthlyTotalsQuery.getResultList();

        List<Map<String, Object>> monthlyTrend = monthlyTotalsRows.stream()
            .map(row -> {
                Map<String, Object> m = new HashMap<>();
                m.put("month", row[0] != null ? row[0].toString() : null);
                m.put("amount", row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO);
                m.put("count", row[2] != null ? ((Number) row[2]).longValue() : 0L);
                return m;
            })
            .collect(Collectors.toList());

        // 1d. Top operaciones por referencia (saldo neto por operación)
        String topByReferenceSql = """
            SELECT
                grm.referencia,
                grm.cur as currency,
                SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE -grm.amt END) as amount,
                COALESCE(orm.product_type, 'UNKNOWN') as productType
            FROM gle_read_model grm
            LEFT JOIN operation_readmodel orm ON SUBSTRING(grm.referencia, 1, LENGTH(orm.reference)) = orm.reference AND LENGTH(grm.referencia) >= LENGTH(orm.reference)
            WHERE grm.prn = 36
            AND """ + chargedAccountCriteria + """
            AND grm.referencia IS NOT NULL
            AND grm.referencia != ''
            """ + dateFilter + accountFilter + """
            GROUP BY grm.referencia, grm.cur, COALESCE(orm.product_type, 'UNKNOWN')
            HAVING SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE -grm.amt END) > 0
            ORDER BY SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE -grm.amt END) DESC
            LIMIT 100
            """;
        Query topByReferenceQuery = entityManager.createNativeQuery(topByReferenceSql);
        @SuppressWarnings("unchecked")
        List<Object[]> topByReferenceRows = topByReferenceQuery.getResultList();

        List<Map<String, Object>> commissionsByRef = topByReferenceRows.stream()
            .map(row -> {
                Map<String, Object> m = new HashMap<>();
                m.put("reference", row[0] != null ? row[0].toString() : null);
                m.put("currency", row[1] != null ? row[1].toString() : "USD");
                m.put("amount", row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO);
                m.put("productType", row[3] != null ? row[3].toString() : "UNKNOWN");
                return m;
            })
            .filter(m -> ((BigDecimal) m.get("amount")).compareTo(BigDecimal.ZERO) > 0)
            .limit(50)
            .collect(Collectors.toList());

        log.info("Real totals calculated - totalCommissions: {}, totalCount: {}", realTotalCommissions, realTotalCount);

        // ========================================================================
        // 2. QUERY DE ENTRIES - CON LIMIT (solo para mostrar detalle)
        // ========================================================================
        String entriesSql = """
            SELECT
                grm.act as account,
                grm.trninr as transactionId,
                CASE WHEN grm.acttyp = 'LO' THEN 'CLIENT' ELSE grm.act END as accountDisplay,
                grm.dbtcdt as type,
                grm.cur as currency,
                grm.amt as amount,
                grm.referencia as reference,
                grm.acttyp as activityType,
                grm.bucdat as createdAt,
                COALESCE(orm.product_type, 'UNKNOWN') as productType
            FROM gle_read_model grm
            LEFT JOIN operation_readmodel orm ON SUBSTRING(grm.referencia, 1, LENGTH(orm.reference)) = orm.reference AND LENGTH(grm.referencia) >= LENGTH(orm.reference)
            WHERE grm.prn = 36
            AND (grm.act LIKE '52%' OR grm.acttyp = 'LO')
            """ + dateFilter + accountFilter + """
            ORDER BY grm.bucdat DESC
            LIMIT 2000
            """;
        Query entriesQuery = entityManager.createNativeQuery(entriesSql);

        @SuppressWarnings("unchecked")
        List<Object[]> entriesRows = entriesQuery.getResultList();

        List<Map<String, Object>> entries = entriesRows.stream().map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put("account", row[0] != null ? row[0].toString() : null);
            m.put("transactionId", row[1] != null ? row[1].toString() : null);
            m.put("accountDisplay", row[2] != null ? row[2].toString() : null);
            m.put("type", row[3] != null ? row[3].toString() : null);
            m.put("currency", row[4] != null ? row[4].toString() : null);
            m.put("amount", row[5]);
            m.put("reference", row[6] != null ? row[6].toString() : null);
            m.put("activityType", row[7] != null ? row[7].toString() : null);
            m.put("createdAt", row[8]);
            m.put("productType", row[9] != null ? row[9].toString() : "UNKNOWN");
            return m;
        }).collect(Collectors.toList());

        // ========================================================================
        // 3. ARMAR RESULTADO - Todos los totales vienen de queries agregadas
        // ========================================================================
        result.put("entries", entries);
        result.put("totalEntries", entries.size());
        result.put("totalEntriesReal", realTotalCount);
        result.put("byCurrency", realTotalsByCurrency.values());
        result.put("byProductType", realTotalsByProductType);
        result.put("byReference", commissionsByRef);
        result.put("byMonth", monthlyTrend);
        result.put("totalCommissions", realTotalCommissions);

        return ResponseEntity.ok(result);
    }

    /**
     * Obtiene las comisiones PENDIENTES de cobro
     * Busca asientos en cuentas 71% y 72% (provisiones y comisiones por cobrar)
     * Agrupa por referencia de operación y muestra saldo pendiente
     * Une con operation_readmodel para obtener product_type
     */
    @GetMapping("/commissions/pending")
    public ResponseEntity<Map<String, Object>> getPendingCommissions() {

        log.info("Getting pending commissions from accounts 71% and 72%");

        Map<String, Object> result = new HashMap<>();

        // Criterio para comisiones pendientes - cuentas 71% (provisiones/ingresos diferidos)
        String pendingAccountCriteria = "grm.act LIKE '71%'";

        // 1. Totales generales por moneda (sin filtros adicionales para capturar todos los datos)
        String totalsByCurrencySql = """
            SELECT
                grm.cur as currency,
                SUM(CASE WHEN grm.dbtcdt = 'D' THEN grm.amt ELSE 0 END) as debits,
                SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE 0 END) as credits,
                COUNT(DISTINCT grm.referencia) as operationCount
            FROM gle_read_model grm
            WHERE """ + pendingAccountCriteria + """
            GROUP BY grm.cur
            """;
        Query totalsByCurrencyQuery = entityManager.createNativeQuery(totalsByCurrencySql);
        @SuppressWarnings("unchecked")
        List<Object[]> totalsByCurrencyRows = totalsByCurrencyQuery.getResultList();

        BigDecimal totalPending = BigDecimal.ZERO;
        long totalOperations = 0;
        List<Map<String, Object>> byCurrency = new java.util.ArrayList<>();

        for (Object[] row : totalsByCurrencyRows) {
            String cur = row[0] != null ? row[0].toString() : "USD";
            BigDecimal debits = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            BigDecimal credits = row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;
            long opCount = row[3] != null ? ((Number) row[3]).longValue() : 0;

            // Saldo = débitos - créditos (mostrar valor absoluto del saldo)
            BigDecimal balance = debits.subtract(credits);

            // Mostrar todas las monedas que tengan movimientos, independiente del signo
            if (debits.compareTo(BigDecimal.ZERO) > 0 || credits.compareTo(BigDecimal.ZERO) > 0) {
                Map<String, Object> m = new HashMap<>();
                m.put("currency", cur);
                m.put("debits", debits);
                m.put("credits", credits);
                m.put("balance", balance);
                m.put("operationCount", opCount);
                byCurrency.add(m);

                totalPending = totalPending.add(balance.abs());
                totalOperations += opCount;
            }
        }

        // 2. Totales por tipo de producto
        String totalsByProductTypeSql = """
            SELECT
                COALESCE(orm.product_type, 'UNKNOWN') as productType,
                grm.cur as currency,
                SUM(CASE WHEN grm.dbtcdt = 'D' THEN grm.amt ELSE 0 END) as debits,
                SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE 0 END) as credits,
                COUNT(DISTINCT grm.referencia) as operationCount
            FROM gle_read_model grm
            LEFT JOIN operation_readmodel orm ON SUBSTRING(grm.referencia, 1, LENGTH(orm.reference)) = orm.reference AND LENGTH(grm.referencia) >= LENGTH(orm.reference)
            WHERE """ + pendingAccountCriteria + """
            GROUP BY COALESCE(orm.product_type, 'UNKNOWN'), grm.cur
            """;
        Query totalsByProductTypeQuery = entityManager.createNativeQuery(totalsByProductTypeSql);
        @SuppressWarnings("unchecked")
        List<Object[]> totalsByProductTypeRows = totalsByProductTypeQuery.getResultList();

        List<Map<String, Object>> byProductType = totalsByProductTypeRows.stream()
            .map(row -> {
                Map<String, Object> m = new HashMap<>();
                m.put("productType", row[0] != null ? row[0].toString() : "UNKNOWN");
                m.put("currency", row[1] != null ? row[1].toString() : "USD");
                BigDecimal debits = row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;
                BigDecimal credits = row[3] != null ? new BigDecimal(row[3].toString()) : BigDecimal.ZERO;
                m.put("debits", debits);
                m.put("credits", credits);
                m.put("balance", debits.subtract(credits));
                m.put("count", row[4] != null ? ((Number) row[4]).longValue() : 0L);
                return m;
            })
            .filter(m -> {
                BigDecimal debits = (BigDecimal) m.get("debits");
                BigDecimal credits = (BigDecimal) m.get("credits");
                return debits.compareTo(BigDecimal.ZERO) > 0 || credits.compareTo(BigDecimal.ZERO) > 0;
            })
            .sorted((a, b) -> ((BigDecimal) b.get("balance")).abs().compareTo(((BigDecimal) a.get("balance")).abs()))
            .collect(Collectors.toList());

        // 3. Detalle por operación (top 100 por valor absoluto de saldo)
        String operationsSql = """
            SELECT
                grm.referencia,
                grm.cur as currency,
                SUM(CASE WHEN grm.dbtcdt = 'D' THEN grm.amt ELSE 0 END) as debits,
                SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE 0 END) as credits,
                COALESCE(orm.product_type, 'UNKNOWN') as productType,
                MAX(grm.bucdat) as lastDate
            FROM gle_read_model grm
            LEFT JOIN operation_readmodel orm ON SUBSTRING(grm.referencia, 1, LENGTH(orm.reference)) = orm.reference AND LENGTH(grm.referencia) >= LENGTH(orm.reference)
            WHERE """ + pendingAccountCriteria + """
            GROUP BY grm.referencia, grm.cur, COALESCE(orm.product_type, 'UNKNOWN')
            HAVING (SUM(CASE WHEN grm.dbtcdt = 'D' THEN grm.amt ELSE 0 END) - SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE 0 END)) != 0
            ORDER BY ABS(SUM(CASE WHEN grm.dbtcdt = 'D' THEN grm.amt ELSE 0 END) - SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE 0 END)) DESC
            LIMIT 100
            """;
        Query operationsQuery = entityManager.createNativeQuery(operationsSql);
        @SuppressWarnings("unchecked")
        List<Object[]> operationsRows = operationsQuery.getResultList();

        List<Map<String, Object>> operations = operationsRows.stream()
            .map(row -> {
                Map<String, Object> m = new HashMap<>();
                m.put("reference", row[0] != null ? row[0].toString() : null);
                m.put("currency", row[1] != null ? row[1].toString() : "USD");
                BigDecimal debits = row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;
                BigDecimal credits = row[3] != null ? new BigDecimal(row[3].toString()) : BigDecimal.ZERO;
                m.put("debits", debits);
                m.put("credits", credits);
                m.put("balance", debits.subtract(credits));
                m.put("productType", row[4] != null ? row[4].toString() : "UNKNOWN");
                m.put("lastDate", row[5]);
                return m;
            })
            .collect(Collectors.toList());

        // 4. Cuentas disponibles para análisis
        String availableAccountsSql = """
            SELECT
                grm.act as account,
                COUNT(*) as cnt,
                SUM(grm.amt) as total
            FROM gle_read_model grm
            WHERE """ + pendingAccountCriteria + """
            GROUP BY grm.act
            ORDER BY SUM(grm.amt) DESC
            """;
        Query availableAccountsQuery = entityManager.createNativeQuery(availableAccountsSql);
        @SuppressWarnings("unchecked")
        List<Object[]> availableAccountsRows = availableAccountsQuery.getResultList();

        List<Map<String, Object>> availableAccounts = availableAccountsRows.stream()
            .map(row -> {
                Map<String, Object> m = new HashMap<>();
                m.put("account", row[0] != null ? row[0].toString() : null);
                m.put("count", row[1] != null ? ((Number) row[1]).longValue() : 0L);
                m.put("total", row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO);
                return m;
            })
            .collect(Collectors.toList());

        // Armar resultado
        result.put("totalPending", totalPending);
        result.put("totalOperations", totalOperations);
        result.put("byCurrency", byCurrency);
        result.put("byProductType", byProductType);
        result.put("operations", operations);
        result.put("availableAccounts", availableAccounts);

        log.info("Pending commissions calculated - total: {}, operations: {}", totalPending, totalOperations);

        return ResponseEntity.ok(result);
    }

    /**
     * Obtiene las transacciones detalladas de una cuenta específica
     * Para drill-down desde el informe global por cuenta
     * Solo muestra operaciones con saldo != 0 (agrupadas por referencia)
     * Soporta paginación
     */
    @GetMapping("/account-transactions")
    public ResponseEntity<Map<String, Object>> getAccountTransactions(
            @RequestParam String account,
            @RequestParam String currency,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        log.info("Getting transactions for account: {} currency: {} page: {} size: {}", account, currency, page, size);

        Map<String, Object> result = new HashMap<>();
        result.put("account", account);
        result.put("currency", currency);

        // Query para obtener totales (sin paginación)
        String countSql = """
            SELECT
                COUNT(*) as total,
                SUM(totalDebit) as sumDebits,
                SUM(totalCredit) as sumCredits
            FROM (
                SELECT
                    grm.referencia,
                    SUM(CASE WHEN grm.dbtcdt = 'D' THEN grm.amt ELSE 0 END) as totalDebit,
                    SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE 0 END) as totalCredit
                FROM gle_read_model grm
                WHERE grm.act = :account
                AND grm.cur = :currency
                AND grm.referencia IS NOT NULL
                AND grm.referencia != ''
                GROUP BY grm.referencia
                HAVING ABS(SUM(CASE WHEN grm.dbtcdt = 'D' THEN grm.amt ELSE 0 END) -
                           SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE 0 END)) > 0.01
            ) grouped
            """;

        Query countQuery = entityManager.createNativeQuery(countSql);
        countQuery.setParameter("account", account);
        countQuery.setParameter("currency", currency);
        Object[] countResult = (Object[]) countQuery.getSingleResult();

        long totalElements = countResult[0] != null ? ((Number) countResult[0]).longValue() : 0;
        BigDecimal totalDebits = countResult[1] != null ? new BigDecimal(countResult[1].toString()) : BigDecimal.ZERO;
        BigDecimal totalCredits = countResult[2] != null ? new BigDecimal(countResult[2].toString()) : BigDecimal.ZERO;

        int totalPages = (int) Math.ceil((double) totalElements / size);
        int offset = page * size;

        // Query paginado para transacciones
        String sql = """
            SELECT
                grm.referencia,
                SUM(CASE WHEN grm.dbtcdt = 'D' THEN grm.amt ELSE 0 END) as totalDebit,
                SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE 0 END) as totalCredit,
                SUM(CASE WHEN grm.dbtcdt = 'D' THEN grm.amt ELSE 0 END) -
                SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE 0 END) as balance,
                MAX(grm.bucdat) as bookingDate,
                MAX(grm.valdat) as valueDate,
                MAX(grm.txt1) as description,
                MAX(grm.txt2) as description2,
                COUNT(*) as transactionCount
            FROM gle_read_model grm
            WHERE grm.act = :account
            AND grm.cur = :currency
            AND grm.referencia IS NOT NULL
            AND grm.referencia != ''
            GROUP BY grm.referencia
            HAVING ABS(SUM(CASE WHEN grm.dbtcdt = 'D' THEN grm.amt ELSE 0 END) -
                       SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE 0 END)) > 0.01
            ORDER BY MAX(grm.bucdat) DESC
            LIMIT :limit OFFSET :offset
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("account", account);
        query.setParameter("currency", currency);
        query.setParameter("limit", size);
        query.setParameter("offset", offset);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();

        // Transform to list of maps
        List<Map<String, Object>> transactions = rows.stream().map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put("reference", row[0] != null ? row[0].toString() : null);
            BigDecimal debit = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            BigDecimal credit = row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;
            BigDecimal balance = row[3] != null ? new BigDecimal(row[3].toString()) : BigDecimal.ZERO;

            // Determinar el tipo basado en el saldo
            m.put("type", balance.compareTo(BigDecimal.ZERO) > 0 ? "D" : "C");
            m.put("amount", balance.abs());
            m.put("debit", debit);
            m.put("credit", credit);
            m.put("balance", balance);
            m.put("bookingDate", row[4]);
            m.put("valueDate", row[5]);
            m.put("description", row[6] != null ? row[6].toString() : null);
            m.put("description2", row[7] != null ? row[7].toString() : null);
            m.put("transactionCount", row[8]);
            return m;
        }).collect(Collectors.toList());

        result.put("transactions", transactions);

        // Pagination info
        result.put("page", page);
        result.put("size", size);
        result.put("totalElements", totalElements);
        result.put("totalPages", totalPages);
        result.put("first", page == 0);
        result.put("last", page >= totalPages - 1);

        // Totals (from all records, not just current page)
        result.put("totalTransactions", totalElements);
        result.put("totalDebits", totalDebits);
        result.put("totalCredits", totalCredits);
        result.put("balance", totalDebits.subtract(totalCredits));

        return ResponseEntity.ok(result);
    }
}
