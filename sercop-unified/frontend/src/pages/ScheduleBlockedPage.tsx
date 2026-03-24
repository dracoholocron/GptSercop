import React, { useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  Icon,
  Card,
  HStack,
  Spinner,
} from '@chakra-ui/react';
import { FiClock, FiAlertTriangle, FiLogOut, FiRefreshCw } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { toaster } from '../components/ui/toaster';

interface ScheduleBlockedPageProps {
  reason?: string;
  nextAccessTime?: string;
  level?: string;
  startTime?: string;
  endTime?: string;
  onRetry?: () => void;
}

/**
 * Página mostrada cuando el usuario está fuera del horario permitido.
 */
const ScheduleBlockedPage: React.FC<ScheduleBlockedPageProps> = ({
  reason,
  nextAccessTime,
  level,
  startTime,
  endTime,
  onRetry,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [isChecking, setIsChecking] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('globalcmx_token');
    localStorage.removeItem('globalcmx_user');
    // Forzar recarga completa para limpiar todo el estado
    window.location.href = '/login';
  };

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      if (onRetry) {
        await onRetry();
        // Pequeña espera para que el estado se actualice
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      // Si seguimos en esta página después de onRetry, significa que aún estamos bloqueados
      // Mostramos un mensaje informativo
      toaster.create({
        title: t('schedule.blocked.stillBlocked', 'Acceso aún restringido'),
        description: t('schedule.blocked.tryAgainLater', 'El sistema sigue fuera del horario de operación. Intenta más tarde.'),
        type: 'warning',
        duration: 4000,
      });
    } catch (error) {
      console.error('Error checking schedule:', error);
      toaster.create({
        title: t('common.error', 'Error'),
        description: t('schedule.blocked.checkError', 'No se pudo verificar el estado del horario'),
        type: 'error',
        duration: 4000,
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Traducir el reason si es una key de i18n
  const getReasonMessage = () => {
    // Parámetros base con los tiempos del horario
    const baseParams = {
      start: startTime || '09:00',
      end: endTime || '18:00',
    };

    if (!reason) {
      return t('schedule.error.outside_operation_hours', { ...baseParams, defaultValue: `Fuera del horario de operación (${baseParams.start} - ${baseParams.end})` });
    }

    // Si el reason contiene parámetros adicionales (formato: key:param1|param2)
    if (reason.includes(':')) {
      const [key, paramsStr] = reason.split(':');
      const params = paramsStr.split('|');

      // Mapear parámetros a objeto
      const paramObj: Record<string, string> = { ...baseParams };
      if (params.length === 1) {
        paramObj.holiday = params[0];
      } else if (params.length === 2) {
        paramObj.start = params[0];
        paramObj.end = params[1];
      } else if (params.length === 3) {
        paramObj.holiday = params[0];
        paramObj.start = params[1];
        paramObj.end = params[2];
      }

      return t(key, paramObj);
    }

    // Intentar traducir el reason como key de i18n, pasando los tiempos
    return t(reason, { ...baseParams, defaultValue: reason });
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={isDark ? 'gray.900' : 'gray.50'}
      p={4}
    >
      <Card.Root
        maxW="500px"
        w="full"
        bg={isDark ? 'gray.800' : 'white'}
        shadow="xl"
        borderRadius="xl"
        overflow="hidden"
      >
        {/* Header con gradiente */}
        <Box
          bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
          py={8}
          textAlign="center"
        >
          <Icon
            as={FiAlertTriangle}
            boxSize={16}
            color="white"
            mb={4}
          />
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="white"
          >
            {t('schedule.blocked.title', 'Acceso Restringido')}
          </Text>
        </Box>

        <Card.Body p={8}>
          <VStack gap={6} align="stretch">
            {/* Mensaje principal */}
            <Box textAlign="center">
              <Text
                fontSize="lg"
                color={isDark ? 'gray.300' : 'gray.600'}
                mb={2}
              >
                {t('schedule.blocked.message', 'El sistema no está disponible en este momento debido a restricciones de horario.')}
              </Text>

              {/* Razón específica */}
              <Box
                bg={isDark ? 'orange.900' : 'orange.50'}
                borderRadius="md"
                p={4}
                mt={4}
              >
                <HStack justify="center" gap={2}>
                  <Icon as={FiClock} color="orange.500" />
                  <Text
                    fontWeight="medium"
                    color={isDark ? 'orange.200' : 'orange.700'}
                  >
                    {getReasonMessage()}
                  </Text>
                </HStack>
              </Box>
            </Box>

            {/* Próximo horario de acceso */}
            {nextAccessTime && (
              <Box
                bg={isDark ? 'gray.700' : 'gray.100'}
                borderRadius="md"
                p={4}
                textAlign="center"
              >
                <Text
                  fontSize="sm"
                  color={isDark ? 'gray.400' : 'gray.500'}
                  mb={1}
                >
                  {t('schedule.blocked.nextAccess', 'Próximo horario de acceso')}
                </Text>
                <Text
                  fontSize="xl"
                  fontWeight="bold"
                  color={isDark ? 'green.400' : 'green.600'}
                >
                  {nextAccessTime}
                </Text>
              </Box>
            )}

            {/* Nivel de restricción */}
            {level && (
              <Text
                fontSize="sm"
                color={isDark ? 'gray.500' : 'gray.400'}
                textAlign="center"
              >
                {t('schedule.blocked.level', 'Nivel de restricción')}: {t(`schedule.level.${level.toLowerCase()}`, level)}
              </Text>
            )}

            {/* Botones de acción */}
            <VStack gap={3} pt={4}>
              <Button
                colorPalette="orange"
                size="lg"
                w="full"
                onClick={handleRetry}
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <Spinner size="sm" mr={2} />
                    {t('schedule.blocked.checking', 'Verificando...')}
                  </>
                ) : (
                  <>
                    <Icon as={FiRefreshCw} mr={2} />
                    {t('schedule.blocked.retry', 'Verificar nuevamente')}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="lg"
                w="full"
                onClick={handleLogout}
              >
                <Icon as={FiLogOut} mr={2} />
                {t('schedule.blocked.logout', 'Cerrar sesión')}
              </Button>
            </VStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    </Box>
  );
};

export default ScheduleBlockedPage;
