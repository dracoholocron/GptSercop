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
 * Proveedor de extracción usando Claude (Anthropic)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ClaudeExtractionProvider implements AIExtractionProvider {

    private static final String PROVIDER_CODE = "claude";
    private static final String DISPLAY_NAME = "Claude (Anthropic)";
    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    private static final String API_VERSION = "2023-06-01";

    private static final List<String> AVAILABLE_MODELS = Arrays.asList(
            "claude-sonnet-4-20250514",
            "claude-3-5-sonnet-20241022",
            "claude-3-haiku-20240307"
    );

    // Precios por millón de tokens (USD)
    private static final double INPUT_PRICE_PER_MILLION = 3.0;
    private static final double OUTPUT_PRICE_PER_MILLION = 15.0;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.claude.api-key:}")
    private String apiKey;

    @Value("${ai.claude.model:claude-sonnet-4-20250514}")
    private String defaultModel;

    @Value("${ai.claude.max-tokens:8192}")
    private int maxTokens;

    @Value("${ai.claude.temperature:0.1}")
    private double temperature;

    @Value("${ai.claude.timeout-seconds:120}")
    private int timeoutSeconds;

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
                    .errorMessage("API key de Claude no configurada")
                    .build();
        }

        long startTime = System.currentTimeMillis();

        try {
            // Hacer una llamada simple para verificar la API
            HttpHeaders headers = createHeaders();

            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", defaultModel);
            requestBody.put("max_tokens", 10);

            ArrayNode messages = requestBody.putArray("messages");
            ObjectNode message = messages.addObject();
            message.put("role", "user");
            message.put("content", "ping");

            HttpEntity<String> entity = new HttpEntity<>(
                    objectMapper.writeValueAsString(requestBody),
                    headers
            );

            ResponseEntity<String> response = restTemplate.exchange(
                    API_URL,
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
                            .supportsPDF(true)
                            .supportsStreaming(true)
                            .maxImageSizeBytes(20L * 1024 * 1024) // 20MB
                            .maxPDFPages(100)
                            .maxTokens(maxTokens)
                            .build())
                    .build();

        } catch (Exception e) {
            log.error("Error verificando disponibilidad de Claude: {}", e.getMessage());
            return ProviderHealthResponse.builder()
                    .available(false)
                    .provider(PROVIDER_CODE)
                    .errorMessage("Error conectando con Claude API: " + e.getMessage())
                    .latencyMs(System.currentTimeMillis() - startTime)
                    .build();
        }
    }

    @Override
    public ExtractionResponse extract(ExtractionRequest request) {
        long startTime = System.currentTimeMillis();
        String extractionId = UUID.randomUUID().toString();

        try {
            log.info("Iniciando extracción con Claude. ID: {}, Archivo: {}",
                    extractionId, request.getFile().getFileName());

            HttpHeaders headers = createHeaders();
            String requestBody = buildExtractionRequest(request);

            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    API_URL,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Error en API de Claude: " + response.getStatusCode());
            }

            JsonNode responseJson = objectMapper.readTree(response.getBody());

            // Extraer contenido de la respuesta
            String content = extractContent(responseJson);

            // Extraer uso de tokens
            JsonNode usage = responseJson.get("usage");
            int inputTokens = usage != null ? usage.get("input_tokens").asInt() : 0;
            int outputTokens = usage != null ? usage.get("output_tokens").asInt() : 0;

            long processingTime = System.currentTimeMillis() - startTime;

            log.info("Extracción completada. ID: {}, Tokens: {}/{}, Tiempo: {}ms",
                    extractionId, inputTokens, outputTokens, processingTime);

            return ExtractionResponse.builder()
                    .id(extractionId)
                    .content(content)
                    .messageType(request.getMessageType())
                    .provider(PROVIDER_CODE)
                    .model(request.getModel() != null ? request.getModel() : defaultModel)
                    .processingTimeMs(processingTime)
                    .inputTokens(inputTokens)
                    .outputTokens(outputTokens)
                    .estimatedCost(calculateCost(inputTokens, outputTokens))
                    .createdAt(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            log.error("Error en extracción con Claude. ID: {}, Error: {}",
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

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", API_VERSION);
        return headers;
    }

    private String buildExtractionRequest(ExtractionRequest request) throws Exception {
        ObjectNode requestBody = objectMapper.createObjectNode();

        String model = request.getModel() != null ? request.getModel() : defaultModel;
        requestBody.put("model", model);
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("temperature", temperature);

        ArrayNode messages = requestBody.putArray("messages");
        ObjectNode userMessage = messages.addObject();
        userMessage.put("role", "user");

        // Construir contenido según tipo de archivo
        String mimeType = request.getFile().getMimeType();

        if (mimeType.startsWith("image/") || mimeType.equals("application/pdf")) {
            // Contenido multimodal (imagen/PDF)
            ArrayNode content = userMessage.putArray("content");

            // Agregar imagen/documento
            ObjectNode imageContent = content.addObject();
            // Claude API requiere "document" para PDFs, "image" para imagenes
            String contentType = mimeType.equals("application/pdf") ? "document" : "image";
            imageContent.put("type", contentType);
            ObjectNode source = imageContent.putObject("source");
            source.put("type", "base64");
            source.put("media_type", mimeType);
            source.put("data", request.getFile().getContent());

            // Agregar prompt
            ObjectNode textContent = content.addObject();
            textContent.put("type", "text");
            textContent.put("text", request.getPrompt());

        } else {
            // Contenido de texto
            String fullPrompt = request.getPrompt() + "\n\nDOCUMENTO:\n" +
                    decodeBase64IfNeeded(request.getFile().getContent());
            userMessage.put("content", fullPrompt);
        }

        return objectMapper.writeValueAsString(requestBody);
    }

    private String extractContent(JsonNode responseJson) {
        JsonNode contentArray = responseJson.get("content");
        if (contentArray != null && contentArray.isArray() && contentArray.size() > 0) {
            JsonNode firstContent = contentArray.get(0);
            if (firstContent.has("text")) {
                return firstContent.get("text").asText();
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
