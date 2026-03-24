package com.globalcmx.api.videoconference.provider;

import com.globalcmx.api.videoconference.config.VideoConferenceProperties;
import com.globalcmx.api.videoconference.dto.MeetingRequest;
import com.globalcmx.api.videoconference.dto.MeetingResponse;
import com.globalcmx.api.videoconference.dto.ProviderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Jitsi video conference provider implementation.
 * Jitsi does not require OAuth - meetings can be created instantly.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "videoconference.jitsi", name = "enabled", havingValue = "true")
public class JitsiProvider implements VideoConferenceProvider {

    private static final String PROVIDER_CODE = "jitsi";
    private static final String DISPLAY_NAME = "Jitsi Meet";

    private final VideoConferenceProperties properties;

    @Override
    public String getProviderCode() {
        return PROVIDER_CODE;
    }

    @Override
    public String getDisplayName() {
        return DISPLAY_NAME;
    }

    @Override
    public boolean isEnabled() {
        return properties.isEnabled() && properties.getJitsi().isEnabled();
    }

    @Override
    public ProviderStatus getStatus(String userId) {
        return ProviderStatus.builder()
                .providerCode(PROVIDER_CODE)
                .displayName(DISPLAY_NAME)
                .enabled(isEnabled())
                .connected(true) // Jitsi doesn't require OAuth
                .requiresOAuth(false)
                .configured(true) // Jitsi works with default config
                .serverUrl(properties.getJitsi().getServerUrl())
                .build();
    }

    @Override
    public String getAuthorizationUrl(String userId, String redirectUri) {
        // Jitsi doesn't require OAuth
        return null;
    }

    @Override
    public void handleOAuthCallback(String userId, String code, String redirectUri) {
        // Jitsi doesn't require OAuth
    }

    @Override
    public boolean isConnected(String userId) {
        // Jitsi is always "connected" as it doesn't require authentication
        return true;
    }

    @Override
    public MeetingResponse createMeeting(MeetingRequest request, String userId) {
        String roomName = generateRoomName(request);
        String meetingUrl = buildMeetingUrl(roomName);

        log.info("Created Jitsi meeting: {} for user: {}", meetingUrl, userId);

        return MeetingResponse.builder()
                .meetingId(roomName)
                .provider(PROVIDER_CODE)
                .title(request.getTitle())
                .description(request.getDescription())
                .meetingUrl(meetingUrl)
                .scheduledStart(request.getScheduledStart())
                .scheduledEnd(request.getScheduledEnd())
                .status("SCHEDULED")
                .build();
    }

    @Override
    public MeetingResponse getMeeting(String meetingId, String userId) {
        // Jitsi meetings are ephemeral - we can only return the URL
        return MeetingResponse.builder()
                .meetingId(meetingId)
                .provider(PROVIDER_CODE)
                .meetingUrl(buildMeetingUrl(meetingId))
                .status("ACTIVE")
                .build();
    }

    @Override
    public void cancelMeeting(String meetingId, String userId) {
        // Jitsi meetings are ephemeral - nothing to cancel
        log.info("Jitsi meeting {} marked as cancelled (no actual cancellation needed)", meetingId);
    }

    @Override
    public MeetingResponse updateMeeting(String meetingId, MeetingRequest request, String userId) {
        // Jitsi meetings cannot be updated - return the same meeting with new details
        return MeetingResponse.builder()
                .meetingId(meetingId)
                .provider(PROVIDER_CODE)
                .title(request.getTitle())
                .description(request.getDescription())
                .meetingUrl(buildMeetingUrl(meetingId))
                .scheduledStart(request.getScheduledStart())
                .scheduledEnd(request.getScheduledEnd())
                .status("SCHEDULED")
                .build();
    }

    private String generateRoomName(MeetingRequest request) {
        // Generate a URL-safe room name
        String baseName = request.getTitle() != null
                ? request.getTitle().replaceAll("[^a-zA-Z0-9]", "").substring(0, Math.min(20, request.getTitle().length()))
                : "Meeting";
        String uniqueId = UUID.randomUUID().toString().substring(0, 8);
        return baseName + "-" + uniqueId;
    }

    private String buildMeetingUrl(String roomName) {
        String serverUrl = properties.getJitsi().getServerUrl();
        if (!serverUrl.endsWith("/")) {
            serverUrl += "/";
        }
        return serverUrl + roomName;
    }
}
