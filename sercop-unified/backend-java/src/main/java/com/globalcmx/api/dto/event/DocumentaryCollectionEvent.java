package com.globalcmx.api.dto.event;

import com.fasterxml.jackson.annotation.JsonFormat;
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
public class DocumentaryCollectionEvent {
    private Long cobranzaId;
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

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaRecepcion;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaVencimiento;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaPago;

    @JsonFormat(pattern = "yyyy-MM-dd")
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

    private EventType eventType;
    private String performedBy;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    public enum EventType {
        CREATED,
        UPDATED,
        DELETED
    }
}
