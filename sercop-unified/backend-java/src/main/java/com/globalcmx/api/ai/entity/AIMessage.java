package com.globalcmx.api.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Entidad que representa un mensaje individual en una conversación de chat.
 * Puede ser un mensaje del usuario o una respuesta de la IA.
 */
@Entity
@Table(name = "ai_message",
       indexes = {
           @Index(name = "idx_message_conversation", columnList = "conversation_id"),
           @Index(name = "idx_message_created", columnList = "created_at")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private AIConversation conversation;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private MessageRole role; // USER o ASSISTANT

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content; // Contenido del mensaje

    @Column(name = "metadata", columnDefinition = "JSON")
    private String metadata; // Metadatos adicionales en formato JSON

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /**
     * Roles de mensaje en la conversación
     */
    public enum MessageRole {
        USER,      // Mensaje del usuario
        ASSISTANT  // Respuesta de la IA
    }
}





