/**
 * EventRequestDialog - Dialog for requesting post-issuance events
 * Form fields are determined by the event type configuration from database
 */

import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Textarea,
  Icon,
  Badge,
  Spinner,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  Field,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
import * as FiIcons from 'react-icons/fi';
import clientPortalService from '../../services/clientPortalService';
import type { AvailableEvent, ClientOperationDetail, EventRequestDTO, FormFieldConfig } from '../../services/clientPortalTypes';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../ui/toaster';

// Dynamic icon resolver
const getIconComponent = (iconName?: string): React.ElementType => {
  if (!iconName) return FiIcons.FiFile;
  const normalizedName = iconName.startsWith('Fi') ? iconName : `Fi${iconName}`;
  return (FiIcons as Record<string, React.ElementType>)[normalizedName] || FiIcons.FiFile;
};

// Normalize color for Chakra
const normalizeColor = (color?: string): string => {
  if (!color) return 'gray';
  const colorMap: Record<string, string> = {
    blue: 'blue', green: 'green', emerald: 'green', red: 'red',
    orange: 'orange', yellow: 'yellow', purple: 'purple', cyan: 'cyan',
    teal: 'teal', gray: 'gray', grey: 'gray',
  };
  return colorMap[color.toLowerCase()] || color;
};

interface EventRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: AvailableEvent;
  operation: ClientOperationDetail;
  onSuccess: () => void;
}

