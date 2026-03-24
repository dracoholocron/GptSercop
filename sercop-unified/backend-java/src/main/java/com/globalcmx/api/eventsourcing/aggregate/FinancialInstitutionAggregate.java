package com.globalcmx.api.eventsourcing.aggregate;

import com.globalcmx.api.dto.command.CreateFinancialInstitutionCommand;
import com.globalcmx.api.dto.command.UpdateFinancialInstitutionCommand;
import com.globalcmx.api.eventsourcing.event.FinancialInstitutionCreatedEvent;
import com.globalcmx.api.eventsourcing.event.FinancialInstitutionDeletedEvent;
import com.globalcmx.api.eventsourcing.event.FinancialInstitutionUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class FinancialInstitutionAggregate {
    private Long institucionId;
    private String codigo;
    private String nombre;
    private String swiftCode;
    private String pais;
    private String ciudad;
    private String direccion;
    private String tipo;
    private String rating;
    private Boolean esCorresponsal;
    private Boolean activo;
    private boolean deleted = false;
    private Long version = 0L;

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public FinancialInstitutionAggregate() {
    }

    public FinancialInstitutionAggregate(Long institucionId) {
        this.institucionId = institucionId;
    }

    public void handle(CreateFinancialInstitutionCommand command) {
        FinancialInstitutionCreatedEvent event = new FinancialInstitutionCreatedEvent(
                this.institucionId,
                command.getCodigo(),
                command.getNombre(),
                command.getSwiftCode(),
                command.getPais(),
                command.getTipo(),
                command.getActivo(),
                command.getCreatedBy() != null ? command.getCreatedBy() : "system"
        );

        event.setCiudad(command.getCiudad());
        event.setDireccion(command.getDireccion());
        event.setRating(command.getRating());
        event.setEsCorresponsal(command.getEsCorresponsal());

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handle(UpdateFinancialInstitutionCommand command) {
        if (this.deleted) {
            throw new IllegalStateException("No se puede actualizar una institución financiera eliminada");
        }

        FinancialInstitutionUpdatedEvent event = new FinancialInstitutionUpdatedEvent(
                this.institucionId,
                command.getCodigo(),
                command.getNombre(),
                command.getSwiftCode(),
                command.getPais(),
                command.getTipo(),
                command.getActivo(),
                command.getUpdatedBy() != null ? command.getUpdatedBy() : "system"
        );

        event.setCiudad(command.getCiudad());
        event.setDireccion(command.getDireccion());
        event.setRating(command.getRating());
        event.setEsCorresponsal(command.getEsCorresponsal());

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handleDelete(String deletedBy) {
        if (this.deleted) {
            throw new IllegalStateException("La institución financiera ya está eliminada");
        }

        FinancialInstitutionDeletedEvent event = new FinancialInstitutionDeletedEvent(
                this.institucionId,
                deletedBy != null ? deletedBy : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    private void apply(FinancialInstitutionCreatedEvent event) {
        this.institucionId = event.getInstitucionId();
        this.codigo = event.getCodigo();
        this.nombre = event.getNombre();
        this.swiftCode = event.getSwiftCode();
        this.pais = event.getPais();
        this.ciudad = event.getCiudad();
        this.direccion = event.getDireccion();
        this.tipo = event.getTipo();
        this.rating = event.getRating();
        this.esCorresponsal = event.getEsCorresponsal();
        this.activo = event.getActivo();
        this.deleted = false;
        this.version++;
    }

    private void apply(FinancialInstitutionUpdatedEvent event) {
        this.codigo = event.getCodigo();
        this.nombre = event.getNombre();
        this.swiftCode = event.getSwiftCode();
        this.pais = event.getPais();
        this.ciudad = event.getCiudad();
        this.direccion = event.getDireccion();
        this.tipo = event.getTipo();
        this.rating = event.getRating();
        this.esCorresponsal = event.getEsCorresponsal();
        this.activo = event.getActivo();
        this.version++;
    }

    private void apply(FinancialInstitutionDeletedEvent event) {
        this.deleted = true;
        this.version++;
    }

    public void loadFromHistory(List<DomainEvent> events) {
        for (DomainEvent event : events) {
            if (event instanceof FinancialInstitutionCreatedEvent) {
                apply((FinancialInstitutionCreatedEvent) event);
            } else if (event instanceof FinancialInstitutionUpdatedEvent) {
                apply((FinancialInstitutionUpdatedEvent) event);
            } else if (event instanceof FinancialInstitutionDeletedEvent) {
                apply((FinancialInstitutionDeletedEvent) event);
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
