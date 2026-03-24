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
public class UpdateTemplateCommand {
    @NotBlank(message = "El código es requerido")
    private String codigo;

    @NotBlank(message = "El nombre es requerido")
    private String nombre;

    private String descripcion;

    private String tipoDocumento;

    private String nombreArchivo;

    private String rutaArchivo;

    private Long tamanioArchivo;

    @NotNull(message = "El estado activo es requerido")
    private Boolean activo;

    private String updatedBy;
}
