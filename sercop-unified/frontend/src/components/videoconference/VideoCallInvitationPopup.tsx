/**
 * VideoCallInvitationPopup Component
 * Popup notification for incoming video call invitations
 */
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Icon,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FiVideo, FiX, FiUser, FiFileText } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { EmbeddedMeeting } from './EmbeddedMeeting';
import type { AlertResponse } from '../../services/alertService';

// Inline styles for pulse animation (Chakra UI v3 compatible)
const pulseAnimationStyle = {
  animation: 'pulse 2s ease-in-out infinite',
};

// Add global keyframes via style tag (only once)
if (typeof document !== 'undefined' && !document.getElementById('video-call-pulse-animation')) {
  const style = document.createElement('style');
  style.id = 'video-call-pulse-animation';
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.02); opacity: 0.95; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

interface VideoCallInvitationPopupProps {
  alert: AlertResponse;
  onAccept: () => void;
  onDecline: () => void;
}

export function VideoCallInvitationPopup({
  alert,
  onAccept,
  onDecline,
}: VideoCallInvitationPopupProps) {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const [showMeeting, setShowMeeting] = useState(false);

  // Play sound when popup appears
  useEffect(() => {
    // Try to play a notification sound
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore if audio can't play (user hasn't interacted with page)
      });
    } catch {
      // Ignore audio errors
    }
  }, []);

  const handleAccept = () => {
    setShowMeeting(true);
    onAccept();
  };

  const handleDecline = () => {
    onDecline();
  };

  const handleMeetingClose = () => {
    setShowMeeting(false);
  };

  if (showMeeting && alert.meetingUrl) {
    // Extract room name from URL
    const roomName = alert.meetingId || alert.meetingUrl.split('/').pop() || 'meeting';

    return (
      <EmbeddedMeeting
        isOpen={true}
        onClose={handleMeetingClose}
        roomName={roomName}
        meetingTitle={alert.title}
        serverUrl={alert.meetingProvider === 'jitsi' ? 'meet.jit.si' : undefined}
      />
    );
  }

  return (
    <Box
      position="fixed"
      top={4}
      right={4}
      zIndex={9999}
      bg={colors.cardBg}
      borderWidth={2}
      borderColor="green.500"
      borderRadius="xl"
      boxShadow="2xl"
      p={4}
      minW="320px"
      maxW="400px"
      style={pulseAnimationStyle}
    >
      <VStack gap={3} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <HStack>
            <Box
              p={2}
              borderRadius="full"
              bg="green.500"
              color="white"
            >
              <Icon as={FiVideo} boxSize={5} />
            </Box>
            <Text fontWeight="bold" color={colors.textColor} fontSize="lg">
              {t('videoConference.incomingCall', 'Videollamada entrante')}
            </Text>
          </HStack>
          <Button
            size="xs"
            variant="ghost"
            onClick={handleDecline}
            colorPalette="red"
          >
            <FiX />
          </Button>
        </HStack>

        {/* Meeting Info */}
        <Box p={3} bg={colors.bgColor} borderRadius="md">
          <VStack align="start" gap={2}>
            <Text fontWeight="semibold" color={colors.textColor} fontSize="md">
              {alert.title}
            </Text>

            {alert.organizerName && (
              <HStack fontSize="sm" color={colors.textColorSecondary}>
                <Icon as={FiUser} />
                <Text>
                  {t('videoConference.organizer', 'Organizador')}: {alert.organizerName}
                </Text>
              </HStack>
            )}

            {alert.operationId && (
              <HStack fontSize="sm" color={colors.textColorSecondary}>
                <Icon as={FiFileText} />
                <Text>
                  {alert.sourceReference || alert.operationId}
                </Text>
              </HStack>
            )}

            {alert.clientName && (
              <Text fontSize="sm" color={colors.textColorSecondary}>
                {t('common.client', 'Cliente')}: {alert.clientName}
              </Text>
            )}

            {alert.description && (
              <Text fontSize="sm" color={colors.textColorSecondary} noOfLines={2}>
                {alert.description}
              </Text>
            )}
          </VStack>
        </Box>

        {/* Action Buttons */}
        <HStack gap={3}>
          <Button
            flex={1}
            colorPalette="red"
            variant="outline"
            onClick={handleDecline}
          >
            <FiX />
            {t('videoConference.decline', 'Rechazar')}
          </Button>
          <Button
            flex={1}
            colorPalette="green"
            onClick={handleAccept}
          >
            <FiVideo />
            {t('videoConference.accept', 'Aceptar')}
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

export default VideoCallInvitationPopup;
