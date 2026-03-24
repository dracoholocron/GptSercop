/**
 * EventTypeConfigAdmin - Master-Detail admin page for managing event configuration.
 * Left panel: event list with search. Right panel: event details with accordion sections
 * for transitions, rules, and alert templates.
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Icon,
  Heading,
  Card,
  Button,
  Alert,
  Dialog,
  Portal,
  Collapsible,
  Grid,
  NativeSelect,
  Field,
} from '@chakra-ui/react';
import {
  FiAlertTriangle,
  FiCheck,
  FiFilter,
  FiRefreshCw,
  FiCheckCircle,
  FiArrowRight,
  FiArrowDown,
  FiGitBranch,
  FiChevronDown,
  FiChevronUp,
  FiZap,
  FiHelpCircle,
  FiTrash2,
  FiActivity,
  FiInfo,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { eventConfigApi, eventConfigCommands } from '../../services/operationsApi';
import { productTypeConfigService } from '../../services/productTypeConfigService';
import type { EventTypeConfig, EventFlowConfig } from '../../types/operations';
import {
  getRoleIcon,
  getIconComponent,
} from './eventConfigConstants';
import { EventMasterList } from './EventMasterList';
import { EventDetailPanel } from './EventDetailPanel';
import { ActionTypesTab } from './ActionTypesTab';

/** Internal helper: render icon from name */
const IconDisplay = ({ iconName }: { iconName?: string }) => {
  const Ic = getIconComponent(iconName);
  return <Icon as={Ic} />;
};

