package com.globalcmx.api.controller;

import com.globalcmx.api.dto.report.ReportMetadataDTO;
import com.globalcmx.api.dto.report.ReportRequestDTO;
import com.globalcmx.api.service.report.ReportGeneratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportGeneratorService reportGeneratorService;

    /**
     * Obtiene la metadata disponible para generar reportes (tablas, columnas, filtros)
     */
    @GetMapping("/metadata")
    public ResponseEntity<ReportMetadataDTO> getMetadata() {
        log.info("GET /api/reports/metadata - Obteniendo metadata de reportes");
        return ResponseEntity.ok(reportGeneratorService.getMetadata());
    }

    /**
     * Genera un reporte basado en la configuración del usuario
     */
    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateReport(@RequestBody ReportRequestDTO request) {
        log.info("POST /api/reports/generate - Generando reporte para tabla: {}", request.getTableId());
        Map<String, Object> report = reportGeneratorService.generateReport(request);
        return ResponseEntity.ok(report);
    }
}
