import { useState, useEffect, useMemo, useCallback } from 'react';
import type { SwiftFieldConfig, ValidationError, ValidationResult } from '../types/swiftField';
import { swiftFieldConfigService } from '../services/swiftFieldConfigService';
import { SwiftValidationService } from '../services/swiftValidationService';

/**
 * Hook para gestionar configuraciones de campos SWIFT y validaciones
 *
 * @param messageType Tipo de mensaje SWIFT (ej: "MT700")
 * @returns Configuraciones, servicio de validación y funciones de utilidad
 */
export const useSwiftFieldConfig = (messageType: string) => {
  const [configs, setConfigs] = useState<SwiftFieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Crear servicio de validación memoizado
  const validationService = useMemo(() => {
    if (configs.length === 0) return null;
    return new SwiftValidationService(configs);
  }, [configs]);

  /**
   * Carga las configuraciones de campos desde el servidor
   */
  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await swiftFieldConfigService.getAll(messageType, true);
      setConfigs(data);
    } catch (err) {
      setError('Error al cargar configuración de campos SWIFT');
      console.error('Error loading Swift field configs:', err);
    } finally {
      setLoading(false);
    }
  }, [messageType]);

  // Cargar configuraciones al montar o cambiar messageType
  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  /**
   * Obtiene la configuración de un campo específico
   *
   * @param fieldCode Código del campo
   * @returns Configuración del campo o undefined
   */
  const getFieldConfig = useCallback((fieldCode: string): SwiftFieldConfig | undefined => {
    return configs.find(c => c.fieldCode === fieldCode);
  }, [configs]);

  /**
   * Obtiene todos los campos de una sección específica
   *
   * @param section Nombre de la sección
   * @returns Lista de campos ordenados
   */
  const getFieldsBySection = useCallback((section: string): SwiftFieldConfig[] => {
    return configs
      .filter(c => c.section === section)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [configs]);

  /**
   * Obtiene todos los campos opcionales
   *
   * @returns Lista de campos opcionales
   */
  const getOptionalFields = useCallback((): SwiftFieldConfig[] => {
    return configs
      .filter(c => !c.isRequired)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [configs]);

  /**
   * Obtiene todos los campos obligatorios
   *
   * @returns Lista de campos obligatorios
   */
  const getRequiredFields = useCallback((): SwiftFieldConfig[] => {
    return configs
      .filter(c => c.isRequired)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [configs]);

  /**
   * Obtiene todas las secciones únicas
   *
   * @returns Lista de secciones
   */
  const getSections = useCallback((): string[] => {
    const sections = new Set(configs.map(c => c.section));
    return Array.from(sections).sort();
  }, [configs]);

  /**
   * Valida un campo específico
   *
   * @param fieldCode Código del campo
   * @param value Valor del campo
   * @param allFormData Todos los datos del formulario
   * @returns Error de validación o null
   */
  const validateField = useCallback((
    fieldCode: string,
    value: any,
    allFormData: Record<string, any>
  ): ValidationError | null => {
    if (!validationService) return null;
    return validationService.validateField(fieldCode, value, allFormData);
  }, [validationService]);

  /**
   * Valida todos los campos del formulario
   * Excluye campos ocultos (hidden) que se calculan automáticamente en backend
   *
   * @param formData Datos completos del formulario
   * @returns Mapa de errores por campo
   */
  const validateForm = useCallback((
    formData: Record<string, any>
  ): Record<string, ValidationError> => {
    if (!validationService) return {};

    const errors: Record<string, ValidationError> = {};
    const missingRequiredFields: string[] = [];

    configs.forEach(config => {
      // Skip hidden fields - they are computed automatically by backend
      if (config.componentType === 'hidden' || config.componentType === 'HIDDEN') {
        return;
      }

      const value = formData[config.fieldCode];
      const error = validationService.validateField(config.fieldCode, value, formData);
      if (error) {
        errors[config.fieldCode] = error;
        if (error.type === 'required') {
          missingRequiredFields.push(`${config.fieldCode} ${config.fieldName}`);
        }
      }
    });

    // Log missing required fields for debugging
    if (missingRequiredFields.length > 0) {
      console.log('Missing required fields:', missingRequiredFields);
    }

    return errors;
  }, [validationService, configs]);

  /**
   * Valida todos los campos y retorna un resultado estructurado
   * Útil para validar antes de enviar a aprobación
   *
   * @param formData Datos completos del formulario
   * @returns Resultado de validación con isValid y lista de errores
   */
  const validateAllFields = useCallback((
    formData: Record<string, any>
  ): ValidationResult => {
    if (!validationService) {
      return { isValid: true, errors: [] };
    }
    return validationService.validateAllFields(formData);
  }, [validationService]);

  /**
   * Valida solo los campos obligatorios
   * Útil para validación rápida antes de avanzar de paso
   *
   * @param formData Datos completos del formulario
   * @returns Resultado de validación
   */
  const validateRequiredFields = useCallback((
    formData: Record<string, any>
  ): ValidationResult => {
    if (!validationService) {
      return { isValid: true, errors: [] };
    }
    return validationService.validateRequiredFields(formData);
  }, [validationService]);

  /**
   * Obtiene un resumen de errores para mostrar al usuario
   */
  const getErrorSummary = useCallback((
    errors: ValidationError[]
  ): string => {
    if (!validationService) return 'Sin errores';
    return validationService.getErrorSummary(errors);
  }, [validationService]);

  /**
   * Obtiene los campos que deben re-validarse cuando cambia un campo
   *
   * @param fieldCode Código del campo que cambió
   * @returns Lista de códigos de campos dependientes
   */
  const getDependentFields = useCallback((fieldCode: string): string[] => {
    if (!validationService) return [];
    return validationService.getDependentFields(fieldCode);
  }, [validationService]);

  /**
   * Obtiene las alertas contextuales que deben mostrarse
   *
   * @param formData Datos del formulario
   * @returns Lista de alertas
   */
  const getContextualAlerts = useCallback((formData: Record<string, any>) => {
    if (!validationService) return [];
    return validationService.getContextualAlerts(formData);
  }, [validationService]);

  /**
   * Verifica si un campo debe estar habilitado
   *
   * @param fieldCode Código del campo
   * @param formData Datos del formulario
   * @returns true si debe estar habilitado
   */
  const isFieldEnabled = useCallback((
    fieldCode: string,
    formData: Record<string, any>
  ): boolean => {
    if (!validationService) return true;
    return validationService.isFieldEnabled(fieldCode, formData);
  }, [validationService]);

  /**
   * Verifica si un campo debe ser visible
   *
   * @param fieldCode Código del campo
   * @param formData Datos del formulario
   * @returns true si debe ser visible
   */
  const isFieldVisible = useCallback((
    fieldCode: string,
    formData: Record<string, any>
  ): boolean => {
    if (!validationService) return true;
    return validationService.isFieldVisible(fieldCode, formData);
  }, [validationService]);

  /**
   * Verifica si un campo debe ser obligatorio (considerando dependencias)
   *
   * @param fieldCode Código del campo
   * @param formData Datos del formulario
   * @returns true si debe ser obligatorio
   */
  const isFieldRequired = useCallback((
    fieldCode: string,
    formData: Record<string, any>
  ): boolean => {
    if (!validationService) return false;
    return validationService.isFieldRequired(fieldCode, formData);
  }, [validationService]);

  return {
    // Estado
    configs,
    loading,
    error,

    // Servicio de validación
    validationService,

    // Funciones de consulta
    getFieldConfig,
    getFieldsBySection,
    getOptionalFields,
    getRequiredFields,
    getSections,

    // Funciones de validación
    validateField,
    validateForm,
    validateAllFields,
    validateRequiredFields,
    getDependentFields,
    getContextualAlerts,
    getErrorSummary,

    // Funciones de comportamiento dinámico
    isFieldEnabled,
    isFieldVisible,
    isFieldRequired,

    // Utilidades
    reload: loadConfigs,
  };
};

export default useSwiftFieldConfig;
