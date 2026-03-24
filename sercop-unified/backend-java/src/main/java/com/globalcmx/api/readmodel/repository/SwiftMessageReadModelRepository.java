package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.SwiftMessageReadModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for SWIFT messages (sent and received).
 * Provides queries for message tracking and history.
 */
@Repository
public interface SwiftMessageReadModelRepository extends JpaRepository<SwiftMessageReadModel, Long> {

    /**
     * Find by unique message ID
     */
    Optional<SwiftMessageReadModel> findByMessageId(String messageId);

    /**
     * Check if message ID exists
     */
    boolean existsByMessageId(String messageId);

    /**
     * List messages by operation (newest first)
     */
    List<SwiftMessageReadModel> findByOperationIdOrderByCreatedAtDesc(String operationId);

    /**
     * List messages by operation (oldest first - for chronological processing)
     */
    List<SwiftMessageReadModel> findByOperationIdOrderByCreatedAtAsc(String operationId);

    /**
     * List messages by operation type
     */
    List<SwiftMessageReadModel> findByOperationTypeOrderByCreatedAtDesc(String operationType);

    /**
     * List messages by message type
     */
    List<SwiftMessageReadModel> findByMessageTypeOrderByCreatedAtDesc(String messageType);

    /**
     * List messages by direction (OUTBOUND/INBOUND)
     */
    List<SwiftMessageReadModel> findByDirectionOrderByCreatedAtDesc(String direction);

    /**
     * List messages by status
     */
    List<SwiftMessageReadModel> findByStatusOrderByCreatedAtDesc(String status);

    /**
     * List messages by sender BIC
     */
    List<SwiftMessageReadModel> findBySenderBicOrderByCreatedAtDesc(String senderBic);

    /**
     * List messages by receiver BIC
     */
    List<SwiftMessageReadModel> findByReceiverBicOrderByCreatedAtDesc(String receiverBic);

    /**
     * Find by field :20: reference
     */
    List<SwiftMessageReadModel> findByField20ReferenceOrderByCreatedAtDesc(String field20Reference);

    /**
     * Find by field :21: related reference
     */
    List<SwiftMessageReadModel> findByField21RelatedRefOrderByCreatedAtDesc(String field21RelatedRef);

    /**
     * Find messages expecting response
     */
    List<SwiftMessageReadModel> findByExpectsResponseTrueAndResponseReceivedFalseOrderByResponseDueDateAsc();

    /**
     * Find overdue responses
     */
    @Query("SELECT m FROM SwiftMessageReadModel m WHERE m.expectsResponse = true " +
            "AND m.responseReceived = false AND m.responseDueDate < :today " +
            "ORDER BY m.responseDueDate ASC")
    List<SwiftMessageReadModel> findOverdueResponses(@Param("today") LocalDate today);

    /**
     * Find messages without ACK
     */
    @Query("SELECT m FROM SwiftMessageReadModel m WHERE m.direction = 'OUTBOUND' " +
            "AND m.ackReceived = false AND m.status = 'SENT' " +
            "ORDER BY m.sentAt ASC")
    List<SwiftMessageReadModel> findPendingAck();

    /**
     * Find messages by date range
     */
    @Query("SELECT m FROM SwiftMessageReadModel m WHERE " +
            "m.createdAt BETWEEN :startDate AND :endDate " +
            "ORDER BY m.createdAt DESC")
    List<SwiftMessageReadModel> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Search with multiple filters
     */
    @Query("SELECT m FROM SwiftMessageReadModel m WHERE " +
            "(:operationId IS NULL OR m.operationId = :operationId) AND " +
            "(:operationType IS NULL OR m.operationType = :operationType) AND " +
            "(:messageType IS NULL OR m.messageType = :messageType) AND " +
            "(:direction IS NULL OR m.direction = :direction) AND " +
            "(:status IS NULL OR m.status = :status) AND " +
            "(:senderBic IS NULL OR m.senderBic = :senderBic) AND " +
            "(:receiverBic IS NULL OR m.receiverBic = :receiverBic) " +
            "ORDER BY m.createdAt DESC")
    List<SwiftMessageReadModel> findWithFilters(
            @Param("operationId") String operationId,
            @Param("operationType") String operationType,
            @Param("messageType") String messageType,
            @Param("direction") String direction,
            @Param("status") String status,
            @Param("senderBic") String senderBic,
            @Param("receiverBic") String receiverBic);

    /**
     * Find all messages ordered by creation date
     */
    List<SwiftMessageReadModel> findAllByOrderByCreatedAtDesc();

    /**
     * Count by direction
     */
    long countByDirection(String direction);

    /**
     * Count by message type
     */
    long countByMessageType(String messageType);

    /**
     * Count by status
     */
    long countByStatus(String status);

    /**
     * Count pending responses
     */
    long countByExpectsResponseTrueAndResponseReceivedFalse();

    /**
     * Count by operation
     */
    long countByOperationId(String operationId);

    /**
     * Check if a message already exists for an operation, message type, and triggered event
     * Used to prevent duplicate message creation
     */
    boolean existsByOperationIdAndMessageTypeAndTriggeredByEvent(
            String operationId, String messageType, String triggeredByEvent);

    /**
     * Find existing message for operation, type, and triggered event
     */
    Optional<SwiftMessageReadModel> findByOperationIdAndMessageTypeAndTriggeredByEvent(
            String operationId, String messageType, String triggeredByEvent);

    /**
     * Search messages by text content (partial match in swiftContent) with pagination
     */
    @Query("SELECT m FROM SwiftMessageReadModel m WHERE " +
            "LOWER(m.swiftContent) LIKE LOWER(CONCAT('%', :searchText, '%'))")
    Page<SwiftMessageReadModel> searchByContent(@Param("searchText") String searchText, Pageable pageable);

    /**
     * Search messages by text in multiple fields with pagination
     */
    @Query("SELECT m FROM SwiftMessageReadModel m WHERE " +
            "LOWER(m.swiftContent) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(m.field20Reference) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(m.field21RelatedRef) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(m.senderBic) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(m.receiverBic) LIKE LOWER(CONCAT('%', :searchText, '%'))")
    Page<SwiftMessageReadModel> searchByText(@Param("searchText") String searchText, Pageable pageable);

    /**
     * Count search results for text
     */
    @Query("SELECT COUNT(m) FROM SwiftMessageReadModel m WHERE " +
            "LOWER(m.swiftContent) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(m.field20Reference) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(m.field21RelatedRef) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(m.senderBic) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
            "LOWER(m.receiverBic) LIKE LOWER(CONCAT('%', :searchText, '%'))")
    long countBySearchText(@Param("searchText") String searchText);
}
