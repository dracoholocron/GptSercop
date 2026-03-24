package com.globalcmx.api.videoconference.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for sending video call invitations to users.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoCallInvitationRequest {

    /**
     * Video conference provider to use (jitsi, googlemeet, teams)
     */
    private String provider;

    /**
     * Meeting title
     */
    @NotBlank(message = "Title is required")
    private String title;

    /**
     * Meeting description/notes
     */
    private String description;

    /**
     * List of user IDs to invite
     */
    @NotEmpty(message = "At least one invitee is required")
    private List<String> inviteeUserIds;

    /**
     * Related operation ID (optional)
     */
    private String operationId;

    /**
     * Operation reference (optional)
     */
    private String operationReference;

    /**
     * Operation type (optional)
     */
    private String operationType;

    /**
     * Client ID (optional)
     */
    private String clientId;

    /**
     * Client name (optional)
     */
    private String clientName;
}
