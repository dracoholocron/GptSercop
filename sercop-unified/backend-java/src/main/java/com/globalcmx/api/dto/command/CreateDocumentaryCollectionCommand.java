package com.globalcmx.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDocumentaryCollectionCommand {
    @NotBlank(message = "El número de operación es requerido")
    private String numeroOperacion;

    @NotBlank(message = "El tipo es requerido")
    private String tipo;

    @NotBlank(message = "La modalidad es requerida")
    private String modalidad;

    @NotBlank(message = "El estado es requerido")
    private String estado;

    // Partes
    private Long libradorId;
    private Long libradoId;
    private Long bancoRemitenteId;
    private Long bancoCobradorId;

    // Montos
    @NotBlank(message = "La moneda es requerida")
    private String moneda;

    @NotNull(message = "El monto es requerido")
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

    private String createdBy;
}
