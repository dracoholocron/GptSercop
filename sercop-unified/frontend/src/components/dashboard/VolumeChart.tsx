/**
 * VolumeChart Component
 * Professional grid of individual charts showing volume by product over time
 * Each product gets its own dedicated chart with comprehensive statistics
 * Clicking on a product opens a modal with detailed operations list
 */

import { useState, useMemo, useEffect } from 'react';
import { Box, Text, HStack, VStack, SimpleGrid, Badge, Flex, Portal, IconButton, Table, Spinner, Menu } from '@chakra-ui/react';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiDollarSign, FiActivity, FiMaximize2, FiMinimize2, FiX, FiEye, FiChevronLeft, FiChevronRight, FiFilter, FiBox, FiBarChart2 } from 'react-icons/fi';
import { ProductVolume3D } from './ProductVolume3D';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { VolumeByProduct, DashboardFilters, ProductComparison } from '../../types/dashboard';
import type { Operation, ProductType } from '../../types/operations';
import { operationsApi } from '../../services/operationsApi';
import { productTypeConfigService, type ProductTypeConfig } from '../../services/productTypeConfigService';
import { dashboardService } from '../../services/dashboardService';

interface VolumeChartProps {
  data: VolumeByProduct[];
  filters?: DashboardFilters;
  productComparison?: ProductComparison[];
  availableCurrencies?: string[];
}

interface ProductConfig {
  key: string;
  color: string;
  lightColor: string;
  darkColor: string;
  icon: string;
}

// Paleta de colores dinámica para productos
const COLOR_PALETTE = [
  { color: '#3B82F6', lightColor: '#93C5FD', darkColor: '#1E40AF', chakra: 'blue' },    // Blue
  { color: '#10B981', lightColor: '#6EE7B7', darkColor: '#047857', chakra: 'green' },   // Green
  { color: '#8B5CF6', lightColor: '#C4B5FD', darkColor: '#5B21B6', chakra: 'purple' },  // Purple
  { color: '#F59E0B', lightColor: '#FCD34D', darkColor: '#B45309', chakra: 'orange' },  // Orange
  { color: '#EC4899', lightColor: '#F9A8D4', darkColor: '#BE185D', chakra: 'pink' },    // Pink
  { color: '#06B6D4', lightColor: '#67E8F9', darkColor: '#0E7490', chakra: 'cyan' },    // Cyan
  { color: '#EF4444', lightColor: '#FCA5A5', darkColor: '#B91C1C', chakra: 'red' },     // Red
  { color: '#84CC16', lightColor: '#BEF264', darkColor: '#4D7C0F', chakra: 'lime' },    // Lime
  { color: '#6366F1', lightColor: '#A5B4FC', darkColor: '#4338CA', chakra: 'indigo' },  // Indigo
  { color: '#14B8A6', lightColor: '#5EEAD4', darkColor: '#0F766E', chakra: 'teal' },    // Teal
];

// Helper para ajustar brillo de color
const adjustColor = (hex: string, factor: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const adjust = (c: number) => Math.min(255, Math.max(0, Math.round(c * factor)));
  return `#${adjust(r).toString(16).padStart(2, '0')}${adjust(g).toString(16).padStart(2, '0')}${adjust(b).toString(16).padStart(2, '0')}`;
};

