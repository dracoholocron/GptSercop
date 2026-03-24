package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class BankGuaranteeCreatedEvent extends DomainEvent {
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

    public BankGuaranteeCreatedEvent(Long garantiaId, String numeroGarantia, String tipo,
                                        String subtipo, String estado, Long ordenanteId,
                                        Long beneficiarioId, String moneda, BigDecimal monto,
                                        LocalDate fechaEmision, LocalDate fechaVencimiento,
                                        String performedBy) {
        super("GARANTIA_BANCARIA_CREATED", performedBy);
        this.garantiaId = garantiaId;
        this.numeroGarantia = numeroGarantia;
        this.tipo = tipo;
        this.subtipo = subtipo;
        this.estado = estado;
        this.ordenanteId = ordenanteId;
        this.beneficiarioId = beneficiarioId;
        this.moneda = moneda;
        this.monto = monto;
        this.fechaEmision = fechaEmision;
        this.fechaVencimiento = fechaVencimiento;
    }
}
