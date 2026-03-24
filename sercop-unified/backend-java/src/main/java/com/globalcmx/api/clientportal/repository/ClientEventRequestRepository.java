package com.globalcmx.api.clientportal.repository;

import com.globalcmx.api.clientportal.entity.ClientEventRequest;
import com.globalcmx.api.clientportal.entity.ClientEventRequest.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for ClientEventRequest entity.
 */
@Repository
public interface ClientEventRequestRepository extends JpaRepository<ClientEventRequest, String> {

    // Find by operation
    List<ClientEventRequest> findByOperationIdOrderByRequestedAtDesc(String operationId);

    // Find by client
    List<ClientEventRequest> findByClientIdOrderByRequestedAtDesc(Long clientId);

    Page<ClientEventRequest> findByClientIdOrderByRequestedAtDesc(Long clientId, Pageable pageable);

    // Find by status
    List<ClientEventRequest> findByStatusOrderByRequestedAtDesc(RequestStatus status);

    Page<ClientEventRequest> findByStatusOrderByRequestedAtDesc(RequestStatus status, Pageable pageable);

    // Find pending requests for an operation
    List<ClientEventRequest> findByOperationIdAndStatusOrderByRequestedAtDesc(
            String operationId, RequestStatus status);

    // Find by client and status
    List<ClientEventRequest> findByClientIdAndStatusOrderByRequestedAtDesc(
            Long clientId, RequestStatus status);

    // Count pending requests
    long countByStatus(RequestStatus status);

    long countByClientIdAndStatus(Long clientId, RequestStatus status);

    // Check if there's a pending request for the same event on the operation
    @Query("SELECT COUNT(r) > 0 FROM ClientEventRequest r " +
           "WHERE r.operationId = :operationId " +
           "AND r.eventCode = :eventCode " +
           "AND r.status IN ('PENDING', 'APPROVED', 'PROCESSING')")
    boolean existsPendingRequestForEvent(
            @Param("operationId") String operationId,
            @Param("eventCode") String eventCode);

    // Find requests by date range
    @Query("SELECT r FROM ClientEventRequest r " +
           "WHERE r.requestedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY r.requestedAt DESC")
    List<ClientEventRequest> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Find requests requiring approval
    @Query("SELECT r FROM ClientEventRequest r " +
           "WHERE r.status = 'PENDING' " +
           "AND r.requiresApproval = true " +
           "ORDER BY r.requestedAt ASC")
    List<ClientEventRequest> findPendingApprovals();

    @Query("SELECT r FROM ClientEventRequest r " +
           "WHERE r.status = 'PENDING' " +
           "AND r.requiresApproval = true")
    Page<ClientEventRequest> findPendingApprovals(Pageable pageable);

    // Statistics
    @Query("SELECT r.status, COUNT(r) FROM ClientEventRequest r " +
           "WHERE r.clientId = :clientId " +
           "GROUP BY r.status")
    List<Object[]> getStatusCountsByClient(@Param("clientId") Long clientId);

    @Query("SELECT r.eventCode, COUNT(r) FROM ClientEventRequest r " +
           "WHERE r.status = 'COMPLETED' " +
           "GROUP BY r.eventCode " +
           "ORDER BY COUNT(r) DESC")
    List<Object[]> getMostRequestedEvents();
}
