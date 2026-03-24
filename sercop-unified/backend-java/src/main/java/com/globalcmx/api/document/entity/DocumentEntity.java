package com.globalcmx.api.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing a document stored in the system.
 * Documents can be associated with operations or events as evidence.
 */
@Entity
@Table(name = "documents", indexes = {
    @Index(name = "idx_doc_operation", columnList = "operation_id"),
    @Index(name = "idx_doc_event", columnList = "event_id"),
    @Index(name = "idx_doc_alert", columnList = "alert_id"),
    @Index(name = "idx_doc_category", columnList = "category_code"),
    @Index(name = "idx_doc_type", columnList = "document_type_code"),
    @Index(name = "idx_doc_uploaded_at", columnList = "uploaded_at"),
    @Index(name = "idx_doc_is_latest", columnList = "is_latest")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentEntity {

    @Id
    @Column(name = "document_id", length = 36)
    private String documentId;

    // Aggregate association
    @Column(name = "aggregate_id", length = 100)
    private String aggregateId;

    @Column(name = "aggregate_type", length = 20)
    @Enumerated(EnumType.STRING)
    private AggregateType aggregateType;

    @Column(name = "operation_id", length = 100)
    private String operationId;

    @Column(name = "event_id", length = 100)
    private String eventId;

    @Column(name = "alert_id", length = 100)
    private String alertId;

    // File metadata
    @Column(name = "original_file_name", nullable = false, length = 500)
    private String originalFileName;

    @Column(name = "stored_file_name", nullable = false, length = 100)
    private String storedFileName;

    @Column(name = "storage_path", nullable = false, length = 1000)
    private String storagePath;

    @Column(name = "storage_provider", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private StorageProvider storageProvider;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "checksum", length = 64)
    private String checksum; // SHA-256 hash

    // Classification
    @Column(name = "category_code", nullable = false, length = 50)
    private String categoryCode;

    @Column(name = "subcategory_code", length = 50)
    private String subcategoryCode;

    @Column(name = "document_type_code", nullable = false, length = 50)
    private String documentTypeCode;

    @Column(name = "tags", columnDefinition = "TEXT")
    private String tags; // JSON array of tags

    // Version control
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "previous_version_id", length = 36)
    private String previousVersionId;

    @Column(name = "is_latest", nullable = false)
    @Builder.Default
    private Boolean isLatest = true;

    @Column(name = "change_notes", length = 1000)
    private String changeNotes;

    // Security
    @Column(name = "access_level", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AccessLevel accessLevel = AccessLevel.RESTRICTED;

    @Column(name = "encryption_key", length = 100)
    private String encryptionKey;

    @Column(name = "virus_scan_passed")
    private Boolean virusScanPassed;

    @Column(name = "virus_scan_at")
    private LocalDateTime virusScanAt;

    // Audit fields
    @Column(name = "uploaded_by", nullable = false, length = 100)
    private String uploadedBy;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "modified_by", length = 100)
    private String modifiedBy;

    @Column(name = "modified_at")
    private LocalDateTime modifiedAt;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "deleted_by", length = 100)
    private String deletedBy;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        if (uploadedAt == null) {
            uploadedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        modifiedAt = LocalDateTime.now();
    }

    // Enums
    public enum AggregateType {
        OPERATION, EVENT, ALERT
    }

    public enum StorageProvider {
        S3, AZURE, GCS, LOCAL, CUSTOM
    }

    public enum AccessLevel {
        PUBLIC, RESTRICTED, CONFIDENTIAL
    }
}
