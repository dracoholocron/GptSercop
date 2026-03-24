/**
 * EmbeddedMeeting Component
 * Floating draggable Jitsi video conference window (WhatsApp-style PiP)
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  Spinner,
  IconButton,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  FiMaximize2,
  FiMinimize2,
  FiExternalLink,
  FiX,
  FiCopy,
  FiMove,
  FiVideo,
} from 'react-icons/fi';
import { toaster } from '../ui/toaster';
import { useTheme } from '../../contexts/ThemeContext';

// Jitsi Meet External API types
declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: JitsiMeetOptions) => JitsiMeetAPI;
  }
}

interface JitsiMeetOptions {
  roomName: string;
  parentNode: HTMLElement;
  width?: string | number;
  height?: string | number;
  configOverwrite?: Record<string, unknown>;
  interfaceConfigOverwrite?: Record<string, unknown>;
  userInfo?: {
    displayName?: string;
    email?: string;
  };
}

interface JitsiMeetAPI {
  dispose: () => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  addListener: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

interface EmbeddedMeetingProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  meetingTitle?: string;
  userName?: string;
  userEmail?: string;
  serverUrl?: string;
}

const PIP_WIDTH = 420;
const PIP_HEIGHT = 320;

/**
 * Generate a branded GlobalCMX background as a PNG data URL.
 * Jitsi requires raster images (PNG/JPG) for virtual backgrounds.
 */
