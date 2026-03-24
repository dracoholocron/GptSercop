package com.globalcmx.api.eventsourcing.aggregate;

import com.globalcmx.api.dto.command.CreateDocumentaryCollectionCommand;
import com.globalcmx.api.dto.command.UpdateDocumentaryCollectionCommand;
import com.globalcmx.api.eventsourcing.event.DocumentaryCollectionCreatedEvent;
import com.globalcmx.api.eventsourcing.event.DocumentaryCollectionDeletedEvent;
import com.globalcmx.api.eventsourcing.event.DocumentaryCollectionUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
public class DocumentaryCollectionAggregate {
    private Long cobranzaId;
    private String numeroOperacion;
    private String tipo;
    private String modalidad;
    private String estado;

    // Partes
    private Long libradorId;
    private Long libradoId;
    private Long bancoRemitenteId;
    private Long bancoCobradorId;

    // Montos
    private String moneda;
    private BigDecimal monto;
    private LocalDate fechaRecepcion;
    private LocalDate fechaVencimiento;
    private LocalDate fechaPago;
    private LocalDate fechaAceptacion;

    // Documentos
    private Boolean conocimientoEmbarque;
    private Boolean facturaComercial;
    private Boolean certificadoOrigen;
    private String documentosAnexos;

    // SWIFT
    private String swiftMt400;
    private String swiftMt410;
    private String swiftMt412;

    // Instrucciones
    private String instruccionesProtesto;
    private String instruccionesImpago;
    private String observaciones;

    private boolean deleted = false;
    private Long version = 0L;

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public DocumentaryCollectionAggregate() {
    }

    public DocumentaryCollectionAggregate(Long cobranzaId) {
        this.cobranzaId = cobranzaId;
    }

