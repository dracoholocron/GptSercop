package com.globalcmx.api.dto.event;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReglaEventoEvent {
    private Long reglaEventoId;
    private String codigo;
    private String nombre;
    private String descripcion;
    private String tipoOperacion;
    private String eventoTrigger;
    private String condicionesDRL;
    private String accionesJson;
    private Integer prioridad;
    private Boolean activo;
    private EventType eventType;
    private String performedBy;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    public enum EventType {
        CREATED,
        UPDATED,
        DELETED
    }
}
