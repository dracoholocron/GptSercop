package com.globalcmx.api.externalapi.repository;

import com.globalcmx.api.externalapi.entity.ExternalApiCallLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExternalApiCallLogRepository extends
        JpaRepository<ExternalApiCallLog, Long>,
        JpaSpecificationExecutor<ExternalApiCallLog> {

    List<ExternalApiCallLog> findByApiConfigId(Long apiConfigId);

    List<ExternalApiCallLog> findByApiConfigCode(String apiConfigCode);

    List<ExternalApiCallLog> findByCorrelationId(String correlationId);

    List<ExternalApiCallLog> findByOperationId(String operationId);

    Page<ExternalApiCallLog> findByApiConfigIdOrderByCreatedAtDesc(Long apiConfigId, Pageable pageable);

    @Query("SELECT l FROM ExternalApiCallLog l " +
           "WHERE l.apiConfigId = :apiConfigId " +
           "AND (:from IS NULL OR l.createdAt >= :from) " +
           "AND (:to IS NULL OR l.createdAt <= :to) " +
           "AND (:success IS NULL OR l.success = :success) " +
           "ORDER BY l.createdAt DESC")
    Page<ExternalApiCallLog> findByFilters(
            @Param("apiConfigId") Long apiConfigId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("success") Boolean success,
            Pageable pageable);

    @Query("SELECT l FROM ExternalApiCallLog l " +
           "WHERE (:apiConfigId IS NULL OR l.apiConfigId = :apiConfigId) " +
           "AND (:from IS NULL OR l.createdAt >= :from) " +
           "AND (:to IS NULL OR l.createdAt <= :to) " +
           "AND (:success IS NULL OR l.success = :success) " +
           "ORDER BY l.createdAt DESC")
    Page<ExternalApiCallLog> findAllByFilters(
            @Param("apiConfigId") Long apiConfigId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("success") Boolean success,
            Pageable pageable);

    @Query("SELECT COUNT(l) FROM ExternalApiCallLog l " +
           "WHERE l.apiConfigId = :apiConfigId " +
           "AND l.createdAt >= :since")
    Long countByApiConfigIdSince(@Param("apiConfigId") Long apiConfigId, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(l) FROM ExternalApiCallLog l " +
           "WHERE l.apiConfigId = :apiConfigId " +
           "AND l.success = true " +
           "AND l.createdAt >= :since")
    Long countSuccessfulByApiConfigIdSince(@Param("apiConfigId") Long apiConfigId, @Param("since") LocalDateTime since);

    @Query("SELECT AVG(l.executionTimeMs) FROM ExternalApiCallLog l " +
           "WHERE l.apiConfigId = :apiConfigId " +
           "AND l.createdAt >= :since")
    Double avgExecutionTimeByApiConfigIdSince(@Param("apiConfigId") Long apiConfigId, @Param("since") LocalDateTime since);

    @Query("SELECT l FROM ExternalApiCallLog l " +
           "WHERE l.apiConfigId = :apiConfigId " +
           "ORDER BY l.createdAt DESC")
    List<ExternalApiCallLog> findLastByApiConfigId(@Param("apiConfigId") Long apiConfigId, Pageable pageable);

    default Optional<ExternalApiCallLog> findMostRecentByApiConfigId(Long apiConfigId) {
        List<ExternalApiCallLog> logs = findLastByApiConfigId(apiConfigId, org.springframework.data.domain.PageRequest.of(0, 1));
        return logs.isEmpty() ? Optional.empty() : Optional.of(logs.get(0));
    }

    /**
     * Find by call ID (UUID)
     */
    Optional<ExternalApiCallLog> findByCallId(String callId);

    /**
     * Find by aggregate ID (for event sourcing)
     */
    Optional<ExternalApiCallLog> findByAggregateId(String aggregateId);

    /**
     * Find all by status
     */
    Page<ExternalApiCallLog> findByStatusOrderByCreatedAtDesc(ExternalApiCallLog.Status status, Pageable pageable);

    /**
     * Find all with mapped response data
     */
    @Query("SELECT l FROM ExternalApiCallLog l WHERE l.mappedResponseData IS NOT NULL ORDER BY l.createdAt DESC")
    Page<ExternalApiCallLog> findAllWithMappedData(Pageable pageable);
}
