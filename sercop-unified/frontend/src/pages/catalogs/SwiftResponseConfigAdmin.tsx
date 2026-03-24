/**
 * SwiftResponseConfigAdmin - Admin page for managing SWIFT response configurations
 * Defines expected responses for outbound SWIFT messages and timeout rules
 */
import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Badge,
  Icon,
  Heading,
  Card,
  Button,
  Input,
  Textarea,
  Field,
  Switch,
  NativeSelect,
  IconButton,
  Alert,
  Dialog,
  Portal,
  Separator,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSave,
  FiX,
  FiAlertTriangle,
  FiInfo,
  FiCheck,
  FiFilter,
  FiRefreshCw,
  FiClock,
  FiAlertCircle,
  FiMail,
  FiSend,
  FiInbox,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { eventConfigApi, eventConfigCommands } from '../../services/operationsApi';
import type { EventTypeConfig, SwiftResponseConfig, SwiftResponseConfigCommand } from '../../types/operations';
import { DataTable, type DataTableColumn, type DataTableAction } from '../../components/ui/DataTable';

// Operation types
const operationTypes = [
  { value: 'LC_IMPORT', label: 'LC Import' },
  { value: 'LC_EXPORT', label: 'LC Export' },
  { value: 'GUARANTEE', label: 'Guarantee' },
  { value: 'COLLECTION', label: 'Collection' },
];

// Common SWIFT message types by category
const swiftMessageTypes = {
  outbound: [
    { type: 'MT700', desc: 'Issue of a Documentary Credit' },
    { type: 'MT707', desc: 'Amendment to Documentary Credit' },
    { type: 'MT710', desc: 'Advice of Third Banks Documentary Credit' },
    { type: 'MT720', desc: 'Transfer of a Documentary Credit' },
    { type: 'MT740', desc: 'Authorization to Reimburse' },
    { type: 'MT750', desc: 'Advice of Discrepancy' },
    { type: 'MT752', desc: 'Authorization to Pay, Accept or Negotiate' },
    { type: 'MT760', desc: 'Guarantee' },
    { type: 'MT765', desc: 'Guarantee Amendment' },
    { type: 'MT767', desc: 'Guarantee Amendment Response' },
    { type: 'MT799', desc: 'Free Format Message' },
    { type: 'MT400', desc: 'Advice of Payment' },
    { type: 'MT410', desc: 'Acknowledgement' },
    { type: 'MT412', desc: 'Advice of Acceptance' },
    { type: 'MT416', desc: 'Advice of Non-Payment/Non-Acceptance' },
  ],
  response: [
    { type: 'MT730', desc: 'Acknowledgement' },
    { type: 'MT732', desc: 'Advice of Discharge' },
    { type: 'MT734', desc: 'Advice of Refusal' },
    { type: 'MT742', desc: 'Reimbursement Claim' },
    { type: 'MT747', desc: 'Amendment to Authorization to Reimburse' },
    { type: 'MT754', desc: 'Advice of Payment/Acceptance/Negotiation' },
    { type: 'MT756', desc: 'Advice of Reimbursement or Payment' },
    { type: 'MT768', desc: 'Acknowledgement of Guarantee' },
    { type: 'MT769', desc: 'Advice of Reduction/Release' },
    { type: 'MT799', desc: 'Free Format Message' },
    { type: 'MT405', desc: 'Clean Collection' },
    { type: 'MT420', desc: 'Tracer' },
    { type: 'MT422', desc: 'Advice of Fate and Request for Instructions' },
    { type: 'MT430', desc: 'Amendment of Instructions' },
  ],
};

const emptyForm: SwiftResponseConfigCommand = {
  sentMessageType: '',
  operationType: 'LC_IMPORT',
  expectedResponseType: '',
  responseEventCode: '',
  expectedResponseDays: 5,
  alertAfterDays: 3,
  escalateAfterDays: 7,
  language: 'en',
  responseDescription: '',
  timeoutMessage: '',
  isActive: true,
};

