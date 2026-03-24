package com.globalcmx.api.eventsourcing.aggregate;

import com.globalcmx.api.dto.command.CreateExchangeRateCommand;
import com.globalcmx.api.dto.command.UpdateExchangeRateCommand;
import com.globalcmx.api.eventsourcing.event.*;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Slf4j
public class CotizacionAggregate {

    private Long cotizacionId;
    private String codigoMoneda;
    private LocalDate fecha;
    private BigDecimal valorCompra;
    private BigDecimal valorVenta;
    private Long version;

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public CotizacionAggregate() {
        this.version = 0L;
    }

    public void handle(CreateExchangeRateCommand command, Long cotizacionId) {
        if (this.cotizacionId != null) {
            throw new IllegalStateException("Cotizacion ya existe");
        }

        CotizacionCreatedEvent event = new CotizacionCreatedEvent(
                cotizacionId,
                command.getCodigoMoneda(),
                command.getFecha(),
                command.getValorCompra(),
                command.getValorVenta(),
                command.getCreatedBy()
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handle(UpdateExchangeRateCommand command) {
        if (this.cotizacionId == null) {
            throw new IllegalStateException("Cotizacion no existe");
        }

        CotizacionUpdatedEvent event = new CotizacionUpdatedEvent(
                this.cotizacionId,
                command.getCodigoMoneda(),
                command.getFecha(),
                command.getValorCompra(),
                command.getValorVenta(),
                command.getUpdatedBy()
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handleDelete(String performedBy) {
        if (this.cotizacionId == null) {
            throw new IllegalStateException("Cotizacion no existe");
        }

        CotizacionDeletedEvent event = new CotizacionDeletedEvent(this.cotizacionId, performedBy);
        apply(event);
        uncommittedEvents.add(event);
    }

    public void apply(CotizacionCreatedEvent event) {
        this.cotizacionId = event.getCotizacionId();
        this.codigoMoneda = event.getCodigoMoneda();
        this.fecha = event.getFecha();
        this.valorCompra = event.getValorCompra();
        this.valorVenta = event.getValorVenta();
        this.version++;
    }

    public void apply(CotizacionUpdatedEvent event) {
        this.codigoMoneda = event.getCodigoMoneda();
        this.fecha = event.getFecha();
        this.valorCompra = event.getValorCompra();
        this.valorVenta = event.getValorVenta();
        this.version++;
    }

    public void apply(CotizacionDeletedEvent event) {
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
        if (event instanceof CotizacionCreatedEvent) {
            apply((CotizacionCreatedEvent) event);
        } else if (event instanceof CotizacionUpdatedEvent) {
            apply((CotizacionUpdatedEvent) event);
        } else if (event instanceof CotizacionDeletedEvent) {
            apply((CotizacionDeletedEvent) event);
        }
    }
}
