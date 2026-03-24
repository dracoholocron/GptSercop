package com.globalcmx.api.videoconference.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for video call invitation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoCallInvitationResponse {

    /**
     * The meeting details
     */
    private MeetingResponse meeting;

    /**
     * Room name (for Jitsi)
     */
    private String roomName;

    /**
     * Meeting URL for participants to join
     */
    private String meetingUrl;

    /**
     * Provider used
     */
    private String provider;

    /**
     * List of users who were invited
     */
    private List<InvitedUser> invitedUsers;

    /**
     * Number of alerts created
     */
    private int alertsCreated;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvitedUser {
        private String userId;
        private String userName;
        private String alertId;
    }
}
