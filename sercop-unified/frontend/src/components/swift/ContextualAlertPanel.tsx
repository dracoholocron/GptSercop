import React, { useState } from 'react';
import {
  Alert,
  VStack,
  Box,
  Text,
  Badge,
  HStack,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import { FiChevronDown, FiChevronUp, FiInfo, FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';
import type { ContextualAlert, ValidationSeverity } from '../../types/swiftField';

/**
 * Props del componente ContextualAlertPanel
 */
interface ContextualAlertPanelProps {
  /** Lista de alertas contextuales a mostrar */
  alerts: ContextualAlert[];
  /** Título del panel (opcional) */
  title?: string;
  /** Si el panel está colapsable */
  collapsible?: boolean;
  /** Si el panel inicia colapsado */
  defaultIsOpen?: boolean;
}

/**
 * Mapea el tipo de severidad a un status de Chakra UI
 */
const severityToStatus = (severity: ValidationSeverity): 'error' | 'warning' | 'info' => {
  switch (severity) {
    case 'ERROR':
      return 'error';
    case 'WARNING':
      return 'warning';
    case 'INFO':
    default:
      return 'info';
  }
};

/**
 * Obtiene el icono según la severidad
 */
const getSeverityIcon = (severity: ValidationSeverity) => {
  switch (severity) {
    case 'ERROR':
      return FiAlertCircle;
    case 'WARNING':
      return FiAlertTriangle;
    case 'INFO':
    default:
      return FiInfo;
  }
};

/**
 * Componente que muestra un panel de alertas contextuales
 *
 * Este componente muestra alertas dinámicas basadas en el estado del formulario.
 * Las alertas pueden tener diferentes niveles de severidad y sugerir campos relacionados.
 *
 * @example
 * ```tsx
 * const alerts = getContextualAlerts(formData);
 * <ContextualAlertPanel alerts={alerts} title="Avisos Importantes" />
 * ```
 */
export const ContextualAlertPanel: React.FC<ContextualAlertPanelProps> = ({
  alerts,
  title = 'Avisos y Recomendaciones',
  collapsible = true,
  defaultIsOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultIsOpen);

  const onToggle = () => setIsOpen(!isOpen);

  // Si no hay alertas, no renderizar nada
  if (!alerts || alerts.length === 0) {
    return null;
  }

  // Agrupar alertas por severidad
  const errorAlerts = alerts.filter(a => a.severity === 'ERROR');
  const warningAlerts = alerts.filter(a => a.severity === 'WARNING');
  const infoAlerts = alerts.filter(a => a.severity === 'INFO');

  const renderAlert = (alert: ContextualAlert, index: number, prefix: string) => {
    const status = severityToStatus(alert.severity);
    const AlertIcon = getSeverityIcon(alert.severity);

    return (
      <Alert.Root
        key={`${prefix}-${index}`}
        status={status}
        borderRadius="md"
        variant="outline"
      >
        <Alert.Indicator>
          <Icon as={AlertIcon} />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Description>{alert.message}</Alert.Description>
          {alert.suggestedFields && alert.suggestedFields.length > 0 && (
            <Text fontSize="sm" mt={1} color="gray.600">
              Campos relacionados: {alert.suggestedFields.join(', ')}
            </Text>
          )}
        </Alert.Content>
      </Alert.Root>
    );
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      borderColor="gray.200"
      bg="white"
      p={4}
      mb={4}
      shadow="sm"
    >
      {/* Header del panel */}
      <HStack justifyContent="space-between" mb={collapsible ? 0 : 3}>
        <HStack gap={3}>
          <Text fontWeight="bold" fontSize="md">
            {title}
          </Text>
          {errorAlerts.length > 0 && (
            <Badge colorPalette="red" fontSize="xs">
              {errorAlerts.length} error{errorAlerts.length > 1 ? 'es' : ''}
            </Badge>
          )}
          {warningAlerts.length > 0 && (
            <Badge colorPalette="orange" fontSize="xs">
              {warningAlerts.length} advertencia{warningAlerts.length > 1 ? 's' : ''}
            </Badge>
          )}
          {infoAlerts.length > 0 && (
            <Badge colorPalette="blue" fontSize="xs">
              {infoAlerts.length} info
            </Badge>
          )}
        </HStack>
        {collapsible && (
          <IconButton
            aria-label="Toggle alerts"
            size="sm"
            variant="ghost"
            onClick={onToggle}
          >
            {isOpen ? <FiChevronUp /> : <FiChevronDown />}
          </IconButton>
        )}
      </HStack>

      {/* Contenido colapsable */}
      {(!collapsible || isOpen) && (
        <VStack gap={3} align="stretch" mt={collapsible ? 3 : 0}>
          {/* Renderizar alertas de ERROR primero */}
          {errorAlerts.map((alert, index) => renderAlert(alert, index, 'error'))}

          {/* Renderizar alertas de WARNING */}
          {warningAlerts.map((alert, index) => renderAlert(alert, index, 'warning'))}

          {/* Renderizar alertas de INFO */}
          {infoAlerts.map((alert, index) => renderAlert(alert, index, 'info'))}
        </VStack>
      )}
    </Box>
  );
};

export default ContextualAlertPanel;
