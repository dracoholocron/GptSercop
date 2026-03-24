/**
 * ActionTypesTab - Tab component for managing action type configurations
 * within the unified Event Configuration page.
 * Extracted from the standalone ActionTypeConfig.tsx page.
 */
import { useState, useEffect } from 'react';
import {
  Box,
  Input,
  VStack,
  Text,
  Button,
  Badge,
  Spinner,
  Textarea,
  Grid,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogActionTrigger,
  DialogBackdrop,
} from '@chakra-ui/react';
import { CheckboxRoot, CheckboxControl, CheckboxLabel } from '@chakra-ui/react/checkbox';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { FiPlus, FiEdit2, FiTrash2, FiToggleRight } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { get, post, put, del } from '../../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../../config/api.config';
import { notify } from '../../components/ui/toaster';
import { DataTable, type DataTableColumn, type DataTableAction } from '../../components/ui/DataTable';

interface ActionTypeConfigItem {
  id: number;
  actionType: string;
  language: string;
  displayName: string;
  description?: string;
  helpText?: string;
  icon?: string;
  color?: string;
  successMessage?: string;
  errorMessage?: string;
  retryMessage?: string;
  skipMessage?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
}

type FormData = Omit<ActionTypeConfigItem, 'id' | 'createdAt'>;

const DEFAULT_FORM: FormData = {
  actionType: '',
  language: 'es',
  displayName: '',
  description: '',
  helpText: '',
  icon: '',
  color: 'blue',
  successMessage: '',
  errorMessage: '',
  retryMessage: '',
  skipMessage: '',
  displayOrder: 0,
  isActive: true,
};

