package com.globalcmx.api.entity;

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
public class FinanciamientoCx {
    private Long id;
    private String numeroOperacion;
    private String tipo;
    private String operacionVinculadaTipo;
    private Long operacionVinculadaId;

    // Cliente
    private Long clienteId;
    private Long lineaCreditoId;

    // Montos y plazos
    private String moneda;
    private BigDecimal montoSolicitado;
    private BigDecimal montoAprobado;
    private BigDecimal montoDesembolsado;
    private Integer plazoDias;
    private BigDecimal tasaInteres;
    private BigDecimal tasaMora;
    private BigDecimal comisionApertura;
    private LocalDate fechaDesembolso;
    private LocalDate fechaVencimiento;

    // Garantías
    private String tipoGarantia;
    private String descripcionGarantia;

    private String estado;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
