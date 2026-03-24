package com.globalcmx.api.eventsourcing.aggregate;

import com.globalcmx.api.dto.command.CreateTradeFinancingCommand;
import com.globalcmx.api.dto.command.UpdateTradeFinancingCommand;
import com.globalcmx.api.eventsourcing.event.FinanciamientoCxCreatedEvent;
import com.globalcmx.api.eventsourcing.event.FinanciamientoCxDeletedEvent;
import com.globalcmx.api.eventsourcing.event.FinanciamientoCxUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
public class FinanciamientoCxAggregate {
    private Long financiamientoCxId;
    private String numeroOperacion;
    private String tipo;
    private String operacionVinculadaTipo;
    private Long operacionVinculadaId;
    private Long clienteId;
    private Long lineaCreditoId;
    private String moneda;
    private BigDecimal montoSolicitado;
    private BigDecimal montoAprobado;
    private BigDecimal montoDesembolsado;
    private Integer plazoDias;
    private BigDecimal tasaInteres;
    private BigDecimal tasaMora;
    private BigDecimal comisionApertura;
    private LocalDate fechaDesembolso;
    private LocalDate fechaVencimiento;
    private String tipoGarantia;
    private String descripcionGarantia;
    private String estado;
    private boolean deleted = false;
    private Long version = 0L;

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public FinanciamientoCxAggregate() {
    }

    public FinanciamientoCxAggregate(Long financiamientoCxId) {
        this.financiamientoCxId = financiamientoCxId;
    }

