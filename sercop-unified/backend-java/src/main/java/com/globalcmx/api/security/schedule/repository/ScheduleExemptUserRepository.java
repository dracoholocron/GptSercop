package com.globalcmx.api.security.schedule.repository;

import com.globalcmx.api.security.schedule.entity.ScheduleExemptUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduleExemptUserRepository extends JpaRepository<ScheduleExemptUser, Long> {

    /**
     * Encuentra exención activa y vigente para un usuario.
     */
    @Query("SELECT e FROM ScheduleExemptUser e WHERE e.user.id = :userId " +
           "AND e.isActive = true " +
           "AND (e.validFrom IS NULL OR e.validFrom <= :now) " +
           "AND (e.validUntil IS NULL OR e.validUntil >= :now)")
    Optional<ScheduleExemptUser> findActiveByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Verifica si existe una exención activa para un usuario.
     */
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM ScheduleExemptUser e " +
           "WHERE e.user.id = :userId AND e.isActive = true " +
           "AND (e.validFrom IS NULL OR e.validFrom <= :now) " +
           "AND (e.validUntil IS NULL OR e.validUntil >= :now)")
    boolean existsActiveByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Encuentra todas las exenciones activas.
     */
    List<ScheduleExemptUser> findByIsActiveTrueOrderByCreatedAtDesc();

    /**
     * Encuentra todas las exenciones (activas e inactivas).
     */
    List<ScheduleExemptUser> findAllByOrderByCreatedAtDesc();

    /**
     * Encuentra exención por usuario ID.
     */
    Optional<ScheduleExemptUser> findByUserId(Long userId);

    /**
     * Verifica si ya existe una exención para el usuario.
     */
    boolean existsByUserId(Long userId);
}
