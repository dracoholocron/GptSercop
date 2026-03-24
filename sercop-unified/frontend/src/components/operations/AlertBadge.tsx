/**
 * AlertBadge - Badge con tooltip que muestra detalles de las alertas
 */
import { useState, useEffect } from 'react';
import { Badge, HStack, Text, VStack, Box, Tooltip, Spinner } from '@chakra-ui/react';
import { FiAlertCircle, FiAlertTriangle, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { operationsApi } from '../../services/operationsApi';
import type { OperationAlert } from '../../types/operations';

interface AlertBadgeProps {
  operationId: string;
  alertCount: number;
}

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'DANGER':
      return <FiAlertCircle color="#E53E3E" size={14} />;
    case 'WARNING':
      return <FiAlertTriangle color="#DD6B20" size={14} />;
    case 'INFO':
      return <FiInfo color="#3182CE" size={14} />;
    case 'SUCCESS':
      return <FiCheckCircle color="#38A169" size={14} />;
    default:
      return <FiAlertCircle color="#E53E3E" size={14} />;
  }
};

const getAlertColor = (type: string) => {
  switch (type) {
    case 'DANGER':
      return 'red.600';
    case 'WARNING':
      return 'orange.600';
    case 'INFO':
      return 'blue.600';
    case 'SUCCESS':
      return 'green.600';
    default:
      return 'red.600';
  }
};

export const AlertBadge: React.FC<AlertBadgeProps> = ({ operationId, alertCount }) => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<OperationAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadAlerts = async () => {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const data = await operationsApi.getOperationAlerts(operationId);
      setAlerts(data);
      setLoaded(true);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip.Root positioning={{ placement: 'top' }} openDelay={200}>
      <Tooltip.Trigger asChild>
        <Badge
          size="sm"
          colorPalette="red"
          cursor="pointer"
          onMouseEnter={loadAlerts}
        >
          <HStack gap={1}>
            <FiAlertCircle size={12} />
            <Text>{alertCount}</Text>
          </HStack>
        </Badge>
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content
          bg="gray.800"
          color="white"
          px={3}
          py={2}
          borderRadius="md"
          maxW="300px"
          shadow="lg"
        >
          {loading ? (
            <HStack gap={2}>
              <Spinner size="xs" />
              <Text fontSize="sm">{t('common.loading')}</Text>
            </HStack>
          ) : alerts.length > 0 ? (
            <VStack align="start" gap={2}>
              <Text fontSize="xs" fontWeight="bold" color="gray.300">
                {t('operations.alerts', 'Alerts')} ({alerts.length})
              </Text>
              {alerts.map((alert, index) => (
                <HStack key={index} gap={2} align="start">
                  {getAlertIcon(alert.type)}
                  <VStack align="start" gap={0}>
                    <Text fontSize="xs" fontWeight="medium" color={getAlertColor(alert.type)}>
                      {t(`operations.alertCodes.${alert.code}`, alert.code)}
                    </Text>
                    <Text fontSize="xs" color="gray.200">
                      {t(`operations.alertMessages.${alert.code}`, { ...alert.params, defaultValue: alert.code })}
                    </Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          ) : (
            <Text fontSize="sm">{t('operations.noAlerts', 'Sin alertas')}</Text>
          )}
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
};

export default AlertBadge;
