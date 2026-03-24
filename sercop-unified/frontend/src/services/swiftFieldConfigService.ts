import { get, post, put, del, apiClient } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';
import { CLIENT_PORTAL_CONFIG_ROUTES } from '../config/api.routes';
import { isClientUser } from '../config/api.client';
import type {
  SwiftFieldConfig,
  CreateSwiftFieldConfigCommand,
  UpdateSwiftFieldConfigCommand,
  ValidationRules,
  FieldDependencies,
  ContextualAlert,
  FieldOption,
  SpecVersionsInfo,
  SwiftVersionComparisonResult
} from '../types/swiftField';

/**
 * Servicio para gestionar configuraciones de campos SWIFT
 */
export const swiftFieldConfigService = {
  /**
   * Obtiene todas las configuraciones de campos para un tipo de mensaje
   *
   * @param messageType Tipo de mensaje (ej: "MT700")
   * @param activeOnly Si true, solo retorna campos activos
   * @param specVersion Version de especificacion (ej: "2024", "2025", "2026") - opcional
   * @returns Lista de configuraciones
   */
  async getAll(messageType: string, activeOnly: boolean = true, specVersion?: string): Promise<SwiftFieldConfig[]> {
    try {
      const params = new URLSearchParams({
        messageType,
        activeOnly: activeOnly.toString()
      });
      // Si se especifica version, usar forceSpecVersion para administradores
      if (specVersion) {
        params.append('forceSpecVersion', specVersion);
      }
      const response = await get(`${API_BASE_URL}/swift-field-configs?${params}`);

      if (!response.ok) {
        throw new Error('Error al obtener configuraciones de campos SWIFT');
      }

      const data = await response.json();

      // Parsear campos JSON
      return (Array.isArray(data) ? data : []).map((config: any) => this.parseConfig(config));
    } catch (error) {
      console.error('Error al obtener configuraciones de campos SWIFT:', error);
      throw error;
    }
  },

  /**
   * Obtiene una configuración por ID
   *
   * @param id ID de la configuración
   * @returns Configuración del campo
   */
  async getById(id: string): Promise<SwiftFieldConfig> {
    try {
      const response = await get(`${API_BASE_URL}/swift-field-configs/${id}`);

      if (!response.ok) {
        throw new Error('Error al obtener configuración de campo');
      }

      const data = await response.json();
      return this.parseConfig(data);
    } catch (error) {
      console.error('Error al obtener configuración de campo:', error);
      throw error;
    }
  },

  /**
   * Obtiene una configuración por código de campo
   *
   * @param fieldCode Código del campo (ej: ":39A:")
   * @param messageType Tipo de mensaje
   * @returns Configuración del campo
   */
  async getByCode(fieldCode: string, messageType: string): Promise<SwiftFieldConfig> {
    try {
      const params = new URLSearchParams({ fieldCode, messageType });
      const response = await get(`${API_BASE_URL}/swift-field-configs/by-code?${params}`);

      if (!response.ok) {
        throw new Error('Error al obtener configuración de campo por código');
      }

      const data = await response.json();
      return this.parseConfig(data);
    } catch (error) {
      console.error('Error al obtener configuración de campo por código:', error);
      throw error;
    }
  },

  /**
   * Obtiene todas las configuraciones de una sección específica
   *
   * @param section Sección (ej: "MONTOS", "BANCOS")
   * @param messageType Tipo de mensaje
   * @returns Lista de configuraciones
   */
  async getBySection(section: string, messageType: string): Promise<SwiftFieldConfig[]> {
    try {
      const params = new URLSearchParams({ section, messageType });
      const response = await get(`${API_BASE_URL}/swift-field-configs/by-section?${params}`);

      if (!response.ok) {
        throw new Error('Error al obtener configuraciones de sección');
      }

      const data = await response.json();
      return (Array.isArray(data) ? data : []).map((config: any) => this.parseConfig(config));
    } catch (error) {
      console.error('Error al obtener configuraciones de sección:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva configuración de campo
   *
   * @param command Datos del campo a crear
   * @returns Configuración creada
   */
  async create(command: CreateSwiftFieldConfigCommand): Promise<SwiftFieldConfig> {
    try {
      const response = await post(`${API_BASE_URL}/swift-field-configs`, command);

      if (!response.ok) {
        throw new Error('Error al crear configuración de campo');
      }

      const data = await response.json();
      return this.parseConfig(data);
    } catch (error) {
      console.error('Error al crear configuración de campo:', error);
      throw error;
    }
  },

  /**
   * Actualiza una configuración de campo existente
   *
   * @param id ID de la configuración
   * @param command Datos a actualizar
   * @returns Configuración actualizada
   */
  async update(id: string, command: UpdateSwiftFieldConfigCommand): Promise<SwiftFieldConfig> {
    try {
      const response = await put(`${API_BASE_URL}/swift-field-configs/${id}`, command);

      if (!response.ok) {
        throw new Error('Error al actualizar configuración de campo');
      }

      const data = await response.json();
      return this.parseConfig(data);
    } catch (error) {
      console.error('Error al actualizar configuración de campo:', error);
      throw error;
    }
  },

  /**
   * Elimina una configuración de campo
   *
   * @param id ID de la configuración
   */
  async delete(id: string): Promise<void> {
    try {
      const response = await del(`${API_BASE_URL}/swift-field-configs/${id}`);

      if (!response.ok) {
        throw new Error('Error al eliminar configuración de campo');
      }
    } catch (error) {
      console.error('Error al eliminar configuración de campo:', error);
      throw error;
    }
  },

  /**
   * Activa una configuración de campo
   *
   * @param id ID de la configuración
   */
  async activate(id: string): Promise<void> {
    try {
      const response = await apiClient(`${API_BASE_URL}/swift-field-configs/${id}/activate`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error('Error al activar configuración de campo');
      }
    } catch (error) {
      console.error('Error al activar configuración de campo:', error);
      throw error;
    }
  },

  /**
   * Desactiva una configuración de campo
   *
   * @param id ID de la configuración
   */
  async deactivate(id: string): Promise<void> {
    try {
      const response = await apiClient(`${API_BASE_URL}/swift-field-configs/${id}/deactivate`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error('Error al desactivar configuración de campo');
      }
    } catch (error) {
      console.error('Error al desactivar configuración de campo:', error);
      throw error;
    }
  },

  /**
   * Parsea una configuración del servidor convirting strings JSON a objetos
   *
   * @param config Configuración desde el servidor
   * @returns Configuración parseada
   */
  parseConfig(config: any): SwiftFieldConfig {
    return {
      ...config,
      validationRules: config.validationRules
        ? this.safeJsonParse<ValidationRules>(config.validationRules)
        : undefined,
      dependencies: config.dependencies
        ? this.safeJsonParse<FieldDependencies>(config.dependencies)
        : undefined,
      contextualAlerts: config.contextualAlerts
        ? this.safeJsonParse<ContextualAlert[]>(config.contextualAlerts)
        : undefined,
      fieldOptions: config.fieldOptions
        ? this.safeJsonParse<FieldOption[]>(config.fieldOptions)
        : undefined,
    };
  },

  /**
   * Parsea JSON de forma segura
   *
   * @param jsonString String JSON
   * @returns Objeto parseado o undefined si falla
   */
  safeJsonParse<T>(jsonString: string): T | undefined {
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Error al parsear JSON:', error);
      return undefined;
    }
  },

  /**
   * Convierte un objeto a string JSON para enviar al servidor
   *
   * @param obj Objeto a convertir
   * @returns String JSON
   */
  toJsonString(obj: any): string | undefined {
    if (!obj) return undefined;
    try {
      return JSON.stringify(obj);
    } catch (error) {
      console.error('Error al convertir objeto a JSON:', error);
      return undefined;
    }
  },

  /**
   * Obtiene las versiones de especificación disponibles para un tipo de mensaje.
   * Uses client portal endpoint for CLIENT users.
   *
   * @param messageType Tipo de mensaje (ej: "MT700")
   * @returns Información de versiones disponibles
   */
  async getSpecVersions(messageType: string): Promise<SpecVersionsInfo> {
    try {
      const params = new URLSearchParams({ messageType });
      // Use client portal endpoint for CLIENT users
      const endpoint = isClientUser()
        ? `${API_BASE_URL}${CLIENT_PORTAL_CONFIG_ROUTES.SWIFT_SPEC_VERSIONS}?${params}`
        : `${API_BASE_URL}/swift-field-configs/spec-versions?${params}`;
      const response = await get(endpoint);

      if (!response.ok) {
        throw new Error('Error al obtener versiones de especificación');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener versiones de especificación:', error);
      throw error;
    }
  },

  /**
   * Compara dos versiones de especificación SWIFT y retorna las diferencias
   *
   * @param messageType Tipo de mensaje (ej: "MT700")
   * @param version1 Primera versión a comparar (ej: "2024")
   * @param version2 Segunda versión a comparar (ej: "2026")
   * @returns Resultado de la comparación
   */
  async compareVersions(
    messageType: string,
    version1: string,
    version2: string
  ): Promise<SwiftVersionComparisonResult> {
    try {
      const params = new URLSearchParams({
        messageType,
        version1,
        version2
      });
      const response = await get(`${API_BASE_URL}/swift-field-configs/compare-versions?${params}`);

      if (!response.ok) {
        throw new Error('Error al comparar versiones de especificación');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al comparar versiones:', error);
      throw error;
    }
  },

  /**
   * Obtiene todos los tipos de componente únicos desde la base de datos
   */
  async getComponentTypes(): Promise<string[]> {
    try {
      const response = await get(`${API_BASE_URL}/swift-field-configs/component-types`);

      if (!response.ok) {
        throw new Error('Error al obtener tipos de componente');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener tipos de componente:', error);
      throw error;
    }
  },

  /**
   * Obtiene todos los tipos de mensaje SWIFT configurados en la base de datos.
   * Incluye todos los mensajes que tienen al menos un campo configurado.
   *
   * @returns Lista de tipos de mensaje (ej: ["MT700", "MT705", "MT710", ...])
   */
  async getMessageTypes(): Promise<string[]> {
    try {
      const response = await get(`${API_BASE_URL}/swift-field-configs/message-types`);

      if (!response.ok) {
        throw new Error('Error al obtener tipos de mensaje');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener tipos de mensaje:', error);
      throw error;
    }
  },

  /**
   * Obtiene todas las secciones únicas configuradas en la base de datos
   *
   * @returns Lista de códigos de sección (ej: ["BASICA", "MONTOS", "PARTES", ...])
   */
  async getSections(): Promise<string[]> {
    try {
      const response = await get(`${API_BASE_URL}/swift-field-configs/sections`);

      if (!response.ok) {
        throw new Error('Error al obtener secciones');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener secciones:', error);
      throw error;
    }
  },

  /**
   * Obtiene todos los tipos de campo únicos configurados en la base de datos
   *
   * @returns Lista de tipos de campo (ej: ["TEXT", "NUMBER", "DATE", ...])
   */
  async getFieldTypes(): Promise<string[]> {
    try {
      const response = await get(`${API_BASE_URL}/swift-field-configs/field-types`);

      if (!response.ok) {
        throw new Error('Error al obtener tipos de campo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener tipos de campo:', error);
      throw error;
    }
  },

  /**
   * Obtiene todos los códigos de campo únicos configurados en la base de datos
   *
   * @returns Lista de códigos de campo (ej: [":20:", ":21:", ":27:", ...])
   */
  async getFieldCodes(): Promise<string[]> {
    try {
      const response = await get(`${API_BASE_URL}/swift-field-configs/field-codes`);

      if (!response.ok) {
        throw new Error('Error al obtener códigos de campo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener códigos de campo:', error);
      throw error;
    }
  },

  /**
   * Obtiene todas las configuraciones de un campo específico a través de todos los tipos de mensaje.
   *
   * @param fieldCode Código del campo (ej: ":20:")
   * @returns Lista de configuraciones del campo en todos los mensajes
   */
  async getByFieldCode(fieldCode: string): Promise<SwiftFieldConfig[]> {
    try {
      const params = new URLSearchParams({ fieldCode });
      const response = await get(`${API_BASE_URL}/swift-field-configs/by-field-code?${params}`);

      if (!response.ok) {
        throw new Error('Error al obtener configuraciones por código de campo');
      }

      const data = await response.json();
      return (Array.isArray(data) ? data : []).map((config: any) => this.parseConfig(config));
    } catch (error) {
      console.error('Error al obtener configuraciones por código de campo:', error);
      throw error;
    }
  },

  /**
   * Sincroniza configuraciones de campo desde un campo fuente a campos destino.
   *
   * @param sourceId ID del campo fuente (modelo)
   * @param targetIds Lista de IDs de campos destino a actualizar
   * @param properties Propiedades específicas a sincronizar (opcional)
   * @returns Resultado de la sincronización
   */
  async syncFields(
    sourceId: string,
    targetIds: string[],
    properties?: string[]
  ): Promise<{ success: boolean; updatedCount: number; message: string }> {
    try {
      const params = new URLSearchParams({ sourceId });
      if (properties && properties.length > 0) {
        properties.forEach(p => params.append('properties', p));
      }

      const response = await post(
        `${API_BASE_URL}/swift-field-configs/sync-fields?${params}`,
        targetIds
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al sincronizar campos');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al sincronizar campos:', error);
      throw error;
    }
  }
};

export default swiftFieldConfigService;
