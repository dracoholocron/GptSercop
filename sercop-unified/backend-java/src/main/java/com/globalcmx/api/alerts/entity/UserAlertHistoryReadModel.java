package com.globalcmx.api.alerts.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Read model for user alert history.
 * Tracks all changes made to alerts for complete audit trail.
 */
@Entity
@Table(name = "user_alert_history_readmodel",
    indexes = {
        @Index(name = "idx_alert_history_alert", columnList = "alert_id"),
        @Index(name = "idx_alert_history_action", columnList = "action_type"),
        @Index(name = "idx_alert_history_created", columnList = "created_at")
    })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAlertHistoryReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "history_id", length = 36, unique = true, nullable = false)
    private String historyId;

    @Column(name = "alert_id", length = 36, nullable = false)
    private String alertId;

    // Change information
    @Column(name = "action_type", length = 30, nullable = false)
    @Enumerated(EnumType.STRING)
    private AlertHistoryAction actionType;

    @Column(name = "previous_status", length = 30)
    @Enumerated(EnumType.STRING)
    private UserAlertReadModel.AlertStatus previousStatus;

    @Column(name = "new_status", length = 30)
    @Enumerated(EnumType.STRING)
    private UserAlertReadModel.AlertStatus newStatus;

    @Column(name = "previous_date")
    private LocalDate previousDate;

    @Column(name = "new_date")
    private LocalDate newDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // Additional context (for detailed audit)
    @Column(name = "previous_priority", length = 20)
    @Enumerated(EnumType.STRING)
    private UserAlertReadModel.AlertPriority previousPriority;

    @Column(name = "new_priority", length = 20)
    @Enumerated(EnumType.STRING)
    private UserAlertReadModel.AlertPriority newPriority;

    @Column(name = "previous_title", length = 300)
    private String previousTitle;

    @Column(name = "new_title", length = 300)
    private String newTitle;

    @Column(name = "previous_assigned_to", length = 100)
    private String previousAssignedTo;

    @Column(name = "new_assigned_to", length = 100)
    private String newAssignedTo;

    // IP and user agent for security audit
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    // Audit
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    /**
     * History action types for complete audit trail
     */
    public enum AlertHistoryAction {
        CREATED,
        UPDATED,
        RESCHEDULED,
        COMPLETED,
        CANCELLED,
        SNOOZED,
        REACTIVATED,
        PRIORITY_CHANGED,
        REASSIGNED,
        TITLE_CHANGED,
        DESCRIPTION_CHANGED,
        STARTED,
        NOTE_ADDED
    }

    /**
     * Factory method to create a history entry for alert creation
     */
    public static UserAlertHistoryReadModel forCreation(UserAlertReadModel alert, String createdBy) {
        return UserAlertHistoryReadModel.builder()
            .historyId(java.util.UUID.randomUUID().toString())
            .alertId(alert.getAlertId())
            .actionType(AlertHistoryAction.CREATED)
            .newStatus(alert.getStatus())
            .newDate(alert.getScheduledDate())
            .newPriority(alert.getPriority())
            .newTitle(alert.getTitle())
            .newAssignedTo(alert.getUserId())
            .createdBy(createdBy)
            .createdAt(LocalDateTime.now())
            .build();
    }

    /**
     * Factory method to create a history entry for status change
     */
    public static UserAlertHistoryReadModel forStatusChange(
            UserAlertReadModel alert,
            UserAlertReadModel.AlertStatus previousStatus,
            String notes,
            String changedBy) {

        AlertHistoryAction action = switch (alert.getStatus()) {
            case COMPLETED -> AlertHistoryAction.COMPLETED;
            case CANCELLED -> AlertHistoryAction.CANCELLED;
            case SNOOZED -> AlertHistoryAction.SNOOZED;
            case PENDING -> previousStatus == UserAlertReadModel.AlertStatus.SNOOZED ?
                AlertHistoryAction.REACTIVATED : AlertHistoryAction.UPDATED;
            default -> AlertHistoryAction.UPDATED;
        };

        return UserAlertHistoryReadModel.builder()
            .historyId(java.util.UUID.randomUUID().toString())
            .alertId(alert.getAlertId())
            .actionType(action)
            .previousStatus(previousStatus)
            .newStatus(alert.getStatus())
            .notes(notes)
            .createdBy(changedBy)
            .createdAt(LocalDateTime.now())
            .build();
    }

    /**
     * Factory method to create a history entry for rescheduling
     */
    public static UserAlertHistoryReadModel forReschedule(
            UserAlertReadModel alert,
            LocalDate previousDate,
            String notes,
            String changedBy) {

        return UserAlertHistoryReadModel.builder()
            .historyId(java.util.UUID.randomUUID().toString())
            .alertId(alert.getAlertId())
            .actionType(AlertHistoryAction.RESCHEDULED)
            .previousDate(previousDate)
            .newDate(alert.getScheduledDate())
            .notes(notes)
            .createdBy(changedBy)
            .createdAt(LocalDateTime.now())
            .build();
    }
}
