package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class MonedaUpdatedEvent extends DomainEvent {
    private Long monedaId;
    private String codigo;
    private String nombre;
    private String simbolo;
    private Boolean activo;

    public MonedaUpdatedEvent(Long monedaId, String codigo, String nombre, String simbolo, Boolean activo, String performedBy) {
        super("MONEDA_UPDATED", performedBy);
        this.monedaId = monedaId;
        this.codigo = codigo;
        this.nombre = nombre;
        this.simbolo = simbolo;
        this.activo = activo;
    }
}
