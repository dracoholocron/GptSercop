package com.globalcmx.api.security.schedule.repository;

import com.globalcmx.api.security.schedule.entity.ApprovalStatus;
import com.globalcmx.api.security.schedule.entity.ExceptionType;
import com.globalcmx.api.security.schedule.entity.SystemScheduleException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SystemScheduleExceptionRepository extends JpaRepository<SystemScheduleException, Long> {

    /**
     * Encuentra excepciones aprobadas y activas para una fecha específica.
     */
    @Query("SELECT se FROM SystemScheduleException se WHERE se.exceptionDate = :date " +
           "AND se.approvalStatus = 'APPROVED' AND se.isActive = true " +
           "ORDER BY se.exceptionType")
    List<SystemScheduleException> findApprovedByDate(@Param("date") LocalDate date);

    /**
     * Encuentra excepciones de usuario aprobadas para una fecha.
     */
    @Query("SELECT se FROM SystemScheduleException se WHERE se.exceptionDate = :date " +
           "AND se.exceptionType = 'USER' AND se.targetId = :userId " +
           "AND se.approvalStatus = 'APPROVED' AND se.isActive = true")
    List<SystemScheduleException> findApprovedUserExceptions(
            @Param("date") LocalDate date,
            @Param("userId") Long userId);

    /**
     * Encuentra excepciones de rol aprobadas para una fecha.
     */
    @Query("SELECT se FROM SystemScheduleException se WHERE se.exceptionDate = :date " +
           "AND se.exceptionType = 'ROLE' AND se.targetId IN :roleIds " +
           "AND se.approvalStatus = 'APPROVED' AND se.isActive = true")
    List<SystemScheduleException> findApprovedRoleExceptions(
            @Param("date") LocalDate date,
            @Param("roleIds") List<Long> roleIds);

    /**
     * Encuentra excepciones globales aprobadas para una fecha.
     */
    @Query("SELECT se FROM SystemScheduleException se WHERE se.exceptionDate = :date " +
           "AND se.exceptionType = 'GLOBAL' " +
           "AND se.approvalStatus = 'APPROVED' AND se.isActive = true")
    List<SystemScheduleException> findApprovedGlobalExceptions(@Param("date") LocalDate date);

    /**
     * Encuentra todas las excepciones pendientes de aprobación.
     */
    List<SystemScheduleException> findByApprovalStatusAndIsActiveTrue(ApprovalStatus status);

    /**
     * Encuentra excepciones para un rango de fechas.
     */
    @Query("SELECT se FROM SystemScheduleException se WHERE se.exceptionDate BETWEEN :startDate AND :endDate " +
           "AND se.isActive = true ORDER BY se.exceptionDate")
    List<SystemScheduleException> findByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Encuentra excepciones por tipo.
     */
    List<SystemScheduleException> findByExceptionTypeAndIsActiveTrue(ExceptionType type);
}
