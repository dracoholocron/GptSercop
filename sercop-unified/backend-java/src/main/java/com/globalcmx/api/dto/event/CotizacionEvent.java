package com.globalcmx.api.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CotizacionEvent {

    public enum EventType {
        CREATED, UPDATED, DELETED
    }

    private EventType eventType;
    private Long cotizacionId;
    private String codigoMoneda;
    private LocalDate fecha;
    private BigDecimal valorCompra;
    private BigDecimal valorVenta;
    private LocalDateTime timestamp;
    private String performedBy;
    private String eventId;
}
