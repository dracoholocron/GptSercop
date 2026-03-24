package com.globalcmx.api.videoconference.provider;

import com.globalcmx.api.videoconference.config.VideoConferenceProperties;
import com.globalcmx.api.videoconference.dto.MeetingRequest;
import com.globalcmx.api.videoconference.dto.MeetingResponse;
import com.globalcmx.api.videoconference.dto.ProviderStatus;
import com.globalcmx.api.videoconference.service.GoogleOAuthTokenService;
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
 * Google Meet video conference provider implementation.
 * Uses Google Calendar API to create meetings with Google Meet links.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "videoconference.googlemeet", name = "enabled", havingValue = "true", matchIfMissing = true)
public class GoogleMeetProvider implements VideoConferenceProvider {

    private static final String PROVIDER_CODE = "googlemeet";
    private static final String DISPLAY_NAME = "Google Meet";
    private static final String CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";
    private static final String OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

    private final VideoConferenceProperties properties;
    private final GoogleOAuthTokenService tokenService;
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
        return properties.isEnabled() && properties.getGooglemeet().isEnabled();
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
            throw new IllegalStateException("Google Meet is not configured. Missing client ID or secret.");
        }

        String state = Base64.getEncoder().encodeToString(
                (userId + ":" + System.currentTimeMillis()).getBytes()
        );

        return UriComponentsBuilder.fromUriString(OAUTH_AUTH_URL)
                .queryParam("client_id", properties.getGooglemeet().getClientId())
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", String.join(" ", properties.getGooglemeet().getScopes()))
                .queryParam("access_type", "offline")
                .queryParam("prompt", "consent")
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
            throw new IllegalStateException("User is not connected to Google Meet. Please authorize first.");
        }

        String accessToken = tokenService.getAccessToken(userId);

        Map<String, Object> event = buildCalendarEvent(request);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        String url = CALENDAR_API_BASE + "/calendars/primary/events?conferenceDataVersion=1";

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(event, headers),
                    Map.class
            );

            Map<String, Object> responseBody = response.getBody();
            return mapToMeetingResponse(responseBody);

        } catch (Exception e) {
            log.error("Error creating Google Meet meeting: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create Google Meet meeting: " + e.getMessage());
        }
    }

    @Override
    public MeetingResponse getMeeting(String meetingId, String userId) {
        if (!isConnected(userId)) {
            throw new IllegalStateException("User is not connected to Google Meet.");
        }

        String accessToken = tokenService.getAccessToken(userId);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        String url = CALENDAR_API_BASE + "/calendars/primary/events/" + meetingId;

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
            );

            return mapToMeetingResponse(response.getBody());

        } catch (Exception e) {
            log.error("Error getting Google Meet meeting: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get Google Meet meeting: " + e.getMessage());
        }
    }

    @Override
    public void cancelMeeting(String meetingId, String userId) {
        if (!isConnected(userId)) {
            throw new IllegalStateException("User is not connected to Google Meet.");
        }

        String accessToken = tokenService.getAccessToken(userId);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        String url = CALENDAR_API_BASE + "/calendars/primary/events/" + meetingId;

        try {
            restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    new HttpEntity<>(headers),
                    Void.class
            );

            log.info("Meeting {} cancelled successfully", meetingId);

        } catch (Exception e) {
            log.error("Error cancelling Google Meet meeting: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to cancel Google Meet meeting: " + e.getMessage());
        }
    }

    @Override
    public MeetingResponse updateMeeting(String meetingId, MeetingRequest request, String userId) {
        if (!isConnected(userId)) {
            throw new IllegalStateException("User is not connected to Google Meet.");
        }

        String accessToken = tokenService.getAccessToken(userId);

        Map<String, Object> event = buildCalendarEvent(request);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        String url = CALENDAR_API_BASE + "/calendars/primary/events/" + meetingId + "?conferenceDataVersion=1";

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    new HttpEntity<>(event, headers),
                    Map.class
            );

            return mapToMeetingResponse(response.getBody());

        } catch (Exception e) {
            log.error("Error updating Google Meet meeting: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to update Google Meet meeting: " + e.getMessage());
        }
    }

    private boolean isConfigured() {
        var config = properties.getGooglemeet();
        return config.getClientId() != null && !config.getClientId().isEmpty()
                && config.getClientSecret() != null && !config.getClientSecret().isEmpty();
    }

    private Map<String, Object> buildCalendarEvent(MeetingRequest request) {
        Map<String, Object> event = new HashMap<>();

        event.put("summary", request.getTitle());
        if (request.getDescription() != null) {
            event.put("description", request.getDescription());
        }

        // Start time
        Map<String, String> start = new HashMap<>();
        start.put("dateTime", formatDateTime(request.getScheduledStart()));
        start.put("timeZone", request.getTimeZone() != null ? request.getTimeZone() : "UTC");
        event.put("start", start);

        // End time
        Map<String, String> end = new HashMap<>();
        end.put("dateTime", formatDateTime(request.getScheduledEnd()));
        end.put("timeZone", request.getTimeZone() != null ? request.getTimeZone() : "UTC");
        event.put("end", end);

        // Attendees
        if (request.getAttendees() != null && !request.getAttendees().isEmpty()) {
            List<Map<String, String>> attendees = new ArrayList<>();
            for (String email : request.getAttendees()) {
                Map<String, String> attendee = new HashMap<>();
                attendee.put("email", email);
                attendees.add(attendee);
            }
            event.put("attendees", attendees);
        }

        // Conference data for Google Meet
        Map<String, Object> conferenceData = new HashMap<>();
        Map<String, Object> createRequest = new HashMap<>();
        createRequest.put("requestId", UUID.randomUUID().toString());
        Map<String, String> conferenceSolutionKey = new HashMap<>();
        conferenceSolutionKey.put("type", "hangoutsMeet");
        createRequest.put("conferenceSolutionKey", conferenceSolutionKey);
        conferenceData.put("createRequest", createRequest);
        event.put("conferenceData", conferenceData);

        return event;
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime.atZone(ZoneId.of("UTC"))
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }

    @SuppressWarnings("unchecked")
    private MeetingResponse mapToMeetingResponse(Map<String, Object> event) {
        MeetingResponse.MeetingResponseBuilder builder = MeetingResponse.builder()
                .meetingId((String) event.get("id"))
                .provider(PROVIDER_CODE)
                .title((String) event.get("summary"))
                .description((String) event.get("description"))
                .status(mapEventStatus((String) event.get("status")));

        // Parse dates
        Map<String, String> start = (Map<String, String>) event.get("start");
        if (start != null && start.get("dateTime") != null) {
            builder.scheduledStart(LocalDateTime.parse(
                    start.get("dateTime"),
                    DateTimeFormatter.ISO_OFFSET_DATE_TIME
            ));
        }

        Map<String, String> end = (Map<String, String>) event.get("end");
        if (end != null && end.get("dateTime") != null) {
            builder.scheduledEnd(LocalDateTime.parse(
                    end.get("dateTime"),
                    DateTimeFormatter.ISO_OFFSET_DATE_TIME
            ));
        }

        // Extract Meet link
        Map<String, Object> conferenceData = (Map<String, Object>) event.get("conferenceData");
        if (conferenceData != null) {
            List<Map<String, Object>> entryPoints = (List<Map<String, Object>>) conferenceData.get("entryPoints");
            if (entryPoints != null) {
                for (Map<String, Object> entryPoint : entryPoints) {
                    if ("video".equals(entryPoint.get("entryPointType"))) {
                        builder.meetingUrl((String) entryPoint.get("uri"));
                        break;
                    }
                }
            }
            builder.conferenceId((String) conferenceData.get("conferenceId"));
        }

        // HTML link as fallback
        if (event.get("htmlLink") != null) {
            builder.calendarEventUrl((String) event.get("htmlLink"));
        }

        return builder.build();
    }

    private String mapEventStatus(String googleStatus) {
        if (googleStatus == null) return "SCHEDULED";
        return switch (googleStatus) {
            case "confirmed" -> "SCHEDULED";
            case "tentative" -> "PENDING";
            case "cancelled" -> "CANCELLED";
            default -> "SCHEDULED";
        };
    }
}
