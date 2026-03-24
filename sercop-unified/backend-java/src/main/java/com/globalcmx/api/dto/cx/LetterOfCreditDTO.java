package com.globalcmx.api.dto.cx;

import com.globalcmx.api.model.cx.LetterOfCredit;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LetterOfCreditDTO {

    private Long id;

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

    private BigDecimal montoUtilizado;
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

    // SWIFT Messages
    private String swiftMt700Emision;
    private String swiftMt710Aviso;
    private String swiftMt720Transferencia;

    // Auditoría
    private String usuarioCreacion;
    private LocalDateTime fechaCreacion;
    private String usuarioModificacion;
    private LocalDateTime fechaModificacion;
    private Integer version;

    // Campos calculados
    private BigDecimal montoDisponible;

    // Método para convertir desde Entity
    public static LetterOfCreditDTO fromEntity(LetterOfCredit entity) {
        return LetterOfCreditDTO.builder()
                .id(entity.getId())
                .numeroOperacion(entity.getNumeroOperacion())
                .tipoLc(entity.getTipoLc() != null ? entity.getTipoLc().name() : null)
                .modalidad(entity.getModalidad() != null ? entity.getModalidad().name() : null)
                .formaPago(entity.getFormaPago() != null ? entity.getFormaPago().name() : null)
                .estado(entity.getEstado() != null ? entity.getEstado().name() : null)
                .ordenanteId(entity.getOrdenanteId())
                .beneficiarioId(entity.getBeneficiarioId())
                .bancoEmisorId(entity.getBancoEmisor() != null ? entity.getBancoEmisor().getId() : null)
                .bancoAvisadorId(entity.getBancoAvisador() != null ? entity.getBancoAvisador().getId() : null)
                .bancoConfirmadorId(entity.getBancoConfirmador() != null ? entity.getBancoConfirmador().getId() : null)
                .bancoPagadorId(entity.getBancoPagador() != null ? entity.getBancoPagador().getId() : null)
                .moneda(entity.getMoneda())
                .monto(entity.getMonto())
                .montoUtilizado(entity.getMontoUtilizado())
                .porcentajeTolerancia(entity.getPorcentajeTolerancia())
                .fechaEmision(entity.getFechaEmision())
                .fechaVencimiento(entity.getFechaVencimiento())
                .fechaUltimoEmbarque(entity.getFechaUltimoEmbarque())
                .lugarEmbarque(entity.getLugarEmbarque())
                .lugarDestino(entity.getLugarDestino())
                .requiereFacturaComercial(entity.getRequiereFacturaComercial())
                .requierePackingList(entity.getRequierePackingList())
                .requiereConocimientoEmbarque(entity.getRequiereConocimientoEmbarque())
                .requiereCertificadoOrigen(entity.getRequiereCertificadoOrigen())
                .requiereCertificadoSeguro(entity.getRequiereCertificadoSeguro())
                .documentosAdicionales(entity.getDocumentosAdicionales())
                .incoterm(entity.getIncoterm())
                .descripcionMercancia(entity.getDescripcionMercancia())
                .condicionesEspeciales(entity.getCondicionesEspeciales())
                .instruccionesEmbarque(entity.getInstruccionesEmbarque())
                .swiftMt700Emision(entity.getSwiftMt700Emision())
                .swiftMt710Aviso(entity.getSwiftMt710Aviso())
                .swiftMt720Transferencia(entity.getSwiftMt720Transferencia())
                .usuarioCreacion(entity.getUsuarioCreacion())
                .fechaCreacion(entity.getFechaCreacion())
                .usuarioModificacion(entity.getUsuarioModificacion())
                .fechaModificacion(entity.getFechaModificacion())
                .version(entity.getVersion())
                .montoDisponible(entity.getMontoDisponible())
                .build();
    }
}
