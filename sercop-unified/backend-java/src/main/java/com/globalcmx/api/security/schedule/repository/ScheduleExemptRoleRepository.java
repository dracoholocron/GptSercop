package com.globalcmx.api.security.schedule.repository;

import com.globalcmx.api.security.schedule.entity.ScheduleExemptRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduleExemptRoleRepository extends JpaRepository<ScheduleExemptRole, Long> {

    /**
     * Encuentra exención activa y vigente para un rol.
     */
    @Query("SELECT e FROM ScheduleExemptRole e WHERE e.role.id = :roleId " +
           "AND e.isActive = true " +
           "AND (e.validFrom IS NULL OR e.validFrom <= :now) " +
           "AND (e.validUntil IS NULL OR e.validUntil >= :now)")
    Optional<ScheduleExemptRole> findActiveByRoleId(@Param("roleId") Long roleId, @Param("now") LocalDateTime now);

    /**
     * Encuentra exenciones activas para una lista de roles.
     */
    @Query("SELECT e FROM ScheduleExemptRole e WHERE e.role.id IN :roleIds " +
           "AND e.isActive = true " +
           "AND (e.validFrom IS NULL OR e.validFrom <= :now) " +
           "AND (e.validUntil IS NULL OR e.validUntil >= :now)")
    List<ScheduleExemptRole> findActiveByRoleIds(@Param("roleIds") List<Long> roleIds, @Param("now") LocalDateTime now);

    /**
     * Verifica si existe una exención activa para cualquiera de los roles.
     */
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM ScheduleExemptRole e " +
           "WHERE e.role.id IN :roleIds AND e.isActive = true " +
           "AND (e.validFrom IS NULL OR e.validFrom <= :now) " +
           "AND (e.validUntil IS NULL OR e.validUntil >= :now)")
    boolean existsActiveByRoleIds(@Param("roleIds") List<Long> roleIds, @Param("now") LocalDateTime now);

    /**
     * Encuentra todas las exenciones activas.
     */
    List<ScheduleExemptRole> findByIsActiveTrueOrderByCreatedAtDesc();

    /**
     * Encuentra todas las exenciones (activas e inactivas).
     */
    List<ScheduleExemptRole> findAllByOrderByCreatedAtDesc();

    /**
     * Encuentra exención por rol ID.
     */
    Optional<ScheduleExemptRole> findByRoleId(Long roleId);

    /**
     * Verifica si ya existe una exención para el rol.
     */
    boolean existsByRoleId(Long roleId);
}
