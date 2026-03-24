package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class CotizacionUpdatedEvent extends DomainEvent {
    private Long cotizacionId;
    private String codigoMoneda;
    private LocalDate fecha;
    private BigDecimal valorCompra;
    private BigDecimal valorVenta;

    public CotizacionUpdatedEvent(Long cotizacionId, String codigoMoneda, LocalDate fecha,
                                  BigDecimal valorCompra, BigDecimal valorVenta, String performedBy) {
        super("COTIZACION_UPDATED", performedBy);
        this.cotizacionId = cotizacionId;
        this.codigoMoneda = codigoMoneda;
        this.fecha = fecha;
        this.valorCompra = valorCompra;
        this.valorVenta = valorVenta;
    }
}
