package com.globalcmx.api.email.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_queue")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String uuid;

    @Column(name = "tenant_id")
    private String tenantId;

    @Column(name = "to_addresses", columnDefinition = "TEXT")
    private String toAddresses;

    @Column(name = "cc_addresses", columnDefinition = "TEXT")
    private String ccAddresses;

    @Column(name = "bcc_addresses", columnDefinition = "TEXT")
    private String bccAddresses;

    @Column(name = "from_email")
    private String fromEmail;

    @Column(name = "from_name")
    private String fromName;

    @Column(nullable = false)
    private String subject;

    @Column(name = "body_html", columnDefinition = "LONGTEXT")
    private String bodyHtml;

    @Column(name = "body_text", columnDefinition = "LONGTEXT")
    private String bodyText;

    @Column(name = "template_code")
    private String templateCode;

    @Column(name = "template_variables", columnDefinition = "TEXT")
    private String templateVariables;

    @Enumerated(EnumType.STRING)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    private Status status;

    @Column(name = "retry_count")
    private Integer retryCount;

    @Column(name = "max_retries")
    private Integer maxRetries;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @Column(name = "reference_type")
    private String referenceType;

    @Column(name = "reference_id")
    private String referenceId;

    @Column(name = "provider_id")
    private Long providerId;

    @Column(name = "provider_used")
    private String providerUsed;

    @Column(name = "provider_message_id")
    private String providerMessageId;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private String createdBy;

    public enum Priority { LOW, NORMAL, HIGH, URGENT }
    public enum Status { PENDING, PROCESSING, SENT, FAILED, RETRY, CANCELLED }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (uuid == null) uuid = java.util.UUID.randomUUID().toString();
        if (priority == null) priority = Priority.NORMAL;
        if (status == null) status = Status.PENDING;
        if (retryCount == null) retryCount = 0;
        if (maxRetries == null) maxRetries = 3;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
