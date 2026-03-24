package com.globalcmx.api.videoconference.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Request DTO for creating or updating a video conference meeting.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingRequest {

    /**
     * Video conference provider to use (googlemeet, teams, jitsi)
     * If null, the default provider will be used
     */
    private String provider;

    /**
     * Meeting title
     */
    @NotBlank(message = "Title is required")
    private String title;

    /**
     * Meeting description/agenda
     */
    private String description;

    /**
     * Scheduled start time
     */
    @NotNull(message = "Scheduled start time is required")
    private LocalDateTime scheduledStart;

    /**
     * Scheduled end time
     */
    @NotNull(message = "Scheduled end time is required")
    private LocalDateTime scheduledEnd;

    /**
     * Time zone for the meeting (e.g., "America/New_York")
     */
    private String timeZone;

    /**
     * List of attendee email addresses
     */
    private List<String> attendees;

    /**
     * Related operation ID (for linking meeting to an operation)
     */
    private String operationId;

    /**
     * Type of operation (LETTER_OF_CREDIT, BANK_GUARANTEE, DOCUMENTARY_COLLECTION, FINANCING)
     */
    private String operationType;

    /**
     * Operation reference number (e.g., LC-2024-001)
     */
    private String operationReference;

    /**
     * Related client ID
     */
    private String clientId;

    /**
     * Client name for display
     */
    private String clientName;

    /**
     * Additional notes
     */
    private String notes;
}
