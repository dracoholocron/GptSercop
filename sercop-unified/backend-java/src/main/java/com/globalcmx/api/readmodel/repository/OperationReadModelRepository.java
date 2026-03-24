package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.OperationReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for approved/active operations.
 * Provides queries for the operation read model.
 */
@Repository
public interface OperationReadModelRepository extends JpaRepository<OperationReadModel, Long> {

    /**
     * Find by unique operation ID
     */
    Optional<OperationReadModel> findByOperationId(String operationId);

    /**
     * Check if operation ID exists
     */
    boolean existsByOperationId(String operationId);

    /**
     * Find by original draft ID
     */
    Optional<OperationReadModel> findByOriginalDraftId(String originalDraftId);

    /**
     * List operations by product type
     */
    List<OperationReadModel> findByProductTypeOrderByCreatedAtDesc(String productType);

    /**
     * List operations by multiple product types (for COLLECTION which maps to COLLECTION_IMPORT and COLLECTION_EXPORT)
     */
    List<OperationReadModel> findByProductTypeInOrderByCreatedAtDesc(List<String> productTypes);

    /**
     * List operations by multiple product types excluding a specific status
     */
    List<OperationReadModel> findByProductTypeInAndStatusNotOrderByCreatedAtDesc(
            List<String> productTypes, String status);

    /**
     * List operations by product type excluding a specific status (e.g., CLOSED)
     */
    List<OperationReadModel> findByProductTypeAndStatusNotOrderByCreatedAtDesc(
            String productType, String status);

    /**
     * List operations by stage
     */
    List<OperationReadModel> findByStageOrderByCreatedAtDesc(String stage);

    /**
     * List operations by status
     */
    List<OperationReadModel> findByStatusOrderByCreatedAtDesc(String status);

    /**
     * List operations by product type and stage
     */
    List<OperationReadModel> findByProductTypeAndStageOrderByCreatedAtDesc(
            String productType, String stage);

    /**
     * List operations by product type and status
     */
    List<OperationReadModel> findByProductTypeAndStatusOrderByCreatedAtDesc(
            String productType, String status);

    /**
     * Find operations awaiting response
     */
    List<OperationReadModel> findByAwaitingResponseTrueOrderByResponseDueDateAsc();

    /**
     * Find operations awaiting response by product type
     */
    List<OperationReadModel> findByProductTypeAndAwaitingResponseTrueOrderByResponseDueDateAsc(
            String productType);

    /**
     * Find operations with overdue responses
     */
    @Query("SELECT o FROM OperationReadModel o WHERE o.awaitingResponse = true " +
            "AND o.responseDueDate < :today ORDER BY o.responseDueDate ASC")
    List<OperationReadModel> findOverdueResponses(@Param("today") LocalDate today);

    /**
     * Find by exact reference
     */
    Optional<OperationReadModel> findByReference(String reference);

    /**
     * Find by reference (partial match)
     */
    @Query("SELECT o FROM OperationReadModel o WHERE o.reference LIKE %:reference% " +
            "ORDER BY o.createdAt DESC")
    List<OperationReadModel> findByReferenceContaining(@Param("reference") String reference);

    /**
     * Find all operations ordered by creation date (for backoffice/internal users)
     */
    List<OperationReadModel> findAllByOrderByCreatedAtDesc();

    /**
     * Find by applicant
     */
    List<OperationReadModel> findByApplicantIdOrderByCreatedAtDesc(Long applicantId);

    /**
     * Find by beneficiary
     */
    List<OperationReadModel> findByBeneficiaryIdOrderByCreatedAtDesc(Long beneficiaryId);

    /**
     * Find by issuing bank BIC
     */
    List<OperationReadModel> findByIssuingBankBicOrderByCreatedAtDesc(String issuingBankBic);

    /**
     * Find by advising bank BIC
     */
    List<OperationReadModel> findByAdvisingBankBicOrderByCreatedAtDesc(String advisingBankBic);

    /**
     * Find operations expiring soon
     */
    @Query("SELECT o FROM OperationReadModel o WHERE o.expiryDate BETWEEN :startDate AND :endDate " +
            "ORDER BY o.expiryDate ASC")
    List<OperationReadModel> findExpiringSoon(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Search with multiple filters including name-based search
     */
    @Query("SELECT o FROM OperationReadModel o WHERE " +
            "(:productType IS NULL OR o.productType = :productType) AND " +
            "(:stage IS NULL OR o.stage = :stage) AND " +
            "(:status IS NULL OR o.status = :status) AND " +
            "(:reference IS NULL OR o.reference LIKE %:reference% OR o.operationId LIKE %:reference%) AND " +
            "(:applicantId IS NULL OR o.applicantId = :applicantId) AND " +
            "(:beneficiaryId IS NULL OR o.beneficiaryId = :beneficiaryId) AND " +
            "(:applicantName IS NULL OR o.applicantName = :applicantName) AND " +
            "(:beneficiaryName IS NULL OR o.beneficiaryName = :beneficiaryName) " +
            "ORDER BY o.createdAt DESC")
    List<OperationReadModel> findWithFilters(
            @Param("productType") String productType,
            @Param("stage") String stage,
            @Param("status") String status,
            @Param("reference") String reference,
            @Param("applicantId") Long applicantId,
            @Param("beneficiaryId") Long beneficiaryId,
            @Param("applicantName") String applicantName,
            @Param("beneficiaryName") String beneficiaryName);

    /**
     * Count by product type
     */
    long countByProductType(String productType);

    /**
     * Count by product type and stage
     */
    long countByProductTypeAndStage(String productType, String stage);

    /**
     * Count by product type and status
     */
    long countByProductTypeAndStatus(String productType, String status);

    /**
     * Count awaiting responses
     */
    long countByAwaitingResponseTrue();

    /**
     * Count by product type awaiting responses
     */
    long countByProductTypeAndAwaitingResponseTrue(String productType);

    // ==================== ALERT QUERIES ====================

    /**
     * Find operations with alerts, ordered by alert count
     */
    List<OperationReadModel> findByHasAlertsTrueOrderByAlertCountDesc();

    /**
     * Find operations with alerts by product type
     */
    List<OperationReadModel> findByProductTypeAndHasAlertsTrueOrderByAlertCountDesc(String productType);

    /**
     * Count operations with alerts
     */
    long countByHasAlertsTrue();

    /**
     * Count operations with alerts by product type
     */
    long countByProductTypeAndHasAlertsTrue(String productType);

    // ==================== UPDATE QUERIES (avoid optimistic locking) ====================

    /**
     * Increment message count without loading entity (avoids optimistic locking conflicts)
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE OperationReadModel o SET o.messageCount = o.messageCount + 1 WHERE o.operationId = :operationId")
    int incrementMessageCount(@Param("operationId") String operationId);

    /**
     * Set awaiting response fields without loading entity
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE OperationReadModel o SET o.awaitingResponse = :awaiting, " +
            "o.awaitingMessageType = :messageType, o.responseDueDate = :dueDate " +
            "WHERE o.operationId = :operationId")
    int updateAwaitingResponse(
            @Param("operationId") String operationId,
            @Param("awaiting") boolean awaiting,
            @Param("messageType") String messageType,
            @Param("dueDate") LocalDate dueDate);

    /**
     * Clear awaiting response without loading entity
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE OperationReadModel o SET o.awaitingResponse = false, " +
            "o.awaitingMessageType = null, o.responseDueDate = null " +
            "WHERE o.operationId = :operationId")
    int clearAwaitingResponse(@Param("operationId") String operationId);
}
