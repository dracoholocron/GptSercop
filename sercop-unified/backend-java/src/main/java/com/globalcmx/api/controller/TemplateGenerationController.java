package com.globalcmx.api.controller;

import com.globalcmx.api.dto.plantilla.GeneratePdfRequest;
import com.globalcmx.api.dto.plantilla.TemplateVariablesResponse;
import com.globalcmx.api.service.plantilla.PlantillaGenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Controlador para la generación de documentos desde plantillas
 */
@RestController
@RequestMapping("/templates/generation")
@RequiredArgsConstructor
@Slf4j
public class TemplateGenerationController {

    private final PlantillaGenerationService plantillaGenerationService;

    /**
     * Genera un PDF desde una plantilla con los datos proporcionados
     */
    @PostMapping("/{id}/generate-pdf")
    public ResponseEntity<Resource> generatePdf(
            @PathVariable Long id,
            @RequestBody GeneratePdfRequest request) {
        try {
            log.info("=== Generando PDF desde plantilla ID: {} ===", id);
            log.info("Datos recibidos (raw): {}", request.getData());
            log.info("Clases de los valores:");
            request.getData().forEach((key, value) -> {
                log.info("  {}: {} (class: {})", key, value, value != null ? value.getClass().getName() : "null");
            });

            byte[] pdfBytes = plantillaGenerationService.generatePdf(id, request.getData());

            String filename = request.getFilename() != null ? request.getFilename() : "documento.pdf";
            if (!filename.endsWith(".pdf")) {
                filename += ".pdf";
            }

            ByteArrayResource resource = new ByteArrayResource(pdfBytes);

            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);

        } catch (IllegalArgumentException e) {
            log.error("Error de validación: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .header("X-Error-Message", e.getMessage())
                .build();
        } catch (Exception e) {
            log.error("Error generando PDF: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .header("X-Error-Message", "Error al generar PDF: " + e.getMessage())
                .build();
        }
    }

    /**
     * Detecta las variables de una plantilla
     */
    @GetMapping("/{id}/variables")
    public ResponseEntity<Map<String, Object>> getTemplateVariables(@PathVariable Long id) {
        try {
            log.info("Detectando variables de plantilla ID: {}", id);

            Set<String> variables = plantillaGenerationService.getStoredVariables(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", TemplateVariablesResponse.builder()
                .variables(variables)
                .valid(true)
                .build());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("Error: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("Error detectando variables: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al detectar variables: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Genera un preview HTML de la plantilla con variables resaltadas
     */
    @GetMapping("/{id}/preview-html")
    public ResponseEntity<String> getPreviewHtml(@PathVariable Long id) {
        try {
            log.info("Generando preview HTML para plantilla ID: {}", id);

            String previewHtml = plantillaGenerationService.generatePreviewHtml(id);

            return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(previewHtml);

        } catch (IllegalArgumentException e) {
            log.error("Error: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body("<html><body><h1>Error</h1><p>" + e.getMessage() + "</p></body></html>");
        } catch (Exception e) {
            log.error("Error generando preview: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("<html><body><h1>Error</h1><p>Error al generar preview: " + e.getMessage() + "</p></body></html>");
        }
    }

    /**
     * Genera un PDF de prueba con datos de ejemplo
     */
    @GetMapping("/{id}/preview-pdf")
    public ResponseEntity<Resource> getPreviewPdf(@PathVariable Long id) {
        try {
            log.info("Generando PDF de preview para plantilla ID: {}", id);

            // Datos de ejemplo para el preview
            Map<String, Object> sampleData = new HashMap<>();
            sampleData.put("nombreCliente", "Juan Pérez");
            sampleData.put("fecha", "2025-10-24");
            sampleData.put("monto", "$10,000.00");
            sampleData.put("numeroOperacion", "OP-12345");

            byte[] pdfBytes = plantillaGenerationService.generatePdf(id, sampleData);

            ByteArrayResource resource = new ByteArrayResource(pdfBytes);

            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"preview.pdf\"")
                .body(resource);

        } catch (Exception e) {
            log.error("Error generando preview PDF: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .header("X-Error-Message", "Error al generar preview PDF: " + e.getMessage())
                .build();
        }
    }
}
