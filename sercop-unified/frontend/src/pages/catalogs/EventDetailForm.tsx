/**
 * EventDetailForm - Full event type form (create / edit).
 * Extracted from Tab 1 of EventTypeConfigAdmin.tsx.
 */
import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Icon,
  Button,
  Input,
  Textarea,
  Field,
  Switch,
  NativeSelect,
  Heading,
  Card,
  IconButton,
} from '@chakra-ui/react';
import {
  FiSave,
  FiX,
  FiEdit2,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { eventConfigCommands } from '../../services/operationsApi';
import type { EventTypeConfig, EventTypeConfigCommand } from '../../types/operations';
import {
  availableIcons,
  availableColors,
  swiftMessageTypesFallback as swiftMessageTypes,
  stagesFallback as stages,
  statuses,
  messageParticipants,
  ourRoleOptions,
  eventCategories,
  eventSourceOptions,
  emptyTypeForm,
} from './eventConfigConstants';

interface EventDetailFormProps {
  event: EventTypeConfig | null;
  isCreatingNew: boolean;
  operationType: string;
  language: string;
  onSaved: () => void;
  onCancel: () => void;
}

export const EventDetailForm = ({
  event,
  isCreatingNew,
  operationType,
  language,
  onSaved,
  onCancel,
}: EventDetailFormProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const [isEditing, setIsEditing] = useState(isCreatingNew);
  const [typeForm, setTypeForm] = useState<EventTypeConfigCommand>(emptyTypeForm);
  const [savingType, setSavingType] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when event changes
  useEffect(() => {
    if (event) {
      setTypeForm({
        eventCode: event.eventCode,
        operationType: event.operationType,
        language: event.language,
        eventName: event.eventName,
        eventDescription: event.eventDescription || '',
        helpText: event.helpText || '',
        outboundMessageType: event.outboundMessageType || '',
        inboundMessageType: event.inboundMessageType || '',
        validFromStages: event.validFromStages || [],
        validFromStatuses: event.validFromStatuses || [],
        resultingStage: event.resultingStage || '',
        resultingStatus: event.resultingStatus || '',
        icon: event.icon || 'FiSend',
        color: event.color || 'blue',
        displayOrder: event.displayOrder,
        messageSender: event.messageSender || '',
        messageReceiver: event.messageReceiver || '',
        ourRole: event.ourRole || '',
        requiresSwiftMessage: event.requiresSwiftMessage || false,
        eventCategory: event.eventCategory || '',
        isClientRequestable: event.isClientRequestable || false,
        eventSource: event.eventSource || 'BACKOFFICE',
        isActive: event.isActive,
        requiresApproval: event.requiresApproval,
        approvalLevels: event.approvalLevels,
        isReversible: event.isReversible,
        generatesNotification: event.generatesNotification,
        allowedRoles: event.allowedRoles || [],
        isInitialEvent: event.isInitialEvent,
        initialEventRole: event.initialEventRole,
      });
      setIsEditing(false);
    } else {
      setTypeForm({ ...emptyTypeForm, operationType, language });
      setIsEditing(true);
    }
  }, [event, operationType, language]);

  // Force editing mode when creating new
  useEffect(() => {
    if (isCreatingNew) setIsEditing(true);
  }, [isCreatingNew]);

  const handleSave = async () => {
    setSavingType(true);
    setError(null);
    try {
      if (event) {
        await eventConfigCommands.updateEventType(event.id, typeForm);
      } else {
        await eventConfigCommands.createEventType(typeForm);
      }
      setIsEditing(false);
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save event type');
    } finally {
      setSavingType(false);
    }
  };

  const handleCancel = () => {
    if (isCreatingNew) {
      onCancel();
    } else {
      // Reset form and exit edit mode
      if (event) {
        setTypeForm({
          eventCode: event.eventCode,
          operationType: event.operationType,
          language: event.language,
          eventName: event.eventName,
          eventDescription: event.eventDescription || '',
          helpText: event.helpText || '',
          outboundMessageType: event.outboundMessageType || '',
          inboundMessageType: event.inboundMessageType || '',
          validFromStages: event.validFromStages || [],
          validFromStatuses: event.validFromStatuses || [],
          resultingStage: event.resultingStage || '',
          resultingStatus: event.resultingStatus || '',
          icon: event.icon || 'FiSend',
          color: event.color || 'blue',
          displayOrder: event.displayOrder,
          messageSender: event.messageSender || '',
          messageReceiver: event.messageReceiver || '',
          ourRole: event.ourRole || '',
          requiresSwiftMessage: event.requiresSwiftMessage || false,
          eventCategory: event.eventCategory || '',
          isClientRequestable: event.isClientRequestable || false,
          eventSource: event.eventSource || 'BACKOFFICE',
          isActive: event.isActive,
          requiresApproval: event.requiresApproval,
          approvalLevels: event.approvalLevels,
          isReversible: event.isReversible,
          generatesNotification: event.generatesNotification,
          allowedRoles: event.allowedRoles || [],
          isInitialEvent: event.isInitialEvent,
          initialEventRole: event.initialEventRole,
        });
      }
      setIsEditing(false);
    }
  };

  const disabled = !isEditing;

  return (
    <Card.Root bg={colors.cardBg} borderColor={colors.borderColor}>
      <Card.Header py={3}>
        <Flex justify="space-between" align="center">
          <Heading size="sm" color={colors.textColor}>
            {isCreatingNew
              ? t('admin.eventTypes.createTitle')
              : t('admin.eventTypes.editTitle', 'Detalles del Evento')}
          </Heading>
          {!isCreatingNew && !isEditing && (
            <Button size="xs" variant="ghost" onClick={() => setIsEditing(true)}>
              <HStack gap={1}>
                <Icon as={FiEdit2} />
                <Text>{t('admin.common.edit', 'Editar')}</Text>
              </HStack>
            </Button>
          )}
          {isEditing && !isCreatingNew && (
            <IconButton
              aria-label="Close"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              <Icon as={FiX} />
            </IconButton>
          )}
        </Flex>
      </Card.Header>
      <Card.Body pt={0}>
        <VStack gap={4} align="stretch">
          {error && (
            <Text color="red.500" fontSize="sm">
              {error}
            </Text>
          )}

          {/* Basic Info */}
          <HStack gap={4} flexWrap="wrap" align="start">
            <Field.Root flex="1" minW="200px" required>
              <Field.Label>{t('admin.eventTypes.eventCode')}</Field.Label>
              <Input
                value={typeForm.eventCode}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, eventCode: e.target.value.toUpperCase() })
                }
                placeholder="e.g., LC_ISSUANCE"
                disabled={disabled || !!event}
              />
            </Field.Root>
            <Field.Root flex="1" minW="200px" required>
              <Field.Label>{t('admin.eventTypes.eventName')}</Field.Label>
              <Input
                value={typeForm.eventName}
                onChange={(e) => setTypeForm({ ...typeForm, eventName: e.target.value })}
                placeholder="e.g., LC Issuance"
                disabled={disabled}
              />
            </Field.Root>
            <Field.Root flex="1" minW="150px">
              <Field.Label>{t('admin.common.displayOrder')}</Field.Label>
              <Input
                type="number"
                value={typeForm.displayOrder}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, displayOrder: parseInt(e.target.value) || 0 })
                }
                disabled={disabled}
              />
            </Field.Root>
          </HStack>

          {/* Description */}
          <Field.Root>
            <Field.Label>{t('admin.eventTypes.description')}</Field.Label>
            <Textarea
              value={typeForm.eventDescription || ''}
              onChange={(e) => setTypeForm({ ...typeForm, eventDescription: e.target.value })}
              rows={2}
              disabled={disabled}
            />
          </Field.Root>

          {/* Help Text */}
          <Field.Root>
            <Field.Label>{t('admin.eventTypes.helpText')}</Field.Label>
            <Textarea
              value={typeForm.helpText || ''}
              onChange={(e) => setTypeForm({ ...typeForm, helpText: e.target.value })}
              rows={2}
              disabled={disabled}
            />
          </Field.Root>

          {/* SWIFT Messages */}
          <HStack gap={4} flexWrap="wrap" align="start">
            <Field.Root flex="1" minW="200px">
              <Field.Label>{t('admin.eventTypes.outboundSwift')}</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={typeForm.outboundMessageType || ''}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, outboundMessageType: e.target.value })
                  }
                  disabled={disabled}
                >
                  <option value="">-</option>
                  {swiftMessageTypes
                    .filter((m) => m)
                    .map((mt) => (
                      <option key={mt} value={mt}>
                        {mt}
                      </option>
                    ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root flex="1" minW="200px">
              <Field.Label>{t('admin.eventTypes.inboundSwift')}</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={typeForm.inboundMessageType || ''}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, inboundMessageType: e.target.value })
                  }
                  disabled={disabled}
                >
                  <option value="">-</option>
                  {swiftMessageTypes
                    .filter((m) => m)
                    .map((mt) => (
                      <option key={mt} value={mt}>
                        {mt}
                      </option>
                    ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>
          </HStack>

          {/* Initial Event Configuration */}
          <Box
            p={4}
            borderWidth="1px"
            borderRadius="md"
            borderColor="green.200"
            bg="green.50"
            opacity={disabled ? 0.7 : 1}
          >
            <Text fontWeight="semibold" mb={3} color="green.700">
              {t('admin.eventTypes.initialEventSection')}
            </Text>
            <HStack gap={4} flexWrap="wrap" align="center">
              <Switch.Root
                checked={typeForm.isInitialEvent || false}
                onCheckedChange={(e) =>
                  setTypeForm({ ...typeForm, isInitialEvent: e.checked })
                }
                disabled={disabled}
              >
                <Switch.HiddenInput />
                <Switch.Control />
                <Switch.Label>{t('admin.eventTypes.isInitialEvent')}</Switch.Label>
              </Switch.Root>
              {typeForm.isInitialEvent && (
                <Field.Root flex="1" minW="200px">
                  <Field.Label>{t('admin.eventTypes.initialEventRole')}</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={typeForm.initialEventRole || ''}
                      onChange={(e) =>
                        setTypeForm({ ...typeForm, initialEventRole: e.target.value })
                      }
                      disabled={disabled}
                    >
                      <option value="">-- {t('admin.eventTypes.selectRole')} --</option>
                      <option value="ISSUING_BANK">
                        {t('admin.eventTypes.roles.issuingBank')}
                      </option>
                      <option value="ADVISING_BANK">
                        {t('admin.eventTypes.roles.advisingBank')}
                      </option>
                      <option value="CONFIRMING_BANK">
                        {t('admin.eventTypes.roles.confirmingBank')}
                      </option>
                      <option value="REIMBURSING_BANK">
                        {t('admin.eventTypes.roles.reimbursingBank')}
                      </option>
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Field.Root>
              )}
            </HStack>
          </Box>

          {/* Message Direction */}
          <Box
            p={4}
            borderWidth="1px"
            borderRadius="md"
            borderColor={colors.borderColor}
            bg={colors.bgColor}
            opacity={disabled ? 0.7 : 1}
          >
            <Text fontWeight="semibold" mb={3} color={colors.textColor}>
              {t('admin.eventTypes.messageDirectionSection')}
            </Text>
            <HStack gap={4} flexWrap="wrap" align="start">
              <Field.Root flex="1" minW="180px">
                <Field.Label>{t('admin.eventTypes.messageSender')}</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={typeForm.messageSender || ''}
                    onChange={(e) =>
                      setTypeForm({ ...typeForm, messageSender: e.target.value })
                    }
                    disabled={disabled}
                  >
                    {messageParticipants.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
              <Field.Root flex="1" minW="180px">
                <Field.Label>{t('admin.eventTypes.messageReceiver')}</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={typeForm.messageReceiver || ''}
                    onChange={(e) =>
                      setTypeForm({ ...typeForm, messageReceiver: e.target.value })
                    }
                    disabled={disabled}
                  >
                    {messageParticipants.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
              <Field.Root flex="1" minW="150px">
                <Field.Label>{t('admin.eventTypes.ourRoleLabel')}</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={typeForm.ourRole || ''}
                    onChange={(e) =>
                      setTypeForm({ ...typeForm, ourRole: e.target.value })
                    }
                    disabled={disabled}
                  >
                    {ourRoleOptions.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
              <Field.Root flex="1" minW="150px">
                <Field.Label>{t('admin.eventTypes.eventCategory')}</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={typeForm.eventCategory || ''}
                    onChange={(e) =>
                      setTypeForm({ ...typeForm, eventCategory: e.target.value })
                    }
                    disabled={disabled}
                  >
                    {eventCategories.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
            </HStack>
            <HStack mt={3}>
              <Switch.Root
                checked={typeForm.requiresSwiftMessage || false}
                onCheckedChange={(e) =>
                  setTypeForm({ ...typeForm, requiresSwiftMessage: e.checked })
                }
                disabled={disabled}
              >
                <Switch.HiddenInput />
                <Switch.Control />
                <Switch.Label>{t('admin.eventTypes.requiresSwiftMessage')}</Switch.Label>
              </Switch.Root>
            </HStack>
          </Box>

          {/* Client Portal Configuration */}
          <Box
            p={4}
            borderWidth="1px"
            borderRadius="md"
            borderColor="cyan.200"
            bg="cyan.50"
            opacity={disabled ? 0.7 : 1}
          >
            <Text fontWeight="semibold" mb={3} color="cyan.700">
              {t('admin.eventTypes.clientPortalSection', 'Client Portal Configuration')}
            </Text>
            <HStack gap={4} flexWrap="wrap" align="center">
              <Switch.Root
                checked={typeForm.isClientRequestable || false}
                onCheckedChange={(e) =>
                  setTypeForm({
                    ...typeForm,
                    isClientRequestable: e.checked,
                    eventSource: e.checked ? 'CLIENT_AND_BACKOFFICE' : 'BACKOFFICE',
                  })
                }
                disabled={disabled}
              >
                <Switch.HiddenInput />
                <Switch.Control />
                <Switch.Label>
                  {t('admin.eventTypes.isClientRequestable', 'Client Can Request')}
                </Switch.Label>
              </Switch.Root>
              {typeForm.isClientRequestable && (
                <Field.Root flex="1" minW="200px">
                  <Field.Label>
                    {t('admin.eventTypes.eventSource', 'Event Source')}
                  </Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={typeForm.eventSource || 'BACKOFFICE'}
                      onChange={(e) =>
                        setTypeForm({ ...typeForm, eventSource: e.target.value })
                      }
                      disabled={disabled}
                    >
                      {eventSourceOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Field.Root>
              )}
            </HStack>
          </Box>

          {/* State Transitions */}
          <HStack gap={4} flexWrap="wrap" align="start">
            <Field.Root flex="1" minW="200px">
              <Field.Label>{t('admin.eventTypes.resultingStage')}</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={typeForm.resultingStage || ''}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, resultingStage: e.target.value })
                  }
                  disabled={disabled}
                >
                  <option value="">{t('admin.eventTypes.noChange')}</option>
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root flex="1" minW="200px">
              <Field.Label>{t('admin.eventTypes.resultingStatus')}</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={typeForm.resultingStatus || ''}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, resultingStatus: e.target.value })
                  }
                  disabled={disabled}
                >
                  <option value="">{t('admin.eventTypes.noChange')}</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>
          </HStack>

          {/* Visual Settings */}
          <HStack gap={4} flexWrap="wrap" align="start">
            <Field.Root flex="1" minW="200px">
              <Field.Label>{t('admin.eventTypes.icon')}</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={typeForm.icon || 'FiSend'}
                  onChange={(e) => setTypeForm({ ...typeForm, icon: e.target.value })}
                  disabled={disabled}
                >
                  {availableIcons.map((icon) => (
                    <option key={icon.name} value={icon.name}>
                      {icon.name.replace('Fi', '')}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root flex="1" minW="200px">
              <Field.Label>{t('admin.eventTypes.color')}</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={typeForm.color || 'blue'}
                  onChange={(e) => setTypeForm({ ...typeForm, color: e.target.value })}
                  disabled={disabled}
                >
                  {availableColors.map((color) => (
                    <option key={color.name} value={color.name}>
                      {color.label}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root flex="1" minW="150px">
              <Field.Label>{t('admin.eventTypes.approvalLevels')}</Field.Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={typeForm.approvalLevels || 1}
                onChange={(e) =>
                  setTypeForm({
                    ...typeForm,
                    approvalLevels: parseInt(e.target.value) || 1,
                  })
                }
                disabled={disabled}
              />
            </Field.Root>
          </HStack>

          {/* Flags */}
          <HStack gap={6} flexWrap="wrap">
            <Switch.Root
              checked={typeForm.isActive}
              onCheckedChange={(e) => setTypeForm({ ...typeForm, isActive: e.checked })}
              disabled={disabled}
            >
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label>{t('admin.common.active')}</Switch.Label>
            </Switch.Root>
            <Switch.Root
              checked={typeForm.requiresApproval || false}
              onCheckedChange={(e) =>
                setTypeForm({ ...typeForm, requiresApproval: e.checked })
              }
              disabled={disabled}
            >
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label>{t('admin.eventTypes.requiresApproval')}</Switch.Label>
            </Switch.Root>
            <Switch.Root
              checked={typeForm.isReversible || false}
              onCheckedChange={(e) =>
                setTypeForm({ ...typeForm, isReversible: e.checked })
              }
              disabled={disabled}
            >
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label>{t('admin.eventTypes.reversible')}</Switch.Label>
            </Switch.Root>
            <Switch.Root
              checked={typeForm.generatesNotification !== false}
              onCheckedChange={(e) =>
                setTypeForm({ ...typeForm, generatesNotification: e.checked })
              }
              disabled={disabled}
            >
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label>{t('admin.eventTypes.generatesNotification')}</Switch.Label>
            </Switch.Root>
          </HStack>

          {/* Actions */}
          {isEditing && (
            <HStack gap={2} justify="flex-end" pt={4}>
              <Button variant="outline" onClick={handleCancel}>
                {t('admin.common.cancel')}
              </Button>
              <Button
                colorPalette="blue"
                onClick={handleSave}
                loading={savingType}
                disabled={!typeForm.eventCode || !typeForm.eventName}
              >
                <Icon as={FiSave} mr={2} />
                {event ? t('admin.common.update') : t('admin.common.create')}
              </Button>
            </HStack>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

export default EventDetailForm;
