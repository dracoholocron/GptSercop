package com.globalcmx.api.compraspublicas.paa.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cp_paa_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPPAAItem {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paa_id", nullable = false)
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    private CPPAA paa;

    @Column(name = "line_number", nullable = false)
    private Integer lineNumber;

    @Column(name = "cpc_code", length = 20)
    private String cpcCode;

    @Column(name = "cpc_description", length = 500)
    private String cpcDescription;

    @Column(name = "item_description", length = 500)
    private String itemDescription;

    @Column(name = "process_type", length = 30)
    private String processType;

    @Column(name = "budget_amount", precision = 15, scale = 2)
    private BigDecimal budgetAmount;

    @Column(name = "budget_partition", length = 50)
    private String budgetPartition;

    @Column(name = "funding_source", length = 100)
    private String fundingSource;

    @Column(name = "department", length = 200)
    private String department;

    @Column(name = "estimated_publication_date")
    private LocalDate estimatedPublicationDate;

    @Column(name = "estimated_adjudication_date")
    private LocalDate estimatedAdjudicationDate;

    @Column(name = "estimated_contract_duration_days")
    private Integer estimatedContractDurationDays;

    @Column(name = "priority", length = 10)
    @Builder.Default
    private String priority = "MEDIUM";

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "PLANIFICADO";

    @Column(name = "linked_process_id", columnDefinition = "CHAR(36)")
    private String linkedProcessId;

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
