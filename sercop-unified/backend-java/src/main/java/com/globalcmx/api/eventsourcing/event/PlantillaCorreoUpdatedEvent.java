package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class PlantillaCorreoUpdatedEvent extends DomainEvent {
    private Long plantillaCorreoId;
    private String codigo;
    private String nombre;
    private String descripcion;
    private String asunto;
    private String cuerpoHtml;
    private String plantillasAdjuntas;
    private Boolean activo;

    public PlantillaCorreoUpdatedEvent(Long plantillaCorreoId, String codigo, String nombre,
                                       String descripcion, String asunto, String cuerpoHtml,
                                       String plantillasAdjuntas, Boolean activo,
                                       String performedBy) {
        super("PLANTILLA_CORREO_UPDATED", performedBy);
        this.plantillaCorreoId = plantillaCorreoId;
        this.codigo = codigo;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.asunto = asunto;
        this.cuerpoHtml = cuerpoHtml;
        this.plantillasAdjuntas = plantillasAdjuntas;
        this.activo = activo;
    }
}
