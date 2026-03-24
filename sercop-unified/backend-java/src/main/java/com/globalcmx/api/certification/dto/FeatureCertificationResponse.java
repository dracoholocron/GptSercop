package com.globalcmx.api.certification.dto;

import com.globalcmx.api.certification.entity.FeatureCertification.CertificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * DTO de respuesta para la certificación de funcionalidades.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeatureCertificationResponse {
    private Long id;
    private String featureCode;
    private String featureName;
    private String featureNameEn;
    private String parentCode;
    private Integer displayOrder;
    private CertificationStatus status;
    private String testedBy;
    private Instant testedAt;
    private String certifiedBy;
    private Instant certifiedAt;
    private String notes;
    private String testEvidenceUrl;
    private String blockerReason;
    private String linkedAlertTag;
    private Instant createdAt;
    private Instant updatedAt;

    // Hijos (para estructura jerárquica)
    private List<FeatureCertificationResponse> children;
}