export const VolumeChart = ({ data, filters: dashboardFilters, productComparison, availableCurrencies }: VolumeChartProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  // Track expanded state for each chart
  const [expandedCharts, setExpandedCharts] = useState<Record<string, boolean>>({});

  // Track expanded state for the entire section
  const [isSectionExpanded, setIsSectionExpanded] = useState(false);

  // Toggle between 2D and 3D view
  const [is3DView, setIs3DView] = useState(false);

  // Product type configs from backend
  const [productConfigs, setProductConfigs] = useState<ProductTypeConfig[]>([]);

  // Modal state for product detail view
  const [selectedProduct, setSelectedProduct] = useState<ProductConfig | null>(null);
  const [productOperations, setProductOperations] = useState<Operation[]>([]);
  const [loadingOperations, setLoadingOperations] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const pageSize = 10;

  // Local currency filter state (affects only this section when main filter has no currency)
  const [localCurrency, setLocalCurrency] = useState<string>('');
  const [filteredVolumeData, setFilteredVolumeData] = useState<VolumeByProduct[] | null>(null);
  const [filteredProductComparison, setFilteredProductComparison] = useState<ProductComparison[] | null>(null);
  const [loadingFiltered, setLoadingFiltered] = useState(false);

  // Determine if we should show local filter (only when main filter has no currency selected)
  const showLocalCurrencyFilter = !dashboardFilters?.currency;

  // The effective currency: use main filter if set, otherwise use local filter
  const effectiveCurrency = dashboardFilters?.currency || localCurrency;

  // Set default local currency to first available when currencies load (only if no main filter)
  useEffect(() => {
    if (showLocalCurrencyFilter && availableCurrencies && availableCurrencies.length > 0 && !localCurrency) {
      setLocalCurrency(availableCurrencies[0]);
    }
  }, [availableCurrencies, localCurrency, showLocalCurrencyFilter]);

  // Cargar configs de product_type_config
  useEffect(() => {
    productTypeConfigService.getAllConfigs()
      .then(configs => setProductConfigs(configs))
      .catch(err => console.error('Error loading product configs:', err));
  }, []);

  // Fetch filtered data when local currency changes (only when main filter has no currency)
  useEffect(() => {
    const fetchFilteredData = async () => {
      // If main filter has currency, use props data directly (no need to fetch)
      if (dashboardFilters?.currency) {
        setFilteredVolumeData(null);
        setFilteredProductComparison(null);
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
        setFilteredVolumeData(filteredSummary.volumeByProduct);
        setFilteredProductComparison(filteredSummary.productComparison);
      } catch (error) {
        console.error('Error fetching filtered data:', error);
        setFilteredVolumeData(null);
        setFilteredProductComparison(null);
      } finally {
        setLoadingFiltered(false);
      }
    };

    fetchFilteredData();
  }, [localCurrency, dashboardFilters?.period, dashboardFilters?.statusFilter, dashboardFilters?.currency, dashboardFilters?.beneficiary, dashboardFilters?.createdBy, dashboardFilters?.issuingBank, dashboardFilters?.advisingBank, dashboardFilters?.applicant, dashboardFilters?.swiftSearch, dashboardFilters?.swiftFreeText, dashboardFilters?.customFieldFilters]);

  // Use filtered data if available, otherwise use props data
  const activeVolumeData = filteredVolumeData || data;
  const activeProductComparison = filteredProductComparison || productComparison;

  // Generar productos dinámicamente basado en los datos del backend
  const dynamicProducts = useMemo((): ProductConfig[] => {
    if (!activeVolumeData || activeVolumeData.length === 0) return [];

    // Obtener todos los productTypes únicos de los datos
    const productTypes = new Set<string>();
    activeVolumeData.forEach(item => {
      if (item.productVolumes) {
        Object.keys(item.productVolumes).forEach(pt => productTypes.add(pt));
      }
    });

    // Generar ProductConfig para cada tipo, asignando colores de la paleta
    const products: ProductConfig[] = [];
    let colorIndex = 0;
    productTypes.forEach(productType => {
      const palette = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
      products.push({
        key: productType,
        color: palette.color,
        lightColor: palette.lightColor,
        darkColor: palette.darkColor,
        icon: 'default'
      });
      colorIndex++;
    });

    // Ordenar por volumen total descendente
    return products.sort((a, b) => {
      const totalA = activeVolumeData.reduce((sum, item) => sum + (item.productVolumes?.[a.key] || 0), 0);
      const totalB = activeVolumeData.reduce((sum, item) => sum + (item.productVolumes?.[b.key] || 0), 0);
      return totalB - totalA;
    });
  }, [activeVolumeData]);

  // Generar labels dinámicos con i18n (multiidioma)
  const getProductLabel = (productType: string): string => {
    // Usar traducción i18n con clave productType_LC_IMPORT, productType_GUARANTEE_RECEIVED, etc.
    const translationKey = `productTypes.${productType}`;
    const translated = t(translationKey, { defaultValue: '' });
    if (translated && translated !== translationKey && translated !== '') {
      return translated;
    }
    // Fallback: formatear el productType para mostrar
    return productType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Mapeo de colores chakra para badges
  const getChakraColor = (productType: string): string => {
    const index = dynamicProducts.findIndex(p => p.key === productType);
    if (index >= 0 && index < COLOR_PALETTE.length) {
      return COLOR_PALETTE[index].chakra;
    }
    return 'gray';
  };

  const toggleExpand = (key: string) => {
    setExpandedCharts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatValue = (value: number) => {
    if (value === 0 || value === undefined || value === null) return '$0';
    const isNegative = value < 0;
    const absValue = Math.abs(value);
    const prefix = isNegative ? '-$' : '$';
    if (absValue >= 1000000) return `${prefix}${(absValue / 1000000).toFixed(1)}M`;
    if (absValue >= 1000) return `${prefix}${(absValue / 1000).toFixed(0)}K`;
    return `${prefix}${absValue.toFixed(0)}`;
  };

  const formatCompactValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toFixed(0);
  };

  const formatLargeValue = (value: number) => {
    // Always use M for millions to be consistent with other components
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
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
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const STATUS_OPTIONS = [
    { value: '', label: t('operations.activeOnly', 'Activas (sin cerradas)') },
    { value: 'ACTIVE', label: t('operations.statuses.ACTIVE', 'Activo') },
    { value: 'PENDING_RESPONSE', label: t('operations.statuses.PENDING_RESPONSE', 'Pendiente Respuesta') },
    { value: 'PENDING_DOCUMENTS', label: t('operations.statuses.PENDING_DOCUMENTS', 'Pendiente Documentos') },
    { value: 'ON_HOLD', label: t('operations.statuses.ON_HOLD', 'En Espera') },
    { value: 'COMPLETED', label: t('operations.statuses.COMPLETED', 'Completado') },
    { value: 'CANCELLED', label: t('operations.statuses.CANCELLED', 'Cancelado') },
    { value: 'CLOSED', label: t('operations.statuses.CLOSED', 'Cerrado') },
  ];

  // Calculate start date based on period filter
  const getStartDateForPeriod = (period?: string): Date | null => {
    if (!period || period === 'all') return null;
    const now = new Date();
    switch (period) {
      case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month': return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      case 'quarter': return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      case 'semester': return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      case 'year': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      case 'more_than_year': return new Date(2000, 0, 1);
      default: return null;
    }
  };

  const getEndDateForPeriod = (period?: string): Date | null => {
    if (period === 'more_than_year') {
      const now = new Date();
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }
    return null;
  };

  const fetchProductOperations = async (product: ProductConfig, status?: string) => {
    setLoadingOperations(true);
    setCurrentPage(1);

    try {
      // El key ya es el productType (e.g., "LC_IMPORT", "GUARANTEE_ISSUED")
      const productType = product.key as ProductType;
      const operations = await operationsApi.getByProductType(productType);

      // Apply filters
      let filteredOperations = operations;

      // Filter by period (date range)
      const startDate = getStartDateForPeriod(dashboardFilters?.period);
      const endDate = getEndDateForPeriod(dashboardFilters?.period);
      if (startDate) {
        filteredOperations = filteredOperations.filter(op => {
          const opDate = op.createdAt ? new Date(op.createdAt) : null;
          if (!opDate) return false;
          if (endDate) {
            return opDate >= startDate && opDate <= endDate;
          }
          return opDate >= startDate;
        });
      }

      // Filter by currency if specified in dashboard filters
      if (dashboardFilters?.currency) {
        filteredOperations = filteredOperations.filter(op => op.currency === dashboardFilters.currency);
      }

      // Filter by advanced filters
      if (dashboardFilters?.createdBy) {
        filteredOperations = filteredOperations.filter(op => op.createdBy === dashboardFilters.createdBy);
      }
      if (dashboardFilters?.beneficiary) {
        filteredOperations = filteredOperations.filter(op => op.beneficiaryName === dashboardFilters.beneficiary);
      }
      if (dashboardFilters?.issuingBank) {
        filteredOperations = filteredOperations.filter(op => op.issuingBankBic === dashboardFilters.issuingBank);
      }
      if (dashboardFilters?.advisingBank) {
        filteredOperations = filteredOperations.filter(op => op.advisingBankBic === dashboardFilters.advisingBank);
      }
      if (dashboardFilters?.applicant) {
        filteredOperations = filteredOperations.filter(op => op.applicantName === dashboardFilters.applicant);
      }

      // Filter by SWIFT field search conditions
      if (dashboardFilters?.swiftSearch?.length) {
        filteredOperations = filteredOperations.filter(op => {
          if (!op.swiftMessage) return false;
          return dashboardFilters.swiftSearch!.every(cond => {
            const fieldTag = `:${cond.field}:`;
            const idx = op.swiftMessage.indexOf(fieldTag);
            if (idx === -1) return false;
            const afterTag = op.swiftMessage.substring(idx + fieldTag.length);
            const nextTag = afterTag.indexOf('\n:');
            const fieldValue = (nextTag >= 0 ? afterTag.substring(0, nextTag) : afterTag).toLowerCase();
            const searchVal = cond.value.toLowerCase();
            switch (cond.op) {
              case 'equals': return fieldValue.trim() === searchVal;
              case 'startsWith': return fieldValue.trimStart().startsWith(searchVal);
              default: return fieldValue.includes(searchVal); // contains
            }
          });
        });
      }

      // Filter by SWIFT free text
      if (dashboardFilters?.swiftFreeText) {
        const searchText = dashboardFilters.swiftFreeText.toLowerCase();
        filteredOperations = filteredOperations.filter(op =>
          op.swiftMessage?.toLowerCase().includes(searchText)
        );
      }

      // Filter by status
      if (status) {
        filteredOperations = filteredOperations.filter(op => op.status === status);
      } else {
        // Exclude CLOSED operations by default (unless dashboard shows closed)
        if (dashboardFilters?.statusFilter !== 'CLOSED' && dashboardFilters?.statusFilter !== 'ALL') {
          filteredOperations = filteredOperations.filter(op => op.status !== 'CLOSED');
        }
      }

      setProductOperations(filteredOperations);
    } catch (error) {
      console.error('Error loading product operations:', error);
      setProductOperations([]);
    } finally {
      setLoadingOperations(false);
    }
  };

  const handleViewProductOperations = async (product: ProductConfig) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
    setStatusFilter('');
    await fetchProductOperations(product);
  };

  const handleStatusFilterChange = async (newStatus: string) => {
    setStatusFilter(newStatus);
    if (selectedProduct) {
      await fetchProductOperations(selectedProduct, newStatus);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setProductOperations([]);
  };

  // Re-fetch operations when dashboard filters change while modal is open
  useEffect(() => {
    if (isModalOpen && selectedProduct) {
      fetchProductOperations(selectedProduct, statusFilter || undefined);
    }
  }, [dashboardFilters?.swiftSearch, dashboardFilters?.swiftFreeText, dashboardFilters?.customFieldFilters, dashboardFilters?.createdBy, dashboardFilters?.beneficiary, dashboardFilters?.issuingBank, dashboardFilters?.advisingBank, dashboardFilters?.applicant, dashboardFilters?.currency, dashboardFilters?.statusFilter, dashboardFilters?.period]);

  // Pagination
  const totalPages = Math.ceil(productOperations.length / pageSize);
  const paginatedOperations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return productOperations.slice(start, end);
  }, [productOperations, currentPage, pageSize]);

  // Get pending balance for a product from productComparison
  // Backend now calculates correctly based on accounting_nature (DEBIT/CREDIT)
  const getPendingBalance = (productKey: string): number => {
    if (!activeProductComparison) return 0;
    const product = activeProductComparison.find(p => p.productType === productKey);
    return product?.pendingBalance || 0;
  };

  // Calculate comprehensive stats for each product (dinámico)
  const getProductStats = (productKey: string) => {
    if (!activeVolumeData || activeVolumeData.length === 0) return {
      total: 0,
      trend: 0,
      lastValue: 0,
      average: 0,
      max: 0,
      min: 0,
      count: 0
    };

    // Usar productVolumes dinámico si existe, sino fallback a campos legacy
    const values = activeVolumeData.map(item => {
      // Primero intentar con productVolumes dinámico
      if (item.productVolumes && item.productVolumes[productKey] !== undefined) {
        return item.productVolumes[productKey];
      }
      // Fallback para datos legacy
      return (item[productKey as keyof VolumeByProduct] as number) || 0;
    });

    const total = values.reduce((sum, val) => sum + val, 0);
    const lastValue = values[values.length - 1] || 0;
    const prevValue = values[values.length - 2] || 0;
    const trend = prevValue > 0 ? ((lastValue - prevValue) / prevValue) * 100 : 0;
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values.filter(v => v > 0));
    const count = values.filter(v => v > 0).length;

    return { total, trend, lastValue, average, max, min: min === Infinity ? 0 : min, count };
  };

  const CustomTooltip = ({ active, payload, label, color }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <Box
        bg={isDark ? 'gray.900' : 'white'}
        p={4}
        borderRadius="xl"
        boxShadow="0 10px 40px rgba(0,0,0,0.2)"
        borderWidth="1px"
        borderColor={color}
        minW="180px"
      >
        <Text fontWeight="bold" mb={2} fontSize="sm" color={colors.textColorSecondary}>
          {label}
        </Text>
        <HStack justify="space-between">
          <HStack>
            <Box w={3} h={3} borderRadius="full" bg={color} />
            <Text fontSize="xs" color={colors.textColorSecondary}>Volumen</Text>
          </HStack>
          <Text fontSize="lg" fontWeight="bold" color={color}>
            {formatValue(payload[0]?.value || 0)}
          </Text>
        </HStack>
      </Box>
    );
  };

  const TrendBadge = ({ trend }: { trend: number }) => {
    const isPositive = trend >= 0;
    const isNeutral = Math.abs(trend) < 0.5;

    return (
      <Badge
        colorPalette={isNeutral ? 'gray' : isPositive ? 'green' : 'red'}
        px={3}
        py={1}
        borderRadius="full"
        fontSize="sm"
        fontWeight="bold"
        display="flex"
        alignItems="center"
        gap={1}
      >
        {isNeutral ? (
          <FiMinus size={14} />
        ) : isPositive ? (
          <FiTrendingUp size={14} />
        ) : (
          <FiTrendingDown size={14} />
        )}
        {Math.abs(trend).toFixed(1)}%
      </Badge>
    );
  };

  const StatItem = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <VStack gap={0} align="center">
      <Text fontSize="xs" color={colors.textColorSecondary} textTransform="uppercase" letterSpacing="wide">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="bold" color={color || colors.textColor}>
        {value}
      </Text>
    </VStack>
  );

  // Datos procesados para los gráficos - mapea productVolumes a claves directas
  const processedChartData = useMemo(() => {
    if (!activeVolumeData || activeVolumeData.length === 0) return [];

    return activeVolumeData.map(item => {
      const processed: Record<string, unknown> = {
        period: item.period,
        periodLabel: item.periodLabel,
        total: item.total,
      };

      // Si hay productVolumes dinámico, usarlo directamente
      if (item.productVolumes) {
        Object.entries(item.productVolumes).forEach(([key, value]) => {
          processed[key] = value;
        });
      }

      // También incluir campos legacy para compatibilidad
      processed['lcImport'] = item.lcImport;
      processed['lcExport'] = item.lcExport;
      processed['guarantee'] = item.guarantee;
      processed['collection'] = item.collection;

      return processed;
    });
  }, [activeVolumeData]);

  const ProductChart = ({ product, index, is3D = false }: { product: ProductConfig; index: number; is3D?: boolean }) => {
    const stats = getProductStats(product.key);
    const isExpanded = expandedCharts[product.key] || false;
    const chartHeight = isExpanded ? '350px' : '200px';

    // Don't render chart if no data
    if (!processedChartData || processedChartData.length === 0) {
      return (
        <Box
          p={5}
          borderRadius="2xl"
          bg={isDark ? 'rgba(17, 24, 39, 0.8)' : 'white'}
          borderWidth="1px"
          borderColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
        >
          <Text fontSize="sm" color={colors.textColor} opacity={0.5} textAlign="center" py={4}>
            No hay datos disponibles para {getProductLabel(product.key)}
          </Text>
        </Box>
      );
    }

    return (
      <Box
        p={0}
        borderRadius="2xl"
        bg={isDark ? 'rgba(17, 24, 39, 0.8)' : 'white'}
        borderWidth="1px"
        borderColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
        boxShadow={isDark
          ? '0 4px 24px rgba(0,0,0,0.4)'
          : '0 4px 24px rgba(0,0,0,0.06)'
        }
        overflow="hidden"
        _hover={{
          boxShadow: isDark
            ? `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px ${product.color}40`
            : `0 8px 40px rgba(0,0,0,0.12), 0 0 0 1px ${product.color}40`,
          transform: 'translateY(-2px)',
        }}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        gridColumn={isExpanded ? { base: 'span 1', lg: 'span 2' } : 'span 1'}
      >
        {/* Header with gradient accent */}
        <Box
          bgGradient={`linear(to-r, ${product.color}, ${product.lightColor})`}
          h="4px"
        />

        <Box p={5} position="relative">
          {/* Action buttons - positioned top right */}
          <HStack position="absolute" top={3} right={3} gap={2} zIndex={1}>
            {/* View operations button */}
            <Box
              as="button"
              onClick={() => handleViewProductOperations(product)}
              display="flex"
              alignItems="center"
              justifyContent="center"
              w={8}
              h={8}
              borderRadius="lg"
              bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
              color={colors.textColorSecondary}
              borderWidth="1px"
              borderColor="transparent"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                bg: `${product.color}30`,
                color: product.color,
                borderColor: product.color,
                transform: 'scale(1.1)',
              }}
              _active={{
                transform: 'scale(0.95)',
              }}
              title={t('operations.viewOperations', 'Ver operaciones')}
            >
              <FiEye size={16} />
            </Box>
            {/* Expand/Collapse button */}
            <Box
              as="button"
              onClick={() => toggleExpand(product.key)}
              display="flex"
              alignItems="center"
              justifyContent="center"
              w={9}
              h={9}
              borderRadius="lg"
              bg={isExpanded ? product.color : isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
              color={isExpanded ? 'white' : colors.textColorSecondary}
              borderWidth="2px"
              borderColor={isExpanded ? product.color : isDark ? 'whiteAlpha.200' : 'blackAlpha.100'}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                bg: isExpanded ? product.darkColor : `${product.color}30`,
                color: isExpanded ? 'white' : product.color,
                borderColor: product.color,
                transform: 'scale(1.1)',
              }}
              _active={{
                transform: 'scale(0.95)',
              }}
              title={isExpanded ? t('common.collapse', 'Contraer') : t('common.expand', 'Expandir')}
            >
              {isExpanded ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
            </Box>
          </HStack>

          {/* Title Row */}
          <HStack gap={3} mb={4} pr={16}>
            <Box
              p={2}
              borderRadius="lg"
              bg={`${product.color}15`}
              flexShrink={0}
            >
              <FiDollarSign size={18} color={product.color} />
            </Box>
            <Box flex={1} minW={0}>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color={colors.textColor}
                lineHeight="1.3"
                wordBreak="break-word"
              >
                {getProductLabel(product.key)}
              </Text>
              <Text fontSize="xs" color={colors.textColorSecondary}>
                {stats.count} {t('businessDashboard.periods', 'períodos')}
              </Text>
            </Box>
          </HStack>

          {/* Main Value with Trend */}
          <Flex align="flex-end" gap={3} mb={4}>
            <Box>
              <Text
                fontSize="3xl"
                fontWeight="extrabold"
                color={product.color}
                lineHeight="1"
                letterSpacing="-0.02em"
              >
                {formatLargeValue(stats.total)}
              </Text>
              <Text fontSize="xs" color={colors.textColorSecondary} mt={1}>
                {t('businessDashboard.totalVolume', 'Volumen Total')}
              </Text>
            </Box>
            <TrendBadge trend={stats.trend} />
          </Flex>

          {/* Chart - 2D or 3D based on toggle */}
          <Box
            h={chartHeight}
            minH="200px"
            w="100%"
            mx={-5}
            mb={4}
            position="relative"
            transition="height 0.3s ease-in-out"
          >
            {/* Background pattern */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bgGradient={isDark
                ? `linear(to-b, ${product.color}05, transparent)`
                : `linear(to-b, ${product.color}08, transparent)`
              }
            />

            {is3D ? (
              /* 3D Bar Chart View */
              <Box
                h="100%"
                w="100%"
                display="flex"
                alignItems="flex-end"
                justifyContent="center"
                px={4}
                style={{ perspective: '600px' }}
              >
                <Flex
                  h="85%"
                  w="100%"
                  align="flex-end"
                  justify="space-around"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'rotateX(-12deg) rotateY(-8deg)'
                  }}
                >
                  {processedChartData.map((item, idx) => {
                    const value = item[product.key] as number || 0;
                    const maxVal = Math.max(...processedChartData.map(d => (d[product.key] as number) || 0), 1);
                    const heightPercent = (value / maxVal) * 100;
                    const barHeight = Math.max(10, (heightPercent / 100) * 140);
                    const periodLabel = item.periodLabel as string || '';

                    return (
                      <VStack key={idx} gap={1} align="center" flex={1} minW="40px">
                        {/* Value on hover */}
                        <Text
                          fontSize="9px"
                          fontWeight="bold"
                          color={product.color}
                          opacity={0.8}
                        >
                          {formatCompactValue(value)}
                        </Text>
                        <Box
                          position="relative"
                          w="30px"
                          h={`${barHeight}px`}
                          style={{ transformStyle: 'preserve-3d' }}
                          transition="all 0.3s"
                          _hover={{ transform: 'scale(1.15) translateY(-8px)' }}
                          cursor="pointer"
                        >
                          {/* Front face */}
                          <Box
                            position="absolute"
                            w="100%"
                            h="100%"
                            bg={product.color}
                            borderRadius="sm"
                            style={{
                              transform: 'translateZ(8px)',
                              background: `linear-gradient(to top, ${product.darkColor}, ${product.color})`,
                              boxShadow: `0 4px 15px ${product.color}50`
                            }}
                          />
                          {/* Top face */}
                          <Box
                            position="absolute"
                            w="100%"
                            h="16px"
                            borderRadius="sm"
                            style={{
                              transform: 'rotateX(90deg) translateZ(-8px)',
                              background: product.lightColor
                            }}
                          />
                          {/* Right face */}
                          <Box
                            position="absolute"
                            w="16px"
                            h="100%"
                            right="-8px"
                            borderRadius="sm"
                            style={{
                              transform: 'rotateY(90deg)',
                              background: `linear-gradient(to top, ${product.darkColor}, ${product.color})`,
                              opacity: 0.6
                            }}
                          />
                        </Box>
                        <Text
                          fontSize="9px"
                          color={colors.textColorSecondary}
                          textAlign="center"
                          whiteSpace="nowrap"
                        >
                          {periodLabel}
                        </Text>
                      </VStack>
                    );
                  })}
                </Flex>
              </Box>
            ) : (
              /* 2D Area Chart View */
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 1, height: 1 }}>
                <AreaChart
                  data={processedChartData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={`gradient-${product.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={product.color} stopOpacity={0.5} />
                      <stop offset="50%" stopColor={product.color} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={product.color} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id={`stroke-gradient-${product.key}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={product.darkColor} />
                      <stop offset="50%" stopColor={product.color} />
                      <stop offset="100%" stopColor={product.lightColor} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="periodLabel"
                    tick={{ fill: colors.textColorSecondary, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    dy={10}
                  />
                  <YAxis
                    tickFormatter={formatCompactValue}
                    tick={{ fill: colors.textColorSecondary, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    dx={-5}
                  />
                  <ReferenceLine
                    y={stats.average}
                    stroke={product.color}
                    strokeDasharray="5 5"
                    strokeOpacity={0.4}
                  />
                  {/* Pending Balance Reference Line - only show if positive and within chart range */}
                  {getPendingBalance(product.key) > 0 && getPendingBalance(product.key) <= stats.max * 1.5 && (
                    <ReferenceLine
                      y={getPendingBalance(product.key)}
                      stroke="#F97316"
                      strokeWidth={2}
                      strokeDasharray="8 4"
                      label={{
                        value: `Saldo: ${formatValue(getPendingBalance(product.key))}`,
                        position: 'right',
                        fill: '#F97316',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                    />
                  )}
                  <Tooltip
                    content={(props) => (
                      <CustomTooltip {...props} color={product.color} />
                    )}
                    cursor={{
                      stroke: product.color,
                      strokeWidth: 1,
                      strokeDasharray: '5 5',
                      strokeOpacity: 0.5
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={product.key}
                    stroke={`url(#stroke-gradient-${product.key})`}
                    fill={`url(#gradient-${product.key})`}
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: product.color,
                      stroke: 'white',
                      strokeWidth: 3,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Box>

          {/* Stats Row */}
          <Box
            bg={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
            borderRadius="xl"
            p={3}
            mx={-2}
          >
            <Flex justify="space-around" align="center" flexWrap="wrap" gap={2}>
              <StatItem
                label={t('businessDashboard.average', 'Promedio')}
                value={formatValue(stats.average)}
              />
              <Box w="1px" h="30px" bg={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} display={{ base: 'none', md: 'block' }} />
              <StatItem
                label={t('businessDashboard.maximum', 'Máximo')}
                value={formatValue(stats.max)}
                color="green.500"
              />
              <Box w="1px" h="30px" bg={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} display={{ base: 'none', md: 'block' }} />
              <StatItem
                label={t('businessDashboard.pendingBalance', 'Saldo Pend.')}
                value={formatValue(getPendingBalance(product.key))}
                color="orange.500"
              />
              <Box w="1px" h="30px" bg={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} display={{ base: 'none', md: 'block' }} />
              <StatItem
                label={t('businessDashboard.lastPeriod', 'Último')}
                value={formatValue(stats.lastValue)}
                color={product.color}
              />
            </Flex>
          </Box>
        </Box>
      </Box>
    );
  };

  const chartContent = (
    <Box
      p={6}
      borderRadius={isSectionExpanded ? 'none' : '2xl'}
      bg={isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.98)'}
      backdropFilter="blur(20px)"
      borderWidth={isSectionExpanded ? '0' : '1px'}
      borderColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
      boxShadow={isSectionExpanded ? 'none' : isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.06)'}
      h={isSectionExpanded ? '100%' : 'auto'}
      overflowY={isSectionExpanded ? 'auto' : 'visible'}
    >
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <HStack gap={3}>
          <Box
            p={2.5}
            borderRadius="xl"
            bgGradient="linear(to-br, blue.500, purple.500)"
          >
            <FiActivity size={22} color="white" />
          </Box>
          <Box>
            <Text fontSize="xl" fontWeight="bold" color={colors.textColor}>
              {t('businessDashboard.volumeByProduct')}
            </Text>
            <Text fontSize="sm" color={colors.textColorSecondary}>
              {t('businessDashboard.volumeSubtitle', 'Análisis de volumen por tipo de producto')}
            </Text>
          </Box>
        </HStack>
        <HStack gap={3}>

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
                    {localCurrency || 'Moneda'}
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
          {/* Show current currency badge when main filter has currency */}
          {!showLocalCurrencyFilter && dashboardFilters?.currency && (
            <Badge colorPalette="cyan" variant="subtle" px={2} py={1}>
              {dashboardFilters.currency}
            </Badge>
          )}
          {/* Total summary badge */}
          {activeProductComparison && activeProductComparison.length > 0 && (
            <Badge colorPalette="green" px={3} py={1} borderRadius="full" fontSize="xs">
              {activeProductComparison.reduce((sum, p) => sum + p.totalOperations, 0).toLocaleString()} ops · {formatLargeValue(activeProductComparison.reduce((sum, p) => sum + p.totalVolume, 0))}
            </Badge>
          )}
          <Box
            as="button"
            onClick={() => setIsSectionExpanded(!isSectionExpanded)}
            display="flex"
            alignItems="center"
            justifyContent="center"
            w={9}
            h={9}
            borderRadius="lg"
            bg={isSectionExpanded ? 'blue.500' : isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
            color={isSectionExpanded ? 'white' : colors.textColorSecondary}
            borderWidth="2px"
            borderColor={isSectionExpanded ? 'blue.500' : isDark ? 'whiteAlpha.200' : 'blackAlpha.100'}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              bg: isSectionExpanded ? 'blue.600' : 'blue.100',
              color: isSectionExpanded ? 'white' : 'blue.500',
              borderColor: 'blue.500',
              transform: 'scale(1.1)',
            }}
            _active={{
              transform: 'scale(0.95)',
            }}
            title={isSectionExpanded ? t('common.collapse', 'Contraer') : t('common.expand', 'Expandir')}
          >
            {isSectionExpanded ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
          </Box>
        </HStack>
      </Flex>

      {/* 2D/3D View Toggle Bar */}
      <Flex
        justify="center"
        align="center"
        mb={6}
        p={2}
        bg={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'}
        borderRadius="full"
        w="fit-content"
        mx="auto"
      >
        <HStack gap={1}>
          <Box
            as="button"
            px={5}
            py={2}
            borderRadius="full"
            bg={!is3DView ? 'blue.500' : 'transparent'}
            color={!is3DView ? 'white' : colors.textColorSecondary}
            fontWeight="semibold"
            fontSize="sm"
            cursor="pointer"
            transition="all 0.2s"
            display="flex"
            alignItems="center"
            gap={2}
            _hover={{ bg: !is3DView ? 'blue.600' : isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
            onClick={() => setIs3DView(false)}
          >
            <FiBarChart2 size={16} />
            Gráficos 2D
          </Box>
          <Box
            as="button"
            px={5}
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
            Vista 3D
          </Box>
        </HStack>
      </Flex>

      {/* Charts Grid - dinámico basado en productos */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        {dynamicProducts.map((product, index) => (
          <ProductChart key={product.key} product={product} index={index} is3D={is3DView} />
        ))}
      </SimpleGrid>

      {/* Product Operations Modal */}
      {isModalOpen && selectedProduct && (
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
            onClick={handleCloseModal}
          >
            <Box
              bg={isDark ? 'gray.900' : 'white'}
              borderRadius="xl"
              maxW="1200px"
              w="100%"
              maxH="90vh"
              overflowY="auto"
              p={6}
              onClick={(e) => e.stopPropagation()}
              boxShadow="2xl"
            >
              {/* Header */}
              <HStack justify="space-between" align="center" mb={6}>
                <HStack gap={3}>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg={selectedProduct.color}
                    color="white"
                  >
                    <FiDollarSign size={24} />
                  </Box>
                  <VStack align="start" gap={0}>
                    <Text fontSize="xl" fontWeight="bold" color={colors.textColor}>
                      {getProductLabel(selectedProduct.key)}
                    </Text>
                    <HStack gap={2} flexWrap="wrap">
                      <Badge colorPalette={getChakraColor(selectedProduct.key)}>
                        {t('businessDashboard.productOperations', 'Operaciones del Producto')}
                      </Badge>
                      {dashboardFilters?.period && dashboardFilters.period !== 'all' && (
                        <Badge colorPalette="purple" variant="solid">
                          {dashboardFilters.period === 'today' ? 'Hoy' :
                           dashboardFilters.period === 'week' ? 'Última Semana' :
                           dashboardFilters.period === 'month' ? 'Último Mes' :
                           dashboardFilters.period === 'quarter' ? 'Último Trimestre' :
                           dashboardFilters.period === 'semester' ? 'Último Semestre' :
                           dashboardFilters.period === 'year' ? 'Último Año' :
                           dashboardFilters.period === 'more_than_year' ? 'Mayor a 1 Año' : dashboardFilters.period}
                        </Badge>
                      )}
                      {dashboardFilters?.currency && (
                        <Badge colorPalette="yellow" variant="solid">
                          {dashboardFilters.currency}
                        </Badge>
                      )}
                      {dashboardFilters?.statusFilter && dashboardFilters.statusFilter !== 'OPEN' && (
                        <Badge colorPalette="gray" variant="solid">
                          {dashboardFilters.statusFilter === 'CLOSED' ? 'Solo Cerradas' :
                           dashboardFilters.statusFilter === 'ALL' ? 'Todas' : dashboardFilters.statusFilter}
                        </Badge>
                      )}
                    </HStack>
                  </VStack>
                </HStack>
                <HStack gap={4}>
                  <VStack align="end" gap={0}>
                    <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
                      {productOperations.length}
                    </Text>
                    <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
                      {t('operations.operations', 'operaciones')}
                    </Text>
                  </VStack>
                  <VStack align="end" gap={0}>
                    <Text fontSize="lg" fontWeight="bold" color={selectedProduct?.color || colors.textColor}>
                      {formatLargeValue(productOperations.reduce((sum, op) => sum + (op.amount || 0), 0))}
                    </Text>
                    <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
                      {t('operations.totalVolume', 'volumen total')}
                    </Text>
                  </VStack>
                  <IconButton
                    aria-label="Cerrar"
                    size="md"
                    variant="ghost"
                    bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
                    _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
                    onClick={handleCloseModal}
                  >
                    <FiX />
                  </IconButton>
                </HStack>
              </HStack>

              {/* Status Filter */}
              <Flex justify="space-between" align="center" mb={4}>
                <HStack gap={3}>
                  <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
                    {t('operations.filterByStatus', 'Filtrar por estado')}:
                  </Text>
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${colors.borderColor}`,
                      background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'white',
                      color: colors.textColor,
                      fontSize: '14px',
                      cursor: 'pointer',
                      minWidth: '180px',
                    }}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </HStack>
              </Flex>

              {/* Operations Table */}
              {loadingOperations ? (
                <Box textAlign="center" py={10}>
                  <Spinner size="xl" color={colors.primaryColor} />
                  <Text mt={4} color={colors.textColor}>
                    {t('common.loading', 'Cargando...')}
                  </Text>
                </Box>
              ) : productOperations.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text color={colors.textColor} opacity={0.5}>
                    {t('operations.noOperationsForProduct', 'No hay operaciones para este producto')}
                  </Text>
                </Box>
              ) : (
                <Box>
                  <Flex justify="space-between" align="center" mb={3}>
                    <Text fontSize="md" fontWeight="semibold" color={colors.textColor}>
                      {t('operations.operationsList', 'Lista de Operaciones')}
                    </Text>
                    <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
                      {t('common.showingRecords', 'Mostrando {{start}}-{{end}} de {{total}}', {
                        start: (currentPage - 1) * pageSize + 1,
                        end: Math.min(currentPage * pageSize, productOperations.length),
                        total: productOperations.length
                      })}
                    </Text>
                  </Flex>

                  <Box overflowX="auto">
                    <Table.Root size="sm">
                      <Table.Header>
                        <Table.Row bg={isDark ? 'whiteAlpha.50' : 'gray.50'}>
                          <Table.ColumnHeader color={colors.textColor}>
                            {t('operations.reference', 'Referencia')}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader color={colors.textColor}>
                            {t('operations.applicant', 'Solicitante')}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader color={colors.textColor}>
                            {t('operations.beneficiary', 'Beneficiario')}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader color={colors.textColor} textAlign="center">
                            {t('operations.currency', 'Moneda')}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader color={colors.textColor} textAlign="right">
                            {t('operations.amount', 'Monto')}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader color={colors.textColor} textAlign="center">
                            {t('operations.issueDate', 'Emisión')}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader color={colors.textColor} textAlign="center">
                            {t('operations.expiryDate', 'Vencimiento')}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader color={colors.textColor} textAlign="center">
                            {t('operations.stage', 'Etapa')}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader color={colors.textColor} textAlign="center">
                            {t('operations.status', 'Estado')}
                          </Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {paginatedOperations.map((op) => (
                          <Table.Row key={op.operationId} _hover={{ bg: isDark ? 'whiteAlpha.50' : 'gray.50' }}>
                            <Table.Cell>
                              <HStack>
                                <Text fontWeight="medium" color={colors.textColor}>
                                  {op.reference}
                                </Text>
                                <Badge size="sm" colorPalette="purple">
                                  {op.messageType}
                                </Badge>
                              </HStack>
                            </Table.Cell>
                            <Table.Cell>
                              <Text fontSize="sm" color={colors.textColor} maxW="200px" isTruncated>
                                {op.applicantName || '-'}
                              </Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text fontSize="sm" color={colors.textColor} maxW="200px" isTruncated>
                                {op.beneficiaryName || '-'}
                              </Text>
                            </Table.Cell>
                            <Table.Cell textAlign="center">
                              <Badge colorPalette="gray" variant="subtle" fontWeight="bold">
                                {op.currency || '-'}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell textAlign="right">
                              <Text fontWeight="semibold" color={colors.textColor}>
                                {formatAmount(op.amount, op.currency)}
                              </Text>
                            </Table.Cell>
                            <Table.Cell textAlign="center">
                              <Text fontSize="sm" color={colors.textColor}>
                                {formatDate(op.issueDate)}
                              </Text>
                            </Table.Cell>
                            <Table.Cell textAlign="center">
                              <Text fontSize="sm" color={colors.textColor}>
                                {formatDate(op.expiryDate)}
                              </Text>
                            </Table.Cell>
                            <Table.Cell textAlign="center">
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
                            </Table.Cell>
                            <Table.Cell textAlign="center">
                              <Badge
                                variant="outline"
                                colorPalette={
                                  op.status === 'ACTIVE' ? 'green' :
                                  op.status === 'PENDING_RESPONSE' ? 'orange' :
                                  op.status === 'ON_HOLD' ? 'gray' :
                                  op.status === 'CLOSED' ? 'gray' : 'blue'
                                }
                                size="sm"
                              >
                                {t(`operations.statuses.${op.status}`)}
                              </Badge>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <Flex justify="center" align="center" gap={4} mt={4} pt={4} borderTopWidth="1px" borderColor={colors.borderColor}>
                      <IconButton
                        aria-label="Página anterior"
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
                        aria-label="Página siguiente"
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <FiChevronRight />
                      </IconButton>
                    </Flex>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Portal>
      )}
    </Box>
  );

  // Si está expandido, mostrar en Portal a pantalla completa
  if (isSectionExpanded) {
    return (
      <Portal>
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg={isDark ? 'gray.900' : 'gray.50'}
          zIndex={1000}
          overflowY="auto"
        >
          {chartContent}
        </Box>
      </Portal>
    );
  }

  return chartContent;
};

export default VolumeChart;
