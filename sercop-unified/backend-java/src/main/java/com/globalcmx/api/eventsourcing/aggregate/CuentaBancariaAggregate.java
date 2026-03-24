package com.globalcmx.api.eventsourcing.aggregate;

import com.globalcmx.api.dto.command.CreateBankAccountCommand;
import com.globalcmx.api.dto.command.UpdateBankAccountCommand;
import com.globalcmx.api.eventsourcing.event.CuentaBancariaCreatedEvent;
import com.globalcmx.api.eventsourcing.event.CuentaBancariaDeletedEvent;
import com.globalcmx.api.eventsourcing.event.CuentaBancariaUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class CuentaBancariaAggregate {
    private Long cuentaBancariaId;
    private String identificacionParticipante;
    private String nombresParticipante;
    private String apellidosParticipante;
    private String numeroCuenta;
    private String identificacionCuenta;
    private String tipo;
    private Boolean activo;
    private boolean deleted = false;
    private Long version = 0L;

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public CuentaBancariaAggregate() {
    }

    public CuentaBancariaAggregate(Long cuentaBancariaId) {
        this.cuentaBancariaId = cuentaBancariaId;
    }

    public void handle(CreateBankAccountCommand command) {
        CuentaBancariaCreatedEvent event = new CuentaBancariaCreatedEvent(
                this.cuentaBancariaId,
                command.getIdentificacionParticipante(),
                command.getNombresParticipante(),
                command.getApellidosParticipante(),
                command.getNumeroCuenta(),
                command.getIdentificacionCuenta(),
                command.getTipo(),
                command.getActivo(),
                command.getCreatedBy() != null ? command.getCreatedBy() : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handle(UpdateBankAccountCommand command) {
        if (this.deleted) {
            throw new IllegalStateException("No se puede actualizar una cuenta bancaria eliminada");
        }

        CuentaBancariaUpdatedEvent event = new CuentaBancariaUpdatedEvent(
                this.cuentaBancariaId,
                command.getIdentificacionParticipante(),
                command.getNombresParticipante(),
                command.getApellidosParticipante(),
                command.getNumeroCuenta(),
                command.getIdentificacionCuenta(),
                command.getTipo(),
                command.getActivo(),
                command.getUpdatedBy() != null ? command.getUpdatedBy() : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handleDelete(String deletedBy) {
        if (this.deleted) {
            throw new IllegalStateException("La cuenta bancaria ya está eliminada");
        }

        CuentaBancariaDeletedEvent event = new CuentaBancariaDeletedEvent(
                this.cuentaBancariaId,
                deletedBy != null ? deletedBy : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    private void apply(CuentaBancariaCreatedEvent event) {
        this.cuentaBancariaId = event.getCuentaBancariaId();
        this.identificacionParticipante = event.getIdentificacionParticipante();
        this.nombresParticipante = event.getNombresParticipante();
        this.apellidosParticipante = event.getApellidosParticipante();
        this.numeroCuenta = event.getNumeroCuenta();
        this.identificacionCuenta = event.getIdentificacionCuenta();
        this.tipo = event.getTipo();
        this.activo = event.getActivo();
        this.deleted = false;
        this.version++;
    }

    private void apply(CuentaBancariaUpdatedEvent event) {
        this.identificacionParticipante = event.getIdentificacionParticipante();
        this.nombresParticipante = event.getNombresParticipante();
        this.apellidosParticipante = event.getApellidosParticipante();
        this.numeroCuenta = event.getNumeroCuenta();
        this.identificacionCuenta = event.getIdentificacionCuenta();
        this.tipo = event.getTipo();
        this.activo = event.getActivo();
        this.version++;
    }

    private void apply(CuentaBancariaDeletedEvent event) {
        this.deleted = true;
        this.version++;
    }

    public void loadFromHistory(List<DomainEvent> events) {
        for (DomainEvent event : events) {
            if (event instanceof CuentaBancariaCreatedEvent) {
                apply((CuentaBancariaCreatedEvent) event);
            } else if (event instanceof CuentaBancariaUpdatedEvent) {
                apply((CuentaBancariaUpdatedEvent) event);
            } else if (event instanceof CuentaBancariaDeletedEvent) {
                apply((CuentaBancariaDeletedEvent) event);
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
