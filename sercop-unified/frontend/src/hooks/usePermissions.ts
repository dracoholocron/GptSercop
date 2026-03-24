import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL_WITH_PREFIX } from '../config/api.config';

/**
 * Hook for permission-based authorization.
 * Provides utilities to check if the current user has specific permissions.
 */
export const usePermissions = () => {
  const { user, token } = useAuth();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user permissions from API
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!token || !user) {
        setPermissions(new Set());
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL_WITH_PREFIX}/admin/permissions/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // If 403/401, user might not have permission to see permissions endpoint
          // Fall back to role-based permissions
          if (response.status === 403 || response.status === 401) {
            setPermissions(getRoleBasedPermissions(user.roles || []));
            return;
          }
          throw new Error('Failed to fetch permissions');
        }

        const data = await response.json();
        const permissionSet = new Set<string>(data.data || data || []);
        setPermissions(permissionSet);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fall back to role-based permissions
        setPermissions(getRoleBasedPermissions(user?.roles || []));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [token, user]);

  /**
   * Check if user has a specific permission.
   */
  const hasPermission = useCallback((permission: string): boolean => {
    // ROLE_ADMIN has all permissions
    if (user?.roles?.includes('ROLE_ADMIN')) {
      return true;
    }
    return permissions.has(permission);
  }, [permissions, user]);

  /**
   * Check if user has any of the specified permissions.
   */
  const hasAnyPermission = useCallback((permissionList: string[]): boolean => {
    if (user?.roles?.includes('ROLE_ADMIN')) {
      return true;
    }
    return permissionList.some(p => permissions.has(p));
  }, [permissions, user]);

  /**
   * Check if user has all of the specified permissions.
   */
  const hasAllPermissions = useCallback((permissionList: string[]): boolean => {
    if (user?.roles?.includes('ROLE_ADMIN')) {
      return true;
    }
    return permissionList.every(p => permissions.has(p));
  }, [permissions, user]);

  /**
   * Check if user can access a specific module.
   */
  const canAccessModule = useCallback((module: string): boolean => {
    if (user?.roles?.includes('ROLE_ADMIN')) {
      return true;
    }
    // Check for any VIEW permission in the module
    const viewPermission = `CAN_VIEW_${module}`;
    return permissions.has(viewPermission);
  }, [permissions, user]);

  /**
   * Check if user can perform an action on a module.
   */
  const canPerformAction = useCallback((module: string, action: 'VIEW' | 'CREATE' | 'EDIT' | 'APPROVE' | 'DELETE'): boolean => {
    if (user?.roles?.includes('ROLE_ADMIN')) {
      return true;
    }
    const permission = `CAN_${action}_${module}`;
    return permissions.has(permission);
  }, [permissions, user]);

  /**
   * Get all permissions for a specific module.
   */
  const getModulePermissions = useCallback((module: string): string[] => {
    return Array.from(permissions).filter(p => p.includes(module));
  }, [permissions]);

  return {
    permissions: Array.from(permissions),
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule,
    canPerformAction,
    getModulePermissions,
    isLoading,
    error,
    refresh: () => setPermissions(new Set()), // Trigger re-fetch
  };
};

/**
 * Fallback: Get permissions based on role (for when API is unavailable)
 */
const getRoleBasedPermissions = (roles: string[]): Set<string> => {
  const permissions = new Set<string>();

  // Define default permissions per role
  const rolePermissions: Record<string, string[]> = {
    'ROLE_ADMIN': ['*'], // Admin has all
    'ROLE_MANAGER': [
      'CAN_VIEW_LC_IMPORT', 'CAN_CREATE_LC_IMPORT', 'CAN_EDIT_LC_IMPORT', 'CAN_APPROVE_LC_IMPORT',
      'CAN_VIEW_LC_EXPORT', 'CAN_CREATE_LC_EXPORT', 'CAN_EDIT_LC_EXPORT', 'CAN_APPROVE_LC_EXPORT',
      'CAN_VIEW_GUARANTEE', 'CAN_CREATE_GUARANTEE', 'CAN_EDIT_GUARANTEE', 'CAN_APPROVE_GUARANTEE',
      'CAN_VIEW_COLLECTION', 'CAN_CREATE_COLLECTION', 'CAN_EDIT_COLLECTION', 'CAN_APPROVE_COLLECTION',
      'CAN_VIEW_SWIFT', 'CAN_SEND_SWIFT',
      'CAN_VIEW_REPORTS', 'CAN_EXPORT_REPORTS',
    ],
    'ROLE_OPERATOR': [
      'CAN_VIEW_LC_IMPORT', 'CAN_CREATE_LC_IMPORT', 'CAN_EDIT_LC_IMPORT',
      'CAN_VIEW_LC_EXPORT', 'CAN_CREATE_LC_EXPORT', 'CAN_EDIT_LC_EXPORT',
      'CAN_VIEW_GUARANTEE', 'CAN_CREATE_GUARANTEE', 'CAN_EDIT_GUARANTEE',
      'CAN_VIEW_COLLECTION', 'CAN_CREATE_COLLECTION', 'CAN_EDIT_COLLECTION',
      'CAN_VIEW_SWIFT',
      'CAN_VIEW_REPORTS',
    ],
    'ROLE_USER': [
      'CAN_VIEW_LC_IMPORT', 'CAN_VIEW_LC_EXPORT', 'CAN_VIEW_GUARANTEE',
      'CAN_VIEW_COLLECTION', 'CAN_VIEW_SWIFT', 'CAN_VIEW_REPORTS',
    ],
  };

  for (const role of roles) {
    const perms = rolePermissions[role] || [];
    perms.forEach(p => permissions.add(p));
  }

  return permissions;
};

export default usePermissions;
