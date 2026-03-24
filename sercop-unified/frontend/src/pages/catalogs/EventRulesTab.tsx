/**
 * EventRulesTab - Tab component for managing event rules within the unified Event Configuration page.
 * Extracted from the standalone EventRules.tsx page to work as an embedded tab.
 */
import { useState, useEffect } from 'react';
import {
  Box,
  Input,
  VStack,
  Text,
  Flex,
  Button,
  HStack,
  IconButton,
  Badge,
  Spinner,
  Textarea,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogActionTrigger,
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiCheckCircle, FiPlay } from 'react-icons/fi';
import { DataTable, type DataTableColumn, type DataTableAction } from '../../components/ui/DataTable';
import { useTheme } from '../../contexts/ThemeContext';
import {
  reglaEventoService,
  type ReglaEvento,
  type EventHistory,
  type TestReglaResponse,
} from '../../services/eventRuleService';
import { notify } from '../../components/ui/toaster';
import { ActionEditor } from '../../components/admin/ActionEditor';

interface EventRulesTabProps {
  operationType: string;
  /** When provided, shows in compact embedded mode with info banner */
  eventCode?: string;
}

export const EventRulesTab = ({ operationType, eventCode }: EventRulesTabProps) => {
  const { getColors } = useTheme();
  const colors = getColors();
  const { bgColor, borderColor, cardBg, textColor, textColorSecondary, primaryColor } = colors;

  const [reglasEventos, setReglasEventos] = useState<ReglaEvento[]>([]);
  const [tiposOperacion, setTiposOperacion] = useState<string[]>([]);
  const [eventosTrigger, setEventosTrigger] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReglaEvento | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipoOperacion: '',
    eventoTrigger: '',
    condicionesDrl: '',
    accionesJson: '',
    prioridad: 100,
    activo: true,
  });
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ReglaEvento | null>(null);
  const [deleting, setDeleting] = useState(false);

  // History modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [eventHistory, setEventHistory] = useState<EventHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReglaEvento | null>(null);

  // Test modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testData, setTestData] = useState({
    operationType: '',
    operationAmount: '',
    currency: 'USD',
    userCode: '',
    userRole: '',
    contraparteCountry: '',
  });
  const [testJsonRaw, setTestJsonRaw] = useState('');
  const [testResult, setTestResult] = useState<TestReglaResponse | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const tipos = reglaEventoService.getTiposOperacion();
    const eventos = reglaEventoService.getEventosTrigger();
    setTiposOperacion(tipos);
    setEventosTrigger(eventos);
  }, []);

  useEffect(() => {
    loadData();
  }, [operationType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const reglas = await reglaEventoService.getAllReglasEventos();
      setReglasEventos(reglas);
    } catch (error) {
      notify.error('Error', 'Error al cargar datos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Filter by selected operationType from parent
  // When eventCode is provided (embedded mode), also filter rules whose trigger contains the event code
  const filteredReglasEventos = reglasEventos.filter((r) => {
    if (r.tipoOperacion !== operationType) return false;
    // In embedded mode, match rules whose eventoTrigger contains the event code
    // e.g., eventCode="ISSUE" matches trigger "LC_IMPORT_ISSUE_APPROVED"
    if (eventCode && r.eventoTrigger) {
      const triggerUpper = r.eventoTrigger.toUpperCase();
      const codeUpper = eventCode.toUpperCase();
      if (!triggerUpper.includes(codeUpper)) return false;
    }
    return true;
  });

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      tipoOperacion: operationType,
      eventoTrigger: '',
      condicionesDrl: '',
      accionesJson: '',
      prioridad: 100,
      activo: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: ReglaEvento) => {
    setEditingItem(item);
    setFormData({
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      tipoOperacion: item.tipoOperacion,
      eventoTrigger: item.eventoTrigger,
      condicionesDrl: item.condicionesDRL,
      accionesJson: item.accionesJson,
      prioridad: item.prioridad,
      activo: item.activo,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.codigo || !formData.nombre || !formData.tipoOperacion ||
        !formData.eventoTrigger || !formData.condicionesDrl || !formData.accionesJson) {
      notify.warning('Validación', 'Código, Nombre, Tipo de Operación, Evento Trigger, Condiciones DRL y Acciones JSON son obligatorios');
      return;
    }

    if (formData.prioridad < 1 || formData.prioridad > 1000) {
      notify.warning('Validación', 'La prioridad debe estar entre 1 y 1000');
      return;
    }

    try {
      setSaving(true);
      if (editingItem) {
        await reglaEventoService.updateReglaEvento(editingItem.id, {
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          tipoOperacion: formData.tipoOperacion,
          eventoTrigger: formData.eventoTrigger,
          condicionesDRL: formData.condicionesDrl,
          accionesJson: formData.accionesJson,
          prioridad: formData.prioridad,
          activo: formData.activo,
          updatedBy: 'system',
        });
        notify.success('Éxito', 'Actualizado correctamente');
      } else {
        await reglaEventoService.createReglaEvento({
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          tipoOperacion: formData.tipoOperacion,
          eventoTrigger: formData.eventoTrigger,
          condicionesDRL: formData.condicionesDrl,
          accionesJson: formData.accionesJson,
          prioridad: formData.prioridad,
          activo: formData.activo,
          createdBy: 'system',
        });
        notify.success('Éxito', 'Creado correctamente');
      }
      setIsModalOpen(false);
      await new Promise(resolve => setTimeout(resolve, 1500));
      await loadData();
    } catch (error) {
      notify.error('Error', 'Error al guardar: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (item: ReglaEvento) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await reglaEventoService.deleteReglaEvento(itemToDelete.id, 'system');
      notify.success('Éxito', 'Eliminado correctamente');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      await new Promise(resolve => setTimeout(resolve, 1500));
      await loadData();
    } catch (error) {
      notify.error('Error', 'Error al eliminar: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setDeleting(false);
    }
  };

  const handleViewHistory = async (item: ReglaEvento) => {
    try {
      setSelectedItem(item);
      setLoadingHistory(true);
      setIsHistoryModalOpen(true);
      const history = await reglaEventoService.getEventHistory(item.id);
      setEventHistory(history);
    } catch (error) {
      notify.error('Error', 'Error al cargar historial: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      setIsHistoryModalOpen(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLoadPlantillaDrl = () => {
    const plantilla = reglaEventoService.getPlantillaDRL();
    setFormData({ ...formData, condicionesDrl: plantilla });
  };

  const handleValidateDrl = async () => {
    if (!formData.condicionesDrl) {
      notify.warning('Validación', 'No hay condiciones DRL para validar');
      return;
    }
    try {
      setValidating(true);
      const result = await reglaEventoService.validateDrl(formData.condicionesDrl);
      if (result.valid) {
        notify.success('Éxito', 'Validación exitosa: DRL es válido');
      } else {
        notify.error('Errores de validación', result.errors.join('\n'));
      }
    } catch (error) {
      notify.error('Error', 'Error al validar DRL: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setValidating(false);
    }
  };

  const handleTestRegla = (item: ReglaEvento) => {
    setSelectedItem(item);
    setTestData({ operationType: '', operationAmount: '', currency: 'USD', userCode: '', userRole: '', contraparteCountry: '' });
    setTestJsonRaw('');
    setTestResult(null);
    setTestModalOpen(true);
  };

  const handleExecuteTest = async () => {
    if (!selectedItem) return;
    try {
      setTesting(true);
      let dataToSend: any;
      if (testJsonRaw.trim()) {
        try {
          dataToSend = JSON.parse(testJsonRaw);
        } catch (e) {
          notify.error('Error', 'JSON inválido: ' + (e instanceof Error ? e.message : 'Error de sintaxis'));
          setTesting(false);
          return;
        }
      } else {
        dataToSend = testData;
      }
      const result = await reglaEventoService.testReglaEvento(selectedItem.id, dataToSend);
      setTestResult(result);
    } catch (error) {
      notify.error('Error', 'Error al ejecutar prueba: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setTesting(false);
    }
  };

  // Compact card-based view for embedded mode
  const renderCompactView = () => (
    <VStack align="stretch" gap={2}>
      {filteredReglasEventos.length === 0 ? (
        <Flex justify="center" py={6} direction="column" align="center" gap={2}>
          <FiCheckCircle size={24} color="var(--chakra-colors-gray-400)" />
          <Text fontSize="sm" color={textColorSecondary}>
            {reglasEventos.length === 0 ? 'No hay reglas configuradas' : 'Sin resultados para ' + operationType}
          </Text>
        </Flex>
      ) : (
        filteredReglasEventos.map((regla) => (
          <Box
            key={regla.id}
            p={3}
            bg={cardBg}
            borderRadius="md"
            borderWidth="1px"
            borderColor={borderColor}
            _hover={{ borderColor: primaryColor, bg: colors.hoverBg }}
            transition="all 0.15s"
          >
            <Flex justify="space-between" align="start">
              <VStack align="start" gap={1} flex={1} minW={0}>
                <HStack gap={2} flexWrap="wrap">
                  <Text fontSize="sm" fontWeight="semibold" color={textColor} truncate>
                    {regla.nombre}
                  </Text>
                  <Badge colorPalette={regla.activo ? 'green' : 'gray'} size="sm">
                    {regla.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </HStack>
                <HStack gap={2} flexWrap="wrap">
                  <Badge colorPalette="purple" variant="subtle" size="sm">{regla.eventoTrigger}</Badge>
                  <Text fontSize="xs" color={textColorSecondary} fontFamily="mono">{regla.codigo}</Text>
                  <Text fontSize="xs" color={textColorSecondary}>Prioridad: {regla.prioridad}</Text>
                </HStack>
              </VStack>
              <HStack gap={0} flexShrink={0}>
                <IconButton aria-label="Probar" size="xs" variant="ghost" colorPalette="green" onClick={() => handleTestRegla(regla)}><FiPlay /></IconButton>
                <IconButton aria-label="Editar" size="xs" variant="ghost" onClick={() => handleEdit(regla)}><FiEdit2 /></IconButton>
                <IconButton aria-label="Eliminar" size="xs" variant="ghost" colorPalette="red" onClick={() => handleDeleteClick(regla)}><FiTrash2 /></IconButton>
              </HStack>
            </Flex>
          </Box>
        ))
      )}
    </VStack>
  );

  // Column definitions for DataTable
  const columns: DataTableColumn<ReglaEvento>[] = [
    {
      key: 'codigo',
      label: 'Código',
      sortable: true,
      render: (row) => <Text fontWeight="semibold">{row.codigo}</Text>,
    },
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
    },
    {
      key: 'eventoTrigger',
      label: 'Evento Trigger',
      sortable: true,
      filterType: 'select',
      filterOptions: eventosTrigger.map((e) => ({ value: e, label: e })),
      render: (row) => <Badge colorPalette="purple" size="sm">{row.eventoTrigger}</Badge>,
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      sortable: true,
      align: 'center',
      render: (row) => <Text fontWeight="semibold">{row.prioridad}</Text>,
    },
    {
      key: 'activo',
      label: 'Estado',
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'Activo' },
        { value: 'false', label: 'Inactivo' },
      ],
      render: (row) => (
        <Badge colorPalette={row.activo ? 'green' : 'red'}>
          {row.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ];

  // Action definitions for DataTable
  const tableActions: DataTableAction<ReglaEvento>[] = [
    { key: 'history', label: 'Ver Historial', icon: FiClock, colorPalette: 'blue', onClick: (row) => handleViewHistory(row) },
    { key: 'test', label: 'Probar Regla', icon: FiPlay, colorPalette: 'green', onClick: (row) => handleTestRegla(row) },
    { key: 'edit', label: 'Editar', icon: FiEdit2, onClick: (row) => handleEdit(row) },
    { key: 'delete', label: 'Eliminar', icon: FiTrash2, colorPalette: 'red', onClick: (row) => handleDeleteClick(row) },
  ];

  const isEmbedded = !!eventCode;

  const newRuleButton = (
    <Button size="xs" bg={primaryColor} color="white" onClick={handleCreate} _hover={{ opacity: 0.9 }}>
      <HStack gap={1}>
        <FiPlus />
        <Text>Nueva Regla</Text>
      </HStack>
    </Button>
  );

  return (
    <>
      {isEmbedded ? (
        <VStack align="stretch" gap={3} pt={1}>
          {/* Header: count + add button (embedded mode) */}
          <Flex justify="space-between" align="center">
            <HStack gap={2}>
              <Badge colorPalette="purple" variant="subtle" size="sm">
                {filteredReglasEventos.length} {filteredReglasEventos.length === 1 ? 'regla' : 'reglas'}
              </Badge>
              <Text fontSize="xs" color={textColorSecondary}>
                {filteredReglasEventos.length > 0
                  ? `Relacionadas con ${eventCode}`
                  : `Sin reglas para ${eventCode}`}
              </Text>
            </HStack>
            {newRuleButton}
          </Flex>

          {loading ? (
            <Flex justify="center" py={6}>
              <Spinner size="md" color={primaryColor} />
            </Flex>
          ) : renderCompactView()}
        </VStack>
      ) : (
        <DataTable<ReglaEvento>
          data={filteredReglasEventos}
          columns={columns}
          rowKey={(row) => String(row.id)}
          actions={tableActions}
          isLoading={loading}
          emptyMessage={reglasEventos.length === 0 ? 'No hay reglas de eventos registradas' : 'No se encontraron resultados para ' + operationType}
          defaultPageSize={10}
          toolbarRight={newRuleButton}
        />
      )}

      {/* Create/Edit Modal */}
      <DialogRoot open={isModalOpen} onOpenChange={(e) => setIsModalOpen(e.open)}>
        <DialogContent css={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, maxHeight: '90vh', minWidth: '800px', display: 'flex', flexDirection: 'column' }}>
          <DialogHeader flexShrink={0}>
            <DialogTitle>{editingItem ? 'Editar Regla de Evento' : 'Nueva Regla de Evento'}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody overflowY="auto" flex={1}>
            <VStack align="stretch" gap={4}>
              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>Código <Text as="span" color="red.500">*</Text></Text>
                <Input value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} placeholder="REGLA-001" disabled={saving} />
              </Box>
              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>Nombre <Text as="span" color="red.500">*</Text></Text>
                <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre de la regla" disabled={saving} />
              </Box>
              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>Descripción</Text>
                <Textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Descripción opcional" disabled={saving} minH="80px" />
              </Box>
              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>Tipo de Operación <Text as="span" color="red.500">*</Text></Text>
                <select value={formData.tipoOperacion} onChange={(e) => setFormData({ ...formData, tipoOperacion: e.target.value })} disabled={saving}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid', borderColor: 'var(--chakra-colors-border)' }}>
                  <option value="">Seleccione tipo de operación</option>
                  {tiposOperacion.map((tipo) => (<option key={tipo} value={tipo}>{tipo}</option>))}
                </select>
              </Box>
              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>Evento Trigger <Text as="span" color="red.500">*</Text></Text>
                <select value={formData.eventoTrigger} onChange={(e) => setFormData({ ...formData, eventoTrigger: e.target.value })} disabled={saving}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid', borderColor: 'var(--chakra-colors-border)' }}>
                  <option value="">Seleccione evento trigger</option>
                  {eventosTrigger.map((evento) => (<option key={evento} value={evento}>{evento}</option>))}
                </select>
              </Box>
              <Box>
                <Flex justify="space-between" align="center" mb={2}>
                  <Text fontWeight="medium" color={textColor}>Condiciones DRL <Text as="span" color="red.500">*</Text></Text>
                  <HStack gap={2}>
                    <Button size="xs" variant="outline" onClick={handleLoadPlantillaDrl} disabled={saving}>Cargar Plantilla DRL</Button>
                    <Button size="xs" colorPalette="blue" onClick={handleValidateDrl} loading={validating} disabled={saving || !formData.condicionesDrl}>
                      <HStack gap={1}><FiCheckCircle /><Text>Validar DRL</Text></HStack>
                    </Button>
                  </HStack>
                </Flex>
                <Text fontSize="xs" color={textColorSecondary} mb={2}>Sintaxis Drools DRL (lenguaje de reglas de negocio)</Text>
                <Textarea value={formData.condicionesDrl} onChange={(e) => setFormData({ ...formData, condicionesDrl: e.target.value })}
                  placeholder={`rule "Ejemplo"\nwhen\n    $op : Operacion( monto > 50000, moneda == "USD" )\nthen\n    // Acción a ejecutar\nend`}
                  disabled={saving} minH="300px" fontFamily="monospace" fontSize="sm" />
              </Box>
              <Box>
                <Text fontWeight="medium" color={textColor} mb={2}>Acciones <Text as="span" color="red.500">*</Text></Text>
                <Text fontSize="xs" color={textColorSecondary} mb={3}>Configura las acciones que se ejecutarán cuando la regla se active</Text>
                <ActionEditor value={formData.accionesJson} onChange={(value) => setFormData({ ...formData, accionesJson: value })} disabled={saving} />
              </Box>
              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>Prioridad <Text as="span" color="red.500">*</Text></Text>
                <Text fontSize="xs" color={textColorSecondary} mb={2}>Valor entre 1 y 1000 (mayor número = mayor prioridad)</Text>
                <Input type="number" value={formData.prioridad} onChange={(e) => setFormData({ ...formData, prioridad: parseInt(e.target.value) || 100 })} placeholder="100" min={1} max={1000} disabled={saving} />
              </Box>
              <HStack gap={2}>
                <input type="checkbox" checked={formData.activo} onChange={(e) => setFormData({ ...formData, activo: e.target.checked })} style={{ width: '16px', height: '16px', cursor: 'pointer' }} disabled={saving} />
                <Text color={textColor}>Activo</Text>
              </HStack>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild><Button variant="outline" disabled={saving}>Cancelar</Button></DialogActionTrigger>
            <Button bg={primaryColor} color="white" onClick={handleSubmit} loading={saving}
              disabled={!formData.codigo || !formData.nombre || !formData.tipoOperacion || !formData.eventoTrigger || !formData.condicionesDrl || !formData.accionesJson || formData.prioridad < 1 || formData.prioridad > 1000}>
              {editingItem ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Delete Confirmation */}
      <DialogRoot open={deleteDialogOpen} onOpenChange={(e) => setDeleteDialogOpen(e.open)}>
        <DialogContent css={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Text color={textColor}>¿Está seguro de que desea eliminar &quot;{itemToDelete?.nombre}&quot;?</Text>
            <Text fontSize="sm" color={textColorSecondary} mt={2}>Esta acción no se puede deshacer.</Text>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild><Button variant="outline" disabled={deleting}>Cancelar</Button></DialogActionTrigger>
            <Button colorPalette="red" onClick={handleDeleteConfirm} loading={deleting}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* History Modal */}
      <DialogRoot open={isHistoryModalOpen} onOpenChange={(e) => setIsHistoryModalOpen(e.open)}>
        <DialogContent css={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, maxHeight: '90vh', minWidth: '700px', maxWidth: '800px', display: 'flex', flexDirection: 'column' }}>
          <DialogHeader flexShrink={0}>
            <DialogTitle>Historial de Cambios - {selectedItem?.nombre}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody overflowY="auto" flex={1}>
            {loadingHistory ? (
              <Flex justify="center" align="center" py={10}><Spinner size="xl" color={primaryColor} /></Flex>
            ) : eventHistory.length === 0 ? (
              <Box textAlign="center" py={10}><Text color={textColorSecondary}>No hay eventos registrados</Text></Box>
            ) : (
              <VStack align="stretch" gap={4} maxH="500px" overflowY="auto">
                {eventHistory.map((event, index) => (
                  <Box key={event.eventId} p={4} borderRadius="md" border="1px" borderColor={borderColor} bg={index === 0 ? colors.hoverBg : cardBg}>
                    <Flex justify="space-between" align="start" mb={2}>
                      <Box>
                        <Text fontWeight="bold" color={textColor} fontSize="sm">{event.eventType}</Text>
                        <Text fontSize="xs" color={textColorSecondary}>Versión {event.version}</Text>
                      </Box>
                      <Badge colorPalette="blue" size="sm">{new Date(event.timestamp).toLocaleString('es-MX')}</Badge>
                    </Flex>
                    <Text fontSize="xs" color={textColorSecondary} mb={2}>Por: {event.performedBy}</Text>
                    {Object.keys(event.eventData).length > 0 && (
                      <Box mt={2} p={2} bg={bgColor} borderRadius="sm" fontSize="xs">
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
            <DialogActionTrigger asChild><Button variant="outline">Cerrar</Button></DialogActionTrigger>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Test Modal */}
      <DialogRoot open={testModalOpen} onOpenChange={(e) => setTestModalOpen(e.open)}>
        <DialogContent maxW="700px" maxH="90vh" display="flex" flexDirection="column">
          <DialogHeader flexShrink={0}>
            <DialogTitle>Probar Regla - {selectedItem?.nombre}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody overflowY="auto" flex={1}>
            <VStack align="stretch" gap={4}>
              <Box p={4} bg={bgColor} borderRadius="md" border="1px" borderColor={borderColor}>
                <Text fontWeight="bold" color={textColor} mb={3}>Datos de Prueba</Text>
                <VStack align="stretch" gap={3}>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1} color={textColor}>Tipo de Operación</Text>
                    <select value={testData.operationType} onChange={(e) => setTestData({ ...testData, operationType: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid', borderColor: 'var(--chakra-colors-border)' }}>
                      <option value="">Seleccione tipo</option>
                      {tiposOperacion.map((tipo) => (<option key={tipo} value={tipo}>{tipo}</option>))}
                    </select>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1} color={textColor}>Monto de Operación</Text>
                    <Input type="number" value={testData.operationAmount} onChange={(e) => setTestData({ ...testData, operationAmount: e.target.value })} placeholder="50000.00" />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1} color={textColor}>Moneda</Text>
                    <Input value={testData.currency} onChange={(e) => setTestData({ ...testData, currency: e.target.value })} placeholder="USD" />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1} color={textColor}>Código de Usuario</Text>
                    <Input value={testData.userCode} onChange={(e) => setTestData({ ...testData, userCode: e.target.value })} placeholder="USR001" />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1} color={textColor}>Rol de Usuario</Text>
                    <Input value={testData.userRole} onChange={(e) => setTestData({ ...testData, userRole: e.target.value })} placeholder="OPERADOR" />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1} color={textColor}>País de Contraparte</Text>
                    <Input value={testData.contraparteCountry} onChange={(e) => setTestData({ ...testData, contraparteCountry: e.target.value })} placeholder="USA" />
                  </Box>
                  <Box borderTop="1px" borderColor={borderColor} my={3} />
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1} color={textColor}>O ingresa JSON completo (opcional)</Text>
                    <Text fontSize="xs" color={textColorSecondary} mb={2}>Si ingresas JSON, este tendrá prioridad sobre los campos individuales</Text>
                    <textarea value={testJsonRaw} onChange={(e) => setTestJsonRaw(e.target.value)}
                      placeholder={`{\n  "operationType": "PLANTILLA",\n  "operationAmount": 0,\n  "currency": "USD"\n}`}
                      style={{ width: '100%', minHeight: '200px', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid', borderColor: 'var(--chakra-colors-border)', fontFamily: 'monospace', fontSize: '0.875rem' }} />
                  </Box>
                </VStack>
                <Button mt={4} w="full" bg={primaryColor} color="white" onClick={handleExecuteTest} loading={testing}>
                  <HStack gap={2}><FiPlay /><Text>Ejecutar Prueba</Text></HStack>
                </Button>
              </Box>

              {testResult && (
                <Box p={4} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
                  <Text fontWeight="bold" color={textColor} mb={3}>Resultado de la Prueba</Text>
                  <VStack align="stretch" gap={3}>
                    <Flex justify="space-between" align="center">
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>Regla Coincidió:</Text>
                      <Badge colorPalette={testResult.resultado.ruleMatched ? 'green' : 'red'} size="lg">{testResult.resultado.ruleMatched ? 'SÍ' : 'NO'}</Badge>
                    </Flex>
                    <Flex justify="space-between" align="center">
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>Tiempo de Ejecución:</Text>
                      <Text fontSize="sm" color={textColorSecondary}>{testResult.resultado.executionTimeMs} ms</Text>
                    </Flex>
                    {testResult.resultado.triggeredActions.length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>Acciones Disparadas:</Text>
                        <VStack align="stretch" gap={2}>
                          {testResult.resultado.triggeredActions.map((action, index) => (
                            <Box key={index} p={2} bg={bgColor} borderRadius="sm"><Badge colorPalette="green" size="sm" mb={1}>{action}</Badge></Box>
                          ))}
                        </VStack>
                      </Box>
                    )}
                    {testResult.resultado.messages.length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>Mensajes:</Text>
                        <VStack align="stretch" gap={2}>
                          {testResult.resultado.messages.map((message, index) => (
                            <Box key={index} p={2} bg={bgColor} borderRadius="sm"><Text fontSize="xs" color={textColorSecondary}>{message}</Text></Box>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </Box>
              )}
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild><Button variant="outline">Cerrar</Button></DialogActionTrigger>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
};

export default EventRulesTab;
