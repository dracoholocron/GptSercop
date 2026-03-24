import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Tabs,
  Card,
  Badge,
  Button,
  Input,
  IconButton,
  Flex,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogTitle,
  DialogBackdrop,
} from '@chakra-ui/react';
import { Switch } from '@chakra-ui/react/switch';
import {
  FiClock,
  FiGlobe,
  FiCalendar,
  FiAlertCircle,
  FiFileText,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiStar,
} from 'react-icons/fi';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { notify } from '../../../components/ui/toaster';
import { DataTable, type DataTableColumn, type DataTableAction } from '../../../components/ui/DataTable';
import { scheduleService } from '../../../services/scheduleService';
import type {
  GlobalSchedule,
  Holiday,
  ScheduleException,
  AccessLog,
} from '../../../services/scheduleService';

const DAYS = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 7, label: 'Domingo', short: 'Dom' },
];

const TIMEZONES = [
  // América del Norte
  { value: 'America/Mexico_City', label: 'Ciudad de México (CST)' },
  { value: 'America/New_York', label: 'Nueva York (EST)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (PST)' },
  { value: 'America/Chicago', label: 'Chicago (CST)' },
  { value: 'America/Denver', label: 'Denver (MST)' },
  // América Central y Caribe
  { value: 'America/Panama', label: 'Panamá (EST)' },
  { value: 'America/Costa_Rica', label: 'Costa Rica (CST)' },
  { value: 'America/Guatemala', label: 'Guatemala (CST)' },
  { value: 'America/El_Salvador', label: 'El Salvador (CST)' },
  { value: 'America/Tegucigalpa', label: 'Honduras (CST)' },
  { value: 'America/Managua', label: 'Nicaragua (CST)' },
  { value: 'America/Santo_Domingo', label: 'República Dominicana (AST)' },
  // América del Sur
  { value: 'America/Guayaquil', label: 'Ecuador (ECT)' },
  { value: 'America/Bogota', label: 'Bogotá (COT)' },
  { value: 'America/Lima', label: 'Lima (PET)' },
  { value: 'America/Caracas', label: 'Caracas (VET)' },
  { value: 'America/Santiago', label: 'Santiago (CLT)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (ART)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { value: 'America/Montevideo', label: 'Montevideo (UYT)' },
  { value: 'America/Asuncion', label: 'Asunción (PYT)' },
  { value: 'America/La_Paz', label: 'La Paz (BOT)' },
  // Europa
  { value: 'Europe/Madrid', label: 'Madrid (CET)' },
  { value: 'Europe/London', label: 'Londres (GMT)' },
  { value: 'Europe/Paris', label: 'París (CET)' },
  // Asia
  { value: 'Asia/Tokyo', label: 'Tokio (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghái (CST)' },
  // UTC
  { value: 'UTC', label: 'UTC' },
];

export const ScheduleConfigPage: React.FC = () => {
  const { getColors } = useTheme();
  const colors = getColors();
  const { t } = useTranslation();
  const { bgColor, borderColor, cardBg, textColor, textColorSecondary, primaryColor } = colors;

  // State
  const [loading, setLoading] = useState(true);
  const [globalSchedules, setGlobalSchedules] = useState<GlobalSchedule[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

  // Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<GlobalSchedule | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state for global schedule
  const [scheduleForm, setScheduleForm] = useState<GlobalSchedule>({
    code: '',
    nameKey: '',
    descriptionKey: '',
    timezone: 'America/Mexico_City',
    isActive: true,
    hours: DAYS.map((d) => ({
      dayOfWeek: d.value,
      isEnabled: d.value <= 5, // Mon-Fri enabled by default
      startTime: '09:00',
      endTime: '18:00',
      allowOvernight: false,
    })),
  });

  // Form state for holiday
  const [holidayForm, setHolidayForm] = useState<Holiday>({
    holidayDate: '',
    code: '',
    nameKey: '',
    countryCode: 'MEX',
    actionType: 'CLOSED',
    isBankHoliday: true,
    isRecurring: false,
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [schedules, holidayList, exceptionList] = await Promise.all([
        scheduleService.getGlobalSchedules(),
        scheduleService.getHolidays(),
        scheduleService.getExceptions(),
      ]);
      setGlobalSchedules(schedules);
      setHolidays(holidayList);
      setExceptions(exceptionList);
    } catch (error) {
      notify.error('Error', error instanceof Error ? error.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadAccessLogs = async () => {
    try {
      const result = await scheduleService.getAccessLogs(0, 100);
      setAccessLogs(result.content);
    } catch (error) {
      notify.error('Error', 'Error al cargar logs de acceso');
    }
  };

  // Global Schedule handlers
  const handleNewSchedule = () => {
    setEditingSchedule(null);
    setScheduleForm({
      code: '',
      nameKey: '',
      descriptionKey: '',
      timezone: 'America/Mexico_City',
      isActive: true,
      hours: DAYS.map((d) => ({
        dayOfWeek: d.value,
        isEnabled: d.value <= 5,
        startTime: '09:00',
        endTime: '18:00',
        allowOvernight: false,
      })),
    });
    setIsScheduleModalOpen(true);
  };

  const handleEditSchedule = (schedule: GlobalSchedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      ...schedule,
      hours: DAYS.map((d) => {
        const existing = schedule.hours?.find((h) => h.dayOfWeek === d.value);
        return existing || {
          dayOfWeek: d.value,
          isEnabled: false,
          startTime: '09:00',
          endTime: '18:00',
          allowOvernight: false,
        };
      }),
    });
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!scheduleForm.code || !scheduleForm.nameKey) {
      notify.warning('Validación', 'El código y nombre son requeridos');
      return;
    }

    setSaving(true);
    try {
      if (editingSchedule?.id) {
        await scheduleService.updateGlobalSchedule(editingSchedule.id, scheduleForm);
        notify.success('Éxito', 'Horario actualizado');
      } else {
        await scheduleService.createGlobalSchedule(scheduleForm);
        notify.success('Éxito', 'Horario creado');
      }
      setIsScheduleModalOpen(false);
      await loadData();
    } catch (error) {
      notify.error('Error', error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este horario?')) return;
    try {
      await scheduleService.deleteGlobalSchedule(id);
      notify.success('Éxito', 'Horario eliminado');
      await loadData();
    } catch (error) {
      notify.error('Error', error instanceof Error ? error.message : 'Error al eliminar');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await scheduleService.setDefaultGlobalSchedule(id);
      notify.success('Éxito', 'Horario establecido como predeterminado');
      await loadData();
    } catch (error) {
      notify.error('Error', error instanceof Error ? error.message : 'Error');
    }
  };

  // Holiday handlers
  const handleNewHoliday = () => {
    setEditingHoliday(null);
    setHolidayForm({
      holidayDate: '',
      code: '',
      nameKey: '',
      countryCode: 'MEX',
      actionType: 'CLOSED',
      isBankHoliday: true,
      isRecurring: false,
      isActive: true,
    });
    setIsHolidayModalOpen(true);
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setHolidayForm({ ...holiday });
    setIsHolidayModalOpen(true);
  };

  const handleSaveHoliday = async () => {
    if (!holidayForm.code || !holidayForm.nameKey || !holidayForm.holidayDate) {
      notify.warning('Validación', 'Código, nombre y fecha son requeridos');
      return;
    }

    setSaving(true);
    try {
      if (editingHoliday?.id) {
        await scheduleService.updateHoliday(editingHoliday.id, holidayForm);
        notify.success('Éxito', 'Día festivo actualizado');
      } else {
        await scheduleService.createHoliday(holidayForm);
        notify.success('Éxito', 'Día festivo creado');
      }
      setIsHolidayModalOpen(false);
      await loadData();
    } catch (error) {
      notify.error('Error', error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este día festivo?')) return;
    try {
      await scheduleService.deleteHoliday(id);
      notify.success('Éxito', 'Día festivo eliminado');
      await loadData();
    } catch (error) {
      notify.error('Error', error instanceof Error ? error.message : 'Error al eliminar');
    }
  };

  // Exception handlers
  const handleApproveException = async (id: number) => {
    try {
      await scheduleService.approveException(id);
      notify.success('Éxito', 'Excepción aprobada');
      await loadData();
    } catch (error) {
      notify.error('Error', error instanceof Error ? error.message : 'Error');
    }
  };

  const handleRejectException = async (id: number) => {
    const reason = prompt('Razón del rechazo:');
    if (reason === null) return;
    try {
      await scheduleService.rejectException(id, reason);
      notify.success('Éxito', 'Excepción rechazada');
      await loadData();
    } catch (error) {
      notify.error('Error', error instanceof Error ? error.message : 'Error');
    }
  };

  // ===================== DataTable column/action definitions =====================

  // --- Holidays ---
  const holidayColumns: DataTableColumn<Holiday>[] = useMemo(() => [
    { key: 'holidayDate', label: 'Fecha', sortable: true },
    { key: 'nameKey', label: 'Nombre', render: (row) => <Text>{t(row.nameKey)}</Text> },
    { key: 'countryCode', label: 'País' },
    {
      key: 'actionType',
      label: 'Tipo',
      filterType: 'select',
      filterOptions: [
        { value: 'CLOSED', label: 'Cerrado' },
        { value: 'REDUCED_HOURS', label: 'Horario Reducido' },
        { value: 'NORMAL', label: 'Normal' },
      ],
      render: (row) => (
        <Badge
          colorPalette={
            row.actionType === 'CLOSED'
              ? 'red'
              : row.actionType === 'REDUCED_HOURS'
              ? 'yellow'
              : 'green'
          }
        >
          {row.actionType === 'CLOSED'
            ? 'Cerrado'
            : row.actionType === 'REDUCED_HOURS'
            ? 'Horario Reducido'
            : 'Normal'}
        </Badge>
      ),
    },
    {
      key: 'isRecurring',
      label: 'Recurrente',
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'Anual' },
        { value: 'false', label: 'Único' },
      ],
      render: (row) =>
        row.isRecurring ? (
          <Badge colorPalette="blue">Anual</Badge>
        ) : (
          <Badge colorPalette="gray">Único</Badge>
        ),
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
        <Badge colorPalette={row.isActive ? 'green' : 'red'}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ], [t]);

  const holidayActions: DataTableAction<Holiday>[] = useMemo(() => [
    {
      key: 'edit',
      label: 'Editar',
      icon: FiEdit2,
      onClick: (row) => handleEditHoliday(row),
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: FiTrash2,
      colorPalette: 'red',
      onClick: (row) => handleDeleteHoliday(row.id!),
    },
  ], []);

  // --- Exceptions ---
  const exceptionColumns: DataTableColumn<ScheduleException>[] = useMemo(() => [
    { key: 'exceptionDate', label: 'Fecha', sortable: true },
    {
      key: 'exceptionType',
      label: 'Tipo',
      filterType: 'select',
      filterOptions: [
        { value: 'GLOBAL', label: 'GLOBAL' },
        { value: 'ROLE', label: 'ROLE' },
        { value: 'USER', label: 'USER' },
      ],
      render: (row) => (
        <Badge
          colorPalette={
            row.exceptionType === 'GLOBAL'
              ? 'purple'
              : row.exceptionType === 'ROLE'
              ? 'blue'
              : 'green'
          }
        >
          {row.exceptionType}
        </Badge>
      ),
    },
    {
      key: 'exceptionAction',
      label: 'Acción',
      filterType: 'select',
      filterOptions: [
        { value: 'ALLOW', label: 'ALLOW' },
        { value: 'DENY', label: 'DENY' },
        { value: 'REDUCE', label: 'REDUCE' },
      ],
      render: (row) => (
        <Badge
          colorPalette={
            row.exceptionAction === 'ALLOW'
              ? 'green'
              : row.exceptionAction === 'DENY'
              ? 'red'
              : 'yellow'
          }
        >
          {row.exceptionAction}
        </Badge>
      ),
    },
    { key: 'reason', label: 'Razón' },
    { key: 'requestedBy', label: 'Solicitado por' },
    {
      key: 'approvalStatus',
      label: 'Estado',
      filterType: 'select',
      filterOptions: [
        { value: 'APPROVED', label: 'Aprobada' },
        { value: 'REJECTED', label: 'Rechazada' },
        { value: 'PENDING', label: 'Pendiente' },
      ],
      render: (row) => (
        <Badge
          colorPalette={
            row.approvalStatus === 'APPROVED'
              ? 'green'
              : row.approvalStatus === 'REJECTED'
              ? 'red'
              : 'orange'
          }
        >
          {row.approvalStatus === 'APPROVED'
            ? 'Aprobada'
            : row.approvalStatus === 'REJECTED'
            ? 'Rechazada'
            : 'Pendiente'}
        </Badge>
      ),
    },
  ], []);

  const exceptionActions: DataTableAction<ScheduleException>[] = useMemo(() => [
    {
      key: 'approve',
      label: 'Aprobar',
      icon: FiCheck,
      colorPalette: 'green',
      onClick: (row) => handleApproveException(row.id!),
      isHidden: (row) => row.approvalStatus !== 'PENDING',
    },
    {
      key: 'reject',
      label: 'Rechazar',
      icon: FiX,
      colorPalette: 'red',
      onClick: (row) => handleRejectException(row.id!),
      isHidden: (row) => row.approvalStatus !== 'PENDING',
    },
  ], []);

  // --- Access Logs ---
  const accessLogColumns: DataTableColumn<AccessLog>[] = useMemo(() => [
    {
      key: 'accessTimestamp',
      label: 'Fecha/Hora',
      sortable: true,
      render: (row) => (
        <Text fontSize="xs">{new Date(row.accessTimestamp).toLocaleString()}</Text>
      ),
    },
    { key: 'username', label: 'Usuario' },
    {
      key: 'accessResult',
      label: 'Resultado',
      filterType: 'select',
      filterOptions: [
        { value: 'ALLOWED', label: 'ALLOWED' },
        { value: 'WARNED', label: 'WARNED' },
        { value: 'DENIED', label: 'DENIED' },
      ],
      render: (row) => (
        <Badge
          colorPalette={
            row.accessResult === 'ALLOWED'
              ? 'green'
              : row.accessResult === 'WARNED'
              ? 'yellow'
              : 'red'
          }
        >
          {row.accessResult}
        </Badge>
      ),
    },
    {
      key: 'scheduleLevelApplied',
      label: 'Nivel',
      render: (row) => <Badge variant="subtle">{row.scheduleLevelApplied}</Badge>,
    },
    {
      key: 'denialReasonKey',
      label: 'Razón',
      render: (row) => (
        <Text fontSize="xs">{row.denialReasonKey ? t(row.denialReasonKey) : '-'}</Text>
      ),
    },
    {
      key: 'ipAddress',
      label: 'IP',
      render: (row) => <Text fontSize="xs">{row.ipAddress}</Text>,
    },
  ], [t]);

  return (
    <Box flex={1} p={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <HStack gap={2}>
              <FiClock size={24} color={primaryColor} />
              <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                Horarios del Sistema
              </Text>
            </HStack>
            <Text fontSize="sm" color={textColorSecondary} mt={1}>
              Configure los horarios de acceso al sistema por nivel, rol y usuario
            </Text>
          </Box>
        </Flex>

        {/* Tabs */}
        <Tabs.Root defaultValue="global" variant="enclosed">
          <Tabs.List bg={cardBg} borderRadius="lg" p={1}>
            <Tabs.Trigger value="global">
              <HStack gap={2}>
                <FiGlobe />
                <Text>Horario Global</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="holidays">
              <HStack gap={2}>
                <FiCalendar />
                <Text>Días Festivos</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="exceptions">
              <HStack gap={2}>
                <FiAlertCircle />
                <Text>Excepciones</Text>
                {exceptions.filter((e) => e.approvalStatus === 'PENDING').length > 0 && (
                  <Badge colorPalette="orange" size="sm">
                    {exceptions.filter((e) => e.approvalStatus === 'PENDING').length}
                  </Badge>
                )}
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="logs" onClick={loadAccessLogs}>
              <HStack gap={2}>
                <FiFileText />
                <Text>Auditoría</Text>
              </HStack>
            </Tabs.Trigger>
          </Tabs.List>

          {/* Global Schedule Tab */}
          <Tabs.Content value="global" p={4}>
            <VStack gap={4} align="stretch">
              <Flex justify="flex-end">
                <Button colorPalette="blue" size="sm" onClick={handleNewSchedule}>
                  <FiPlus /> Nuevo Horario
                </Button>
              </Flex>

              {globalSchedules.map((schedule) => (
                <Card.Root key={schedule.id} bg={cardBg} borderColor={borderColor}>
                  <Card.Body>
                    <Flex justify="space-between" align="start">
                      <Box>
                        <HStack gap={2}>
                          <Text fontWeight="bold" fontSize="lg">{t(schedule.nameKey)}</Text>
                          <Badge variant="subtle" size="sm">{schedule.code}</Badge>
                          {schedule.isDefault && (
                            <Badge colorPalette="green">
                              <FiStar size={12} /> {t('schedules.default')}
                            </Badge>
                          )}
                          {!schedule.isActive && (
                            <Badge colorPalette="red">{t('common.inactive')}</Badge>
                          )}
                        </HStack>
                        <Text fontSize="sm" color={textColorSecondary} mt={1}>
                          {schedule.descriptionKey ? t(schedule.descriptionKey) : ''}
                        </Text>
                        <Text fontSize="xs" color={textColorSecondary} mt={2}>
                          {t('schedules.timezone')}: {schedule.timezone}
                        </Text>
                      </Box>
                      <HStack gap={1}>
                        {!schedule.isDefault && (
                          <IconButton
                            aria-label="Set default"
                            size="sm"
                            variant="ghost"
                            colorPalette="yellow"
                            onClick={() => handleSetDefault(schedule.id!)}
                          >
                            <FiStar />
                          </IconButton>
                        )}
                        <IconButton
                          aria-label="Edit"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditSchedule(schedule)}
                        >
                          <FiEdit2 />
                        </IconButton>
                        <IconButton
                          aria-label="Delete"
                          size="sm"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => handleDeleteSchedule(schedule.id!)}
                        >
                          <FiTrash2 />
                        </IconButton>
                      </HStack>
                    </Flex>

                    {/* Schedule hours grid */}
                    <Box mt={4}>
                      <HStack gap={2} flexWrap="wrap">
                        {DAYS.map((day) => {
                          const hours = schedule.hours?.find((h) => h.dayOfWeek === day.value);
                          const isEnabled = hours?.isEnabled;
                          return (
                            <Box
                              key={day.value}
                              p={2}
                              borderRadius="md"
                              bg={isEnabled ? 'green.50' : 'gray.50'}
                              border="1px solid"
                              borderColor={isEnabled ? 'green.200' : 'gray.200'}
                              minW="80px"
                              textAlign="center"
                            >
                              <Text fontSize="xs" fontWeight="bold" color={isEnabled ? 'green.700' : 'gray.500'}>
                                {day.short}
                              </Text>
                              {isEnabled && hours ? (
                                <Text fontSize="xs" color="green.600">
                                  {hours.startTime?.substring(0, 5)} - {hours.endTime?.substring(0, 5)}
                                </Text>
                              ) : (
                                <Text fontSize="xs" color="gray.400">Cerrado</Text>
                              )}
                            </Box>
                          );
                        })}
                      </HStack>
                    </Box>
                  </Card.Body>
                </Card.Root>
              ))}

              {globalSchedules.length === 0 && !loading && (
                <Box textAlign="center" py={10}>
                  <FiClock size={48} color="gray" style={{ margin: '0 auto' }} />
                  <Text mt={4} color={textColorSecondary}>
                    No hay horarios configurados
                  </Text>
                  <Button mt={4} colorPalette="blue" onClick={handleNewSchedule}>
                    Crear Horario
                  </Button>
                </Box>
              )}
            </VStack>
          </Tabs.Content>

          {/* Holidays Tab */}
          <Tabs.Content value="holidays" p={4}>
            <DataTable<Holiday>
              data={holidays}
              columns={holidayColumns}
              rowKey={(row) => String(row.id)}
              actions={holidayActions}
              isLoading={loading}
              emptyMessage="No hay días festivos configurados"
              emptyIcon={FiCalendar}
              defaultPageSize={10}
              toolbarRight={
                <Button colorPalette="blue" size="sm" onClick={handleNewHoliday}>
                  <FiPlus /> Nuevo Día Festivo
                </Button>
              }
            />
          </Tabs.Content>

          {/* Exceptions Tab */}
          <Tabs.Content value="exceptions" p={4}>
            <DataTable<ScheduleException>
              data={exceptions}
              columns={exceptionColumns}
              rowKey={(row) => String(row.id)}
              actions={exceptionActions}
              isLoading={loading}
              emptyMessage="No hay excepciones configuradas"
              emptyIcon={FiAlertCircle}
              defaultPageSize={10}
            />
          </Tabs.Content>

          {/* Access Logs Tab */}
          <Tabs.Content value="logs" p={4}>
            <DataTable<AccessLog>
              data={accessLogs}
              columns={accessLogColumns}
              rowKey={(row) => String(row.id)}
              isLoading={false}
              emptyMessage="No hay registros de acceso"
              emptyIcon={FiFileText}
              defaultPageSize={20}
            />
          </Tabs.Content>
        </Tabs.Root>
      </VStack>

      {/* Schedule Modal */}
      <DialogRoot open={isScheduleModalOpen} onOpenChange={(e) => setIsScheduleModalOpen(e.open)}>
        <DialogBackdrop />
        <DialogContent maxW="600px">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? 'Editar Horario Global' : 'Nuevo Horario Global'}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch">
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>{t('schedules.form.code')} *</Text>
                <Input
                  value={scheduleForm.code}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                  placeholder="Ej: STANDARD_SCHEDULE"
                />
                <Text fontSize="xs" color={textColorSecondary} mt={1}>
                  {t('schedules.form.code_hint')}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>{t('schedules.form.name_key')} *</Text>
                <Input
                  value={scheduleForm.nameKey}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, nameKey: e.target.value })}
                  placeholder="Ej: schedules.standard.name"
                />
                <Text fontSize="xs" color={textColorSecondary} mt={1}>
                  {t('schedules.form.i18n_hint')}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>{t('schedules.form.description_key')}</Text>
                <Input
                  value={scheduleForm.descriptionKey || ''}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, descriptionKey: e.target.value })}
                  placeholder="Ej: schedules.standard.description"
                />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>Zona Horaria</Text>
                <select
                  value={scheduleForm.timezone}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, timezone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${borderColor}`,
                    background: bgColor,
                  }}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Horarios por Día</Text>
                <VStack gap={2} align="stretch">
                  {DAYS.map((day) => {
                    const hourIndex = scheduleForm.hours.findIndex((h) => h.dayOfWeek === day.value);
                    const hours = scheduleForm.hours[hourIndex];
                    return (
                      <HStack key={day.value} justify="space-between" p={2} bg={bgColor} borderRadius="md">
                        <HStack gap={2} minW="100px">
                          <Switch.Root
                            checked={hours?.isEnabled || false}
                            onCheckedChange={(e) => {
                              const newHours = [...scheduleForm.hours];
                              if (hourIndex >= 0) {
                                newHours[hourIndex] = { ...newHours[hourIndex], isEnabled: e.checked };
                              }
                              setScheduleForm({ ...scheduleForm, hours: newHours });
                            }}
                          >
                            <Switch.HiddenInput />
                            <Switch.Control />
                          </Switch.Root>
                          <Text fontSize="sm" fontWeight="medium" w="80px">
                            {day.label}
                          </Text>
                        </HStack>
                        {hours?.isEnabled && (
                          <HStack gap={2}>
                            <Input
                              type="time"
                              size="sm"
                              w="120px"
                              value={hours.startTime || '09:00'}
                              onChange={(e) => {
                                const newHours = [...scheduleForm.hours];
                                newHours[hourIndex] = { ...newHours[hourIndex], startTime: e.target.value };
                                setScheduleForm({ ...scheduleForm, hours: newHours });
                              }}
                            />
                            <Text>a</Text>
                            <Input
                              type="time"
                              size="sm"
                              w="120px"
                              value={hours.endTime || '18:00'}
                              onChange={(e) => {
                                const newHours = [...scheduleForm.hours];
                                newHours[hourIndex] = { ...newHours[hourIndex], endTime: e.target.value };
                                setScheduleForm({ ...scheduleForm, hours: newHours });
                              }}
                            />
                          </HStack>
                        )}
                        {!hours?.isEnabled && (
                          <Text fontSize="sm" color={textColorSecondary}>Cerrado</Text>
                        )}
                      </HStack>
                    );
                  })}
                </VStack>
              </Box>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsScheduleModalOpen(false)}>
              Cancelar
            </Button>
            <Button colorPalette="blue" onClick={handleSaveSchedule} loading={saving}>
              {editingSchedule ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Holiday Modal */}
      <DialogRoot open={isHolidayModalOpen} onOpenChange={(e) => setIsHolidayModalOpen(e.open)}>
        <DialogBackdrop />
        <DialogContent maxW="500px">
          <DialogHeader>
            <DialogTitle>{editingHoliday ? 'Editar Día Festivo' : 'Nuevo Día Festivo'}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch">
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>{t('schedules.form.date')} *</Text>
                <Input
                  type="date"
                  value={holidayForm.holidayDate}
                  onChange={(e) => setHolidayForm({ ...holidayForm, holidayDate: e.target.value })}
                />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>{t('schedules.form.code')} *</Text>
                <Input
                  value={holidayForm.code}
                  onChange={(e) => setHolidayForm({ ...holidayForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                  placeholder="Ej: INDEPENDENCE_DAY"
                />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>{t('schedules.form.name_key')} *</Text>
                <Input
                  value={holidayForm.nameKey}
                  onChange={(e) => setHolidayForm({ ...holidayForm, nameKey: e.target.value })}
                  placeholder="Ej: schedules.holidays.independence_day"
                />
                <Text fontSize="xs" color={textColorSecondary} mt={1}>
                  {t('schedules.form.i18n_hint')}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>País</Text>
                <Input
                  value={holidayForm.countryCode || ''}
                  onChange={(e) => setHolidayForm({ ...holidayForm, countryCode: e.target.value })}
                  placeholder="MEX"
                  maxLength={3}
                />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>Tipo de Acción</Text>
                <select
                  value={holidayForm.actionType}
                  onChange={(e) =>
                    setHolidayForm({
                      ...holidayForm,
                      actionType: e.target.value as 'CLOSED' | 'REDUCED_HOURS' | 'NORMAL',
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${borderColor}`,
                    background: bgColor,
                  }}
                >
                  <option value="CLOSED">Cerrado</option>
                  <option value="REDUCED_HOURS">Horario Reducido</option>
                  <option value="NORMAL">Normal (solo informativo)</option>
                </select>
              </Box>
              {holidayForm.actionType === 'REDUCED_HOURS' && (
                <HStack gap={2}>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>Hora Inicio</Text>
                    <Input
                      type="time"
                      value={holidayForm.startTime || ''}
                      onChange={(e) => setHolidayForm({ ...holidayForm, startTime: e.target.value })}
                    />
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>Hora Fin</Text>
                    <Input
                      type="time"
                      value={holidayForm.endTime || ''}
                      onChange={(e) => setHolidayForm({ ...holidayForm, endTime: e.target.value })}
                    />
                  </Box>
                </HStack>
              )}
              <HStack>
                <Switch
                  checked={holidayForm.isRecurring || false}
                  onCheckedChange={(e) => setHolidayForm({ ...holidayForm, isRecurring: e.checked })}
                />
                <Text fontSize="sm">Se repite cada año</Text>
              </HStack>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsHolidayModalOpen(false)}>
              Cancelar
            </Button>
            <Button colorPalette="blue" onClick={handleSaveHoliday} loading={saving}>
              {editingHoliday ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
};

export default ScheduleConfigPage;
