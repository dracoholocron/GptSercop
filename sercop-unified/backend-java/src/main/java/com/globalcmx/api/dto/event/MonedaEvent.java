package com.globalcmx.api.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonedaEvent {

    public enum EventType {
        CREATED, UPDATED, DELETED
    }

    private EventType eventType;
    private Long monedaId;
    private String codigo;
    private String nombre;
    private String simbolo;
    private Boolean activo;
    private LocalDateTime timestamp;
    private String performedBy;
    private String eventId;
}