const COLORS = ['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'cyan', 'teal', 'pink', 'gray'];

interface ActionTypesTabProps {
  language: string;
}

export const ActionTypesTab = ({ language }: ActionTypesTabProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const { primaryColor } = getColors();

  const [configs, setConfigs] = useState<ActionTypeConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ActionTypeConfigItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);

  useEffect(() => { loadConfigs(); }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await get(`${API_BASE_URL}/v1/admin/action-type-config`);
      if (response.ok) {
        const data = await response.json();
        setConfigs(data.data || []);
      } else {
        throw new Error('Failed to fetch');
      }
    } catch {
      notify.error(t('common.error'), t('common.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // Filter by parent language (DataTable handles search internally)
  const filteredConfigs = configs.filter(c => c.language === language);

  const columns: DataTableColumn<ActionTypeConfigItem>[] = [
    {
      key: 'actionType',
      label: t('actionTypeConfig.actionType'),
      render: (row) => <Badge colorPalette="purple">{row.actionType}</Badge>,
    },
    {
      key: 'displayName',
      label: t('actionTypeConfig.displayName'),
      render: (row) => <Text>{row.displayName}</Text>,
    },
    {
      key: 'icon',
      label: t('actionTypeConfig.icon'),
      render: (row) => <Text>{row.icon || '-'}</Text>,
    },
    {
      key: 'color',
      label: t('actionTypeConfig.color'),
      render: (row) => row.color ? <Badge colorPalette={row.color}>{row.color}</Badge> : null,
    },
    {
      key: 'displayOrder',
      label: t('common.order'),
      render: (row) => <Text>{row.displayOrder}</Text>,
    },
    {
      key: 'isActive',
      label: t('common.status'),
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: t('common.active') },
        { value: 'false', label: t('common.inactive') },
      ],
      render: (row) => (
        <Badge colorPalette={row.isActive ? 'green' : 'gray'}>
          {row.isActive ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
  ];

  const actions: DataTableAction<ActionTypeConfigItem>[] = [
    {
      key: 'toggle',
      label: t('common.toggle'),
      icon: FiToggleRight,
      onClick: (row) => handleToggleActive(row),
    },
    {
      key: 'edit',
      label: t('common.edit'),
      icon: FiEdit2,
      onClick: (row) => handleEdit(row),
    },
    {
      key: 'delete',
      label: t('common.delete'),
      icon: FiTrash2,
      colorPalette: 'red',
      onClick: (row) => handleDelete(row.id),
    },
  ];

  const handleCreateNew = () => {
    setEditingConfig(null);
    setFormData({ ...DEFAULT_FORM, language });
    setIsModalOpen(true);
  };

  const handleEdit = (config: ActionTypeConfigItem) => {
    setEditingConfig(config);
    setFormData({
      actionType: config.actionType,
      language: config.language,
      displayName: config.displayName,
      description: config.description || '',
      helpText: config.helpText || '',
      icon: config.icon || '',
      color: config.color || 'blue',
      successMessage: config.successMessage || '',
      errorMessage: config.errorMessage || '',
      retryMessage: config.retryMessage || '',
      skipMessage: config.skipMessage || '',
      displayOrder: config.displayOrder,
      isActive: config.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.actionType || !formData.displayName) {
      notify.error(t('common.error'), t('actionTypeConfig.requiredFields'));
      return;
    }
    try {
      setSaving(true);
      let response;
      if (editingConfig) {
        response = await put(`${API_BASE_URL}/v1/admin/action-type-config/${editingConfig.id}`, formData);
      } else {
        response = await post(`${API_BASE_URL}/v1/admin/action-type-config`, formData);
      }
      if (response.ok) {
        setIsModalOpen(false);
        loadConfigs();
        notify.success(t('common.success'), editingConfig ? t('common.updated') : t('common.created'));
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
      const response = await del(`${API_BASE_URL}/v1/admin/action-type-config/${id}`);
      if (response.ok) {
        loadConfigs();
        notify.success(t('common.success'), t('common.deleted'));
      } else {
        throw new Error('Delete failed');
      }
    } catch {
      notify.error(t('common.error'), t('common.deleteError'));
    }
  };

  const handleToggleActive = async (config: ActionTypeConfigItem) => {
    try {
      const response = await post(`${API_BASE_URL}/v1/admin/action-type-config/${config.id}/toggle-active`, {});
      if (response.ok) {
        loadConfigs();
        notify.success(t('common.success'), config.isActive ? t('common.deactivated') : t('common.activated'));
      }
    } catch {
      notify.error(t('common.error'), t('common.updateError'));
    }
  };

  return (
    <>
      <DataTable<ActionTypeConfigItem>
        data={filteredConfigs}
        columns={columns}
        rowKey={(row) => String(row.id)}
        actions={actions}
        isLoading={loading}
        emptyMessage={t('common.noData')}
        defaultPageSize={10}
        size="sm"
        searchPlaceholder={t('common.search')}
        toolbarRight={
          <Button size="sm" bg={primaryColor} color="white" onClick={handleCreateNew}>
            <FiPlus style={{ marginRight: '8px' }} /> {t('common.new')}
          </Button>
        }
      />

      {/* Create/Edit Modal */}
      <DialogRoot open={isModalOpen} onOpenChange={(e) => setIsModalOpen(e.open)}>
        <DialogBackdrop />
        <DialogContent maxW="700px">
          <DialogHeader>
            <DialogTitle>{editingConfig ? t('actionTypeConfig.edit') : t('actionTypeConfig.create')}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch">
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('actionTypeConfig.actionType')} *</Text>
                  <Input value={formData.actionType} onChange={(e) => setFormData({ ...formData, actionType: e.target.value.toUpperCase() })} placeholder="SWIFT_MESSAGE, API_CALL, EMAIL..." />
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('common.language')} *</Text>
                  <NativeSelectRoot>
                    <NativeSelectField value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })}>
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
              </Grid>

              <Box>
                <Text mb={1} fontSize="sm" fontWeight="medium">{t('actionTypeConfig.displayName')} *</Text>
                <Input value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} placeholder={t('actionTypeConfig.displayNamePlaceholder')} />
              </Box>

              <Box>
                <Text mb={1} fontSize="sm" fontWeight="medium">{t('common.description')}</Text>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
              </Box>

              <Box>
                <Text mb={1} fontSize="sm" fontWeight="medium">{t('actionTypeConfig.helpText')}</Text>
                <Textarea value={formData.helpText} onChange={(e) => setFormData({ ...formData, helpText: e.target.value })} rows={2} />
              </Box>

              <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('actionTypeConfig.icon')}</Text>
                  <Input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="FiMail, FiSend..." />
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('actionTypeConfig.color')}</Text>
                  <NativeSelectRoot>
                    <NativeSelectField value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })}>
                      {COLORS.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('common.order')}</Text>
                  <Input type="number" value={formData.displayOrder} onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })} />
                </Box>
              </Grid>

              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('actionTypeConfig.successMessage')}</Text>
                  <Input value={formData.successMessage} onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })} />
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('actionTypeConfig.errorMessage')}</Text>
                  <Input value={formData.errorMessage} onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })} />
                </Box>
              </Grid>

              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('actionTypeConfig.retryMessage')}</Text>
                  <Input value={formData.retryMessage} onChange={(e) => setFormData({ ...formData, retryMessage: e.target.value })} />
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('actionTypeConfig.skipMessage')}</Text>
                  <Input value={formData.skipMessage} onChange={(e) => setFormData({ ...formData, skipMessage: e.target.value })} />
                </Box>
              </Grid>

              <CheckboxRoot checked={formData.isActive} onCheckedChange={(e) => setFormData({ ...formData, isActive: !!e.checked })}>
                <CheckboxControl />
                <CheckboxLabel>{t('common.active')}</CheckboxLabel>
              </CheckboxRoot>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild><Button variant="ghost">{t('common.cancel')}</Button></DialogActionTrigger>
            <Button colorScheme="blue" onClick={handleSave} disabled={saving}>
              {saving && <Spinner size="sm" mr={2} />}
              {editingConfig ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
};

export default ActionTypesTab;
