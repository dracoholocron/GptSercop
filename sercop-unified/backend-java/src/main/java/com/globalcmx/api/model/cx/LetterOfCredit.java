package com.globalcmx.api.model.cx;

import com.globalcmx.api.model.cx.enums.*;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "letter_of_credit_readmodel")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LetterOfCredit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "operation_number", unique = true, nullable = false, length = 50)
    private String numeroOperacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "lc_type", nullable = false)
    private TipoLC tipoLc;

    @Enumerated(EnumType.STRING)
    @Column(name = "modality", nullable = false)
    private ModalidadLC modalidad;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_form", nullable = false)
    private FormaPagoLC formaPago;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EstadoLC estado;

    // Partes involucradas
    @Column(name = "applicant_id", nullable = false)
    private Long ordenanteId;

    @Column(name = "beneficiary_id", nullable = false)
    private Long beneficiarioId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issuing_bank_id")
    private FinancialInstitution bancoEmisor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "advising_bank_id")
    private FinancialInstitution bancoAvisador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirming_bank_id")
    private FinancialInstitution bancoConfirmador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paying_bank_id")
    private FinancialInstitution bancoPagador;

    // Montos y fechas
    @Column(name = "currency", nullable = false, length = 3)
    private String moneda;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal monto;

    @Column(name = "utilized_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal montoUtilizado = BigDecimal.ZERO;

    @Column(name = "tolerance_percentage", precision = 5, scale = 2)
    private BigDecimal porcentajeTolerancia;

    @Column(name = "issue_date", nullable = false)
    private LocalDate fechaEmision;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate fechaVencimiento;

    @Column(name = "last_shipment_date")
    private LocalDate fechaUltimoEmbarque;

    @Column(name = "shipment_place", length = 200)
    private String lugarEmbarque;

    @Column(name = "destination_place", length = 200)
    private String lugarDestino;

    // Documentos requeridos
    @Column(name = "requires_commercial_invoice")
    @Builder.Default
    private Boolean requiereFacturaComercial = true;

    @Column(name = "requires_packing_list")
    @Builder.Default
    private Boolean requierePackingList = true;

    @Column(name = "requires_bill_of_lading")
    @Builder.Default
    private Boolean requiereConocimientoEmbarque = true;

    @Column(name = "requires_certificate_of_origin")
    @Builder.Default
    private Boolean requiereCertificadoOrigen = false;

    @Column(name = "requires_insurance_certificate")
    @Builder.Default
    private Boolean requiereCertificadoSeguro = false;

    @Column(name = "additional_documents", columnDefinition = "TEXT")
    private String documentosAdicionales;

    // Condiciones especiales
    @Column(length = 10)
    private String incoterm;

    @Column(name = "goods_description", columnDefinition = "TEXT")
    private String descripcionMercancia;

    @Column(name = "special_conditions", columnDefinition = "TEXT")
    private String condicionesEspeciales;

    @Column(name = "shipment_instructions", columnDefinition = "TEXT")
    private String instruccionesEmbarque;

    // SWIFT Messages
    @Column(name = "swift_mt700_issue", columnDefinition = "TEXT")
    private String swiftMt700Emision;

    @Column(name = "swift_mt710_advice", columnDefinition = "TEXT")
    private String swiftMt710Aviso;

    @Column(name = "swift_mt720_transfer", columnDefinition = "TEXT")
    private String swiftMt720Transferencia;

    // Auditoría
    @Column(name = "created_by", length = 100)
    private String usuarioCreacion;

    @Column(name = "creation_date", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "modified_by", length = 100)
    private String usuarioModificacion;

    @Column(name = "modification_date")
    private LocalDateTime fechaModificacion;

    @Version
    private Integer version;

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaModificacion = LocalDateTime.now();
        if (estado == null) {
            estado = EstadoLC.DRAFT;
        }
        if (montoUtilizado == null) {
            montoUtilizado = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        fechaModificacion = LocalDateTime.now();
    }

    @Transient
    public BigDecimal getMontoDisponible() {
        return monto.subtract(montoUtilizado);
    }
}
