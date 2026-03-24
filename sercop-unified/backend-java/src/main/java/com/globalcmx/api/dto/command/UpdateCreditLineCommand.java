package com.globalcmx.api.dto.command;

import jakarta.validation.constraints.*;
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
public class UpdateCreditLineCommand {

    @NotNull(message = "El ID del cliente es requerido")
    private Long clienteId;

    @NotBlank(message = "El tipo de línea de crédito es requerido")
    @Size(max = 50, message = "El tipo no puede exceder 50 caracteres")
    private String tipo;

    @NotBlank(message = "La moneda es requerida")
    @Size(min = 3, max = 3, message = "La moneda debe tener exactamente 3 caracteres")
    private String moneda;

    @NotNull(message = "El monto autorizado es requerido")
    @DecimalMin(value = "0.01", message = "El monto autorizado debe ser mayor a 0")
    private BigDecimal montoAutorizado;

    @DecimalMin(value = "0.00", message = "El monto utilizado no puede ser negativo")
    private BigDecimal montoUtilizado;

    @NotNull(message = "La fecha de autorización es requerida")
    private LocalDate fechaAutorizacion;

    @NotNull(message = "La fecha de vencimiento es requerida")
    private LocalDate fechaVencimiento;

    @Size(max = 50, message = "La tasa de referencia no puede exceder 50 caracteres")
    private String tasaReferencia;

    @DecimalMin(value = "0.0000", message = "El spread no puede ser negativo")
    @DecimalMax(value = "100.0000", message = "El spread no puede exceder 100%")
    private BigDecimal spread;

    @NotBlank(message = "El estado es requerido")
    @Size(max = 50, message = "El estado no puede exceder 50 caracteres")
    private String estado;

    private String updatedBy;

    @AssertTrue(message = "La fecha de vencimiento debe ser posterior a la fecha de autorización")
    public boolean isValidDates() {
        if (fechaAutorizacion == null || fechaVencimiento == null) {
            return true; // Let @NotNull handle null validation
        }
        return fechaVencimiento.isAfter(fechaAutorizacion);
    }
}
