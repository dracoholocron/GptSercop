/**
 * VideoConferenceButton Component
 * Button to create/join video conference meetings
 */
import { useState, useEffect } from 'react';
import {
  Button,
  IconButton,
  Menu,
  Portal,
  VStack,
  HStack,
  Text,
  Badge,
  Spinner,
  Icon,
  Box,
  Input,
  Textarea,
} from '@chakra-ui/react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from '@chakra-ui/react';
import { Tooltip } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  FiVideo,
  FiVideoOff,
  FiChevronDown,
  FiExternalLink,
  FiCalendar,
  FiClock,
  FiLink,
  FiPlay,
} from 'react-icons/fi';
import { UserSelectModal } from './UserSelectModal';
import { toaster } from '../ui/toaster';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getProviders,
  createMeeting,
  initiateOAuthFlow,
  getMeetingsByOperation,
  createInstantMeetingWithInvitations,
} from '../../services/videoConferenceService';
import type {
  VideoProvider,
  ProvidersListResponse,
  ProviderStatus,
  MeetingRequest,
  MeetingResponse,
  OperationType,
} from '../../types/videoConference';

interface VideoConferenceButtonProps {
  operationId?: string;
  operationType?: OperationType;
  operationReference?: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  variant?: 'button' | 'icon' | 'menu';
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: string;
}

