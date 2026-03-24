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
public class CreateFinancialInstitutionCommand {
    @NotBlank(message = "El código es requerido")
    private String codigo;

    @NotBlank(message = "El nombre es requerido")
    private String nombre;

    private String swiftCode;

    @NotBlank(message = "El país es requerido")
    private String pais;

    private String ciudad;
    private String direccion;

    @NotBlank(message = "El tipo es requerido")
    private String tipo;

    private String rating;
    private Boolean esCorresponsal;

    @NotNull(message = "El estado activo es requerido")
    private Boolean activo;

    private String createdBy;
}
