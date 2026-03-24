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
  DialogBackdrop,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiDownload, FiEye, FiUpload } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import {
  plantillaService,
  type Plantilla,
  type EventHistory
} from '../services/templateService';
import { notify } from '../components/ui/toaster';
import { DataTable, type DataTableColumn, type DataTableAction } from '../components/ui/DataTable';

export const Templates = () => {
  const { getColors } = useTheme();
  const { t } = useTranslation();

  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Plantilla | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipoDocumento: '',
    nombreArchivo: '',
    rutaArchivo: '',
    tamanioArchivo: 0,
    activo: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Plantilla | null>(null);
  const [deleting, setDeleting] = useState(false);

  // History modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [eventHistory, setEventHistory] = useState<EventHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Plantilla | null>(null);

  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // PDF Generation modal state (for HTML templates)
  const [pdfGenerationModalOpen, setPdfGenerationModalOpen] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [loadingVariables, setLoadingVariables] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [selectedTemplateForPdf, setSelectedTemplateForPdf] = useState<Plantilla | null>(null);

  const colors = getColors();
  const { bgColor, borderColor, cardBg, textColor, textColorSecondary, primaryColor } = colors;

  useEffect(() => {
    loadPlantillas();
  }, []);

  const loadPlantillas = async () => {
    try {
      setLoading(true);
      const data = await plantillaService.getAllPlantillas();
      setPlantillas(data);
    } catch (error) {
      notify.error(t('plantillas.errorTitle', 'Error'), t('plantillas.errorLoading') + ': ' + (error instanceof Error ? error.message : t('common.unknownError')));
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      tipoDocumento: '',
      nombreArchivo: '',
      rutaArchivo: '',
      tamanioArchivo: 0,
      activo: true,
    });
    setUploadedFile(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Plantilla) => {
    setEditingItem(item);
    setFormData({
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      tipoDocumento: item.tipoDocumento || '',
      nombreArchivo: item.nombreArchivo || '',
      rutaArchivo: item.rutaArchivo || '',
      tamanioArchivo: item.tamanioArchivo || 0,
      activo: item.activo,
    });
    setUploadedFile(null);
    setIsModalOpen(true);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setUploading(true);

    try {
      const fileData = await plantillaService.uploadFile(file);
      setFormData({
        ...formData,
        nombreArchivo: fileData.nombreArchivo,
        rutaArchivo: fileData.rutaArchivo,
        tamanioArchivo: fileData.tamanioArchivo,
        tipoDocumento: fileData.tipoDocumento,
      });
      notify.success(t('plantillas.successTitle', 'Exito'), t('plantillas.fileUploadedSuccessfully'));
    } catch (error) {
      notify.error(t('plantillas.errorTitle', 'Error'), t('plantillas.errorUploadingFile') + ': ' + (error instanceof Error ? error.message : t('common.unknownError')));
      setUploadedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.codigo || !formData.nombre) {
      notify.warning(t('plantillas.validationTitle', 'Validacion'), t('plantillas.codigoNombreRequired'));
      return;
    }

    try {
      setSaving(true);

      if (editingItem) {
        await plantillaService.updatePlantilla(editingItem.id, {
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          tipoDocumento: formData.tipoDocumento,
          nombreArchivo: formData.nombreArchivo,
          rutaArchivo: formData.rutaArchivo,
          tamanioArchivo: formData.tamanioArchivo,
          activo: formData.activo,
          updatedBy: 'system',
        });
        notify.success(t('plantillas.successTitle', 'Exito'), t('plantillas.updatedSuccessfully'));
      } else {
        await plantillaService.createPlantilla({
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          tipoDocumento: formData.tipoDocumento,
          nombreArchivo: formData.nombreArchivo,
          rutaArchivo: formData.rutaArchivo,
          tamanioArchivo: formData.tamanioArchivo,
          activo: formData.activo,
          createdBy: 'system',
        });
        notify.success(t('plantillas.successTitle', 'Exito'), t('plantillas.createdSuccessfully'));
      }

      setIsModalOpen(false);
      await new Promise(resolve => setTimeout(resolve, 1500));
      await loadPlantillas();
    } catch (error) {
      notify.error(t('plantillas.errorTitle', 'Error'), t('plantillas.errorSaving') + ': ' + (error instanceof Error ? error.message : t('common.unknownError')));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (item: Plantilla) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      await plantillaService.deletePlantilla(itemToDelete.id, 'system');
      notify.success(t('plantillas.successTitle', 'Exito'), t('plantillas.deletedSuccessfully'));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      await new Promise(resolve => setTimeout(resolve, 1500));
      await loadPlantillas();
    } catch (error) {
      notify.error(t('plantillas.errorTitle', 'Error'), t('plantillas.errorDeleting') + ': ' + (error instanceof Error ? error.message : t('common.unknownError')));
    } finally {
      setDeleting(false);
    }
  };

  const handleViewHistory = async (item: Plantilla) => {
    try {
      setSelectedItem(item);
      setLoadingHistory(true);
      setIsHistoryModalOpen(true);
      const history = await plantillaService.getEventHistory(item.id);
      setEventHistory(history);
    } catch (error) {
      notify.error(t('plantillas.errorTitle', 'Error'), t('plantillas.errorLoadingHistory') + ': ' + (error instanceof Error ? error.message : t('common.unknownError')));
      setIsHistoryModalOpen(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDownload = (item: Plantilla) => {
    window.open(plantillaService.getDownloadUrl(item.id), '_blank');
  };

  const handlePreview = async (item: Plantilla) => {
    try {
      // Si es HTML, mostrar el modal de generacion con formulario de variables
      if (item.tipoDocumento === 'HTML') {
        setSelectedTemplateForPdf(item);
        setLoadingVariables(true);
        setPdfGenerationModalOpen(true);

        try {
          const variables = await plantillaService.getTemplateVariables(item.id);
          setTemplateVariables(variables);

          // Inicializar valores vacios para cada variable
          const initialValues: Record<string, any> = {};
          variables.forEach(v => {
            // Si la variable parece ser un array/lista, inicializarla como array vacio
            if (v.toLowerCase().includes('documento') ||
                v.toLowerCase().includes('lista') ||
                v.toLowerCase().includes('items') ||
                v.toLowerCase().includes('detalle')) {
              initialValues[v] = '[]';
            } else {
              initialValues[v] = '';
            }
          });
          setVariableValues(initialValues);
        } catch (error) {
          notify.error(t('plantillas.errorTitle', 'Error'), t('plantillas.errorLoadingVariables') + ': ' + (error instanceof Error ? error.message : t('common.unknownError')));
          setPdfGenerationModalOpen(false);
        } finally {
          setLoadingVariables(false);
        }
      } else if (item.tipoDocumento === 'PDF') {
        // Si ya es PDF, abrirlo directamente
        window.open(plantillaService.getPreviewPdfUrl(item.id), '_blank');
      } else {
        // Si no es PDF ni HTML, advertir al usuario que la conversion puede tardar
        const confirmed = window.confirm(
          t('plantillas.conversionWarning', { tipoDocumento: item.tipoDocumento })
        );

        if (confirmed) {
          window.open(plantillaService.getPreviewPdfUrl(item.id), '_blank');
        }
      }
    } catch (error) {
      notify.error(t('plantillas.errorTitle', 'Error'), t('plantillas.errorGeneratingPreview') + ': ' + (error instanceof Error ? error.message : t('common.unknownError')));
    }
  };

  const handleGeneratePdf = async () => {
    if (!selectedTemplateForPdf) return;

    try {
      setGeneratingPdf(true);

      // Procesar los valores - parsear JSON si es necesario
      const processedValues: Record<string, any> = {};
      for (const [key, value] of Object.entries(variableValues)) {
        if (typeof value === 'string' && (value.trim().startsWith('[') || value.trim().startsWith('{'))) {
          // Intentar parsear como JSON
          try {
            processedValues[key] = JSON.parse(value);
            console.log(`Parsed ${key}:`, processedValues[key]);
          } catch (e) {
            console.error(`Failed to parse ${key}:`, value, e);
            // Si falla el parse, usar como string
            processedValues[key] = value;
          }
        } else {
          processedValues[key] = value;
        }
      }

      console.log('Sending data to backend:', processedValues);

      const blob = await plantillaService.generatePdfFromTemplate(
        selectedTemplateForPdf.id,
        processedValues,
        `${selectedTemplateForPdf.codigo}.pdf`
      );

      // Crear URL para el blob y descargarlo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTemplateForPdf.codigo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notify.success(t('plantillas.successTitle', 'Exito'), t('plantillas.pdfGeneratedSuccessfully'));
      setPdfGenerationModalOpen(false);
    } catch (error) {
      notify.error(t('plantillas.errorTitle', 'Error'), t('plantillas.errorGeneratingPdf') + ': ' + (error instanceof Error ? error.message : t('common.unknownError')));
    } finally {
      setGeneratingPdf(false);
    }
  };

  // DataTable columns definition
  const columns: DataTableColumn<Plantilla>[] = [
    {
      key: 'codigo',
      label: t('plantillas.codigo'),
      render: (row) => <Text fontWeight="semibold">{row.codigo}</Text>,
    },
    {
      key: 'nombre',
      label: t('plantillas.nombre'),
    },
    {
      key: 'descripcion',
      label: t('plantillas.descripcion'),
      render: (row) => <Text color={textColorSecondary}>{row.descripcion || '-'}</Text>,
      hideOnMobile: true,
    },
    {
      key: 'tipoDocumento',
      label: t('plantillas.tipo'),
      filterType: 'select',
      filterOptions: [
        { value: 'HTML', label: 'HTML' },
        { value: 'PDF', label: 'PDF' },
      ],
      render: (row) => (
        <Badge colorPalette="blue" size="sm">
          {row.tipoDocumento || 'N/A'}
        </Badge>
      ),
      hideOnMobile: true,
    },
    {
      key: 'nombreArchivo',
      label: t('plantillas.archivo'),
      render: (row) => (
        <Text color={textColorSecondary} fontSize="xs">
          {row.nombreArchivo || '-'}
        </Text>
      ),
      hideOnMobile: true,
    },
    {
      key: 'tamanioArchivo',
      label: t('plantillas.tamanio'),
      render: (row) => (
        <Text color={textColorSecondary} fontSize="xs">
          {row.tamanioArchivo ? formatFileSize(row.tamanioArchivo) : '-'}
        </Text>
      ),
      hideOnMobile: true,
    },
    {
      key: 'activo',
      label: t('plantillas.estado'),
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: t('plantillas.activo') },
        { value: 'false', label: t('common.inactivo') },
      ],
      render: (row) => (
        <Badge colorPalette={row.activo ? 'green' : 'red'}>
          {row.activo ? t('plantillas.activo') : t('common.inactivo')}
        </Badge>
      ),
    },
  ];

  // DataTable actions definition
  const actions: DataTableAction<Plantilla>[] = [
    {
      key: 'preview',
      label: t('plantillas.preview'),
      icon: FiEye,
      colorPalette: 'purple',
      onClick: (row) => handlePreview(row),
      isHidden: (row) => !row.rutaArchivo,
    },
    {
      key: 'download',
      label: t('plantillas.download'),
      icon: FiDownload,
      colorPalette: 'green',
      onClick: (row) => handleDownload(row),
      isHidden: (row) => !row.rutaArchivo,
    },
    {
      key: 'history',
      label: t('plantillas.history'),
      icon: FiClock,
      colorPalette: 'blue',
      onClick: (row) => handleViewHistory(row),
    },
    {
      key: 'edit',
      label: t('common.editar'),
      icon: FiEdit2,
      onClick: (row) => handleEdit(row),
    },
    {
      key: 'delete',
      label: t('common.eliminar'),
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
              {t('plantillas.title')}
            </Text>
            <Text fontSize="sm" color={textColorSecondary} mt={1}>
              {t('plantillas.subtitle')}
            </Text>
          </Box>

          {/* DataTable replaces loading, filters, table, and summary */}
          <DataTable<Plantilla>
            data={plantillas}
            columns={columns}
            rowKey={(row) => String(row.id)}
            actions={actions}
            isLoading={loading}
            emptyMessage={t('plantillas.noTemplatesRegistered')}
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
                  <Text>{t('plantillas.createNew')}</Text>
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
            overflowY: 'auto'
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t('plantillas.editTemplate') : t('plantillas.newTemplate')}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack align="stretch" gap={4}>
              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>
                  {t('plantillas.codigo')} <Text as="span" color="red.500">*</Text>
                </Text>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder={t('plantillas.codigoPlaceholder')}
                  disabled={saving}
                />
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>
                  {t('plantillas.nombre')} <Text as="span" color="red.500">*</Text>
                </Text>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder={t('plantillas.nombrePlaceholder')}
                  disabled={saving}
                />
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>
                  {t('plantillas.descripcion')}
                </Text>
                <Input
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder={t('plantillas.descripcionPlaceholder')}
                  disabled={saving}
                />
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>
                  {t('plantillas.templateFile')}
                </Text>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept=".html,.htm,.pdf"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || saving}
                  variant="outline"
                  w="full"
                >
                  <HStack gap={2}>
                    <FiUpload />
                    <Text>{uploading ? t('plantillas.uploading') : (uploadedFile ? uploadedFile.name : t('plantillas.selectFile'))}</Text>
                  </HStack>
                </Button>
                {formData.nombreArchivo && (
                  <Text fontSize="xs" color={textColorSecondary} mt={2}>
                    {t('plantillas.currentFile')}: {formData.nombreArchivo} ({formatFileSize(formData.tamanioArchivo)})
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
                <Text color={textColor}>{t('plantillas.activo')}</Text>
              </HStack>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline" disabled={saving}>
                {t('plantillas.cancel')}
              </Button>
            </DialogActionTrigger>
            <Button
              bg={primaryColor}
              color="white"
              onClick={handleSubmit}
              loading={saving}
              disabled={!formData.codigo || !formData.nombre}
            >
              {editingItem ? t('common.actualizar') : t('common.crear')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Delete Confirmation Dialog */}
      <DialogRoot open={deleteDialogOpen} onOpenChange={(e) => setDeleteDialogOpen(e.open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('plantillas.confirmDelete')}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Text color={textColor}>
              {t('plantillas.confirmDeleteMessage', { nombre: itemToDelete?.nombre })}
            </Text>
            <Text fontSize="sm" color={textColorSecondary} mt={2}>
              {t('plantillas.cannotUndo')}
            </Text>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline" disabled={deleting}>
                {t('plantillas.cancel')}
              </Button>
            </DialogActionTrigger>
            <Button
              colorPalette="red"
              onClick={handleDeleteConfirm}
              loading={deleting}
            >
              {t('common.eliminar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* History Modal */}
      <DialogRoot open={isHistoryModalOpen} onOpenChange={(e) => setIsHistoryModalOpen(e.open)}>
        <DialogContent maxW="800px">
          <DialogHeader>
            <DialogTitle>
              {t('plantillas.changeHistory')} - {selectedItem?.nombre}
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
                <Text color={textColorSecondary}>{t('plantillas.noEventsRegistered')}</Text>
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
                          {t('plantillas.version')} {event.version}
                        </Text>
                      </Box>
                      <Badge colorPalette="blue" size="sm">
                        {new Date(event.timestamp).toLocaleString('es-MX')}
                      </Badge>
                    </Flex>
                    <Text fontSize="xs" color={textColorSecondary} mb={2}>
                      {t('plantillas.by')}: {event.performedBy}
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
                {t('common.cerrar')}
              </Button>
            </DialogActionTrigger>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Preview Modal */}
      <DialogRoot open={previewModalOpen} onOpenChange={(e) => setPreviewModalOpen(e.open)}>
        <DialogContent maxW="90vw" maxH="90vh">
          <DialogHeader>
            <DialogTitle>{t('plantillas.preview')}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Box w="full" h="70vh">
              {previewUrl && (
                <iframe
                  src={previewUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                  title={t('plantillas.previewTitle')}
                />
              )}
            </Box>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline">
                {t('common.cerrar')}
              </Button>
            </DialogActionTrigger>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* PDF Generation Modal (for HTML templates) */}
      <DialogRoot
        open={pdfGenerationModalOpen}
        onOpenChange={(e) => setPdfGenerationModalOpen(e.open)}
        modal
        closeOnInteractOutside={false}
      >
        <DialogBackdrop />
        <DialogContent
          maxW="600px"
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={1400}
        >
          <DialogHeader>
            <DialogTitle>
              {t('plantillas.generatePdf')} - {selectedTemplateForPdf?.nombre}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            {loadingVariables ? (
              <Flex justify="center" align="center" py={10}>
                <Spinner size="xl" color={primaryColor} />
              </Flex>
            ) : templateVariables.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text color={textColorSecondary}>
                  {t('plantillas.noVariablesDetected')}
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" gap={4} maxH="500px" overflowY="auto">
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color={textColorSecondary}>
                    {t('plantillas.completeVariableValues')}
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const codigo = selectedTemplateForPdf?.codigo || '';
                      let ejemploDatos: Record<string, any> = {};

                      // Datos de ejemplo segun el codigo SWIFT
                      switch(codigo) {
                        case 'MT700':
                          ejemploDatos = {
                            numeroOperacion: 'LC-2025-001',
                            fechaEmision: '2025-10-24',
                            fechaVencimiento: '2026-01-24',
                            ordenanteNombre: 'EMPRESA TEST S.A.',
                            ordenanteDireccion: 'Calle Test 123',
                            ordenantePais: 'Mexico',
                            beneficiarioNombre: 'BENEFICIARIO TEST',
                            beneficiarioDireccion: 'Test Address 456',
                            beneficiarioPais: 'USA',
                            moneda: 'USD',
                            monto: '50,000.00',
                            tolerancia: '10%',
                            bancoEmisor: 'Banco Nacional de Mexico',
                            bancoConfirmador: 'Bank of America',
                            descripcionMercancia: 'Productos electronicos diversos',
                            puertoEmbarque: 'Veracruz, Mexico',
                            puertoDestino: 'Los Angeles, USA',
                            fechaLimiteEmbarque: '2025-12-31',
                            documentos: JSON.stringify([
                              {"nombre": "Factura Comercial", "cantidad": "3", "observaciones": "Firmada"},
                              {"nombre": "Bill of Lading", "cantidad": "2", "observaciones": "Original"},
                              {"nombre": "Certificado de Origen", "cantidad": "1", "observaciones": "Sellado"}
                            ], null, 2)
                          };
                          break;

                        case 'MT710':
                          ejemploDatos = {
                            numeroReferencia: 'ADV-2025-0015',
                            fechaAviso: '2025-10-24',
                            bancoEmisor: 'Banco Nacional de Mexico',
                            bancoAvisador: 'HSBC Mexico',
                            beneficiarioNombre: 'EXPORTADORA MEXICANA S.A.',
                            beneficiarioDireccion: 'Av. Reforma 500, CDMX',
                            numeroCredito: 'LC-2025-001',
                            moneda: 'USD',
                            monto: '75,000.00',
                            fechaVencimiento: '2026-02-28',
                            condicionesPago: 'A la vista contra presentacion de documentos conformes'
                          };
                          break;

                        case 'MT720':
                          ejemploDatos = {
                            numeroCreditoOriginal: 'LC-2025-001',
                            bancoEmisorOriginal: 'Banco Nacional de Mexico',
                            primerBeneficiario: 'COMERCIALIZADORA ABC S.A.',
                            bancoTransferente: 'HSBC Mexico',
                            fechaTransferencia: '2025-10-24',
                            nuevoBeneficiario: 'PROVEEDOR FINAL S.A.',
                            direccionNuevoBeneficiario: 'Calle Industrial 789, Monterrey',
                            moneda: 'USD',
                            montoTransferido: '25,000.00',
                            porcentajeTransferencia: '50',
                            nuevaFechaVencimiento: '2026-01-15',
                            instruccionesEspeciales: 'Transferencia parcial segun acuerdo comercial'
                          };
                          break;

                        case 'MT707':
                          ejemploDatos = {
                            numeroEnmienda: 'AMD-001',
                            fechaEnmienda: '2025-10-24',
                            numeroCreditoOriginal: 'LC-2025-001',
                            fechaEmisionOriginal: '2025-09-15',
                            bancoEmisor: 'Banco Nacional de Mexico',
                            codigoSwiftEmisor: 'BNMXMXMM',
                            ordenanteNombre: 'EMPRESA IMPORTADORA S.A.',
                            beneficiarioNombre: 'EXPORTADORA USA INC.',
                            moneda: 'USD',
                            montoOriginal: '50,000.00',
                            tipoModificacion: 'Incremento',
                            montoModificacion: '10,000.00',
                            montoNuevo: '60,000.00',
                            fechaVencimientoOriginal: '2026-01-24',
                            fechaVencimientoNuevo: '2026-02-28',
                            fechaEmbarqueOriginal: '2025-12-31',
                            fechaEmbarqueNuevo: '2026-01-31',
                            condicionesAdicionales: 'Se permite embarque parcial. Tolerancia 10%.',
                            motivoEnmienda: 'Ampliacion de monto y plazo segun solicitud del ordenante',
                            cambios: JSON.stringify([
                              {"campo": "Monto", "valorAnterior": "USD 50,000.00", "nuevoValor": "USD 60,000.00"},
                              {"campo": "Fecha Vencimiento", "valorAnterior": "2026-01-24", "nuevoValor": "2026-02-28"}
                            ], null, 2)
                          };
                          break;

                        case 'MT750':
                          ejemploDatos = {
                            numeroCredito: 'LC-2025-001',
                            fechaAviso: '2025-10-24',
                            bancoNotificador: 'HSBC Mexico',
                            beneficiario: 'EXPORTADORA USA INC.',
                            fechaPresentacion: '2025-10-20',
                            moneda: 'USD',
                            montoPresentado: '50,000.00',
                            numeroDocumentos: '8',
                            plazoRespuesta: '5 dias bancarios desde la fecha de este aviso',
                            observaciones: 'Se requiere correccion inmediata de las discrepancias senaladas',
                            discrepancias: JSON.stringify([
                              {"descripcion": "Factura comercial sin firma autorizada", "gravedad": "Mayor"},
                              {"descripcion": "Bill of Lading con fecha posterior al limite de embarque", "gravedad": "Critica"},
                              {"descripcion": "Certificado de origen con datos incorrectos del exportador", "gravedad": "Mayor"}
                            ], null, 2)
                          };
                          break;

                        case 'MT740':
                          ejemploDatos = {
                            numeroAutorizacion: 'AUT-2025-0042',
                            fechaEmision: '2025-10-24',
                            numeroCreditoRelacionado: 'LC-2025-001',
                            bancoAutorizador: 'Banco Nacional de Mexico',
                            codigoSwiftAutorizador: 'BNMXMXMM',
                            bancoReembolsador: 'Bank of America',
                            codigoSwiftReembolsador: 'BOFAUS3N',
                            bancoSolicitante: 'HSBC New York',
                            codigoSwiftSolicitante: 'HSBCUS33',
                            moneda: 'USD',
                            montoAutorizado: '50,000.00',
                            tolerancia: '+/- 10%',
                            fechaVencimiento: '2026-01-24',
                            condicionesReembolso: 'Contra presentacion de documentos conformes segun LC-2025-001',
                            cuentaCargo: 'USD 4000-123456-78',
                            instruccionesEspeciales: 'Reembolso inmediato tras verificacion de documentos',
                            documentosRequeridos: 'Factura comercial, Bill of Lading, Certificado de origen'
                          };
                          break;

                        case 'MT760':
                          ejemploDatos = {
                            numeroGarantia: 'GTY-2025-0089',
                            fechaEmision: '2025-10-24',
                            tipoGarantia: 'Garantia de Cumplimiento de Contrato',
                            fechaVencimiento: '2026-10-24',
                            bancoGarante: 'Banco Nacional de Mexico',
                            codigoSwiftGarante: 'BNMXMXMM',
                            direccionBanco: 'Paseo de la Reforma 347, CDMX',
                            ordenanteNombre: 'CONSTRUCTORA MEXICANA S.A.',
                            ordenanteDireccion: 'Av. Universidad 1000, Monterrey',
                            ordenantePais: 'Mexico',
                            beneficiarioNombre: 'GOBIERNO DEL ESTADO',
                            beneficiarioDireccion: 'Plaza de Armas S/N, Monterrey',
                            beneficiarioPais: 'Mexico',
                            moneda: 'MXN',
                            monto: '5,000,000.00',
                            montoLetras: 'CINCO MILLONES DE PESOS 00/100 M.N.',
                            proposito: 'Garantizar el cumplimiento del contrato de obra publica No. OP-2025-042',
                            numeroContrato: 'OP-2025-042',
                            descripcionContrato: 'Construccion de vialidad urbana tramo norte',
                            terminosCondiciones: 'Esta garantia es irrevocable y esta sujeta a las Reglas Uniformes para Garantias a la Vista (URDG 758). El beneficiario podra ejecutarla mediante simple demanda escrita sin necesidad de justificar su reclamacion.',
                            instruccionesCobro: 'Toda reclamacion debe presentarse en nuestras oficinas junto con declaracion firmada del beneficiario'
                          };
                          break;

                        case 'MT799':
                          ejemploDatos = {
                            numeroReferencia: 'MSG-2025-0156',
                            fecha: '2025-10-24',
                            asunto: 'Pre-aviso de Carta de Credito',
                            bancoRemitente: 'Banco Nacional de Mexico',
                            codigoSwiftRemitente: 'BNMXMXMM',
                            bancoDestinatario: 'Bank of America',
                            codigoSwiftDestinatario: 'BOFAUS3N',
                            contenidoMensaje: 'Estimados senores:\n\nPor medio del presente les informamos que procederemos a emitir una Carta de Credito Irrevocable por cuenta de EMPRESA IMPORTADORA S.A. a favor de EXPORTADORA USA INC.\n\nDatos preliminares:\n- Monto aproximado: USD 50,000.00\n- Vigencia: 90 dias\n- Tipo: Irrevocable, confirmable\n\nLa emision formal sera enviada mediante mensaje MT700 en las proximas 48 horas.\n\nQuedamos a sus ordenes para cualquier aclaracion.\n\nAtentamente,\nDepartamento de Comercio Exterior',
                            referenciaRelacionada: 'LC-2025-001',
                            tipoOperacion: 'Carta de Credito de Importacion'
                          };
                          break;

                        default:
                          // Datos genericos si no se reconoce el codigo
                          ejemploDatos = {
                            fecha: '2025-10-24',
                            referencia: 'REF-2025-001',
                            descripcion: 'Datos de ejemplo'
                          };
                      }

                      setVariableValues(ejemploDatos);
                    }}
                  >
                    {t('plantillas.loadExample')}
                  </Button>
                </Flex>
                <Text fontSize="xs" color="orange.500" fontWeight="medium">
                  {t('plantillas.jsonArrayHelp')}
                </Text>
                {templateVariables.map((variable) => (
                  <Box key={variable}>
                    <Text fontWeight="medium" mb={2} color={textColor}>
                      {variable}
                    </Text>
                    {variable.toLowerCase().includes('documento') ||
                     variable.toLowerCase().includes('lista') ||
                     variable.toLowerCase().includes('items') ||
                     variable.toLowerCase().includes('detalle') ? (
                      <textarea
                        value={variableValues[variable] || '[]'}
                        onChange={(e) => setVariableValues({
                          ...variableValues,
                          [variable]: e.target.value
                        })}
                        placeholder={t('plantillas.jsonArrayPlaceholder', { variable })}
                        disabled={generatingPdf}
                        style={{
                          width: '100%',
                          minHeight: '120px',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          whiteSpace: 'pre-wrap'
                        }}
                      />
                    ) : (
                      <Input
                        value={variableValues[variable] || ''}
                        onChange={(e) => setVariableValues({
                          ...variableValues,
                          [variable]: e.target.value
                        })}
                        placeholder={t('plantillas.valueFor', { variable })}
                        disabled={generatingPdf}
                      />
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline" disabled={generatingPdf}>
                {t('plantillas.cancel')}
              </Button>
            </DialogActionTrigger>
            <Button
              bg={primaryColor}
              color="white"
              onClick={handleGeneratePdf}
              loading={generatingPdf}
              disabled={loadingVariables || templateVariables.length === 0}
            >
              {t('plantillas.generatePdf')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </>
  );
};
