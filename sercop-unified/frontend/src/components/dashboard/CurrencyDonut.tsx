/**
 * CurrencyDonut Component
 * Donut/Pie/Bar chart showing currency distribution
 * Features: Expandable view, Chart type selector, Local currency filter
 */

import { useState, useEffect } from 'react';
import { Box, Text, VStack, HStack, IconButton, Portal, Badge, Spinner, Menu } from '@chakra-ui/react';
import { FiMaximize2, FiMinimize2, FiX, FiFilter } from 'react-icons/fi';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { CurrencyDistribution, DashboardFilters } from '../../types/dashboard';
import { dashboardService } from '../../services/dashboardService';

type ChartType = 'donut' | 'pie' | 'bar';

interface CurrencyDonutProps {
  data: CurrencyDistribution[];
  filters?: DashboardFilters;
  availableCurrencies?: string[];
}

const renderActiveShape = (props: any, colors: any, isDark: boolean, isExpanded: boolean) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const fontSize = isExpanded ? { main: 28, sub: 16, small: 14 } : { main: 24, sub: 14, small: 12 };

  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill={colors.textColor} fontSize={fontSize.main} fontWeight="bold">
        {payload.currency}
      </text>
      <text x={cx} y={cy + 15} textAnchor="middle" fill={colors.textColor} fontSize={fontSize.sub}>
        {(percent * 100).toFixed(1)}%
      </text>
      <text x={cx} y={cy + 35} textAnchor="middle" fill={isDark ? '#94A3B8' : '#64748B'} fontSize={fontSize.small}>
        ${(value / 1000000).toFixed(1)}M
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        fill={fill}
      />
    </g>
  );
};

