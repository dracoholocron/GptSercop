package com.globalcmx.api.controller;

import com.globalcmx.api.dto.query.PlantillaCorreoQueryDTO;
import com.globalcmx.api.service.query.EmailTemplateQueryService;
import com.globalcmx.api.service.sync.PlantillaCorreoSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/email-templates/queries")
@RequiredArgsConstructor
@Slf4j
public class EmailTemplateQueryController {

    private final EmailTemplateQueryService emailTemplateQueryService;
    private final PlantillaCorreoSyncService plantillaCorreoSyncService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllPlantillasCorreo() {
        try {
            log.info("Recibida solicitud para obtener todas las plantillas de correo");
            List<PlantillaCorreoQueryDTO> plantillasCorreo = emailTemplateQueryService.getAllPlantillasCorreo();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", plantillasCorreo);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener plantillas de correo: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener plantillas de correo: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getPlantillaCorreoById(@PathVariable Long id) {
        try {
            log.info("Recibida solicitud para obtener plantilla de correo por ID: {}", id);
            PlantillaCorreoQueryDTO plantillaCorreo = emailTemplateQueryService.getPlantillaCorreoById(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", plantillaCorreo);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al obtener plantilla de correo: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(404).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al obtener plantilla de correo: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener plantilla de correo: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/codigo/{codigo}")
    public ResponseEntity<Map<String, Object>> getPlantillaCorreoByCodigo(@PathVariable String codigo) {
        try {
            log.info("Recibida solicitud para obtener plantilla de correo por código: {}", codigo);
            PlantillaCorreoQueryDTO plantillaCorreo = emailTemplateQueryService.getPlantillaCorreoByCodigo(codigo);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", plantillaCorreo);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al obtener plantilla de correo: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(404).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al obtener plantilla de correo: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener plantilla de correo: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/activas")
    public ResponseEntity<Map<String, Object>> getActivePlantillasCorreo() {
        try {
            log.info("Recibida solicitud para obtener plantillas de correo activas");
            List<PlantillaCorreoQueryDTO> plantillasCorreo = emailTemplateQueryService.getActivePlantillasCorreoOnly();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", plantillasCorreo);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener plantillas de correo activas: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener plantillas de correo activas: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/{id}/event-history")
    public ResponseEntity<Map<String, Object>> getEventHistory(@PathVariable Long id) {
        try {
            log.info("Recibida solicitud para obtener historial de eventos de la plantilla de correo: {}", id);
            List<com.globalcmx.api.dto.query.EventHistoryDTO> eventHistory = emailTemplateQueryService.getEventHistory(id);

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
    public ResponseEntity<Map<String, Object>> syncPlantillasCorreo() {
        try {
            log.info("Recibida solicitud para sincronizar plantillas de correo desde Event Store");
            plantillaCorreoSyncService.syncAllPlantillasCorreo();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Sincronización completada exitosamente");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al sincronizar plantillas de correo: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al sincronizar plantillas de correo: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
