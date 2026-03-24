package com.globalcmx.api.compraspublicas.paa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cp_paa")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPPAA {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "entity_ruc", length = 20)
    private String entityRuc;

    @Column(name = "entity_name", length = 300)
    private String entityName;

    @Column(name = "country_code", nullable = false, length = 3)
    @Builder.Default
    private String countryCode = "EC";

    @Column(name = "fiscal_year", nullable = false)
    private Integer fiscalYear;

    @Column(name = "version")
    @Builder.Default
    private Integer version = 1;

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "BORRADOR";

    @Column(name = "total_budget", precision = 15, scale = 2)
    private BigDecimal totalBudget;

    @Column(name = "approval_date")
    private LocalDate approvalDate;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "form_data", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String formData;

    @OneToMany(mappedBy = "paa", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    @EqualsAndHashCode.Exclude
    private List<CPPAAItem> items = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
