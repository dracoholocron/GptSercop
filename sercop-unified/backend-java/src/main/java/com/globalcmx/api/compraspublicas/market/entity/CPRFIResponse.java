package com.globalcmx.api.compraspublicas.market.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cp_rfi_response")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPRFIResponse {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rfi_id", nullable = false)
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    private CPRFI rfi;

    @Column(name = "supplier_ruc", length = 20)
    private String supplierRuc;

    @Column(name = "supplier_name", nullable = false, length = 300)
    private String supplierName;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "total_price", precision = 15, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "delivery_days")
    private Integer deliveryDays;

    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    @Column(name = "response_date")
    private LocalDate responseDate;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
