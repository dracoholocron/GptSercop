import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Input,
  Spinner,
  IconButton,
} from '@chakra-ui/react';
import {
  FiDownload,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiCpu,
  FiUsers,
  FiFilter,
  FiRefreshCw,
  FiBarChart2,
  FiAlertCircle,
} from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import { get } from '../../utils/apiClient';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';

interface UsageRecord {
  id: string;
  userId: string;
  userName: string;
  organizationName: string;
  totalExtractions: number;
  totalFiles: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  period: string;
}

interface UsageSummary {
  totalExtractions: number;
  totalFiles: number;
  totalTokens: number;
  totalCostUsd: number;
  uniqueUsers: number;
  avgCostPerExtraction: number;
}

/**
 * Página de reportes de uso de IA para facturación (Solo Admin)
 */
export const AIUsageReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  // Estado
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(1); // Primer día del mes
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string>('all');

  // GPTsercop metrics
  const [gptMetrics, setGptMetrics] = useState<{
    totalRequests: number;
    fallbackCount: number;
    fallbackPct: number;
    avgLatencyMs: number | null;
    maxLatencyMs: number | null;
    fallbackReasons: Record<string, number>;
  } | null>(null);
  const [gptMetricsLoading, setGptMetricsLoading] = useState(true);

  // Load GPTsercop metrics
  const loadGptMetrics = useCallback(async () => {
    setGptMetricsLoading(true);
    try {
      const res = await get('/v1/gptsercop/metrics');
      if (res.ok) {
        const d = await res.json();
        setGptMetrics({
          totalRequests: d?.totalRequests ?? 0,
          fallbackCount: d?.fallbackCount ?? 0,
          fallbackPct: d?.totalRequests > 0 ? Math.round((d.fallbackCount / d.totalRequests) * 100) : 0,
          avgLatencyMs: d?.avgLatencyMs ?? null,
          maxLatencyMs: d?.maxLatencyMs ?? null,
          fallbackReasons: d?.fallbackReasons ?? {},
        });
      }
    } catch { /* silent */ } finally {
      setGptMetricsLoading(false);
    }
  }, []);

  useEffect(() => { loadGptMetrics(); }, [loadGptMetrics]);

  // Cargar datos
  const loadUsageData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ai/extraction/stats?from=${dateFrom}T00:00:00&to=${dateTo}T23:59:59`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('globalcmx_token')}`,
        },
      });
      const result = await response.json();

      if (result.success) {
        // TODO: Adaptar según estructura real del backend
        // Por ahora, datos de ejemplo para demostración
        const mockRecords: UsageRecord[] = [
          {
            id: '1',
            userId: 'user1',
            userName: 'Juan Pérez',
            organizationName: 'Banco ABC',
            totalExtractions: 45,
            totalFiles: 52,
            totalInputTokens: 125000,
            totalOutputTokens: 45000,
            totalCostUsd: 12.50,
            period: `${dateFrom} - ${dateTo}`,
          },
          {
            id: '2',
            userId: 'user2',
            userName: 'María García',
            organizationName: 'Banco XYZ',
            totalExtractions: 32,
            totalFiles: 38,
            totalInputTokens: 89000,
            totalOutputTokens: 32000,
            totalCostUsd: 8.75,
            period: `${dateFrom} - ${dateTo}`,
          },
        ];

        setUsageRecords(mockRecords);

        // Calcular resumen
        const totalExtractions = mockRecords.reduce((acc, r) => acc + r.totalExtractions, 0);
        const totalFiles = mockRecords.reduce((acc, r) => acc + r.totalFiles, 0);
        const totalTokens = mockRecords.reduce((acc, r) => acc + r.totalInputTokens + r.totalOutputTokens, 0);
        const totalCostUsd = mockRecords.reduce((acc, r) => acc + r.totalCostUsd, 0);

        setSummary({
          totalExtractions,
          totalFiles,
          totalTokens,
          totalCostUsd,
          uniqueUsers: mockRecords.length,
          avgCostPerExtraction: totalExtractions > 0 ? totalCostUsd / totalExtractions : 0,
        });
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadUsageData();
  }, [loadUsageData]);

  // Exportar a CSV
  const exportToCSV = () => {
    const headers = [
      'Cliente',
      'Usuario',
      'Período',
      'Extracciones',
      'Archivos',
      'Tokens Entrada',
      'Tokens Salida',
      'Costo USD',
    ];

    const rows = usageRecords.map(r => [
      r.organizationName,
      r.userName,
      r.period,
      r.totalExtractions,
      r.totalFiles,
      r.totalInputTokens,
      r.totalOutputTokens,
      r.totalCostUsd.toFixed(2),
    ]);

    // Agregar fila de totales
    if (summary) {
      rows.push([
        'TOTAL',
        '',
        `${dateFrom} - ${dateTo}`,
        summary.totalExtractions,
        summary.totalFiles,
        summary.totalTokens,
        0,
        summary.totalCostUsd.toFixed(2),
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ai-usage-report-${dateFrom}-${dateTo}.csv`;
    link.click();
  };

  // Formato de moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Formato de números
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es').format(num);
  };

  // Columnas para DataTable
  const columns: DataTableColumn<UsageRecord>[] = [
    {
      key: 'organizationName',
      label: 'Cliente',
      render: (row) => <Text fontWeight="600" color={colors.textColor}>{row.organizationName}</Text>,
    },
    {
      key: 'userName',
      label: 'Usuario',
      render: (row) => <Text color={colors.textColorSecondary}>{row.userName}</Text>,
    },
    {
      key: 'totalExtractions',
      label: 'Extracciones',
      align: 'right',
      render: (row) => <Badge colorPalette="purple" size="sm">{formatNumber(row.totalExtractions)}</Badge>,
    },
    {
      key: 'totalFiles',
      label: 'Archivos',
      align: 'right',
      hideOnMobile: true,
      render: (row) => <Text>{formatNumber(row.totalFiles)}</Text>,
    },
    {
      key: 'totalInputTokens',
      label: 'Tokens Entrada',
      align: 'right',
      hideOnMobile: true,
      render: (row) => <Text>{formatNumber(row.totalInputTokens)}</Text>,
    },
    {
      key: 'totalOutputTokens',
      label: 'Tokens Salida',
      align: 'right',
      hideOnMobile: true,
      render: (row) => <Text>{formatNumber(row.totalOutputTokens)}</Text>,
    },
    {
      key: 'totalCostUsd',
      label: 'Costo USD',
      align: 'right',
      render: (row) => <Text fontWeight="600" color="green.500">{formatCurrency(row.totalCostUsd)}</Text>,
    },
  ];

  return (
    <Box p={6} maxW="1400px" mx="auto">
      {/* Header */}
      <VStack align="stretch" gap={6}>
        <HStack justify="space-between" flexWrap="wrap" gap={4}>
          <Box>
            <HStack gap={2} mb={1}>
              <FiCpu size={24} color="var(--chakra-colors-purple-500)" />
              <Text fontSize="2xl" fontWeight="700" color={colors.textColor}>
                {t('admin:aiUsage.title', 'Reportes de Uso IA')}
              </Text>
            </HStack>
            <Text fontSize="sm" color={colors.textColorSecondary}>
              {t('admin:aiUsage.subtitle', 'Estadísticas de consumo para facturación')}
            </Text>
          </Box>

          <HStack gap={2}>
            <IconButton
              aria-label="Refresh"
              onClick={loadUsageData}
              size="sm"
              variant="outline"
            >
              <FiRefreshCw />
            </IconButton>
            <Box
              as="button"
              px={4}
              py={2}
              borderRadius="lg"
              bg="green.500"
              color="white"
              fontSize="13px"
              fontWeight="600"
              cursor="pointer"
              _hover={{ bg: 'green.600' }}
              onClick={exportToCSV}
            >
              <HStack gap={2}>
                <FiDownload size={14} />
                <Text>{t('admin:aiUsage.exportCSV', 'Exportar CSV')}</Text>
              </HStack>
            </Box>
          </HStack>
        </HStack>

        {/* Filtros */}
        <HStack
          p={4}
          bg={isDark ? 'gray.800' : 'white'}
          borderRadius="xl"
          border="1px solid"
          borderColor={colors.borderColor}
          gap={4}
          flexWrap="wrap"
        >
          <HStack gap={2}>
            <FiCalendar size={16} color="var(--chakra-colors-gray-500)" />
            <Text fontSize="sm" fontWeight="500">{t('admin:aiUsage.from', 'Desde')}:</Text>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              size="sm"
              w="150px"
            />
          </HStack>
          <HStack gap={2}>
            <Text fontSize="sm" fontWeight="500">{t('admin:aiUsage.to', 'Hasta')}:</Text>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              size="sm"
              w="150px"
            />
          </HStack>
          <HStack gap={2}>
            <FiFilter size={16} color="var(--chakra-colors-gray-500)" />
            <Text fontSize="sm" fontWeight="500">{t('admin:aiUsage.organization', 'Cliente')}:</Text>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--chakra-colors-gray-300)',
                fontSize: '13px',
              }}
            >
              <option value="all">{t('admin:aiUsage.allClients', 'Todos los clientes')}</option>
              <option value="banco-abc">Banco ABC</option>
              <option value="banco-xyz">Banco XYZ</option>
            </select>
          </HStack>
        </HStack>

        {/* Tarjetas de resumen */}
        {loading ? (
          <HStack justify="center" py={8}>
            <Spinner size="lg" color="purple.500" />
          </HStack>
        ) : summary && (
          <HStack gap={4} flexWrap="wrap">
            {/* Total Extracciones */}
            <Box
              flex="1"
              minW="200px"
              p={4}
              bg={isDark ? 'gray.800' : 'white'}
              borderRadius="xl"
              border="1px solid"
              borderColor={colors.borderColor}
            >
              <HStack justify="space-between" mb={2}>
                <Box p={2} borderRadius="lg" bg={isDark ? 'purple.900' : 'purple.100'}>
                  <FiFileText size={20} color="var(--chakra-colors-purple-500)" />
                </Box>
                <Badge colorPalette="purple" size="sm">Extracciones</Badge>
              </HStack>
              <Text fontSize="2xl" fontWeight="700" color={colors.textColor}>
                {formatNumber(summary.totalExtractions)}
              </Text>
              <Text fontSize="xs" color={colors.textColorSecondary}>
                {formatNumber(summary.totalFiles)} archivos procesados
              </Text>
            </Box>

            {/* Total Tokens */}
            <Box
              flex="1"
              minW="200px"
              p={4}
              bg={isDark ? 'gray.800' : 'white'}
              borderRadius="xl"
              border="1px solid"
              borderColor={colors.borderColor}
            >
              <HStack justify="space-between" mb={2}>
                <Box p={2} borderRadius="lg" bg={isDark ? 'blue.900' : 'blue.100'}>
                  <FiCpu size={20} color="var(--chakra-colors-blue-500)" />
                </Box>
                <Badge colorPalette="blue" size="sm">Tokens</Badge>
              </HStack>
              <Text fontSize="2xl" fontWeight="700" color={colors.textColor}>
                {formatNumber(summary.totalTokens)}
              </Text>
              <Text fontSize="xs" color={colors.textColorSecondary}>
                Entrada + Salida
              </Text>
            </Box>

            {/* Usuarios Únicos */}
            <Box
              flex="1"
              minW="200px"
              p={4}
              bg={isDark ? 'gray.800' : 'white'}
              borderRadius="xl"
              border="1px solid"
              borderColor={colors.borderColor}
            >
              <HStack justify="space-between" mb={2}>
                <Box p={2} borderRadius="lg" bg={isDark ? 'teal.900' : 'teal.100'}>
                  <FiUsers size={20} color="var(--chakra-colors-teal-500)" />
                </Box>
                <Badge colorPalette="teal" size="sm">Usuarios</Badge>
              </HStack>
              <Text fontSize="2xl" fontWeight="700" color={colors.textColor}>
                {formatNumber(summary.uniqueUsers)}
              </Text>
              <Text fontSize="xs" color={colors.textColorSecondary}>
                Usuarios activos
              </Text>
            </Box>

            {/* Costo Total */}
            <Box
              flex="1"
              minW="200px"
              p={4}
              bg={isDark ? 'green.900' : 'green.50'}
              borderRadius="xl"
              border="2px solid"
              borderColor="green.500"
            >
              <HStack justify="space-between" mb={2}>
                <Box p={2} borderRadius="lg" bg={isDark ? 'green.800' : 'green.100'}>
                  <FiDollarSign size={20} color="var(--chakra-colors-green-500)" />
                </Box>
                <Badge colorPalette="green" size="sm" variant="solid">TOTAL A FACTURAR</Badge>
              </HStack>
              <Text fontSize="2xl" fontWeight="700" color="green.500">
                {formatCurrency(summary.totalCostUsd)}
              </Text>
              <Text fontSize="xs" color={colors.textColorSecondary}>
                {formatCurrency(summary.avgCostPerExtraction)} promedio/extracción
              </Text>
            </Box>
          </HStack>
        )}

        {/* Tabla de detalle por cliente */}
        <DataTable<UsageRecord>
          data={usageRecords}
          columns={columns}
          rowKey={(row) => row.id}
          isLoading={loading}
          emptyMessage={t('admin:aiUsage.noRecords', 'No hay registros de uso')}
          pagination="none"
          searchable={false}
          size="sm"
        />

        {/* Fila de totales */}
        {summary && !loading && usageRecords.length > 0 && (
          <HStack
            px={4}
            py={3}
            bg={isDark ? 'green.900' : 'green.50'}
            borderRadius="xl"
            border="1px solid"
            borderColor="green.500"
            justify="space-between"
            flexWrap="wrap"
            gap={4}
          >
            <Text fontWeight="700" color={colors.textColor}>TOTAL</Text>
            <HStack gap={6} flexWrap="wrap">
              <HStack gap={2}>
                <Text fontSize="sm" color={colors.textColorSecondary}>Extracciones:</Text>
                <Badge colorPalette="green" size="sm" variant="solid">{formatNumber(summary.totalExtractions)}</Badge>
              </HStack>
              <HStack gap={2}>
                <Text fontSize="sm" color={colors.textColorSecondary}>Archivos:</Text>
                <Text fontWeight="600">{formatNumber(summary.totalFiles)}</Text>
              </HStack>
              <HStack gap={2}>
                <Text fontSize="sm" color={colors.textColorSecondary}>Tokens:</Text>
                <Text fontWeight="600">{formatNumber(summary.totalTokens)}</Text>
              </HStack>
              <HStack gap={2}>
                <Text fontSize="sm" color={colors.textColorSecondary}>Costo:</Text>
                <Text fontWeight="700" fontSize="lg" color="green.500">
                  {formatCurrency(summary.totalCostUsd)}
                </Text>
              </HStack>
            </HStack>
          </HStack>
        )}

        {/* GPTsercop Node API Metrics */}
        <Box
          p={4}
          bg={isDark ? 'purple.900' : 'purple.50'}
          borderRadius="xl"
          border="1px solid"
          borderColor={isDark ? 'purple.700' : 'purple.200'}
        >
          <HStack gap={2} mb={3} justify="space-between">
            <HStack gap={2}>
              <LuSparkles size={16} color="var(--chakra-colors-purple-500)" />
              <Text fontSize="13px" fontWeight="600" color={colors.textColor}>
                GPTsercop Node API – Métricas de Uso
              </Text>
            </HStack>
            <IconButton
              aria-label="Actualizar métricas GPT"
              size="xs"
              variant="ghost"
              onClick={loadGptMetrics}
            >
              <FiRefreshCw />
            </IconButton>
          </HStack>
          {gptMetricsLoading ? (
            <Spinner size="sm" />
          ) : !gptMetrics ? (
            <HStack gap={2}>
              <FiAlertCircle size={14} color="var(--chakra-colors-orange-400)" />
              <Text fontSize="12px" color={colors.textColorSecondary}>No se pudo cargar métricas del Node API</Text>
            </HStack>
          ) : (
            <Box>
              <HStack gap={4} flexWrap="wrap" mb={3}>
                <Box p={3} bg={isDark ? 'gray.800' : 'white'} borderRadius="lg" minW="120px">
                  <HStack gap={2} mb={1}>
                    <FiBarChart2 size={14} color="var(--chakra-colors-purple-500)" />
                    <Text fontSize="10px" fontWeight="600" textTransform="uppercase" color={colors.textColorSecondary}>Total Requests</Text>
                  </HStack>
                  <Text fontSize="xl" fontWeight="700" color={colors.textColor}>{gptMetrics.totalRequests.toLocaleString()}</Text>
                </Box>
                <Box p={3} bg={isDark ? 'gray.800' : 'white'} borderRadius="lg" minW="120px">
                  <HStack gap={2} mb={1}>
                    <FiAlertCircle size={14} color="var(--chakra-colors-orange-400)" />
                    <Text fontSize="10px" fontWeight="600" textTransform="uppercase" color={colors.textColorSecondary}>Fallbacks</Text>
                  </HStack>
                  <HStack gap={1} align="baseline">
                    <Text fontSize="xl" fontWeight="700" color={gptMetrics.fallbackPct > 20 ? 'orange.400' : colors.textColor}>
                      {gptMetrics.fallbackPct}%
                    </Text>
                    <Text fontSize="12px" color={colors.textColorSecondary}>({gptMetrics.fallbackCount})</Text>
                  </HStack>
                </Box>
                {gptMetrics.avgLatencyMs !== null && (
                  <Box p={3} bg={isDark ? 'gray.800' : 'white'} borderRadius="lg" minW="120px">
                    <HStack gap={2} mb={1}>
                      <FiCpu size={14} color="var(--chakra-colors-blue-400)" />
                      <Text fontSize="10px" fontWeight="600" textTransform="uppercase" color={colors.textColorSecondary}>Latencia Prom.</Text>
                    </HStack>
                    <HStack gap={1} align="baseline">
                      <Text fontSize="xl" fontWeight="700" color={colors.textColor}>{gptMetrics.avgLatencyMs}</Text>
                      <Text fontSize="12px" color={colors.textColorSecondary}>ms</Text>
                    </HStack>
                  </Box>
                )}
                {gptMetrics.maxLatencyMs !== null && (
                  <Box p={3} bg={isDark ? 'gray.800' : 'white'} borderRadius="lg" minW="120px">
                    <HStack gap={2} mb={1}>
                      <FiCpu size={14} color="var(--chakra-colors-red-400)" />
                      <Text fontSize="10px" fontWeight="600" textTransform="uppercase" color={colors.textColorSecondary}>Latencia Máx.</Text>
                    </HStack>
                    <HStack gap={1} align="baseline">
                      <Text fontSize="xl" fontWeight="700" color={colors.textColor}>{gptMetrics.maxLatencyMs}</Text>
                      <Text fontSize="12px" color={colors.textColorSecondary}>ms</Text>
                    </HStack>
                  </Box>
                )}
              </HStack>
              {Object.keys(gptMetrics.fallbackReasons).length > 0 && (
                <Box>
                  <Text fontSize="11px" fontWeight="600" color={colors.textColorSecondary} mb={2} textTransform="uppercase">
                    Razones de Fallback
                  </Text>
                  <HStack gap={2} flexWrap="wrap">
                    {Object.entries(gptMetrics.fallbackReasons).map(([reason, count]) => (
                      <Badge key={reason} colorPalette="orange" variant="subtle" fontSize="xs">
                        {reason}: {count}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Información de facturación */}
        <Box
          p={4}
          bg={isDark ? 'blue.900' : 'blue.50'}
          borderRadius="xl"
          border="1px solid"
          borderColor="blue.400"
        >
          <HStack gap={2} mb={2}>
            <FiFileText size={16} color="var(--chakra-colors-blue-500)" />
            <Text fontSize="13px" fontWeight="600" color={colors.textColor}>
              {t('admin:aiUsage.billingInfo', 'Información para Facturación')}
            </Text>
          </HStack>
          <VStack align="stretch" gap={1}>
            <Text fontSize="12px" color={colors.textColorSecondary}>
              • Período: {dateFrom} al {dateTo}
            </Text>
            <Text fontSize="12px" color={colors.textColorSecondary}>
              • Tarifa por extracción: $0.25 USD (incluye hasta 5 archivos)
            </Text>
            <Text fontSize="12px" color={colors.textColorSecondary}>
              • Tarifa por tokens adicionales: $0.002 USD por 1K tokens
            </Text>
            <Text fontSize="12px" color={colors.textColorSecondary}>
              • Este reporte puede ser exportado en formato CSV para integración con sistemas de facturación
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default AIUsageReportsPage;
