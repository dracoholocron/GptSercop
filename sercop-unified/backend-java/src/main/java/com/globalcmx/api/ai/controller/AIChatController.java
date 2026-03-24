package com.globalcmx.api.ai.controller;

import com.globalcmx.api.ai.dto.*;
import com.globalcmx.api.ai.entity.AIContext;
import com.globalcmx.api.ai.entity.AIConversation;
import com.globalcmx.api.ai.entity.AIMessage;
import com.globalcmx.api.ai.service.AIChatService;
import com.globalcmx.api.ai.service.AIContextService;
import com.globalcmx.api.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Controller REST para el Chat CMX.
 * Endpoints para gestionar conversaciones y mensajes con IA.
 */
@RestController
@RequestMapping("/v1/ai/chat")
@RequiredArgsConstructor
@Slf4j
public class AIChatController {

    private final AIChatService chatService;
    private final AIContextService contextService;
    private final com.globalcmx.api.ai.service.AIChatExportService exportService;

    // Método para logging de inicialización - se ejecuta después de la inyección de dependencias
    @jakarta.annotation.PostConstruct
    public void init() {
        log.info("==========================================");
        log.info("AIChatController INITIALIZED SUCCESSFULLY");
        log.info("Endpoints: /api/v1/ai/chat/*");
        log.info("==========================================");
    }

