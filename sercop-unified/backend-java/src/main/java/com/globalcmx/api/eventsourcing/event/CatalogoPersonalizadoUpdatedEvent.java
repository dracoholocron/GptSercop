package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class CatalogoPersonalizadoUpdatedEvent extends DomainEvent {
    private Long catalogoPersonalizadoId;
    private String codigo;
    private String nombre;
    private String descripcion;
    private Integer nivel;
    private Long catalogoPadreId;
    private String codigoCatalogoPadre;
    private String nombreCatalogoPadre;
    private Boolean activo;
    private Integer orden;

    public CatalogoPersonalizadoUpdatedEvent(Long catalogoPersonalizadoId, String codigo, String nombre,
                                             String descripcion, Integer nivel, Long catalogoPadreId,
                                             String codigoCatalogoPadre, String nombreCatalogoPadre,
                                             Boolean activo, Integer orden, String performedBy) {
        super("CATALOGO_PERSONALIZADO_UPDATED", performedBy);
        this.catalogoPersonalizadoId = catalogoPersonalizadoId;
        this.codigo = codigo;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.nivel = nivel;
        this.catalogoPadreId = catalogoPadreId;
        this.codigoCatalogoPadre = codigoCatalogoPadre;
        this.nombreCatalogoPadre = nombreCatalogoPadre;
        this.activo = activo;
        this.orden = orden;
    }
}
