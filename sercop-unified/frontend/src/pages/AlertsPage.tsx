import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Button,
  IconButton,
  Badge,
  Spinner,
  Grid,
  GridItem,
  Tabs,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiPlus,
  FiCalendar,
  FiList,
  FiGrid,
  FiRefreshCw,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiTag,
  FiFolder,
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  advancedSearch,
  getTodayWidget,
  getAgenda,
} from '../services/alertService';
import type {
  AlertResponse,
  AlertSearchRequest,
  PagedResponse,
  TodayAlertsWidgetResponse,
  AgendaResponse,
  AlertQuickFilter,
} from '../services/alertService';
import { AlertCard } from '../components/alerts/AlertCard';
import { AlertDetailModal } from '../components/alerts/AlertDetailModal';
import { AlertCreateModal } from '../components/alerts/AlertCreateModal';
import { AlertFilters } from '../components/alerts/AlertFilters';
import { TagScheduleView } from '../components/alerts/TagScheduleView';
import { GanttView } from '../components/alerts/GanttView';
import { GroupedListView } from '../components/alerts/GroupedListView';
import { FiBarChart2 } from 'react-icons/fi';

type ViewMode = 'list' | 'grouped' | 'calendar' | 'schedule' | 'gantt';

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getWeekDays = (date: Date): Date[] => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
};

