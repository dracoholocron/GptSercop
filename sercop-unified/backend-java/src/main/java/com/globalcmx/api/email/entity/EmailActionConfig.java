package com.globalcmx.api.email.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_action_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailActionConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "action_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private ActionType actionType;

    @Column(name = "event_type_code")
    private String eventTypeCode;

    @Column(name = "product_type_code")
    private String productTypeCode;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "template_code", nullable = false)
    private String templateCode;

    @Column(name = "recipient_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private RecipientType recipientType;

    @Column(name = "custom_recipients", columnDefinition = "TEXT")
    private String customRecipients;

    @Column(columnDefinition = "TEXT")
    private String conditions;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private String createdBy;

    public enum ActionType {
        OPERATION_CREATED, OPERATION_APPROVED, OPERATION_REJECTED, STATUS_CHANGED,
        DOCUMENT_UPLOADED, AMENDMENT_REQUESTED, PAYMENT_DUE, EXPIRY_WARNING
    }

    public enum RecipientType { OPERATION_OWNER, APPROVERS, PARTICIPANTS, CUSTOM }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
