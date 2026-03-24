package com.globalcmx.api.compraspublicas.ai.controller;

import com.globalcmx.api.compraspublicas.ai.dto.*;
import com.globalcmx.api.compraspublicas.ai.service.CPAIService;
import com.globalcmx.api.compraspublicas.ai.entity.CPAIAnalysisHistory;
import com.globalcmx.api.compraspublicas.ai.entity.CPHistoricalPrice;
import com.globalcmx.api.compraspublicas.ai.repository.CPAIAnalysisHistoryRepository;
import com.globalcmx.api.compraspublicas.ai.repository.CPHistoricalPriceRepository;
import com.globalcmx.api.readmodel.entity.CatalogoPersonalizadoReadModel;
import com.globalcmx.api.readmodel.entity.ProductTypeConfigReadModel;
import com.globalcmx.api.readmodel.repository.CatalogoPersonalizadoReadModelRepository;
import com.globalcmx.api.readmodel.repository.ProductTypeConfigRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller REST para módulos de IA de Compras Públicas.
 */
@Slf4j
@RestController
@RequestMapping("/compras-publicas/ai")
@RequiredArgsConstructor
@Tag(name = "Compras Públicas - IA", description = "Módulos de Inteligencia Artificial para Contratación Pública")
public class CPAIController {

    private final CPAIService cpAIService;
    private final CPHistoricalPriceRepository priceRepository;
    private final CPAIAnalysisHistoryRepository historyRepository;
    private final CatalogoPersonalizadoReadModelRepository catalogRepository;
    private final ProductTypeConfigRepository productTypeConfigRepository;

    // =========================================================================
    // ASISTENTE LEGAL
    // =========================================================================