export const EventRequestDialog = ({
  isOpen,
  onClose,
  event,
  operation,
  onSuccess,
}: EventRequestDialogProps) => {
  const { t, i18n } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const isSpanish = i18n.language === 'es';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const EventIcon = useMemo(() => getIconComponent(event.icon), [event.icon]);
  const eventColor = useMemo(() => normalizeColor(event.color), [event.color]);

  // Get form fields from database configuration
  const formFields = useMemo(() => {
    // If formFieldsConfig exists from database, use it
    if (event.formFieldsConfig && event.formFieldsConfig.length > 0) {
      return event.formFieldsConfig.map((field: FormFieldConfig) => ({
        name: field.name,
        label: isSpanish ? field.labelEs : field.labelEn,
        type: field.type,
        required: field.required,
        placeholder: field.useOperationAmountAsPlaceholder
          ? operation.amount?.toString()
          : (isSpanish ? field.placeholderEs : field.placeholderEn),
        rows: field.rows,
      }));
    }

    // Fallback to default justification field if no config
    return [{
      name: 'justification',
      label: t('clientPortal.eventRequest.justification', 'Justification'),
      type: 'textarea' as const,
      required: true,
      placeholder: t('clientPortal.eventRequest.justificationPlaceholder', 'Please explain the reason for this request...'),
      rows: 3,
    }];
  }, [event.formFieldsConfig, operation.amount, isSpanish, t]);

  const handleInputChange = (name: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const request: EventRequestDTO = {
        operationId: operation.operationId,
        eventCode: event.eventCode,
        justification: formData.justification as string,
        requestedChanges: formData,
        ...(formData.newExpiryDate && { newExpiryDate: formData.newExpiryDate as string }),
        ...(formData.newAmount && { newAmount: formData.newAmount as number }),
        ...(formData.cancellationReason && { cancellationReason: formData.cancellationReason as string }),
        ...(formData.paymentAmount && { paymentAmount: formData.paymentAmount as number }),
        ...(formData.debitAccountNumber && { debitAccountNumber: formData.debitAccountNumber as string }),
      };

      await clientPortalService.createEventRequest(request);

      toaster.create({
        title: t('clientPortal.eventRequest.success', 'Request Submitted'),
        description: t('clientPortal.eventRequest.successDescription', 'Your request has been submitted for processing.'),
        type: 'success',
      });

      onSuccess();
    } catch (err) {
      console.error('Error submitting event request:', err);
      toaster.create({
        title: t('clientPortal.eventRequest.error', 'Error'),
        description: t('clientPortal.eventRequest.errorDescription', 'Failed to submit request. Please try again.'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return '-';
    return `${currency || 'USD'} ${amount.toLocaleString()}`;
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="lg">
      <DialogContent>
        <DialogHeader>
          <HStack>
            <Box bg={`${eventColor}.100`} p={2} borderRadius="lg">
              <Icon as={EventIcon} boxSize={6} color={`${eventColor}.600`} />
            </Box>
            <VStack align="start" gap={0}>
              <DialogTitle>{event.eventName}</DialogTitle>
              <Text fontSize="sm" color={colors.textColorSecondary}>
                {operation.reference}
              </Text>
            </VStack>
          </HStack>
        </DialogHeader>
        <DialogCloseTrigger />

        <DialogBody>
          <VStack align="stretch" gap={4}>
            {/* Event Description */}
            {event.eventDescription && (
              <Box p={4} bg={colors.cardBackground} borderRadius="lg">
                <Text fontSize="sm">{event.eventDescription}</Text>
              </Box>
            )}

            {/* Help Text */}
            {event.helpText && (
              <Box p={4} bg={`${eventColor}.50`} borderRadius="lg" borderLeft="4px solid" borderLeftColor={`${eventColor}.400`}>
                <Text fontSize="sm" color={`${eventColor}.800`}>{event.helpText}</Text>
              </Box>
            )}

            {/* Operation Summary */}
            <Box p={4} bg={colors.cardBackground} borderRadius="lg">
              <Text fontWeight="semibold" mb={2}>
                {t('clientPortal.eventRequest.currentOperation', 'Current Operation')}
              </Text>
              <HStack justify="space-between">
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  {t('clientPortal.operations.amount', 'Amount')}
                </Text>
                <Text fontWeight="medium">{formatAmount(operation.amount, operation.currency)}</Text>
              </HStack>
              {operation.expiryDate && (
                <HStack justify="space-between" mt={2}>
                  <Text fontSize="sm" color={colors.textColorSecondary}>
                    {t('clientPortal.operations.expiryDate', 'Expiry Date')}
                  </Text>
                  <Text fontWeight="medium">
                    {new Date(operation.expiryDate).toLocaleDateString(isSpanish ? 'es-EC' : 'en-US')}
                  </Text>
                </HStack>
              )}
            </Box>

            {/* Approval Warning */}
            {event.requiresApproval && (
              <HStack p={3} bg="yellow.50" borderRadius="lg" gap={3}>
                <Icon as={FiIcons.FiAlertTriangle} color="yellow.600" />
                <Text fontSize="sm" color="yellow.800">
                  {t('clientPortal.eventRequest.requiresApproval', 'This request requires approval before processing.')}
                  {event.approvalLevels > 1 && ` (${event.approvalLevels} ${t('clientPortal.eventRequest.approvalLevels', 'approval levels')})`}
                </Text>
              </HStack>
            )}

            {/* Dynamic Form Fields from Database Configuration */}
            {formFields.map((field) => (
              <Field.Root key={field.name} required={field.required}>
                <Field.Label>
                  {field.label}
                  {field.required && <Text as="span" color="red.500" ml={1}>*</Text>}
                </Field.Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    placeholder={field.placeholder}
                    value={(formData[field.name] as string) || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    rows={field.rows || 3}
                  />
                ) : field.type === 'number' ? (
                  <Input
                    type="number"
                    placeholder={field.placeholder}
                    value={(formData[field.name] as string) || ''}
                    onChange={(e) => handleInputChange(field.name, parseFloat(e.target.value) || '')}
                  />
                ) : field.type === 'date' ? (
                  <Input
                    type="date"
                    value={(formData[field.name] as string) || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                  />
                ) : (
                  <Input
                    placeholder={field.placeholder}
                    value={(formData[field.name] as string) || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                  />
                )}
              </Field.Root>
            ))}

            {/* SWIFT Message Info */}
            {event.requiresSwiftMessage && event.outboundMessageType && (
              <HStack>
                <Badge colorPalette="blue">SWIFT</Badge>
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  {t('clientPortal.eventRequest.willGenerateSwift', 'Will generate')} {event.outboundMessageType}
                </Text>
              </HStack>
            )}
          </VStack>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            colorPalette={eventColor}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <FiIcons.FiSend style={{ marginRight: 8 }} />
                {t('clientPortal.eventRequest.submit', 'Submit Request')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};

export default EventRequestDialog;
