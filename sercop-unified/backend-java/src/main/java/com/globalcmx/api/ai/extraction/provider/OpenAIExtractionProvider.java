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
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

/**
 * Proveedor de extracción usando OpenAI (GPT-4)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OpenAIExtractionProvider implements AIExtractionProvider {

    private static final String PROVIDER_CODE = "openai";
    private static final String DISPLAY_NAME = "OpenAI (GPT-4)";
    private static final String API_URL = "https://api.openai.com/v1/chat/completions";

    private static final List<String> AVAILABLE_MODELS = Arrays.asList(
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo"
    );

    // Precios por millón de tokens (USD) para GPT-4o
    private static final double INPUT_PRICE_PER_MILLION = 5.0;
    private static final double OUTPUT_PRICE_PER_MILLION = 15.0;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.openai.api-key:}")
    private String apiKey;

    @Value("${ai.openai.model:gpt-4o}")
    private String defaultModel;

    @Value("${ai.openai.max-tokens:8192}")
    private int maxTokens;

    @Value("${ai.openai.temperature:0.1}")
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
                    .errorMessage("API key de OpenAI no configurada")
                    .build();
        }

        long startTime = System.currentTimeMillis();

        try {
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
                            .supportsPDF(true)  // Soporta PDFs via extracción de texto (PDFBox)
                            .supportsStreaming(true)
                            .maxImageSizeBytes(20L * 1024 * 1024)
                            .maxPDFPages(100)
                            .maxTokens(maxTokens)
                            .build())
                    .build();

        } catch (Exception e) {
            log.error("Error verificando disponibilidad de OpenAI: {}", e.getMessage());
            return ProviderHealthResponse.builder()
                    .available(false)
                    .provider(PROVIDER_CODE)
                    .errorMessage("Error conectando con OpenAI API: " + e.getMessage())
                    .latencyMs(System.currentTimeMillis() - startTime)
                    .build();
        }
    }

    @Override
    public ExtractionResponse extract(ExtractionRequest request) {
        long startTime = System.currentTimeMillis();
        String extractionId = UUID.randomUUID().toString();

        try {
            log.info("Iniciando extracción con OpenAI. ID: {}, Archivo: {}",
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
                throw new RuntimeException("Error en API de OpenAI: " + response.getStatusCode());
            }

            JsonNode responseJson = objectMapper.readTree(response.getBody());

            // Extraer contenido
            String content = extractContent(responseJson);

            // Extraer uso de tokens
            JsonNode usage = responseJson.get("usage");
            int inputTokens = usage != null ? usage.get("prompt_tokens").asInt() : 0;
            int outputTokens = usage != null ? usage.get("completion_tokens").asInt() : 0;

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
            log.error("Error en extracción con OpenAI. ID: {}, Error: {}",
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

        // Soporta imágenes (visión), PDFs (extracción de texto) y texto plano
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
        headers.setBearerAuth(apiKey);
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

        String mimeType = request.getFile().getMimeType();

        // Solo imágenes se envían como contenido multimodal (visión)
        // OpenAI NO soporta PDFs directamente - solo imágenes reales
        if (mimeType.startsWith("image/")) {
            // Contenido con visión - OpenAI puede procesar imágenes
            ArrayNode content = userMessage.putArray("content");

            ObjectNode textContent = content.addObject();
            textContent.put("type", "text");
            textContent.put("text", request.getPrompt());

            ObjectNode imageContent = content.addObject();
            imageContent.put("type", "image_url");
            ObjectNode imageUrl = imageContent.putObject("image_url");
            imageUrl.put("url", "data:" + mimeType + ";base64," + request.getFile().getContent());

        } else if (mimeType.equals("application/pdf")) {
            // PDFs: extraer texto usando PDFBox
            String pdfText = extractTextFromPdf(request.getFile().getContent());
            String fullPrompt = request.getPrompt() + "\n\nDOCUMENTO (texto extraído del PDF):\n" + pdfText;
            userMessage.put("content", fullPrompt);

        } else {
            // Texto plano (.txt, .swift, etc.)
            String fullPrompt = request.getPrompt() + "\n\nDOCUMENTO:\n" +
                    decodeBase64IfNeeded(request.getFile().getContent());
            userMessage.put("content", fullPrompt);
        }

        return objectMapper.writeValueAsString(requestBody);
    }

    /**
     * Extrae texto de un PDF usando Apache PDFBox
     */
    private String extractTextFromPdf(String base64Content) {
        try {
            byte[] pdfBytes = Base64.getDecoder().decode(base64Content);
            try (PDDocument document = PDDocument.load(new ByteArrayInputStream(pdfBytes))) {
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setSortByPosition(true);
                String text = stripper.getText(document);

                if (text == null || text.trim().isEmpty()) {
                    log.warn("PDF no contiene texto extraíble (puede ser escaneado)");
                    return "[PDF sin texto extraíble - el documento puede ser una imagen escaneada]";
                }

                log.info("Texto extraído del PDF: {} caracteres", text.length());
                return text;
            }
        } catch (Exception e) {
            log.error("Error extrayendo texto del PDF: {}", e.getMessage());
            return "[Error al extraer texto del PDF: " + e.getMessage() + "]";
        }
    }

    private String extractContent(JsonNode responseJson) {
        JsonNode choices = responseJson.get("choices");
        if (choices != null && choices.isArray() && choices.size() > 0) {
            JsonNode firstChoice = choices.get(0);
            JsonNode message = firstChoice.get("message");
            if (message != null && message.has("content")) {
                return message.get("content").asText();
            }
        }
        return responseJson.toString();
    }

    private String decodeBase64IfNeeded(String content) {
        try {
            byte[] decoded = java.util.Base64.getDecoder().decode(content);
            return new String(decoded, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            return content;
        }
    }

    private BigDecimal calculateCost(int inputTokens, int outputTokens) {
        double cost = estimateCost(inputTokens, outputTokens);
        return BigDecimal.valueOf(cost).setScale(6, RoundingMode.HALF_UP);
    }
}
