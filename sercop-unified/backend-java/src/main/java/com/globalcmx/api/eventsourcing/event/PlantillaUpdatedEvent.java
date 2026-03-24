package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class PlantillaUpdatedEvent extends DomainEvent {
    private Long plantillaId;
    private String codigo;
    private String nombre;
    private String descripcion;
    private String tipoDocumento;
    private String nombreArchivo;
    private String rutaArchivo;
    private Long tamanioArchivo;
    private Boolean activo;

    public PlantillaUpdatedEvent(Long plantillaId, String codigo, String nombre,
                                 String descripcion, String tipoDocumento, String nombreArchivo,
                                 String rutaArchivo, Long tamanioArchivo, Boolean activo,
                                 String performedBy) {
        super("PLANTILLA_UPDATED", performedBy);
        this.plantillaId = plantillaId;
        this.codigo = codigo;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.tipoDocumento = tipoDocumento;
        this.nombreArchivo = nombreArchivo;
        this.rutaArchivo = rutaArchivo;
        this.tamanioArchivo = tamanioArchivo;
        this.activo = activo;
    }
}
