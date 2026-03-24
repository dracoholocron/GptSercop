package com.globalcmx.api.eventsourcing.aggregate;

import com.globalcmx.api.dto.command.CreateBankGuaranteeCommand;
import com.globalcmx.api.dto.command.UpdateBankGuaranteeCommand;
import com.globalcmx.api.eventsourcing.event.BankGuaranteeCreatedEvent;
import com.globalcmx.api.eventsourcing.event.BankGuaranteeDeletedEvent;
import com.globalcmx.api.eventsourcing.event.BankGuaranteeUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
public class BankGuaranteeAggregate {
    private Long garantiaId;
    private String numeroGarantia;
    private String tipo;
    private String subtipo;
    private String estado;

    // Partes
    private Long ordenanteId;
    private Long beneficiarioId;
    private Long bancoGaranteId;
    private Long bancoContragaranteId;

    // Montos
    private String moneda;
    private BigDecimal monto;
    private BigDecimal porcentajeProyecto;
    private LocalDate fechaEmision;
    private LocalDate fechaVencimiento;
    private LocalDate fechaEjecucion;
    private LocalDate fechaLiberacion;

    // Detalles del proyecto/contrato
    private String numeroContrato;
    private String objetoContrato;
    private BigDecimal montoContrato;
    private String descripcion;

    // Condiciones
    private Boolean esReducible;
    private String formulaReduccion;
    private String condicionesEjecucion;
    private String condicionesLiberacion;

    // SWIFT
    private String swiftMt760;
    private String swiftMt767;

    private boolean deleted = false;
    private Long version = 0L;

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public BankGuaranteeAggregate() {
    }

    public BankGuaranteeAggregate(Long garantiaId) {
        this.garantiaId = garantiaId;
    }

