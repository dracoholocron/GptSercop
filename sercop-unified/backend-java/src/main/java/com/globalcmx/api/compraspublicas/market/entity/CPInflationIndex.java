package com.globalcmx.api.compraspublicas.market.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cp_inflation_index",
    uniqueConstraints = @UniqueConstraint(columnNames = {"country_code", "year_month"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPInflationIndex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "country_code", nullable = false, length = 3)
    @Builder.Default
    private String countryCode = "EC";

    @Column(name = "year_month", nullable = false, length = 7)
    private String yearMonth;

    @Column(name = "index_value", nullable = false, precision = 10, scale = 4)
    private BigDecimal indexValue;

    @Column(name = "base_year", nullable = false)
    @Builder.Default
    private Integer baseYear = 2024;

    @Column(name = "source", length = 100)
    @Builder.Default
    private String source = "INEC";

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
