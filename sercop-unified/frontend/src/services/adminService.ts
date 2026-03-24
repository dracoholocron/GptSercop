/**
 * Admin Service
 * Handles permissions, roles, and security audit operations
 */
import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';
import { ADMIN_ROUTES, buildUrlWithParams } from '../config/api.routes';

// ============================================================================
// TYPES - Permissions
// ============================================================================

export interface Permission {
  code: string;
  name: string;
  description?: string;
  module: string;
  createdAt?: string;
}

export interface PermissionModule {
  module: string;
  permissions: Permission[];
}

export interface PermissionMatrix {
  roles: RolePermissionSummary[];
  permissions: Permission[];
}

export interface RolePermissionSummary {
  roleId: number;
  roleName: string;
  permissionCodes: string[];
}

// ============================================================================
// TYPES - Roles
// ============================================================================

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleCommand {
  name: string;
  description?: string;
  permissionCodes?: string[];
}

export interface UpdateRoleCommand {
  name?: string;
  description?: string;
  permissionCodes?: string[];
}

// ============================================================================
// TYPES - Security Audit
// ============================================================================

export interface SecurityAuditLog {
  id: number;
  eventType: string;
  eventCategory: string;
  username: string;
  ipAddress: string;
  userAgent?: string;
  targetResource?: string;
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  details?: string;
  threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
}

export interface SecurityAuditFilter {
  eventType?: string;
  eventCategory?: string;
  username?: string;
  result?: string;
  threatLevel?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface SecurityAuditStatistics {
  totalEvents: number;
  successfulLogins: number;
  failedLogins: number;
  blockedAttempts: number;
  uniqueUsers: number;
  uniqueIps: number;
  byEventType: Record<string, number>;
  byResult: Record<string, number>;
  byThreatLevel: Record<string, number>;
  hourlyDistribution: Record<string, number>;
}

export interface SecurityAlert {
  id: number;
  alertType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  username?: string;
  ipAddress?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ============================================================================
// TYPES - Users Extended
// ============================================================================

export interface UserExtended {
  id: number;
  username: string;
  email: string;
  name?: string;
  enabled: boolean;
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
  roles: Role[];
  permissions?: string[];
  identityProvider?: string;
  externalId?: string;
  avatarUrl?: string;
  lastSsoLogin?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  loginAttempts?: number;
  lockoutUntil?: string;
  // Approval workflow fields
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvalRequestedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  // Client Portal fields
  userType?: 'INTERNAL' | 'CLIENT';
  clienteId?: string;
  participantName?: string;
}

// ============================================================================
// ADMIN SERVICE
// ============================================================================

export const adminService = {
  // ==========================================================================
  // PERMISSIONS
  // ==========================================================================

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    const response = await get(`${API_BASE_URL}${ADMIN_ROUTES.PERMISSIONS.BASE}`);
    if (!response.ok) throw new Error('Failed to fetch permissions');
    const data = await response.json();
    return data.data || data || [];
  },

  /**
   * Get permissions grouped by module
   */
  async getPermissionsByModule(): Promise<PermissionModule[]> {
    const response = await get(`${API_BASE_URL}${ADMIN_ROUTES.PERMISSIONS.MODULES}`);
    if (!response.ok) throw new Error('Failed to fetch permission modules');
    const data = await response.json();
    return data.data || data || [];
  },

  /**
   * Get permission matrix (all roles with their permissions)
   */
  async getPermissionMatrix(): Promise<PermissionMatrix> {
    const response = await get(`${API_BASE_URL}${ADMIN_ROUTES.PERMISSIONS.MATRIX}`);
    if (!response.ok) throw new Error('Failed to fetch permission matrix');
    const data = await response.json();
    return data.data || data;
  },

  /**
   * Get permissions for a specific user
   */
  async getUserPermissions(username: string): Promise<string[]> {
    const response = await get(`${API_BASE_URL}${ADMIN_ROUTES.PERMISSIONS.BY_USER(username)}`);
    if (!response.ok) throw new Error('Failed to fetch user permissions');
    const data = await response.json();
    return data.data || data || [];
  },

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(roleId: number, permissionCode: string): Promise<void> {
    const response = await post(`${API_BASE_URL}${ADMIN_ROUTES.PERMISSIONS.ROLE_ASSIGN(roleId)}`, { permissionCode });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to assign permission');
    }
  },

