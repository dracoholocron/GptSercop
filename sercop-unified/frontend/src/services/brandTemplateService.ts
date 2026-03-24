import { get, post, put, del } from '../utils/apiClient';
import { BRAND_TEMPLATE_ROUTES, CLIENT_PORTAL_CONFIG_ROUTES } from '../config/api.routes';
import { isClientUser } from '../config/api.client';

export interface BrandTemplate {
  id: number;
  code: string;
  name: string;
  description?: string;
  logoUrl?: string;
  logoSmallUrl?: string;
  faviconUrl?: string;
  companyName?: string;
  companyShortName?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  sidebarBgColor: string;
  sidebarTextColor: string;
  headerBgColor: string;
  fontFamily?: string;
  fontUrl?: string;
  contentBgColor?: string;
  contentBgColorDark?: string;
  cardBgColor?: string;
  cardBgColorDark?: string;
  borderColor?: string;
  borderColorDark?: string;
  textColor?: string;
  textColorDark?: string;
  textColorSecondary?: string;
  textColorSecondaryDark?: string;
  darkModeEnabled: boolean;
  customCss?: string;
  active: boolean;
  isDefault: boolean;
  isEditable: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateBrandTemplateRequest {
  code: string;
  name: string;
  description?: string;
  logoUrl?: string;
  logoSmallUrl?: string;
  faviconUrl?: string;
  companyName?: string;
  companyShortName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  sidebarBgColor?: string;
  sidebarTextColor?: string;
  headerBgColor?: string;
  fontFamily?: string;
  fontUrl?: string;
  contentBgColor?: string;
  contentBgColorDark?: string;
  cardBgColor?: string;
  cardBgColorDark?: string;
  borderColor?: string;
  borderColorDark?: string;
  textColor?: string;
  textColorDark?: string;
  textColorSecondary?: string;
  textColorSecondaryDark?: string;
  darkModeEnabled?: boolean;
  customCss?: string;
}

export interface UpdateBrandTemplateRequest {
  name?: string;
  description?: string;
  logoUrl?: string;
  logoSmallUrl?: string;
  faviconUrl?: string;
  companyName?: string;
  companyShortName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  sidebarBgColor?: string;
  sidebarTextColor?: string;
  headerBgColor?: string;
  fontFamily?: string;
  fontUrl?: string;
  contentBgColor?: string;
  contentBgColorDark?: string;
  cardBgColor?: string;
  cardBgColorDark?: string;
  borderColor?: string;
  borderColorDark?: string;
  textColor?: string;
  textColorDark?: string;
  textColorSecondary?: string;
  textColorSecondaryDark?: string;
  darkModeEnabled?: boolean;
  customCss?: string;
  displayOrder?: number;
}

export interface CloneRequest {
  code: string;
  name?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

class BrandTemplateService {
  /**
   * Get all brand templates
   */
  async getAll(): Promise<BrandTemplate[]> {
    const response = await get(BRAND_TEMPLATE_ROUTES.BASE);
    const result: ApiResponse<BrandTemplate[]> = await response.json();
    return result.data || [];
  }

  /**
   * Get the currently active brand template.
   * Uses client portal endpoint for CLIENT users.
   */
  async getActive(): Promise<BrandTemplate | null> {
    try {
      // Use client portal endpoint for CLIENT users
      const endpoint = isClientUser()
        ? CLIENT_PORTAL_CONFIG_ROUTES.BRAND_TEMPLATES_ACTIVE
        : BRAND_TEMPLATE_ROUTES.ACTIVE;
      const response = await get(endpoint);
      const result: ApiResponse<BrandTemplate> = await response.json();
      return result.data || null;
    } catch (error) {
      console.warn('No active brand template found');
      return null;
    }
  }

  /**
   * Get brand template by ID
   */
  async getById(id: number): Promise<BrandTemplate> {
    const response = await get(BRAND_TEMPLATE_ROUTES.BY_ID(id));
    const result: ApiResponse<BrandTemplate> = await response.json();
    if (!result.data) {
      throw new Error('Brand template not found');
    }
    return result.data;
  }

  /**
   * Create a new brand template
   */
  async create(data: CreateBrandTemplateRequest): Promise<BrandTemplate> {
    const response = await post(BRAND_TEMPLATE_ROUTES.BASE, data);
    const result: ApiResponse<BrandTemplate> = await response.json();
    if (!result.data) {
      throw new Error(result.message || 'Failed to create brand template');
    }
    return result.data;
  }

  /**
   * Update an existing brand template
   */
  async update(id: number, data: UpdateBrandTemplateRequest): Promise<BrandTemplate> {
    const response = await put(BRAND_TEMPLATE_ROUTES.BY_ID(id), data);
    const result: ApiResponse<BrandTemplate> = await response.json();
    if (!result.data) {
      throw new Error(result.message || 'Failed to update brand template');
    }
    return result.data;
  }

  /**
   * Delete a brand template
   */
  async delete(id: number): Promise<void> {
    const response = await del(BRAND_TEMPLATE_ROUTES.BY_ID(id));
    const result: ApiResponse<void> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete brand template');
    }
  }

  /**
   * Activate a brand template
   */
  async activate(id: number): Promise<BrandTemplate> {
    const response = await post(BRAND_TEMPLATE_ROUTES.ACTIVATE(id), {});
    const result: ApiResponse<BrandTemplate> = await response.json();
    if (!result.data) {
      throw new Error(result.message || 'Failed to activate brand template');
    }
    return result.data;
  }

  /**
   * Clone a brand template
   */
  async clone(id: number, data: CloneRequest): Promise<BrandTemplate> {
    const response = await post(BRAND_TEMPLATE_ROUTES.CLONE(id), data);
    const result: ApiResponse<BrandTemplate> = await response.json();
    if (!result.data) {
      throw new Error(result.message || 'Failed to clone brand template');
    }
    return result.data;
  }
}

export const brandTemplateService = new BrandTemplateService();
export default brandTemplateService;

// Re-export types explicitly for better module resolution
export type { BrandTemplate, CreateBrandTemplateRequest, UpdateBrandTemplateRequest, CloneRequest };
