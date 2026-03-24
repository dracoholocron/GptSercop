package com.globalcmx.api.ai.service;

import com.globalcmx.api.ai.entity.AIConversation;
import com.globalcmx.api.ai.entity.AIMessage;
import com.globalcmx.api.ai.repository.AIConversationRepository;
import com.globalcmx.api.ai.repository.AIMessageRepository;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para exportar conversaciones a diferentes formatos
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
public class AIChatExportService {

    private final AIConversationRepository conversationRepository;
    private final AIMessageRepository messageRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Exportar conversación a formato Markdown
     */
    public String exportToMarkdown(Long conversationId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("User not authenticated");
        }

        AIConversation conversation = conversationRepository.findByIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        List<AIMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        StringBuilder markdown = new StringBuilder();
        markdown.append("# ").append(conversation.getTitle()).append("\n\n");
        markdown.append("**Contexto:** ").append(conversation.getContext() != null ? conversation.getContext().getName() : "Sin contexto").append("\n");
        markdown.append("**Creada:** ").append(formatInstant(conversation.getCreatedAt())).append("\n");
        markdown.append("**Última actualización:** ").append(formatInstant(conversation.getUpdatedAt())).append("\n\n");
        markdown.append("---\n\n");

        for (AIMessage message : messages) {
            String role = message.getRole() == AIMessage.MessageRole.USER ? "Usuario" : "Asistente";
            markdown.append("## ").append(role).append("\n\n");
            markdown.append("**Fecha:** ").append(formatInstant(message.getCreatedAt())).append("\n\n");
            markdown.append(message.getContent()).append("\n\n");
            markdown.append("---\n\n");
        }

        return markdown.toString();
    }

    /**
     * Exportar conversación a formato JSON
     */
    public String exportToJson(Long conversationId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("User not authenticated");
        }

        AIConversation conversation = conversationRepository.findByIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        List<AIMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        StringBuilder json = new StringBuilder();
        json.append("{\n");
        json.append("  \"title\": \"").append(escapeJson(conversation.getTitle())).append("\",\n");
        json.append("  \"context\": \"").append(conversation.getContext() != null ? escapeJson(conversation.getContext().getName()) : "").append("\",\n");
        json.append("  \"createdAt\": \"").append(conversation.getCreatedAt().toString()).append("\",\n");
        json.append("  \"updatedAt\": \"").append(conversation.getUpdatedAt().toString()).append("\",\n");
        json.append("  \"messages\": [\n");

        for (int i = 0; i < messages.size(); i++) {
            AIMessage message = messages.get(i);
            json.append("    {\n");
            json.append("      \"role\": \"").append(message.getRole().name()).append("\",\n");
            json.append("      \"content\": \"").append(escapeJson(message.getContent())).append("\",\n");
            json.append("      \"createdAt\": \"").append(message.getCreatedAt().toString()).append("\"");
            if (message.getMetadata() != null && !message.getMetadata().trim().isEmpty()) {
                json.append(",\n      \"metadata\": ").append(message.getMetadata());
            }
            json.append("\n    }");
            if (i < messages.size() - 1) {
                json.append(",");
            }
            json.append("\n");
        }

        json.append("  ]\n");
        json.append("}");

        return json.toString();
    }

    /**
     * Exportar conversación a formato PDF (retorna texto por ahora, requiere librería PDF)
     */
    public String exportToPdf(Long conversationId) {
        // Por ahora, retornar Markdown. Se puede mejorar con una librería PDF como iText o Apache PDFBox
        return exportToMarkdown(conversationId);
    }

    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }

    private String formatInstant(Instant instant) {
        if (instant == null) return "N/A";
        return instant.atZone(ZoneId.systemDefault()).format(DATE_FORMATTER);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            return userRepository.findByUsername(username).orElse(null);
        }
        return null;
    }
}

