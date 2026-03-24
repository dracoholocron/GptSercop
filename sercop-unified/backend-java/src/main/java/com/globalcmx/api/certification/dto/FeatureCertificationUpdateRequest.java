package com.globalcmx.api.certification.dto;

import com.globalcmx.api.certification.entity.FeatureCertification.CertificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para actualizar el estado de certificación de una funcionalidad.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeatureCertificationUpdateRequest {
    private CertificationStatus status;
    private String notes;
    private String testEvidenceUrl;
    private String blockerReason;
}
