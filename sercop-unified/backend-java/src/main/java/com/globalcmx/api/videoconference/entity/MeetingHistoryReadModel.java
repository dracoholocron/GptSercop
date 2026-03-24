package com.globalcmx.api.videoconference.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Read model for meeting history/audit trail.
 * Records all changes made to meetings.
 */
@Entity
@Table(name = "meeting_history_readmodel",
    indexes = {
        @Index(name = "idx_meeting_history_meeting", columnList = "meeting_id"),
        @Index(name = "idx_meeting_history_action", columnList = "action_type"),
        @Index(name = "idx_meeting_history_created", columnList = "created_at")
    })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingHistoryReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Reference to the meeting
     */
    @Column(name = "meeting_id", length = 255, nullable = false)
    private String meetingId;

    /**
     * Type of action performed
     */
    @Column(name = "action_type", length = 50, nullable = false)
    @Enumerated(EnumType.STRING)
    private ActionType actionType;

    /**
     * Previous status (for status changes)
     */
    @Column(name = "previous_status", length = 30)
    @Enumerated(EnumType.STRING)
    private MeetingReadModel.MeetingStatus previousStatus;

    /**
     * New status (for status changes)
     */
    @Column(name = "new_status", length = 30)
    @Enumerated(EnumType.STRING)
    private MeetingReadModel.MeetingStatus newStatus;

    /**
     * Previous scheduled start (for reschedules)
     */
    @Column(name = "previous_scheduled_start")
    private LocalDateTime previousScheduledStart;

    /**
     * New scheduled start (for reschedules)
     */
    @Column(name = "new_scheduled_start")
    private LocalDateTime newScheduledStart;

    /**
     * Previous scheduled end (for reschedules)
     */
    @Column(name = "previous_scheduled_end")
    private LocalDateTime previousScheduledEnd;

    /**
     * New scheduled end (for reschedules)
     */
    @Column(name = "new_scheduled_end")
    private LocalDateTime newScheduledEnd;

    /**
     * Notes about the change
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    /**
     * JSON snapshot of the meeting before the change
     */
    @Column(name = "snapshot_before", columnDefinition = "TEXT")
    private String snapshotBefore;

    /**
     * JSON snapshot of the meeting after the change
     */
    @Column(name = "snapshot_after", columnDefinition = "TEXT")
    private String snapshotAfter;

    /**
     * User who made the change
     */
    @Column(name = "created_by", length = 100, nullable = false)
    private String createdBy;

    /**
     * Timestamp of the change
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    /**
     * Action types for meeting history
     */
    public enum ActionType {
        CREATED,
        UPDATED,
        RESCHEDULED,
        CANCELLED,
        COMPLETED,
        ATTENDEE_ADDED,
        ATTENDEE_REMOVED
    }
}
