package com.globalcmx.api.model.cx;

import com.globalcmx.api.model.cx.enums.EstadoGarantia;
import com.globalcmx.api.model.cx.enums.SubtipoGarantia;
import com.globalcmx.api.model.cx.enums.TipoGarantia;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bank_guarantee_readmodel")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankGuarantee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "guarantee_number", unique = true, nullable = false, length = 50)
    private String numeroGarantia;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private TipoGarantia tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "subtype", nullable = false)
    private SubtipoGarantia subtipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EstadoGarantia estado;

    // Partes
    @Column(name = "applicant_id", nullable = false)
    private Long ordenanteId;

    @Column(name = "beneficiary_id", nullable = false)
    private Long beneficiarioId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guarantor_bank_id")
    private FinancialInstitution bancoGarante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "counter_guarantor_bank_id")
    private FinancialInstitution bancoContragarante;

    // Montos
    @Column(name = "currency", nullable = false, length = 3)
    private String moneda;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal monto;

    @Column(name = "project_percentage", precision = 5, scale = 2)
    private BigDecimal porcentajeProyecto;

    @Column(name = "issue_date", nullable = false)
    private LocalDate fechaEmision;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate fechaVencimiento;

    @Column(name = "execution_date")
    private LocalDate fechaEjecucion;

    @Column(name = "release_date")
    private LocalDate fechaLiberacion;

    // Detalles del proyecto/contrato
    @Column(name = "contract_number", length = 100)
    private String numeroContrato;

    @Column(name = "contract_object", columnDefinition = "TEXT")
    private String objetoContrato;

    @Column(name = "contract_amount", precision = 18, scale = 2)
    private BigDecimal montoContrato;

    @Column(name = "description", columnDefinition = "TEXT")
    private String descripcion;

    // Condiciones
    @Column(name = "is_reducible")
    @Builder.Default
    private Boolean esReducible = false;

    @Column(name = "reduction_formula", columnDefinition = "TEXT")
    private String formulaReduccion;

    @Column(name = "execution_conditions", columnDefinition = "TEXT")
    private String condicionesEjecucion;

    @Column(name = "release_conditions", columnDefinition = "TEXT")
    private String condicionesLiberacion;

    // SWIFT
    @Column(name = "swift_mt760", columnDefinition = "TEXT")
    private String swiftMt760;

    @Column(name = "swift_mt767", columnDefinition = "TEXT")
    private String swiftMt767;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (estado == null) {
            estado = EstadoGarantia.EMITIDA;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
