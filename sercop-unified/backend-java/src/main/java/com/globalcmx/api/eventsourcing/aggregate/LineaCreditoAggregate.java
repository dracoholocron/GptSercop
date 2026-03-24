package com.globalcmx.api.eventsourcing.aggregate;

import com.globalcmx.api.dto.command.CreateCreditLineCommand;
import com.globalcmx.api.dto.command.UpdateCreditLineCommand;
import com.globalcmx.api.eventsourcing.event.*;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Slf4j
public class LineaCreditoAggregate {

    private Long lineaCreditoId;
    private Long clienteId;
    private String tipo;
    private String moneda;
    private BigDecimal montoAutorizado;
    private BigDecimal montoUtilizado;
    private BigDecimal montoDisponible;
    private LocalDate fechaAutorizacion;
    private LocalDate fechaVencimiento;
    private String tasaReferencia;
    private BigDecimal spread;
    private String estado;
    private Long version;

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public LineaCreditoAggregate() {
        this.version = 0L;
    }

    public void handle(CreateCreditLineCommand command, Long lineaCreditoId) {
        if (this.lineaCreditoId != null) {
            throw new IllegalStateException("Línea de crédito ya existe");
        }

        // Calcular monto disponible
        BigDecimal montoUtilizado = command.getMontoUtilizado() != null ?
            command.getMontoUtilizado() : BigDecimal.ZERO;
        BigDecimal montoDisponible = command.getMontoAutorizado().subtract(montoUtilizado);

        LineaCreditoCreatedEvent event = new LineaCreditoCreatedEvent(
                lineaCreditoId,
                command.getClienteId(),
                command.getTipo(),
                command.getMoneda(),
                command.getMontoAutorizado(),
                montoUtilizado,
                montoDisponible,
                command.getFechaAutorizacion(),
                command.getFechaVencimiento(),
                command.getTasaReferencia(),
                command.getSpread(),
                command.getEstado(),
                command.getCreatedBy()
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handle(UpdateCreditLineCommand command) {
        if (this.lineaCreditoId == null) {
            throw new IllegalStateException("Línea de crédito no existe");
        }

        // Calcular monto disponible
        BigDecimal montoUtilizado = command.getMontoUtilizado() != null ?
            command.getMontoUtilizado() : BigDecimal.ZERO;
        BigDecimal montoDisponible = command.getMontoAutorizado().subtract(montoUtilizado);

        LineaCreditoUpdatedEvent event = new LineaCreditoUpdatedEvent(
                this.lineaCreditoId,
                command.getClienteId(),
                command.getTipo(),
                command.getMoneda(),
                command.getMontoAutorizado(),
                montoUtilizado,
                montoDisponible,
                command.getFechaAutorizacion(),
                command.getFechaVencimiento(),
                command.getTasaReferencia(),
                command.getSpread(),
                command.getEstado(),
                command.getUpdatedBy()
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handleDelete(String performedBy) {
        if (this.lineaCreditoId == null) {
            throw new IllegalStateException("Línea de crédito no existe");
        }

        LineaCreditoDeletedEvent event = new LineaCreditoDeletedEvent(this.lineaCreditoId, performedBy);
        apply(event);
        uncommittedEvents.add(event);
    }

    public void apply(LineaCreditoCreatedEvent event) {
        this.lineaCreditoId = event.getLineaCreditoId();
        this.clienteId = event.getClienteId();
        this.tipo = event.getTipo();
        this.moneda = event.getMoneda();
        this.montoAutorizado = event.getMontoAutorizado();
        this.montoUtilizado = event.getMontoUtilizado();
        this.montoDisponible = event.getMontoDisponible();
        this.fechaAutorizacion = event.getFechaAutorizacion();
        this.fechaVencimiento = event.getFechaVencimiento();
        this.tasaReferencia = event.getTasaReferencia();
        this.spread = event.getSpread();
        this.estado = event.getEstado();
        this.version++;
    }

    public void apply(LineaCreditoUpdatedEvent event) {
        this.clienteId = event.getClienteId();
        this.tipo = event.getTipo();
        this.moneda = event.getMoneda();
        this.montoAutorizado = event.getMontoAutorizado();
        this.montoUtilizado = event.getMontoUtilizado();
        this.montoDisponible = event.getMontoDisponible();
        this.fechaAutorizacion = event.getFechaAutorizacion();
        this.fechaVencimiento = event.getFechaVencimiento();
        this.tasaReferencia = event.getTasaReferencia();
        this.spread = event.getSpread();
        this.estado = event.getEstado();
        this.version++;
    }

    public void apply(LineaCreditoDeletedEvent event) {
        this.estado = "ELIMINADA";
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
        if (event instanceof LineaCreditoCreatedEvent) {
            apply((LineaCreditoCreatedEvent) event);
        } else if (event instanceof LineaCreditoUpdatedEvent) {
            apply((LineaCreditoUpdatedEvent) event);
        } else if (event instanceof LineaCreditoDeletedEvent) {
            apply((LineaCreditoDeletedEvent) event);
        }
    }
}
