package com.globalcmx.api.document.dto;

import com.globalcmx.api.document.entity.DocumentTypeEntity;
import com.globalcmx.api.readmodel.entity.DocumentTypeReadModel;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for document types.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DocumentTypeResponse {

    private String typeId;
    private String code;
    private String categoryCode;
    private String categoryNameEs;
    private String categoryNameEn;
    private String nameEs;
    private String nameEn;
    private String descriptionEs;
    private String descriptionEn;
    private List<String> allowedMimeTypes;
    private Integer maxFileSizeMb;
    private Boolean requiresApproval;
    private Boolean isActive;
    private Integer documentCount;

    public static DocumentTypeResponse fromEntity(DocumentTypeEntity entity) {
        return DocumentTypeResponse.builder()
                .typeId(entity.getTypeId())
                .code(entity.getCode())
                .categoryCode(entity.getCategoryCode())
                .nameEs(entity.getNameEs())
                .nameEn(entity.getNameEn())
                .descriptionEs(entity.getDescriptionEs())
                .descriptionEn(entity.getDescriptionEn())
                .allowedMimeTypes(parseAllowedMimeTypes(entity.getAllowedMimeTypes()))
                .maxFileSizeMb(entity.getMaxFileSizeMb())
                .requiresApproval(entity.getRequiresApproval())
                .isActive(entity.getIsActive())
                .build();
    }

    /**
     * Create from read model (CQRS).
     */
    public static DocumentTypeResponse fromReadModel(DocumentTypeReadModel readModel) {
        return DocumentTypeResponse.builder()
                .typeId(readModel.getTypeId())
                .code(readModel.getCode())
                .categoryCode(readModel.getCategoryCode())
                .categoryNameEs(readModel.getCategoryNameEs())
                .categoryNameEn(readModel.getCategoryNameEn())
                .nameEs(readModel.getNameEs())
                .nameEn(readModel.getNameEn())
                .descriptionEs(readModel.getDescriptionEs())
                .descriptionEn(readModel.getDescriptionEn())
                .allowedMimeTypes(parseAllowedMimeTypes(readModel.getAllowedMimeTypes()))
                .maxFileSizeMb(readModel.getMaxFileSizeMb())
                .requiresApproval(readModel.getRequiresApproval())
                .isActive(readModel.getIsActive())
                .documentCount(readModel.getDocumentCount())
                .build();
    }

    private static List<String> parseAllowedMimeTypes(String json) {
        if (json == null || json.isEmpty()) {
            return List.of();
        }
        try {
            String content = json.replaceAll("[\\[\\]\"]", "");
            if (content.isEmpty()) return List.of();
            return List.of(content.split(","));
        } catch (Exception e) {
            return List.of();
        }
    }
}
