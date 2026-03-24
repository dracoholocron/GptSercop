package com.globalcmx.api.alerts.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Read model for user alerts and follow-up activities.
 * Tracks scheduled alerts, reminders, and tasks for each user.
 */
@Entity
@Table(name = "user_alert_readmodel",
    indexes = {
        @Index(name = "idx_user_alert_user", columnList = "user_id, status, scheduled_date"),
        @Index(name = "idx_user_alert_date", columnList = "scheduled_date, status"),
        @Index(name = "idx_user_alert_operation", columnList = "operation_id"),
        @Index(name = "idx_user_alert_client", columnList = "client_id"),
        @Index(name = "idx_user_alert_source", columnList = "source_type, source_id")
    })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAlertReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alert_id", length = 36, unique = true, nullable = false)
    private String alertId;

    // User and assignment
    @Column(name = "user_id", length = 100, nullable = false)
    private String userId;

    @Column(name = "user_name", length = 200)
    private String userName;

    @Column(name = "assigned_by", length = 100)
    private String assignedBy;

    @Column(name = "assigned_role", length = 50)
    private String assignedRole;

    // Content
    @Column(name = "title", length = 300, nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "alert_type", length = 50, nullable = false)
    @Enumerated(EnumType.STRING)
    private AlertType alertType;

    @Column(name = "priority", length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AlertPriority priority = AlertPriority.NORMAL;

    // Source/Origin
    @Column(name = "source_type", length = 50, nullable = false)
    @Enumerated(EnumType.STRING)
    private AlertSourceType sourceType;

    @Column(name = "source_id", length = 100)
    private String sourceId;

    @Column(name = "source_reference", length = 100)
    private String sourceReference;

    @Column(name = "source_module", length = 50)
    private String sourceModule;

    // Template tracking (for recalculation)
    @Column(name = "template_id")
    private Long templateId;

    @Column(name = "due_date_reference", length = 30)
    private String dueDateReference;

    @Column(name = "date_offset_days")
    private Integer dateOffsetDays;

    @Column(name = "reference_date")
    private LocalDate referenceDate;

    // Linking
    @Column(name = "operation_id", length = 100)
    private String operationId;

    @Column(name = "request_id", length = 100)
    private String requestId;

    @Column(name = "draft_id", length = 100)
    private String draftId;

    @Column(name = "client_id", length = 100)
    private String clientId;

    @Column(name = "client_name", length = 200)
    private String clientName;

    // Video Conference (for VIDEO_CALL alerts)
    @Column(name = "meeting_id", length = 100)
    private String meetingId;

    @Column(name = "meeting_url", length = 500)
    private String meetingUrl;

    @Column(name = "meeting_provider", length = 50)
    private String meetingProvider;

    @Column(name = "organizer_name", length = 200)
    private String organizerName;

    // Scheduling
    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "scheduled_time")
    private LocalTime scheduledTime;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    // Status
    @Column(name = "status", length = 30, nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AlertStatus status = AlertStatus.PENDING;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "processed_by", length = 100)
    private String processedBy;

    @Column(name = "processing_notes", columnDefinition = "TEXT")
    private String processingNotes;

    // Rescheduling tracking
    @Column(name = "original_scheduled_date")
    private LocalDate originalScheduledDate;

    @Column(name = "reschedule_count")
    @Builder.Default
    private Integer rescheduleCount = 0;

    // Audit
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Tags (JSON array of tag names)
    @Column(name = "tags", columnDefinition = "JSON")
    private String tags;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (originalScheduledDate == null && scheduledDate != null) {
            originalScheduledDate = scheduledDate;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Check if the alert is overdue
     */
    public boolean isOverdue() {
        if (status == AlertStatus.COMPLETED || status == AlertStatus.CANCELLED) {
            return false;
        }
        LocalDate today = LocalDate.now();
        return scheduledDate.isBefore(today);
    }

    /**
     * Check if the alert is due today
     */
    public boolean isDueToday() {
        return scheduledDate.equals(LocalDate.now());
    }

    /**
     * Alert types
     */
    public enum AlertType {
        FOLLOW_UP,
        REMINDER,
        DEADLINE,
        TASK,
        DOCUMENT_REVIEW,
        CLIENT_CONTACT,
        OPERATION_UPDATE,
        COMPLIANCE_CHECK,
        VIDEO_CALL
    }

    /**
     * Alert priority levels
     */
    public enum AlertPriority {
        LOW,
        NORMAL,
        HIGH,
        URGENT
    }

    /**
     * Alert source types
     */
    public enum AlertSourceType {
        OPERATION_APPROVAL,
        SCHEDULED_JOB,
        AI_EXTRACTION,
        BUSINESS_REQUEST,
        MANUAL,
        VIDEO_CONFERENCE
    }

    /**
     * Alert status
     */
    public enum AlertStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED,
        SNOOZED
    }
}
