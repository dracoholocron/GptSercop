/**
 * Video Conference Service
 * Handles video conference API operations
 */
import { apiClient } from '../config/api.client';
import { buildUrlWithParams } from '../config/api.routes';
import type {
  VideoProvider,
  ProviderStatus,
  ProvidersListResponse,
  MeetingRequest,
  MeetingResponse,
  MeetingHistoryEntry,
  AuthorizationUrlResponse,
  OAuthCallbackResult,
  MeetingNoteRequest,
  MeetingNoteResponse,
  VideoCallInvitationRequest,
  VideoCallInvitationResponse,
} from '../types/videoConference';

// ============================================================================
// API ROUTES
// ============================================================================

export const VIDEO_CONFERENCE_ROUTES = {
  // Providers
  PROVIDERS: '/video-conference/providers',

  // OAuth
  OAUTH_AUTHORIZE: (provider: string) => `/video-conference/oauth/${provider}/authorize`,
  OAUTH_CALLBACK: (provider: string) => `/video-conference/oauth/${provider}/callback`,
  OAUTH_STATUS: (provider: string) => `/video-conference/oauth/${provider}/status`,

  // Meetings
  MEETINGS: '/video-conference/meetings',
  MEETING_BY_ID: (id: number) => `/video-conference/meetings/${id}`,
  MEETING_CANCEL: (id: number) => `/video-conference/meetings/${id}/cancel`,
  MEETING_HISTORY: (id: number) => `/video-conference/meetings/${id}/history`,

  // Queries
  MEETINGS_BY_OPERATION: (operationId: string) =>
    `/video-conference/meetings/by-operation/${operationId}`,
  MEETINGS_UPCOMING: '/video-conference/meetings/upcoming',
  MEETINGS_UPCOMING_PAGED: '/video-conference/meetings/upcoming/paged',
  MEETINGS_SEARCH: '/video-conference/meetings/search',

  // Meeting Notes
  MEETING_NOTES: (meetingId: number) => `/video-conference/meetings/${meetingId}/notes`,
  NOTE_BY_ID: (noteId: number) => `/video-conference/notes/${noteId}`,

  // Instant Meeting with Invitations
  INSTANT_MEETING: '/video-conference/instant-meeting',
} as const;

// ============================================================================
// PROVIDER FUNCTIONS
// ============================================================================

/**
 * Get available video conference providers and their status
 */
export async function getProviders(): Promise<ProvidersListResponse> {
  const response = await apiClient.get<ProvidersListResponse>(VIDEO_CONFERENCE_ROUTES.PROVIDERS);
  return response.data;
}

/**
 * Get OAuth status for a specific provider
 */
export async function getOAuthStatus(provider: VideoProvider): Promise<ProviderStatus> {
  const response = await apiClient.get<ProviderStatus>(
    VIDEO_CONFERENCE_ROUTES.OAUTH_STATUS(provider)
  );
  return response.data;
}

/**
 * Get OAuth authorization URL for a provider
 */
export async function getAuthorizationUrl(
  provider: VideoProvider
): Promise<AuthorizationUrlResponse> {
  const response = await apiClient.get<AuthorizationUrlResponse>(
    VIDEO_CONFERENCE_ROUTES.OAUTH_AUTHORIZE(provider)
  );
  return response.data;
}

/**
 * Initiate OAuth flow for a provider
 * Opens a popup window for authorization
 */
export function initiateOAuthFlow(provider: VideoProvider): Promise<OAuthCallbackResult> {
  return new Promise((resolve, reject) => {
    getAuthorizationUrl(provider)
      .then(({ authorizationUrl }) => {
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          authorizationUrl,
          'oauth_popup',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        if (!popup) {
          reject(new Error('Failed to open popup window. Please allow popups for this site.'));
          return;
        }

        // Listen for callback message from popup
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'oauth_callback' && event.data?.provider === provider) {
            window.removeEventListener('message', handleMessage);
            popup.close();
            resolve(event.data.result);
          }
        };

        window.addEventListener('message', handleMessage);

        // Check if popup was closed without completing auth
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            resolve({ success: false, error: 'Authorization cancelled' });
          }
        }, 500);
      })
      .catch(reject);
  });
}

// ============================================================================
// MEETING FUNCTIONS
// ============================================================================

/**
 * Create a new video conference meeting
 */
export async function createMeeting(request: MeetingRequest): Promise<MeetingResponse> {
  const response = await apiClient.post<MeetingResponse>(VIDEO_CONFERENCE_ROUTES.MEETINGS, request);
  return response.data;
}

