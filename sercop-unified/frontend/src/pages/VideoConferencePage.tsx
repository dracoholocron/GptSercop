/**
 * Video Conference Page
 * Main page for managing video conference meetings
 */
import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Button,
  Badge,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { Card } from '@chakra-ui/react';
import { Alert } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  FiVideo,
  FiCalendar,
  FiClock,
  FiUsers,
  FiExternalLink,
  FiLink,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
// import { useAuth } from '../contexts/AuthContext';
import {
  getProviders,
  getUpcomingMeetings,
  initiateOAuthFlow,
  cancelMeeting,
} from '../services/videoConferenceService';
import { VideoConferenceButton } from '../components/videoconference/VideoConferenceButton';
import { toaster } from '../components/ui/toaster';
import type {
  ProvidersListResponse,
  ProviderStatus,
  MeetingResponse,
  VideoProvider,
} from '../types/videoConference';

export function VideoConferencePage() {
  const { t } = useTranslation();
  const { isDark, getColors } = useTheme();
  const colors = getColors();

  const [loading, setLoading] = useState(true);
  const [providersData, setProvidersData] = useState<ProvidersListResponse | null>(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingResponse[]>([]);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [cancellingMeetingId, setCancellingMeetingId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [providers, meetings] = await Promise.all([
        getProviders(),
        getUpcomingMeetings(10),
      ]);
      setProvidersData(providers);
      setUpcomingMeetings(meetings);
    } catch (error) {
      console.error('Error loading video conference data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: ProviderStatus) => {
    if (!provider.requiresOAuth || provider.connected) return;

    setConnectingProvider(provider.providerCode);
    try {
      const result = await initiateOAuthFlow(provider.providerCode);
      if (result.success) {
        toaster.success({
          title: t('videoConference.connected'),
          description: t('videoConference.connectedTo', { provider: provider.displayName }),
        });
        loadData();
      }
    } catch (error) {
      console.error('Error connecting to provider:', error);
      toaster.error({
        title: t('videoConference.connectionFailed'),
      });
    } finally {
      setConnectingProvider(null);
    }
  };

  const openMeetingUrl = (url: string, _title?: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toaster.success({
      title: t('videoConference.linkCopied', 'Enlace copiado'),
    });
  };

  const handleCancelMeeting = async (meeting: MeetingResponse) => {
    const confirmed = window.confirm(
      t('videoConference.confirmCancel', '¿Estás seguro de que deseas cancelar esta reunión?')
    );
    if (!confirmed) return;

    setCancellingMeetingId(meeting.id);
    try {
      await cancelMeeting(meeting.id);
      toaster.success({
        title: t('videoConference.meetingCancelled', 'Reunión cancelada'),
      });
      loadData();
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      toaster.error({
        title: t('videoConference.cancelError', 'Error al cancelar la reunión'),
      });
    } finally {
      setCancellingMeetingId(null);
    }
  };

  const getProviderIcon = (provider: VideoProvider) => {
    switch (provider) {
      case 'googlemeet':
        return '📹';
      case 'teams':
        return '👥';
      case 'jitsi':
        return '🎥';
      default:
        return '📹';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge colorPalette="blue">{t('videoConference.scheduled', 'Programada')}</Badge>;
      case 'IN_PROGRESS':
        return <Badge colorPalette="green">{t('videoConference.inProgress', 'En curso')}</Badge>;
      case 'COMPLETED':
        return <Badge colorPalette="gray">{t('videoConference.completed', 'Finalizada')}</Badge>;
      case 'CANCELLED':
        return <Badge colorPalette="red">{t('videoConference.cancelled', 'Cancelada')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack gap={4} align="center" justify="center" minH="400px">
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.500">{t('common.loading', 'Cargando...')}</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <VStack align="start" gap={1}>
            <Heading size="lg" color={colors.textColor}>
              <Icon as={FiVideo} mr={3} />
              {t('videoConference.title', 'Videoconferencias')}
            </Heading>
            <Text color={colors.textColorSecondary}>
              {t('videoConference.subtitle', 'Programa y gestiona reuniones virtuales')}
            </Text>
          </VStack>
          <VideoConferenceButton variant="menu" size="lg" colorScheme="green" />
        </HStack>

        {/* Provider Status */}
        <Box>
          <Heading size="md" mb={4} color={colors.textColor}>
            {t('videoConference.providers', 'Proveedores')}
          </Heading>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
            {providersData?.providers.map((provider) => (
              <GridItem key={provider.providerCode}>
                <Card.Root bg={colors.cardBg} borderWidth={1} borderColor={colors.borderColor}>
                  <Card.Body p={4}>
                    <HStack justify="space-between" mb={3}>
                      <HStack>
                        <Text fontSize="2xl">{getProviderIcon(provider.providerCode)}</Text>
                        <VStack align="start" gap={0}>
                          <Text fontWeight="bold" color={colors.textColor}>
                            {provider.displayName}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {provider.providerCode}
                          </Text>
                        </VStack>
                      </HStack>
                      {provider.enabled && (
                        provider.connected ? (
                          <Badge colorPalette="green" display="flex" alignItems="center" gap={1}>
                            <Icon as={FiCheckCircle} boxSize={3} />
                            {t('videoConference.connected', 'Conectado')}
                          </Badge>
                        ) : provider.requiresOAuth ? (
                          <Badge colorPalette="yellow" display="flex" alignItems="center" gap={1}>
                            <Icon as={FiAlertCircle} boxSize={3} />
                            {t('videoConference.notConnected', 'Sin conectar')}
                          </Badge>
                        ) : (
                          <Badge colorPalette="green">
                            {t('videoConference.available', 'Disponible')}
                          </Badge>
                        )
                      )}
                      {!provider.enabled && (
                        <Badge colorPalette="gray">
                          {t('videoConference.disabled', 'Deshabilitado')}
                        </Badge>
                      )}
                    </HStack>

                    {provider.enabled && provider.requiresOAuth && !provider.connected && (
                      <Button
                        size="sm"
                        colorPalette="blue"
                        width="full"
                        onClick={() => handleConnect(provider)}
                        loading={connectingProvider === provider.providerCode}
                        loadingText={t('videoConference.connecting', 'Conectando...')}
                      >
                        {t('videoConference.connect', 'Conectar')}
                      </Button>
                    )}

                    {provider.serverUrl && (
                      <Text fontSize="xs" color="gray.500" mt={2}>
                        Server: {provider.serverUrl}
                      </Text>
                    )}
                  </Card.Body>
                </Card.Root>
              </GridItem>
            ))}
          </Grid>
        </Box>

        {/* Upcoming Meetings */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <Heading size="md" color={colors.textColor}>
              {t('videoConference.upcomingMeetings', 'Próximas Reuniones')}
            </Heading>
          </HStack>

          {upcomingMeetings.length === 0 ? (
            <Card.Root bg={colors.cardBg} borderWidth={1} borderColor={colors.borderColor}>
              <Card.Body p={8} textAlign="center">
                <Icon as={FiCalendar} boxSize={12} color="gray.400" mb={4} />
                <Text color={colors.textColorSecondary} mb={4}>
                  {t('videoConference.noUpcomingMeetings', 'No tienes reuniones programadas')}
                </Text>
                <VideoConferenceButton variant="button" colorScheme="green" />
              </Card.Body>
            </Card.Root>
          ) : (
            <VStack gap={3} align="stretch">
              {upcomingMeetings.map((meeting) => (
                <Card.Root
                  key={meeting.id}
                  bg={colors.cardBg}
                  borderWidth={1}
                  borderColor={colors.borderColor}
                  _hover={{ borderColor: 'green.500', transform: 'translateX(4px)' }}
                  transition="all 0.2s"
                >
                  <Card.Body p={4}>
                    <HStack justify="space-between" align="start">
                      <HStack gap={4}>
                        <Box
                          p={3}
                          borderRadius="lg"
                          bg={isDark ? 'green.900' : 'green.50'}
                        >
                          <Text fontSize="2xl">{getProviderIcon(meeting.provider)}</Text>
                        </Box>
                        <VStack align="start" gap={1}>
                          <HStack>
                            <Text fontWeight="bold" color={colors.textColor}>
                              {meeting.title}
                            </Text>
                            {getStatusBadge(meeting.status)}
                          </HStack>
                          <HStack fontSize="sm" color={colors.textColorSecondary}>
                            <Icon as={FiCalendar} />
                            <Text>
                              {new Date(meeting.scheduledStart).toLocaleDateString()}
                            </Text>
                            <Icon as={FiClock} ml={2} />
                            <Text>
                              {new Date(meeting.scheduledStart).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </HStack>
                          {meeting.clientName && (
                            <HStack fontSize="sm" color={colors.textColorSecondary}>
                              <Icon as={FiUsers} />
                              <Text>{meeting.clientName}</Text>
                            </HStack>
                          )}
                        </VStack>
                      </HStack>

                      <VStack align="end" gap={2}>
                        <HStack gap={2}>
                          <Button
                            size="sm"
                            colorPalette="green"
                            onClick={() => openMeetingUrl(meeting.meetingUrl, meeting.title)}
                          >
                            <FiVideo />
                            {t('videoConference.join', 'Unirse')}
                          </Button>
                          {meeting.status !== 'CANCELLED' && meeting.status !== 'COMPLETED' && (
                            <Button
                              size="sm"
                              colorPalette="red"
                              variant="outline"
                              onClick={() => handleCancelMeeting(meeting)}
                              loading={cancellingMeetingId === meeting.id}
                            >
                              <FiXCircle />
                              {t('videoConference.cancel', 'Cancelar')}
                            </Button>
                          )}
                        </HStack>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => copyToClipboard(meeting.meetingUrl)}
                        >
                          <FiLink />
                          {t('videoConference.copyLink', 'Copiar enlace')}
                        </Button>
                      </VStack>
                    </HStack>
                  </Card.Body>
                </Card.Root>
              ))}
            </VStack>
          )}
        </Box>

        {/* Info Alert */}
        {!providersData?.enabled && (
          <Alert.Root status="info">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t('videoConference.notEnabled', 'Videoconferencias no habilitadas')}</Alert.Title>
              <Alert.Description>
                {t('videoConference.contactAdmin', 'Contacta al administrador para habilitar esta funcionalidad.')}
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}
      </VStack>

    </Container>
  );
}

export default VideoConferencePage;
