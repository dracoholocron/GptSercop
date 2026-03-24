package com.globalcmx.api.dto.command;

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
public class UpdateTradeFinancingCommand {
    private String numeroOperacion;
    private String tipo;
    private Long clienteId;
    private String moneda;
    private BigDecimal montoSolicitado;
    private String estado;

    // Optional fields
    private String operacionVinculadaTipo;
    private Long operacionVinculadaId;
    private Long lineaCreditoId;
    private BigDecimal montoAprobado;
    private BigDecimal montoDesembolsado;
    private Integer plazoDias;
    private BigDecimal tasaInteres;
    private BigDecimal tasaMora;
    private BigDecimal comisionApertura;
    private LocalDate fechaDesembolso;
    private LocalDate fechaVencimiento;
    private String tipoGarantia;
    private String descripcionGarantia;

    private String usuarioModificacion;
}
