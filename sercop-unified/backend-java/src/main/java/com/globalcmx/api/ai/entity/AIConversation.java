package com.globalcmx.api.ai.entity;

import com.globalcmx.api.security.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Entidad que representa una conversación de chat entre un usuario y la IA.
 * Cada conversación pertenece a un usuario y puede tener múltiples mensajes.
 */
@Entity
@Table(name = "ai_conversation",
       indexes = {
           @Index(name = "idx_conversation_user", columnList = "user_id"),
           @Index(name = "idx_conversation_updated", columnList = "updated_at")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "context_id")
    private AIContext context;

    @Column(nullable = false, length = 200)
    private String title; // Título de la conversación (puede ser generado del primer mensaje)

    @Column(name = "is_favorite")
    @Builder.Default
    private Boolean isFavorite = false;

    @Column(name = "folder_name", length = 100)
    private String folderName; // Carpeta para organizar conversaciones

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}





