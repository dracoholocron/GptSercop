import React, { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { FiClock, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useSchedule } from '../contexts/ScheduleContext';
import { keyframes } from '@emotion/react';

// Animación para el indicador de posición actual
const pulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  50% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
`;

const glow = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`;

interface ScheduleTimelineProps {
  isCollapsed?: boolean;
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({ isCollapsed = false }) => {
  const { t, i18n } = useTranslation();
  const { isDark, getColors } = useTheme();
  const { scheduleStatus, isBlocked } = useSchedule();
  const colors = getColors();

  const [currentTime, setCurrentTime] = useState(new Date());

  // Obtener el locale para el formato de hora
  const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';

  // Actualizar la hora cada segundo
  useEffect(() => {
    // Actualizar inmediatamente
    setCurrentTime(new Date());

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Cada segundo
    return () => clearInterval(interval);
  }, []);

  // Parsear tiempos del horario
  const parseTime = (timeStr: string | undefined): { hours: number; minutes: number } | null => {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    return {
      hours: parseInt(parts[0], 10),
      minutes: parseInt(parts[1], 10),
    };
  };

  const startTime = parseTime(scheduleStatus?.currentStartTime);
  const endTime = parseTime(scheduleStatus?.currentEndTime);

  // Si no hay horario configurado, no mostrar nada
  if (!startTime || !endTime) {
    return null;
  }

  // Calcular posición actual en el timeline (0-100%)
  const calculatePosition = (): number => {
    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startTime.hours * 60 + startTime.minutes;
    const endMinutes = endTime.hours * 60 + endTime.minutes;

    const totalDuration = endMinutes - startMinutes;
    const elapsed = currentMinutes - startMinutes;

    const position = (elapsed / totalDuration) * 100;
    return Math.max(0, Math.min(100, position));
  };

  // Calcular tiempo restante
  const calculateTimeRemaining = (): string => {
    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const endMinutes = endTime.hours * 60 + endTime.minutes;

    const remaining = endMinutes - currentMinutes;

    if (remaining <= 0) return t('schedule.timeline.closed', 'Cerrado');

    const hours = Math.floor(remaining / 60);
    const minutes = remaining % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Formatear hora para mostrar
  const formatTime = (time: { hours: number; minutes: number }): string => {
    return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}`;
  };

  const position = calculatePosition();
  const timeRemaining = calculateTimeRemaining();
  const isWithinSchedule = position >= 0 && position <= 100 && !isBlocked;

  // Colores basados en el estado
  const statusColor = isWithinSchedule ? 'green.400' : 'orange.400';
  const trackBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const progressBg = isWithinSchedule
    ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
    : 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)';

  // Versión colapsada - solo icono con tooltip
  if (isCollapsed) {
    return (
      <Box>
        <Tooltip.Root positioning={{ placement: 'right' }} openDelay={0} closeDelay={0}>
          <Tooltip.Trigger asChild>
            <Box
              w="54px"
              h="54px"
              borderRadius="16px"
              bg={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'}
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor="default"
              position="relative"
              overflow="hidden"
            >
              {/* Indicador de progreso circular */}
              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                h={`${Math.min(100, position)}%`}
                bg={progressBg}
                opacity={0.3}
                transition="height 0.5s ease"
              />
              <Icon
                as={FiClock}
                boxSize="24px"
                color={statusColor}
                css={{ animation: `${glow} 2s ease-in-out infinite` }}
              />
            </Box>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content
              bg={isDark ? 'gray.800' : 'gray.900'}
              color="white"
              px={4}
              py={3}
              borderRadius="14px"
              boxShadow="0 10px 40px rgba(0, 0, 0, 0.5)"
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <VStack gap={1} align="start">
                <Text fontSize="sm" fontWeight="bold">
                  {t('schedule.timeline.operatingHours', 'Horario de operación')}
                </Text>
                <HStack gap={2}>
                  <Icon as={FiSun} color="yellow.400" />
                  <Text fontSize="sm">
                    {formatTime(startTime)} - {formatTime(endTime)}
                  </Text>
                </HStack>
                <Text fontSize="xs" color={statusColor}>
                  {isWithinSchedule
                    ? `${timeRemaining} ${t('schedule.timeline.remaining', 'restantes')}`
                    : t('schedule.timeline.outsideHours', 'Fuera de horario')}
                </Text>
              </VStack>
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      </Box>
    );
  }

  // Versión expandida - timeline completo
  return (
    <Box
      p={3}
      borderRadius="14px"
      bg={isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'}
      border="1px solid"
      borderColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}
    >
      {/* Header */}
      <HStack justify="space-between" mb={2}>
        <HStack gap={2}>
          <Icon as={FiClock} color={statusColor} boxSize="14px" />
          <Text fontSize="xs" fontWeight="600" color={colors.textColor}>
            {t('schedule.timeline.title', 'Horario del Sistema')}
          </Text>
        </HStack>
        <Text
          fontSize="xs"
          fontWeight="bold"
          color={statusColor}
          px={2}
          py={0.5}
          borderRadius="full"
          bg={isWithinSchedule ? 'green.500/20' : 'orange.500/20'}
        >
          {timeRemaining}
        </Text>
      </HStack>

      {/* Timeline Bar */}
      <Box position="relative" h="24px" mb={2}>
        {/* Track background */}
        <Box
          position="absolute"
          top="50%"
          transform="translateY(-50%)"
          w="full"
          h="8px"
          bg={trackBg}
          borderRadius="full"
          overflow="hidden"
        >
          {/* Progress fill */}
          <Box
            h="full"
            w={`${position}%`}
            bg={progressBg}
            borderRadius="full"
            transition="width 0.5s ease"
            boxShadow={isWithinSchedule ? '0 0 10px rgba(34, 197, 94, 0.5)' : '0 0 10px rgba(249, 115, 22, 0.5)'}
          />
        </Box>

        {/* Current position indicator */}
        {isWithinSchedule && (
          <Box
            position="absolute"
            top="50%"
            left={`${position}%`}
            transform="translate(-50%, -50%)"
            w="16px"
            h="16px"
            borderRadius="full"
            bg={statusColor}
            border="3px solid"
            borderColor={isDark ? 'gray.800' : 'white'}
            boxShadow={`0 0 12px ${isWithinSchedule ? 'rgba(34, 197, 94, 0.6)' : 'rgba(249, 115, 22, 0.6)'}`}
            css={{ animation: `${pulse} 2s ease-in-out infinite` }}
            zIndex={2}
          />
        )}

        {/* Hour markers */}
        {[0, 25, 50, 75, 100].map((percent) => (
          <Box
            key={percent}
            position="absolute"
            top="50%"
            left={`${percent}%`}
            transform="translate(-50%, -50%)"
            w="2px"
            h="12px"
            bg={isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}
            borderRadius="full"
            zIndex={1}
          />
        ))}
      </Box>

      {/* Time labels */}
      <HStack justify="space-between">
        <HStack gap={1}>
          <Icon as={FiSun} color="yellow.500" boxSize="12px" />
          <Text fontSize="xs" color={colors.textColorSecondary} fontWeight="500">
            {formatTime(startTime)}
          </Text>
        </HStack>
        <Text fontSize="2xs" color={colors.textColorSecondary}>
          {currentTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <HStack gap={1}>
          <Text fontSize="xs" color={colors.textColorSecondary} fontWeight="500">
            {formatTime(endTime)}
          </Text>
          <Icon as={FiMoon} color="purple.400" boxSize="12px" />
        </HStack>
      </HStack>
    </Box>
  );
};

export default ScheduleTimeline;
