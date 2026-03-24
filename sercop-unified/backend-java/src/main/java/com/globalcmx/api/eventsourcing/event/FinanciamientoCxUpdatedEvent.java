package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
public class FinanciamientoCxUpdatedEvent extends DomainEvent {
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

    public FinanciamientoCxUpdatedEvent() {
        super();
    }

    public FinanciamientoCxUpdatedEvent(
            Long financiamientoCxId,
            String numeroOperacion,
            String estado,
            String performedBy) {
        super("FINANCIAMIENTO_CX_UPDATED", performedBy);
        this.financiamientoCxId = financiamientoCxId;
        this.numeroOperacion = numeroOperacion;
        this.estado = estado;
    }
}
