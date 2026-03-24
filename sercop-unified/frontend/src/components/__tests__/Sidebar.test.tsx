/**
 * Unit Tests for Sidebar Component
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/setup';
import { Sidebar } from '../Sidebar';
import { getUserMenu, type MenuItemDTO } from '../../services/menuService';
import { MemoryRouter } from 'react-router-dom';

// Mock menuService
vi.mock('../../services/menuService', () => ({
  getUserMenu: vi.fn(),
}));

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin' as const,
    },
    isAuthenticated: true,
    hasRole: vi.fn(() => false),
  }),
}));

// Mock SidebarContext
const mockToggleSidebar = vi.fn();
vi.mock('../../contexts/SidebarContext', () => ({
  useSidebar: () => ({
    isCollapsed: false,
    toggleSidebar: mockToggleSidebar,
  }),
}));

// Mock ScheduleContext
vi.mock('../../contexts/ScheduleContext', () => ({
  useSchedule: () => ({
    scheduleStatus: null,
    isLoading: false,
    isBlocked: false,
    refreshStatus: vi.fn().mockResolvedValue(undefined),
    clearBlockedState: vi.fn(),
    timeUntilClose: null,
    isClosingSoon: false,
  }),
}));

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/dashboard',
    }),
  };
});

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for getUserMenu that returns empty to trigger fallback
    (getUserMenu as Mock).mockResolvedValue([]);
  });

  const mockDynamicMenu: MenuItemDTO[] = [
    {
      id: 1,
      code: 'DASHBOARD',
      parentId: null,
      labelKey: 'menu.dashboard',
      icon: 'FiHome',
      path: '/dashboard',
      displayOrder: 0,
      isSection: false,
      isActive: true,
      requiredPermissions: ['VIEW_DASHBOARD'],
      children: [],
      apiEndpointCodes: ['GET_DASHBOARD'],
    },
    {
      id: 2,
      code: 'WORKBOX',
      parentId: null,
      labelKey: 'menu.workbox',
      icon: 'FiBriefcase',
      path: '/workbox',
      displayOrder: 1,
      isSection: false,
      isActive: true,
      requiredPermissions: ['VIEW_WORKBOX'],
      children: [
        {
          id: 3,
          code: 'WORKBOX_DRAFTS',
          parentId: 2,
          labelKey: 'menu.drafts',
          icon: 'FiInbox',
          path: '/workbox/drafts',
          displayOrder: 0,
          isSection: false,
          isActive: true,
          requiredPermissions: ['VIEW_DRAFTS'],
          children: [],
          apiEndpointCodes: ['GET_DRAFTS'],
        },
      ],
      apiEndpointCodes: [],
    },
  ];

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>);
  };

  describe('Menu Rendering', () => {
    it('should render fallback menu when API returns empty', async () => {
      (getUserMenu as Mock).mockResolvedValue([]);

      renderWithRouter(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('menu.dashboard')).toBeInTheDocument();
      });
    });

    it('should render fallback menu when API fails', async () => {
      (getUserMenu as Mock).mockRejectedValue(new Error('Network error'));

      renderWithRouter(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('menu.dashboard')).toBeInTheDocument();
      });
    });

    it('should display GLOBAL CX title', async () => {
      renderWithRouter(<Sidebar />);

      expect(screen.getByText('GLOBAL CX')).toBeInTheDocument();
    });

    it('should display login subtitle', async () => {
      renderWithRouter(<Sidebar />);

      expect(screen.getByText('login.subtitle')).toBeInTheDocument();
    });
  });

  describe('Submenu Behavior', () => {
    it('should expand submenu when parent is clicked', async () => {
      renderWithRouter(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('menu.workbox')).toBeInTheDocument();
      });

      // Child should not be visible initially
      expect(screen.queryByText('menu.drafts')).not.toBeInTheDocument();

      // Click on parent to expand
      fireEvent.click(screen.getByText('menu.workbox'));

      await waitFor(() => {
        expect(screen.getByText('menu.drafts')).toBeInTheDocument();
      });
    });

    it('should collapse submenu when parent is clicked again', async () => {
      renderWithRouter(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('menu.workbox')).toBeInTheDocument();
      });

      // Expand
      fireEvent.click(screen.getByText('menu.workbox'));
      await waitFor(() => {
        expect(screen.getByText('menu.drafts')).toBeInTheDocument();
      });

      // Collapse
      fireEvent.click(screen.getByText('menu.workbox'));
      await waitFor(() => {
        expect(screen.queryByText('menu.drafts')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate when menu item without children is clicked', async () => {
      renderWithRouter(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('menu.dashboard')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('menu.dashboard'));

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate when child menu item is clicked', async () => {
      renderWithRouter(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('menu.workbox')).toBeInTheDocument();
      });

      // Expand parent
      fireEvent.click(screen.getByText('menu.workbox'));

      await waitFor(() => {
        expect(screen.getByText('menu.drafts')).toBeInTheDocument();
      });

      // Click child
      fireEvent.click(screen.getByText('menu.drafts'));

      // Check navigation (actual path depends on fallback menu)
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('Collapsed Mode', () => {
    it('should render GCM abbreviation when collapsed', async () => {
      render(
        <MemoryRouter>
          <Sidebar collapsed={true} />
        </MemoryRouter>
      );

      expect(screen.getByText('GCM')).toBeInTheDocument();
      expect(screen.queryByText('GLOBAL CX')).not.toBeInTheDocument();
    });
  });

  describe('Toggle Sidebar', () => {
    it('should call toggleSidebar when collapse button is clicked', async () => {
      renderWithRouter(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('sidebar.collapse')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('sidebar.collapse'));

      expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icon Mapping', () => {
    it('should render icons for menu items', async () => {
      renderWithRouter(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('menu.dashboard')).toBeInTheDocument();
      });

      // Icons should be rendered (as SVG elements)
      const svgIcons = document.querySelectorAll('svg');
      expect(svgIcons.length).toBeGreaterThan(0);
    });
  });
});
