package com.globalcmx.api.eventsourcing.aggregate;

import com.globalcmx.api.dto.command.CreateEmailTemplateCommand;
import com.globalcmx.api.dto.command.UpdateEmailTemplateCommand;
import com.globalcmx.api.eventsourcing.event.PlantillaCorreoCreatedEvent;
import com.globalcmx.api.eventsourcing.event.PlantillaCorreoDeletedEvent;
import com.globalcmx.api.eventsourcing.event.PlantillaCorreoUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class PlantillaCorreoAggregate {
    private Long plantillaCorreoId;
    private String codigo;
    private String nombre;
    private String descripcion;
    private String asunto;
    private String cuerpoHtml;
    private String plantillasAdjuntas;
    private Boolean activo;
    private boolean deleted = false;
    private Long version = 0L;

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public PlantillaCorreoAggregate() {
    }

    public PlantillaCorreoAggregate(Long plantillaCorreoId) {
        this.plantillaCorreoId = plantillaCorreoId;
    }

    public void handle(CreateEmailTemplateCommand command) {
        PlantillaCorreoCreatedEvent event = new PlantillaCorreoCreatedEvent(
                this.plantillaCorreoId,
                command.getCodigo(),
                command.getNombre(),
                command.getDescripcion(),
                command.getAsunto(),
                command.getCuerpoHtml(),
                command.getPlantillasAdjuntas(),
                command.getActivo(),
                command.getCreatedBy() != null ? command.getCreatedBy() : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handle(UpdateEmailTemplateCommand command) {
        if (this.deleted) {
            throw new IllegalStateException("No se puede actualizar una plantilla de correo eliminada");
        }

        PlantillaCorreoUpdatedEvent event = new PlantillaCorreoUpdatedEvent(
                this.plantillaCorreoId,
                command.getCodigo(),
                command.getNombre(),
                command.getDescripcion(),
                command.getAsunto(),
                command.getCuerpoHtml(),
                command.getPlantillasAdjuntas(),
                command.getActivo(),
                command.getUpdatedBy() != null ? command.getUpdatedBy() : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handleDelete(String deletedBy) {
        if (this.deleted) {
            throw new IllegalStateException("La plantilla de correo ya está eliminada");
        }

        PlantillaCorreoDeletedEvent event = new PlantillaCorreoDeletedEvent(
                this.plantillaCorreoId,
                deletedBy != null ? deletedBy : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    private void apply(PlantillaCorreoCreatedEvent event) {
        this.plantillaCorreoId = event.getPlantillaCorreoId();
        this.codigo = event.getCodigo();
        this.nombre = event.getNombre();
        this.descripcion = event.getDescripcion();
        this.asunto = event.getAsunto();
        this.cuerpoHtml = event.getCuerpoHtml();
        this.plantillasAdjuntas = event.getPlantillasAdjuntas();
        this.activo = event.getActivo();
        this.deleted = false;
        this.version++;
    }

    private void apply(PlantillaCorreoUpdatedEvent event) {
        this.codigo = event.getCodigo();
        this.nombre = event.getNombre();
        this.descripcion = event.getDescripcion();
        this.asunto = event.getAsunto();
        this.cuerpoHtml = event.getCuerpoHtml();
        this.plantillasAdjuntas = event.getPlantillasAdjuntas();
        this.activo = event.getActivo();
        this.version++;
    }

    private void apply(PlantillaCorreoDeletedEvent event) {
        this.deleted = true;
        this.version++;
    }

    public void loadFromHistory(List<DomainEvent> events) {
        for (DomainEvent event : events) {
            if (event instanceof PlantillaCorreoCreatedEvent) {
                apply((PlantillaCorreoCreatedEvent) event);
            } else if (event instanceof PlantillaCorreoUpdatedEvent) {
                apply((PlantillaCorreoUpdatedEvent) event);
            } else if (event instanceof PlantillaCorreoDeletedEvent) {
                apply((PlantillaCorreoDeletedEvent) event);
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
