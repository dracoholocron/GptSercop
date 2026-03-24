package com.globalcmx.api.security.schedule.repository;

import com.globalcmx.api.security.schedule.entity.SystemScheduleRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemScheduleRoleRepository extends JpaRepository<SystemScheduleRole, Long> {

    /**
     * Encuentra horarios activos para un rol específico.
     */
    @Query("SELECT sr FROM SystemScheduleRole sr WHERE sr.role.id = :roleId AND sr.isActive = true ORDER BY sr.priority DESC")
    List<SystemScheduleRole> findActiveByRoleId(@Param("roleId") Long roleId);

    /**
     * Encuentra todos los horarios de un rol.
     */
    List<SystemScheduleRole> findByRoleId(Long roleId);

    /**
     * Encuentra horarios activos para múltiples roles, ordenados por prioridad.
     */
    @Query("SELECT sr FROM SystemScheduleRole sr WHERE sr.role.id IN :roleIds AND sr.isActive = true ORDER BY sr.priority DESC")
    List<SystemScheduleRole> findActiveByRoleIds(@Param("roleIds") List<Long> roleIds);

    /**
     * Encuentra todos los horarios activos.
     */
    List<SystemScheduleRole> findByIsActiveTrue();

    /**
     * Verifica si un rol ya tiene un horario configurado.
     */
    boolean existsByRoleIdAndIsActiveTrue(Long roleId);
}
