package com.globalcmx.api.alerts.repository;

import com.globalcmx.api.alerts.entity.BusinessRequestReadModel;
import com.globalcmx.api.alerts.entity.BusinessRequestReadModel.RequestSourceType;
import com.globalcmx.api.alerts.entity.BusinessRequestReadModel.RequestStatus;
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
 * Repository for business requests from AI extraction and other sources.
 */
@Repository
public interface BusinessRequestRepository extends JpaRepository<BusinessRequestReadModel, Long> {

    /**
     * Find request by unique requestId
     */
    Optional<BusinessRequestReadModel> findByRequestId(String requestId);

    /**
     * Find request by request number
     */
    Optional<BusinessRequestReadModel> findByRequestNumber(String requestNumber);

    /**
     * Find all pending requests
     */
    List<BusinessRequestReadModel> findByStatusOrderByCreatedAtDesc(RequestStatus status);

    /**
     * Find pending requests for a user (their own requests)
     */
    List<BusinessRequestReadModel> findByCreatedByAndStatusOrderByCreatedAtDesc(
        String createdBy, RequestStatus status);

    /**
     * Find all pending requests with pagination
     */
    Page<BusinessRequestReadModel> findByStatusOrderByCreatedAtDesc(
        RequestStatus status, Pageable pageable);

    /**
     * Find requests by extraction ID (link to AI extraction)
     */
    Optional<BusinessRequestReadModel> findByExtractionId(String extractionId);

    /**
     * Find requests by client
     */
    List<BusinessRequestReadModel> findByClientIdOrderByCreatedAtDesc(String clientId);

    /**
     * Find requests by source type
     */
    List<BusinessRequestReadModel> findBySourceTypeOrderByCreatedAtDesc(RequestSourceType sourceType);

    /**
     * Count pending requests
     */
    long countByStatus(RequestStatus status);

    /**
     * Count pending requests by user
     */
    long countByCreatedByAndStatus(String createdBy, RequestStatus status);

    /**
     * Search requests by title or client name
     */
    @Query("SELECT r FROM BusinessRequestReadModel r " +
           "WHERE (LOWER(r.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "       OR LOWER(r.clientName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "       OR LOWER(r.requestNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "ORDER BY r.createdAt DESC")
    Page<BusinessRequestReadModel> searchRequests(
        @Param("searchTerm") String searchTerm,
        Pageable pageable
    );

    /**
     * Find requests in date range
     */
    @Query("SELECT r FROM BusinessRequestReadModel r " +
           "WHERE r.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY r.createdAt DESC")
    List<BusinessRequestReadModel> findByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Statistics: Count by status
     */
    @Query("SELECT r.status, COUNT(r) FROM BusinessRequestReadModel r " +
           "WHERE r.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY r.status")
    List<Object[]> countByStatusInRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Find next request number sequence
     */
    @Query("SELECT MAX(CAST(SUBSTRING(r.requestNumber, 4) AS int)) FROM BusinessRequestReadModel r " +
           "WHERE r.requestNumber LIKE 'BR-%'")
    Integer findMaxRequestNumber();

    /**
     * Check if request exists
     */
    boolean existsByRequestId(String requestId);
}