export function VideoConferenceButton({
  operationId,
  operationType,
  operationReference,
  clientId,
  clientName,
  clientEmail,
  variant = 'button',
  size = 'md',
  colorScheme = 'blue',
}: VideoConferenceButtonProps) {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isExistingOpen, setIsExistingOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [providersData, setProvidersData] = useState<ProvidersListResponse | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<VideoProvider | null>(null);
  const [existingMeetings, setExistingMeetings] = useState<MeetingResponse[]>([]);
  const [createdMeeting, setCreatedMeeting] = useState<MeetingResponse | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [instantLoading, setInstantLoading] = useState(false);

  // User selection modal state for video call invitations
  const [showUserSelectModal, setShowUserSelectModal] = useState(false);
  const [invitationLoading, setInvitationLoading] = useState(false);

  // Load providers on mount
  useEffect(() => {
    loadProviders();
  }, []);

  // Load existing meetings for operation
  useEffect(() => {
    if (operationId) {
      loadExistingMeetings();
    }
  }, [operationId]);

  const loadProviders = async () => {
    try {
      const data = await getProviders();
      setProvidersData(data);
      if (data.defaultProvider) {
        setSelectedProvider(data.defaultProvider);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  };

  const loadExistingMeetings = async () => {
    if (!operationId) return;
    try {
      const meetings = await getMeetingsByOperation(operationId);
      setExistingMeetings(meetings.filter((m) => m.status === 'SCHEDULED'));
    } catch (error) {
      console.error('Error loading meetings:', error);
    }
  };

  const handleProviderConnect = async (provider: ProviderStatus) => {
    if (!provider.requiresOAuth || provider.connected) return;

    try {
      const result = await initiateOAuthFlow(provider.providerCode);
      if (result.success) {
        toaster.success({
          title: t('videoConference.connected'),
          description: t('videoConference.connectedTo', { provider: provider.displayName }),
        });
        loadProviders();
      } else if (result.error) {
        toaster.error({
          title: t('videoConference.connectionFailed'),
          description: result.error,
        });
      }
    } catch (error) {
      toaster.error({
        title: t('videoConference.connectionFailed'),
      });
    }
  };

  const handleCreateMeeting = async () => {
    if (!selectedProvider || !title || !scheduledStart || !scheduledEnd) {
      toaster.warning({
        title: t('videoConference.validation.required'),
      });
      return;
    }

    setLoading(true);
    try {
      const request: MeetingRequest = {
        provider: selectedProvider,
        title,
        description,
        scheduledStart: new Date(scheduledStart).toISOString(),
        scheduledEnd: new Date(scheduledEnd).toISOString(),
        operationId,
        operationType,
        operationReference,
        clientId,
        clientName,
        attendees: clientEmail ? [clientEmail] : undefined,
      };

      const meeting = await createMeeting(request);
      setCreatedMeeting(meeting);

      toaster.success({
        title: t('videoConference.created'),
        description: t('videoConference.meetingCreated'),
      });

      // Reload existing meetings
      loadExistingMeetings();

      // Reset form
      setTitle('');
      setDescription('');
      setScheduledStart('');
      setScheduledEnd('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toaster.error({
        title: t('videoConference.createFailed'),
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const openMeetingUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEmbeddedMeeting = () => {
    // Show user selection modal to invite participants
    setShowUserSelectModal(true);
  };

  const handleCreateInstantMeetingWithInvitations = async (selectedUserIds: string[]) => {
    setInvitationLoading(true);
    try {
      const meetingTitle = operationReference
        ? t('videoConference.operationMeetingTitle', { reference: operationReference })
        : t('videoConference.instantMeetingTitle', { date: new Date().toLocaleDateString() });

      const response = await createInstantMeetingWithInvitations({
        provider: 'jitsi',
        title: meetingTitle,
        description: t('videoConference.instantMeetingDesc'),
        inviteeUserIds: selectedUserIds,
        operationId,
        operationReference,
        operationType,
        clientId,
        clientName,
      });

      // Close the user selection modal
      setShowUserSelectModal(false);

      // Show success message with number of invitations sent
      toaster.success({
        title: t('videoConference.invitationsSent', 'Invitaciones enviadas'),
        description: t('videoConference.invitationsSentDesc', {
          count: response.alertsCreated,
          defaultValue: `Se enviaron ${response.alertsCreated} invitación(es)`,
        }),
      });

      // Open the meeting in a new tab
      if (response.meetingUrl) {
        window.open(response.meetingUrl, '_blank', 'noopener,noreferrer');
      }

      // Reload existing meetings
      loadExistingMeetings();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toaster.error({
        title: t('videoConference.invitationFailed', 'Error al enviar invitaciones'),
        description: errorMessage,
      });
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleInstantMeeting = async () => {
    const provider = getConnectedProvider();
    if (!provider) {
      toaster.warning({
        title: t('videoConference.noProviderConnected'),
      });
      return;
    }

    setInstantLoading(true);
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later

      const request: MeetingRequest = {
        provider: provider.providerCode,
        title: operationReference
          ? t('videoConference.operationMeetingTitle', { reference: operationReference })
          : t('videoConference.instantMeetingTitle', { date: now.toLocaleDateString() }),
        description: t('videoConference.instantMeetingDesc'),
        scheduledStart: now.toISOString(),
        scheduledEnd: endTime.toISOString(),
        operationId,
        operationType,
        operationReference,
        clientId,
        clientName,
        attendees: clientEmail ? [clientEmail] : undefined,
      };

      const meeting = await createMeeting(request);

      toaster.success({
        title: t('videoConference.created'),
        description: t('videoConference.openingMeeting'),
      });

      // Open the meeting in a new tab
      if (meeting.meetingUrl) {
        window.open(meeting.meetingUrl, '_blank', 'noopener,noreferrer');
      }

      // Reload existing meetings
      loadExistingMeetings();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toaster.error({
        title: t('videoConference.createFailed'),
        description: errorMessage,
      });
    } finally {
      setInstantLoading(false);
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

  const getConnectedProvider = (): ProviderStatus | null => {
    if (!providersData) return null;
    return (
      providersData.providers.find((p) => p.enabled && (!p.requiresOAuth || p.connected)) || null
    );
  };

  const isDisabled = !providersData?.enabled || !getConnectedProvider();

  const handleClose = () => {
    setCreatedMeeting(null);
    setIsOpen(false);
  };

  // Render based on variant
  if (variant === 'icon') {
    return (
      <Tooltip.Root openDelay={100}>
        <Tooltip.Trigger asChild>
          <IconButton
            aria-label={t('videoConference.videoCall')}
            size={size}
            colorPalette={colorScheme}
            disabled={isDisabled}
            onClick={() => existingMeetings.length > 0 ? setIsExistingOpen(true) : setIsOpen(true)}
          >
            {isDisabled ? <FiVideoOff /> : <FiVideo />}
          </IconButton>
        </Tooltip.Trigger>
        <Portal>
          <Tooltip.Positioner>
            <Tooltip.Content>
              {isDisabled
                ? t('videoConference.notConfigured')
                : existingMeetings.length > 0
                  ? t('videoConference.joinMeeting')
                  : t('videoConference.createMeeting')}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Portal>
      </Tooltip.Root>
    );
  }

  if (variant === 'menu') {
    return (
      <>
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button
              size={size}
              colorPalette={colorScheme}
              disabled={isDisabled}
            >
              <FiVideo />
              {t('videoConference.videoCall')}
              <FiChevronDown />
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content bg={colors.cardBg}>
                {existingMeetings.length > 0 && (
                  <>
                    {existingMeetings.map((meeting) => (
                      <Menu.Item
                        key={meeting.id}
                        value={meeting.id.toString()}
                        onClick={() => openMeetingUrl(meeting.meetingUrl)}
                      >
                        <FiLink />
                        <VStack align="start" gap={0}>
                          <Text fontWeight="medium">{meeting.title}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {new Date(meeting.scheduledStart).toLocaleString()}
                          </Text>
                        </VStack>
                      </Menu.Item>
                    ))}
                    <Menu.Separator />
                  </>
                )}
                <Menu.Item
                  value="embedded"
                  onClick={handleEmbeddedMeeting}
                >
                  <FiPlay />
                  {t('videoConference.startEmbedded', 'Iniciar Videollamada')}
                </Menu.Item>
                <Menu.Separator />
                <Menu.Item
                  value="instant"
                  onClick={handleInstantMeeting}
                  disabled={instantLoading}
                >
                  {instantLoading ? <Spinner size="sm" /> : <FiExternalLink />}
                  {t('videoConference.startExternal', 'Abrir en Google Meet')}
                </Menu.Item>
                <Menu.Item value="schedule" onClick={() => setIsOpen(true)}>
                  <FiCalendar />
                  {t('videoConference.scheduleMeeting')}
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>

        {/* Create Meeting Modal */}
        <CreateMeetingModal
          isOpen={isOpen}
          onClose={handleClose}
          providersData={providersData}
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          scheduledStart={scheduledStart}
          setScheduledStart={setScheduledStart}
          scheduledEnd={scheduledEnd}
          setScheduledEnd={setScheduledEnd}
          loading={loading}
          createdMeeting={createdMeeting}
          setCreatedMeeting={setCreatedMeeting}
          handleProviderConnect={handleProviderConnect}
          handleCreateMeeting={handleCreateMeeting}
          openMeetingUrl={openMeetingUrl}
          getProviderIcon={getProviderIcon}
          colors={colors}
        />

        {/* User Selection Modal for Video Call Invitations */}
        <UserSelectModal
          isOpen={showUserSelectModal}
          onClose={() => setShowUserSelectModal(false)}
          onConfirm={handleCreateInstantMeetingWithInvitations}
          title={t('videoConference.selectParticipants', 'Seleccionar Participantes')}
          loading={invitationLoading}
          excludeUserIds={user?.username ? [user.username] : []}
        />
      </>
    );
  }

  // Default button variant
  return (
    <>
      <Button
        size={size}
        colorPalette={colorScheme}
        disabled={isDisabled}
        onClick={() => existingMeetings.length > 0 ? setIsExistingOpen(true) : setIsOpen(true)}
      >
        {isDisabled ? <FiVideoOff /> : <FiVideo />}
        {existingMeetings.length > 0
          ? t('videoConference.joinMeeting')
          : t('videoConference.createMeeting')}
      </Button>

      {/* Existing Meetings Modal */}
      <DialogRoot
        open={isExistingOpen}
        onOpenChange={(e) => setIsExistingOpen(e.open)}
        size="md"
        placement="center"
      >
        <DialogContent bg={colors.cardBg}>
          <DialogHeader>
            <DialogTitle color={colors.textColor}>
              {t('videoConference.scheduledMeetings')}
            </DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody>
            <VStack gap={3} align="stretch">
              {existingMeetings.map((meeting) => (
                <Box key={meeting.id} p={3} borderWidth={1} borderRadius="md" borderColor={colors.borderColor}>
                  <HStack justify="space-between">
                    <VStack align="start" gap={0}>
                      <Text fontWeight="medium" color={colors.textColor}>{meeting.title}</Text>
                      <HStack fontSize="sm" color={colors.textColorSecondary}>
                        <Icon as={FiClock} />
                        <Text>{new Date(meeting.scheduledStart).toLocaleString()}</Text>
                      </HStack>
                    </VStack>
                    <Button
                      size="sm"
                      colorPalette="green"
                      onClick={() => openMeetingUrl(meeting.meetingUrl)}
                    >
                      <FiExternalLink />
                      {t('videoConference.join')}
                    </Button>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsExistingOpen(false)}>
              {t('common.close')}
            </Button>
            <Button
              colorPalette="blue"
              onClick={() => {
                setIsExistingOpen(false);
                setIsOpen(true);
              }}
            >
              {t('videoConference.scheduleNew')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Create Meeting Modal */}
      <CreateMeetingModal
        isOpen={isOpen}
        onClose={handleClose}
        providersData={providersData}
        selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        scheduledStart={scheduledStart}
        setScheduledStart={setScheduledStart}
        scheduledEnd={scheduledEnd}
        setScheduledEnd={setScheduledEnd}
        loading={loading}
        createdMeeting={createdMeeting}
        setCreatedMeeting={setCreatedMeeting}
        handleProviderConnect={handleProviderConnect}
        handleCreateMeeting={handleCreateMeeting}
        openMeetingUrl={openMeetingUrl}
        getProviderIcon={getProviderIcon}
        colors={colors}
      />

    </>
  );
}

// ============================================================================
// CREATE MEETING MODAL
// ============================================================================

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  providersData: ProvidersListResponse | null;
  selectedProvider: VideoProvider | null;
  setSelectedProvider: (provider: VideoProvider) => void;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  scheduledStart: string;
  setScheduledStart: (start: string) => void;
  scheduledEnd: string;
  setScheduledEnd: (end: string) => void;
  loading: boolean;
  createdMeeting: MeetingResponse | null;
  setCreatedMeeting: (meeting: MeetingResponse | null) => void;
  handleProviderConnect: (provider: ProviderStatus) => void;
  handleCreateMeeting: () => void;
  openMeetingUrl: (url: string) => void;
  getProviderIcon: (provider: VideoProvider) => string;
  colors: ReturnType<typeof import('../../contexts/ThemeContext').useTheme>['getColors'];
}

function CreateMeetingModal({
  isOpen,
  onClose,
  providersData,
  selectedProvider,
  setSelectedProvider,
  title,
  setTitle,
  description,
  setDescription,
  scheduledStart,
  setScheduledStart,
  scheduledEnd,
  setScheduledEnd,
  loading,
  createdMeeting,
  setCreatedMeeting,
  handleProviderConnect,
  handleCreateMeeting,
  openMeetingUrl,
  getProviderIcon,
  colors,
}: CreateMeetingModalProps) {
  const { t } = useTranslation();

  const handleClose = () => {
    setCreatedMeeting(null);
    onClose();
  };

  if (createdMeeting) {
    return (
      <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && handleClose()} size="md" placement="center">
        <DialogContent bg={colors.cardBg}>
          <DialogHeader>
            <DialogTitle color={colors.textColor}>
              {t('videoConference.meetingCreated')}
            </DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger />
          <DialogBody>
            <VStack gap={4} align="stretch">
              <Box p={4} bg="green.50" borderRadius="md" borderWidth={1} borderColor="green.200">
                <VStack gap={2} align="start">
                  <Text fontWeight="bold" fontSize="lg" color="gray.800">
                    {createdMeeting.title}
                  </Text>
                  <HStack>
                    <Icon as={FiCalendar} color="gray.500" />
                    <Text color="gray.700">{new Date(createdMeeting.scheduledStart).toLocaleString()}</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FiLink} color="gray.500" />
                    <Text fontSize="sm" color="blue.500" lineClamp={1}>
                      {createdMeeting.meetingUrl}
                    </Text>
                  </HStack>
                </VStack>
              </Box>
              <Button
                colorPalette="green"
                size="lg"
                onClick={() => openMeetingUrl(createdMeeting.meetingUrl)}
              >
                <FiExternalLink />
                {t('videoConference.joinNow')}
              </Button>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Button onClick={handleClose}>{t('common.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    );
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="lg" placement="center">
      <DialogContent bg={colors.cardBg}>
        <DialogHeader>
          <DialogTitle color={colors.textColor}>
            {t('videoConference.scheduleMeeting')}
          </DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger />
        <DialogBody>
          <VStack gap={4} align="stretch">
            {/* Provider Selection */}
            <Box>
              <Text color={colors.textColor} fontSize="sm" mb={2}>
                {t('videoConference.provider')}
              </Text>
              <HStack gap={2} flexWrap="wrap">
                {providersData?.providers
                  .filter((p) => p.enabled)
                  .map((provider) => (
                    <Button
                      key={provider.providerCode}
                      size="sm"
                      variant={selectedProvider === provider.providerCode ? 'solid' : 'outline'}
                      colorPalette={selectedProvider === provider.providerCode ? 'blue' : 'gray'}
                      onClick={() => {
                        if (provider.requiresOAuth && !provider.connected) {
                          handleProviderConnect(provider);
                        } else {
                          setSelectedProvider(provider.providerCode);
                        }
                      }}
                    >
                      <HStack>
                        <Text>{getProviderIcon(provider.providerCode)}</Text>
                        <Text>{provider.displayName}</Text>
                        {provider.requiresOAuth && !provider.connected && (
                          <Badge colorPalette="yellow" fontSize="xs">
                            {t('videoConference.connect')}
                          </Badge>
                        )}
                      </HStack>
                    </Button>
                  ))}
              </HStack>
            </Box>

            {/* Meeting Title */}
            <Box>
              <Text color={colors.textColor} fontSize="sm" mb={1}>
                {t('videoConference.title')} *
              </Text>
              <Input
                placeholder={t('videoConference.titlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                bg={colors.bgColor}
                borderColor={colors.borderColor}
                color={colors.textColor}
              />
            </Box>

            {/* Description */}
            <Box>
              <Text color={colors.textColor} fontSize="sm" mb={1}>
                {t('videoConference.description')}
              </Text>
              <Textarea
                placeholder={t('videoConference.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                bg={colors.bgColor}
                borderColor={colors.borderColor}
                color={colors.textColor}
              />
            </Box>

            {/* Date/Time */}
            <HStack gap={4} width="100%">
              <Box flex={1}>
                <Text color={colors.textColor} fontSize="sm" mb={1}>
                  {t('videoConference.startTime')} *
                </Text>
                <Input
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  bg={colors.bgColor}
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                />
              </Box>

              <Box flex={1}>
                <Text color={colors.textColor} fontSize="sm" mb={1}>
                  {t('videoConference.endTime')} *
                </Text>
                <Input
                  type="datetime-local"
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
                  bg={colors.bgColor}
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                />
              </Box>
            </HStack>
          </VStack>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            colorPalette="blue"
            onClick={handleCreateMeeting}
            loading={loading}
            loadingText={t('videoConference.creating')}
          >
            <FiVideo />
            {t('videoConference.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

export default VideoConferenceButton;
