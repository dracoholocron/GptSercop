package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class MonedaCreatedEvent extends DomainEvent {
    private Long monedaId;
    private String codigo;
    private String nombre;
    private String simbolo;
    private Boolean activo;

    public MonedaCreatedEvent(Long monedaId, String codigo, String nombre, String simbolo, Boolean activo, String performedBy) {
        super("MONEDA_CREATED", performedBy);
        this.monedaId = monedaId;
        this.codigo = codigo;
        this.nombre = nombre;
        this.simbolo = simbolo;
        this.activo = activo;
    }
}