    public void handle(CreateTradeFinancingCommand command) {
        FinanciamientoCxCreatedEvent event = new FinanciamientoCxCreatedEvent(
                this.financiamientoCxId,
                command.getNumeroOperacion(),
                command.getTipo(),
                command.getClienteId(),
                command.getMoneda(),
                command.getMontoSolicitado(),
                command.getEstado(),
                command.getUsuarioCreacion() != null ? command.getUsuarioCreacion() : "system"
        );

        // Set additional fields
        event.setOperacionVinculadaTipo(command.getOperacionVinculadaTipo());
        event.setOperacionVinculadaId(command.getOperacionVinculadaId());
        event.setLineaCreditoId(command.getLineaCreditoId());
        event.setMontoAprobado(command.getMontoAprobado());
        event.setMontoDesembolsado(command.getMontoDesembolsado());
        event.setPlazoDias(command.getPlazoDias());
        event.setTasaInteres(command.getTasaInteres());
        event.setTasaMora(command.getTasaMora());
        event.setComisionApertura(command.getComisionApertura());
        event.setFechaDesembolso(command.getFechaDesembolso());
        event.setFechaVencimiento(command.getFechaVencimiento());
        event.setTipoGarantia(command.getTipoGarantia());
        event.setDescripcionGarantia(command.getDescripcionGarantia());

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handle(UpdateTradeFinancingCommand command) {
        if (this.deleted) {
            throw new IllegalStateException("No se puede actualizar un financiamiento eliminado");
        }

        FinanciamientoCxUpdatedEvent event = new FinanciamientoCxUpdatedEvent(
                this.financiamientoCxId,
                command.getNumeroOperacion(),
                command.getEstado(),
                command.getUsuarioModificacion() != null ? command.getUsuarioModificacion() : "system"
        );

        // Set all fields for update
        event.setTipo(command.getTipo());
        event.setClienteId(command.getClienteId());
        event.setMoneda(command.getMoneda());
        event.setMontoSolicitado(command.getMontoSolicitado());
        event.setOperacionVinculadaTipo(command.getOperacionVinculadaTipo());
        event.setOperacionVinculadaId(command.getOperacionVinculadaId());
        event.setLineaCreditoId(command.getLineaCreditoId());
        event.setMontoAprobado(command.getMontoAprobado());
        event.setMontoDesembolsado(command.getMontoDesembolsado());
        event.setPlazoDias(command.getPlazoDias());
        event.setTasaInteres(command.getTasaInteres());
        event.setTasaMora(command.getTasaMora());
        event.setComisionApertura(command.getComisionApertura());
        event.setFechaDesembolso(command.getFechaDesembolso());
        event.setFechaVencimiento(command.getFechaVencimiento());
        event.setTipoGarantia(command.getTipoGarantia());
        event.setDescripcionGarantia(command.getDescripcionGarantia());

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handleDelete(String deletedBy) {
        if (this.deleted) {
            throw new IllegalStateException("El financiamiento ya esta eliminado");
        }

        FinanciamientoCxDeletedEvent event = new FinanciamientoCxDeletedEvent(
                this.financiamientoCxId,
                deletedBy != null ? deletedBy : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    private void apply(FinanciamientoCxCreatedEvent event) {
        this.financiamientoCxId = event.getFinanciamientoCxId();
        this.numeroOperacion = event.getNumeroOperacion();
        this.tipo = event.getTipo();
        this.clienteId = event.getClienteId();
        this.moneda = event.getMoneda();
        this.montoSolicitado = event.getMontoSolicitado();
        this.estado = event.getEstado();
        this.operacionVinculadaTipo = event.getOperacionVinculadaTipo();
        this.operacionVinculadaId = event.getOperacionVinculadaId();
        this.lineaCreditoId = event.getLineaCreditoId();
        this.montoAprobado = event.getMontoAprobado();
        this.montoDesembolsado = event.getMontoDesembolsado();
        this.plazoDias = event.getPlazoDias();
        this.tasaInteres = event.getTasaInteres();
        this.tasaMora = event.getTasaMora();
        this.comisionApertura = event.getComisionApertura();
        this.fechaDesembolso = event.getFechaDesembolso();
        this.fechaVencimiento = event.getFechaVencimiento();
        this.tipoGarantia = event.getTipoGarantia();
        this.descripcionGarantia = event.getDescripcionGarantia();
        this.deleted = false;
        this.version++;
    }

    private void apply(FinanciamientoCxUpdatedEvent event) {
        if (event.getNumeroOperacion() != null) this.numeroOperacion = event.getNumeroOperacion();
        if (event.getTipo() != null) this.tipo = event.getTipo();
        if (event.getClienteId() != null) this.clienteId = event.getClienteId();
        if (event.getMoneda() != null) this.moneda = event.getMoneda();
        if (event.getMontoSolicitado() != null) this.montoSolicitado = event.getMontoSolicitado();
        if (event.getEstado() != null) this.estado = event.getEstado();
        if (event.getOperacionVinculadaTipo() != null) this.operacionVinculadaTipo = event.getOperacionVinculadaTipo();
        if (event.getOperacionVinculadaId() != null) this.operacionVinculadaId = event.getOperacionVinculadaId();
        if (event.getLineaCreditoId() != null) this.lineaCreditoId = event.getLineaCreditoId();
        if (event.getMontoAprobado() != null) this.montoAprobado = event.getMontoAprobado();
        if (event.getMontoDesembolsado() != null) this.montoDesembolsado = event.getMontoDesembolsado();
        if (event.getPlazoDias() != null) this.plazoDias = event.getPlazoDias();
        if (event.getTasaInteres() != null) this.tasaInteres = event.getTasaInteres();
        if (event.getTasaMora() != null) this.tasaMora = event.getTasaMora();
        if (event.getComisionApertura() != null) this.comisionApertura = event.getComisionApertura();
        if (event.getFechaDesembolso() != null) this.fechaDesembolso = event.getFechaDesembolso();
        if (event.getFechaVencimiento() != null) this.fechaVencimiento = event.getFechaVencimiento();
        if (event.getTipoGarantia() != null) this.tipoGarantia = event.getTipoGarantia();
        if (event.getDescripcionGarantia() != null) this.descripcionGarantia = event.getDescripcionGarantia();
        this.version++;
    }

    private void apply(FinanciamientoCxDeletedEvent event) {
        this.deleted = true;
        this.version++;
    }

    public void loadFromHistory(List<DomainEvent> events) {
        for (DomainEvent event : events) {
            if (event instanceof FinanciamientoCxCreatedEvent) {
                apply((FinanciamientoCxCreatedEvent) event);
            } else if (event instanceof FinanciamientoCxUpdatedEvent) {
                apply((FinanciamientoCxUpdatedEvent) event);
            } else if (event instanceof FinanciamientoCxDeletedEvent) {
                apply((FinanciamientoCxDeletedEvent) event);
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
