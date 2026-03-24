package com.globalcmx.api.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing a document category for hierarchical classification.
 * Categories can have parent categories to form a tree structure.
 */
@Entity
@Table(name = "document_categories", indexes = {
    @Index(name = "idx_doc_cat_code", columnList = "code"),
    @Index(name = "idx_doc_cat_parent", columnList = "parent_category_id"),
    @Index(name = "idx_doc_cat_active", columnList = "is_active")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentCategoryEntity {

    @Id
    @Column(name = "category_id", length = 36)
    private String categoryId;

    @Column(name = "code", unique = true, nullable = false, length = 50)
    private String code;

    @Column(name = "parent_category_id", length = 36)
    private String parentCategoryId;

    @Column(name = "name_es", nullable = false, length = 100)
    private String nameEs;

    @Column(name = "name_en", nullable = false, length = 100)
    private String nameEn;

    @Column(name = "description_es", length = 500)
    private String descriptionEs;

    @Column(name = "description_en", length = 500)
    private String descriptionEn;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

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
