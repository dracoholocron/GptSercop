package com.globalcmx.api.ai.service;

import com.globalcmx.api.ai.entity.AIContext;
import com.globalcmx.api.ai.entity.AIConversation;
import com.globalcmx.api.ai.entity.AIMessage;
import com.globalcmx.api.ai.repository.AIConversationRepository;
import com.globalcmx.api.ai.repository.AIMessageRepository;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio principal para el Chat CMX.
 * Maneja conversaciones, mensajes e integración con OpenAI.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(transactionManager = "readModelTransactionManager")
public class AIChatService {

    private final AIConversationRepository conversationRepository;
    private final AIMessageRepository messageRepository;
    private final AIContextService contextService;
    private final AIDataService dataService;
    private final com.globalcmx.api.ai.repository.AIContextRepository contextRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final AIChatStreamingService streamingService;

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
     * Crear una nueva conversación
     */
    public AIConversation createConversation(String title, Long contextId, String folderName) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("User not authenticated");
        }

        AIConversation conversation = AIConversation.builder()
                .user(currentUser)
                .title(title != null ? title : "Nueva conversación")
                .isFavorite(false)
                .folderName(folderName)
                .build();

        if (contextId != null) {
            // Buscar contexto por ID usando el repositorio
            AIContext context = contextRepository.findById(contextId)
                    .orElse(null);
            if (context != null && contextService.hasAccessToContext(contextId)) {
                conversation.setContext(context);
            }
        }

        return conversationRepository.save(conversation);
    }

    /**
     * Obtener todas las conversaciones del usuario actual
     */
    @Transactional(readOnly = true)
    public List<AIConversation> getUserConversations() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return List.of();
        }

        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(currentUser.getId());
    }

    /**
     * Obtener una conversación por ID
     */
    @Transactional(readOnly = true)
    public AIConversation getConversation(Long conversationId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("User not authenticated");
        }

        return conversationRepository.findByIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
    }

    /**
     * Eliminar una conversación
     */
    public void deleteConversation(Long conversationId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("User not authenticated");
        }

        AIConversation conversation = conversationRepository.findByIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        conversationRepository.delete(conversation);
        log.info("Deleted conversation {} for user {}", conversationId, currentUser.getUsername());
    }

    /**
     * Enviar un mensaje y obtener respuesta de la IA
     */
    public AIMessage sendMessage(Long conversationId, String userMessage) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("User not authenticated");
        }

        AIConversation conversation = conversationRepository.findByIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        // Guardar mensaje del usuario
        AIMessage userMsg = AIMessage.builder()
                .conversation(conversation)
                .role(AIMessage.MessageRole.USER)
                .content(userMessage)
                .build();
        messageRepository.save(userMsg);

        // Obtener historial de mensajes para contexto
        List<AIMessage> messageHistory = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        
        // Generar respuesta de la IA
        String aiResponse = generateAIResponse(userMessage, messageHistory, conversation.getContext());

        // Guardar respuesta de la IA
        AIMessage aiMessage = AIMessage.builder()
                .conversation(conversation)
                .role(AIMessage.MessageRole.ASSISTANT)
                .content(aiResponse)
                .build();
        messageRepository.save(aiMessage);

        // Actualizar título de conversación si es la primera vez
        if (conversation.getTitle().equals("Nueva conversación") && messageHistory.size() == 1) {
            conversation.setTitle(generateConversationTitle(userMessage));
            conversationRepository.save(conversation);
        }

        return aiMessage;
    }

    /**
     * Enviar un mensaje y obtener respuesta de la IA con streaming.
     * Este método guarda el mensaje del usuario y luego usa streaming para la respuesta.
     * 
     * @param conversationId ID de la conversación
     * @param userMessage Mensaje del usuario
     * @param onToken Callback que se ejecuta para cada token recibido
     * @return Mensaje de la IA guardado en la base de datos
     */
    public AIMessage sendMessageWithStreaming(
            Long conversationId,
            String userMessage,
            java.util.function.Consumer<String> onToken) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("User not authenticated");
        }

        AIConversation conversation = conversationRepository.findByIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        // Guardar mensaje del usuario
        AIMessage userMsg = AIMessage.builder()
                .conversation(conversation)
                .role(AIMessage.MessageRole.USER)
                .content(userMessage)
                .build();
        messageRepository.save(userMsg);

        // Obtener historial de mensajes para contexto
        List<AIMessage> messageHistory = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        
        // Logging para diagnóstico (usando WARN para asegurar visibilidad)
        AIContext context = conversation.getContext();
        log.warn("=== AIChatService.sendMessageWithStreaming ===");
        log.warn("Conversation ID: {}", conversationId);
        log.warn("User message: {}", userMessage);
        log.warn("Context: {}", context != null ? (context.getContextType() + " - " + context.getName()) : "null");
        log.warn("Message history size: {}", messageHistory.size());
        log.warn("Thread: {}", Thread.currentThread().getName());
        
        // Generar respuesta de la IA con streaming
        String aiResponse = streamingService.generateAIResponseStreaming(
                userMessage,
                messageHistory,
                context,
                onToken
        );

        // Detectar si es solicitud de gráfico y parsear respuesta estructurada
        String metadataJson = null;
        if (streamingService.detectChartRequest(userMessage)) {
            try {
                Map<String, Object> structuredData = streamingService.parseStructuredResponse(aiResponse);
                if (structuredData.containsKey("chart")) {
                    // Convertir metadata a JSON string para guardar en AIMessage
                    com.fasterxml.jackson.databind.ObjectMapper objectMapper = 
                        new com.fasterxml.jackson.databind.ObjectMapper();
                    metadataJson = objectMapper.writeValueAsString(structuredData);
                    log.info("Chart metadata detected and parsed: {}", metadataJson);
                }
            } catch (Exception e) {
                log.warn("Error parsing structured response for chart: {}", e.getMessage());
            }
        }

        // Guardar respuesta de la IA
        AIMessage aiMessage = AIMessage.builder()
                .conversation(conversation)
                .role(AIMessage.MessageRole.ASSISTANT)
                .content(aiResponse)
                .metadata(metadataJson)
                .build();
        messageRepository.save(aiMessage);

        // Actualizar título de conversación si es la primera vez
        if (conversation.getTitle().equals("Nueva conversación") && messageHistory.size() == 1) {
            conversation.setTitle(generateConversationTitle(userMessage));
            conversationRepository.save(conversation);
        }

        return aiMessage;
    }

    /**
     * Obtener mensajes de una conversación
     */
    @Transactional(readOnly = true)
    public List<AIMessage> getMessages(Long conversationId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("User not authenticated");
        }

        // Verificar que la conversación pertenece al usuario
        conversationRepository.findByIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    /**
     * Generar respuesta de la IA usando OpenAI
     */
    private String generateAIResponse(String userMessage, List<AIMessage> messageHistory, AIContext context) {
        if (openAiApiKey == null || openAiApiKey.isEmpty()) {
            log.warn("OpenAI API key not configured, returning mock response");
            return "Lo siento, el servicio de IA no está configurado. Por favor, configura la API key de OpenAI.";
        }

        try {
            // Construir mensajes para OpenAI
            List<Map<String, String>> messages = new ArrayList<>();

            // Agregar system prompt si hay contexto
            if (context != null && context.getSystemPrompt() != null) {
                messages.add(Map.of("role", "system", "content", context.getSystemPrompt()));
            } else {
                messages.add(Map.of("role", "system", 
                    "content", "Eres un asistente útil especializado en operaciones de comercio exterior y finanzas."));
            }

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

            // Construir request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", openAiModel);
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", maxTokens);
            requestBody.put("temperature", temperature);

            // Hacer llamada a OpenAI
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + openAiApiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            String url = openAiBaseUrl + "/chat/completions";

            log.debug("Calling OpenAI API: {}", url);

            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            // Extraer respuesta
            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    Map<String, Object> message = (Map<String, Object>) choice.get("message");
                    return (String) message.get("content");
                }
            }

            log.error("Unexpected response format from OpenAI: {}", responseBody);
            return "Error al procesar la respuesta de la IA.";

        } catch (Exception e) {
            log.error("Error calling OpenAI API", e);
            return "Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.";
        }
    }

    /**
     * Generar título de conversación basado en el primer mensaje
     */
    private String generateConversationTitle(String firstMessage) {
        if (firstMessage == null || firstMessage.trim().isEmpty()) {
            return "Nueva conversación";
        }

        // Tomar primeros 50 caracteres como título
        String title = firstMessage.trim();
        if (title.length() > 50) {
            title = title.substring(0, 47) + "...";
        }
        return title;
    }

    /**
     * Obtener usuario actual del contexto de seguridad
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            return userRepository.findByUsername(username).orElse(null);
        }
        return null;
    }

    /**
     * Actualizar favorito de conversación
     */
    public AIConversation toggleFavorite(Long conversationId, boolean isFavorite) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("User not authenticated");
        }

        AIConversation conversation = conversationRepository.findByIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        conversation.setIsFavorite(isFavorite);
        return conversationRepository.save(conversation);
    }

    /**
     * Actualizar título de conversación
     */
    public AIConversation updateTitle(Long conversationId, String title) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("User not authenticated");
        }

        AIConversation conversation = conversationRepository.findByIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Title cannot be empty");
        }

        conversation.setTitle(title.trim());
        return conversationRepository.save(conversation);
    }

    /**
     * Actualizar carpeta de conversación
     */
    public AIConversation updateFolder(Long conversationId, String folderName) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("User not authenticated");
        }

        AIConversation conversation = conversationRepository.findByIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        conversation.setFolderName(folderName);
        return conversationRepository.save(conversation);
    }

    /**
     * Obtener lista de carpetas únicas del usuario actual
     */
    @Transactional(readOnly = true)
    public List<String> getUserFolders() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return List.of();
        }

        List<AIConversation> conversations = conversationRepository.findByUserIdOrderByUpdatedAtDesc(currentUser.getId());
        return conversations.stream()
                .map(AIConversation::getFolderName)
                .filter(folderName -> folderName != null && !folderName.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }
}

