package com.globalcmx.api.security.schedule.repository;

import com.globalcmx.api.security.schedule.entity.SystemScheduleUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SystemScheduleUserRepository extends JpaRepository<SystemScheduleUser, Long> {

    /**
     * Encuentra horarios activos y vigentes para un usuario.
     */
    @Query("SELECT su FROM SystemScheduleUser su WHERE su.user.id = :userId " +
           "AND su.isActive = true " +
           "AND (su.validFrom IS NULL OR su.validFrom <= :date) " +
           "AND (su.validUntil IS NULL OR su.validUntil >= :date)")
    List<SystemScheduleUser> findActiveAndValidByUserId(
            @Param("userId") Long userId,
            @Param("date") LocalDate date);

    /**
     * Encuentra todos los horarios de un usuario.
     */
    List<SystemScheduleUser> findByUserId(Long userId);

    /**
     * Encuentra todos los horarios activos.
     */
    List<SystemScheduleUser> findByIsActiveTrue();

    /**
     * Encuentra horarios pendientes de aprobación.
     */
    @Query("SELECT su FROM SystemScheduleUser su WHERE su.approvedBy IS NULL AND su.isActive = true")
    List<SystemScheduleUser> findPendingApproval();

    /**
     * Encuentra horarios que vencen pronto.
     */
    @Query("SELECT su FROM SystemScheduleUser su WHERE su.validUntil IS NOT NULL " +
           "AND su.validUntil BETWEEN :startDate AND :endDate AND su.isActive = true")
    List<SystemScheduleUser> findExpiringSoon(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
