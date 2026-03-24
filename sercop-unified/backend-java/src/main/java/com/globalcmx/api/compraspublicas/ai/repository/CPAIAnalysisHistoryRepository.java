package com.globalcmx.api.compraspublicas.ai.repository;

import com.globalcmx.api.compraspublicas.ai.entity.CPAIAnalysisHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Repositorio para historial de análisis de IA de Compras Públicas.
 */
@Repository
public interface CPAIAnalysisHistoryRepository extends JpaRepository<CPAIAnalysisHistory, String> {

    /**
     * Busca historial por tipo de análisis
     */
    List<CPAIAnalysisHistory> findByAnalysisTypeOrderByCreatedAtDesc(String analysisType);

    /**
     * Busca historial por proceso
     */
    List<CPAIAnalysisHistory> findByProcessIdOrderByCreatedAtDesc(String processId);

    /**
     * Busca historial por entidad
     */
    List<CPAIAnalysisHistory> findByEntityRucOrderByCreatedAtDesc(String entityRuc);

    /**
     * Busca historial por usuario
     */
    Page<CPAIAnalysisHistory> findByCreatedByOrderByCreatedAtDesc(String createdBy, Pageable pageable);

    /**
     * Búsqueda con filtros múltiples
     */
    @Query("SELECT h FROM CPAIAnalysisHistory h WHERE " +
           "(:analysisType IS NULL OR h.analysisType = :analysisType) AND " +
           "(:processId IS NULL OR h.processId = :processId) AND " +
           "(:entityRuc IS NULL OR h.entityRuc = :entityRuc) AND " +
           "(:createdBy IS NULL OR h.createdBy = :createdBy) AND " +
           "(:dateFrom IS NULL OR h.createdAt >= :dateFrom) AND " +
           "(:dateTo IS NULL OR h.createdAt <= :dateTo) " +
           "ORDER BY h.createdAt DESC")
    Page<CPAIAnalysisHistory> findWithFilters(
            @Param("analysisType") String analysisType,
            @Param("processId") String processId,
            @Param("entityRuc") String entityRuc,
            @Param("createdBy") String createdBy,
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo,
            Pageable pageable);

    /**
     * Estadísticas de uso
     */
    @Query("SELECT " +
           "h.analysisType as type, " +
           "COUNT(h) as count, " +
           "SUM(h.inputTokens) as totalInputTokens, " +
           "SUM(h.outputTokens) as totalOutputTokens, " +
           "SUM(h.estimatedCost) as totalCost " +
           "FROM CPAIAnalysisHistory h " +
           "WHERE h.createdAt BETWEEN :dateFrom AND :dateTo " +
           "GROUP BY h.analysisType")
    List<Map<String, Object>> getUsageStats(
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo);

    /**
     * Últimos análisis de un usuario
     */
    List<CPAIAnalysisHistory> findTop10ByCreatedByOrderByCreatedAtDesc(String createdBy);
}