    public void handle(CreateBankGuaranteeCommand command) {
        BankGuaranteeCreatedEvent event = new BankGuaranteeCreatedEvent(
                this.garantiaId,
                command.getNumeroGarantia(),
                command.getTipo(),
                command.getSubtipo(),
                command.getEstado(),
                command.getOrdenanteId(),
                command.getBeneficiarioId(),
                command.getMoneda(),
                command.getMonto(),
                command.getFechaEmision(),
                command.getFechaVencimiento(),
                command.getCreatedBy() != null ? command.getCreatedBy() : "system"
        );

        // Set optional fields
        event.setBancoGaranteId(command.getBancoGaranteId());
        event.setBancoContragaranteId(command.getBancoContragaranteId());
        event.setPorcentajeProyecto(command.getPorcentajeProyecto());
        event.setFechaEjecucion(command.getFechaEjecucion());
        event.setFechaLiberacion(command.getFechaLiberacion());
        event.setNumeroContrato(command.getNumeroContrato());
        event.setObjetoContrato(command.getObjetoContrato());
        event.setMontoContrato(command.getMontoContrato());
        event.setDescripcion(command.getDescripcion());
        event.setEsReducible(command.getEsReducible());
        event.setFormulaReduccion(command.getFormulaReduccion());
        event.setCondicionesEjecucion(command.getCondicionesEjecucion());
        event.setCondicionesLiberacion(command.getCondicionesLiberacion());
        event.setSwiftMt760(command.getSwiftMt760());
        event.setSwiftMt767(command.getSwiftMt767());

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handle(UpdateBankGuaranteeCommand command) {
        if (this.deleted) {
            throw new IllegalStateException("No se puede actualizar una garantía bancaria eliminada");
        }

        BankGuaranteeUpdatedEvent event = new BankGuaranteeUpdatedEvent(
                this.garantiaId,
                command.getNumeroGarantia(),
                command.getTipo(),
                command.getSubtipo(),
                command.getEstado(),
                command.getOrdenanteId(),
                command.getBeneficiarioId(),
                command.getMoneda(),
                command.getMonto(),
                command.getFechaEmision(),
                command.getFechaVencimiento(),
                command.getUpdatedBy() != null ? command.getUpdatedBy() : "system"
        );

        // Set optional fields
        event.setBancoGaranteId(command.getBancoGaranteId());
        event.setBancoContragaranteId(command.getBancoContragaranteId());
        event.setPorcentajeProyecto(command.getPorcentajeProyecto());
        event.setFechaEjecucion(command.getFechaEjecucion());
        event.setFechaLiberacion(command.getFechaLiberacion());
        event.setNumeroContrato(command.getNumeroContrato());
        event.setObjetoContrato(command.getObjetoContrato());
        event.setMontoContrato(command.getMontoContrato());
        event.setDescripcion(command.getDescripcion());
        event.setEsReducible(command.getEsReducible());
        event.setFormulaReduccion(command.getFormulaReduccion());
        event.setCondicionesEjecucion(command.getCondicionesEjecucion());
        event.setCondicionesLiberacion(command.getCondicionesLiberacion());
        event.setSwiftMt760(command.getSwiftMt760());
        event.setSwiftMt767(command.getSwiftMt767());

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handleDelete(String deletedBy) {
        if (this.deleted) {
            throw new IllegalStateException("La garantía bancaria ya está eliminada");
        }

        BankGuaranteeDeletedEvent event = new BankGuaranteeDeletedEvent(
                this.garantiaId,
                deletedBy != null ? deletedBy : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    private void apply(BankGuaranteeCreatedEvent event) {
        this.garantiaId = event.getGarantiaId();
        this.numeroGarantia = event.getNumeroGarantia();
        this.tipo = event.getTipo();
        this.subtipo = event.getSubtipo();
        this.estado = event.getEstado();
        this.ordenanteId = event.getOrdenanteId();
        this.beneficiarioId = event.getBeneficiarioId();
        this.bancoGaranteId = event.getBancoGaranteId();
        this.bancoContragaranteId = event.getBancoContragaranteId();
        this.moneda = event.getMoneda();
        this.monto = event.getMonto();
        this.porcentajeProyecto = event.getPorcentajeProyecto();
        this.fechaEmision = event.getFechaEmision();
        this.fechaVencimiento = event.getFechaVencimiento();
        this.fechaEjecucion = event.getFechaEjecucion();
        this.fechaLiberacion = event.getFechaLiberacion();
        this.numeroContrato = event.getNumeroContrato();
        this.objetoContrato = event.getObjetoContrato();
        this.montoContrato = event.getMontoContrato();
        this.descripcion = event.getDescripcion();
        this.esReducible = event.getEsReducible();
        this.formulaReduccion = event.getFormulaReduccion();
        this.condicionesEjecucion = event.getCondicionesEjecucion();
        this.condicionesLiberacion = event.getCondicionesLiberacion();
        this.swiftMt760 = event.getSwiftMt760();
        this.swiftMt767 = event.getSwiftMt767();
        this.deleted = false;
        this.version++;
    }

    private void apply(BankGuaranteeUpdatedEvent event) {
        this.numeroGarantia = event.getNumeroGarantia();
        this.tipo = event.getTipo();
        this.subtipo = event.getSubtipo();
        this.estado = event.getEstado();
        this.ordenanteId = event.getOrdenanteId();
        this.beneficiarioId = event.getBeneficiarioId();
        this.bancoGaranteId = event.getBancoGaranteId();
        this.bancoContragaranteId = event.getBancoContragaranteId();
        this.moneda = event.getMoneda();
        this.monto = event.getMonto();
        this.porcentajeProyecto = event.getPorcentajeProyecto();
        this.fechaEmision = event.getFechaEmision();
        this.fechaVencimiento = event.getFechaVencimiento();
        this.fechaEjecucion = event.getFechaEjecucion();
        this.fechaLiberacion = event.getFechaLiberacion();
        this.numeroContrato = event.getNumeroContrato();
        this.objetoContrato = event.getObjetoContrato();
        this.montoContrato = event.getMontoContrato();
        this.descripcion = event.getDescripcion();
        this.esReducible = event.getEsReducible();
        this.formulaReduccion = event.getFormulaReduccion();
        this.condicionesEjecucion = event.getCondicionesEjecucion();
        this.condicionesLiberacion = event.getCondicionesLiberacion();
        this.swiftMt760 = event.getSwiftMt760();
        this.swiftMt767 = event.getSwiftMt767();
        this.version++;
    }

    private void apply(BankGuaranteeDeletedEvent event) {
        this.deleted = true;
        this.version++;
    }

    public void loadFromHistory(List<DomainEvent> events) {
        for (DomainEvent event : events) {
            if (event instanceof BankGuaranteeCreatedEvent) {
                apply((BankGuaranteeCreatedEvent) event);
            } else if (event instanceof BankGuaranteeUpdatedEvent) {
                apply((BankGuaranteeUpdatedEvent) event);
            } else if (event instanceof BankGuaranteeDeletedEvent) {
                apply((BankGuaranteeDeletedEvent) event);
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
