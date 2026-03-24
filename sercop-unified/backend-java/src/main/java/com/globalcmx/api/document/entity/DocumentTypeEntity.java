package com.globalcmx.api.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing a document type within a category.
 * Defines allowed MIME types and size limits per document type.
 */
@Entity
@Table(name = "document_types", indexes = {
    @Index(name = "idx_doc_type_code", columnList = "code"),
    @Index(name = "idx_doc_type_category", columnList = "category_code"),
    @Index(name = "idx_doc_type_active", columnList = "is_active")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentTypeEntity {

    @Id
    @Column(name = "type_id", length = 36)
    private String typeId;

    @Column(name = "code", unique = true, nullable = false, length = 50)
    private String code;

    @Column(name = "category_code", nullable = false, length = 50)
    private String categoryCode;

    @Column(name = "name_es", nullable = false, length = 100)
    private String nameEs;

    @Column(name = "name_en", nullable = false, length = 100)
    private String nameEn;

    @Column(name = "description_es", length = 500)
    private String descriptionEs;

    @Column(name = "description_en", length = 500)
    private String descriptionEn;

    @Column(name = "allowed_mime_types", columnDefinition = "TEXT")
    private String allowedMimeTypes; // JSON array of MIME types

    @Column(name = "max_file_size_mb")
    @Builder.Default
    private Integer maxFileSizeMb = 50; // Default 50 MB

    @Column(name = "requires_approval", nullable = false)
    @Builder.Default
    private Boolean requiresApproval = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "modified_at")
    private LocalDateTime modifiedAt;

    @Column(name = "modified_by", length = 100)
    private String modifiedBy;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        modifiedAt = LocalDateTime.now();
    }
}