  /**
   * Revoke permission from role
   */
  async revokePermissionFromRole(roleId: number, permissionCode: string): Promise<void> {
    const response = await del(`${API_BASE_URL}${ADMIN_ROUTES.PERMISSIONS.ROLE_REVOKE(roleId, permissionCode)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to revoke permission');
    }
  },

  /**
   * Bulk assign permissions to role
   */
  async bulkAssignPermissions(roleId: number, permissionCodes: string[]): Promise<void> {
    const response = await post(`${API_BASE_URL}${ADMIN_ROUTES.PERMISSIONS.ROLE_BULK_ASSIGN(roleId)}`, { permissionCodes });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to bulk assign permissions');
    }
  },

  /**
   * Sync permissions (replace all)
   */
  async syncRolePermissions(roleId: number, permissionCodes: string[]): Promise<void> {
    const response = await put(`${API_BASE_URL}${ADMIN_ROUTES.PERMISSIONS.ROLE_SYNC(roleId)}`, { permissionCodes });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sync permissions');
    }
  },

  // ==========================================================================
  // ROLES
  // ==========================================================================

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    const response = await get(`${API_BASE_URL}${ADMIN_ROUTES.ROLES.BASE}`);
    if (!response.ok) throw new Error('Failed to fetch roles');
    const data = await response.json();
    return data.data || data || [];
  },

  /**
   * Get role by ID with permissions
   */
  async getRoleById(id: number): Promise<Role> {
    const response = await get(`${API_BASE_URL}${ADMIN_ROUTES.ROLES.BY_ID(id)}`);
    if (!response.ok) throw new Error('Failed to fetch role');
    const data = await response.json();
    return data.data || data;
  },

  /**
   * Create a new role
   */
  async createRole(command: CreateRoleCommand): Promise<Role> {
    const response = await post(`${API_BASE_URL}${ADMIN_ROUTES.ROLES.BASE}`, command);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create role');
    }
    const data = await response.json();
    return data.data || data;
  },

  /**
   * Update a role
   */
  async updateRole(id: number, command: UpdateRoleCommand): Promise<Role> {
    const response = await put(`${API_BASE_URL}${ADMIN_ROUTES.ROLES.BY_ID(id)}`, command);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update role');
    }
    const data = await response.json();
    return data.data || data;
  },

  /**
   * Delete a role
   */
  async deleteRole(id: number): Promise<void> {
    const response = await del(`${API_BASE_URL}${ADMIN_ROUTES.ROLES.BY_ID(id)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete role');
    }
  },

  // ==========================================================================
  // SECURITY AUDIT
  // ==========================================================================

  /**
   * Get security audit logs with filters
   */
  async getAuditLogs(filter: SecurityAuditFilter = {}): Promise<PagedResponse<SecurityAuditLog>> {
    const url = buildUrlWithParams(ADMIN_ROUTES.AUDIT.BASE, filter);
    const response = await get(`${API_BASE_URL}${url}`);
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    const data = await response.json();
    return data.data || data;
  },

  /**
   * Get security alerts
   */
  async getSecurityAlerts(unacknowledgedOnly: boolean = false): Promise<SecurityAlert[]> {
    const url = buildUrlWithParams(ADMIN_ROUTES.AUDIT.ALERTS, unacknowledgedOnly ? { unacknowledgedOnly: 'true' } : {});
    const response = await get(`${API_BASE_URL}${url}`);
    if (!response.ok) throw new Error('Failed to fetch security alerts');
    const data = await response.json();
    return data.data || data || [];
  },

  /**
   * Get critical events
   */
  async getCriticalEvents(hours: number = 24): Promise<SecurityAuditLog[]> {
    const url = buildUrlWithParams(ADMIN_ROUTES.AUDIT.CRITICAL, { hours });
    const response = await get(`${API_BASE_URL}${url}`);
    if (!response.ok) throw new Error('Failed to fetch critical events');
    const data = await response.json();
    return data.data || data || [];
  },

  /**
   * Get audit statistics
   */
  async getAuditStatistics(days: number = 7): Promise<SecurityAuditStatistics> {
    const url = buildUrlWithParams(ADMIN_ROUTES.AUDIT.STATISTICS, { days });
    const response = await get(`${API_BASE_URL}${url}`);
    if (!response.ok) throw new Error('Failed to fetch audit statistics');
    const data = await response.json();
    return data.data || data;
  },

  /**
   * Acknowledge a security alert
   */
  async acknowledgeAlert(alertId: number): Promise<void> {
    const response = await post(`${API_BASE_URL}${ADMIN_ROUTES.AUDIT.ALERT_ACKNOWLEDGE(alertId)}`, {});
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to acknowledge alert');
    }
  },

