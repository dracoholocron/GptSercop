import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';
import { CLIENT_PORTAL_CONFIG_ROUTES } from '../config/api.routes';
import { isClientUser } from '../config/api.client';

// Types
export interface ScheduleHours {
  id?: number;
  dayOfWeek: number;
  dayName?: string;
  isEnabled: boolean;
  startTime: string;
  endTime: string;
  allowOvernight?: boolean;
}

export interface GlobalSchedule {
  id?: number;
  code: string;
  nameKey: string;
  descriptionKey?: string;
  timezone: string;
  isDefault?: boolean;
  isActive?: boolean;
  hours: ScheduleHours[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ScheduleStatus {
  isAllowed: boolean;
  message?: string;
  reason?: string;
  currentLevel: 'GLOBAL' | 'ROLE' | 'USER' | 'EXCEPTION' | 'HOLIDAY';
  appliedLevel?: string;
  scheduleName?: string;
  currentStartTime?: string;
  currentEndTime?: string;
  minutesRemaining?: number;
  nextAccessTime?: string;
  isHoliday: boolean;
  holidayName?: string;
  userTimezone?: string;
  systemTimezone?: string;
  currentTimeFormatted?: string;
}

export interface Holiday {
  id?: number;
  holidayDate: string;
  code: string;
  nameKey: string;
  countryCode?: string;
  regionCode?: string;
  isBankHoliday?: boolean;
  actionType: 'CLOSED' | 'REDUCED_HOURS' | 'NORMAL';
  startTime?: string;
  endTime?: string;
  isRecurring?: boolean;
  recurrenceMonth?: number;
  recurrenceDay?: number;
  isActive?: boolean;
  createdAt?: string;
  createdBy?: string;
}

export interface ScheduleException {
  id?: number;
  exceptionType: 'GLOBAL' | 'ROLE' | 'USER';
  targetId?: number;
  exceptionDate: string;
  exceptionAction: 'ALLOW' | 'DENY' | 'MODIFY';
  startTime?: string;
  endTime?: string;
  reason: string;
  requestedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface AccessLog {
  id: number;
  userId: number;
  username: string;
  accessTimestamp: string;
  userTimezone?: string;
  systemTimezone?: string;
  userLocalTime?: string;
  accessResult: 'ALLOWED' | 'DENIED' | 'WARNED';
  denialReasonKey?: string;
  denialReasonParams?: string;
  scheduleLevelApplied: string;
  scheduleId?: number;
  ipAddress?: string;
  userAgent?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

class ScheduleService {
  private baseUrl = `${API_BASE_URL}`;

  // ==================== ESTADO ACTUAL ====================

  /**
   * Get current schedule status for the authenticated user.
   * Uses client portal endpoint for CLIENT users.
   */
  async getCurrentStatus(): Promise<ScheduleStatus> {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Use client portal endpoint for CLIENT users
    const endpoint = isClientUser()
      ? `${this.baseUrl}${CLIENT_PORTAL_CONFIG_ROUTES.SCHEDULES_STATUS}?timezone=${encodeURIComponent(userTimezone)}`
      : `${this.baseUrl}/schedules/current-status?timezone=${encodeURIComponent(userTimezone)}`;
    const response = await get(endpoint);
    const result: ApiResponse<ScheduleStatus> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al obtener estado del horario');
    }
    return result.data!;
  }

  // ==================== HORARIOS GLOBALES ====================

  async getGlobalSchedules(): Promise<GlobalSchedule[]> {
    const response = await get(`${this.baseUrl}/admin/schedules/global`);
    const result: ApiResponse<GlobalSchedule[]> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al obtener horarios globales');
    }
    return result.data || [];
  }

  async getGlobalSchedule(id: number): Promise<GlobalSchedule> {
    const response = await get(`${this.baseUrl}/admin/schedules/global/${id}`);
    const result: ApiResponse<GlobalSchedule> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al obtener horario global');
    }
    return result.data!;
  }

  async createGlobalSchedule(schedule: GlobalSchedule): Promise<GlobalSchedule> {
    const response = await post(`${this.baseUrl}/admin/schedules/global`, schedule);
    const result: ApiResponse<GlobalSchedule> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al crear horario global');
    }
    return result.data!;
  }

