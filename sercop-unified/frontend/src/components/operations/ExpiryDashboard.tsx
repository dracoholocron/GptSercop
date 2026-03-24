/**
 * ExpiryDashboard - Visual dashboard highlighting expiry dates
 *
 * This component transforms the workbox experience by making expiry dates
 * the protagonist, providing visual urgency indicators, countdown timers,
 * and intelligent grouping of operations by expiry proximity.
 */
import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  SimpleGrid,
  IconButton,
  Input,
  Spinner,
  Card,
  Progress,
  Flex,
  Separator,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import {
  FiAlertTriangle,
  FiClock,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiMessageSquare,
  FiActivity,
  FiFileText,
  FiChevronRight,
  FiChevronLeft,
  FiFilter,
  FiTrendingUp,
  FiTrendingDown,
  FiEdit2,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import type { Operation, ProductType } from '../../types/operations';
import { operationsApi } from '../../services/operationsApi';
import { operationLockService, type OperationLock } from '../../services/operationLockService';
import { toaster } from '../ui/toaster';
import { AlertBadge } from './AlertBadge';
import { OperationLockIndicator } from '../locks/OperationLockIndicator';
import { ExpandableStatCard } from './ExpandableStatCard';
import { productTypeConfigService, type ProductTypeRoutingMap } from '../../services/productTypeConfigService';
import { useAuth } from '../../contexts/AuthContext';

interface ExpiryDashboardProps {
  productType: ProductType;
  onViewDetails: (operation: Operation) => void;
  onViewMessages: (operation: Operation) => void;
  onViewEvents: (operation: Operation) => void;
  onExecuteEvent: (operation: Operation) => void;
}

interface ExpiryGroup {
  label: string;
  labelKey: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  operations: Operation[];
  daysRange: [number, number];
}

// Calculate days until expiry
const getDaysUntilExpiry = (expiryDate?: string): number => {
  if (!expiryDate) return Infinity;

  // Parse dates as local timezone to avoid UTC offset issues
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse expiry date as local date (YYYY-MM-DD format)
  const [year, month, day] = expiryDate.split('-').map(Number);
  const expiry = new Date(year, month - 1, day); // month is 0-indexed
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

// Get urgency color based on days
const getUrgencyStyle = (days: number) => {
  if (days < 0) return { color: 'red.600', bg: 'red.50', border: 'red.200', pulse: true };
  if (days === 0) return { color: 'red.600', bg: 'red.100', border: 'red.300', pulse: true };
  if (days <= 3) return { color: 'orange.600', bg: 'orange.50', border: 'orange.200', pulse: true };
  if (days <= 7) return { color: 'yellow.600', bg: 'yellow.50', border: 'yellow.200', pulse: false };
  if (days <= 15) return { color: 'blue.600', bg: 'blue.50', border: 'blue.200', pulse: false };
  if (days <= 30) return { color: 'cyan.600', bg: 'cyan.50', border: 'cyan.200', pulse: false };
  return { color: 'green.600', bg: 'green.50', border: 'green.200', pulse: false };
};

export const ExpiryDashboard: React.FC<ExpiryDashboardProps> = ({
  productType,
  onViewDetails,
  onViewMessages,
  onViewEvents,
  onExecuteEvent,
}) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50; // Show 50 operations per page
  const [routingMap, setRoutingMap] = useState<ProductTypeRoutingMap>({});
  const [lockStatuses, setLockStatuses] = useState<Record<string, OperationLock>>({});

  // Load lock statuses when operations change
  useEffect(() => {
    if (operations.length > 0) {
      loadLockStatuses();
      // Refresh lock statuses every 30 seconds
      const interval = setInterval(loadLockStatuses, 30000);
      return () => clearInterval(interval);
    }
  }, [operations]);

  const loadLockStatuses = async () => {
    try {
      // Only load lock statuses for currently visible operations (max 100)
      // to avoid URL too long errors
      const visibleOperationIds = operations
        .slice(0, Math.min(operations.length, 100))
        .map(op => op.operationId);

      if (visibleOperationIds.length === 0) return;

      const statuses = await operationLockService.getBulkLockStatus(visibleOperationIds);
      setLockStatuses(statuses);
    } catch (error) {
      console.error('Error loading lock statuses:', error);
    }
  };

  // Format countdown display with i18n
  const formatCountdown = (days: number): string => {
    if (!isFinite(days)) return t('operations.expiry.noExpiry', 'Sin vencimiento');
    if (days < 0) return t('operations.expiry.daysExpired', { days: Math.abs(days) });
    if (days === 0) return t('operations.expiry.today');
    if (days < 7) return t('operations.expiry.daysLeft', { days });
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return t('operations.expiry.weeksLeft', { weeks });
    }
    const months = Math.floor(days / 30);
    return t('operations.expiry.monthsLeft', { months });
  };

  useEffect(() => {
    loadOperations();
    loadRoutingMap();
  }, [productType]);

  const loadRoutingMap = async () => {
    try {
      const map = await productTypeConfigService.getRoutingMap();
      setRoutingMap(map);
    } catch (error) {
      console.error('Error loading routing map:', error);
    }
  };

  const loadOperations = async () => {
    setLoading(true);
    try {
      const data = await operationsApi.getByProductType(productType);
      setOperations(data);
    } catch (error) {
      toaster.create({
        title: t('common.error'),
        description: String(error),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Get unique currencies from operations for filter dropdown
  const availableCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    operations.forEach(op => {
      if (op.currency) currencies.add(op.currency);
    });
    return Array.from(currencies).sort();
  }, [operations]);

  // Filter operations
  const filteredOperations = useMemo(() => {
    return operations.filter((op) => {
      // 1. Text search filter
      const matchesText =
        !filterText ||
        op.reference.toLowerCase().includes(filterText.toLowerCase()) ||
        op.applicantName?.toLowerCase().includes(filterText.toLowerCase()) ||
        op.beneficiaryName?.toLowerCase().includes(filterText.toLowerCase());

      // 2. Stage filter
      const matchesStage = !filterStage || op.stage === filterStage;

      // 3. Status filter - when user selects CLOSED, show only CLOSED operations
      //    When no status filter, exclude CLOSED by default (they're historical)
      let matchesStatus = true;
      if (filterStatus) {
        matchesStatus = op.status === filterStatus;
      } else {
        // Default: exclude CLOSED operations unless explicitly filtered
        matchesStatus = op.status !== 'CLOSED';
      }

      // 4. Currency filter
      const matchesCurrency = !filterCurrency || op.currency === filterCurrency;

      // 5. Urgency filter - only apply to non-CLOSED operations
      let matchesUrgency = true;
      if (filterUrgency && op.status !== 'CLOSED') {
        const days = getDaysUntilExpiry(op.expiryDate);
        switch (filterUrgency) {
          case 'EXPIRED':
            matchesUrgency = days < 0;
            break;
          case 'TODAY':
            matchesUrgency = days === 0;
            break;
          case 'CRITICAL':
            matchesUrgency = days >= 0 && days <= 3;
            break;
          case 'WEEK':
            matchesUrgency = days >= 0 && days <= 7;
            break;
          case 'MONTH':
            matchesUrgency = days >= 0 && days <= 30;
            break;
        }
      }

      return matchesText && matchesStage && matchesStatus && matchesCurrency && matchesUrgency;
    });
  }, [operations, filterText, filterStage, filterStatus, filterUrgency, filterCurrency]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, filterStage, filterStatus, filterUrgency, filterCurrency]);

  // Paginate operations
  const totalPages = Math.ceil(filteredOperations.length / pageSize);
  const paginatedOperations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredOperations.slice(start, end);
  }, [filteredOperations, currentPage, pageSize]);

  // Group operations by expiry urgency
  const expiryGroups: ExpiryGroup[] = useMemo(() => {
    const groups: ExpiryGroup[] = [
      {
        label: t('operations.expiry.expired'),
        labelKey: 'operations.expiry.expired',
        color: 'red.600',
        bgColor: 'red.50',
        borderColor: 'red.300',
        icon: <FiAlertTriangle />,
        operations: [],
        daysRange: [-Infinity, -1],
      },
      {
        label: t('operations.expiry.today'),
        labelKey: 'operations.expiry.today',
        color: 'red.500',
        bgColor: 'red.100',
        borderColor: 'red.400',
        icon: <FiAlertCircle />,
        operations: [],
        daysRange: [0, 0],
      },
      {
        label: t('operations.expiry.critical'),
        labelKey: 'operations.expiry.critical',
        color: 'orange.600',
        bgColor: 'orange.50',
        borderColor: 'orange.300',
        icon: <FiClock />,
        operations: [],
        daysRange: [1, 3],
      },
      {
        label: t('operations.expiry.thisWeek'),
        labelKey: 'operations.expiry.thisWeek',
        color: 'yellow.600',
        bgColor: 'yellow.50',
        borderColor: 'yellow.300',
        icon: <FiCalendar />,
        operations: [],
        daysRange: [4, 7],
      },
      {
        label: t('operations.expiry.twoWeeks'),
        labelKey: 'operations.expiry.twoWeeks',
        color: 'blue.500',
        bgColor: 'blue.50',
        borderColor: 'blue.200',
        icon: <FiCalendar />,
        operations: [],
        daysRange: [8, 14],
      },
      {
        label: t('operations.expiry.thisMonth'),
        labelKey: 'operations.expiry.thisMonth',
        color: 'cyan.600',
        bgColor: 'cyan.50',
        borderColor: 'cyan.200',
        icon: <FiCalendar />,
        operations: [],
        daysRange: [15, 30],
      },
      {
        label: t('operations.expiry.safe'),
        labelKey: 'operations.expiry.safe',
        color: 'green.600',
        bgColor: 'green.50',
        borderColor: 'green.200',
        icon: <FiCheckCircle />,
        operations: [],
        daysRange: [31, 9999], // Use large number instead of Infinity
      },
      {
        label: t('operations.expiry.noDate'),
        labelKey: 'operations.expiry.noDate',
        color: 'gray.500',
        bgColor: 'gray.50',
        borderColor: 'gray.200',
        icon: <FiCalendar />,
        operations: [],
        daysRange: [10000, Infinity], // For operations without expiry date
      },
    ];

    paginatedOperations.forEach((op) => {
      const days = getDaysUntilExpiry(op.expiryDate);
      // Handle operations without expiry date
      if (!op.expiryDate) {
        groups[groups.length - 1].operations.push(op); // Add to "Sin fecha" group
      } else {
        const group = groups.find(
          (g) => days >= g.daysRange[0] && days <= g.daysRange[1]
        );
        if (group) {
          group.operations.push(op);
        }
      }
    });

    // Sort operations within each group by days until expiry
    groups.forEach((g) => {
      g.operations.sort((a, b) => {
        const daysA = getDaysUntilExpiry(a.expiryDate);
        const daysB = getDaysUntilExpiry(b.expiryDate);
        return daysA - daysB;
      });
    });

    return groups;
  }, [paginatedOperations, t]);

  // Statistics
  const stats = useMemo(() => {
    const expired = expiryGroups[0].operations.length;
    const today = expiryGroups[1].operations.length;
    const critical = expiryGroups[2].operations.length;
    const thisWeek = expiryGroups[3].operations.length;
    const noDate = expiryGroups[expiryGroups.length - 1].operations.length; // "Sin fecha" group
    const urgent = expired + today + critical;
    const total = filteredOperations.length;

    // Count operations with alerts
    const withAlerts = filteredOperations.filter(op => op.hasAlerts && op.alertCount && op.alertCount > 0).length;
    const totalAlerts = filteredOperations.reduce((sum, op) => sum + (op.alertCount || 0), 0);

    // Verify total matches sum of all groups
    const groupedTotal = expiryGroups.reduce((sum, g) => sum + g.operations.length, 0);

    // Group amounts by currency
    const amountsByCurrency: Record<string, number> = {};
    filteredOperations.forEach((op) => {
      if (op.amount && op.currency) {
        amountsByCurrency[op.currency] = (amountsByCurrency[op.currency] || 0) + op.amount;
      }
    });

    return { expired, today, critical, thisWeek, noDate, urgent, total, groupedTotal, amountsByCurrency, withAlerts, totalAlerts };
  }, [expiryGroups, filteredOperations]);

  // Memoized operations by category for expandable cards
  const operationsByCategory = useMemo(() => {
    const urgentOps = [
      ...expiryGroups[0].operations, // expired
      ...expiryGroups[1].operations, // today
      ...expiryGroups[2].operations, // critical (1-3 days)
    ];

    const expiredOps = expiryGroups[0].operations;
    const todayOps = expiryGroups[1].operations;
    const thisWeekOps = [...expiryGroups[2].operations, ...expiryGroups[3].operations];
    const alertOps = filteredOperations.filter(op => op.hasAlerts && op.alertCount && op.alertCount > 0);

    return {
      urgent: urgentOps,
      expired: expiredOps,
      today: todayOps,
      thisWeek: thisWeekOps,
      alerts: alertOps,
      all: filteredOperations,
    };
  }, [expiryGroups, filteredOperations]);

  // Group amounts by currency for a list of operations
  const getAmountsByCurrency = (ops: Operation[]): Record<string, number> => {
    const amounts: Record<string, number> = {};
    ops.forEach((op) => {
      if (op.amount && op.currency) {
        amounts[op.currency] = (amounts[op.currency] || 0) + op.amount;
      }
    });
    return amounts;
  };

  // Format amounts by currency as a string
  const formatAmountsByCurrency = (amounts: Record<string, number>): string => {
    const entries = Object.entries(amounts);
    if (entries.length === 0) return '-';
    return entries
      .sort((a, b) => b[1] - a[1]) // Sort by amount descending
      .map(([currency, amount]) => formatAmount(amount, currency))
      .join(' · ');
  };

  // Navegar al formulario en modo consulta (solo lectura)
  // Usa la configuración centralizada de product_type_config
  const handleViewForm = (operation: Operation) => {
    const routing = routingMap[operation.productType];

    if (routing) {
      navigate(`${routing.wizardUrl}?operation=${operation.operationId}&mode=view`);
    } else {
      console.warn(`No routing config found for product type: ${operation.productType}`);
      navigate(`/lc-imports/issuance-wizard?operation=${operation.operationId}&mode=view`);
    }
  };

  const handleEditFields = (operation: Operation) => {
    const routing = routingMap[operation.productType];
    if (routing) {
      navigate(`${routing.wizardUrl}?operation=${operation.operationId}&mode=edit-fields`);
    }
  };

  const formatAmount = (amount?: number, currency?: string): string => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date?: string): string => {
    if (!date) return '-';
    // Parse as local date to avoid UTC offset issues
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color={colors.primaryColor} />
        <Text mt={4} color={colors.textColor}>{t('common.loading')}</Text>
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header Statistics Cards - Expandable */}
      <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} gap={4}>
        {/* Urgent Alert Card */}
        <ExpandableStatCard
          title={t('operations.expiry.requireAttention')}
          count={stats.urgent}
          subtitle={`${t('operations.expiry.expiredCount', { count: stats.expired })} · ${t('operations.expiry.todayCount', { count: stats.today })} · ${t('operations.expiry.criticalCount', { count: stats.critical })}`}
          icon={<FiAlertTriangle size={20} />}
          isGradient
          gradientColors="linear-gradient(135deg, #FF6B6B 0%, #EE5A24 100%)"
          textColor="white"
          operations={operationsByCategory.urgent}
          onViewDetails={onViewDetails}
          onViewMessages={onViewMessages}
          onExecuteEvent={onExecuteEvent}
          amountsByCurrency={getAmountsByCurrency(operationsByCategory.urgent)}
        />

        {/* Expired Card */}
        <ExpandableStatCard
          title={t('operations.expiry.expired')}
          count={stats.expired}
          icon={<FiAlertTriangle size={16} />}
          bgColor={stats.expired > 0 ? 'red.500' : undefined}
          textColor={stats.expired > 0 ? 'white' : colors.textColor}
          borderColor={stats.expired > 0 ? 'red.600' : colors.borderColor}
          operations={operationsByCategory.expired}
          onViewDetails={onViewDetails}
          onViewMessages={onViewMessages}
          onExecuteEvent={onExecuteEvent}
          amountsByCurrency={getAmountsByCurrency(operationsByCategory.expired)}
        />

        {/* Today Card */}
        <ExpandableStatCard
          title={t('operations.expiry.today')}
          count={stats.today}
          icon={<FiClock size={16} />}
          bgColor={stats.today > 0 ? 'orange.500' : undefined}
          textColor={stats.today > 0 ? 'white' : colors.textColor}
          borderColor={stats.today > 0 ? 'orange.600' : colors.borderColor}
          operations={operationsByCategory.today}
          onViewDetails={onViewDetails}
          onViewMessages={onViewMessages}
          onExecuteEvent={onExecuteEvent}
          amountsByCurrency={getAmountsByCurrency(operationsByCategory.today)}
        />

        {/* This Week Card */}
        <ExpandableStatCard
          title={t('operations.expiry.thisWeek')}
          count={stats.thisWeek + stats.critical}
          icon={<FiCalendar size={16} />}
          textColor={colors.textColor}
          borderColor={colors.borderColor}
          operations={operationsByCategory.thisWeek}
          onViewDetails={onViewDetails}
          onViewMessages={onViewMessages}
          onExecuteEvent={onExecuteEvent}
          amountsByCurrency={getAmountsByCurrency(operationsByCategory.thisWeek)}
        />

        {/* Alerts Card */}
        <ExpandableStatCard
          title={t('operations.alerts', 'Alertas')}
          count={stats.withAlerts}
          subtitle={stats.totalAlerts > 0 ? `${stats.totalAlerts} ${t('operations.totalAlerts', 'Total Alerts').toLowerCase()}` : undefined}
          icon={<FiAlertCircle size={16} />}
          bgColor={stats.withAlerts > 0 ? 'red.500' : undefined}
          textColor={stats.withAlerts > 0 ? 'white' : colors.textColor}
          borderColor={stats.withAlerts > 0 ? 'red.600' : colors.borderColor}
          operations={operationsByCategory.alerts}
          onViewDetails={onViewDetails}
          onViewMessages={onViewMessages}
          onExecuteEvent={onExecuteEvent}
          amountsByCurrency={getAmountsByCurrency(operationsByCategory.alerts)}
        />

        {/* Total Card */}
        <ExpandableStatCard
          title={t('operations.expiry.totalLCs')}
          count={stats.total}
          icon={<FiFileText size={16} />}
          textColor={colors.textColor}
          borderColor={colors.borderColor}
          operations={operationsByCategory.all}
          onViewDetails={onViewDetails}
          onViewMessages={onViewMessages}
          onExecuteEvent={onExecuteEvent}
          amountsByCurrency={stats.amountsByCurrency}
        />

        {/* Amount Card - by currency */}
        <ExpandableStatCard
          title={t('operations.expiry.amountsByCurrency')}
          count={Object.keys(stats.amountsByCurrency).length}
          subtitle={t('operations.expiry.currencies', 'monedas')}
          icon={<FiTrendingUp size={16} />}
          isGradient
          gradientColors="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          textColor="white"
          operations={operationsByCategory.all}
          onViewDetails={onViewDetails}
          onViewMessages={onViewMessages}
          onExecuteEvent={onExecuteEvent}
          amountsByCurrency={stats.amountsByCurrency}
        />
      </SimpleGrid>

      {/* Filters Row */}
      <Card.Root bg={colors.cardBg} borderWidth="1px" borderColor={colors.borderColor} shadow="sm">
        <Card.Body p={{ base: 3, md: 4 }}>
          <VStack gap={3} align="stretch">
            {/* Search Input - full width on mobile */}
            <Input
              placeholder={t('operations.expiry.searchPlaceholder')}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              size="sm"
              bg={colors.bgColor}
              borderColor={colors.borderColor}
            />

            {/* Filters Row */}
            <Flex gap={2} flexWrap="wrap" align="center">
              <HStack display={{ base: 'none', md: 'flex' }}>
                <FiFilter color={colors.textColor} />
                <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>{t('operations.expiry.filters')}:</Text>
              </HStack>
              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.borderColor}`,
                  background: colors.bgColor,
                  color: colors.textColor,
                  fontSize: '14px',
                  flex: '1',
                  minWidth: '100px',
                }}
              >
                <option value="">{t('operations.expiry.urgency')}</option>
                <option value="EXPIRED">{t('operations.expiry.expired')}</option>
                <option value="TODAY">{t('operations.expiry.today')}</option>
                <option value="CRITICAL">{t('operations.expiry.critical')}</option>
                <option value="WEEK">{t('operations.expiry.thisWeek')}</option>
                <option value="MONTH">{t('operations.expiry.thisMonth')}</option>
              </select>
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.borderColor}`,
                  background: colors.bgColor,
                  color: colors.textColor,
                  fontSize: '14px',
                  flex: '1',
                  minWidth: '100px',
                }}
              >
                <option value="">{t('operations.stage')}</option>
                <option value="ISSUED">{t('operations.stages.ISSUED')}</option>
                <option value="ADVISED">{t('operations.stages.ADVISED')}</option>
                <option value="CONFIRMED">{t('operations.stages.CONFIRMED')}</option>
                <option value="AMENDED">{t('operations.stages.AMENDED')}</option>
                <option value="UTILIZED">{t('operations.stages.UTILIZED')}</option>
                <option value="CANCELLED">{t('operations.stages.CANCELLED')}</option>
                <option value="EXPIRED">{t('operations.stages.EXPIRED')}</option>
                <option value="CLOSED">{t('operations.stages.CLOSED')}</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.borderColor}`,
                  background: colors.bgColor,
                  color: colors.textColor,
                  fontSize: '14px',
                  flex: '1',
                  minWidth: '100px',
                }}
              >
                <option value="">{t('operations.status')}</option>
                <option value="ACTIVE">{t('operations.statuses.ACTIVE')}</option>
                <option value="PENDING_RESPONSE">{t('operations.statuses.PENDING_RESPONSE')}</option>
                <option value="PENDING_DOCUMENTS">{t('operations.statuses.PENDING_DOCUMENTS')}</option>
                <option value="ON_HOLD">{t('operations.statuses.ON_HOLD')}</option>
                <option value="COMPLETED">{t('operations.statuses.COMPLETED')}</option>
                <option value="CANCELLED">{t('operations.statuses.CANCELLED')}</option>
                <option value="CLOSED">{t('operations.statuses.CLOSED')}</option>
              </select>
              <select
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.borderColor}`,
                  background: colors.bgColor,
                  color: colors.textColor,
                  fontSize: '14px',
                  flex: '1',
                  minWidth: '80px',
                }}
              >
                <option value="">{t('operations.currency', 'Moneda')}</option>
                {availableCurrencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </Flex>

            {/* Results count and pagination */}
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
              <Text fontSize="sm" color={colors.textColor}>
                {t('operations.expiry.showing', { count: filteredOperations.length, total: operations.length })}
              </Text>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <HStack gap={2}>
                  <IconButton
                    aria-label="Previous page"
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <FiChevronLeft />
                  </IconButton>
                  <Text fontSize="sm" color={colors.textColor} fontWeight="medium">
                    {t('common.pagination', 'Página {{current}} de {{total}}', { current: currentPage, total: totalPages })}
                  </Text>
                  <IconButton
                    aria-label="Next page"
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <FiChevronRight />
                  </IconButton>
                </HStack>
              )}
            </Flex>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Timeline View - Operations grouped by expiry */}
      <VStack gap={4} align="stretch">
        {expiryGroups.map((group) => {
          if (group.operations.length === 0) return null;

          return (
            <Card.Root
              key={group.label}
              bg={colors.cardBg}
              borderWidth="2px"
              borderColor={group.borderColor}
              borderRadius="xl"
              overflow="hidden"
              shadow="md"
            >
              {/* Group Header */}
              <Box
                bg={group.bgColor}
                px={5}
                py={3}
                borderBottomWidth="1px"
                borderColor={group.borderColor}
              >
                <HStack justify="space-between">
                  <HStack gap={3}>
                    <Box color={group.color} fontSize="xl">
                      {group.icon}
                    </Box>
                    <Heading size="md" color={group.color}>
                      {group.label}
                    </Heading>
                    <Badge
                      colorPalette={group.color.split('.')[0]}
                      variant="solid"
                      borderRadius="full"
                      px={3}
                      fontSize="sm"
                    >
                      {group.operations.length}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color={group.color} fontWeight="medium">
                    {formatAmountsByCurrency(getAmountsByCurrency(group.operations))}
                  </Text>
                </HStack>
              </Box>

              {/* Operations List */}
              <Card.Body p={0}>
                <VStack gap={0} align="stretch" divideY="1px" divideColor={colors.borderColor}>
                  {group.operations.map((op) => {
                    const days = getDaysUntilExpiry(op.expiryDate);
                    const urgency = getUrgencyStyle(days);

                    return (
                      <Box
                        key={op.id}
                        px={{ base: 3, md: 5 }}
                        py={{ base: 3, md: 4 }}
                        _hover={{ bg: colors.hoverBg }}
                        transition="background 0.2s"
                      >
                        {/* Mobile Layout */}
                        <Box display={{ base: 'block', lg: 'none' }}>
                          <VStack align="stretch" gap={3}>
                            {/* Top Row: Reference + Amount */}
                            <Flex justify="space-between" align="start" gap={2}>
                              <VStack align="start" gap={1} flex={1} minW={0}>
                                <HStack flexWrap="wrap" gap={1}>
                                  <Text fontWeight="bold" color={colors.textColor} fontSize="sm" isTruncated maxW="150px">
                                    {op.reference}
                                  </Text>
                                  <OperationLockIndicator lock={lockStatuses[op.operationId]} size="xs" />
                                  <Badge size="sm" colorPalette="purple">
                                    {op.messageType}
                                  </Badge>
                                  {op.hasAlerts && op.alertCount && op.alertCount > 0 && (
                                    <AlertBadge operationId={op.operationId} alertCount={op.alertCount} />
                                  )}
                                </HStack>
                                <Text fontSize="xs" color={colors.textColor} opacity={0.7} isTruncated>
                                  {op.applicantName || '-'}
                                </Text>
                              </VStack>
                              <VStack align="end" gap={1} flexShrink={0}>
                                <Text fontWeight="bold" color={colors.textColor} fontSize="sm">
                                  {formatAmount(op.amount, op.currency)}
                                </Text>
                                <Box
                                  bg={urgency.bg}
                                  color={urgency.color}
                                  px={2}
                                  py={1}
                                  borderRadius="md"
                                  borderWidth="1px"
                                  borderColor={urgency.border}
                                  animation={urgency.pulse ? 'pulse 2s infinite' : undefined}
                                >
                                  <Text fontSize="xs" fontWeight="bold">
                                    {formatCountdown(days)}
                                  </Text>
                                </Box>
                              </VStack>
                            </Flex>

                            {/* Middle Row: Stage + Status */}
                            <Flex justify="space-between" align="center">
                              <HStack gap={2}>
                                <Badge
                                  colorPalette={
                                    op.stage === 'EXPIRED' ? 'red' :
                                    op.stage === 'CANCELLED' ? 'gray' :
                                    op.stage === 'ISSUED' ? 'blue' :
                                    op.stage === 'CONFIRMED' ? 'green' : 'cyan'
                                  }
                                  size="sm"
                                >
                                  {t(`operations.stages.${op.stage}`)}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  colorPalette={
                                    op.status === 'ACTIVE' ? 'green' :
                                    op.status === 'PENDING_RESPONSE' ? 'orange' :
                                    op.status === 'ON_HOLD' ? 'gray' : 'blue'
                                  }
                                  size="sm"
                                >
                                  {t(`operations.statuses.${op.status}`)}
                                </Badge>
                              </HStack>
                              <Text fontSize="xs" color={colors.textColor} opacity={0.6}>
                                {formatDate(op.expiryDate)}
                              </Text>
                            </Flex>

                            {/* Bottom Row: Actions */}
                            <Flex justify="flex-end" gap={1}>
                              <IconButton
                                aria-label="Ver Formulario"
                                size="sm"
                                variant="ghost"
                                colorPalette="blue"
                                onClick={() => handleViewForm(op)}
                              >
                                <FiFileText />
                              </IconButton>
                              {isAdmin && (
                                <IconButton
                                  aria-label={t('operations.editFields', 'Editar Campos')}
                                  size="sm"
                                  variant="ghost"
                                  colorPalette="orange"
                                  onClick={() => handleEditFields(op)}
                                  title={t('operations.editFields', 'Editar Campos')}
                                >
                                  <FiEdit2 />
                                </IconButton>
                              )}
                              <IconButton
                                aria-label="Ver Detalles"
                                size="sm"
                                variant="ghost"
                                onClick={() => onViewDetails(op)}
                              >
                                <FiEye />
                              </IconButton>
                              <IconButton
                                aria-label="Ver Mensajes"
                                size="sm"
                                variant="ghost"
                                onClick={() => onViewMessages(op)}
                              >
                                <FiMessageSquare />
                              </IconButton>
                              <IconButton
                                aria-label="Ejecutar Evento"
                                size="sm"
                                variant="ghost"
                                colorPalette="green"
                                onClick={() => onExecuteEvent(op)}
                              >
                                <FiActivity />
                              </IconButton>
                            </Flex>
                          </VStack>
                        </Box>

                        {/* Desktop Layout */}
                        <Box display={{ base: 'none', lg: 'block' }}>
                          <Grid templateColumns="1fr 2fr 1fr 1fr auto" gap={4} alignItems="center">
                            {/* Countdown Badge */}
                            <GridItem>
                              <Box
                                bg={urgency.bg}
                                color={urgency.color}
                                px={3}
                                py={2}
                                borderRadius="lg"
                                borderWidth="1px"
                                borderColor={urgency.border}
                                textAlign="center"
                                animation={urgency.pulse ? 'pulse 2s infinite' : undefined}
                              >
                                <Text fontSize="lg" fontWeight="bold">
                                  {formatCountdown(days)}
                                </Text>
                                <Text fontSize="xs">
                                  {formatDate(op.expiryDate)}
                                </Text>
                              </Box>
                            </GridItem>

                            {/* Operation Info */}
                            <GridItem>
                              <VStack align="start" gap={1}>
                                <HStack>
                                  <Text fontWeight="bold" color={colors.textColor}>
                                    {op.reference}
                                  </Text>
                                  <OperationLockIndicator lock={lockStatuses[op.operationId]} size="xs" />
                                  <Badge size="sm" colorPalette="purple">
                                    {op.messageType}
                                  </Badge>
                                  {op.hasAlerts && op.alertCount && op.alertCount > 0 && (
                                    <AlertBadge operationId={op.operationId} alertCount={op.alertCount} />
                                  )}
                                </HStack>
                                <HStack gap={4} fontSize="sm" color={colors.textColor} opacity={0.8}>
                                  <Text>{op.applicantName || '-'}</Text>
                                  <FiChevronRight size={12} />
                                  <Text>{op.beneficiaryName || '-'}</Text>
                                </HStack>
                              </VStack>
                            </GridItem>

                            {/* Amount */}
                            <GridItem>
                              <Text fontWeight="semibold" color={colors.textColor} textAlign="right">
                                {formatAmount(op.amount, op.currency)}
                              </Text>
                            </GridItem>

                            {/* Stage & Status */}
                            <GridItem>
                              <VStack align="end" gap={1}>
                                <Badge
                                  colorPalette={
                                    op.stage === 'EXPIRED' ? 'red' :
                                    op.stage === 'CANCELLED' ? 'gray' :
                                    op.stage === 'ISSUED' ? 'blue' :
                                    op.stage === 'CONFIRMED' ? 'green' : 'cyan'
                                  }
                                  size="sm"
                                >
                                  {t(`operations.stages.${op.stage}`)}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  colorPalette={
                                    op.status === 'ACTIVE' ? 'green' :
                                    op.status === 'PENDING_RESPONSE' ? 'orange' :
                                    op.status === 'ON_HOLD' ? 'gray' : 'blue'
                                  }
                                  size="sm"
                                >
                                  {t(`operations.statuses.${op.status}`)}
                                </Badge>
                              </VStack>
                            </GridItem>

                            {/* Actions */}
                            <GridItem>
                              <HStack gap={1}>
                                <IconButton
                                  aria-label="Ver Formulario"
                                  size="sm"
                                  variant="ghost"
                                  colorPalette="blue"
                                  onClick={() => handleViewForm(op)}
                                >
                                  <FiFileText />
                                </IconButton>
                                {isAdmin && (
                                  <IconButton
                                    aria-label={t('operations.editFields', 'Editar Campos')}
                                    size="sm"
                                    variant="ghost"
                                    colorPalette="orange"
                                    onClick={() => handleEditFields(op)}
                                    title={t('operations.editFields', 'Editar Campos')}
                                  >
                                    <FiEdit2 />
                                  </IconButton>
                                )}
                                <IconButton
                                  aria-label="Ver Detalles"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onViewDetails(op)}
                                >
                                  <FiEye />
                                </IconButton>
                                <IconButton
                                  aria-label="Ver Mensajes"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onViewMessages(op)}
                                >
                                  <FiMessageSquare />
                                </IconButton>
                                <IconButton
                                  aria-label="Ejecutar Evento"
                                  size="sm"
                                  variant="ghost"
                                  colorPalette="green"
                                  onClick={() => onExecuteEvent(op)}
                                >
                                  <FiActivity />
                                </IconButton>
                              </HStack>
                            </GridItem>
                          </Grid>
                        </Box>
                      </Box>
                    );
                  })}
                </VStack>
              </Card.Body>
            </Card.Root>
          );
        })}

        {/* Bottom Pagination Controls */}
        {totalPages > 1 && (
          <Card.Root bg={colors.cardBg} borderWidth="1px" borderColor={colors.borderColor} shadow="sm">
            <Card.Body p={3}>
              <Flex justify="center" align="center" gap={4}>
                <IconButton
                  aria-label="Previous page"
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <FiChevronLeft />
                </IconButton>
                <Text fontSize="sm" color={colors.textColor} fontWeight="medium">
                  {t('common.pagination', 'Página {{current}} de {{total}}', { current: currentPage, total: totalPages })}
                  {' · '}
                  {t('common.showingRecords', 'Mostrando {{start}}-{{end}} de {{total}}', {
                    start: (currentPage - 1) * pageSize + 1,
                    end: Math.min(currentPage * pageSize, filteredOperations.length),
                    total: filteredOperations.length
                  })}
                </Text>
                <IconButton
                  aria-label="Next page"
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <FiChevronRight />
                </IconButton>
              </Flex>
            </Card.Body>
          </Card.Root>
        )}
      </VStack>

      {/* CSS for pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}
      </style>
    </VStack>
  );
};

export default ExpiryDashboard;
