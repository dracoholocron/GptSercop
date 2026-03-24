package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Read model for documents - optimized for queries.
 * Contains denormalized data for efficient retrieval.
 */
@Entity
@Table(name = "document_readmodel", indexes = {
    @Index(name = "idx_doc_rm_operation", columnList = "operation_id"),
    @Index(name = "idx_doc_rm_event", columnList = "event_id"),
    @Index(name = "idx_doc_rm_alert", columnList = "alert_id"),
    @Index(name = "idx_doc_rm_category", columnList = "category_code"),
    @Index(name = "idx_doc_rm_type", columnList = "document_type_code"),
    @Index(name = "idx_doc_rm_uploaded_at", columnList = "uploaded_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentReadModel {

    @Id
    @Column(name = "document_id", length = 36)
    private String documentId;

    @Column(name = "operation_id", length = 100)
    private String operationId;

    @Column(name = "event_id", length = 100)
    private String eventId;

    @Column(name = "alert_id", length = 100)
    private String alertId;

    // File info
    @Column(name = "original_file_name", nullable = false, length = 500)
    private String originalFileName;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "formatted_file_size", length = 50)
    private String formattedFileSize;

    // Classification - denormalized for display
    @Column(name = "category_code", nullable = false, length = 50)
    private String categoryCode;

    @Column(name = "category_name_es", length = 100)
    private String categoryNameEs;

    @Column(name = "category_name_en", length = 100)
    private String categoryNameEn;

    @Column(name = "subcategory_code", length = 50)
    private String subcategoryCode;

    @Column(name = "document_type_code", nullable = false, length = 50)
    private String documentTypeCode;

    @Column(name = "document_type_name_es", length = 100)
    private String documentTypeNameEs;

    @Column(name = "document_type_name_en", length = 100)
    private String documentTypeNameEn;

    @Column(name = "tags", columnDefinition = "TEXT")
    private String tags;

    // Version info
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "is_latest", nullable = false)
    @Builder.Default
    private Boolean isLatest = true;

    @Column(name = "change_notes", length = 1000)
    private String changeNotes;

    // Storage info (for file existence validation)
    @Column(name = "storage_path", length = 1000)
    private String storagePath;

    @Column(name = "storage_provider", length = 20)
    private String storageProvider;

    // Security
    @Column(name = "access_level", nullable = false, length = 20)
    @Builder.Default
    private String accessLevel = "RESTRICTED";

    // Audit - denormalized for display
    @Column(name = "uploaded_by", nullable = false, length = 100)
    private String uploadedBy;

    @Column(name = "uploaded_by_name", length = 200)
    private String uploadedByName;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "modified_by", length = 100)
    private String modifiedBy;

    @Column(name = "modified_at")
    private LocalDateTime modifiedAt;

    // Computed fields
    @Column(name = "can_preview")
    @Builder.Default
    private Boolean canPreview = false;

    @Column(name = "download_count")
    @Builder.Default
    private Integer downloadCount = 0;

    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    @PrePersist
    protected void onCreate() {
        if (uploadedAt == null) {
            uploadedAt = LocalDateTime.now();
        }
        canPreview = isPreviewable(mimeType);
        formattedFileSize = formatFileSize(fileSize);
    }

    @PreUpdate
    protected void onUpdate() {
        modifiedAt = LocalDateTime.now();
    }

    private boolean isPreviewable(String mimeType) {
        if (mimeType == null) return false;
        return mimeType.equals("application/pdf") ||
               mimeType.startsWith("image/") ||
               mimeType.startsWith("text/");
    }

    private String formatFileSize(Long bytes) {
        if (bytes == null) return "0 B";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
    }
}
