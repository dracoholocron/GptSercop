package com.globalcmx.api.controller;

import com.globalcmx.api.dto.command.CreateEmailTemplateCommand;
import com.globalcmx.api.dto.command.UpdateEmailTemplateCommand;
import com.globalcmx.api.entity.PlantillaCorreo;
import com.globalcmx.api.service.command.PlantillaCorreoCommandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/email-templates/commands")
@RequiredArgsConstructor
@Slf4j
public class EmailTemplateCommandController {

    private final PlantillaCorreoCommandService plantillaCorreoCommandService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createPlantillaCorreo(@Valid @RequestBody CreateEmailTemplateCommand command) {
        try {
            log.info("Recibida solicitud para crear plantilla de correo: {}", command.getCodigo());
            PlantillaCorreo plantillaCorreo = plantillaCorreoCommandService.createPlantillaCorreo(command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Plantilla de correo creada exitosamente");
            response.put("data", plantillaCorreo);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error al crear plantilla de correo: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al crear plantilla de correo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updatePlantillaCorreo(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmailTemplateCommand command) {
        try {
            log.info("Recibida solicitud para actualizar plantilla de correo: {}", id);
            PlantillaCorreo plantillaCorreo = plantillaCorreoCommandService.updatePlantillaCorreo(id, command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Plantilla de correo actualizada exitosamente");
            response.put("data", plantillaCorreo);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al actualizar plantilla de correo: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al actualizar plantilla de correo: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al actualizar plantilla de correo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deletePlantillaCorreo(
            @PathVariable Long id,
            @RequestParam(required = false) String deletedBy) {
        try {
            log.info("Recibida solicitud para eliminar plantilla de correo: {}", id);
            plantillaCorreoCommandService.deletePlantillaCorreo(id, deletedBy);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Plantilla de correo eliminada exitosamente");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al eliminar plantilla de correo: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al eliminar plantilla de correo: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al eliminar plantilla de correo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
