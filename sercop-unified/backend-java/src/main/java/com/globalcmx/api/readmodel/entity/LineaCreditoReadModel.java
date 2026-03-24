package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "credit_line_readmodel")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LineaCreditoReadModel {
    @Id
    private Long id;

    @Column(name = "client_id", nullable = false)
    private Long clienteId;

    @Column(name = "type", nullable = false, length = 50)
    private String tipo;

    @Column(name = "currency", nullable = false, length = 3)
    private String moneda;

    @Column(name = "authorized_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal montoAutorizado;

    @Column(name = "utilized_amount", precision = 18, scale = 2)
    private BigDecimal montoUtilizado;

    @Column(name = "available_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal montoDisponible;

    @Column(name = "authorization_date")
    private LocalDate fechaAutorizacion;

    @Column(name = "expiry_date")
    private LocalDate fechaVencimiento;

    @Column(name = "reference_rate", length = 50)
    private String tasaReferencia;

    @Column(precision = 6, scale = 4)
    private BigDecimal spread;

    @Column(name = "status", nullable = false, length = 50)
    private String estado;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "aggregate_id", length = 100)
    private String aggregateId;

    @Version
    private Long version;
}
