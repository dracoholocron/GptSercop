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
public class UpdateEmailTemplateCommand {
    @NotBlank(message = "El código es requerido")
    private String codigo;

    @NotBlank(message = "El nombre es requerido")
    private String nombre;

    private String descripcion;

    @NotBlank(message = "El asunto del correo es requerido")
    private String asunto;

    @NotBlank(message = "El cuerpo HTML del correo es requerido")
    private String cuerpoHtml;

    private String plantillasAdjuntas; // JSON array de IDs de plantillas

    @NotNull(message = "El estado activo es requerido")
    private Boolean activo;

    private String updatedBy;
}
