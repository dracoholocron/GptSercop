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
public class LetterOfCreditEvent {
    private Long cartaCreditoId;
    private String numeroOperacion;
    private String tipoLc;
    private String modalidad;
    private String formaPago;
    private String estado;

    private Long ordenanteId;
    private Long beneficiarioId;
    private Long bancoEmisorId;
    private Long bancoAvisadorId;
    private Long bancoConfirmadorId;
    private Long bancoPagadorId;

    private String moneda;
    private BigDecimal monto;
    private BigDecimal montoUtilizado;
    private BigDecimal porcentajeTolerancia;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaEmision;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaVencimiento;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaUltimoEmbarque;

    private String lugarEmbarque;
    private String lugarDestino;

    private Boolean requiereFacturaComercial;
    private Boolean requierePackingList;
    private Boolean requiereConocimientoEmbarque;
    private Boolean requiereCertificadoOrigen;
    private Boolean requiereCertificadoSeguro;
    private String documentosAdicionales;

    private String incoterm;
    private String descripcionMercancia;
    private String condicionesEspeciales;
    private String instruccionesEmbarque;

    private Boolean draft;

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
