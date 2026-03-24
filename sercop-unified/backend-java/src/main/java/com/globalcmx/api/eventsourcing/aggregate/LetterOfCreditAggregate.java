package com.globalcmx.api.eventsourcing.aggregate;

import com.globalcmx.api.dto.command.CreateLetterOfCreditCommand;
import com.globalcmx.api.dto.command.UpdateLetterOfCreditCommand;
import com.globalcmx.api.eventsourcing.event.LetterOfCreditCreatedEvent;
import com.globalcmx.api.eventsourcing.event.LetterOfCreditDeletedEvent;
import com.globalcmx.api.eventsourcing.event.LetterOfCreditUpdatedEvent;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
public class LetterOfCreditAggregate {
    private Long cartaCreditoId;
    private String numeroOperacion;
    private String tipoLc;
    private String modalidad;
    private String formaPago;
    private String estado;
    private Long ordenanteId;
    private Long beneficiarioId;
    private Long bancoEmisorId;
    private String moneda;
    private BigDecimal monto;
    private BigDecimal montoUtilizado;
    private LocalDate fechaEmision;
    private LocalDate fechaVencimiento;
    private Boolean draft;
    private boolean deleted = false;
    private Long version = 0L;

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public LetterOfCreditAggregate() {
    }

    public LetterOfCreditAggregate(Long cartaCreditoId) {
        this.cartaCreditoId = cartaCreditoId;
    }