  /**
   * Export audit logs
   */
  async exportAuditLogs(filter: SecurityAuditFilter = {}, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const url = buildUrlWithParams(ADMIN_ROUTES.AUDIT.EXPORT, { ...filter, format });
    const response = await get(`${API_BASE_URL}${url}`);
    if (!response.ok) throw new Error('Failed to export audit logs');
    return response.blob();
  },

  // ==========================================================================
  // USERS (Extended)
  // ==========================================================================

  /**
   * Get all users with extended info
   */
  async getAllUsersExtended(): Promise<UserExtended[]> {
    const response = await get(`${API_BASE_URL}${ADMIN_ROUTES.USERS.BASE}`);
    if (!response.ok) throw new Error('Failed to fetch users');
    const data = await response.json();
    return data.data || data || [];
  },

  /**
   * Get user by ID with extended info
   */
  async getUserExtended(id: number): Promise<UserExtended> {
    const response = await get(`${API_BASE_URL}${ADMIN_ROUTES.USERS.BY_ID(id)}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    const data = await response.json();
    return data.data || data;
  },

  /**
   * Lock a user account
   */
  async lockUser(id: number, reason?: string): Promise<void> {
    const response = await post(`${API_BASE_URL}${ADMIN_ROUTES.USERS.LOCK(id)}`, { reason });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to lock user');
    }
  },

  /**
   * Unlock a user account
   */
  async unlockUser(id: number): Promise<void> {
    const response = await post(`${API_BASE_URL}${ADMIN_ROUTES.USERS.UNLOCK(id)}`, {});
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to unlock user');
    }
  },

  /**
   * Reset user password (generates temporary password)
   */
  async resetUserPassword(id: number): Promise<string> {
    const response = await post(`${API_BASE_URL}${ADMIN_ROUTES.USERS.RESET_PASSWORD(id)}`, {});
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset password');
    }
    const data = await response.json();
    return data.data?.temporaryPassword || data.temporaryPassword;
  },

  /**
   * Force logout user
   */
  async forceLogout(id: number): Promise<void> {
    const response = await post(`${API_BASE_URL}${ADMIN_ROUTES.USERS.FORCE_LOGOUT(id)}`, {});
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to force logout');
    }
  },

  /**
   * Assign roles to user
   */
  async assignRolesToUser(userId: number, roleIds: number[]): Promise<void> {
    const response = await put(`${API_BASE_URL}${ADMIN_ROUTES.USERS.ROLES(userId)}`, { roleIds });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to assign roles');
    }
  },

  /**
   * Get users pending approval
   */
  async getPendingUsers(): Promise<UserExtended[]> {
    const response = await get(`${API_BASE_URL}${ADMIN_ROUTES.USERS.PENDING}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get pending users');
    }
    return response.json();
  },

  /**
   * Approve user registration
   */
  async approveUser(id: number, roleIds: number[]): Promise<void> {
    const response = await post(`${API_BASE_URL}${ADMIN_ROUTES.USERS.APPROVE(id)}`, { roleIds });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to approve user');
    }
  },

  /**
   * Reject user registration
   */
  async rejectUser(id: number, reason: string): Promise<void> {
    const response = await post(`${API_BASE_URL}${ADMIN_ROUTES.USERS.REJECT(id)}`, { reason });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reject user');
    }
  },
};

export default adminService;
