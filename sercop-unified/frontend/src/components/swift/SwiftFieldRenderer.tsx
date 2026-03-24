import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  Heading,
  SimpleGrid,
  Separator,
  Text,
  Spinner,
  Alert,
  Icon,
} from '@chakra-ui/react';
import { FiAlertCircle, FiInfo } from 'react-icons/fi';
import { useSwiftFieldConfig } from '../../hooks/useSwiftFieldConfig';
import { DynamicSwiftField } from './DynamicSwiftField';
import { ContextualAlertPanel } from './ContextualAlertPanel';
import type { ValidationError } from '../../types/swiftField';

/**
 * Props del componente SwiftFieldRenderer
 */
interface SwiftFieldRendererProps {
  /** Tipo de mensaje SWIFT (ej: "MT700") */
  messageType: string;
  /** Datos del formulario */
  formData: Record<string, any>;
  /** Callback al cambiar cualquier campo */
  onChange: (fieldCode: string, value: any) => void;
  /** Si solo mostrar campos opcionales */
  optionalOnly?: boolean;
  /** Si solo mostrar campos obligatorios */
  requiredOnly?: boolean;
  /** Secciones específicas a renderizar (si no se especifica, se renderizan todas) */
  sections?: string[];
  /** Si mostrar el panel de alertas contextuales */
  showAlerts?: boolean;
  /** Número de columnas en la grilla (default: 2) */
  columns?: number;
  /** Si agrupar campos por sección con headers visuales */
  groupBySections?: boolean;
  /** Callback con todos los errores de validación (se ejecuta en cada cambio) */
  onValidationChange?: (errors: Record<string, ValidationError>) => void;
}

/**
 * Componente de alto nivel para renderizar campos SWIFT dinámicamente
 *
 * Este componente es el punto de integración principal del sistema.
 * Obtiene las configuraciones del servidor, renderiza los campos apropiados,
 * maneja validaciones y muestra alertas contextuales.
 *
 * @example
 * ```tsx
 * // Renderizar todos los campos MT700
 * <SwiftFieldRenderer
 *   messageType="MT700"
 *   formData={formData}
 *   onChange={handleFieldChange}
 *   showAlerts={true}
 *   groupBySections={true}
 * />
 *
 * // Renderizar solo campos opcionales
 * <SwiftFieldRenderer
 *   messageType="MT700"
 *   formData={formData}
 *   onChange={handleFieldChange}
 *   optionalOnly={true}
 *   sections={["MONTOS", "BANCOS"]}
 * />
 * ```
 */
export const SwiftFieldRenderer: React.FC<SwiftFieldRendererProps> = ({
  messageType,
  formData,
  onChange,
  optionalOnly = false,
  requiredOnly = false,
  sections,
  showAlerts = true,
  columns = 2,
  groupBySections = true,
  onValidationChange,
}) => {
  const {
    configs,
    loading,
    error: loadError,
    validateField,
    validateForm,
    getDependentFields,
    getContextualAlerts,
    isFieldEnabled,
    isFieldVisible,
    isFieldRequired,
    getFieldsBySection,
    getSections,
    getOptionalFields,
    getRequiredFields,
  } = useSwiftFieldConfig(messageType);

  const [fieldErrors, setFieldErrors] = useState<Record<string, ValidationError>>({});

  // Validar formulario completo en cada cambio de formData
  useEffect(() => {
    const errors = validateForm(formData);
    setFieldErrors(errors);

    // Notificar cambios de validación al padre si hay callback
    if (onValidationChange) {
      onValidationChange(errors);
    }
  }, [formData, validateForm, onValidationChange]);

  /**
   * Handler para cambios en campos individuales
   * Re-valida el campo modificado y sus dependientes
   */
  const handleFieldChange = useCallback((fieldCode: string, value: any) => {
    // Actualizar el valor del campo
    onChange(fieldCode, value);

    // Re-validar el campo modificado
    const error = validateField(fieldCode, value, { ...formData, [fieldCode]: value });
    setFieldErrors(prev => ({
      ...prev,
      [fieldCode]: error || undefined,
    }));

    // Re-validar campos dependientes
    const dependents = getDependentFields(fieldCode);
    dependents.forEach(depFieldCode => {
      const depValue = formData[depFieldCode];
      const depError = validateField(depFieldCode, depValue, { ...formData, [fieldCode]: value });
      setFieldErrors(prev => ({
        ...prev,
        [depFieldCode]: depError || undefined,
      }));
    });
  }, [onChange, formData, validateField, getDependentFields]);

  // Obtener alertas contextuales
  const alerts = showAlerts ? getContextualAlerts(formData) : [];

  // Filtrar configuraciones según criterios
  let filteredConfigs = configs;
  if (optionalOnly) {
    filteredConfigs = getOptionalFields();
  } else if (requiredOnly) {
    filteredConfigs = getRequiredFields();
  }

  // Filtrar por secciones si se especificaron
  if (sections && sections.length > 0) {
    filteredConfigs = filteredConfigs.filter(c => sections.includes(c.section));
  }

  // Determinar qué secciones renderizar
  const sectionsToRender = sections || getSections();

  // Loading state
  if (loading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">Cargando configuración de campos SWIFT...</Text>
      </Box>
    );
  }

  // Error state
  if (loadError) {
    return (
      <Alert.Root status="error" borderRadius="md">
        <Alert.Indicator>
          <Icon as={FiAlertCircle} />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Description>{loadError}</Alert.Description>
        </Alert.Content>
      </Alert.Root>
    );
  }

  // No hay configuraciones
  if (filteredConfigs.length === 0) {
    return (
      <Alert.Root status="info" borderRadius="md">
        <Alert.Indicator>
          <Icon as={FiInfo} />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Description>
            No hay campos configurados para mostrar.
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>
    );
  }

  /**
   * Renderiza campos de una sección específica
   */
  const renderSectionFields = (section: string) => {
    const sectionFields = getFieldsBySection(section).filter(config =>
      filteredConfigs.some(fc => fc.id === config.id)
    );

    if (sectionFields.length === 0) {
      return null;
    }

    return (
      <Box key={section} mb={6}>
        {groupBySections && (
          <>
            <Heading size="sm" mb={3} color="blue.600">
              {section}
            </Heading>
            <Separator mb={4} />
          </>
        )}
        <SimpleGrid columns={columns} spacing={4}>
          {sectionFields.map((config) => {
            const visible = isFieldVisible(config.fieldCode, formData);
            const enabled = isFieldEnabled(config.fieldCode, formData);
            const required = isFieldRequired(config.fieldCode, formData);

            if (!visible) {
              return null;
            }

            return (
              <DynamicSwiftField
                key={config.id}
                config={config}
                value={formData[config.fieldCode]}
                onChange={handleFieldChange}
                formData={formData}
                error={fieldErrors[config.fieldCode]}
                disabled={!enabled}
                required={required}
              />
            );
          })}
        </SimpleGrid>
      </Box>
    );
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Panel de alertas contextuales */}
      {showAlerts && alerts.length > 0 && (
        <ContextualAlertPanel alerts={alerts} />
      )}

      {/* Campos agrupados por sección */}
      {sectionsToRender.map(section => renderSectionFields(section))}
    </VStack>
  );
};

export default SwiftFieldRenderer;
