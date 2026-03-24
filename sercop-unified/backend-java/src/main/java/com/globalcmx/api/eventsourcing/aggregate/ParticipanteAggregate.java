package com.globalcmx.api.eventsourcing.aggregate;

import com.globalcmx.api.dto.command.CreateParticipantCommand;
import com.globalcmx.api.dto.command.UpdateParticipantCommand;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import com.globalcmx.api.eventsourcing.event.ParticipanteCreatedEvent;
import com.globalcmx.api.eventsourcing.event.ParticipanteDeletedEvent;
import com.globalcmx.api.eventsourcing.event.ParticipanteUpdatedEvent;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class ParticipanteAggregate {
    private Long participanteId;
    private String identificacion;
    private String tipo;
    private String tipoReferencia;
    private String nombres;
    private String apellidos;
    private String email;
    private String telefono;
    private String direccion;
    private String agencia;
    private String ejecutivoAsignado;
    private String ejecutivoId;
    private String correoEjecutivo;
    private String autenticador;
    private boolean deleted = false;
    private Long version = 0L;

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public ParticipanteAggregate() {
    }

    public ParticipanteAggregate(Long participanteId) {
        this.participanteId = participanteId;
    }

    public void handle(CreateParticipantCommand command) {
        ParticipanteCreatedEvent event = new ParticipanteCreatedEvent(
                this.participanteId,
                command.getIdentificacion(),
                command.getTipo(),
                command.getTipoReferencia(),
                command.getNombres(),
                command.getApellidos(),
                command.getEmail(),
                command.getTelefono(),
                command.getDireccion(),
                command.getAgencia(),
                command.getEjecutivoAsignado(),
                command.getEjecutivoId(),
                command.getCorreoEjecutivo(),
                command.getAutenticador(),
                command.getCreatedBy() != null ? command.getCreatedBy() : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handle(UpdateParticipantCommand command) {
        if (this.deleted) {
            throw new IllegalStateException("No se puede actualizar un participante eliminado");
        }

        ParticipanteUpdatedEvent event = new ParticipanteUpdatedEvent(
                this.participanteId,
                command.getIdentificacion(),
                command.getTipo(),
                command.getTipoReferencia(),
                command.getNombres(),
                command.getApellidos(),
                command.getEmail(),
                command.getTelefono(),
                command.getDireccion(),
                command.getAgencia(),
                command.getEjecutivoAsignado(),
                command.getEjecutivoId(),
                command.getCorreoEjecutivo(),
                command.getAutenticador(),
                command.getUpdatedBy() != null ? command.getUpdatedBy() : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handleDelete(String deletedBy) {
        if (this.deleted) {
            throw new IllegalStateException("El participante ya está eliminado");
        }

        ParticipanteDeletedEvent event = new ParticipanteDeletedEvent(
                this.participanteId,
                deletedBy != null ? deletedBy : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    private void apply(ParticipanteCreatedEvent event) {
        this.participanteId = event.getParticipanteId();
        this.identificacion = event.getIdentificacion();
        this.tipo = event.getTipo();
        this.tipoReferencia = event.getTipoReferencia();
        this.nombres = event.getNombres();
        this.apellidos = event.getApellidos();
        this.email = event.getEmail();
        this.telefono = event.getTelefono();
        this.direccion = event.getDireccion();
        this.agencia = event.getAgencia();
        this.ejecutivoAsignado = event.getEjecutivoAsignado();
        this.ejecutivoId = event.getEjecutivoId();
        this.correoEjecutivo = event.getCorreoEjecutivo();
        this.autenticador = event.getAutenticador();
        this.deleted = false;
        this.version++;
    }

    private void apply(ParticipanteUpdatedEvent event) {
        this.identificacion = event.getIdentificacion();
        this.tipo = event.getTipo();
        this.tipoReferencia = event.getTipoReferencia();
        this.nombres = event.getNombres();
        this.apellidos = event.getApellidos();
        this.email = event.getEmail();
        this.telefono = event.getTelefono();
        this.direccion = event.getDireccion();
        this.agencia = event.getAgencia();
        this.ejecutivoAsignado = event.getEjecutivoAsignado();
        this.ejecutivoId = event.getEjecutivoId();
        this.correoEjecutivo = event.getCorreoEjecutivo();
        this.autenticador = event.getAutenticador();
        this.version++;
    }

    private void apply(ParticipanteDeletedEvent event) {
        this.deleted = true;
        this.version++;
    }

    public void loadFromHistory(List<DomainEvent> events) {
        for (DomainEvent event : events) {
            if (event instanceof ParticipanteCreatedEvent) {
                apply((ParticipanteCreatedEvent) event);
            } else if (event instanceof ParticipanteUpdatedEvent) {
                apply((ParticipanteUpdatedEvent) event);
            } else if (event instanceof ParticipanteDeletedEvent) {
                apply((ParticipanteDeletedEvent) event);
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
