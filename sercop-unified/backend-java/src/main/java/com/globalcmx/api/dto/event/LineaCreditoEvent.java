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
public class LineaCreditoEvent {

    public enum EventType {
        CREATED, UPDATED, DELETED
    }

    private EventType eventType;
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
    private LocalDateTime timestamp;
    private String performedBy;
    private String eventId;
}