    @PostMapping("/legal-help")
    @Operation(summary = "Obtener ayuda legal contextual",
               description = "Proporciona asistencia legal basada en LOSNCP, RGLOSNCP y Resoluciones SERCOP")
    @PreAuthorize("hasAuthority('CP_AI_LEGAL_VIEW')")
    public ResponseEntity<CPLegalHelpResponse> getLegalHelp(
            @RequestBody CPLegalHelpRequest request,
            @AuthenticationPrincipal UserDetails user) {

        log.info("Solicitud de ayuda legal - Proceso: {}, Campo: {}, Usuario: {}",
                request.getProcessType(), request.getFieldId(), user.getUsername());

        CPLegalHelpResponse response = cpAIService.getLegalHelp(request, user.getUsername());
        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // ANÁLISIS DE PRECIOS
    // =========================================================================

    @PostMapping("/price-analysis")
    @Operation(summary = "Analizar precio propuesto",
               description = "Compara un precio con datos históricos de contratación pública")
    @PreAuthorize("hasAuthority('CP_AI_PRICE_ANALYSIS')")
    public ResponseEntity<CPPriceAnalysisResponse> analyzePrices(
            @RequestBody CPPriceAnalysisRequest request,
            @AuthenticationPrincipal UserDetails user) {

        log.info("Análisis de precios - CPC: {}, Precio: {}, Usuario: {}",
                request.getCpcCode(), request.getProposedPrice(), user.getUsername());

        CPPriceAnalysisResponse response = cpAIService.analyzePrices(request, user.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/prices/historical/{cpcCode}")
    @Operation(summary = "Obtener precios históricos por CPC",
               description = "Lista de precios históricos para un código CPC")
    @PreAuthorize("hasAuthority('CP_AI_PRICE_ANALYSIS')")
    public ResponseEntity<List<CPHistoricalPrice>> getHistoricalPrices(
            @PathVariable String cpcCode) {

        List<CPHistoricalPrice> prices = priceRepository
                .findByCpcCodeOrderByAdjudicationDateDesc(cpcCode);
        return ResponseEntity.ok(prices);
    }

    @GetMapping("/prices/statistics/{cpcCode}")
    @Operation(summary = "Obtener estadísticas de precios por CPC",
               description = "Estadísticas agregadas de precios históricos")
    @PreAuthorize("hasAuthority('CP_AI_PRICE_ANALYSIS')")
    public ResponseEntity<Map<String, Object>> getPriceStatistics(
            @PathVariable String cpcCode) {

        Map<String, Object> stats = priceRepository.getPriceStatsByCpc(cpcCode);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/prices/search")
    @Operation(summary = "Buscar precios por descripción",
               description = "Búsqueda de texto completo en descripciones")
    @PreAuthorize("hasAuthority('CP_AI_PRICE_ANALYSIS')")
    public ResponseEntity<List<CPHistoricalPrice>> searchPrices(
            @RequestParam String query) {

        List<CPHistoricalPrice> prices = priceRepository.searchByDescription(query);
        return ResponseEntity.ok(prices);
    }

    // =========================================================================
    // DETECCIÓN DE RIESGOS
    // =========================================================================

    @PostMapping("/risk-analysis")
    @Operation(summary = "Detectar riesgos en proceso",
               description = "Analiza indicadores de riesgo de corrupción en un proceso de contratación")
    @PreAuthorize("hasAuthority('CP_AI_RISK_DETECTION')")
    public ResponseEntity<CPRiskAnalysisResponse> analyzeRisks(
            @RequestBody CPRiskAnalysisRequest request,
            @AuthenticationPrincipal UserDetails user) {

        log.info("Análisis de riesgos - Proceso: {}, Entidad: {}, Usuario: {}",
                request.getProcessCode(), request.getEntityName(), user.getUsername());

        CPRiskAnalysisResponse response = cpAIService.analyzeRisks(request, user.getUsername());
        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // HISTORIAL Y ESTADÍSTICAS
    // =========================================================================

    @GetMapping("/history")
    @Operation(summary = "Obtener historial de análisis",
               description = "Lista de análisis de IA realizados con filtros")
    @PreAuthorize("hasAnyAuthority('CP_AI_LEGAL_VIEW', 'CP_AI_PRICE_ANALYSIS', 'CP_AI_RISK_DETECTION')")
    public ResponseEntity<Page<CPAIAnalysisHistory>> getAnalysisHistory(
            @RequestParam(required = false) String analysisType,
            @RequestParam(required = false) String processId,
            @RequestParam(required = false) String entityRuc,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            @AuthenticationPrincipal UserDetails user,
            Pageable pageable) {

        Page<CPAIAnalysisHistory> history = historyRepository.findWithFilters(
                analysisType, processId, entityRuc, user.getUsername(),
                dateFrom, dateTo, pageable);

        return ResponseEntity.ok(history);
    }

    @GetMapping("/history/stats")
    @Operation(summary = "Obtener estadísticas de uso",
               description = "Estadísticas de uso de los módulos de IA")
    @PreAuthorize("hasAnyAuthority('CP_AI_LEGAL_VIEW', 'CP_AI_PRICE_ANALYSIS', 'CP_AI_RISK_DETECTION')")
    public ResponseEntity<List<Map<String, Object>>> getUsageStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo) {

        List<Map<String, Object>> stats = historyRepository.getUsageStats(dateFrom, dateTo);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/history/recent")
    @Operation(summary = "Últimos análisis del usuario",
               description = "Obtiene los últimos 10 análisis del usuario actual")
    @PreAuthorize("hasAnyAuthority('CP_AI_LEGAL_VIEW', 'CP_AI_PRICE_ANALYSIS', 'CP_AI_RISK_DETECTION')")
    public ResponseEntity<List<CPAIAnalysisHistory>> getRecentAnalysis(
            @AuthenticationPrincipal UserDetails user) {

        List<CPAIAnalysisHistory> recent = historyRepository
                .findTop10ByCreatedByOrderByCreatedAtDesc(user.getUsername());
        return ResponseEntity.ok(recent);
    }

    // =========================================================================
    // CONFIGURACIÓN
    // =========================================================================

    @GetMapping("/config/process-types")
    @Operation(summary = "Obtener tipos de proceso",
               description = "Lista de tipos de proceso de contratación pública desde product_type_config")
    public ResponseEntity<List<Map<String, String>>> getProcessTypes() {
        List<Map<String, String>> result = productTypeConfigRepository
                .findByCategoryAndActiveTrueOrderByDisplayOrderAsc("COMPRAS_PUBLICAS")
                .stream()
                .map(config -> {
                    // Parse description: "Nombre - Descripción detallada - Art. X LOSNCP"
                    String fullDesc = config.getDescription() != null ? config.getDescription() : "";
                    String name = fullDesc;
                    String description = fullDesc;
                    int dashIdx = fullDesc.indexOf(" - ");
                    if (dashIdx > 0) {
                        name = fullDesc.substring(0, dashIdx).trim();
                        description = fullDesc.substring(dashIdx + 3).trim();
                    }
                    Map<String, String> item = new HashMap<>();
                    item.put("code", config.getProductType());
                    item.put("name", name);
                    item.put("description", description);
                    item.put("productType", config.getProductType());
                    return item;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/config/risk-indicators")
    @Operation(summary = "Obtener indicadores de riesgo",
               description = "Lista de indicadores de riesgo desde catálogo BD")
    public ResponseEntity<List<Map<String, Object>>> getRiskIndicators() {
        List<Map<String, Object>> result = getCatalogItems("CP_INDICADOR_RIESGO").stream()
                .map(c -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("code", c.getCodigo());
                    item.put("name", c.getNombre());
                    // Parse severity and weight from description
                    String desc = c.getDescripcion() != null ? c.getDescripcion() : "";
                    item.put("severity", extractField(desc, "Severidad:", "MEDIUM"));
                    item.put("weight", extractWeight(desc, 0.5));
                    item.put("description", desc);
                    return item;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/config/risk-levels")
    @Operation(summary = "Obtener niveles de riesgo",
               description = "Clasificación de niveles de riesgo desde catálogo BD")
    public ResponseEntity<List<Map<String, Object>>> getRiskLevels() {
        List<Map<String, Object>> result = getCatalogItems("CP_NIVEL_RIESGO").stream()
                .map(c -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("code", c.getCodigo());
                    item.put("name", c.getNombre());
                    item.put("description", c.getDescripcion() != null ? c.getDescripcion() : "");
                    // Assign colors by code
                    switch (c.getCodigo()) {
                        case "LOW": item.put("color", "#10B981"); item.put("minScore", 0); item.put("maxScore", 25); break;
                        case "MEDIUM": item.put("color", "#F59E0B"); item.put("minScore", 26); item.put("maxScore", 50); break;
                        case "HIGH": item.put("color", "#F97316"); item.put("minScore", 51); item.put("maxScore", 75); break;
                        case "CRITICAL": item.put("color", "#EF4444"); item.put("minScore", 76); item.put("maxScore", 100); break;
                        default: item.put("color", "#6B7280"); item.put("minScore", 0); item.put("maxScore", 100);
                    }
                    return item;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private List<CatalogoPersonalizadoReadModel> getCatalogItems(String parentCode) {
        return catalogRepository.findByCodigo(parentCode)
                .map(parent -> catalogRepository.findByCatalogoPadreIdAndActivoOrderByOrdenAsc(parent.getId(), true))
                .orElse(List.of());
    }

    private String extractField(String description, String label, String defaultValue) {
        int idx = description.indexOf(label);
        if (idx < 0) return defaultValue;
        String sub = description.substring(idx + label.length()).trim();
        int end = sub.indexOf(" - ");
        if (end < 0) end = sub.length();
        return sub.substring(0, end).trim();
    }

    private double extractWeight(String description, double defaultValue) {
        try {
            int idx = description.indexOf("Peso:");
            if (idx < 0) return defaultValue;
            String sub = description.substring(idx + 5).trim();
            int end = sub.indexOf(" ");
            if (end < 0) end = sub.length();
            return Double.parseDouble(sub.substring(0, end).trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
