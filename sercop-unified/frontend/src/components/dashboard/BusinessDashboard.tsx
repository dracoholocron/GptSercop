/**
 * BusinessDashboard Component
 * Main Business Intelligence Dashboard - Control Tower View
 */

import { useEffect } from 'react';
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
} from '@chakra-ui/react';
import { FiRefreshCw, FiClock, FiActivity } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useOperationFilters } from '../../hooks/useOperationFilters';
import { DashboardFilterBar } from '../shared/DashboardFilterBar';
import { KPICard } from './KPICard';
import { VolumeByC } from './VolumeByC';
import { OperationsByC } from './OperationsByC';
import { ClientsByC } from './ClientsByC';
import { VolumeChart } from './VolumeChart';
import { CurrencyDonut } from './CurrencyDonut';
import { ProductTrendCharts } from './ProductTrendCharts';
import { StatusBarChart } from './StatusBarChart';
import { TopClientsTable } from './TopClientsTable';
import { UserActivityTable } from './UserActivityTable';
import { ExpiryCountdown } from './ExpiryCountdown';
import { PeriodSummary } from './PeriodSummary';
import { GlobalCMXLogo } from './GlobalCMXLogo';
import { DashboardStoriesCarousel } from './DashboardStoriesCarousel';

export const BusinessDashboard = () => {
  const { t, i18n } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const { filters, setFilters, filterOptions, isOperator, activeAdvancedCount, activeSwiftCount } = useOperationFilters();

  const {
    data,
    loading,
    error,
    lastUpdated,
    refreshInterval,
    setRefreshInterval,
    refresh,
  } = useDashboardData({
    autoRefresh: true,
    refreshInterval: 300000,
    externalFilters: filters,
    externalFilterOptions: filterOptions,
  }); // 5 min default

  // Refresh interval options (in milliseconds, 0 = manual)
  const intervalOptions = [
    { value: 30000, labelKey: 'interval30s' },
    { value: 60000, labelKey: 'interval1m' },
    { value: 300000, labelKey: 'interval5m' },
    { value: 900000, labelKey: 'interval15m' },
    { value: 1800000, labelKey: 'interval30m' },
    { value: 0, labelKey: 'intervalManual' },
  ];

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
          {t('businessDashboard.loading')}
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

  return (
    <Box
      p={{ base: 3, md: 6, lg: 8 }}
      minH="100vh"
      bg={isDark
        ? 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)'
        : 'linear-gradient(180deg, #F8FAFC 0%, #E2E8F0 100%)'
      }
    >
      {/* Command Center Header */}
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
          bgGradient: 'linear(to-r, blue.400, cyan.400, teal.400)',
        }}
      >
        {/* Main Header Content */}
        <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
          {/* Left: Title Section */}
          <VStack align="start" gap={2}>
            <HStack gap={3} align="center">
              {/* GlobalCMX Logo */}
              <GlobalCMXLogo size={56} isDark={isDark} animated={true} />

              <VStack align="start" gap={0}>
                <Heading
                  size={{ base: 'xl', md: '2xl' }}
                  fontWeight="bold"
                  letterSpacing="tight"
                  bgGradient={isDark
                    ? 'linear(to-r, blue.300, cyan.300, teal.300)'
                    : 'linear(to-r, blue.600, cyan.600, teal.600)'
                  }
                  bgClip="text"
                >
                  {t('businessDashboard.title')}
                </Heading>
                <Text
                  fontSize={{ base: 'sm', md: 'md' }}
                  color={isDark ? 'gray.400' : 'gray.600'}
                  fontWeight="medium"
                >
                  {t('businessDashboard.subtitle')}
                </Text>
              </VStack>
            </HStack>

            {/* Tagline */}
            <Text
              fontSize="xs"
              color={isDark ? 'gray.500' : 'gray.500'}
              fontStyle="italic"
              pl={16}
            >
              {t('businessDashboard.headerTagline')}
            </Text>
          </VStack>

          {/* Right: Status & Controls */}
          <VStack align="end" gap={3}>
            {/* System Status Badge */}
            <HStack
              px={4}
              py={2}
              borderRadius="full"
              bg={isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)'}
              border="1px solid"
              borderColor={isDark ? 'green.500/40' : 'green.400/50'}
            >
              {/* Pulsing Green Dot */}
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
                {t('businessDashboard.systemOnline')}
              </Text>
              <FiActivity size={14} color="#22C55E" />
            </HStack>

            {/* Live Monitoring + Refresh Interval + Last Updated */}
            <HStack gap={2} flexWrap="wrap">
              {/* Live Indicator (only show if auto-refresh is active) */}
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
                    {t('businessDashboard.liveMonitoring')}
                  </Text>
                </HStack>
              )}

              {/* Refresh Interval Selector */}
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
                {intervalOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(`businessDashboard.${opt.labelKey}`)}
                  </option>
                ))}
              </select>

              {/* Last Updated */}
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

              {/* Refresh Button */}
              <IconButton
                aria-label={t('businessDashboard.refresh')}
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
        <Box
          mt={5}
          pt={4}
          borderTop="1px solid"
          borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
        >
          <DashboardFilterBar
            filters={filters}
            filterOptions={filterOptions}
            onFilterChange={setFilters}
            isOperator={isOperator}
            activeAdvancedCount={activeAdvancedCount}
            activeSwiftCount={activeSwiftCount}
          />
          {/* Period Badge */}
          <Badge
            px={3}
            py={1}
            borderRadius="full"
            colorPalette="blue"
            variant="subtle"
            fontSize="xs"
            mt={2}
            float="right"
          >
            {data.periodLabel}
          </Badge>
        </Box>
      </Box>

      {/* Dashboard Stories Carousel */}
      <DashboardStoriesCarousel />

      {/* KPI Cards */}
      <SimpleGrid
        columns={{ base: 2, md: 3, lg: 6 }}
        gap={{ base: 3, md: 4 }}
        mb={6}
      >
        {/* Volume by Currency Card */}
        <VolumeByC volumes={data.volumeByC || []} />
        <OperationsByC operations={data.operationsByC || []} />
        <ClientsByC clients={data.clientsByC || []} />
        <KPICard kpi={data.operationsToday} index={3} />
        <KPICard kpi={data.pendingApprovals} index={4} />
        <KPICard kpi={data.operationsWithAlerts} index={5} />
      </SimpleGrid>

      {/* Main Charts Row */}
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        gap={{ base: 4, md: 6 }}
        mb={6}
      >
        <VolumeChart
          data={data.volumeByProduct}
          filters={filters}
          productComparison={data.productComparison}
          availableCurrencies={data.currencyDistribution?.map(c => c.currency) || []}
        />
        <CurrencyDonut
          data={data.currencyDistribution}
          filters={filters}
          availableCurrencies={data.currencyDistribution?.map(c => c.currency) || []}
        />
      </SimpleGrid>

      {/* Product Trends - Operations & Volume by Product */}
      <Box mb={6}>
        <ProductTrendCharts
          data={data.volumeByProduct}
          filters={filters}
          availableCurrencies={data.currencyDistribution?.map(c => c.currency) || []}
        />
      </Box>

      {/* Status Distribution */}
      <Box mb={6}>
        <StatusBarChart
          data={data.productComparison}
          filters={filters}
          availableCurrencies={data.currencyDistribution?.map(c => c.currency) || []}
        />
      </Box>

      {/* Top Clients */}
      <Box mb={6}>
        <TopClientsTable
          data={data.topClients}
          limit={filters.topClientsLimit || 10}
          onLimitChange={(limit) => setFilters({ ...filters, topClientsLimit: limit })}
          filters={filters}
        />
      </Box>

      {/* Bottom Widgets Row */}
      <SimpleGrid
        columns={{ base: 1, md: 2, lg: 3 }}
        gap={{ base: 4, md: 6 }}
      >
        <UserActivityTable data={data.userActivity || { users: [], totalOperationsToday: 0, totalOperationsPeriod: 0, totalVolumePeriod: 0, totalActiveUsers: 0 }} />
        <ExpiryCountdown data={data.upcomingExpiries} />
        <PeriodSummary
          volumeByC={data.volumeByC || []}
          operationsByC={data.operationsByC || []}
          clientsByC={data.clientsByC || []}
          pendingApprovals={data.pendingApprovals}
          operationsWithAlerts={data.operationsWithAlerts}
          productComparison={data.productComparison}
          periodLabel={data.periodLabel}
        />
      </SimpleGrid>
    </Box>
  );
};

export default BusinessDashboard;
