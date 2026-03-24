package com.globalcmx.api.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Entidad que mapea roles de usuario a contextos de IA permitidos.
 * Define qué contextos puede usar cada rol y sus límites.
 */
@Entity
@Table(name = "ai_context_role_mapping", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"context_id", "role"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIContextRoleMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "context_id", nullable = false)
    private AIContext context;

    @Column(nullable = false, length = 50)
    private String role; // admin, manager, user

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @Column(name = "max_queries_per_day")
    private Integer maxQueriesPerDay; // NULL means unlimited

    @Column(name = "allowed_operations", columnDefinition = "JSON")
    private String allowedOperations; // JSON array of allowed operations

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}