export const AlertsPage = () => {
  const { t, i18n } = useTranslation();
  const { getColors } = useTheme();
  const { hasRole } = useAuth();
  const colors = getColors();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [widget, setWidget] = useState<TodayAlertsWidgetResponse | null>(null);
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [selectedAlert, setSelectedAlert] = useState<AlertResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [filters, setFilters] = useState<AlertSearchRequest>({
    viewMode: 'ASSIGNED_TO_ME',
    hideCompleted: true,
    page: 0,
    size: 20,
  });

  const lang = i18n.language === 'en' ? 'en' : 'es';

  // Check if user can view all alerts (Admin, Supervisor, or Manager roles)
  // Roles have ROLE_ prefix (e.g., ROLE_ADMIN)
  const canViewAll = hasRole?.('ROLE_ADMIN') || hasRole?.('ROLE_SUPERVISOR') || hasRole?.('ROLE_MANAGER');

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [searchResults, widgetData] = await Promise.all([
        advancedSearch(filters, lang),
        getTodayWidget(lang),
      ]);
      setAlerts(searchResults.content);
      setTotalElements(searchResults.totalElements);
      setWidget(widgetData);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, lang]);

  const loadAgenda = useCallback(async () => {
    try {
      const agendaData = await getAgenda(formatDate(selectedDate), 'WEEK', lang);
      setAgenda(agendaData);
    } catch (error) {
      console.error('Error loading agenda:', error);
    }
  }, [selectedDate, lang]);

  useEffect(() => {
    if (viewMode === 'list') {
      loadAlerts();
    } else {
      loadAgenda();
    }
  }, [viewMode, loadAlerts, loadAgenda]);

  useEffect(() => {
    if (viewMode === 'calendar') {
      loadAgenda();
    }
  }, [selectedDate, viewMode, loadAgenda]);

  const handleSearch = () => {
    setFilters({ ...filters, page: 0 });
    loadAlerts();
  };

  const handleAlertClick = (alert: AlertResponse) => {
    setSelectedAlert(alert);
    setIsDetailOpen(true);
  };

  const handleAlertUpdate = () => {
    loadAlerts();
    setIsDetailOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const getAlertsForDate = (date: Date): AlertResponse[] => {
    if (!agenda?.alertsByDate) return [];
    const dateStr = formatDate(date);
    return agenda.alertsByDate[dateStr] || [];
  };

  const totalPages = Math.ceil(totalElements / (filters.size || 20));
  const weekDays = getWeekDays(selectedDate);
  const dayNames = lang === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <Box p={6} minH="100vh" bg={colors.bgColor}>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={4}>
        <VStack align="flex-start" gap={1}>
          <HStack>
            <FiCalendar size={28} color={colors.primaryColor} />
            <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>
              {t('alerts.page.title', 'Centro de Alertas')}
            </Text>
          </HStack>
          <Text fontSize="sm" color={colors.textColorSecondary}>
            {t('alerts.page.subtitle', 'Gestiona y filtra todas tus alertas y tareas pendientes')}
          </Text>
        </VStack>

        {/* Quick Stats - Click to filter */}
        {widget && (
          <HStack gap={4} flexWrap="wrap">
            <Box
              bg={filters.quickFilter === 'OVERDUE' ? 'red.500' : (widget.hasUrgent ? 'red.500' : colors.cardBg)}
              px={4}
              py={2}
              borderRadius="lg"
              borderWidth={2}
              borderColor={filters.quickFilter === 'OVERDUE' ? 'red.700' : (widget.hasUrgent ? 'red.500' : colors.borderColor)}
              cursor="pointer"
              _hover={{ transform: 'scale(1.02)', boxShadow: 'md' }}
              transition="all 0.2s"
              onClick={() => {
                const newFilter = filters.quickFilter === 'OVERDUE' ? undefined : 'OVERDUE' as AlertQuickFilter;
                setFilters({ ...filters, quickFilter: newFilter, page: 0 });
              }}
            >
              <HStack>
                <FiAlertCircle color={filters.quickFilter === 'OVERDUE' || widget.hasUrgent ? 'white' : 'red'} />
                <VStack align="flex-start" gap={0}>
                  <Text
                    fontSize="xl"
                    fontWeight="bold"
                    color={filters.quickFilter === 'OVERDUE' || widget.hasUrgent ? 'white' : colors.textColor}
                  >
                    {widget.overdueTotal}
                  </Text>
                  <Text
                    fontSize="xs"
                    color={filters.quickFilter === 'OVERDUE' || widget.hasUrgent ? 'whiteAlpha.800' : colors.textColorSecondary}
                  >
                    {t('alerts.overdue', 'Vencidas')}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box
              bg={filters.quickFilter === 'TODAY' ? colors.primaryColor : colors.cardBg}
              px={4}
              py={2}
              borderRadius="lg"
              borderWidth={2}
              borderColor={filters.quickFilter === 'TODAY' ? colors.primaryColor : colors.borderColor}
              cursor="pointer"
              _hover={{ transform: 'scale(1.02)', boxShadow: 'md' }}
              transition="all 0.2s"
              onClick={() => {
                const newFilter = filters.quickFilter === 'TODAY' ? undefined : 'TODAY' as AlertQuickFilter;
                setFilters({ ...filters, quickFilter: newFilter, page: 0 });
              }}
            >
              <HStack>
                <FiClock color={filters.quickFilter === 'TODAY' ? 'white' : colors.primaryColor} />
                <VStack align="flex-start" gap={0}>
                  <Text fontSize="xl" fontWeight="bold" color={filters.quickFilter === 'TODAY' ? 'white' : colors.textColor}>
                    {widget.pendingToday}
                  </Text>
                  <Text fontSize="xs" color={filters.quickFilter === 'TODAY' ? 'whiteAlpha.800' : colors.textColorSecondary}>
                    {t('alerts.pendingToday', 'Pendientes hoy')}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box
              bg={filters.quickFilter === 'COMPLETED_TODAY' ? 'green.500' : colors.cardBg}
              px={4}
              py={2}
              borderRadius="lg"
              borderWidth={2}
              borderColor={filters.quickFilter === 'COMPLETED_TODAY' ? 'green.600' : colors.borderColor}
              cursor="pointer"
              _hover={{ transform: 'scale(1.02)', boxShadow: 'md' }}
              transition="all 0.2s"
              onClick={() => {
                const newFilter = filters.quickFilter === 'COMPLETED_TODAY' ? undefined : 'COMPLETED_TODAY' as AlertQuickFilter;
                setFilters({ ...filters, quickFilter: newFilter, page: 0 });
              }}
            >
              <HStack>
                <FiCheckCircle color={filters.quickFilter === 'COMPLETED_TODAY' ? 'white' : 'green'} />
                <VStack align="flex-start" gap={0}>
                  <Text fontSize="xl" fontWeight="bold" color={filters.quickFilter === 'COMPLETED_TODAY' ? 'white' : colors.textColor}>
                    {widget.completedToday}
                  </Text>
                  <Text fontSize="xs" color={filters.quickFilter === 'COMPLETED_TODAY' ? 'whiteAlpha.800' : colors.textColorSecondary}>
                    {t('alerts.completedToday', 'Completadas hoy')}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </HStack>
        )}
      </Flex>

      {/* Filters Panel */}
      <Box mb={4}>
        <AlertFilters
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          showAllOption={canViewAll}
          loading={loading}
        />
      </Box>

      {/* View Toggle and Actions */}
      <Flex justify="space-between" align="center" mb={4}>
        <HStack gap={2}>
          <HStack
            bg={colors.cardBg}
            p={1}
            borderRadius="md"
            borderWidth={1}
            borderColor={colors.borderColor}
          >
            <IconButton
              aria-label="List view"
              size="sm"
              variant={viewMode === 'list' ? 'solid' : 'ghost'}
              bg={viewMode === 'list' ? colors.primaryColor : 'transparent'}
              color={viewMode === 'list' ? 'white' : colors.textColor}
              onClick={() => setViewMode('list')}
              title={t('alerts.page.listView', 'Vista de lista')}
            >
              <FiList />
            </IconButton>
            <IconButton
              aria-label="Grouped view"
              size="sm"
              variant={viewMode === 'grouped' ? 'solid' : 'ghost'}
              bg={viewMode === 'grouped' ? colors.primaryColor : 'transparent'}
              color={viewMode === 'grouped' ? 'white' : colors.textColor}
              onClick={() => setViewMode('grouped')}
              title={t('alerts.page.groupedView', 'Vista agrupada por etiquetas')}
            >
              <FiFolder />
            </IconButton>
            <IconButton
              aria-label="Calendar view"
              size="sm"
              variant={viewMode === 'calendar' ? 'solid' : 'ghost'}
              bg={viewMode === 'calendar' ? colors.primaryColor : 'transparent'}
              color={viewMode === 'calendar' ? 'white' : colors.textColor}
              onClick={() => setViewMode('calendar')}
              title={t('alerts.page.calendarView', 'Vista de calendario')}
            >
              <FiGrid />
            </IconButton>
            <IconButton
              aria-label="Schedule view"
              size="sm"
              variant={viewMode === 'schedule' ? 'solid' : 'ghost'}
              bg={viewMode === 'schedule' ? colors.primaryColor : 'transparent'}
              color={viewMode === 'schedule' ? 'white' : colors.textColor}
              onClick={() => setViewMode('schedule')}
              title={t('alerts.page.scheduleView', 'Vista por etiquetas')}
            >
              <FiTag />
            </IconButton>
            <IconButton
              aria-label="Gantt view"
              size="sm"
              variant={viewMode === 'gantt' ? 'solid' : 'ghost'}
              bg={viewMode === 'gantt' ? colors.primaryColor : 'transparent'}
              color={viewMode === 'gantt' ? 'white' : colors.textColor}
              onClick={() => setViewMode('gantt')}
              title={t('alerts.page.ganttView', 'Diagrama de Gantt')}
            >
              <FiBarChart2 />
            </IconButton>
          </HStack>

          {viewMode === 'list' && (
            <Text fontSize="sm" color={colors.textColorSecondary}>
              {t('alerts.page.showing', 'Mostrando')} {alerts.length} {t('alerts.page.of', 'de')} {totalElements} {t('alerts.page.alerts', 'alertas')}
            </Text>
          )}

          {viewMode === 'calendar' && (
            <HStack gap={2}>
              <IconButton
                aria-label="Previous week"
                size="sm"
                variant="outline"
                borderColor={colors.borderColor}
                color={colors.textColor}
                onClick={() => navigateDate('prev')}
              >
                <FiChevronLeft />
              </IconButton>
              <Button
                size="sm"
                variant="outline"
                borderColor={colors.borderColor}
                color={colors.textColor}
                onClick={goToToday}
              >
                {t('alerts.today', 'Hoy')}
              </Button>
              <IconButton
                aria-label="Next week"
                size="sm"
                variant="outline"
                borderColor={colors.borderColor}
                color={colors.textColor}
                onClick={() => navigateDate('next')}
              >
                <FiChevronRight />
              </IconButton>
              <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                {selectedDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </HStack>
          )}

          {viewMode === 'grouped' && (
            <Text fontSize="sm" color={colors.textColorSecondary}>
              <FiFolder style={{ display: 'inline', marginRight: '4px' }} />
              {t('alerts.page.groupedDesc', 'Lista agrupada jerárquicamente por etiquetas')}
            </Text>
          )}

          {viewMode === 'schedule' && (
            <Text fontSize="sm" color={colors.textColorSecondary}>
              <FiTag style={{ display: 'inline', marginRight: '4px' }} />
              {t('alerts.page.scheduleDesc', 'Cronograma de seguimiento por etiquetas con % de avance')}
            </Text>
          )}

          {viewMode === 'gantt' && (
            <Text fontSize="sm" color={colors.textColorSecondary}>
              <FiBarChart2 style={{ display: 'inline', marginRight: '4px' }} />
              {t('alerts.page.ganttDesc', 'Diagrama de Gantt con orden de ejecución por fechas')}
            </Text>
          )}
        </HStack>

        <HStack gap={2}>
          <IconButton
            aria-label="Refresh"
            size="sm"
            variant="outline"
            borderColor={colors.borderColor}
            color={colors.textColor}
            onClick={() => viewMode === 'list' ? loadAlerts() : loadAgenda()}
            loading={loading}
          >
            <FiRefreshCw />
          </IconButton>
          <Button
            leftIcon={<FiPlus />}
            bg={colors.primaryColor}
            color="white"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            _hover={{ opacity: 0.8 }}
          >
            {t('alerts.page.newAlert', 'Nueva Alerta')}
          </Button>
        </HStack>
      </Flex>

      {/* Content */}
      {loading ? (
        <Flex justify="center" align="center" h="400px">
          <Spinner size="xl" color={colors.primaryColor} />
        </Flex>
      ) : viewMode === 'list' ? (
        /* List View */
        <Box>
          {alerts.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              py={20}
              bg={colors.cardBg}
              borderRadius="lg"
              borderWidth={1}
              borderColor={colors.borderColor}
            >
              <FiList size={48} color={colors.textColorSecondary} />
              <Text mt={4} fontSize="lg" color={colors.textColorSecondary}>
                {t('alerts.page.noAlerts', 'No se encontraron alertas')}
              </Text>
              <Text fontSize="sm" color={colors.textColorSecondary}>
                {t('alerts.page.tryAdjustingFilters', 'Intenta ajustar los filtros o crear una nueva alerta')}
              </Text>
              <Button
                mt={4}
                leftIcon={<FiPlus />}
                bg={colors.primaryColor}
                color="white"
                onClick={() => setIsCreateOpen(true)}
              >
                {t('alerts.page.createFirst', 'Crear primera alerta')}
              </Button>
            </Flex>
          ) : (
            <Box
              borderRadius="lg"
              borderWidth={1}
              borderColor={colors.borderColor}
              overflow="hidden"
              bg={colors.cardBg}
            >
              <Box overflowX="auto">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: colors.textColorSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('alerts.table.title', 'Título')}</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: colors.textColorSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', width: '90px' }}>{t('alerts.table.type', 'Tipo')}</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: colors.textColorSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>{t('alerts.table.priority', 'Prioridad')}</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: colors.textColorSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', width: '90px' }}>{t('alerts.table.date', 'Fecha')}</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: colors.textColorSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>{t('alerts.table.status', 'Estado')}</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: colors.textColorSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', width: '100px' }}>{t('alerts.table.assignedTo', 'Asignado')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert) => {
                      const priorityColors: Record<string, string> = { URGENT: 'red', HIGH: 'orange', NORMAL: 'blue', LOW: 'gray' };
                      const pColor = priorityColors[alert.priority] || 'gray';
                      const statusColors: Record<string, string> = { PENDING: 'yellow', IN_PROGRESS: 'blue', COMPLETED: 'green', DISMISSED: 'gray', RESCHEDULED: 'purple' };
                      const sColor = statusColors[alert.status] || 'gray';
                      const dateStr = alert.scheduledDate ? new Date(alert.scheduledDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '—';

                      return (
                        <tr
                          key={alert.alertId}
                          onClick={() => handleAlertClick(alert)}
                          style={{
                            cursor: 'pointer',
                            borderBottom: `1px solid ${colors.borderColor}`,
                            opacity: alert.status === 'COMPLETED' || alert.status === 'DISMISSED' ? 0.5 : 1,
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = colors.activeBg || 'rgba(0,0,0,0.03)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                        >
                          <td style={{ padding: '8px 12px' }}>
                            <Text fontSize="sm" fontWeight="500" color={colors.textColor} noOfLines={1}>
                              {alert.overdue && <Badge colorPalette="red" variant="subtle" fontSize="2xs" mr={1}>!</Badge>}
                              {alert.title}
                            </Text>
                            {alert.sourceReference && (
                              <Text fontSize="xs" color={colors.textColorSecondary} noOfLines={1}>
                                {alert.sourceReference}
                              </Text>
                            )}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <Text fontSize="xs" color={colors.textColorSecondary}>{alert.alertTypeLabel || alert.alertType}</Text>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <Badge colorPalette={pColor} variant="subtle" fontSize="2xs">{alert.priority}</Badge>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <Text fontSize="xs" color={alert.overdue ? 'red.500' : colors.textColorSecondary} fontWeight={alert.overdue ? '600' : '400'}>
                              {dateStr}
                            </Text>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <Badge colorPalette={sColor} variant="subtle" fontSize="2xs">{alert.status}</Badge>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <Text fontSize="xs" color={colors.textColorSecondary} noOfLines={1}>{alert.userName || alert.userId}</Text>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Flex justify="center" mt={6} gap={2}>
              <Button
                size="sm"
                variant="outline"
                borderColor={colors.borderColor}
                color={colors.textColor}
                onClick={() => handlePageChange(filters.page! - 1)}
                disabled={filters.page === 0}
              >
                {t('common.previous', 'Anterior')}
              </Button>
              <HStack gap={1}>
                {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                  const pageNum = Math.max(0, Math.min(filters.page! - 2 + idx, totalPages - 1));
                  return (
                    <Button
                      key={pageNum}
                      size="sm"
                      variant={pageNum === filters.page ? 'solid' : 'outline'}
                      bg={pageNum === filters.page ? colors.primaryColor : 'transparent'}
                      color={pageNum === filters.page ? 'white' : colors.textColor}
                      borderColor={colors.borderColor}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum + 1}
                    </Button>
                  );
                })}
              </HStack>
              <Button
                size="sm"
                variant="outline"
                borderColor={colors.borderColor}
                color={colors.textColor}
                onClick={() => handlePageChange(filters.page! + 1)}
                disabled={filters.page! >= totalPages - 1}
              >
                {t('common.next', 'Siguiente')}
              </Button>
            </Flex>
          )}
        </Box>
      ) : viewMode === 'grouped' ? (
        /* Grouped List View by Tags */
        <GroupedListView
          filters={filters}
          lang={lang}
          onAlertClick={handleAlertClick}
          onAlertUpdate={handleAlertUpdate}
        />
      ) : viewMode === 'schedule' ? (
        /* Schedule/Kanban View by Tags */
        <TagScheduleView
          filters={filters}
          lang={lang}
          onAlertClick={handleAlertClick}
          onAlertUpdate={handleAlertUpdate}
        />
      ) : viewMode === 'gantt' ? (
        /* Gantt Chart View */
        <GanttView
          filters={filters}
          lang={lang}
          onAlertClick={handleAlertClick}
        />
      ) : (
        /* Calendar View */
        <Box
          bg={colors.cardBg}
          borderRadius="lg"
          borderWidth={1}
          borderColor={colors.borderColor}
          overflow="hidden"
        >
          {/* Day Headers */}
          <Grid templateColumns="repeat(7, 1fr)" borderBottomWidth={1} borderColor={colors.borderColor}>
            {weekDays.map((day, idx) => {
              const dayAlerts = getAlertsForDate(day);
              const todayStyle = isToday(day);
              return (
                <GridItem
                  key={idx}
                  p={3}
                  textAlign="center"
                  bg={todayStyle ? colors.activeBg : 'transparent'}
                  borderRightWidth={idx < 6 ? 1 : 0}
                  borderColor={colors.borderColor}
                >
                  <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>
                    {dayNames[idx]}
                  </Text>
                  <Text
                    fontSize="xl"
                    fontWeight={todayStyle ? 'bold' : 'normal'}
                    color={todayStyle ? colors.primaryColor : colors.textColor}
                  >
                    {day.getDate()}
                  </Text>
                  {dayAlerts.length > 0 && (
                    <Badge
                      colorPalette={dayAlerts.some((a) => a.overdue) ? 'red' : 'blue'}
                      mt={1}
                      fontSize="xs"
                    >
                      {dayAlerts.length}
                    </Badge>
                  )}
                </GridItem>
              );
            })}
          </Grid>

          {/* Alerts Grid */}
          <Grid templateColumns="repeat(7, 1fr)" minH="500px">
            {weekDays.map((day, idx) => {
              const dayAlerts = getAlertsForDate(day);
              const todayStyle = isToday(day);
              return (
                <GridItem
                  key={idx}
                  p={2}
                  bg={todayStyle ? colors.activeBg : 'transparent'}
                  borderRightWidth={idx < 6 ? 1 : 0}
                  borderColor={colors.borderColor}
                  minH="500px"
                >
                  <VStack align="stretch" gap={2}>
                    {dayAlerts.map((alert) => (
                      <AlertCard
                        key={alert.alertId}
                        alert={alert}
                        compact
                        onClick={() => handleAlertClick(alert)}
                      />
                    ))}
                    {dayAlerts.length === 0 && (
                      <Text
                        fontSize="xs"
                        color={colors.textColorSecondary}
                        textAlign="center"
                        fontStyle="italic"
                        mt={4}
                      >
                        {t('alerts.noAlerts', 'Sin alertas')}
                      </Text>
                    )}
                  </VStack>
                </GridItem>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Modals */}
      {selectedAlert && (
        <AlertDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          alert={selectedAlert}
          onUpdate={handleAlertUpdate}
        />
      )}

      <AlertCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          loadAlerts();
          setIsCreateOpen(false);
        }}
        defaultDate={formatDate(selectedDate)}
      />
    </Box>
  );
};

export default AlertsPage;
