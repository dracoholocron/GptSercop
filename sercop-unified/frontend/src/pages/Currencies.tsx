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
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogActionTrigger,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiDownload, FiEdit2, FiTrash2, FiClock } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { monedaService, type Moneda, type CreateMonedaCommand, type UpdateMonedaCommand, type EventHistory } from '../services/currencyService';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '../components/ui/toaster';
import { DataTable, type DataTableColumn, type DataTableAction } from '../components/ui/DataTable';

export const Currencies = () => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const { user } = useAuth();

  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMoneda, setEditingMoneda] = useState<Moneda | null>(null);
  const [formData, setFormData] = useState<CreateMonedaCommand>({
    codigo: '',
    nombre: '',
    simbolo: '',
    activo: true,
  });
  const [saving, setSaving] = useState(false);

  // History modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [eventHistory, setEventHistory] = useState<EventHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedMoneda, setSelectedMoneda] = useState<Moneda | null>(null);

  const colors = getColors();
  const { bgColor, borderColor, cardBg, textColor, textColorSecondary, primaryColor } = colors;

  // Load monedas on mount
  useEffect(() => {
    loadMonedas();
  }, []);

  const loadMonedas = async () => {
    try {
      setLoading(true);
      const data = await monedaService.getAllMonedas();
      console.log('Monedas loaded from backend:', data);
      if (data.length > 0) {
        console.log('First moneda sample:', data[0]);
        console.log('First moneda ID:', data[0].id, 'Type:', typeof data[0].id);
      }
      setMonedas(data);
    } catch (error) {
      notify.error('Error', 'Error al cargar monedas: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Código', 'Nombre', 'Símbolo', 'Activo'];
    const csvContent = [
      headers.join(','),
      ...monedas.map(m =>
        [m.codigo, m.nombre, m.simbolo || '', m.activo ? 'Sí' : 'No'].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `monedas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateNew = () => {
    setEditingMoneda(null);
    setFormData({
      codigo: '',
      nombre: '',
      simbolo: '',
      activo: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (moneda: Moneda) => {
    console.log('Editing moneda:', moneda);
    console.log('Moneda ID:', moneda.id, 'Type:', typeof moneda.id);
    setEditingMoneda(moneda);
    setFormData({
      codigo: moneda.codigo,
      nombre: moneda.nombre,
      simbolo: moneda.simbolo || '',
      activo: moneda.activo,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (moneda: Moneda) => {
    if (!confirm(`¿Está seguro de eliminar la moneda ${moneda.codigo}?`)) {
      return;
    }

    try {
      await monedaService.deleteMoneda(moneda.id, user?.email);
      notify.success('Éxito', 'Moneda eliminada correctamente');
      loadMonedas();
    } catch (error) {
      notify.error('Error', 'Error al eliminar moneda: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      if (editingMoneda) {
        // Update
        const command: UpdateMonedaCommand = {
          codigo: formData.codigo,
          nombre: formData.nombre,
          simbolo: formData.simbolo,
          activo: formData.activo,
          updatedBy: user?.email,
        };
        await monedaService.updateMoneda(editingMoneda.id, command);
        notify.success('Éxito', 'Moneda actualizada correctamente');
      } else {
        // Create
        const command: CreateMonedaCommand = {
          codigo: formData.codigo,
          nombre: formData.nombre,
          simbolo: formData.simbolo,
          activo: formData.activo,
          createdBy: user?.email,
        };
        await monedaService.createMoneda(command);
        notify.success('Éxito', 'Moneda creada correctamente');
      }

      setIsModalOpen(false);
      loadMonedas();
    } catch (error) {
      notify.error('Error', 'Error al guardar moneda: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const handleViewHistory = async (moneda: Moneda) => {
    try {
      setSelectedMoneda(moneda);
      setLoadingHistory(true);
      setIsHistoryModalOpen(true);
      const history = await monedaService.getEventHistory(moneda.id);
      setEventHistory(history);
    } catch (error) {
      notify.error('Error', 'Error al cargar historial: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      setIsHistoryModalOpen(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  const columns: DataTableColumn<Moneda>[] = [
    { key: 'codigo', label: t('monedas.codigo', 'Código'), render: (row) => <Text fontWeight="semibold">{row.codigo}</Text> },
    { key: 'nombre', label: t('monedas.nombre', 'Nombre') },
    { key: 'simbolo', label: t('monedas.simbolo', 'Símbolo'), render: (row) => <Text>{row.simbolo || '-'}</Text>, hideOnMobile: true },
    { key: 'activo', label: t('monedas.estado', 'Estado'), filterType: 'select', filterOptions: [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }], render: (row) => <Badge colorPalette={row.activo ? 'green' : 'red'}>{row.activo ? 'Activo' : 'Inactivo'}</Badge> },
  ];

  const actions: DataTableAction<Moneda>[] = [
    { key: 'history', label: 'Historial', icon: FiClock, colorPalette: 'blue', onClick: (row) => handleViewHistory(row) },
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
              {t('monedas.title')}
            </Text>
            <Text fontSize="sm" color={textColorSecondary} mt={1}>
              {t('monedas.subtitle')}
            </Text>
          </Box>

          {/* DataTable replaces loading, filters, table, and summary */}
          <DataTable<Moneda>
            data={monedas}
            columns={columns}
            rowKey={(row) => String(row.id)}
            actions={actions}
            isLoading={loading}
            emptyMessage={t('monedas.noResults', 'No hay monedas registradas')}
            defaultPageSize={10}
            toolbarRight={
              <HStack gap={2}>
                <Button variant="outline" borderColor={colors.borderColor} color={colors.textColor} onClick={handleExportCSV} disabled={loading}>
                  <HStack gap={2}><FiDownload /><Text>{t('monedas.exportCSV', 'Exportar CSV')}</Text></HStack>
                </Button>
                <Button bg={colors.primaryColor} color="white" onClick={handleCreateNew} _hover={{ opacity: 0.9 }}>
                  <HStack gap={2}><FiPlus /><Text>{t('monedas.createNew', 'Nueva Moneda')}</Text></HStack>
                </Button>
              </HStack>
            }
          />
        </VStack>
      </Box>

      {/* Create/Edit Modal */}
      <DialogRoot open={isModalOpen} onOpenChange={(e) => setIsModalOpen(e.open)}>
        <DialogContent
          css={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingMoneda ? 'Editar Moneda' : 'Nueva Moneda'}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack align="stretch" gap={4}>
              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>
                  Código <Text as="span" color="red.500">*</Text>
                </Text>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="USD"
                  maxLength={3}
                  disabled={!!editingMoneda}
                />
              </Box>
              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>
                  Nombre <Text as="span" color="red.500">*</Text>
                </Text>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Dólar Estadounidense"
                />
              </Box>
              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>
                  Símbolo
                </Text>
                <Input
                  value={formData.simbolo}
                  onChange={(e) => setFormData({ ...formData, simbolo: e.target.value })}
                  placeholder="$"
                />
              </Box>
              <HStack gap={2}>
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <Text color={textColor}>Activo</Text>
              </HStack>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline" disabled={saving}>
                Cancelar
              </Button>
            </DialogActionTrigger>
            <Button
              bg={primaryColor}
              color="white"
              onClick={handleSubmit}
              loading={saving}
              disabled={!formData.codigo || !formData.nombre}
            >
              {editingMoneda ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* History Modal */}
      <DialogRoot open={isHistoryModalOpen} onOpenChange={(e) => setIsHistoryModalOpen(e.open)}>
        <DialogContent
          maxW="800px"
          css={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
        >
          <DialogHeader>
            <DialogTitle>
              Historial de Cambios - {selectedMoneda?.codigo}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            {loadingHistory ? (
              <Flex justify="center" align="center" py={10}>
                <Spinner size="xl" color={primaryColor} />
              </Flex>
            ) : eventHistory.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text color={textColorSecondary}>No hay eventos registrados</Text>
              </Box>
            ) : (
              <VStack align="stretch" gap={4} maxH="500px" overflowY="auto">
                {eventHistory.map((event, index) => (
                  <Box
                    key={event.eventId}
                    p={4}
                    borderRadius="md"
                    border="1px"
                    borderColor={borderColor}
                    bg={index === 0 ? colors.hoverBg : cardBg}
                  >
                    <Flex justify="space-between" align="start" mb={2}>
                      <Box>
                        <Text fontWeight="bold" color={textColor} fontSize="sm">
                          {event.eventType}
                        </Text>
                        <Text fontSize="xs" color={textColorSecondary}>
                          Versión {event.version}
                        </Text>
                      </Box>
                      <Badge colorPalette="blue" size="sm">
                        {new Date(event.timestamp).toLocaleString('es-MX')}
                      </Badge>
                    </Flex>
                    <Text fontSize="xs" color={textColorSecondary} mb={2}>
                      Por: {event.performedBy}
                    </Text>
                    {Object.keys(event.eventData).length > 0 && (
                      <Box
                        mt={2}
                        p={2}
                        bg={bgColor}
                        borderRadius="sm"
                        fontSize="xs"
                      >
                        {Object.entries(event.eventData).map(([key, value]) => (
                          <Flex key={key} gap={2}>
                            <Text fontWeight="semibold" color={textColor}>{key}:</Text>
                            <Text color={textColorSecondary}>{String(value)}</Text>
                          </Flex>
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline">
                Cerrar
              </Button>
            </DialogActionTrigger>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
};
