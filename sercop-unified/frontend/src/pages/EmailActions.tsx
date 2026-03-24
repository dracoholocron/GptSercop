import {
  Box,
  Input,
  VStack,
  Text,
  Button,
  HStack,
  Badge,
  Spinner,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
  DialogActionTrigger,
  Grid,
  Checkbox,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiUser, FiList } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { emailActionApi, type EmailActionConfig, type ActionType, type RecipientType } from '../services/emailService';
import { notify } from '../components/ui/toaster';
import { DataTable, type DataTableColumn, type DataTableAction } from '../components/ui/DataTable';

const ACTION_TYPES: { value: ActionType; label: string }[] = [
  { value: 'OPERATION_CREATED', label: 'Operaci\u00f3n Creada' },
  { value: 'OPERATION_APPROVED', label: 'Operaci\u00f3n Aprobada' },
  { value: 'OPERATION_REJECTED', label: 'Operaci\u00f3n Rechazada' },
  { value: 'STATUS_CHANGED', label: 'Cambio de Estado' },
  { value: 'DOCUMENT_UPLOADED', label: 'Documento Subido' },
  { value: 'AMENDMENT_REQUESTED', label: 'Enmienda Solicitada' },
  { value: 'PAYMENT_DUE', label: 'Pago Vencido' },
  { value: 'EXPIRY_WARNING', label: 'Aviso Vencimiento' },
];

const RECIPIENT_TYPES: { value: RecipientType; label: string; icon: React.ReactNode }[] = [
  { value: 'OPERATION_OWNER', label: 'Propietario', icon: <FiUser /> },
  { value: 'APPROVERS', label: 'Aprobadores', icon: <FiUsers /> },
  { value: 'PARTICIPANTS', label: 'Participantes', icon: <FiUsers /> },
  { value: 'CUSTOM', label: 'Personalizado', icon: <FiList /> },
];

