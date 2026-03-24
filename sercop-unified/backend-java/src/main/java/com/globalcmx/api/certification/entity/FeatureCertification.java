package com.globalcmx.api.certification.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Entidad para rastrear el estado de certificación/QA de funcionalidades del sistema.
 * Solo visible para usuarios con rol ADMIN.
 */
@Entity
@Table(name = "feature_certification")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeatureCertification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "feature_code", nullable = false, unique = true, length = 100)
    private String featureCode;

    @Column(name = "feature_name", nullable = false, length = 200)
    private String featureName;

    @Column(name = "feature_name_en", length = 200)
    private String featureNameEn;

    @Column(name = "parent_code", length = 100)
    private String parentCode;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CertificationStatus status = CertificationStatus.NOT_TESTED;

    @Column(name = "tested_by", length = 100)
    private String testedBy;

    @Column(name = "tested_at")
    private Instant testedAt;

    @Column(name = "certified_by", length = 100)
    private String certifiedBy;

    @Column(name = "certified_at")
    private Instant certifiedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "test_evidence_url", length = 500)
    private String testEvidenceUrl;

    @Column(name = "blocker_reason", length = 500)
    private String blockerReason;

    @Column(name = "linked_alert_tag", length = 100)
    private String linkedAlertTag;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public enum CertificationStatus {
        NOT_TESTED,
        IN_PROGRESS,
        CERTIFIED,
        FAILED,
        BLOCKED
    }
}
