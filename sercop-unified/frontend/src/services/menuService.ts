import { apiClient, isClientUser } from '../config/api.client';
import { ADMIN_ROUTES, CLIENT_PORTAL_CONFIG_ROUTES } from '../config/api.routes';

// ==================== TYPES ====================

export interface MenuItemDTO {
  id: number;
  code: string;
  parentId: number | null;
  labelKey: string;  // i18n key
  icon: string | null;
  path: string | null;
  displayOrder: number;
  isSection: boolean;
  isActive: boolean;
  requiredPermissions: string[];
  children: MenuItemDTO[];
  apiEndpointCodes: string[];
}

export interface ApiEndpointDTO {
  id: number;
  code: string;
  httpMethod: string;
  urlPattern: string;
  description: string | null;
  module: string | null;
  isPublic: boolean;
  isActive: boolean;
  requiredPermissions: string[];
}

export interface CreateMenuItemCommand {
  code: string;
  parentId?: number;
  labelKey: string;
  icon?: string;
  path?: string;
  displayOrder?: number;
  isSection?: boolean;
  permissionCodes?: string[];
  apiEndpointCodes?: string[];
}

export interface UpdateMenuItemCommand {
  code: string;
  parentId?: number;
  labelKey: string;
  icon?: string;
  path?: string;
  displayOrder?: number;
  isSection?: boolean;
  isActive?: boolean;
  permissionCodes?: string[];
  apiEndpointCodes?: string[];
}

export interface CreateApiEndpointCommand {
  code: string;
  httpMethod: string;
  urlPattern: string;
  description?: string;
  module?: string;
  isPublic?: boolean;
  permissionCodes?: string[];
}

export interface UpdateApiEndpointCommand {
  code: string;
  httpMethod: string;
  urlPattern: string;
  description?: string;
  module?: string;
  isPublic?: boolean;
  isActive?: boolean;
  permissionCodes?: string[];
}

export interface ReorderMenuItemsCommand {
  items: Array<{
    id: number;
    parentId: number | null;
    displayOrder: number;
  }>;
}

// ==================== USER QUERIES ====================

/**
 * Get menu items for the current authenticated user.
 * The backend filters based on user's permissions.
 * Uses client portal endpoint for CLIENT users.
 */
export const getUserMenu = async (): Promise<MenuItemDTO[]> => {
  // Use client portal endpoint for CLIENT users
  const endpoint = isClientUser()
    ? CLIENT_PORTAL_CONFIG_ROUTES.MENU_USER
    : ADMIN_ROUTES.MENU.USER;
  const response = await apiClient.get<MenuItemDTO[]>(endpoint);
  return response.data;
};

// ==================== ADMIN QUERIES ====================

/**
 * Get all menu items for admin configuration.
 */
export const getAllMenuItems = async (): Promise<MenuItemDTO[]> => {
  const response = await apiClient.get<MenuItemDTO[]>(ADMIN_ROUTES.MENU.ADMIN_ITEMS);
  return response.data;
};

/**
 * Get all API endpoints for admin configuration.
 */
export const getAllApiEndpoints = async (): Promise<ApiEndpointDTO[]> => {
  const response = await apiClient.get<ApiEndpointDTO[]>(ADMIN_ROUTES.MENU.ADMIN_ENDPOINTS);
  return response.data;
};

/**
 * Get all API endpoint modules.
 */
export const getApiModules = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>(ADMIN_ROUTES.MENU.ADMIN_ENDPOINT_MODULES);
  return response.data;
};

// ==================== ADMIN COMMANDS - MENU ITEMS ====================

/**
 * Create a new menu item.
 */
export const createMenuItem = async (command: CreateMenuItemCommand): Promise<MenuItemDTO> => {
  const response = await apiClient.post<MenuItemDTO>(ADMIN_ROUTES.MENU.ADMIN_ITEMS, command);
  return response.data;
};

/**
 * Update an existing menu item.
 */
export const updateMenuItem = async (id: number, command: UpdateMenuItemCommand): Promise<MenuItemDTO> => {
  const response = await apiClient.put<MenuItemDTO>(ADMIN_ROUTES.MENU.ADMIN_ITEM_BY_ID(id), command);
  return response.data;
};

/**
 * Delete a menu item.
 */
export const deleteMenuItem = async (id: number): Promise<void> => {
  await apiClient.delete(ADMIN_ROUTES.MENU.ADMIN_ITEM_BY_ID(id));
};

/**
 * Reorder menu items (batch update of parentId and displayOrder).
 */
export const reorderMenuItems = async (command: ReorderMenuItemsCommand): Promise<void> => {
  await apiClient.put(ADMIN_ROUTES.MENU.ADMIN_ITEMS_REORDER, command);
};

// ==================== ADMIN COMMANDS - API ENDPOINTS ====================

/**
 * Create a new API endpoint.
 */
export const createApiEndpoint = async (command: CreateApiEndpointCommand): Promise<ApiEndpointDTO> => {
  const response = await apiClient.post<ApiEndpointDTO>(ADMIN_ROUTES.MENU.ADMIN_ENDPOINTS, command);
  return response.data;
};

/**
 * Update an existing API endpoint.
 */
export const updateApiEndpoint = async (id: number, command: UpdateApiEndpointCommand): Promise<ApiEndpointDTO> => {
  const response = await apiClient.put<ApiEndpointDTO>(ADMIN_ROUTES.MENU.ADMIN_ENDPOINT_BY_ID(id), command);
  return response.data;
};

/**
 * Delete an API endpoint.
 */
export const deleteApiEndpoint = async (id: number): Promise<void> => {
  await apiClient.delete(ADMIN_ROUTES.MENU.ADMIN_ENDPOINT_BY_ID(id));
};

// ==================== EXPORTS ====================

export const menuService = {
  // User
  getUserMenu,

  // Admin - Menu Items
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  reorderMenuItems,

  // Admin - API Endpoints
  getAllApiEndpoints,
  getApiModules,
  createApiEndpoint,
  updateApiEndpoint,
  deleteApiEndpoint,
};

export default menuService;
