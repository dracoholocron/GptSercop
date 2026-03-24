package com.globalcmx.api.controller;

import com.globalcmx.api.dto.comision.ComisionResponse;
import com.globalcmx.api.dto.swift.MensajeSWIFT;
import com.globalcmx.api.readmodel.entity.DroolsRulesConfigReadModel;
import com.globalcmx.api.service.comision.ComisionService;
import com.globalcmx.api.service.query.DroolsRulesConfigQueryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Controller REST para el cálculo de comisiones SWIFT
 */
@Slf4j
@RestController
@RequestMapping("/commissions")
@RequiredArgsConstructor
public class CommissionController {

    private final ComisionService comisionService;
    private final DroolsRulesConfigQueryService droolsRulesConfigQueryService;

    /**
     * Endpoint para calcular la comisión de un mensaje SWIFT
     *
     * POST /api/comisiones/calcular
     *
     * @param mensaje Datos del mensaje SWIFT
     * @return Respuesta con la comisión calculada
     */
    @PostMapping("/calcular")
    public ResponseEntity<Map<String, Object>> calcularComision(
            @Valid @RequestBody MensajeSWIFT mensaje) {

        log.info("Request para calcular comisión: {} - {}", mensaje.getTipoMensaje(), mensaje.getEvento());

        try {
            ComisionResponse response = comisionService.calcularComision(mensaje);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            result.put("message", "Comisión calculada exitosamente");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Error al calcular comisión", e);

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            error.put("message", "Error al calcular comisión");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Endpoint para recargar las reglas de comisiones desde el Excel
     *
     * POST /api/comisiones/recargar
     *
     * @return Respuesta de éxito
     */
    @PostMapping("/recargar")
    public ResponseEntity<Map<String, Object>> recargarReglas() {
        log.info("Request para recargar reglas de comisiones");

        try {
            comisionService.recargarReglas();

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Reglas recargadas exitosamente");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Error al recargar reglas", e);

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            error.put("message", "Error al recargar reglas");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Endpoint para cargar un archivo Excel y generar el archivo DRL
     *
     * POST /api/comisiones/cargar-excel
     *
     * @param file Archivo Excel con la configuración de comisiones
     * @return Respuesta de éxito o error
     */
    @PostMapping("/cargar-excel")
    public ResponseEntity<Map<String, Object>> cargarExcel(
            @RequestParam("file") MultipartFile file) {

        log.info("Request para cargar archivo Excel: {}", file.getOriginalFilename());

        try {
            // Validar que el archivo no esté vacío
            if (file.isEmpty()) {
                throw new IllegalArgumentException("El archivo está vacío");
            }

            // Validar que sea un archivo Excel
            String filename = file.getOriginalFilename();
            if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
                throw new IllegalArgumentException("El archivo debe ser un archivo Excel (.xlsx o .xls)");
            }

            // Procesar el archivo Excel y generar el DRL
            comisionService.cargarExcelYGenerarDRL(file);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Archivo Excel procesado y reglas actualizadas exitosamente");
            result.put("filename", filename);

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            log.error("Error de validación: {}", e.getMessage());

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            error.put("message", "Error al procesar el archivo");

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);

        } catch (Exception e) {
            log.error("Error al cargar archivo Excel", e);

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            error.put("message", "Error al cargar y procesar el archivo Excel");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Download the current active commission DRL from database
     */
    @GetMapping("/download-drl")
    public ResponseEntity<byte[]> downloadActiveDrl() {
        log.info("Downloading active COMMISSION DRL from database");

        Optional<DroolsRulesConfigReadModel> config = droolsRulesConfigQueryService.getActiveByRuleType("COMMISSION");

        if (config.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        DroolsRulesConfigReadModel drl = config.get();
        byte[] content = drl.getDrlContent().getBytes(java.nio.charset.StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=comisiones-swift.drl")
                .contentType(MediaType.TEXT_PLAIN)
                .contentLength(content.length)
                .body(content);
    }

    /**
     * Download the original Excel file used to generate the active commission rules
     */
    @GetMapping("/download-excel")
    public ResponseEntity<byte[]> downloadActiveExcel() {
        log.info("Downloading active COMMISSION Excel from database");

        Optional<DroolsRulesConfigReadModel> config = droolsRulesConfigQueryService.getActiveByRuleType("COMMISSION");

        if (config.isEmpty() || config.get().getSourceFileContent() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        DroolsRulesConfigReadModel drl = config.get();
        String fileName = drl.getSourceFileName() != null ? drl.getSourceFileName() : "comisiones.xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(drl.getSourceFileContent().length)
                .body(drl.getSourceFileContent());
    }

    /**
     * Endpoint de health check
     *
     * GET /api/comisiones/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Comisiones SWIFT");
        health.put("message", "Servicio operativo");

        return ResponseEntity.ok(health);
    }
}
