package com.globalcmx.api.eventsourcing.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonedaDeletedEvent implements DomainEvent {

    private String eventId;
    private String aggregateId;
    private Long monedaId;
    private String codigo;
    private String deletedBy;
    private LocalDateTime timestamp;

    @Override
    public String getEventType() {
        return "MonedaDeleted";
    }
}
