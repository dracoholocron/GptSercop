/**
 * CommissionsDashboard Component
 * Powerful Commissions Analytics Dashboard - Similar to BusinessDashboard
 * Shows commissions charged from GLE (prn=36) with breakdowns and trends
 */

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  SimpleGrid,
  Spinner,
  IconButton,
  Badge,
  Card,
  Table,
  Checkbox,
  Portal,
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiClock,
  FiActivity,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiFileText,
  FiPieChart,
  FiBarChart2,
  FiTrendingUp as FiLineChart,
  FiFilter,
  FiChevronDown,
  FiX,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useCommissionsData, type CommissionsFilters, type PendingCommissionsData } from '../../hooks/useCommissionsData';

// Chart type options
type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'radar' | 'horizontalBar';

interface ChartTypeSelectorProps {
  options: ChartType[];
  selected: ChartType;
  onChange: (type: ChartType) => void;
  isDark: boolean;
  colors: any;
}

const chartTypeIcons: Record<ChartType, any> = {
  bar: FiBarChart2,
  line: FiLineChart,
  area: FiTrendingUp,
  pie: FiPieChart,
  radar: FiActivity,
  horizontalBar: FiBarChart2,
};

const chartTypeLabels: Record<ChartType, string> = {
  bar: 'Barras',
  line: 'Líneas',
  area: 'Área',
  pie: 'Circular',
  radar: 'Radar',
  horizontalBar: 'Barras H',
};

const ChartTypeSelector = ({ options, selected, onChange, isDark, colors }: ChartTypeSelectorProps) => {
  return (
    <HStack gap={1}>
      {options.map((type) => {
        const Icon = chartTypeIcons[type];
        const isSelected = type === selected;
        return (
          <IconButton
            key={type}
            aria-label={chartTypeLabels[type]}
            size="xs"
            variant={isSelected ? 'solid' : 'ghost'}
            colorPalette={isSelected ? 'green' : 'gray'}
            onClick={() => onChange(type)}
            title={chartTypeLabels[type]}
            bg={isSelected ? (isDark ? 'green.600' : 'green.500') : 'transparent'}
            color={isSelected ? 'white' : colors.textColorSecondary}
            _hover={{
              bg: isSelected ? (isDark ? 'green.500' : 'green.600') : (isDark ? 'whiteAlpha.200' : 'blackAlpha.100'),
            }}
          >
            <Icon size={14} />
          </IconButton>
        );
      })}
    </HStack>
  );
};

// Color palettes
const CHART_COLORS = ['#3182CE', '#38A169', '#DD6B20', '#805AD5', '#D53F8C', '#00B5D8', '#ED8936', '#9F7AEA'];
const TREND_COLORS = { positive: '#38A169', negative: '#E53E3E', neutral: '#718096' };

