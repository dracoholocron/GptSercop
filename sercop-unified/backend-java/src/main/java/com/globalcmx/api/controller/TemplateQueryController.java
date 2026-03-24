package com.globalcmx.api.controller;

import com.globalcmx.api.dto.query.PlantillaQueryDTO;
import com.globalcmx.api.service.query.TemplateQueryService;
import com.globalcmx.api.service.sync.PlantillaSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/templates/queries")
@RequiredArgsConstructor
@Slf4j
public class TemplateQueryController {

    private final TemplateQueryService templateQueryService;
    private final PlantillaSyncService plantillaSyncService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllPlantillas() {
        try {
            log.info("Recibida solicitud para obtener todas las plantillas");
            List<PlantillaQueryDTO> plantillas = templateQueryService.getAllPlantillas();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", plantillas);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener plantillas: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener plantillas: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getPlantillaById(@PathVariable Long id) {
        try {
            log.info("Recibida solicitud para obtener plantilla por ID: {}", id);
            PlantillaQueryDTO plantilla = templateQueryService.getPlantillaById(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", plantilla);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al obtener plantilla: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(404).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al obtener plantilla: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener plantilla: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/codigo/{codigo}")
    public ResponseEntity<Map<String, Object>> getPlantillaByCodigo(@PathVariable String codigo) {
        try {
            log.info("Recibida solicitud para obtener plantilla por código: {}", codigo);
            PlantillaQueryDTO plantilla = templateQueryService.getPlantillaByCodigo(codigo);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", plantilla);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al obtener plantilla: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(404).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al obtener plantilla: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener plantilla: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/activas")
    public ResponseEntity<Map<String, Object>> getActivePlantillas() {
        try {
            log.info("Recibida solicitud para obtener plantillas activas");
            List<PlantillaQueryDTO> plantillas = templateQueryService.getActivePlantillasOnly();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", plantillas);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener plantillas activas: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener plantillas activas: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/{id}/event-history")
    public ResponseEntity<Map<String, Object>> getEventHistory(@PathVariable Long id) {
        try {
            log.info("Recibida solicitud para obtener historial de eventos de la plantilla: {}", id);
            List<com.globalcmx.api.dto.query.EventHistoryDTO> eventHistory = templateQueryService.getEventHistory(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", eventHistory);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener historial de eventos: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener historial de eventos: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncPlantillas() {
        try {
            log.info("Recibida solicitud para sincronizar plantillas desde Event Store");
            plantillaSyncService.syncAllPlantillas();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Sincronización completada exitosamente");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al sincronizar plantillas: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al sincronizar plantillas: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
