package com.globalcmx.api.compraspublicas.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.ai.dto.AIPromptConfigDTO;
import com.globalcmx.api.ai.extraction.dto.ExtractionRequest;
import com.globalcmx.api.ai.extraction.dto.ExtractionResponse;
import com.globalcmx.api.ai.extraction.service.AIExtractionService;
import com.globalcmx.api.ai.service.AIPromptConfigService;
import com.globalcmx.api.compraspublicas.ai.dto.*;
import com.globalcmx.api.compraspublicas.ai.repository.CPHistoricalPriceRepository;
import com.globalcmx.api.compraspublicas.ai.repository.CPAIAnalysisHistoryRepository;
import com.globalcmx.api.compraspublicas.ai.entity.CPAIAnalysisHistory;
import com.globalcmx.api.compraspublicas.ai.entity.CPHistoricalPrice;
import com.globalcmx.api.readmodel.entity.CatalogoPersonalizadoReadModel;
import com.globalcmx.api.readmodel.repository.CatalogoPersonalizadoReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio principal de IA para Compras Públicas de Ecuador.
 * Reutiliza la infraestructura existente de AIExtractionService y AIPromptConfigService.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CPAIService {

    private final AIExtractionService extractionService;
    private final AIPromptConfigService promptConfigService;
    private final CPHistoricalPriceRepository priceRepository;
    private final CPAIAnalysisHistoryRepository analysisHistoryRepository;
    private final CatalogoPersonalizadoReadModelRepository catalogRepository;
    private final ObjectMapper objectMapper;

    // Constantes de prompts
    private static final String PROMPT_LEGAL_ASSISTANT = "cp_legal_assistant";
    private static final String PROMPT_PRICE_ANALYSIS = "cp_price_analysis";
    private static final String PROMPT_RISK_DETECTION = "cp_risk_detection";
    private static final String PROMPT_DOC_EXTRACTION = "cp_document_extraction";
    private static final String PROMPT_PLIEGO_GENERATOR = "cp_pliego_generator";

    // =========================================================================
    // ASISTENTE LEGAL
    // =========================================================================

    /**
     * Obtiene ayuda legal contextual para un campo específico del proceso.
     */
    @Transactional("readModelTransactionManager")
    public CPLegalHelpResponse getLegalHelp(CPLegalHelpRequest request, String userId) {
        long startTime = System.currentTimeMillis();

        try {
            // Obtener prompt configurado
            AIPromptConfigDTO promptConfig = promptConfigService.getByPromptKey(PROMPT_LEGAL_ASSISTANT)
                    .orElseThrow(() -> new IllegalStateException("Prompt no configurado: " + PROMPT_LEGAL_ASSISTANT));

            // Preparar variables para el template
            Map<String, String> variables = new HashMap<>();
            variables.put("processType", request.getProcessType());
            variables.put("currentStep", request.getCurrentStep());
            variables.put("fieldId", request.getFieldId());
            variables.put("budget", request.getBudget() != null ? request.getBudget().toString() : "No especificado");

            // Renderizar prompt
            String renderedPrompt = promptConfigService.renderTemplate(
                    promptConfig.getPromptTemplate(), variables);

            // Agregar pregunta del usuario si existe
            String fullPrompt = renderedPrompt;
            if (request.getQuestion() != null && !request.getQuestion().isEmpty()) {
                fullPrompt += "\n\nPREGUNTA DEL USUARIO: " + request.getQuestion();
            }

            // Ejecutar extracción (usando el servicio de IA existente)
            ExtractionResponse aiResponse = executeAIAnalysis(fullPrompt, "LEGAL", userId);

            // Parsear respuesta
            CPLegalHelpResponse response = parseLegalHelpResponse(aiResponse);
            response.setProvider(aiResponse.getProvider());
            response.setModel(aiResponse.getModel());
            response.setProcessingTimeMs(System.currentTimeMillis() - startTime);

            // Guardar en historial
            saveAnalysisHistory("LEGAL", PROMPT_LEGAL_ASSISTANT, null, null,
                    request, response, aiResponse, userId);

            return response;

        } catch (Exception e) {
            log.error("Error en asistente legal: {}", e.getMessage(), e);
            throw new RuntimeException("Error al obtener ayuda legal: " + e.getMessage(), e);
        }
    }

    // =========================================================================
    // ANÁLISIS DE PRECIOS
    // =========================================================================

    /**
     * Analiza un precio propuesto comparándolo con datos históricos.
     */
    @Transactional("readModelTransactionManager")
    public CPPriceAnalysisResponse analyzePrices(CPPriceAnalysisRequest request, String userId) {
        long startTime = System.currentTimeMillis();

        try {
            // Obtener datos históricos de la BD
            List<CPHistoricalPrice> historicalPrices = priceRepository
                    .findByCpcCodeOrderByAdjudicationDateDesc(request.getCpcCode());

            // Calcular estadísticas
            CPPriceAnalysisResponse.HistoricalStats stats = calculateHistoricalStats(historicalPrices);

            // Si hay suficientes datos, usar análisis estadístico directo
            if (historicalPrices.size() >= 3) {
                return buildStatisticalAnalysis(request, stats, startTime);
            }

            // Si no hay suficientes datos, usar IA para análisis
            AIPromptConfigDTO promptConfig = promptConfigService.getByPromptKey(PROMPT_PRICE_ANALYSIS)
                    .orElseThrow(() -> new IllegalStateException("Prompt no configurado: " + PROMPT_PRICE_ANALYSIS));

            // Preparar variables
            Map<String, String> variables = new HashMap<>();
            variables.put("cpcCode", request.getCpcCode());
            variables.put("itemDescription", request.getItemDescription());
            variables.put("proposedPrice", request.getProposedPrice().toString());
            variables.put("unit", request.getUnit());
            variables.put("quantity", request.getQuantity() != null ? request.getQuantity().toString() : "1");
            variables.put("historicalData", formatHistoricalData(historicalPrices));

            String renderedPrompt = promptConfigService.renderTemplate(
                    promptConfig.getPromptTemplate(), variables);

            ExtractionResponse aiResponse = executeAIAnalysis(renderedPrompt, "PRICE", userId);
            CPPriceAnalysisResponse response = parsePriceAnalysisResponse(aiResponse, request, stats);
            response.setProcessingTimeMs(System.currentTimeMillis() - startTime);

            // Guardar en historial
            saveAnalysisHistory("PRICE", PROMPT_PRICE_ANALYSIS, request.getProcessId(), null,
                    request, response, aiResponse, userId);

            return response;

        } catch (Exception e) {
            log.error("Error en análisis de precios: {}", e.getMessage(), e);
            throw new RuntimeException("Error al analizar precios: " + e.getMessage(), e);
        }
    }

    // =========================================================================
    // DETECCIÓN DE RIESGOS
    // =========================================================================

    /**
     * Detecta indicadores de riesgo en un proceso de contratación.
     */
    @Transactional("readModelTransactionManager")
    public CPRiskAnalysisResponse analyzeRisks(CPRiskAnalysisRequest request, String userId) {
        long startTime = System.currentTimeMillis();

        try {
            // Obtener indicadores de riesgo configurados del catálogo
            List<Map<String, Object>> riskIndicators = getRiskIndicatorsFromCatalog();

            // Obtener prompt configurado
            AIPromptConfigDTO promptConfig = promptConfigService.getByPromptKey(PROMPT_RISK_DETECTION)
                    .orElseThrow(() -> new IllegalStateException("Prompt no configurado: " + PROMPT_RISK_DETECTION));

            // Preparar variables
            Map<String, String> variables = new HashMap<>();
            variables.put("processCode", request.getProcessCode());
            variables.put("processType", request.getProcessType());
            variables.put("entityName", request.getEntityName());
            variables.put("entityRuc", request.getEntityRuc());
            variables.put("budget", request.getBudget() != null ? request.getBudget().toString() : "No especificado");
            variables.put("publicationDate", request.getPublicationDate() != null ?
                    request.getPublicationDate().toString() : "No especificada");
            variables.put("deadlineDate", request.getDeadlineDate() != null ?
                    request.getDeadlineDate().toString() : "No especificada");
            variables.put("biddersData", formatBiddersData(request.getBidders()));
            variables.put("entityHistory", ""); // Se podría obtener de historial
            variables.put("riskIndicators", formatRiskIndicators(riskIndicators));

            String renderedPrompt = promptConfigService.renderTemplate(
                    promptConfig.getPromptTemplate(), variables);

            ExtractionResponse aiResponse = executeAIAnalysis(renderedPrompt, "RISK", userId);
            CPRiskAnalysisResponse response = parseRiskAnalysisResponse(aiResponse, request);
            response.setProcessingTimeMs(System.currentTimeMillis() - startTime);

            // Guardar en historial
            saveAnalysisHistory("RISK", PROMPT_RISK_DETECTION, null, request.getEntityRuc(),
                    request, response, aiResponse, userId);

            return response;

        } catch (Exception e) {
            log.error("Error en detección de riesgos: {}", e.getMessage(), e);
            throw new RuntimeException("Error al analizar riesgos: " + e.getMessage(), e);
        }
    }

    // =========================================================================
    // MÉTODOS AUXILIARES
    // =========================================================================

    /**
     * Ejecuta un análisis usando el servicio de extracción de IA.
     */
    private ExtractionResponse executeAIAnalysis(String prompt, String analysisType, String userId) {
        // Crear un FileInfo "virtual" con el prompt como contenido
        ExtractionRequest.FileInfo fileInfo = ExtractionRequest.FileInfo.builder()
                .fileName("analysis_" + analysisType.toLowerCase() + ".txt")
                .mimeType("text/plain")
                .content(Base64.getEncoder().encodeToString(prompt.getBytes()))
                .type("base64")
                .build();

        ExtractionRequest extractionRequest = ExtractionRequest.builder()
                .file(fileInfo)
                .prompt(prompt)
                .messageType("CP_" + analysisType)
                .language("es")
                .build();

        return extractionService.extract(extractionRequest, userId);
    }

    /**
     * Calcula estadísticas de precios históricos.
     */
    private CPPriceAnalysisResponse.HistoricalStats calculateHistoricalStats(List<CPHistoricalPrice> prices) {
        if (prices.isEmpty()) {
            return CPPriceAnalysisResponse.HistoricalStats.builder()
                    .sampleCount(0)
                    .build();
        }

        List<BigDecimal> priceValues = prices.stream()
                .map(CPHistoricalPrice::getUnitPrice)
                .sorted()
                .collect(Collectors.toList());

        BigDecimal sum = priceValues.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal avg = sum.divide(BigDecimal.valueOf(priceValues.size()), 4, RoundingMode.HALF_UP);

        BigDecimal min = priceValues.get(0);
        BigDecimal max = priceValues.get(priceValues.size() - 1);
        BigDecimal median = priceValues.get(priceValues.size() / 2);

        // Calcular desviación estándar
        BigDecimal variance = priceValues.stream()
                .map(p -> p.subtract(avg).pow(2))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(priceValues.size()), 4, RoundingMode.HALF_UP);
        BigDecimal stdDev = BigDecimal.valueOf(Math.sqrt(variance.doubleValue()));

        return CPPriceAnalysisResponse.HistoricalStats.builder()
                .average(avg)
                .min(min)
                .max(max)
                .median(median)
                .standardDeviation(stdDev)
                .sampleCount(priceValues.size())
                .build();
    }

    /**
     * Construye análisis estadístico directo cuando hay suficientes datos.
     */
    private CPPriceAnalysisResponse buildStatisticalAnalysis(
            CPPriceAnalysisRequest request,
            CPPriceAnalysisResponse.HistoricalStats stats,
            long startTime) {

        BigDecimal proposed = request.getProposedPrice();
        BigDecimal avg = stats.getAverage();

        // Calcular desviación del promedio
        BigDecimal deviation = proposed.subtract(avg)
                .divide(avg, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

        // Determinar nivel de riesgo
        String riskLevel;
        int anomalyScore;
        List<String> warnings = new ArrayList<>();

        double deviationAbs = Math.abs(deviation.doubleValue());
        if (deviationAbs <= 15) {
            riskLevel = "LOW";
            anomalyScore = (int) (deviationAbs * 2);
        } else if (deviationAbs <= 30) {
            riskLevel = "MEDIUM";
            anomalyScore = 30 + (int) ((deviationAbs - 15) * 2);
            warnings.add("El precio se desvía más del 15% del promedio histórico");
        } else if (deviationAbs <= 50) {
            riskLevel = "HIGH";
            anomalyScore = 60 + (int) ((deviationAbs - 30) * 1.5);
            warnings.add("El precio se desvía significativamente del promedio histórico (>" + String.format("%.1f", deviationAbs) + "%)");
        } else {
            riskLevel = "CRITICAL";
            anomalyScore = Math.min(100, 90 + (int) ((deviationAbs - 50) / 5));
            warnings.add("ALERTA: El precio presenta una anomalía crítica");
        }

        // Construir recomendación
        String recommendation;
        if (proposed.compareTo(avg) > 0) {
            recommendation = String.format(
                    "El precio propuesto ($%.2f) está %.1f%% por encima del promedio histórico ($%.2f). " +
                            "Se recomienda solicitar justificación del precio o revisar especificaciones técnicas.",
                    proposed, deviation.doubleValue(), avg);
        } else if (proposed.compareTo(stats.getMin()) < 0) {
            recommendation = String.format(
                    "El precio propuesto ($%.2f) está por debajo del mínimo histórico ($%.2f). " +
                            "Verificar que el proveedor pueda cumplir con las especificaciones técnicas.",
                    proposed, stats.getMin());
            warnings.add("Precio inferior al mínimo histórico - posible riesgo de incumplimiento");
        } else {
            recommendation = String.format(
                    "El precio propuesto ($%.2f) está dentro del rango aceptable. " +
                            "Promedio histórico: $%.2f",
                    proposed, avg);
        }

        return CPPriceAnalysisResponse.builder()
                .analysisId(UUID.randomUUID().toString())
                .cpcCode(request.getCpcCode())
                .proposedPrice(proposed)
                .historicalStats(stats)
                .percentileRank(calculatePercentileRank(proposed, stats))
                .deviationFromAverage(deviation)
                .anomalyScore(anomalyScore)
                .riskLevel(riskLevel)
                .recommendation(recommendation)
                .warnings(warnings)
                .justification("Análisis basado en " + stats.getSampleCount() +
                        " registros históricos de contratación pública.")
                .suggestedPriceRange(CPPriceAnalysisResponse.PriceRange.builder()
                        .min(avg.multiply(BigDecimal.valueOf(0.85)).setScale(2, RoundingMode.HALF_UP))
                        .max(avg.multiply(BigDecimal.valueOf(1.15)).setScale(2, RoundingMode.HALF_UP))
                        .build())
                .provider("statistical")
                .model("built-in")
                .processingTimeMs(System.currentTimeMillis() - startTime)
                .build();
    }

    private Integer calculatePercentileRank(BigDecimal value, CPPriceAnalysisResponse.HistoricalStats stats) {
        if (stats.getSampleCount() == 0) return 50;

        BigDecimal range = stats.getMax().subtract(stats.getMin());
        if (range.compareTo(BigDecimal.ZERO) == 0) return 50;

        BigDecimal position = value.subtract(stats.getMin()).divide(range, 4, RoundingMode.HALF_UP);
        return Math.min(100, Math.max(0, position.multiply(BigDecimal.valueOf(100)).intValue()));
    }

    private String formatHistoricalData(List<CPHistoricalPrice> prices) {
        if (prices.isEmpty()) return "No hay datos históricos disponibles.";

        StringBuilder sb = new StringBuilder();
        for (CPHistoricalPrice price : prices) {
            sb.append(String.format("- %s: $%.2f (%s, %s)\n",
                    price.getAdjudicationDate(),
                    price.getUnitPrice(),
                    price.getProcessType(),
                    price.getEntityName()));
        }
        return sb.toString();
    }

    private String formatBiddersData(List<CPRiskAnalysisRequest.Bidder> bidders) {
        if (bidders == null || bidders.isEmpty()) return "No hay oferentes registrados.";

        StringBuilder sb = new StringBuilder();
        for (CPRiskAnalysisRequest.Bidder bidder : bidders) {
            sb.append(String.format("- %s (RUC: %s): $%.2f\n",
                    bidder.getName(),
                    bidder.getRuc(),
                    bidder.getOfferedPrice()));
        }
        return sb.toString();
    }

    private List<Map<String, Object>> getRiskIndicatorsFromCatalog() {
        return catalogRepository.findByCodigo("CP_INDICADOR_RIESGO")
                .map(parent -> catalogRepository.findByCatalogoPadreIdAndActivoOrderByOrdenAsc(parent.getId(), true))
                .orElse(List.of())
                .stream()
                .map(c -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("code", c.getCodigo());
                    item.put("name", c.getNombre());
                    String desc = c.getDescripcion() != null ? c.getDescripcion() : "";
                    item.put("severity", extractField(desc, "Severidad:", "MEDIUM"));
                    item.put("weight", extractWeight(desc, 0.5));
                    return item;
                })
                .collect(Collectors.toList());
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

    private String formatRiskIndicators(List<Map<String, Object>> indicators) {
        StringBuilder sb = new StringBuilder();
        for (Map<String, Object> ind : indicators) {
            sb.append(String.format("- %s (%s): Severidad %s, Peso %.2f\n",
                    ind.get("code"), ind.get("name"), ind.get("severity"), ind.get("weight")));
        }
        return sb.toString();
    }

    // =========================================================================
    // PARSEO DE RESPUESTAS
    // =========================================================================

    private CPLegalHelpResponse parseLegalHelpResponse(ExtractionResponse aiResponse) {
        String rawContent = aiResponse.getContent();
        log.debug("Raw AI response for legal help: {}", rawContent != null ? rawContent.substring(0, Math.min(rawContent.length(), 500)) : "null");

        if (rawContent == null || rawContent.isBlank()) {
            return buildFallbackLegalResponse("La IA no devolvió contenido.");
        }

        try {
            // Extract JSON from the response (Claude may wrap it in ```json ... ``` or add text around it)
            String jsonStr = extractJsonFromText(rawContent);
            JsonNode root = objectMapper.readTree(jsonStr);

            // Try "help" wrapper first, then root-level fields
            JsonNode help = root.has("help") ? root.path("help") : root;

            String title = help.path("title").asText("");
            String content = help.path("content").asText("");

            // If content is still empty, the JSON structure didn't match - use raw text
            if (content.isEmpty() && title.isEmpty()) {
                return buildFallbackLegalResponse(rawContent);
            }

            return CPLegalHelpResponse.builder()
                    .title(title.isEmpty() ? "Ayuda Legal" : title)
                    .content(content)
                    .legalReferences(parseListOfLegalReferences(help.path("legalReferences")))
                    .requirements(parseStringList(help.path("requirements")))
                    .commonErrors(parseStringList(help.path("commonErrors")))
                    .tips(parseStringList(help.path("tips")))
                    .examples(parseStringList(help.path("examples")))
                    .sercopResolutions(parseStringList(help.path("sercopResolutions")))
                    .severity("INFO")
                    .confidence(0.9)
                    .build();
        } catch (Exception e) {
            log.warn("Error parseando respuesta legal JSON, usando respuesta raw: {}", e.getMessage());
            return buildFallbackLegalResponse(rawContent);
        }
    }

    private CPLegalHelpResponse buildFallbackLegalResponse(String rawContent) {
        return CPLegalHelpResponse.builder()
                .title("Ayuda Legal")
                .content(rawContent)
                .legalReferences(List.of())
                .requirements(List.of())
                .commonErrors(List.of())
                .tips(List.of())
                .examples(List.of())
                .sercopResolutions(List.of())
                .severity("INFO")
                .confidence(0.7)
                .build();
    }

    /**
     * Extracts JSON from Claude's text response.
     * Claude may return: pure JSON, ```json ... ```, or text with embedded JSON.
     */
    private String extractJsonFromText(String text) {
        String trimmed = text.trim();

        // Case 1: Already valid JSON (starts with {)
        if (trimmed.startsWith("{")) {
            return trimmed;
        }

        // Case 2: Wrapped in markdown code block ```json ... ```
        int jsonBlockStart = trimmed.indexOf("```json");
        if (jsonBlockStart >= 0) {
            int start = trimmed.indexOf('\n', jsonBlockStart) + 1;
            int end = trimmed.indexOf("```", start);
            if (start > 0 && end > start) {
                return trimmed.substring(start, end).trim();
            }
        }

        // Case 3: Wrapped in ``` ... ```
        int codeBlockStart = trimmed.indexOf("```");
        if (codeBlockStart >= 0) {
            int start = trimmed.indexOf('\n', codeBlockStart) + 1;
            int end = trimmed.indexOf("```", start);
            if (start > 0 && end > start) {
                String candidate = trimmed.substring(start, end).trim();
                if (candidate.startsWith("{")) {
                    return candidate;
                }
            }
        }

        // Case 4: Find first { and last } in the text
        int firstBrace = trimmed.indexOf('{');
        int lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1);
        }

        // No JSON found, return as-is (will fail JSON parse and use fallback)
        return trimmed;
    }

    private CPPriceAnalysisResponse parsePriceAnalysisResponse(
            ExtractionResponse aiResponse,
            CPPriceAnalysisRequest request,
            CPPriceAnalysisResponse.HistoricalStats stats) {

        try {
            JsonNode root = objectMapper.readTree(aiResponse.getContent());
            JsonNode analysis = root.path("analysis");

            return CPPriceAnalysisResponse.builder()
                    .analysisId(UUID.randomUUID().toString())
                    .cpcCode(request.getCpcCode())
                    .proposedPrice(request.getProposedPrice())
                    .historicalStats(stats)
                    .percentileRank(analysis.path("percentileRank").asInt(50))
                    .deviationFromAverage(BigDecimal.valueOf(analysis.path("deviationFromAverage").asDouble(0)))
                    .anomalyScore(analysis.path("anomalyScore").asInt(0))
                    .riskLevel(analysis.path("riskLevel").asText("LOW"))
                    .recommendation(analysis.path("recommendation").asText(""))
                    .warnings(parseStringList(analysis.path("warnings")))
                    .justification(analysis.path("justification").asText(""))
                    .provider(aiResponse.getProvider())
                    .model(aiResponse.getModel())
                    .build();
        } catch (Exception e) {
            log.warn("Error parseando respuesta de precios: {}", e.getMessage());
            return CPPriceAnalysisResponse.builder()
                    .analysisId(UUID.randomUUID().toString())
                    .cpcCode(request.getCpcCode())
                    .proposedPrice(request.getProposedPrice())
                    .historicalStats(stats)
                    .riskLevel("UNKNOWN")
                    .recommendation("No se pudo completar el análisis automático.")
                    .warnings(List.of("Error en el análisis de IA"))
                    .provider(aiResponse.getProvider())
                    .model(aiResponse.getModel())
                    .build();
        }
    }

    private CPRiskAnalysisResponse parseRiskAnalysisResponse(
            ExtractionResponse aiResponse,
            CPRiskAnalysisRequest request) {

        try {
            JsonNode root = objectMapper.readTree(aiResponse.getContent());
            JsonNode assessment = root.path("assessment");

            return CPRiskAnalysisResponse.builder()
                    .assessmentId(UUID.randomUUID().toString())
                    .processCode(request.getProcessCode())
                    .overallRiskScore(assessment.path("overallRiskScore").asInt(0))
                    .riskLevel(assessment.path("riskLevel").asText("LOW"))
                    .detectedIndicators(parseDetectedIndicators(assessment.path("detectedIndicators")))
                    .patterns(parsePatterns(assessment.path("patterns")))
                    .recommendations(parseRecommendations(assessment.path("recommendations")))
                    .summary(assessment.path("summary").asText(""))
                    .provider(aiResponse.getProvider())
                    .model(aiResponse.getModel())
                    .build();
        } catch (Exception e) {
            log.warn("Error parseando respuesta de riesgos: {}", e.getMessage());
            return CPRiskAnalysisResponse.builder()
                    .assessmentId(UUID.randomUUID().toString())
                    .processCode(request.getProcessCode())
                    .overallRiskScore(0)
                    .riskLevel("UNKNOWN")
                    .detectedIndicators(List.of())
                    .patterns(List.of())
                    .recommendations(List.of())
                    .summary("No se pudo completar el análisis de riesgos.")
                    .provider(aiResponse.getProvider())
                    .model(aiResponse.getModel())
                    .build();
        }
    }

    private List<String> parseStringList(JsonNode node) {
        List<String> result = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(n -> result.add(n.asText()));
        }
        return result;
    }

    private List<CPLegalHelpResponse.LegalReference> parseListOfLegalReferences(JsonNode node) {
        List<CPLegalHelpResponse.LegalReference> result = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(n -> result.add(CPLegalHelpResponse.LegalReference.builder()
                    .law(n.path("law").asText(""))
                    .article(n.path("article").asText(""))
                    .summary(n.path("summary").asText(""))
                    .build()));
        }
        return result;
    }

    private List<CPRiskAnalysisResponse.DetectedIndicator> parseDetectedIndicators(JsonNode node) {
        List<CPRiskAnalysisResponse.DetectedIndicator> result = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(n -> result.add(CPRiskAnalysisResponse.DetectedIndicator.builder()
                    .code(n.path("code").asText(""))
                    .name(n.path("name").asText(""))
                    .detected(n.path("detected").asBoolean(false))
                    .score(n.path("score").asInt(0))
                    .evidence(n.path("evidence").asText(""))
                    .severity(n.path("severity").asText("LOW"))
                    .build()));
        }
        return result;
    }

    private List<CPRiskAnalysisResponse.Pattern> parsePatterns(JsonNode node) {
        List<CPRiskAnalysisResponse.Pattern> result = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(n -> result.add(CPRiskAnalysisResponse.Pattern.builder()
                    .type(n.path("type").asText(""))
                    .description(n.path("description").asText(""))
                    .entities(parseStringList(n.path("entities")))
                    .build()));
        }
        return result;
    }

    private List<CPRiskAnalysisResponse.Recommendation> parseRecommendations(JsonNode node) {
        List<CPRiskAnalysisResponse.Recommendation> result = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(n -> result.add(CPRiskAnalysisResponse.Recommendation.builder()
                    .priority(n.path("priority").asText("MEDIUM"))
                    .action(n.path("action").asText(""))
                    .responsible(n.path("responsible").asText(""))
                    .build()));
        }
        return result;
    }

    // =========================================================================
    // HISTORIAL
    // =========================================================================

    private void saveAnalysisHistory(String analysisType, String promptKey,
                                      String processId, String entityRuc,
                                      Object input, Object output,
                                      ExtractionResponse aiResponse, String userId) {
        try {
            CPAIAnalysisHistory history = CPAIAnalysisHistory.builder()
                    .id(UUID.randomUUID().toString())
                    .analysisType(analysisType)
                    .promptKey(promptKey)
                    .processId(processId)
                    .entityRuc(entityRuc)
                    .inputData(objectMapper.writeValueAsString(input))
                    .outputData(objectMapper.writeValueAsString(output))
                    .provider(aiResponse.getProvider())
                    .model(aiResponse.getModel())
                    .inputTokens(aiResponse.getInputTokens())
                    .outputTokens(aiResponse.getOutputTokens())
                    .processingTimeMs(aiResponse.getProcessingTimeMs())
                    .estimatedCost(aiResponse.getEstimatedCost())
                    .status("COMPLETED")
                    .createdBy(userId)
                    .createdAt(LocalDateTime.now())
                    .build();

            analysisHistoryRepository.save(history);
        } catch (JsonProcessingException e) {
            log.warn("Error guardando historial de análisis: {}", e.getMessage());
        }
    }
}