export const EmailActions = () => {
  const { getColors } = useTheme();
  const colors = getColors();
  const { textColor, textColorSecondary, primaryColor } = colors;

  const [actions, setActions] = useState<EmailActionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<EmailActionConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<EmailActionConfig>>({
    actionType: 'OPERATION_CREATED',
    isActive: true,
    templateCode: '',
    recipientType: 'OPERATION_OWNER',
  });
  const [customRecipientsInput, setCustomRecipientsInput] = useState('');

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      setLoading(true);
      setActions(await emailActionApi.getAll());
    } catch {
      notify.error('Error', 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingAction(null);
    setFormData({ actionType: 'OPERATION_CREATED', isActive: true, templateCode: '', recipientType: 'OPERATION_OWNER' });
    setCustomRecipientsInput('');
    setIsModalOpen(true);
  };

  const handleEdit = (a: EmailActionConfig) => {
    setEditingAction(a);
    setFormData({ ...a });
    setCustomRecipientsInput(a.customRecipients?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = { ...formData, customRecipients: customRecipientsInput.split(',').map(e => e.trim()).filter(e => e) };
      if (editingAction) await emailActionApi.update(editingAction.id, data);
      else await emailActionApi.create(data);
      setIsModalOpen(false);
      loadActions();
      notify.success('OK', editingAction ? 'Actualizado' : 'Creado');
    } catch (e) {
      notify.error('Error', e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: EmailActionConfig) => {
    if (!confirm('\u00bfEliminar?')) return;
    try {
      await emailActionApi.delete(a.id);
      loadActions();
      notify.success('OK', 'Eliminado');
    } catch {
      notify.error('Error', 'Error');
    }
  };

  const getActionLabel = (type: string) => ACTION_TYPES.find(a => a.value === type)?.label || type;
  const getRecipientLabel = (type: string) => RECIPIENT_TYPES.find(r => r.value === type)?.label || type;
  const getActionColor = (type: string): string =>
    ({ OPERATION_CREATED: 'green', OPERATION_APPROVED: 'blue', OPERATION_REJECTED: 'red', STATUS_CHANGED: 'purple', PAYMENT_DUE: 'red', EXPIRY_WARNING: 'yellow' }[type] || 'gray');

  const columns: DataTableColumn<EmailActionConfig>[] = [
    {
      key: 'actionType',
      label: 'Acci\u00f3n',
      filterType: 'select',
      filterOptions: ACTION_TYPES.map(a => ({ value: a.value, label: a.label })),
      render: (row) => <Badge colorPalette={getActionColor(row.actionType)}>{getActionLabel(row.actionType)}</Badge>,
    },
    {
      key: 'templateCode',
      label: 'Template',
      render: (row) => <Text fontFamily="mono" fontSize="sm">{row.templateCode}</Text>,
    },
    {
      key: 'recipientType',
      label: 'Destinatarios',
      filterType: 'select',
      filterOptions: RECIPIENT_TYPES.map(r => ({ value: r.value, label: r.label })),
      render: (row) => (
        <HStack gap={1}>
          {RECIPIENT_TYPES.find(r => r.value === row.recipientType)?.icon}
          <Text color={textColorSecondary} fontSize="sm">{getRecipientLabel(row.recipientType)}</Text>
        </HStack>
      ),
    },
    {
      key: 'isActive',
      label: 'Estado',
      filterType: 'select',
      filterOptions: [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }],
      render: (row) => <Badge colorPalette={row.isActive ? 'green' : 'gray'}>{row.isActive ? 'Activo' : 'Inactivo'}</Badge>,
    },
  ];

  const tableActions: DataTableAction<EmailActionConfig>[] = [
    { key: 'edit', label: 'Editar', icon: FiEdit2, onClick: (row) => handleEdit(row) },
    { key: 'delete', label: 'Eliminar', icon: FiTrash2, colorPalette: 'red', onClick: (row) => handleDelete(row) },
  ];

  return (
    <>
      <Box flex={1} p={6}>
        <VStack align="stretch" gap={6}>
          {/* Header */}
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color={textColor}>
              Acciones de Email
            </Text>
            <Text fontSize="sm" color={textColorSecondary} mt={1}>
              Configuraci\u00f3n de acciones de notificaci\u00f3n por email
            </Text>
          </Box>

          {/* DataTable replaces loading, filters, table, empty state, and summary */}
          <DataTable<EmailActionConfig>
            data={actions}
            columns={columns}
            rowKey={(row) => String(row.id)}
            actions={tableActions}
            isLoading={loading}
            emptyMessage="No hay acciones configuradas"
            defaultPageSize={10}
            toolbarRight={
              <HStack gap={2}>
                <Button bg={colors.primaryColor} color="white" onClick={handleCreateNew} _hover={{ opacity: 0.9 }}>
                  <HStack gap={2}><FiPlus /><Text>Nueva</Text></HStack>
                </Button>
              </HStack>
            }
          />
        </VStack>
      </Box>

      {/* Create/Edit Modal */}
      <DialogRoot open={isModalOpen} onOpenChange={e => setIsModalOpen(e.open)}>
        <DialogContent
          maxW="550px"
          css={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <DialogHeader>
            <DialogTitle>{editingAction ? 'Editar' : 'Nueva'} Acci\u00f3n</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch">
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">Tipo de Acci\u00f3n</Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.actionType || 'OPERATION_CREATED'}
                      onChange={e => setFormData({ ...formData, actionType: e.target.value as ActionType })}
                    >
                      {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">Destinatario</Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.recipientType || 'OPERATION_OWNER'}
                      onChange={e => setFormData({ ...formData, recipientType: e.target.value as RecipientType })}
                    >
                      {RECIPIENT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
              </Grid>
              <Box>
                <Text mb={1} fontSize="sm" fontWeight="medium">C\u00f3digo de Template</Text>
                <Input value={formData.templateCode || ''} onChange={e => setFormData({ ...formData, templateCode: e.target.value })} placeholder="OPERATION_NOTIFICATION" />
              </Box>
              {formData.recipientType === 'CUSTOM' && (
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">Emails Personalizados</Text>
                  <Input value={customRecipientsInput} onChange={e => setCustomRecipientsInput(e.target.value)} placeholder="email1@test.com, email2@test.com" />
                </Box>
              )}
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">Tipo Evento</Text>
                  <Input value={formData.eventTypeCode || ''} onChange={e => setFormData({ ...formData, eventTypeCode: e.target.value })} placeholder="Opcional" />
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">Tipo Producto</Text>
                  <Input value={formData.productTypeCode || ''} onChange={e => setFormData({ ...formData, productTypeCode: e.target.value })} placeholder="Opcional" />
                </Box>
              </Grid>
              <Checkbox checked={formData.isActive} onCheckedChange={e => setFormData({ ...formData, isActive: !!e.checked })}>Activo</Checkbox>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogActionTrigger>
            <Button bg={primaryColor} color="white" onClick={handleSave} disabled={saving}>
              {saving && <Spinner size="sm" mr={2} />}
              {editingAction ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
};

export default EmailActions;
