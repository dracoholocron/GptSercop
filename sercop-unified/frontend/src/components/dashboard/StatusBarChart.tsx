/**
 * ProductBarChart Component
 * Professional horizontal bar chart showing product distribution
 * Clicking on a product opens a modal with detailed operations list
 */

import { useState, useMemo, useEffect } from 'react';
import { Box, Text, HStack, VStack, Flex, Badge, IconButton, Portal, Table, Spinner, Menu } from '@chakra-ui/react';
import { FiFileText, FiGlobe, FiShield, FiDollarSign, FiTrendingUp, FiTrendingDown, FiMaximize2, FiX, FiEye, FiChevronLeft, FiChevronRight, FiFilter } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { ProductComparison, DashboardFilters } from '../../types/dashboard';
import type { Operation, ProductType } from '../../types/operations';
import { operationsApi } from '../../services/operationsApi';
import { dashboardService } from '../../services/dashboardService';

// Map product types to API ProductType values
// The backend accepts all these types directly
const PRODUCT_TYPE_MAP: Record<string, ProductType> = {
  LC_IMPORT: 'LC_IMPORT',
  LC_EXPORT: 'LC_EXPORT',
  GUARANTEE: 'GUARANTEE',
  COLLECTION: 'COLLECTION',
  COLLECTION_IMPORT: 'COLLECTION_IMPORT',
  COLLECTION_EXPORT: 'COLLECTION_EXPORT',
  STANDBY_LC: 'STANDBY_LC',
};

interface StatusBarChartProps {
  data: ProductComparison[];
  filters?: DashboardFilters;
  availableCurrencies?: string[];
}

const PRODUCT_ICONS: Record<string, React.ElementType> = {
  LC_IMPORT: FiFileText,
  LC_EXPORT: FiGlobe,
  GUARANTEE: FiShield,
  COLLECTION: FiDollarSign,
};

