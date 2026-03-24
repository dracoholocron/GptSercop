package com.globalcmx.api.dto.swift;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para representar un mensaje SWIFT de comercio exterior
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MensajeSWIFT {

    /**
     * Tipo de mensaje SWIFT (MT400, MT700, MT760, etc.)
     */
    @NotBlank(message = "El tipo de mensaje es obligatorio")
    private String tipoMensaje;

    /**
     * Evento del ciclo de vida (EMISION, PAGO, MODIFICACION, etc.)
     */
    @NotBlank(message = "El evento es obligatorio")
    private String evento;

    /**
     * Monto de la operación
     */
    @NotNull(message = "El monto es obligatorio")
    @Positive(message = "El monto debe ser positivo")
    private Double monto;

    /**
     * Código de moneda (USD, EUR, MXN, etc.)
     */
    @NotBlank(message = "La moneda es obligatoria")
    private String moneda;

    /**
     * Código del país de origen (MX, US, ES, etc.)
     */
    @NotBlank(message = "El país de origen es obligatorio")
    private String paisOrigen;

    /**
     * Código del país de destino (MX, US, ES, etc.)
     */
    private String paisDestino;
}
