package com.globalcmx.api.compraspublicas.risk.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cp_risk_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPRiskItem {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    @JsonIgnore
    @EqualsAndHashCode.Exclude
    private CPRiskAssessment assessment;

    @Column(name = "indicator_code", nullable = false, length = 50)
    private String indicatorCode;

    @Column(name = "probability")
    @Builder.Default
    private Integer probability = 1;

    @Column(name = "impact")
    @Builder.Default
    private Integer impact = 1;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(name = "detected")
    @Builder.Default
    private Boolean detected = false;

    @Column(name = "evidence", columnDefinition = "TEXT")
    private String evidence;

    @Column(name = "mitigation_plan", columnDefinition = "TEXT")
    private String mitigationPlan;

    @Column(name = "responsible", length = 200)
    private String responsible;

    @Column(name = "allocation", length = 30)
    @Builder.Default
    private String allocation = "ESTADO";

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "IDENTIFICADO";

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void calculateScore() {
        if (probability != null && impact != null) {
            this.riskScore = probability * impact;
        }
    }
}
