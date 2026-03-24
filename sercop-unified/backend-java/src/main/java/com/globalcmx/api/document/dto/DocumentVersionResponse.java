package com.globalcmx.api.document.dto;

import com.globalcmx.api.document.entity.DocumentEntity;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for document version information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DocumentVersionResponse {

    private String documentId;
    private Integer version;
    private String originalFileName;
    private Long fileSize;
    private String formattedFileSize;
    private String mimeType;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
    private String changeNotes;
    private Boolean isLatest;
    private String downloadUrl;

    public static DocumentVersionResponse fromEntity(DocumentEntity entity, String baseUrl) {
        return DocumentVersionResponse.builder()
                .documentId(entity.getDocumentId())
                .version(entity.getVersion())
                .originalFileName(entity.getOriginalFileName())
                .fileSize(entity.getFileSize())
                .formattedFileSize(formatFileSize(entity.getFileSize()))
                .mimeType(entity.getMimeType())
                .uploadedBy(entity.getUploadedBy())
                .uploadedAt(entity.getUploadedAt())
                .changeNotes(entity.getChangeNotes())
                .isLatest(entity.getIsLatest())
                .downloadUrl(baseUrl + "/v1/documents/" + entity.getDocumentId() + "/download")
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
}
