package com.globalcmx.api.ai.extraction.controller;

import com.globalcmx.api.ai.extraction.dto.ExtractionRequest;
import com.globalcmx.api.ai.extraction.dto.ExtractionResponse;
import com.globalcmx.api.ai.extraction.dto.ProviderHealthResponse;
import com.globalcmx.api.ai.extraction.dto.UsageStatsResponse;
import com.globalcmx.api.ai.extraction.entity.ExtractionHistory;
import com.globalcmx.api.ai.extraction.service.AIExtractionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller para extracción de documentos con IA
 */
@Slf4j
@RestController
@RequestMapping("/ai/extraction")
@RequiredArgsConstructor
@Tag(name = "AI Extraction", description = "Endpoints para extracción de documentos con IA")
public class AIExtractionController {

    private final AIExtractionService extractionService;

    /**
     * Verifica la salud de un proveedor de IA
     */
    @PostMapping("/health")
    @Operation(summary = "Verificar disponibilidad de proveedor IA")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> checkHealth(
            @RequestBody Map<String, String> request) {

        String provider = request.getOrDefault("provider",
                extractionService.getDefaultProvider());

        ProviderHealthResponse health = extractionService.checkProviderHealth(provider);

        Map<String, Object> response = new HashMap<>();
        response.put("success", health.isAvailable());
        response.put("data", health);

        return ResponseEntity.ok(response);
    }

    /**
     * Lista todos los proveedores disponibles
     */
    @GetMapping("/providers")
    @Operation(summary = "Listar proveedores de IA disponibles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> listProviders() {
        List<ProviderHealthResponse> providers = extractionService.listProviders();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", providers);
        response.put("defaultProvider", extractionService.getDefaultProvider());

        return ResponseEntity.ok(response);
    }

    /**
     * Ejecuta extracción de un documento
     */
    @PostMapping("/extract")
    @Operation(summary = "Extraer campos de un documento con IA")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> extract(
            @Valid @RequestBody ExtractionRequest request,
            Authentication authentication) {

        String userId = authentication != null ? authentication.getName() : "anonymous";

        log.info("Solicitud de extracción recibida. Usuario: {}, Archivo: {}",
                userId, request.getFile().getFileName());

        ExtractionResponse result = extractionService.extract(request, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", result.getErrors() == null || result.getErrors().isEmpty());
        response.put("data", result);

        if (result.getErrors() != null && !result.getErrors().isEmpty()) {
            response.put("message", String.join("; ", result.getErrors()));
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene el historial de extracciones
     */
    @GetMapping("/history")
    @Operation(summary = "Obtener historial de extracciones")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getHistory(
            @Parameter(description = "Tipo de mensaje (MT700, MT760, etc.)")
            @RequestParam(required = false) String messageType,

            @Parameter(description = "Proveedor de IA")
            @RequestParam(required = false) String provider,

            @Parameter(description = "Estado de la extracción")
            @RequestParam(required = false) String status,

            @Parameter(description = "Fecha desde")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,

            @Parameter(description = "Fecha hasta")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,

            @Parameter(description = "Usuario que creó")
            @RequestParam(required = false) String createdBy,

            @Parameter(description = "Número de página")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Tamaño de página")
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<ExtractionHistory> historyPage = extractionService.getHistory(
                messageType, provider, status, dateFrom, dateTo, createdBy, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", historyPage.getContent());
        response.put("total", historyPage.getTotalElements());
        response.put("page", historyPage.getNumber());
        response.put("size", historyPage.getSize());
        response.put("totalPages", historyPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    /**
     * Guarda una extracción en el historial
     */
    @PostMapping("/history")
    @Operation(summary = "Guardar extracción en historial")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> saveHistory(
            @RequestBody Map<String, Object> historyData,
            Authentication authentication) {

        // Este endpoint es para actualizar el estado desde el frontend
        String id = (String) historyData.get("id");
        String status = (String) historyData.getOrDefault("status", "PENDING_REVIEW");
        Integer fieldsApproved = (Integer) historyData.get("fieldsApproved");
        Integer fieldsRejected = (Integer) historyData.get("fieldsRejected");
        Integer fieldsEdited = (Integer) historyData.get("fieldsEdited");

        ExtractionHistory updated = extractionService.updateExtractionStatus(
                id, status, fieldsApproved, fieldsRejected, fieldsEdited);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", updated);

        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene una extracción específica
     */
    @GetMapping("/history/{id}")
    @Operation(summary = "Obtener extracción por ID")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getHistoryById(
            @PathVariable String id) {

        Map<String, Object> response = new HashMap<>();

        return extractionService.getHistoryById(id)
                .map(history -> {
                    response.put("success", true);
                    response.put("data", history);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "Extracción no encontrada");
                    return ResponseEntity.notFound().build();
                });
    }

    /**
     * Elimina una extracción del historial
     */
    @DeleteMapping("/history/{id}")
    @Operation(summary = "Eliminar extracción del historial")
    @PreAuthorize("hasAuthority('CAN_MANAGE_AI_EXTRACTION')")
    public ResponseEntity<Map<String, Object>> deleteHistory(
            @PathVariable String id) {

        extractionService.deleteHistory(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Extracción eliminada");

        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene estadísticas de uso
     */
    @GetMapping("/stats")
    @Operation(summary = "Obtener estadísticas de uso de IA")
    @PreAuthorize("hasAuthority('CAN_VIEW_AI_STATS')")
    public ResponseEntity<Map<String, Object>> getStats(
            @Parameter(description = "Fecha desde")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,

            @Parameter(description = "Fecha hasta")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        if (from == null) {
            from = LocalDateTime.now().minusDays(30);
        }
        if (to == null) {
            to = LocalDateTime.now();
        }

        Map<String, Object> stats = extractionService.getUsageStats(from, to);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);
        response.put("from", from);
        response.put("to", to);

        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene estadísticas de uso del usuario actual
     */
    @GetMapping("/usage")
    @Operation(summary = "Obtener estadísticas de uso del usuario actual")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getUserUsage(Authentication authentication) {
        String userId = authentication != null ? authentication.getName() : "anonymous";

        UsageStatsResponse usageStats = extractionService.getUserUsageStats(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", usageStats);

        return ResponseEntity.ok(response);
    }
}
