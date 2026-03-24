package com.globalcmx.api.compraspublicas.ai.repository;

import com.globalcmx.api.compraspublicas.ai.entity.CPHistoricalPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Repositorio para precios históricos de contratación pública.
 */
@Repository
public interface CPHistoricalPriceRepository extends JpaRepository<CPHistoricalPrice, Long> {

    /**
     * Busca precios por código CPC ordenados por fecha
     */
    List<CPHistoricalPrice> findByCpcCodeOrderByAdjudicationDateDesc(String cpcCode);

    /**
     * Busca precios por CPC en un rango de fechas
     */
    List<CPHistoricalPrice> findByCpcCodeAndAdjudicationDateBetweenOrderByAdjudicationDateDesc(
            String cpcCode, LocalDate startDate, LocalDate endDate);

    /**
     * Busca precios por entidad
     */
    List<CPHistoricalPrice> findByEntityRucOrderByAdjudicationDateDesc(String entityRuc);

    /**
     * Busca precios por proveedor
     */
    List<CPHistoricalPrice> findBySupplierRucOrderByAdjudicationDateDesc(String supplierRuc);

    /**
     * Busca precios por provincia
     */
    List<CPHistoricalPrice> findByCpcCodeAndProvinceOrderByAdjudicationDateDesc(
            String cpcCode, String province);

    /**
     * Obtiene estadísticas de precios por CPC
     */
    @Query("SELECT " +
           "AVG(p.unitPrice) as avgPrice, " +
           "MIN(p.unitPrice) as minPrice, " +
           "MAX(p.unitPrice) as maxPrice, " +
           "COUNT(p) as sampleCount " +
           "FROM CPHistoricalPrice p " +
           "WHERE p.cpcCode = :cpcCode")
    Map<String, Object> getPriceStatsByCpc(@Param("cpcCode") String cpcCode);

    /**
     * Busca por descripción (fulltext search)
     */
    @Query("SELECT p FROM CPHistoricalPrice p " +
           "WHERE p.itemDescription LIKE %:searchTerm% " +
           "OR p.cpcDescription LIKE %:searchTerm% " +
           "ORDER BY p.adjudicationDate DESC")
    List<CPHistoricalPrice> searchByDescription(@Param("searchTerm") String searchTerm);

    /**
     * Cuenta procesos de un proveedor en un período
     */
    @Query("SELECT COUNT(DISTINCT p.processCode) " +
           "FROM CPHistoricalPrice p " +
           "WHERE p.supplierRuc = :supplierRuc " +
           "AND p.adjudicationDate BETWEEN :startDate AND :endDate")
    Long countProcessesBySupplier(
            @Param("supplierRuc") String supplierRuc,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
