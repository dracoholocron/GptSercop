package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Domain event for operation event execution.
 * Represents an event that occurred on an operation (approval, amendment, etc.).
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class OperationEventExecutedEvent extends DomainEvent {

    // Event identification
    private String eventId;
    private String operationId;
    private String operationType;
    private String eventCode;
    private Integer eventSequence;

    // SWIFT message link
    private String swiftMessageId;
    private String swiftMessageType;
    private String messageDirection;

    // State transition
    private String previousStage;
    private String newStage;
    private String previousStatus;
    private String newStatus;

    // Event data (form data)
    private Map<String, Object> eventData;

    // User comments
    private String comments;

    // Operation snapshot
    private Map<String, Object> operationSnapshot;

    public OperationEventExecutedEvent(
            String eventId,
            String operationId,
            String operationType,
            String eventCode,
            Integer eventSequence,
            String previousStage,
            String newStage,
            String previousStatus,
            String newStatus,
            Map<String, Object> eventData,
            String comments,
            Map<String, Object> operationSnapshot,
            String performedBy) {
        super("OPERATION_EVENT_EXECUTED", performedBy);
        this.eventId = eventId;
        this.operationId = operationId;
        this.operationType = operationType;
        this.eventCode = eventCode;
        this.eventSequence = eventSequence;
        this.previousStage = previousStage;
        this.newStage = newStage;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.eventData = eventData;
        this.comments = comments;
        this.operationSnapshot = operationSnapshot;
    }

    /**
     * Builder-style constructor with SWIFT message info
     */
    public OperationEventExecutedEvent withSwiftMessage(String messageId, String messageType, String direction) {
        this.swiftMessageId = messageId;
        this.swiftMessageType = messageType;
        this.messageDirection = direction;
        return this;
    }
}
