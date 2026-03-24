package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "participant_read_model", indexes = {
        @Index(name = "idx_participant_identification", columnList = "identification"),
        @Index(name = "idx_participant_type", columnList = "type"),
        @Index(name = "idx_participant_email", columnList = "email"),
        @Index(name = "idx_participant_agency", columnList = "agency"),
        @Index(name = "idx_participant_parent_id", columnList = "parent_id"),
        @Index(name = "idx_participant_hierarchy_type", columnList = "hierarchy_type")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipanteReadModel {
    @Id
    private Long id;

    // ==========================================
    // Hierarchy fields (Corporation support)
    // ==========================================

    @Column(name = "parent_id")
    private Long parentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", insertable = false, updatable = false)
    private ParticipanteReadModel parent;

    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    @Builder.Default
    private List<ParticipanteReadModel> children = new ArrayList<>();

    @Column(name = "hierarchy_type", length = 30)
    @Builder.Default
    private String hierarchyType = "COMPANY";

    @Column(name = "hierarchy_level")
    @Builder.Default
    private Integer hierarchyLevel = 0;

    // ==========================================
    // Original fields
    // ==========================================

    @Column(name = "identification", nullable = false)
    private String identificacion;

    @Column(name = "type", nullable = false)
    private String tipo;

    @Column(name = "reference_type")
    private String tipoReferencia;

    @Column(name = "first_names", nullable = false)
    private String nombres;

    @Column(name = "last_names", nullable = false)
    private String apellidos;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone")
    private String telefono;

    @Column(name = "address")
    private String direccion;

    @Column(name = "agency")
    private String agencia;

    @Column(name = "assigned_executive")
    private String ejecutivoAsignado;

    @Column(name = "executive_id")
    private String ejecutivoId;

    @Column(name = "executive_email")
    private String correoEjecutivo;

    @Column(name = "authenticator")
    private String autenticador;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ==========================================
    // Hierarchy utility methods
    // ==========================================

    /**
     * Check if this participant is a corporation (top-level holding)
     */
    public boolean isCorporation() {
        return "CORPORATION".equals(hierarchyType);
    }

    /**
     * Check if this participant is a regular company
     */
    public boolean isCompany() {
        return "COMPANY".equals(hierarchyType);
    }

    /**
     * Check if this participant is a branch
     */
    public boolean isBranch() {
        return "BRANCH".equals(hierarchyType);
    }

    /**
     * Check if this participant has children (is a parent)
     */
    public boolean hasChildren() {
        return children != null && !children.isEmpty();
    }

    /**
     * Check if this participant is a root (no parent)
     */
    public boolean isRoot() {
        return parentId == null;
    }

    /**
     * Get display name (nombres + apellidos for individuals, just nombres for companies)
     */
    public String getDisplayName() {
        if (apellidos != null && !apellidos.isEmpty()) {
            return nombres + " " + apellidos;
        }
        return nombres;
    }
}
