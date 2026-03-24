package com.globalcmx.api.controller;

import com.globalcmx.api.dto.command.CreateTemplateCommand;
import com.globalcmx.api.dto.command.UpdateTemplateCommand;
import com.globalcmx.api.entity.Plantilla;
import com.globalcmx.api.service.command.PlantillaCommandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/templates/commands")
@RequiredArgsConstructor
@Slf4j
public class TemplateCommandController {

    private final PlantillaCommandService plantillaCommandService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createPlantilla(@Valid @RequestBody CreateTemplateCommand command) {
        try {
            log.info("Recibida solicitud para crear plantilla: {}", command.getCodigo());
            Plantilla plantilla = plantillaCommandService.createPlantilla(command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Plantilla creada exitosamente");
            response.put("data", plantilla);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error al crear plantilla: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al crear plantilla: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updatePlantilla(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTemplateCommand command) {
        try {
            log.info("Recibida solicitud para actualizar plantilla: {}", id);
            Plantilla plantilla = plantillaCommandService.updatePlantilla(id, command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Plantilla actualizada exitosamente");
            response.put("data", plantilla);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al actualizar plantilla: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al actualizar plantilla: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al actualizar plantilla: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deletePlantilla(
            @PathVariable Long id,
            @RequestParam(required = false) String deletedBy) {
        try {
            log.info("Recibida solicitud para eliminar plantilla: {}", id);
            plantillaCommandService.deletePlantilla(id, deletedBy);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Plantilla eliminada exitosamente");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al eliminar plantilla: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al eliminar plantilla: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al eliminar plantilla: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
