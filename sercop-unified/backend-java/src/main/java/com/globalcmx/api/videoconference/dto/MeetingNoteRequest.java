package com.globalcmx.api.videoconference.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Request DTO for creating or updating meeting notes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingNoteRequest {

    /**
     * Summary of what was discussed
     */
    private String summary;

    /**
     * Agreements made during the meeting
     */
    private String agreements;

    /**
     * Action items / next steps
     */
    private String actionItems;

    /**
     * Follow-up date if scheduled
     */
    private LocalDateTime followUpDate;

    /**
     * Recording URL if the meeting was recorded
     */
    private String recordingUrl;
}
