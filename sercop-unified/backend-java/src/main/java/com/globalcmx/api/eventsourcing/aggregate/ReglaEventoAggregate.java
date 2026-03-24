package com.globalcmx.api.eventsourcing.aggregate;

import com.globalcmx.api.dto.command.CreateEventRuleCommand;
import com.globalcmx.api.dto.command.UpdateEventRuleCommand;
import com.globalcmx.api.eventsourcing.event.ReglaEventoCreatedEvent;
import com.globalcmx.api.eventsourcing.event.ReglaEventoDeletedEvent;
import com.globalcmx.api.eventsourcing.event.ReglaEventoUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class ReglaEventoAggregate {
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
    private boolean deleted = false;
    private Long version = 0L;

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public ReglaEventoAggregate() {
    }

    public ReglaEventoAggregate(Long reglaEventoId) {
        this.reglaEventoId = reglaEventoId;
    }

    public void handle(CreateEventRuleCommand command) {
        ReglaEventoCreatedEvent event = new ReglaEventoCreatedEvent(
                this.reglaEventoId,
                command.getCodigo(),
                command.getNombre(),
                command.getDescripcion(),
                command.getTipoOperacion(),
                command.getEventoTrigger(),
                command.getCondicionesDRL(),
                command.getAccionesJson(),
                command.getPrioridad(),
                command.getActivo(),
                command.getCreatedBy() != null ? command.getCreatedBy() : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handle(UpdateEventRuleCommand command) {
        if (this.deleted) {
            throw new IllegalStateException("No se puede actualizar una regla de evento eliminada");
        }

        ReglaEventoUpdatedEvent event = new ReglaEventoUpdatedEvent(
                this.reglaEventoId,
                command.getCodigo(),
                command.getNombre(),
                command.getDescripcion(),
                command.getTipoOperacion(),
                command.getEventoTrigger(),
                command.getCondicionesDRL(),
                command.getAccionesJson(),
                command.getPrioridad(),
                command.getActivo(),
                command.getUpdatedBy() != null ? command.getUpdatedBy() : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handleDelete(String deletedBy) {
        if (this.deleted) {
            throw new IllegalStateException("La regla de evento ya está eliminada");
        }

        ReglaEventoDeletedEvent event = new ReglaEventoDeletedEvent(
                this.reglaEventoId,
                deletedBy != null ? deletedBy : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    private void apply(ReglaEventoCreatedEvent event) {
        this.reglaEventoId = event.getReglaEventoId();
        this.codigo = event.getCodigo();
        this.nombre = event.getNombre();
        this.descripcion = event.getDescripcion();
        this.tipoOperacion = event.getTipoOperacion();
        this.eventoTrigger = event.getEventoTrigger();
        this.condicionesDRL = event.getCondicionesDRL();
        this.accionesJson = event.getAccionesJson();
        this.prioridad = event.getPrioridad();
        this.activo = event.getActivo();
        this.deleted = false;
        this.version++;
    }

    private void apply(ReglaEventoUpdatedEvent event) {
        this.codigo = event.getCodigo();
        this.nombre = event.getNombre();
        this.descripcion = event.getDescripcion();
        this.tipoOperacion = event.getTipoOperacion();
        this.eventoTrigger = event.getEventoTrigger();
        this.condicionesDRL = event.getCondicionesDRL();
        this.accionesJson = event.getAccionesJson();
        this.prioridad = event.getPrioridad();
        this.activo = event.getActivo();
        this.version++;
    }

    private void apply(ReglaEventoDeletedEvent event) {
        this.deleted = true;
        this.version++;
    }

    public void loadFromHistory(List<DomainEvent> events) {
        for (DomainEvent event : events) {
            if (event instanceof ReglaEventoCreatedEvent) {
                apply((ReglaEventoCreatedEvent) event);
            } else if (event instanceof ReglaEventoUpdatedEvent) {
                apply((ReglaEventoUpdatedEvent) event);
            } else if (event instanceof ReglaEventoDeletedEvent) {
                apply((ReglaEventoDeletedEvent) event);
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
