package com.globalcmx.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBankGuaranteeCommand {
    @NotBlank(message = "El número de garantía es requerido")
    private String numeroGarantia;

    @NotBlank(message = "El tipo de garantía es requerido")
    private String tipo;

    @NotBlank(message = "El subtipo de garantía es requerido")
    private String subtipo;

    @NotBlank(message = "El estado es requerido")
    private String estado;

    // Partes
    @NotNull(message = "El ordenante es requerido")
    private Long ordenanteId;

    @NotNull(message = "El beneficiario es requerido")
    private Long beneficiarioId;

    private Long bancoGaranteId;
    private Long bancoContragaranteId;

    // Montos
    @NotBlank(message = "La moneda es requerida")
    private String moneda;

    @NotNull(message = "El monto es requerido")
    private BigDecimal monto;

    private BigDecimal porcentajeProyecto;

    @NotNull(message = "La fecha de emisión es requerida")
    private LocalDate fechaEmision;

    @NotNull(message = "La fecha de vencimiento es requerida")
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

    private String createdBy;
}
