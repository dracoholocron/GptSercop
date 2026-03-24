package com.globalcmx.api.dto.event;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanciamientoCxEvent {
    private Long financiamientoCxId;
    private String numeroOperacion;
    private String tipo;
    private String operacionVinculadaTipo;
    private Long operacionVinculadaId;

    // Cliente
    private Long clienteId;
    private Long lineaCreditoId;

    // Montos y plazos
    private String moneda;
    private BigDecimal montoSolicitado;
    private BigDecimal montoAprobado;
    private BigDecimal montoDesembolsado;
    private Integer plazoDias;
    private BigDecimal tasaInteres;
    private BigDecimal tasaMora;
    private BigDecimal comisionApertura;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaDesembolso;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaVencimiento;

    // Garantias
    private String tipoGarantia;
    private String descripcionGarantia;

    private String estado;

    private EventType eventType;
    private String performedBy;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    public enum EventType {
        CREATED,
        UPDATED,
        DELETED
    }
}