export const EventTypeConfigAdmin = () => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  // Data
  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([]);
  const [flows, setFlows] = useState<EventFlowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dynamic operation types loaded from BD (no fallback, always from API)
  const [operationTypes, setOperationTypes] = useState<{value: string; label: string}[]>([]);

  // Filters
  const [selectedOperationType, setSelectedOperationType] = useState<string>('LC_IMPORT');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('es');
  const [showGuide, setShowGuide] = useState(true);

  // Load operation types dynamically from BD
  useEffect(() => {
    productTypeConfigService.getAllConfigs().then(configs => {
      if (configs && configs.length > 0) {
        setOperationTypes(configs.map(c => ({
          value: c.productType,
          label: c.description || c.productType,
        })));
      }
    }).catch(() => {
      // Keep empty on error - no hardcoded fallback
    });
  }, []);

  // Master-detail state
  const [selectedEventCode, setSelectedEventCode] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [actionTypesDialogOpen, setActionTypesDialogOpen] = useState(false);

  // Ref for scrolling to detail panel
  const detailPanelRef = useRef<HTMLDivElement>(null);

  // Delete confirmation (shared for events and flows)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: number | null;
    name: string;
    type: 'event' | 'flow';
  }>({ open: false, id: null, name: '', type: 'event' });

  // Data loading
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [types, flowConfigs] = await Promise.all([
        eventConfigApi.getEventTypes(selectedOperationType, selectedLanguage),
        eventConfigApi.getAllFlows(selectedOperationType, selectedLanguage),
      ]);
      setEventTypes(types);
      setFlows(flowConfigs);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load event configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedOperationType, selectedLanguage]);

  // Sorted events for flow diagram
  const sortedEventTypes = useMemo(
    () => [...eventTypes].sort((a, b) => a.displayOrder - b.displayOrder),
    [eventTypes]
  );

  // Currently selected event object
  const selectedEvent = useMemo(
    () => eventTypes.find((et) => et.eventCode === selectedEventCode) || null,
    [eventTypes, selectedEventCode]
  );

  // Helpers for flow diagram
  const hasConditions = (flow: EventFlowConfig | { conditions?: Record<string, unknown> }): boolean => {
    if (!flow.conditions || typeof flow.conditions !== 'object') return false;
    return Object.keys(flow.conditions).length > 0;
  };

  // Master-detail handlers
  const handleSelectEvent = useCallback((eventCode: string) => {
    setSelectedEventCode(eventCode);
    setIsCreatingNew(false);
    // Scroll to detail panel with a small delay to let the UI update
    setTimeout(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedEventCode(null);
  };

  const handleEventSaved = () => {
    setSuccess(t('admin.eventTypes.updatedSuccess'));
    setIsCreatingNew(false);
    loadData();
  };

  const handleCancelCreate = () => {
    setIsCreatingNew(false);
  };

  const handleFlowSaved = () => {
    setSuccess(t('admin.eventFlows.updatedSuccess'));
    loadData();
  };

  const handleDeleteEvent = (id: number, name: string) => {
    setDeleteConfirm({ open: true, id, name, type: 'event' });
  };

  const handleDeleteFlow = (id: number, name: string) => {
    setDeleteConfirm({ open: true, id, name, type: 'flow' });
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    setError(null);
    setSuccess(null);
    try {
      if (deleteConfirm.type === 'event') {
        await eventConfigCommands.deleteEventType(deleteConfirm.id);
        setSuccess(t('admin.eventTypes.deletedSuccess'));
        if (selectedEvent && selectedEvent.id === deleteConfirm.id) {
          setSelectedEventCode(null);
        }
      } else if (deleteConfirm.type === 'flow') {
        await eventConfigCommands.deleteEventFlow(deleteConfirm.id);
        setSuccess(t('admin.eventFlows.deletedSuccess'));
      }
      setDeleteConfirm({ open: false, id: null, name: '', type: 'event' });
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete';
      setError(errorMessage);
      setDeleteConfirm({ open: false, id: null, name: '', type: 'event' });
    }
  };

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" gap={1}>
            <Heading size="lg" color={colors.textColor}>
              {t('admin.eventTypes.title')}
            </Heading>
            <Text color={colors.textColor} opacity={0.7}>
              {t('admin.eventTypes.sectionDescription')}
            </Text>
          </VStack>
        </Flex>

        {/* Alerts */}
        {error && (
          <Alert.Root status="error">
            <Alert.Indicator>
              <Icon as={FiAlertTriangle} />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title>{error}</Alert.Title>
            </Alert.Content>
          </Alert.Root>
        )}
        {success && (
          <Alert.Root status="success">
            <Alert.Indicator>
              <Icon as={FiCheck} />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title>{success}</Alert.Title>
            </Alert.Content>
          </Alert.Root>
        )}

        {/* Didactic Guide - Collapsible */}
        <Card.Root bg={colors.cardBg} borderColor={colors.borderColor}>
          <Card.Body p={0}>
            <Collapsible.Root open={showGuide} onOpenChange={(e) => setShowGuide(e.open)}>
              <Collapsible.Trigger asChild>
                <Button variant="ghost" w="100%" justifyContent="space-between" py={4} px={5} h="auto">
                  <HStack gap={2}>
                    <Icon as={FiHelpCircle} color="blue.500" />
                    <Text fontWeight="semibold" color={colors.textColor}>
                      {t('admin.eventConfig.howItWorks', 'How it works')}
                    </Text>
                  </HStack>
                  <Icon as={showGuide ? FiChevronUp : FiChevronDown} color={colors.textColor} />
                </Button>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <Box px={5} pb={5}>
                  <HStack gap={4} flexWrap="wrap" justify="center" align="stretch">
                    <VStack flex="1" minW="200px" p={4} bg="blue.50" borderRadius="lg" borderWidth="1px" borderColor="blue.200" gap={2} align="center">
                      <Badge colorPalette="blue" variant="solid" borderRadius="full" px={3} py={1} fontSize="sm">
                        {t('admin.eventConfig.step1Title', '1. Define Events')}
                      </Badge>
                      <Icon as={FiActivity} boxSize={6} color="blue.500" />
                      <Text fontSize="sm" textAlign="center" color="blue.700">
                        {t('admin.eventConfig.step1Desc', 'Create the events that make up the lifecycle of your operations')}
                      </Text>
                    </VStack>
                    <Flex align="center" display={{ base: 'none', md: 'flex' }}>
                      <Icon as={FiArrowRight} boxSize={6} color="gray.400" />
                    </Flex>
                    <VStack flex="1" minW="200px" p={4} bg="green.50" borderRadius="lg" borderWidth="1px" borderColor="green.200" gap={2} align="center">
                      <Badge colorPalette="green" variant="solid" borderRadius="full" px={3} py={1} fontSize="sm">
                        {t('admin.eventConfig.step2Title', '2. Configure Transitions')}
                      </Badge>
                      <Icon as={FiGitBranch} boxSize={6} color="green.500" />
                      <Text fontSize="sm" textAlign="center" color="green.700">
                        {t('admin.eventConfig.step2Desc', 'Connect events by defining which transitions are allowed between them')}
                      </Text>
                    </VStack>
                    <Flex align="center" display={{ base: 'none', md: 'flex' }}>
                      <Icon as={FiArrowRight} boxSize={6} color="gray.400" />
                    </Flex>
                    <VStack flex="1" minW="200px" p={4} bg="orange.50" borderRadius="lg" borderWidth="1px" borderColor="orange.200" gap={2} align="center">
                      <Badge colorPalette="orange" variant="solid" borderRadius="full" px={3} py={1} fontSize="sm">
                        {t('admin.eventConfig.step3Title', '3. Define Rules & Actions')}
                      </Badge>
                      <Icon as={FiZap} boxSize={6} color="orange.500" />
                      <Text fontSize="sm" textAlign="center" color="orange.700">
                        {t('admin.eventConfig.step3Desc', 'Configure what actions execute automatically when events are triggered')}
                      </Text>
                    </VStack>
                    <Flex align="center" display={{ base: 'none', md: 'flex' }}>
                      <Icon as={FiArrowRight} boxSize={6} color="gray.400" />
                    </Flex>
                    <VStack flex="1" minW="200px" p={4} bg="purple.50" borderRadius="lg" borderWidth="1px" borderColor="purple.200" gap={2} align="center">
                      <Badge colorPalette="purple" variant="solid" borderRadius="full" px={3} py={1} fontSize="sm">
                        {t('admin.eventConfig.step4Title', '4. Complete Flow')}
                      </Badge>
                      <Icon as={FiCheckCircle} boxSize={6} color="purple.500" />
                      <Text fontSize="sm" textAlign="center" color="purple.700">
                        {t('admin.eventConfig.step4Desc', 'The complete configuration governs how operations progress through the system')}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </Collapsible.Content>
            </Collapsible.Root>
          </Card.Body>
        </Card.Root>

        {/* Filters */}
        <Card.Root bg={colors.cardBg} borderColor={colors.borderColor}>
          <Card.Body>
            <HStack gap={4} flexWrap="wrap">
              <HStack gap={2}>
                <Icon as={FiFilter} color={colors.textColor} />
                <Text fontWeight="medium" color={colors.textColor}>{t('admin.common.filters')}:</Text>
              </HStack>
              <Field.Root w="200px">
                <Field.Label fontSize="sm">{t('admin.common.operationType')}</Field.Label>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={selectedOperationType}
                    onChange={(e) => setSelectedOperationType(e.target.value)}
                  >
                    {operationTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
              <Field.Root w="120px">
                <Field.Label fontSize="sm">{t('admin.common.language')}</Field.Label>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    <option value="en">{t('admin.common.english')}</option>
                    <option value="es">{t('admin.common.spanish')}</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
              <Button size="sm" variant="outline" onClick={loadData}>
                <Icon as={FiRefreshCw} mr={1} />
                {t('admin.common.refresh')}
              </Button>
            </HStack>
          </Card.Body>
        </Card.Root>

        {/* Unified Flow Diagram */}
        <Card.Root bg={colors.cardBg} borderColor={colors.borderColor}>
          <Card.Header>
            <HStack gap={2}>
              <Icon as={FiGitBranch} color={colors.textColor} />
              <Heading size="sm" color={colors.textColor}>
                {t('admin.eventTypes.flowPreview')} - {operationTypes.find(op => op.value === selectedOperationType)?.label}
              </Heading>
            </HStack>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <Flex justify="center" p={8}>
                <Spinner size="lg" color="blue.500" />
              </Flex>
            ) : sortedEventTypes.length > 0 ? (
              <Box overflowX="auto" pb={2}>
                {(() => {
                  const initialEvents = sortedEventTypes.filter(et => et.isInitialEvent);
                  const flowEvents = sortedEventTypes.filter(et => !et.isInitialEvent);
                  const hasMultipleStarts = initialEvents.length > 1;
                  const getFlowsTo = (eventCode: string) => flows.filter(f => f.toEventCode === eventCode);
                  const getFlowsFrom = (eventCode: string) => flows.filter(f => f.fromEventCode === eventCode);

                  return (
                    <VStack gap={4} align="stretch">
                      {/* Multiple entry points */}
                      {hasMultipleStarts && (
                        <Box position="relative">
                          <HStack gap={4} align="flex-end" justify="center" flexWrap="wrap">
                            {initialEvents.map((et) => (
                              <VStack key={et.id} gap={2} align="center" cursor="pointer" onClick={() => handleSelectEvent(et.eventCode)}>
                                <Badge colorPalette="blue" variant="subtle" fontSize="xs">
                                  <HStack gap={1}>
                                    <Icon as={getRoleIcon(et.initialEventRole)} boxSize={3} />
                                    <Text>{et.initialEventRole?.replace(/_/g, ' ') || 'START'}</Text>
                                  </HStack>
                                </Badge>
                                <VStack
                                  p={3}
                                  bg={`${et.color || 'blue'}.50`}
                                  borderWidth={et.eventCode === selectedEventCode ? '3px' : '2px'}
                                  borderColor={et.eventCode === selectedEventCode ? 'blue.500' : `${et.color || 'blue'}.400`}
                                  borderRadius="lg"
                                  minW="140px"
                                  maxW="180px"
                                  gap={1}
                                  boxShadow={et.eventCode === selectedEventCode ? 'lg' : 'md'}
                                >
                                  <HStack gap={2}>
                                    <Flex w="28px" h="28px" borderRadius="full" bg={`${et.color || 'blue'}.200`} alignItems="center" justifyContent="center" flexShrink={0}>
                                      <IconDisplay iconName={et.icon} />
                                    </Flex>
                                    <Text fontSize="xs" fontWeight="bold" color={`${et.color || 'blue'}.800`} lineClamp={2}>{et.eventName}</Text>
                                  </HStack>
                                  {(et.outboundMessageType || et.inboundMessageType) && (
                                    <HStack gap={1} flexWrap="wrap" justify="center">
                                      {et.outboundMessageType && <Badge colorPalette="purple" size="sm" fontSize="9px">↑{et.outboundMessageType}</Badge>}
                                      {et.inboundMessageType && <Badge colorPalette="green" size="sm" fontSize="9px">↓{et.inboundMessageType}</Badge>}
                                    </HStack>
                                  )}
                                  {et.resultingStage && <Text fontSize="9px" color="gray.600">→ {et.resultingStage}</Text>}
                                </VStack>
                                <Icon as={FiArrowDown} boxSize={5} color="gray.400" />
                              </VStack>
                            ))}
                          </HStack>
                          <Flex justify="center" mt={-2}>
                            <Box w={`${Math.min(initialEvents.length * 180, 400)}px`} h="2px" bg="gray.300" borderRadius="full" />
                          </Flex>
                          <Flex justify="center">
                            <Icon as={FiArrowDown} boxSize={5} color="gray.400" />
                          </Flex>
                        </Box>
                      )}

                      {/* Main flow - horizontal */}
                      <HStack gap={0} align="center" minW="max-content" justify="center">
                        {!hasMultipleStarts && (
                          <>
                            {initialEvents.length === 1 ? (
                              <VStack gap={1} align="center" cursor="pointer" onClick={() => handleSelectEvent(initialEvents[0].eventCode)}>
                                {(initialEvents[0].ourRole || initialEvents[0].messageSender || initialEvents[0].initialEventRole) && (
                                  <Badge colorPalette={initialEvents[0].ourRole === 'SENDER' ? 'orange' : 'teal'} variant="subtle" fontSize="8px">
                                    <HStack gap={1}>
                                      <Icon as={getRoleIcon(initialEvents[0].initialEventRole || (initialEvents[0].ourRole === 'SENDER' ? initialEvents[0].messageSender : initialEvents[0].messageReceiver))} boxSize={3} />
                                      <Text>
                                        {initialEvents[0].initialEventRole?.replace(/_/g, ' ') ||
                                          (initialEvents[0].ourRole === 'SENDER'
                                            ? (initialEvents[0].messageSender?.replace(/_/g, ' ') || 'WE SEND')
                                            : (initialEvents[0].messageReceiver?.replace(/_/g, ' ') || 'WE RECEIVE'))}
                                      </Text>
                                    </HStack>
                                  </Badge>
                                )}
                                <VStack
                                  p={3}
                                  bg={`${initialEvents[0].color || 'green'}.50`}
                                  borderWidth={initialEvents[0].eventCode === selectedEventCode ? '3px' : '2px'}
                                  borderColor={initialEvents[0].eventCode === selectedEventCode ? 'blue.500' : `${initialEvents[0].color || 'green'}.400`}
                                  borderRadius="lg"
                                  minW="140px"
                                  maxW="180px"
                                  gap={1}
                                  boxShadow={initialEvents[0].eventCode === selectedEventCode ? 'lg' : 'md'}
                                >
                                  <Badge colorPalette="green" size="sm" fontSize="9px" mb={1}>START</Badge>
                                  <HStack gap={2}>
                                    <Flex w="28px" h="28px" borderRadius="full" bg={`${initialEvents[0].color || 'green'}.200`} alignItems="center" justifyContent="center" flexShrink={0}>
                                      <IconDisplay iconName={initialEvents[0].icon} />
                                    </Flex>
                                    <Text fontSize="xs" fontWeight="bold" color={`${initialEvents[0].color || 'green'}.800`} lineClamp={2}>{initialEvents[0].eventName}</Text>
                                  </HStack>
                                  {(initialEvents[0].outboundMessageType || initialEvents[0].inboundMessageType) && (
                                    <HStack gap={1} flexWrap="wrap" justify="center">
                                      {initialEvents[0].outboundMessageType && <Badge colorPalette="purple" size="sm" fontSize="9px">↑{initialEvents[0].outboundMessageType}</Badge>}
                                      {initialEvents[0].inboundMessageType && <Badge colorPalette="green" size="sm" fontSize="9px">↓{initialEvents[0].inboundMessageType}</Badge>}
                                    </HStack>
                                  )}
                                  {initialEvents[0].resultingStage && <Text fontSize="9px" color="gray.600">→ {initialEvents[0].resultingStage}</Text>}
                                </VStack>
                              </VStack>
                            ) : (
                              <Flex w="50px" h="50px" borderRadius="full" bg="green.500" alignItems="center" justifyContent="center" flexShrink={0}>
                                <Text color="white" fontWeight="bold" fontSize="xs">START</Text>
                              </Flex>
                            )}
                          </>
                        )}

                        {/* Flow events with transition arrows */}
                        {flowEvents.map((et, index) => {
                          const flowsTo = getFlowsTo(et.eventCode);
                          const flowsFrom = getFlowsFrom(et.eventCode);
                          const hasRequired = flowsTo.some(f => f.isRequired);
                          const hasConditional = flowsTo.some(f => hasConditions(f));

                          return (
                            <HStack key={et.id} gap={0} align="center">
                              <VStack gap={0} px={1}>
                                {flowsTo.length > 0 && flowsTo[0].transitionLabel && (
                                  <Text fontSize="8px" color="gray.500" maxW="60px" textAlign="center" lineClamp={1}>
                                    {flowsTo[0].transitionLabel}
                                  </Text>
                                )}
                                <HStack gap={0}>
                                  <Box w="20px" h="2px" bg={hasConditional ? 'yellow.400' : (hasRequired ? 'red.400' : 'gray.300')} />
                                  <Icon as={FiArrowRight} boxSize={4} color={hasConditional ? 'yellow.500' : (hasRequired ? 'red.400' : 'gray.400')} />
                                </HStack>
                                {hasConditional ? (
                                  <HStack gap={0}>
                                    <Icon as={FiZap} boxSize={3} color="yellow.500" />
                                    <Text fontSize="7px" color="yellow.600" fontWeight="bold">COND</Text>
                                  </HStack>
                                ) : hasRequired && (
                                  <Text fontSize="7px" color="red.500" fontWeight="bold">REQ</Text>
                                )}
                              </VStack>

                              <VStack gap={1} align="center" cursor="pointer" onClick={() => handleSelectEvent(et.eventCode)}>
                                {(et.ourRole || et.messageSender) && (
                                  <Badge colorPalette={et.ourRole === 'SENDER' ? 'orange' : 'teal'} variant="subtle" fontSize="8px">
                                    <HStack gap={1}>
                                      <Icon as={getRoleIcon(et.ourRole === 'SENDER' ? et.messageSender : et.messageReceiver)} boxSize={3} />
                                      <Text>
                                        {et.ourRole === 'SENDER'
                                          ? (et.messageSender?.replace(/_/g, ' ') || 'WE SEND')
                                          : (et.messageReceiver?.replace(/_/g, ' ') || 'WE RECEIVE')}
                                      </Text>
                                    </HStack>
                                  </Badge>
                                )}
                                <VStack
                                  p={3}
                                  bg={`${et.color || 'blue'}.50`}
                                  borderWidth={et.eventCode === selectedEventCode ? '3px' : '2px'}
                                  borderColor={et.eventCode === selectedEventCode ? 'blue.500' : `${et.color || 'blue'}.300`}
                                  borderRadius="lg"
                                  minW="140px"
                                  maxW="180px"
                                  gap={1}
                                  position="relative"
                                  boxShadow={et.eventCode === selectedEventCode ? 'lg' : undefined}
                                >
                                  <Badge position="absolute" top="-10px" left="-10px" colorPalette="gray" variant="solid" borderRadius="full" w="24px" h="24px" display="flex" alignItems="center" justifyContent="center" fontSize="xs">
                                    {index + 1 + (hasMultipleStarts ? 0 : (initialEvents.length > 0 ? 1 : 0))}
                                  </Badge>
                                  <HStack gap={2}>
                                    <Flex w="28px" h="28px" borderRadius="full" bg={`${et.color || 'blue'}.200`} alignItems="center" justifyContent="center" flexShrink={0}>
                                      <IconDisplay iconName={et.icon} />
                                    </Flex>
                                    <Text fontSize="xs" fontWeight="bold" color={`${et.color || 'blue'}.800`} lineClamp={2}>{et.eventName}</Text>
                                  </HStack>
                                  {(et.outboundMessageType || et.inboundMessageType) && (
                                    <HStack gap={1} flexWrap="wrap" justify="center">
                                      {et.outboundMessageType && <Badge colorPalette="purple" size="sm" fontSize="9px">↑{et.outboundMessageType}</Badge>}
                                      {et.inboundMessageType && <Badge colorPalette="green" size="sm" fontSize="9px">↓{et.inboundMessageType}</Badge>}
                                    </HStack>
                                  )}
                                  <HStack gap={1} flexWrap="wrap" justify="center">
                                    {flowsTo.length > 0 && (
                                      <Badge colorPalette="teal" variant="outline" size="sm" fontSize="8px">
                                        ←{flowsTo.length}
                                      </Badge>
                                    )}
                                    {flowsFrom.length > 0 && (
                                      <Badge colorPalette="blue" variant="outline" size="sm" fontSize="8px">
                                        {flowsFrom.length}→
                                      </Badge>
                                    )}
                                  </HStack>
                                  {et.resultingStage && <Text fontSize="9px" color="gray.600">→ {et.resultingStage}</Text>}
                                  {/* Info button - navigates to detail */}
                                  <Flex
                                    position="absolute"
                                    bottom="-8px"
                                    right="-8px"
                                    w="22px"
                                    h="22px"
                                    borderRadius="full"
                                    bg="blue.500"
                                    color="white"
                                    alignItems="center"
                                    justifyContent="center"
                                    cursor="pointer"
                                    boxShadow="sm"
                                    _hover={{ bg: 'blue.600', transform: 'scale(1.1)' }}
                                    transition="all 0.15s"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectEvent(et.eventCode);
                                    }}
                                    title={`Ver detalle: ${et.eventName}`}
                                  >
                                    <Icon as={FiInfo} boxSize={3} />
                                  </Flex>
                                </VStack>
                              </VStack>
                            </HStack>
                          );
                        })}

                        {/* End node */}
                        <VStack gap={0} px={1}>
                          <Box w="20px" h="2px" bg="gray.300" />
                          <Icon as={FiArrowRight} boxSize={4} color="gray.400" />
                        </VStack>
                        <Flex w="50px" h="50px" borderRadius="full" bg="red.500" alignItems="center" justifyContent="center" flexShrink={0}>
                          <Text color="white" fontWeight="bold" fontSize="xs">END</Text>
                        </Flex>
                      </HStack>

                      {/* Statistics */}
                      <HStack gap={4} justify="center" pt={2}>
                        <Badge colorPalette="blue" variant="subtle">
                          {eventTypes.length} {t('admin.eventConfig.tabEventTypes', 'Events')}
                        </Badge>
                        <Badge colorPalette="purple" variant="subtle">
                          {flows.length} {t('admin.eventConfig.tabFlowTransitions', 'Transitions')}
                        </Badge>
                        <Badge colorPalette="red" variant="subtle">
                          {flows.filter(f => f.isRequired).length} {t('admin.eventFlows.required', 'Required')}
                        </Badge>
                        <Badge colorPalette="yellow" variant="subtle">
                          <HStack gap={1}>
                            <Icon as={FiZap} boxSize={3} />
                            <Text>{flows.filter(f => hasConditions(f)).length} {t('admin.eventFlows.conditional', 'Conditional')}</Text>
                          </HStack>
                        </Badge>
                      </HStack>

                      {/* Legend */}
                      <HStack gap={6} flexWrap="wrap" justify="center" pt={1}>
                        <HStack gap={2}>
                          <Box w="20px" h="2px" bg="gray.300" />
                          <Icon as={FiArrowRight} boxSize={4} color="gray.400" />
                          <Text fontSize="xs" color={colors.textColor}>{t('admin.eventFlows.isOptional')}</Text>
                        </HStack>
                        <HStack gap={2}>
                          <Box w="20px" h="2px" bg="red.400" />
                          <Icon as={FiArrowRight} boxSize={4} color="red.400" />
                          <Text fontSize="xs" color={colors.textColor}>{t('admin.eventFlows.isRequired')}</Text>
                        </HStack>
                        <HStack gap={2}>
                          <Icon as={FiZap} boxSize={4} color="yellow.500" />
                          <Text fontSize="xs" color={colors.textColor}>{t('admin.eventFlows.conditional', 'Conditional')}</Text>
                        </HStack>
                        <HStack gap={2}>
                          <Badge colorPalette="purple" size="sm">↑MT</Badge>
                          <Text fontSize="xs" color={colors.textColor}>SWIFT Out</Text>
                        </HStack>
                        <HStack gap={2}>
                          <Badge colorPalette="green" size="sm">↓MT</Badge>
                          <Text fontSize="xs" color={colors.textColor}>SWIFT In</Text>
                        </HStack>
                      </HStack>
                    </VStack>
                  );
                })()}
              </Box>
            ) : (
              <Text color={colors.textColor} textAlign="center" py={8}>
                {t('admin.eventTypes.noEventTypes')}
              </Text>
            )}
          </Card.Body>
        </Card.Root>

        {/* ==================== MASTER-DETAIL LAYOUT ==================== */}
        <Grid templateColumns={{ base: '1fr', md: '300px 1fr' }} gap={4} alignItems="start">
          {/* Left panel: Event list */}
          <EventMasterList
            eventTypes={sortedEventTypes}
            selectedEventCode={selectedEventCode}
            isCreatingNew={isCreatingNew}
            loading={loading}
            onSelectEvent={handleSelectEvent}
            onCreateNew={handleCreateNew}
            onOpenActionTypes={() => setActionTypesDialogOpen(true)}
          />

          {/* Right panel: Event detail */}
          <Box ref={detailPanelRef}>
          <EventDetailPanel
            event={selectedEvent}
            isCreatingNew={isCreatingNew}
            eventTypes={eventTypes}
            flows={flows}
            operationType={selectedOperationType}
            language={selectedLanguage}
            onEventSaved={handleEventSaved}
            onCancelCreate={handleCancelCreate}
            onDeleteEvent={handleDeleteEvent}
            onFlowSaved={handleFlowSaved}
            onFlowDeleted={handleDeleteFlow}
          />
          </Box>
        </Grid>
      </VStack>

      {/* Action Types Dialog */}
      <Dialog.Root open={actionTypesDialogOpen} onOpenChange={(e) => setActionTypesDialogOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="900px">
              <Dialog.Header>
                <Dialog.Title>{t('admin.eventConfig.tabActionTypes', 'Action Types')}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <ActionTypesTab language={selectedLanguage} />
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => setActionTypesDialogOpen(false)}>
                  {t('admin.common.close', 'Cerrar')}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog (shared) */}
      <Dialog.Root open={deleteConfirm.open} onOpenChange={(e) => setDeleteConfirm({ ...deleteConfirm, open: e.open })}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>{t('admin.common.confirmDelete')}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack gap={4} align="stretch">
                  <Alert.Root status="warning">
                    <Alert.Indicator><Icon as={FiAlertTriangle} /></Alert.Indicator>
                    <Alert.Content>
                      <Alert.Title>{t('admin.common.warning')}</Alert.Title>
                      <Alert.Description>
                        {deleteConfirm.type === 'event'
                          ? t('admin.eventTypes.deleteWarning')
                          : t('admin.eventFlows.deleteWarning')}
                      </Alert.Description>
                    </Alert.Content>
                  </Alert.Root>
                  <Text>
                    {deleteConfirm.type === 'event'
                      ? t('admin.eventTypes.deleteConfirmMessage', { name: deleteConfirm.name })
                      : t('admin.eventFlows.deleteConfirmMessage', {
                          from: deleteConfirm.name.split(' → ')[0],
                          to: deleteConfirm.name.split(' → ')[1],
                        })}
                  </Text>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, id: null, name: '', type: 'event' })}>
                  {t('admin.common.cancel')}
                </Button>
                <Button colorPalette="red" onClick={handleDelete}>
                  <Icon as={FiTrash2} mr={2} />
                  {t('admin.common.delete')}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
};

export default EventTypeConfigAdmin;
