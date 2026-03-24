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
public class Participante {
    private Long id;
    private String identificacion;
    private String tipo;
    private String tipoReferencia;
    private String nombres;
    private String apellidos;
    private String email;
    private String telefono;
    private String direccion;
    private String agencia;
    private String ejecutivoAsignado;
    private String ejecutivoId;
    private String correoEjecutivo;
    private String autenticador;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}
