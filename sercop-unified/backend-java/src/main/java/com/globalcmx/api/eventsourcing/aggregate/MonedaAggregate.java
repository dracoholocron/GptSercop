package com.globalcmx.api.eventsourcing.aggregate;

import com.globalcmx.api.dto.command.CreateCurrencyCommand;
import com.globalcmx.api.dto.command.UpdateCurrencyCommand;
import com.globalcmx.api.eventsourcing.event.*;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

@Data
@Slf4j
public class MonedaAggregate {

    private Long monedaId;
    private String codigo;
    private String nombre;
    private String simbolo;
    private Boolean activo;
    private Long version;

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public MonedaAggregate() {
        this.version = 0L;
    }

    public void handle(CreateCurrencyCommand command, Long monedaId) {
        if (this.monedaId != null) {
            throw new IllegalStateException("Moneda ya existe");
        }

        MonedaCreatedEvent event = new MonedaCreatedEvent(
                monedaId,
                command.getCodigo(),
                command.getNombre(),
                command.getSimbolo(),
                command.getActivo() != null ? command.getActivo() : true,
                command.getCreatedBy()
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handle(UpdateCurrencyCommand command) {
        if (this.monedaId == null) {
            throw new IllegalStateException("Moneda no existe");
        }

        MonedaUpdatedEvent event = new MonedaUpdatedEvent(
                this.monedaId,
                command.getCodigo(),
                command.getNombre(),
                command.getSimbolo(),
                command.getActivo(),
                command.getUpdatedBy()
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handleDelete(String performedBy) {
        if (this.monedaId == null) {
            throw new IllegalStateException("Moneda no existe");
        }

        MonedaDeletedEvent event = new MonedaDeletedEvent(this.monedaId, performedBy);
        apply(event);
        uncommittedEvents.add(event);
    }

    public void apply(MonedaCreatedEvent event) {
        this.monedaId = event.getMonedaId();
        this.codigo = event.getCodigo();
        this.nombre = event.getNombre();
        this.simbolo = event.getSimbolo();
        this.activo = event.getActivo();
        this.version++;
    }

    public void apply(MonedaUpdatedEvent event) {
        this.codigo = event.getCodigo();
        this.nombre = event.getNombre();
        this.simbolo = event.getSimbolo();
        this.activo = event.getActivo();
        this.version++;
    }

    public void apply(MonedaDeletedEvent event) {
        this.activo = false;
        this.version++;
    }

    public List<DomainEvent> getUncommittedEvents() {
        return new ArrayList<>(uncommittedEvents);
    }

    public void markEventsAsCommitted() {
        uncommittedEvents.clear();
    }

    public void loadFromHistory(List<DomainEvent> history) {
        for (DomainEvent event : history) {
            applyEvent(event);
        }
    }

    private void applyEvent(DomainEvent event) {
        if (event instanceof MonedaCreatedEvent) {
            apply((MonedaCreatedEvent) event);
        } else if (event instanceof MonedaUpdatedEvent) {
            apply((MonedaUpdatedEvent) event);
        } else if (event instanceof MonedaDeletedEvent) {
            apply((MonedaDeletedEvent) event);
        }
    }
}
