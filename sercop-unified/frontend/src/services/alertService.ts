/**
 * Alert Service
 * Handles user alerts, agenda, and business requests operations
 */
import { apiClient } from '../config/api.client';
import { ALERT_ROUTES, BUSINESS_REQUEST_ROUTES, buildUrlWithParams } from '../config/api.routes';

// ============================================================================
// TYPES - Alerts
// ============================================================================

export type AlertType =
  | 'FOLLOW_UP'
  | 'REMINDER'
  | 'DEADLINE'
  | 'TASK'
  | 'DOCUMENT_REVIEW'
  | 'CLIENT_CONTACT'
  | 'OPERATION_UPDATE'
  | 'COMPLIANCE_CHECK'
  | 'VIDEO_CALL'
  | 'EMAIL'
  | 'GENERATE_DOCUMENT';

export type AlertPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type AlertStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'SNOOZED';

export type AlertSourceType =
  | 'OPERATION_APPROVAL'
  | 'SCHEDULED_JOB'
  | 'AI_EXTRACTION'
  | 'BUSINESS_REQUEST'
  | 'MANUAL'
  | 'VIDEO_CONFERENCE';

export type RequestSourceType = 'AI_EXTRACTION' | 'MANUAL' | 'CLIENT_PORTAL' | 'EMAIL_PARSER';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONVERTED' | 'CANCELLED';

// ============================================================================
// INTERFACES - Alerts
// ============================================================================

export interface AlertResponse {
  alertId: string;
  userId: string;
  userName?: string;
  assignedBy?: string;
  assignedRole?: string;
  title: string;
  description?: string;
  alertType: AlertType;
  alertTypeLabel?: string;
  alertTypeIcon?: string;
  alertTypeColor?: string;
  priority: AlertPriority;
  sourceType: AlertSourceType;
  sourceId?: string;
  sourceReference?: string;
  sourceModule?: string;
  operationId?: string;
  requestId?: string;
  draftId?: string;
  clientId?: string;
  clientName?: string;
  // Video Conference (for VIDEO_CALL alerts)
  meetingId?: string;
  meetingUrl?: string;
  meetingProvider?: string;
  organizerName?: string;
  scheduledDate: string;
  scheduledTime?: string;
  dueDate?: string;
  status: AlertStatus;
  processedAt?: string;
  processedBy?: string;
  processingNotes?: string;
  originalScheduledDate?: string;
  rescheduleCount?: number;
  overdue: boolean;
  dueToday: boolean;
  tags?: string[];
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
}

export interface AlertCreateRequest {
  title: string;
  description?: string;
  alertType: AlertType;
  priority?: AlertPriority;
  scheduledDate: string;
  scheduledTime?: string;
  assignToUserId?: string;
  assignToRole?: string;
  operationId?: string;
  clientId?: string;
  clientName?: string;
  draftId?: string;
  requestId?: string;
  tags?: string[];
}

// ============================================================================
// INTERFACES - Tags
// ============================================================================

export interface AlertTag {
  id: number;
  name: string;
  nameEs?: string;
  nameEn?: string;
  color: string;
  description?: string;
  descriptionEs?: string;
  descriptionEn?: string;
  icon?: string;
  active: boolean;
  displayOrder: number;
}

export interface CreateTagRequest {
  name: string;
  nameEs: string;
  nameEn: string;
  color: string;
  descriptionEs?: string;
  descriptionEn?: string;
  icon?: string;
}

// ============================================================================
// INTERFACES - Advanced Search
// ============================================================================

export type AlertViewMode = 'ASSIGNED_TO_ME' | 'ASSIGNED_BY_ME' | 'ALL';
export type AlertQuickFilter = 'OVERDUE' | 'TODAY' | 'COMPLETED_TODAY';

