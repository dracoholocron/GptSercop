package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Event raised when an operation lock is released.
 */
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class OperationLockReleasedEvent extends DomainEvent {

    private String operationId;
    private String releasedBy;
    private Instant releasedAt;
    private String releaseType; // MANUAL, EXPIRED, FORCED

    public OperationLockReleasedEvent(String operationId, String releasedBy, String releaseType) {
        super("OPERATION_LOCK_RELEASED", releasedBy);
        this.operationId = operationId;
        this.releasedBy = releasedBy;
        this.releasedAt = Instant.now();
        this.releaseType = releaseType;
    }
}
