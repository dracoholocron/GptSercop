package com.globalcmx.api.compraspublicas.config.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "cp_country_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPCountryConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "country_code", nullable = false, unique = true, length = 3)
    private String countryCode;

    @Column(name = "country_name", nullable = false, length = 100)
    private String countryName;

    @Column(name = "legal_framework_name", length = 200)
    private String legalFrameworkName;

    @Column(name = "currency_code", length = 3)
    @Builder.Default
    private String currencyCode = "USD";

    @Column(name = "tax_id_name", length = 50)
    @Builder.Default
    private String taxIdName = "RUC";

    @Column(name = "tax_id_pattern", length = 100)
    private String taxIdPattern;

    @Column(name = "catalog_system", length = 20)
    @Builder.Default
    private String catalogSystem = "CPC";

    @Column(name = "budget_integration_enabled")
    @Builder.Default
    private Boolean budgetIntegrationEnabled = false;

    @Column(name = "erp_api_code", length = 50)
    private String erpApiCode;

    @Column(name = "regulatory_body_name", length = 100)
    private String regulatoryBodyName;

    @Column(name = "regulatory_body_url", length = 300)
    private String regulatoryBodyUrl;

    @Column(name = "config", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String config;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
