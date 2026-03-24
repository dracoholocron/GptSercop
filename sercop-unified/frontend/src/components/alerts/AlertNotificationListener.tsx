/**
 * AlertNotificationListener Component
 * Uses real-time notifications for instant alert delivery.
 *
 * This component establishes a real-time connection to receive instant
 * notifications for alerts and system messages.
 *
 * Features:
 * - Spectacular toast notifications with alert type icons
 * - Video call accept/decline with Jitsi integration
 * - Queue management for multiple notifications
 * - Connection status indicators
 *
 * Supports multiple providers:
 * - Azure SignalR
 * - AWS WebSocket
 * - GCP Pub/Sub
 */
import { useCallback, useState } from 'react';
import { Box, Text, HStack, Icon } from '@chakra-ui/react';
import { FiWifiOff, FiBell, FiCheck } from 'react-icons/fi';
import {
  useRealTimeNotifications,
  type RealTimeInstantMessage,
  type RealTimeSystemMessage,
} from '../../realtime';
import { parseWorkspaceEvent } from '../../services/cpWorkspaceService';
import { dispatchWorkspaceEvent } from '../../realtime/workspaceEventBus';
import { toaster } from '../ui/toaster';
import { useTheme } from '../../contexts/ThemeContext';
import { AlertNotificationToast } from './AlertNotificationToast';
import { startAlert, completeAlert } from '../../services/alertService';
import type { AlertResponse } from '../../services/alertService';

interface QueuedAlert {
  id: string;
  alert: AlertResponse;
  timestamp: number;
}

