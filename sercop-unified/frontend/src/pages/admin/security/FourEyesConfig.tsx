import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Badge,
  Icon,
  Collapsible,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogBackdrop,
  DialogCloseTrigger,
  DialogActionTrigger,
} from '@chakra-ui/react';
import { Field } from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { NumberInputRoot, NumberInputInput } from '@chakra-ui/react/number-input';
import { Switch } from '@chakra-ui/react/switch';
import { CheckboxRoot, CheckboxControl, CheckboxLabel } from '@chakra-ui/react/checkbox';
import { Tooltip } from '@chakra-ui/react/tooltip';
import {
  LuEye,
  LuPencil,
  LuPlus,
  LuInfo,
  LuSave,
  LuChevronDown,
  LuChevronRight,
  LuCircleCheck,
  LuTarget,
  LuLightbulb,
} from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import { DataTable, type DataTableColumn, type DataTableAction } from '../../../components/ui/DataTable';

interface FourEyesConfigProps {
  configs: any[];
  onSave: (config: any) => void;
  isSaving: boolean;
}

const ENTITY_TYPES = [
  'LC_IMPORT',
  'LC_EXPORT',
  'STANDBY_LC',
  'BANK_GUARANTEE',
  'COLLECTION',
  'PAYMENT',
  'USER',
  'PERMISSION',
  'ROLE',
];

const ACTION_TYPES = [
  'APPROVE',
  'AMEND',
  'CANCEL',
  'RELEASE',
  'CREATE',
  'DELETE',
  'MODIFY',
  'ROLE_ASSIGN',
];