/**
 * Get meeting by ID
 */
export async function getMeeting(id: number): Promise<MeetingResponse> {
  const response = await apiClient.get<MeetingResponse>(VIDEO_CONFERENCE_ROUTES.MEETING_BY_ID(id));
  return response.data;
}

/**
 * Cancel a meeting
 */
export async function cancelMeeting(id: number, reason?: string): Promise<MeetingResponse> {
  const url = buildUrlWithParams(VIDEO_CONFERENCE_ROUTES.MEETING_CANCEL(id), { reason });
  const response = await apiClient.post<MeetingResponse>(url, {});
  return response.data;
}

/**
 * Get meeting history
 */
export async function getMeetingHistory(id: number): Promise<MeetingHistoryEntry[]> {
  const response = await apiClient.get<MeetingHistoryEntry[]>(
    VIDEO_CONFERENCE_ROUTES.MEETING_HISTORY(id)
  );
  return response.data;
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get meetings for an operation
 */
export async function getMeetingsByOperation(operationId: string): Promise<MeetingResponse[]> {
  const response = await apiClient.get<MeetingResponse[]>(
    VIDEO_CONFERENCE_ROUTES.MEETINGS_BY_OPERATION(operationId)
  );
  return response.data;
}

/**
 * Get upcoming meetings
 */
export async function getUpcomingMeetings(limit = 10): Promise<MeetingResponse[]> {
  const url = buildUrlWithParams(VIDEO_CONFERENCE_ROUTES.MEETINGS_UPCOMING, { limit });
  const response = await apiClient.get<MeetingResponse[]>(url);
  return response.data;
}

/**
 * Get upcoming meetings with pagination
 */
export async function getUpcomingMeetingsPaged(
  page = 0,
  size = 20
): Promise<{ content: MeetingResponse[]; totalElements: number; totalPages: number }> {
  const url = buildUrlWithParams(VIDEO_CONFERENCE_ROUTES.MEETINGS_UPCOMING_PAGED, { page, size });
  const response = await apiClient.get<{
    content: MeetingResponse[];
    totalElements: number;
    totalPages: number;
  }>(url);
  return response.data;
}

/**
 * Search meetings
 */
export async function searchMeetings(
  query: string,
  page = 0,
  size = 20
): Promise<{ content: MeetingResponse[]; totalElements: number; totalPages: number }> {
  const url = buildUrlWithParams(VIDEO_CONFERENCE_ROUTES.MEETINGS_SEARCH, { q: query, page, size });
  const response = await apiClient.get<{
    content: MeetingResponse[];
    totalElements: number;
    totalPages: number;
  }>(url);
  return response.data;
}

// ============================================================================
// MEETING NOTES FUNCTIONS
// ============================================================================

/**
 * Add a note to a meeting
 */
export async function addMeetingNote(
  meetingId: number,
  note: MeetingNoteRequest
): Promise<MeetingNoteResponse> {
  const response = await apiClient.post<MeetingNoteResponse>(
    VIDEO_CONFERENCE_ROUTES.MEETING_NOTES(meetingId),
    note
  );
  return response.data;
}

/**
 * Get notes for a meeting
 */
export async function getMeetingNotes(meetingId: number): Promise<MeetingNoteResponse[]> {
  const response = await apiClient.get<MeetingNoteResponse[]>(
    VIDEO_CONFERENCE_ROUTES.MEETING_NOTES(meetingId)
  );
  return response.data;
}

/**
 * Update a meeting note
 */
export async function updateMeetingNote(
  noteId: number,
  note: MeetingNoteRequest
): Promise<MeetingNoteResponse> {
  const response = await apiClient.put<MeetingNoteResponse>(
    VIDEO_CONFERENCE_ROUTES.NOTE_BY_ID(noteId),
    note
  );
  return response.data;
}

/**
 * Delete a meeting note
 */
export async function deleteMeetingNote(noteId: number): Promise<void> {
  await apiClient.delete(VIDEO_CONFERENCE_ROUTES.NOTE_BY_ID(noteId));
}

// ============================================================================
// INSTANT MEETING WITH INVITATIONS
// ============================================================================

/**
 * Create an instant meeting with invitations
 * Creates a Jitsi meeting and sends alerts to invited users
 */
export async function createInstantMeetingWithInvitations(
  request: VideoCallInvitationRequest
): Promise<VideoCallInvitationResponse> {
  const response = await apiClient.post<VideoCallInvitationResponse>(
    VIDEO_CONFERENCE_ROUTES.INSTANT_MEETING,
    request
  );
  return response.data;
}
