package com.globalcmx.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBankAccountCommand {
    @NotBlank(message = "La identificación del participante es requerida")
    private String identificacionParticipante;

    @NotBlank(message = "Los nombres del participante son requeridos")
    private String nombresParticipante;

    private String apellidosParticipante;

    @NotBlank(message = "El número de cuenta es requerido")
    private String numeroCuenta;

    @NotBlank(message = "La identificación de cuenta es requerida")
    private String identificacionCuenta;

    @NotBlank(message = "El tipo de cuenta es requerido")
    private String tipo;

    @NotNull(message = "El estado activo es requerido")
    private Boolean activo;

    private String createdBy;
}
