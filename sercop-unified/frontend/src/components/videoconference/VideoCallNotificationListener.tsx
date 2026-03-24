/**
 * VideoCallNotificationListener Component
 * Uses real-time notifications for instant video call invitations.
 *
 * This component establishes a real-time connection to receive instant
 * notifications when someone invites the user to a video call.
 *
 * Supports multiple providers:
 * - Azure SignalR
 * - AWS WebSocket
 * - GCP Pub/Sub
 */
import { useState, useCallback, useRef } from 'react';
import { Box, Text, HStack, Icon } from '@chakra-ui/react';
import { FiWifiOff } from 'react-icons/fi';
import { VideoCallInvitationPopup } from './VideoCallInvitationPopup';
import {
  useRealTimeNotifications,
  type RealTimeInstantMessage,
  type RealTimeSystemMessage,
} from '../../realtime';
import { completeAlert, type AlertResponse } from '../../services/alertService';
import { toaster } from '../ui/toaster';
import { useTheme } from '../../contexts/ThemeContext';

export function VideoCallNotificationListener() {
  const { getColors } = useTheme();
  const colors = getColors();

  // Queue of video call alerts to show
  const [videoCallQueue, setVideoCallQueue] = useState<AlertResponse[]>([]);
  const dismissedAlertIdsRef = useRef<Set<string>>(new Set());

  // Handle new video call invitation
  const handleVideoCall = useCallback((alert: AlertResponse) => {
    if (dismissedAlertIdsRef.current.has(alert.alertId)) {
      return;
    }

    setVideoCallQueue((prev) => {
      if (prev.some((a) => a.alertId === alert.alertId)) {
        return prev;
      }
      return [...prev, alert];
    });
  }, []);

  // Handle instant message
  const handleInstantMessage = useCallback((message: RealTimeInstantMessage) => {
    toaster.info({
      title: `Mensaje de ${message.senderName}`,
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
      title: 'Notificación del Sistema',
      description: message.message,
      duration: 10000,
    });
  }, []);

  // Setup real-time connection with callbacks
  const { connectionState, isEnabled, provider } = useRealTimeNotifications({
    onVideoCall: handleVideoCall,
    onMessage: handleInstantMessage,
    onSystem: handleSystemMessage,
  });

  // Accept video call
  const handleAccept = async (alert: AlertResponse) => {
    try {
      await completeAlert(alert.alertId, { notes: 'Joined video call' });
    } catch (error) {
      console.error('Error completing alert:', error);
    }

    dismissedAlertIdsRef.current.add(alert.alertId);
    setVideoCallQueue((prev) => prev.filter((a) => a.alertId !== alert.alertId));
  };

  // Decline video call
  const handleDecline = async (alert: AlertResponse) => {
    try {
      await completeAlert(alert.alertId, { notes: 'Declined video call' });
    } catch (error) {
      console.error('Error completing alert:', error);
    }

    dismissedAlertIdsRef.current.add(alert.alertId);
    setVideoCallQueue((prev) => prev.filter((a) => a.alertId !== alert.alertId));
  };

  // Get current alert to show (first in queue)
  const currentAlert = videoCallQueue[0];

  // Don't render status if real-time is disabled
  if (!isEnabled) {
    return currentAlert ? (
      <Box position="fixed" top={0} right={0} zIndex={10000}>
        <VideoCallInvitationPopup
          alert={currentAlert}
          onAccept={() => handleAccept(currentAlert)}
          onDecline={() => handleDecline(currentAlert)}
        />
      </Box>
    ) : null;
  }

  return (
    <>
      {/* Connection Status Indicator (only show when disconnected) */}
      {connectionState === 'reconnecting' && (
        <Box
          position="fixed"
          bottom={4}
          right={4}
          zIndex={9998}
          bg={colors.cardBg}
          borderRadius="md"
          p={2}
          boxShadow="md"
          borderWidth={1}
          borderColor="orange.300"
        >
          <HStack gap={2}>
            <Icon as={FiWifiOff} color="orange.500" />
            <Text fontSize="xs" color={colors.textColorSecondary}>
              Reconectando ({provider})...
            </Text>
          </HStack>
        </Box>
      )}

      {/* Video Call Invitation Popup */}
      {currentAlert && (
        <Box position="fixed" top={0} right={0} zIndex={10000}>
          <VideoCallInvitationPopup
            alert={currentAlert}
            onAccept={() => handleAccept(currentAlert)}
            onDecline={() => handleDecline(currentAlert)}
          />
        </Box>
      )}
    </>
  );
}

export default VideoCallNotificationListener;
