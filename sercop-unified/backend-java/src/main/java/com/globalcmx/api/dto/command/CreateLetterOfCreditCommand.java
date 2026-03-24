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
public class CreateLetterOfCreditCommand {
    @NotBlank(message = "El número de operación es requerido")
    private String numeroOperacion;

    @NotBlank(message = "El tipo de LC es requerido")
    private String tipoLc;

    @NotBlank(message = "La modalidad es requerida")
    private String modalidad;

    @NotBlank(message = "La forma de pago es requerida")
    private String formaPago;

    @NotBlank(message = "El estado es requerido")
    private String estado;

    // Partes involucradas
    @NotNull(message = "El ordenante es requerido")
    private Long ordenanteId;

    @NotNull(message = "El beneficiario es requerido")
    private Long beneficiarioId;

    private Long bancoEmisorId;
    private Long bancoAvisadorId;
    private Long bancoConfirmadorId;
    private Long bancoPagadorId;

    // Montos y fechas
    @NotBlank(message = "La moneda es requerida")
    private String moneda;

    @NotNull(message = "El monto es requerido")
    private BigDecimal monto;

    private BigDecimal porcentajeTolerancia;

    @NotNull(message = "La fecha de emisión es requerida")
    private LocalDate fechaEmision;

    @NotNull(message = "La fecha de vencimiento es requerida")
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

    private String usuarioCreacion;
}
