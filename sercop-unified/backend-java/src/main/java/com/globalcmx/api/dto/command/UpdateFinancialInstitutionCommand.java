package com.globalcmx.api.dto.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFinancialInstitutionCommand {
    private String codigo;
    private String nombre;
    private String swiftCode;
    private String pais;
    private String ciudad;
    private String direccion;
    private String tipo;
    private String rating;
    private Boolean esCorresponsal;
    private Boolean activo;
    private String updatedBy;
}
