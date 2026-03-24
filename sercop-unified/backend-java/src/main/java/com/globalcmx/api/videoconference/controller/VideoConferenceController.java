package com.globalcmx.api.videoconference.controller;

import com.globalcmx.api.videoconference.dto.*;
import com.globalcmx.api.videoconference.entity.MeetingHistoryReadModel;
import com.globalcmx.api.videoconference.entity.MeetingReadModel;
import com.globalcmx.api.videoconference.service.VideoConferenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for video conference operations.
 */
@RestController
@RequestMapping("/video-conference")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Video Conference", description = "Video conference meeting management")
public class VideoConferenceController {

    private final VideoConferenceService videoConferenceService;

    // ==================== PROVIDERS ====================

    @GetMapping("/providers")
    @Operation(summary = "List providers", description = "Get available video conference providers and their status")
    public ResponseEntity<ProvidersListResponse> getProviders(
            @AuthenticationPrincipal UserDetails userDetails) {

        ProvidersListResponse response = videoConferenceService.getProviders(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    // ==================== OAUTH ====================

    @GetMapping("/oauth/{provider}/authorize")
    @Operation(summary = "Get OAuth URL", description = "Get OAuth authorization URL for a provider")
    public ResponseEntity<Map<String, String>> getAuthorizationUrl(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String provider,
            HttpServletRequest request) {

        String redirectUri = buildRedirectUri(request, provider);
        String authUrl = videoConferenceService.getAuthorizationUrl(
                provider, userDetails.getUsername(), redirectUri);

        return ResponseEntity.ok(Map.of(
                "authorizationUrl", authUrl,
                "provider", provider
        ));
    }

    @GetMapping("/oauth/{provider}/callback")
    @Operation(summary = "OAuth callback", description = "Handle OAuth callback from provider")
    public ResponseEntity<String> handleOAuthCallback(
            @PathVariable String provider,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String state,
            HttpServletRequest request) {

        String resultJson;

        if (error != null) {
            log.error("OAuth error for provider {}: {}", provider, error);
            resultJson = String.format("{\"success\":false,\"error\":\"%s\",\"provider\":\"%s\"}", error, provider);
        } else if (code == null) {
            resultJson = String.format("{\"success\":false,\"error\":\"No authorization code received\",\"provider\":\"%s\"}", provider);
        } else {
            try {
                // Extract userId from state (Base64 encoded "userId:timestamp")
                String userId = "unknown";
                if (state != null && !state.isEmpty()) {
                    try {
                        String decoded = new String(java.util.Base64.getDecoder().decode(state));
                        userId = decoded.split(":")[0];
                    } catch (Exception e) {
                        log.warn("Failed to decode state: {}", e.getMessage());
                    }
                }

                String redirectUri = buildRedirectUri(request, provider);
                videoConferenceService.handleOAuthCallback(provider, userId, code, redirectUri);
                resultJson = String.format("{\"success\":true,\"provider\":\"%s\",\"message\":\"Successfully connected\"}", provider);
            } catch (Exception e) {
                log.error("OAuth callback error: {}", e.getMessage(), e);
                resultJson = String.format("{\"success\":false,\"error\":\"%s\",\"provider\":\"%s\"}",
                        e.getMessage().replace("\"", "'"), provider);
            }
        }

        // Return HTML that closes popup and notifies parent window
        String html = String.format("""
            <!DOCTYPE html>
            <html>
            <head><title>OAuth Callback</title></head>
            <body>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'oauth_callback',
                            provider: '%s',
                            result: %s
                        }, '*');
                        window.close();
                    } else {
                        document.body.innerHTML = '<h3>Conexión exitosa. Puedes cerrar esta ventana.</h3>';
                    }
                </script>
                <noscript><h3>Conexión procesada. Puedes cerrar esta ventana.</h3></noscript>
            </body>
            </html>
            """, provider, resultJson);

        return ResponseEntity.ok()
                .header("Content-Type", "text/html")
                .body(html);
    }

    @GetMapping("/oauth/{provider}/status")
    @Operation(summary = "OAuth status", description = "Get OAuth connection status for a provider")
    public ResponseEntity<ProviderStatus> getOAuthStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String provider) {

        ProviderStatus status = videoConferenceService.getOAuthStatus(
                provider, userDetails.getUsername());
        return ResponseEntity.ok(status);
    }

    // ==================== MEETINGS ====================

    @PostMapping("/meetings")
    @Operation(summary = "Create meeting", description = "Create a new video conference meeting")
    public ResponseEntity<MeetingResponse> createMeeting(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody MeetingRequest request) {

        MeetingResponse response = videoConferenceService.createMeeting(
                request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/meetings/{id}")
    @Operation(summary = "Get meeting", description = "Get meeting details by ID")
    public ResponseEntity<MeetingResponse> getMeeting(@PathVariable Long id) {
        return videoConferenceService.getMeeting(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/meetings/{id}/cancel")
    @Operation(summary = "Cancel meeting", description = "Cancel a scheduled meeting")
    public ResponseEntity<MeetingResponse> cancelMeeting(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {

        MeetingResponse response = videoConferenceService.cancelMeeting(
                id, reason, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/meetings/{id}/history")
    @Operation(summary = "Get meeting history", description = "Get audit history for a meeting")
    public ResponseEntity<List<MeetingHistoryReadModel>> getMeetingHistory(
            @PathVariable Long id) {

        return videoConferenceService.getMeeting(id)
                .map(meeting -> {
                    List<MeetingHistoryReadModel> history =
                            videoConferenceService.getMeetingHistory(meeting.getMeetingId());
                    return ResponseEntity.ok(history);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ==================== QUERIES ====================

    @GetMapping("/meetings/by-operation/{operationId}")
    @Operation(summary = "Get by operation", description = "Get all meetings linked to an operation")
    public ResponseEntity<List<MeetingResponse>> getMeetingsByOperation(
            @PathVariable String operationId) {

        List<MeetingResponse> meetings = videoConferenceService.getMeetingsByOperation(operationId);
        return ResponseEntity.ok(meetings);
    }

    @GetMapping("/meetings/upcoming")
    @Operation(summary = "Get upcoming", description = "Get upcoming meetings for current user")
    public ResponseEntity<List<MeetingResponse>> getUpcomingMeetings(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "10") int limit) {

        List<MeetingResponse> meetings = videoConferenceService.getUpcomingMeetings(
                userDetails.getUsername(), limit);
        return ResponseEntity.ok(meetings);
    }

    @GetMapping("/meetings/upcoming/paged")
    @Operation(summary = "Get upcoming (paged)", description = "Get upcoming meetings with pagination")
    public ResponseEntity<Page<MeetingResponse>> getUpcomingMeetingsPaged(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {

        Page<MeetingResponse> meetings = videoConferenceService.getUpcomingMeetingsPaged(
                userDetails.getUsername(), pageable);
        return ResponseEntity.ok(meetings);
    }

    @GetMapping("/meetings/search")
    @Operation(summary = "Search meetings", description = "Search meetings by title, description, or client")
    public ResponseEntity<Page<MeetingResponse>> searchMeetings(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String q,
            Pageable pageable) {

        Page<MeetingResponse> results = videoConferenceService.searchMeetings(
                userDetails.getUsername(), q, pageable);
        return ResponseEntity.ok(results);
    }

    // ==================== INSTANT MEETING WITH INVITATIONS ====================

    @PostMapping("/instant-meeting")
    @Operation(summary = "Create instant meeting with invitations",
            description = "Create an instant Jitsi meeting and send alerts to invited users")
    public ResponseEntity<VideoCallInvitationResponse> createInstantMeetingWithInvitations(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody VideoCallInvitationRequest request) {

        String organizerName = userDetails.getUsername(); // TODO: Get full name from user service

        VideoCallInvitationResponse response = videoConferenceService.createInstantMeetingWithInvitations(
                request, userDetails.getUsername(), organizerName);

        return ResponseEntity.ok(response);
    }

    // ==================== MEETING NOTES ====================

    @PostMapping("/meetings/{id}/notes")
    @Operation(summary = "Add note", description = "Add a note to a meeting")
    public ResponseEntity<MeetingNoteResponse> addMeetingNote(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody MeetingNoteRequest request) {

        MeetingNoteResponse response = videoConferenceService.addMeetingNote(
                id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/meetings/{id}/notes")
    @Operation(summary = "Get notes", description = "Get all notes for a meeting")
    public ResponseEntity<List<MeetingNoteResponse>> getMeetingNotes(@PathVariable Long id) {
        List<MeetingNoteResponse> notes = videoConferenceService.getMeetingNotes(id);
        return ResponseEntity.ok(notes);
    }

    @PutMapping("/notes/{noteId}")
    @Operation(summary = "Update note", description = "Update a meeting note")
    public ResponseEntity<MeetingNoteResponse> updateMeetingNote(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long noteId,
            @Valid @RequestBody MeetingNoteRequest request) {

        MeetingNoteResponse response = videoConferenceService.updateMeetingNote(
                noteId, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/notes/{noteId}")
    @Operation(summary = "Delete note", description = "Delete a meeting note")
    public ResponseEntity<Void> deleteMeetingNote(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long noteId) {

        videoConferenceService.deleteMeetingNote(noteId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    // ==================== HELPERS ====================

    /**
     * Build the OAuth redirect URI based on the current request
     */
    private String buildRedirectUri(HttpServletRequest request, String provider) {
        // Use a fixed base URL for OAuth callbacks to avoid proxy issues
        // Default to localhost:8080 for development
        String baseUrl = System.getenv("VIDEO_CONFERENCE_CALLBACK_BASE_URL");
        if (baseUrl == null || baseUrl.isEmpty()) {
            baseUrl = "http://localhost:8080/api";
        }

        String redirectUri = baseUrl + "/video-conference/oauth/" + provider + "/callback";
        log.debug("OAuth redirect URI: {}", redirectUri);
        return redirectUri;
    }
}
