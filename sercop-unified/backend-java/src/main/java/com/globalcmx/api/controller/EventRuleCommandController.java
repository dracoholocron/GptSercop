package com.globalcmx.api.controller;

import com.globalcmx.api.dto.command.CreateEventRuleCommand;
import com.globalcmx.api.dto.command.UpdateEventRuleCommand;
import com.globalcmx.api.entity.ReglaEvento;
import com.globalcmx.api.service.command.ReglaEventoCommandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/event-rules/commands")
@RequiredArgsConstructor
@Slf4j
public class EventRuleCommandController {

    private final ReglaEventoCommandService reglaEventoCommandService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createReglaEvento(@Valid @RequestBody CreateEventRuleCommand command) {
        try {
            log.info("Recibida solicitud para crear regla de evento: {}", command.getCodigo());
            ReglaEvento reglaEvento = reglaEventoCommandService.createReglaEvento(command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Regla de evento creada exitosamente");
            response.put("data", reglaEvento);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error al crear regla de evento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al crear regla de evento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateReglaEvento(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEventRuleCommand command) {
        try {
            log.info("Recibida solicitud para actualizar regla de evento: {}", id);
            ReglaEvento reglaEvento = reglaEventoCommandService.updateReglaEvento(id, command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Regla de evento actualizada exitosamente");
            response.put("data", reglaEvento);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al actualizar regla de evento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al actualizar regla de evento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al actualizar regla de evento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteReglaEvento(
            @PathVariable Long id,
            @RequestParam(required = false) String deletedBy) {
        try {
            log.info("Recibida solicitud para eliminar regla de evento: {}", id);
            reglaEventoCommandService.deleteReglaEvento(id, deletedBy);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Regla de evento eliminada exitosamente");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al eliminar regla de evento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al eliminar regla de evento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al eliminar regla de evento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
