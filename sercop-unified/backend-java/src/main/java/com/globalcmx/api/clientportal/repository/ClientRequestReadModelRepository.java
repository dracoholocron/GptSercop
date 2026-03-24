package com.globalcmx.api.clientportal.repository;

import com.globalcmx.api.clientportal.entity.ClientRequestReadModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for ClientRequestReadModel entity operations.
 * This is the read-side repository following CQRS pattern.
 * Use this for all query/read operations.
 */
@Repository
public interface ClientRequestReadModelRepository extends JpaRepository<ClientRequestReadModel, String> {

    // Find by request number
    Optional<ClientRequestReadModel> findByRequestNumber(String requestNumber);

    // Find by draft ID (to link operation back to client request)
    Optional<ClientRequestReadModel> findByDraftId(String draftId);

    // Find all by client (with data isolation)
    Page<ClientRequestReadModel> findByClientId(String clientId, Pageable pageable);

    // Find by client and status
    Page<ClientRequestReadModel> findByClientIdAndStatus(String clientId, String status, Pageable pageable);

    // Find by client and product type
    Page<ClientRequestReadModel> findByClientIdAndProductType(String clientId, String productType, Pageable pageable);

    // Find drafts for a client
    List<ClientRequestReadModel> findByClientIdAndStatusOrderByCreatedAtDesc(String clientId, String status);

    // Count by client and status
    long countByClientIdAndStatus(String clientId, String status);

    // Count by client (all statuses)
    long countByClientId(String clientId);

    // Find by assigned user
    Page<ClientRequestReadModel> findByAssignedToUserId(String assignedToUserId, Pageable pageable);

    // Find pending requests (for backoffice)
    @Query("SELECT r FROM ClientRequestReadModel r WHERE r.status IN :statuses ORDER BY r.submittedAt ASC")
    Page<ClientRequestReadModel> findByStatusIn(@Param("statuses") List<String> statuses, Pageable pageable);

    // Find requests with SLA at risk
    @Query("SELECT r FROM ClientRequestReadModel r WHERE r.slaStatus = 'AT_RISK' AND r.status IN ('SUBMITTED', 'IN_REVIEW') ORDER BY r.slaDeadline ASC")
    List<ClientRequestReadModel> findSlaCritical();

    // Find requests with breached SLA
    @Query("SELECT r FROM ClientRequestReadModel r WHERE r.slaStatus = 'BREACHED' AND r.status IN ('SUBMITTED', 'IN_REVIEW') ORDER BY r.slaDeadline ASC")
    List<ClientRequestReadModel> findSlaBreached();

    // Statistics queries for dashboard
    @Query("SELECT COUNT(r) FROM ClientRequestReadModel r WHERE r.clientId = :clientId AND r.status = :status")
    long countByClientIdAndStatusForStats(@Param("clientId") String clientId, @Param("status") String status);

    @Query("SELECT SUM(r.amount) FROM ClientRequestReadModel r WHERE r.clientId = :clientId AND r.status = 'APPROVED' AND r.currency = :currency")
    java.math.BigDecimal sumApprovedAmountByClientAndCurrency(@Param("clientId") String clientId, @Param("currency") String currency);