export const SwiftResponseConfigAdmin = () => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const [responseConfigs, setResponseConfigs] = useState<SwiftResponseConfig[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [selectedOperationType, setSelectedOperationType] = useState<string>('LC_IMPORT');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SwiftResponseConfigCommand>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null; label: string }>({
    open: false,
    id: null,
    label: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedOperationType, selectedLanguage]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [configs, types] = await Promise.all([
        eventConfigApi.getResponseConfigs(selectedOperationType, selectedLanguage),
        eventConfigApi.getEventTypes(selectedOperationType, selectedLanguage),
      ]);
      setResponseConfigs(configs);
      setEventTypes(types);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load response configurations');
    } finally {
      setLoading(false);
    }
  };

  // Event code options for linking response to events
  const eventCodeOptions = useMemo(() => {
    return [
      { value: '', label: 'No linked event' },
      ...eventTypes.map((et) => ({
        value: et.eventCode,
        label: `${et.eventCode} - ${et.eventName}`,
      })),
    ];
  }, [eventTypes]);

  const handleCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, operationType: selectedOperationType, language: selectedLanguage });
    setShowForm(true);
  };

  const handleEdit = (config: SwiftResponseConfig) => {
    setEditingId(config.id);
    setForm({
      sentMessageType: config.sentMessageType,
      operationType: config.operationType,
      expectedResponseType: config.expectedResponseType,
      responseEventCode: config.responseEventCode || '',
      expectedResponseDays: config.expectedResponseDays,
      alertAfterDays: config.alertAfterDays,
      escalateAfterDays: config.escalateAfterDays,
      language: config.language,
      responseDescription: config.responseDescription || '',
      timeoutMessage: config.timeoutMessage || '',
      isActive: config.isActive,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (editingId) {
        await eventConfigCommands.updateResponseConfig(editingId, form);
        setSuccess('Response configuration updated successfully');
      } else {
        await eventConfigCommands.createResponseConfig(form);
        setSuccess('Response configuration created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save response configuration';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    setError(null);
    setSuccess(null);
    try {
      await eventConfigCommands.deleteResponseConfig(deleteConfirm.id);
      setSuccess('Response configuration deleted successfully');
      setDeleteConfirm({ open: false, id: null, label: '' });
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete response configuration';
      setError(errorMessage);
      setDeleteConfirm({ open: false, id: null, label: '' });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const getMessageDescription = (type: string, category: 'outbound' | 'response'): string => {
    const msg = swiftMessageTypes[category].find((m) => m.type === type);
    return msg ? msg.desc : type;
  };

  // DataTable columns
  const tableColumns: DataTableColumn<SwiftResponseConfig>[] = [
    {
      key: 'sentMessageType',
      label: t('admin.swiftResponses.sentMessage'),
      render: (row) => (
        <VStack align="start" gap={0}>
          <Badge colorPalette="blue" size="sm">{row.sentMessageType}</Badge>
          <Text fontSize="xs" color={colors.textColor} opacity={0.7}>
            {getMessageDescription(row.sentMessageType, 'outbound')}
          </Text>
        </VStack>
      ),
    },
    {
      key: 'expectedResponseType',
      label: t('admin.swiftResponses.expectedResponse'),
      render: (row) => (
        <VStack align="start" gap={0}>
          <Badge colorPalette="green" size="sm">{row.expectedResponseType}</Badge>
          <Text fontSize="xs" color={colors.textColor} opacity={0.7}>
            {getMessageDescription(row.expectedResponseType, 'response')}
          </Text>
        </VStack>
      ),
    },
    {
      key: 'responseEventCode',
      label: t('admin.swiftResponses.expectedResponse'),
      render: (row) =>
        row.responseEventCode ? (
          <Badge colorPalette="purple" variant="subtle" size="sm">
            {row.responseEventCode}
          </Badge>
        ) : (
          <Text fontSize="sm" color={colors.textColor} opacity={0.5}>-</Text>
        ),
    },
    {
      key: 'expectedResponseDays',
      label: t('admin.swiftResponses.responseDays'),
      render: (row) => (
        <HStack gap={1}>
          <Icon as={FiClock} color="blue.500" />
          <Text fontSize="sm">{row.expectedResponseDays}d</Text>
        </HStack>
      ),
    },
    {
      key: 'alertAfterDays',
      label: t('admin.swiftResponses.alert'),
      render: (row) => (
        <HStack gap={1}>
          <Icon as={FiAlertCircle} color="orange.500" />
          <Text fontSize="sm">{row.alertAfterDays}d</Text>
        </HStack>
      ),
    },
    {
      key: 'escalateAfterDays',
      label: t('admin.swiftResponses.escalate'),
      render: (row) => (
        <HStack gap={1}>
          <Icon as={FiAlertTriangle} color="red.500" />
          <Text fontSize="sm">{row.escalateAfterDays}d</Text>
        </HStack>
      ),
    },
    {
      key: 'isActive',
      label: t('admin.common.status'),
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: t('admin.common.active') },
        { value: 'false', label: t('admin.common.inactive') },
      ],
      render: (row) => (
        <Badge colorPalette={row.isActive ? 'green' : 'gray'} size="sm">
          {row.isActive ? t('admin.common.active') : t('admin.common.inactive')}
        </Badge>
      ),
    },
  ];

  // DataTable actions
  const tableActions: DataTableAction<SwiftResponseConfig>[] = [
    {
      key: 'edit',
      label: t('admin.common.edit'),
      icon: FiEdit2,
      onClick: (row) => handleEdit(row),
    },
    {
      key: 'delete',
      label: t('admin.common.delete'),
      icon: FiTrash2,
      colorPalette: 'red',
      onClick: (row) => setDeleteConfirm({
        open: true,
        id: row.id,
        label: `${row.sentMessageType} → ${row.expectedResponseType}`,
      }),
    },
  ];

  return (
    <Box p={6}>
      {/* Header */}
      <VStack align="stretch" gap={6}>
        <Flex justify="space-between" align="center">
          <VStack align="start" gap={1}>
            <Heading size="lg" color={colors.textColor}>
              {t('admin.swiftResponses.title')}
            </Heading>
            <Text color={colors.textColor} opacity={0.7}>
              {t('admin.swiftResponses.sectionDescription')}
            </Text>
          </VStack>
          <Button
            colorPalette="blue"
            onClick={handleCreate}
            disabled={showForm}
          >
            <Icon as={FiPlus} mr={2} />
            {t('admin.swiftResponses.addNew')}
          </Button>
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

        {/* Info Box */}
        <Alert.Root status="info">
          <Alert.Indicator>
            <Icon as={FiInfo} />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>{t('admin.swiftResponses.importantNotes')}</Alert.Title>
            <Alert.Description>
              <VStack align="start" gap={1} mt={2}>
                <Text fontSize="sm">1. {t('admin.swiftResponses.note1')}</Text>
                <Text fontSize="sm">2. {t('admin.swiftResponses.note2')}</Text>
                <Text fontSize="sm">3. {t('admin.swiftResponses.note3')}</Text>
                <Text fontSize="sm">4. {t('admin.swiftResponses.note4')}</Text>
              </VStack>
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>

        {/* Visual Guide - Message Flow */}
        <Card.Root bg={colors.cardBg} borderColor={colors.borderColor}>
          <Card.Header>
            <HStack gap={2}>
              <Icon as={FiMail} color={colors.textColor} />
              <Heading size="sm" color={colors.textColor}>
                SWIFT Message Response Flow
              </Heading>
            </HStack>
          </Card.Header>
          <Card.Body>
            <Flex justify="center" align="center" gap={4} py={4} flexWrap="wrap">
              <VStack>
                <Flex
                  w="80px"
                  h="80px"
                  borderRadius="lg"
                  bg="blue.100"
                  alignItems="center"
                  justifyContent="center"
                  flexDirection="column"
                >
                  <Icon as={FiSend} boxSize={8} color="blue.600" />
                  <Text fontSize="xs" fontWeight="bold" color="blue.700">SEND</Text>
                </Flex>
                <Text fontSize="sm" color={colors.textColor}>Outbound Message</Text>
                <Text fontSize="xs" color={colors.textColor} opacity={0.7}>(e.g., MT700)</Text>
              </VStack>

              <VStack gap={1}>
                <HStack gap={1}>
                  <Box w="40px" h="2px" bg="blue.300" />
                  <Icon as={FiClock} color="orange.500" boxSize={6} />
                  <Box w="40px" h="2px" bg="green.300" />
                </HStack>
                <Text fontSize="xs" color="orange.600" fontWeight="medium">
                  Waiting for Response
                </Text>
                <Text fontSize="xs" color={colors.textColor} opacity={0.7}>
                  Alert after X days
                </Text>
              </VStack>

              <VStack>
                <Flex
                  w="80px"
                  h="80px"
                  borderRadius="lg"
                  bg="green.100"
                  alignItems="center"
                  justifyContent="center"
                  flexDirection="column"
                >
                  <Icon as={FiInbox} boxSize={8} color="green.600" />
                  <Text fontSize="xs" fontWeight="bold" color="green.700">RECEIVE</Text>
                </Flex>
                <Text fontSize="sm" color={colors.textColor}>Expected Response</Text>
                <Text fontSize="xs" color={colors.textColor} opacity={0.7}>(e.g., MT730)</Text>
              </VStack>
            </Flex>
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

        {/* Form */}
        {showForm && (
          <Card.Root bg={colors.cardBg} borderColor={colors.borderColor}>
            <Card.Header>
              <Flex justify="space-between" align="center">
                <Heading size="sm" color={colors.textColor}>
                  {editingId ? t('admin.swiftResponses.editTitle') : t('admin.swiftResponses.createTitle')}
                </Heading>
                <IconButton
                  aria-label="Close"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                >
                  <Icon as={FiX} />
                </IconButton>
              </Flex>
            </Card.Header>
            <Card.Body>
              <VStack gap={4} align="stretch">
                {/* Message Types */}
                <Heading size="xs" color={colors.textColor}>{t('admin.swiftResponses.sentMessage')}</Heading>
                <HStack gap={4} flexWrap="wrap" align="start">
                  <Field.Root flex="1" minW="250px" required>
                    <Field.Label>{t('admin.swiftResponses.sentMessage')}</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        value={form.sentMessageType}
                        onChange={(e) => setForm({ ...form, sentMessageType: e.target.value })}
                      >
                        <option value="">Select outbound message...</option>
                        {swiftMessageTypes.outbound.map((msg) => (
                          <option key={msg.type} value={msg.type}>
                            {msg.type} - {msg.desc}
                          </option>
                        ))}
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                    <Field.HelperText>{t('admin.swiftResponses.sentMessageHelper')}</Field.HelperText>
                  </Field.Root>

                  <Field.Root flex="1" minW="250px" required>
                    <Field.Label>{t('admin.swiftResponses.expectedResponse')}</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        value={form.expectedResponseType}
                        onChange={(e) => setForm({ ...form, expectedResponseType: e.target.value })}
                      >
                        <option value="">Select expected response...</option>
                        {swiftMessageTypes.response.map((msg) => (
                          <option key={msg.type} value={msg.type}>
                            {msg.type} - {msg.desc}
                          </option>
                        ))}
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                    <Field.HelperText>{t('admin.swiftResponses.expectedResponseHelper')}</Field.HelperText>
                  </Field.Root>
                </HStack>

                {/* Linked Event */}
                <Field.Root>
                  <Field.Label>{t('admin.swiftResponses.expectedResponse')}</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={form.responseEventCode || ''}
                      onChange={(e) => setForm({ ...form, responseEventCode: e.target.value || undefined })}
                    >
                      {eventCodeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                  <Field.HelperText>
                    {t('admin.swiftResponses.expectedResponseHelper')}
                  </Field.HelperText>
                </Field.Root>

                <Separator />

                {/* Timing Rules */}
                <Heading size="xs" color={colors.textColor}>{t('admin.swiftResponses.responseDays')}</Heading>
                <HStack gap={4} flexWrap="wrap" align="start">
                  <Field.Root flex="1" minW="150px">
                    <Field.Label>{t('admin.swiftResponses.responseDays')}</Field.Label>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={form.expectedResponseDays || 5}
                      onChange={(e) => setForm({ ...form, expectedResponseDays: parseInt(e.target.value) || 5 })}
                    />
                    <Field.HelperText>{t('admin.swiftResponses.responseDaysHelper')}</Field.HelperText>
                  </Field.Root>

                  <Field.Root flex="1" minW="150px">
                    <Field.Label>{t('admin.swiftResponses.alertDays')}</Field.Label>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={form.alertAfterDays || 3}
                      onChange={(e) => setForm({ ...form, alertAfterDays: parseInt(e.target.value) || 3 })}
                    />
                    <Field.HelperText>{t('admin.swiftResponses.alertDaysHelper')}</Field.HelperText>
                  </Field.Root>

                  <Field.Root flex="1" minW="150px">
                    <Field.Label>{t('admin.swiftResponses.escalateDays')}</Field.Label>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={form.escalateAfterDays || 7}
                      onChange={(e) => setForm({ ...form, escalateAfterDays: parseInt(e.target.value) || 7 })}
                    />
                    <Field.HelperText>{t('admin.swiftResponses.escalateDaysHelper')}</Field.HelperText>
                  </Field.Root>
                </HStack>

                <Separator />

                {/* Messages */}
                <Heading size="xs" color={colors.textColor}>{t('admin.swiftResponses.responseDescription')}</Heading>
                <Field.Root>
                  <Field.Label>{t('admin.swiftResponses.responseDescription')}</Field.Label>
                  <Textarea
                    value={form.responseDescription || ''}
                    onChange={(e) => setForm({ ...form, responseDescription: e.target.value })}
                    placeholder={t('admin.swiftResponses.responseDescriptionPlaceholder')}
                    rows={2}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t('admin.swiftResponses.timeoutMessage')}</Field.Label>
                  <Textarea
                    value={form.timeoutMessage || ''}
                    onChange={(e) => setForm({ ...form, timeoutMessage: e.target.value })}
                    placeholder={t('admin.swiftResponses.timeoutMessagePlaceholder')}
                    rows={2}
                  />
                </Field.Root>

                <Separator />

                {/* Status */}
                <HStack gap={6}>
                  <Switch.Root
                    checked={form.isActive}
                    onCheckedChange={(e) => setForm({ ...form, isActive: e.checked })}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                    <Switch.Label>{t('admin.common.active')}</Switch.Label>
                  </Switch.Root>
                </HStack>

                {/* Actions */}
                <HStack gap={2} justify="flex-end" pt={4}>
                  <Button variant="outline" onClick={handleCancel}>
                    {t('admin.common.cancel')}
                  </Button>
                  <Button
                    colorPalette="blue"
                    onClick={handleSave}
                    loading={saving}
                    disabled={!form.sentMessageType || !form.expectedResponseType}
                  >
                    <Icon as={FiSave} mr={2} />
                    {editingId ? t('admin.common.update') : t('admin.common.create')}
                  </Button>
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* Table */}
        <DataTable<SwiftResponseConfig>
          data={responseConfigs}
          columns={tableColumns}
          rowKey={(row) => String(row.id)}
          actions={tableActions}
          isLoading={loading}
          emptyMessage={t('admin.swiftResponses.noResponses')}
          defaultPageSize={10}
          size="sm"
        />
      </VStack>

      {/* Delete Confirmation Dialog */}
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
                    <Alert.Indicator>
                      <Icon as={FiAlertTriangle} />
                    </Alert.Indicator>
                    <Alert.Content>
                      <Alert.Title>{t('admin.common.warning')}</Alert.Title>
                      <Alert.Description>
                        {t('admin.swiftResponses.deleteWarning')}
                      </Alert.Description>
                    </Alert.Content>
                  </Alert.Root>
                  <Text>
                    {t('admin.swiftResponses.deleteConfirmMessage', { label: deleteConfirm.label })}
                  </Text>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, id: null, label: '' })}>
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

export default SwiftResponseConfigAdmin;
