package com.globalcmx.api.videoconference.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for video conference meeting details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingResponse {

    /**
     * Internal meeting ID (from our database)
     */
    private Long id;

    /**
     * Provider's meeting ID (e.g., Google Calendar event ID)
     */
    private String meetingId;

    /**
     * Provider's conference ID (for Google Meet, Teams, etc.)
     */
    private String conferenceId;

    /**
     * Video conference provider used
     */
    private String provider;

    /**
     * Meeting title
     */
    private String title;

    /**
     * Meeting description
     */
    private String description;

    /**
     * URL to join the meeting
     */
    private String meetingUrl;

    /**
     * URL to the calendar event (if applicable)
     */
    private String calendarEventUrl;

    /**
     * Scheduled start time
     */
    private LocalDateTime scheduledStart;

    /**
     * Scheduled end time
     */
    private LocalDateTime scheduledEnd;

    /**
     * Meeting status (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
     */
    private String status;

    /**
     * Related operation ID
     */
    private String operationId;

    /**
     * Type of operation
     */
    private String operationType;

    /**
     * Operation reference number
     */
    private String operationReference;

    /**
     * Related client ID
     */
    private String clientId;

    /**
     * Client name
     */
    private String clientName;

    /**
     * List of attendee emails
     */
    private List<String> attendees;

    /**
     * User who created the meeting
     */
    private String createdBy;

    /**
     * Creation timestamp
     */
    private LocalDateTime createdAt;

    /**
     * Last update timestamp
     */
    private LocalDateTime updatedAt;
}
