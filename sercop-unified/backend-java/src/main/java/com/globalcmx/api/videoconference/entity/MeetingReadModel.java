package com.globalcmx.api.videoconference.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Read model for video conference meetings.
 * Stores meeting records for auditing and retrieval.
 */
@Entity
@Table(name = "meeting_readmodel",
    indexes = {
        @Index(name = "idx_meeting_operation", columnList = "operation_id"),
        @Index(name = "idx_meeting_client", columnList = "client_id"),
        @Index(name = "idx_meeting_provider", columnList = "provider"),
        @Index(name = "idx_meeting_status", columnList = "status"),
        @Index(name = "idx_meeting_scheduled", columnList = "scheduled_start, status"),
        @Index(name = "idx_meeting_created_by", columnList = "created_by, scheduled_start")
    })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Provider's meeting ID (e.g., Google Calendar event ID)
     */
    @Column(name = "meeting_id", length = 255, unique = true)
    private String meetingId;

    /**
     * Provider's conference ID
     */
    @Column(name = "conference_id", length = 255)
    private String conferenceId;

    /**
     * Related operation ID (if any)
     */
    @Column(name = "operation_id", length = 100)
    private String operationId;

    /**
     * Type of operation (LETTER_OF_CREDIT, BANK_GUARANTEE, DOCUMENTARY_COLLECTION, FINANCING)
     */
    @Column(name = "operation_type", length = 50)
    private String operationType;

    /**
     * Operation reference number (e.g., LC-2024-001)
     */
    @Column(name = "operation_reference", length = 100)
    private String operationReference;

    /**
     * Video conference provider (googlemeet, teams, jitsi)
     */
    @Column(name = "provider", length = 50, nullable = false)
    private String provider;

    /**
     * URL to join the meeting
     */
    @Column(name = "meeting_url", length = 500)
    private String meetingUrl;

    /**
     * URL to the calendar event
     */
    @Column(name = "calendar_event_url", length = 500)
    private String calendarEventUrl;

    /**
     * Meeting title
     */
    @Column(name = "title", length = 300, nullable = false)
    private String title;

    /**
     * Meeting description
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Scheduled start time
     */
    @Column(name = "scheduled_start", nullable = false)
    private LocalDateTime scheduledStart;

    /**
     * Scheduled end time
     */
    @Column(name = "scheduled_end", nullable = false)
    private LocalDateTime scheduledEnd;

    /**
     * Meeting status
     */
    @Column(name = "status", length = 30, nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private MeetingStatus status = MeetingStatus.SCHEDULED;

    /**
     * Related client ID
     */
    @Column(name = "client_id", length = 100)
    private String clientId;

    /**
     * Client name
     */
    @Column(name = "client_name", length = 200)
    private String clientName;

    /**
     * Attendees (comma-separated emails)
     */
    @Column(name = "attendees", columnDefinition = "TEXT")
    private String attendees;

    /**
     * Additional notes
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    /**
     * User who created the meeting
     */
    @Column(name = "created_by", length = 100, nullable = false)
    private String createdBy;

    /**
     * Creation timestamp
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * Last update timestamp
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * User who last updated the meeting
     */
    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    /**
     * Cancellation reason (if cancelled)
     */
    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    /**
     * Cancelled by user
     */
    @Column(name = "cancelled_by", length = 100)
    private String cancelledBy;

    /**
     * Cancellation timestamp
     */
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Meeting status enum
     */
    public enum MeetingStatus {
        SCHEDULED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED,
        PENDING
    }
}