// Format currency
const formatCurrency = (amount: number, compact = false): string => {
  if (compact && Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (compact && Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format percentage
const formatPercent = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

// Period options
const PERIOD_OPTIONS = [
  { value: 'all', label: 'Todo' },
  { value: 'month', label: 'Último Mes' },
  { value: 'quarter', label: 'Último Trimestre' },
  { value: 'semester', label: 'Último Semestre' },
  { value: 'year', label: 'Último Año' },
];

// Refresh interval options
const INTERVAL_OPTIONS = [
  { value: 30000, label: '30s' },
  { value: 60000, label: '1m' },
  { value: 300000, label: '5m' },
  { value: 0, label: 'Manual' },
];

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  const { getColors } = useTheme();
  const colors = getColors();

  if (active && payload && payload.length) {
    return (
      <Box
        bg={colors.cardBg}
        p={3}
        borderRadius="lg"
        boxShadow="lg"
        borderWidth="1px"
        borderColor={colors.borderColor}
      >
        <Text fontWeight="semibold" fontSize="sm" mb={1}>
          {label}
        </Text>
        {payload.map((entry: any, index: number) => (
          <Text key={`commissions-${entry.name || entry.dataKey || index}`} fontSize="sm" color={entry.color}>
            {entry.name}: {formatCurrency(entry.value)}
          </Text>
        ))}
      </Box>
    );
  }
  return null;
};

export const CommissionsDashboard = () => {
  const { t, i18n } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  // Chart type states
  const [trendChartType, setTrendChartType] = useState<ChartType>('bar');
  const [productChartType, setProductChartType] = useState<ChartType>('pie');
  const [currencyChartType, setCurrencyChartType] = useState<ChartType>('horizontalBar');

  // Account filter dropdown state
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Update dropdown position when opened
  useEffect(() => {
    if (accountDropdownOpen && accountButtonRef.current) {
      const rect = accountButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
  }, [accountDropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target as Node) &&
        accountButtonRef.current &&
        !accountButtonRef.current.contains(event.target as Node)
      ) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const {
    data,
    pendingData,
    pendingLoading,
    filters,
    loading,
    error,
    lastUpdated,
    refreshInterval,
    setFilters,
    setRefreshInterval,
    refresh,
  } = useCommissionsData({ autoRefresh: true, refreshInterval: 300000 });

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return '';
    const locale = i18n.language === 'es' ? 'es-MX' : 'en-US';
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && !data) {
    return (
      <Box
        minH="80vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        gap={4}
      >
        <Spinner size="xl" color={colors.primaryColor} thickness="4px" />
        <Text color={colors.textColor} fontSize="lg">
          {t('commissionsDashboard.loading', 'Cargando dashboard de comisiones...')}
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        minH="80vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        gap={4}
      >
        <Text color="red.500" fontSize="lg">
          Error: {error}
        </Text>
        <IconButton aria-label="Reintentar" onClick={refresh}>
          <FiRefreshCw />
        </IconButton>
      </Box>
    );
  }

  if (!data) return null;

  // Chart data preparation
  const trendChartData = data.monthlyTrend.map(m => ({
    name: m.month,
    Comisiones: Math.round(m.total),
  }));

  const productTypeChartData = data.byProductType.slice(0, 6).map(pt => ({
    name: pt.label,
    value: Math.round(pt.total),
  }));

  const currencyChartData = data.byCurrency.map(c => ({
    name: c.currency,
    value: Math.round(c.total),
    percentage: c.percentage,
  }));

  return (
    <Box
      p={{ base: 3, md: 6, lg: 8 }}
      minH="100vh"
      bg={isDark
        ? 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)'
        : 'linear-gradient(180deg, #F8FAFC 0%, #E2E8F0 100%)'
      }
    >
      {/* Header */}
      <Box
        mb={6}
        p={{ base: 4, md: 6 }}
        borderRadius="2xl"
        bg={isDark
          ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(51, 65, 85, 0.85) 100%)'
          : 'linear-gradient(135deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.95) 50%, rgba(226, 232, 240, 0.92) 100%)'
        }
        border="1px solid"
        borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
        boxShadow={isDark
          ? '0 4px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 4px 30px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
        }
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          bgGradient: 'linear(to-r, green.400, teal.400, blue.400)',
        }}
      >
        <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
          {/* Title */}
          <VStack align="start" gap={2}>
            <HStack gap={3} align="center">
              <Box p={3} bg="green.100" borderRadius="xl">
                <FiDollarSign size={28} color="var(--chakra-colors-green-600)" />
              </Box>
              <VStack align="start" gap={0}>
                <Heading
                  size={{ base: 'xl', md: '2xl' }}
                  fontWeight="bold"
                  letterSpacing="tight"
                  bgGradient={isDark
                    ? 'linear(to-r, green.300, teal.300, blue.300)'
                    : 'linear(to-r, green.600, teal.600, blue.600)'
                  }
                  bgClip="text"
                >
                  {t('commissionsDashboard.title', 'Dashboard de Comisiones')}
                </Heading>
                <Text
                  fontSize={{ base: 'sm', md: 'md' }}
                  color={isDark ? 'gray.400' : 'gray.600'}
                  fontWeight="medium"
                >
                  {t('commissionsDashboard.subtitle', 'Ingresos por servicios de comercio exterior')}
                </Text>
              </VStack>
            </HStack>
          </VStack>

          {/* Status & Controls */}
          <VStack align="end" gap={3}>
            {/* System Status */}
            <HStack
              px={4}
              py={2}
              borderRadius="full"
              bg={isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)'}
              border="1px solid"
              borderColor={isDark ? 'green.500/40' : 'green.400/50'}
            >
              <Box position="relative">
                <Box
                  width="10px"
                  height="10px"
                  borderRadius="full"
                  bg="green.500"
                  boxShadow="0 0 8px rgba(34, 197, 94, 0.6)"
                />
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  width="10px"
                  height="10px"
                  borderRadius="full"
                  bg="green.400"
                  animation="ping 1.5s ease-in-out infinite"
                  sx={{
                    '@keyframes ping': {
                      '0%': { transform: 'scale(1)', opacity: 1 },
                      '75%, 100%': { transform: 'scale(2)', opacity: 0 },
                    },
                  }}
                />
              </Box>
              <Text fontSize="sm" fontWeight="semibold" color="green.500">
                {t('commissionsDashboard.systemOnline', 'Sistema Activo')}
              </Text>
              <FiActivity size={14} color="#22C55E" />
            </HStack>

            {/* Controls */}
            <HStack gap={2} flexWrap="wrap">
              {refreshInterval > 0 && (
                <HStack
                  px={3}
                  py={1.5}
                  borderRadius="lg"
                  bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
                >
                  <Box
                    width="6px"
                    height="6px"
                    borderRadius="full"
                    bg="red.500"
                    animation="blink 1s ease-in-out infinite"
                    sx={{
                      '@keyframes blink': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.3 },
                      },
                    }}
                  />
                  <Text fontSize="xs" color={colors.textColor} opacity={0.8} fontWeight="medium">
                    {t('commissionsDashboard.liveMonitoring', 'Monitoreo en vivo')}
                  </Text>
                </HStack>
              )}

              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : colors.borderColor}`,
                  background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'white',
                  color: colors.textColor,
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Updating Indicator - visible when refreshing with existing data */}
              {loading && data && (
                <HStack
                  px={3}
                  py={1.5}
                  borderRadius="lg"
                  bg={isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}
                  border="1px solid"
                  borderColor={isDark ? 'blue.500/40' : 'blue.400/50'}
                  animation="pulse 1.5s ease-in-out infinite"
                  sx={{
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.6 },
                    },
                  }}
                >
                  <Spinner size="xs" color="blue.500" />
                  <Text fontSize="xs" fontWeight="medium" color="blue.500">
                    {t('commissionsDashboard.updating', 'Actualizando...')}
                  </Text>
                </HStack>
              )}

              <HStack
                px={3}
                py={1.5}
                borderRadius="lg"
                bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
              >
                <FiClock size={12} color={colors.textColor} />
                <Text fontSize="xs" color={colors.textColor} opacity={0.7}>
                  {formatLastUpdated(lastUpdated)}
                </Text>
              </HStack>

              <IconButton
                aria-label={t('commissionsDashboard.refresh', 'Actualizar')}
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={loading}
              >
                <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </IconButton>
            </HStack>
          </VStack>
        </HStack>

        {/* Filters Row */}
        <HStack
          mt={5}
          pt={4}
          borderTop="1px solid"
          borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
          gap={3}
          flexWrap="wrap"
        >
          {/* Period Filter */}
          <select
            value={filters.period}
            onChange={(e) => setFilters({ ...filters, period: e.target.value as CommissionsFilters['period'] })}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : colors.borderColor}`,
              background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'white',
              color: colors.textColor,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Currency Filter */}
          <select
            value={filters.currency || ''}
            onChange={(e) => setFilters({ ...filters, currency: e.target.value || undefined })}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : colors.borderColor}`,
              background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'white',
              color: colors.textColor,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <option value="">{t('commissionsDashboard.allCurrencies', 'Todas las Monedas')}</option>
            {data.byCurrency.map((c) => (
              <option key={c.currency} value={c.currency}>
                {c.currency}
              </option>
            ))}
          </select>

          {/* Product Type Filter */}
          <select
            value={filters.productType || ''}
            onChange={(e) => setFilters({ ...filters, productType: e.target.value || undefined })}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : colors.borderColor}`,
              background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'white',
              color: colors.textColor,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <option value="">{t('commissionsDashboard.allProducts', 'Todos los Productos')}</option>
            {data.byProductType.map((pt) => (
              <option key={pt.productType} value={pt.productType}>
                {pt.label}
              </option>
            ))}
          </select>

          {/* Account Filter - Dropdown with checkboxes */}
          <Box position="relative">
            <Box
              as="button"
              ref={accountButtonRef}
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              display="flex"
              alignItems="center"
              gap={2}
              px={4}
              py={2}
              borderRadius="8px"
              border={`1px solid ${filters.accounts && filters.accounts.length > 0
                ? (isDark ? 'green.500' : 'green.400')
                : (isDark ? 'rgba(255,255,255,0.1)' : colors.borderColor)
              }`}
              bg={filters.accounts && filters.accounts.length > 0
                ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)')
                : (isDark ? 'rgba(30, 41, 59, 0.8)' : 'white')
              }
              color={colors.textColor}
              fontSize="13px"
              cursor="pointer"
              _hover={{
                borderColor: isDark ? 'green.400' : 'green.500',
              }}
            >
              <FiFilter size={14} />
              <Text>
                {filters.accounts && filters.accounts.length > 0
                  ? `${filters.accounts.length} cuenta${filters.accounts.length > 1 ? 's' : ''}`
                  : t('commissionsDashboard.allAccounts', 'Todas las Cuentas')
                }
              </Text>
              <FiChevronDown size={14} style={{ transform: accountDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
            </Box>

            {/* Dropdown menu - rendered in Portal to escape overflow:hidden */}
            {accountDropdownOpen && (
              <Portal>
                <Box
                  ref={accountDropdownRef}
                  position="fixed"
                  top={`${dropdownPosition.top}px`}
                  left={`${dropdownPosition.left}px`}
                  minW="320px"
                  maxH="350px"
                  overflowY="auto"
                  bg={isDark ? 'gray.800' : 'white'}
                  border="1px solid"
                  borderColor={isDark ? 'whiteAlpha.200' : 'gray.200'}
                  borderRadius="lg"
                  boxShadow="2xl"
                  zIndex={9999}
                  p={2}
                >
                  {/* Clear selection button */}
                  {filters.accounts && filters.accounts.length > 0 && (
                    <Box
                      as="button"
                      display="flex"
                      alignItems="center"
                      gap={2}
                      w="full"
                      px={3}
                      py={2}
                      mb={2}
                      borderRadius="md"
                      bg={isDark ? 'red.900/30' : 'red.50'}
                      color="red.500"
                      fontSize="12px"
                      fontWeight="medium"
                      _hover={{ bg: isDark ? 'red.900/50' : 'red.100' }}
                      onClick={() => {
                        setFilters({ ...filters, accounts: undefined });
                        setAccountDropdownOpen(false);
                      }}
                    >
                      <FiX size={14} />
                      {t('commissionsDashboard.clearSelection', 'Limpiar selección')}
                    </Box>
                  )}

                  {/* Account checkboxes */}
                  <VStack align="stretch" gap={0}>
                    {data.availableAccounts.map((acc) => {
                      const isSelected = filters.accounts?.includes(acc.account) || false;
                      return (
                        <Box
                          key={acc.account}
                          as="label"
                          display="flex"
                          alignItems="center"
                          gap={3}
                          px={3}
                          py={2}
                          borderRadius="md"
                          cursor="pointer"
                          _hover={{ bg: isDark ? 'whiteAlpha.100' : 'gray.50' }}
                          bg={isSelected ? (isDark ? 'green.900/20' : 'green.50') : 'transparent'}
                        >
                          <Checkbox.Root
                            checked={isSelected}
                            onCheckedChange={(e) => {
                              const checked = e.checked;
                              let newAccounts: string[] = filters.accounts ? [...filters.accounts] : [];
                              if (checked) {
                                newAccounts.push(acc.account);
                              } else {
                                newAccounts = newAccounts.filter(a => a !== acc.account);
                              }
                              setFilters({
                                ...filters,
                                accounts: newAccounts.length > 0 ? newAccounts : undefined
                              });
                            }}
                            colorPalette="green"
                            size="sm"
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                          </Checkbox.Root>
                          <VStack align="start" gap={0} flex={1}>
                            <Text fontSize="12px" fontWeight="medium" color={colors.textColor}>
                              {acc.account}
                            </Text>
                            <Text fontSize="10px" color={colors.textColorSecondary}>
                              {acc.count.toLocaleString()} ops · {formatCurrency(acc.total, true)}
                            </Text>
                          </VStack>
                        </Box>
                      );
                    })}
                  </VStack>

                  {data.availableAccounts.length === 0 && (
                    <Text fontSize="12px" color={colors.textColorSecondary} textAlign="center" py={4}>
                      No hay cuentas disponibles
                    </Text>
                  )}
                </Box>
              </Portal>
            )}
          </Box>

          {/* Period Badge */}
          <Badge
            px={3}
            py={1}
            borderRadius="full"
            colorPalette="green"
            variant="subtle"
            fontSize="xs"
            ml="auto"
          >
            {data.periodLabel}
          </Badge>
        </HStack>
      </Box>

      {/* KPI Cards */}
      <SimpleGrid
        columns={{ base: 2, md: 4 }}
        gap={{ base: 3, md: 4 }}
        mb={6}
      >
        {/* Total Commissions */}
        <Card.Root
          bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'white'}
          borderRadius="xl"
          border="1px solid"
          borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
          overflow="hidden"
          position="relative"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            bg: 'green.500',
          }}
        >
          <Card.Body p={4}>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="xs" color={colors.textColorSecondary} fontWeight="medium">
                {t('commissionsDashboard.totalCommissions', 'Total Comisiones')}
              </Text>
              <FiDollarSign color="var(--chakra-colors-green-500)" />
            </HStack>
            <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>
              {formatCurrency(data.totalCommissions, true)}
            </Text>
            {data.monthOverMonthChange !== null && (
              <HStack mt={1}>
                {data.monthOverMonthChange >= 0 ? (
                  <FiTrendingUp color={TREND_COLORS.positive} size={14} />
                ) : (
                  <FiTrendingDown color={TREND_COLORS.negative} size={14} />
                )}
                <Text
                  fontSize="xs"
                  color={data.monthOverMonthChange >= 0 ? 'green.500' : 'red.500'}
                  fontWeight="medium"
                >
                  {formatPercent(data.monthOverMonthChange)} vs mes anterior
                </Text>
              </HStack>
            )}
          </Card.Body>
        </Card.Root>

        {/* Total Operations */}
        <Card.Root
          bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'white'}
          borderRadius="xl"
          border="1px solid"
          borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
          overflow="hidden"
          position="relative"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            bg: 'blue.500',
          }}
        >
          <Card.Body p={4}>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="xs" color={colors.textColorSecondary} fontWeight="medium">
                {t('commissionsDashboard.totalOperations', 'Operaciones')}
              </Text>
              <FiFileText color="var(--chakra-colors-blue-500)" />
            </HStack>
            <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>
              {data.totalOperations.toLocaleString()}
            </Text>
            <Text fontSize="xs" color={colors.textColorSecondary} mt={1}>
              {t('commissionsDashboard.uniqueOperations', 'operaciones únicas')}
            </Text>
          </Card.Body>
        </Card.Root>

        {/* Average Commission */}
        <Card.Root
          bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'white'}
          borderRadius="xl"
          border="1px solid"
          borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
          overflow="hidden"
          position="relative"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            bg: 'purple.500',
          }}
        >
          <Card.Body p={4}>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="xs" color={colors.textColorSecondary} fontWeight="medium">
                {t('commissionsDashboard.avgCommission', 'Promedio')}
              </Text>
              <FiPieChart color="var(--chakra-colors-purple-500)" />
            </HStack>
            <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>
              {formatCurrency(data.averageCommission, true)}
            </Text>
            <Text fontSize="xs" color={colors.textColorSecondary} mt={1}>
              {t('commissionsDashboard.perOperation', 'por operación')}
            </Text>
          </Card.Body>
        </Card.Root>

        {/* Current Month */}
        <Card.Root
          bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'white'}
          borderRadius="xl"
          border="1px solid"
          borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
          overflow="hidden"
          position="relative"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            bg: 'orange.500',
          }}
        >
          <Card.Body p={4}>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="xs" color={colors.textColorSecondary} fontWeight="medium">
                {t('commissionsDashboard.thisMonth', 'Este Mes')}
              </Text>
              <FiActivity color="var(--chakra-colors-orange-500)" />
            </HStack>
            <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>
              {formatCurrency(data.currentMonthTotal, true)}
            </Text>
            <Text fontSize="xs" color={colors.textColorSecondary} mt={1}>
              {t('commissionsDashboard.vsLastMonth', 'Mes anterior')}: {formatCurrency(data.previousMonthTotal, true)}
            </Text>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* Charts Row */}
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        gap={{ base: 4, md: 6 }}
        mb={6}
      >
        {/* Monthly Trend Chart */}
        <Card.Root
          bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'white'}
          borderRadius="xl"
          border="1px solid"
          borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
        >
          <Card.Header pb={2}>
            <HStack justify="space-between" align="center">
              <Heading size="sm" color={colors.textColor}>
                {t('commissionsDashboard.monthlyTrend', 'Tendencia Mensual')}
              </Heading>
              <ChartTypeSelector
                options={['bar', 'line', 'area']}
                selected={trendChartType}
                onChange={setTrendChartType}
                isDark={isDark}
                colors={colors}
              />
            </HStack>
          </Card.Header>
          <Card.Body pt={0}>
            <Box h={300}>
              <ResponsiveContainer width="100%" height="100%">
                {trendChartType === 'bar' && (
                  <BarChart data={trendChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: colors.textColorSecondary }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCurrency(v, true)}
                      tick={{ fontSize: 10, fill: colors.textColorSecondary }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Comisiones" fill="#38A169" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
                {trendChartType === 'line' && (
                  <LineChart data={trendChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: colors.textColorSecondary }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCurrency(v, true)}
                      tick={{ fontSize: 10, fill: colors.textColorSecondary }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Comisiones" stroke="#38A169" strokeWidth={2} dot={{ fill: '#38A169', r: 4 }} />
                  </LineChart>
                )}
                {trendChartType === 'area' && (
                  <AreaChart data={trendChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: colors.textColorSecondary }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCurrency(v, true)}
                      tick={{ fontSize: 10, fill: colors.textColorSecondary }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Comisiones" stroke="#38A169" fill="#38A169" fillOpacity={0.3} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </Box>
          </Card.Body>
        </Card.Root>

        {/* Product Type Distribution */}
        <Card.Root
          bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'white'}
          borderRadius="xl"
          border="1px solid"
          borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
        >
          <Card.Header pb={2}>
            <HStack justify="space-between" align="center">
              <Heading size="sm" color={colors.textColor}>
                {t('commissionsDashboard.byProductType', 'Por Tipo de Producto')}
              </Heading>
              <ChartTypeSelector
                options={['pie', 'bar', 'radar']}
                selected={productChartType}
                onChange={setProductChartType}
                isDark={isDark}
                colors={colors}
              />
            </HStack>
          </Card.Header>
          <Card.Body pt={0}>
            <Box h={300}>
              <ResponsiveContainer width="100%" height="100%">
                {productChartType === 'pie' && (
                  <PieChart>
                    <Pie
                      data={productTypeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {productTypeChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      formatter={(value) => (
                        <span style={{ color: colors.textColor, fontSize: 11 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                )}
                {productChartType === 'bar' && (
                  <BarChart data={productTypeChartData} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v, true)} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: colors.textColor }} width={90} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {productTypeChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
                {productChartType === 'radar' && (
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={productTypeChartData}>
                    <PolarGrid strokeOpacity={0.3} />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 9, fill: colors.textColor }} />
                    <PolarRadiusAxis tickFormatter={(v) => formatCurrency(v, true)} tick={{ fontSize: 8 }} />
                    <Radar name="Comisiones" dataKey="value" stroke="#38A169" fill="#38A169" fillOpacity={0.4} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                )}
              </ResponsiveContainer>
            </Box>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* Second Charts Row */}
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        gap={{ base: 4, md: 6 }}
        mb={6}
      >
        {/* Currency Distribution */}
        <Card.Root
          bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'white'}
          borderRadius="xl"
          border="1px solid"
          borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
        >
          <Card.Header pb={2}>
            <HStack justify="space-between" align="center">
              <Heading size="sm" color={colors.textColor}>
                {t('commissionsDashboard.byCurrency', 'Por Moneda')}
              </Heading>
              <ChartTypeSelector
                options={['horizontalBar', 'bar', 'pie']}
                selected={currencyChartType}
                onChange={setCurrencyChartType}
                isDark={isDark}
                colors={colors}
              />
            </HStack>
          </Card.Header>
          <Card.Body pt={0}>
            <Box h={250}>
              <ResponsiveContainer width="100%" height="100%">
                {currencyChartType === 'horizontalBar' && (
                  <BarChart data={currencyChartData} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v, true)} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: colors.textColor }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {currencyChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
                {currencyChartType === 'bar' && (
                  <BarChart data={currencyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: colors.textColor }} />
                    <YAxis tickFormatter={(v) => formatCurrency(v, true)} tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {currencyChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
                {currencyChartType === 'pie' && (
                  <PieChart>
                    <Pie
                      data={currencyChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {currencyChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </Box>
          </Card.Body>
        </Card.Root>

        {/* Product Type Summary Table */}
        <Card.Root
          bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'white'}
          borderRadius="xl"
          border="1px solid"
          borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
        >
          <Card.Header pb={2}>
            <Heading size="sm" color={colors.textColor}>
              {t('commissionsDashboard.productSummary', 'Resumen por Producto')}
            </Heading>
          </Card.Header>
          <Card.Body pt={0} overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader color={colors.textColorSecondary}>Producto</Table.ColumnHeader>
                  <Table.ColumnHeader color={colors.textColorSecondary} textAlign="right">Total</Table.ColumnHeader>
                  <Table.ColumnHeader color={colors.textColorSecondary} textAlign="right">Ops</Table.ColumnHeader>
                  <Table.ColumnHeader color={colors.textColorSecondary} textAlign="right">%</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.byProductType.slice(0, 8).map((pt, idx) => (
                  <Table.Row key={idx}>
                    <Table.Cell>
                      <HStack>
                        <Box w={2} h={2} borderRadius="full" bg={CHART_COLORS[idx % CHART_COLORS.length]} />
                        <Text fontSize="sm" color={colors.textColor}>{pt.label}</Text>
                      </HStack>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                        {formatCurrency(pt.total, true)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <Text fontSize="sm" color={colors.textColorSecondary}>{pt.count}</Text>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <Text fontSize="sm" color={colors.textColorSecondary}>
                        {data.totalCommissions > 0 ? ((pt.total / data.totalCommissions) * 100).toFixed(1) : 0}%
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* Top Operations Table */}
      <Card.Root
        bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'white'}
        borderRadius="xl"
        border="1px solid"
        borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
      >
        <Card.Header pb={2}>
          <HStack justify="space-between">
            <Heading size="sm" color={colors.textColor}>
              {t('commissionsDashboard.topOperations', 'Top Operaciones por Comisión')}
            </Heading>
            <Badge colorPalette="green" variant="subtle">
              {data.topOperations.length} operaciones
            </Badge>
          </HStack>
        </Card.Header>
        <Card.Body pt={0} overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader color={colors.textColorSecondary}>#</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColorSecondary}>Referencia</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColorSecondary}>Producto</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColorSecondary}>Moneda</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColorSecondary} textAlign="right">Comisión</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.topOperations.map((op, idx) => (
                <Table.Row key={idx} _hover={{ bg: isDark ? 'whiteAlpha.50' : 'blackAlpha.50' }}>
                  <Table.Cell>
                    <Badge
                      size="sm"
                      colorPalette={idx < 3 ? 'green' : 'gray'}
                      variant={idx < 3 ? 'solid' : 'subtle'}
                    >
                      {idx + 1}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                      {op.reference}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="sm" variant="subtle" colorPalette="blue">
                      {op.productType}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" color={colors.textColorSecondary}>{op.currency}</Text>
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    <Text fontSize="sm" fontWeight="bold" color="green.500">
                      {op.formattedAmount}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Card.Body>
      </Card.Root>

      {/* ======================================================================== */}
      {/* SECCIÓN: COMISIONES PENDIENTES DE COBRO */}
      {/* Cuentas 71% (provisiones) y 72% (comisiones por cobrar) */}
      {/* ======================================================================== */}
      <Box
        mt={10}
        pt={8}
        borderTop="3px solid"
        borderColor={isDark ? 'orange.500/30' : 'orange.400/50'}
      >
        {/* Pending Commissions Header */}
        <HStack mb={6} gap={4} flexWrap="wrap">
          <HStack gap={3} align="center">
            <Box
              p={3}
              bg="orange.100"
              borderRadius="xl"
              border="2px solid"
              borderColor="orange.400"
            >
              <FiClock size={28} color="var(--chakra-colors-orange-600)" />
            </Box>
            <VStack align="start" gap={0}>
              <Heading
                size={{ base: 'lg', md: 'xl' }}
                fontWeight="bold"
                letterSpacing="tight"
                bgGradient={isDark
                  ? 'linear(to-r, orange.300, yellow.300)'
                  : 'linear(to-r, orange.600, yellow.600)'
                }
                bgClip="text"
              >
                {t('commissionsDashboard.pendingTitle', 'Comisiones Pendientes de Cobro')}
              </Heading>
              <Text
                fontSize={{ base: 'sm', md: 'md' }}
                color={isDark ? 'gray.400' : 'gray.600'}
                fontWeight="medium"
              >
                {t('commissionsDashboard.pendingSubtitle', 'Provisiones y comisiones por cobrar (Cuentas 71*)')}
              </Text>
            </VStack>
          </HStack>

          {pendingLoading && (
            <HStack
              px={3}
              py={2}
              borderRadius="lg"
              bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
            >
              <Spinner size="sm" color="orange.500" />
              <Text fontSize="xs" color={colors.textColorSecondary}>
                {t('commissionsDashboard.loadingPending', 'Cargando...')}
              </Text>
            </HStack>
          )}
        </HStack>

        {pendingData && (
          <>
            {/* Pending KPI Cards */}
            <SimpleGrid
              columns={{ base: 2, md: 3 }}
              gap={{ base: 3, md: 4 }}
              mb={6}
            >
              {/* Total Pending */}
              <Card.Root
                bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'white'}
                borderRadius="xl"
                border="1px solid"
                borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
                overflow="hidden"
                position="relative"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  bg: 'orange.500',
                }}
              >
                <Card.Body p={4}>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="xs" color={colors.textColorSecondary} fontWeight="medium">
                      {t('commissionsDashboard.totalPending', 'Total Pendiente')}
                    </Text>
                    <FiClock color="var(--chakra-colors-orange-500)" />
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                    {formatCurrency(pendingData.totalPending, true)}
                  </Text>
                  <Text fontSize="xs" color={colors.textColorSecondary} mt={1}>
                    {t('commissionsDashboard.pendingToCollect', 'por cobrar')}
                  </Text>
                </Card.Body>
              </Card.Root>

              {/* Pending Operations */}
              <Card.Root
                bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'white'}
                borderRadius="xl"
                border="1px solid"
                borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
                overflow="hidden"
                position="relative"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  bg: 'yellow.500',
                }}
              >
                <Card.Body p={4}>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="xs" color={colors.textColorSecondary} fontWeight="medium">
                      {t('commissionsDashboard.pendingOps', 'Operaciones')}
                    </Text>
                    <FiFileText color="var(--chakra-colors-yellow-500)" />
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>
                    {pendingData.totalOperations.toLocaleString()}
                  </Text>
                  <Text fontSize="xs" color={colors.textColorSecondary} mt={1}>
                    {t('commissionsDashboard.withPendingBalance', 'con saldo pendiente')}
                  </Text>
                </Card.Body>
              </Card.Root>

              {/* Currencies Summary */}
              <Card.Root
                bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'white'}
                borderRadius="xl"
                border="1px solid"
                borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
                overflow="hidden"
                position="relative"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  bg: 'red.500',
                }}
              >
                <Card.Body p={4}>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="xs" color={colors.textColorSecondary} fontWeight="medium">
                      {t('commissionsDashboard.pendingByCurrency', 'Por Moneda')}
                    </Text>
                    <FiPieChart color="var(--chakra-colors-red-500)" />
                  </HStack>
                  <VStack align="stretch" gap={1}>
                    {pendingData.byCurrency.slice(0, 3).map((c, idx) => (
                      <HStack key={idx} justify="space-between">
                        <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                          {c.currency}
                        </Text>
                        <Text fontSize="sm" fontWeight="bold" color="orange.500">
                          {formatCurrency(c.balance, true)}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </Card.Body>
              </Card.Root>
            </SimpleGrid>

            {/* Pending Details Row */}
            <SimpleGrid
              columns={{ base: 1, lg: 2 }}
              gap={{ base: 4, md: 6 }}
            >
              {/* Pending by Product Type */}
              <Card.Root
                bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'white'}
                borderRadius="xl"
                border="1px solid"
                borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
              >
                <Card.Header pb={2}>
                  <Heading size="sm" color={colors.textColor}>
                    {t('commissionsDashboard.pendingByProduct', 'Pendiente por Producto')}
                  </Heading>
                </Card.Header>
                <Card.Body pt={0} overflowX="auto">
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader color={colors.textColorSecondary}>Producto</Table.ColumnHeader>
                        <Table.ColumnHeader color={colors.textColorSecondary} textAlign="right">Pendiente</Table.ColumnHeader>
                        <Table.ColumnHeader color={colors.textColorSecondary} textAlign="right">Ops</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {pendingData.byProductType.slice(0, 8).map((pt, idx) => (
                        <Table.Row key={idx}>
                          <Table.Cell>
                            <HStack>
                              <Box w={2} h={2} borderRadius="full" bg={CHART_COLORS[idx % CHART_COLORS.length]} />
                              <Text fontSize="sm" color={colors.textColor}>{pt.label}</Text>
                            </HStack>
                          </Table.Cell>
                          <Table.Cell textAlign="right">
                            <Text fontSize="sm" fontWeight="bold" color="orange.500">
                              {formatCurrency(pt.balance, true)}
                            </Text>
                          </Table.Cell>
                          <Table.Cell textAlign="right">
                            <Text fontSize="sm" color={colors.textColorSecondary}>{pt.count}</Text>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Card.Body>
              </Card.Root>

              {/* Top Pending Operations */}
              <Card.Root
                bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'white'}
                borderRadius="xl"
                border="1px solid"
                borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
              >
                <Card.Header pb={2}>
                  <HStack justify="space-between">
                    <Heading size="sm" color={colors.textColor}>
                      {t('commissionsDashboard.topPendingOps', 'Operaciones con Mayor Saldo Pendiente')}
                    </Heading>
                    <Badge colorPalette="orange" variant="subtle">
                      {pendingData.topOperations.length} ops
                    </Badge>
                  </HStack>
                </Card.Header>
                <Card.Body pt={0} overflowX="auto">
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader color={colors.textColorSecondary}>#</Table.ColumnHeader>
                        <Table.ColumnHeader color={colors.textColorSecondary}>Referencia</Table.ColumnHeader>
                        <Table.ColumnHeader color={colors.textColorSecondary}>Producto</Table.ColumnHeader>
                        <Table.ColumnHeader color={colors.textColorSecondary} textAlign="right">Pendiente</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {pendingData.topOperations.map((op, idx) => (
                        <Table.Row key={idx} _hover={{ bg: isDark ? 'whiteAlpha.50' : 'blackAlpha.50' }}>
                          <Table.Cell>
                            <Badge
                              size="sm"
                              colorPalette={idx < 3 ? 'orange' : 'gray'}
                              variant={idx < 3 ? 'solid' : 'subtle'}
                            >
                              {idx + 1}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>
                            <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                              {op.reference}
                            </Text>
                          </Table.Cell>
                          <Table.Cell>
                            <Badge size="sm" variant="subtle" colorPalette="purple">
                              {op.productType}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell textAlign="right">
                            <Text fontSize="sm" fontWeight="bold" color="orange.500">
                              {op.formattedAmount}
                            </Text>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Card.Body>
              </Card.Root>
            </SimpleGrid>
          </>
        )}

        {!pendingData && !pendingLoading && (
          <Box
            p={8}
            textAlign="center"
            bg={isDark ? 'rgba(30, 41, 59, 0.5)' : 'gray.50'}
            borderRadius="xl"
          >
            <Text color={colors.textColorSecondary}>
              {t('commissionsDashboard.noPendingData', 'No hay datos de comisiones pendientes disponibles')}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CommissionsDashboard;
