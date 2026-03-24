/**
 * Monitoring Service
 * Provides API access monitoring and analytics for security dashboard
 */
import { apiClient } from '../config/api.client';
import { ADMIN_ROUTES } from '../config/api.routes';

// ==================== TYPES ====================

export interface ApiAccessLog {
  id: number;
  username: string;
  httpMethod: string;
  urlPattern: string;
  requestUri: string;
  endpointCode: string | null;
  accessGranted: boolean;
  denialReason: string | null;
  requiredPermissions: string | null;
  userPermissions: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  accessedAt: string;
  responseTimeMs: number | null;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AccessStats {
  totalRequests: number;
  grantedRequests: number;
  deniedRequests: number;
  avgResponseTimeMs: number;
}

export interface UserAccessCount {
  username: string;
  count: number;
}

export interface EndpointAccessCount {
  method: string;
  pattern: string;
  count: number;
}

export interface SecurityAlert {
  username: string;
  deniedCount: number;
}

export interface HourlyCount {
  hour: number;
  count: number;
}

// ==================== QUERIES ====================

export const getAccessStats = async (hours: number = 24): Promise<AccessStats> => {
  const response = await apiClient.get<AccessStats>(
    ADMIN_ROUTES.MONITORING.STATS + '?hours=' + hours
  );
  return response.data;
};

export const getRecentLogs = async (
  page: number = 0,
  size: number = 20
): Promise<PagedResponse<ApiAccessLog>> => {
  const response = await apiClient.get<PagedResponse<ApiAccessLog>>(
    ADMIN_ROUTES.MONITORING.LOGS + '?page=' + page + '&size=' + size
  );
  return response.data;
};

export const getDeniedLogs = async (
  page: number = 0,
  size: number = 20
): Promise<PagedResponse<ApiAccessLog>> => {
  const response = await apiClient.get<PagedResponse<ApiAccessLog>>(
    ADMIN_ROUTES.MONITORING.LOGS_DENIED + '?page=' + page + '&size=' + size
  );
  return response.data;
};

export const getLogsByUser = async (
  username: string,
  page: number = 0,
  size: number = 20
): Promise<PagedResponse<ApiAccessLog>> => {
  const response = await apiClient.get<PagedResponse<ApiAccessLog>>(
    ADMIN_ROUTES.MONITORING.LOGS_BY_USER(username) + '?page=' + page + '&size=' + size
  );
  return response.data;
};

export const getTopUsers = async (
  hours: number = 24,
  limit: number = 10
): Promise<UserAccessCount[]> => {
  const response = await apiClient.get<UserAccessCount[]>(
    ADMIN_ROUTES.MONITORING.TOP_USERS + '?hours=' + hours + '&limit=' + limit
  );
  return response.data;
};

export const getTopEndpoints = async (
  hours: number = 24,
  limit: number = 10
): Promise<EndpointAccessCount[]> => {
  const response = await apiClient.get<EndpointAccessCount[]>(
    ADMIN_ROUTES.MONITORING.TOP_ENDPOINTS + '?hours=' + hours + '&limit=' + limit
  );
  return response.data;
};

export const getSecurityAlerts = async (
  hours: number = 24,
  limit: number = 10
): Promise<SecurityAlert[]> => {
  const response = await apiClient.get<SecurityAlert[]>(
    ADMIN_ROUTES.MONITORING.SECURITY_ALERTS + '?hours=' + hours + '&limit=' + limit
  );
  return response.data;
};

export const getHourlyDistribution = async (hours: number = 24): Promise<HourlyCount[]> => {
  const response = await apiClient.get<HourlyCount[]>(
    ADMIN_ROUTES.MONITORING.HOURLY + '?hours=' + hours
  );
  return response.data;
};

export const monitoringService = {
  getAccessStats,
  getRecentLogs,
  getDeniedLogs,
  getLogsByUser,
  getTopUsers,
  getTopEndpoints,
  getSecurityAlerts,
  getHourlyDistribution,
};

export default monitoringService;
