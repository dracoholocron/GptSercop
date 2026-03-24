/**
 * AIResultsPanel - Display AI response results with KPIs, charts, tables
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  SimpleGrid,
  Card,
  Table,
  Heading,
  Icon,
  Input,
  InputGroup,
  Spinner,
  Collapsible,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiRefreshCw,
  FiClock,
  FiAlertCircle,
  FiCheck,
  FiMail,
  FiFile,
  FiDollarSign,
  FiInbox,
  FiCalendar,
  FiTrendingUp,
  FiX,
  FiDownload,
  FiChevronUp,
  FiChevronDown,
  FiChevronRight,
  FiSearch,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { type AIResponse, type AIResult, type KPIData } from '../../services/aiAssistantService';
import { type AICategory, type AIOption } from '../../config/aiCategories';
import { AIChart } from './AICharts';
import { aiExportService } from '../../services/aiExportService';
import { gleService, type GleAccountTransactionsReport } from '../../services/gleService';

interface AIResultsPanelProps {
  response: AIResponse;
  option: AIOption;
  category: AICategory;
  onNewQuery: () => void;
  onBackToCategory: () => void;
  onChangePeriod?: (period: string) => void;
  currentPeriod?: string;
}

const PERIOD_OPTIONS = [
  { value: 'últimos 3 meses', labelKey: 'ai.period.last3Months' },
  { value: 'últimos 6 meses', labelKey: 'ai.period.last6Months' },
  { value: 'este mes', labelKey: 'ai.period.thisMonth' },
  { value: 'mes pasado', labelKey: 'ai.period.lastMonth' },
  { value: 'este trimestre', labelKey: 'ai.period.thisQuarter' },
  { value: 'este año', labelKey: 'ai.period.thisYear' },
];

const ICONS: Record<string, React.ElementType> = {
  clock: FiClock,
  alert: FiAlertCircle,
  check: FiCheck,
  mail: FiMail,
  file: FiFile,
  dollar: FiDollarSign,
  inbox: FiInbox,
  calendar: FiCalendar,
  send: FiTrendingUp,
  x: FiX,
};

export const AIResultsPanel = ({
  response,
  option,
  category,
  onNewQuery,
  onBackToCategory,
  onChangePeriod,
  currentPeriod,
}: AIResultsPanelProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const [exporting, setExporting] = useState(false);
  const chartRefsMap = useRef<Map<number, HTMLDivElement>>(new Map());

  const OptionIcon = option.icon;

  // Register chart ref
  const registerChartRef = useCallback((index: number, element: HTMLDivElement | null) => {
    if (element) {
      chartRefsMap.current.set(index, element);
    } else {
      chartRefsMap.current.delete(index);
    }
  }, []);

  // Handle PDF export
  const handleExportPdf = useCallback(async () => {
    setExporting(true);
    try {
      await aiExportService.generatePdf(
        response,
        t(option.titleKey),
        chartRefsMap.current
      );
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExporting(false);
    }
  }, [response, option.titleKey, t]);

  return (
    <VStack gap={4} align="stretch">
      {/* Header with navigation */}
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <HStack gap={3}>
          <Box p={2} bg={`${category.color}.100`} borderRadius="md">
            <Icon as={OptionIcon} boxSize={5} color={`${category.color}.600`} />
          </Box>
          <Text fontWeight="semibold" fontSize="lg" color={colors.textColor}>
            {t(option.titleKey)}
          </Text>
        </HStack>
        <HStack gap={2}>
          <Button
            colorScheme="blue"
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            loading={exporting}
            loadingText={t('ai.exportingPdf')}
          >
            <FiDownload style={{ marginRight: 8 }} />
            {t('ai.exportPdf')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToCategory}
          >
            <FiArrowLeft style={{ marginRight: 8 }} />
            {t('ai.backToCategory', { category: t(category.titleKey) })}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewQuery}
          >
            <FiRefreshCw style={{ marginRight: 8 }} />
            {t('ai.newQuery')}
          </Button>
        </HStack>
      </HStack>

      {/* Response message */}
      <Box
        p={4}
        bg={`${category.color}.50`}
        borderRadius="lg"
        borderLeft="4px solid"
        borderLeftColor={`${category.color}.500`}
      >
        <Text color={colors.textColor}>{response.message}</Text>
      </Box>

      {/* Period selector for COMMISSIONS_CHARGED */}
      {option.handler === 'COMMISSIONS_CHARGED' && onChangePeriod && (
        <Box p={3} bg={colors.cardBg} borderRadius="lg" borderWidth="1px" borderColor={colors.borderColor}>
          <HStack gap={2} flexWrap="wrap">
            <Text fontSize="sm" fontWeight="medium" color={colors.textColorSecondary} mr={2}>
              {t('ai.input.period')}:
            </Text>
            {PERIOD_OPTIONS.map((period) => (
              <Button
                key={period.value}
                size="sm"
                variant={currentPeriod === period.value ? 'solid' : 'outline'}
                colorScheme={currentPeriod === period.value ? category.color : 'gray'}
                onClick={() => onChangePeriod(period.value)}
              >
                {t(period.labelKey)}
              </Button>
            ))}
          </HStack>
        </Box>
      )}

      {/* Results */}
      {response.results && response.results.length > 0 && (
        <VStack gap={4} align="stretch">
          {response.results.map((result, idx) => (
            <ResultRenderer
              key={idx}
              result={result}
              colors={colors}
              chartIndex={idx}
              onChartRef={registerChartRef}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
};

// Result renderer components
interface ResultRendererProps {
  result: AIResult;
  colors: ReturnType<ReturnType<typeof useTheme>['getColors']>;
  chartIndex?: number;
  onChartRef?: (index: number, element: HTMLDivElement | null) => void;
}

const ResultRenderer = ({ result, colors, chartIndex, onChartRef }: ResultRendererProps) => {
  switch (result.type) {
    case 'kpi':
      return <KPIRenderer result={result} colors={colors} />;
    case 'chart':
      return <ChartRenderer result={result} colors={colors} chartIndex={chartIndex} onChartRef={onChartRef} />;
    case 'table':
      return <TableRenderer result={result} colors={colors} />;
    case 'text':
      return <TextRenderer result={result} colors={colors} />;
    case 'error':
      return <ErrorRenderer result={result} colors={colors} />;
    default:
      return null;
  }
};

const KPIRenderer = ({ result }: ResultRendererProps) => {
  const kpis = result.data as KPIData[];

  return (
    <Card.Root>
      <Card.Header>
        <Heading size="sm">{result.title}</Heading>
      </Card.Header>
      <Card.Body>
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
          {kpis.map((kpi, idx) => {
            const KPIIcon = ICONS[kpi.icon || 'file'] || FiFile;
            return (
              <Box
                key={idx}
                p={4}
                bg={`${kpi.color || 'gray'}.50`}
                borderRadius="lg"
                borderLeft="4px solid"
                borderLeftColor={`${kpi.color || 'gray'}.500`}
              >
                <HStack gap={2} mb={2}>
                  <KPIIcon size={16} color={`var(--chakra-colors-${kpi.color || 'gray'}-600)`} />
                  <Text fontSize="xs" color={`${kpi.color || 'gray'}.600`} fontWeight="medium">
                    {kpi.label}
                  </Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold" color={`${kpi.color || 'gray'}.700`}>
                  {kpi.value}
                </Text>
              </Box>
            );
          })}
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
};

const ChartRenderer = ({ result, chartIndex, onChartRef }: ResultRendererProps) => {
  const data = result.data as Record<string, unknown>[];
  const config = result.chartConfig;

  if (!data || data.length === 0) return null;

  // Determine chart type from config or default to bar
  const chartType = (config?.type || 'bar') as 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'horizontalBar';

  return (
    <Card.Root>
      <Card.Header>
        <Heading size="sm">{result.title}</Heading>
      </Card.Header>
      <Card.Body>
        <Box
          ref={(el: HTMLDivElement | null) => {
            if (onChartRef && chartIndex !== undefined) {
              onChartRef(chartIndex, el);
            }
          }}
        >
          <AIChart
            data={data as Array<{ [key: string]: string | number }>}
            type={chartType}
            colors={config?.colors}
            height={320}
            showLegend={true}
            showGrid={true}
          />
        </Box>
      </Card.Body>
    </Card.Root>
  );
};

const PAGE_SIZES = [10, 25, 50, 100];

// Drilldown configuration interface
interface DrilldownConfig {
  enabled: boolean;
  type: 'account-transactions';
  keyColumns: { account: string; currency: string };
}

const TableRenderer = ({ result, colors }: ResultRendererProps) => {
  const { t } = useTranslation();
  const data = result.data as Record<string, unknown>[];
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Drill-down state
  const drilldownConfig = result.tableConfig?.drilldown as DrilldownConfig | undefined;
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<GleAccountTransactionsReport | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [drilldownError, setDrilldownError] = useState<string | null>(null);
  const [drilldownSortColumn, setDrilldownSortColumn] = useState<string | null>(null);
  const [drilldownSortDirection, setDrilldownSortDirection] = useState<'asc' | 'desc'>('desc');
  const [drilldownPage, setDrilldownPage] = useState(0);
  const [drilldownPageSize, setDrilldownPageSize] = useState(50);
  const [drilldownAccount, setDrilldownAccount] = useState<string>('');
  const [drilldownCurrency, setDrilldownCurrency] = useState<string>('');

  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);

  // Parse value for sorting (handle formatted numbers)
  const parseValue = (val: unknown): string | number => {
    if (val === null || val === undefined) return '';
    const strVal = String(val);
    // Try to parse as number (remove thousand separators)
    const numVal = parseFloat(strVal.replace(/,/g, ''));
    if (!isNaN(numVal)) return numVal;
    return strVal.toLowerCase();
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply filters
    // Supports: texto* (starts with), *texto (ends with), texto (contains)
    Object.entries(filters).forEach(([col, filterVal]) => {
      if (filterVal.trim()) {
        const trimmedFilter = filterVal.trim();
        const lowerFilter = trimmedFilter.toLowerCase();

        filtered = filtered.filter(row => {
          const cellValue = String(row[col]).toLowerCase();

          // texto* = starts with (asterisk at end)
          if (trimmedFilter.endsWith('*') && !trimmedFilter.startsWith('*')) {
            const searchTerm = lowerFilter.substring(0, lowerFilter.length - 1);
            return cellValue.startsWith(searchTerm);
          }
          // *texto = ends with (asterisk at start)
          if (trimmedFilter.startsWith('*') && !trimmedFilter.endsWith('*')) {
            const searchTerm = lowerFilter.substring(1);
            return cellValue.endsWith(searchTerm);
          }
          // Default = contains
          return cellValue.includes(lowerFilter);
        });
      }
    });

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = parseValue(a[sortColumn]);
        const bVal = parseValue(b[sortColumn]);

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const comparison = String(aVal).localeCompare(String(bVal));
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, filters, sortColumn, sortDirection]);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (col: string, value: string) => {
    setFilters(prev => ({ ...prev, [col]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({});
    setSortColumn(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v.trim() !== '');

  // Drill-down handler
  const handleRowClick = async (row: Record<string, unknown>, rowIndex: number) => {
    if (!drilldownConfig?.enabled) return;

    const { account: accountCol, currency: currencyCol } = drilldownConfig.keyColumns;
    const account = String(row[accountCol] || '');
    const currency = String(row[currencyCol] || '');
    const rowKey = `${rowIndex}-${account}-${currency}`;

    // Toggle if clicking the same row
    if (expandedRowKey === rowKey) {
      setExpandedRowKey(null);
      setDrilldownData(null);
      return;
    }

    setExpandedRowKey(rowKey);
    setDrilldownLoading(true);
    setDrilldownError(null);
    setDrilldownData(null);
    setDrilldownPage(0);
    setDrilldownAccount(account);
    setDrilldownCurrency(currency);

    try {
      const data = await gleService.getAccountTransactions(account, currency, 0, drilldownPageSize);
      setDrilldownData(data);
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      setDrilldownError(t('ai.drilldown.error', 'Error al cargar las transacciones'));
    } finally {
      setDrilldownLoading(false);
    }
  };

  // Drill-down pagination handler
  const handleDrilldownPageChange = async (newPage: number) => {
    if (!drilldownAccount || !drilldownCurrency) return;

    setDrilldownLoading(true);
    setDrilldownPage(newPage);

    try {
      const data = await gleService.getAccountTransactions(drilldownAccount, drilldownCurrency, newPage, drilldownPageSize);
      setDrilldownData(data);
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      setDrilldownError(t('ai.drilldown.error', 'Error al cargar las transacciones'));
    } finally {
      setDrilldownLoading(false);
    }
  };

  // Drill-down page size handler
  const handleDrilldownPageSizeChange = async (newSize: number) => {
    if (!drilldownAccount || !drilldownCurrency) return;

    setDrilldownLoading(true);
    setDrilldownPageSize(newSize);
    setDrilldownPage(0);

    try {
      const data = await gleService.getAccountTransactions(drilldownAccount, drilldownCurrency, 0, newSize);
      setDrilldownData(data);
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      setDrilldownError(t('ai.drilldown.error', 'Error al cargar las transacciones'));
    } finally {
      setDrilldownLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Format number for display
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Handle drilldown sort
  const handleDrilldownSort = (column: string) => {
    if (drilldownSortColumn === column) {
      setDrilldownSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setDrilldownSortColumn(column);
      setDrilldownSortDirection('asc');
    }
  };

  // Get sorted drilldown transactions
  const getSortedTransactions = () => {
    if (!drilldownData?.transactions) return [];

    const transactions = [...drilldownData.transactions];

    if (!drilldownSortColumn) return transactions;

    return transactions.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (drilldownSortColumn) {
        case 'bookingDate':
          aVal = a.bookingDate || '';
          bVal = b.bookingDate || '';
          break;
        case 'reference':
          aVal = (a.reference || '').toLowerCase();
          bVal = (b.reference || '').toLowerCase();
          break;
        case 'debit':
          aVal = a.debit || 0;
          bVal = b.debit || 0;
          break;
        case 'credit':
          aVal = a.credit || 0;
          bVal = b.credit || 0;
          break;
        case 'balance':
          aVal = a.balance || 0;
          bVal = b.balance || 0;
          break;
        case 'description':
          aVal = (a.description || a.description2 || '').toLowerCase();
          bVal = (b.description || b.description2 || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return drilldownSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const comparison = String(aVal).localeCompare(String(bVal));
      return drilldownSortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Pagination calculations
  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = processedData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <Card.Root>
      <Card.Header>
        <HStack justify="space-between" align="center">
          <Heading size="sm">{result.title}</Heading>
          <HStack gap={2}>
            <Text fontSize="xs" color={colors.textColorSecondary}>
              {processedData.length} / {data.length}
            </Text>
            <Button
              size="xs"
              variant={showFilters ? 'solid' : 'outline'}
              colorScheme="blue"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Icon as={FiSearch} mr={1} />
              {t('common.filter', 'Filtrar')}
            </Button>
            {(hasActiveFilters || sortColumn) && (
              <Button
                size="xs"
                variant="ghost"
                colorScheme="gray"
                onClick={clearFilters}
              >
                <Icon as={FiX} mr={1} />
                {t('common.clear', 'Limpiar')}
              </Button>
            )}
          </HStack>
        </HStack>
      </Card.Header>
      <Card.Body p={0}>
        <Box overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                {/* Extra column for expand icon if drilldown enabled */}
                {drilldownConfig?.enabled && (
                  <Table.ColumnHeader px={2} py={2} width="30px" title={t('ai.drilldown.clickToExpand', 'Clic para ver detalle')}>
                    <Icon as={FiChevronRight} color="gray.400" boxSize={4} />
                  </Table.ColumnHeader>
                )}
                {columns.map((col) => (
                  <Table.ColumnHeader
                    key={col}
                    px={4}
                    py={2}
                    cursor="pointer"
                    onClick={() => handleSort(col)}
                    _hover={{ bg: colors.bgColor }}
                    userSelect="none"
                  >
                    <HStack gap={1} justify="space-between">
                      <Text fontWeight="semibold">{col}</Text>
                      <Box w={4}>
                        {sortColumn === col && (
                          <Icon
                            as={sortDirection === 'asc' ? FiChevronUp : FiChevronDown}
                            color="blue.500"
                          />
                        )}
                      </Box>
                    </HStack>
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
              {showFilters && (
                <Table.Row>
                  {/* Empty cell for expand column if drilldown enabled */}
                  {drilldownConfig?.enabled && (
                    <Table.ColumnHeader px={2} py={1} bg={colors.bgColor} />
                  )}
                  {columns.map((col) => (
                    <Table.ColumnHeader key={`filter-${col}`} px={2} py={1} bg={colors.bgColor}>
                      <Input
                        size="xs"
                        placeholder="52* o *USD"
                        title="texto* = inicia con, *texto = termina con, texto = contiene"
                        value={filters[col] || ''}
                        onChange={(e) => handleFilterChange(col, e.target.value)}
                        bg={colors.cardBg}
                      />
                    </Table.ColumnHeader>
                  ))}
                </Table.Row>
              )}
            </Table.Header>
            <Table.Body>
              {paginatedData.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={columns.length} textAlign="center" py={4}>
                    <Text color={colors.textColorSecondary}>
                      {t('common.noResults', 'No se encontraron resultados')}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                paginatedData.map((row, idx) => {
                  const realIndex = startIndex + idx;
                  const account = drilldownConfig ? String(row[drilldownConfig.keyColumns.account] || '') : '';
                  const currency = drilldownConfig ? String(row[drilldownConfig.keyColumns.currency] || '') : '';
                  const rowKey = `${realIndex}-${account}-${currency}`;
                  const isExpanded = expandedRowKey === rowKey;

                  return (
                    <>
                      <Table.Row
                        key={idx}
                        _hover={{ bg: colors.bgColor }}
                        cursor={drilldownConfig?.enabled ? 'pointer' : 'default'}
                        onClick={() => handleRowClick(row, realIndex)}
                        bg={isExpanded ? `blue.50` : undefined}
                      >
                        {drilldownConfig?.enabled && (
                          <Table.Cell px={2} py={2} width="30px">
                            <Icon
                              as={isExpanded ? FiChevronDown : FiChevronRight}
                              color="blue.500"
                              boxSize={4}
                            />
                          </Table.Cell>
                        )}
                        {columns.map((col) => (
                          <Table.Cell key={col} px={4} py={2}>
                            {String(row[col])}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                      {/* Drill-down expanded content */}
                      {isExpanded && (
                        <Table.Row key={`${idx}-drilldown`}>
                          <Table.Cell colSpan={columns.length + (drilldownConfig?.enabled ? 1 : 0)} p={0}>
                            <Box
                              bg="blue.50"
                              borderLeft="4px solid"
                              borderLeftColor="blue.500"
                              p={4}
                            >
                              {drilldownLoading ? (
                                <HStack justify="center" py={4}>
                                  <Spinner size="sm" color="blue.500" />
                                  <Text color="blue.600">{t('ai.drilldown.loading', 'Cargando transacciones...')}</Text>
                                </HStack>
                              ) : drilldownError ? (
                                <HStack justify="center" py={4}>
                                  <Icon as={FiAlertCircle} color="red.500" />
                                  <Text color="red.600">{drilldownError}</Text>
                                </HStack>
                              ) : drilldownData ? (
                                <VStack align="stretch" gap={3}>
                                  {/* Summary header */}
                                  <HStack justify="space-between" flexWrap="wrap" gap={2}>
                                    <Text fontWeight="semibold" color="blue.700">
                                      {t('ai.drilldown.title', 'Detalle de Transacciones')} - {drilldownData.account} ({drilldownData.currency})
                                    </Text>
                                    <HStack gap={4} fontSize="sm">
                                      <Text>
                                        <Text as="span" color="gray.600">{t('ai.drilldown.total', 'Total')}:</Text>{' '}
                                        <Text as="span" fontWeight="bold">{drilldownData.totalTransactions}</Text>
                                      </Text>
                                      <Text>
                                        <Text as="span" color="green.600">{t('ai.drilldown.debits', 'Débitos')}:</Text>{' '}
                                        <Text as="span" fontWeight="bold" color="green.700">{formatNumber(drilldownData.totalDebits)}</Text>
                                      </Text>
                                      <Text>
                                        <Text as="span" color="red.600">{t('ai.drilldown.credits', 'Créditos')}:</Text>{' '}
                                        <Text as="span" fontWeight="bold" color="red.700">{formatNumber(drilldownData.totalCredits)}</Text>
                                      </Text>
                                      <Text>
                                        <Text as="span" color="blue.600">{t('ai.drilldown.balance', 'Saldo')}:</Text>{' '}
                                        <Text as="span" fontWeight="bold" color="blue.700">{formatNumber(drilldownData.balance)}</Text>
                                      </Text>
                                    </HStack>
                                  </HStack>
                                  {/* Transactions table */}
                                  <Box overflowX="auto" maxH="300px" overflowY="auto" bg="white" borderRadius="md" border="1px solid" borderColor="blue.200">
                                    <Table.Root size="sm">
                                      <Table.Header position="sticky" top={0} bg="white" zIndex={1}>
                                        <Table.Row>
                                          <Table.ColumnHeader
                                            px={3} py={2}
                                            cursor="pointer"
                                            onClick={() => handleDrilldownSort('bookingDate')}
                                            _hover={{ bg: 'gray.100' }}
                                            userSelect="none"
                                          >
                                            <HStack gap={1}>
                                              <Text>{t('ai.drilldown.date', 'Fecha')}</Text>
                                              {drilldownSortColumn === 'bookingDate' && (
                                                <Icon as={drilldownSortDirection === 'asc' ? FiChevronUp : FiChevronDown} color="blue.500" boxSize={3} />
                                              )}
                                            </HStack>
                                          </Table.ColumnHeader>
                                          <Table.ColumnHeader
                                            px={3} py={2}
                                            cursor="pointer"
                                            onClick={() => handleDrilldownSort('reference')}
                                            _hover={{ bg: 'gray.100' }}
                                            userSelect="none"
                                          >
                                            <HStack gap={1}>
                                              <Text>{t('ai.drilldown.reference', 'Referencia')}</Text>
                                              {drilldownSortColumn === 'reference' && (
                                                <Icon as={drilldownSortDirection === 'asc' ? FiChevronUp : FiChevronDown} color="blue.500" boxSize={3} />
                                              )}
                                            </HStack>
                                          </Table.ColumnHeader>
                                          <Table.ColumnHeader
                                            px={3} py={2}
                                            textAlign="right"
                                            cursor="pointer"
                                            onClick={() => handleDrilldownSort('debit')}
                                            _hover={{ bg: 'gray.100' }}
                                            userSelect="none"
                                          >
                                            <HStack gap={1} justify="flex-end">
                                              <Text color="green.600">{t('ai.drilldown.debits', 'Débito')}</Text>
                                              {drilldownSortColumn === 'debit' && (
                                                <Icon as={drilldownSortDirection === 'asc' ? FiChevronUp : FiChevronDown} color="blue.500" boxSize={3} />
                                              )}
                                            </HStack>
                                          </Table.ColumnHeader>
                                          <Table.ColumnHeader
                                            px={3} py={2}
                                            textAlign="right"
                                            cursor="pointer"
                                            onClick={() => handleDrilldownSort('credit')}
                                            _hover={{ bg: 'gray.100' }}
                                            userSelect="none"
                                          >
                                            <HStack gap={1} justify="flex-end">
                                              <Text color="red.600">{t('ai.drilldown.credits', 'Crédito')}</Text>
                                              {drilldownSortColumn === 'credit' && (
                                                <Icon as={drilldownSortDirection === 'asc' ? FiChevronUp : FiChevronDown} color="blue.500" boxSize={3} />
                                              )}
                                            </HStack>
                                          </Table.ColumnHeader>
                                          <Table.ColumnHeader
                                            px={3} py={2}
                                            textAlign="right"
                                            cursor="pointer"
                                            onClick={() => handleDrilldownSort('balance')}
                                            _hover={{ bg: 'gray.100' }}
                                            userSelect="none"
                                          >
                                            <HStack gap={1} justify="flex-end">
                                              <Text color="blue.600">{t('ai.drilldown.balance', 'Saldo')}</Text>
                                              {drilldownSortColumn === 'balance' && (
                                                <Icon as={drilldownSortDirection === 'asc' ? FiChevronUp : FiChevronDown} color="blue.500" boxSize={3} />
                                              )}
                                            </HStack>
                                          </Table.ColumnHeader>
                                          <Table.ColumnHeader
                                            px={3} py={2}
                                            cursor="pointer"
                                            onClick={() => handleDrilldownSort('description')}
                                            _hover={{ bg: 'gray.100' }}
                                            userSelect="none"
                                          >
                                            <HStack gap={1}>
                                              <Text>{t('ai.drilldown.description', 'Descripción')}</Text>
                                              {drilldownSortColumn === 'description' && (
                                                <Icon as={drilldownSortDirection === 'asc' ? FiChevronUp : FiChevronDown} color="blue.500" boxSize={3} />
                                              )}
                                            </HStack>
                                          </Table.ColumnHeader>
                                        </Table.Row>
                                      </Table.Header>
                                      <Table.Body>
                                        {getSortedTransactions().map((tx, txIdx) => (
                                          <Table.Row key={txIdx} _hover={{ bg: 'gray.50' }}>
                                            <Table.Cell px={3} py={1} fontSize="xs">{formatDate(tx.bookingDate)}</Table.Cell>
                                            <Table.Cell px={3} py={1} fontSize="xs" fontWeight="medium">{tx.reference || '-'}</Table.Cell>
                                            <Table.Cell px={3} py={1} textAlign="right" fontSize="xs">
                                              <Text color="green.600">
                                                {tx.debit > 0 ? formatNumber(tx.debit) : '-'}
                                              </Text>
                                            </Table.Cell>
                                            <Table.Cell px={3} py={1} textAlign="right" fontSize="xs">
                                              <Text color="red.600">
                                                {tx.credit > 0 ? formatNumber(tx.credit) : '-'}
                                              </Text>
                                            </Table.Cell>
                                            <Table.Cell px={3} py={1} textAlign="right" fontSize="xs">
                                              <Text fontWeight="bold" color={tx.balance > 0 ? 'green.700' : 'red.700'}>
                                                {formatNumber(tx.balance)}
                                              </Text>
                                            </Table.Cell>
                                            <Table.Cell px={3} py={1} fontSize="xs" maxW="250px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" title={tx.description || ''}>
                                              {tx.description || tx.description2 || '-'}
                                            </Table.Cell>
                                          </Table.Row>
                                        ))}
                                      </Table.Body>
                                      <Table.Footer>
                                        <Table.Row bg="gray.100" fontWeight="bold">
                                          <Table.Cell px={3} py={2} fontSize="xs" colSpan={2}>
                                            <Text fontWeight="bold">{t('ai.drilldown.totals', 'TOTALES')} ({drilldownData.totalTransactions} {t('ai.drilldown.operations', 'operaciones')})</Text>
                                          </Table.Cell>
                                          <Table.Cell px={3} py={2} textAlign="right" fontSize="xs">
                                            <Text color="green.700" fontWeight="bold">
                                              {formatNumber(drilldownData.totalDebits)}
                                            </Text>
                                          </Table.Cell>
                                          <Table.Cell px={3} py={2} textAlign="right" fontSize="xs">
                                            <Text color="red.700" fontWeight="bold">
                                              {formatNumber(drilldownData.totalCredits)}
                                            </Text>
                                          </Table.Cell>
                                          <Table.Cell px={3} py={2} textAlign="right" fontSize="xs">
                                            <Text fontWeight="bold" color={drilldownData.balance > 0 ? 'green.700' : 'red.700'}>
                                              {formatNumber(drilldownData.balance)}
                                            </Text>
                                          </Table.Cell>
                                          <Table.Cell px={3} py={2} fontSize="xs"></Table.Cell>
                                        </Table.Row>
                                      </Table.Footer>
                                    </Table.Root>
                                  </Box>
                                  {/* Drilldown Pagination Controls */}
                                  {drilldownData.totalPages > 1 && (
                                    <Box px={2} py={2} borderTop="1px solid" borderColor="blue.200">
                                      <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
                                        <HStack gap={2}>
                                          <Text fontSize="xs" color="gray.600">
                                            {t('common.rowsPerPage', 'Filas por página')}:
                                          </Text>
                                          <select
                                            value={drilldownPageSize}
                                            onChange={(e) => handleDrilldownPageSizeChange(Number(e.target.value))}
                                            disabled={drilldownLoading}
                                            style={{
                                              padding: '2px 6px',
                                              borderRadius: '4px',
                                              border: '1px solid #CBD5E0',
                                              background: 'white',
                                              fontSize: '12px',
                                            }}
                                          >
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                            <option value={200}>200</option>
                                          </select>
                                        </HStack>
                                        <Text fontSize="xs" color="gray.600">
                                          {(drilldownPage * drilldownPageSize) + 1}-{Math.min((drilldownPage + 1) * drilldownPageSize, drilldownData.totalElements)} {t('common.of', 'de')} {drilldownData.totalElements}
                                        </Text>
                                        <HStack gap={1}>
                                          <Button
                                            size="xs"
                                            variant="ghost"
                                            colorScheme="blue"
                                            onClick={() => handleDrilldownPageChange(0)}
                                            disabled={drilldownPage === 0 || drilldownLoading}
                                          >
                                            «
                                          </Button>
                                          <Button
                                            size="xs"
                                            variant="ghost"
                                            colorScheme="blue"
                                            onClick={() => handleDrilldownPageChange(drilldownPage - 1)}
                                            disabled={drilldownPage === 0 || drilldownLoading}
                                          >
                                            ‹
                                          </Button>
                                          <Text fontSize="xs" px={2} color="blue.600" fontWeight="medium">
                                            {drilldownPage + 1} / {drilldownData.totalPages}
                                          </Text>
                                          <Button
                                            size="xs"
                                            variant="ghost"
                                            colorScheme="blue"
                                            onClick={() => handleDrilldownPageChange(drilldownPage + 1)}
                                            disabled={drilldownPage >= drilldownData.totalPages - 1 || drilldownLoading}
                                          >
                                            ›
                                          </Button>
                                          <Button
                                            size="xs"
                                            variant="ghost"
                                            colorScheme="blue"
                                            onClick={() => handleDrilldownPageChange(drilldownData.totalPages - 1)}
                                            disabled={drilldownPage >= drilldownData.totalPages - 1 || drilldownLoading}
                                          >
                                            »
                                          </Button>
                                        </HStack>
                                      </HStack>
                                    </Box>
                                  )}
                                </VStack>
                              ) : null}
                            </Box>
                          </Table.Cell>
                        </Table.Row>
                      )}
                    </>
                  );
                })
              )}
            </Table.Body>
          </Table.Root>
        </Box>
        {/* Pagination Controls */}
        {processedData.length > 10 && (
          <Box px={4} py={3} borderTop="1px" borderColor={colors.borderColor}>
            <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
              <HStack gap={2}>
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  {t('common.rowsPerPage', 'Filas por página')}:
                </Text>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${colors.borderColor}`,
                    background: colors.cardBg,
                    color: colors.textColor,
                    fontSize: '14px',
                  }}
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </HStack>
              <Text fontSize="sm" color={colors.textColorSecondary}>
                {startIndex + 1}-{Math.min(endIndex, processedData.length)} {t('common.of', 'de')} {processedData.length}
              </Text>
              <HStack gap={1}>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  «
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ‹
                </Button>
                <Text fontSize="sm" px={2}>
                  {currentPage} / {totalPages}
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  ›
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  »
                </Button>
              </HStack>
            </HStack>
          </Box>
        )}
      </Card.Body>
    </Card.Root>
  );
};

const TextRenderer = ({ result, colors }: ResultRendererProps) => {
  return (
    <Card.Root>
      <Card.Header>
        <Heading size="sm">{result.title}</Heading>
      </Card.Header>
      <Card.Body>
        <Text whiteSpace="pre-wrap" color={colors.textColor}>
          {(result.data as { content: string }).content}
        </Text>
      </Card.Body>
    </Card.Root>
  );
};

const ErrorRenderer = ({ result }: ResultRendererProps) => {
  return (
    <Card.Root borderColor="red.300" bg="red.50">
      <Card.Body>
        <HStack gap={2}>
          <FiAlertCircle color="var(--chakra-colors-red-500)" />
          <Text color="red.600">{(result.data as { message: string }).message}</Text>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
};

export default AIResultsPanel;
