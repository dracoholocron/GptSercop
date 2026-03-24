package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
public class LineaCreditoCreatedEvent extends DomainEvent {
    private Long lineaCreditoId;
    private Long clienteId;
    private String tipo;
    private String moneda;
    private BigDecimal montoAutorizado;
    private BigDecimal montoUtilizado;
    private BigDecimal montoDisponible;
    private LocalDate fechaAutorizacion;
    private LocalDate fechaVencimiento;
    private String tasaReferencia;
    private BigDecimal spread;
    private String estado;

    public LineaCreditoCreatedEvent(Long lineaCreditoId, Long clienteId, String tipo, String moneda,
                                    BigDecimal montoAutorizado, BigDecimal montoUtilizado, BigDecimal montoDisponible,
                                    LocalDate fechaAutorizacion, LocalDate fechaVencimiento,
                                    String tasaReferencia, BigDecimal spread, String estado, String performedBy) {
        super("LINEA_CREDITO_CREATED", performedBy);
        this.lineaCreditoId = lineaCreditoId;
        this.clienteId = clienteId;
        this.tipo = tipo;
        this.moneda = moneda;
        this.montoAutorizado = montoAutorizado;
        this.montoUtilizado = montoUtilizado;
        this.montoDisponible = montoDisponible;
        this.fechaAutorizacion = fechaAutorizacion;
        this.fechaVencimiento = fechaVencimiento;
        this.tasaReferencia = tasaReferencia;
        this.spread = spread;
        this.estado = estado;
    }
}