export default function FourEyesConfig({ configs, onSave, isSaving }: FourEyesConfigProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showFourEyesInfo, setShowFourEyesInfo] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [formData, setFormData] = useState({
    entityType: '',
    actionType: '',
    isEnabled: true,
    minApprovers: 1,
    amountThreshold: null as number | null,
    requireDifferentDepartment: false,
    requireHigherRole: false,
  });

  const handleEdit = (config: any) => {
    setEditingConfig(config);
    setFormData({
      entityType: config.entityType,
      actionType: config.actionType,
      isEnabled: config.isEnabled,
      minApprovers: config.minApprovers,
      amountThreshold: config.amountThreshold,
      requireDifferentDepartment: config.requireDifferentDepartment,
      requireHigherRole: config.requireHigherRole,
    });
    setIsOpen(true);
  };

  const handleAdd = () => {
    setEditingConfig(null);
    setFormData({
      entityType: '',
      actionType: '',
      isEnabled: true,
      minApprovers: 1,
      amountThreshold: null,
      requireDifferentDepartment: false,
      requireHigherRole: false,
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    onSave({
      ...(editingConfig ? { id: editingConfig.id } : {}),
      ...formData,
    });
    setIsOpen(false);
  };

  const handleToggle = (config: any, enabled: boolean) => {
    onSave({
      id: config.id,
      entityType: config.entityType,
      actionType: config.actionType,
      isEnabled: enabled,
    });
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const columns: DataTableColumn<any>[] = [
    {
      key: 'entityType',
      label: t('securityConfig.fourEyes.entityType'),
      filterType: 'select',
      filterOptions: ENTITY_TYPES.map((type) => ({ value: type, label: type })),
      render: (row) => <Badge colorPalette="blue">{row.entityType}</Badge>,
    },
    {
      key: 'actionType',
      label: t('securityConfig.fourEyes.actionType'),
      filterType: 'select',
      filterOptions: ACTION_TYPES.map((type) => ({ value: type, label: type })),
      render: (row) => <Badge colorPalette="purple">{row.actionType}</Badge>,
    },
    {
      key: 'minApprovers',
      label: t('securityConfig.fourEyes.minApprovers'),
      render: (row) => <Text>{row.minApprovers}</Text>,
    },
    {
      key: 'amountThreshold',
      label: t('securityConfig.fourEyes.amountThreshold'),
      render: (row) => <Text>{formatAmount(row.amountThreshold)}</Text>,
    },
    {
      key: 'requirements',
      label: t('securityConfig.fourEyes.requirements'),
      sortable: false,
      filterable: false,
      render: (row) => (
        <HStack gap={1}>
          {row.requireDifferentDepartment && (
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Badge colorPalette="orange" fontSize="xs" cursor="pointer">Dept</Badge>
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content>
                  {t('securityConfig.fourEyes.diffDeptRequired')}
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          )}
          {row.requireHigherRole && (
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Badge colorPalette="red" fontSize="xs" cursor="pointer">Role</Badge>
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content>
                  {t('securityConfig.fourEyes.higherRoleRequired')}
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          )}
          {!row.requireDifferentDepartment && !row.requireHigherRole && (
            <Text color="gray.400" fontSize="sm">-</Text>
          )}
        </HStack>
      ),
    },
    {
      key: 'isEnabled',
      label: t('common.enabled'),
      sortable: false,
      filterable: false,
      render: (row) => (
        <Switch.Root
          checked={row.isEnabled}
          onCheckedChange={(e) => handleToggle(row, e.checked)}
          colorPalette="green"
        >
          <Switch.HiddenInput />
          <Switch.Control />
        </Switch.Root>
      ),
    },
  ];

  const tableActions: DataTableAction<any>[] = [
    {
      key: 'edit',
      label: t('common.edit', 'Editar'),
      icon: LuPencil,
      onClick: (row) => handleEdit(row),
    },
  ];

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between">
        <Box>
          <HStack mb={2}>
            <Icon as={LuEye} boxSize={5} color="blue.500" />
            <Heading size="md">{t('securityConfig.fourEyes.title')}</Heading>
          </HStack>
          <Text color="gray.500" fontSize="sm">
            {t('securityConfig.fourEyes.description')}
          </Text>
        </Box>
        <Button colorPalette="blue" onClick={handleAdd}>
          <LuPlus style={{ marginRight: '8px' }} />
          {t('securityConfig.fourEyes.addRule')}
        </Button>
      </HStack>

      {/* Four Eyes Info Panel */}
      <Box
        bg="teal.50"
        border="1px solid"
        borderColor="teal.200"
        borderRadius="lg"
        overflow="hidden"
      >
        <Box
          p={4}
          cursor="pointer"
          onClick={() => setShowFourEyesInfo(!showFourEyesInfo)}
          _hover={{ bg: 'teal.100' }}
          transition="background 0.2s"
        >
          <HStack justify="space-between">
            <HStack gap={3}>
              <Icon as={LuInfo} color="teal.500" boxSize={5} />
              <Box>
                <Text fontWeight="semibold" color="teal.700">
                  {t('securityConfig.fourEyes.tooltip.title')}
                </Text>
                <Text fontSize="sm" color="teal.600">
                  {t('securityConfig.fourEyes.tooltip.description')}
                </Text>
              </Box>
            </HStack>
            <Icon as={showFourEyesInfo ? LuChevronDown : LuChevronRight} color="teal.500" boxSize={5} />
          </HStack>
        </Box>
        <Collapsible.Root open={showFourEyesInfo}>
          <Collapsible.Content>
            <Box px={4} pb={4}>
              <VStack align="stretch" gap={4}>
                {/* Benefits */}
                <Box>
                  <HStack mb={2}>
                    <Icon as={LuCircleCheck} color="green.500" boxSize={4} />
                    <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                      {t('securityConfig.fourEyes.tooltip.benefits.title')}
                    </Text>
                  </HStack>
                  <VStack align="stretch" gap={1} pl={6}>
                    <Text fontSize="sm" color="gray.600">• {t('securityConfig.fourEyes.tooltip.benefits.fraud')}</Text>
                    <Text fontSize="sm" color="gray.600">• {t('securityConfig.fourEyes.tooltip.benefits.errors')}</Text>
                    <Text fontSize="sm" color="gray.600">• {t('securityConfig.fourEyes.tooltip.benefits.compliance')}</Text>
                    <Text fontSize="sm" color="gray.600">• {t('securityConfig.fourEyes.tooltip.benefits.accountability')}</Text>
                  </VStack>
                </Box>

                {/* Use Cases */}
                <Box>
                  <HStack mb={2}>
                    <Icon as={LuTarget} color="purple.500" boxSize={4} />
                    <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                      {t('securityConfig.fourEyes.tooltip.useCases.title')}
                    </Text>
                  </HStack>
                  <VStack align="stretch" gap={1} pl={6}>
                    <Text fontSize="sm" color="gray.600">• {t('securityConfig.fourEyes.tooltip.useCases.lcApproval')}</Text>
                    <Text fontSize="sm" color="gray.600">• {t('securityConfig.fourEyes.tooltip.useCases.payments')}</Text>
                    <Text fontSize="sm" color="gray.600">• {t('securityConfig.fourEyes.tooltip.useCases.userManagement')}</Text>
                    <Text fontSize="sm" color="gray.600">• {t('securityConfig.fourEyes.tooltip.useCases.configChanges')}</Text>
                  </VStack>
                </Box>

                {/* Tips */}
                <Box bg="yellow.50" p={3} borderRadius="md" border="1px solid" borderColor="yellow.200">
                  <HStack mb={1}>
                    <Icon as={LuLightbulb} color="yellow.600" boxSize={4} />
                    <Text fontWeight="semibold" fontSize="sm" color="yellow.700">Tips</Text>
                  </HStack>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="yellow.700">💡 {t('securityConfig.fourEyes.tooltip.thresholdTip')}</Text>
                    <Text fontSize="sm" color="yellow.700">💡 {t('securityConfig.fourEyes.tooltip.departmentTip')}</Text>
                  </VStack>
                </Box>
              </VStack>
            </Box>
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>

      {/* Table */}
      <DataTable<any>
        data={configs}
        columns={columns}
        rowKey={(row) => String(row.id)}
        actions={tableActions}
        emptyMessage={t('securityConfig.fourEyes.noRules', 'No hay reglas configuradas')}
        defaultPageSize={10}
      />

      {/* Edit/Add Dialog */}
      <DialogRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
        <DialogBackdrop />
        <DialogContent maxW="lg">
          <DialogHeader>
            <DialogTitle>
              {editingConfig
                ? t('securityConfig.fourEyes.editRule')
                : t('securityConfig.fourEyes.addRule')}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={4}>
              <Field.Root required>
                <Field.Label>{t('securityConfig.fourEyes.entityType')}</Field.Label>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={formData.entityType}
                    onChange={(e) => setFormData(prev => ({ ...prev, entityType: e.target.value }))}
                  >
                    <option value="">{t('common.select')}</option>
                    {ENTITY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </NativeSelectField>
                </NativeSelectRoot>
              </Field.Root>

              <Field.Root required>
                <Field.Label>{t('securityConfig.fourEyes.actionType')}</Field.Label>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={formData.actionType}
                    onChange={(e) => setFormData(prev => ({ ...prev, actionType: e.target.value }))}
                  >
                    <option value="">{t('common.select')}</option>
                    {ACTION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </NativeSelectField>
                </NativeSelectRoot>
              </Field.Root>

              <Field.Root>
                <Field.Label>{t('securityConfig.fourEyes.minApprovers')}</Field.Label>
                <NumberInputRoot
                  value={String(formData.minApprovers)}
                  onValueChange={(e) => setFormData(prev => ({ ...prev, minApprovers: Number(e.value) }))}
                  min={1}
                  max={5}
                >
                  <NumberInputInput />
                </NumberInputRoot>
              </Field.Root>

              <Field.Root>
                <Field.Label>{t('securityConfig.fourEyes.amountThreshold')}</Field.Label>
                <NumberInputRoot
                  value={formData.amountThreshold ? String(formData.amountThreshold) : ''}
                  onValueChange={(e) => setFormData(prev => ({ ...prev, amountThreshold: e.value ? Number(e.value) : null }))}
                  min={0}
                >
                  <NumberInputInput placeholder="Optional - USD" />
                </NumberInputRoot>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {t('securityConfig.fourEyes.amountHelp')}
                </Text>
              </Field.Root>

              <CheckboxRoot
                checked={formData.requireDifferentDepartment}
                onCheckedChange={(e) => setFormData(prev => ({
                  ...prev,
                  requireDifferentDepartment: !!e.checked,
                }))}
              >
                <CheckboxControl />
                <CheckboxLabel>{t('securityConfig.fourEyes.requireDiffDept')}</CheckboxLabel>
              </CheckboxRoot>

              <CheckboxRoot
                checked={formData.requireHigherRole}
                onCheckedChange={(e) => setFormData(prev => ({
                  ...prev,
                  requireHigherRole: !!e.checked,
                }))}
              >
                <CheckboxControl />
                <CheckboxLabel>{t('securityConfig.fourEyes.requireHigherRole')}</CheckboxLabel>
              </CheckboxRoot>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="ghost" mr={3}>
                {t('common.cancel')}
              </Button>
            </DialogActionTrigger>
            <Button
              colorPalette="blue"
              onClick={handleSave}
              loading={isSaving}
            >
              <LuSave style={{ marginRight: '8px' }} />
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </VStack>
  );
}
