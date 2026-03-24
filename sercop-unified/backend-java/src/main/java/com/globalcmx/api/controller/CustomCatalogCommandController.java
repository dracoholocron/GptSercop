package com.globalcmx.api.controller;

import com.globalcmx.api.dto.command.CreateCustomCatalogCommand;
import com.globalcmx.api.dto.command.UpdateCustomCatalogCommand;
import com.globalcmx.api.entity.CatalogoPersonalizado;
import com.globalcmx.api.service.command.CatalogoPersonalizadoCommandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/custom-catalogs/commands")
@RequiredArgsConstructor
@Slf4j
public class CustomCatalogCommandController {

    private final CatalogoPersonalizadoCommandService catalogoPersonalizadoCommandService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createCatalogoPersonalizado(@Valid @RequestBody CreateCustomCatalogCommand command) {
        try {
            log.info("Recibida solicitud para crear catálogo personalizado: {}", command.getCodigo());
            CatalogoPersonalizado catalogoPersonalizado = catalogoPersonalizadoCommandService.createCatalogoPersonalizado(command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Catálogo personalizado creado exitosamente");
            response.put("data", catalogoPersonalizado);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error al crear catálogo personalizado: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al crear catálogo personalizado: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateCatalogoPersonalizado(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomCatalogCommand command) {
        try {
            log.info("Recibida solicitud para actualizar catálogo personalizado: {}", id);
            CatalogoPersonalizado catalogoPersonalizado = catalogoPersonalizadoCommandService.updateCatalogoPersonalizado(id, command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Catálogo personalizado actualizado exitosamente");
            response.put("data", catalogoPersonalizado);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al actualizar catálogo personalizado: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al actualizar catálogo personalizado: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al actualizar catálogo personalizado: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteCatalogoPersonalizado(
            @PathVariable Long id,
            @RequestParam(required = false) String deletedBy) {
        try {
            log.info("Recibida solicitud para eliminar catálogo personalizado: {}", id);
            catalogoPersonalizadoCommandService.deleteCatalogoPersonalizado(id, deletedBy);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Catálogo personalizado eliminado exitosamente");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al eliminar catálogo personalizado: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al eliminar catálogo personalizado: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al eliminar catálogo personalizado: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
