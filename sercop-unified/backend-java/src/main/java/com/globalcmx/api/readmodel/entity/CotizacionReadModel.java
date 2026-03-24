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
@Table(name = "exchange_rate_read_model", indexes = {
        @Index(name = "idx_exchange_rate_date", columnList = "date"),
        @Index(name = "idx_exchange_rate_currency", columnList = "currency_code"),
        @Index(name = "idx_exchange_rate_currency_date", columnList = "currency_code,date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CotizacionReadModel {

    @Id
    private Long id;

    @Column(name = "currency_code", nullable = false, length = 3)
    private String codigoMoneda;

    @Column(name = "date", nullable = false)
    private LocalDate fecha;

    @Column(name = "buy_rate", nullable = false, precision = 19, scale = 6)
    private BigDecimal valorCompra;

    @Column(name = "sell_rate", nullable = false, precision = 19, scale = 6)
    private BigDecimal valorVenta;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(nullable = false)
    private Long version;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
