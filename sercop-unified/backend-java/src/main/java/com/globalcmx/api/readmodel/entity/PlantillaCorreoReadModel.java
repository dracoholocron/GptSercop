package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_template_read_model")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlantillaCorreoReadModel {
    @Id
    private Long id;

    @Column(name = "code", unique = true, nullable = false)
    private String codigo;

    @Column(name = "name", nullable = false)
    private String nombre;

    @Column(name = "description", length = 1000)
    private String descripcion;

    // Campos específicos de email
    @Column(name = "subject", length = 500)
    private String asunto; // Asunto del correo con variables

    @Column(name = "body_html", columnDefinition = "TEXT")
    private String cuerpoHtml; // Cuerpo HTML del correo con variables Thymeleaf

    @Column(name = "attached_templates", columnDefinition = "TEXT")
    private String plantillasAdjuntas; // JSON array de IDs de plantillas de documentos

    @Column(name = "variables", columnDefinition = "TEXT")
    private String variables; // JSON con las variables detectadas en asunto y cuerpo

    @Column(name = "active", nullable = false)
    private Boolean activo = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "aggregate_id")
    private String aggregateId;

    @Version
    private Long version;
}
