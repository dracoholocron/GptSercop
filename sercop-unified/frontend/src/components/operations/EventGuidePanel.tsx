import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Spinner,
  Dialog,
  Textarea,
  Separator,
  Icon,
  Grid,
  Popover,
  Portal,
} from '@chakra-ui/react';
import { toaster } from '../ui/toaster';
import {
  FiPlay,
  FiInfo,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowRight,
  FiFileText,
  FiSend,
  FiEdit,
  FiDollarSign,
  FiCheck,
  FiXCircle,
  FiClock,
  FiUnlock,
  FiCalendar,
  FiUserCheck,
  FiCornerUpLeft,
  FiArchive,
  FiSearch,
  FiHelpCircle,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Operation, EventFlowConfig, EventTypeConfig } from '../../types/operations';
import { eventConfigApi, operationCommands } from '../../services/operationsApi';
import { useSwiftFieldConfig } from '../../hooks/useSwiftFieldConfig';
import { useSwiftSections } from '../../hooks/useSwiftSections';
import { SharedAccordionExpertView } from '../shared/AccordionExpertView';
import { QuickFieldAssistant } from '../shared/QuickFieldAssistant';
import { DocumentPresentationPanel } from '../documents';
import { documentService } from '../../services/documentService';
import type { DocumentCategory, DocumentType } from '../../types/documents';
import { parseSwiftMessage } from '../../utils/swiftMessageParser';

/**
 * Evaluate a default value expression against operation data.
 * Supports expressions like:
 * - {{operation.reference}} - replaced with operation's reference
 * - {{operation.reference}}XX - reference + sequence number (XX = messageCount + 1)
 * - Static values are returned as-is
 */
const evaluateDefaultValue = (
  defaultValue: string,
  operation: Operation
): string => {
  if (!defaultValue) return '';

  // Check if it's a dynamic expression
  if (!defaultValue.includes('{{')) {
    return defaultValue; // Static value
  }

  let result = defaultValue;

  // Replace {{operation.reference}}
  if (result.includes('{{operation.reference}}')) {
    result = result.replace(/\{\{operation\.reference\}\}/g, operation.reference || '');
  }

  // Replace {{operation.sequentialReference}} with reference + sequential number
  if (result.includes('{{operation.sequentialReference}}')) {
    const messageCount = operation.messageCount ?? 0;
    const sequenceNumber = (messageCount + 1).toString().padStart(2, '0');
    const sequentialRef = `${operation.reference}${sequenceNumber}`;
    result = result.replace(/\{\{operation\.sequentialReference\}\}/g, sequentialRef);
  }

  // Replace other common operation fields
  const operationFields = ['operationId', 'productType', 'stage', 'status'] as const;
  for (const field of operationFields) {
    const placeholder = `{{operation.${field}}}`;
    if (result.includes(placeholder)) {
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), String(operation[field] || ''));
    }
  }

  return result;
};

// Icon mapping for event icons
const iconMap: Record<string, React.ComponentType> = {
  FiPlay,
  FiInfo,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowRight,
  FiFileText,
  FiSend,
  FiEdit,
  FiDollarSign,
  FiCheck,
  FiXCircle,
  FiClock,
  FiUnlock,
  FiCalendar,
  FiUserCheck,
  FiCornerUpLeft,
  FiArchive,
  FiSearch,
  FiAlertTriangle: FiAlertCircle, // fallback
};

// Color mapping for event colors
const colorMap: Record<string, { bg: string; border: string; icon: string; hover: string }> = {
  blue: { bg: 'blue.50', border: 'blue.200', icon: 'blue.500', hover: 'blue.100' },
  green: { bg: 'green.50', border: 'green.200', icon: 'green.500', hover: 'green.100' },
  orange: { bg: 'orange.50', border: 'orange.200', icon: 'orange.500', hover: 'orange.100' },
  red: { bg: 'red.50', border: 'red.200', icon: 'red.500', hover: 'red.100' },
  purple: { bg: 'purple.50', border: 'purple.200', icon: 'purple.500', hover: 'purple.100' },
  gray: { bg: 'gray.50', border: 'gray.200', icon: 'gray.500', hover: 'gray.100' },
};

