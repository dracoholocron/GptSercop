package com.globalcmx.api.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO para consultas de garantías y borradores
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuaranteeQueryDTO {

    private Long id;
    private String numeroOperacion;
    private String tipoGarantia;
    private String tipoMensaje;
    private String estado;

    // Partes involucradas
    private Long solicitanteId;
    private Long beneficiarioId;
    private Long bancoGaranteId;
    private Long parteInstructoraId;

    // Montos y fechas
    private String moneda;
    private BigDecimal monto;
    private LocalDate fechaEmision;
    private LocalDate fechaVencimiento;
    private LocalDate fechaEfectiva;

    // Lugar de emisión
    private String lugarEmision;

    // Textos de la garantía
    private String textoGarantia;
    private String transaccionSubyacente;
    private String terminosCondiciones;
    private String informacionAdicional;

    // Campos opcionales SWIFT
    private String swiftOptionalFields;

    // Auditoría
    private String usuarioCreacion;
    private LocalDateTime fechaCreacion;
    private String usuarioModificacion;
    private LocalDateTime fechaModificacion;
}
