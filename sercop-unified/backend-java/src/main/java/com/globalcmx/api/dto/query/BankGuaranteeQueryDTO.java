package com.globalcmx.api.dto.query;

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
public class BankGuaranteeQueryDTO {
    private Long id;
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

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