function generateBrandedBackground(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
  gradient.addColorStop(0, '#1a365d');
  gradient.addColorStop(0.5, '#2a4a7f');
  gradient.addColorStop(1, '#1e3a5f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1920, 1080);

  // Subtle glows
  const glow1 = ctx.createRadialGradient(384, 324, 0, 384, 324, 768);
  glow1.addColorStop(0, 'rgba(49, 130, 206, 0.15)');
  glow1.addColorStop(1, 'rgba(49, 130, 206, 0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, 1920, 1080);

  const glow2 = ctx.createRadialGradient(1536, 756, 0, 1536, 756, 672);
  glow2.addColorStop(0, 'rgba(72, 187, 120, 0.1)');
  glow2.addColorStop(1, 'rgba(72, 187, 120, 0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, 1920, 1080);

  // Subtle geometric shapes
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(200, 150, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1700, 900, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(960, 540, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Bottom accent bar
  const accentGrad = ctx.createLinearGradient(0, 0, 1920, 0);
  accentGrad.addColorStop(0, 'rgba(49, 130, 206, 0.3)');
  accentGrad.addColorStop(1, 'rgba(72, 187, 120, 0.2)');
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 1050, 1920, 30);

  // GlobalCMX watermark - bottom right
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(1680, 950, 180, 80, 16);
  ctx.stroke();

  ctx.font = 'bold 16px Arial, Helvetica, sans-serif';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText('GLOBAL', 1770, 988);

  ctx.font = 'bold 22px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#48BB78';
  ctx.fillText('CMX', 1770, 1015);
  ctx.globalAlpha = 1;

  return canvas.toDataURL('image/png');
}

export function EmbeddedMeeting({
  isOpen,
  onClose,
  roomName,
  meetingTitle,
  userName,
  userEmail,
  serverUrl = 'meet.jit.si',
}: EmbeddedMeetingProps) {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiMeetAPI | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);

  // Drag state
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const meetingUrl = `https://${serverUrl}/${roomName}`;

  // Initialize position to bottom-right on first open
  useEffect(() => {
    if (isOpen && position.x === -1) {
      setPosition({
        x: window.innerWidth - PIP_WIDTH - 24,
        y: window.innerHeight - PIP_HEIGHT - 24,
      });
    }
  }, [isOpen]);

  // Load Jitsi API script
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);

    const loadJitsiScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = `https://${serverUrl}/external_api.js`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Jitsi API'));
        document.body.appendChild(script);
      });
    };

    const initMeeting = async () => {
      try {
        await loadJitsiScript();

        if (!containerRef.current || !window.JitsiMeetExternalAPI) {
          return;
        }

        // Dispose previous instance if exists
        if (apiRef.current) {
          apiRef.current.dispose();
        }

        const api = new window.JitsiMeetExternalAPI(serverUrl, {
          roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            enableClosePage: false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'desktop',
              'fullscreen',
              'fodeviceselection',
              'hangup',
              'chat',
              'recording',
              'settings',
              'raisehand',
              'videoquality',
              'tileview',
              'select-background',
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: '',
            SHOW_POWERED_BY: false,
            DEFAULT_BACKGROUND: '#1a1a2e',
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            MOBILE_APP_PROMO: false,
          },
          userInfo: {
            displayName: userName,
            email: userEmail,
          },
        });

        apiRef.current = api;

        api.addListener('videoConferenceJoined', () => {
          setLoading(false);
          // Apply GlobalCMX branded background by default
          try {
            const bgDataUrl = generateBrandedBackground();
            if (bgDataUrl) {
              api.executeCommand('toggleVirtualBackgroundEffect', {
                backgroundEffectEnabled: true,
                backgroundType: 'image',
                virtualSource: bgDataUrl,
              });
            }
          } catch (e) {
            console.warn('Virtual background not supported:', e);
          }
        });

        api.addListener('readyToClose', () => {
          handleClose();
        });
      } catch (error) {
        console.error('Error initializing Jitsi:', error);
        setLoading(false);
        toaster.error({
          title: t('videoConference.initError', 'Error al iniciar videollamada'),
        });
      }
    };

    initMeeting();

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [isOpen, roomName, serverUrl, userName, userEmail]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    isDragging.current = true;
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    e.preventDefault();
  }, [isMaximized]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newX = Math.max(0, Math.min(window.innerWidth - PIP_WIDTH, e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - PIP_HEIGHT, e.clientY - dragOffset.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    if (isOpen) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingUrl);
    toaster.success({
      title: t('videoConference.linkCopied', 'Enlace copiado'),
    });
  };

  const handleOpenExternal = () => {
    window.open(meetingUrl, '_blank', 'noopener,noreferrer');
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
    setIsMaximized(false);
    setLoading(true);
    onClose();
  };

  if (!isOpen) return null;

  // Maximized: full screen overlay
  if (isMaximized) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={9999}
        bg="black"
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <HStack
          px={4}
          py={2}
          bg="gray.900"
          justify="space-between"
          flexShrink={0}
        >
          <HStack gap={3}>
            <FiVideo color="white" />
            <Text color="white" fontWeight="semibold" fontSize="sm">
              {meetingTitle || t('videoConference.videoCall', 'Videollamada')}
            </Text>
          </HStack>
          <HStack gap={1}>
            <IconButton
              aria-label="Copiar enlace"
              size="xs"
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={handleCopyLink}
            >
              <FiCopy />
            </IconButton>
            <IconButton
              aria-label="Abrir en ventana"
              size="xs"
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={handleOpenExternal}
            >
              <FiExternalLink />
            </IconButton>
            <IconButton
              aria-label="Minimizar"
              size="xs"
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={toggleMaximize}
            >
              <FiMinimize2 />
            </IconButton>
            <IconButton
              aria-label="Cerrar"
              size="xs"
              variant="ghost"
              color="white"
              _hover={{ bg: 'red.600' }}
              onClick={handleClose}
            >
              <FiX />
            </IconButton>
          </HStack>
        </HStack>

        {/* Jitsi Container */}
        <Box flex={1} position="relative" overflow="hidden">
          {loading && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="gray.900"
              zIndex={10}
            >
              <VStack gap={4}>
                <Spinner size="xl" color="blue.500" />
                <Text color="gray.400">
                  {t('videoConference.connecting', 'Conectando a la videollamada...')}
                </Text>
              </VStack>
            </Box>
          )}
          <Box ref={containerRef} w="100%" h="100%" bg="black" />
        </Box>
      </Box>
    );
  }

  // PiP mode: small floating draggable window
  return (
    <Box
      ref={windowRef}
      position="fixed"
      left={`${position.x}px`}
      top={`${position.y}px`}
      width={`${PIP_WIDTH}px`}
      height={`${PIP_HEIGHT}px`}
      zIndex={9999}
      borderRadius="xl"
      overflow="hidden"
      boxShadow="0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)"
      display="flex"
      flexDirection="column"
      bg="gray.900"
    >
      {/* Draggable Header */}
      <HStack
        px={3}
        py={1.5}
        bg="gray.800"
        justify="space-between"
        cursor="grab"
        _active={{ cursor: 'grabbing' }}
        onMouseDown={handleMouseDown}
        flexShrink={0}
        userSelect="none"
      >
        <HStack gap={2} overflow="hidden" flex={1}>
          <FiMove size={12} color="#a0aec0" />
          <Text color="white" fontWeight="medium" fontSize="xs" lineClamp={1}>
            {meetingTitle || t('videoConference.videoCall', 'Videollamada')}
          </Text>
        </HStack>
        <HStack gap={0.5} flexShrink={0}>
          <IconButton
            aria-label="Copiar enlace"
            size="2xs"
            variant="ghost"
            color="white"
            _hover={{ bg: 'whiteAlpha.200' }}
            onClick={handleCopyLink}
          >
            <FiCopy size={12} />
          </IconButton>
          <IconButton
            aria-label="Abrir en ventana"
            size="2xs"
            variant="ghost"
            color="white"
            _hover={{ bg: 'whiteAlpha.200' }}
            onClick={handleOpenExternal}
          >
            <FiExternalLink size={12} />
          </IconButton>
          <IconButton
            aria-label="Maximizar"
            size="2xs"
            variant="ghost"
            color="white"
            _hover={{ bg: 'whiteAlpha.200' }}
            onClick={toggleMaximize}
          >
            <FiMaximize2 size={12} />
          </IconButton>
          <IconButton
            aria-label="Cerrar"
            size="2xs"
            variant="ghost"
            color="white"
            _hover={{ bg: 'red.600' }}
            onClick={handleClose}
          >
            <FiX size={12} />
          </IconButton>
        </HStack>
      </HStack>

      {/* Jitsi Container */}
      <Box flex={1} position="relative" overflow="hidden">
        {loading && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="gray.900"
            zIndex={10}
          >
            <VStack gap={3}>
              <Spinner size="lg" color="blue.500" />
              <Text color="gray.400" fontSize="xs">
                {t('videoConference.connecting', 'Conectando...')}
              </Text>
              <Button size="xs" colorPalette="blue" variant="outline" onClick={handleCopyLink}>
                <FiCopy />
                {t('videoConference.copyLink', 'Copiar enlace')}
              </Button>
            </VStack>
          </Box>
        )}
        <Box ref={containerRef} w="100%" h="100%" bg="black" />
      </Box>
    </Box>
  );
}

export default EmbeddedMeeting;
