package com.globalcmx.api.controller;

import com.globalcmx.api.readmodel.entity.ReferenceNumberConfigReadModel;
import com.globalcmx.api.readmodel.entity.ReferenceNumberHistoryReadModel;
import com.globalcmx.api.service.reference.ReferenceNumberService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/reference-numbers")
public class ReferenceNumberController {

    private final ReferenceNumberService referenceNumberService;

    public ReferenceNumberController(ReferenceNumberService referenceNumberService) {
        this.referenceNumberService = referenceNumberService;
    }

    /**
     * Generates a new reference number
     * POST /api/reference-numbers/generate
     */
    @PostMapping("/generate")
    public ResponseEntity<?> generateReferenceNumber(@RequestBody GenerateReferenceRequest request) {
        try {
            String referenceNumber = referenceNumberService.generateReferenceNumber(
                    request.getClientId() != null ? request.getClientId() : "DEFAULT",
                    request.getProductCode(),
                    request.getCountryCode(),
                    request.getAgencyCode(),
                    request.getEntityType(),
                    request.getEntityId(),
                    request.getGeneratedBy()
            );

            Map<String, String> response = new HashMap<>();
            response.put("referenceNumber", referenceNumber);
            response.put("status", "success");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error generating reference number", e);
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Gets preview of next reference number (doesn't generate)
     * GET /api/reference-numbers/preview
     */
    @GetMapping("/preview")
    public ResponseEntity<?> getPreview(
            @RequestParam(required = false, defaultValue = "DEFAULT") String clientId,
            @RequestParam String productCode,
            @RequestParam String countryCode,
            @RequestParam String agencyCode) {
        try {
            String preview = referenceNumberService.getNextReferencePreview(
                    clientId, productCode, countryCode, agencyCode);

            Map<String, String> response = new HashMap<>();
            response.put("preview", preview);
            response.put("status", "success");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting preview", e);
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
     * Gets all active configurations
     * GET /api/reference-numbers/configurations
     */
    @GetMapping("/configurations")
    public ResponseEntity<List<ReferenceNumberConfigReadModel>> getAllConfigurations() {
        List<ReferenceNumberConfigReadModel> configs = referenceNumberService.getAllActiveConfigurations();
        return ResponseEntity.ok(configs);
    }

    /**
     * Gets a specific configuration
     * GET /api/reference-numbers/configurations/{clientId}/{productCode}/{countryCode}
     */
    @GetMapping("/configurations/{clientId}/{productCode}/{countryCode}")
    public ResponseEntity<?> getConfiguration(
            @PathVariable String clientId,
            @PathVariable String productCode,
            @PathVariable String countryCode) {
        return referenceNumberService.getConfiguration(clientId, productCode, countryCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Saves or updates a configuration
     * POST /api/reference-numbers/configurations
     */
    @PostMapping("/configurations")
    public ResponseEntity<ReferenceNumberConfigReadModel> saveConfiguration(
            @RequestBody ReferenceNumberConfigReadModel config) {
        ReferenceNumberConfigReadModel saved = referenceNumberService.saveConfiguration(config);
        return ResponseEntity.ok(saved);
    }

    /**
     * Gets history by reference number
     * GET /api/reference-numbers/history/{referenceNumber}
     */
    @GetMapping("/history/{referenceNumber}")
    public ResponseEntity<?> getHistoryByReferenceNumber(@PathVariable String referenceNumber) {
        return referenceNumberService.getHistoryByReferenceNumber(referenceNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Gets history by entity
     * GET /api/reference-numbers/history/entity
     */
    @GetMapping("/history/entity")
    public ResponseEntity<List<ReferenceNumberHistoryReadModel>> getHistoryByEntity(
            @RequestParam String entityType,
            @RequestParam String entityId) {
        List<ReferenceNumberHistoryReadModel> history =
                referenceNumberService.getHistoryByEntity(entityType, entityId);
        return ResponseEntity.ok(history);
    }

    // DTO for generate request
    public static class GenerateReferenceRequest {
        private String clientId;
        private String productCode;
        private String countryCode;
        private String agencyCode;
        private String entityType;
        private String entityId;
        private String generatedBy;

        // Getters and setters
        public String getClientId() { return clientId; }
        public void setClientId(String clientId) { this.clientId = clientId; }

        public String getProductCode() { return productCode; }
        public void setProductCode(String productCode) { this.productCode = productCode; }

        public String getCountryCode() { return countryCode; }
        public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

        public String getAgencyCode() { return agencyCode; }
        public void setAgencyCode(String agencyCode) { this.agencyCode = agencyCode; }

        public String getEntityType() { return entityType; }
        public void setEntityType(String entityType) { this.entityType = entityType; }

        public String getEntityId() { return entityId; }
        public void setEntityId(String entityId) { this.entityId = entityId; }

        public String getGeneratedBy() { return generatedBy; }
        public void setGeneratedBy(String generatedBy) { this.generatedBy = generatedBy; }
    }
}
