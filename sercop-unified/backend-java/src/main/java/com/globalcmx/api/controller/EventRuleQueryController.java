package com.globalcmx.api.controller;

import com.globalcmx.api.dto.query.ReglaEventoQueryDTO;
import com.globalcmx.api.service.query.EventRuleQueryService;
import com.globalcmx.api.service.sync.ReglaEventoSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/event-rules/queries")
@RequiredArgsConstructor
@Slf4j
public class EventRuleQueryController {

    private final EventRuleQueryService eventRuleQueryService;
    private final ReglaEventoSyncService reglaEventoSyncService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllReglasEventos() {
        try {
            log.info("Recibida solicitud para obtener todas las reglas de eventos");
            List<ReglaEventoQueryDTO> reglasEventos = eventRuleQueryService.getAllReglasEventos();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", reglasEventos);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener reglas de eventos: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener reglas de eventos: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getReglaEventoById(@PathVariable Long id) {
        try {
            log.info("Recibida solicitud para obtener regla de evento por ID: {}", id);
            ReglaEventoQueryDTO reglaEvento = eventRuleQueryService.getReglaEventoById(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", reglaEvento);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al obtener regla de evento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(404).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al obtener regla de evento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener regla de evento: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/codigo/{codigo}")
    public ResponseEntity<Map<String, Object>> getReglaEventoByCodigo(@PathVariable String codigo) {
        try {
            log.info("Recibida solicitud para obtener regla de evento por código: {}", codigo);
            ReglaEventoQueryDTO reglaEvento = eventRuleQueryService.getReglaEventoByCodigo(codigo);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", reglaEvento);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al obtener regla de evento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(404).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al obtener regla de evento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener regla de evento: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/activas")
    public ResponseEntity<Map<String, Object>> getActiveReglasEventos() {
        try {
            log.info("Recibida solicitud para obtener reglas de eventos activas");
            List<ReglaEventoQueryDTO> reglasEventos = eventRuleQueryService.getReglasActivasOnly();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", reglasEventos);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener reglas de eventos activas: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener reglas de eventos activas: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/activas/tipo-operacion/{tipoOperacion}")
    public ResponseEntity<Map<String, Object>> getActiveReglasByTipoOperacion(@PathVariable String tipoOperacion) {
        try {
            log.info("Recibida solicitud para obtener reglas activas por tipo de operación: {}", tipoOperacion);
            List<ReglaEventoQueryDTO> reglasEventos = eventRuleQueryService.getReglasActivasByTipoOperacion(tipoOperacion);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", reglasEventos);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener reglas por tipo de operación: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener reglas por tipo de operación: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/activas/evento-trigger/{eventoTrigger}")
    public ResponseEntity<Map<String, Object>> getActiveReglasByEventoTrigger(@PathVariable String eventoTrigger) {
        try {
            log.info("Recibida solicitud para obtener reglas activas por evento trigger: {}", eventoTrigger);
            List<ReglaEventoQueryDTO> reglasEventos = eventRuleQueryService.getReglasActivasByEventoTrigger(eventoTrigger);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", reglasEventos);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener reglas por evento trigger: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener reglas por evento trigger: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/activas/filtro")
    public ResponseEntity<Map<String, Object>> getActiveReglasByTipoAndEvento(
            @RequestParam String tipoOperacion,
            @RequestParam String eventoTrigger) {
        try {
            log.info("Recibida solicitud para obtener reglas activas por tipo y evento: {} - {}",
                    tipoOperacion, eventoTrigger);
            List<ReglaEventoQueryDTO> reglasEventos = eventRuleQueryService
                    .getReglasActivasByTipoOperacionAndEventoTrigger(tipoOperacion, eventoTrigger);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", reglasEventos);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener reglas por filtro: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener reglas por filtro: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/{id}/event-history")
    public ResponseEntity<Map<String, Object>> getEventHistory(@PathVariable Long id) {
        try {
            log.info("Recibida solicitud para obtener historial de eventos de la regla de evento: {}", id);
            List<com.globalcmx.api.dto.query.EventHistoryDTO> eventHistory = eventRuleQueryService.getEventHistory(id);

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
    public ResponseEntity<Map<String, Object>> syncReglasEventos() {
        try {
            log.info("Recibida solicitud para sincronizar reglas de eventos desde Event Store");
            reglaEventoSyncService.syncAllReglasEventos();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Sincronización completada exitosamente");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al sincronizar reglas de eventos: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al sincronizar reglas de eventos: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
