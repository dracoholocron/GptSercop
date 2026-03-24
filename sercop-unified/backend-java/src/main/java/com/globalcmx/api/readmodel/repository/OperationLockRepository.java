package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.OperationLockReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Repository for operation locks.
 */
@Repository
public interface OperationLockRepository extends JpaRepository<OperationLockReadModel, String> {

    /**
     * Find all active (non-expired) locks
     */
    @Query("SELECT l FROM OperationLockReadModel l WHERE l.expiresAt > :now ORDER BY l.lockedAt DESC")
    List<OperationLockReadModel> findAllActiveLocks(@Param("now") Instant now);

    /**
     * Find all locks by a specific user
     */
    List<OperationLockReadModel> findByLockedByOrderByLockedAtDesc(String lockedBy);

    /**
     * Find active locks by user
     */
    @Query("SELECT l FROM OperationLockReadModel l WHERE l.lockedBy = :username AND l.expiresAt > :now")
    List<OperationLockReadModel> findActiveByUser(@Param("username") String username, @Param("now") Instant now);

    /**
     * Delete expired locks
     */
    @Modifying
    @Query("DELETE FROM OperationLockReadModel l WHERE l.expiresAt <= :now")
    int deleteExpiredLocks(@Param("now") Instant now);

    /**
     * Check if operation is locked by another user
     */
    @Query("SELECT l FROM OperationLockReadModel l WHERE l.operationId = :operationId AND l.expiresAt > :now AND l.lockedBy != :username")
    Optional<OperationLockReadModel> findLockedByOtherUser(
            @Param("operationId") String operationId,
            @Param("username") String username,
            @Param("now") Instant now);

    /**
     * Check if operation has an active lock
     */
    @Query("SELECT l FROM OperationLockReadModel l WHERE l.operationId = :operationId AND l.expiresAt > :now")
    Optional<OperationLockReadModel> findActiveLock(@Param("operationId") String operationId, @Param("now") Instant now);

    /**
     * Find locks by product type
     */
    @Query("SELECT l FROM OperationLockReadModel l WHERE l.productType = :productType AND l.expiresAt > :now ORDER BY l.lockedAt DESC")
    List<OperationLockReadModel> findByProductType(@Param("productType") String productType, @Param("now") Instant now);

    /**
     * Count active locks
     */
    @Query("SELECT COUNT(l) FROM OperationLockReadModel l WHERE l.expiresAt > :now")
    long countActiveLocks(@Param("now") Instant now);

    /**
     * Count active locks by user
     */
    @Query("SELECT COUNT(l) FROM OperationLockReadModel l WHERE l.lockedBy = :username AND l.expiresAt > :now")
    long countActiveByUser(@Param("username") String username, @Param("now") Instant now);

    /**
     * Find locks for multiple operations (bulk query)
     */
    @Query("SELECT l FROM OperationLockReadModel l WHERE l.operationId IN :operationIds AND l.expiresAt > :now")
    List<OperationLockReadModel> findByOperationIds(
            @Param("operationIds") List<String> operationIds,
            @Param("now") Instant now);
}
