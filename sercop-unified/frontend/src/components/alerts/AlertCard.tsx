import { Box, HStack, VStack, Text, Badge, IconButton, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  FiCheck,
  FiClock,
  FiUser,
  FiFileText,
  FiPhone,
  FiRefreshCw,
  FiShield,
  FiBell,
  FiCheckSquare,
  FiUserCheck,
  FiAlertTriangle,
  FiVideo,
  FiUsers,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import type { AlertResponse, AlertPriority, AlertType } from '../../services/alertService';
import { TagDisplay } from './TagSelector';

interface AlertCardProps {
  alert: AlertResponse;
  compact?: boolean;
  onClick?: () => void;
  onQuickComplete?: () => void;
}

const getAlertTypeIcon = (type: AlertType) => {
  const icons: Record<AlertType, React.ReactNode> = {
    FOLLOW_UP: <FiUserCheck />,
    REMINDER: <FiBell />,
    DEADLINE: <FiClock />,
    TASK: <FiCheckSquare />,
    DOCUMENT_REVIEW: <FiFileText />,
    CLIENT_CONTACT: <FiPhone />,
    OPERATION_UPDATE: <FiRefreshCw />,
    COMPLIANCE_CHECK: <FiShield />,
    VIDEO_CALL: <FiVideo />,
  };
  return icons[type] || <FiBell />;
};

const getPriorityColor = (priority: AlertPriority) => {
  const colors: Record<AlertPriority, string> = {
    LOW: 'gray',
    NORMAL: 'blue',
    HIGH: 'orange',
    URGENT: 'red',
  };
  return colors[priority] || 'blue';
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: 'yellow',
    IN_PROGRESS: 'blue',
    COMPLETED: 'green',
    CANCELLED: 'gray',
    SNOOZED: 'purple',
  };
  return colors[status] || 'gray';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    IN_PROGRESS: 'En Progreso',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
    SNOOZED: 'Pospuesta',
  };
  return labels[status] || status;
};

const getTypeColor = (type: AlertType): string => {
  const colors: Record<AlertType, string> = {
    FOLLOW_UP: 'blue',
    REMINDER: 'yellow',
    DEADLINE: 'red',
    TASK: 'green',
    DOCUMENT_REVIEW: 'purple',
    CLIENT_CONTACT: 'teal',
    OPERATION_UPDATE: 'orange',
    COMPLIANCE_CHECK: 'red',
    VIDEO_CALL: 'cyan',
  };
  return colors[type] || 'gray';
};

export const AlertCard = ({ alert, compact = false, onClick, onQuickComplete }: AlertCardProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const priorityColor = getPriorityColor(alert.priority);
  const typeColor = getTypeColor(alert.alertType);

  const formatTime = (time?: string) => {
    if (!time) return null;
    return time.substring(0, 5);
  };

  if (compact) {
    return (
      <Box
        p={2}
        borderRadius="md"
        bg={alert.overdue ? 'red.500/10' : colors.bgColor}
        borderWidth={1}
        borderColor={alert.overdue ? 'red.300' : colors.borderColor}
        borderLeftWidth={3}
        borderLeftColor={`${typeColor}.500`}
        cursor="pointer"
        _hover={{ boxShadow: 'sm', transform: 'translateY(-1px)' }}
        transition="all 0.2s"
        onClick={onClick}
      >
        <HStack justify="space-between" align="flex-start">
          <VStack align="flex-start" gap={0} flex={1}>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color={alert.overdue ? 'red.600' : colors.textColor}
              noOfLines={1}
            >
              {alert.title}
            </Text>
            {alert.scheduledTime && (
              <HStack gap={1}>
                <FiClock size={10} color={colors.textColorSecondary} />
                <Text fontSize="xs" color={colors.textColorSecondary}>
                  {formatTime(alert.scheduledTime)}
                </Text>
              </HStack>
            )}
          </VStack>
          {alert.priority === 'URGENT' && (
            <FiAlertTriangle size={12} color="red" />
          )}
        </HStack>
      </Box>
    );
  }

  return (
    <Box
      p={4}
      borderRadius="lg"
      bg={alert.overdue ? 'red.500/10' : colors.cardBg}
      borderWidth={1}
      borderColor={alert.overdue ? 'red.300' : colors.borderColor}
      borderLeftWidth={4}
      borderLeftColor={`${typeColor}.500`}
      cursor="pointer"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
      transition="all 0.2s"
      onClick={onClick}
    >
      <Flex justify="space-between" align="flex-start">
        <HStack align="flex-start" gap={3} flex={1}>
          <Box
            p={2}
            borderRadius="md"
            bg={`${typeColor}.500/15`}
            color={`${typeColor}.500`}
          >
            {getAlertTypeIcon(alert.alertType)}
          </Box>

          <VStack align="flex-start" gap={1} flex={1}>
            <HStack gap={2} flexWrap="wrap">
              <Text fontWeight="semibold" color={colors.textColor}>
                {alert.title}
              </Text>
              {alert.overdue && (
                <Badge colorPalette="red" fontSize="xs">
                  {t('alerts.overdue', 'Vencida')}
                </Badge>
              )}
              {alert.dueToday && !alert.overdue && (
                <Badge colorPalette="orange" fontSize="xs">
                  {t('alerts.today', 'Hoy')}
                </Badge>
              )}
            </HStack>

            {alert.description && (
              <Text fontSize="sm" color={colors.textColorSecondary} noOfLines={2}>
                {alert.description}
              </Text>
            )}

            <HStack gap={3} flexWrap="wrap" mt={1}>
              {alert.scheduledTime && (
                <HStack gap={1}>
                  <FiClock size={12} color={colors.textColorSecondary} />
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    {formatTime(alert.scheduledTime)}
                  </Text>
                </HStack>
              )}

              {alert.clientName && (
                <HStack gap={1}>
                  <FiUser size={12} color={colors.textColorSecondary} />
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    {alert.clientName}
                  </Text>
                </HStack>
              )}

              {alert.assignedBy && (
                <HStack gap={1}>
                  <FiUsers size={12} color={colors.textColorSecondary} />
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    {t('alerts.assignedBy', 'Por')}: {alert.assignedBy}
                  </Text>
                </HStack>
              )}

              <Badge colorPalette={priorityColor} fontSize="xs">
                {alert.priority}
              </Badge>

              <Badge colorPalette={getStatusColor(alert.status)} fontSize="xs" variant="subtle">
                {getStatusLabel(alert.status)}
              </Badge>

              <Text fontSize="xs" color={colors.textColorSecondary}>
                {alert.alertTypeLabel || alert.alertType}
              </Text>
            </HStack>

            {/* Tags Display */}
            {alert.tags && alert.tags.length > 0 && (
              <Box mt={2}>
                <TagDisplay tags={alert.tags} maxVisible={4} />
              </Box>
            )}
          </VStack>
        </HStack>

        {onQuickComplete && alert.status !== 'COMPLETED' && (
          <IconButton
            aria-label="Complete"
            icon={<FiCheck />}
            size="sm"
            variant="ghost"
            colorScheme="green"
            onClick={(e) => {
              e.stopPropagation();
              onQuickComplete();
            }}
          />
        )}
      </Flex>
    </Box>
  );
};

export default AlertCard;
