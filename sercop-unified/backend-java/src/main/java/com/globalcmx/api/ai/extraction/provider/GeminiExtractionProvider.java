package com.globalcmx.api.ai.extraction.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.globalcmx.api.ai.extraction.dto.ExtractionRequest;
import com.globalcmx.api.ai.extraction.dto.ExtractionResponse;
import com.globalcmx.api.ai.extraction.dto.ProviderHealthResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Proveedor de extracción usando Google Gemini
 * Soporta PDFs e imágenes de forma nativa
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiExtractionProvider implements AIExtractionProvider {

    private static final String PROVIDER_CODE = "gemini";
    private static final String DISPLAY_NAME = "Google Gemini";
    private static final String API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

    private static final List<String> AVAILABLE_MODELS = Arrays.asList(
            "gemini-2.0-flash-exp",
            "gemini-1.5-pro",
            "gemini-1.5-flash"
    );

    // Precios por millón de tokens (USD) - Gemini 1.5 Pro
    private static final double INPUT_PRICE_PER_MILLION = 1.25;
    private static final double OUTPUT_PRICE_PER_MILLION = 5.0;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.gemini.api-key:}")
    private String apiKey;

    @Value("${ai.gemini.model:gemini-2.0-flash-exp}")
    private String defaultModel;

    @Value("${ai.gemini.max-tokens:8192}")
    private int maxTokens;

    @Value("${ai.gemini.temperature:0.1}")
    private double temperature;

    @Override
    public String getProviderCode() {
        return PROVIDER_CODE;
    }

    @Override
    public String getDisplayName() {
        return DISPLAY_NAME;
    }

    @Override
    public String getDefaultModel() {
        return defaultModel;
    }

    @Override
    public ProviderHealthResponse checkHealth() {
        if (apiKey == null || apiKey.isBlank()) {
            return ProviderHealthResponse.builder()
                    .available(false)
                    .provider(PROVIDER_CODE)
                    .errorMessage("API key de Gemini no configurada")
                    .build();
        }

        long startTime = System.currentTimeMillis();

        try {
            // Hacer una llamada simple para verificar la API
            String url = buildApiUrl(defaultModel);
            HttpHeaders headers = createHeaders();

            ObjectNode requestBody = objectMapper.createObjectNode();
            ArrayNode contents = requestBody.putArray("contents");
            ObjectNode content = contents.addObject();
            ArrayNode parts = content.putArray("parts");
            ObjectNode textPart = parts.addObject();
            textPart.put("text", "ping");

            // Configuración de generación
            ObjectNode generationConfig = requestBody.putObject("generationConfig");
            generationConfig.put("maxOutputTokens", 10);

            HttpEntity<String> entity = new HttpEntity<>(
                    objectMapper.writeValueAsString(requestBody),
                    headers
            );

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            long latency = System.currentTimeMillis() - startTime;

            return ProviderHealthResponse.builder()
                    .available(response.getStatusCode().is2xxSuccessful())
                    .provider(PROVIDER_CODE)
                    .availableModels(AVAILABLE_MODELS)
                    .defaultModel(defaultModel)
                    .latencyMs(latency)
                    .capabilities(ProviderHealthResponse.ProviderCapabilities.builder()
                            .supportsImages(true)
                            .supportsPDF(true)  // Gemini soporta PDFs nativamente
                            .supportsStreaming(true)
                            .maxImageSizeBytes(20L * 1024 * 1024) // 20MB
                            .maxPDFPages(100)
                            .maxTokens(maxTokens)
                            .build())
                    .build();

        } catch (Exception e) {
            log.error("Error verificando disponibilidad de Gemini: {}", e.getMessage());
            return ProviderHealthResponse.builder()
                    .available(false)
                    .provider(PROVIDER_CODE)
                    .errorMessage("Error conectando con Gemini API: " + e.getMessage())
                    .latencyMs(System.currentTimeMillis() - startTime)
                    .build();
        }
    }

    @Override
    public ExtractionResponse extract(ExtractionRequest request) {
        long startTime = System.currentTimeMillis();
        String extractionId = UUID.randomUUID().toString();

        try {
            log.info("Iniciando extracción con Gemini. ID: {}, Archivo: {}",
                    extractionId, request.getFile().getFileName());

            String model = request.getModel() != null ? request.getModel() : defaultModel;
            String url = buildApiUrl(model);
            HttpHeaders headers = createHeaders();
            String requestBody = buildExtractionRequest(request);

            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Error en API de Gemini: " + response.getStatusCode());
            }

            JsonNode responseJson = objectMapper.readTree(response.getBody());

            // Extraer contenido de la respuesta
            String content = extractContent(responseJson);

            // Extraer uso de tokens
            JsonNode usageMetadata = responseJson.get("usageMetadata");
            int inputTokens = usageMetadata != null && usageMetadata.has("promptTokenCount")
                    ? usageMetadata.get("promptTokenCount").asInt() : 0;
            int outputTokens = usageMetadata != null && usageMetadata.has("candidatesTokenCount")
                    ? usageMetadata.get("candidatesTokenCount").asInt() : 0;

            long processingTime = System.currentTimeMillis() - startTime;

            log.info("Extracción completada con Gemini. ID: {}, Tokens: {}/{}, Tiempo: {}ms",
                    extractionId, inputTokens, outputTokens, processingTime);

            return ExtractionResponse.builder()
                    .id(extractionId)
                    .content(content)
                    .messageType(request.getMessageType())
                    .provider(PROVIDER_CODE)
                    .model(model)
                    .processingTimeMs(processingTime)
                    .inputTokens(inputTokens)
                    .outputTokens(outputTokens)
                    .estimatedCost(calculateCost(inputTokens, outputTokens))
                    .createdAt(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            log.error("Error en extracción con Gemini. ID: {}, Error: {}",
                    extractionId, e.getMessage(), e);

            return ExtractionResponse.builder()
                    .id(extractionId)
                    .provider(PROVIDER_CODE)
                    .model(request.getModel() != null ? request.getModel() : defaultModel)
                    .processingTimeMs(System.currentTimeMillis() - startTime)
                    .createdAt(LocalDateTime.now())
                    .errors(List.of(e.getMessage()))
                    .build();
        }
    }

    @Override
    public boolean supportsFileType(String mimeType) {
        if (mimeType == null) return false;

        // Gemini soporta imágenes, PDFs y texto de forma nativa
        return mimeType.startsWith("image/") ||
               mimeType.equals("application/pdf") ||
               mimeType.equals("text/plain") ||
               mimeType.contains("text");
    }

    @Override
    public double estimateCost(int inputTokens, int outputTokens) {
        return (inputTokens * INPUT_PRICE_PER_MILLION / 1_000_000) +
               (outputTokens * OUTPUT_PRICE_PER_MILLION / 1_000_000);
    }

    private String buildApiUrl(String model) {
        return API_BASE_URL + "/" + model + ":generateContent?key=" + apiKey;
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private String buildExtractionRequest(ExtractionRequest request) throws Exception {
        ObjectNode requestBody = objectMapper.createObjectNode();

        // Contenido
        ArrayNode contents = requestBody.putArray("contents");
        ObjectNode content = contents.addObject();
        ArrayNode parts = content.putArray("parts");

        String mimeType = request.getFile().getMimeType();

        if (mimeType.startsWith("image/") || mimeType.equals("application/pdf")) {
            // Contenido multimodal (imagen/PDF)
            // Primero agregar el archivo
            ObjectNode filePart = parts.addObject();
            ObjectNode inlineData = filePart.putObject("inlineData");
            inlineData.put("mimeType", mimeType);
            inlineData.put("data", request.getFile().getContent());

            // Luego agregar el prompt
            ObjectNode textPart = parts.addObject();
            textPart.put("text", request.getPrompt());

        } else {
            // Contenido de texto
            String fullPrompt = request.getPrompt() + "\n\nDOCUMENTO:\n" +
                    decodeBase64IfNeeded(request.getFile().getContent());
            ObjectNode textPart = parts.addObject();
            textPart.put("text", fullPrompt);
        }

        // Configuración de generación
        ObjectNode generationConfig = requestBody.putObject("generationConfig");
        generationConfig.put("maxOutputTokens", maxTokens);
        generationConfig.put("temperature", temperature);

        // Configuración de seguridad (menos restrictiva para documentos comerciales)
        ArrayNode safetySettings = requestBody.putArray("safetySettings");
        addSafetySetting(safetySettings, "HARM_CATEGORY_HARASSMENT", "BLOCK_ONLY_HIGH");
        addSafetySetting(safetySettings, "HARM_CATEGORY_HATE_SPEECH", "BLOCK_ONLY_HIGH");
        addSafetySetting(safetySettings, "HARM_CATEGORY_SEXUALLY_EXPLICIT", "BLOCK_ONLY_HIGH");
        addSafetySetting(safetySettings, "HARM_CATEGORY_DANGEROUS_CONTENT", "BLOCK_ONLY_HIGH");

        return objectMapper.writeValueAsString(requestBody);
    }

    private void addSafetySetting(ArrayNode safetySettings, String category, String threshold) {
        ObjectNode setting = safetySettings.addObject();
        setting.put("category", category);
        setting.put("threshold", threshold);
    }

    private String extractContent(JsonNode responseJson) {
        JsonNode candidates = responseJson.get("candidates");
        if (candidates != null && candidates.isArray() && candidates.size() > 0) {
            JsonNode firstCandidate = candidates.get(0);
            JsonNode content = firstCandidate.get("content");
            if (content != null) {
                JsonNode parts = content.get("parts");
                if (parts != null && parts.isArray() && parts.size() > 0) {
                    JsonNode firstPart = parts.get(0);
                    if (firstPart.has("text")) {
                        return firstPart.get("text").asText();
                    }
                }
            }
        }

        // Verificar si hay error de bloqueo
        if (responseJson.has("promptFeedback")) {
            JsonNode feedback = responseJson.get("promptFeedback");
            if (feedback.has("blockReason")) {
                String reason = feedback.get("blockReason").asText();
                log.warn("Gemini bloqueó la solicitud: {}", reason);
                return "[Contenido bloqueado por Gemini: " + reason + "]";
            }
        }

        return responseJson.toString();
    }

    private String decodeBase64IfNeeded(String content) {
        try {
            byte[] decoded = java.util.Base64.getDecoder().decode(content);
            return new String(decoded, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            // No es base64, retornar como está
            return content;
        }
    }

    private BigDecimal calculateCost(int inputTokens, int outputTokens) {
        double cost = estimateCost(inputTokens, outputTokens);
        return BigDecimal.valueOf(cost).setScale(6, RoundingMode.HALF_UP);
    }
}
