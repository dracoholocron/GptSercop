package com.globalcmx.api.eventsourcing.event;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public abstract class DomainEvent {
    private String eventId;
    private String eventType;
    private LocalDateTime timestamp;
    private String performedBy;

    protected DomainEvent() {
        // For serialization
    }

    public DomainEvent(String eventType, String performedBy) {
        this.eventType = eventType;
        this.performedBy = performedBy;
        this.timestamp = LocalDateTime.now();
    }
}
