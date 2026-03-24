package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.PendingEventApprovalReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for pending event approvals.
 */
@Repository
public interface PendingEventApprovalRepository extends JpaRepository<PendingEventApprovalReadModel, Long> {

    /**
     * Find by approval ID
     */
    Optional<PendingEventApprovalReadModel> findByApprovalId(String approvalId);

    /**
     * Find all pending approvals
     */
    List<PendingEventApprovalReadModel> findByStatusOrderBySubmittedAtDesc(String status);

    /**
     * Find pending approvals by product type
     */
    List<PendingEventApprovalReadModel> findByStatusAndProductTypeOrderBySubmittedAtDesc(String status, String productType);

    /**
     * Find pending approvals by approval type (NEW_OPERATION or OPERATION_EVENT)
     */
    List<PendingEventApprovalReadModel> findByStatusAndApprovalTypeOrderBySubmittedAtDesc(String status, String approvalType);

    /**
     * Find all pending approvals (both new operations and events)
     */
    @Query("SELECT p FROM PendingEventApprovalReadModel p " +
           "WHERE p.status = 'PENDING' " +
           "ORDER BY p.priority DESC, p.submittedAt ASC")
    List<PendingEventApprovalReadModel> findAllPending();

    /**
     * Find pending approvals for a specific operation
     */
    List<PendingEventApprovalReadModel> findByOperationIdAndStatusOrderBySubmittedAtDesc(String operationId, String status);

    /**
     * Find pending approvals for a specific draft
     */
    Optional<PendingEventApprovalReadModel> findByDraftIdAndStatus(String draftId, String status);

    /**
     * Count pending approvals by type
     */
    @Query("SELECT p.approvalType, COUNT(p) FROM PendingEventApprovalReadModel p " +
           "WHERE p.status = 'PENDING' GROUP BY p.approvalType")
    List<Object[]> countPendingByType();

    /**
     * Count pending approvals by product type
     */
    @Query("SELECT p.productType, COUNT(p) FROM PendingEventApprovalReadModel p " +
           "WHERE p.status = 'PENDING' GROUP BY p.productType")
    List<Object[]> countPendingByProductType();

    /**
     * Count all pending
     */
    long countByStatus(String status);

    /**
     * Find approvals submitted by a user
     */
    List<PendingEventApprovalReadModel> findBySubmittedByOrderBySubmittedAtDesc(String submittedBy);

    /**
     * Find approvals reviewed by a user
     */
    List<PendingEventApprovalReadModel> findByReviewedByOrderByReviewedAtDesc(String reviewedBy);

    /**
     * Check if there's already a pending approval for an operation event
     */
    boolean existsByOperationIdAndEventCodeAndStatus(String operationId, String eventCode, String status);

    /**
     * Search pending approvals
     */
    @Query("SELECT p FROM PendingEventApprovalReadModel p " +
           "WHERE p.status = :status " +
           "AND (LOWER(p.reference) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(p.eventName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(p.applicantName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(p.beneficiaryName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(p.submittedBy) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY p.priority DESC, p.submittedAt ASC")
    List<PendingEventApprovalReadModel> searchPending(@Param("status") String status, @Param("search") String search);

    /**
     * Get distinct operation IDs that have pending approvals
     */
    @Query("SELECT DISTINCT p.operationId FROM PendingEventApprovalReadModel p " +
           "WHERE p.status = 'PENDING' AND p.operationId IS NOT NULL")
    List<String> findPendingOperationIds();

    /**
     * Find the latest rejected approval for a draft (to get field comments)
     */
    @Query("SELECT p FROM PendingEventApprovalReadModel p " +
           "WHERE p.draftId = :draftId AND p.status = 'REJECTED' " +
           "ORDER BY p.reviewedAt DESC")
    List<PendingEventApprovalReadModel> findRejectedByDraftId(@Param("draftId") String draftId);

    /**
     * Count approvals by operationId and eventCode containing a pattern
     */
    @Query("SELECT COUNT(p) FROM PendingEventApprovalReadModel p " +
           "WHERE p.operationId = :operationId AND p.eventCode LIKE CONCAT('%', :eventCodePattern, '%')")
    long countByOperationIdAndEventCodeContaining(@Param("operationId") String operationId,
                                                   @Param("eventCodePattern") String eventCodePattern);
}
