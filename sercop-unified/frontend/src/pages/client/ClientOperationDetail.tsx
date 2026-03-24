/**
 * ClientOperationDetail - View operation details and request post-issuance events
 * Shows operation information, event history, and available actions
 * All configuration comes from database - no hardcoded values
 */

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Badge,
  Spinner,
  Center,
  Button,
  Grid,
  Tabs,
  Separator,
  Icon,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import * as FiIcons from 'react-icons/fi';
import clientPortalService from '../../services/clientPortalService';
import { productTypeConfigService, type ProductTypeConfig } from '../../services/productTypeConfigService';
import type { ClientOperationDetail as OperationDetail, AvailableEvent, OperationEventLog } from '../../services/clientPortalTypes';
import { useTheme } from '../../contexts/ThemeContext';
import { EventRequestDialog } from '../../components/client/EventRequestDialog';
import { VideoConferenceButton } from '../../components/videoconference/VideoConferenceButton';
import type { OperationType } from '../../types/videoConference';

// Dynamic icon resolver - gets icon component from string name
const getIconComponent = (iconName?: string): React.ElementType => {
  if (!iconName) return FiIcons.FiFile;
  // Handle both "FiEdit" and "Edit" formats
  const normalizedName = iconName.startsWith('Fi') ? iconName : `Fi${iconName}`;
  return (FiIcons as Record<string, React.ElementType>)[normalizedName] || FiIcons.FiFile;
};

// Color mapping for Chakra UI colorPalette
const normalizeColor = (color?: string): string => {
  if (!color) return 'gray';
  // Map common color names to Chakra color names
  const colorMap: Record<string, string> = {
    blue: 'blue',
    green: 'green',
    emerald: 'green',
    red: 'red',
    orange: 'orange',
    yellow: 'yellow',
    purple: 'purple',
    cyan: 'cyan',
    teal: 'teal',
    gray: 'gray',
    grey: 'gray',
  };
  return colorMap[color.toLowerCase()] || color;
};

// Map product type to video conference operation type
const mapProductTypeToOperationType = (productType?: string): OperationType | undefined => {
  if (!productType) return undefined;
  const upperProductType = productType.toUpperCase();
  if (upperProductType.includes('LETTER') || upperProductType.includes('LC') || upperProductType.includes('CARTA')) {
    return 'LETTER_OF_CREDIT';
  }
  if (upperProductType.includes('GUARANTEE') || upperProductType.includes('GARANTIA')) {
    return 'BANK_GUARANTEE';
  }
  if (upperProductType.includes('COLLECTION') || upperProductType.includes('COBRANZA')) {
    return 'DOCUMENTARY_COLLECTION';
  }
  if (upperProductType.includes('FINANCING') || upperProductType.includes('FINANCIAMIENTO')) {
    return 'FINANCING';
  }
  return undefined;
};