    // Search with multiple criteria (using full-text search field)
    @Query("SELECT r FROM ClientRequestReadModel r WHERE " +
           "r.clientId = :clientId AND " +
           "(:productType IS NULL OR r.productType = :productType) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:searchTerm IS NULL OR r.searchText LIKE %:searchTerm%)")
    Page<ClientRequestReadModel> searchByClient(
            @Param("clientId") String clientId,
            @Param("productType") String productType,
            @Param("status") String status,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    // Search across multiple clients (for corporation users)
    @Query("SELECT r FROM ClientRequestReadModel r WHERE " +
           "r.clientId IN :clientIds AND " +
           "(:productType IS NULL OR r.productType = :productType) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:searchTerm IS NULL OR r.searchText LIKE %:searchTerm%) " +
           "ORDER BY r.createdAt DESC")
    Page<ClientRequestReadModel> searchByClients(
            @Param("clientIds") List<String> clientIds,
            @Param("productType") String productType,
            @Param("status") String status,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    // Backoffice search (all clients)
    @Query("SELECT r FROM ClientRequestReadModel r WHERE " +
           "(:clientId IS NULL OR r.clientId = :clientId) AND " +
           "(:productType IS NULL OR r.productType = :productType) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:assignedToUserId IS NULL OR r.assignedToUserId = :assignedToUserId) AND " +
           "(:priority IS NULL OR r.priority = :priority) AND " +
           "(:slaStatus IS NULL OR r.slaStatus = :slaStatus) AND " +
           "(:searchTerm IS NULL OR r.searchText LIKE %:searchTerm%)")
    Page<ClientRequestReadModel> searchAll(
            @Param("clientId") String clientId,
            @Param("productType") String productType,
            @Param("status") String status,
            @Param("assignedToUserId") String assignedToUserId,
            @Param("priority") String priority,
            @Param("slaStatus") String slaStatus,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    // Backoffice statistics
    @Query("SELECT COUNT(r) FROM ClientRequestReadModel r WHERE r.status = :status")
    long countByStatusForStats(@Param("status") String status);

    @Query("SELECT COUNT(r) FROM ClientRequestReadModel r WHERE r.assignedToUserId = :userId AND r.status IN ('SUBMITTED', 'IN_REVIEW', 'PENDING_DOCUMENTS')")
    long countActiveByAssignedUser(@Param("userId") String userId);

    @Query("SELECT COUNT(r) FROM ClientRequestReadModel r WHERE r.slaStatus = 'AT_RISK' AND r.status IN ('SUBMITTED', 'IN_REVIEW')")
    long countSlaAtRisk();

    @Query("SELECT COUNT(r) FROM ClientRequestReadModel r WHERE r.slaDeadline <= :deadline AND r.slaDeadline > CURRENT_TIMESTAMP AND r.status IN ('SUBMITTED', 'IN_REVIEW')")
    long countSlaAtRisk(@Param("deadline") LocalDateTime deadline);

    @Query("SELECT COUNT(r) FROM ClientRequestReadModel r WHERE r.slaStatus = 'BREACHED' AND r.status IN ('SUBMITTED', 'IN_REVIEW')")
    long countSlaBreached();

    // Find recent activity
    @Query("SELECT r FROM ClientRequestReadModel r WHERE r.lastActivityAt >= :since ORDER BY r.lastActivityAt DESC")
    List<ClientRequestReadModel> findRecentActivity(@Param("since") LocalDateTime since, Pageable pageable);

    // Find by operation
    Optional<ClientRequestReadModel> findByOperationId(String operationId);

    List<ClientRequestReadModel> findByOperationReference(String operationReference);

    // Backoffice search (simplified version)
    @Query("SELECT r FROM ClientRequestReadModel r WHERE " +
           "(:clientId IS NULL OR r.clientId = :clientId) AND " +
           "(:productType IS NULL OR r.productType = :productType) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:assignedToUserId IS NULL OR r.assignedToUserId = :assignedToUserId) AND " +
           "(:searchTerm IS NULL OR r.searchText LIKE %:searchTerm%)")
    Page<ClientRequestReadModel> searchAll(
            @Param("clientId") String clientId,
            @Param("productType") String productType,
            @Param("status") String status,
            @Param("assignedToUserId") String assignedToUserId,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    // Backoffice search with internal processing stage filter
    @Query("SELECT r FROM ClientRequestReadModel r WHERE " +
           "(:clientId IS NULL OR r.clientId = :clientId) AND " +
           "(:productType IS NULL OR r.productType = :productType) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:assignedToUserId IS NULL OR r.assignedToUserId = :assignedToUserId) AND " +
           "(:internalProcessingStage IS NULL OR r.internalProcessingStage = :internalProcessingStage) AND " +
           "(:searchTerm IS NULL OR r.searchText LIKE %:searchTerm%)")
    Page<ClientRequestReadModel> searchAllWithStage(
            @Param("clientId") String clientId,
            @Param("productType") String productType,
            @Param("status") String status,
            @Param("assignedToUserId") String assignedToUserId,
            @Param("internalProcessingStage") String internalProcessingStage,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    // Count requests grouped by internal processing stage (all non-null stages)
    @Query("SELECT r.internalProcessingStage, COUNT(r) FROM ClientRequestReadModel r " +
           "WHERE r.internalProcessingStage IS NOT NULL " +
           "GROUP BY r.internalProcessingStage")
    List<Object[]> countByStages();

    // Internal processing log queries
    @Query(value = "SELECT id, event_code, from_stage, to_stage, executed_by, executed_by_name, comments, execution_time_ms, created_at " +
           "FROM client_request_internal_processing_log WHERE request_id = :requestId ORDER BY created_at ASC", nativeQuery = true)
    List<Object[]> findInternalProcessingLog(@Param("requestId") String requestId);

    // Find requests by internal processing stage (for WorkboxDrafts integration)
    @Query("SELECT r FROM ClientRequestReadModel r WHERE " +
           "r.internalProcessingStage = :stage AND " +
           "(:productType IS NULL OR r.productType = :productType) " +
           "ORDER BY r.internalProcessingStartedAt DESC")
    Page<ClientRequestReadModel> findByInternalProcessingStage(
            @Param("stage") String stage,
            @Param("productType") String productType,
            Pageable pageable);

    // Find requests pending registration (no operation linked yet and draft not yet approved)
    @Query("SELECT r FROM ClientRequestReadModel r WHERE " +
           "r.internalProcessingStage = 'REGISTRO' AND " +
           "r.operationId IS NULL AND " +
           "(:productType IS NULL OR r.productType = :productType) AND " +
           "NOT EXISTS (SELECT 1 FROM com.globalcmx.api.readmodel.entity.SwiftDraftReadModel d " +
           "            WHERE d.draftId = r.draftId AND d.status IN ('PENDING_APPROVAL', 'APPROVED')) " +
           "ORDER BY r.internalProcessingStartedAt ASC")
    Page<ClientRequestReadModel> findPendingRegistration(
            @Param("productType") String productType,
            Pageable pageable);

    @Transactional
    @Modifying
    @Query(value = "INSERT INTO client_request_internal_processing_log " +
           "(id, request_id, event_code, from_stage, to_stage, executed_by, executed_by_name, comments, execution_time_ms, created_at) " +
           "VALUES (UUID(), :requestId, :eventCode, :fromStage, :toStage, :executedBy, :executedByName, :comments, :executionTimeMs, NOW())", nativeQuery = true)
    void insertInternalProcessingLog(
            @Param("requestId") String requestId,
            @Param("eventCode") String eventCode,
            @Param("fromStage") String fromStage,
            @Param("toStage") String toStage,
            @Param("executedBy") String executedBy,
            @Param("executedByName") String executedByName,
            @Param("comments") String comments,
            @Param("executionTimeMs") Long executionTimeMs);
}
