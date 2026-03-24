package com.globalcmx.api.model.cx;

import com.globalcmx.api.model.cx.enums.EstadoCobranza;
import com.globalcmx.api.model.cx.enums.ModalidadCobranza;
import com.globalcmx.api.model.cx.enums.TipoCobranza;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "documentary_collection_readmodel")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentaryCollection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "operation_number", unique = true, nullable = false, length = 50)
    private String numeroOperacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private TipoCobranza tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "modality", nullable = false)
    private ModalidadCobranza modalidad;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EstadoCobranza estado;

    // Partes
    @Column(name = "drawer_id", nullable = false)
    private Long libradorId;

    @Column(name = "drawee_id", nullable = false)
    private Long libradoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "remitting_bank_id")
    private FinancialInstitution bancoRemitente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collecting_bank_id")
    private FinancialInstitution bancoCobrador;

    // Montos
    @Column(name = "currency", nullable = false, length = 3)
    private String moneda;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal monto;

    @Column(name = "reception_date")
    private LocalDate fechaRecepcion;

    @Column(name = "expiry_date")
    private LocalDate fechaVencimiento;

    @Column(name = "payment_date")
    private LocalDate fechaPago;

    @Column(name = "acceptance_date")
    private LocalDate fechaAceptacion;

    // Documentos
    @Column(name = "bill_of_lading")
    @Builder.Default
    private Boolean conocimientoEmbarque = false;

    @Column(name = "commercial_invoice")
    @Builder.Default
    private Boolean facturaComercial = true;

    @Column(name = "certificate_of_origin")
    @Builder.Default
    private Boolean certificadoOrigen = false;

    @Column(name = "attached_documents", columnDefinition = "TEXT")
    private String documentosAnexos;

    // SWIFT
    @Column(name = "swift_mt400", columnDefinition = "TEXT")
    private String swiftMt400;

    @Column(name = "swift_mt410", columnDefinition = "TEXT")
    private String swiftMt410;

    @Column(name = "swift_mt412", columnDefinition = "TEXT")
    private String swiftMt412;

    // Instrucciones
    @Column(name = "protest_instructions", columnDefinition = "TEXT")
    private String instruccionesProtesto;

    @Column(name = "non_payment_instructions", columnDefinition = "TEXT")
    private String instruccionesImpago;

    @Column(name = "observations", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (estado == null) {
            estado = EstadoCobranza.RECIBIDA;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
