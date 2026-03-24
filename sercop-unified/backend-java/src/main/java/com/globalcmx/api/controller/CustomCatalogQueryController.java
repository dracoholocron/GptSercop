package com.globalcmx.api.controller;

import com.globalcmx.api.dto.query.CatalogoPersonalizadoQueryDTO;
import com.globalcmx.api.eventsourcing.entity.EventStoreEntity;
import com.globalcmx.api.service.query.CustomCatalogQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/custom-catalogs/queries")
@RequiredArgsConstructor
@Slf4j
public class CustomCatalogQueryController {

    private final CustomCatalogQueryService customCatalogQueryService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllCatalogosPersonalizados() {
        try {
            log.info("Recibida solicitud para obtener todos los catálogos personalizados");
            List<CatalogoPersonalizadoQueryDTO> catalogos = customCatalogQueryService.getAllCatalogosPersonalizados();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", catalogos);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener catálogos personalizados: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener catálogos personalizados: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCatalogoPersonalizadoById(@PathVariable Long id) {
        try {
            log.info("Recibida solicitud para obtener catálogo personalizado por ID: {}", id);
            CatalogoPersonalizadoQueryDTO catalogo = customCatalogQueryService.getCatalogoPersonalizadoById(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", catalogo);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al obtener catálogo personalizado: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(404).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al obtener catálogo personalizado: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener catálogo personalizado: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/codigo/{codigo}")
    public ResponseEntity<Map<String, Object>> getCatalogoPersonalizadoByCodigo(@PathVariable String codigo) {
        try {
            log.info("Recibida solicitud para obtener catálogo personalizado por código: {}", codigo);
            CatalogoPersonalizadoQueryDTO catalogo = customCatalogQueryService.getCatalogoPersonalizadoByCodigo(codigo);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", catalogo);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al obtener catálogo personalizado: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(404).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al obtener catálogo personalizado: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener catálogo personalizado: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/nivel/{nivel}")
    public ResponseEntity<Map<String, Object>> getCatalogosByNivel(@PathVariable Integer nivel) {
        try {
            log.info("Recibida solicitud para obtener catálogos personalizados por nivel: {}", nivel);
            List<CatalogoPersonalizadoQueryDTO> catalogos = customCatalogQueryService.getCatalogosByNivel(nivel);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", catalogos);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener catálogos personalizados por nivel: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener catálogos personalizados: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/padre/{catalogoPadreId}")
    public ResponseEntity<Map<String, Object>> getCatalogosByCatalogoPadreId(@PathVariable Long catalogoPadreId) {
        try {
            log.info("Recibida solicitud para obtener catálogos personalizados por catálogo padre: {}", catalogoPadreId);
            List<CatalogoPersonalizadoQueryDTO> catalogos = customCatalogQueryService.getCatalogosByCatalogoPadreId(catalogoPadreId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", catalogos);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener catálogos personalizados por catálogo padre: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener catálogos personalizados: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/codigo-padre/{codigoPadre}")
    public ResponseEntity<Map<String, Object>> getCatalogosByCodigoPadre(@PathVariable String codigoPadre) {
        try {
            log.info("Recibida solicitud para obtener catálogos personalizados por código padre: {}", codigoPadre);
            List<CatalogoPersonalizadoQueryDTO> catalogos = customCatalogQueryService.getCatalogosByCodigoPadre(codigoPadre);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", catalogos);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener catálogos personalizados por código padre: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener catálogos personalizados: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/{id}/event-history")
    public ResponseEntity<Map<String, Object>> getEventHistory(@PathVariable Long id) {
        try {
            log.info("Recibida solicitud para obtener historial de eventos del catálogo personalizado: {}", id);
            List<com.globalcmx.api.dto.query.EventHistoryDTO> eventHistory = customCatalogQueryService.getEventHistory(id);

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
}
