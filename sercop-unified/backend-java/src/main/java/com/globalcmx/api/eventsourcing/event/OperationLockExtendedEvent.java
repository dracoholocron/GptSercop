package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Event raised when an operation lock is extended.
 */
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class OperationLockExtendedEvent extends DomainEvent {

    private String operationId;
    private String extendedBy;
    private Instant previousExpiresAt;
    private Instant newExpiresAt;
    private Integer additionalSeconds;

    public OperationLockExtendedEvent(String operationId, String extendedBy,
                                       Instant previousExpiresAt, Instant newExpiresAt,
                                       Integer additionalSeconds) {
        super("OPERATION_LOCK_EXTENDED", extendedBy);
        this.operationId = operationId;
        this.extendedBy = extendedBy;
        this.previousExpiresAt = previousExpiresAt;
        this.newExpiresAt = newExpiresAt;
        this.additionalSeconds = additionalSeconds;
    }
}
