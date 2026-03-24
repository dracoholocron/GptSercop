package com.globalcmx.api.compraspublicas.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entidad para precios históricos de contratación pública.
 */
@Entity
@Table(name = "cp_historical_prices", indexes = {
    @Index(name = "idx_cpc_date", columnList = "cpc_code, adjudication_date"),
    @Index(name = "idx_entity", columnList = "entity_ruc"),
    @Index(name = "idx_supplier", columnList = "supplier_ruc"),
    @Index(name = "idx_process", columnList = "process_code")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CPHistoricalPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cpc_code", nullable = false, length = 20)
    private String cpcCode;

    @Column(name = "cpc_description", length = 500)
    private String cpcDescription;

    @Column(name = "item_description", length = 500)
    private String itemDescription;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "quantity", precision = 15, scale = 4)
    private BigDecimal quantity;

    @Column(name = "total_value", precision = 15, scale = 2)
    private BigDecimal totalValue;

    @Column(name = "process_code", length = 50)
    private String processCode;

    @Column(name = "process_type", length = 50)
    private String processType;

    @Column(name = "entity_ruc", length = 13)
    private String entityRuc;

    @Column(name = "entity_name", length = 300)
    private String entityName;

    @Column(name = "supplier_ruc", length = 13)
    private String supplierRuc;

    @Column(name = "supplier_name", length = 300)
    private String supplierName;

    @Column(name = "adjudication_date")
    private LocalDate adjudicationDate;

    @Column(name = "publication_date")
    private LocalDate publicationDate;

    @Column(name = "province", length = 100)
    private String province;

    @Column(name = "canton", length = 100)
    private String canton;

    @Column(name = "source", length = 50)
    @Builder.Default
    private String source = "SERCOP";

    @Enumerated(EnumType.STRING)
    @Column(name = "data_quality")
    @Builder.Default
    private DataQuality dataQuality = DataQuality.MEDIUM;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum DataQuality {
        HIGH, MEDIUM, LOW
    }
}
