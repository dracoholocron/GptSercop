package com.globalcmx.api.compraspublicas.legal.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cp_procurement_thresholds")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPProcurementThreshold {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "country_code", length = 5)
    @Builder.Default
    private String countryCode = "EC";

    @Column(name = "fiscal_year", nullable = false)
    private Integer fiscalYear;

    @Column(name = "pie_value", precision = 18, scale = 2, nullable = false)
    private BigDecimal pieValue;

    @Column(name = "threshold_code", nullable = false, length = 50)
    private String thresholdCode;

    @Column(name = "procedure_name", nullable = false, length = 200)
    private String procedureName;

    @Column(name = "min_coefficient", precision = 10, scale = 6)
    private BigDecimal minCoefficient;

    @Column(name = "max_coefficient", precision = 10, scale = 6)
    private BigDecimal maxCoefficient;

    @Column(name = "min_value", precision = 18, scale = 2)
    private BigDecimal minValue;

    @Column(name = "max_value", precision = 18, scale = 2)
    private BigDecimal maxValue;

    @Column(name = "applicable_types", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String applicableTypes;

    @Column(name = "legal_reference", length = 200)
    private String legalReference;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
