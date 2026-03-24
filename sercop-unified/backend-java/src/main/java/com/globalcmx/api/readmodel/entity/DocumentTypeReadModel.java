package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Read model for document types - optimized for UI display.
 */
@Entity
@Table(name = "document_type_readmodel", indexes = {
    @Index(name = "idx_doc_type_rm_code", columnList = "code"),
    @Index(name = "idx_doc_type_rm_category", columnList = "category_code")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentTypeReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "type_id", length = 36, unique = true, nullable = false)
    private String typeId;

    @Column(name = "code", length = 50, unique = true, nullable = false)
    private String code;

    @Column(name = "category_code", length = 50, nullable = false)
    private String categoryCode;

    @Column(name = "category_name_es", length = 100)
    private String categoryNameEs;

    @Column(name = "category_name_en", length = 100)
    private String categoryNameEn;

    @Column(name = "name_es", nullable = false, length = 100)
    private String nameEs;

    @Column(name = "name_en", nullable = false, length = 100)
    private String nameEn;

    @Column(name = "description_es", length = 500)
    private String descriptionEs;

    @Column(name = "description_en", length = 500)
    private String descriptionEn;

    @Column(name = "allowed_mime_types", columnDefinition = "TEXT")
    private String allowedMimeTypes;

    @Column(name = "allowed_extensions", length = 500)
    private String allowedExtensions;

    @Column(name = "max_file_size_mb")
    @Builder.Default
    private Integer maxFileSizeMb = 50;

    @Column(name = "requires_approval")
    @Builder.Default
    private Boolean requiresApproval = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "document_count")
    @Builder.Default
    private Integer documentCount = 0;
}
