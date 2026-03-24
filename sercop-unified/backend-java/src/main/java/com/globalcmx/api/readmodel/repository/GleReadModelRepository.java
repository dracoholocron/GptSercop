package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.GleReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GleReadModelRepository extends JpaRepository<GleReadModel, Long> {

    // Buscar por cuenta (contiene)
    List<GleReadModel> findByActContainingIgnoreCase(String act);

    // Buscar por cuenta que inicie con prefijo
    List<GleReadModel> findByActStartingWithIgnoreCase(String prefix);

    // Buscar por moneda
    List<GleReadModel> findByCur(String cur);

    // Buscar por rango de fechas de valor
    List<GleReadModel> findByValdatBetween(LocalDateTime start, LocalDateTime end);

    // Buscar por tipo débito/crédito
    List<GleReadModel> findByDbtcdt(String dbtcdt);

    // Resumen por cuenta
    @Query("SELECT g.act, g.dbtcdt, g.cur, SUM(g.amt) as total " +
           "FROM GleReadModel g " +
           "GROUP BY g.act, g.dbtcdt, g.cur " +
           "ORDER BY g.act")
    List<Object[]> getSummaryByAccount();

    // Resumen por moneda
    @Query("SELECT g.cur, g.dbtcdt, SUM(g.amt) as total, COUNT(g) as count " +
           "FROM GleReadModel g " +
           "GROUP BY g.cur, g.dbtcdt " +
           "ORDER BY g.cur")
    List<Object[]> getSummaryByCurrency();

    // Resumen mensual
    @Query(value = "SELECT DATE_FORMAT(valdat, '%Y-%m') as month, dbtcdt, cur, SUM(amt) as total, COUNT(*) as count " +
                   "FROM gle_read_model " +
                   "WHERE valdat IS NOT NULL " +
                   "GROUP BY DATE_FORMAT(valdat, '%Y-%m'), dbtcdt, cur " +
                   "ORDER BY month DESC", nativeQuery = true)
    List<Object[]> getMonthlySummary();

    // Total de débitos y créditos
    @Query("SELECT g.dbtcdt, SUM(g.amt) as total, COUNT(g) as count " +
           "FROM GleReadModel g " +
           "GROUP BY g.dbtcdt")
    List<Object[]> getTotalsByType();

    // Buscar por texto
    @Query("SELECT g FROM GleReadModel g WHERE " +
           "LOWER(g.txt1) LIKE LOWER(CONCAT('%', :text, '%')) OR " +
           "LOWER(g.txt2) LIKE LOWER(CONCAT('%', :text, '%')) OR " +
           "LOWER(g.txt3) LIKE LOWER(CONCAT('%', :text, '%'))")
    List<GleReadModel> findByTextContaining(@Param("text") String text);

    // Últimas N entradas
    List<GleReadModel> findTop100ByOrderByValdatDesc();

    // Total por cuenta y moneda en un período
    @Query("SELECT g.act, g.cur, g.dbtcdt, SUM(g.amt) as total " +
           "FROM GleReadModel g " +
           "WHERE g.valdat BETWEEN :start AND :end " +
           "GROUP BY g.act, g.cur, g.dbtcdt " +
           "ORDER BY total DESC")
    List<Object[]> getAccountSummaryByPeriod(@Param("start") LocalDateTime start,
                                              @Param("end") LocalDateTime end);

    // Contar entradas
    long count();

    // Buscar por referencia de operación
    List<GleReadModel> findByReferenceContainingIgnoreCase(String reference);

    // Buscar por referencia exacta
    List<GleReadModel> findByReference(String reference);

    // Buscar por referencia que inicie con prefijo
    List<GleReadModel> findByReferenceStartingWithIgnoreCase(String prefix);

    // Resumen por referencia de operación
    @Query("SELECT g.reference, g.dbtcdt, g.cur, SUM(g.amt) as total, COUNT(g) as count " +
           "FROM GleReadModel g " +
           "WHERE g.reference = :reference " +
           "GROUP BY g.reference, g.dbtcdt, g.cur")
    List<Object[]> getSummaryByReference(@Param("reference") String reference);

    // Resumen por referencia que inicie con prefijo
    @Query("SELECT g.reference, g.dbtcdt, g.cur, SUM(g.amt) as total, COUNT(g) as count " +
           "FROM GleReadModel g " +
           "WHERE UPPER(g.reference) LIKE UPPER(CONCAT(:prefix, '%')) " +
           "GROUP BY g.reference, g.dbtcdt, g.cur")
    List<Object[]> getSummaryByReferencePrefix(@Param("prefix") String prefix);

    /**
     * Informe global por cuenta contable - Análisis financiero
     * Agrupa por moneda y cuenta
     * Calcula débitos, créditos, saldo y conteo de operaciones
     * Filtra cuentas con longitud >= 15 y saldo positivo
     * productType se obtiene de operation_readmodel via JOIN con reference
     */
    @Query(value = """
        SELECT
            a.currency,
            a.account,
            a.debito,
            a.credito,
            a.saldo,
            COALESCE(r.refCount, 0) as operationCount,
            COALESCE(p.product_type, '') as productType
        FROM (
            SELECT
                grm.cur as currency,
                grm.act as account,
                SUM(CASE WHEN grm.dbtcdt = 'D' THEN grm.amt ELSE 0 END) as debito,
                SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE 0 END) as credito,
                SUM(CASE WHEN grm.dbtcdt = 'D' THEN grm.amt ELSE 0 END) -
                SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE 0 END) as saldo
            FROM gle_read_model grm
            WHERE LENGTH(grm.act) >= 15
            GROUP BY grm.cur, grm.act
            HAVING saldo > 0
        ) a
        LEFT JOIN (
            SELECT cur, act, COUNT(*) as refCount
            FROM (
                SELECT cur, act, referencia
                FROM gle_read_model
                WHERE reference IS NOT NULL AND reference != ''
                GROUP BY cur, act, reference
                HAVING ABS(SUM(CASE WHEN dbtcdt = 'D' THEN amt ELSE 0 END) -
                           SUM(CASE WHEN dbtcdt = 'C' THEN amt ELSE 0 END)) > 0.01
            ) open_refs
            GROUP BY cur, act
        ) r ON a.currency = r.cur AND a.account = r.act
        LEFT JOIN (
            SELECT g.cur, g.act, o.product_type,
                   ROW_NUMBER() OVER (PARTITION BY g.cur, g.act ORDER BY COUNT(*) DESC) as rn
            FROM gle_read_model g
            JOIN operation_readmodel o ON g.reference = o.reference
            WHERE g.reference IS NOT NULL AND g.reference != ''
            GROUP BY g.cur, g.act, o.product_type
        ) p ON a.currency = p.cur AND a.account = p.act AND p.rn = 1
        ORDER BY a.currency, a.account
        """, nativeQuery = true)
    List<Object[]> getGlobalAccountBalances();

    /**
     * Informe global por cuenta contable - Sin filtro de saldo positivo
     * Para mostrar todas las cuentas con su saldo y conteo de operaciones
     * productType se obtiene de operation_readmodel via JOIN con reference
     */
    @Query(value = """
        SELECT
            a.currency,
            a.account,
            a.debito,
            a.credito,
            a.saldo,
            COALESCE(r.refCount, 0) as operationCount,
            COALESCE(p.product_type, '') as productType
        FROM (
            SELECT
                grm.cur as currency,
                grm.act as account,
                SUM(CASE WHEN grm.dbtcdt = 'D' THEN grm.amt ELSE 0 END) as debito,
                SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE 0 END) as credito,
                SUM(CASE WHEN grm.dbtcdt = 'D' THEN grm.amt ELSE 0 END) -
                SUM(CASE WHEN grm.dbtcdt = 'C' THEN grm.amt ELSE 0 END) as saldo
            FROM gle_read_model grm
            WHERE LENGTH(grm.act) >= 15
            GROUP BY grm.cur, grm.act
            HAVING saldo != 0
        ) a
        LEFT JOIN (
            SELECT cur, act, COUNT(*) as refCount
            FROM (
                SELECT cur, act, referencia
                FROM gle_read_model
                WHERE reference IS NOT NULL AND reference != ''
                GROUP BY cur, act, reference
                HAVING ABS(SUM(CASE WHEN dbtcdt = 'D' THEN amt ELSE 0 END) -
                           SUM(CASE WHEN dbtcdt = 'C' THEN amt ELSE 0 END)) > 0.01
            ) open_refs
            GROUP BY cur, act
        ) r ON a.currency = r.cur AND a.account = r.act
        LEFT JOIN (
            SELECT g.cur, g.act, o.product_type,
                   ROW_NUMBER() OVER (PARTITION BY g.cur, g.act ORDER BY COUNT(*) DESC) as rn
            FROM gle_read_model g
            JOIN operation_readmodel o ON g.reference = o.reference
            WHERE g.reference IS NOT NULL AND g.reference != ''
            GROUP BY g.cur, g.act, o.product_type
        ) p ON a.currency = p.cur AND a.account = p.act AND p.rn = 1
        ORDER BY a.currency, a.account
        """, nativeQuery = true)
    List<Object[]> getGlobalAccountBalancesAll();

    /**
     * Obtener saldo pendiente por referencia de operación.
     * Usa accounting_nature de product_type_config para determinar la dirección del cálculo:
     * - DEBIT: saldo = SUM(débitos) - SUM(créditos) (default para LC, Garantías)
     * - CREDIT: saldo = SUM(créditos) - SUM(débitos) (para Cobranzas)
     * Retorna reference y saldo.
     */
    @Query(value = """
        SELECT
            g.reference,
            SUM(
                CASE
                    WHEN COALESCE(ptc.accounting_nature, 'DEBIT') = 'CREDIT' THEN
                        CASE WHEN g.dbtcdt = 'C' THEN g.amt ELSE -g.amt END
                    ELSE
                        CASE WHEN g.dbtcdt = 'D' THEN g.amt ELSE -g.amt END
                END
            ) as saldo
        FROM gle_read_model g
        LEFT JOIN operation_readmodel o ON g.reference = o.reference
        LEFT JOIN product_type_config ptc ON o.product_type = ptc.product_type
        WHERE g.reference IN :references
        AND LEFT(g.act, 4) IN ('6301', '6302', '6303', '7301', '7390')
        GROUP BY g.reference
        HAVING ABS(saldo) > 0.01
        """, nativeQuery = true)
    List<Object[]> getPendingBalanceByReferences(@Param("references") List<String> references);

    /**
     * Obtener saldo pendiente agrupado por product_type y moneda.
     * Para el reporte de Business Intelligence.
     */
    @Query(value = """
        SELECT
            product_type as productType,
            cur as currency,
            COUNT(DISTINCT referencia) as operationCount,
            SUM(CASE WHEN dbtcdt = 'D' THEN amt ELSE -amt END) as pendingBalance
        FROM gle_read_model
        WHERE LEFT(act, 4) IN ('6301', '6302', '6303', '7301', '7390')
        AND product_type IS NOT NULL
        GROUP BY product_type, cur
        HAVING ABS(pendingBalance) > 0.01
        ORDER BY product_type, cur
        """, nativeQuery = true)
    List<Object[]> getPendingBalanceByProductType();
}