export const StatusBarChart = ({ data, filters: dashboardFilters, availableCurrencies }: StatusBarChartProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const [isMaximized, setIsMaximized] = useState(false);

  // Modal state for product operations detail
  const [selectedProduct, setSelectedProduct] = useState<ProductComparison | null>(null);
  const [productOperations, setProductOperations] = useState<Operation[]>([]);
  const [loadingOperations, setLoadingOperations] = useState(false);
  const [isOperationsModalOpen, setIsOperationsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const pageSize = 10;

  // Local currency filter state (affects only this section when main filter has no currency)
  const [localCurrency, setLocalCurrency] = useState<string>('');
  const [filteredData, setFilteredData] = useState<ProductComparison[] | null>(null);
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
        setFilteredData(filteredSummary.productComparison);
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

  const maxVolume = Math.max(...activeData.map(d => d.totalVolume), 1);
  const totalVolume = activeData.reduce((sum, d) => sum + d.totalVolume, 0);
  const totalOperations = activeData.reduce((sum, d) => sum + d.totalOperations, 0);

  const formatVolume = (value: number) => {
    // Always use M for millions to be consistent
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
      case 'more_than_year': return new Date(2000, 0, 1); // Very old date
      default: return null;
    }
  };

  // Get end date for "more_than_year" filter (operations older than 1 year)
  const getEndDateForPeriod = (period?: string): Date | null => {
    if (period === 'more_than_year') {
      const now = new Date();
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }
    return null;
  };

  const fetchProductOperations = async (product: ProductComparison, status?: string) => {
    setLoadingOperations(true);
    setCurrentPage(1);

    try {
      // Use the product type directly - backend accepts all types including COLLECTION_IMPORT, etc.
      const productType = PRODUCT_TYPE_MAP[product.productType] || product.productType as ProductType;
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
            // For "more_than_year": between startDate and endDate (older than 1 year)
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

  const handleViewProductOperations = async (product: ProductComparison, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setIsOperationsModalOpen(true);
    setStatusFilter('');
    await fetchProductOperations(product);
  };

  const handleStatusFilterChange = async (newStatus: string) => {
    setStatusFilter(newStatus);
    if (selectedProduct) {
      await fetchProductOperations(selectedProduct, newStatus);
    }
  };

  const handleCloseOperationsModal = () => {
    setIsOperationsModalOpen(false);
    setSelectedProduct(null);
    setProductOperations([]);
  };

  // Re-fetch operations when dashboard filters change while modal is open
  useEffect(() => {
    if (isOperationsModalOpen && selectedProduct) {
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

  const containerStyles = {
    p: 6,
    borderRadius: '2xl',
    bg: isDark ? 'rgba(17, 24, 39, 0.6)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderWidth: '1px',
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.06)',
  };

  const renderHeader = (showClose: boolean = false) => (
    <Flex justify="space-between" align="center" mb={6}>
      <HStack gap={3}>
        <Box>
          <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
            {t('businessDashboard.productDistribution', 'Distribución por Producto')}
          </Text>
        </Box>
        <Badge colorPalette="green" px={3} py={1} borderRadius="full" fontSize="xs">
          {totalOperations.toLocaleString()} ops · {formatVolume(totalVolume)}
        </Badge>

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
      {showClose ? (
        <IconButton
          aria-label="Cerrar"
          size="sm"
          variant="ghost"
          bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
          _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
          onClick={() => setIsMaximized(false)}
        >
          <FiX />
        </IconButton>
      ) : (
        <IconButton
          aria-label="Expandir"
          size="sm"
          variant="ghost"
          bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
          _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
          onClick={() => setIsMaximized(true)}
        >
          <FiMaximize2 />
        </IconButton>
      )}
    </Flex>
  );

  const renderProductItem = (item: ProductComparison, index: number) => {
    const Icon = PRODUCT_ICONS[item.productType] || FiFileText;
    const percentage = totalVolume > 0 ? (item.totalVolume / totalVolume) * 100 : 0;
    const barWidth = maxVolume > 0 ? (item.totalVolume / maxVolume) * 100 : 0;

    return (
      <Box
        key={item.productType}
        p={4}
        borderRadius="xl"
        bg={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
        borderWidth="1px"
        borderColor={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
        _hover={{
          bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          borderColor: item.color,
        }}
        transition="all 0.2s"
      >
        {/* Product Header */}
        <Flex justify="space-between" align="center" mb={3}>
          <HStack gap={3}>
            <Box
              p={2}
              borderRadius="lg"
              bg={`${item.color}20`}
            >
              <Icon size={18} color={item.color} />
            </Box>
            <Box>
              <Text fontSize="md" fontWeight="bold" color={colors.textColor}>
                {item.productLabel}
              </Text>
              <HStack gap={2} fontSize="xs" color={colors.textColorSecondary}>
                <Text>{item.totalOperations} ops</Text>
                <Text>·</Text>
                <Text>{item.uniqueClients} {t('businessDashboard.clients', 'clientes')}</Text>
              </HStack>
            </Box>
          </HStack>

          <HStack gap={3}>
            <VStack align="flex-end" gap={0}>
              <Text fontSize="lg" fontWeight="bold" color={item.color}>
                {formatVolume(item.totalVolume)}
              </Text>
              <HStack gap={1}>
                {item.growthPercent !== 0 && (
                  item.growthPercent > 0 ? (
                    <FiTrendingUp size={12} color="green" />
                  ) : (
                    <FiTrendingDown size={12} color="red" />
                  )
                )}
                <Text
                  fontSize="xs"
                  fontWeight="medium"
                  color={item.growthPercent >= 0 ? 'green.500' : 'red.500'}
                >
                  {item.growthPercent >= 0 ? '+' : ''}{item.growthPercent.toFixed(1)}%
                </Text>
              </HStack>
            </VStack>
            <IconButton
              aria-label={t('operations.viewOperations', 'Ver operaciones')}
              size="sm"
              variant="ghost"
              bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
              _hover={{ bg: `${item.color}30`, color: item.color }}
              onClick={(e) => handleViewProductOperations(item, e)}
            >
              <FiEye />
            </IconButton>
          </HStack>
        </Flex>

        {/* Progress Bar */}
        <HStack gap={3} align="center">
          <Box flex={1}>
            <Box
              h="10px"
              bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
              borderRadius="full"
              overflow="hidden"
            >
              <Box
                h="100%"
                w={`${barWidth}%`}
                bgGradient={`linear(to-r, ${item.color}, ${item.color}90)`}
                borderRadius="full"
                transition="width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                style={{
                  animationDelay: `${index * 150}ms`,
                }}
              />
            </Box>
          </Box>

          {/* Percentage Badge */}
          <Badge
            bg={`${item.color}20`}
            color={item.color}
            fontSize="xs"
            fontWeight="bold"
            px={2}
            py={0.5}
            borderRadius="full"
            minW="50px"
            textAlign="center"
          >
            {percentage.toFixed(1)}%
          </Badge>
        </HStack>

        {/* Stats Row */}
        <Flex justify="space-between" mt={3} fontSize="xs" color={colors.textColorSecondary}>
          <HStack gap={4}>
            <Box>
              <Text fontWeight="medium">{t('businessDashboard.avgSize', 'Prom.')}</Text>
              <Text color={colors.textColor} fontWeight="bold">
                {formatVolume(item.avgOperationSize)}
              </Text>
            </Box>
            <Box>
              <Text fontWeight="medium">{t('businessDashboard.active', 'Activas')}</Text>
              <Text color={colors.textColor} fontWeight="bold">
                {item.activeOperations}
              </Text>
            </Box>
            <Box>
              <Text fontWeight="medium">{t('businessDashboard.pendingBalance', 'Saldo Pend.')}</Text>
              <Text color="orange.500" fontWeight="bold">
                {formatVolume(item.pendingBalance || 0)}
              </Text>
            </Box>
          </HStack>
          <Box textAlign="right">
            <Text fontWeight="medium">{t('businessDashboard.volumeShare', 'Participación')}</Text>
            <Text color={item.color} fontWeight="bold">
              {item.volumePercentage.toFixed(1)}%
            </Text>
          </Box>
        </Flex>
      </Box>
    );
  };

  // Render operations modal (defined before isMaximized check so it can be used in both views)
  const renderOperationsModal = () => {
    if (!isOperationsModalOpen || !selectedProduct) return null;

    const Icon = PRODUCT_ICONS[selectedProduct.productType] || FiFileText;

    return (
      <Portal>
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg={isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)'}
          zIndex={1100}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
          onClick={handleCloseOperationsModal}
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
                  <Icon size={24} />
                </Box>
                <VStack align="start" gap={0}>
                  <Text fontSize="xl" fontWeight="bold" color={colors.textColor}>
                    {selectedProduct.productLabel}
                  </Text>
                  <HStack gap={2} flexWrap="wrap">
                    <Badge colorPalette="blue">
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
                    {formatVolume(productOperations.reduce((sum, op) => sum + (op.amount || 0), 0))}
                  </Text>
                  <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
                    {t('operations.totalVolume', 'volumen total')}
                  </Text>
                </VStack>
                <VStack align="end" gap={0}>
                  <Text fontSize="lg" fontWeight="bold" color="orange.500">
                    {formatVolume(productOperations.reduce((sum, op) => sum + (op.pendingBalance || 0), 0))}
                  </Text>
                  <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
                    {t('operations.pendingBalance', 'saldo pendiente')}
                  </Text>
                </VStack>
                <IconButton
                  aria-label="Cerrar"
                  size="md"
                  variant="ghost"
                  bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
                  _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
                  onClick={handleCloseOperationsModal}
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
                        <Table.ColumnHeader color={colors.textColor} textAlign="right">
                          {t('operations.pendingBalance', 'Saldo Pend.')}
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
                          <Table.Cell textAlign="right">
                            <Text fontWeight="semibold" color="orange.500">
                              {formatAmount(op.pendingBalance, op.currency)}
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
    );
  };

  // Maximized view
  if (isMaximized) {
    return (
      <>
        {/* Placeholder to maintain grid layout */}
        <Box {...containerStyles} minH="200px">
          {renderHeader(false)}
          <Text color={colors.textColor} opacity={0.5} textAlign="center" py={8}>
            Vista expandida abierta...
          </Text>
        </Box>

        {/* Fullscreen overlay */}
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
            onClick={() => setIsMaximized(false)}
          >
            <Box
              {...containerStyles}
              bg={isDark ? 'gray.900' : 'white'}
              maxW="1000px"
              w="100%"
              maxH="90vh"
              overflowY="auto"
              onClick={(e) => e.stopPropagation()}
            >
              {renderHeader(true)}

              <VStack gap={5} align="stretch">
                {activeData.map((item, index) => renderProductItem(item, index))}
              </VStack>
            </Box>
          </Box>
        </Portal>
        {renderOperationsModal()}
      </>
    );
  }

  // Normal view
  return (
    <>
      <Box {...containerStyles}>
        {renderHeader(false)}

        <VStack gap={5} align="stretch">
          {activeData.map((item, index) => renderProductItem(item, index))}
        </VStack>
      </Box>
      {renderOperationsModal()}
    </>
  );
};

export default StatusBarChart;
