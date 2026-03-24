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
  IconButton,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogActionTrigger,
  Tabs,
  Card,
  Heading,
  SimpleGrid,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiChevronRight, FiChevronDown, FiFolder, FiFileText, FiLock, FiSettings, FiDatabase, FiEye } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import {
  catalogoPersonalizadoService,
  type CatalogoPersonalizado,
  type EventHistory
} from '../services/customCatalogService';
import { notify } from '../components/ui/toaster';
import { DataTable, type DataTableColumn, type DataTableAction } from '../components/ui/DataTable';

export const CustomCatalogs = () => {
  const { t } = useTranslation();
  const { getColors } = useTheme();

  const [catalogos, setCatalogos] = useState<CatalogoPersonalizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'catalogs' | 'entries'>('catalogs');
  const [selectedCatalogoPadre, setSelectedCatalogoPadre] = useState<CatalogoPersonalizado | null>(null);
  const [expandedCatalogs, setExpandedCatalogs] = useState<Set<number>>(new Set());

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogoPersonalizado | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    nivel: 1,
    catalogoPadreId: undefined as number | undefined,
    activo: true,
    orden: 0,
  });
  const [saving, setSaving] = useState(false);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CatalogoPersonalizado | null>(null);
  const [deleting, setDeleting] = useState(false);

  // History modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [eventHistory, setEventHistory] = useState<EventHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogoPersonalizado | null>(null);

  const colors = getColors();
  const { bgColor, borderColor, cardBg, textColor, textColorSecondary, primaryColor } = colors;

  // Load data on mount
  useEffect(() => {
    loadCatalogos();
  }, []);

  const loadCatalogos = async () => {
    try {
      setLoading(true);
      const data = await catalogoPersonalizadoService.getAllCatalogosPersonalizados();
      setCatalogos(data);
    } catch (error) {
      notify.error(t('catalogos.errorTitle', 'Error'), t('catalogos.errorLoadingCatalogs') + ': ' + (error instanceof Error ? error.message : t('catalogos.unknownError')));
    } finally {
      setLoading(false);
    }
  };

  // Get catalogs by level
  const nivel1Catalogs = catalogos
    .filter((c) => c.nivel === 1)
    .sort((a, b) => a.orden - b.orden);

  const nivel2Entries = catalogos
    .filter((c) => c.nivel === 2)
    .sort((a, b) => a.orden - b.orden);

  // Separate system catalogs from client catalogs
  const systemCatalogs = useMemo(() =>
    nivel1Catalogs.filter(c => c.isSystem),
    [nivel1Catalogs]
  );

  const clientCatalogs = useMemo(() =>
    nivel1Catalogs.filter(c => !c.isSystem),
    [nivel1Catalogs]
  );

  // Build flat list for client catalogs table: parent rows + expanded child rows
  const clientCatalogsFlatData = useMemo(() => {
    const rows: (CatalogoPersonalizado & { _isChildRow?: boolean; _parentCatalog?: CatalogoPersonalizado })[] = [];
    for (const catalog of clientCatalogs) {
      rows.push(catalog);
      if (expandedCatalogs.has(catalog.id)) {
        const children = nivel2Entries.filter(e => e.catalogoPadreId === catalog.id);
        for (const child of children) {
          rows.push({ ...child, _isChildRow: true, _parentCatalog: catalog });
        }
      }
    }
    return rows;
  }, [clientCatalogs, nivel2Entries, expandedCatalogs]);

  // Get all entries for selected catalog
  const selectedCatalogEntries = useMemo(() =>
    selectedCatalogoPadre
      ? nivel2Entries.filter(e => e.catalogoPadreId === selectedCatalogoPadre.id)
      : [],
    [selectedCatalogoPadre, nivel2Entries]
  );

  // Toggle catalog expansion
  const toggleCatalogExpansion = (catalogId: number) => {
    const newExpanded = new Set(expandedCatalogs);
    if (newExpanded.has(catalogId)) {
      newExpanded.delete(catalogId);
    } else {
      newExpanded.add(catalogId);
    }
    setExpandedCatalogs(newExpanded);
  };

  // Handle create new catalog (nivel 1)
  const handleCreateCatalog = () => {
    setEditingItem(null);
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      nivel: 1,
      catalogoPadreId: undefined,
      activo: true,
      orden: nivel1Catalogs.length,
    });
    setIsModalOpen(true);
  };

  // Handle create new entry (nivel 2)
  const handleCreateEntry = (catalogoPadre?: CatalogoPersonalizado) => {
    const parentCatalog = catalogoPadre || selectedCatalogoPadre;
    if (!parentCatalog) {
      notify.warning(t('catalogos.validationTitle', 'Validación'), t('catalogos.mustSelectParentCatalog'));
      return;
    }

    setEditingItem(null);
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      nivel: 2,
      catalogoPadreId: parentCatalog.id,
      activo: true,
      orden: nivel2Entries.filter(e => e.catalogoPadreId === parentCatalog.id).length,
    });
    setIsModalOpen(true);
  };

  // Handle edit
  const handleEdit = (item: CatalogoPersonalizado) => {
    setEditingItem(item);
    setFormData({
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      nivel: item.nivel,
      catalogoPadreId: item.catalogoPadreId,
      activo: item.activo,
      orden: item.orden,
    });
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDeleteClick = (item: CatalogoPersonalizado) => {
    // Check if it's a system catalog
    if (item.isSystem) {
      notify.warning(t('catalogos.validationTitle', 'Validación'), t('catalogos.cannotDeleteSystemCatalog', 'Los catálogos de sistema no pueden ser eliminados'));
      return;
    }
    // Check if it's a nivel 1 catalog with children
    if (item.nivel === 1) {
      const hasChildren = nivel2Entries.some(e => e.catalogoPadreId === item.id);
      if (hasChildren) {
        notify.warning(t('catalogos.validationTitle', 'Validación'), t('catalogos.cannotDeleteCatalogWithRecords'));
        return;
      }
    }
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      await catalogoPersonalizadoService.deleteCatalogoPersonalizado(itemToDelete.id, 'system');
      notify.success(t('catalogos.successTitle', 'Éxito'), t('catalogos.deletedSuccessfully'));
      setDeleteDialogOpen(false);
      setItemToDelete(null);

      // Wait for event sourcing projection to complete before refreshing
      await new Promise(resolve => setTimeout(resolve, 1500));
      await loadCatalogos();
    } catch (error) {
      notify.error(t('catalogos.errorTitle', 'Error'), t('catalogos.errorDeleting') + ': ' + (error instanceof Error ? error.message : t('catalogos.unknownError')));
    } finally {
      setDeleting(false);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    // Validation
    if (!formData.codigo || !formData.nombre) {
      notify.warning(t('catalogos.validationTitle', 'Validación'), t('catalogos.codeAndNameRequired'));
      return;
    }

    if (formData.nivel === 2 && !formData.catalogoPadreId) {
      notify.warning(t('catalogos.validationTitle', 'Validación'), t('catalogos.mustSelectParentForLevel2'));
      return;
    }

    try {
      setSaving(true);

      if (editingItem) {
        // Update
        await catalogoPersonalizadoService.updateCatalogoPersonalizado(editingItem.id, {
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          nivel: formData.nivel,
          catalogoPadreId: formData.catalogoPadreId,
          activo: formData.activo,
          orden: formData.orden,
          updatedBy: 'system',
        });
        notify.success(t('catalogos.successTitle', 'Éxito'), t('catalogos.updatedSuccessfully'));
      } else {
        // Create
        await catalogoPersonalizadoService.createCatalogoPersonalizado({
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          nivel: formData.nivel,
          catalogoPadreId: formData.catalogoPadreId,
          activo: formData.activo,
          orden: formData.orden,
          createdBy: 'system',
        });
        notify.success(t('catalogos.successTitle', 'Éxito'), t('catalogos.createdSuccessfully'));
      }

      setIsModalOpen(false);

      // Wait for event sourcing projection to complete before refreshing
      // The Kafka consumer needs time to process the event and update the Read Model
      await new Promise(resolve => setTimeout(resolve, 1500));
      await loadCatalogos();
    } catch (error) {
      notify.error(t('catalogos.errorTitle', 'Error'), t('catalogos.errorSaving') + ': ' + (error instanceof Error ? error.message : t('catalogos.unknownError')));
    } finally {
      setSaving(false);
    }
  };

  // Handle view history
  const handleViewHistory = async (item: CatalogoPersonalizado) => {
    try {
      setSelectedItem(item);
      setLoadingHistory(true);
      setIsHistoryModalOpen(true);

      const history = await catalogoPersonalizadoService.getEventHistory(item.id);
      setEventHistory(history);
    } catch (error) {
      notify.error(t('catalogos.errorTitle', 'Error'), t('catalogos.errorLoadingHistory') + ': ' + (error instanceof Error ? error.message : t('catalogos.unknownError')));
      setIsHistoryModalOpen(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Switch to entries view for a specific catalog
  const handleViewCatalogEntries = (catalog: CatalogoPersonalizado) => {
    setSelectedCatalogoPadre(catalog);
    setActiveView('entries');
  };

  // --- DataTable columns for client catalogs (nivel 1) ---
  const clientCatalogColumns: DataTableColumn<CatalogoPersonalizado & { _isChildRow?: boolean }>[] = [
    {
      key: '_expand',
      label: '',
      sortable: false,
      filterable: false,
      minWidth: '50px',
      render: (row) => {
        if (row._isChildRow) return null;
        const catalogEntries = nivel2Entries.filter(e => e.catalogoPadreId === row.id);
        if (catalogEntries.length === 0) return null;
        return (
          <IconButton
            aria-label="Expandir/Contraer"
            size="xs"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); toggleCatalogExpansion(row.id); }}
          >
            {expandedCatalogs.has(row.id) ? <FiChevronDown /> : <FiChevronRight />}
          </IconButton>
        );
      },
    },
    {
      key: 'codigo',
      label: t('catalogos.codigo'),
      render: (row) => {
        if (row._isChildRow) {
          return (
            <HStack gap={2} pl={6}>
              <FiFileText size={14} color={textColorSecondary} />
              <Text fontSize="sm">{row.codigo}</Text>
            </HStack>
          );
        }
        return (
          <HStack gap={2}>
            <FiFolder color={primaryColor} />
            <Text fontWeight="semibold">{row.codigo}</Text>
          </HStack>
        );
      },
    },
    {
      key: 'nombre',
      label: t('catalogos.nombre'),
      render: (row) => (
        <Text fontSize={row._isChildRow ? 'sm' : 'md'} fontWeight={row._isChildRow ? 'normal' : 'medium'}>
          {row.nombre}
        </Text>
      ),
    },
    {
      key: 'descripcion',
      label: t('catalogos.descripcion'),
      hideOnMobile: true,
      render: (row) => (
        <Text fontSize="sm" color={textColorSecondary}>{row.descripcion || '-'}</Text>
      ),
    },
    {
      key: 'orden',
      label: t('catalogos.orden'),
      render: (row) => <Text fontSize="sm">{row.orden}</Text>,
    },
    {
      key: 'activo',
      label: t('catalogos.estado'),
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: t('catalogos.activo') },
        { value: 'false', label: t('common.inactivo') },
      ],
      render: (row) => (
        <Badge size={row._isChildRow ? 'sm' : 'md'} colorPalette={row.activo ? 'green' : 'red'}>
          {row.activo ? t('catalogos.activo') : t('common.inactivo')}
        </Badge>
      ),
    },
    {
      key: '_records',
      label: t('catalogos.registros'),
      sortable: false,
      filterable: false,
      render: (row) => {
        if (row._isChildRow) return <Text>-</Text>;
        const catalogEntries = nivel2Entries.filter(e => e.catalogoPadreId === row.id);
        return (
          <Button
            size="xs"
            variant="outline"
            colorPalette="blue"
            onClick={(e) => { e.stopPropagation(); handleViewCatalogEntries(row); }}
          >
            {t('catalogos.view')} {catalogEntries.length}
          </Button>
        );
      },
    },
  ];

  const clientCatalogActions: DataTableAction<CatalogoPersonalizado & { _isChildRow?: boolean }>[] = [
    {
      key: 'addEntry',
      label: t('catalogos.newRecord', 'Agregar registro'),
      icon: FiPlus,
      colorPalette: 'green',
      onClick: (row) => handleCreateEntry(row._isChildRow ? undefined : row),
      isHidden: (row) => !!row._isChildRow,
    },
    {
      key: 'history',
      label: t('catalogos.changeHistory', 'Historial'),
      icon: FiClock,
      colorPalette: 'blue',
      onClick: (row) => handleViewHistory(row),
    },
    {
      key: 'edit',
      label: t('common.editar', 'Editar'),
      icon: FiEdit2,
      onClick: (row) => handleEdit(row),
    },
    {
      key: 'delete',
      label: t('common.eliminar', 'Eliminar'),
      icon: FiTrash2,
      colorPalette: 'red',
      onClick: (row) => handleDeleteClick(row),
    },
  ];

  // --- DataTable columns for entries (nivel 2) ---
  const entryColumns: DataTableColumn<CatalogoPersonalizado>[] = [
    {
      key: 'codigo',
      label: t('catalogos.codigo'),
      render: (row) => (
        <HStack gap={2}>
          <FiFileText size={14} />
          <Text fontWeight="semibold">{row.codigo}</Text>
        </HStack>
      ),
    },
    { key: 'nombre', label: t('catalogos.nombre') },
    {
      key: 'descripcion',
      label: t('catalogos.descripcion'),
      hideOnMobile: true,
      render: (row) => <Text color={textColorSecondary}>{row.descripcion || '-'}</Text>,
    },
    { key: 'orden', label: t('catalogos.orden') },
    {
      key: 'activo',
      label: t('catalogos.estado'),
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: t('catalogos.activo') },
        { value: 'false', label: t('common.inactivo') },
      ],
      render: (row) => (
        <Badge colorPalette={row.activo ? 'green' : 'red'}>
          {row.activo ? t('catalogos.activo') : t('common.inactivo')}
        </Badge>
      ),
    },
  ];

  const entryActions: DataTableAction<CatalogoPersonalizado>[] = [
    { key: 'history', label: t('catalogos.changeHistory', 'Historial'), icon: FiClock, colorPalette: 'blue', onClick: (row) => handleViewHistory(row) },
    { key: 'edit', label: t('common.editar', 'Editar'), icon: FiEdit2, onClick: (row) => handleEdit(row) },
    { key: 'delete', label: t('common.eliminar', 'Eliminar'), icon: FiTrash2, colorPalette: 'red', onClick: (row) => handleDeleteClick(row) },
  ];

  return (
    <>
      <Box flex={1} p={6}>
        <VStack align="stretch" gap={6}>
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                {t('catalogos.title')}
              </Text>
              <Text fontSize="sm" color={textColorSecondary} mt={1}>
                {t('catalogos.subtitle')}
              </Text>
            </Box>
          </Flex>

          {/* View Tabs */}
          <Tabs.Root
            value={activeView}
            onValueChange={(e) => setActiveView(e.value as 'catalogs' | 'entries')}
            variant="enclosed"
          >
            <Tabs.List>
              <Tabs.Trigger value="catalogs">
                <HStack gap={2}>
                  <FiFolder />
                  <Text>{t('catalogos.catalogsLevel1')}</Text>
                  <Badge colorPalette="blue">{nivel1Catalogs.length}</Badge>
                </HStack>
              </Tabs.Trigger>
              <Tabs.Trigger value="entries" disabled={!selectedCatalogoPadre}>
                <HStack gap={2}>
                  <FiFileText />
                  <Text>
                    {selectedCatalogoPadre ? `${t('catalogos.recordsOf')} "${selectedCatalogoPadre.nombre}"` : t('catalogos.recordsLevel2')}
                  </Text>
                  {selectedCatalogoPadre && (
                    <Badge colorPalette="green">{selectedCatalogEntries.length}</Badge>
                  )}
                </HStack>
              </Tabs.Trigger>
            </Tabs.List>

            {/* Loading */}
            {loading && (
              <Flex justify="center" align="center" py={10}>
                <Spinner size="xl" color={primaryColor} />
              </Flex>
            )}

            {/* Catalogs View (Nivel 1) - Separated by Type */}
            {!loading && (
              <Tabs.Content value="catalogs">
                <VStack align="stretch" gap={6} mt={4}>
                  {/* System Catalogs Section */}
                  <Box>
                    <Flex align="center" gap={3} mb={4}>
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg="purple.100"
                        _dark={{ bg: 'purple.900' }}
                      >
                        <FiSettings size={20} color="var(--chakra-colors-purple-600)" />
                      </Box>
                      <Box>
                        <Heading size="md" color={textColor}>
                          {t('catalogos.systemCatalogs', 'Catalogos del Sistema')}
                        </Heading>
                        <Text fontSize="sm" color={textColorSecondary}>
                          {t('catalogos.systemCatalogsDescription', 'Configuraciones internas del sistema (solo lectura)')}
                        </Text>
                      </Box>
                      <Badge colorPalette="purple" ml="auto" size="lg">
                        {systemCatalogs.length} {t('catalogos.catalogs', 'catalogos')}
                      </Badge>
                    </Flex>

                    {systemCatalogs.length > 0 ? (
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                        {systemCatalogs.map((catalog) => {
                          const catalogEntries = nivel2Entries.filter(e => e.catalogoPadreId === catalog.id);
                          return (
                            <Card.Root
                              key={catalog.id}
                              bg={cardBg}
                              borderWidth="1px"
                              borderColor="purple.200"
                              _dark={{ borderColor: 'purple.700' }}
                              _hover={{ borderColor: 'purple.400', shadow: 'md' }}
                              transition="all 0.2s"
                            >
                              <Card.Body p={4}>
                                <VStack align="stretch" gap={3}>
                                  <Flex justify="space-between" align="start">
                                    <HStack gap={2}>
                                      <FiLock size={16} color="var(--chakra-colors-purple-500)" />
                                      <Text fontWeight="bold" color={textColor} fontSize="sm">
                                        {catalog.codigo}
                                      </Text>
                                    </HStack>
                                    <Badge colorPalette={catalog.activo ? 'green' : 'red'} size="sm">
                                      {catalog.activo ? t('catalogos.activo') : t('common.inactivo')}
                                    </Badge>
                                  </Flex>
                                  <Text fontWeight="medium" color={textColor}>
                                    {catalog.nombre}
                                  </Text>
                                  <Text fontSize="sm" color={textColorSecondary} noOfLines={2}>
                                    {catalog.descripcion || t('catalogos.noDescription', 'Sin descripcion')}
                                  </Text>
                                  <Flex justify="space-between" align="center" pt={2} borderTop="1px" borderColor={borderColor}>
                                    <Text fontSize="xs" color={textColorSecondary}>
                                      {catalogEntries.length} {t('catalogos.records', 'registros')}
                                    </Text>
                                    <HStack gap={1}>
                                      <IconButton
                                        aria-label="Ver registros"
                                        size="sm"
                                        variant="ghost"
                                        colorPalette="purple"
                                        onClick={() => handleViewCatalogEntries(catalog)}
                                      >
                                        <FiEye />
                                      </IconButton>
                                      <IconButton
                                        aria-label="Historial"
                                        size="sm"
                                        variant="ghost"
                                        colorPalette="blue"
                                        onClick={() => handleViewHistory(catalog)}
                                      >
                                        <FiClock />
                                      </IconButton>
                                    </HStack>
                                  </Flex>
                                </VStack>
                              </Card.Body>
                            </Card.Root>
                          );
                        })}
                      </SimpleGrid>
                    ) : (
                      <Box
                        textAlign="center"
                        py={6}
                        bg={cardBg}
                        borderRadius="lg"
                        border="1px dashed"
                        borderColor={borderColor}
                      >
                        <Text color={textColorSecondary}>
                          {t('catalogos.noSystemCatalogs', 'No hay catalogos del sistema')}
                        </Text>
                      </Box>
                    )}
                  </Box>

                  {/* Client/Custom Catalogs Section */}
                  <Box>
                    <Flex align="center" gap={3} mb={4}>
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg="blue.100"
                        _dark={{ bg: 'blue.900' }}
                      >
                        <FiDatabase size={20} color="var(--chakra-colors-blue-600)" />
                      </Box>
                      <Box>
                        <Heading size="md" color={textColor}>
                          {t('catalogos.customCatalogs', 'Catalogos Personalizados')}
                        </Heading>
                        <Text fontSize="sm" color={textColorSecondary}>
                          {t('catalogos.customCatalogsDescription', 'Catalogos creados por el cliente')}
                        </Text>
                      </Box>
                      <Badge colorPalette="blue" ml="auto" size="lg">
                        {clientCatalogs.length} {t('catalogos.catalogs', 'catalogos')}
                      </Badge>
                    </Flex>

                    <DataTable<CatalogoPersonalizado & { _isChildRow?: boolean }>
                      data={clientCatalogsFlatData}
                      columns={clientCatalogColumns}
                      rowKey={(row) => `${row.id}-${row._isChildRow ? 'child' : 'parent'}`}
                      actions={clientCatalogActions}
                      isLoading={false}
                      emptyMessage={
                        clientCatalogs.length === 0
                          ? t('catalogos.noCustomCatalogsYet', 'Aun no hay catalogos personalizados')
                          : t('catalogos.noResultsFound')
                      }
                      emptyIcon={FiDatabase}
                      defaultPageSize={20}
                      toolbarRight={
                        <Button
                          bg={primaryColor}
                          color="white"
                          size="sm"
                          onClick={handleCreateCatalog}
                          _hover={{ opacity: 0.9 }}
                        >
                          <HStack gap={2}>
                            <FiPlus />
                            <Text>{t('catalogos.newCatalog')}</Text>
                          </HStack>
                        </Button>
                      }
                    />
                  </Box>

                  <Text fontSize="sm" color={textColorSecondary}>
                    {t('catalogos.totalCatalogs', 'Total')}: {systemCatalogs.length} {t('catalogos.systemCatalogsShort', 'del sistema')} + {clientCatalogs.length} {t('catalogos.customCatalogsShort', 'personalizados')} = {nivel1Catalogs.length} {t('catalogos.catalogs', 'catalogos')}
                  </Text>
                </VStack>
              </Tabs.Content>
            )}

            {/* Entries View (Nivel 2) */}
            {!loading && selectedCatalogoPadre && (
              <Tabs.Content value="entries">
                <VStack align="stretch" gap={4} mt={4}>
                  <Flex justify="space-between" align="center">
                    <HStack gap={4}>
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg={selectedCatalogoPadre.isSystem ? 'purple.100' : 'blue.100'}
                        _dark={{ bg: selectedCatalogoPadre.isSystem ? 'purple.900' : 'blue.900' }}
                      >
                        {selectedCatalogoPadre.isSystem
                          ? <FiSettings size={24} color="var(--chakra-colors-purple-600)" />
                          : <FiFolder size={24} color="var(--chakra-colors-blue-600)" />
                        }
                      </Box>
                      <Box>
                        <HStack gap={2}>
                          <Text fontSize="lg" fontWeight="bold" color={textColor}>
                            {selectedCatalogoPadre.nombre}
                          </Text>
                          {selectedCatalogoPadre.isSystem && (
                            <Badge colorPalette="purple" size="sm">
                              <HStack gap={1}>
                                <FiLock size={10} />
                                <Text>{t('catalogos.system', 'Sistema')}</Text>
                              </HStack>
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize="sm" color={textColorSecondary}>
                          {t('catalogos.codigo')}: {selectedCatalogoPadre.codigo}
                          {selectedCatalogoPadre.descripcion && ` - ${selectedCatalogoPadre.descripcion}`}
                        </Text>
                      </Box>
                    </HStack>
                  </Flex>

                  <DataTable<CatalogoPersonalizado>
                    data={selectedCatalogEntries}
                    columns={entryColumns}
                    rowKey={(row) => String(row.id)}
                    actions={entryActions}
                    isLoading={false}
                    emptyMessage={t('catalogos.noRecordsInCatalog')}
                    emptyIcon={FiFileText}
                    defaultPageSize={10}
                    toolbarRight={
                      <HStack gap={3}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveView('catalogs');
                            setSelectedCatalogoPadre(null);
                          }}
                        >
                          {t('catalogos.backToCatalogs')}
                        </Button>
                        <Button
                          bg={primaryColor}
                          color="white"
                          size="sm"
                          onClick={() => handleCreateEntry()}
                          _hover={{ opacity: 0.9 }}
                        >
                          <HStack gap={2}>
                            <FiPlus />
                            <Text>{t('catalogos.newRecord')}</Text>
                          </HStack>
                        </Button>
                      </HStack>
                    }
                  />
                </VStack>
              </Tabs.Content>
            )}
          </Tabs.Root>
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
              {editingItem
                ? `${t('common.editar')} ${formData.nivel === 1 ? t('catalogos.catalog') : t('catalogos.record')}`
                : `${t('catalogos.new')} ${formData.nivel === 1 ? t('catalogos.catalog') : t('catalogos.record')}`}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack align="stretch" gap={4}>
              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>
                  {t('catalogos.codigo')} <Text as="span" color="red.500">*</Text>
                </Text>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="CAT-001"
                  disabled={saving}
                />
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>
                  {t('catalogos.nombre')} <Text as="span" color="red.500">*</Text>
                </Text>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder={t('catalogos.catalogNamePlaceholder')}
                  disabled={saving}
                />
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>
                  {t('catalogos.descripcion')}
                </Text>
                <Input
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder={t('catalogos.optionalDescription')}
                  disabled={saving}
                />
              </Box>

              {formData.nivel === 2 && (
                <Box>
                  <Text fontWeight="medium" mb={2} color={textColor}>
                    {t('catalogos.parentCatalog')} <Text as="span" color="red.500">*</Text>
                  </Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.catalogoPadreId || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        catalogoPadreId: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      disabled={saving || !!editingItem}
                    >
                      <option value="">{t('catalogos.selectCatalog')}</option>
                      {nivel1Catalogs.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.codigo} - {cat.nombre}
                        </option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
              )}

              <Box>
                <Text fontWeight="medium" mb={2} color={textColor}>
                  {t('catalogos.orden')}
                </Text>
                <Input
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                  disabled={saving}
                />
              </Box>

              <HStack gap={2}>
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  disabled={saving}
                />
                <Text color={textColor}>{t('catalogos.activo')}</Text>
              </HStack>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline" disabled={saving}>
                {t('catalogos.cancel')}
              </Button>
            </DialogActionTrigger>
            <Button
              bg={primaryColor}
              color="white"
              onClick={handleSubmit}
              loading={saving}
              disabled={!formData.codigo || !formData.nombre || (formData.nivel === 2 && !formData.catalogoPadreId)}
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
            <DialogTitle>{t('catalogos.confirmDeletion')}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Text color={textColor}>
              {t('catalogos.confirmDeleteMessage', { name: itemToDelete?.nombre })}
            </Text>
            <Text fontSize="sm" color={textColorSecondary} mt={2}>
              {t('catalogos.actionCannotBeUndone')}
            </Text>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline" disabled={deleting}>
                {t('catalogos.cancel')}
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
              {t('catalogos.changeHistory')} - {selectedItem?.nombre}
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
                <Text color={textColorSecondary}>{t('catalogos.noEventsRegistered')}</Text>
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
                          {t('catalogos.version')} {event.version}
                        </Text>
                      </Box>
                      <Badge colorPalette="blue" size="sm">
                        {new Date(event.timestamp).toLocaleString('es-MX')}
                      </Badge>
                    </Flex>
                    <Text fontSize="xs" color={textColorSecondary} mb={2}>
                      {t('catalogos.by')}: {event.performedBy}
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
    </>
  );
};
