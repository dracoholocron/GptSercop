import React, { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface PermissionGateProps {
  /**
   * Single permission to check
   */
  permission?: string;

  /**
   * Multiple permissions - user must have ANY of these
   */
  anyOf?: string[];

  /**
   * Multiple permissions - user must have ALL of these
   */
  allOf?: string[];

  /**
   * Module + action shorthand (e.g., module="LC_IMPORT" action="CREATE")
   */
  module?: string;
  action?: 'VIEW' | 'CREATE' | 'EDIT' | 'APPROVE' | 'DELETE';

  /**
   * Content to render if user has permission
   */
  children: ReactNode;

  /**
   * Optional fallback content if user doesn't have permission
   */
  fallback?: ReactNode;

  /**
   * If true, shows loading state while permissions are being fetched
   */
  showLoading?: boolean;

  /**
   * Loading component to show
   */
  loadingComponent?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions.
 *
 * @example
 * // Single permission
 * <PermissionGate permission="CAN_CREATE_LC_IMPORT">
 *   <CreateButton />
 * </PermissionGate>
 *
 * @example
 * // Any of multiple permissions
 * <PermissionGate anyOf={['CAN_APPROVE_LC_IMPORT', 'CAN_APPROVE_LC_EXPORT']}>
 *   <ApproveButton />
 * </PermissionGate>
 *
 * @example
 * // Module + action shorthand
 * <PermissionGate module="LC_IMPORT" action="EDIT">
 *   <EditForm />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  anyOf,
  allOf,
  module,
  action,
  children,
  fallback = null,
  showLoading = false,
  loadingComponent = null,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canPerformAction, isLoading } = usePermissions();

  // Show loading state if requested
  if (isLoading && showLoading) {
    return <>{loadingComponent}</>;
  }

  // Determine if user has required permission
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (anyOf && anyOf.length > 0) {
    hasAccess = hasAnyPermission(anyOf);
  } else if (allOf && allOf.length > 0) {
    hasAccess = hasAllPermissions(allOf);
  } else if (module && action) {
    hasAccess = canPerformAction(module, action);
  } else {
    // No permission specified, allow access
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

/**
 * Higher-order component for permission-based access control.
 */
export const withPermission = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: string,
  FallbackComponent?: React.ComponentType<P>,
) => {
  return function WithPermissionComponent(props: P) {
    const { hasPermission, isLoading } = usePermissions();

    if (isLoading) {
      return null;
    }

    if (!hasPermission(permission)) {
      return FallbackComponent ? <FallbackComponent {...props} /> : null;
    }

    return <WrappedComponent {...props} />;
  };
};

/**
 * Hook-based permission check (for use in event handlers)
 */
export const usePermissionCheck = () => {
  const { hasPermission, hasAnyPermission } = usePermissions();

  /**
   * Check permission and optionally show error message
   */
  const checkPermission = (permission: string, showError = true): boolean => {
    const allowed = hasPermission(permission);
    if (!allowed && showError) {
      console.warn(`Permission denied: ${permission}`);
      // Could also show a toast/notification here
    }
    return allowed;
  };

  return { checkPermission, hasPermission, hasAnyPermission };
};

export default PermissionGate;
