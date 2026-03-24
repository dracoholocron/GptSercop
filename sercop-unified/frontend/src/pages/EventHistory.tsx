import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Spinner,
  Input,
  Card,
  Separator,
  Tabs,
} from '@chakra-ui/react';
import {
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiFileText,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiGlobe,
  FiCheck,
  FiX,
  FiEdit,
  FiMessageSquare,
  FiActivity,
  FiArrowRight,
  FiArrowUp,
  FiArrowDown,
  FiFilter,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

// Types
interface EventLogEntry {
  id: number;
  eventId: string;
  operationId: string;
  operationType: string;
  reference: string;
  eventCode: string;
  eventSequence: number;
  previousStage: string;
  newStage: string;
  previousStatus: string;
  newStatus: string;
  swiftMessageType: string;
  swiftMessageId: string;
  messageDirection: string;
  executedBy: string;
  executedAt: string;
  comments: string;
  applicantName: string;
  beneficiaryName: string;
  amount: number;
  currency: string;
}

// Auth helper
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('globalcmx_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  return fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
};

// Event type configurations
const getEventConfig = (eventCode: string) => {
  const configs: Record<string, { icon: typeof FiCheck; color: string; label: string }> = {
    'NEW_OPERATION': { icon: FiFileText, color: 'green', label: 'New Operation' },
    'AMENDMENT': { icon: FiEdit, color: 'blue', label: 'Amendment' },
    'APPROVAL': { icon: FiCheck, color: 'green', label: 'Approval' },
    'REJECTION': { icon: FiX, color: 'red', label: 'Rejection' },
    'SWIFT_SENT': { icon: FiSend, color: 'purple', label: 'SWIFT Sent' },
    'SWIFT_RECEIVED': { icon: FiMessageSquare, color: 'purple', label: 'SWIFT Received' },
    'PAYMENT': { icon: FiDollarSign, color: 'green', label: 'Payment' },
    'NEGOTIATION': { icon: FiActivity, color: 'blue', label: 'Negotiation' },
    'DISCREPANCY': { icon: FiAlertCircle, color: 'orange', label: 'Discrepancy' },
    'CLOSURE': { icon: FiCheckCircle, color: 'gray', label: 'Closure' },
    'CANCELLATION': { icon: FiX, color: 'red', label: 'Cancellation' },
    'NEW_OPERATION_APPROVED': { icon: FiCheck, color: 'green', label: 'Operation Approved' },
    'AMENDMENT_APPROVED': { icon: FiCheck, color: 'blue', label: 'Amendment Approved' },
    'STATUS_CORRECTED_GLE_BALANCE': { icon: FiRefreshCw, color: 'blue', label: 'Status Corrected (GLE)' },
  };

  return configs[eventCode] || { icon: FiActivity, color: 'gray', label: eventCode };
};

// Direction indicator
const getDirectionIcon = (direction: string) => {
  switch (direction?.toUpperCase()) {
    case 'INBOUND':
      return { icon: FiArrowDown, color: 'blue', label: 'Incoming' };
    case 'OUTBOUND':
      return { icon: FiArrowUp, color: 'green', label: 'Outgoing' };
    default:
      return { icon: FiArrowRight, color: 'gray', label: 'Internal' };
  }
};

// Pagination response interface
interface PaginatedResponse {
  events: EventLogEntry[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const EventHistory = () => {
  const { t, i18n } = useTranslation();
  const { isDark, getColors } = useTheme();
  const colors = getColors();

  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [selectedProductType, setSelectedProductType] = useState<string>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(50);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Theme colors from context
  const bgColor = colors.bgColor;
  const borderColor = colors.borderColor;
  const textColor = colors.textColor;
  const mutedColor = colors.textColorSecondary;
  const cardBg = colors.cardBg;
  const timelineBg = isDark ? 'gray.600' : 'gray.300';

  // Load events with pagination
  const loadEvents = useCallback(async (page: number = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString(),
      });

      // Add filters
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedProductType !== 'ALL') params.append('operationType', selectedProductType);
      if (searchTerm) params.append('search', searchTerm);

      const response = await authFetch(`/api/v1/operations/event-logs?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        const data: PaginatedResponse = result.data || result;
        setEvents(data.events || []);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
        setHasNext(data.hasNext);
        setHasPrevious(data.hasPrevious);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }, [pageSize, startDate, endDate, selectedProductType, searchTerm]);

  useEffect(() => {
    loadEvents(0);
  }, [loadEvents]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadEvents(newPage);
  };

  // Handle filter apply
  const handleApplyFilters = () => {
    setCurrentPage(0);
    loadEvents(0);
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.operationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.eventCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.executedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.swiftMessageType?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEventType = selectedEventType === 'ALL' || event.eventCode === selectedEventType;
    const matchesProductType = selectedProductType === 'ALL' || event.operationType === selectedProductType;

    return matchesSearch && matchesEventType && matchesProductType;
  });

  // Group events by date
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const date = event.executedAt ? new Date(event.executedAt).toLocaleDateString() : 'Unknown';
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, EventLogEntry[]>);

  // Get unique event types for filter
  const eventTypes = [...new Set(events.map(e => e.eventCode))].filter(Boolean);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <VStack gap={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color={mutedColor}>{t('common.loading')}</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justify="space-between" wrap="wrap" gap={4}>
          <VStack align="start" gap={1}>
            <HStack gap={2}>
              <Box
                p={2}
                borderRadius="full"
                bg="purple.100"
                color="purple.600"
              >
                <FiActivity size={24} />
              </Box>
              <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                {t('eventHistory.title')}
              </Text>
            </HStack>
            <Text color={mutedColor}>
              {t('eventHistory.subtitle', { count: filteredEvents.length })}
            </Text>
          </VStack>

          <HStack gap={2}>
            <Badge colorPalette="purple" variant="subtle" fontSize="sm">
              {totalElements.toLocaleString()} {t('eventHistory.totalEvents', 'eventos')}
            </Badge>
            <Button size="sm" variant="outline" onClick={() => loadEvents(currentPage)}>
              <FiRefreshCw style={{ marginRight: 8 }} />
              {t('common.refresh')}
            </Button>
          </HStack>
        </HStack>

        {/* Filters */}
        <Card.Root bg={bgColor} borderColor={borderColor}>
          <Card.Body p={4}>
            <VStack gap={4} align="stretch">
              <HStack gap={4} wrap="wrap">
                <Box position="relative" flex="1" minW="200px">
                  <Input
                    placeholder={t('eventHistory.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    pl={10}
                  />
                  <Box position="absolute" left={3} top="50%" transform="translateY(-50%)">
                    <FiSearch color="gray" />
                  </Box>
                </Box>

                {/* Date filters */}
                <HStack gap={2}>
                  <Box>
                    <Text fontSize="xs" color={mutedColor} mb={1}>{t('common.from', 'Desde')}</Text>
                    <Input
                      type="date"
                      size="sm"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      w="150px"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="xs" color={mutedColor} mb={1}>{t('common.to', 'Hasta')}</Text>
                    <Input
                      type="date"
                      size="sm"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      w="150px"
                    />
                  </Box>
                </HStack>

                <Tabs.Root
                  value={selectedProductType}
                  onValueChange={(e) => setSelectedProductType(e.value)}
                  variant="outline"
                  size="sm"
                >
                  <Tabs.List>
                    <Tabs.Trigger value="ALL">{t('common.all')}</Tabs.Trigger>
                    <Tabs.Trigger value="LC_IMPORT">LC Import</Tabs.Trigger>
                    <Tabs.Trigger value="LC_EXPORT">LC Export</Tabs.Trigger>
                    <Tabs.Trigger value="GUARANTEE">{t('menu.guarantees')}</Tabs.Trigger>
                  </Tabs.List>
                </Tabs.Root>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Pagination Controls - Top */}
        {totalPages > 1 && (
          <HStack justify="space-between" wrap="wrap" gap={2}>
            <Text fontSize="sm" color={mutedColor}>
              {t('pagination.showing', 'Mostrando')} {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalElements)} {t('pagination.of', 'de')} {totalElements.toLocaleString()}
            </Text>
            <HStack gap={2}>
              <Button
                size="sm"
                variant="outline"
                disabled={!hasPrevious}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                {t('pagination.previous', 'Anterior')}
              </Button>
              <Text fontSize="sm" color={textColor} fontWeight="medium">
                {currentPage + 1} / {totalPages}
              </Text>
              <Button
                size="sm"
                variant="outline"
                disabled={!hasNext}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                {t('pagination.next', 'Siguiente')}
              </Button>
            </HStack>
          </HStack>
        )}

        {/* Timeline */}
        <Box position="relative">
          {Object.entries(groupedEvents).map(([date, dayEvents], dateIndex) => (
            <Box key={date} mb={6}>
              {/* Date Header */}
              <HStack gap={3} mb={4}>
                <Box
                  px={4}
                  py={2}
                  bg={cardBg}
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <HStack gap={2}>
                    <FiCalendar size={14} />
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      {date}
                    </Text>
                  </HStack>
                </Box>
                <Box flex="1" h="1px" bg={timelineBg} />
              </HStack>

              {/* Events for this date */}
              <VStack align="stretch" gap={3} pl={4} position="relative">
                {/* Timeline line */}
                <Box
                  position="absolute"
                  left="8px"
                  top="0"
                  bottom="0"
                  width="2px"
                  bg={timelineBg}
                  borderRadius="full"
                />

                {dayEvents.map((event, eventIndex) => {
                  const eventConfig = getEventConfig(event.eventCode);
                  const EventIcon = eventConfig.icon;
                  const directionConfig = getDirectionIcon(event.messageDirection);
                  const DirectionIcon = directionConfig.icon;

                  return (
                    <HStack key={event.id || eventIndex} gap={4} align="start">
                      {/* Timeline dot */}
                      <Box
                        position="relative"
                        zIndex={1}
                        p={2}
                        bg={`${eventConfig.color}.100`}
                        color={`${eventConfig.color}.600`}
                        borderRadius="full"
                        borderWidth="3px"
                        borderColor={bgColor}
                        shadow="sm"
                      >
                        <EventIcon size={16} />
                      </Box>

                      {/* Event Card */}
                      <Card.Root
                        flex="1"
                        bg={bgColor}
                        borderColor={borderColor}
                        borderWidth="1px"
                        shadow="sm"
                        transition="all 0.2s"
                        _hover={{ shadow: 'md', borderColor: `${eventConfig.color}.300` }}
                      >
                        <Card.Body p={4}>
                          <VStack align="stretch" gap={3}>
                            {/* Event Header */}
                            <HStack justify="space-between" wrap="wrap" gap={2}>
                              <HStack gap={2}>
                                <Badge colorPalette={eventConfig.color} size="md">
                                  {t(`eventHistory.eventTypes.${event.eventCode}`, eventConfig.label)}
                                </Badge>
                                {event.swiftMessageType && (
                                  <Badge colorPalette="purple" variant="outline" size="sm">
                                    <DirectionIcon size={12} style={{ marginRight: 4 }} />
                                    {event.swiftMessageType}
                                  </Badge>
                                )}
                              </HStack>
                              <Text fontSize="xs" color={mutedColor}>
                                <FiClock size={12} style={{ display: 'inline', marginRight: 4 }} />
                                {event.executedAt ? new Date(event.executedAt).toLocaleTimeString() : '-'}
                              </Text>
                            </HStack>

                            {/* Event Details */}
                            <HStack gap={6} wrap="wrap" fontSize="sm">
                              <VStack align="start" gap={0}>
                                <Text color={mutedColor} fontSize="xs">{t('eventHistory.reference')}</Text>
                                <Text fontWeight="medium" color={textColor}>{event.reference}</Text>
                              </VStack>

                              {event.amount && (
                                <VStack align="start" gap={0}>
                                  <Text color={mutedColor} fontSize="xs">{t('eventHistory.amount')}</Text>
                                  <Text fontWeight="medium" color={textColor}>
                                    {event.currency} {event.amount?.toLocaleString()}
                                  </Text>
                                </VStack>
                              )}

                              {(event.previousStage || event.newStage) && (
                                <VStack align="start" gap={0}>
                                  <Text color={mutedColor} fontSize="xs">{t('eventHistory.stageChange')}</Text>
                                  <HStack gap={1}>
                                    {event.previousStage && (
                                      <Badge colorPalette="gray" size="sm">{event.previousStage}</Badge>
                                    )}
                                    {event.previousStage && event.newStage && (
                                      <FiArrowRight size={12} />
                                    )}
                                    {event.newStage && (
                                      <Badge colorPalette="green" size="sm">{event.newStage}</Badge>
                                    )}
                                  </HStack>
                                </VStack>
                              )}

                              <VStack align="start" gap={0}>
                                <Text color={mutedColor} fontSize="xs">{t('eventHistory.executedBy')}</Text>
                                <HStack gap={1}>
                                  <FiUser size={12} />
                                  <Text fontWeight="medium" color={textColor}>{event.executedBy || '-'}</Text>
                                </HStack>
                              </VStack>
                            </HStack>

                            {/* Comments */}
                            {event.comments && (
                              <>
                                <Separator />
                                <Box
                                  p={2}
                                  bg={cardBg}
                                  borderRadius="md"
                                  borderLeftWidth="3px"
                                  borderLeftColor={`${eventConfig.color}.400`}
                                >
                                  <Text fontSize="sm" color={mutedColor} fontStyle="italic">
                                    {event.comments}
                                  </Text>
                                </Box>
                              </>
                            )}
                          </VStack>
                        </Card.Body>
                      </Card.Root>
                    </HStack>
                  );
                })}
              </VStack>
            </Box>
          ))}
        </Box>

        {/* Pagination Controls - Bottom */}
        {totalPages > 1 && (
          <HStack justify="center" gap={2} pt={4}>
            <Button
              size="sm"
              variant="outline"
              disabled={!hasPrevious}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              {t('pagination.previous', 'Anterior')}
            </Button>
            <Text fontSize="sm" color={textColor} fontWeight="medium">
              {t('pagination.page', 'Página')} {currentPage + 1} {t('pagination.of', 'de')} {totalPages}
            </Text>
            <Button
              size="sm"
              variant="outline"
              disabled={!hasNext}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              {t('pagination.next', 'Siguiente')}
            </Button>
          </HStack>
        )}

        {/* Empty State */}
        {filteredEvents.length === 0 && !loading && (
          <Box textAlign="center" py={12}>
            <VStack gap={4}>
              <Box p={4} borderRadius="full" bg={cardBg}>
                <FiActivity size={48} color="gray" />
              </Box>
              <Text fontSize="lg" fontWeight="medium" color={textColor}>
                {t('eventHistory.noEvents')}
              </Text>
              <Text color={mutedColor}>
                {t('eventHistory.noEventsHint')}
              </Text>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default EventHistory;
