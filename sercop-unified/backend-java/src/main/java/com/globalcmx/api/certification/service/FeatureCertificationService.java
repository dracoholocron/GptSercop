package com.globalcmx.api.certification.service;

import com.globalcmx.api.certification.dto.CertificationStatsResponse;
import com.globalcmx.api.certification.dto.FeatureCertificationResponse;
import com.globalcmx.api.certification.dto.FeatureCertificationUpdateRequest;
import com.globalcmx.api.certification.entity.FeatureCertification;
import com.globalcmx.api.certification.entity.FeatureCertification.CertificationStatus;
import com.globalcmx.api.certification.repository.FeatureCertificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Servicio para gestionar la certificación de funcionalidades.
 * Solo accesible por usuarios con rol ADMIN.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FeatureCertificationService {

    private final FeatureCertificationRepository repository;

    /**
     * Obtiene todas las funcionalidades en estructura jerárquica.
     */
    @Transactional(readOnly = true)
    public List<FeatureCertificationResponse> getAllHierarchical() {
        List<FeatureCertification> all = repository.findAllByOrderByDisplayOrderAsc();

        // Agrupar por parentCode
        Map<String, List<FeatureCertification>> byParent = all.stream()
            .filter(f -> f.getParentCode() != null)
            .collect(Collectors.groupingBy(FeatureCertification::getParentCode));

        // Construir respuesta jerárquica (solo padres en nivel superior)
        return all.stream()
            .filter(f -> f.getParentCode() == null)
            .map(parent -> {
                FeatureCertificationResponse response = toResponse(parent);
                List<FeatureCertification> children = byParent.get(parent.getFeatureCode());
                if (children != null) {
                    response.setChildren(children.stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList()));
                }
                return response;
            })
            .collect(Collectors.toList());
    }

    /**
     * Obtiene todas las funcionalidades (lista plana).
     */
    @Transactional(readOnly = true)
    public List<FeatureCertificationResponse> getAll() {
        return repository.findAllByOrderByDisplayOrderAsc().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Obtiene una funcionalidad por código.
     */
    @Transactional(readOnly = true)
    public FeatureCertificationResponse getByCode(String featureCode) {
        return repository.findByFeatureCode(featureCode)
            .map(this::toResponse)
            .orElseThrow(() -> new RuntimeException("Feature not found: " + featureCode));
    }

    /**
     * Obtiene funcionalidades por estado.
     */
    @Transactional(readOnly = true)
    public List<FeatureCertificationResponse> getByStatus(CertificationStatus status) {
        return repository.findByStatusOrderByDisplayOrderAsc(status).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Actualiza el estado de certificación de una funcionalidad.
     */
    @Transactional
    public FeatureCertificationResponse updateStatus(String featureCode,
                                                      FeatureCertificationUpdateRequest request,
                                                      String username) {
        FeatureCertification feature = repository.findByFeatureCode(featureCode)
            .orElseThrow(() -> new RuntimeException("Feature not found: " + featureCode));

        CertificationStatus oldStatus = feature.getStatus();
        CertificationStatus newStatus = request.getStatus();

        feature.setStatus(newStatus);
        feature.setNotes(request.getNotes());
        feature.setTestEvidenceUrl(request.getTestEvidenceUrl());
        feature.setBlockerReason(request.getBlockerReason());
        feature.setUpdatedBy(username);
        feature.setUpdatedAt(Instant.now());

        // Si cambia a IN_PROGRESS, registrar quién está probando
        if (newStatus == CertificationStatus.IN_PROGRESS && oldStatus != CertificationStatus.IN_PROGRESS) {
            feature.setTestedBy(username);
            feature.setTestedAt(Instant.now());
        }

        // Si cambia a CERTIFIED, registrar quién certifica
        if (newStatus == CertificationStatus.CERTIFIED && oldStatus != CertificationStatus.CERTIFIED) {
            feature.setCertifiedBy(username);
            feature.setCertifiedAt(Instant.now());
        }

        FeatureCertification saved = repository.save(feature);
        log.info("Feature {} status updated from {} to {} by {}", featureCode, oldStatus, newStatus, username);

        return toResponse(saved);
    }

    /**
     * Obtiene estadísticas de certificación.
     */
    @Transactional(readOnly = true)
    public CertificationStatsResponse getStats() {
        long total = repository.count();
        long notTested = repository.countByStatus(CertificationStatus.NOT_TESTED);
        long inProgress = repository.countByStatus(CertificationStatus.IN_PROGRESS);
        long certified = repository.countByStatus(CertificationStatus.CERTIFIED);
        long failed = repository.countByStatus(CertificationStatus.FAILED);
        long blocked = repository.countByStatus(CertificationStatus.BLOCKED);

        double certifiedPercentage = total > 0 ? (certified * 100.0 / total) : 0;

        return CertificationStatsResponse.builder()
            .total(total)
            .notTested(notTested)
            .inProgress(inProgress)
            .certified(certified)
            .failed(failed)
            .blocked(blocked)
            .certifiedPercentage(Math.round(certifiedPercentage * 100.0) / 100.0)
            .build();
    }

    /**
     * Busca por tag de alerta vinculado.
     */
    @Transactional(readOnly = true)
    public FeatureCertificationResponse getByLinkedAlertTag(String tag) {
        return repository.findByLinkedAlertTag(tag)
            .map(this::toResponse)
            .orElse(null);
    }

    /**
     * Convierte entidad a DTO de respuesta.
     */
    private FeatureCertificationResponse toResponse(FeatureCertification entity) {
        return FeatureCertificationResponse.builder()
            .id(entity.getId())
            .featureCode(entity.getFeatureCode())
            .featureName(entity.getFeatureName())
            .featureNameEn(entity.getFeatureNameEn())
            .parentCode(entity.getParentCode())
            .displayOrder(entity.getDisplayOrder())
            .status(entity.getStatus())
            .testedBy(entity.getTestedBy())
            .testedAt(entity.getTestedAt())
            .certifiedBy(entity.getCertifiedBy())
            .certifiedAt(entity.getCertifiedAt())
            .notes(entity.getNotes())
            .testEvidenceUrl(entity.getTestEvidenceUrl())
            .blockerReason(entity.getBlockerReason())
            .linkedAlertTag(entity.getLinkedAlertTag())
            .createdAt(entity.getCreatedAt())
            .updatedAt(entity.getUpdatedAt())
            .children(new ArrayList<>())
            .build();
    }
}
