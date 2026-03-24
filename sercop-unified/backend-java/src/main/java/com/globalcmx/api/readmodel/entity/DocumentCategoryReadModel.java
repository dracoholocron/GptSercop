package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Read model for document categories - optimized for UI display.
 */
@Entity
@Table(name = "document_category_readmodel", indexes = {
    @Index(name = "idx_doc_cat_rm_code", columnList = "code"),
    @Index(name = "idx_doc_cat_rm_parent", columnList = "parent_code"),
    @Index(name = "idx_doc_cat_rm_order", columnList = "display_order")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentCategoryReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_id", length = 36, unique = true, nullable = false)
    private String categoryId;

    @Column(name = "code", length = 50, unique = true, nullable = false)
    private String code;

    @Column(name = "parent_code", length = 50)
    private String parentCode;

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

    @Column(name = "document_count")
    @Builder.Default
    private Integer documentCount = 0;

    @Column(name = "has_children")
    @Builder.Default
    private Boolean hasChildren = false;

    @Column(name = "level")
    @Builder.Default
    private Integer level = 0;

    @Column(name = "full_path", length = 500)
    private String fullPath;
}
