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
public class MonedaUpdatedEvent implements DomainEvent {

    private String eventId;
    private String aggregateId;
    private Long monedaId;
    private String codigo;
    private String nombre;
    private String simbolo;
    private Boolean activo;
    private String updatedBy;
    private LocalDateTime timestamp;

    @Override
    public String getEventType() {
        return "MonedaUpdated";
    }
}
