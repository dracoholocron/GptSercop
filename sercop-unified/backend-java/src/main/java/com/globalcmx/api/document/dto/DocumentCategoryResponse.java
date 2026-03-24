package com.globalcmx.api.document.dto;

import com.globalcmx.api.document.entity.DocumentCategoryEntity;
import com.globalcmx.api.readmodel.entity.DocumentCategoryReadModel;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for document categories.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DocumentCategoryResponse {

    private String categoryId;
    private String code;
    private String parentCategoryId;
    private String nameEs;
    private String nameEn;
    private String descriptionEs;
    private String descriptionEn;
    private String icon;
    private Integer displayOrder;
    private Boolean isActive;
    private Integer documentCount;
    private Boolean hasChildren;
    private Integer level;
    private String fullPath;
    private List<DocumentCategoryResponse> children;

    public static DocumentCategoryResponse fromEntity(DocumentCategoryEntity entity) {
        return DocumentCategoryResponse.builder()
                .categoryId(entity.getCategoryId())
                .code(entity.getCode())
                .parentCategoryId(entity.getParentCategoryId())
                .nameEs(entity.getNameEs())
                .nameEn(entity.getNameEn())
                .descriptionEs(entity.getDescriptionEs())
                .descriptionEn(entity.getDescriptionEn())
                .icon(entity.getIcon())
                .displayOrder(entity.getDisplayOrder())
                .isActive(entity.getIsActive())
                .build();
    }

    /**
     * Create from read model (CQRS).
     */
    public static DocumentCategoryResponse fromReadModel(DocumentCategoryReadModel readModel) {
        return DocumentCategoryResponse.builder()
                .categoryId(readModel.getCategoryId())
                .code(readModel.getCode())
                .parentCategoryId(readModel.getParentCode())
                .nameEs(readModel.getNameEs())
                .nameEn(readModel.getNameEn())
                .descriptionEs(readModel.getDescriptionEs())
                .descriptionEn(readModel.getDescriptionEn())
                .icon(readModel.getIcon())
                .displayOrder(readModel.getDisplayOrder())
                .isActive(readModel.getIsActive())
                .documentCount(readModel.getDocumentCount())
                .hasChildren(readModel.getHasChildren())
                .level(readModel.getLevel())
                .fullPath(readModel.getFullPath())
                .build();
    }
}
