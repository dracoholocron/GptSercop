package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.OperationEventLogReadModel;
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
 * Repository for operation event history.
 * Provides queries for event logs and audit trail.
 */
@Repository
public interface OperationEventLogReadModelRepository extends JpaRepository<OperationEventLogReadModel, Long> {

    /**
     * Find by unique event ID
     */
    Optional<OperationEventLogReadModel> findByEventId(String eventId);

    /**
     * Check if event ID exists
     */
    boolean existsByEventId(String eventId);

    /**
     * List events by operation ordered by sequence
     */
    List<OperationEventLogReadModel> findByOperationIdOrderByEventSequenceAsc(String operationId);

    /**
     * List events by operation ordered by date desc
     */
    List<OperationEventLogReadModel> findByOperationIdOrderByExecutedAtDesc(String operationId);

    /**
     * List events by operation type
     */
    List<OperationEventLogReadModel> findByOperationTypeOrderByExecutedAtDesc(String operationType);

    /**
     * List events by event code
     */
    List<OperationEventLogReadModel> findByEventCodeOrderByExecutedAtDesc(String eventCode);

    /**
     * List events by SWIFT message
     */
    List<OperationEventLogReadModel> findBySwiftMessageIdOrderByExecutedAtDesc(String swiftMessageId);

    /**
     * List events by user
     */
    List<OperationEventLogReadModel> findByExecutedByOrderByExecutedAtDesc(String executedBy);

    /**
     * Find last event for operation
     */
    Optional<OperationEventLogReadModel> findFirstByOperationIdOrderByEventSequenceDesc(String operationId);

    /**
     * Get next sequence number for operation
     */
    @Query("SELECT COALESCE(MAX(e.eventSequence), 0) + 1 FROM OperationEventLogReadModel e " +
            "WHERE e.operationId = :operationId")
    Integer getNextSequenceNumber(@Param("operationId") String operationId);

    /**
     * Find events by date range
     */
    @Query("SELECT e FROM OperationEventLogReadModel e WHERE " +
            "e.executedAt BETWEEN :startDate AND :endDate " +
            "ORDER BY e.executedAt DESC")
    List<OperationEventLogReadModel> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Find events with state transition
     */
    @Query("SELECT e FROM OperationEventLogReadModel e WHERE " +
            "e.operationId = :operationId AND " +
            "(e.previousStage IS NOT NULL OR e.newStage IS NOT NULL) " +
            "ORDER BY e.eventSequence ASC")
    List<OperationEventLogReadModel> findStateTransitions(@Param("operationId") String operationId);

    /**
     * Find events by operation and event code
     */
    List<OperationEventLogReadModel> findByOperationIdAndEventCodeOrderByExecutedAtDesc(
            String operationId, String eventCode);

    /**
     * Search with multiple filters
     */
    @Query("SELECT e FROM OperationEventLogReadModel e WHERE " +
            "(:operationId IS NULL OR e.operationId = :operationId) AND " +
            "(:operationType IS NULL OR e.operationType = :operationType) AND " +
            "(:eventCode IS NULL OR e.eventCode = :eventCode) AND " +
            "(:executedBy IS NULL OR e.executedBy = :executedBy) " +
            "ORDER BY e.executedAt DESC")
    List<OperationEventLogReadModel> findWithFilters(
            @Param("operationId") String operationId,
            @Param("operationType") String operationType,
            @Param("eventCode") String eventCode,
            @Param("executedBy") String executedBy);

    /**
     * Count events by operation
     */
    long countByOperationId(String operationId);

    /**
     * Count events by event code
     */
    long countByEventCode(String eventCode);

    /**
     * Find all events ordered by date desc (recent first)
     */
    List<OperationEventLogReadModel> findAllByOrderByExecutedAtDesc();

    /**
     * Find all events with pagination ordered by date desc
     */
    Page<OperationEventLogReadModel> findAllByOrderByExecutedAtDesc(Pageable pageable);

    /**
     * Find events by date range with pagination
     */
    @Query("SELECT e FROM OperationEventLogReadModel e WHERE " +
            "e.executedAt BETWEEN :startDate AND :endDate " +
            "ORDER BY e.executedAt DESC")
    Page<OperationEventLogReadModel> findByDateRangePaged(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    /**
     * Find events by operation type with pagination
     */
    Page<OperationEventLogReadModel> findByOperationTypeOrderByExecutedAtDesc(
            String operationType, Pageable pageable);

    /**
     * Search with filters and pagination
     */
    @Query("SELECT e FROM OperationEventLogReadModel e WHERE " +
            "(:operationType IS NULL OR e.operationType = :operationType) AND " +
            "(:eventCode IS NULL OR e.eventCode = :eventCode) AND " +
            "(:executedBy IS NULL OR e.executedBy = :executedBy) AND " +
            "(:search IS NULL OR e.reference LIKE CONCAT('%', :search, '%') OR e.operationId LIKE CONCAT('%', :search, '%')) AND " +
            "(:startDate IS NULL OR e.executedAt >= :startDate) AND " +
            "(:endDate IS NULL OR e.executedAt <= :endDate) " +
            "ORDER BY e.executedAt DESC")
    Page<OperationEventLogReadModel> findWithFiltersPaged(
            @Param("operationType") String operationType,
            @Param("eventCode") String eventCode,
            @Param("executedBy") String executedBy,
            @Param("search") String search,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);
}
