/**
 * Video Conference Types
 * TypeScript definitions for video conference features
 */

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export type VideoProvider = 'googlemeet' | 'teams' | 'jitsi';

export interface ProviderStatus {
  providerCode: VideoProvider;
  displayName: string;
  enabled: boolean;
  configured: boolean;
  requiresOAuth: boolean;
  connected: boolean;
  authorizationUrl?: string;
  serverUrl?: string;
  message?: string;
}

export interface ProvidersListResponse {
  enabled: boolean;
  defaultProvider: VideoProvider;
  providers: ProviderStatus[];
}

// ============================================================================
// MEETING TYPES
// ============================================================================

export type MeetingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PENDING';

export type OperationType =
  | 'LETTER_OF_CREDIT'
  | 'BANK_GUARANTEE'
  | 'DOCUMENTARY_COLLECTION'
  | 'FINANCING';

export interface MeetingRequest {
  provider?: VideoProvider;
  title: string;
  description?: string;
  scheduledStart: string; // ISO datetime
  scheduledEnd: string;   // ISO datetime
  timeZone?: string;
  attendees?: string[];
  operationId?: string;
  operationType?: OperationType;
  operationReference?: string;
  clientId?: string;
  clientName?: string;
  notes?: string;
}

export interface MeetingResponse {
  id: number;
  meetingId: string;
  conferenceId?: string;
  provider: VideoProvider;
  title: string;
  description?: string;
  meetingUrl: string;
  calendarEventUrl?: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: MeetingStatus;
  operationId?: string;
  operationType?: OperationType;
  operationReference?: string;
  clientId?: string;
  clientName?: string;
  attendees?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// HISTORY TYPES
// ============================================================================

export type MeetingActionType =
  | 'CREATED'
  | 'UPDATED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'ATTENDEE_ADDED'
  | 'ATTENDEE_REMOVED';

export interface MeetingHistoryEntry {
  id: number;
  meetingId: string;
  actionType: MeetingActionType;
  previousStatus?: MeetingStatus;
  newStatus?: MeetingStatus;
  previousScheduledStart?: string;
  newScheduledStart?: string;
  previousScheduledEnd?: string;
  newScheduledEnd?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

// ============================================================================
// OAUTH TYPES
// ============================================================================

export interface OAuthCallbackResult {
  success: boolean;
  provider?: VideoProvider;
  error?: string;
  message?: string;
}

export interface AuthorizationUrlResponse {
  authorizationUrl: string;
  provider: VideoProvider;
}

// ============================================================================
// MEETING NOTES TYPES
// ============================================================================

export interface MeetingNoteRequest {
  summary?: string;
  agreements?: string;
  actionItems?: string;
  followUpDate?: string;
  recordingUrl?: string;
}

export interface MeetingNoteResponse {
  id: number;
  meetingId: number;
  summary?: string;
  agreements?: string;
  actionItems?: string;
  followUpDate?: string;
  recordingUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// VIDEO CALL INVITATION TYPES
// ============================================================================

export interface VideoCallInvitationRequest {
  provider?: VideoProvider;
  title: string;
  description?: string;
  inviteeUserIds: string[];
  operationId?: string;
  operationReference?: string;
  operationType?: OperationType;
  clientId?: string;
  clientName?: string;
}

export interface InvitedUser {
  userId: string;
  userName?: string;
  alertId: string;
}

export interface VideoCallInvitationResponse {
  meeting: MeetingResponse;
  roomName: string;
  meetingUrl: string;
  provider: VideoProvider;
  invitedUsers: InvitedUser[];
  alertsCreated: number;
}