export interface AlertSearchRequest {
  viewMode: AlertViewMode;
  userId?: string; // Filter by specific user (only for viewMode='ALL')
  startDate?: string;
  endDate?: string;
  status?: AlertStatus;
  alertType?: AlertType;
  priority?: AlertPriority;
  tags?: string[];
  searchText?: string;
  clientId?: string;
  operationId?: string;
  quickFilter?: AlertQuickFilter;
  hideCompleted?: boolean; // Exclude completed alerts from results
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface AlertSearchCounts {
  assignedToMe: number;
  assignedByMe: number;
  overdue: number;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface AlertStartRequest {
  notes?: string;
}

export interface AlertProgressRequest {
  notes: string;
}

export interface RoleDTO {
  name: string;
  description: string;
}

export interface AlertRescheduleRequest {
  newDate: string;
  newTime?: string;
  notes?: string;
}

export interface AlertCompleteRequest {
  notes?: string;
}

export interface AgendaSummary {
  totalAlerts: number;
  pendingAlerts: number;
  completedAlerts: number;
  overdueAlerts: number;
  todayAlerts: number;
  urgentAlerts: number;
  highPriorityAlerts: number;
  alertsByType: Record<string, number>;
}

export interface AgendaResponse {
  startDate: string;
  endDate: string;
  viewType: 'DAY' | 'WEEK' | 'MONTH';
  alertsByDate: Record<string, AlertResponse[]>;
  summary: AgendaSummary;
}

export interface AlertPreview {
  alertId: string;
  title: string;
  alertType: string;
  priority: string;
  scheduledTime?: string;
  clientName?: string;
  overdue: boolean;
  icon?: string;
  color?: string;
}

export interface TodayAlertsWidgetResponse {
  totalToday: number;
  pendingToday: number;
  completedToday: number;
  overdueTotal: number;
  hasUrgent: boolean;
  urgentCount: number;
  topAlerts: AlertPreview[];
}

export interface AlertTypeConfig {
  id: number;
  typeCode: string;
  labelEs: string;
  labelEn: string;
  descriptionEs?: string;
  descriptionEn?: string;
  icon?: string;
  color?: string;
  defaultPriority: AlertPriority;
  isActive: boolean;
  displayOrder: number;
}

export interface AlertHistoryEntry {
  id: number;
  historyId: string;
  alertId: string;
  actionType: string;
  previousStatus?: AlertStatus;
  newStatus?: AlertStatus;
  previousDate?: string;
  newDate?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

// ============================================================================
// INTERFACES - Business Requests
// ============================================================================

export interface AlertConfig {
  alertType: string;
  title: string;
  description?: string;
  priority?: string;
  assignToUserId?: string;
  daysFromNow?: number;
  scheduledTime?: string;
}

export interface BusinessRequestResponse {
  requestId: string;
  requestNumber: string;
  sourceType: RequestSourceType;
  extractionId?: string;
  title: string;
  description?: string;
  extractedData?: Record<string, unknown>;
  clientId?: string;
  clientName?: string;
  operationType?: string;
  status: RequestStatus;
  rejectionReason?: string;
  alertsConfig?: AlertConfig[];
  convertedToDraftId?: string;
  convertedToOperationId?: string;
  convertedAt?: string;
  createdAt?: string;
  createdBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
}

export interface BusinessRequestCreateRequest {
  title: string;
  description?: string;
  extractionId?: string;
  extractedData?: Record<string, unknown>;
  clientId?: string;
  clientName?: string;
  operationType?: string;
  alertsConfig?: AlertConfig[];
}

// ============================================================================
// ALERT SERVICE FUNCTIONS
// ============================================================================

export async function getAgenda(
  date?: string,
  range: 'DAY' | 'WEEK' | 'MONTH' = 'WEEK',
  lang = 'es'
): Promise<AgendaResponse> {
  const url = buildUrlWithParams(ALERT_ROUTES.AGENDA, { date, range, lang });
  const response = await apiClient.get<AgendaResponse>(url);
  return response.data;
}

export async function getCalendarCounts(
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  const url = buildUrlWithParams(ALERT_ROUTES.CALENDAR, { startDate, endDate });
  const response = await apiClient.get<Record<string, number>>(url);
  return response.data;
}

export async function getTodayAlerts(): Promise<AlertResponse[]> {
  const response = await apiClient.get<AlertResponse[]>(ALERT_ROUTES.TODAY);
  return response.data;
}

export async function getUpcomingAlerts(days = 7): Promise<AlertResponse[]> {
  const url = buildUrlWithParams(ALERT_ROUTES.UPCOMING, { days });
  const response = await apiClient.get<AlertResponse[]>(url);
  return response.data;
}

export async function getOverdueAlerts(): Promise<AlertResponse[]> {
  const response = await apiClient.get<AlertResponse[]>(ALERT_ROUTES.OVERDUE);
  return response.data;
}

export async function getTodayWidget(lang = 'es'): Promise<TodayAlertsWidgetResponse> {
  const url = buildUrlWithParams(ALERT_ROUTES.WIDGET, { lang });
  const response = await apiClient.get<TodayAlertsWidgetResponse>(url);
  return response.data;
}

export async function getAlertCounts(): Promise<Record<string, number>> {
  const response = await apiClient.get<Record<string, number>>(ALERT_ROUTES.COUNTS);
  return response.data;
}

export async function searchAlerts(
  query: string,
  lang = 'es',
  page = 0,
  size = 20
): Promise<{ content: AlertResponse[]; totalElements: number; totalPages: number }> {
  const url = buildUrlWithParams(ALERT_ROUTES.SEARCH, { q: query, lang, page, size });
  const response = await apiClient.get<{ content: AlertResponse[]; totalElements: number; totalPages: number }>(url);
  return response.data;
}

export async function getAlert(alertId: string): Promise<AlertResponse> {
  const response = await apiClient.get<AlertResponse>(ALERT_ROUTES.BY_ID(alertId));
  return response.data;
}

export async function getAlertHistory(alertId: string): Promise<AlertHistoryEntry[]> {
  const response = await apiClient.get<AlertHistoryEntry[]>(ALERT_ROUTES.HISTORY(alertId));
  return response.data;
}

export async function createAlert(request: AlertCreateRequest): Promise<AlertResponse[]> {
  const response = await apiClient.post<AlertResponse[]>(ALERT_ROUTES.BASE, request);
  return response.data;
}

export async function startAlert(
  alertId: string,
  request?: AlertStartRequest
): Promise<AlertResponse> {
  const response = await apiClient.post<AlertResponse>(ALERT_ROUTES.START(alertId), request || {});
  return response.data;
}

export async function updateAlertProgress(
  alertId: string,
  request: AlertProgressRequest
): Promise<AlertResponse> {
  const response = await apiClient.post<AlertResponse>(ALERT_ROUTES.PROGRESS(alertId), request);
  return response.data;
}

export async function getAvailableRoles(): Promise<RoleDTO[]> {
  const response = await apiClient.get<RoleDTO[]>(ALERT_ROUTES.ROLES);
  return response.data;
}

export async function completeAlert(
  alertId: string,
  request?: AlertCompleteRequest
): Promise<AlertResponse> {
  const response = await apiClient.post<AlertResponse>(ALERT_ROUTES.COMPLETE(alertId), request || {});
  return response.data;
}

export async function rescheduleAlert(
  alertId: string,
  request: AlertRescheduleRequest
): Promise<AlertResponse> {
  const response = await apiClient.post<AlertResponse>(ALERT_ROUTES.RESCHEDULE(alertId), request);
  return response.data;
}

export async function snoozeAlert(alertId: string, days = 1): Promise<AlertResponse> {
  const url = buildUrlWithParams(ALERT_ROUTES.SNOOZE(alertId), { days });
  const response = await apiClient.post<AlertResponse>(url, {});
  return response.data;
}

export async function cancelAlert(alertId: string, reason?: string): Promise<AlertResponse> {
  const url = buildUrlWithParams(ALERT_ROUTES.CANCEL(alertId), { reason });
  const response = await apiClient.post<AlertResponse>(url, {});
  return response.data;
}

export interface ReassignAlertRequest {
  newUserId: string;
  newUserName?: string;
  reason?: string;
}

export async function reassignAlert(alertId: string, request: ReassignAlertRequest): Promise<AlertResponse> {
  const response = await apiClient.post<AlertResponse>(ALERT_ROUTES.REASSIGN(alertId), request);
  return response.data;
}

export async function getAlertsByOperation(
  operationId: string,
  lang = 'es'
): Promise<AlertResponse[]> {
  const url = buildUrlWithParams(ALERT_ROUTES.BY_OPERATION(operationId), { lang });
  const response = await apiClient.get<AlertResponse[]>(url);
  return response.data;
}

export async function getAlertsByClient(clientId: string, lang = 'es'): Promise<AlertResponse[]> {
  const url = buildUrlWithParams(ALERT_ROUTES.BY_CLIENT(clientId), { lang });
  const response = await apiClient.get<AlertResponse[]>(url);
  return response.data;
}

export async function getAlertTypes(activeOnly = true): Promise<AlertTypeConfig[]> {
  const url = buildUrlWithParams(ALERT_ROUTES.TYPES, { activeOnly });
  const response = await apiClient.get<AlertTypeConfig[]>(url);
  return response.data;
}

// ============================================================================
// ADVANCED SEARCH FUNCTIONS
// ============================================================================

export async function advancedSearch(
  request: AlertSearchRequest,
  lang = 'es'
): Promise<PagedResponse<AlertResponse>> {
  const url = buildUrlWithParams(ALERT_ROUTES.ADVANCED_SEARCH, { lang });
  const response = await apiClient.post<PagedResponse<AlertResponse>>(url, request);
  return response.data;
}

export async function getAssignedByMe(
  lang = 'es',
  page = 0,
  size = 20
): Promise<PagedResponse<AlertResponse>> {
  const url = buildUrlWithParams(ALERT_ROUTES.ASSIGNED_BY_ME, { lang, page, size });
  const response = await apiClient.get<PagedResponse<AlertResponse>>(url);
  return response.data;
}

export async function getAllAlerts(
  lang = 'es',
  page = 0,
  size = 20
): Promise<PagedResponse<AlertResponse>> {
  const url = buildUrlWithParams(ALERT_ROUTES.ALL_ALERTS, { lang, page, size });
  const response = await apiClient.get<PagedResponse<AlertResponse>>(url);
  return response.data;
}

export async function getSearchCounts(): Promise<AlertSearchCounts> {
  const response = await apiClient.get<AlertSearchCounts>(ALERT_ROUTES.SEARCH_COUNTS);
  return response.data;
}

export async function getAlertsByTag(
  tag: string,
  lang = 'es'
): Promise<AlertResponse[]> {
  const url = buildUrlWithParams(ALERT_ROUTES.BY_TAG(tag), { lang });
  const response = await apiClient.get<AlertResponse[]>(url);
  return response.data;
}

export async function updateAlertTags(
  alertId: string,
  tags: string[]
): Promise<AlertResponse> {
  const response = await apiClient.put<AlertResponse>(ALERT_ROUTES.UPDATE_TAGS(alertId), tags);
  return response.data;
}

// ============================================================================
// TAGS CRUD FUNCTIONS
// ============================================================================

export async function getTags(activeOnly = true): Promise<AlertTag[]> {
  const url = buildUrlWithParams(ALERT_ROUTES.TAGS, { activeOnly });
  const response = await apiClient.get<AlertTag[]>(url);
  return response.data;
}

export async function createTag(tag: Partial<AlertTag>): Promise<AlertTag> {
  const response = await apiClient.post<AlertTag>(ALERT_ROUTES.TAGS, tag);
  return response.data;
}

export async function updateTag(id: number, tag: Partial<AlertTag>): Promise<AlertTag> {
  const response = await apiClient.put<AlertTag>(ALERT_ROUTES.TAG_BY_ID(id), tag);
  return response.data;
}

export async function deleteTag(id: number): Promise<void> {
  await apiClient.delete(ALERT_ROUTES.TAG_BY_ID(id));
}

// ============================================================================
// BUSINESS REQUEST SERVICE FUNCTIONS
// ============================================================================

export async function getPendingRequests(): Promise<BusinessRequestResponse[]> {
  const response = await apiClient.get<BusinessRequestResponse[]>(BUSINESS_REQUEST_ROUTES.PENDING);
  return response.data;
}

export async function getPendingRequestsPaged(
  page = 0,
  size = 20
): Promise<{ content: BusinessRequestResponse[]; totalElements: number; totalPages: number }> {
  const url = buildUrlWithParams(BUSINESS_REQUEST_ROUTES.PENDING_PAGED, { page, size });
  const response = await apiClient.get<{ content: BusinessRequestResponse[]; totalElements: number; totalPages: number }>(url);
  return response.data;
}

export async function getMyPendingRequests(): Promise<BusinessRequestResponse[]> {
  const response = await apiClient.get<BusinessRequestResponse[]>(BUSINESS_REQUEST_ROUTES.MY_PENDING);
  return response.data;
}

export async function searchBusinessRequests(
  query: string,
  page = 0,
  size = 20
): Promise<{ content: BusinessRequestResponse[]; totalElements: number; totalPages: number }> {
  const url = buildUrlWithParams(BUSINESS_REQUEST_ROUTES.SEARCH, { q: query, page, size });
  const response = await apiClient.get<{ content: BusinessRequestResponse[]; totalElements: number; totalPages: number }>(url);
  return response.data;
}

export async function getBusinessRequest(requestId: string): Promise<BusinessRequestResponse> {
  const response = await apiClient.get<BusinessRequestResponse>(BUSINESS_REQUEST_ROUTES.BY_ID(requestId));
  return response.data;
}

export async function getBusinessRequestByNumber(
  requestNumber: string
): Promise<BusinessRequestResponse> {
  const response = await apiClient.get<BusinessRequestResponse>(BUSINESS_REQUEST_ROUTES.BY_NUMBER(requestNumber));
  return response.data;
}

export async function countPendingRequests(): Promise<{ pending: number }> {
  const response = await apiClient.get<{ pending: number }>(BUSINESS_REQUEST_ROUTES.COUNT);
  return response.data;
}

export async function createBusinessRequest(
  request: BusinessRequestCreateRequest
): Promise<BusinessRequestResponse> {
  const response = await apiClient.post<BusinessRequestResponse>(BUSINESS_REQUEST_ROUTES.BASE, request);
  return response.data;
}

export async function approveBusinessRequest(
  requestId: string,
  draftId?: string,
  operationId?: string
): Promise<BusinessRequestResponse> {
  const url = buildUrlWithParams(BUSINESS_REQUEST_ROUTES.APPROVE(requestId), {
    draftId,
    operationId,
  });
  const response = await apiClient.post<BusinessRequestResponse>(url, {});
  return response.data;
}

export async function rejectBusinessRequest(
  requestId: string,
  reason: string
): Promise<BusinessRequestResponse> {
  const url = buildUrlWithParams(BUSINESS_REQUEST_ROUTES.REJECT(requestId), { reason });
  const response = await apiClient.post<BusinessRequestResponse>(url, {});
  return response.data;
}

export async function cancelBusinessRequest(requestId: string): Promise<BusinessRequestResponse> {
  const response = await apiClient.post<BusinessRequestResponse>(BUSINESS_REQUEST_ROUTES.CANCEL(requestId), {});
  return response.data;
}

export async function updateBusinessRequestAlertsConfig(
  requestId: string,
  alertsConfig: AlertConfig[]
): Promise<BusinessRequestResponse> {
  const response = await apiClient.put<BusinessRequestResponse>(BUSINESS_REQUEST_ROUTES.ALERTS_CONFIG(requestId), alertsConfig);
  return response.data;
}
