package com.globalcmx.api.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CuentaBancaria {
    private Long id;
    private String identificacionParticipante;
    private String nombresParticipante;
    private String apellidosParticipante;
    private String numeroCuenta;
    private String identificacionCuenta;
    private String tipo; // Cuenta Corriente, Cuenta Nostro, Cuenta Interna
    private Boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
