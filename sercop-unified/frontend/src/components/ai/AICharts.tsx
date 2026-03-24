/**
 * AICharts - Beautiful chart components for AI results using Recharts
 */

import { useMemo } from 'react';
import { Box, Text, useToken } from '@chakra-ui/react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

// Color palettes for charts
const CHART_COLORS = {
  primary: ['#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E'],
  success: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
  warning: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'],
  info: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'],
  mixed: ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6', '#14B8A6', '#F97316'],
};

interface ChartDataItem {
  [key: string]: string | number;
}

interface AIChartProps {
  data: ChartDataItem[];
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'horizontalBar';
  title?: string;
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  stacked?: boolean;
}

// Custom tooltip component
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
          <Text key={index} fontSize="sm" color={entry.color}>
            {entry.name}: {typeof entry.value === 'number'
              ? entry.value.toLocaleString('es-MX', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2
                })
              : entry.value}
          </Text>
        ))}
      </Box>
    );
  }
  return null;
};

// Pie chart custom label
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show label for very small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const AIChart = ({
  data,
  type,
  title,
  colors = CHART_COLORS.mixed,
  height = 300,
  showLegend = true,
  showGrid = true,
  stacked = false,
}: AIChartProps) => {
  const { getColors } = useTheme();
  const themeColors = getColors();

  // Extract keys from data
  const { labelKey, valueKeys } = useMemo(() => {
    if (!data || data.length === 0) return { labelKey: '', valueKeys: [] };

    const keys = Object.keys(data[0]);
    const labelKey = keys[0]; // First key is usually the label
    const valueKeys = keys.filter(
      (k) => k !== labelKey && typeof data[0][k] === 'number'
    );

    return { labelKey, valueKeys };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Box textAlign="center" py={8} color={themeColors.textColorSecondary}>
        <Text>No hay datos para mostrar</Text>
      </Box>
    );
  }

  // Bar Chart
  if (type === 'bar' || type === 'horizontalBar') {
    const isHorizontal = type === 'horizontalBar';
    // For horizontal bar charts, calculate height based on number of items
    const horizontalHeight = isHorizontal ? Math.max(300, data.length * 35) : height;
    return (
      <Box h={horizontalHeight} minH={200}>
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
          <BarChart
            data={data}
            layout={isHorizontal ? 'vertical' : 'horizontal'}
            margin={{ top: 20, right: 30, left: isHorizontal ? 10 : 20, bottom: 5 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            {isHorizontal ? (
              <>
                <XAxis type="number" tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 10 }} />
                <YAxis
                  dataKey={labelKey}
                  type="category"
                  width={180}
                  tick={{ fontSize: 9 }}
                  tickFormatter={(v) => v.length > 25 ? v.substring(0, 25) + '...' : v}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey={labelKey}
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tickFormatter={(v) => v.toLocaleString()} />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            {showLegend && valueKeys.length > 1 && <Legend />}
            {valueKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
                stackId={stacked ? 'stack' : undefined}
              >
                {valueKeys.length === 1 &&
                  data.map((_, idx) => (
                    <Cell key={idx} fill={colors[idx % colors.length]} />
                  ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    );
  }

  // Line Chart
  if (type === 'line') {
    // Calculate interval based on data length to avoid overlapping labels
    const tickInterval = data.length > 15 ? Math.floor(data.length / 10) : 0;

    return (
      <Box h={height + 50} minH={250}>
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={250}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis
              dataKey={labelKey}
              tick={{ fontSize: 10, angle: -45, textAnchor: 'end' }}
              height={70}
              interval={tickInterval}
            />
            <YAxis tickFormatter={(v) => v.toLocaleString()} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && valueKeys.length > 1 && <Legend />}
            {valueKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                dot={{ r: 5, fill: colors[index % colors.length] }}
                activeDot={{ r: 7 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  }

  // Area Chart
  if (type === 'area') {
    return (
      <Box h={height} minH={200}>
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis
              dataKey={labelKey}
              tick={{ fontSize: 12 }}
            />
            <YAxis tickFormatter={(v) => v.toLocaleString()} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && valueKeys.length > 1 && <Legend />}
            {valueKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.3}
                strokeWidth={2}
                stackId={stacked ? 'stack' : undefined}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    );
  }

  // Pie or Doughnut Chart
  if (type === 'pie' || type === 'doughnut') {
    const pieData = data.map((item, index) => ({
      name: String(item[labelKey]),
      value: Number(item[valueKeys[0]] || 0),
      color: colors[index % colors.length],
    }));

    const innerRadius = type === 'doughnut' ? '60%' : 0;

    return (
      <Box h={height} minH={200}>
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderPieLabel}
              outerRadius="80%"
              innerRadius={innerRadius}
              dataKey="value"
              animationDuration={800}
              animationBegin={0}
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(value) => (
                  <span style={{ color: themeColors.textColor, fontSize: 12 }}>
                    {value}
                  </span>
                )}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </Box>
    );
  }

  // Default: Bar chart
  return (
    <Box h={height} minH={200}>
      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
          <XAxis dataKey={labelKey} tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => v.toLocaleString()} />
          <Tooltip content={<CustomTooltip />} />
          {valueKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

// Export color palettes for use in other components
export { CHART_COLORS };

export default AIChart;
