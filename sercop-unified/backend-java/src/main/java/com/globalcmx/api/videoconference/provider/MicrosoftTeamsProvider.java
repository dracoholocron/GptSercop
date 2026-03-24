package com.globalcmx.api.videoconference.provider;

import com.globalcmx.api.videoconference.config.VideoConferenceProperties;
import com.globalcmx.api.videoconference.dto.MeetingRequest;
import com.globalcmx.api.videoconference.dto.MeetingResponse;
import com.globalcmx.api.videoconference.dto.ProviderStatus;
import com.globalcmx.api.videoconference.service.MicrosoftOAuthTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Microsoft Teams video conference provider implementation.
 * Uses Microsoft Graph API to create Teams meetings.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "videoconference.teams", name = "enabled", havingValue = "true")
public class MicrosoftTeamsProvider implements VideoConferenceProvider {

    private static final String PROVIDER_CODE = "teams";
    private static final String DISPLAY_NAME = "Microsoft Teams";
    private static final String GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";
    private static final String OAUTH_AUTH_URL_TEMPLATE = "https://login.microsoftonline.com/%s/oauth2/v2.0/authorize";

    private final VideoConferenceProperties properties;
    private final MicrosoftOAuthTokenService tokenService;
    private final RestTemplate restTemplate;

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
        return properties.isEnabled() && properties.getTeams().isEnabled();
    }

    @Override
    public ProviderStatus getStatus(String userId) {
        boolean connected = isConnected(userId);
        return ProviderStatus.builder()
                .providerCode(PROVIDER_CODE)
                .displayName(DISPLAY_NAME)
                .enabled(isEnabled())
                .connected(connected)
                .requiresOAuth(true)
                .configured(isConfigured())
                .build();
    }

    @Override
    public String getAuthorizationUrl(String userId, String redirectUri) {
        if (!isConfigured()) {
            throw new IllegalStateException("Microsoft Teams is not configured. Missing client ID or secret.");
        }

        String state = Base64.getEncoder().encodeToString(
                (userId + ":" + System.currentTimeMillis()).getBytes()
        );

        String tenantId = getTenantId();
        String authUrl = String.format(OAUTH_AUTH_URL_TEMPLATE, tenantId);

        return UriComponentsBuilder.fromUriString(authUrl)
                .queryParam("client_id", properties.getTeams().getClientId())
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", String.join(" ", properties.getTeams().getScopes()))
                .queryParam("response_mode", "query")
                .queryParam("state", state)
                .build()
                .toUriString();
    }

    @Override
    public void handleOAuthCallback(String userId, String code, String redirectUri) {
        tokenService.exchangeCodeForTokens(userId, code, redirectUri);
    }

    @Override
    public boolean isConnected(String userId) {
        return tokenService.hasValidToken(userId);
    }

    @Override
    public MeetingResponse createMeeting(MeetingRequest request, String userId) {
        if (!isConnected(userId)) {
            throw new IllegalStateException("User is not connected to Microsoft Teams. Please authorize first.");
        }

        String accessToken = tokenService.getAccessToken(userId);

        Map<String, Object> meetingBody = buildOnlineMeeting(request);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        String url = GRAPH_API_BASE + "/me/onlineMeetings";

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(meetingBody, headers),
                    Map.class
            );

            Map<String, Object> responseBody = response.getBody();
            return mapToMeetingResponse(responseBody);

        } catch (Exception e) {
            log.error("Error creating Teams meeting: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create Teams meeting: " + e.getMessage());
        }
    }

    @Override
    public MeetingResponse getMeeting(String meetingId, String userId) {
        if (!isConnected(userId)) {
            throw new IllegalStateException("User is not connected to Microsoft Teams.");
        }

        String accessToken = tokenService.getAccessToken(userId);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        String url = GRAPH_API_BASE + "/me/onlineMeetings/" + meetingId;

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
            );

            return mapToMeetingResponse(response.getBody());

        } catch (Exception e) {
            log.error("Error getting Teams meeting: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get Teams meeting: " + e.getMessage());
        }
    }

    @Override
    public void cancelMeeting(String meetingId, String userId) {
        if (!isConnected(userId)) {
            throw new IllegalStateException("User is not connected to Microsoft Teams.");
        }

        String accessToken = tokenService.getAccessToken(userId);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        String url = GRAPH_API_BASE + "/me/onlineMeetings/" + meetingId;

        try {
            restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    new HttpEntity<>(headers),
                    Void.class
            );

            log.info("Teams meeting {} cancelled successfully", meetingId);

        } catch (Exception e) {
            log.error("Error cancelling Teams meeting: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to cancel Teams meeting: " + e.getMessage());
        }
    }

    @Override
    public MeetingResponse updateMeeting(String meetingId, MeetingRequest request, String userId) {
        if (!isConnected(userId)) {
            throw new IllegalStateException("User is not connected to Microsoft Teams.");
        }

        String accessToken = tokenService.getAccessToken(userId);

        Map<String, Object> meetingBody = buildOnlineMeeting(request);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        String url = GRAPH_API_BASE + "/me/onlineMeetings/" + meetingId;

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.PATCH,
                    new HttpEntity<>(meetingBody, headers),
                    Map.class
            );

            return mapToMeetingResponse(response.getBody());

        } catch (Exception e) {
            log.error("Error updating Teams meeting: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to update Teams meeting: " + e.getMessage());
        }
    }

    private boolean isConfigured() {
        var config = properties.getTeams();
        return config.getClientId() != null && !config.getClientId().isEmpty()
                && config.getClientSecret() != null && !config.getClientSecret().isEmpty();
    }

    private String getTenantId() {
        String tenantId = properties.getTeams().getTenantId();
        // Use "common" for multi-tenant apps if no specific tenant is configured
        return (tenantId != null && !tenantId.isEmpty()) ? tenantId : "common";
    }

    private Map<String, Object> buildOnlineMeeting(MeetingRequest request) {
        Map<String, Object> meeting = new HashMap<>();

        meeting.put("subject", request.getTitle());

        // Start time
        Map<String, String> startDateTime = new HashMap<>();
        startDateTime.put("dateTime", formatDateTime(request.getScheduledStart()));
        startDateTime.put("timeZone", request.getTimeZone() != null ? request.getTimeZone() : "UTC");
        meeting.put("startDateTime", startDateTime);

        // End time
        Map<String, String> endDateTime = new HashMap<>();
        endDateTime.put("dateTime", formatDateTime(request.getScheduledEnd()));
        endDateTime.put("timeZone", request.getTimeZone() != null ? request.getTimeZone() : "UTC");
        meeting.put("endDateTime", endDateTime);

        // Lobby settings
        Map<String, Object> lobbyBypassSettings = new HashMap<>();
        lobbyBypassSettings.put("scope", "organization"); // organizationAndFederated, everyone, or organization
        lobbyBypassSettings.put("isDialInBypassEnabled", true);
        meeting.put("lobbyBypassSettings", lobbyBypassSettings);

        // Allow attendees to turn on video and audio
        meeting.put("allowAttendeeToEnableCamera", true);
        meeting.put("allowAttendeeToEnableMic", true);

        // Participants (if attendees are specified)
        if (request.getAttendees() != null && !request.getAttendees().isEmpty()) {
            Map<String, Object> participants = new HashMap<>();
            List<Map<String, Object>> attendees = new ArrayList<>();

            for (String email : request.getAttendees()) {
                Map<String, Object> attendee = new HashMap<>();
                Map<String, Object> identity = new HashMap<>();
                Map<String, Object> user = new HashMap<>();
                // For external users, we use email identity
                user.put("displayName", email);
                identity.put("user", user);
                attendee.put("identity", identity);
                attendee.put("role", "attendee");
                attendees.add(attendee);
            }

            participants.put("attendees", attendees);
            meeting.put("participants", participants);
        }

        return meeting;
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }

    @SuppressWarnings("unchecked")
    private MeetingResponse mapToMeetingResponse(Map<String, Object> meeting) {
        MeetingResponse.MeetingResponseBuilder builder = MeetingResponse.builder()
                .meetingId((String) meeting.get("id"))
                .provider(PROVIDER_CODE)
                .title((String) meeting.get("subject"))
                .status("SCHEDULED");

        // Extract join URL
        String joinUrl = (String) meeting.get("joinWebUrl");
        if (joinUrl != null) {
            builder.meetingUrl(joinUrl);
        }

        // Parse dates
        Map<String, String> startDateTime = (Map<String, String>) meeting.get("startDateTime");
        if (startDateTime != null && startDateTime.get("dateTime") != null) {
            try {
                builder.scheduledStart(LocalDateTime.parse(
                        startDateTime.get("dateTime"),
                        DateTimeFormatter.ISO_LOCAL_DATE_TIME
                ));
            } catch (Exception e) {
                log.warn("Error parsing start date: {}", e.getMessage());
            }
        }

        Map<String, String> endDateTime = (Map<String, String>) meeting.get("endDateTime");
        if (endDateTime != null && endDateTime.get("dateTime") != null) {
            try {
                builder.scheduledEnd(LocalDateTime.parse(
                        endDateTime.get("dateTime"),
                        DateTimeFormatter.ISO_LOCAL_DATE_TIME
                ));
            } catch (Exception e) {
                log.warn("Error parsing end date: {}", e.getMessage());
            }
        }

        // Meeting code (can be used to join)
        String meetingCode = (String) meeting.get("meetingCode");
        if (meetingCode != null) {
            builder.conferenceId(meetingCode);
        }

        // Video teleconference ID
        Map<String, Object> videoTeleconferenceId = (Map<String, Object>) meeting.get("videoTeleconferenceId");
        if (videoTeleconferenceId != null) {
            builder.conferenceId((String) videoTeleconferenceId.get("id"));
        }

        return builder.build();
    }
}
