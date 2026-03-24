package com.globalcmx.api.videoconference.provider;

import com.globalcmx.api.videoconference.dto.MeetingRequest;
import com.globalcmx.api.videoconference.dto.MeetingResponse;
import com.globalcmx.api.videoconference.dto.ProviderStatus;

/**
 * Interface for video conference providers.
 * Implements the Strategy pattern to support multiple providers.
 */
public interface VideoConferenceProvider {

    /**
     * Gets the provider code (googlemeet, teams, jitsi)
     */
    String getProviderCode();

    /**
     * Gets the display name for the provider
     */
    String getDisplayName();

    /**
     * Checks if the provider is enabled and configured
     */
    boolean isEnabled();

    /**
     * Gets the provider status including OAuth connection state
     */
    ProviderStatus getStatus(String userId);

    /**
     * Gets the OAuth authorization URL for the provider
     */
    String getAuthorizationUrl(String userId, String redirectUri);

    /**
     * Handles OAuth callback and stores tokens
     */
    void handleOAuthCallback(String userId, String code, String redirectUri);

    /**
     * Checks if user has valid OAuth connection
     */
    boolean isConnected(String userId);

    /**
     * Creates a new meeting
     */
    MeetingResponse createMeeting(MeetingRequest request, String userId);

    /**
     * Gets meeting details
     */
    MeetingResponse getMeeting(String meetingId, String userId);

    /**
     * Cancels a meeting
     */
    void cancelMeeting(String meetingId, String userId);

    /**
     * Updates a meeting
     */
    MeetingResponse updateMeeting(String meetingId, MeetingRequest request, String userId);
}
