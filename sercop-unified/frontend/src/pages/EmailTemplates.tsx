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
import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiEye } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import {
  plantillaCorreoService,
  type PlantillaCorreo,
  type EventHistory
} from '../services/emailTemplateService';
import { plantillaService, type Plantilla } from '../services/templateService';
import { notify } from '../components/ui/toaster';
import { sanitizeHtml } from '../utils/sanitize';
import { VariablePicker, useTemplateVariables } from '../components/VariablePicker';
import { HtmlEmailEditor } from '../components/HtmlEmailEditor';
import { DataTable, type DataTableColumn, type DataTableAction } from '../components/ui/DataTable';

export const EmailTemplates = () => {
  const { getColors } = useTheme();

  const [plantillasCorreo, setPlantillasCorreo] = useState<PlantillaCorreo[]>([]);
  const [plantillasDocumento, setPlantillasDocumento] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlantillaCorreo | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    asunto: '',
    cuerpoHtml: '',
    plantillasAdjuntas: [] as number[],
    activo: true,
  });
  const [saving, setSaving] = useState(false);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PlantillaCorreo | null>(null);
  const [deleting, setDeleting] = useState(false);

  // History modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [eventHistory, setEventHistory] = useState<EventHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PlantillaCorreo | null>(null);

  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState({
    asunto: '',
    cuerpo: '',
    adjuntos: [] as Plantilla[],
  });
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [loadingPreview, setLoadingPreview] = useState(false);

  const colors = getColors();
  const { bgColor, borderColor, cardBg, textColor, textColorSecondary, primaryColor } = colors;

  // Template variables for VariablePicker
  const { variables: templateVarCategories, categoryLabels } = useTemplateVariables();
  const subjectInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [correos, documentos] = await Promise.all([
        plantillaCorreoService.getAllPlantillasCorreo(),
        plantillaService.getAllPlantillas(),
      ]);
      setPlantillasCorreo(correos);
      setPlantillasDocumento(documentos.filter(p => p.activo));
    } catch (error) {
      notify.error('Error', 'Error al cargar datos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      asunto: '',
      cuerpoHtml: '',
      plantillasAdjuntas: [],
      activo: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: PlantillaCorreo) => {
    setEditingItem(item);

    // Parse plantillasAdjuntas from JSON string to array
    let adjuntas: number[] = [];
    if (item.plantillasAdjuntas) {
      try {
        adjuntas = JSON.parse(item.plantillasAdjuntas);
      } catch (e) {
        console.error('Error parsing plantillasAdjuntas:', e);
      }
    }

    setFormData({
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      asunto: item.asunto,
      cuerpoHtml: item.cuerpoHtml,
      plantillasAdjuntas: adjuntas,
      activo: item.activo,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.codigo || !formData.nombre || !formData.asunto || !formData.cuerpoHtml) {
      notify.warning('Validación', 'Código, Nombre, Asunto y Cuerpo HTML son obligatorios');
      return;
    }

    try {
      setSaving(true);

      // Convert plantillasAdjuntas array to JSON string
      const plantillasAdjuntasJson = JSON.stringify(formData.plantillasAdjuntas);

      if (editingItem) {
        await plantillaCorreoService.updatePlantillaCorreo(editingItem.id, {
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          asunto: formData.asunto,
          cuerpoHtml: formData.cuerpoHtml,
          plantillasAdjuntas: plantillasAdjuntasJson,
          activo: formData.activo,
          updatedBy: 'system',
        });
        notify.success('Éxito', 'Actualizado correctamente');
      } else {
        await plantillaCorreoService.createPlantillaCorreo({
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          asunto: formData.asunto,
          cuerpoHtml: formData.cuerpoHtml,
          plantillasAdjuntas: plantillasAdjuntasJson,
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

  const handleDeleteClick = (item: PlantillaCorreo) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      await plantillaCorreoService.deletePlantillaCorreo(itemToDelete.id, 'system');
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

  const handleViewHistory = async (item: PlantillaCorreo) => {
    try {
      setSelectedItem(item);
      setLoadingHistory(true);
      setIsHistoryModalOpen(true);
      const history = await plantillaCorreoService.getEventHistory(item.id);
      setEventHistory(history);
    } catch (error) {
      notify.error('Error', 'Error al cargar historial: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      setIsHistoryModalOpen(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePreview = async (item: PlantillaCorreo) => {
    try {
      setSelectedItem(item);
      setLoadingPreview(true);
      setPreviewModalOpen(true);

      // Extract variables from asunto and cuerpoHtml
      const asuntoVars = plantillaCorreoService.extractVariables(item.asunto);
      const cuerpoVars = plantillaCorreoService.extractVariables(item.cuerpoHtml);
      const allVariables = Array.from(new Set([...asuntoVars, ...cuerpoVars]));
      setTemplateVariables(allVariables);

      // Initialize empty values for all variables
      const initialValues: Record<string, any> = {};
      allVariables.forEach(v => {
        initialValues[v] = '';
      });
      setVariableValues(initialValues);

      // Get attached templates
      let adjuntos: Plantilla[] = [];
      if (item.plantillasAdjuntas) {
        try {
          const adjuntasIds: number[] = JSON.parse(item.plantillasAdjuntas);
          adjuntos = plantillasDocumento.filter(p => adjuntasIds.includes(p.id));
        } catch (e) {
          console.error('Error parsing plantillasAdjuntas:', e);
        }
      }

      // Render preview with empty values initially
      const rendered = plantillaCorreoService.renderEmailPreview(item.asunto, item.cuerpoHtml, initialValues);
      setPreviewData({
        asunto: rendered.asunto,
        cuerpo: rendered.cuerpo,
        adjuntos,
      });
    } catch (error) {
      notify.error('Error', 'Error al generar vista previa: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      setPreviewModalOpen(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleUpdatePreview = () => {
    if (!selectedItem) return;

    const rendered = plantillaCorreoService.renderEmailPreview(
      selectedItem.asunto,
      selectedItem.cuerpoHtml,
      variableValues
    );

    setPreviewData({
      ...previewData,
      asunto: rendered.asunto,
      cuerpo: rendered.cuerpo,
    });
  };

  const handleLoadSampleData = () => {
    const sampleData: Record<string, any> = {
      nombreCliente: 'Juan Pérez García',
      emailCliente: 'juan.perez@ejemplo.com',
      numeroOperacion: 'LC-2025-001',
      fechaEmision: '2025-10-24',
      fechaVencimiento: '2026-01-24',
      moneda: 'USD',
      monto: '50,000.00',
      bancoEmisor: 'Banco Nacional de México',
      ordenanteNombre: 'EMPRESA IMPORTADORA S.A.',
      beneficiarioNombre: 'EXPORTADORA USA INC.',
      descripcionMercancia: 'Productos electrónicos diversos',
      puertoEmbarque: 'Veracruz, México',
      puertoDestino: 'Los Angeles, USA',
      numeroReferencia: 'REF-2025-0089',
      fechaActual: new Date().toLocaleDateString('es-MX'),
      horaActual: new Date().toLocaleTimeString('es-MX'),
      nombreEjecutivo: 'María González',
      cargoEjecutivo: 'Ejecutivo de Comercio Exterior',
      telefonoContacto: '+52 (55) 1234-5678',
      emailContacto: 'comercioexterior@banco.com',
    };

    setVariableValues(sampleData);
  };

  const handleToggleAttachment = (plantillaId: number) => {
    const current = formData.plantillasAdjuntas;
    if (current.includes(plantillaId)) {
      setFormData({
        ...formData,
        plantillasAdjuntas: current.filter(id => id !== plantillaId),
      });
    } else {
      setFormData({
        ...formData,
        plantillasAdjuntas: [...current, plantillaId],
      });
    }
  };

  const getAttachedTemplateNames = (plantillasAdjuntasJson?: string): string => {
    if (!plantillasAdjuntasJson) return '-';

    try {
      const ids: number[] = JSON.parse(plantillasAdjuntasJson);
      if (ids.length === 0) return '-';

      const nombres = ids
        .map(id => plantillasDocumento.find(p => p.id === id)?.nombre || `ID: ${id}`)
        .join(', ');

      return nombres || '-';
    } catch (e) {
      return '-';
    }
  };

  // DataTable columns
  const columns: DataTableColumn<PlantillaCorreo>[] = [
    {
      key: 'codigo',
      label: 'Código',
      render: (row) => <Text fontWeight="semibold">{row.codigo}</Text>,
    },
    {
      key: 'nombre',
      label: 'Nombre',
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      render: (row) => <Text color={textColorSecondary}>{row.descripcion || '-'}</Text>,
      hideOnMobile: true,
    },
    {
      key: 'asunto',
      label: 'Asunto',
      render: (row) => (
        <Text fontSize="xs" noOfLines={2} maxW="300px">
          {row.asunto}
        </Text>
      ),
      hideOnMobile: true,
    },
    {
      key: 'plantillasAdjuntas',
      label: 'Plantillas Adjuntas',
      filterable: false,
      sortable: false,
      render: (row) => (
        <Text fontSize="xs" noOfLines={2} maxW="250px">
          {getAttachedTemplateNames(row.plantillasAdjuntas)}
        </Text>
      ),
      hideOnMobile: true,
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

  // DataTable actions
  const actions: DataTableAction<PlantillaCorreo>[] = [
    {
      key: 'preview',
      label: 'Vista preliminar',
      icon: FiEye,
      colorPalette: 'purple',
      onClick: (row) => {
        setSelectedItem(row);
        handlePreview(row);
      },
    },
    {
      key: 'history',
      label: 'Historial',
      icon: FiClock,
      colorPalette: 'blue',
      onClick: (row) => handleViewHistory(row),
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
      onClick: (row) => handleDeleteClick(row),
    },
  ];

  return (
    <>
      <Box flex={1} p={6}>
        <VStack align="stretch" gap={6}>
          {/* Header */}
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color={textColor}>
              Plantillas de Correo
            </Text>
            <Text fontSize="sm" color={textColorSecondary} mt={1}>
              Gestión de plantillas de correo electrónico con variables dinámicas
            </Text>
          </Box>

          {/* DataTable replaces loading, filters, table, empty state, and summary */}
          <DataTable<PlantillaCorreo>
            data={plantillasCorreo}
            columns={columns}
            rowKey={(row) => String(row.id)}
            actions={actions}
            isLoading={loading}
            emptyMessage="No hay plantillas de correo registradas"
            defaultPageSize={10}
            toolbarRight={
              <Button
                bg={primaryColor}
                color="white"
                onClick={handleCreate}
                _hover={{ opacity: 0.9 }}
              >
                <HStack gap={2}>
                  <FiPlus />
                  <Text>Nueva Plantilla de Correo</Text>
                </HStack>
              </Button>
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
            overflowY: 'auto',
            minWidth: '900px',
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Plantilla de Correo' : 'Nueva Plantilla de Correo'}
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
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="EMAIL-001"
                  disabled={saving}
                />
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>
                  Nombre <Text as="span" color="red.500">*</Text>
                </Text>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre de la plantilla de correo"
                  disabled={saving}
                />
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>
                  Descripción
                </Text>
                <Input
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción opcional"
                  disabled={saving}
                />
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>
                  Asunto del Correo <Text as="span" color="red.500">*</Text>
                </Text>
                <Text fontSize="xs" color={textColorSecondary} mb={2}>
                  Use variables con formato: $&#123;nombreVariable&#125;
                </Text>
                <VariablePicker
                  onSelect={(varName) => {
                    const input = subjectInputRef.current;
                    if (input) {
                      const start = input.selectionStart || formData.asunto.length;
                      const end = input.selectionEnd || formData.asunto.length;
                      const variable = `\${${varName}}`;
                      const newValue = formData.asunto.substring(0, start) + variable + formData.asunto.substring(end);
                      setFormData({ ...formData, asunto: newValue });
                      setTimeout(() => {
                        input.focus();
                        const newPos = start + variable.length;
                        input.setSelectionRange(newPos, newPos);
                      }, 0);
                    } else {
                      setFormData({ ...formData, asunto: formData.asunto + `\${${varName}}` });
                    }
                  }}
                  disabled={saving}
                  availableVariables={templateVarCategories}
                  categoryLabels={categoryLabels}
                  variableSyntax="dollar"
                />
                <Input
                  ref={subjectInputRef}
                  value={formData.asunto}
                  onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                  placeholder="Ejemplo: Notificación de Operación ${numeroOperacion}"
                  disabled={saving}
                />
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>
                  Cuerpo HTML del Correo <Text as="span" color="red.500">*</Text>
                </Text>
                <Text fontSize="xs" color={textColorSecondary} mb={2}>
                  HTML con variables Thymeleaf: $&#123;variable&#125; o [[...]]
                </Text>
                <HtmlEmailEditor
                  value={formData.cuerpoHtml}
                  onChange={(html) => setFormData({ ...formData, cuerpoHtml: html })}
                  disabled={saving}
                  variables={templateVarCategories}
                  categoryLabels={categoryLabels}
                  placeholder='<html>\n<body>\n  <h1>Estimado ${nombreCliente}</h1>\n  <p>Su operación...</p>\n</body>\n</html>'
                />
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>
                  Plantillas de Documentos Adjuntas
                </Text>
                <Text fontSize="xs" color={textColorSecondary} mb={2}>
                  Seleccione las plantillas de documentos que se adjuntarán al correo
                </Text>
                <Box
                  border="1px"
                  borderColor={borderColor}
                  borderRadius="md"
                  p={3}
                  maxH="200px"
                  overflowY="auto"
                >
                  {plantillasDocumento.length === 0 ? (
                    <Text fontSize="sm" color={textColorSecondary}>
                      No hay plantillas de documentos disponibles
                    </Text>
                  ) : (
                    <VStack align="stretch" gap={2}>
                      {plantillasDocumento.map((plantilla) => (
                        <HStack key={plantilla.id} gap={2}>
                          <input
                            type="checkbox"
                            checked={formData.plantillasAdjuntas.includes(plantilla.id)}
                            onChange={() => handleToggleAttachment(plantilla.id)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            disabled={saving}
                          />
                          <Text fontSize="sm" color={textColor}>
                            {plantilla.nombre} ({plantilla.codigo})
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </Box>
                {formData.plantillasAdjuntas.length > 0 && (
                  <Text fontSize="xs" color="green.600" mt={2}>
                    {formData.plantillasAdjuntas.length} plantilla(s) seleccionada(s)
                  </Text>
                )}
              </Box>

              <HStack gap={2}>
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  disabled={saving}
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
              disabled={!formData.codigo || !formData.nombre || !formData.asunto || !formData.cuerpoHtml}
            >
              {editingItem ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Delete Confirmation Dialog */}
      <DialogRoot open={deleteDialogOpen} onOpenChange={(e) => setDeleteDialogOpen(e.open)}>
        <DialogContent
          css={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
          }}
        >
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Text color={textColor}>
              ¿Está seguro de que desea eliminar "{itemToDelete?.nombre}"?
            </Text>
            <Text fontSize="sm" color={textColorSecondary} mt={2}>
              Esta acción no se puede deshacer.
            </Text>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline" disabled={deleting}>
                Cancelar
              </Button>
            </DialogActionTrigger>
            <Button
              colorPalette="red"
              onClick={handleDeleteConfirm}
              loading={deleting}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* History Modal */}
      <DialogRoot open={isHistoryModalOpen} onOpenChange={(e) => setIsHistoryModalOpen(e.open)}>
        <DialogContent
          css={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            maxHeight: '90vh',
            overflowY: 'auto',
            minWidth: '700px',
            maxWidth: '800px',
          }}
        >
          <DialogHeader>
            <DialogTitle>
              Historial de Cambios - {selectedItem?.nombre}
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

      {/* Preview Modal */}
      <DialogRoot
        open={previewModalOpen}
        onOpenChange={(e) => setPreviewModalOpen(e.open)}
      >
        <DialogContent
          css={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            maxHeight: '90vh',
            overflowY: 'auto',
            minWidth: '700px',
            maxWidth: '900px',
          }}
        >
          <DialogHeader>
            <DialogTitle>
              Vista Preliminar del Correo - {selectedItem?.nombre}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            {loadingPreview ? (
              <Flex justify="center" align="center" py={10}>
                <Spinner size="xl" color={primaryColor} />
              </Flex>
            ) : (
              <VStack align="stretch" gap={4}>
                {/* Variables Form */}
                {templateVariables.length > 0 && (
                  <Box
                    p={4}
                    bg={bgColor}
                    borderRadius="md"
                    border="1px"
                    borderColor={borderColor}
                  >
                    <Flex justify="space-between" align="center" mb={3}>
                      <Text fontWeight="bold" color={textColor}>
                        Variables de la Plantilla
                      </Text>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLoadSampleData}
                      >
                        Cargar Datos de Ejemplo
                      </Button>
                    </Flex>
                    <VStack align="stretch" gap={3} maxH="200px" overflowY="auto">
                      {templateVariables.map((variable) => (
                        <Box key={variable}>
                          <Text fontSize="sm" fontWeight="medium" mb={1} color={textColor}>
                            {variable}
                          </Text>
                          <Input
                            size="sm"
                            value={variableValues[variable] || ''}
                            onChange={(e) => setVariableValues({
                              ...variableValues,
                              [variable]: e.target.value
                            })}
                            placeholder={`Valor para ${variable}`}
                          />
                        </Box>
                      ))}
                    </VStack>
                    <Button
                      mt={3}
                      w="full"
                      bg={primaryColor}
                      color="white"
                      onClick={handleUpdatePreview}
                      size="sm"
                    >
                      Actualizar Vista Previa
                    </Button>
                  </Box>
                )}

                {/* Email Preview */}
                <Box
                  p={4}
                  bg={cardBg}
                  borderRadius="md"
                  border="1px"
                  borderColor={borderColor}
                >
                  <VStack align="stretch" gap={4}>
                    {/* Subject */}
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color={textColorSecondary} mb={2}>
                        Asunto:
                      </Text>
                      <Box
                        p={3}
                        bg={bgColor}
                        borderRadius="md"
                        border="1px"
                        borderColor={borderColor}
                      >
                        <Text color={textColor} fontWeight="medium">
                          {previewData.asunto}
                        </Text>
                      </Box>
                    </Box>

                    {/* HTML Body */}
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color={textColorSecondary} mb={2}>
                        Cuerpo del Correo:
                      </Text>
                      <Box
                        p={4}
                        bg="white"
                        borderRadius="md"
                        border="1px"
                        borderColor={borderColor}
                        maxH="300px"
                        overflowY="auto"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewData.cuerpo) }}
                      />
                    </Box>

                    {/* Attachments */}
                    {previewData.adjuntos.length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" color={textColorSecondary} mb={2}>
                          Plantillas Adjuntas ({previewData.adjuntos.length}):
                        </Text>
                        <Box
                          p={3}
                          bg={bgColor}
                          borderRadius="md"
                          border="1px"
                          borderColor={borderColor}
                        >
                          <VStack align="stretch" gap={2}>
                            {previewData.adjuntos.map((adjunto) => (
                              <HStack key={adjunto.id} gap={2}>
                                <Badge colorPalette="blue" size="sm">
                                  {adjunto.tipoDocumento || 'DOC'}
                                </Badge>
                                <Text fontSize="sm" color={textColor}>
                                  {adjunto.nombre}
                                </Text>
                                <Text fontSize="xs" color={textColorSecondary}>
                                  ({adjunto.codigo})
                                </Text>
                              </HStack>
                            ))}
                          </VStack>
                        </Box>
                      </Box>
                    )}
                  </VStack>
                </Box>
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
