package com.globalcmx.api.videoconference.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity for storing meeting notes and follow-up actions.
 * These are added after a meeting to document discussions and agreements.
 */
@Entity
@Table(name = "meeting_notes",
    indexes = {
        @Index(name = "idx_note_meeting", columnList = "meeting_id"),
        @Index(name = "idx_note_created", columnList = "created_at")
    })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Reference to the meeting
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false)
    private MeetingReadModel meeting;

    /**
     * Summary of what was discussed
     */
    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    /**
     * Agreements made during the meeting
     */
    @Column(name = "agreements", columnDefinition = "TEXT")
    private String agreements;

    /**
     * Action items / next steps
     */
    @Column(name = "action_items", columnDefinition = "TEXT")
    private String actionItems;

    /**
     * Follow-up date if scheduled
     */
    @Column(name = "follow_up_date")
    private LocalDateTime followUpDate;

    /**
     * Recording URL if the meeting was recorded
     */
    @Column(name = "recording_url", length = 500)
    private String recordingUrl;

    /**
     * Additional attachments (JSON array of URLs)
     */
    @Column(name = "attachments", columnDefinition = "TEXT")
    private String attachments;

    /**
     * User who created the note
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
     * User who last updated the note
     */
    @Column(name = "updated_by", length = 100)
    private String updatedBy;

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
}
