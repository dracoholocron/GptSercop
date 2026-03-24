package com.globalcmx.api.clientportal.repository;

import com.globalcmx.api.clientportal.entity.StageRoleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Repository for StageRoleAssignment entity.
 * Provides database-driven permission queries for the workflow system.
 */
@Repository
public interface StageRoleAssignmentRepository extends JpaRepository<StageRoleAssignment, Long> {

    /**
     * Find all active role assignments for a specific stage.
     */
    List<StageRoleAssignment> findByStageCodeAndIsActiveTrueOrderByApprovalLevelAsc(String stageCode);

    /**
     * Find role assignment for specific stage and role.
     */
    Optional<StageRoleAssignment> findByStageCodeAndRoleNameAndIsActiveTrue(String stageCode, String roleName);

    /**
     * Find all role assignments for a specific role.
     */
    List<StageRoleAssignment> findByRoleNameAndIsActiveTrue(String roleName);

    /**
     * Find roles that can view a specific stage.
     */
    @Query("SELECT sra FROM StageRoleAssignment sra " +
           "WHERE sra.stageCode = :stageCode " +
           "AND sra.canView = true " +
           "AND sra.isActive = true")
    List<StageRoleAssignment> findViewableByStage(@Param("stageCode") String stageCode);

    /**
     * Find roles that can execute in a specific stage.
     */
    @Query("SELECT sra FROM StageRoleAssignment sra " +
           "WHERE sra.stageCode = :stageCode " +
           "AND sra.canExecute = true " +
           "AND sra.isActive = true")
    List<StageRoleAssignment> findExecutableByStage(@Param("stageCode") String stageCode);

    /**
     * Find roles that can approve in a specific stage.
     */
    @Query("SELECT sra FROM StageRoleAssignment sra " +
           "WHERE sra.stageCode = :stageCode " +
           "AND sra.canApprove = true " +
           "AND sra.isActive = true " +
           "ORDER BY sra.approvalLevel ASC")
    List<StageRoleAssignment> findApproversByStage(@Param("stageCode") String stageCode);

    /**
     * Check if a role can view a specific stage.
     */
    @Query("SELECT CASE WHEN COUNT(sra) > 0 THEN true ELSE false END " +
           "FROM StageRoleAssignment sra " +
           "WHERE sra.stageCode = :stageCode " +
           "AND sra.roleName = :roleName " +
           "AND sra.canView = true " +
           "AND sra.isActive = true")
    boolean canRoleViewStage(@Param("stageCode") String stageCode, @Param("roleName") String roleName);

    /**
     * Check if a role can execute in a specific stage.
     */
    @Query("SELECT CASE WHEN COUNT(sra) > 0 THEN true ELSE false END " +
           "FROM StageRoleAssignment sra " +
           "WHERE sra.stageCode = :stageCode " +
           "AND sra.roleName = :roleName " +
           "AND sra.canExecute = true " +
           "AND sra.isActive = true")
    boolean canRoleExecuteInStage(@Param("stageCode") String stageCode, @Param("roleName") String roleName);

    /**
     * Check if a role can approve in a specific stage.
     */
    @Query("SELECT CASE WHEN COUNT(sra) > 0 THEN true ELSE false END " +
           "FROM StageRoleAssignment sra " +
           "WHERE sra.stageCode = :stageCode " +
           "AND sra.roleName = :roleName " +
           "AND sra.canApprove = true " +
           "AND sra.isActive = true")
    boolean canRoleApproveInStage(@Param("stageCode") String stageCode, @Param("roleName") String roleName);

    /**
     * Check if a role can reject in a specific stage.
     */
    @Query("SELECT CASE WHEN COUNT(sra) > 0 THEN true ELSE false END " +
           "FROM StageRoleAssignment sra " +
           "WHERE sra.stageCode = :stageCode " +
           "AND sra.roleName = :roleName " +
           "AND sra.canReject = true " +
           "AND sra.isActive = true")
    boolean canRoleRejectInStage(@Param("stageCode") String stageCode, @Param("roleName") String roleName);

    /**
     * Check if a role can return in a specific stage.
     */
    @Query("SELECT CASE WHEN COUNT(sra) > 0 THEN true ELSE false END " +
           "FROM StageRoleAssignment sra " +
           "WHERE sra.stageCode = :stageCode " +
           "AND sra.roleName = :roleName " +
           "AND sra.canReturn = true " +
           "AND sra.isActive = true")
    boolean canRoleReturnInStage(@Param("stageCode") String stageCode, @Param("roleName") String roleName);

    /**
     * Find role assignment for approval with amount check.
     */
    @Query("SELECT sra FROM StageRoleAssignment sra " +
           "WHERE sra.stageCode = :stageCode " +
           "AND sra.roleName = :roleName " +
           "AND sra.canApprove = true " +
           "AND sra.isActive = true " +
           "AND (sra.minAmount IS NULL OR sra.minAmount <= :amount) " +
           "AND (sra.maxAmount IS NULL OR sra.maxAmount >= :amount)")
    Optional<StageRoleAssignment> findApproverWithAmountCheck(
            @Param("stageCode") String stageCode,
            @Param("roleName") String roleName,
            @Param("amount") BigDecimal amount);

    /**
     * Get the maximum approval level for a stage.
     */
    @Query("SELECT MAX(sra.approvalLevel) FROM StageRoleAssignment sra " +
           "WHERE sra.stageCode = :stageCode " +
           "AND sra.canApprove = true " +
           "AND sra.isActive = true")
    Integer getMaxApprovalLevelForStage(@Param("stageCode") String stageCode);

    /**
     * Find all distinct stage codes.
     */
    @Query("SELECT DISTINCT sra.stageCode FROM StageRoleAssignment sra WHERE sra.isActive = true")
    List<String> findAllActiveStageCodes();

    /**
     * Check if any roles require approval for a stage.
     */
    @Query("SELECT CASE WHEN COUNT(sra) > 0 THEN true ELSE false END " +
           "FROM StageRoleAssignment sra " +
           "WHERE sra.stageCode = :stageCode " +
           "AND sra.canApprove = true " +
           "AND sra.approvalLevel IS NOT NULL " +
           "AND sra.isActive = true")
    boolean stageRequiresApproval(@Param("stageCode") String stageCode);

    /**
     * Find all roles that can approve at a specific level for a stage.
     */
    @Query("SELECT sra FROM StageRoleAssignment sra " +
           "WHERE sra.stageCode = :stageCode " +
           "AND sra.approvalLevel = :level " +
           "AND sra.canApprove = true " +
           "AND sra.isActive = true")
    List<StageRoleAssignment> findApproversByStageAndLevel(
            @Param("stageCode") String stageCode,
            @Param("level") Integer level);
}
