package com.globalcmx.api.ai.extraction.repository;

import com.globalcmx.api.ai.extraction.entity.ExtractionHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Repositorio para historial de extracciones con IA
 */
@Repository
public interface ExtractionHistoryRepository extends JpaRepository<ExtractionHistory, String> {

    /**
     * Busca extracciones con filtros
     */
    @Query("""
        SELECT h FROM ExtractionHistory h
        WHERE (:messageType IS NULL OR h.messageType = :messageType)
          AND (:provider IS NULL OR h.provider = :provider)
          AND (:status IS NULL OR h.status = :status)
          AND (:dateFrom IS NULL OR h.createdAt >= :dateFrom)
          AND (:dateTo IS NULL OR h.createdAt <= :dateTo)
          AND (:createdBy IS NULL OR h.createdBy = :createdBy)
        ORDER BY h.createdAt DESC
        """)
    Page<ExtractionHistory> findByFilters(
            @Param("messageType") String messageType,
            @Param("provider") String provider,
            @Param("status") String status,
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo,
            @Param("createdBy") String createdBy,
            Pageable pageable);

    /**
     * Cuenta extracciones por rango de fechas
     */
    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    /**
     * Cuenta por proveedor en rango de fechas
     */
    @Query("""
        SELECT h.provider as provider, COUNT(h) as count
        FROM ExtractionHistory h
        WHERE h.createdAt BETWEEN :from AND :to
        GROUP BY h.provider
        """)
    List<Map<String, Object>> countByProviderAndCreatedAtBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /**
     * Cuenta por tipo de mensaje en rango de fechas
     */
    @Query("""
        SELECT h.messageType as messageType, COUNT(h) as count
        FROM ExtractionHistory h
        WHERE h.createdAt BETWEEN :from AND :to
        GROUP BY h.messageType
        """)
    List<Map<String, Object>> countByMessageTypeAndCreatedAtBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /**
     * Suma del costo estimado en rango de fechas
     */
    @Query("""
        SELECT COALESCE(SUM(h.estimatedCost), 0)
        FROM ExtractionHistory h
        WHERE h.createdAt BETWEEN :from AND :to
        """)
    BigDecimal sumEstimatedCostByCreatedAtBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /**
     * Promedio de tiempo de procesamiento
     */
    @Query("""
        SELECT COALESCE(AVG(h.processingTimeMs), 0)
        FROM ExtractionHistory h
        WHERE h.createdAt BETWEEN :from AND :to
        """)
    Double avgProcessingTimeByCreatedAtBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /**
     * Últimas extracciones de un usuario
     */
    List<ExtractionHistory> findTop10ByCreatedByOrderByCreatedAtDesc(String createdBy);

    /**
     * Busca por operación asociada
     */
    List<ExtractionHistory> findByOperationIdOrderByCreatedAtDesc(Long operationId);

    /**
     * Estadísticas de uso por usuario en rango de fechas
     */
    @Query("""
        SELECT COUNT(h) as totalExtractions,
               COALESCE(SUM(h.fileSize), 0) as totalBytes,
               COALESCE(SUM(h.inputTokens), 0) as totalInputTokens,
               COALESCE(SUM(h.outputTokens), 0) as totalOutputTokens,
               COALESCE(SUM(h.estimatedCost), 0) as totalCost,
               COALESCE(AVG(h.processingTimeMs), 0) as avgProcessingTime,
               COALESCE(SUM(h.fieldsExtracted), 0) as totalFieldsExtracted
        FROM ExtractionHistory h
        WHERE h.createdBy = :userId
          AND h.createdAt BETWEEN :from AND :to
        """)
    Map<String, Object> getUserUsageStats(
            @Param("userId") String userId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /**
     * Cuenta extracciones de un usuario en el mes actual
     */
    @Query("""
        SELECT COUNT(h)
        FROM ExtractionHistory h
        WHERE h.createdBy = :userId
          AND h.createdAt >= :monthStart
        """)
    long countUserExtractionsThisMonth(
            @Param("userId") String userId,
            @Param("monthStart") LocalDateTime monthStart);

    /**
     * Costo total de un usuario en el mes actual
     */
    @Query("""
        SELECT COALESCE(SUM(h.estimatedCost), 0)
        FROM ExtractionHistory h
        WHERE h.createdBy = :userId
          AND h.createdAt >= :monthStart
        """)
    BigDecimal getUserMonthlyCost(
            @Param("userId") String userId,
            @Param("monthStart") LocalDateTime monthStart);

    /**
     * Historial reciente de un usuario con límite
     */
    @Query("""
        SELECT h FROM ExtractionHistory h
        WHERE h.createdBy = :userId
        ORDER BY h.createdAt DESC
        """)
    Page<ExtractionHistory> findRecentByUser(
            @Param("userId") String userId,
            Pageable pageable);
}
