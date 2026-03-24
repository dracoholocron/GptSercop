/**
 * EventTransitionsSection - Shows transitions related to a selected event,
 * grouped into "Incoming" and "Outgoing". Supports inline create/edit/delete.
 * Extracted from Tab 2 of EventTypeConfigAdmin.tsx.
 */
import { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Badge,
  Icon,
  Button,
  Input,
  Textarea,
  Field,
  Switch,
  NativeSelect,
  Card,
  IconButton,
  Heading,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSave,
  FiX,
  FiArrowRight,
  FiArrowDown,
  FiZap,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { eventConfigCommands } from '../../services/operationsApi';
import type {
  EventTypeConfig,
  EventFlowConfig,
  EventFlowConfigCommand,
} from '../../types/operations';
import { stagesWithEmptyFallback as stagesWithEmpty, emptyFlowForm } from './eventConfigConstants';

interface EventTransitionsSectionProps {
  event: EventTypeConfig;
  eventTypes: EventTypeConfig[];
  flows: EventFlowConfig[];
  operationType: string;
  language: string;
  onFlowSaved: () => void;
  onFlowDeleted: (id: number, name: string) => void;
}

export const EventTransitionsSection = ({
  event,
  eventTypes,
  flows,
  operationType,
  language,
  onFlowSaved,
  onFlowDeleted,
}: EventTransitionsSectionProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const [showFlowForm, setShowFlowForm] = useState(false);
  const [editingFlowId, setEditingFlowId] = useState<number | null>(null);
  const [flowForm, setFlowForm] = useState<EventFlowConfigCommand>(emptyFlowForm);
  const [savingFlow, setSavingFlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Separate incoming and outgoing
  const incoming = useMemo(
    () => flows.filter((f) => f.toEventCode === event.eventCode),
    [flows, event.eventCode]
  );
  const outgoing = useMemo(
    () => flows.filter((f) => f.fromEventCode === event.eventCode),
    [flows, event.eventCode]
  );

  const eventCodeOptions = useMemo(
    () => [
      { value: '', label: `(${t('admin.eventFlows.startEvent')})` },
      ...eventTypes.map((et) => ({
        value: et.eventCode,
        label: `${et.eventCode} - ${et.eventName}`,
      })),
    ],
    [eventTypes, t]
  );

  const getEventName = (eventCode: string | undefined): string => {
    if (!eventCode) return `(${t('admin.eventFlows.startEvent')})`;
    const ev = eventTypes.find((et) => et.eventCode === eventCode);
    return ev ? ev.eventName : eventCode;
  };

  const hasConditions = (flow: EventFlowConfig): boolean => {
    if (!flow.conditions || typeof flow.conditions !== 'object') return false;
    return Object.keys(flow.conditions).length > 0;
  };

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Pre-fill flow form for creating
  const handleCreateFlow = (direction: 'incoming' | 'outgoing') => {
    setEditingFlowId(null);
    setFlowForm({
      ...emptyFlowForm,
      operationType,
      language,
      fromEventCode: direction === 'outgoing' ? event.eventCode : '',
      toEventCode: direction === 'incoming' ? event.eventCode : '',
    });
    setShowFlowForm(true);
  };

  const handleEditFlow = (flow: EventFlowConfig) => {
    setEditingFlowId(flow.id);
    setFlowForm({
      operationType: flow.operationType,
      fromEventCode: flow.fromEventCode || '',
      fromStage: flow.fromStage || '',
      toEventCode: flow.toEventCode,
      conditions: flow.conditions || {},
      isRequired: flow.isRequired,
      isOptional: flow.isOptional,
      sequenceOrder: flow.sequenceOrder,
      language: flow.language,
      transitionLabel: flow.transitionLabel || '',
      transitionHelp: flow.transitionHelp || '',
      isActive: flow.isActive,
    });
    setShowFlowForm(true);
  };

  const handleSaveFlow = async () => {
    setSavingFlow(true);
    setError(null);
    try {
      if (editingFlowId) {
        await eventConfigCommands.updateEventFlow(editingFlowId, flowForm);
      } else {
        await eventConfigCommands.createEventFlow(flowForm);
      }
      setShowFlowForm(false);
      setEditingFlowId(null);
      onFlowSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save flow');
    } finally {
      setSavingFlow(false);
    }
  };

  const handleCancelFlow = () => {
    setShowFlowForm(false);
    setEditingFlowId(null);
    setFlowForm(emptyFlowForm);
    setError(null);
  };

  const renderFlowRow = (flow: EventFlowConfig) => {
    const isExpanded = expandedRows.has(flow.id);
    const hasCond = hasConditions(flow);
    return (
      <Box key={flow.id}>
        <Flex
          px={3}
          py={2}
          align="center"
          gap={2}
          _hover={{ bg: colors.hoverBg }}
          bg={hasCond ? 'yellow.50' : undefined}
        >
          <VStack align="start" gap={0} flex={1} minW={0}>
            <HStack gap={1}>
              <Text fontFamily="mono" fontSize="xs" color={colors.textColorSecondary}>
                {flow.fromEventCode || t('admin.eventFlows.startEvent')}
              </Text>
              <Icon as={FiArrowRight} boxSize={3} color="blue.500" />
              <Text fontFamily="mono" fontSize="xs" fontWeight="medium" color={colors.textColor}>
                {flow.toEventCode}
              </Text>
            </HStack>
            <HStack gap={1} flexWrap="wrap">
              {flow.transitionLabel && (
                <Text fontSize="xs" color={colors.textColorSecondary}>
                  {flow.transitionLabel}
                </Text>
              )}
              {flow.fromStage && (
                <Badge colorPalette="purple" variant="subtle" size="sm">
                  {flow.fromStage}
                </Badge>
              )}
            </HStack>
          </VStack>
          <HStack gap={1}>
            {hasCond && (
              <IconButton
                aria-label="Conditions"
                size="xs"
                variant="ghost"
                colorPalette="yellow"
                onClick={() => toggleRow(flow.id)}
              >
                <Icon as={isExpanded ? FiChevronUp : FiChevronDown} />
              </IconButton>
            )}
            {flow.isRequired ? (
              <Badge colorPalette="red" size="sm">
                {t('admin.eventFlows.required')}
              </Badge>
            ) : (
              <Badge colorPalette="gray" variant="outline" size="sm">
                {t('admin.eventFlows.optional')}
              </Badge>
            )}
            {hasCond && (
              <Badge colorPalette="yellow" variant="solid" size="sm">
                <HStack gap={0.5}>
                  <Icon as={FiZap} boxSize={3} />
                </HStack>
              </Badge>
            )}
            <Badge colorPalette={flow.isActive ? 'green' : 'gray'} size="sm">
              {flow.isActive ? t('admin.common.active') : t('admin.common.inactive')}
            </Badge>
            <IconButton
              aria-label={t('admin.common.edit')}
              variant="ghost"
              size="xs"
              onClick={() => handleEditFlow(flow)}
            >
              <Icon as={FiEdit2} />
            </IconButton>
            <IconButton
              aria-label={t('admin.common.delete')}
              variant="ghost"
              size="xs"
              colorPalette="red"
              onClick={() =>
                onFlowDeleted(
                  flow.id,
                  `${flow.fromEventCode || t('admin.eventFlows.startEvent')} → ${flow.toEventCode}`
                )
              }
            >
              <Icon as={FiTrash2} />
            </IconButton>
          </HStack>
        </Flex>
        {hasCond && isExpanded && (
          <Box px={4} py={2} bg="yellow.50" borderTopWidth="1px" borderColor="yellow.200">
            <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
              {t('admin.eventFlows.rawJson', 'Raw JSON')}:
            </Text>
            <Text fontSize="xs" fontFamily="mono" whiteSpace="pre-wrap" color="gray.700">
              {JSON.stringify(flow.conditions, null, 2)}
            </Text>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <VStack align="stretch" gap={3}>
      {error && (
        <Text color="red.500" fontSize="sm">
          {error}
        </Text>
      )}

      {/* Incoming transitions */}
      <Box>
        <Flex justify="space-between" align="center" mb={2}>
          <HStack gap={2}>
            <Icon as={FiArrowDown} color="green.500" />
            <Text fontWeight="medium" fontSize="sm" color={colors.textColor}>
              {t('admin.eventFlows.incoming', 'Entrantes')}
            </Text>
            <Badge colorPalette="green" variant="subtle" size="sm">
              {incoming.length}
            </Badge>
          </HStack>
          <Button
            size="xs"
            variant="ghost"
            colorPalette="green"
            onClick={() => handleCreateFlow('incoming')}
            disabled={showFlowForm}
          >
            <FiPlus />
          </Button>
        </Flex>
        {incoming.length === 0 ? (
          <Text fontSize="xs" color={colors.textColorSecondary} pl={6}>
            {t('admin.eventFlows.noIncoming', 'No hay transiciones entrantes')}
          </Text>
        ) : (
          <Box
            borderWidth="1px"
            borderColor={colors.borderColor}
            borderRadius="md"
            overflow="hidden"
          >
            {incoming.map(renderFlowRow)}
          </Box>
        )}
      </Box>

      {/* Outgoing transitions */}
      <Box>
        <Flex justify="space-between" align="center" mb={2}>
          <HStack gap={2}>
            <Icon as={FiArrowRight} color="blue.500" />
            <Text fontWeight="medium" fontSize="sm" color={colors.textColor}>
              {t('admin.eventFlows.outgoing', 'Salientes')}
            </Text>
            <Badge colorPalette="blue" variant="subtle" size="sm">
              {outgoing.length}
            </Badge>
          </HStack>
          <Button
            size="xs"
            variant="ghost"
            colorPalette="blue"
            onClick={() => handleCreateFlow('outgoing')}
            disabled={showFlowForm}
          >
            <FiPlus />
          </Button>
        </Flex>
        {outgoing.length === 0 ? (
          <Text fontSize="xs" color={colors.textColorSecondary} pl={6}>
            {t('admin.eventFlows.noOutgoing', 'No hay transiciones salientes')}
          </Text>
        ) : (
          <Box
            borderWidth="1px"
            borderColor={colors.borderColor}
            borderRadius="md"
            overflow="hidden"
          >
            {outgoing.map(renderFlowRow)}
          </Box>
        )}
      </Box>

      {/* Flow Form (inline) */}
      {showFlowForm && (
        <Card.Root bg={colors.cardBg} borderColor={colors.borderColor} size="sm">
          <Card.Header py={2}>
            <Flex justify="space-between" align="center">
              <Heading size="xs" color={colors.textColor}>
                {editingFlowId
                  ? t('admin.eventFlows.editTitle')
                  : t('admin.eventFlows.createTitle')}
              </Heading>
              <IconButton
                aria-label="Close"
                variant="ghost"
                size="sm"
                onClick={handleCancelFlow}
              >
                <Icon as={FiX} />
              </IconButton>
            </Flex>
          </Card.Header>
          <Card.Body pt={0}>
            <VStack gap={3} align="stretch">
              {/* From / To */}
              <HStack gap={4} flexWrap="wrap" align="center">
                <Field.Root flex="1" minW="200px">
                  <Field.Label fontSize="sm">{t('admin.eventFlows.fromEvent')}</Field.Label>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      value={flowForm.fromEventCode || ''}
                      onChange={(e) =>
                        setFlowForm({
                          ...flowForm,
                          fromEventCode: e.target.value || undefined,
                        })
                      }
                    >
                      {eventCodeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Field.Root>
                <Flex align="center" pt={5}>
                  <Icon as={FiArrowRight} boxSize={5} color="blue.500" />
                </Flex>
                <Field.Root flex="1" minW="200px" required>
                  <Field.Label fontSize="sm">{t('admin.eventFlows.toEvent')}</Field.Label>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      value={flowForm.toEventCode}
                      onChange={(e) =>
                        setFlowForm({ ...flowForm, toEventCode: e.target.value })
                      }
                    >
                      <option value="">
                        {t('admin.eventFlows.selectTargetEvent', 'Select target event...')}
                      </option>
                      {eventTypes.map((et) => (
                        <option key={et.eventCode} value={et.eventCode}>
                          {et.eventCode} - {et.eventName}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Field.Root>
              </HStack>

              {/* Stage */}
              <Field.Root>
                <Field.Label fontSize="sm">
                  {t('admin.eventFlows.conditionExpression')}
                </Field.Label>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={flowForm.fromStage || ''}
                    onChange={(e) =>
                      setFlowForm({
                        ...flowForm,
                        fromStage: e.target.value || undefined,
                      })
                    }
                  >
                    <option value="">
                      {t('admin.eventFlows.noStageRestriction', 'No stage restriction')}
                    </option>
                    {stagesWithEmpty
                      .filter((s) => s)
                      .map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>

              {/* Label + sequence */}
              <HStack gap={4} flexWrap="wrap" align="start">
                <Field.Root flex="1" minW="200px">
                  <Field.Label fontSize="sm">{t('admin.eventFlows.transitionLabel')}</Field.Label>
                  <Input
                    size="sm"
                    value={flowForm.transitionLabel || ''}
                    onChange={(e) =>
                      setFlowForm({ ...flowForm, transitionLabel: e.target.value })
                    }
                  />
                </Field.Root>
                <Field.Root flex="0 0 100px">
                  <Field.Label fontSize="sm">{t('admin.eventFlows.sequenceOrder')}</Field.Label>
                  <Input
                    size="sm"
                    type="number"
                    value={flowForm.sequenceOrder || 0}
                    onChange={(e) =>
                      setFlowForm({
                        ...flowForm,
                        sequenceOrder: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </Field.Root>
              </HStack>

              {/* Conditions JSON */}
              <Box
                p={3}
                borderWidth="1px"
                borderRadius="md"
                borderColor="yellow.200"
                bg="yellow.50"
              >
                <HStack gap={2} mb={2}>
                  <Icon as={FiZap} color="yellow.600" boxSize={4} />
                  <Text fontWeight="semibold" fontSize="sm" color="yellow.800">
                    {t('admin.eventFlows.conditionSection', 'Conditional Display')}
                  </Text>
                </HStack>
                <Field.Root>
                  <Field.Label fontSize="xs">
                    {t('admin.eventFlows.conditionJson', 'Condition (JSON)')}
                  </Field.Label>
                  <Textarea
                    size="sm"
                    value={
                      flowForm.conditions
                        ? JSON.stringify(flowForm.conditions, null, 2)
                        : ''
                    }
                    onChange={(e) => {
                      try {
                        const parsed = e.target.value ? JSON.parse(e.target.value) : {};
                        setFlowForm({ ...flowForm, conditions: parsed });
                      } catch {
                        /* Invalid JSON */
                      }
                    }}
                    placeholder={'{\n  "fieldPath": "57A",\n  "operator": "EXISTS"\n}'}
                    rows={3}
                    fontFamily="mono"
                    fontSize="xs"
                    bg="white"
                  />
                </Field.Root>
                <HStack gap={2} mt={2}>
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="yellow"
                    onClick={() =>
                      setFlowForm({
                        ...flowForm,
                        conditions: { fieldPath: '57A', operator: 'EXISTS' },
                      })
                    }
                  >
                    {t('admin.eventFlows.presetHas57A', 'Has Field 57A')}
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => setFlowForm({ ...flowForm, conditions: {} })}
                  >
                    {t('admin.eventFlows.clearCondition', 'Clear')}
                  </Button>
                </HStack>
              </Box>

              {/* Flags */}
              <HStack gap={6} flexWrap="wrap">
                <Switch.Root
                  checked={flowForm.isActive}
                  onCheckedChange={(e) =>
                    setFlowForm({ ...flowForm, isActive: e.checked })
                  }
                >
                  <Switch.HiddenInput />
                  <Switch.Control />
                  <Switch.Label>{t('admin.common.active')}</Switch.Label>
                </Switch.Root>
                <Switch.Root
                  checked={flowForm.isRequired}
                  onCheckedChange={(e) =>
                    setFlowForm({
                      ...flowForm,
                      isRequired: e.checked,
                      isOptional: !e.checked,
                    })
                  }
                >
                  <Switch.HiddenInput />
                  <Switch.Control />
                  <Switch.Label>{t('admin.eventFlows.isRequired')}</Switch.Label>
                </Switch.Root>
                <Switch.Root
                  checked={flowForm.isOptional}
                  onCheckedChange={(e) =>
                    setFlowForm({
                      ...flowForm,
                      isOptional: e.checked,
                      isRequired: !e.checked,
                    })
                  }
                >
                  <Switch.HiddenInput />
                  <Switch.Control />
                  <Switch.Label>{t('admin.eventFlows.isOptional')}</Switch.Label>
                </Switch.Root>
              </HStack>

              {/* Actions */}
              <HStack gap={2} justify="flex-end">
                <Button size="sm" variant="outline" onClick={handleCancelFlow}>
                  {t('admin.common.cancel')}
                </Button>
                <Button
                  size="sm"
                  colorPalette="blue"
                  onClick={handleSaveFlow}
                  loading={savingFlow}
                  disabled={!flowForm.toEventCode}
                >
                  <Icon as={FiSave} mr={1} />
                  {editingFlowId ? t('admin.common.update') : t('admin.common.create')}
                </Button>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
};

export default EventTransitionsSection;
