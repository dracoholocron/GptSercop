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
public class UpdateLetterOfCreditCommand {
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
    private LocalDate fechaEmision;
    private LocalDate fechaVencimiento;
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

    private String usuarioModificacion;
}
