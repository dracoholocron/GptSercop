package com.globalcmx.api.dto.command;

import jakarta.validation.constraints.Min;
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
public class CreateCustomCatalogCommand {
    @NotBlank(message = "El código es requerido")
    private String codigo;

    @NotBlank(message = "El nombre es requerido")
    private String nombre;

    private String descripcion;

    @NotNull(message = "El nivel es requerido")
    @Min(value = 1, message = "El nivel debe ser 1 o 2")
    private Integer nivel;

    private Long catalogoPadreId; // Required if nivel = 2

    @NotNull(message = "El estado activo es requerido")
    private Boolean activo;

    @NotNull(message = "El orden es requerido")
    @Min(value = 0, message = "El orden debe ser mayor o igual a 0")
    private Integer orden;

    private String createdBy;
}