  async updateGlobalSchedule(id: number, schedule: GlobalSchedule): Promise<GlobalSchedule> {
    const response = await put(`${this.baseUrl}/admin/schedules/global/${id}`, schedule);
    const result: ApiResponse<GlobalSchedule> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al actualizar horario global');
    }
    return result.data!;
  }

  async deleteGlobalSchedule(id: number): Promise<void> {
    const response = await del(`${this.baseUrl}/admin/schedules/global/${id}`);
    const result: ApiResponse<void> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al eliminar horario global');
    }
  }

  async setDefaultGlobalSchedule(id: number): Promise<void> {
    const response = await post(`${this.baseUrl}/admin/schedules/global/${id}/set-default`, {});
    const result: ApiResponse<void> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al establecer horario predeterminado');
    }
  }

  // ==================== DÍAS FESTIVOS ====================

  async getHolidays(): Promise<Holiday[]> {
    const response = await get(`${this.baseUrl}/admin/schedules/holidays`);
    const result: ApiResponse<Holiday[]> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al obtener días festivos');
    }
    return result.data || [];
  }

  async getUpcomingHolidays(): Promise<Holiday[]> {
    const response = await get(`${this.baseUrl}/admin/schedules/holidays/upcoming`);
    const result: ApiResponse<Holiday[]> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al obtener próximos festivos');
    }
    return result.data || [];
  }

  async createHoliday(holiday: Holiday): Promise<Holiday> {
    const response = await post(`${this.baseUrl}/admin/schedules/holidays`, holiday);
    const result: ApiResponse<Holiday> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al crear día festivo');
    }
    return result.data!;
  }

  async updateHoliday(id: number, holiday: Holiday): Promise<Holiday> {
    const response = await put(`${this.baseUrl}/admin/schedules/holidays/${id}`, holiday);
    const result: ApiResponse<Holiday> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al actualizar día festivo');
    }
    return result.data!;
  }

  async deleteHoliday(id: number): Promise<void> {
    const response = await del(`${this.baseUrl}/admin/schedules/holidays/${id}`);
    const result: ApiResponse<void> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al eliminar día festivo');
    }
  }

  // ==================== EXCEPCIONES ====================

  async getExceptions(): Promise<ScheduleException[]> {
    const response = await get(`${this.baseUrl}/admin/schedules/exceptions`);
    const result: ApiResponse<ScheduleException[]> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al obtener excepciones');
    }
    return result.data || [];
  }

  async getPendingExceptions(): Promise<ScheduleException[]> {
    const response = await get(`${this.baseUrl}/admin/schedules/exceptions/pending`);
    const result: ApiResponse<ScheduleException[]> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al obtener excepciones pendientes');
    }
    return result.data || [];
  }

  async createException(exception: ScheduleException): Promise<ScheduleException> {
    const response = await post(`${this.baseUrl}/admin/schedules/exceptions`, exception);
    const result: ApiResponse<ScheduleException> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al crear excepción');
    }
    return result.data!;
  }

  async approveException(id: number): Promise<ScheduleException> {
    const response = await post(`${this.baseUrl}/admin/schedules/exceptions/${id}/approve`, {});
    const result: ApiResponse<ScheduleException> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al aprobar excepción');
    }
    return result.data!;
  }

  async rejectException(id: number, reason?: string): Promise<ScheduleException> {
    const response = await post(`${this.baseUrl}/admin/schedules/exceptions/${id}/reject`, reason || '');
    const result: ApiResponse<ScheduleException> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al rechazar excepción');
    }
    return result.data!;
  }

  async deleteException(id: number): Promise<void> {
    const response = await del(`${this.baseUrl}/admin/schedules/exceptions/${id}`);
    const result: ApiResponse<void> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al eliminar excepción');
    }
  }

  // ==================== LOGS DE ACCESO ====================

  async getAccessLogs(page = 0, size = 50): Promise<{ content: AccessLog[]; totalElements: number }> {
    const response = await get(`${this.baseUrl}/admin/schedules/access-logs?page=${page}&size=${size}`);
    const result: ApiResponse<{ content: AccessLog[]; totalElements: number }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al obtener logs de acceso');
    }
    return result.data!;
  }

  async getDeniedAccessLogs(days = 7): Promise<AccessLog[]> {
    const response = await get(`${this.baseUrl}/admin/schedules/access-logs/denied?days=${days}`);
    const result: ApiResponse<AccessLog[]> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al obtener accesos denegados');
    }
    return result.data || [];
  }
}

export const scheduleService = new ScheduleService();
