/**
 * CPMarketStudyPage - Estudio de Mercado (RFI y Ajuste por Inflacion)
 * Permite gestionar solicitudes de informacion (RFI) y calcular ajustes de precios por inflacion.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Button,
  Table,
  Spinner,
  Icon,
  SimpleGrid,
  Card,
  Flex,
  Tabs,
  Input,
  Center,
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiDollarSign,
  FiFileText,
  FiBarChart2,
  FiSearch,
  FiCalendar,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../../components/ui/toaster';
import {
  getInflationIndices,
  getInflationAdjustedPrice,
  getRFI,
  getRFIStatistics,
  getRFIStatusColor,
  type CPRFI,
  type CPRFIResponse,
  type CPInflationIndex,
  type RFIStatistics,
  type InflationAdjustedPrice,
} from '../../services/cpMarketService';

// ============================================================================
// Helpers
// ============================================================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '---';
  try {
    return new Intl.DateTimeFormat('es-EC', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

// ============================================================================
// Demo data for RFI list (in production, this would come from an API list endpoint)
// ============================================================================

const DEMO_RFI_IDS = ['rfi-001', 'rfi-002', 'rfi-003'];

// ============================================================================
// Component
// ============================================================================

export const CPMarketStudyPage: React.FC = () => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  // Design tokens
  const cardBg = isDark ? 'gray.800' : 'white';
  const cardBorder = isDark ? 'gray.700' : 'gray.200';
  const headerBg = isDark ? 'gray.900' : 'gray.50';
  const accentGradient = isDark
    ? 'linear(to-r, purple.600, blue.600)'
    : 'linear(to-r, purple.500, blue.500)';
  const tableBg = isDark ? 'gray.750' : 'gray.50';
  const hoverBg = isDark ? 'gray.700' : 'gray.100';

  // ============================================================================
  // RFI State
  // ============================================================================

  const [rfiList, setRfiList] = useState<CPRFI[]>([]);
  const [rfiLoading, setRfiLoading] = useState(false);
  const [selectedRfi, setSelectedRfi] = useState<CPRFI | null>(null);
  const [rfiStatistics, setRfiStatistics] = useState<RFIStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // ============================================================================
  // Inflation State
  // ============================================================================

  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [fromMonth, setFromMonth] = useState<string>('');
  const [toMonth, setToMonth] = useState<string>('');
  const [inflationResult, setInflationResult] = useState<InflationAdjustedPrice | null>(null);
  const [inflationIndices, setInflationIndices] = useState<CPInflationIndex[]>([]);
  const [inflationLoading, setInflationLoading] = useState(false);
  const [indicesLoading, setIndicesLoading] = useState(false);
  const enableCpApi = import.meta.env.VITE_ENABLE_CP_API !== 'false';

  // ============================================================================
  // RFI Data loading
  // ============================================================================

  const loadRfiList = useCallback(async () => {
    if (!enableCpApi) {
      setRfiList([]);
      setRfiLoading(false);
      return;
    }
    setRfiLoading(true);
    try {
      const promises = DEMO_RFI_IDS.map((id) => getRFI(id).catch(() => null));
      const results = await Promise.all(promises);
      const valid = results.filter((r): r is CPRFI => r !== null);
      setRfiList(valid);
    } catch (error) {
      toaster.create({
        title: t('common.error', 'Error'),
        description: t('cpMarket.rfiLoadError', 'No se pudieron cargar las solicitudes de informacion'),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setRfiLoading(false);
    }
  }, [enableCpApi, t]);

  const loadRfiDetails = useCallback(
    async (rfi: CPRFI) => {
      setSelectedRfi(rfi);
      setStatsLoading(true);
      try {
        const stats = await getRFIStatistics(rfi.id);
        setRfiStatistics(stats);
      } catch (error) {
        setRfiStatistics(null);
        toaster.create({
          title: t('common.error', 'Error'),
          description: t('cpMarket.statsLoadError', 'No se pudieron cargar las estadisticas'),
          type: 'error',
          duration: 5000,
        });
      } finally {
        setStatsLoading(false);
      }
    },
    [t]
  );

  // ============================================================================
  // Inflation Data loading
  // ============================================================================

  const loadInflationIndices = useCallback(async () => {
    if (!enableCpApi) {
      setInflationIndices([]);
      setIndicesLoading(false);
      return;
    }
    setIndicesLoading(true);
    try {
      const data = await getInflationIndices('EC');
      setInflationIndices(Array.isArray(data) ? data : []);
    } catch (error) {
      toaster.create({
        title: t('common.error', 'Error'),
        description: t('cpMarket.indicesLoadError', 'No se pudieron cargar los indices de inflacion'),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIndicesLoading(false);
    }
  }, [enableCpApi, t]);

  const handleCalculateInflation = useCallback(async () => {
    if (!enableCpApi) {
      setInflationResult(null);
      return;
    }
    const price = parseFloat(originalPrice);
    if (isNaN(price) || price <= 0) {
      toaster.create({
        title: t('common.warning', 'Advertencia'),
        description: t('cpMarket.invalidPrice', 'Ingrese un precio valido'),
        type: 'warning',
        duration: 3000,
      });
      return;
    }
    if (!fromMonth || !toMonth) {
      toaster.create({
        title: t('common.warning', 'Advertencia'),
        description: t('cpMarket.invalidMonths', 'Ingrese los meses de origen y destino'),
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    setInflationLoading(true);
    try {
      const result = await getInflationAdjustedPrice(price, fromMonth, toMonth, 'EC');
      setInflationResult(result);
    } catch (error) {
      toaster.create({
        title: t('common.error', 'Error'),
        description: t('cpMarket.calculationError', 'No se pudo calcular el ajuste por inflacion'),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setInflationLoading(false);
    }
  }, [enableCpApi, originalPrice, fromMonth, toMonth, t]);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    loadRfiList();
    loadInflationIndices();
  }, [loadRfiList, loadInflationIndices]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Box flex={1} p={{ base: 4, md: 6 }} maxW="1400px" mx="auto">
      <VStack gap={6} align="stretch">
        {/* Header with gradient accent */}
        <Box
          bg={cardBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={cardBorder}
          overflow="hidden"
          shadow="sm"
        >
          <Box bgGradient={accentGradient} h="4px" />
          <Box p={6}>
            <VStack align="start" gap={1}>
              <HStack>
                <Icon as={FiBarChart2} boxSize={6} color={colors.primaryColor} />
                <Heading size="lg" color={colors.textColor}>
                  {t('cpMarket.title', 'Estudio de Mercado')}
                </Heading>
              </HStack>
              <Text fontSize="sm" color={colors.textColorSecondary}>
                {t(
                  'cpMarket.subtitle',
                  'Analisis de mercado: Solicitudes de Informacion (RFI) y ajuste de precios por inflacion'
                )}
              </Text>
            </VStack>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs.Root defaultValue="rfi">
          <Tabs.List mb={4}>
            <Tabs.Trigger value="rfi">
              <Icon as={FiFileText} mr={2} />
              {t('cpMarket.rfiTab', 'Solicitudes de Informacion (RFI)')}
            </Tabs.Trigger>
            <Tabs.Trigger value="inflation">
              <Icon as={FiTrendingUp} mr={2} />
              {t('cpMarket.inflationTab', 'Ajuste por Inflacion')}
            </Tabs.Trigger>
          </Tabs.List>

          {/* ================================================================ */}
          {/* RFI Tab */}
          {/* ================================================================ */}
          <Tabs.Content value="rfi">
            <VStack gap={6} align="stretch">
              {/* RFI List */}
              <Box
                bg={cardBg}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={cardBorder}
                overflow="hidden"
                shadow="sm"
              >
                <Box px={5} py={4} bg={headerBg} borderBottomWidth="1px" borderColor={cardBorder}>
                  <HStack justify="space-between" align="center">
                    <HStack gap={2}>
                      <Icon as={FiSearch} boxSize={5} color={colors.primaryColor} />
                      <Heading size="sm" color={colors.textColor}>
                        {t('cpMarket.rfiList', 'Solicitudes de Informacion')}
                      </Heading>
                    </HStack>
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      {rfiList.length} {t('cpMarket.records', 'registros')}
                    </Text>
                  </HStack>
                </Box>

                {rfiLoading ? (
                  <Center py={8}>
                    <Spinner size="md" color={colors.primaryColor} />
                  </Center>
                ) : rfiList.length === 0 ? (
                  <Center py={12}>
                    <VStack gap={3}>
                      <Icon as={FiFileText} boxSize={10} color={colors.textColorSecondary} />
                      <Text color={colors.textColorSecondary}>
                        {t('cpMarket.noRfis', 'No hay solicitudes de informacion registradas')}
                      </Text>
                    </VStack>
                  </Center>
                ) : (
                  <Box overflowX="auto">
                    <Table.Root size="sm" variant="outline">
                      <Table.Header>
                        <Table.Row bg={tableBg}>
                          <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600">
                            {t('cpMarket.rfiTitle', 'Titulo')}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600">
                            {t('cpMarket.cpcCode', 'Codigo CPC')}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600" textAlign="center">
                            {t('cpMarket.rfiStatus', 'Estado')}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600">
                            {t('cpMarket.closingDate', 'Fecha Cierre')}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600" textAlign="center">
                            {t('cpMarket.responses', 'Respuestas')}
                          </Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {rfiList.map((rfi) => {
                          const isSelected = selectedRfi?.id === rfi.id;
                          return (
                            <Table.Row
                              key={rfi.id}
                              cursor="pointer"
                              onClick={() => loadRfiDetails(rfi)}
                              bg={isSelected ? (isDark ? 'purple.900' : 'purple.50') : 'transparent'}
                              _hover={{ bg: isSelected ? undefined : hoverBg }}
                              transition="background 0.15s"
                              borderLeftWidth={isSelected ? '3px' : '0px'}
                              borderLeftColor="purple.500"
                            >
                              <Table.Cell>
                                <Text fontWeight="600" fontSize="sm" color={colors.textColor}>
                                  {rfi.title}
                                </Text>
                              </Table.Cell>
                              <Table.Cell>
                                <Badge variant="outline" fontSize="xs">
                                  {rfi.cpcCode}
                                </Badge>
                              </Table.Cell>
                              <Table.Cell textAlign="center">
                                <Badge
                                  colorPalette={getRFIStatusColor(rfi.status)}
                                  variant="subtle"
                                  fontSize="xs"
                                >
                                  {rfi.status}
                                </Badge>
                              </Table.Cell>
                              <Table.Cell>
                                <HStack gap={1}>
                                  <Icon as={FiCalendar} boxSize={3} color={colors.textColorSecondary} />
                                  <Text fontSize="sm" color={colors.textColor}>
                                    {formatDate(rfi.closingDate)}
                                  </Text>
                                </HStack>
                              </Table.Cell>
                              <Table.Cell textAlign="center">
                                <Badge colorPalette="blue" variant="subtle" fontSize="xs">
                                  {rfi.responses?.length || 0}
                                </Badge>
                              </Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                )}
              </Box>

              {/* RFI Detail + Statistics (when selected) */}
              {selectedRfi && (
                <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
                  {/* Responses Table */}
                  <Box
                    bg={cardBg}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={cardBorder}
                    overflow="hidden"
                    shadow="sm"
                  >
                    <Box px={5} py={4} bg={headerBg} borderBottomWidth="1px" borderColor={cardBorder}>
                      <VStack align="start" gap={1}>
                        <Heading size="sm" color={colors.textColor}>
                          {t('cpMarket.rfiResponses', 'Respuestas de Proveedores')}
                        </Heading>
                        <Text fontSize="xs" color={colors.textColorSecondary}>
                          {selectedRfi.title}
                        </Text>
                      </VStack>
                    </Box>

                    {(!selectedRfi.responses || selectedRfi.responses.length === 0) ? (
                      <Center py={8}>
                        <Text fontSize="sm" color={colors.textColorSecondary}>
                          {t('cpMarket.noResponses', 'No hay respuestas para esta solicitud')}
                        </Text>
                      </Center>
                    ) : (
                      <Box overflowX="auto">
                        <Table.Root size="sm" variant="outline">
                          <Table.Header>
                            <Table.Row bg={tableBg}>
                              <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600">
                                {t('cpMarket.supplier', 'Proveedor')}
                              </Table.ColumnHeader>
                              <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600" textAlign="right">
                                {t('cpMarket.unitPrice', 'P. Unitario')}
                              </Table.ColumnHeader>
                              <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600" textAlign="right">
                                {t('cpMarket.totalPrice', 'P. Total')}
                              </Table.ColumnHeader>
                              <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600" textAlign="center">
                                {t('cpMarket.deliveryDays', 'Entrega (dias)')}
                              </Table.ColumnHeader>
                              <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600">
                                {t('cpMarket.observations', 'Observaciones')}
                              </Table.ColumnHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {selectedRfi.responses.map((resp: CPRFIResponse) => (
                              <Table.Row key={resp.id}>
                                <Table.Cell>
                                  <Text fontWeight="600" fontSize="sm" color={colors.textColor}>
                                    {resp.supplierName}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell textAlign="right">
                                  <Text fontSize="sm" color={colors.textColor}>
                                    {formatCurrency(resp.unitPrice)}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell textAlign="right">
                                  <Text fontWeight="600" fontSize="sm" color="green.500">
                                    {formatCurrency(resp.totalPrice)}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell textAlign="center">
                                  <Text fontSize="sm" color={colors.textColor}>
                                    {resp.deliveryDays}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell>
                                  <Text fontSize="xs" color={colors.textColorSecondary} noOfLines={2}>
                                    {resp.observations || '---'}
                                  </Text>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      </Box>
                    )}
                  </Box>

                  {/* Statistics Panel */}
                  <Box
                    bg={cardBg}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={cardBorder}
                    overflow="hidden"
                    shadow="sm"
                  >
                    <Box px={5} py={4} bg={headerBg} borderBottomWidth="1px" borderColor={cardBorder}>
                      <HStack gap={2}>
                        <Icon as={FiBarChart2} boxSize={5} color={colors.primaryColor} />
                        <Heading size="sm" color={colors.textColor}>
                          {t('cpMarket.statistics', 'Estadisticas de Precios')}
                        </Heading>
                      </HStack>
                    </Box>

                    <Box p={5}>
                      {statsLoading ? (
                        <Center py={8}>
                          <Spinner size="md" color={colors.primaryColor} />
                        </Center>
                      ) : !rfiStatistics ? (
                        <Center py={8}>
                          <Text fontSize="sm" color={colors.textColorSecondary}>
                            {t('cpMarket.noStats', 'No hay estadisticas disponibles')}
                          </Text>
                        </Center>
                      ) : (
                        <SimpleGrid columns={2} gap={4}>
                          {/* Average Price */}
                          <Card.Root
                            bg={isDark ? 'whiteAlpha.50' : 'blue.50'}
                            borderWidth="1px"
                            borderColor={isDark ? 'blue.800' : 'blue.200'}
                            borderRadius="lg"
                          >
                            <Card.Body p={4}>
                              <VStack gap={1} align="start">
                                <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary}>
                                  {t('cpMarket.averagePrice', 'Precio Promedio')}
                                </Text>
                                <Text fontSize="xl" fontWeight="bold" color="blue.500">
                                  {formatCurrency(rfiStatistics.averagePrice)}
                                </Text>
                              </VStack>
                            </Card.Body>
                          </Card.Root>

                          {/* Min Price */}
                          <Card.Root
                            bg={isDark ? 'whiteAlpha.50' : 'green.50'}
                            borderWidth="1px"
                            borderColor={isDark ? 'green.800' : 'green.200'}
                            borderRadius="lg"
                          >
                            <Card.Body p={4}>
                              <VStack gap={1} align="start">
                                <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary}>
                                  {t('cpMarket.minPrice', 'Precio Minimo')}
                                </Text>
                                <Text fontSize="xl" fontWeight="bold" color="green.500">
                                  {formatCurrency(rfiStatistics.minPrice)}
                                </Text>
                              </VStack>
                            </Card.Body>
                          </Card.Root>

                          {/* Max Price */}
                          <Card.Root
                            bg={isDark ? 'whiteAlpha.50' : 'orange.50'}
                            borderWidth="1px"
                            borderColor={isDark ? 'orange.800' : 'orange.200'}
                            borderRadius="lg"
                          >
                            <Card.Body p={4}>
                              <VStack gap={1} align="start">
                                <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary}>
                                  {t('cpMarket.maxPrice', 'Precio Maximo')}
                                </Text>
                                <Text fontSize="xl" fontWeight="bold" color="orange.500">
                                  {formatCurrency(rfiStatistics.maxPrice)}
                                </Text>
                              </VStack>
                            </Card.Body>
                          </Card.Root>

                          {/* Median Price */}
                          <Card.Root
                            bg={isDark ? 'whiteAlpha.50' : 'purple.50'}
                            borderWidth="1px"
                            borderColor={isDark ? 'purple.800' : 'purple.200'}
                            borderRadius="lg"
                          >
                            <Card.Body p={4}>
                              <VStack gap={1} align="start">
                                <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary}>
                                  {t('cpMarket.medianPrice', 'Precio Mediana')}
                                </Text>
                                <Text fontSize="xl" fontWeight="bold" color="purple.500">
                                  {formatCurrency(rfiStatistics.medianPrice)}
                                </Text>
                              </VStack>
                            </Card.Body>
                          </Card.Root>
                        </SimpleGrid>
                      )}
                    </Box>
                  </Box>
                </SimpleGrid>
              )}
            </VStack>
          </Tabs.Content>

          {/* ================================================================ */}
          {/* Inflation Tab */}
          {/* ================================================================ */}
          <Tabs.Content value="inflation">
            <VStack gap={6} align="stretch">
              <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
                {/* Calculation Form */}
                <Box
                  bg={cardBg}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={cardBorder}
                  overflow="hidden"
                  shadow="sm"
                >
                  <Box px={5} py={4} bg={headerBg} borderBottomWidth="1px" borderColor={cardBorder}>
                    <HStack gap={2}>
                      <Icon as={FiDollarSign} boxSize={5} color={colors.primaryColor} />
                      <Heading size="sm" color={colors.textColor}>
                        {t('cpMarket.inflationCalculator', 'Calculadora de Ajuste por Inflacion')}
                      </Heading>
                    </HStack>
                  </Box>

                  <Box p={5}>
                    <VStack gap={4} align="stretch">
                      {/* Original Price */}
                      <Box>
                        <Text fontSize="sm" fontWeight="600" color={colors.textColor} mb={1}>
                          {t('cpMarket.originalPrice', 'Precio Original (USD)')}
                        </Text>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={originalPrice}
                          onChange={(e) => setOriginalPrice(e.target.value)}
                          bg={isDark ? 'whiteAlpha.100' : 'white'}
                          borderColor={cardBorder}
                          color={colors.textColor}
                          _placeholder={{ color: colors.textColorSecondary }}
                        />
                      </Box>

                      {/* From Month */}
                      <Box>
                        <Text fontSize="sm" fontWeight="600" color={colors.textColor} mb={1}>
                          <Icon as={FiCalendar} boxSize={3} mr={1} />
                          {t('cpMarket.fromMonth', 'Mes de Origen (YYYY-MM)')}
                        </Text>
                        <Input
                          type="month"
                          value={fromMonth}
                          onChange={(e) => setFromMonth(e.target.value)}
                          bg={isDark ? 'whiteAlpha.100' : 'white'}
                          borderColor={cardBorder}
                          color={colors.textColor}
                        />
                      </Box>

                      {/* To Month */}
                      <Box>
                        <Text fontSize="sm" fontWeight="600" color={colors.textColor} mb={1}>
                          <Icon as={FiCalendar} boxSize={3} mr={1} />
                          {t('cpMarket.toMonth', 'Mes de Destino (YYYY-MM)')}
                        </Text>
                        <Input
                          type="month"
                          value={toMonth}
                          onChange={(e) => setToMonth(e.target.value)}
                          bg={isDark ? 'whiteAlpha.100' : 'white'}
                          borderColor={cardBorder}
                          color={colors.textColor}
                        />
                      </Box>

                      {/* Calculate Button */}
                      <Button
                        colorPalette="purple"
                        onClick={handleCalculateInflation}
                        loading={inflationLoading}
                        disabled={inflationLoading}
                        w="full"
                      >
                        <Icon as={FiTrendingUp} mr={2} />
                        {t('cpMarket.calculate', 'Calcular')}
                      </Button>
                    </VStack>
                  </Box>
                </Box>

                {/* Result Card */}
                <Box
                  bg={cardBg}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={cardBorder}
                  overflow="hidden"
                  shadow="sm"
                >
                  <Box px={5} py={4} bg={headerBg} borderBottomWidth="1px" borderColor={cardBorder}>
                    <HStack gap={2}>
                      <Icon as={FiBarChart2} boxSize={5} color={colors.primaryColor} />
                      <Heading size="sm" color={colors.textColor}>
                        {t('cpMarket.inflationResult', 'Resultado del Ajuste')}
                      </Heading>
                    </HStack>
                  </Box>

                  <Box p={5}>
                    {!inflationResult ? (
                      <Center py={8}>
                        <VStack gap={3}>
                          <Icon as={FiTrendingUp} boxSize={10} color={colors.textColorSecondary} />
                          <Text fontSize="sm" color={colors.textColorSecondary} textAlign="center">
                            {t(
                              'cpMarket.noResult',
                              'Ingrese los datos y presione "Calcular" para ver el resultado del ajuste'
                            )}
                          </Text>
                        </VStack>
                      </Center>
                    ) : (
                      <VStack gap={4} align="stretch">
                        {/* Original vs Adjusted */}
                        <SimpleGrid columns={2} gap={4}>
                          <Card.Root
                            bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                            borderWidth="1px"
                            borderColor={cardBorder}
                            borderRadius="lg"
                          >
                            <Card.Body p={4}>
                              <VStack gap={1} align="start">
                                <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary}>
                                  {t('cpMarket.originalPriceLabel', 'Precio Original')}
                                </Text>
                                <Text fontSize="xl" fontWeight="bold" color={colors.textColor}>
                                  {formatCurrency(inflationResult.originalPrice)}
                                </Text>
                                <Text fontSize="xs" color={colors.textColorSecondary}>
                                  {inflationResult.fromMonth}
                                </Text>
                              </VStack>
                            </Card.Body>
                          </Card.Root>

                          <Card.Root
                            bg={isDark ? 'whiteAlpha.50' : 'green.50'}
                            borderWidth="1px"
                            borderColor={isDark ? 'green.800' : 'green.200'}
                            borderRadius="lg"
                          >
                            <Card.Body p={4}>
                              <VStack gap={1} align="start">
                                <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary}>
                                  {t('cpMarket.adjustedPriceLabel', 'Precio Ajustado')}
                                </Text>
                                <Text fontSize="xl" fontWeight="bold" color="green.500">
                                  {formatCurrency(inflationResult.adjustedPrice)}
                                </Text>
                                <Text fontSize="xs" color={colors.textColorSecondary}>
                                  {inflationResult.toMonth}
                                </Text>
                              </VStack>
                            </Card.Body>
                          </Card.Root>
                        </SimpleGrid>

                        {/* Adjustment Factor */}
                        <Card.Root
                          bg={isDark ? 'whiteAlpha.50' : 'purple.50'}
                          borderWidth="1px"
                          borderColor={isDark ? 'purple.800' : 'purple.200'}
                          borderRadius="lg"
                        >
                          <Card.Body p={4}>
                            <Flex justify="space-between" align="center">
                              <VStack gap={0} align="start">
                                <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary}>
                                  {t('cpMarket.adjustmentFactor', 'Factor de Ajuste')}
                                </Text>
                                <Text fontSize="sm" color={colors.textColor}>
                                  {t('cpMarket.fromTo', 'De')} {inflationResult.fromMonth} {t('cpMarket.to', 'a')}{' '}
                                  {inflationResult.toMonth}
                                </Text>
                              </VStack>
                              <Badge
                                colorPalette={inflationResult.adjustmentFactor >= 1 ? 'orange' : 'green'}
                                variant="subtle"
                                fontSize="lg"
                                px={3}
                                py={1}
                              >
                                {formatPercentage(inflationResult.adjustmentFactor - 1)}
                              </Badge>
                            </Flex>
                          </Card.Body>
                        </Card.Root>
                      </VStack>
                    )}
                  </Box>
                </Box>
              </SimpleGrid>

              {/* Inflation Indices Table */}
              <Box
                bg={cardBg}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={cardBorder}
                overflow="hidden"
                shadow="sm"
              >
                <Box px={5} py={4} bg={headerBg} borderBottomWidth="1px" borderColor={cardBorder}>
                  <HStack justify="space-between" align="center">
                    <HStack gap={2}>
                      <Icon as={FiTrendingUp} boxSize={5} color={colors.primaryColor} />
                      <Heading size="sm" color={colors.textColor}>
                        {t('cpMarket.inflationIndices', 'Indices de Inflacion (Ecuador)')}
                      </Heading>
                    </HStack>
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      {inflationIndices.length} {t('cpMarket.records', 'registros')}
                    </Text>
                  </HStack>
                </Box>

                {indicesLoading ? (
                  <Center py={8}>
                    <Spinner size="md" color={colors.primaryColor} />
                  </Center>
                ) : inflationIndices.length === 0 ? (
                  <Center py={12}>
                    <VStack gap={3}>
                      <Icon as={FiTrendingUp} boxSize={10} color={colors.textColorSecondary} />
                      <Text color={colors.textColorSecondary}>
                        {t('cpMarket.noIndices', 'No hay indices de inflacion disponibles')}
                      </Text>
                    </VStack>
                  </Center>
                ) : (
                  <Box overflowX="auto" maxH="400px" overflowY="auto">
                    <Table.Root size="sm" variant="outline">
                      <Table.Header>
                        <Table.Row bg={tableBg}>
                          <Table.ColumnHeader
                            color={colors.textColorSecondary}
                            fontSize="xs"
                            fontWeight="600"
                            position="sticky"
                            top={0}
                            bg={tableBg}
                            zIndex={1}
                          >
                            {t('cpMarket.yearMonth', 'Periodo')}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            color={colors.textColorSecondary}
                            fontSize="xs"
                            fontWeight="600"
                            textAlign="right"
                            position="sticky"
                            top={0}
                            bg={tableBg}
                            zIndex={1}
                          >
                            {t('cpMarket.indexValue', 'Valor del Indice')}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            color={colors.textColorSecondary}
                            fontSize="xs"
                            fontWeight="600"
                            position="sticky"
                            top={0}
                            bg={tableBg}
                            zIndex={1}
                          >
                            {t('cpMarket.source', 'Fuente')}
                          </Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {inflationIndices.map((idx) => (
                          <Table.Row key={idx.id}>
                            <Table.Cell>
                              <Text fontWeight="600" fontSize="sm" color={colors.textColor}>
                                {idx.yearMonth}
                              </Text>
                            </Table.Cell>
                            <Table.Cell textAlign="right">
                              <Text fontSize="sm" color={colors.textColor}>
                                {idx.indexValue.toFixed(4)}
                              </Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge variant="outline" fontSize="xs">
                                {idx.source}
                              </Badge>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                )}
              </Box>
            </VStack>
          </Tabs.Content>
        </Tabs.Root>
      </VStack>
    </Box>
  );
};

export default CPMarketStudyPage;
