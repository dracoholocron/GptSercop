/**
 * AlertNotificationToast Component
 * Spectacular notification toast for real-time alerts with type icons
 * and video call accept/decline functionality.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  FiCalendar,
  FiBell,
  FiClock,
  FiCheckSquare,
  FiFileText,
  FiUsers,
  FiTrendingUp,
  FiShield,
  FiVideo,
  FiX,
  FiCheck,
  FiPhoneIncoming,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import type { AlertResponse, AlertType, AlertPriority } from '../../services/alertService';

// Animation keyframes
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
`;

const pulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.7);
  }
  50% {
    box-shadow: 0 0 0 15px rgba(72, 187, 120, 0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const ring = keyframes`
  0% { transform: rotate(0deg); }
  10% { transform: rotate(15deg); }
  20% { transform: rotate(-15deg); }
  30% { transform: rotate(10deg); }
  40% { transform: rotate(-10deg); }
  50% { transform: rotate(5deg); }
  60% { transform: rotate(-5deg); }
  70% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
`;

// Alert type configuration
const ALERT_TYPE_CONFIG: Record<AlertType, {
  icon: typeof FiCalendar;
  color: string;
  bgGradient: string;
  label: string;
  emoji: string;
}> = {
  FOLLOW_UP: {
    icon: FiCalendar,
    color: 'blue.500',
    bgGradient: 'linear-gradient(135deg, #4299E1 0%, #3182CE 100%)',
    label: 'Seguimiento',
    emoji: '📅',
  },
  REMINDER: {
    icon: FiBell,
    color: 'purple.500',
    bgGradient: 'linear-gradient(135deg, #9F7AEA 0%, #805AD5 100%)',
    label: 'Recordatorio',
    emoji: '🔔',
  },
  DEADLINE: {
    icon: FiClock,
    color: 'red.500',
    bgGradient: 'linear-gradient(135deg, #FC8181 0%, #E53E3E 100%)',
    label: 'Fecha Límite',
    emoji: '⏰',
  },
  TASK: {
    icon: FiCheckSquare,
    color: 'green.500',
    bgGradient: 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)',
    label: 'Tarea',
    emoji: '✅',
  },
  DOCUMENT_REVIEW: {
    icon: FiFileText,
    color: 'orange.500',
    bgGradient: 'linear-gradient(135deg, #ED8936 0%, #DD6B20 100%)',
    label: 'Revisión de Documento',
    emoji: '📄',
  },
  CLIENT_CONTACT: {
    icon: FiUsers,
    color: 'teal.500',
    bgGradient: 'linear-gradient(135deg, #38B2AC 0%, #319795 100%)',
    label: 'Contacto con Cliente',
    emoji: '👥',
  },
  OPERATION_UPDATE: {
    icon: FiTrendingUp,
    color: 'cyan.500',
    bgGradient: 'linear-gradient(135deg, #0BC5EA 0%, #00B5D8 100%)',
    label: 'Actualización de Operación',
    emoji: '📈',
  },
  COMPLIANCE_CHECK: {
    icon: FiShield,
    color: 'yellow.600',
    bgGradient: 'linear-gradient(135deg, #ECC94B 0%, #D69E2E 100%)',
    label: 'Verificación de Cumplimiento',
    emoji: '🛡️',
  },
  VIDEO_CALL: {
    icon: FiVideo,
    color: 'green.400',
    bgGradient: 'linear-gradient(135deg, #48BB78 0%, #2F855A 100%)',
    label: 'Videollamada',
    emoji: '📹',
  },
};

const PRIORITY_CONFIG: Record<AlertPriority, {
  color: string;
  bgColor: string;
  label: string;
}> = {
  LOW: { color: 'gray.500', bgColor: 'gray.100', label: 'Baja' },
  NORMAL: { color: 'blue.500', bgColor: 'blue.100', label: 'Normal' },
  HIGH: { color: 'orange.500', bgColor: 'orange.100', label: 'Alta' },
  URGENT: { color: 'red.500', bgColor: 'red.100', label: 'Urgente' },
};

interface AlertNotificationToastProps {
  alert: AlertResponse;
  onClose: () => void;
  onAcceptVideoCall?: (alert: AlertResponse) => void;
  onDeclineVideoCall?: (alert: AlertResponse) => void;
  duration?: number;
}

export function AlertNotificationToast({
  alert,
  onClose,
  onAcceptVideoCall,
  onDeclineVideoCall,
  duration = 15000,
}: AlertNotificationToastProps) {
  const { getColors } = useTheme();
  const colors = getColors();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const typeConfig = ALERT_TYPE_CONFIG[alert.alertType] || ALERT_TYPE_CONFIG.TASK;
  const priorityConfig = PRIORITY_CONFIG[alert.priority] || PRIORITY_CONFIG.NORMAL;
  const isVideoCall = alert.alertType === 'VIDEO_CALL';

  // Auto-close timer with progress
  useEffect(() => {
    if (isPaused || isVideoCall) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 100));
        if (newProgress <= 0) {
          onClose();
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, isPaused, isVideoCall, onClose]);

  // Play notification sound for video calls
  useEffect(() => {
    if (isVideoCall) {
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.6;
        audio.loop = true;
        audio.play().catch(() => {});

        return () => {
          audio.pause();
          audio.currentTime = 0;
        };
      } catch {
        // Ignore audio errors
      }
    }
  }, [isVideoCall]);

  const handleAccept = useCallback(() => {
    onAcceptVideoCall?.(alert);
    onClose();
  }, [alert, onAcceptVideoCall, onClose]);

  const handleDecline = useCallback(() => {
    onDeclineVideoCall?.(alert);
    onClose();
  }, [alert, onDeclineVideoCall, onClose]);


  return (
    <Box
      position="fixed"
      top={4}
      right={4}
      zIndex={10000}
      minW="380px"
      maxW="450px"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      css={{
        animation: `${slideIn} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`,
      }}
    >
      <Box
        bg={colors.cardBg}
        borderRadius="2xl"
        overflow="hidden"
        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)"
        border="1px solid"
        borderColor={isVideoCall ? 'green.400' : colors.borderColor}
        css={isVideoCall ? {
          animation: `${pulse} 2s ease-in-out infinite`,
        } : undefined}
      >
        {/* Gradient Header */}
        <Box
          background={typeConfig.bgGradient}
          px={4}
          py={3}
          position="relative"
          overflow="hidden"
        >
          {/* Shimmer effect */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            background="linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)"
            backgroundSize="200% 100%"
            css={{
              animation: `${shimmer} 3s infinite`,
            }}
          />

          <HStack justify="space-between" position="relative" zIndex={1}>
            <HStack gap={3}>
              {/* Animated Icon */}
              <Box
                bg="rgba(255,255,255,0.2)"
                p={2}
                borderRadius="xl"
                backdropFilter="blur(10px)"
                css={isVideoCall ? {
                  animation: `${ring} 1.5s ease-in-out infinite`,
                } : undefined}
              >
                <Icon
                  as={isVideoCall ? FiPhoneIncoming : typeConfig.icon}
                  boxSize={6}
                  color="white"
                />
              </Box>

              <VStack align="start" gap={0}>
                <HStack gap={2}>
                  <Text
                    color="white"
                    fontWeight="bold"
                    fontSize="sm"
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    {typeConfig.emoji} {typeConfig.label}
                  </Text>
                  {alert.priority === 'URGENT' && (
                    <Badge
                      bg="red.500"
                      color="white"
                      fontSize="xs"
                      px={2}
                      borderRadius="full"
                      css={{
                        animation: `${pulse} 1s ease-in-out infinite`,
                      }}
                    >
                      URGENTE
                    </Badge>
                  )}
                </HStack>
                {alert.clientName && (
                  <Text color="whiteAlpha.800" fontSize="xs">
                    {alert.clientName}
                  </Text>
                )}
              </VStack>
            </HStack>

            {/* Close button */}
            <Button
              size="xs"
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={onClose}
              borderRadius="full"
              minW="auto"
              p={1}
            >
              <FiX size={18} />
            </Button>
          </HStack>
        </Box>

        {/* Content Body */}
        <Box p={4}>
          <VStack align="stretch" gap={3}>
            {/* Title */}
            <Text
              fontWeight="bold"
              fontSize="md"
              color={colors.textColor}
              lineHeight="short"
            >
              {alert.title}
            </Text>

            {/* Description */}
            {alert.description && (
              <Text
                fontSize="sm"
                color={colors.textColorSecondary}
                noOfLines={2}
              >
                {alert.description}
              </Text>
            )}

            {/* Meta Info */}
            <HStack gap={4} flexWrap="wrap">
              {alert.organizerName && (
                <HStack gap={1} fontSize="xs" color={colors.textColorSecondary}>
                  <Icon as={FiUsers} />
                  <Text>De: {alert.organizerName}</Text>
                </HStack>
              )}
              {alert.sourceReference && (
                <HStack gap={1} fontSize="xs" color={colors.textColorSecondary}>
                  <Icon as={FiFileText} />
                  <Text>{alert.sourceReference}</Text>
                </HStack>
              )}
              <Badge
                bg={priorityConfig.bgColor}
                color={priorityConfig.color}
                fontSize="xs"
                px={2}
                borderRadius="full"
              >
                {priorityConfig.label}
              </Badge>
            </HStack>

            {/* Video Call Actions */}
            {isVideoCall && (
              <HStack gap={3} pt={2}>
                <Button
                  flex={1}
                  colorPalette="red"
                  variant="outline"
                  size="md"
                  onClick={handleDecline}
                  borderRadius="xl"
                  _hover={{
                    transform: 'scale(1.02)',
                    boxShadow: 'md',
                  }}
                  transition="all 0.2s"
                >
                  <Icon as={FiX} mr={2} />
                  Rechazar
                </Button>
                <Button
                  flex={1}
                  colorPalette="green"
                  size="md"
                  onClick={handleAccept}
                  borderRadius="xl"
                  _hover={{
                    transform: 'scale(1.02)',
                    boxShadow: 'lg',
                  }}
                  transition="all 0.2s"
                  css={{
                    background: 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)',
                  }}
                >
                  <Icon as={FiCheck} mr={2} />
                  Aceptar
                </Button>
              </HStack>
            )}
          </VStack>
        </Box>

        {/* Progress Bar */}
        {!isVideoCall && (
          <Box h="4px" bg={colors.borderColor} overflow="hidden">
            <Box
              h="100%"
              bg={typeConfig.color}
              w={`${progress}%`}
              transition="width 0.1s linear"
              borderRadius="full"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default AlertNotificationToast;
