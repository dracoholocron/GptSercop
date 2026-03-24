package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "template_read_model")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlantillaReadModel {
    @Id
    private Long id;

    @Column(name = "code", unique = true, nullable = false)
    private String codigo;

    @Column(name = "name", nullable = false)
    private String nombre;

    @Column(name = "description", length = 1000)
    private String descripcion;

    @Column(name = "document_type")
    private String tipoDocumento;

    @Column(name = "file_name")
    private String nombreArchivo;

    @Column(name = "file_path")
    private String rutaArchivo;

    @Column(name = "file_size")
    private Long tamanioArchivo;

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

    @Column(name = "variables", columnDefinition = "TEXT")
    private String variables; // JSON con las variables detectadas en la plantilla

    @Version
    private Long version;
}
