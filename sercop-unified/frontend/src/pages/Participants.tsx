import {
  Box,
  Input,
  VStack,
  Text,
  Flex,
  Button,
  HStack,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogBackdrop,
  DialogCloseTrigger,
  Grid,
  Spinner,
  DialogActionTrigger,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiDownload, FiClock, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { participanteService, type Participante, type CreateParticipanteCommand, type UpdateParticipanteCommand, type EventHistory, type ParticipanteFilters, type PaginatedResponse } from '../services/participantService';
import { userService, type User } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '../components/ui/toaster';
import { CustomCatalogDropdown } from '../components/CustomCatalogDropdown';
import { DataTable, type DataTableColumn, type DataTableAction } from '../components/ui/DataTable';

export const Participants = () => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const { user } = useAuth();

  // Pagination state
  const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Participante>>({
    data: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 10,
    first: true,
    last: true,
  });
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  const [filters] = useState<ParticipanteFilters>({
    identificacion: '',
    tipo: 'all',
    nombres: '',
    apellidos: '',
    email: '',
    agencia: '',
  });

  // Debounce timer ref
  const filterTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipante, setEditingParticipante] = useState<Participante | null>(null);
  const [formData, setFormData] = useState<CreateParticipanteCommand>({
    identificacion: '',
    tipo: 'Cliente',
    tipoReferencia: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    direccion: '',
    agencia: '',
    ejecutivoAsignado: '',
    ejecutivoId: '',
    correoEjecutivo: '',
    hierarchyType: undefined,
    parentId: undefined,
  });

  // State for parent company search
  const [parentCompanies, setParentCompanies] = useState<Participante[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [saving, setSaving] = useState(false);

  // State for internal users (ejecutivos)
  const [internalUsers, setInternalUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // History modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [eventHistory, setEventHistory] = useState<EventHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedParticipante, setSelectedParticipante] = useState<Participante | null>(null);

  const colors = getColors();
  const { bgColor, borderColor, cardBg, textColor, textColorSecondary, primaryColor } = colors;

  // Load participantes with pagination
  const loadParticipantes = useCallback(async (page: number, size: number, currentFilters: ParticipanteFilters) => {
    try {
      setLoading(true);
      const data = await participanteService.getParticipantesPaginated(page, size, 'id', 'asc', currentFilters);
      setPaginatedData(data);
    } catch (error) {
      notify.error('Error', 'Error al cargar participantes: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadParticipantes(0, pageSize, filters);
  }, []);

  // Load when page or pageSize changes
  useEffect(() => {
    loadParticipantes(currentPage, pageSize, filters);
  }, [currentPage, pageSize]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (filterTimerRef.current) {
        clearTimeout(filterTimerRef.current);
      }
    };
  }, []);

  const handleExportCSV = async () => {
    try {
      // Get all data for export
      const allData = await participanteService.getAllParticipantes();
      const headers = ['Identificacion', 'Tipo', 'Tipo Referencia', 'Nombres', 'Apellidos', 'Email', 'Telefono', 'Direccion', 'Agencia', 'Ejecutivo Asignado'];
      const csvContent = [
        headers.join(','),
        ...allData.map(p =>
          [p.identificacion, p.tipo, p.tipoReferencia || '', p.nombres, p.apellidos, p.email, p.telefono || '', p.direccion || '', p.agencia || '', p.ejecutivoAsignado || ''].join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `participantes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      notify.error('Error', 'Error al exportar: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleCreateNew = () => {
    setEditingParticipante(null);
    setFormData({
      identificacion: '',
      tipo: 'Cliente',
      tipoReferencia: '',
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      direccion: '',
      agencia: '',
      ejecutivoAsignado: '',
      ejecutivoId: '',
      correoEjecutivo: '',
      hierarchyType: undefined,
      parentId: undefined,
    });
    loadParentCompanies();
    loadInternalUsers();
    setIsModalOpen(true);
  };

  // Load potential parent companies (corporations and companies)
  const loadParentCompanies = async () => {
    try {
      setLoadingParents(true);
      const allParticipants = await participanteService.getAllParticipantes();
      // Filter only those that can be parents (CORPORATION or COMPANY types)
      const potentialParents = allParticipants.filter(
        p => p.hierarchyType === 'CORPORATION' || p.hierarchyType === 'COMPANY'
      );
      setParentCompanies(potentialParents);
    } catch (error) {
      console.error('Error loading parent companies:', error);
    } finally {
      setLoadingParents(false);
    }
  };

  // Load internal users (ejecutivos de cuenta)
  const loadInternalUsers = async () => {
    try {
      setLoadingUsers(true);
      const users = await userService.getInternalUsers();
      setInternalUsers(users);
    } catch (error) {
      console.error('Error loading internal users:', error);
      // Keep the list empty but allow free text entry
      setInternalUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle ejecutivo selection
  const handleEjecutivoSelect = (selectedUser: User | null) => {
    if (selectedUser) {
      setFormData({
        ...formData,
        ejecutivoAsignado: selectedUser.username,
        ejecutivoId: selectedUser.id.toString(),
        correoEjecutivo: selectedUser.email,
      });
    }
    setShowUserDropdown(false);
  };

  const handleEdit = (participante: Participante) => {
    setEditingParticipante(participante);
    setFormData({
      identificacion: participante.identificacion,
      tipo: participante.tipo,
      tipoReferencia: participante.tipoReferencia,
      nombres: participante.nombres,
      apellidos: participante.apellidos,
      email: participante.email,
      telefono: participante.telefono,
      direccion: participante.direccion,
      agencia: participante.agencia,
      ejecutivoAsignado: participante.ejecutivoAsignado,
      ejecutivoId: participante.ejecutivoId,
      correoEjecutivo: participante.correoEjecutivo,
      hierarchyType: participante.hierarchyType,
      parentId: participante.parentId,
    });
    loadParentCompanies();
    loadInternalUsers();
    setIsModalOpen(true);
  };

  const handleDelete = async (participante: Participante) => {
    if (!confirm(`¿Está seguro de eliminar el participante ${participante.nombres} ${participante.apellidos}?`)) {
      return;
    }

    try {
      await participanteService.deleteParticipante(participante.id, user?.email);
      notify.success('Éxito', 'Participante eliminado correctamente');
      loadParticipantes(currentPage, pageSize, filters);
    } catch (error) {
      notify.error('Error', 'Error al eliminar participante: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      if (editingParticipante) {
        const command: UpdateParticipanteCommand = {
          identificacion: formData.identificacion,
          tipo: formData.tipo,
          tipoReferencia: formData.tipoReferencia,
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          email: formData.email,
          telefono: formData.telefono,
          direccion: formData.direccion,
          agencia: formData.agencia,
          ejecutivoAsignado: formData.ejecutivoAsignado,
          ejecutivoId: formData.ejecutivoId,
          correoEjecutivo: formData.correoEjecutivo,
          hierarchyType: formData.hierarchyType,
          parentId: formData.parentId,
          updatedBy: user?.email,
        };
        await participanteService.updateParticipante(editingParticipante.id, command);
        notify.success('Éxito', 'Participante actualizado correctamente');
      } else {
        const command: CreateParticipanteCommand = {
          identificacion: formData.identificacion,
          tipo: formData.tipo,
          tipoReferencia: formData.tipoReferencia,
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          email: formData.email,
          telefono: formData.telefono,
          direccion: formData.direccion,
          agencia: formData.agencia,
          ejecutivoAsignado: formData.ejecutivoAsignado,
          ejecutivoId: formData.ejecutivoId,
          correoEjecutivo: formData.correoEjecutivo,
          hierarchyType: formData.hierarchyType,
          parentId: formData.parentId,
          createdBy: user?.email,
        };
        await participanteService.createParticipante(command);
        notify.success('Éxito', 'Participante creado correctamente');
      }

      setIsModalOpen(false);
      loadParticipantes(currentPage, pageSize, filters);
    } catch (error) {
      notify.error('Error', 'Error al guardar participante: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const handleViewHistory = async (participante: Participante) => {
    try {
      setSelectedParticipante(participante);
      setLoadingHistory(true);
      setIsHistoryModalOpen(true);
      const history = await participanteService.getEventHistory(participante.id);
      setEventHistory(history);
    } catch (error) {
      notify.error('Error', 'Error al cargar historial: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      setIsHistoryModalOpen(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  // --- DataTable columns ---
  const columns: DataTableColumn<Participante>[] = [
    {
      key: 'identificacion',
      label: t('participantes.identificacion'),
      sortable: true,
      filterable: true,
      filterType: 'text',
    },
    {
      key: 'tipo',
      label: t('participantes.tipo'),
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'Cliente', label: t('participantes.cliente') },
        { value: 'No cliente', label: 'No cliente' },
        { value: 'Banco', label: t('participantes.banco') },
      ],
      render: (row) =>
        row.tipo === 'Cliente'
          ? t('participantes.cliente')
          : row.tipo === 'Banco'
            ? t('participantes.banco')
            : row.tipo,
    },
    {
      key: 'nombres',
      label: t('participantes.nombres'),
      sortable: true,
      filterable: true,
      filterType: 'text',
    },
    {
      key: 'apellidos',
      label: t('participantes.apellidos'),
      sortable: true,
      filterable: true,
      filterType: 'text',
    },
    {
      key: 'email',
      label: t('participantes.email'),
      sortable: true,
      filterable: true,
      filterType: 'text',
    },
    {
      key: 'agencia',
      label: t('participantes.agencia'),
      sortable: true,
      filterable: true,
      filterType: 'text',
    },
    {
      key: 'hierarchyType',
      label: t('participantes.hierarchyType', 'Jerarquía'),
      sortable: true,
      filterable: false,
      render: (row) => {
        if (row.hierarchyType === 'CORPORATION') {
          return (
            <Text fontWeight="medium" color="purple.500">
              {t('participantes.corporation', 'Corporación')}
            </Text>
          );
        }
        if (row.hierarchyType === 'COMPANY') {
          return (
            <Text fontWeight="medium" color="blue.500">
              {t('participantes.company', 'Empresa')}
            </Text>
          );
        }
        if (row.hierarchyType === 'BRANCH') {
          return (
            <Text color="gray.500">
              {t('participantes.branch', 'Sucursal')}
            </Text>
          );
        }
        return <Text color={textColorSecondary}>-</Text>;
      },
    },
  ];

  // --- DataTable actions ---
  const actions: DataTableAction<Participante>[] = [
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
      onClick: (row) => handleDelete(row),
    },
  ];

  // --- Toolbar right buttons ---
  const toolbarButtons = (
    <HStack gap={3}>
      <Button
        variant="outline"
        borderColor={borderColor}
        color={textColor}
        onClick={handleExportCSV}
        _hover={{ bg: colors.hoverBg }}
        size="sm"
      >
        <HStack gap={2}>
          <FiDownload />
          <Text>{t('participantes.exportCSV')}</Text>
        </HStack>
      </Button>
      <Button
        bg={primaryColor}
        color="white"
        onClick={handleCreateNew}
        _hover={{ opacity: 0.9 }}
        size="sm"
      >
        <HStack gap={2}>
          <FiPlus />
          <Text>{t('participantes.createNew')}</Text>
        </HStack>
      </Button>
    </HStack>
  );

  return (
    <Box flex={1} p={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color={textColor}>
            {t('participantes.title')}
          </Text>
          <Text fontSize="sm" color={textColorSecondary} mt={1}>
            {t('participantes.subtitle')}
          </Text>
        </Box>

        {/* DataTable */}
        <DataTable<Participante>
          data={paginatedData.data}
          columns={columns}
          rowKey={(row) => row.id}
          actions={actions}
          isLoading={loading}
          emptyMessage="No hay participantes registrados"
          pagination="server"
          serverPagination={{
            currentPage,
            totalItems: paginatedData.totalElements,
            pageSize,
            onPageChange: setCurrentPage,
            onPageSizeChange: (newSize) => {
              setPageSize(newSize);
              setCurrentPage(0);
            },
          }}
          defaultPageSize={pageSize}
          searchable={true}
          searchPlaceholder={t('participantes.filter')}
          toolbarRight={toolbarButtons}
          size="sm"
        />
      </VStack>

      {/* Create/Edit Modal */}
      <DialogRoot open={isModalOpen} onOpenChange={(e) => setIsModalOpen(e.open)}>
        <DialogBackdrop bg="rgba(0, 0, 0, 0.5)" />
        <DialogContent
          width={{ base: "95vw", md: "900px" }}
          maxH="95vh"
          css={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            overflowY: 'auto'
          }}
          bg={cardBg}
          borderColor={borderColor}
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={1400}
          overflowY="auto"
        >
          <DialogHeader>
            <DialogTitle color={textColor}>
              {editingParticipante ? 'Editar Participante' : t('participantes.createNew')}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody pb={6}>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <Box>
                <Text mb={2} fontWeight="medium" color={textColor}>
                  {t('participantes.identificacion')} <Text as="span" color="red.500">*</Text>
                </Text>
                <Input
                  value={formData.identificacion}
                  onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                  bg={bgColor}
                />
              </Box>
              <Box>
                <Text mb={2} fontWeight="medium" color={textColor}>
                  {t('participantes.tipo')} <Text as="span" color="red.500">*</Text>
                </Text>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    bg={bgColor}
                  >
                    <option value="Cliente">{t('participantes.cliente')}</option>
                    <option value="No cliente">No cliente</option>
                    <option value="Banco">{t('participantes.banco')}</option>
                  </NativeSelectField>
                </NativeSelectRoot>
              </Box>
              <Box>
                <Text mb={2} fontWeight="medium" color={textColor}>
                  {t('participantes.tipoReferencia')}
                </Text>
                <CustomCatalogDropdown
                  catalogCode="TIPO_REFERENCIA"
                  value={formData.tipoReferencia}
                  onChange={(value) => setFormData({ ...formData, tipoReferencia: value })}
                  placeholder={t('common.select', 'Seleccionar...')}
                />
              </Box>
              <Box>
                <Text mb={2} fontWeight="medium" color={textColor}>
                  {t('participantes.nombres')} <Text as="span" color="red.500">*</Text>
                </Text>
                <Input
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  bg={bgColor}
                />
              </Box>
              <Box>
                <Text mb={2} fontWeight="medium" color={textColor}>
                  {t('participantes.apellidos')} <Text as="span" color="red.500">*</Text>
                </Text>
                <Input
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  bg={bgColor}
                />
              </Box>
              <Box>
                <Text mb={2} fontWeight="medium" color={textColor}>
                  {t('participantes.email')} <Text as="span" color="red.500">*</Text>
                </Text>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  bg={bgColor}
                />
              </Box>
              <Box>
                <Text mb={2} fontWeight="medium" color={textColor}>
                  {t('participantes.telefono')}
                </Text>
                <Input
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  bg={bgColor}
                />
              </Box>
              <Box>
                <Text mb={2} fontWeight="medium" color={textColor}>
                  {t('participantes.direccion')}
                </Text>
                <Input
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  bg={bgColor}
                />
              </Box>
              <Box>
                <Text mb={2} fontWeight="medium" color={textColor}>
                  {t('participantes.agencia')}
                </Text>
                <CustomCatalogDropdown
                  catalogCode="AGE-001"
                  value={formData.agencia}
                  onChange={(value) => setFormData({ ...formData, agencia: value })}
                  placeholder={t('common.select', 'Seleccionar agencia...')}
                />
              </Box>
              <Box gridColumn="span 2">
                <Text mb={2} fontWeight="medium" color={textColor}>
                  {t('participantes.ejecutivoAsignado')}
                </Text>
                <Box position="relative">
                  <Input
                    value={formData.ejecutivoAsignado}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        ejecutivoAsignado: e.target.value,
                        // Clear auto-populated fields when typing manually
                        ejecutivoId: '',
                        correoEjecutivo: '',
                      });
                      setShowUserDropdown(true);
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                    placeholder={loadingUsers ? 'Cargando usuarios...' : 'Escriba o seleccione un ejecutivo'}
                    bg={bgColor}
                  />
                  {showUserDropdown && internalUsers.length > 0 && (
                    <Box
                      position="absolute"
                      top="100%"
                      left={0}
                      right={0}
                      zIndex={10}
                      bg={cardBg}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="md"
                      maxH="200px"
                      overflowY="auto"
                      boxShadow="md"
                    >
                      {internalUsers
                        .filter(u =>
                          !formData.ejecutivoAsignado ||
                          u.username.toLowerCase().includes(formData.ejecutivoAsignado.toLowerCase()) ||
                          u.email.toLowerCase().includes(formData.ejecutivoAsignado.toLowerCase())
                        )
                        .map(u => (
                          <Box
                            key={u.id}
                            px={3}
                            py={2}
                            cursor="pointer"
                            _hover={{ bg: colors.hoverBg }}
                            onClick={() => handleEjecutivoSelect(u)}
                          >
                            <Text fontWeight="medium" color={textColor}>{u.username}</Text>
                            <Text fontSize="xs" color={textColorSecondary}>{u.email}</Text>
                          </Box>
                        ))
                      }
                      {internalUsers.filter(u =>
                        !formData.ejecutivoAsignado ||
                        u.username.toLowerCase().includes(formData.ejecutivoAsignado.toLowerCase()) ||
                        u.email.toLowerCase().includes(formData.ejecutivoAsignado.toLowerCase())
                      ).length === 0 && (
                        <Box px={3} py={2}>
                          <Text fontSize="sm" color={textColorSecondary}>
                            No se encontraron usuarios. Se guardará como texto libre.
                          </Text>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
                {formData.correoEjecutivo && (
                  <Text fontSize="xs" color={textColorSecondary} mt={1}>
                    Email: {formData.correoEjecutivo}
                  </Text>
                )}
              </Box>
              {/* Hierarchy fields - Corporation Support */}
              <Box>
                <Text mb={2} fontWeight="medium" color={textColor}>
                  {t('participantes.hierarchyType', 'Tipo de Jerarquía')}
                </Text>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={formData.hierarchyType || ''}
                    onChange={(e) => {
                      const value = e.target.value as 'CORPORATION' | 'COMPANY' | 'BRANCH' | '';
                      setFormData({
                        ...formData,
                        hierarchyType: value === '' ? undefined : value,
                        // Clear parentId if selecting CORPORATION (top-level)
                        parentId: value === 'CORPORATION' ? undefined : formData.parentId
                      });
                    }}
                    bg={bgColor}
                  >
                    <option value="">{t('participantes.noHierarchy', 'Sin jerarquía')}</option>
                    <option value="CORPORATION">{t('participantes.corporation', 'Corporación')}</option>
                    <option value="COMPANY">{t('participantes.company', 'Empresa')}</option>
                    <option value="BRANCH">{t('participantes.branch', 'Sucursal')}</option>
                  </NativeSelectField>
                </NativeSelectRoot>
              </Box>

              <Box>
                <Text mb={2} fontWeight="medium" color={textColor}>
                  {t('participantes.parentCompany', 'Empresa Padre')}
                </Text>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={formData.parentId?.toString() || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      parentId: e.target.value ? parseInt(e.target.value, 10) : undefined
                    })}
                    bg={bgColor}
                    disabled={!formData.hierarchyType || formData.hierarchyType === 'CORPORATION' || loadingParents}
                  >
                    <option value="">{t('participantes.noParent', 'Sin empresa padre')}</option>
                    {parentCompanies
                      .filter(p => editingParticipante ? p.id !== editingParticipante.id : true)
                      .map(parent => (
                        <option key={parent.id} value={parent.id}>
                          {parent.nombres} {parent.apellidos} ({parent.identificacion}) - {parent.hierarchyType}
                        </option>
                      ))
                    }
                  </NativeSelectField>
                </NativeSelectRoot>
                {formData.hierarchyType === 'CORPORATION' && (
                  <Text fontSize="xs" color={textColorSecondary} mt={1}>
                    {t('participantes.corporationNoParent', 'Las corporaciones son el nivel superior y no tienen empresa padre')}
                  </Text>
                )}
              </Box>
            </Grid>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline" mr={3}>
                Cancelar
              </Button>
            </DialogActionTrigger>
            <Button
              bg={primaryColor}
              color="white"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? <Spinner size="sm" /> : (editingParticipante ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* History Modal */}
      <DialogRoot open={isHistoryModalOpen} onOpenChange={(e) => setIsHistoryModalOpen(e.open)}>
        <DialogBackdrop bg="rgba(0, 0, 0, 0.5)" />
        <DialogContent
          width={{ base: "95vw", md: "800px" }}
          maxH="90vh"
          css={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            overflowY: 'auto'
          }}
          bg={cardBg}
          borderColor={borderColor}
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={1400}
          overflowY="auto"
        >
          <DialogHeader>
            <DialogTitle color={textColor}>
              Historial de Eventos - {selectedParticipante?.nombres} {selectedParticipante?.apellidos}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody pb={6}>
            {loadingHistory ? (
              <Flex justify="center" py={8}>
                <Spinner size="lg" color={primaryColor} />
              </Flex>
            ) : eventHistory.length === 0 ? (
              <Text color={textColorSecondary} textAlign="center" py={8}>
                No hay eventos registrados
              </Text>
            ) : (
              <VStack gap={4} align="stretch">
                {eventHistory.map((event, index) => (
                  <Box
                    key={event.eventId || index}
                    p={4}
                    bg={bgColor}
                    borderRadius="md"
                    border="1px"
                    borderColor={borderColor}
                  >
                    <Flex justify="space-between" mb={2}>
                      <Text fontWeight="bold" color={primaryColor}>
                        {event.eventType}
                      </Text>
                      <Text fontSize="sm" color={textColorSecondary}>
                        {new Date(event.timestamp).toLocaleString()}
                      </Text>
                    </Flex>
                    <Text fontSize="sm" color={textColorSecondary}>
                      Por: {event.performedBy} | Versión: {event.version}
                    </Text>
                    {event.eventData && Object.keys(event.eventData).length > 0 && (
                      <Box mt={2} p={2} bg={cardBg} borderRadius="sm" fontSize="xs">
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {JSON.stringify(event.eventData, null, 2)}
                        </pre>
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
    </Box>
  );
};
