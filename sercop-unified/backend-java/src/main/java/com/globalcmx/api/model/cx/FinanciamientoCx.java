package com.globalcmx.api.model.cx;

import com.globalcmx.api.model.cx.enums.EstadoFinanciamiento;
import com.globalcmx.api.model.cx.enums.TipoFinanciamiento;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entidad JPA para Financiamiento de Comercio Exterior
 * Incluye: Pre-exportación, Post-exportación, Forfaiting, Descuento de LC, etc.
 */
@Entity
@Table(name = "financing_trade_read_model")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinanciamientoCx {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "operation_number", unique = true, nullable = false, length = 50)
    private String numeroOperacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 100)
    private TipoFinanciamiento tipo;

    // Operación vinculada (puede ser LC, Cobranza, etc.)
    @Column(name = "linked_operation_type", length = 50)
    private String operacionVinculadaTipo;

    @Column(name = "linked_operation_id")
    private Long operacionVinculadaId;

    // Cliente
    @Column(name = "client_id", nullable = false)
    private Long clienteId;

    @Column(name = "credit_line_id")
    private Long lineaCreditoId;

    // Montos y plazos
    @Column(name = "currency", nullable = false, length = 3)
    private String moneda;

    @Column(name = "requested_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal montoSolicitado;

    @Column(name = "approved_amount", precision = 18, scale = 2)
    private BigDecimal montoAprobado;

    @Column(name = "disbursed_amount", precision = 18, scale = 2)
    private BigDecimal montoDesembolsado;

    @Column(name = "term_days")
    private Integer plazoDias;

    @Column(name = "interest_rate", precision = 8, scale = 4)
    private BigDecimal tasaInteres;

    @Column(name = "penalty_rate", precision = 8, scale = 4)
    private BigDecimal tasaMora;

    @Column(name = "opening_commission", precision = 18, scale = 2)
    private BigDecimal comisionApertura;

    @Column(name = "disbursement_date")
    private LocalDate fechaDesembolso;

    @Column(name = "maturity_date")
    private LocalDate fechaVencimiento;

    // Garantías
    @Column(name = "guarantee_type", length = 100)
    private String tipoGarantia;

    @Column(name = "guarantee_description", columnDefinition = "TEXT")
    private String descripcionGarantia;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private EstadoFinanciamiento estado;

    // Auditoría
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Métodos de negocio
    @Transient
    public BigDecimal getMontoDisponible() {
        if (montoAprobado == null || montoDesembolsado == null) {
            return BigDecimal.ZERO;
        }
        return montoAprobado.subtract(montoDesembolsado);
    }

    @Transient
    public boolean isVigente() {
        return estado == EstadoFinanciamiento.VIGENTE
                && fechaVencimiento != null
                && fechaVencimiento.isAfter(LocalDate.now());
    }
}
