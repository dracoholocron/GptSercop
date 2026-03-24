import { useState, useEffect } from 'react';
import { swiftFieldConfigService } from '../services/swiftFieldConfigService';
import type { SwiftFieldConfig } from '../types/swiftField';

/**
 * Hook personalizado para cargar y gestionar campos SWIFT de un mensaje
 *
 * @param messageType - Tipo de mensaje SWIFT (ej: 'MT700')
 * @param section - Sección específica (opcional, ej: 'BASICA', 'MONTOS', 'BANCOS')
 * @returns Campos SWIFT, estado de carga y funciones auxiliares
 */
export const useSwiftFields = (messageType: string, section?: string) => {
  const [fields, setFields] = useState<SwiftFieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFields = async () => {
      try {
        setLoading(true);
        setError(null);

        let loadedFields: SwiftFieldConfig[];

        if (section) {
          // Cargar campos de una sección específica
          loadedFields = await swiftFieldConfigService.getBySection(section, messageType);
        } else {
          // Cargar todos los campos del mensaje
          loadedFields = await swiftFieldConfigService.getAll(messageType, true);
        }

        // Ordenar por display_order
        loadedFields.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        setFields(loadedFields);
      } catch (err) {
        console.error('Error cargando campos SWIFT:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (messageType) {
      loadFields();
    }
  }, [messageType, section]);

  /**
   * Agrupa los campos por sección
   */
  const getFieldsBySection = (): Record<string, SwiftFieldConfig[]> => {
    return fields.reduce((acc, field) => {
      const section = field.section || 'OTHER';
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(field);
      return acc;
    }, {} as Record<string, SwiftFieldConfig[]>);
  };

  /**
   * Obtiene los campos obligatorios
   */
  const getRequiredFields = (): SwiftFieldConfig[] => {
    return fields.filter(field => field.isRequired);
  };

  /**
   * Obtiene los campos opcionales
   */
  const getOptionalFields = (): SwiftFieldConfig[] => {
    return fields.filter(field => !field.isRequired);
  };

  /**
   * Obtiene un campo por su código
   */
  const getFieldByCode = (fieldCode: string): SwiftFieldConfig | undefined => {
    return fields.find(field => field.fieldCode === fieldCode);
  };

  /**
   * Valida si todos los campos obligatorios tienen valor
   */
  const validateRequiredFields = (formData: Record<string, any>): boolean => {
    const requiredFields = getRequiredFields();
    return requiredFields.every(field => {
      const value = formData[field.fieldCode];
      return value !== undefined && value !== null && value !== '';
    });
  };

  /**
   * Obtiene los mensajes de validación para campos faltantes
   * Incluye la sección del campo para mejor contexto
   */
  const getValidationMessages = (formData: Record<string, any>): string[] => {
    const requiredFields = getRequiredFields();
    const messages: string[] = [];

    requiredFields.forEach(field => {
      const value = formData[field.fieldCode];
      if (!value || value === '') {
        const sectionLabel = getSectionLabel(field.section);
        messages.push(`[${sectionLabel}] ${field.fieldCode} ${field.fieldName} - Campo obligatorio`);
      }
    });

    return messages;
  };

  /**
   * Obtiene las secciones únicas ordenadas
   */
  const getSections = (): string[] => {
    const sectionsSet = new Set<string>();
    fields.forEach(f => sectionsSet.add(f.section || 'OTHER'));
    return Array.from(sectionsSet);
  };

  /**
   * Calcula estadísticas de campos llenados por sección
   * @param formData Datos actuales del formulario
   * @returns Objeto con estadísticas por sección
   */
  const getSectionFieldStats = (formData: Record<string, any>): Record<string, {
    total: number;
    filled: number;
    required: number;
    requiredFilled: number;
    percentage: number;
  }> => {
    const fieldsBySection = getFieldsBySection();
    const stats: Record<string, {
      total: number;
      filled: number;
      required: number;
      requiredFilled: number;
      percentage: number;
    }> = {};

    Object.entries(fieldsBySection).forEach(([section, sectionFields]) => {
      const activeFields = sectionFields.filter(f => f.isActive !== false);
      const requiredFields = activeFields.filter(f => f.isRequired);

      let filled = 0;
      let requiredFilled = 0;

      activeFields.forEach(field => {
        const value = formData[field.fieldCode];
        const hasValue = value !== undefined && value !== null && value !== '' &&
          !(typeof value === 'object' && Object.keys(value).length === 0);

        if (hasValue) {
          filled++;
          if (field.isRequired) {
            requiredFilled++;
          }
        }
      });

      stats[section] = {
        total: activeFields.length,
        filled,
        required: requiredFields.length,
        requiredFilled,
        percentage: activeFields.length > 0 ? Math.round((filled / activeFields.length) * 100) : 0,
      };
    });

    return stats;
  };

  return {
    fields,
    loading,
    error,
    getFieldsBySection,
    getRequiredFields,
    getOptionalFields,
    getFieldByCode,
    validateRequiredFields,
    getValidationMessages,
    getSectionFieldStats,
  };
};

export default useSwiftFields;
