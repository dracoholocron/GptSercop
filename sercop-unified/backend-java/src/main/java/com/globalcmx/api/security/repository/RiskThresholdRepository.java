package com.globalcmx.api.security.repository;

import com.globalcmx.api.security.entity.RiskThreshold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para umbrales de riesgo.
 */
@Repository
public interface RiskThresholdRepository extends JpaRepository<RiskThreshold, Long> {

    /**
     * Obtener todos los umbrales habilitados ordenados por puntaje mínimo.
     */
    List<RiskThreshold> findByIsEnabledTrueOrderByMinScoreAsc();

    /**
     * Encontrar el umbral que corresponde a un puntaje específico.
     */
    @Query("SELECT t FROM RiskThreshold t WHERE t.isEnabled = true " +
           "AND t.minScore <= :score AND (t.maxScore IS NULL OR t.maxScore >= :score) " +
           "ORDER BY t.minScore DESC")
    List<RiskThreshold> findMatchingThresholds(@Param("score") Integer score);

    /**
     * Obtener umbral por nombre.
     */
    Optional<RiskThreshold> findByName(String name);

    /**
     * Obtener umbrales por acción.
     */
    List<RiskThreshold> findByActionAndIsEnabledTrue(RiskThreshold.RiskAction action);
}
