/**
 * OAuth2Callback - Unit Tests
 * Tests for user approval status handling in OAuth2 callback
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/setup';
import { OAuth2Callback } from './OAuth2Callback';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock useAuth
const mockLoginWithToken = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    loginWithToken: mockLoginWithToken,
    hasRole: vi.fn(() => false),
  }),
}));

// Mock useSchedule
vi.mock('../../contexts/ScheduleContext', () => ({
  useSchedule: () => ({
    refreshStatus: vi.fn().mockResolvedValue(undefined),
    clearBlockedState: vi.fn(),
  }),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to render with search params
const renderWithParams = (params: string) => {
  return render(
    <MemoryRouter initialEntries={[`/auth/callback?${params}`]}>
      <Routes>
        <Route path="/auth/callback" element={<OAuth2Callback />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('OAuth2Callback - Approval Status Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear specific keys instead of all localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pendingUser');
  });

  it('should redirect to dashboard for APPROVED user', async () => {
    // Given
    const params = 'token=jwt123&username=user@test.com&name=Test&provider=AUTH0&newUser=false&approvalStatus=APPROVED';

    // When
    renderWithParams(params);

    // Then
    await waitFor(() => {
      expect(mockLoginWithToken).toHaveBeenCalledWith(
        'jwt123',
        expect.objectContaining({
          username: 'user@test.com',
          name: 'Test',
        })
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/business-intelligence', { replace: true });
    }, { timeout: 3000 });
  });

  it('should show pending status for PENDING user', async () => {
    // Given
    const params = 'token=jwt123&username=pending@test.com&name=Pending&provider=AUTH0&newUser=true&approvalStatus=PENDING';

    // When
    renderWithParams(params);

    // Then - check for pending approval title
    await waitFor(() => {
      expect(screen.getByText('auth.pendingTitle')).toBeInTheDocument();
    });

    // Should NOT call loginWithToken for pending users
    expect(mockLoginWithToken).not.toHaveBeenCalled();

    // Should store pending user info
    await waitFor(() => {
      const storedUser = localStorage.getItem('pendingUser');
      expect(storedUser).toBeTruthy();
      const parsed = JSON.parse(storedUser!);
      expect(parsed.username).toBe('pending@test.com');
    });
  });

  it('should show rejected status for REJECTED user', async () => {
    // Given
    const params = 'token=jwt123&username=rejected@test.com&provider=AUTH0&approvalStatus=REJECTED';

    // When
    renderWithParams(params);

    // Then - check for rejected title
    await waitFor(() => {
      expect(screen.getByText('auth.rejectedTitle')).toBeInTheDocument();
    });

    // Should NOT call loginWithToken
    expect(mockLoginWithToken).not.toHaveBeenCalled();

    // Should NOT redirect to dashboard
    expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard', expect.anything());
  });

  it('should handle OAuth2 error response', async () => {
    // Given
    const params = 'error=access_denied&error_description=User%20cancelled';

    // When
    renderWithParams(params);

    // Then - error description should be shown
    await waitFor(() => {
      expect(screen.getByText('User cancelled')).toBeInTheDocument();
    });

    expect(mockLoginWithToken).not.toHaveBeenCalled();
  });

  it('should show error for missing token', async () => {
    // Given - no token or username
    const params = 'provider=AUTH0';

    // When
    renderWithParams(params);

    // Then - should show authentication failed
    await waitFor(() => {
      expect(screen.getByText('auth.authenticationFailed')).toBeInTheDocument();
    });
  });
});
