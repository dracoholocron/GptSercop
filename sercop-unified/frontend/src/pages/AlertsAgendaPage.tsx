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
} from '@chakra-ui/react';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiList,
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { getAgenda, getTodayWidget } from '../services/alertService';
import type { AgendaResponse, TodayAlertsWidgetResponse, AlertResponse } from '../services/alertService';
import { AlertCard } from '../components/alerts/AlertCard';
import { AlertDetailModal } from '../components/alerts/AlertDetailModal';
import { AlertCreateModal } from '../components/alerts/AlertCreateModal';

type ViewType = 'DAY' | 'WEEK' | 'MONTH';

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const parseDate = (dateStr: string): Date => {
  return new Date(dateStr + 'T00:00:00');
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

const getMonthDays = (date: Date): Date[][] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  // Start from first day of week before month starts
  const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDayOfWeek);

  let currentDate = new Date(startDate);

  while (currentDate <= lastDay || currentWeek.length > 0) {
    currentWeek.push(new Date(currentDate));

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
      if (currentDate > lastDay) break;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return weeks;
};

export const AlertsAgendaPage = () => {
  const { t, i18n } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const [viewType, setViewType] = useState<ViewType>('WEEK');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null);
  const [widget, setWidget] = useState<TodayAlertsWidgetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<AlertResponse | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const lang = i18n.language === 'en' ? 'en' : 'es';

  const loadAgenda = async () => {
    setLoading(true);
    try {
      const [agendaData, widgetData] = await Promise.all([
        getAgenda(formatDate(selectedDate), viewType, lang),
        getTodayWidget(lang),
      ]);
      setAgenda(agendaData);
      setWidget(widgetData);
    } catch (error) {
      console.error('Error loading agenda:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgenda();
  }, [selectedDate, viewType, lang]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewType === 'DAY') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewType === 'WEEK') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleAlertClick = (alert: AlertResponse) => {
    setSelectedAlert(alert);
    setIsDetailOpen(true);
  };

  const handleAlertUpdate = () => {
    loadAgenda();
    setIsDetailOpen(false);
  };

  const getDateTitle = (): string => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      year: 'numeric',
    };
    if (viewType === 'DAY') {
      options.day = 'numeric';
      options.weekday = 'long';
    }
    return selectedDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', options);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === selectedDate.getMonth();
  };

  const getAlertsForDate = (date: Date): AlertResponse[] => {
    if (!agenda?.alertsByDate) return [];
    const dateStr = formatDate(date);
    return agenda.alertsByDate[dateStr] || [];
  };

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const monthWeeks = useMemo(() => getMonthDays(selectedDate), [selectedDate]);

  const dayNames = lang === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <Box p={6} minH="100vh" bg={colors.bgColor}>
      {/* Header with Summary */}
      <Flex justify="space-between" align="flex-start" mb={6} flexWrap="wrap" gap={4}>
        <VStack align="flex-start" gap={1}>
          <HStack>
            <FiCalendar size={28} color={colors.primaryColor} />
            <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>
              {t('alerts.agenda.title', 'Agenda de Seguimiento')}
            </Text>
          </HStack>
          <Text fontSize="sm" color={colors.textColorSecondary}>
            {t('alerts.agenda.subtitle', 'Gestiona tus alertas y actividades programadas')}
          </Text>
        </VStack>

        {/* Quick Stats */}
        {widget && (
          <HStack gap={4} flexWrap="wrap">
            <Box
              bg={widget.hasUrgent ? 'red.500' : colors.cardBg}
              px={4}
              py={2}
              borderRadius="lg"
              borderWidth={1}
              borderColor={widget.hasUrgent ? 'red.500' : colors.borderColor}
            >
              <HStack>
                <FiAlertCircle color={widget.hasUrgent ? 'white' : colors.textColorSecondary} />
                <VStack align="flex-start" gap={0}>
                  <Text
                    fontSize="lg"
                    fontWeight="bold"
                    color={widget.hasUrgent ? 'white' : colors.textColor}
                  >
                    {widget.overdueTotal}
                  </Text>
                  <Text
                    fontSize="xs"
                    color={widget.hasUrgent ? 'whiteAlpha.800' : colors.textColorSecondary}
                  >
                    {t('alerts.overdue', 'Vencidas')}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box
              bg={colors.cardBg}
              px={4}
              py={2}
              borderRadius="lg"
              borderWidth={1}
              borderColor={colors.borderColor}
            >
              <HStack>
                <FiClock color={colors.primaryColor} />
                <VStack align="flex-start" gap={0}>
                  <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
                    {widget.pendingToday}
                  </Text>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    {t('alerts.today', 'Hoy')}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box
              bg={colors.cardBg}
              px={4}
              py={2}
              borderRadius="lg"
              borderWidth={1}
              borderColor={colors.borderColor}
            >
              <HStack>
                <FiCheckCircle color="green" />
                <VStack align="flex-start" gap={0}>
                  <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
                    {widget.completedToday}
                  </Text>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    {t('alerts.completed', 'Completadas')}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </HStack>
        )}
      </Flex>

      {/* Navigation and Controls */}
      <Flex
        justify="space-between"
        align="center"
        mb={4}
        bg={colors.cardBg}
        p={4}
        borderRadius="lg"
        borderWidth={1}
        borderColor={colors.borderColor}
      >
        <HStack gap={2}>
          <IconButton
            aria-label="Previous"
            onClick={() => navigateDate('prev')}
            variant="outline"
            borderColor={colors.borderColor}
            color={colors.textColor}
            size="sm"
          >
            <FiChevronLeft />
          </IconButton>
          <Button
            variant="outline"
            borderColor={colors.borderColor}
            color={colors.textColor}
            size="sm"
            onClick={goToToday}
          >
            {t('alerts.agenda.today', 'Hoy')}
          </Button>
          <IconButton
            aria-label="Next"
            onClick={() => navigateDate('next')}
            variant="outline"
            borderColor={colors.borderColor}
            color={colors.textColor}
            size="sm"
          >
            <FiChevronRight />
          </IconButton>
          <Text fontSize="lg" fontWeight="semibold" color={colors.textColor} ml={4}>
            {getDateTitle()}
          </Text>
        </HStack>

        <HStack gap={2}>
          <HStack
            bg={colors.bgColor}
            p={1}
            borderRadius="md"
            borderWidth={1}
            borderColor={colors.borderColor}
          >
            {(['DAY', 'WEEK', 'MONTH'] as ViewType[]).map((vt) => (
              <Button
                key={vt}
                size="sm"
                variant={viewType === vt ? 'solid' : 'ghost'}
                bg={viewType === vt ? colors.primaryColor : 'transparent'}
                color={viewType === vt ? 'white' : colors.textColor}
                onClick={() => setViewType(vt)}
                _hover={{
                  bg: viewType === vt ? colors.primaryColor : colors.activeBg,
                }}
              >
                {vt === 'DAY'
                  ? t('alerts.agenda.day', 'Día')
                  : vt === 'WEEK'
                    ? t('alerts.agenda.week', 'Semana')
                    : t('alerts.agenda.month', 'Mes')}
              </Button>
            ))}
          </HStack>

          <Button
            leftIcon={<FiPlus />}
            bg={colors.primaryColor}
            color="white"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            _hover={{ opacity: 0.8 }}
          >
            {t('alerts.agenda.newAlert', 'Nueva Alerta')}
          </Button>
        </HStack>
      </Flex>

      {/* Calendar View */}
      {loading ? (
        <Flex justify="center" align="center" h="400px">
          <Spinner size="xl" color={colors.primaryColor} />
        </Flex>
      ) : (
        <Box
          bg={colors.cardBg}
          borderRadius="lg"
          borderWidth={1}
          borderColor={colors.borderColor}
          overflow="hidden"
        >
          {/* Week View */}
          {viewType === 'WEEK' && (
            <Box>
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
                          colorScheme={dayAlerts.some((a) => a.overdue) ? 'red' : 'blue'}
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
                            {t('alerts.agenda.noAlerts', 'Sin alertas')}
                          </Text>
                        )}
                      </VStack>
                    </GridItem>
                  );
                })}
              </Grid>
            </Box>
          )}

          {/* Day View */}
          {viewType === 'DAY' && (
            <Box p={4}>
              <VStack align="stretch" gap={3}>
                {getAlertsForDate(selectedDate).length > 0 ? (
                  getAlertsForDate(selectedDate).map((alert) => (
                    <AlertCard
                      key={alert.alertId}
                      alert={alert}
                      onClick={() => handleAlertClick(alert)}
                    />
                  ))
                ) : (
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    py={20}
                    color={colors.textColorSecondary}
                  >
                    <FiList size={48} />
                    <Text mt={4} fontSize="lg">
                      {t('alerts.agenda.noAlertsForDay', 'No hay alertas programadas para este día')}
                    </Text>
                    <Button
                      mt={4}
                      leftIcon={<FiPlus />}
                      bg={colors.primaryColor}
                      color="white"
                      onClick={() => setIsCreateOpen(true)}
                    >
                      {t('alerts.agenda.createFirst', 'Crear primera alerta')}
                    </Button>
                  </Flex>
                )}
              </VStack>
            </Box>
          )}

          {/* Month View */}
          {viewType === 'MONTH' && (
            <Box>
              {/* Day Headers */}
              <Grid
                templateColumns="repeat(7, 1fr)"
                borderBottomWidth={1}
                borderColor={colors.borderColor}
                bg={colors.bgColor}
              >
                {dayNames.map((name, idx) => (
                  <GridItem key={idx} p={2} textAlign="center">
                    <Text fontSize="sm" fontWeight="semibold" color={colors.textColorSecondary}>
                      {name}
                    </Text>
                  </GridItem>
                ))}
              </Grid>

              {/* Calendar Grid */}
              {monthWeeks.map((week, weekIdx) => (
                <Grid
                  key={weekIdx}
                  templateColumns="repeat(7, 1fr)"
                  borderBottomWidth={weekIdx < monthWeeks.length - 1 ? 1 : 0}
                  borderColor={colors.borderColor}
                >
                  {week.map((day, dayIdx) => {
                    const dayAlerts = getAlertsForDate(day);
                    const todayStyle = isToday(day);
                    const currentMonthStyle = isCurrentMonth(day);
                    const hasOverdue = dayAlerts.some((a) => a.overdue);
                    const hasUrgent = dayAlerts.some((a) => a.priority === 'URGENT');

                    return (
                      <GridItem
                        key={dayIdx}
                        p={2}
                        minH="100px"
                        bg={todayStyle ? colors.activeBg : 'transparent'}
                        borderRightWidth={dayIdx < 6 ? 1 : 0}
                        borderColor={colors.borderColor}
                        opacity={currentMonthStyle ? 1 : 0.4}
                        cursor="pointer"
                        _hover={{ bg: colors.activeBg }}
                        onClick={() => {
                          setSelectedDate(day);
                          setViewType('DAY');
                        }}
                      >
                        <Flex justify="space-between" align="flex-start">
                          <Text
                            fontSize="sm"
                            fontWeight={todayStyle ? 'bold' : 'normal'}
                            color={todayStyle ? colors.primaryColor : colors.textColor}
                          >
                            {day.getDate()}
                          </Text>
                          {dayAlerts.length > 0 && (
                            <Badge
                              colorScheme={hasOverdue ? 'red' : hasUrgent ? 'orange' : 'blue'}
                              fontSize="xs"
                            >
                              {dayAlerts.length}
                            </Badge>
                          )}
                        </Flex>
                        <VStack align="stretch" gap={1} mt={1}>
                          {dayAlerts.slice(0, 2).map((alert) => (
                            <Box
                              key={alert.alertId}
                              fontSize="xs"
                              p={1}
                              borderRadius="sm"
                              bg={
                                alert.overdue
                                  ? 'red.100'
                                  : alert.priority === 'URGENT'
                                    ? 'orange.100'
                                    : 'blue.100'
                              }
                              color={
                                alert.overdue
                                  ? 'red.700'
                                  : alert.priority === 'URGENT'
                                    ? 'orange.700'
                                    : 'blue.700'
                              }
                              isTruncated
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAlertClick(alert);
                              }}
                            >
                              {alert.title}
                            </Box>
                          ))}
                          {dayAlerts.length > 2 && (
                            <Text fontSize="xs" color={colors.textColorSecondary}>
                              +{dayAlerts.length - 2} {t('alerts.more', 'más')}
                            </Text>
                          )}
                        </VStack>
                      </GridItem>
                    );
                  })}
                </Grid>
              ))}
            </Box>
          )}
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
        onCreated={loadAgenda}
        defaultDate={formatDate(selectedDate)}
      />
    </Box>
  );
};

export default AlertsAgendaPage;
