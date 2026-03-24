import {
  Box,
  Input,
  VStack,
  Text,
  Flex,
  Button,
  HStack,
  Badge,
  Spinner,
  Grid,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogBackdrop,
  DialogCloseTrigger,
  DialogActionTrigger,
  Heading,
} from '@chakra-ui/react';
import { CheckboxRoot, CheckboxControl, CheckboxLabel } from '@chakra-ui/react/checkbox';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiStar, FiZap } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { emailProviderApi, type EmailProviderConfig } from '../services/emailService';
import { notify } from '../components/ui/toaster';
import { DataTable, type DataTableColumn, type DataTableAction } from '../components/ui/DataTable';

export const EmailProviders = () => {
  const { getColors } = useTheme();
  const colors = getColors();
  const { textColor, primaryColor } = colors;

  const [providers, setProviders] = useState<EmailProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<EmailProviderConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<EmailProviderConfig>>({
    name: '', providerType: 'SMTP', smtpHost: '', smtpPort: '587',
    smtpUsername: '', smtpPassword: '', smtpUseTls: true, apiKey: '',
    fromEmail: '', fromName: '', isActive: true, isDefault: false, priority: 0,
  });

  useEffect(() => { loadProviders(); }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      setProviders(await emailProviderApi.getAll());
    } catch {
      notify.error('Error', 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingProvider(null);
    setFormData({
      name: '', providerType: 'SMTP', smtpHost: '', smtpPort: '587',
      smtpUsername: '', smtpPassword: '', smtpUseTls: true, apiKey: '',
      fromEmail: '', fromName: '', isActive: true, isDefault: false, priority: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (p: EmailProviderConfig) => {
    setEditingProvider(p);
    setFormData({ ...p });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingProvider) await emailProviderApi.update(editingProvider.id, formData);
      else await emailProviderApi.create(formData);
      setIsModalOpen(false);
      loadProviders();
      notify.success('OK', editingProvider ? 'Actualizado' : 'Creado');
    } catch (e) {
      notify.error('Error', e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: EmailProviderConfig) => {
    if (!confirm('¿Eliminar?')) return;
    try {
      await emailProviderApi.delete(p.id);
      loadProviders();
      notify.success('OK', 'Eliminado');
    } catch {
      notify.error('Error', 'Error al eliminar');
    }
  };

  const handleSetDefault = async (p: EmailProviderConfig) => {
    try {
      await emailProviderApi.setDefault(p.id);
      loadProviders();
      notify.success('OK', 'Predeterminado');
    } catch {
      notify.error('Error', 'Error');
    }
  };

  const handleTestConnection = async (p: EmailProviderConfig) => {
    try {
      setTesting(p.id);
      const r = await emailProviderApi.testConnection(p.id);
      if (r.success) notify.success('OK', r.message);
      else notify.error('Error', r.message);
    } catch {
      notify.error('Error', 'Error');
    } finally {
      setTesting(null);
    }
  };

  const columns: DataTableColumn<EmailProviderConfig>[] = [
    {
      key: 'name',
      label: 'Nombre',
      render: (row) => <Text fontWeight="medium">{row.name}</Text>,
    },
    {
      key: 'providerType',
      label: 'Tipo',
      filterType: 'select',
      filterOptions: [
        { value: 'SMTP', label: 'SMTP' },
        { value: 'SENDGRID', label: 'SendGrid' },
        { value: 'AWS_SES', label: 'AWS SES' },
        { value: 'MAILGUN', label: 'Mailgun' },
      ],
      render: (row) => (
        <Badge colorPalette={row.providerType === 'SMTP' ? 'blue' : 'purple'}>
          {row.providerType}
        </Badge>
      ),
    },
    {
      key: 'fromEmail',
      label: 'Email',
      hideOnMobile: true,
    },
    {
      key: 'isActive',
      label: 'Estado',
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'Activo' },
        { value: 'false', label: 'Inactivo' },
      ],
      render: (row) => (
        <Badge colorPalette={row.isActive ? 'green' : 'gray'}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'isDefault',
      label: 'Default',
      hideOnMobile: true,
      render: (row) =>
        row.isDefault ? (
          <Badge colorPalette="yellow">
            <HStack gap={1}><FiStar /> <Text>Default</Text></HStack>
          </Badge>
        ) : (
          <Text color={colors.textColorSecondary}>-</Text>
        ),
    },
  ];

  const actions: DataTableAction<EmailProviderConfig>[] = [
    {
      key: 'test',
      label: 'Test',
      icon: FiZap,
      colorPalette: 'blue',
      onClick: (row) => handleTestConnection(row),
      isDisabled: (row) => testing === row.id,
    },
    {
      key: 'default',
      label: 'Hacer Default',
      icon: FiStar,
      colorPalette: 'yellow',
      onClick: (row) => handleSetDefault(row),
      isHidden: (row) => row.isDefault,
    },
    {
      key: 'edit',
      label: 'Editar',
      icon: FiEdit2,
      onClick: (row) => handleEdit(row),
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: FiTrash2,
      colorPalette: 'red',
      onClick: (row) => handleDelete(row),
    },
  ];

  return (
    <>
      <Box p={6}>
        <VStack align="stretch" gap={6}>
          <Box>
            <Heading size="lg" color={textColor}>Proveedores de Email</Heading>
          </Box>

          <DataTable<EmailProviderConfig>
            data={providers}
            columns={columns}
            rowKey={(row) => String(row.id)}
            actions={actions}
            isLoading={loading}
            emptyMessage="No hay proveedores configurados"
            defaultPageSize={10}
            toolbarRight={
              <Button bg={primaryColor} color="white" onClick={handleCreateNew} _hover={{ opacity: 0.9 }}>
                <HStack gap={2}><FiPlus /><Text>Nuevo Proveedor</Text></HStack>
              </Button>
            }
          />
        </VStack>
      </Box>

      {/* Create/Edit Modal */}
      <DialogRoot open={isModalOpen} onOpenChange={(e) => setIsModalOpen(e.open)}>
        <DialogBackdrop />
        <DialogContent maxW="600px">
          <DialogHeader>
            <DialogTitle>{editingProvider ? 'Editar' : 'Nuevo'} Proveedor</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch">
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">Nombre</Text>
                  <Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">Tipo</Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.providerType || 'SMTP'}
                      onChange={e => setFormData({ ...formData, providerType: e.target.value as 'SMTP' | 'SENDGRID' | 'AWS_SES' | 'MAILGUN' })}
                    >
                      <option value="SMTP">SMTP</option>
                      <option value="SENDGRID">SendGrid</option>
                      <option value="AWS_SES">AWS SES</option>
                      <option value="MAILGUN">Mailgun</option>
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
              </Grid>
              {formData.providerType === 'SMTP' && (
                <>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <Box>
                      <Text mb={1} fontSize="sm" fontWeight="medium">Host</Text>
                      <Input value={formData.smtpHost || ''} onChange={e => setFormData({ ...formData, smtpHost: e.target.value })} placeholder="smtp.gmail.com" />
                    </Box>
                    <Box>
                      <Text mb={1} fontSize="sm" fontWeight="medium">Puerto</Text>
                      <Input value={formData.smtpPort || ''} onChange={e => setFormData({ ...formData, smtpPort: e.target.value })} />
                    </Box>
                  </Grid>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <Box>
                      <Text mb={1} fontSize="sm" fontWeight="medium">Usuario</Text>
                      <Input value={formData.smtpUsername || ''} onChange={e => setFormData({ ...formData, smtpUsername: e.target.value })} />
                    </Box>
                    <Box>
                      <Text mb={1} fontSize="sm" fontWeight="medium">Contraseña</Text>
                      <Input type="password" value={formData.smtpPassword || ''} onChange={e => setFormData({ ...formData, smtpPassword: e.target.value })} />
                    </Box>
                  </Grid>
                  <HStack gap={6}>
                    <CheckboxRoot checked={formData.smtpUseTls} onCheckedChange={e => setFormData({ ...formData, smtpUseTls: !!e.checked })}>
                      <CheckboxControl />
                      <CheckboxLabel>Usar TLS</CheckboxLabel>
                    </CheckboxRoot>
                  </HStack>
                </>
              )}
              {formData.providerType !== 'SMTP' && (
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">API Key</Text>
                  <Input type="password" value={formData.apiKey || ''} onChange={e => setFormData({ ...formData, apiKey: e.target.value })} />
                </Box>
              )}
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">Email Remitente</Text>
                  <Input value={formData.fromEmail || ''} onChange={e => setFormData({ ...formData, fromEmail: e.target.value })} />
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">Nombre Remitente</Text>
                  <Input value={formData.fromName || ''} onChange={e => setFormData({ ...formData, fromName: e.target.value })} />
                </Box>
              </Grid>
              <HStack gap={6}>
                <CheckboxRoot checked={formData.isActive} onCheckedChange={e => setFormData({ ...formData, isActive: !!e.checked })}>
                  <CheckboxControl />
                  <CheckboxLabel>Activo</CheckboxLabel>
                </CheckboxRoot>
                <CheckboxRoot checked={formData.isDefault} onCheckedChange={e => setFormData({ ...formData, isDefault: !!e.checked })}>
                  <CheckboxControl />
                  <CheckboxLabel>Predeterminado</CheckboxLabel>
                </CheckboxRoot>
              </HStack>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogActionTrigger>
            <Button bg={primaryColor} color="white" onClick={handleSave} disabled={saving}>
              {saving && <Spinner size="sm" mr={2} />}
              {editingProvider ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
};

export default EmailProviders;
