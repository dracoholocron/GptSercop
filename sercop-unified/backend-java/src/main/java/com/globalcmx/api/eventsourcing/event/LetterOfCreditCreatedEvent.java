package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class LetterOfCreditCreatedEvent extends DomainEvent {
    private Long cartaCreditoId;
    private String numeroOperacion;
    private String tipoLc;
    private String modalidad;
    private String formaPago;
    private String estado;

    // Partes involucradas
    private Long ordenanteId;
    private Long beneficiarioId;
    private Long bancoEmisorId;
    private Long bancoAvisadorId;
    private Long bancoConfirmadorId;
    private Long bancoPagadorId;

    // Montos y fechas
    private String moneda;
    private BigDecimal monto;
    private BigDecimal porcentajeTolerancia;
    private LocalDate fechaEmision;
    private LocalDate fechaVencimiento;
    private LocalDate fechaUltimoEmbarque;
    private String lugarEmbarque;
    private String lugarDestino;

    // Documentos requeridos
    private Boolean requiereFacturaComercial;
    private Boolean requierePackingList;
    private Boolean requiereConocimientoEmbarque;
    private Boolean requiereCertificadoOrigen;
    private Boolean requiereCertificadoSeguro;
    private String documentosAdicionales;

    // Condiciones especiales
    private String incoterm;
    private String descripcionMercancia;
    private String condicionesEspeciales;
    private String instruccionesEmbarque;

    // Draft status
    private Boolean draft;

    public LetterOfCreditCreatedEvent(Long cartaCreditoId, String numeroOperacion,
                                     String tipoLc, String modalidad, String formaPago,
                                     String estado, Long ordenanteId, Long beneficiarioId,
                                     Long bancoEmisorId, String moneda, BigDecimal monto,
                                     LocalDate fechaEmision, LocalDate fechaVencimiento,
                                     String performedBy) {
        super("CARTA_CREDITO_CREATED", performedBy);
        this.cartaCreditoId = cartaCreditoId;
        this.numeroOperacion = numeroOperacion;
        this.tipoLc = tipoLc;
        this.modalidad = modalidad;
        this.formaPago = formaPago;
        this.estado = estado;
        this.ordenanteId = ordenanteId;
        this.beneficiarioId = beneficiarioId;
        this.bancoEmisorId = bancoEmisorId;
        this.moneda = moneda;
        this.monto = monto;
        this.fechaEmision = fechaEmision;
        this.fechaVencimiento = fechaVencimiento;
    }
}