    /**
     * Obtener contextos de IA disponibles para el usuario actual
     * GET /api/v1/ai/chat/contexts
     */
    @GetMapping("/contexts")
    public ResponseEntity<ApiResponse<List<AIContextDTO>>> getAvailableContexts() {
        log.info("Getting available AI contexts");
        try {
            List<AIContext> contexts = contextService.getAvailableContexts();
            List<AIContextDTO> contextDTOs = contexts.stream()
                    .map(this::toContextDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success("Contextos disponibles", contextDTOs));
        } catch (Exception e) {
            log.error("Error getting contexts", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Error al obtener contextos: " + e.getMessage()));
        }
    }

    /**
     * Crear una nueva conversación
     * POST /api/v1/ai/chat/conversations
     */
    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<ConversationDTO>> createConversation(
            @Valid @RequestBody CreateConversationRequest request) {
        log.info("Creating new conversation with title: {}, folderName: {}", request.getTitle(), request.getFolderName());
        try {
            AIConversation conversation = chatService.createConversation(
                    request.getTitle(), 
                    request.getContextId(),
                    request.getFolderName());
            ConversationDTO dto = toConversationDTO(conversation);
            return ResponseEntity.ok(ApiResponse.success("Conversación creada", dto));
        } catch (Exception e) {
            log.error("Error creating conversation", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Error al crear conversación: " + e.getMessage()));
        }
    }

    /**
     * Obtener todas las conversaciones del usuario actual
     * GET /api/v1/ai/chat/conversations
     */
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationDTO>>> getUserConversations() {
        log.info("Getting user conversations");
        try {
            List<AIConversation> conversations = chatService.getUserConversations();
            List<ConversationDTO> dtos = conversations.stream()
                    .map(this::toConversationDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success("Conversaciones obtenidas", dtos));
        } catch (Exception e) {
            log.error("Error getting conversations", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Error al obtener conversaciones: " + e.getMessage()));
        }
    }

    /**
     * Obtener lista de carpetas del usuario actual
     * GET /api/v1/ai/chat/folders
     */
    @GetMapping("/folders")
    public ResponseEntity<ApiResponse<List<String>>> getUserFolders() {
        log.info("Getting user folders");
        try {
            List<String> folders = chatService.getUserFolders();
            return ResponseEntity.ok(ApiResponse.success("Carpetas obtenidas", folders));
        } catch (Exception e) {
            log.error("Error getting folders", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Error al obtener carpetas: " + e.getMessage()));
        }
    }

    /**
     * Obtener una conversación por ID
     * GET /api/v1/ai/chat/conversations/{id}
     */
    @GetMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<ConversationDTO>> getConversation(@PathVariable Long id) {
        log.info("Getting conversation {}", id);
        try {
            AIConversation conversation = chatService.getConversation(id);
            ConversationDTO dto = toConversationDTO(conversation);
            return ResponseEntity.ok(ApiResponse.success("Conversación obtenida", dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error getting conversation", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Error al obtener conversación: " + e.getMessage()));
        }
    }

    /**
     * Eliminar una conversación
     * DELETE /api/v1/ai/chat/conversations/{id}
     */
    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(@PathVariable Long id) {
        log.info("Deleting conversation {}", id);
        try {
            chatService.deleteConversation(id);
            return ResponseEntity.ok(ApiResponse.success("Conversación eliminada", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error deleting conversation", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Error al eliminar conversación: " + e.getMessage()));
        }
    }

    /**
     * Enviar un mensaje en una conversación
     * POST /api/v1/ai/chat/conversations/{id}/messages
     */
    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody ChatMessageRequest request) {
        log.info("Sending message to conversation {}", id);
        try {
            AIMessage message = chatService.sendMessage(id, request.getMessage());
            ChatMessageResponse response = ChatMessageResponse.builder()
                    .id(message.getId())
                    .content(message.getContent())
                    .role(message.getRole().name())
                    .createdAt(message.getCreatedAt())
                    .build();
            return ResponseEntity.ok(ApiResponse.success("Mensaje enviado", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error sending message", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Error al enviar mensaje: " + e.getMessage()));
        }
    }

    /**
     * Enviar un mensaje en una conversación con streaming (Server-Sent Events)
     * POST /api/v1/ai/chat/conversations/{id}/messages/stream
     */
    @PostMapping(value = "/conversations/{id}/messages/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter sendMessageStreaming(
            @PathVariable Long id,
            @Valid @RequestBody ChatMessageRequest request) {
        log.info("Sending message with streaming to conversation {}", id);
        
        // Obtener Authentication del thread actual ANTES de entrar al thread asíncrono
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            SseEmitter errorEmitter = new SseEmitter(1000L);
            try {
                errorEmitter.send(SseEmitter.event()
                        .name("error")
                        .data("{\"error\":\"User not authenticated\"}"));
                errorEmitter.complete();
            } catch (IOException e) {
                log.error("Error sending error event", e);
                errorEmitter.completeWithError(e);
            }
            return errorEmitter;
        }
        
        // Guardar el username para usarlo en el thread asíncrono
        final String username = authentication.getName();
        log.debug("Streaming request from user: {}", username);
        
        // Crear SseEmitter con timeout de 5 minutos
        SseEmitter emitter = new SseEmitter(300000L);
        
        // Logging antes de entrar al thread asíncrono
        log.warn("=== AIChatController.sendMessageStreaming - BEFORE async ===");
        log.warn("Conversation ID: {}, Message: {}", id, request.getMessage());
        log.warn("Thread: {}", Thread.currentThread().getName());
        
        // Ejecutar en un thread separado para no bloquear
        CompletableFuture.runAsync(() -> {
            log.warn("=== AIChatController.sendMessageStreaming - INSIDE async ===");
            log.warn("Thread: {}", Thread.currentThread().getName());
            
            // Crear SecurityContext con el Authentication original
            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(authentication);
            SecurityContextHolder.setContext(securityContext);
            try {
                // Enviar evento inicial
                emitter.send(SseEmitter.event()
                        .name("start")
                        .data("{\"status\":\"started\"}"));
                
                log.warn("=== AIChatController - Calling chatService.sendMessageWithStreaming ===");
                // Enviar mensaje con streaming
                AIMessage message = chatService.sendMessageWithStreaming(
                        id,
                        request.getMessage(),
                        token -> {
                            try {
                                // Enviar cada token como un evento SSE
                                emitter.send(SseEmitter.event()
                                        .name("token")
                                        .data("{\"token\":\"" + escapeJson(token) + "\"}"));
                            } catch (IOException e) {
                                log.error("Error sending token", e);
                                emitter.completeWithError(e);
                            }
                        }
                );
                log.warn("=== AIChatController - chatService.sendMessageWithStreaming completed ===");
                
                // Enviar evento final con el mensaje completo
                emitter.send(SseEmitter.event()
                        .name("complete")
                        .data("{\"messageId\":" + message.getId() + ",\"status\":\"completed\"}"));
                
                emitter.complete();
                
            } catch (IllegalArgumentException e) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data("{\"error\":\"Conversación no encontrada\"}"));
                    emitter.complete();
                } catch (IOException ex) {
                    log.error("Error sending error event", ex);
                    emitter.completeWithError(ex);
                }
            } catch (Exception e) {
                log.error("Error in streaming", e);
                try {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data("{\"error\":\"" + escapeJson(e.getMessage()) + "\"}"));
                    emitter.complete();
                } catch (IOException ex) {
                    log.error("Error sending error event", ex);
                    emitter.completeWithError(ex);
                }
            } finally {
                // Limpiar SecurityContext del thread asíncrono
                SecurityContextHolder.clearContext();
            }
        });
        
        // Manejar timeout y errores
        emitter.onTimeout(() -> {
            log.warn("SSE timeout for conversation {}", id);
            emitter.complete();
        });
        
        emitter.onError((ex) -> {
            log.error("SSE error for conversation {}", id, ex);
            emitter.completeWithError(ex);
        });
        
        return emitter;
    }
    
    
    /**
     * Escapar caracteres especiales para JSON
     */
    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }

    /**
     * Obtener mensajes de una conversación
     * GET /api/v1/ai/chat/conversations/{id}/messages
     */
    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<List<MessageDTO>>> getMessages(@PathVariable Long id) {
        log.info("Getting messages for conversation {}", id);
        try {
            List<AIMessage> messages = chatService.getMessages(id);
            List<MessageDTO> dtos = messages.stream()
                    .map(this::toMessageDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success("Mensajes obtenidos", dtos));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error getting messages", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Error al obtener mensajes: " + e.getMessage()));
        }
    }

    /**
     * Actualizar favorito de conversación
     * PATCH /api/v1/ai/chat/conversations/{id}/favorite
     */
    @PatchMapping("/conversations/{id}/favorite")
    public ResponseEntity<ApiResponse<ConversationDTO>> toggleFavorite(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> request) {
        log.info("Toggling favorite for conversation {}", id);
        try {
            Boolean isFavorite = request.getOrDefault("isFavorite", false);
            AIConversation conversation = chatService.toggleFavorite(id, isFavorite);
            ConversationDTO dto = toConversationDTO(conversation);
            return ResponseEntity.ok(ApiResponse.success("Favorito actualizado", dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error toggling favorite", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Error al actualizar favorito: " + e.getMessage()));
        }
    }

    /**
     * Actualizar título de conversación
     * PATCH /api/v1/ai/chat/conversations/{id}/title
     */
    @PatchMapping("/conversations/{id}/title")
    public ResponseEntity<ApiResponse<ConversationDTO>> updateTitle(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        log.info("Updating title for conversation {}", id);
        try {
            String title = request.get("title");
            if (title == null || title.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("El título no puede estar vacío"));
            }
            AIConversation conversation = chatService.updateTitle(id, title);
            ConversationDTO dto = toConversationDTO(conversation);
            return ResponseEntity.ok(ApiResponse.success("Título actualizado", dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Conversación no encontrada: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating title", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Error al actualizar título: " + e.getMessage()));
        }
    }

    /**
     * Actualizar carpeta de conversación
     * PATCH /api/v1/ai/chat/conversations/{id}/folder
     */
    @PatchMapping("/conversations/{id}/folder")
    public ResponseEntity<ApiResponse<ConversationDTO>> updateFolder(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        log.info("Updating folder for conversation {}", id);
        try {
            String folderName = request.get("folderName");
            AIConversation conversation = chatService.updateFolder(id, folderName);
            ConversationDTO dto = toConversationDTO(conversation);
            return ResponseEntity.ok(ApiResponse.success("Carpeta actualizada", dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error updating folder", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Error al actualizar carpeta: " + e.getMessage()));
        }
    }

    // Métodos helper para convertir entidades a DTOs

    private ConversationDTO toConversationDTO(AIConversation conversation) {
        ConversationDTO dto = ConversationDTO.builder()
                .id(conversation.getId())
                .title(conversation.getTitle())
                .isFavorite(conversation.getIsFavorite())
                .folderName(conversation.getFolderName())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();

        if (conversation.getContext() != null) {
            dto.setContextId(conversation.getContext().getId());
            dto.setContextName(conversation.getContext().getName());
        }

        // Obtener conteo de mensajes
        long messageCount = chatService.getMessages(conversation.getId()).size();
        dto.setMessageCount(messageCount);

        // Obtener vista previa del último mensaje
        List<AIMessage> messages = chatService.getMessages(conversation.getId());
        if (!messages.isEmpty()) {
            AIMessage lastMessage = messages.get(messages.size() - 1);
            String preview = lastMessage.getContent();
            if (preview.length() > 100) {
                preview = preview.substring(0, 97) + "...";
            }
            dto.setLastMessagePreview(preview);
        }

        return dto;
    }

    private MessageDTO toMessageDTO(AIMessage message) {
        return MessageDTO.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .role(message.getRole().name())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .metadata(message.getMetadata())
                .build();
    }

    private AIContextDTO toContextDTO(AIContext context) {
        return AIContextDTO.builder()
                .id(context.getId())
                .code(context.getCode())
                .name(context.getName())
                .description(context.getDescription())
                .contextType(context.getContextType())
                .enabled(context.getEnabled())
                .displayOrder(context.getDisplayOrder())
                .build();
    }
}

