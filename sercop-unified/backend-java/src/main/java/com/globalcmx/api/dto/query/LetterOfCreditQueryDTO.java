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
public class LetterOfCreditQueryDTO {
    private Long id;
    private String numeroOperacion;
    private String tipoLc;
    private String modalidad;
    private String formaPago;
    private String estado;

    // Partes involucradas
    private Long ordenanteId;
    private Long beneficiarioId;
    private Long bancoEmisorId;
    private Long bancoAvisadorId;
    private Long bancoConfirmadorId;
    private Long bancoPagadorId;

    // Montos y fechas
    private String moneda;
    private BigDecimal monto;
    private BigDecimal montoUtilizado;
    private BigDecimal porcentajeTolerancia;
    private LocalDate fechaEmision;
    private LocalDate fechaVencimiento;
    private LocalDate fechaUltimoEmbarque;
    private String lugarEmbarque;
    private String lugarDestino;

    // Documentos requeridos
    private Boolean requiereFacturaComercial;
    private Boolean requierePackingList;
    private Boolean requiereConocimientoEmbarque;
    private Boolean requiereCertificadoOrigen;
    private Boolean requiereCertificadoSeguro;
    private String documentosAdicionales;

    // Condiciones especiales
    private String incoterm;
    private String descripcionMercancia;
    private String condicionesEspeciales;
    private String instruccionesEmbarque;

    // Campos opcionales SWIFT (almacenados como JSON)
    private String swiftOptionalFields;

    // Draft status
    private Boolean draft;

    // Auditoría
    private String usuarioCreacion;
    private LocalDateTime fechaCreacion;
    private String usuarioModificacion;
    private LocalDateTime fechaModificacion;
}
