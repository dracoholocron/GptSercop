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
public class BankGuaranteeEvent {
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

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaEmision;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaVencimiento;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaEjecucion;

    @JsonFormat(pattern = "yyyy-MM-dd")
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
