package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class DocumentaryCollectionCreatedEvent extends DomainEvent {
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

    public DocumentaryCollectionCreatedEvent(Long cobranzaId, String numeroOperacion, String tipo,
                                             String modalidad, String estado, String moneda,
                                             BigDecimal monto, String performedBy) {
        super("COBRANZA_DOCUMENTARIA_CREATED", performedBy);
        this.cobranzaId = cobranzaId;
        this.numeroOperacion = numeroOperacion;
        this.tipo = tipo;
        this.modalidad = modalidad;
        this.estado = estado;
        this.moneda = moneda;
        this.monto = monto;
    }
}
