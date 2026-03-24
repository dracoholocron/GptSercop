package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "custom_catalog_read_model", indexes = {
        @Index(name = "idx_custom_catalog_code", columnList = "code"),
        @Index(name = "idx_custom_catalog_level", columnList = "level"),
        @Index(name = "idx_custom_catalog_parent", columnList = "parent_catalog_id"),
        @Index(name = "idx_custom_catalog_active", columnList = "active")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CatalogoPersonalizadoReadModel {
    @Id
    private Long id;

    @Column(name = "code", nullable = false, unique = true)
    private String codigo;

    @Column(name = "name", nullable = false)
    private String nombre;

    @Column(name = "description", length = 500)
    private String descripcion;

    @Column(name = "level", nullable = false)
    private Integer nivel; // 1 = Catálogo, 2 = Registro

    @Column(name = "parent_catalog_id")
    private Long catalogoPadreId;

    @Column(name = "parent_catalog_code")
    private String codigoCatalogoPadre;

    @Column(name = "parent_catalog_name")
    private String nombreCatalogoPadre;

    @Column(name = "active", nullable = false)
    private Boolean activo;

    @Column(name = "is_system")
    private Boolean isSystem;

    @Column(name = "display_order", nullable = false)
    private Integer orden;

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
}
