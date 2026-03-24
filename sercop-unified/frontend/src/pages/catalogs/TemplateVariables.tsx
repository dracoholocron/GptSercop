import { Box, Input, VStack, Text, Flex, Button, HStack, DialogRoot, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogBackdrop, DialogCloseTrigger, Grid, Badge, Spinner, DialogActionTrigger, Heading } from '@chakra-ui/react';
import { CheckboxRoot, CheckboxControl, CheckboxLabel } from '@chakra-ui/react/checkbox';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiCode, FiDatabase } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { get, post, put, del } from '../../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../../config/api.config';
import { notify } from '../../components/ui/toaster';
import { DataTable, type DataTableColumn, type DataTableAction } from '../../components/ui/DataTable';

interface TemplateVariable {
  id: number;
  code: string;
  labelKey: string;
  descriptionKey?: string;
  category: string;
  color: string;
  sourceTable: string;
  sourceColumn: string;
  dataType: string;
  formatPattern?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  createdBy?: string;
}

type FormData = Omit<TemplateVariable, 'id' | 'createdAt' | 'createdBy'>;

const DEFAULT_FORM: FormData = {
  code: '',
  labelKey: '',
  descriptionKey: '',
  category: 'OPERATION',
  color: 'blue',
  sourceTable: 'operation_readmodel',
  sourceColumn: '',
  dataType: 'STRING',
  formatPattern: '',
  displayOrder: 0,
  isActive: true,
};

