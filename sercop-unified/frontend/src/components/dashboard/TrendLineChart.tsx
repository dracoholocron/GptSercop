/**
 * TrendLineChart Component
 * Line/Bar/Area chart showing monthly trend with animated points
 * Features: Expandable view, Chart type selector
 */

import { useState } from 'react';
import { Box, Text, HStack, IconButton, Portal } from '@chakra-ui/react';
import { FiMaximize2, FiMinimize2, FiX } from 'react-icons/fi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area as AreaFill,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { TrendData } from '../../types/dashboard';

type ChartType = 'line' | 'bar' | 'area';

interface TrendLineChartProps {
  data: TrendData[];
}

export const TrendLineChart = ({ data }: TrendLineChartProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const [isExpanded, setIsExpanded] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('line');

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;

    return (
      <Box
        bg={isDark ? 'gray.800' : 'white'}
        p={3}
        borderRadius="lg"
        boxShadow="lg"
        borderWidth="1px"
        borderColor={colors.borderColor}
      >
        <Text fontWeight="bold" mb={2} color={colors.textColor}>
          {data.monthLabel} {data.year}
        </Text>
        <HStack justify="space-between" gap={4}>
          <Text fontSize="sm" color={colors.textColor} opacity={0.7}>{t('businessDashboard.volume')}:</Text>
          <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
            {formatValue(data.volume)}
          </Text>
        </HStack>
        <HStack justify="space-between" gap={4}>
          <Text fontSize="sm" color={colors.textColor} opacity={0.7}>{t('businessDashboard.operations')}:</Text>
          <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
            {data.operationCount}
          </Text>
        </HStack>
        <HStack justify="space-between" gap={4}>
          <Text fontSize="sm" color={colors.textColor} opacity={0.7}>{t('businessDashboard.average')}:</Text>
          <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
            {formatValue(data.avgOperationSize)}
          </Text>
        </HStack>
      </Box>
    );
  };

  const chartTypes: { value: ChartType; label: string; icon: string }[] = [
    { value: 'line', label: t('businessDashboard.chartTypes.line', 'Línea'), icon: '📈' },
    { value: 'bar', label: t('businessDashboard.chartTypes.bar', 'Barras'), icon: '📊' },
    { value: 'area', label: t('businessDashboard.chartTypes.area', 'Área'), icon: '📉' },
  ];

  const renderChart = (height: string) => {
    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: 0, bottom: 0 },
    };

    const axisProps = {
      xAxis: (
        <XAxis
          dataKey="monthLabel"
          tick={{ fill: colors.textColor, fontSize: isExpanded ? 14 : 12 }}
          tickLine={false}
          axisLine={false}
        />
      ),
      yAxis: (
        <YAxis
          tickFormatter={formatValue}
          tick={{ fill: colors.textColor, fontSize: isExpanded ? 14 : 12 }}
          tickLine={false}
          axisLine={false}
          width={isExpanded ? 80 : 60}
        />
      ),
      grid: (
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          vertical={false}
        />
      ),
      tooltip: <Tooltip content={<CustomTooltip />} />,
    };

    return (
      <Box h={height}>
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          {chartType === 'line' ? (
            <LineChart {...commonProps}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              {axisProps.grid}
              {axisProps.xAxis}
              {axisProps.yAxis}
              {axisProps.tooltip}
              <AreaFill
                type="monotone"
                dataKey="volume"
                stroke="transparent"
                fill="url(#volumeGradient)"
              />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: isExpanded ? 6 : 4 }}
                activeDot={{ r: isExpanded ? 10 : 8, stroke: '#3B82F6', strokeWidth: 2, fill: 'white' }}
              />
            </LineChart>
          ) : chartType === 'bar' ? (
            <BarChart {...commonProps}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              {axisProps.grid}
              {axisProps.xAxis}
              {axisProps.yAxis}
              {axisProps.tooltip}
              <Bar
                dataKey="volume"
                fill="url(#barGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={isExpanded ? 60 : 40}
              />
            </BarChart>
          ) : (
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              {axisProps.grid}
              {axisProps.xAxis}
              {axisProps.yAxis}
              {axisProps.tooltip}
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#areaGradient)"
              />
            </AreaChart>
          )}
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
      h={expanded ? '100%' : 'auto'}
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <HStack justify="space-between" mb={4}>
        <Text fontSize={expanded ? 'xl' : 'lg'} fontWeight="bold" color={colors.textColor}>
          {t('businessDashboard.monthlyTrend')}
        </Text>

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
      <Box flex="1" minH={0}>
        {renderChart(expanded ? '100%' : '250px')}
      </Box>
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
              maxW="1400px"
              h={{ base: '90vh', md: '80vh' }}
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

export default TrendLineChart;
