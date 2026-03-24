package com.globalcmx.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateExchangeRateCommand {

    @NotBlank(message = "El código de la moneda es requerido")
    private String codigoMoneda;

    @NotNull(message = "La fecha es requerida")
    private LocalDate fecha;

    @NotNull(message = "El valor de compra es requerido")
    @DecimalMin(value = "0.0", inclusive = false, message = "El valor de compra debe ser mayor a 0")
    private BigDecimal valorCompra;

    @NotNull(message = "El valor de venta es requerido")
    @DecimalMin(value = "0.0", inclusive = false, message = "El valor de venta debe ser mayor a 0")
    private BigDecimal valorVenta;

    private String createdBy;
}
