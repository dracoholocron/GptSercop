/**
 * Client Portal Catalog Service
 *
 * This service provides access to catalogs (currencies, custom catalogs)
 * for client portal users through the facade endpoints that are allowed
 * by the ClientPortalSecurityFilter.
 *
 * SECURITY: Only whitelisted catalogs are accessible through these endpoints.
 * The backend validates catalog codes against a whitelist.
 */

import { apiClient as api } from '../config/api.client';

// Mapping for catalog codes that differ between custom fields config and actual catalog codes
const CATALOG_CODE_MAPPING: Record<string, string> = {
  COUNTRIES: 'COUNTRY',
  // Add more mappings here if needed
};

// Types
export interface Currency {
  id: number;
  codigo: string;
  nombre: string;
  simbolo?: string;
  activo: boolean;
}

export interface CustomCatalog {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  nivel: number;
  catalogoPadreId?: number;
  codigoCatalogoPadre?: string;
  nombreCatalogoPadre?: string;
  activo: boolean;
  orden: number;
}

export interface FinancialInstitution {
  id: number;
  codigo: string;
  nombre: string;
  swiftCode: string;
  pais: string;
  ciudad?: string;
  direccion?: string;
  tipo: string;
  rating?: string;
  esCorresponsal: boolean;
  activo: boolean;
}

/**
 * Service for accessing catalogs in the client portal.
 * Uses the /client-portal/catalogs/* endpoints which are accessible
 * to CLIENT users (not blocked by security filter).
 */
const clientPortalCatalogService = {
  /**
   * Get all active currencies.
   * Used for currency selection fields in forms.
   */
  async getActiveCurrencies(): Promise<Currency[]> {
    try {
      const response = await api.get<Currency[]>('/client-portal/catalogs/currencies');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching currencies from client portal:', error);
      throw error;
    }
  },

  /**
   * Get catalog values by catalog code.
   * Only whitelisted catalogs are accessible (validated by backend).
   * Returns the children (level 2 values) of the specified catalog.
   */
  async getCatalogValuesByCode(catalogCode: string): Promise<CustomCatalog[]> {
    // Apply code mapping if exists (e.g., COUNTRIES -> COUNTRY)
    const mappedCode = CATALOG_CODE_MAPPING[catalogCode] || catalogCode;

    try {
      const response = await api.get<CustomCatalog[]>(
        `/client-portal/catalogs/custom-catalogs/code/${mappedCode}`
      );
      return response.data || [];
    } catch (error) {
      console.error(`Error fetching catalog ${catalogCode} (mapped to ${mappedCode}):`, error);
      throw error;
    }
  },

  /**
   * Helper: Get currency options formatted for select components.
   */
  async getCurrencyOptions(): Promise<Array<{ value: string; label: string }>> {
    const currencies = await this.getActiveCurrencies();
    return currencies.map((c) => ({
      value: c.codigo,
      label: `${c.codigo} - ${c.nombre}`,
    }));
  },

  /**
   * Helper: Get catalog options by catalog code.
   * Fetches the catalog values and formats them for select components.
   */
  async getCatalogOptionsByCode(
    catalogCode: string
  ): Promise<Array<{ value: string; label: string }>> {
    try {
      const values = await this.getCatalogValuesByCode(catalogCode);
      return values.map((c) => ({
        value: c.codigo,
        label: c.nombre,
      }));
    } catch (error) {
      console.error(`Error getting catalog options for ${catalogCode}:`, error);
      return [];
    }
  },

  /**
   * Get all financial institutions.
   * Used for bank selection fields in forms.
   */
  async getFinancialInstitutions(): Promise<FinancialInstitution[]> {
    try {
      const response = await api.get<FinancialInstitution[]>('/client-portal/catalogs/financial-institutions');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching financial institutions:', error);
      throw error;
    }
  },

  /**
   * Get correspondent banks only.
   */
  async getCorrespondentBanks(): Promise<FinancialInstitution[]> {
    try {
      const response = await api.get<FinancialInstitution[]>('/client-portal/catalogs/financial-institutions/correspondents');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching correspondent banks:', error);
      throw error;
    }
  },

  /**
   * Helper: Get financial institution options formatted for select components.
   * Shows SWIFT code and name for easy identification.
   */
  async getFinancialInstitutionOptions(): Promise<Array<{ value: string; label: string }>> {
    const institutions = await this.getFinancialInstitutions();
    return institutions.map((i) => ({
      value: i.swiftCode || i.codigo,
      label: `${i.swiftCode || i.codigo} - ${i.nombre}`,
    }));
  },
};

export default clientPortalCatalogService;
