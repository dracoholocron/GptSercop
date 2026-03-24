/**
 * OperationFlowViewer - Component to visualize an operation's flow progress
 * Shows the complete flow with current position highlighted
 */
import { useState, useEffect, useMemo } from 'react';
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
} from '@chakra-ui/react';
import { FiClock, FiCheck, FiArrowRight, FiAlertCircle, FiInfo, FiMessageSquare } from 'react-icons/fi';
import { HiOutlineBuildingLibrary } from 'react-icons/hi2';
import { TbBuildingBank } from 'react-icons/tb';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { FlowDiagram } from './FlowDiagram';
import type { FlowNode, FlowEdge } from './FlowDiagram';
import {
  eventConfigApi,
  eventLogApi,
} from '../../services/operationsApi';
import type {
  EventFlowConfig,
  EventTypeConfig,
  OperationEventLog,
} from '../../types/operations';

interface OperationFlowViewerProps {
  operationId: string;
  operationType: string;
  currentStage: string;
  currentStatus: string;
  language?: string;
  showTimeline?: boolean;
  compact?: boolean;
}

export const OperationFlowViewer = ({
  operationId,
  operationType,
  currentStage,
  currentStatus,
  language = 'en',
  showTimeline = true,
  compact = false,
}: OperationFlowViewerProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([]);
  const [flows, setFlows] = useState<EventFlowConfig[]>([]);
  const [eventHistory, setEventHistory] = useState<OperationEventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [operationType, operationId, language]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [types, flowConfigs, history] = await Promise.all([
        eventConfigApi.getEventTypes(operationType, language),
        eventConfigApi.getAllFlows(operationType, language),
        operationId ? eventLogApi.getEventHistory(operationId, language) : Promise.resolve([]),
      ]);
      setEventTypes(types);
      setFlows(flowConfigs);
      setEventHistory(history);
    } catch (err) {
      console.error('Error loading flow data:', err);
      setError('Failed to load flow configuration');
    } finally {
      setLoading(false);
    }
  };

  // Build flow nodes from event types
  const flowNodes: FlowNode[] = useMemo(() => {
    if (eventTypes.length === 0) return [];

    // Create a map of completed events with their execution details
    const completedEventsMap = new Map(
      eventHistory.map(e => [e.eventCode, { executedAt: e.executedAt, executedBy: e.executedBy }])
    );
    const currentEvent = eventHistory.length > 0
      ? eventHistory[eventHistory.length - 1].eventCode
      : null;

    return eventTypes.map((et) => {
      const completionInfo = completedEventsMap.get(et.eventCode);
      return {
        id: et.eventCode,
        code: et.eventCode,
        label: et.eventName,
        description: et.eventDescription,
        icon: et.icon,
        color: et.color,
        stage: et.resultingStage,
        status: et.resultingStatus,
        outboundMessage: et.outboundMessageType,
        inboundMessage: et.inboundMessageType,
        requiresApproval: et.requiresApproval,
        sequence: et.displayOrder,
        isCompleted: completedEventsMap.has(et.eventCode),
        isCurrent: currentEvent === et.eventCode || et.resultingStage === currentStage,
        isPending: !completedEventsMap.has(et.eventCode) && et.resultingStage !== currentStage,
        isEnd: et.resultingStatus === 'CLOSED',
        // Message direction fields
        messageSender: et.messageSender,
        messageReceiver: et.messageReceiver,
        ourRole: et.ourRole,
        requiresSwiftMessage: et.requiresSwiftMessage,
        eventCategory: et.eventCategory,
        // Initial event configuration
        isInitialEvent: et.isInitialEvent,
        initialEventRole: et.initialEventRole,
        // Execution timestamps
        completedAt: completionInfo?.executedAt,
        executedBy: completionInfo?.executedBy,
      };
    });
  }, [eventTypes, eventHistory, currentStage]);

  // Build flow edges from flow configs
  const flowEdges: FlowEdge[] = useMemo(() => {
    return flows.map((f) => ({
      from: f.fromEventCode || 'START',
      to: f.toEventCode,
      label: f.transitionLabel,
      isRequired: f.isRequired,
      isOptional: f.isOptional,
    }));
  }, [flows]);

  // Get highlight path (completed events)
  const highlightPath = useMemo(() => {
    return eventHistory.map(e => e.eventCode);
  }, [eventHistory]);

  if (loading) {
    return (
      <Flex justify="center" align="center" p={8}>
        <Spinner size="lg" color="blue.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" p={8} color="red.500">
        <Icon as={FiAlertCircle} mr={2} />
        <Text>{error}</Text>
      </Flex>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {/* Explanatory Text */}
      <Box
        p={4}
        borderRadius="md"
        bg="blue.50"
        borderWidth="1px"
        borderColor="blue.200"
        mb={4}
      >
        <HStack mb={2}>
          <Icon as={FiInfo} color="blue.600" />
          <Text fontWeight="semibold" fontSize="sm" color="blue.800">
            {t('operations.flowViewerTitle')}
          </Text>
        </HStack>
        <Text fontSize="sm" color="blue.700">
          {t('operations.flowViewerDescription')}
        </Text>
      </Box>

      {/* Flow Diagram */}
      <Box>
        <Heading size="sm" color={colors.textColor} mb={3}>
          {t('operations.flowDiagram', 'Operation Flow')}
        </Heading>
        <FlowDiagram
          nodes={flowNodes}
          edges={flowEdges}
          direction="horizontal"
          showMessages
          highlightPath={highlightPath}
          compact={compact}
        />
      </Box>

      {/* Legend */}
      <HStack gap={4} flexWrap="wrap" justify="center">
        <HStack gap={1}>
          <Flex
            w="12px"
            h="12px"
            borderRadius="full"
            bg="green.500"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={FiCheck} boxSize={2} color="white" />
          </Flex>
          <Text fontSize="xs" color={colors.textColor}>
            {t('operations.completed', 'Completed')}
          </Text>
        </HStack>
        <HStack gap={1}>
          <Flex
            w="12px"
            h="12px"
            borderRadius="full"
            bg="blue.500"
          />
          <Text fontSize="xs" color={colors.textColor}>
            {t('operations.current', 'Current')}
          </Text>
        </HStack>
        <HStack gap={1}>
          <Flex
            w="12px"
            h="12px"
            borderRadius="full"
            bg="gray.300"
          />
          <Text fontSize="xs" color={colors.textColor}>
            {t('operations.pending', 'Pending')}
          </Text>
        </HStack>
        <HStack gap={1}>
          <Badge colorPalette="purple" size="sm">↑MT700</Badge>
          <Text fontSize="xs" color={colors.textColor}>
            {t('operations.outboundMessage', 'Outbound')}
          </Text>
        </HStack>
        <HStack gap={1}>
          <Badge colorPalette="green" size="sm">↓MT730</Badge>
          <Text fontSize="xs" color={colors.textColor}>
            {t('operations.inboundMessage', 'Inbound')}
          </Text>
        </HStack>
        <HStack gap={1}>
          <Icon as={HiOutlineBuildingLibrary} boxSize={4} color="blue.500" />
          <Text fontSize="xs" color={colors.textColor}>
            {t('admin.eventTypes.roles.issuingBank', 'Issuing Bank')}
          </Text>
        </HStack>
        <HStack gap={1}>
          <Icon as={TbBuildingBank} boxSize={4} color="teal.500" />
          <Text fontSize="xs" color={colors.textColor}>
            {t('admin.eventTypes.roles.advisingBank', 'Advising Bank')}
          </Text>
        </HStack>
      </HStack>

      {/* Timeline */}
      {showTimeline && eventHistory.length > 0 && (
        <Box>
          <Heading size="sm" color={colors.textColor} mb={3}>
            {t('operations.eventHistory', 'Event History')}
          </Heading>
          <VStack gap={0} align="stretch">
            {eventHistory.map((event, index) => (
              <Flex key={event.eventId} position="relative">
                {/* Timeline connector */}
                <Flex
                  flexDirection="column"
                  alignItems="center"
                  mr={4}
                >
                  <Flex
                    w="32px"
                    h="32px"
                    borderRadius="full"
                    bg={index === eventHistory.length - 1 ? 'blue.500' : 'green.500'}
                    alignItems="center"
                    justifyContent="center"
                    zIndex={1}
                  >
                    <Icon
                      as={index === eventHistory.length - 1 ? FiClock : FiCheck}
                      boxSize={4}
                      color="white"
                    />
                  </Flex>
                  {index < eventHistory.length - 1 && (
                    <Box
                      w="2px"
                      h="40px"
                      bg="green.200"
                    />
                  )}
                </Flex>

                {/* Event card */}
                <Card.Root
                  flex={1}
                  mb={3}
                  size="sm"
                  bg={colors.cardBg}
                  borderColor={colors.borderColor}
                >
                  <Card.Body py={2} px={3}>
                    <Flex justify="space-between" align="start">
                      <VStack align="start" gap={0}>
                        <HStack gap={2}>
                          <Text fontWeight="semibold" color={colors.textColor}>
                            {event.eventName || event.eventCode}
                          </Text>
                          {event.swiftMessageType && (
                            <Badge
                              size="sm"
                              colorPalette={event.messageDirection === 'OUTBOUND' ? 'blue' : 'green'}
                            >
                              {event.messageDirection === 'OUTBOUND' ? '↑' : '↓'} {event.swiftMessageType}
                            </Badge>
                          )}
                        </HStack>
                        {event.newStage && (
                          <HStack gap={1} fontSize="xs" color={colors.textColor} opacity={0.7}>
                            {event.previousStage && (
                              <>
                                <Text>{event.previousStage}</Text>
                                <Icon as={FiArrowRight} boxSize={3} />
                              </>
                            )}
                            <Text fontWeight="medium">{event.newStage}</Text>
                          </HStack>
                        )}
                        {event.comments && (
                          <HStack gap={1} mt={1} fontSize="xs" color={colors.textColor} opacity={0.8}>
                            <Icon as={FiMessageSquare} boxSize={3} color="blue.500" />
                            <Text fontStyle="italic">{event.comments}</Text>
                          </HStack>
                        )}
                      </VStack>
                      <VStack align="end" gap={0}>
                        <Text fontSize="xs" color={colors.textColor} opacity={0.7}>
                          {event.executedAt ? new Date(event.executedAt).toLocaleString() : '-'}
                        </Text>
                        <Text fontSize="xs" color={colors.textColor} opacity={0.5}>
                          {event.executedBy}
                        </Text>
                      </VStack>
                    </Flex>
                  </Card.Body>
                </Card.Root>
              </Flex>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );
};

export default OperationFlowViewer;
