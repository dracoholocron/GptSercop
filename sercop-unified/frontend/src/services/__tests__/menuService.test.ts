/**
 * Unit Tests for menuService
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { apiClient } from '../../config/api.client';
import {
  getUserMenu,
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  type MenuItemDTO,
  type CreateMenuItemCommand,
  type UpdateMenuItemCommand,
} from '../menuService';

vi.mock('../../config/api.client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  isClientUser: vi.fn(() => false),
}));

describe('menuService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMenuItemDTO: MenuItemDTO = {
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
    apiEndpointCodes: ['GET_DASHBOARD_DATA'],
  };

  describe('getUserMenu', () => {
    it('should return menu items for current user', async () => {
      const expectedMenu = [mockMenuItemDTO];
      (apiClient.get as Mock).mockResolvedValue({ data: expectedMenu });

      const result = await getUserMenu();

      expect(apiClient.get).toHaveBeenCalledWith('/menu/user');
      expect(result).toEqual(expectedMenu);
    });

    it('should return empty array when no menu items', async () => {
      (apiClient.get as Mock).mockResolvedValue({ data: [] });

      const result = await getUserMenu();

      expect(result).toEqual([]);
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      (apiClient.get as Mock).mockRejectedValue(error);

      await expect(getUserMenu()).rejects.toThrow('Network error');
    });
  });

  describe('getAllMenuItems', () => {
    it('should return all menu items for admin', async () => {
      const expectedMenu = [mockMenuItemDTO];
      (apiClient.get as Mock).mockResolvedValue({ data: expectedMenu });

      const result = await getAllMenuItems();

      expect(apiClient.get).toHaveBeenCalledWith('/menu/admin/items');
      expect(result).toEqual(expectedMenu);
    });
  });

  describe('createMenuItem', () => {
    it('should create a new menu item', async () => {
      const command: CreateMenuItemCommand = {
        code: 'NEW_ITEM',
        labelKey: 'menu.newItem',
        icon: 'FiPlus',
        path: '/new-item',
      };

      const expectedResponse: MenuItemDTO = {
        id: 10,
        code: 'NEW_ITEM',
        parentId: null,
        labelKey: 'menu.newItem',
        icon: 'FiPlus',
        path: '/new-item',
        displayOrder: 0,
        isSection: false,
        isActive: true,
        requiredPermissions: [],
        children: [],
        apiEndpointCodes: [],
      };

      (apiClient.post as Mock).mockResolvedValue({ data: expectedResponse });

      const result = await createMenuItem(command);

      expect(apiClient.post).toHaveBeenCalledWith('/menu/admin/items', command);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('updateMenuItem', () => {
    it('should update an existing menu item', async () => {
      const command: UpdateMenuItemCommand = {
        code: 'DASHBOARD',
        labelKey: 'menu.dashboardUpdated',
        icon: 'FiBarChart2',
        path: '/dashboard',
        isActive: true,
      };

      const expectedResponse: MenuItemDTO = {
        ...mockMenuItemDTO,
        labelKey: 'menu.dashboardUpdated',
        icon: 'FiBarChart2',
      };

      (apiClient.put as Mock).mockResolvedValue({ data: expectedResponse });

      const result = await updateMenuItem(1, command);

      expect(apiClient.put).toHaveBeenCalledWith('/menu/admin/items/1', command);
      expect(result.labelKey).toBe('menu.dashboardUpdated');
    });
  });

  describe('deleteMenuItem', () => {
    it('should delete a menu item', async () => {
      (apiClient.delete as Mock).mockResolvedValue({ data: null });

      await deleteMenuItem(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/menu/admin/items/1');
    });
  });
});
