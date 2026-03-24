package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidad de configuración de secciones SWIFT.
 * Define las secciones disponibles para cada tipo de mensaje y sus metadatos.
 * Los labels se resuelven en el frontend usando i18n (label_key).
 */
@Entity
@Table(name = "swift_section_config", indexes = {
    @Index(name = "idx_section_lookup", columnList = "message_type,is_active,display_order")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwiftSectionConfig {

    @Id
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private String id;

    /**
     * Código único de la sección (en inglés): BASIC, AMOUNTS, DATES, BANKS, etc.
     */
    @Column(name = "section_code", nullable = false, length = 50)
    private String sectionCode;

    /**
     * Clave de traducción para el label: sections.mt700.basic.label
     */
    @Column(name = "label_key", nullable = false, length = 100)
    private String labelKey;

    /**
     * Clave de traducción para la descripción: sections.mt700.basic.description
     */
    @Column(name = "description_key", length = 100)
    private String descriptionKey;

    /**
     * Tipo de mensaje SWIFT: MT700, MT760, MT710, etc.
     */
    @Column(name = "message_type", nullable = false, length = 10)
    private String messageType;

    /**
     * Orden de visualización (menor = primero)
     */
    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    /**
     * Nombre del icono de react-icons (ej: FiInfo, FiDollarSign)
     */
    @Column(name = "icon", length = 50)
    private String icon;

    /**
     * Indica si la sección está activa
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
