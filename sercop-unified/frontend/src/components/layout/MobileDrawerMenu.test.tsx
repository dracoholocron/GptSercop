import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/setup';
import { MemoryRouter } from 'react-router-dom';
import { MobileDrawerMenu } from './MobileDrawerMenu';

const mockNavigate = vi.fn();
let allowGptMenu = false;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/mobile-home' }),
  };
});

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'cp.test', role: 'user' },
    logout: vi.fn(),
  }),
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    getColors: () => ({
      cardBg: '#fff',
      primaryColor: '#0073E6',
      textColor: '#111',
      textColorSecondary: '#666',
      activeBg: '#f0f4ff',
      borderColor: '#ddd',
    }),
  }),
}));

vi.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasAnyPermission: (permissions: string[]) =>
      allowGptMenu && permissions.includes('GPT_ASSISTANT_VIEW'),
  }),
}));

describe('MobileDrawerMenu permission visibility', () => {
  it('hides GPT module when permissions are missing', async () => {
    allowGptMenu = false;

    const { unmount } = render(
      <MemoryRouter>
        <MobileDrawerMenu onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.queryByText('menu.cp.aiAssistant')).not.toBeInTheDocument();
    unmount();
  });

  it('shows GPT module when permissions are present', async () => {
    allowGptMenu = true;

    render(
      <MemoryRouter>
        <MobileDrawerMenu onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('menu.cp.aiAssistant')).toBeInTheDocument();
  });
});