export const CurrencyDonut = ({ data, filters: dashboardFilters, availableCurrencies }: CurrencyDonutProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('donut');

  // Local currency filter state (affects only this section when main filter has no currency)
  const [localCurrency, setLocalCurrency] = useState<string>('');
  const [filteredData, setFilteredData] = useState<CurrencyDistribution[] | null>(null);
  const [loadingFiltered, setLoadingFiltered] = useState(false);

  // Determine if we should show local filter (only when main filter has no currency selected)
  const showLocalCurrencyFilter = !dashboardFilters?.currency;

  // Set default local currency to first available when currencies load (only if no main filter)
  useEffect(() => {
    if (showLocalCurrencyFilter && availableCurrencies && availableCurrencies.length > 0 && !localCurrency) {
      setLocalCurrency(availableCurrencies[0]);
    }
  }, [availableCurrencies, localCurrency, showLocalCurrencyFilter]);

  // Fetch filtered data when local currency changes (only when main filter has no currency)
  useEffect(() => {
    const fetchFilteredData = async () => {
      // If main filter has currency, use props data directly (no need to fetch)
      if (dashboardFilters?.currency) {
        setFilteredData(null);
        return;
      }

      // If no local currency selected yet, wait
      if (!localCurrency) {
        return;
      }

      setLoadingFiltered(true);
      try {
        const filteredSummary = await dashboardService.getDashboardSummary({
          ...dashboardFilters,
          currency: localCurrency,
        });
        setFilteredData(filteredSummary.currencyDistribution);
      } catch (error) {
        console.error('Error fetching filtered data:', error);
        setFilteredData(null);
      } finally {
        setLoadingFiltered(false);
      }
    };

    fetchFilteredData();
  }, [localCurrency, dashboardFilters?.period, dashboardFilters?.statusFilter, dashboardFilters?.currency, dashboardFilters?.beneficiary, dashboardFilters?.createdBy, dashboardFilters?.issuingBank, dashboardFilters?.advisingBank, dashboardFilters?.applicant, dashboardFilters?.swiftSearch, dashboardFilters?.swiftFreeText, dashboardFilters?.customFieldFilters]);

  // Use filtered data if available, otherwise use props data
  const activeData = filteredData || data;

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const chartTypes: { value: ChartType; label: string; icon: string }[] = [
    { value: 'donut', label: t('businessDashboard.chartTypes.donut', 'Dona'), icon: '🍩' },
    { value: 'pie', label: t('businessDashboard.chartTypes.pie', 'Pastel'), icon: '🥧' },
    { value: 'bar', label: t('businessDashboard.chartTypes.bar', 'Barras'), icon: '📊' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;

    const item = payload[0].payload;

    return (
      <Box
        bg={isDark ? 'gray.800' : 'white'}
        p={3}
        borderRadius="lg"
        boxShadow="lg"
        borderWidth="1px"
        borderColor={colors.borderColor}
      >
        <HStack mb={2}>
          <Box w={3} h={3} borderRadius="full" bg={item.color} />
          <Text fontWeight="bold" color={colors.textColor}>{item.currency}</Text>
        </HStack>
        <VStack align="start" gap={1}>
          <HStack justify="space-between" w="100%" gap={4}>
            <Text fontSize="sm" color={colors.textColor} opacity={0.7}>Monto:</Text>
            <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
              {formatAmount(item.amount)}
            </Text>
          </HStack>
          <HStack justify="space-between" w="100%" gap={4}>
            <Text fontSize="sm" color={colors.textColor} opacity={0.7}>Operaciones:</Text>
            <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
              {item.operationCount}
            </Text>
          </HStack>
          <HStack justify="space-between" w="100%" gap={4}>
            <Text fontSize="sm" color={colors.textColor} opacity={0.7}>Porcentaje:</Text>
            <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
              {item.percentage.toFixed(1)}%
            </Text>
          </HStack>
        </VStack>
      </Box>
    );
  };

  const renderChart = (expanded: boolean) => {
    const height = expanded ? '500px' : '250px';
    const innerRadius = expanded ? 80 : 60;
    const outerRadius = expanded ? 120 : 90;

    if (!activeData || activeData.length === 0) {
      return (
        <Box h={height} minH="200px" w="100%" display="flex" alignItems="center" justifyContent="center">
          <Text color={colors.textColor} opacity={0.5}>No hay datos disponibles</Text>
        </Box>
      );
    }

    if (chartType === 'bar') {
      return (
        <Box h={height} minH="200px" w="100%" position="relative">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 1, height: 1 }}>
            <BarChart
              data={activeData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                horizontal={true}
                vertical={false}
              />
              <XAxis
                type="number"
                tickFormatter={formatAmount}
                tick={{ fill: colors.textColor, fontSize: expanded ? 14 : 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="currency"
                tick={{ fill: colors.textColor, fontSize: expanded ? 14 : 12 }}
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={expanded ? 40 : 30}>
                {activeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      );
    }

    return (
      <Box h={height} minH="200px" w="100%" position="relative">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 1, height: 1 }}>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={(props: any) => renderActiveShape(props, colors, isDark, expanded)}
              data={activeData}
              cx="50%"
              cy="50%"
              innerRadius={chartType === 'donut' ? innerRadius : 0}
              outerRadius={outerRadius}
              dataKey="amount"
              onMouseEnter={onPieEnter}
            >
              {activeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const ChartContent = ({ expanded = false }: { expanded?: boolean }) => (
    <Box
      p={expanded ? 8 : 5}
      borderRadius="xl"
      bg={isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)'}
      backdropFilter="blur(10px)"
      borderWidth="1px"
      borderColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
      boxShadow={isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'}
      h={expanded ? 'auto' : 'auto'}
      minH={expanded ? '600px' : 'auto'}
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <HStack justify="space-between" mb={4}>
        <HStack gap={3}>
          <Text fontSize={expanded ? 'xl' : 'lg'} fontWeight="bold" color={colors.textColor}>
            {t('businessDashboard.currencyDistribution')}
          </Text>
          {/* Currency Filter - Only show when main filter has no currency selected */}
          {showLocalCurrencyFilter && availableCurrencies && availableCurrencies.length > 0 && (
            <HStack gap={2}>
              {loadingFiltered && <Spinner size="xs" color={colors.primaryColor} />}
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Box
                    as="button"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    px={3}
                    py={1.5}
                    borderRadius="lg"
                    bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
                    color={colors.textColor}
                    fontSize="sm"
                    fontWeight="medium"
                    _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
                    transition="all 0.2s"
                  >
                    <FiFilter size={14} />
                    {localCurrency || t('businessDashboard.selectCurrency', 'Moneda')}
                  </Box>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content
                    bg={isDark ? 'gray.800' : 'white'}
                    borderColor={colors.borderColor}
                    boxShadow="lg"
                    borderRadius="lg"
                    py={1}
                    minW="120px"
                  >
                    {availableCurrencies.map((currency) => (
                      <Menu.Item
                        key={currency}
                        value={currency}
                        onClick={() => setLocalCurrency(currency)}
                        bg={localCurrency === currency ? (isDark ? 'whiteAlpha.200' : 'blue.50') : 'transparent'}
                        color={colors.textColor}
                        _hover={{ bg: isDark ? 'whiteAlpha.100' : 'gray.100' }}
                        fontWeight={localCurrency === currency ? 'semibold' : 'normal'}
                      >
                        {currency}
                      </Menu.Item>
                    ))}
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            </HStack>
          )}

          {/* Show currency badge when main filter has currency selected */}
          {dashboardFilters?.currency && (
            <Badge colorPalette="blue" variant="subtle" px={2} py={1}>
              {dashboardFilters.currency}
            </Badge>
          )}
        </HStack>

        <HStack gap={2}>
          {/* Chart Type Selector */}
          <HStack
            bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
            borderRadius="lg"
            p={1}
            gap={0}
          >
            {chartTypes.map((type) => (
              <Box
                key={type.value}
                as="button"
                px={3}
                py={1.5}
                borderRadius="md"
                fontSize="sm"
                fontWeight={chartType === type.value ? 'semibold' : 'normal'}
                bg={chartType === type.value
                  ? (isDark ? 'blue.500' : 'blue.500')
                  : 'transparent'
                }
                color={chartType === type.value
                  ? 'white'
                  : colors.textColor
                }
                opacity={chartType === type.value ? 1 : 0.7}
                _hover={{
                  bg: chartType === type.value
                    ? (isDark ? 'blue.600' : 'blue.600')
                    : (isDark ? 'whiteAlpha.200' : 'blackAlpha.100'),
                  opacity: 1,
                }}
                transition="all 0.2s"
                onClick={() => setChartType(type.value)}
                title={type.label}
              >
                {type.icon} {expanded && type.label}
              </Box>
            ))}
          </HStack>

          {/* Expand/Collapse Button */}
          <IconButton
            aria-label={expanded ? t('common.collapse', 'Colapsar') : t('common.expand', 'Expandir')}
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!expanded)}
            color={colors.textColor}
            _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
          >
            {expanded ? <FiMinimize2 /> : <FiMaximize2 />}
          </IconButton>

          {/* Close button only in expanded mode */}
          {expanded && (
            <IconButton
              aria-label={t('common.close', 'Cerrar')}
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              color={colors.textColor}
              _hover={{ bg: 'red.500', color: 'white' }}
            >
              <FiX />
            </IconButton>
          )}
        </HStack>
      </HStack>

      {/* Chart */}
      <Box flex="1" minH="200px" w="100%" position="relative">
        {renderChart(expanded)}
      </Box>

      {/* Legend */}
      <VStack gap={2} mt={4}>
        {activeData.slice(0, expanded ? activeData.length : 4).map((item) => (
          <HStack key={item.currency} w="100%" justify="space-between">
            <HStack>
              <Box w={3} h={3} borderRadius="full" bg={item.color} />
              <Text fontSize="sm" color={colors.textColor}>{item.currency}</Text>
            </HStack>
            <HStack gap={3}>
              <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
                {item.operationCount} ops
              </Text>
              <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                {formatAmount(item.amount)}
              </Text>
            </HStack>
          </HStack>
        ))}
      </VStack>
    </Box>
  );

  return (
    <>
      {/* Normal View */}
      <ChartContent expanded={false} />

      {/* Expanded Modal View */}
      {isExpanded && (
        <Portal>
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg={isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)'}
            zIndex={1000}
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={{ base: 4, md: 8 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsExpanded(false);
            }}
          >
            <Box
              w="100%"
              maxW="1000px"
              minH={{ base: '600px', md: '600px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <ChartContent expanded={true} />
            </Box>
          </Box>
        </Portal>
      )}
    </>
  );
};

export default CurrencyDonut;