const COLORS = ['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'cyan', 'teal', 'pink', 'gray'];
const CATEGORIES = ['OPERATION', 'AMOUNTS', 'APPLICANT', 'BENEFICIARY', 'BANKS', 'DATES', 'USER', 'SWIFT'];
const DATA_TYPES = ['STRING', 'NUMBER', 'DATE', 'DATETIME', 'BOOLEAN', 'CURRENCY'];
const SOURCE_TABLES = [
  'operation_readmodel',
  'participant_read_model',
  'financial_institution_readmodel',
  'swift_message_readmodel',
  'user_table',
  'context',
];

export const TemplateVariablesPage = () => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const { bgColor, borderColor, cardBg, textColor, textColorSecondary, primaryColor } = getColors();

  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<TemplateVariable | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);

  useEffect(() => { loadVariables(); }, []);

  const loadVariables = async () => {
    try {
      setLoading(true);
      const response = await get(`${API_BASE_URL}/v1/admin/template-variables`);
      if (response.ok) {
        const data = await response.json();
        setVariables(data.data || []);
      } else {
        throw new Error('Failed to fetch');
      }
    } catch {
      notify.error(t('common.error'), t('common.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingVariable(null);
    setFormData(DEFAULT_FORM);
    setIsModalOpen(true);
  };

  const handleEdit = (variable: TemplateVariable) => {
    setEditingVariable(variable);
    setFormData({
      code: variable.code,
      labelKey: variable.labelKey,
      descriptionKey: variable.descriptionKey || '',
      category: variable.category,
      color: variable.color,
      sourceTable: variable.sourceTable,
      sourceColumn: variable.sourceColumn,
      dataType: variable.dataType,
      formatPattern: variable.formatPattern || '',
      displayOrder: variable.displayOrder,
      isActive: variable.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.labelKey || !formData.category) {
      notify.error(t('common.error'), t('templateVariables.requiredFields'));
      return;
    }

    try {
      setSaving(true);
      let response;
      if (editingVariable) {
        response = await put(`${API_BASE_URL}/v1/admin/template-variables/${editingVariable.id}`, formData);
      } else {
        response = await post(`${API_BASE_URL}/v1/admin/template-variables`, formData);
      }

      if (response.ok) {
        setIsModalOpen(false);
        loadVariables();
        notify.success(t('common.success'), editingVariable ? t('common.updated') : t('common.created'));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error');
      }
    } catch (e) {
      notify.error(t('common.error'), e instanceof Error ? e.message : t('common.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('common.confirmDelete'))) return;

    try {
      const response = await del(`${API_BASE_URL}/v1/admin/template-variables/${id}`);
      if (response.ok) {
        loadVariables();
        notify.success(t('common.success'), t('common.deleted'));
      } else {
        throw new Error('Delete failed');
      }
    } catch {
      notify.error(t('common.error'), t('common.deleteError'));
    }
  };

  const handleToggleActive = async (variable: TemplateVariable) => {
    try {
      const response = await post(`${API_BASE_URL}/v1/admin/template-variables/${variable.id}/toggle-active`, {});
      if (response.ok) {
        loadVariables();
        notify.success(t('common.success'), variable.isActive ? t('common.deactivated') : t('common.activated'));
      }
    } catch {
      notify.error(t('common.error'), t('common.updateError'));
    }
  };

  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      OPERATION: 'blue',
      AMOUNTS: 'green',
      APPLICANT: 'purple',
      BENEFICIARY: 'cyan',
      BANKS: 'orange',
      DATES: 'yellow',
      USER: 'pink',
      SWIFT: 'teal',
    };
    return colorMap[category] || 'gray';
  };

  const columns: DataTableColumn<TemplateVariable>[] = [
    {
      key: 'code', label: t('templateVariables.code'),
      render: (row) => (
        <HStack>
          <FiCode />
          <Badge colorPalette={getCategoryColor(row.category)}>#{'{' + row.code + '}'}</Badge>
        </HStack>
      ),
    },
    { key: 'labelKey', label: t('templateVariables.labelKey'), render: (row) => <Text title={row.descriptionKey || ''}>{row.labelKey}</Text>, hideOnMobile: true },
    {
      key: 'category', label: t('templateVariables.category'),
      filterType: 'select', filterOptions: CATEGORIES.map(cat => ({ value: cat, label: t(`templateVariables.categories.${cat}`) })),
      render: (row) => <Badge colorPalette={getCategoryColor(row.category)}>{t(`templateVariables.categories.${row.category}`)}</Badge>,
    },
    {
      key: 'sourceTable', label: t('templateVariables.sourceTable'), hideOnMobile: true,
      render: (row) => <HStack><FiDatabase size={12} /><Text>{row.sourceTable}</Text></HStack>,
    },
    { key: 'sourceColumn', label: t('templateVariables.sourceColumn'), hideOnMobile: true },
    {
      key: 'dataType', label: t('templateVariables.dataType'), hideOnMobile: true,
      render: (row) => <Badge variant="outline" colorPalette="gray">{row.dataType}</Badge>,
    },
    {
      key: 'isActive', label: t('common.status'),
      filterType: 'select', filterOptions: [{ value: 'true', label: t('common.active') }, { value: 'false', label: t('common.inactive') }],
      render: (row) => <Badge colorPalette={row.isActive ? 'green' : 'gray'}>{row.isActive ? t('common.active') : t('common.inactive')}</Badge>,
    },
  ];

  const actions: DataTableAction<TemplateVariable>[] = [
    { key: 'toggle', label: 'Toggle', icon: FiToggleRight, onClick: (row) => handleToggleActive(row) },
    { key: 'edit', label: t('common.edit', 'Editar'), icon: FiEdit2, onClick: (row) => handleEdit(row) },
    { key: 'delete', label: t('common.delete', 'Eliminar'), icon: FiTrash2, colorPalette: 'red', onClick: (row) => handleDelete(row.id) },
  ];

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        <Box>
          <Heading size="lg" color={textColor}>{t('templateVariables.title')}</Heading>
          <Text fontSize="sm" color={textColorSecondary}>{t('templateVariables.subtitle')}</Text>
        </Box>

        <DataTable<TemplateVariable>
          data={variables}
          columns={columns}
          rowKey={(row) => String(row.id)}
          actions={actions}
          isLoading={loading}
          emptyMessage={t('common.noData')}
          defaultPageSize={10}
          size="sm"
          toolbarRight={
            <Button colorScheme="blue" onClick={handleCreateNew}>
              <HStack gap={2}><FiPlus /><Text>{t('common.new')}</Text></HStack>
            </Button>
          }
        />
      </VStack>

      {/* Modal */}
      <DialogRoot open={isModalOpen} onOpenChange={(e) => setIsModalOpen(e.open)}>
        <DialogBackdrop />
        <DialogContent maxW="700px">
          <DialogHeader>
            <DialogTitle>
              {editingVariable ? t('templateVariables.edit') : t('templateVariables.create')}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch">
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('templateVariables.code')} *</Text>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="operation_id, applicant_name..."
                  />
                  {formData.code && (
                    <Text fontSize="xs" color={textColorSecondary} mt={1}>
                      Variable: <Badge colorPalette={getCategoryColor(formData.category)}>#{'{' + formData.code + '}'}</Badge>
                    </Text>
                  )}
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('templateVariables.category')} *</Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{t(`templateVariables.categories.${cat}`)}</option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
              </Grid>

              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('templateVariables.labelKey')} *</Text>
                  <Input
                    value={formData.labelKey}
                    onChange={(e) => setFormData({ ...formData, labelKey: e.target.value })}
                    placeholder="templateVar.operation.operationId"
                  />
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('templateVariables.descriptionKey')}</Text>
                  <Input
                    value={formData.descriptionKey}
                    onChange={(e) => setFormData({ ...formData, descriptionKey: e.target.value })}
                    placeholder="templateVar.operation.operationId.desc"
                  />
                </Box>
              </Grid>

              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('templateVariables.sourceTable')} *</Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.sourceTable}
                      onChange={(e) => setFormData({ ...formData, sourceTable: e.target.value })}
                    >
                      {SOURCE_TABLES.map((table) => (
                        <option key={table} value={table}>{table}</option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('templateVariables.sourceColumn')} *</Text>
                  <Input
                    value={formData.sourceColumn}
                    onChange={(e) => setFormData({ ...formData, sourceColumn: e.target.value })}
                    placeholder="id, reference, amount..."
                  />
                </Box>
              </Grid>

              <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('templateVariables.dataType')}</Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.dataType}
                      onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
                    >
                      {DATA_TYPES.map((dt) => (
                        <option key={dt} value={dt}>{dt}</option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('templateVariables.color')}</Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    >
                      {COLORS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('templateVariables.displayOrder')}</Text>
                  <Input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                </Box>
              </Grid>

              <Box>
                <Text mb={1} fontSize="sm" fontWeight="medium">{t('templateVariables.formatPattern')}</Text>
                <Input
                  value={formData.formatPattern}
                  onChange={(e) => setFormData({ ...formData, formatPattern: e.target.value })}
                  placeholder="yyyy-MM-dd, #,##0.00, etc."
                />
              </Box>

              <CheckboxRoot
                checked={formData.isActive}
                onCheckedChange={(e) => setFormData({ ...formData, isActive: !!e.checked })}
              >
                <CheckboxControl />
                <CheckboxLabel>{t('common.active')}</CheckboxLabel>
              </CheckboxRoot>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="ghost">{t('common.cancel')}</Button>
            </DialogActionTrigger>
            <Button colorScheme="blue" onClick={handleSave} disabled={saving}>
              {saving && <Spinner size="sm" mr={2} />}
              {editingVariable ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
};

export default TemplateVariablesPage;
