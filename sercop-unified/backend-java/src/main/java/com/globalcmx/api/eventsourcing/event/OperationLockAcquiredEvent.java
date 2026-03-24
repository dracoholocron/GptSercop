package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Event raised when an operation lock is acquired.
 */
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class OperationLockAcquiredEvent extends DomainEvent {

    private String operationId;
    private String lockedBy;
    private String lockedByFullName;
    private Instant lockedAt;
    private Instant expiresAt;
    private Integer durationSeconds;
    private String operationReference;
    private String productType;

    public OperationLockAcquiredEvent(String operationId, String lockedBy, String lockedByFullName,
                                       Instant expiresAt, Integer durationSeconds,
                                       String operationReference, String productType) {
        super("OPERATION_LOCK_ACQUIRED", lockedBy);
        this.operationId = operationId;
        this.lockedBy = lockedBy;
        this.lockedByFullName = lockedByFullName;
        this.lockedAt = Instant.now();
        this.expiresAt = expiresAt;
        this.durationSeconds = durationSeconds;
        this.operationReference = operationReference;
        this.productType = productType;
    }
}
