package com.globalcmx.api.certification.controller;

import com.globalcmx.api.certification.dto.CertificationStatsResponse;
import com.globalcmx.api.certification.dto.FeatureCertificationResponse;
import com.globalcmx.api.certification.dto.FeatureCertificationUpdateRequest;
import com.globalcmx.api.certification.entity.FeatureCertification.CertificationStatus;
import com.globalcmx.api.certification.service.FeatureCertificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller para gestionar la certificación de funcionalidades.
 * Solo accesible por usuarios con rol ADMIN.
 */
@RestController
@RequestMapping("/admin/feature-certification")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class FeatureCertificationController {

    private final FeatureCertificationService service;

    /**
     * Obtiene todas las funcionalidades en estructura jerárquica.
     */
    @GetMapping
    public ResponseEntity<List<FeatureCertificationResponse>> getAllHierarchical() {
        return ResponseEntity.ok(service.getAllHierarchical());
    }

    /**
     * Obtiene todas las funcionalidades (lista plana).
     */
    @GetMapping("/flat")
    public ResponseEntity<List<FeatureCertificationResponse>> getAllFlat() {
        return ResponseEntity.ok(service.getAll());
    }

    /**
     * Obtiene una funcionalidad por código.
     */
    @GetMapping("/code/{featureCode}")
    public ResponseEntity<FeatureCertificationResponse> getByCode(@PathVariable String featureCode) {
        return ResponseEntity.ok(service.getByCode(featureCode));
    }

    /**
     * Obtiene funcionalidades por estado.
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<FeatureCertificationResponse>> getByStatus(
            @PathVariable CertificationStatus status) {
        return ResponseEntity.ok(service.getByStatus(status));
    }

    /**
     * Actualiza el estado de certificación de una funcionalidad.
     */
    @PutMapping("/code/{featureCode}")
    public ResponseEntity<FeatureCertificationResponse> updateStatus(
            @PathVariable String featureCode,
            @RequestBody FeatureCertificationUpdateRequest request,
            @AuthenticationPrincipal UserDetails user) {
        String username = user != null ? user.getUsername() : "system";
        return ResponseEntity.ok(service.updateStatus(featureCode, request, username));
    }

    /**
     * Obtiene estadísticas de certificación.
     */
    @GetMapping("/stats")
    public ResponseEntity<CertificationStatsResponse> getStats() {
        return ResponseEntity.ok(service.getStats());
    }

    /**
     * Busca por tag de alerta vinculado.
     */
    @GetMapping("/by-alert-tag/{tag}")
    public ResponseEntity<FeatureCertificationResponse> getByLinkedAlertTag(@PathVariable String tag) {
        FeatureCertificationResponse response = service.getByLinkedAlertTag(tag);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }
}
