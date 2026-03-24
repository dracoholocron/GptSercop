package com.globalcmx.api.eventsourcing.aggregate;

import com.globalcmx.api.dto.command.CreateTemplateCommand;
import com.globalcmx.api.dto.command.UpdateTemplateCommand;
import com.globalcmx.api.eventsourcing.event.PlantillaCreatedEvent;
import com.globalcmx.api.eventsourcing.event.PlantillaDeletedEvent;
import com.globalcmx.api.eventsourcing.event.PlantillaUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class PlantillaAggregate {
    private Long plantillaId;
    private String codigo;
    private String nombre;
    private String descripcion;
    private String tipoDocumento;
    private String nombreArchivo;
    private String rutaArchivo;
    private Long tamanioArchivo;
    private Boolean activo;
    private boolean deleted = false;
    private Long version = 0L;

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public PlantillaAggregate() {
    }

    public PlantillaAggregate(Long plantillaId) {
        this.plantillaId = plantillaId;
    }

    public void handle(CreateTemplateCommand command) {
        PlantillaCreatedEvent event = new PlantillaCreatedEvent(
                this.plantillaId,
                command.getCodigo(),
                command.getNombre(),
                command.getDescripcion(),
                command.getTipoDocumento(),
                command.getNombreArchivo(),
                command.getRutaArchivo(),
                command.getTamanioArchivo(),
                command.getActivo(),
                command.getCreatedBy() != null ? command.getCreatedBy() : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handle(UpdateTemplateCommand command) {
        if (this.deleted) {
            throw new IllegalStateException("No se puede actualizar una plantilla eliminada");
        }

        PlantillaUpdatedEvent event = new PlantillaUpdatedEvent(
                this.plantillaId,
                command.getCodigo(),
                command.getNombre(),
                command.getDescripcion(),
                command.getTipoDocumento(),
                command.getNombreArchivo(),
                command.getRutaArchivo(),
                command.getTamanioArchivo(),
                command.getActivo(),
                command.getUpdatedBy() != null ? command.getUpdatedBy() : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handleDelete(String deletedBy) {
        if (this.deleted) {
            throw new IllegalStateException("La plantilla ya está eliminada");
        }

        PlantillaDeletedEvent event = new PlantillaDeletedEvent(
                this.plantillaId,
                deletedBy != null ? deletedBy : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    private void apply(PlantillaCreatedEvent event) {
        this.plantillaId = event.getPlantillaId();
        this.codigo = event.getCodigo();
        this.nombre = event.getNombre();
        this.descripcion = event.getDescripcion();
        this.tipoDocumento = event.getTipoDocumento();
        this.nombreArchivo = event.getNombreArchivo();
        this.rutaArchivo = event.getRutaArchivo();
        this.tamanioArchivo = event.getTamanioArchivo();
        this.activo = event.getActivo();
        this.deleted = false;
        this.version++;
    }

    private void apply(PlantillaUpdatedEvent event) {
        this.codigo = event.getCodigo();
        this.nombre = event.getNombre();
        this.descripcion = event.getDescripcion();
        this.tipoDocumento = event.getTipoDocumento();
        this.nombreArchivo = event.getNombreArchivo();
        this.rutaArchivo = event.getRutaArchivo();
        this.tamanioArchivo = event.getTamanioArchivo();
        this.activo = event.getActivo();
        this.version++;
    }

    private void apply(PlantillaDeletedEvent event) {
        this.deleted = true;
        this.version++;
    }

    public void loadFromHistory(List<DomainEvent> events) {
        for (DomainEvent event : events) {
            if (event instanceof PlantillaCreatedEvent) {
                apply((PlantillaCreatedEvent) event);
            } else if (event instanceof PlantillaUpdatedEvent) {
                apply((PlantillaUpdatedEvent) event);
            } else if (event instanceof PlantillaDeletedEvent) {
                apply((PlantillaDeletedEvent) event);
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