export function AlertNotificationListener() {
  const { getColors } = useTheme();
  const colors = getColors();
  const [alertQueue, setAlertQueue] = useState<QueuedAlert[]>([]);

  // Remove alert from queue
  const removeFromQueue = useCallback((alertId: string) => {
    setAlertQueue((prev) => prev.filter((item) => item.id !== alertId));
  }, []);

  // Handle new alert from real-time
  const handleAlert = useCallback((alert: AlertResponse) => {
    console.log('RealTime: Received alert', alert);

    // Add to queue with unique ID
    const queuedAlert: QueuedAlert = {
      id: `${alert.alertId}-${Date.now()}`,
      alert,
      timestamp: Date.now(),
    };

    setAlertQueue((prev) => {
      // Limit queue to 5 notifications
      const newQueue = [...prev, queuedAlert];
      if (newQueue.length > 5) {
        return newQueue.slice(-5);
      }
      return newQueue;
    });
  }, []);

  // Handle video call accept - open meeting in new tab
  const handleAcceptVideoCall = useCallback(async (alert: AlertResponse) => {
    console.log('RealTime: Accepting video call', alert.alertId);
    try {
      // Mark alert as in progress
      await startAlert(alert.alertId, { notes: 'Videollamada aceptada' });

      // Open meeting in new tab
      if (alert.meetingUrl) {
        window.open(alert.meetingUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error accepting video call:', error);
    }
  }, []);

  // Handle video call decline
  const handleDeclineVideoCall = useCallback(async (alert: AlertResponse) => {
    console.log('RealTime: Declining video call', alert.alertId);
    try {
      // Mark alert as completed (declined)
      await completeAlert(alert.alertId, { notes: 'Videollamada rechazada' });
      toaster.info({
        title: 'Videollamada rechazada',
        description: alert.title,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error declining video call:', error);
    }
  }, []);

  // Handle instant message
  const handleInstantMessage = useCallback((message: RealTimeInstantMessage) => {
    // Intercept workspace events: parse, dispatch to event bus, skip toast
    if (message.senderId === 'paa-workspace') {
      const wsEvent = parseWorkspaceEvent(message.message);
      if (wsEvent) {
        dispatchWorkspaceEvent(wsEvent);
        return;
      }
    }

    toaster.info({
      title: `💬 Mensaje de ${message.senderName}`,
      description: message.message,
      duration: 8000,
    });
  }, []);

  // Handle system message
  const handleSystemMessage = useCallback((message: RealTimeSystemMessage) => {
    const toastFn = message.level === 'error' ? toaster.error
      : message.level === 'warning' ? toaster.warning
      : toaster.info;

    toastFn({
      title: '🔔 Notificación del Sistema',
      description: message.message,
      duration: 10000,
    });
  }, []);

  // Handle connected
  const handleConnected = useCallback(() => {
    console.log('RealTime: Connected to alert notifications');
  }, []);

  // Setup real-time connection with callbacks
  // Note: video_call uses the same handler as alert - the AlertNotificationToast
  // component already handles VIDEO_CALL type with accept/decline buttons
  const { connectionState, isEnabled, provider } = useRealTimeNotifications({
    onConnected: handleConnected,
    onAlert: handleAlert,
    onVideoCall: handleAlert,
    onMessage: handleInstantMessage,
    onSystem: handleSystemMessage,
  });

  // Don't render anything if real-time is disabled
  if (!isEnabled) {
    return null;
  }

  return (
    <>
      {/* Render queued alert notifications */}
      {alertQueue.map((item, index) => (
        <Box
          key={item.id}
          style={{
            position: 'fixed',
            top: `${16 + index * 200}px`,
            right: '16px',
            zIndex: 10000 - index,
            transform: `scale(${1 - index * 0.02})`,
            opacity: index === 0 ? 1 : 0.95,
            transition: 'all 0.3s ease',
          }}
        >
          <AlertNotificationToast
            alert={item.alert}
            onClose={() => removeFromQueue(item.id)}
            onAcceptVideoCall={handleAcceptVideoCall}
            onDeclineVideoCall={handleDeclineVideoCall}
            duration={item.alert.alertType === 'VIDEO_CALL' ? 60000 : 15000}
          />
        </Box>
      ))}

      {/* Connection Status Indicator (only show when reconnecting) */}
      {connectionState === 'reconnecting' && (
        <Box
          position="fixed"
          bottom={4}
          right={4}
          zIndex={9998}
          bg={colors.cardBg}
          borderRadius="full"
          px={4}
          py={2}
          boxShadow="lg"
          borderWidth={2}
          borderColor="orange.400"
        >
          <HStack gap={2}>
            <Box
              w={2}
              h={2}
              borderRadius="full"
              bg="orange.400"
              animation="pulse 1s infinite"
            />
            <Icon as={FiWifiOff} color="orange.500" />
            <Text fontSize="sm" color={colors.textColorSecondary} fontWeight="medium">
              Reconectando...
            </Text>
          </HStack>
        </Box>
      )}

      {/* Connected indicator (subtle, temporary) */}
      {connectionState === 'connected' && (
        <Box
          position="fixed"
          bottom={4}
          right={4}
          zIndex={9998}
          opacity={0}
          animation="fadeInOut 4s ease-in-out"
          sx={{
            '@keyframes fadeInOut': {
              '0%': { opacity: 0, transform: 'translateY(10px)' },
              '15%': { opacity: 1, transform: 'translateY(0)' },
              '85%': { opacity: 1, transform: 'translateY(0)' },
              '100%': { opacity: 0, transform: 'translateY(-10px)' },
            },
          }}
        >
          <HStack
            gap={2}
            bg="linear-gradient(135deg, #48BB78 0%, #38A169 100%)"
            color="white"
            px={4}
            py={2}
            borderRadius="full"
            boxShadow="lg"
          >
            <Icon as={FiCheck} boxSize={4} />
            <Text fontSize="sm" fontWeight="medium">
              Notificaciones activas
            </Text>
            <Box
              w={2}
              h={2}
              borderRadius="full"
              bg="white"
              animation="pulse 2s infinite"
            />
          </HStack>
        </Box>
      )}
    </>
  );
}

export default AlertNotificationListener;
