package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_alert_template",
    indexes = {
        @Index(name = "idx_eat_operation_event", columnList = "operation_type, event_code"),
        @Index(name = "idx_eat_active", columnList = "is_active")
    })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventAlertTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "operation_type", length = 30, nullable = false)
    private String operationType;

    @Column(name = "event_code", length = 50, nullable = false)
    private String eventCode;

    @Column(name = "alert_type", length = 30, nullable = false)
    private String alertType;

    @Column(name = "requirement_level", length = 20, nullable = false)
    @Builder.Default
    private String requirementLevel = "RECOMMENDED";

    @Column(name = "title_template", length = 200, nullable = false)
    private String titleTemplate;

    @Column(name = "description_template", columnDefinition = "TEXT")
    private String descriptionTemplate;

    @Column(name = "default_priority", length = 10, nullable = false)
    @Builder.Default
    private String defaultPriority = "NORMAL";

    @Column(name = "assigned_role", length = 50)
    private String assignedRole;

    @Column(name = "due_days_offset", nullable = false)
    @Builder.Default
    private Integer dueDaysOffset = 3;

    @Column(name = "due_date_reference", length = 30)
    @Builder.Default
    private String dueDateReference = "EVENT_EXECUTION";

    @Column(name = "tags", columnDefinition = "JSON")
    private String tags;

    @Column(name = "language", length = 5, nullable = false)
    @Builder.Default
    private String language = "es";

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "email_template_id")
    private Long emailTemplateId;

    @Column(name = "document_template_id")
    private Long documentTemplateId;

    @Column(name = "email_subject", length = 500)
    private String emailSubject;

    @Column(name = "email_recipients", length = 1000)
    private String emailRecipients;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
