package com.globalcmx.api.compraspublicas.paa.repository;

import com.globalcmx.api.compraspublicas.paa.entity.CPPAAFieldChangeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CPPAAFieldChangeLogRepository extends JpaRepository<CPPAAFieldChangeLog, Long> {

    /**
     * Get the most recent change per field for a department plan (for diff highlighting).
     */
    @Query("SELECT c FROM CPPAAFieldChangeLog c WHERE c.departmentPlanId = :deptPlanId " +
           "AND c.id IN (SELECT MAX(c2.id) FROM CPPAAFieldChangeLog c2 " +
           "WHERE c2.departmentPlanId = :deptPlanId GROUP BY c2.fieldCode, c2.phaseIndex) " +
           "ORDER BY c.changedAt DESC")
    List<CPPAAFieldChangeLog> findLatestChangesPerField(@Param("deptPlanId") Long departmentPlanId);

    /**
     * Get recent changes for a specific field.
     */
    List<CPPAAFieldChangeLog> findByDepartmentPlanIdAndFieldCodeAndPhaseIndexOrderByChangedAtDesc(
            Long departmentPlanId, String fieldCode, Integer phaseIndex);

    /**
     * Get all recent changes for a department plan (last N).
     */
    List<CPPAAFieldChangeLog> findTop50ByDepartmentPlanIdOrderByChangedAtDesc(Long departmentPlanId);
}
