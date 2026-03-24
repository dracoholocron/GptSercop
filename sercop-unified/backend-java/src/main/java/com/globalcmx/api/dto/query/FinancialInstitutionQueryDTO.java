package com.globalcmx.api.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialInstitutionQueryDTO {
    private Long id;
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
