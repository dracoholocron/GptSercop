package com.globalcmx.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cotizaciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cotizacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_moneda", nullable = false, length = 3)
    private String codigoMoneda;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "valor_compra", nullable = false, precision = 19, scale = 6)
    private BigDecimal valorCompra;

    @Column(name = "valor_venta", nullable = false, precision = 19, scale = 6)
    private BigDecimal valorVenta;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;
}
