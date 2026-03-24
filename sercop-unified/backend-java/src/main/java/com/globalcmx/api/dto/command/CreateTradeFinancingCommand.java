package com.globalcmx.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
public class CreateTradeFinancingCommand {
    @NotBlank(message = "El numero de operacion es requerido")
    private String numeroOperacion;

    @NotBlank(message = "El tipo es requerido")
    private String tipo;

    @NotNull(message = "El cliente es requerido")
    private Long clienteId;

    @NotBlank(message = "La moneda es requerida")
    private String moneda;

    @NotNull(message = "El monto solicitado es requerido")
    @Positive(message = "El monto solicitado debe ser positivo")
    private BigDecimal montoSolicitado;

    @NotBlank(message = "El estado es requerido")
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

    private String usuarioCreacion;
}
