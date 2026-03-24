import { get, post } from '../utils/apiClient';
import { REFERENCE_NUMBER_ROUTES, buildUrlWithParams } from '../config/api.routes';

export interface ReferenceNumberConfig {
  id?: number;
  clientId: string;
  clientName: string;
  productCode: string;
  countryCode: string;
  agencyDigits: number;
  yearDigits: number;
  sequentialDigits: number;
  separator: string;
  formatExample: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface GenerateReferenceRequest {
  clientId?: string;
  productCode: string;
  countryCode: string;
  agencyCode: string;
  entityType?: string;
  entityId?: string;
  generatedBy?: string;
}

export interface ReferenceNumberHistory {
  id: number;
  configId: number;
  referenceNumber: string;
  productCode: string;
  countryCode: string;
  agencyCode: string;
  yearCode: string;
  sequenceNumber: number;
  entityType?: string;
  entityId?: string;
  generatedAt: string;
  generatedBy?: string;
}

export const referenceNumberService = {
  /**
   * Generates a new reference number
   */
  async generateReferenceNumber(request: GenerateReferenceRequest): Promise<string> {
    try {
      const response = await post(REFERENCE_NUMBER_ROUTES.GENERATE, request);
      const data = await response.json();
      return data.referenceNumber;
    } catch (error) {
      console.error('Error generating reference number:', error);
      throw error;
    }
  },

  /**
   * Gets a preview of the next reference number without generating it
   */
  async getPreview(
    productCode: string,
    countryCode: string,
    agencyCode: string,
    clientId: string = 'DEFAULT'
  ): Promise<string> {
    try {
      const url = buildUrlWithParams(REFERENCE_NUMBER_ROUTES.PREVIEW, {
        clientId,
        productCode,
        countryCode,
        agencyCode,
      });
      const response = await get(url);
      const data = await response.json();
      return data.preview;
    } catch (error) {
      console.error('Error getting reference number preview:', error);
      throw error;
    }
  },

  /**
   * Gets all active configurations
   */
  async getAllConfigurations(): Promise<ReferenceNumberConfig[]> {
    try {
      const response = await get(REFERENCE_NUMBER_ROUTES.CONFIGURATIONS);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching configurations:', error);
      throw error;
    }
  },

  /**
   * Gets a specific configuration
   */
  async getConfiguration(
    clientId: string,
    productCode: string,
    countryCode: string
  ): Promise<ReferenceNumberConfig | null> {
    try {
      const response = await get(
        REFERENCE_NUMBER_ROUTES.CONFIGURATION_BY_ID(clientId, productCode, countryCode)
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching configuration:', error);
      return null;
    }
  },

  /**
   * Saves or updates a configuration
   */
  async saveConfiguration(config: ReferenceNumberConfig): Promise<ReferenceNumberConfig> {
    try {
      const response = await post(REFERENCE_NUMBER_ROUTES.CONFIGURATIONS, config);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  },

  /**
   * Gets history by reference number
   */
  async getHistoryByReferenceNumber(referenceNumber: string): Promise<ReferenceNumberHistory | null> {
    try {
      const response = await get(REFERENCE_NUMBER_ROUTES.HISTORY_BY_NUMBER(referenceNumber));
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching history:', error);
      return null;
    }
  },

  /**
   * Gets history by entity
   */
  async getHistoryByEntity(entityType: string, entityId: string): Promise<ReferenceNumberHistory[]> {
    try {
      const url = buildUrlWithParams(REFERENCE_NUMBER_ROUTES.HISTORY_BY_ENTITY, {
        entityType,
        entityId,
      });
      const response = await get(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching entity history:', error);
      return [];
    }
  },
};
