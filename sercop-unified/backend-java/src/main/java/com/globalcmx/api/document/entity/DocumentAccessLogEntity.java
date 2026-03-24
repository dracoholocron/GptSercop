package com.globalcmx.api.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity for logging all document access for audit purposes.
 * Records who accessed what document, when, and what action was performed.
 */
@Entity
@Table(name = "document_access_logs", indexes = {
    @Index(name = "idx_doc_log_document", columnList = "document_id"),
    @Index(name = "idx_doc_log_user", columnList = "user_id"),
    @Index(name = "idx_doc_log_action", columnList = "action"),
    @Index(name = "idx_doc_log_accessed_at", columnList = "accessed_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentAccessLogEntity {

    @Id
    @Column(name = "log_id", length = 36)
    private String logId;

    @Column(name = "document_id", nullable = false, length = 36)
    private String documentId;

    @Column(name = "user_id", nullable = false, length = 100)
    private String userId;

    @Column(name = "user_name", length = 200)
    private String userName;

    @Column(name = "action", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private DocumentAction action;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "accessed_at", nullable = false)
    private LocalDateTime accessedAt;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details; // JSON with additional context

    @PrePersist
    protected void onCreate() {
        if (accessedAt == null) {
            accessedAt = LocalDateTime.now();
        }
    }

    // Enum for document actions
    public enum DocumentAction {
        VIEW,
        DOWNLOAD,
        UPLOAD,
        UPDATE,
        DELETE,
        RESTORE,
        VERSION,
        SHARE
    }
}
