package com.globalcmx.api.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.ai.entity.AIContext;
import com.globalcmx.api.ai.entity.AIMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;
import java.util.function.Consumer;

/**
 * Servicio para streaming de respuestas de IA.
 * Maneja la comunicación con OpenAI usando Server-Sent Events.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIChatStreamingService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final AIDataService dataService;
    
    // @Autowired(required = false)
    // private AIVectorService vectorService; // Temporalmente deshabilitado

    @Value("${ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${ai.openai.model:gpt-4}")
    private String openAiModel;

    @Value("${ai.openai.max-tokens:2000}")
    private Integer maxTokens;

    @Value("${ai.openai.temperature:0.7}")
    private Double temperature;

    @Value("${ai.openai.base-url:https://api.openai.com/v1}")
    private String openAiBaseUrl;

    /**
     * Detectar si el usuario solicita un gráfico
     */
    public boolean detectChartRequest(String userMessage) {
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return false;
        }
        
        String lowerMessage = userMessage.toLowerCase();
        
        // Patrones para detectar solicitudes de gráficos
        String[] chartKeywords = {
            "grafica", "gráfica", "grafico", "gráfico", "chart", "diagrama",
            "barras", "lineas", "líneas", "pastel", "circular", "torta", "dona",
            "muestrame", "muéstrame", "muestra", "mostrar", "quiero ver",
            "visualizar", "visualizacion", "visualización"
        };
        
        // Verificar si contiene palabras clave de gráficos
        for (String keyword : chartKeywords) {
            if (lowerMessage.contains(keyword)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Detectar el tipo de gráfico preferido
     */
    public String detectChartType(String userMessage) {
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return "bar"; // Default
        }
        
        String lowerMessage = userMessage.toLowerCase();
        
        // Detectar tipo de gráfico
        if (lowerMessage.contains("barras") || lowerMessage.contains("bar")) {
            return "bar";
        } else if (lowerMessage.contains("lineas") || lowerMessage.contains("líneas") || 
                   lowerMessage.contains("line") || lowerMessage.contains("tendencia")) {
            return "line";
        } else if (lowerMessage.contains("pastel") || lowerMessage.contains("circular") || 
                   lowerMessage.contains("torta") || lowerMessage.contains("pie")) {
            return "pie";
        } else if (lowerMessage.contains("dona") || lowerMessage.contains("doughnut") || 
                   lowerMessage.contains("donut") || lowerMessage.contains("anillo")) {
            return "doughnut";
        } else if (lowerMessage.contains("area") || lowerMessage.contains("área")) {
            return "area";
        }
        
        return "bar"; // Default
    }

    /**
     * Construir el system prompt incluyendo datos del contexto si están disponibles
     */
    private String buildSystemPrompt(AIContext context, String userMessage) {
        System.err.println("=== buildSystemPrompt CALLED ===");
        System.err.println("Context: " + (context != null ? context.getContextType() : "null"));
        System.err.println("User message: " + userMessage);
        log.warn("Building system prompt for context: {}, userMessage: {}", 
            context != null ? context.getContextType() : "null", userMessage);
        StringBuilder prompt = new StringBuilder();
        
        // Base prompt según el contexto
        if (context != null && context.getSystemPrompt() != null) {
            prompt.append(context.getSystemPrompt());
        } else {
            prompt.append("Eres un asistente útil especializado en operaciones de comercio exterior y finanzas.");
        }
        
        // Instrucción importante: siempre usar los datos proporcionados
        prompt.append("\n\nIMPORTANTE: Cuando se te proporcionen datos específicos en la sección 'Datos Disponibles', ");
        prompt.append("DEBES usar esos datos para responder las preguntas del usuario. ");
        prompt.append("NO digas que no tienes acceso a los datos si se te han proporcionado datos específicos arriba.");
        
        // Búsqueda RAG: buscar documentos relevantes si no hay contexto específico
        // TEMPORALMENTE DESHABILITADO: AIVectorService requiere librerías nativas no disponibles
        /*
        if (vectorService != null && (context == null || context.getContextType() == null || context.getContextType().isEmpty())) {
            String relevantContext = vectorService.getRelevantContext(userMessage, 3);
            if (!relevantContext.isEmpty()) {
                prompt.append("\n\n").append(relevantContext);
                prompt.append("\nUsa la información de los documentos relevantes arriba para responder la pregunta del usuario.");
            }
        }
        */
        
        // Si se detecta solicitud de gráfico, agregar instrucciones JSON
        boolean isChartRequest = detectChartRequest(userMessage);
        if (isChartRequest) {
            String chartType = detectChartType(userMessage);
            prompt.append("\n\n=== INSTRUCCIONES PARA GRÁFICOS ===");
            prompt.append("\nEl usuario ha solicitado un gráfico. DEBES responder en formato JSON estructurado:");
            prompt.append("\n{");
            prompt.append("\n  \"text\": \"Explicación textual del gráfico y los datos mostrados\",");
            prompt.append("\n  \"chart\": {");
            prompt.append("\n    \"type\": \"").append(chartType).append("\",");
            prompt.append("\n    \"title\": \"Título descriptivo del gráfico\",");
            prompt.append("\n    \"data\": [");
            prompt.append("\n      {\"label\": \"Etiqueta 1\", \"value\": 100, ...},");
            prompt.append("\n      {\"label\": \"Etiqueta 2\", \"value\": 200, ...}");
            prompt.append("\n    ],");
            prompt.append("\n    \"colors\": [\"#6366F1\", \"#10B981\", \"#F59E0B\"]");
            prompt.append("\n  }");
            prompt.append("\n}");
            prompt.append("\n\nIMPORTANTE: El campo 'text' debe contener una explicación textual completa.");
            prompt.append("\nEl campo 'chart' debe contener la estructura del gráfico con datos numéricos.");
            prompt.append("\nLos datos deben estar en el formato especificado arriba.");
        }
        
        // Si hay un contexto con tipo, obtener datos de la base de datos
        if (context != null && context.getContextType() != null && !context.getContextType().isEmpty()) {
            try {
                Map<String, String> params = extractParamsFromMessage(userMessage);
                
                // Si se detectó una pregunta sobre operaciones o contabilidad, incluir datos automáticamente
                String lowerMessage = userMessage.toLowerCase();
                
                // Priorizar contabilidad si se menciona explícitamente
                boolean isAccountingQuestion = lowerMessage.contains("contable") || 
                                              lowerMessage.contains("contables") || 
                                              lowerMessage.contains("contabilidad") || 
                                              lowerMessage.contains("asiento") ||
                                              lowerMessage.contains("asientos") || 
                                              lowerMessage.contains("gle");
                
                boolean shouldIncludeData = params.containsKey("reference") || 
                                          params.containsKey("includeOperations") ||
                                          params.containsKey("includeAccounting") ||
                                          (lowerMessage.contains("operacion") || lowerMessage.contains("operaciones")) ||
                                          isAccountingQuestion;
                
                if (shouldIncludeData) {
                    // Si es una pregunta sobre contabilidad pero el contexto es OPERATIONS, 
                    // intentar obtener datos de contabilidad también
                    String contextTypeToUse = context.getContextType();
                    
                    // Si el contexto es ACCOUNTING y se pregunta sobre contabilidad, SIEMPRE incluir entradas
                    if ("ACCOUNTING".equalsIgnoreCase(contextTypeToUse) && isAccountingQuestion) {
                        log.error("ACCOUNTING context with accounting question detected, forcing includeAccounting=true");
                        params.put("includeAccounting", "true");
                    }
                    
                    // Si es pregunta sobre contabilidad y el contexto es ACCOUNTING, asegurar que se incluyan las entradas
                    if (isAccountingQuestion && "ACCOUNTING".equalsIgnoreCase(contextTypeToUse) && !params.containsKey("includeAccounting")) {
                        log.error("Accounting question in ACCOUNTING context, adding includeAccounting param");
                        params.put("includeAccounting", "true");
                    }
                    
                    if (isAccountingQuestion && !"ACCOUNTING".equalsIgnoreCase(contextTypeToUse)) {
                        // Si la pregunta es sobre contabilidad pero el contexto no es ACCOUNTING,
                        // aún así incluir datos de contabilidad si están disponibles
                        log.warn("Accounting question detected but context is {}, will try to include accounting data", contextTypeToUse);
                    }
                    
                    log.error("Getting context data for type: {}, params: {}", contextTypeToUse, params);
                    Map<String, Object> contextData = dataService.getContextData(contextTypeToUse, params);
                    log.error("Context data retrieved - isEmpty: {}, hasEntries: {}, entriesCount: {}", 
                        contextData.isEmpty(), 
                        contextData.containsKey("entries"),
                        contextData.containsKey("entries") ? ((List<?>)contextData.get("entries")).size() : 0);
                    
                    // Si es pregunta sobre contabilidad y no hay datos en el contexto actual,
                    // intentar obtener datos de contabilidad directamente
                    if (isAccountingQuestion && (contextData.isEmpty() || !contextData.containsKey("entries"))) {
                        log.warn("No entries found in context data, trying to get accounting data directly");
                        Map<String, String> accountingParams = new HashMap<>();
                        accountingParams.put("includeAccounting", "true");
                        Map<String, Object> accountingData = dataService.getContextData("ACCOUNTING", accountingParams);
                        if (!accountingData.isEmpty()) {
                            log.info("Got accounting data directly - hasEntries: {}, entriesCount: {}", 
                                accountingData.containsKey("entries"),
                                accountingData.containsKey("entries") ? ((List<?>)accountingData.get("entries")).size() : 0);
                            contextData.putAll(accountingData);
                            contextTypeToUse = "ACCOUNTING";
                        }
                    }
                    
                    if (!contextData.isEmpty()) {
                        String formattedData = formatContextData(contextData, contextTypeToUse);
                        prompt.append("\n\n## Datos Disponibles (USA ESTOS DATOS PARA RESPONDER):\n");
                        prompt.append(formattedData);
                        prompt.append("\n\n=== INSTRUCCIONES CRÍTICAS - LEE Y SIGUE ESTAS INSTRUCCIONES ===\n");
                        prompt.append("1. SI el usuario pregunta sobre operaciones contables, asientos contables o datos contables, ");
                        prompt.append("y se te proporcionaron datos específicos arriba en la sección 'Datos Disponibles', ");
                        prompt.append("DEBES listar y describir esas operaciones específicas usando los datos proporcionados.\n");
                        prompt.append("2. NUNCA digas que no tienes acceso a los datos si se te han proporcionado datos arriba.\n");
                        prompt.append("3. Si se te proporcionaron entradas contables específicas (lista numerada con 'OPERACIÓN CONTABLE #'), ");
                        prompt.append("DEBES mencionar cada una de ellas con sus detalles (cuenta, tipo, monto, descripción, referencia, fecha).\n");
                        prompt.append("4. Usa los datos proporcionados para dar una respuesta detallada y específica, no solo un resumen general.\n");
                        prompt.append("5. Si ves una lista de 'OPERACIÓN CONTABLE #1', '#2', etc., debes listarlas todas en tu respuesta.\n");
                        prompt.append("=== FIN DE INSTRUCCIONES CRÍTICAS ===\n");
                        
                        int entriesCount = contextData.containsKey("entries") ? ((List<?>)contextData.get("entries")).size() : 0;
                        log.info("Included context data for type: {}, params: {}, hasEntries: {}, entriesCount: {}", 
                            contextTypeToUse, params, contextData.containsKey("entries"), entriesCount);
                        log.info("Formatted data length: {} characters, preview (first 500): {}", 
                            formattedData.length(), 
                            formattedData.length() > 500 ? formattedData.substring(0, 500) + "..." : formattedData);
                    } else {
                        log.warn("No context data found for type: {}, params: {}", contextTypeToUse, params);
                    }
                }
            } catch (Exception e) {
                log.warn("Error obteniendo datos del contexto: {}", e.getMessage(), e);
            }
        }
        
        return prompt.toString();
    }
    
    /**
     * Extraer parámetros del mensaje del usuario (por ejemplo, referencias de operaciones)
     * También detecta preguntas generales sobre operaciones para incluir datos automáticamente
     */
    private Map<String, String> extractParamsFromMessage(String userMessage) {
        Map<String, String> params = new HashMap<>();
        String lowerMessage = userMessage.toLowerCase();
        
        // Buscar referencias específicas de operaciones (ej: "LC-2024-001", "OP-12345")
        java.util.regex.Pattern refPattern = java.util.regex.Pattern.compile(
            "\\b(?:LC|OP|GLE|SWIFT)-?\\d{4,}-?\\d+\\b", 
            java.util.regex.Pattern.CASE_INSENSITIVE
        );
        java.util.regex.Matcher matcher = refPattern.matcher(userMessage);
        if (matcher.find()) {
            params.put("reference", matcher.group());
        }
        
        // Detectar preguntas generales sobre operaciones para incluir datos automáticamente
        if (lowerMessage.contains("operacion") || lowerMessage.contains("operaciones")) {
            if (lowerMessage.contains("ultima") || lowerMessage.contains("última") || 
                lowerMessage.contains("reciente") || lowerMessage.contains("lista") ||
                lowerMessage.contains("cuales") || lowerMessage.contains("cuáles") ||
                lowerMessage.contains("muestra") || lowerMessage.contains("mostrar") ||
                lowerMessage.contains("dame") || lowerMessage.contains("quiero ver")) {
                params.put("includeOperations", "true");
            }
        }
        
        // Detectar preguntas sobre contabilidad/contables para incluir datos automáticamente
        // Detectar "contable" o "contables" (con o sin "s")
        boolean hasContable = lowerMessage.contains("contable");
        boolean hasContabilidad = lowerMessage.contains("contabilidad");
        boolean hasAsiento = lowerMessage.contains("asiento");
        boolean hasGle = lowerMessage.contains("gle");
        
        if (hasContable || hasContabilidad || hasAsiento || hasGle) {
            System.err.println("=== Accounting keywords detected in extractParamsFromMessage ===");
            System.err.println("Message: " + userMessage);
            // Si pregunta sobre operaciones contables, últimas, recientes, o lista, incluir datos
            // También detectar "operaciones contable" (sin "s" al final)
            boolean hasOperaciones = lowerMessage.contains("operacion") || lowerMessage.contains("operaciones");
            boolean hasUltimas = lowerMessage.contains("ultima") || lowerMessage.contains("última") ||
                                 lowerMessage.contains("ultimas") || lowerMessage.contains("últimas");
            boolean hasReciente = lowerMessage.contains("reciente") || lowerMessage.contains("recientes");
            boolean hasLista = lowerMessage.contains("lista") || lowerMessage.contains("listar");
            boolean hasCuales = lowerMessage.contains("cuales") || lowerMessage.contains("cuáles");
            boolean hasMuestra = lowerMessage.contains("muestra") || lowerMessage.contains("mostrar");
            boolean hasDame = lowerMessage.contains("dame") || lowerMessage.contains("quiero ver");
            
            System.err.println("hasOperaciones: " + hasOperaciones + ", hasUltimas: " + hasUltimas + ", hasContable: " + hasContable);
            log.error("Accounting keywords detected - hasOperaciones: {}, hasUltimas: {}, hasContable: {}", 
                hasOperaciones, hasUltimas, hasContable);
            
            // Si pregunta sobre operaciones contables (con o sin "s"), SIEMPRE incluir datos
            if ((hasOperaciones && hasContable) || hasUltimas || hasReciente || hasLista || 
                hasCuales || hasMuestra || hasDame) {
                params.put("includeAccounting", "true");
                System.err.println("=== SETTING includeAccounting=true ===");
                log.error("Detected accounting question in extractParamsFromMessage, setting includeAccounting=true. Message: {}", userMessage);
            } else {
                System.err.println("=== CONDITIONS NOT MET - NOT SETTING includeAccounting ===");
                log.error("Accounting keywords found but conditions not met - hasOperaciones: {}, hasContable: {}, hasUltimas: {}", 
                    hasOperaciones, hasContable, hasUltimas);
            }
        }
        
        return params;
    }
    
    /**
     * Formatear datos del contexto en un formato legible para la IA
     */
    private String formatContextData(Map<String, Object> data, String contextType) {
        StringBuilder formatted = new StringBuilder();
        
        try {
            switch (contextType.toUpperCase()) {
                case "OPERATIONS":
                    if (data.containsKey("totalActive")) {
                        formatted.append(String.format("- Total de operaciones activas: %s\n", data.get("totalActive")));
                    }
                    if (data.containsKey("operations")) {
                        @SuppressWarnings("unchecked")
                        List<Object> operations = (List<Object>) data.get("operations");
                        if (operations != null && !operations.isEmpty()) {
                            formatted.append("- Operaciones recientes:\n");
                            int count = 0;
                            for (Object opObj : operations) {
                                if (count >= 5) break; // Limitar a 5 operaciones
                                Map<String, Object> op = convertEntityToMap(opObj);
                                formatted.append(String.format("  * Referencia: %s\n", 
                                    op.getOrDefault("reference", "N/A")));
                                formatted.append(String.format("    Tipo: %s, Estado: %s, Monto: %s %s\n", 
                                    op.getOrDefault("productType", "N/A"),
                                    op.getOrDefault("status", "N/A"),
                                    op.getOrDefault("amount", "N/A"),
                                    op.getOrDefault("currency", "")));
                                count++;
                            }
                        }
                    }
                    if (data.containsKey("operation")) {
                        Object operation = data.get("operation");
                        formatted.append("- Detalles de la operación consultada:\n");
                        Map<String, Object> opMap = convertEntityToMap(operation);
                        formatted.append(formatMap(opMap, "  "));
                    }
                    break;
                    
                case "ACCOUNTING":
                    // Primero mostrar las entradas específicas si están disponibles (más importante)
                    if (data.containsKey("entries")) {
                        @SuppressWarnings("unchecked")
                        List<Object> entries = (List<Object>) data.get("entries");
                        if (entries != null && !entries.isEmpty()) {
                            formatted.append(String.format("=== ÚLTIMAS %d OPERACIONES CONTABLES (ASIENTOS) ===\n", entries.size()));
                            formatted.append("Estas son las operaciones contables más recientes. DEBES listar y describir cada una:\n\n");
                            int count = 0;
                            for (Object entryObj : entries) {
                                if (count >= 20) break; // Limitar a 20 asientos
                                Map<String, Object> entry = convertEntityToMap(entryObj);
                                formatted.append(String.format("OPERACIÓN CONTABLE #%d:\n", count + 1));
                                formatted.append(String.format("  - Cuenta Contable: %s\n",
                                    entry.getOrDefault("act", "N/A")));
                                formatted.append(String.format("  - Tipo: %s (%s)\n",
                                    entry.getOrDefault("dbtcdt", "N/A"),
                                    "D".equals(entry.getOrDefault("dbtcdt", "")) ? "Débito" : 
                                    "C".equals(entry.getOrDefault("dbtcdt", "")) ? "Crédito" : "N/A"));
                                formatted.append(String.format("  - Monto: %s %s\n",
                                    entry.getOrDefault("amt", "N/A"),
                                    entry.getOrDefault("cur", "")));
                                if (entry.containsKey("txt1") && entry.get("txt1") != null && !entry.get("txt1").toString().trim().isEmpty()) {
                                    formatted.append(String.format("  - Descripción: %s\n", entry.get("txt1")));
                                }
                                if (entry.containsKey("referencia") && entry.get("referencia") != null && !entry.get("referencia").toString().trim().isEmpty()) {
                                    formatted.append(String.format("  - Referencia de Operación: %s\n", entry.get("referencia")));
                                }
                                if (entry.containsKey("valdat") && entry.get("valdat") != null) {
                                    formatted.append(String.format("  - Fecha de Valoración: %s\n", entry.get("valdat")));
                                }
                                formatted.append("\n");
                                count++;
                            }
                            formatted.append("=== FIN DE LA LISTA DE OPERACIONES CONTABLES ===\n\n");
                        }
                    }
                    // Luego mostrar el resumen general
                    if (data.containsKey("totalEntries")) {
                        formatted.append(String.format("Resumen General:\n"));
                        formatted.append(String.format("- Total de asientos contables en el sistema: %s\n", data.get("totalEntries")));
                    }
                    if (data.containsKey("byType")) {
                        formatted.append("- Resumen por tipo (Débito/Crédito):\n");
                        @SuppressWarnings("unchecked")
                        Map<String, Object> byType = (Map<String, Object>) data.get("byType");
                        if (byType != null) {
                            byType.forEach((type, info) -> {
                                formatted.append(String.format("  * %s: %s\n", type, info));
                            });
                        }
                    }
                    break;
                    
                default:
                    // Formato genérico para otros tipos de contexto
                    data.forEach((key, value) -> {
                        if (value != null && !(value instanceof Map) && !(value instanceof List)) {
                            formatted.append(String.format("- %s: %s\n", key, value));
                        }
                    });
            }
        } catch (Exception e) {
            log.warn("Error formateando datos del contexto: {}", e.getMessage());
            formatted.append("- Datos disponibles pero no se pudieron formatear completamente.\n");
        }
        
        return formatted.toString();
    }
    
    /**
     * Convertir una entidad JPA a Map usando ObjectMapper
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> convertEntityToMap(Object entity) {
        if (entity == null) {
            return new HashMap<>();
        }
        
        if (entity instanceof Map) {
            return (Map<String, Object>) entity;
        }
        
        try {
            // Usar ObjectMapper para convertir la entidad a Map
            String json = objectMapper.writeValueAsString(entity);
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            log.warn("Error convirtiendo entidad a Map: {}", e.getMessage());
            return new HashMap<>();
        }
    }
    
    /**
     * Formatear un Map en formato legible
     */
    private String formatMap(Map<String, Object> map, String indent) {
        if (map == null || map.isEmpty()) {
            return indent + "Sin datos\n";
        }
        
        StringBuilder result = new StringBuilder();
        map.forEach((key, value) -> {
            if (value != null && !(value instanceof Map) && !(value instanceof List)) {
                result.append(String.format("%s%s: %s\n", indent, key, value));
            }
        });
        
        return result.toString();
    }

    /**
     * Parsear respuesta estructurada de la IA para extraer JSON de gráficos
     */
    public Map<String, Object> parseStructuredResponse(String aiResponse) {
        Map<String, Object> result = new HashMap<>();
        
        if (aiResponse == null || aiResponse.trim().isEmpty()) {
            return result;
        }
        
        try {
            // Buscar JSON en la respuesta (puede estar entre ```json y ``` o simplemente como JSON)
            String jsonStr = aiResponse;
            
            // Intentar extraer JSON de bloques de código
            int jsonStart = aiResponse.indexOf("```json");
            if (jsonStart != -1) {
                jsonStart += 7; // Longitud de "```json"
                int jsonEnd = aiResponse.indexOf("```", jsonStart);
                if (jsonEnd != -1) {
                    jsonStr = aiResponse.substring(jsonStart, jsonEnd).trim();
                }
            } else {
                // Buscar JSON sin bloques de código
                int braceStart = aiResponse.indexOf("{");
                int braceEnd = aiResponse.lastIndexOf("}");
                if (braceStart != -1 && braceEnd != -1 && braceEnd > braceStart) {
                    jsonStr = aiResponse.substring(braceStart, braceEnd + 1);
                }
            }
            
            // Parsear JSON
            JsonNode jsonNode = objectMapper.readTree(jsonStr);
            
            // Extraer texto y gráfico
            if (jsonNode.has("text")) {
                result.put("text", jsonNode.get("text").asText());
            }
            
            if (jsonNode.has("chart")) {
                JsonNode chartNode = jsonNode.get("chart");
                Map<String, Object> chartData = new HashMap<>();
                
                if (chartNode.has("type")) {
                    chartData.put("type", chartNode.get("type").asText());
                }
                if (chartNode.has("title")) {
                    chartData.put("title", chartNode.get("title").asText());
                }
                if (chartNode.has("data")) {
                    chartData.put("data", objectMapper.convertValue(chartNode.get("data"), List.class));
                }
                if (chartNode.has("colors")) {
                    chartData.put("colors", objectMapper.convertValue(chartNode.get("colors"), List.class));
                }
                
                result.put("chart", chartData);
                result.put("type", "chart");
            }
            
        } catch (Exception e) {
            log.warn("Error parsing structured response: {}", e.getMessage());
            // Si no se puede parsear, retornar solo el texto
            result.put("text", aiResponse);
        }
        
        return result;
    }

    /**
     * Generar respuesta de la IA usando OpenAI con streaming.
     * 
     * @param userMessage Mensaje del usuario
     * @param messageHistory Historial de mensajes de la conversación
     * @param context Contexto de IA (opcional)
     * @param onToken Callback que se ejecuta para cada token recibido
     * @return Respuesta completa al finalizar el stream
     */
    public String generateAIResponseStreaming(
            String userMessage,
            List<AIMessage> messageHistory,
            AIContext context,
            Consumer<String> onToken) {
        
        log.warn("=== AIChatStreamingService.generateAIResponseStreaming START ===");
        log.warn("Thread: {}", Thread.currentThread().getName());
        log.warn("User message: {}", userMessage);
        log.warn("Context: {}", context != null ? (context.getContextType() + " - " + context.getName()) : "null");
        log.warn("Message history size: {}", messageHistory != null ? messageHistory.size() : 0);
        
        if (openAiApiKey == null || openAiApiKey.isEmpty()) {
            log.warn("OpenAI API key not configured, returning mock response");
            String mockResponse = "Lo siento, el servicio de IA no está configurado. Por favor, configura la API key de OpenAI.";
            onToken.accept(mockResponse);
            return mockResponse;
        }

        try {
            // Construir mensajes para OpenAI
            List<Map<String, String>> messages = new ArrayList<>();

            // Construir system prompt con datos del contexto si está disponible
            log.warn("Generating AI response for user message: {}, context: {}", 
                userMessage, context != null ? context.getContextType() : "null");
            String systemPrompt = buildSystemPrompt(context, userMessage);
            log.warn("System prompt length: {} characters", systemPrompt.length());
            log.warn("System prompt preview (first 2000 chars): {}", 
                systemPrompt.length() > 2000 ? systemPrompt.substring(0, 2000) + "..." : systemPrompt);
            messages.add(Map.of("role", "system", "content", systemPrompt));

            // Agregar historial de mensajes (últimos 10 para no exceder límites)
            List<AIMessage> recentHistory = messageHistory.size() > 10
                    ? messageHistory.subList(messageHistory.size() - 10, messageHistory.size())
                    : messageHistory;

            for (AIMessage msg : recentHistory) {
                messages.add(Map.of(
                    "role", msg.getRole() == AIMessage.MessageRole.USER ? "user" : "assistant",
                    "content", msg.getContent()
                ));
            }

            // Agregar mensaje actual del usuario
            messages.add(Map.of("role", "user", "content", userMessage));

            // Construir request body con streaming habilitado
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", openAiModel);
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", maxTokens);
            requestBody.put("temperature", temperature);
            requestBody.put("stream", true); // Habilitar streaming

            // Configurar headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + openAiApiKey);
            headers.setAccept(Collections.singletonList(MediaType.TEXT_EVENT_STREAM));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            String url = openAiBaseUrl + "/chat/completions";

            log.debug("Calling OpenAI API with streaming: {}", url);

            // Realizar request con streaming usando RequestCallback y ResponseExtractor
            StringBuilder fullResponse = new StringBuilder();
            
            restTemplate.execute(
                url,
                HttpMethod.POST,
                requestCallback -> {
                    // Configurar el request
                    requestCallback.getHeaders().addAll(request.getHeaders());
                    try (var outputStream = requestCallback.getBody()) {
                        objectMapper.writeValue(outputStream, requestBody);
                    }
                },
                response -> {
                    try (BufferedReader reader = new BufferedReader(
                            new InputStreamReader(response.getBody()))) {
                        
                        String line;
                        while ((line = reader.readLine()) != null) {
                            // OpenAI SSE format: "data: {...}\n\n"
                            if (line.startsWith("data: ")) {
                                String jsonData = line.substring(6).trim();
                                
                                // "data: [DONE]" indica el fin del stream
                                if ("[DONE]".equals(jsonData)) {
                                    break;
                                }
                                
                                try {
                                    // Parsear JSON del evento SSE usando Jackson
                                    JsonNode jsonNode = objectMapper.readTree(jsonData);
                                    JsonNode choices = jsonNode.get("choices");
                                    
                                    if (choices != null && choices.isArray() && choices.size() > 0) {
                                        JsonNode firstChoice = choices.get(0);
                                        JsonNode delta = firstChoice.get("delta");
                                        
                                        if (delta != null) {
                                            JsonNode content = delta.get("content");
                                            if (content != null && content.isTextual()) {
                                                String token = content.asText();
                                                if (token != null && !token.isEmpty()) {
                                                    fullResponse.append(token);
                                                    onToken.accept(token);
                                                }
                                            }
                                        }
                                    }
                                } catch (Exception e) {
                                    log.warn("Error parsing SSE data: {}", e.getMessage());
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.error("Error reading stream", e);
                    }
                    return null;
                }
            );

            String finalResponse = fullResponse.toString();
            if (finalResponse.isEmpty()) {
                return "Error al procesar la respuesta de la IA.";
            }

            return finalResponse;

        } catch (Exception e) {
            log.error("Error calling OpenAI API with streaming", e);
            String errorMessage = "Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.";
            onToken.accept(errorMessage);
            return errorMessage;
        }
    }
}

