package com.globalcmx.api.clientportal.repository;

import com.globalcmx.api.clientportal.entity.StageApprovalChain;
import com.globalcmx.api.clientportal.entity.StageApprovalChain.ApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for StageApprovalChain entity.
 * Tracks multi-level approval progress for client requests.
 */
@Repository
public interface StageApprovalChainRepository extends JpaRepository<StageApprovalChain, Long> {

    /**
     * Find all approval chain entries for a request, ordered by level.
     */
    List<StageApprovalChain> findByRequestIdOrderByApprovalLevelAsc(String requestId);

    /**
     * Find approval chain entries for a request and stage.
     */
    List<StageApprovalChain> findByRequestIdAndStageCodeOrderByApprovalLevelAsc(String requestId, String stageCode);

    /**
     * Find pending approval for a request and stage.
     */
    Optional<StageApprovalChain> findFirstByRequestIdAndStageCodeAndStatusOrderByApprovalLevelAsc(
            String requestId, String stageCode, ApprovalStatus status);

    /**
     * Find specific approval level for a request and stage.
     */
    Optional<StageApprovalChain> findByRequestIdAndStageCodeAndApprovalLevel(
            String requestId, String stageCode, Integer approvalLevel);

    /**
     * Count pending approvals for a request and stage.
     */
    long countByRequestIdAndStageCodeAndStatus(String requestId, String stageCode, ApprovalStatus status);

    /**
     * Check if all approvals are complete for a request and stage.
     */
    @Query("SELECT CASE WHEN COUNT(sac) = 0 THEN true ELSE false END " +
           "FROM StageApprovalChain sac " +
           "WHERE sac.requestId = :requestId " +
           "AND sac.stageCode = :stageCode " +
           "AND sac.status = 'PENDING'")
    boolean areAllApprovalsComplete(@Param("requestId") String requestId, @Param("stageCode") String stageCode);

    /**
     * Check if any approval was rejected for a request and stage.
     */
    @Query("SELECT CASE WHEN COUNT(sac) > 0 THEN true ELSE false END " +
           "FROM StageApprovalChain sac " +
           "WHERE sac.requestId = :requestId " +
           "AND sac.stageCode = :stageCode " +
           "AND sac.status = 'REJECTED'")
    boolean hasRejection(@Param("requestId") String requestId, @Param("stageCode") String stageCode);

    /**
     * Get the current pending approval level for a request and stage.
     */
    @Query("SELECT MIN(sac.approvalLevel) FROM StageApprovalChain sac " +
           "WHERE sac.requestId = :requestId " +
           "AND sac.stageCode = :stageCode " +
           "AND sac.status = 'PENDING'")
    Integer getCurrentPendingLevel(@Param("requestId") String requestId, @Param("stageCode") String stageCode);

    /**
     * Delete all approval chain entries for a request.
     */
    @Modifying
    void deleteByRequestId(String requestId);

    /**
     * Delete approval chain entries for a request and stage.
     */
    @Modifying
    void deleteByRequestIdAndStageCode(String requestId, String stageCode);

    /**
     * Find all pending approvals for a specific role.
     */
    @Query("SELECT sac FROM StageApprovalChain sac " +
           "WHERE sac.requiredRole = :roleName " +
           "AND sac.status = 'PENDING' " +
           "ORDER BY sac.createdAt ASC")
    List<StageApprovalChain> findPendingByRole(@Param("roleName") String roleName);

    /**
     * Find all pending approvals for multiple roles.
     */
    @Query("SELECT sac FROM StageApprovalChain sac " +
           "WHERE sac.requiredRole IN :roleNames " +
           "AND sac.status = 'PENDING' " +
           "ORDER BY sac.createdAt ASC")
    List<StageApprovalChain> findPendingByRoles(@Param("roleNames") List<String> roleNames);

    /**
     * Count pending approvals by role.
     */
    @Query("SELECT COUNT(sac) FROM StageApprovalChain sac " +
           "WHERE sac.requiredRole = :roleName " +
           "AND sac.status = 'PENDING'")
    long countPendingByRole(@Param("roleName") String roleName);

    /**
     * Get approval history for a request.
     */
    @Query("SELECT sac FROM StageApprovalChain sac " +
           "WHERE sac.requestId = :requestId " +
           "AND sac.status != 'PENDING' " +
           "ORDER BY sac.approvedAt ASC")
    List<StageApprovalChain> findApprovalHistoryByRequest(@Param("requestId") String requestId);

    /**
     * Find the next pending approval that a user with specific roles can approve.
     */
    @Query("SELECT sac FROM StageApprovalChain sac " +
           "WHERE sac.requestId = :requestId " +
           "AND sac.stageCode = :stageCode " +
           "AND sac.status = 'PENDING' " +
           "AND sac.requiredRole IN :userRoles " +
           "AND sac.approvalLevel = (" +
           "    SELECT MIN(sac2.approvalLevel) FROM StageApprovalChain sac2 " +
           "    WHERE sac2.requestId = :requestId " +
           "    AND sac2.stageCode = :stageCode " +
           "    AND sac2.status = 'PENDING'" +
           ")")
    Optional<StageApprovalChain> findNextPendingApprovalForUser(
            @Param("requestId") String requestId,
            @Param("stageCode") String stageCode,
            @Param("userRoles") List<String> userRoles);

    /**
     * Check if user can approve at current level.
     */
    @Query("SELECT CASE WHEN COUNT(sac) > 0 THEN true ELSE false END " +
           "FROM StageApprovalChain sac " +
           "WHERE sac.requestId = :requestId " +
           "AND sac.stageCode = :stageCode " +
           "AND sac.status = 'PENDING' " +
           "AND sac.requiredRole IN :userRoles " +
           "AND sac.approvalLevel = (" +
           "    SELECT MIN(sac2.approvalLevel) FROM StageApprovalChain sac2 " +
           "    WHERE sac2.requestId = :requestId " +
           "    AND sac2.stageCode = :stageCode " +
           "    AND sac2.status = 'PENDING'" +
           ")")
    boolean canUserApprove(
            @Param("requestId") String requestId,
            @Param("stageCode") String stageCode,
            @Param("userRoles") List<String> userRoles);
}