    public void handle(CreateLetterOfCreditCommand command) {
        LetterOfCreditCreatedEvent event = new LetterOfCreditCreatedEvent(
                this.cartaCreditoId,
                command.getNumeroOperacion(),
                command.getTipoLc(),
                command.getModalidad(),
                command.getFormaPago(),
                command.getEstado(),
                command.getOrdenanteId(),
                command.getBeneficiarioId(),
                command.getBancoEmisorId(),
                command.getMoneda(),
                command.getMonto(),
                command.getFechaEmision(),
                command.getFechaVencimiento(),
                command.getUsuarioCreacion() != null ? command.getUsuarioCreacion() : "system"
        );

        // Set additional fields
        event.setBancoAvisadorId(command.getBancoAvisadorId());
        event.setBancoConfirmadorId(command.getBancoConfirmadorId());
        event.setBancoPagadorId(command.getBancoPagadorId());
        event.setPorcentajeTolerancia(command.getPorcentajeTolerancia());
        event.setFechaUltimoEmbarque(command.getFechaUltimoEmbarque());
        event.setLugarEmbarque(command.getLugarEmbarque());
        event.setLugarDestino(command.getLugarDestino());
        event.setRequiereFacturaComercial(command.getRequiereFacturaComercial());
        event.setRequierePackingList(command.getRequierePackingList());
        event.setRequiereConocimientoEmbarque(command.getRequiereConocimientoEmbarque());
        event.setRequiereCertificadoOrigen(command.getRequiereCertificadoOrigen());
        event.setRequiereCertificadoSeguro(command.getRequiereCertificadoSeguro());
        event.setDocumentosAdicionales(command.getDocumentosAdicionales());
        event.setIncoterm(command.getIncoterm());
        event.setDescripcionMercancia(command.getDescripcionMercancia());
        event.setCondicionesEspeciales(command.getCondicionesEspeciales());
        event.setInstruccionesEmbarque(command.getInstruccionesEmbarque());
        event.setDraft(command.getDraft());

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handle(UpdateLetterOfCreditCommand command) {
        if (this.deleted) {
            throw new IllegalStateException("No se puede actualizar una carta de crédito eliminada");
        }

        LetterOfCreditUpdatedEvent event = new LetterOfCreditUpdatedEvent(
                this.cartaCreditoId,
                command.getNumeroOperacion(),
                command.getEstado(),
                command.getMontoUtilizado(),
                command.getUsuarioModificacion() != null ? command.getUsuarioModificacion() : "system"
        );

        // Set all fields for update
        event.setTipoLc(command.getTipoLc());
        event.setModalidad(command.getModalidad());
        event.setFormaPago(command.getFormaPago());
        event.setOrdenanteId(command.getOrdenanteId());
        event.setBeneficiarioId(command.getBeneficiarioId());
        event.setBancoEmisorId(command.getBancoEmisorId());
        event.setBancoAvisadorId(command.getBancoAvisadorId());
        event.setBancoConfirmadorId(command.getBancoConfirmadorId());
        event.setBancoPagadorId(command.getBancoPagadorId());
        event.setMoneda(command.getMoneda());
        event.setMonto(command.getMonto());
        event.setPorcentajeTolerancia(command.getPorcentajeTolerancia());
        event.setFechaEmision(command.getFechaEmision());
        event.setFechaVencimiento(command.getFechaVencimiento());
        event.setFechaUltimoEmbarque(command.getFechaUltimoEmbarque());
        event.setLugarEmbarque(command.getLugarEmbarque());
        event.setLugarDestino(command.getLugarDestino());
        event.setRequiereFacturaComercial(command.getRequiereFacturaComercial());
        event.setRequierePackingList(command.getRequierePackingList());
        event.setRequiereConocimientoEmbarque(command.getRequiereConocimientoEmbarque());
        event.setRequiereCertificadoOrigen(command.getRequiereCertificadoOrigen());
        event.setRequiereCertificadoSeguro(command.getRequiereCertificadoSeguro());
        event.setDocumentosAdicionales(command.getDocumentosAdicionales());
        event.setIncoterm(command.getIncoterm());
        event.setDescripcionMercancia(command.getDescripcionMercancia());
        event.setCondicionesEspeciales(command.getCondicionesEspeciales());
        event.setInstruccionesEmbarque(command.getInstruccionesEmbarque());
        event.setDraft(command.getDraft());

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handleDelete(String deletedBy) {
        if (this.deleted) {
            throw new IllegalStateException("La carta de crédito ya está eliminada");
        }

        LetterOfCreditDeletedEvent event = new LetterOfCreditDeletedEvent(
                this.cartaCreditoId,
                deletedBy != null ? deletedBy : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    private void apply(LetterOfCreditCreatedEvent event) {
        this.cartaCreditoId = event.getCartaCreditoId();
        this.numeroOperacion = event.getNumeroOperacion();
        this.tipoLc = event.getTipoLc();
        this.modalidad = event.getModalidad();
        this.formaPago = event.getFormaPago();
        this.estado = event.getEstado();
        this.ordenanteId = event.getOrdenanteId();
        this.beneficiarioId = event.getBeneficiarioId();
        this.bancoEmisorId = event.getBancoEmisorId();
        this.moneda = event.getMoneda();
        this.monto = event.getMonto();
        this.montoUtilizado = BigDecimal.ZERO;
        this.fechaEmision = event.getFechaEmision();
        this.fechaVencimiento = event.getFechaVencimiento();
        this.draft = event.getDraft();
        this.deleted = false;
        this.version++;
    }

    private void apply(LetterOfCreditUpdatedEvent event) {
        if (event.getNumeroOperacion() != null) this.numeroOperacion = event.getNumeroOperacion();
        if (event.getTipoLc() != null) this.tipoLc = event.getTipoLc();
        if (event.getModalidad() != null) this.modalidad = event.getModalidad();
        if (event.getFormaPago() != null) this.formaPago = event.getFormaPago();
        if (event.getEstado() != null) this.estado = event.getEstado();
        if (event.getMontoUtilizado() != null) this.montoUtilizado = event.getMontoUtilizado();
        if (event.getMonto() != null) this.monto = event.getMonto();
        if (event.getDraft() != null) this.draft = event.getDraft();
        this.version++;
    }

    private void apply(LetterOfCreditDeletedEvent event) {
        this.deleted = true;
        this.version++;
    }

    public void loadFromHistory(List<DomainEvent> events) {
        for (DomainEvent event : events) {
            if (event instanceof LetterOfCreditCreatedEvent) {
                apply((LetterOfCreditCreatedEvent) event);
            } else if (event instanceof LetterOfCreditUpdatedEvent) {
                apply((LetterOfCreditUpdatedEvent) event);
            } else if (event instanceof LetterOfCreditDeletedEvent) {
                apply((LetterOfCreditDeletedEvent) event);
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
