package com.globalcmx.api.eventsourcing.aggregate;

import com.globalcmx.api.dto.command.CreateCustomCatalogCommand;
import com.globalcmx.api.dto.command.UpdateCustomCatalogCommand;
import com.globalcmx.api.eventsourcing.event.CatalogoPersonalizadoCreatedEvent;
import com.globalcmx.api.eventsourcing.event.CatalogoPersonalizadoDeletedEvent;
import com.globalcmx.api.eventsourcing.event.CatalogoPersonalizadoUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class CatalogoPersonalizadoAggregate {
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
    private boolean deleted = false;
    private Long version = 0L;

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public CatalogoPersonalizadoAggregate() {
    }

    public CatalogoPersonalizadoAggregate(Long catalogoPersonalizadoId) {
        this.catalogoPersonalizadoId = catalogoPersonalizadoId;
    }

    public void handle(CreateCustomCatalogCommand command) {
        CatalogoPersonalizadoCreatedEvent event = new CatalogoPersonalizadoCreatedEvent(
                this.catalogoPersonalizadoId,
                command.getCodigo(),
                command.getNombre(),
                command.getDescripcion(),
                command.getNivel(),
                command.getCatalogoPadreId(),
                null, // codigoCatalogoPadre will be set by service
                null, // nombreCatalogoPadre will be set by service
                command.getActivo(),
                command.getOrden(),
                command.getCreatedBy() != null ? command.getCreatedBy() : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handle(UpdateCustomCatalogCommand command) {
        if (this.deleted) {
            throw new IllegalStateException("No se puede actualizar un catálogo personalizado eliminado");
        }

        CatalogoPersonalizadoUpdatedEvent event = new CatalogoPersonalizadoUpdatedEvent(
                this.catalogoPersonalizadoId,
                command.getCodigo(),
                command.getNombre(),
                command.getDescripcion(),
                command.getNivel(),
                command.getCatalogoPadreId(),
                null, // codigoCatalogoPadre will be set by service
                null, // nombreCatalogoPadre will be set by service
                command.getActivo(),
                command.getOrden(),
                command.getUpdatedBy() != null ? command.getUpdatedBy() : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handleDelete(String deletedBy) {
        if (this.deleted) {
            throw new IllegalStateException("El catálogo personalizado ya está eliminado");
        }

        CatalogoPersonalizadoDeletedEvent event = new CatalogoPersonalizadoDeletedEvent(
                this.catalogoPersonalizadoId,
                deletedBy != null ? deletedBy : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    private void apply(CatalogoPersonalizadoCreatedEvent event) {
        this.catalogoPersonalizadoId = event.getCatalogoPersonalizadoId();
        this.codigo = event.getCodigo();
        this.nombre = event.getNombre();
        this.descripcion = event.getDescripcion();
        this.nivel = event.getNivel();
        this.catalogoPadreId = event.getCatalogoPadreId();
        this.codigoCatalogoPadre = event.getCodigoCatalogoPadre();
        this.nombreCatalogoPadre = event.getNombreCatalogoPadre();
        this.activo = event.getActivo();
        this.orden = event.getOrden();
        this.deleted = false;
        this.version++;
    }

    private void apply(CatalogoPersonalizadoUpdatedEvent event) {
        this.codigo = event.getCodigo();
        this.nombre = event.getNombre();
        this.descripcion = event.getDescripcion();
        this.nivel = event.getNivel();
        this.catalogoPadreId = event.getCatalogoPadreId();
        this.codigoCatalogoPadre = event.getCodigoCatalogoPadre();
        this.nombreCatalogoPadre = event.getNombreCatalogoPadre();
        this.activo = event.getActivo();
        this.orden = event.getOrden();
        this.version++;
    }

    private void apply(CatalogoPersonalizadoDeletedEvent event) {
        this.deleted = true;
        this.version++;
    }

    public void loadFromHistory(List<DomainEvent> events) {
        for (DomainEvent event : events) {
            if (event instanceof CatalogoPersonalizadoCreatedEvent) {
                apply((CatalogoPersonalizadoCreatedEvent) event);
            } else if (event instanceof CatalogoPersonalizadoUpdatedEvent) {
                apply((CatalogoPersonalizadoUpdatedEvent) event);
            } else if (event instanceof CatalogoPersonalizadoDeletedEvent) {
                apply((CatalogoPersonalizadoDeletedEvent) event);
            }
        }
        uncommittedEvents.clear();
    }

    public List<DomainEvent> getUncommittedEvents() {
        return new ArrayList<>(uncommittedEvents);
    }

    public void markEventsAsCommitted() {
        uncommittedEvents.clear();
    }
}