    public void handle(CreateDocumentaryCollectionCommand command) {
        DocumentaryCollectionCreatedEvent event = new DocumentaryCollectionCreatedEvent(
                this.cobranzaId,
                command.getNumeroOperacion(),
                command.getTipo(),
                command.getModalidad(),
                command.getEstado(),
                command.getMoneda(),
                command.getMonto(),
                command.getCreatedBy() != null ? command.getCreatedBy() : "system"
        );

        // Set additional fields
        event.setLibradorId(command.getLibradorId());
        event.setLibradoId(command.getLibradoId());
        event.setBancoRemitenteId(command.getBancoRemitenteId());
        event.setBancoCobradorId(command.getBancoCobradorId());
        event.setFechaRecepcion(command.getFechaRecepcion());
        event.setFechaVencimiento(command.getFechaVencimiento());
        event.setFechaPago(command.getFechaPago());
        event.setFechaAceptacion(command.getFechaAceptacion());
        event.setConocimientoEmbarque(command.getConocimientoEmbarque());
        event.setFacturaComercial(command.getFacturaComercial());
        event.setCertificadoOrigen(command.getCertificadoOrigen());
        event.setDocumentosAnexos(command.getDocumentosAnexos());
        event.setSwiftMt400(command.getSwiftMt400());
        event.setSwiftMt410(command.getSwiftMt410());
        event.setSwiftMt412(command.getSwiftMt412());
        event.setInstruccionesProtesto(command.getInstruccionesProtesto());
        event.setInstruccionesImpago(command.getInstruccionesImpago());
        event.setObservaciones(command.getObservaciones());

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handle(UpdateDocumentaryCollectionCommand command) {
        if (this.deleted) {
            throw new IllegalStateException("No se puede actualizar una cobranza documentaria eliminada");
        }

        DocumentaryCollectionUpdatedEvent event = new DocumentaryCollectionUpdatedEvent(
                this.cobranzaId,
                command.getNumeroOperacion(),
                command.getTipo(),
                command.getModalidad(),
                command.getEstado(),
                command.getMoneda(),
                command.getMonto(),
                command.getUpdatedBy() != null ? command.getUpdatedBy() : "system"
        );

        // Set additional fields
        event.setLibradorId(command.getLibradorId());
        event.setLibradoId(command.getLibradoId());
        event.setBancoRemitenteId(command.getBancoRemitenteId());
        event.setBancoCobradorId(command.getBancoCobradorId());
        event.setFechaRecepcion(command.getFechaRecepcion());
        event.setFechaVencimiento(command.getFechaVencimiento());
        event.setFechaPago(command.getFechaPago());
        event.setFechaAceptacion(command.getFechaAceptacion());
        event.setConocimientoEmbarque(command.getConocimientoEmbarque());
        event.setFacturaComercial(command.getFacturaComercial());
        event.setCertificadoOrigen(command.getCertificadoOrigen());
        event.setDocumentosAnexos(command.getDocumentosAnexos());
        event.setSwiftMt400(command.getSwiftMt400());
        event.setSwiftMt410(command.getSwiftMt410());
        event.setSwiftMt412(command.getSwiftMt412());
        event.setInstruccionesProtesto(command.getInstruccionesProtesto());
        event.setInstruccionesImpago(command.getInstruccionesImpago());
        event.setObservaciones(command.getObservaciones());

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handleDelete(String deletedBy) {
        if (this.deleted) {
            throw new IllegalStateException("La cobranza documentaria ya está eliminada");
        }

        DocumentaryCollectionDeletedEvent event = new DocumentaryCollectionDeletedEvent(
                this.cobranzaId,
                deletedBy != null ? deletedBy : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    private void apply(DocumentaryCollectionCreatedEvent event) {
        this.cobranzaId = event.getCobranzaId();
        this.numeroOperacion = event.getNumeroOperacion();
        this.tipo = event.getTipo();
        this.modalidad = event.getModalidad();
        this.estado = event.getEstado();
        this.libradorId = event.getLibradorId();
        this.libradoId = event.getLibradoId();
        this.bancoRemitenteId = event.getBancoRemitenteId();
        this.bancoCobradorId = event.getBancoCobradorId();
        this.moneda = event.getMoneda();
        this.monto = event.getMonto();
        this.fechaRecepcion = event.getFechaRecepcion();
        this.fechaVencimiento = event.getFechaVencimiento();
        this.fechaPago = event.getFechaPago();
        this.fechaAceptacion = event.getFechaAceptacion();
        this.conocimientoEmbarque = event.getConocimientoEmbarque();
        this.facturaComercial = event.getFacturaComercial();
        this.certificadoOrigen = event.getCertificadoOrigen();
        this.documentosAnexos = event.getDocumentosAnexos();
        this.swiftMt400 = event.getSwiftMt400();
        this.swiftMt410 = event.getSwiftMt410();
        this.swiftMt412 = event.getSwiftMt412();
        this.instruccionesProtesto = event.getInstruccionesProtesto();
        this.instruccionesImpago = event.getInstruccionesImpago();
        this.observaciones = event.getObservaciones();
        this.deleted = false;
        this.version++;
    }

    private void apply(DocumentaryCollectionUpdatedEvent event) {
        this.numeroOperacion = event.getNumeroOperacion();
        this.tipo = event.getTipo();
        this.modalidad = event.getModalidad();
        this.estado = event.getEstado();
        this.libradorId = event.getLibradorId();
        this.libradoId = event.getLibradoId();
        this.bancoRemitenteId = event.getBancoRemitenteId();
        this.bancoCobradorId = event.getBancoCobradorId();
        this.moneda = event.getMoneda();
        this.monto = event.getMonto();
        this.fechaRecepcion = event.getFechaRecepcion();
        this.fechaVencimiento = event.getFechaVencimiento();
        this.fechaPago = event.getFechaPago();
        this.fechaAceptacion = event.getFechaAceptacion();
        this.conocimientoEmbarque = event.getConocimientoEmbarque();
        this.facturaComercial = event.getFacturaComercial();
        this.certificadoOrigen = event.getCertificadoOrigen();
        this.documentosAnexos = event.getDocumentosAnexos();
        this.swiftMt400 = event.getSwiftMt400();
        this.swiftMt410 = event.getSwiftMt410();
        this.swiftMt412 = event.getSwiftMt412();
        this.instruccionesProtesto = event.getInstruccionesProtesto();
        this.instruccionesImpago = event.getInstruccionesImpago();
        this.observaciones = event.getObservaciones();
        this.version++;
    }

    private void apply(DocumentaryCollectionDeletedEvent event) {
        this.deleted = true;
        this.version++;
    }

    public void loadFromHistory(List<DomainEvent> events) {
        for (DomainEvent event : events) {
            if (event instanceof DocumentaryCollectionCreatedEvent) {
                apply((DocumentaryCollectionCreatedEvent) event);
            } else if (event instanceof DocumentaryCollectionUpdatedEvent) {
                apply((DocumentaryCollectionUpdatedEvent) event);
            } else if (event instanceof DocumentaryCollectionDeletedEvent) {
                apply((DocumentaryCollectionDeletedEvent) event);
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