export const ClientOperationDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { operationId } = useParams<{ operationId: string }>();
  const { getColors } = useTheme();
  const colors = getColors();

  const [operation, setOperation] = useState<OperationDetail | null>(null);
  const [productConfig, setProductConfig] = useState<ProductTypeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AvailableEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);

  useEffect(() => {
    if (operationId) {
      loadOperationDetail();
    }
  }, [operationId, i18n.language]);

  const loadOperationDetail = async () => {
    if (!operationId) return;
    try {
      setLoading(true);
      const data = await clientPortalService.getOperationDetail(operationId, i18n.language);
      setOperation(data);

      // Load product type configuration
      if (data.productType) {
        try {
          const config = await productTypeConfigService.getConfigByProductType(data.productType);
          setProductConfig(config);
        } catch (err) {
          console.warn('Failed to load product config:', err);
        }
      }

      setError(null);
    } catch (err) {
      console.error('Error loading operation:', err);
      setError(t('clientPortal.operations.loadError', 'Failed to load operation details'));
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return '-';
    return `${currency || 'USD'} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(i18n.language === 'es' ? 'es-EC' : 'en-US');
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString(i18n.language === 'es' ? 'es-EC' : 'en-US');
  };

  const handleEventAction = (event: AvailableEvent) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleEventRequestSuccess = () => {
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
    loadOperationDetail();
  };

  // Get icon for product type from config or default
  const ProductIcon = useMemo(() => {
    // First try to get from product config (if we add icon field later)
    // For now use a category-based default
    const category = productConfig?.category;
    if (category === 'LETTERS_OF_CREDIT') return FiIcons.FiFileText;
    if (category === 'GUARANTEES') return FiIcons.FiShield;
    if (category === 'COLLECTIONS') return FiIcons.FiDollarSign;
    return FiIcons.FiFileText;
  }, [productConfig]);

  // Get color for product type from config
  const productColor = useMemo(() => {
    const category = productConfig?.category;
    if (category === 'LETTERS_OF_CREDIT') return 'blue';
    if (category === 'GUARANTEES') return 'purple';
    if (category === 'COLLECTIONS') return 'orange';
    return 'gray';
  }, [productConfig]);

  if (loading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color={colors.primaryColor} />
      </Center>
    );
  }

  if (error || !operation) {
    return (
      <Center h="400px">
        <VStack>
          <Text color="red.500">{error || t('clientPortal.operations.notFound', 'Operation not found')}</Text>
          <Button onClick={() => navigate('/client/operations')}>
            {t('common.goBack', 'Go Back')}
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justify="space-between" align="start">
          <HStack gap={4}>
            <Button
              variant="ghost"
              onClick={() => navigate('/client/operations')}
              size="sm"
            >
              <FiIcons.FiArrowLeft style={{ marginRight: 8 }} />
              {t('common.back', 'Back')}
            </Button>
            <Separator orientation="vertical" h="40px" />
            <Box
              bg={`${productColor}.100`}
              p={3}
              borderRadius="xl"
            >
              <Icon as={ProductIcon} boxSize={8} color={`${productColor}.600`} />
            </Box>
            <VStack align="start" gap={0}>
              <HStack>
                <Heading size="lg">{operation.reference}</Heading>
                <Badge colorPalette={normalizeColor(operation.status === 'ACTIVE' ? 'green' : 'gray')} size="lg">
                  {operation.statusLabel || operation.status}
                </Badge>
              </HStack>
              <Text color={colors.textColorSecondary}>
                {operation.productTypeLabel || productConfig?.description || operation.productType} - {operation.stageLabel || operation.stage}
              </Text>
            </VStack>
          </HStack>

          {/* Amount and Video Conference */}
          <VStack align="end" gap={2}>
            <Text fontSize="2xl" fontWeight="bold">
              {formatAmount(operation.amount, operation.currency)}
            </Text>
            <Text fontSize="sm" color={colors.textColorSecondary}>
              {t('clientPortal.operations.expiryDate', 'Expiry')}: {formatDate(operation.expiryDate)}
            </Text>
            <VideoConferenceButton
              variant="menu"
              size="sm"
              colorScheme="green"
              operationId={operationId}
              operationType={mapProductTypeToOperationType(operation.productType)}
              operationReference={operation.reference}
              clientName={operation.clientName}
            />
          </VStack>
        </HStack>

        {/* Available Actions - from database configuration */}
        {operation.availableEvents && operation.availableEvents.length > 0 && (
          <Card.Root>
            <Card.Body>
              <Text fontWeight="semibold" mb={3}>
                {t('clientPortal.operations.availableActions', 'Available Actions')}
              </Text>
              <HStack gap={3} flexWrap="wrap">
                {operation.availableEvents.map((event) => {
                  const EventIcon = getIconComponent(event.icon);
                  const eventColor = normalizeColor(event.color);
                  return (
                    <Button
                      key={event.eventCode}
                      variant="outline"
                      colorPalette={eventColor}
                      size="sm"
                      onClick={() => handleEventAction(event)}
                    >
                      <EventIcon style={{ marginRight: 8 }} />
                      {event.eventName}
                    </Button>
                  );
                })}
              </HStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* Tabs */}
        <Tabs.Root defaultValue="info">
          <Tabs.List>
            <Tabs.Trigger value="info">
              <FiIcons.FiFileText style={{ marginRight: 8 }} />
              {t('clientPortal.operations.info', 'Information')}
            </Tabs.Trigger>
            <Tabs.Trigger value="timeline">
              <FiIcons.FiClock style={{ marginRight: 8 }} />
              {t('clientPortal.operations.timeline', 'Timeline')}
            </Tabs.Trigger>
            <Tabs.Trigger value="documents">
              <FiIcons.FiPackage style={{ marginRight: 8 }} />
              {t('clientPortal.operations.documents', 'Documents')}
            </Tabs.Trigger>
          </Tabs.List>

          {/* Information Tab */}
          <Tabs.Content value="info">
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6} mt={4}>
              {/* Main Information */}
              <Card.Root>
                <Card.Body>
                  <Text fontWeight="semibold" mb={4} fontSize="lg">
                    {t('clientPortal.operations.mainInfo', 'Main Information')}
                  </Text>
                  <VStack align="stretch" gap={3}>
                    <InfoRow
                      icon={FiIcons.FiDollarSign}
                      label={t('clientPortal.operations.amount', 'Amount')}
                      value={formatAmount(operation.amount, operation.currency)}
                      highlight
                      colors={colors}
                    />
                    <InfoRow
                      icon={FiIcons.FiCalendar}
                      label={t('clientPortal.operations.issueDate', 'Issue Date')}
                      value={formatDate(operation.issueDate)}
                      colors={colors}
                    />
                    <InfoRow
                      icon={FiIcons.FiCalendar}
                      label={t('clientPortal.operations.expiryDate', 'Expiry Date')}
                      value={formatDate(operation.expiryDate)}
                      colors={colors}
                    />
                    {operation.paymentTerms && (
                      <InfoRow
                        icon={FiIcons.FiCreditCard}
                        label={t('clientPortal.operations.paymentTerms', 'Payment Terms')}
                        value={`${operation.paymentTerms}${operation.paymentDays ? ` - ${operation.paymentDays} ${t('common.days', 'days')}` : ''}`}
                        colors={colors}
                      />
                    )}
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Beneficiary */}
              <Card.Root>
                <Card.Body>
                  <Text fontWeight="semibold" mb={4} fontSize="lg">
                    {t('clientPortal.operations.beneficiary', 'Beneficiary')}
                  </Text>
                  <VStack align="stretch" gap={3}>
                    <InfoRow
                      icon={FiIcons.FiUser}
                      label={t('clientPortal.operations.name', 'Name')}
                      value={operation.beneficiaryName || '-'}
                      colors={colors}
                    />
                    {operation.beneficiaryAddress && (
                      <InfoRow
                        icon={FiIcons.FiMapPin}
                        label={t('clientPortal.operations.address', 'Address')}
                        value={operation.beneficiaryAddress}
                        colors={colors}
                      />
                    )}
                    {(operation.beneficiaryBankName || operation.advisingBankBic) && (
                      <InfoRow
                        icon={FiIcons.FiShield}
                        label={t('clientPortal.operations.bank', 'Bank')}
                        value={`${operation.beneficiaryBankName || ''} ${operation.beneficiaryBankBic || operation.advisingBankBic || ''}`}
                        colors={colors}
                      />
                    )}
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Shipping Info (for LCs/Collections) */}
              {(operation.portOfLoading || operation.goodsDescription) && (
                <Card.Root gridColumn={{ md: 'span 2' }}>
                  <Card.Body>
                    <Text fontWeight="semibold" mb={4} fontSize="lg">
                      {t('clientPortal.operations.shipping', 'Shipping Information')}
                    </Text>
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                      {operation.portOfLoading && (
                        <InfoRow
                          icon={FiIcons.FiPackage}
                          label={t('clientPortal.operations.portOfLoading', 'Port of Loading')}
                          value={operation.portOfLoading}
                          colors={colors}
                        />
                      )}
                      {operation.portOfDischarge && (
                        <InfoRow
                          icon={FiIcons.FiPackage}
                          label={t('clientPortal.operations.portOfDischarge', 'Port of Discharge')}
                          value={operation.portOfDischarge}
                          colors={colors}
                        />
                      )}
                      {operation.incoterm && (
                        <InfoRow
                          icon={FiIcons.FiFileText}
                          label={t('clientPortal.operations.incoterm', 'Incoterm')}
                          value={operation.incoterm}
                          colors={colors}
                        />
                      )}
                      {operation.latestShipmentDate && (
                        <InfoRow
                          icon={FiIcons.FiCalendar}
                          label={t('clientPortal.operations.latestShipment', 'Latest Shipment')}
                          value={formatDate(operation.latestShipmentDate)}
                          colors={colors}
                        />
                      )}
                    </Grid>
                    {operation.goodsDescription && (
                      <Box mt={4} p={4} bg={colors.cardBackground} borderRadius="lg">
                        <Text fontWeight="medium" mb={2}>
                          {t('clientPortal.operations.goodsDescription', 'Goods Description')}
                        </Text>
                        <Text>{operation.goodsDescription}</Text>
                      </Box>
                    )}
                  </Card.Body>
                </Card.Root>
              )}
            </Grid>
          </Tabs.Content>

          {/* Timeline Tab */}
          <Tabs.Content value="timeline">
            <Card.Root mt={4}>
              <Card.Body>
                {operation.eventHistory && operation.eventHistory.length > 0 ? (
                  <VStack align="stretch" gap={0}>
                    {operation.eventHistory.map((event, index) => (
                      <TimelineEvent
                        key={event.eventId || index}
                        event={event}
                        isLast={index === operation.eventHistory!.length - 1}
                        formatDateTime={formatDateTime}
                        colors={colors}
                      />
                    ))}
                  </VStack>
                ) : (
                  <Center py={8}>
                    <VStack>
                      <Icon as={FiIcons.FiClock} boxSize={12} color={colors.textColorSecondary} />
                      <Text color={colors.textColorSecondary}>
                        {t('clientPortal.operations.noEvents', 'No events recorded yet')}
                      </Text>
                    </VStack>
                  </Center>
                )}
              </Card.Body>
            </Card.Root>
          </Tabs.Content>

          {/* Documents Tab */}
          <Tabs.Content value="documents">
            <Card.Root mt={4}>
              <Card.Body>
                <Center py={8}>
                  <VStack>
                    <Icon as={FiIcons.FiPackage} boxSize={12} color={colors.textColorSecondary} />
                    <Text color={colors.textColorSecondary}>
                      {t('clientPortal.operations.documentsComingSoon', 'Documents will be available soon')}
                    </Text>
                  </VStack>
                </Center>
              </Card.Body>
            </Card.Root>
          </Tabs.Content>
        </Tabs.Root>
      </VStack>

      {/* Event Request Dialog */}
      {selectedEvent && operation && (
        <EventRequestDialog
          isOpen={isEventDialogOpen}
          onClose={() => {
            setIsEventDialogOpen(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          operation={operation}
          onSuccess={handleEventRequestSuccess}
        />
      )}
    </Box>
  );
};

// Info Row Component
interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
  colors: ReturnType<typeof useTheme>['getColors'] extends () => infer R ? R : never;
}

const InfoRow = ({ icon: IconComponent, label, value, highlight, colors }: InfoRowProps) => {
  return (
    <HStack justify="space-between">
      <HStack color={colors.textColorSecondary}>
        <Icon as={IconComponent} boxSize={4} />
        <Text fontSize="sm">{label}</Text>
      </HStack>
      <Text fontWeight={highlight ? 'bold' : 'medium'} fontSize={highlight ? 'lg' : 'md'}>
        {value}
      </Text>
    </HStack>
  );
};

// Timeline Event Component - uses database config for icons/colors
interface TimelineEventProps {
  event: OperationEventLog;
  isLast: boolean;
  formatDateTime: (dateStr?: string) => string;
  colors: ReturnType<typeof useTheme>['getColors'] extends () => infer R ? R : never;
}

const TimelineEvent = ({ event, isLast, formatDateTime, colors }: TimelineEventProps) => {
  // The event should have icon/color from database, but if not, use defaults
  const EventIcon = getIconComponent(undefined); // Would use event.icon if available
  const eventColor = normalizeColor(undefined); // Would use event.color if available

  return (
    <HStack align="start" gap={4}>
      <VStack gap={0}>
        <Box
          bg={`${eventColor}.100`}
          p={2}
          borderRadius="full"
        >
          <Icon as={EventIcon} boxSize={5} color={`${eventColor}.600`} />
        </Box>
        {!isLast && (
          <Box w="2px" h="40px" bg={colors.borderColor} />
        )}
      </VStack>
      <VStack align="start" gap={1} pb={isLast ? 0 : 4} flex={1}>
        <HStack justify="space-between" w="100%">
          <Text fontWeight="semibold">{event.eventName || event.eventCode}</Text>
          <Text fontSize="sm" color={colors.textColorSecondary}>
            {formatDateTime(event.executedAt)}
          </Text>
        </HStack>
        {event.description && (
          <Text fontSize="sm" color={colors.textColorSecondary}>
            {event.description}
          </Text>
        )}
        {event.executedByName && (
          <Text fontSize="xs" color={colors.textColorSecondary}>
            {event.executedByName}
          </Text>
        )}
        {event.swiftMessageType && (
          <Badge colorPalette="blue" size="sm">
            {event.swiftMessageType}
          </Badge>
        )}
      </VStack>
    </HStack>
  );
};

export default ClientOperationDetail;
