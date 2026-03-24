package com.globalcmx.api.model.cx;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "lc_amendment_readmodel")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LcAmendment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lc_id", nullable = false)
    private LetterOfCredit cartaCredito;

    @Column(name = "amendment_number", nullable = false)
    private Integer numeroEnmienda;

    @Column(name = "amendment_type", nullable = false, length = 100)
    private String tipoEnmienda;

    @Column(name = "status", nullable = false, length = 50)
    private String estado;

    @Column(name = "description", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "previous_amount", precision = 18, scale = 2)
    private BigDecimal montoAnterior;

    @Column(name = "new_amount", precision = 18, scale = 2)
    private BigDecimal montoNuevo;

    @Column(name = "previous_expiry_date")
    private LocalDate fechaVencimientoAnterior;

    @Column(name = "new_expiry_date")
    private LocalDate fechaVencimientoNueva;

    @Column(name = "swift_mt707", columnDefinition = "TEXT")
    private String swiftMt707;

    @Column(name = "request_date", nullable = false)
    private LocalDateTime fechaSolicitud;

    @Column(name = "approval_date")
    private LocalDateTime fechaAprobacion;

    @Column(name = "approved_by", length = 100)
    private String aprobadaPor;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        fechaSolicitud = LocalDateTime.now();
        if (estado == null) {
            estado = EstadoEnmienda.SOLICITADA.name();
        }
    }

    public enum TipoEnmienda {
        AUMENTO_MONTO,
        DISMINUCION_MONTO,
        EXTENSION_FECHA,
        CAMBIO_BENEFICIARIO,
        MODIFICACION_DOCUMENTOS,
        OTRAS
    }

    public enum EstadoEnmienda {
        SOLICITADA,
        APROBADA,
        RECHAZADA,
        APLICADA
    }
}
