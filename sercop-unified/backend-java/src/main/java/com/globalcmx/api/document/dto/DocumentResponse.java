package com.globalcmx.api.document.dto;

import com.globalcmx.api.document.entity.DocumentEntity;
import com.globalcmx.api.readmodel.entity.DocumentReadModel;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for document data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DocumentResponse {

    private String documentId;
    private String operationId;
    private String eventId;
    private String alertId;

    // File metadata
    private String originalFileName;
    private String mimeType;
    private Long fileSize;
    private String formattedFileSize;

    // Classification
    private String categoryCode;
    private String categoryName;
    private String subcategoryCode;
    private String subcategoryName;
    private String documentTypeCode;
    private String documentTypeName;
    private List<String> tags;

    // Version
    private Integer version;
    private Boolean isLatest;
    private String previousVersionId;
    private String changeNotes;

    // Security
    private String accessLevel;
    private Boolean virusScanPassed;
    private LocalDateTime virusScanAt;

    // Audit
    private String uploadedBy;
    private LocalDateTime uploadedAt;
    private String modifiedBy;
    private LocalDateTime modifiedAt;

    // URLs for access
    private String downloadUrl;
    private String previewUrl;

    /**
     * Create a response from an entity.
     */
    public static DocumentResponse fromEntity(DocumentEntity entity, String baseUrl) {
        return DocumentResponse.builder()
                .documentId(entity.getDocumentId())
                .operationId(entity.getOperationId())
                .eventId(entity.getEventId())
                .alertId(entity.getAlertId())
                .originalFileName(entity.getOriginalFileName())
                .mimeType(entity.getMimeType())
                .fileSize(entity.getFileSize())
                .formattedFileSize(formatFileSize(entity.getFileSize()))
                .categoryCode(entity.getCategoryCode())
                .subcategoryCode(entity.getSubcategoryCode())
                .documentTypeCode(entity.getDocumentTypeCode())
                .tags(parseTagsJson(entity.getTags()))
                .version(entity.getVersion())
                .isLatest(entity.getIsLatest())
                .previousVersionId(entity.getPreviousVersionId())
                .changeNotes(entity.getChangeNotes())
                .accessLevel(entity.getAccessLevel().name())
                .virusScanPassed(entity.getVirusScanPassed())
                .virusScanAt(entity.getVirusScanAt())
                .uploadedBy(entity.getUploadedBy())
                .uploadedAt(entity.getUploadedAt())
                .modifiedBy(entity.getModifiedBy())
                .modifiedAt(entity.getModifiedAt())
                .downloadUrl(baseUrl + "/v1/documents/" + entity.getDocumentId() + "/download")
                .previewUrl(baseUrl + "/v1/documents/" + entity.getDocumentId() + "/preview")
                .build();
    }

    /**
     * Create a response from a read model (CQRS).
     */
    public static DocumentResponse fromReadModel(DocumentReadModel readModel, String baseUrl) {
        return DocumentResponse.builder()
                .documentId(readModel.getDocumentId())
                .operationId(readModel.getOperationId())
                .eventId(readModel.getEventId())
                .alertId(readModel.getAlertId())
                .originalFileName(readModel.getOriginalFileName())
                .mimeType(readModel.getMimeType())
                .fileSize(readModel.getFileSize())
                .formattedFileSize(readModel.getFormattedFileSize())
                .categoryCode(readModel.getCategoryCode())
                .categoryName(readModel.getCategoryNameEs()) // Use Spanish as default
                .subcategoryCode(readModel.getSubcategoryCode())
                .documentTypeCode(readModel.getDocumentTypeCode())
                .documentTypeName(readModel.getDocumentTypeNameEs()) // Use Spanish as default
                .tags(parseTagsJson(readModel.getTags()))
                .version(readModel.getVersion())
                .isLatest(readModel.getIsLatest())
                .changeNotes(readModel.getChangeNotes())
                .accessLevel(readModel.getAccessLevel())
                .uploadedBy(readModel.getUploadedBy())
                .uploadedAt(readModel.getUploadedAt())
                .modifiedBy(readModel.getModifiedBy())
                .modifiedAt(readModel.getModifiedAt())
                .downloadUrl(baseUrl + "/v1/documents/" + readModel.getDocumentId() + "/download")
                .previewUrl(baseUrl + "/v1/documents/" + readModel.getDocumentId() + "/preview")
                .build();
    }

    private static String formatFileSize(Long bytes) {
        if (bytes == null || bytes == 0) return "0 B";
        String[] units = {"B", "KB", "MB", "GB"};
        int unitIndex = 0;
        double size = bytes;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return String.format("%.2f %s", size, units[unitIndex]);
    }

    private static List<String> parseTagsJson(String tagsJson) {
        if (tagsJson == null || tagsJson.isEmpty()) {
            return List.of();
        }
        try {
            // Simple JSON array parsing
            String content = tagsJson.replaceAll("[\\[\\]\"]", "");
            if (content.isEmpty()) return List.of();
            return List.of(content.split(","));
        } catch (Exception e) {
            return List.of();
        }
    }
}
