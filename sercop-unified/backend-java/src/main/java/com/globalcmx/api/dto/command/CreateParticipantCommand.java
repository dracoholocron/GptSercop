package com.globalcmx.api.dto.command;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateParticipantCommand {
    @NotBlank(message = "La identificación es requerida")
    private String identificacion;

    @NotBlank(message = "El tipo es requerido")
    private String tipo;

    private String tipoReferencia;

    @NotBlank(message = "Los nombres son requeridos")
    private String nombres;

    @NotBlank(message = "Los apellidos son requeridos")
    private String apellidos;

    @Email(message = "El email debe ser válido")
    private String email;

    private String telefono;
    private String direccion;
    private String agencia;
    private String ejecutivoAsignado;
    private String ejecutivoId;
    private String correoEjecutivo;
    private String autenticador;
    private String createdBy;
}
