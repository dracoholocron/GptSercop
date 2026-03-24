package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.Instant;

/**
 * Read model for operation locks (pessimistic locking).
 * Allows a user to "take" an operation for a configurable time,
 * blocking other users from executing actions.
 */
@Entity
@Table(name = "operation_lock_readmodel")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationLockReadModel {

    @Id
    @Column(name = "operation_id", length = 50)
    private String operationId;

    @Column(name = "locked_by", nullable = false, length = 50)
    private String lockedBy;

    @Column(name = "locked_by_full_name", length = 100)
    private String lockedByFullName;

    @Column(name = "locked_at", nullable = false)
    private Instant lockedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "lock_duration_seconds", nullable = false)
    private Integer lockDurationSeconds;

    @Column(name = "operation_reference", length = 100)
    private String operationReference;

    @Column(name = "product_type", length = 50)
    private String productType;

    /**
     * Check if the lock has expired
     */
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    /**
     * Get remaining seconds until expiration
     */
    public long getRemainingSeconds() {
        return Math.max(0, Duration.between(Instant.now(), expiresAt).getSeconds());
    }

    /**
     * Check if the lock is about to expire (less than 60 seconds)
     */
    public boolean isExpiringSoon() {
        return getRemainingSeconds() <= 60 && getRemainingSeconds() > 0;
    }

    /**
     * Extend the lock by additional seconds from now
     */
    public void extendLock(int additionalSeconds) {
        this.expiresAt = Instant.now().plusSeconds(additionalSeconds);
        this.lockDurationSeconds = additionalSeconds;
    }
}
