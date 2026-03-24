package com.globalcmx.api.controller;

import com.globalcmx.api.dto.query.OperationSummaryDTO;
import com.globalcmx.api.dto.query.OperationSummaryDTO.AlertDTO;
import com.globalcmx.api.service.query.OperationAnalyzerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller para el análisis de operaciones.
 * Expone endpoints para obtener el summary y alertas de operaciones.
 */
@RestController
@RequestMapping("/v1/operations")
@RequiredArgsConstructor
@Slf4j
public class OperationAnalyzerController {

    private final OperationAnalyzerService analyzerService;

    /**
     * Obtiene el summary completo de una operación.
     *
     * @param operationId ID de la operación
     * @return Summary con montos, fechas, historial y alertas
     */
    @GetMapping("/{operationId}/summary")
    public ResponseEntity<Map<String, Object>> getOperationSummary(
            @PathVariable String operationId) {
        try {
            log.info("Getting summary for operation: {}", operationId);

            OperationSummaryDTO summary = analyzerService.getStoredSummary(operationId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", summary);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Operation not found: {}", operationId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error getting summary for operation {}: {}", operationId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Error al obtener el summary"));
        }
    }

    /**
     * Obtiene las alertas de una operación específica.
     *
     * @param operationId ID de la operación
     * @return Lista de alertas
     */
    @GetMapping("/{operationId}/alerts")
    public ResponseEntity<Map<String, Object>> getOperationAlerts(
            @PathVariable String operationId) {
        try {
            log.info("Getting alerts for operation: {}", operationId);

            List<AlertDTO> alerts = analyzerService.getOperationAlerts(operationId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", alerts);
            response.put("count", alerts.size());
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Operation not found: {}", operationId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error getting alerts for operation {}: {}", operationId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Error al obtener alertas"));
        }
    }

    /**
     * Fuerza un recálculo del summary de una operación.
     * Útil para sincronizar después de cambios manuales en BD.
     *
     * @param operationId ID de la operación
     * @return Summary actualizado
     */
    @PostMapping("/{operationId}/summary/refresh")
    public ResponseEntity<Map<String, Object>> refreshOperationSummary(
            @PathVariable String operationId) {
        try {
            log.info("Refreshing summary for operation: {}", operationId);

            OperationSummaryDTO summary = analyzerService.updateAndPersistSummary(operationId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", summary);
            response.put("message", "Summary actualizado correctamente");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Operation not found: {}", operationId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error refreshing summary for operation {}: {}", operationId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Error al actualizar el summary"));
        }
    }

    /**
     * Obtiene las alertas agrupadas por operación para un tipo de producto.
     *
     * @param productType Tipo de producto (LC_IMPORT, LC_EXPORT, GUARANTEE, COLLECTION)
     * @return Mapa de operationId -> lista de alertas
     */
    @GetMapping("/alerts/by-product/{productType}")
    public ResponseEntity<Map<String, Object>> getAlertsByProductType(
            @PathVariable String productType) {
        try {
            log.info("Getting alerts for product type: {}", productType);

            Map<String, List<AlertDTO>> alertsMap = analyzerService.getAlertsByProductType(productType);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", alertsMap);
            response.put("operationsWithAlerts", alertsMap.size());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting alerts for product type {}: {}", productType, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Error al obtener alertas"));
        }
    }

    /**
     * Recalcula y actualiza los summaries de todas las operaciones activas de un tipo de producto.
     *
     * @param productType Tipo de producto
     * @return Número de operaciones actualizadas
     */
    @PostMapping("/summaries/refresh-by-product/{productType}")
    public ResponseEntity<Map<String, Object>> refreshSummariesByProductType(
            @PathVariable String productType) {
        try {
            log.info("Refreshing summaries for product type: {}", productType);

            int updated = analyzerService.refreshSummariesByProductType(productType);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("updated", updated);
            response.put("message", String.format("Se actualizaron %d operaciones", updated));
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error refreshing summaries for product type {}: {}", productType, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Error al actualizar summaries"));
        }
    }
}
