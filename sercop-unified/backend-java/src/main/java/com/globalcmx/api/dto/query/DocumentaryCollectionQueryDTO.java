package com.globalcmx.api.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentaryCollectionQueryDTO {
    private Long id;
    private String numeroOperacion;
    private String tipo;
    private String modalidad;
    private String estado;

    // Partes
    private Long libradorId;
    private Long libradoId;
    private Long bancoRemitenteId;
    private Long bancoCobradorId;

    // Montos
    private String moneda;
    private BigDecimal monto;
    private LocalDate fechaRecepcion;
    private LocalDate fechaVencimiento;
    private LocalDate fechaPago;
    private LocalDate fechaAceptacion;

    // Documentos
    private Boolean conocimientoEmbarque;
    private Boolean facturaComercial;
    private Boolean certificadoOrigen;
    private String documentosAnexos;

    // SWIFT
    private String swiftMt400;
    private String swiftMt410;
    private String swiftMt412;

    // Instrucciones
    private String instruccionesProtesto;
    private String instruccionesImpago;
    private String observaciones;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
