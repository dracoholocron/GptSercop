package com.globalcmx.api.security.schedule.repository;

import com.globalcmx.api.security.schedule.entity.AccessResult;
import com.globalcmx.api.security.schedule.entity.SystemScheduleAccessLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SystemScheduleAccessLogRepository extends JpaRepository<SystemScheduleAccessLog, Long> {

    /**
     * Encuentra logs de acceso de un usuario.
     */
    Page<SystemScheduleAccessLog> findByUserId(Long userId, Pageable pageable);

    /**
     * Encuentra logs de acceso por resultado.
     */
    Page<SystemScheduleAccessLog> findByAccessResult(AccessResult result, Pageable pageable);

    /**
     * Encuentra logs de acceso en un rango de fechas.
     */
    @Query("SELECT l FROM SystemScheduleAccessLog l WHERE l.accessTimestamp BETWEEN :startDate AND :endDate " +
           "ORDER BY l.accessTimestamp DESC")
    Page<SystemScheduleAccessLog> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    /**
     * Encuentra accesos denegados en un período.
     */
    @Query("SELECT l FROM SystemScheduleAccessLog l WHERE l.accessResult = 'DENIED' " +
           "AND l.accessTimestamp BETWEEN :startDate AND :endDate " +
           "ORDER BY l.accessTimestamp DESC")
    List<SystemScheduleAccessLog> findDeniedAccessInPeriod(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Cuenta accesos por resultado en un período.
     */
    @Query("SELECT l.accessResult, COUNT(l) FROM SystemScheduleAccessLog l " +
           "WHERE l.accessTimestamp BETWEEN :startDate AND :endDate " +
           "GROUP BY l.accessResult")
    List<Object[]> countByResultInPeriod(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Encuentra los últimos accesos de un usuario.
     */
    List<SystemScheduleAccessLog> findTop10ByUserIdOrderByAccessTimestampDesc(Long userId);

    /**
     * Cuenta intentos de acceso denegados de un usuario hoy.
     */
    @Query("SELECT COUNT(l) FROM SystemScheduleAccessLog l WHERE l.userId = :userId " +
           "AND l.accessResult = 'DENIED' AND l.accessTimestamp >= :since")
    long countDeniedAccessSince(
            @Param("userId") Long userId,
            @Param("since") LocalDateTime since);
}
