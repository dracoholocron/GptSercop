package com.globalcmx.api.security.repository;

import com.globalcmx.api.security.entity.RiskEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repositorio para eventos de riesgo (auditoría).
 */
@Repository
public interface RiskEventRepository extends JpaRepository<RiskEvent, Long> {

    /**
     * Obtener eventos por usuario.
     */
    Page<RiskEvent> findByUserId(Long userId, Pageable pageable);

    /**
     * Obtener eventos por username.
     */
    Page<RiskEvent> findByUsername(String username, Pageable pageable);

    /**
     * Obtener eventos por tipo.
     */
    Page<RiskEvent> findByEventType(RiskEvent.EventType eventType, Pageable pageable);

    /**
     * Obtener eventos con puntaje mayor al especificado.
     */
    Page<RiskEvent> findByTotalRiskScoreGreaterThanEqual(Integer minScore, Pageable pageable);

    /**
     * Obtener eventos por acción tomada.
     */
    Page<RiskEvent> findByActionTaken(RiskEvent.ActionTaken actionTaken, Pageable pageable);

    /**
     * Obtener eventos en un rango de fechas.
     */
    Page<RiskEvent> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    /**
     * Contar eventos por IP en las últimas N horas.
     */
    @Query("SELECT COUNT(e) FROM RiskEvent e WHERE e.ipAddress = :ip AND e.createdAt > :since")
    Long countByIpAddressSince(@Param("ip") String ipAddress, @Param("since") LocalDateTime since);

    /**
     * Contar eventos por usuario en las últimas N horas.
     */
    @Query("SELECT COUNT(e) FROM RiskEvent e WHERE e.userId = :userId AND e.createdAt > :since")
    Long countByUserIdSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    /**
     * Obtener últimos eventos de un usuario.
     */
    List<RiskEvent> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Obtener último evento de login por usuario.
     */
    @Query("SELECT e FROM RiskEvent e WHERE e.userId = :userId AND e.eventType = 'LOGIN' ORDER BY e.createdAt DESC")
    List<RiskEvent> findLastLoginByUserId(@Param("userId") Long userId, Pageable pageable);
}
