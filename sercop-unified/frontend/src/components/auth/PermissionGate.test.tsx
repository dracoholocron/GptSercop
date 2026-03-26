import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/setup';
import { PermissionGate } from './PermissionGate';

vi.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) => permission === 'GPT_ASSISTANT_VIEW',
    hasAnyPermission: (permissions: string[]) => permissions.includes('GPT_ASSISTANT_VIEW'),
    hasAllPermissions: (permissions: string[]) => permissions.every((p) => p === 'GPT_ASSISTANT_VIEW'),
    canPerformAction: () => false,
    isLoading: false,
  }),
}));

describe('PermissionGate', () => {
  it('renders children when user has required permission', () => {
    render(
      <PermissionGate permission="GPT_ASSISTANT_VIEW">
        <div>allowed-content</div>
      </PermissionGate>
    );

    expect(screen.getByText('allowed-content')).toBeInTheDocument();
  });

  it('renders fallback when user does not have required permission', () => {
    render(
      <PermissionGate
        permission="GPT_ADMIN_VIEW"
        fallback={<div>denied-content</div>}
      >
        <div>allowed-content</div>
      </PermissionGate>
    );

    expect(screen.queryByText('allowed-content')).not.toBeInTheDocument();
    expect(screen.getByText('denied-content')).toBeInTheDocument();
  });
});
