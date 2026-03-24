package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class ReglaEventoCreatedEvent extends DomainEvent {
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

    public ReglaEventoCreatedEvent(Long reglaEventoId, String codigo, String nombre,
                                   String descripcion, String tipoOperacion, String eventoTrigger,
                                   String condicionesDRL, String accionesJson, Integer prioridad,
                                   Boolean activo, String performedBy) {
        super("REGLA_EVENTO_CREATED", performedBy);
        this.reglaEventoId = reglaEventoId;
        this.codigo = codigo;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.tipoOperacion = tipoOperacion;
        this.eventoTrigger = eventoTrigger;
        this.condicionesDRL = condicionesDRL;
        this.accionesJson = accionesJson;
        this.prioridad = prioridad;
        this.activo = activo;
    }
}
