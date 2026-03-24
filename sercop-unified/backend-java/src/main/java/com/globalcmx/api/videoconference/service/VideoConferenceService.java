package com.globalcmx.api.videoconference.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.videoconference.config.VideoConferenceProperties;
import com.globalcmx.api.videoconference.dto.*;
import com.globalcmx.api.alerts.dto.AlertResponse;
import com.globalcmx.api.alerts.service.AlertCreationService;
import com.globalcmx.api.videoconference.entity.MeetingHistoryReadModel;
import com.globalcmx.api.videoconference.entity.MeetingHistoryReadModel.ActionType;
import com.globalcmx.api.videoconference.entity.MeetingNote;
import com.globalcmx.api.videoconference.entity.MeetingReadModel;
import com.globalcmx.api.videoconference.entity.MeetingReadModel.MeetingStatus;
import com.globalcmx.api.videoconference.provider.VideoConferenceProvider;
import com.globalcmx.api.videoconference.repository.MeetingHistoryRepository;
import com.globalcmx.api.videoconference.repository.MeetingNoteRepository;
import com.globalcmx.api.videoconference.repository.MeetingRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Main service for video conference operations.
 * Manages multiple providers and provides a unified API.
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class VideoConferenceService {

    private final VideoConferenceProperties properties;
    private final MeetingRepository meetingRepository;
    private final MeetingHistoryRepository historyRepository;
    private final MeetingNoteRepository noteRepository;
    private final List<VideoConferenceProvider> providerList;
    private final ObjectMapper objectMapper;
    private final AlertCreationService alertCreationService;

    private final Map<String, VideoConferenceProvider> providers = new HashMap<>();

    @PostConstruct
    public void init() {
        for (VideoConferenceProvider provider : providerList) {
            providers.put(provider.getProviderCode(), provider);
            log.info("Video conference provider registered: {} ({})",
                    provider.getDisplayName(), provider.getProviderCode());
        }
        log.info("VideoConferenceService initialized with {} providers. Default: {}",
                providers.size(), properties.getDefaultProvider());
    }

    /**
     * Get list of available providers with their status
     */
    public ProvidersListResponse getProviders(String userId) {
        List<ProviderStatus> providerStatuses = providers.values().stream()
                .filter(VideoConferenceProvider::isEnabled)
                .map(provider -> provider.getStatus(userId))
                .collect(Collectors.toList());

        return ProvidersListResponse.builder()
                .enabled(properties.isEnabled())
                .defaultProvider(properties.getDefaultProvider())
                .providers(providerStatuses)
                .build();
    }

    /**
     * Get OAuth authorization URL for a provider
     */
    public String getAuthorizationUrl(String providerCode, String userId, String redirectUri) {
        VideoConferenceProvider provider = getProvider(providerCode);
        return provider.getAuthorizationUrl(userId, redirectUri);
    }

    /**
     * Handle OAuth callback
     */
    public void handleOAuthCallback(String providerCode, String userId, String code, String redirectUri) {
        VideoConferenceProvider provider = getProvider(providerCode);
        provider.handleOAuthCallback(userId, code, redirectUri);
        log.info("OAuth callback handled for provider {} and user {}", providerCode, userId);
    }

    /**
     * Get OAuth connection status for a provider
     */
    public ProviderStatus getOAuthStatus(String providerCode, String userId) {
        VideoConferenceProvider provider = getProvider(providerCode);
        return provider.getStatus(userId);
    }

    /**
     * Create a new meeting
     */
    public MeetingResponse createMeeting(MeetingRequest request, String userId) {
        String providerCode = request.getProvider() != null
                ? request.getProvider()
                : properties.getDefaultProvider();

        VideoConferenceProvider provider = getProvider(providerCode);

        // Create meeting with provider
        MeetingResponse providerResponse = provider.createMeeting(request, userId);

        // Save to database
        MeetingReadModel meeting = MeetingReadModel.builder()
                .meetingId(providerResponse.getMeetingId())
                .conferenceId(providerResponse.getConferenceId())
                .provider(providerCode)
                .title(request.getTitle())
                .description(request.getDescription())
                .meetingUrl(providerResponse.getMeetingUrl())
                .calendarEventUrl(providerResponse.getCalendarEventUrl())
                .scheduledStart(request.getScheduledStart())
                .scheduledEnd(request.getScheduledEnd())
                .status(MeetingStatus.SCHEDULED)
                .operationId(request.getOperationId())
                .operationType(request.getOperationType())
                .operationReference(request.getOperationReference())
                .clientId(request.getClientId())
                .clientName(request.getClientName())
                .attendees(request.getAttendees() != null
                        ? String.join(",", request.getAttendees())
                        : null)
                .notes(request.getNotes())
                .createdBy(userId)
                .build();

        meeting = meetingRepository.save(meeting);

        // Record history
        recordHistory(meeting.getMeetingId(), ActionType.CREATED, null, meeting, userId, null);

        // Build response
        return buildMeetingResponse(meeting);
    }

    /**
     * Get meeting by ID
     */
    @Transactional(readOnly = true)
    public Optional<MeetingResponse> getMeeting(Long id) {
        return meetingRepository.findById(id)
                .map(this::buildMeetingResponse);
    }

    /**
     * Get meeting by provider's meeting ID
     */
    @Transactional(readOnly = true)
    public Optional<MeetingResponse> getMeetingByMeetingId(String meetingId) {
        return meetingRepository.findByMeetingId(meetingId)
                .map(this::buildMeetingResponse);
    }

    /**
     * Get meetings for an operation
     */
    @Transactional(readOnly = true)
    public List<MeetingResponse> getMeetingsByOperation(String operationId) {
        return meetingRepository.findByOperationIdOrderByScheduledStartDesc(operationId)
                .stream()
                .map(this::buildMeetingResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get upcoming meetings for a user
     */
    @Transactional(readOnly = true)
    public List<MeetingResponse> getUpcomingMeetings(String userId, int limit) {
        return meetingRepository.findUpcomingByUser(userId, LocalDateTime.now())
                .stream()
                .limit(limit)
                .map(this::buildMeetingResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get upcoming meetings for a user (paginated)
     */
    @Transactional(readOnly = true)
    public Page<MeetingResponse> getUpcomingMeetingsPaged(String userId, Pageable pageable) {
        return meetingRepository.findUpcomingByUserPaged(userId, LocalDateTime.now(), pageable)
                .map(this::buildMeetingResponse);
    }

    /**
     * Cancel a meeting
     */
    public MeetingResponse cancelMeeting(Long id, String reason, String userId) {
        MeetingReadModel meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Meeting not found: " + id));

        MeetingReadModel beforeState = copyMeeting(meeting);

        // Cancel with provider if connected
        try {
            VideoConferenceProvider provider = providers.get(meeting.getProvider());
            if (provider != null && provider.isConnected(userId)) {
                provider.cancelMeeting(meeting.getMeetingId(), userId);
            }
        } catch (Exception e) {
            log.warn("Could not cancel meeting with provider: {}", e.getMessage());
        }

        // Update database
        MeetingStatus previousStatus = meeting.getStatus();
        meeting.setStatus(MeetingStatus.CANCELLED);
        meeting.setCancellationReason(reason);
        meeting.setCancelledBy(userId);
        meeting.setCancelledAt(LocalDateTime.now());
        meeting = meetingRepository.save(meeting);

        // Record history
        recordHistory(
                meeting.getMeetingId(),
                ActionType.CANCELLED,
                beforeState,
                meeting,
                userId,
                reason
        );

        log.info("Meeting {} cancelled by user {}", id, userId);
        return buildMeetingResponse(meeting);
    }

    /**
     * Search meetings
     */
    @Transactional(readOnly = true)
    public Page<MeetingResponse> searchMeetings(String userId, String query, Pageable pageable) {
        return meetingRepository.searchByUser(userId, query, pageable)
                .map(this::buildMeetingResponse);
    }

    /**
     * Get meeting history
     */
    @Transactional(readOnly = true)
    public List<MeetingHistoryReadModel> getMeetingHistory(String meetingId) {
        return historyRepository.findByMeetingIdOrderByCreatedAtDesc(meetingId);
    }

    /**
     * Get provider by code
     */
    private VideoConferenceProvider getProvider(String providerCode) {
        VideoConferenceProvider provider = providers.get(providerCode);
        if (provider == null) {
            throw new IllegalArgumentException("Provider not found: " + providerCode);
        }
        if (!provider.isEnabled()) {
            throw new IllegalStateException("Provider is not enabled: " + providerCode);
        }
        return provider;
    }

    /**
     * Build MeetingResponse from entity
     */
    private MeetingResponse buildMeetingResponse(MeetingReadModel meeting) {
        return MeetingResponse.builder()
                .id(meeting.getId())
                .meetingId(meeting.getMeetingId())
                .conferenceId(meeting.getConferenceId())
                .provider(meeting.getProvider())
                .title(meeting.getTitle())
                .description(meeting.getDescription())
                .meetingUrl(meeting.getMeetingUrl())
                .calendarEventUrl(meeting.getCalendarEventUrl())
                .scheduledStart(meeting.getScheduledStart())
                .scheduledEnd(meeting.getScheduledEnd())
                .status(meeting.getStatus().name())
                .operationId(meeting.getOperationId())
                .operationType(meeting.getOperationType())
                .operationReference(meeting.getOperationReference())
                .clientId(meeting.getClientId())
                .clientName(meeting.getClientName())
                .attendees(meeting.getAttendees() != null
                        ? Arrays.asList(meeting.getAttendees().split(","))
                        : null)
                .createdBy(meeting.getCreatedBy())
                .createdAt(meeting.getCreatedAt())
                .updatedAt(meeting.getUpdatedAt())
                .build();
    }

    /**
     * Record meeting history
     */
    private void recordHistory(
            String meetingId,
            ActionType actionType,
            MeetingReadModel before,
            MeetingReadModel after,
            String userId,
            String notes) {

        try {
            MeetingHistoryReadModel.MeetingHistoryReadModelBuilder builder = MeetingHistoryReadModel.builder()
                    .meetingId(meetingId)
                    .actionType(actionType)
                    .createdBy(userId)
                    .notes(notes);

            if (before != null) {
                builder.previousStatus(before.getStatus());
                builder.previousScheduledStart(before.getScheduledStart());
                builder.previousScheduledEnd(before.getScheduledEnd());
                builder.snapshotBefore(objectMapper.writeValueAsString(before));
            }

            if (after != null) {
                builder.newStatus(after.getStatus());
                builder.newScheduledStart(after.getScheduledStart());
                builder.newScheduledEnd(after.getScheduledEnd());
                builder.snapshotAfter(objectMapper.writeValueAsString(after));
            }

            historyRepository.save(builder.build());

        } catch (Exception e) {
            log.error("Error recording meeting history: {}", e.getMessage());
        }
    }

    /**
     * Create a copy of meeting for history comparison
     */
    private MeetingReadModel copyMeeting(MeetingReadModel meeting) {
        return MeetingReadModel.builder()
                .id(meeting.getId())
                .meetingId(meeting.getMeetingId())
                .conferenceId(meeting.getConferenceId())
                .provider(meeting.getProvider())
                .title(meeting.getTitle())
                .description(meeting.getDescription())
                .meetingUrl(meeting.getMeetingUrl())
                .calendarEventUrl(meeting.getCalendarEventUrl())
                .scheduledStart(meeting.getScheduledStart())
                .scheduledEnd(meeting.getScheduledEnd())
                .status(meeting.getStatus())
                .operationId(meeting.getOperationId())
                .operationType(meeting.getOperationType())
                .operationReference(meeting.getOperationReference())
                .clientId(meeting.getClientId())
                .clientName(meeting.getClientName())
                .attendees(meeting.getAttendees())
                .notes(meeting.getNotes())
                .createdBy(meeting.getCreatedBy())
                .createdAt(meeting.getCreatedAt())
                .updatedAt(meeting.getUpdatedAt())
                .build();
    }

    // ==================== MEETING NOTES ====================

    /**
     * Add a note to a meeting
     */
    public MeetingNoteResponse addMeetingNote(Long meetingId, MeetingNoteRequest request, String userId) {
        MeetingReadModel meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new IllegalArgumentException("Meeting not found: " + meetingId));

        MeetingNote note = MeetingNote.builder()
                .meeting(meeting)
                .summary(request.getSummary())
                .agreements(request.getAgreements())
                .actionItems(request.getActionItems())
                .followUpDate(request.getFollowUpDate())
                .recordingUrl(request.getRecordingUrl())
                .createdBy(userId)
                .build();

        note = noteRepository.save(note);

        // Record in history
        recordHistory(meeting.getMeetingId(), ActionType.UPDATED, null, meeting, userId, "Added meeting note");

        log.info("Meeting note added to meeting {} by user {}", meetingId, userId);
        return buildNoteResponse(note);
    }

    /**
     * Get notes for a meeting
     */
    @Transactional(readOnly = true)
    public List<MeetingNoteResponse> getMeetingNotes(Long meetingId) {
        return noteRepository.findByMeetingId(meetingId)
                .stream()
                .map(this::buildNoteResponse)
                .collect(Collectors.toList());
    }

    /**
     * Update a meeting note
     */
    public MeetingNoteResponse updateMeetingNote(Long noteId, MeetingNoteRequest request, String userId) {
        MeetingNote note = noteRepository.findById(noteId)
                .orElseThrow(() -> new IllegalArgumentException("Note not found: " + noteId));

        note.setSummary(request.getSummary());
        note.setAgreements(request.getAgreements());
        note.setActionItems(request.getActionItems());
        note.setFollowUpDate(request.getFollowUpDate());
        note.setRecordingUrl(request.getRecordingUrl());
        note.setUpdatedBy(userId);

        note = noteRepository.save(note);

        log.info("Meeting note {} updated by user {}", noteId, userId);
        return buildNoteResponse(note);
    }

    /**
     * Delete a meeting note
     */
    public void deleteMeetingNote(Long noteId, String userId) {
        MeetingNote note = noteRepository.findById(noteId)
                .orElseThrow(() -> new IllegalArgumentException("Note not found: " + noteId));

        noteRepository.delete(note);
        log.info("Meeting note {} deleted by user {}", noteId, userId);
    }

    /**
     * Build MeetingNoteResponse from entity
     */
    private MeetingNoteResponse buildNoteResponse(MeetingNote note) {
        return MeetingNoteResponse.builder()
                .id(note.getId())
                .meetingId(note.getMeeting().getId())
                .summary(note.getSummary())
                .agreements(note.getAgreements())
                .actionItems(note.getActionItems())
                .followUpDate(note.getFollowUpDate())
                .recordingUrl(note.getRecordingUrl())
                .createdBy(note.getCreatedBy())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }

    // ==================== VIDEO CALL INVITATIONS ====================

    /**
     * Create an instant video call and send invitations to users.
     * Uses Jitsi by default for instant meetings with invitations.
     */
    public VideoCallInvitationResponse createInstantMeetingWithInvitations(
            VideoCallInvitationRequest request,
            String organizerUserId,
            String organizerName) {

        // Generate Jitsi room name (alphanumeric only, no special chars)
        String roomName = "GlobalCMX" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        // Use Jitsi community server without lobby/auth restrictions
        String serverHost = "meet.ffmuc.net";
        String meetingUrl = "https://" + serverHost + "/" + roomName;

        // Save meeting record
        MeetingReadModel meeting = MeetingReadModel.builder()
                .meetingId(roomName)
                .conferenceId(roomName)
                .provider("jitsi")
                .title(request.getTitle())
                .description(request.getDescription())
                .meetingUrl(meetingUrl)
                .scheduledStart(LocalDateTime.now())
                .scheduledEnd(LocalDateTime.now().plusHours(1))
                .status(MeetingStatus.IN_PROGRESS)
                .operationId(request.getOperationId())
                .operationType(request.getOperationType())
                .operationReference(request.getOperationReference())
                .clientId(request.getClientId())
                .clientName(request.getClientName())
                .createdBy(organizerUserId)
                .build();

        meeting = meetingRepository.save(meeting);

        // Record history
        recordHistory(meeting.getMeetingId(), ActionType.CREATED, null, meeting, organizerUserId, "Instant meeting with invitations");

        // Send invitations to all users via alert system
        List<AlertResponse> alerts = alertCreationService.createVideoConferenceInvitations(
                request.getInviteeUserIds(),
                request.getTitle(),
                request.getDescription(),
                roomName,
                meetingUrl,
                "jitsi",
                request.getOperationId(),
                request.getClientId(),
                request.getClientName(),
                organizerUserId,
                organizerName
        );

        // Build response
        List<VideoCallInvitationResponse.InvitedUser> invitedUsers = alerts.stream()
                .map(alert -> VideoCallInvitationResponse.InvitedUser.builder()
                        .userId(alert.getUserId())
                        .userName(alert.getUserName())
                        .alertId(alert.getAlertId())
                        .build())
                .collect(Collectors.toList());

        log.info("Created instant meeting {} with {} invitations by user {}",
                roomName, invitedUsers.size(), organizerUserId);

        return VideoCallInvitationResponse.builder()
                .meeting(buildMeetingResponse(meeting))
                .roomName(roomName)
                .meetingUrl(meetingUrl)
                .provider("jitsi")
                .invitedUsers(invitedUsers)
                .alertsCreated(alerts.size())
                .build();
    }
}