interface EventGuidePanelProps {
  operation: Operation;
  onEventExecuted?: (operation: Operation) => void;
}

export const EventGuidePanel = ({ operation, onEventExecuted }: EventGuidePanelProps) => {
  const { t, i18n } = useTranslation();
  const { getColors } = useTheme();
  const { user } = useAuth();
  const colors = getColors();

  const [availableEvents, setAvailableEvents] = useState<EventFlowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventFlowConfig | null>(null);
  const [selectedEventTypeConfig, setSelectedEventTypeConfig] = useState<EventTypeConfig | null>(null);
  const [comments, setComments] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [swiftFormData, setSwiftFormData] = useState<Record<string, any>>({});
  const [loadingEventConfig, setLoadingEventConfig] = useState(false);
  const [uploadedDocumentIds, setUploadedDocumentIds] = useState<string[]>([]);
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

  // Get the outbound message type for the selected event
  const outboundMessageType = selectedEventTypeConfig?.outboundMessageType;

  // Extract document requirements (field 46A) from operation's SWIFT message
  const documentRequirements = useMemo(() => {
    if (!operation.swiftMessage) return undefined;
    const parsed = parseSwiftMessage(operation.swiftMessage);
    return parsed['46A'] || undefined;
  }, [operation.swiftMessage]);

  // Load SWIFT field configuration when we have an outbound message type
  const {
    configs: swiftFieldConfigs,
    loading: loadingSwiftFields,
    validateForm,
  } = useSwiftFieldConfig(outboundMessageType || '');

  // Load dynamic SWIFT sections for the AccordionExpertView
  const { sections: dynamicSections } = useSwiftSections(outboundMessageType || '');

  useEffect(() => {
    loadAvailableEvents();
  }, [operation, i18n.language]);

  // Load document categories/types when a DOCUMENT_UPLOAD event is selected
  useEffect(() => {
    if (selectedEventTypeConfig?.formType === 'DOCUMENT_UPLOAD' && documentCategories.length === 0) {
      Promise.all([
        documentService.getCategories(),
        documentService.getDocumentTypes(),
      ]).then(([cats, types]) => {
        setDocumentCategories(cats);
        setDocumentTypes(types);
      }).catch(err => console.error('Error loading document categories:', err));
    }
  }, [selectedEventTypeConfig?.formType]);

  // Apply default values from field configs when configs are loaded
  useEffect(() => {
    if (swiftFieldConfigs.length > 0 && isDialogOpen && !loadingSwiftFields) {
      setSwiftFormData(prev => {
        const updated = { ...prev };
        let hasChanges = false;

        for (const config of swiftFieldConfigs) {
          // Only apply default if field doesn't have a value and config has defaultValue
          if (config.defaultValue && (prev[config.fieldCode] === undefined || prev[config.fieldCode] === '')) {
            const evaluatedValue = evaluateDefaultValue(config.defaultValue, operation);
            if (evaluatedValue) {
              updated[config.fieldCode] = evaluatedValue;
              hasChanges = true;
              console.log(`Applied default value for ${config.fieldCode}:`, evaluatedValue);
            }
          }
        }

        return hasChanges ? updated : prev;
      });
    }
  }, [swiftFieldConfigs, isDialogOpen, loadingSwiftFields, operation]);

  const loadAvailableEvents = async () => {
    setLoading(true);
    try {
      console.log('Loading available events for operation:', {
        operationId: operation.operationId,
        stage: operation.stage,
        language: i18n.language
      });
      // Use the new endpoint that evaluates conditions against operation's SWIFT data
      const events = await eventConfigApi.getAvailableEventsForOperation(
        operation.operationId,
        operation.stage,
        undefined,
        i18n.language
      );
      console.log('Available events loaded:', events);
      setAvailableEvents(events);
    } catch (error) {
      console.error('Error loading available events:', error);
      toaster.create({
        title: 'Error loading events',
        description: String(error),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = async (event: EventFlowConfig) => {
    setSelectedEvent(event);
    setComments('');
    setSwiftFormData({});
    setUploadedDocumentIds([]);
    setSelectedEventTypeConfig(null);
    setIsDialogOpen(true);

    // Load the EventTypeConfig to get the outboundMessageType
    setLoadingEventConfig(true);
    try {
      const eventTypeConfig = await eventConfigApi.getEventType(
        operation.productType,
        event.toEventCode,
        i18n.language
      );
      setSelectedEventTypeConfig(eventTypeConfig);

      // Pre-populate form with operation data by parsing the SWIFT message
      if (eventTypeConfig?.outboundMessageType && operation.swiftMessage) {
        // Parse all fields from the operation's SWIFT message dynamically
        const parsedFields = parseSwiftMessage(operation.swiftMessage);
        console.log('Parsed SWIFT fields from operation:', parsedFields);

        // Use all parsed fields directly - no hardcoded overrides
        setSwiftFormData(parsedFields);
      }
    } catch (error) {
      console.error('Error loading event type config:', error);
    } finally {
      setLoadingEventConfig(false);
    }
  };

  // Handler for SWIFT field changes
  const handleFieldChange = (fieldCode: string, value: any) => {
    setSwiftFormData(prev => ({
      ...prev,
      [fieldCode]: value,
    }));
  };

  const handleExecuteEvent = async () => {
    console.log('handleExecuteEvent called', { selectedEvent, outboundMessageType, swiftFieldConfigs: swiftFieldConfigs.length, swiftFormData });

    if (!selectedEvent) {
      console.log('No selectedEvent, returning');
      return;
    }

    // Validate SWIFT form if required
    if (outboundMessageType && swiftFieldConfigs.length > 0) {
      const errors = validateForm(swiftFormData);
      console.log('Validation errors:', errors);
      if (Object.keys(errors).length > 0) {
        // Build list of missing required fields
        const missingFields = Object.entries(errors)
          .filter(([, error]) => error.type === 'required')
          .map(([fieldCode]) => {
            const config = swiftFieldConfigs.find(c => c.fieldCode === fieldCode);
            return config ? `${fieldCode} (${config.fieldName})` : fieldCode;
          });

        const errorMessage = missingFields.length > 0
          ? `${t('eventConfig.pleaseCompleteRequiredFields')}: ${missingFields.join(', ')}`
          : t('eventConfig.pleaseCompleteRequiredFields');

        toaster.create({
          title: t('common.validationError'),
          description: errorMessage,
          type: 'error',
          duration: 8000,
        });
        return;
      }
    }

    setExecuting(true);
    console.log('Calling operationCommands.executeEvent...');
    try {
      const eventData = outboundMessageType
        ? swiftFormData
        : selectedEventTypeConfig?.formType === 'DOCUMENT_UPLOAD'
          ? { documentIds: uploadedDocumentIds }
          : undefined;

      const updatedOperation = await operationCommands.executeEvent(operation.operationId, {
        eventCode: selectedEvent.toEventCode,
        executedBy: user?.username || 'system',
        eventData,
        comments,
      });

      console.log('Event executed successfully:', updatedOperation);
      toaster.create({
        title: t('eventConfig.eventExecutedSuccess'),
        type: 'success',
        duration: 3000,
      });
      setIsDialogOpen(false);
      onEventExecuted?.(updatedOperation);
      loadAvailableEvents();
    } catch (error) {
      console.error('Error executing event:', error);
      toaster.create({
        title: t('eventConfig.eventExecutedError'),
        description: String(error),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <Spinner size="md" color={colors.primaryColor} />
      </Box>
    );
  }

  return (
    <Box
      bg={colors.cardBg}
      borderRadius="md"
      p={4}
      borderWidth="1px"
      borderColor={colors.borderColor}
    >
      <VStack gap={4} align="stretch">
        {/* Explanatory Text */}
        <Box
          p={4}
          borderRadius="md"
          bg="blue.50"
          borderWidth="1px"
          borderColor="blue.200"
        >
          <HStack mb={2}>
            <Icon as={FiInfo} color="blue.600" />
            <Text fontWeight="semibold" fontSize="sm" color="blue.800">
              {t('operations.eventGuidePanelTitle')}
            </Text>
          </HStack>
          <Text fontSize="sm" color="blue.700">
            {t('operations.eventGuidePanelDescription')}
          </Text>
        </Box>

        <HStack justify="space-between">
          <Text fontWeight="bold" color={colors.textColor}>
            {t('eventConfig.availableEvents')}
          </Text>
          <Badge colorPalette="blue">{availableEvents.length}</Badge>
        </HStack>

        <HStack gap={2} flexWrap="wrap">
          <Text fontSize="sm" color={colors.textColor}>
            {t('operations.stage')}:
          </Text>
          <Badge colorPalette="green">{t(`operations.stages.${operation.stage}`)}</Badge>
          <Text fontSize="sm" color={colors.textColor} mx={2}>
            |
          </Text>
          <Text fontSize="sm" color={colors.textColor}>
            {t('operations.status')}:
          </Text>
          <Badge colorPalette="blue">{t(`operations.statuses.${operation.status}`)}</Badge>
        </HStack>

        <Separator />

        {availableEvents.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Box
              mx="auto"
              w="60px"
              h="60px"
              borderRadius="full"
              bg={colors.hoverBg}
              display="flex"
              alignItems="center"
              justifyContent="center"
              mb={3}
            >
              <Icon as={FiInfo} boxSize={6} color={colors.textColor} />
            </Box>
            <Text color={colors.textColor} fontSize="sm" fontWeight="medium">
              {t('eventConfig.noAvailableEvents')}
            </Text>
            <Text color={colors.textColor} fontSize="xs" opacity={0.6} mt={1}>
              {t('eventConfig.noAvailableEventsHint')}
            </Text>
          </Box>
        ) : (
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
            gap={4}
          >
            {availableEvents.map((event) => {
              const eventColor = colorMap[event.toEventColor || 'blue'] || colorMap.blue;
              const EventIcon = iconMap[event.toEventIcon || 'FiPlay'] || FiPlay;

              return (
                <Box
                  key={event.id}
                  p={0}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={eventColor.border}
                  bg={eventColor.bg}
                  overflow="hidden"
                  transition="all 0.2s"
                  _hover={{
                    borderColor: eventColor.icon,
                    transform: 'translateY(-2px)',
                    boxShadow: 'md',
                  }}
                  cursor="pointer"
                  onClick={() => handleSelectEvent(event)}
                  display="flex"
                  flexDirection="column"
                  h="100%"
                  minH="140px"
                >
                  {/* Card Header with Icon */}
                  <Box
                    px={4}
                    py={3}
                    borderBottomWidth="1px"
                    borderColor={eventColor.border}
                    bg={eventColor.hover}
                  >
                    <HStack justify="space-between" align="center">
                      <HStack gap={2}>
                        <Box
                          w="32px"
                          h="32px"
                          borderRadius="md"
                          bg="white"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="sm"
                        >
                          <Icon as={EventIcon} boxSize={4} color={eventColor.icon} />
                        </Box>
                        <Text fontWeight="semibold" fontSize="sm" color="gray.800" lineClamp={1}>
                          {event.toEventName || event.toEventCode}
                        </Text>
                      </HStack>
                      <HStack gap={2}>
                        {event.isRequired && (
                          <Badge colorPalette="red" size="sm" variant="solid">
                            {t('common.required')}
                          </Badge>
                        )}
                        {event.toEventHelpText && (
                          <Popover.Root positioning={{ placement: 'bottom-end' }}>
                            <Popover.Trigger asChild>
                              <Box
                                as="button"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                p={1}
                                borderRadius="full"
                                _hover={{ bg: 'white' }}
                                transition="all 0.2s"
                              >
                                <Icon as={FiHelpCircle} boxSize={4} color="gray.500" _hover={{ color: 'blue.500' }} />
                              </Box>
                            </Popover.Trigger>
                            <Portal>
                              <Popover.Positioner>
                                <Popover.Content
                                  bg="white"
                                  borderWidth="1px"
                                  borderColor="gray.200"
                                  borderRadius="lg"
                                  boxShadow="xl"
                                  maxW="400px"
                                  w="auto"
                                  zIndex={9999}
                                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                >
                                  <Popover.Arrow>
                                    <Popover.ArrowTip />
                                  </Popover.Arrow>
                                  <Popover.Header
                                    bg="green.50"
                                    borderBottomWidth="1px"
                                    borderColor="green.200"
                                    px={4}
                                    py={3}
                                  >
                                    <HStack>
                                      <Icon as={FiInfo} color="green.600" />
                                      <Text fontWeight="semibold" fontSize="sm" color="green.800">
                                        {t('eventConfig.eventGuide')}
                                      </Text>
                                    </HStack>
                                  </Popover.Header>
                                  <Popover.Body px={4} py={3}>
                                    <Text fontSize="sm" color="gray.700" whiteSpace="pre-line" lineHeight="1.6">
                                      {event.toEventHelpText}
                                    </Text>
                                  </Popover.Body>
                                </Popover.Content>
                              </Popover.Positioner>
                            </Portal>
                          </Popover.Root>
                        )}
                      </HStack>
                    </HStack>
                  </Box>

                  {/* Card Body */}
                  <Box px={4} py={3} flex="1" display="flex" flexDirection="column">
                    <Text
                      fontSize="xs"
                      color="gray.600"
                      lineClamp={2}
                      flex="1"
                      mb={2}
                    >
                      {event.toEventDescription || event.transitionLabel || '-'}
                    </Text>

                    {/* Action Button */}
                    <Button
                      size="xs"
                      colorPalette={event.toEventColor || 'blue'}
                      variant="solid"
                      w="100%"
                      mt="auto"
                    >
                      <FiPlay style={{ marginRight: 4 }} />
                      {t('operations.executeEvent')}
                    </Button>
                  </Box>
                </Box>
              );
            })}
          </Grid>
        )}
      </VStack>

      <Dialog.Root open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)} size="xl">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg={colors.cardBg} maxW={outboundMessageType ? '1200px' : (selectedEventTypeConfig?.formType === 'DOCUMENT_UPLOAD' ? '900px' : '600px')} maxH="90vh" display="flex" flexDirection="column">
            <Dialog.Header color={colors.textColor} flexShrink={0}>
              <VStack align="start" gap={1}>
                <Text>{selectedEvent?.toEventName || selectedEvent?.toEventCode}</Text>
                {outboundMessageType && (
                  <Badge colorPalette="blue" size="sm">
                    <FiFileText style={{ marginRight: 4 }} />
                    {outboundMessageType}
                  </Badge>
                )}
              </VStack>
            </Dialog.Header>
            <Dialog.CloseTrigger />
            <Dialog.Body overflowY="auto" flex={1}>
              {(loadingEventConfig || loadingSwiftFields) ? (
                <Box textAlign="center" py={8}>
                  <Spinner size="lg" color={colors.primaryColor} />
                  <Text mt={4} color={colors.textColor}>
                    {t('common.cargando')}...
                  </Text>
                </Box>
              ) : (
                <VStack gap={4} align="stretch">
                  {/* Event info header */}
                  <Box
                    p={4}
                    borderRadius="md"
                    bg={colors.bgColor}
                    borderWidth="1px"
                    borderColor={colors.borderColor}
                  >
                    <HStack gap={2} mb={2}>
                      <Icon as={FiAlertCircle} color="orange.500" />
                      <Text fontWeight="bold" color={colors.textColor}>
                        {selectedEvent?.toEventName || selectedEvent?.toEventCode}
                      </Text>
                    </HStack>
                    {selectedEvent?.toEventDescription && (
                      <Text fontSize="sm" color={colors.textColor} opacity={0.8}>
                        {selectedEvent.toEventDescription}
                      </Text>
                    )}
                  </Box>

                  {/* Transition help */}
                  {selectedEvent?.transitionHelp && (
                    <Box
                      p={3}
                      borderRadius="md"
                      bg="blue.50"
                      borderWidth="1px"
                      borderColor="blue.200"
                    >
                      <HStack>
                        <Icon as={FiInfo} color="blue.500" />
                        <Text fontSize="sm" color="blue.700">
                          {selectedEvent.transitionHelp}
                        </Text>
                      </HStack>
                    </Box>
                  )}

                  {/* SWIFT Form - Expert Mode with Quick Field Assistant */}
                  {outboundMessageType && swiftFieldConfigs.length > 0 && dynamicSections.length > 0 && (
                    <VStack gap={4} align="stretch">
                      {/* Quick Field Assistant (Search + AI Extraction) */}
                      <QuickFieldAssistant
                        fieldConfigs={swiftFieldConfigs}
                        formData={swiftFormData}
                        onFieldChange={handleFieldChange}
                        enabled={true}
                        readOnly={false}
                        defaultCollapsed={true}
                        messageType={outboundMessageType}
                        enableAIExtraction={true}
                      />

                      {/* Expert Mode Accordion */}
                      <SharedAccordionExpertView
                        messageType={outboundMessageType}
                        dynamicSections={dynamicSections}
                        swiftFieldsData={swiftFormData}
                        onSwiftFieldChange={handleFieldChange}
                        swiftFieldConfigs={swiftFieldConfigs}
                        showAccounting={false}
                        showSwiftPreview={true}
                        approvalMode={false}
                        headerColor="blue"
                      />
                    </VStack>
                  )}

                  {/* Document Upload form */}
                  {!outboundMessageType && selectedEventTypeConfig?.formType === 'DOCUMENT_UPLOAD' && (
                    <DocumentPresentationPanel
                      operationId={operation.operationId}
                      documentRequirements={documentRequirements}
                      categories={documentCategories}
                      documentTypes={documentTypes}
                      onDocumentsChanged={setUploadedDocumentIds}
                      colorScheme="purple"
                    />
                  )}

                  {/* No SWIFT form and no document upload - simple confirmation */}
                  {!outboundMessageType && selectedEventTypeConfig?.formType !== 'DOCUMENT_UPLOAD' && (
                    <Box
                      p={4}
                      borderRadius="md"
                      bg="gray.50"
                      borderWidth="1px"
                      borderColor="gray.200"
                    >
                      <Text fontSize="sm" color="gray.600">
                        {t('eventConfig.executeEventDescription', {
                          eventName: selectedEvent?.toEventName || selectedEvent?.toEventCode,
                        })}
                      </Text>
                    </Box>
                  )}

                  {/* Comments section */}
                  <Box>
                    <Text fontWeight="medium" mb={2} color={colors.textColor}>
                      {t('eventConfig.comments')} ({t('common.optional')})
                    </Text>
                    <Textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder={t('eventConfig.commentsPlaceholder')}
                      rows={3}
                      bg={colors.bgColor}
                      borderColor={colors.borderColor}
                    />
                  </Box>
                </VStack>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" mr={3} onClick={() => setIsDialogOpen(false)}>
                {t('common.cancelar')}
              </Button>
              <Button
                colorPalette={selectedEventTypeConfig?.formType === 'DOCUMENT_UPLOAD' ? 'purple' : 'blue'}
                onClick={() => {
                  console.log('Button clicked! loadingEventConfig:', loadingEventConfig, 'loadingSwiftFields:', loadingSwiftFields);
                  handleExecuteEvent();
                }}
                loading={executing}
                disabled={loadingEventConfig || loadingSwiftFields}
              >
                {outboundMessageType ? (
                  <>
                    <FiSend style={{ marginRight: 4 }} />
                    {t('eventConfig.executeAndCreateMessage')}
                  </>
                ) : selectedEventTypeConfig?.formType === 'DOCUMENT_UPLOAD' ? (
                  <>
                    <FiFileText style={{ marginRight: 4 }} />
                    {t('eventConfig.presentDocuments')}
                  </>
                ) : (
                  <>
                    <FiCheckCircle style={{ marginRight: 4 }} />
                    {t('common.confirmar')}
                  </>
                )}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};
