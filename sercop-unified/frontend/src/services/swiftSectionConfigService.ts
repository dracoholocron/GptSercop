import { API_BASE_URL } from '../config/api.config';

/**
 * Configuración de una sección SWIFT
 */
export interface SwiftSectionConfig {
  id: string;
  sectionCode: string;
  labelKey: string;
  descriptionKey?: string;
  messageType: string;
  displayOrder: number;
  icon?: string;
  isActive: boolean;
}

const BASE_URL = `${API_BASE_URL}/swift-section-config`;

/**
 * Servicio para obtener configuraciones de secciones SWIFT desde el backend
 */
export const swiftSectionConfigService = {
  /**
   * Obtiene las secciones activas para un tipo de mensaje
   */
  async getSectionsByMessageType(messageType: string, includeInactive = false): Promise<SwiftSectionConfig[]> {
    const url = `${BASE_URL}/${messageType}?includeInactive=${includeInactive}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching sections for ${messageType}: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtiene los tipos de mensaje que tienen secciones configuradas
   */
  async getConfiguredMessageTypes(): Promise<string[]> {
    const url = `${BASE_URL}/message-types`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching message types: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtiene una sección específica
   */
  async getSectionByCode(messageType: string, sectionCode: string): Promise<SwiftSectionConfig | null> {
    const url = `${BASE_URL}/${messageType}/${sectionCode}`;
    const response = await fetch(url);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Error fetching section: ${response.statusText}`);
    }

    return response.json();
  }
};

export default swiftSectionConfigService;
