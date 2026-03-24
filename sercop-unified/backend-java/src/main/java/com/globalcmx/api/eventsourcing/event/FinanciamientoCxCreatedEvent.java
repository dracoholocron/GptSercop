package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
public class FinanciamientoCxCreatedEvent extends DomainEvent {
    private Long financiamientoCxId;
    private String numeroOperacion;
    private String tipo;
    private Long clienteId;
    private String moneda;
    private BigDecimal montoSolicitado;
    private String estado;

    // Optional fields
    private String operacionVinculadaTipo;
    private Long operacionVinculadaId;
    private Long lineaCreditoId;
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

    public FinanciamientoCxCreatedEvent() {
        super();
    }

    public FinanciamientoCxCreatedEvent(
            Long financiamientoCxId,
            String numeroOperacion,
            String tipo,
            Long clienteId,
            String moneda,
            BigDecimal montoSolicitado,
            String estado,
            String performedBy) {
        super("FINANCIAMIENTO_CX_CREATED", performedBy);
        this.financiamientoCxId = financiamientoCxId;
        this.numeroOperacion = numeroOperacion;
        this.tipo = tipo;
        this.clienteId = clienteId;
        this.moneda = moneda;
        this.montoSolicitado = montoSolicitado;
        this.estado = estado;
    }
}
