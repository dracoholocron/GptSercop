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
public class CuentaBancariaQueryDTO {
    private Long id;
    private String identificacionParticipante;
    private String nombresParticipante;
    private String apellidosParticipante;
    private String numeroCuenta;
    private String identificacionCuenta;
    private String tipo;
    private Boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
