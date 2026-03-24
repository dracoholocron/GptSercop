/**
 * ProductTrendCharts Component
 * Two charts: Operations count by product and Volume by product
 * Features: Local currency filter (when main filter has no currency selected)
 */

import { useState, useEffect } from 'react';
import { Box, Text, HStack, VStack, IconButton, Portal, Badge, Flex, Spinner, Menu } from '@chakra-ui/react';
import { FiMaximize2, FiX, FiFilter, FiBarChart2, FiBox } from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { VolumeByProduct, DashboardFilters } from '../../types/dashboard';
import { dashboardService } from '../../services/dashboardService';

interface ProductTrendChartsProps {
  data: VolumeByProduct[];
  filters?: DashboardFilters;
  availableCurrencies?: string[];
}

const PRODUCT_COLORS = {
  lcImport: '#3B82F6',
  lcExport: '#10B981',
  guarantee: '#8B5CF6',
  collection: '#F59E0B',
};

export const ProductTrendCharts = ({ data, filters: dashboardFilters, availableCurrencies }: ProductTrendChartsProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const [expandedChart, setExpandedChart] = useState<'count' | 'volume' | null>(null);
  const [is3DView, setIs3DView] = useState(false);

  // Local currency filter state (affects only this section when main filter has no currency)
  const [localCurrency, setLocalCurrency] = useState<string>('');
  const [filteredData, setFilteredData] = useState<VolumeByProduct[] | null>(null);
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
        setFilteredData(filteredSummary.volumeByProduct);
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

  const formatVolume = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const productLabels = {
    lcImport: t('businessDashboard.lcImport', 'LC Import'),
    lcExport: t('businessDashboard.lcExport', 'LC Export'),
    guarantee: t('businessDashboard.guarantees', 'Garantías'),
    collection: t('businessDashboard.collections', 'Cobranzas'),
  };

  const containerStyles = {
    p: 5,
    borderRadius: 'xl',
    bg: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    borderWidth: '1px',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
  };

  const CountTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <Box
        bg={isDark ? 'gray.800' : 'white'}
        p={3}
        borderRadius="lg"
        boxShadow="lg"
        borderWidth="1px"
        borderColor={colors.borderColor}
      >
        <Text fontWeight="bold" mb={2} color={colors.textColor}>{label}</Text>
        {payload.map((entry: any, index: number) => (
          <HStack key={`count-${entry.name || entry.dataKey || index}`} justify="space-between" gap={4}>
            <HStack>
              <Box w={3} h={3} borderRadius="sm" bg={entry.color} />
              <Text fontSize="sm" color={colors.textColor}>{entry.name}:</Text>
            </HStack>
            <Text fontSize="sm" fontWeight="bold" color={colors.textColor}>
              {entry.value} ops
            </Text>
          </HStack>
        ))}
      </Box>
    );
  };

  const VolumeTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <Box
        bg={isDark ? 'gray.800' : 'white'}
        p={3}
        borderRadius="lg"
        boxShadow="lg"
        borderWidth="1px"
        borderColor={colors.borderColor}
      >
        <Text fontWeight="bold" mb={2} color={colors.textColor}>{label}</Text>
        {payload.map((entry: any, index: number) => (
          <HStack key={`volume-${entry.name || entry.dataKey || index}`} justify="space-between" gap={4}>
            <HStack>
              <Box w={3} h={3} borderRadius="sm" bg={entry.color} />
              <Text fontSize="sm" color={colors.textColor}>{entry.name}:</Text>
            </HStack>
            <Text fontSize="sm" fontWeight="bold" color={colors.textColor}>
              {formatVolume(entry.value)}
            </Text>
          </HStack>
        ))}
      </Box>
    );
  };

  const renderLegend = () => (
    <HStack gap={4} justify="center" flexWrap="wrap">
      {Object.entries(productLabels).map(([key, label]) => (
        <HStack key={key} gap={1}>
          <Box w={3} h={3} borderRadius="sm" bg={PRODUCT_COLORS[key as keyof typeof PRODUCT_COLORS]} />
          <Text fontSize="xs" color={colors.textColor}>{label}</Text>
        </HStack>
      ))}
    </HStack>
  );

  const renderCountChart = (height: string, expanded: boolean = false) => {
    if (!activeData || activeData.length === 0) {
      return (
        <Box h={height} minH="200px" w="100%" display="flex" alignItems="center" justifyContent="center">
          <Text color={colors.textColor} opacity={0.5}>No hay datos disponibles</Text>
        </Box>
      );
    }
    return (
      <Box h={height} minH="200px" w="100%" position="relative">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 1, height: 1 }}>
        <BarChart
          data={activeData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            vertical={false}
          />
          <XAxis
            dataKey="periodLabel"
            tick={{ fill: colors.textColor, fontSize: expanded ? 14 : 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: colors.textColor, fontSize: expanded ? 14 : 11 }}
            tickLine={false}
            axisLine={false}
            width={expanded ? 50 : 35}
          />
          <Tooltip content={<CountTooltip />} />
          <Bar dataKey="lcImportCount" name={productLabels.lcImport} stackId="a" fill={PRODUCT_COLORS.lcImport} radius={[0, 0, 0, 0]} />
          <Bar dataKey="lcExportCount" name={productLabels.lcExport} stackId="a" fill={PRODUCT_COLORS.lcExport} radius={[0, 0, 0, 0]} />
          <Bar dataKey="guaranteeCount" name={productLabels.guarantee} stackId="a" fill={PRODUCT_COLORS.guarantee} radius={[0, 0, 0, 0]} />
          <Bar dataKey="collectionCount" name={productLabels.collection} stackId="a" fill={PRODUCT_COLORS.collection} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      </Box>
    );
  };

  const renderVolumeChart = (height: string, expanded: boolean = false) => {
    if (!activeData || activeData.length === 0) {
      return (
        <Box h={height} minH="200px" w="100%" display="flex" alignItems="center" justifyContent="center">
          <Text color={colors.textColor} opacity={0.5}>No hay datos disponibles</Text>
        </Box>
      );
    }
    return (
      <Box h={height} minH="200px" w="100%" position="relative">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 1, height: 1 }}>
        <BarChart
          data={activeData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            vertical={false}
          />
          <XAxis
            dataKey="periodLabel"
            tick={{ fill: colors.textColor, fontSize: expanded ? 14 : 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatVolume}
            tick={{ fill: colors.textColor, fontSize: expanded ? 14 : 11 }}
            tickLine={false}
            axisLine={false}
            width={expanded ? 70 : 50}
          />
          <Tooltip content={<VolumeTooltip />} />
          <Bar dataKey="lcImport" name={productLabels.lcImport} stackId="a" fill={PRODUCT_COLORS.lcImport} radius={[0, 0, 0, 0]} />
          <Bar dataKey="lcExport" name={productLabels.lcExport} stackId="a" fill={PRODUCT_COLORS.lcExport} radius={[0, 0, 0, 0]} />
          <Bar dataKey="guarantee" name={productLabels.guarantee} stackId="a" fill={PRODUCT_COLORS.guarantee} radius={[0, 0, 0, 0]} />
          <Bar dataKey="collection" name={productLabels.collection} stackId="a" fill={PRODUCT_COLORS.collection} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      </Box>
    );
  };

  // Calculate totals for summary
  const totals = activeData.reduce(
    (acc, item) => ({
      lcImportCount: acc.lcImportCount + item.lcImportCount,
      lcExportCount: acc.lcExportCount + item.lcExportCount,
      guaranteeCount: acc.guaranteeCount + item.guaranteeCount,
      collectionCount: acc.collectionCount + item.collectionCount,
      lcImport: acc.lcImport + item.lcImport,
      lcExport: acc.lcExport + item.lcExport,
      guarantee: acc.guarantee + item.guarantee,
      collection: acc.collection + item.collection,
    }),
    { lcImportCount: 0, lcExportCount: 0, guaranteeCount: 0, collectionCount: 0, lcImport: 0, lcExport: 0, guarantee: 0, collection: 0 }
  );

  const totalOps = totals.lcImportCount + totals.lcExportCount + totals.guaranteeCount + totals.collectionCount;
  const totalVolume = totals.lcImport + totals.lcExport + totals.guarantee + totals.collection;

  return (
    <>
      <VStack gap={4} align="stretch">
        {/* Operations Count Chart */}
        <Box {...containerStyles}>
          <Flex justify="space-between" align="center" mb={3}>
            <HStack gap={3}>
              <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
                {t('businessDashboard.operationsByProduct', 'Operaciones por Producto')}
              </Text>
              <Badge colorPalette="blue" variant="subtle">
                {totalOps} {t('businessDashboard.total', 'total')}
              </Badge>

              {/* 2D/3D Toggle */}
              <HStack
                bg={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'}
                borderRadius="full"
                p={1}
                gap={0}
              >
                <Box
                  as="button"
                  px={3}
                  py={1}
                  borderRadius="full"
                  bg={!is3DView ? 'blue.500' : 'transparent'}
                  color={!is3DView ? 'white' : colors.textColorSecondary}
                  fontWeight="semibold"
                  fontSize="xs"
                  cursor="pointer"
                  transition="all 0.2s"
                  display="flex"
                  alignItems="center"
                  gap={1}
                  _hover={{ bg: !is3DView ? 'blue.600' : isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
                  onClick={() => setIs3DView(false)}
                >
                  <FiBarChart2 size={12} />
                  2D
                </Box>
                <Box
                  as="button"
                  px={3}
                  py={1}
                  borderRadius="full"
                  bg={is3DView ? 'purple.500' : 'transparent'}
                  color={is3DView ? 'white' : colors.textColorSecondary}
                  fontWeight="semibold"
                  fontSize="xs"
                  cursor="pointer"
                  transition="all 0.2s"
                  display="flex"
                  alignItems="center"
                  gap={1}
                  _hover={{ bg: is3DView ? 'purple.600' : isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
                  onClick={() => setIs3DView(true)}
                >
                  <FiBox size={12} />
                  3D
                </Box>
              </HStack>

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
                <Badge colorPalette="cyan" variant="subtle" px={2} py={1}>
                  {dashboardFilters.currency}
                </Badge>
              )}
            </HStack>
            <IconButton
              aria-label={t('common.expand', 'Expandir')}
              size="sm"
              variant="ghost"
              bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
              _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
              onClick={() => setExpandedChart('count')}
            >
              <FiMaximize2 />
            </IconButton>
          </Flex>
          {renderLegend()}
          {is3DView ? (
            /* 3D View - X: Time, Y: Count, Z: Products */
            <Box h="280px" position="relative" style={{ perspective: '1000px' }} overflow="auto">
              <Box
                position="relative"
                h="100%"
                minW={`${activeData.length * 55 + 100}px`}
                pt={4}
                pl={12}
                style={{ transformStyle: 'preserve-3d', transform: 'rotateX(-15deg) rotateY(-20deg)' }}
              >
                {/* Product rows (Z-axis) */}
                {[
                  { key: 'lcImportCount', label: productLabels.lcImport, color: PRODUCT_COLORS.lcImport, zIndex: 0 },
                  { key: 'lcExportCount', label: productLabels.lcExport, color: PRODUCT_COLORS.lcExport, zIndex: 1 },
                  { key: 'guaranteeCount', label: productLabels.guarantee, color: PRODUCT_COLORS.guarantee, zIndex: 2 },
                  { key: 'collectionCount', label: productLabels.collection, color: PRODUCT_COLORS.collection, zIndex: 3 },
                ].map((product, productIdx) => {
                  const maxCount = Math.max(...activeData.flatMap(d => [d.lcImportCount, d.lcExportCount, d.guaranteeCount, d.collectionCount]), 1);
                  const zOffset = productIdx * 35;

                  return (
                    <Flex
                      key={product.key}
                      position="absolute"
                      left="60px"
                      bottom="40px"
                      align="flex-end"
                      gap={1}
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: `translateZ(${-zOffset}px)`,
                      }}
                    >
                      {/* Product label on Z-axis */}
                      <Text
                        position="absolute"
                        left="-60px"
                        bottom="0"
                        fontSize="9px"
                        fontWeight="bold"
                        color={product.color}
                        whiteSpace="nowrap"
                        style={{ transform: 'rotateY(20deg)' }}
                      >
                        {product.label}
                      </Text>

                      {/* Bars for each time period (X-axis) */}
                      {activeData.map((item, idx) => {
                        const value = item[product.key as keyof typeof item] as number || 0;
                        const heightPercent = (value / maxCount) * 100;
                        const barHeight = Math.max(5, (heightPercent / 100) * 120);

                        return (
                          <VStack key={idx} gap={0} align="center" w="45px">
                            {/* Value label */}
                            {value > 0 && (
                              <Text fontSize="7px" fontWeight="bold" color={product.color} mb={1}>
                                {value}
                              </Text>
                            )}
                            {/* 3D Bar */}
                            <Box
                              position="relative"
                              w="20px"
                              h={`${barHeight}px`}
                              style={{ transformStyle: 'preserve-3d' }}
                              transition="all 0.2s"
                              _hover={{ transform: 'scale(1.15)' }}
                              cursor="pointer"
                              title={`${product.label}: ${value} - ${item.periodLabel}`}
                            >
                              {/* Front face */}
                              <Box
                                position="absolute"
                                w="100%"
                                h="100%"
                                borderRadius="2px"
                                style={{
                                  transform: 'translateZ(10px)',
                                  background: `linear-gradient(to top, ${product.color}CC, ${product.color})`,
                                  boxShadow: `0 2px 8px ${product.color}50`
                                }}
                              />
                              {/* Top face */}
                              <Box
                                position="absolute"
                                w="100%"
                                h="20px"
                                borderRadius="2px"
                                style={{
                                  transform: 'rotateX(90deg) translateZ(-10px)',
                                  background: product.color,
                                  opacity: 0.85
                                }}
                              />
                              {/* Right face */}
                              <Box
                                position="absolute"
                                w="20px"
                                h="100%"
                                right="-10px"
                                borderRadius="2px"
                                style={{
                                  transform: 'rotateY(90deg)',
                                  background: `${product.color}99`,
                                }}
                              />
                            </Box>
                            {/* Date label (only on first product row) */}
                            {productIdx === 3 && (
                              <Text
                                fontSize="7px"
                                color={colors.textColorSecondary}
                                mt={1}
                                whiteSpace="nowrap"
                                style={{ transform: 'rotateX(15deg)' }}
                              >
                                {item.periodLabel}
                              </Text>
                            )}
                          </VStack>
                        );
                      })}
                    </Flex>
                  );
                })}

                {/* Floor grid */}
                <Box
                  position="absolute"
                  left="50px"
                  bottom="30px"
                  w={`${activeData.length * 45 + 20}px`}
                  h="150px"
                  style={{
                    transform: 'rotateX(90deg) translateZ(-5px)',
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.3) 100%)'
                      : 'linear-gradient(135deg, rgba(241,245,249,0.8) 0%, rgba(226,232,240,0.5) 100%)',
                    borderRadius: '4px',
                  }}
                />
              </Box>
            </Box>
          ) : (
            renderCountChart('200px')
          )}
        </Box>

        {/* Volume Chart */}
        <Box {...containerStyles}>
          <Flex justify="space-between" align="center" mb={3}>
            <HStack gap={3}>
              <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
                {t('businessDashboard.volumeByProduct', 'Volumen por Producto')}
              </Text>
              <Badge colorPalette="green" variant="subtle">
                {formatVolume(totalVolume)}
              </Badge>

              {/* 2D/3D Toggle for Volume */}
              <HStack
                bg={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'}
                borderRadius="full"
                p={1}
                gap={0}
              >
                <Box
                  as="button"
                  px={3}
                  py={1}
                  borderRadius="full"
                  bg={!is3DView ? 'green.500' : 'transparent'}
                  color={!is3DView ? 'white' : colors.textColorSecondary}
                  fontWeight="semibold"
                  fontSize="xs"
                  cursor="pointer"
                  transition="all 0.2s"
                  display="flex"
                  alignItems="center"
                  gap={1}
                  _hover={{ bg: !is3DView ? 'green.600' : isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
                  onClick={() => setIs3DView(false)}
                >
                  <FiBarChart2 size={12} />
                  2D
                </Box>
                <Box
                  as="button"
                  px={3}
                  py={1}
                  borderRadius="full"
                  bg={is3DView ? 'purple.500' : 'transparent'}
                  color={is3DView ? 'white' : colors.textColorSecondary}
                  fontWeight="semibold"
                  fontSize="xs"
                  cursor="pointer"
                  transition="all 0.2s"
                  display="flex"
                  alignItems="center"
                  gap={1}
                  _hover={{ bg: is3DView ? 'purple.600' : isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
                  onClick={() => setIs3DView(true)}
                >
                  <FiBox size={12} />
                  3D
                </Box>
              </HStack>

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
                <Badge colorPalette="cyan" variant="subtle" px={2} py={1}>
                  {dashboardFilters.currency}
                </Badge>
              )}
            </HStack>
            <IconButton
              aria-label={t('common.expand', 'Expandir')}
              size="sm"
              variant="ghost"
              bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
              _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
              onClick={() => setExpandedChart('volume')}
            >
              <FiMaximize2 />
            </IconButton>
          </Flex>
          {renderLegend()}
          {is3DView ? (
            /* 3D View for Volume - X: Time, Y: Volume, Z: Products */
            <Box h="280px" position="relative" style={{ perspective: '1000px' }} overflow="auto">
              <Box
                position="relative"
                h="100%"
                minW={`${activeData.length * 55 + 100}px`}
                pt={4}
                pl={12}
                style={{ transformStyle: 'preserve-3d', transform: 'rotateX(-15deg) rotateY(-20deg)' }}
              >
                {/* Product rows (Z-axis) */}
                {[
                  { key: 'lcImport', label: productLabels.lcImport, color: PRODUCT_COLORS.lcImport, zIndex: 0 },
                  { key: 'lcExport', label: productLabels.lcExport, color: PRODUCT_COLORS.lcExport, zIndex: 1 },
                  { key: 'guarantee', label: productLabels.guarantee, color: PRODUCT_COLORS.guarantee, zIndex: 2 },
                  { key: 'collection', label: productLabels.collection, color: PRODUCT_COLORS.collection, zIndex: 3 },
                ].map((product, productIdx) => {
                  const maxVolume = Math.max(...activeData.flatMap(d => [d.lcImport, d.lcExport, d.guarantee, d.collection]), 1);
                  const zOffset = productIdx * 35;

                  return (
                    <Flex
                      key={product.key}
                      position="absolute"
                      left="60px"
                      bottom="40px"
                      align="flex-end"
                      gap={1}
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: `translateZ(${-zOffset}px)`,
                      }}
                    >
                      {/* Product label on Z-axis */}
                      <Text
                        position="absolute"
                        left="-60px"
                        bottom="0"
                        fontSize="9px"
                        fontWeight="bold"
                        color={product.color}
                        whiteSpace="nowrap"
                        style={{ transform: 'rotateY(20deg)' }}
                      >
                        {product.label}
                      </Text>

                      {/* Bars for each time period (X-axis) */}
                      {activeData.map((item, idx) => {
                        const value = item[product.key as keyof typeof item] as number || 0;
                        const heightPercent = (value / maxVolume) * 100;
                        const barHeight = Math.max(5, (heightPercent / 100) * 120);

                        return (
                          <VStack key={idx} gap={0} align="center" w="45px">
                            {/* Value label */}
                            {value > 0 && (
                              <Text fontSize="7px" fontWeight="bold" color={product.color} mb={1}>
                                {formatVolume(value)}
                              </Text>
                            )}
                            {/* 3D Bar */}
                            <Box
                              position="relative"
                              w="20px"
                              h={`${barHeight}px`}
                              style={{ transformStyle: 'preserve-3d' }}
                              transition="all 0.2s"
                              _hover={{ transform: 'scale(1.15)' }}
                              cursor="pointer"
                              title={`${product.label}: ${formatVolume(value)} - ${item.periodLabel}`}
                            >
                              {/* Front face */}
                              <Box
                                position="absolute"
                                w="100%"
                                h="100%"
                                borderRadius="2px"
                                style={{
                                  transform: 'translateZ(10px)',
                                  background: `linear-gradient(to top, ${product.color}CC, ${product.color})`,
                                  boxShadow: `0 2px 8px ${product.color}50`
                                }}
                              />
                              {/* Top face */}
                              <Box
                                position="absolute"
                                w="100%"
                                h="20px"
                                borderRadius="2px"
                                style={{
                                  transform: 'rotateX(90deg) translateZ(-10px)',
                                  background: product.color,
                                  opacity: 0.85
                                }}
                              />
                              {/* Right face */}
                              <Box
                                position="absolute"
                                w="20px"
                                h="100%"
                                right="-10px"
                                borderRadius="2px"
                                style={{
                                  transform: 'rotateY(90deg)',
                                  background: `${product.color}99`,
                                }}
                              />
                            </Box>
                            {/* Date label (only on last product row) */}
                            {productIdx === 3 && (
                              <Text
                                fontSize="7px"
                                color={colors.textColorSecondary}
                                mt={1}
                                whiteSpace="nowrap"
                                style={{ transform: 'rotateX(15deg)' }}
                              >
                                {item.periodLabel}
                              </Text>
                            )}
                          </VStack>
                        );
                      })}
                    </Flex>
                  );
                })}

                {/* Floor grid */}
                <Box
                  position="absolute"
                  left="50px"
                  bottom="30px"
                  w={`${activeData.length * 45 + 20}px`}
                  h="150px"
                  style={{
                    transform: 'rotateX(90deg) translateZ(-5px)',
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.3) 100%)'
                      : 'linear-gradient(135deg, rgba(241,245,249,0.8) 0%, rgba(226,232,240,0.5) 100%)',
                    borderRadius: '4px',
                  }}
                />
              </Box>
            </Box>
          ) : (
            renderVolumeChart('200px')
          )}
        </Box>
      </VStack>

      {/* Expanded Modal */}
      {expandedChart && (
        <Portal>
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg={isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)'}
            zIndex={1000}
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={4}
            onClick={() => setExpandedChart(null)}
          >
            <Box
              {...containerStyles}
              bg={isDark ? 'gray.900' : 'white'}
              maxW="1400px"
              w="100%"
              maxH="90vh"
              p={6}
              overflow="auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Flex justify="space-between" align="center" mb={4}>
                <HStack gap={4}>
                  <Text fontSize="xl" fontWeight="bold" color={colors.textColor}>
                    {expandedChart === 'count'
                      ? t('businessDashboard.operationsByProduct', 'Operaciones por Producto')
                      : t('businessDashboard.volumeByProduct', 'Volumen por Producto')}
                  </Text>
                  <Badge colorPalette={expandedChart === 'count' ? 'blue' : 'green'} variant="subtle" fontSize="md">
                    {expandedChart === 'count' ? `${totalOps} total` : formatVolume(totalVolume)}
                  </Badge>

                  {/* 2D/3D Toggle in Modal */}
                  <HStack
                    bg={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'}
                    borderRadius="full"
                    p={1}
                    gap={0}
                  >
                    <Box
                      as="button"
                      px={4}
                      py={2}
                      borderRadius="full"
                      bg={!is3DView ? (expandedChart === 'count' ? 'blue.500' : 'green.500') : 'transparent'}
                      color={!is3DView ? 'white' : colors.textColorSecondary}
                      fontWeight="semibold"
                      fontSize="sm"
                      cursor="pointer"
                      transition="all 0.2s"
                      display="flex"
                      alignItems="center"
                      gap={2}
                      _hover={{ bg: !is3DView ? (expandedChart === 'count' ? 'blue.600' : 'green.600') : isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
                      onClick={() => setIs3DView(false)}
                    >
                      <FiBarChart2 size={16} />
                      2D
                    </Box>
                    <Box
                      as="button"
                      px={4}
                      py={2}
                      borderRadius="full"
                      bg={is3DView ? 'purple.500' : 'transparent'}
                      color={is3DView ? 'white' : colors.textColorSecondary}
                      fontWeight="semibold"
                      fontSize="sm"
                      cursor="pointer"
                      transition="all 0.2s"
                      display="flex"
                      alignItems="center"
                      gap={2}
                      _hover={{ bg: is3DView ? 'purple.600' : isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
                      onClick={() => setIs3DView(true)}
                    >
                      <FiBox size={16} />
                      3D
                    </Box>
                  </HStack>
                </HStack>
                <IconButton
                  aria-label={t('common.close', 'Cerrar')}
                  size="md"
                  variant="ghost"
                  bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
                  _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
                  onClick={() => setExpandedChart(null)}
                >
                  <FiX />
                </IconButton>
              </Flex>

              {renderLegend()}

              <Box mt={4}>
                {is3DView ? (
                  /* Expanded 3D View */
                  <Box h="450px" position="relative" style={{ perspective: '1200px' }} overflow="auto">
                    <Box
                      position="relative"
                      h="100%"
                      minW={`${activeData.length * 70 + 150}px`}
                      pt={6}
                      pl={16}
                      style={{ transformStyle: 'preserve-3d', transform: 'rotateX(-12deg) rotateY(-15deg)' }}
                    >
                      {/* Product rows (Z-axis) */}
                      {(expandedChart === 'count' ? [
                        { key: 'lcImportCount', label: productLabels.lcImport, color: PRODUCT_COLORS.lcImport },
                        { key: 'lcExportCount', label: productLabels.lcExport, color: PRODUCT_COLORS.lcExport },
                        { key: 'guaranteeCount', label: productLabels.guarantee, color: PRODUCT_COLORS.guarantee },
                        { key: 'collectionCount', label: productLabels.collection, color: PRODUCT_COLORS.collection },
                      ] : [
                        { key: 'lcImport', label: productLabels.lcImport, color: PRODUCT_COLORS.lcImport },
                        { key: 'lcExport', label: productLabels.lcExport, color: PRODUCT_COLORS.lcExport },
                        { key: 'guarantee', label: productLabels.guarantee, color: PRODUCT_COLORS.guarantee },
                        { key: 'collection', label: productLabels.collection, color: PRODUCT_COLORS.collection },
                      ]).map((product, productIdx) => {
                        const maxValue = expandedChart === 'count'
                          ? Math.max(...activeData.flatMap(d => [d.lcImportCount, d.lcExportCount, d.guaranteeCount, d.collectionCount]), 1)
                          : Math.max(...activeData.flatMap(d => [d.lcImport, d.lcExport, d.guarantee, d.collection]), 1);
                        const zOffset = productIdx * 50;

                        return (
                          <Flex
                            key={product.key}
                            position="absolute"
                            left="80px"
                            bottom="60px"
                            align="flex-end"
                            gap={2}
                            style={{
                              transformStyle: 'preserve-3d',
                              transform: `translateZ(${-zOffset}px)`,
                            }}
                          >
                            {/* Product label on Z-axis */}
                            <Text
                              position="absolute"
                              left="-80px"
                              bottom="0"
                              fontSize="sm"
                              fontWeight="bold"
                              color={product.color}
                              whiteSpace="nowrap"
                              style={{ transform: 'rotateY(15deg)' }}
                            >
                              {product.label}
                            </Text>

                            {/* Bars for each time period (X-axis) */}
                            {activeData.map((item, idx) => {
                              const value = item[product.key as keyof typeof item] as number || 0;
                              const heightPercent = (value / maxValue) * 100;
                              const barHeight = Math.max(8, (heightPercent / 100) * 200);

                              return (
                                <VStack key={idx} gap={0} align="center" w="60px">
                                  {/* Value label */}
                                  {value > 0 && (
                                    <Text fontSize="10px" fontWeight="bold" color={product.color} mb={1}>
                                      {expandedChart === 'count' ? value : formatVolume(value)}
                                    </Text>
                                  )}
                                  {/* 3D Bar */}
                                  <Box
                                    position="relative"
                                    w="30px"
                                    h={`${barHeight}px`}
                                    style={{ transformStyle: 'preserve-3d' }}
                                    transition="all 0.2s"
                                    _hover={{ transform: 'scale(1.1)' }}
                                    cursor="pointer"
                                    title={`${product.label}: ${expandedChart === 'count' ? value : formatVolume(value)} - ${item.periodLabel}`}
                                  >
                                    {/* Front face */}
                                    <Box
                                      position="absolute"
                                      w="100%"
                                      h="100%"
                                      borderRadius="3px"
                                      style={{
                                        transform: 'translateZ(15px)',
                                        background: `linear-gradient(to top, ${product.color}CC, ${product.color})`,
                                        boxShadow: `0 3px 12px ${product.color}50`
                                      }}
                                    />
                                    {/* Top face */}
                                    <Box
                                      position="absolute"
                                      w="100%"
                                      h="30px"
                                      borderRadius="3px"
                                      style={{
                                        transform: 'rotateX(90deg) translateZ(-15px)',
                                        background: product.color,
                                        opacity: 0.85
                                      }}
                                    />
                                    {/* Right face */}
                                    <Box
                                      position="absolute"
                                      w="30px"
                                      h="100%"
                                      right="-15px"
                                      borderRadius="3px"
                                      style={{
                                        transform: 'rotateY(90deg)',
                                        background: `${product.color}99`,
                                      }}
                                    />
                                  </Box>
                                  {/* Date label (only on last product row) */}
                                  {productIdx === 3 && (
                                    <Text
                                      fontSize="9px"
                                      color={colors.textColorSecondary}
                                      mt={2}
                                      whiteSpace="nowrap"
                                      style={{ transform: 'rotateX(12deg)' }}
                                    >
                                      {item.periodLabel}
                                    </Text>
                                  )}
                                </VStack>
                              );
                            })}
                          </Flex>
                        );
                      })}

                      {/* Floor grid */}
                      <Box
                        position="absolute"
                        left="70px"
                        bottom="50px"
                        w={`${activeData.length * 60 + 30}px`}
                        h="220px"
                        style={{
                          transform: 'rotateX(90deg) translateZ(-5px)',
                          background: isDark
                            ? 'linear-gradient(135deg, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.3) 100%)'
                            : 'linear-gradient(135deg, rgba(241,245,249,0.8) 0%, rgba(226,232,240,0.5) 100%)',
                          borderRadius: '6px',
                        }}
                      />
                    </Box>
                  </Box>
                ) : (
                  expandedChart === 'count'
                    ? renderCountChart('500px', true)
                    : renderVolumeChart('500px', true)
                )}
              </Box>

              {/* Summary Table */}
              <HStack mt={6} gap={6} justify="center" flexWrap="wrap">
                {Object.entries(productLabels).map(([key, label]) => {
                  const countKey = `${key}Count` as keyof typeof totals;
                  const volumeKey = key as keyof typeof totals;
                  return (
                    <VStack key={key} align="center" gap={1}>
                      <HStack>
                        <Box w={4} h={4} borderRadius="md" bg={PRODUCT_COLORS[key as keyof typeof PRODUCT_COLORS]} />
                        <Text fontWeight="semibold" color={colors.textColor}>{label}</Text>
                      </HStack>
                      <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
                        {expandedChart === 'count'
                          ? `${totals[countKey]} ops`
                          : formatVolume(totals[volumeKey] as number)}
                      </Text>
                    </VStack>
                  );
                })}
              </HStack>
            </Box>
          </Box>
        </Portal>
      )}
    </>
  );
};

export default ProductTrendCharts;
