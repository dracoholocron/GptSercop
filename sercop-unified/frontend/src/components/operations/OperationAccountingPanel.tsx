/**
 * OperationAccountingPanel - Displays accounting entries (GLE) for an operation
 *
 * Shows both summary and detailed view of all accounting entries including:
 * - Original issuance
 * - Amendments
 * - Utilizations
 * - Closures
 * - Commissions
 */
import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Table,
  Spinner,
  SimpleGrid,
  Tabs,
  Input,
} from '@chakra-ui/react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiSearch,
  FiList,
  FiGrid,
  FiCalendar,
  FiFilter,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { gleService, type GleOperationBalance, type GleBalanceEntry, type GleCurrencyBalance } from '../../services/gleService';
import { productTypeConfigService, type ProductTypeConfig } from '../../services/productTypeConfigService';

interface OperationAccountingPanelProps {
  operationReference: string;
  productType?: string;
}

export const OperationAccountingPanel = ({ operationReference, productType }: OperationAccountingPanelProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<GleOperationBalance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'detail'>('summary');
  const [filterText, setFilterText] = useState('');
  const [productConfig, setProductConfig] = useState<ProductTypeConfig | null>(null);

  useEffect(() => {
    loadAccountingData();
    if (productType) {
      loadProductConfig();
    }
  }, [operationReference, productType]);

  const loadProductConfig = async () => {
    if (!productType) return;
    try {
      const config = await productTypeConfigService.getConfigByProductType(productType);
      setProductConfig(config);
    } catch (err) {
      console.error('Error loading product config:', err);
    }
  };

  const loadAccountingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gleService.getOperationBalance(operationReference);
      setBalance(data);
    } catch (err) {
      console.error('Error loading accounting data:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Filter entries based on search text
  const filteredEntries = useMemo(() => {
    if (!balance?.entries) return [];
    if (!filterText) return balance.entries;

    const search = filterText.toLowerCase();
    return balance.entries.filter(entry =>
      entry.account.toLowerCase().includes(search) ||
      entry.description.toLowerCase().includes(search) ||
      entry.description2?.toLowerCase().includes(search) ||
      entry.currency.toLowerCase().includes(search)
    );
  }, [balance?.entries, filterText]);

  // Group entries by account for summary view
  const entriesByAccount = useMemo(() => {
    if (!balance?.entries) return new Map<string, GleBalanceEntry[]>();

    const grouped = new Map<string, GleBalanceEntry[]>();
    balance.entries.forEach(entry => {
      const key = `${entry.account}-${entry.currency}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(entry);
    });
    return grouped;
  }, [balance?.entries]);

  // Calculate account summaries
  const accountSummaries = useMemo(() => {
    const summaries: Array<{
      account: string;
      currency: string;
      debits: number;
      credits: number;
      balance: number;
      count: number;
    }> = [];

    entriesByAccount.forEach((entries, key) => {
      const debits = entries.filter(e => e.type === 'D').reduce((sum, e) => sum + e.amount, 0);
      const credits = entries.filter(e => e.type === 'C').reduce((sum, e) => sum + e.amount, 0);
      summaries.push({
        account: entries[0].account,
        currency: entries[0].currency,
        debits,
        credits,
        balance: debits - credits,
        count: entries.length,
      });
    });

    return summaries.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  }, [entriesByAccount]);

  // Get the product account summaries filtered by accountPrefix from config
  const productAccountSummaries = useMemo(() => {
    if (!productConfig?.accountPrefix) {
      // No filter configured - return all accounts
      return accountSummaries;
    }

    // Filter accounts that start with the configured prefix
    return accountSummaries.filter(summary =>
      summary.account.startsWith(productConfig.accountPrefix!)
    );
  }, [accountSummaries, productConfig?.accountPrefix]);

  // Aggregate product accounts by currency for the summary view
  const productSummaryByCurrency = useMemo(() => {
    const byCurrency = new Map<string, {
      currency: string;
      account: string;
      debits: number;
      credits: number;
      balance: number;
      count: number;
    }>();

    productAccountSummaries.forEach(summary => {
      const existing = byCurrency.get(summary.currency);
      if (existing) {
        existing.debits += summary.debits;
        existing.credits += summary.credits;
        existing.balance += summary.balance;
        existing.count += summary.count;
      } else {
        byCurrency.set(summary.currency, {
          currency: summary.currency,
          account: summary.account, // First account found
          debits: summary.debits,
          credits: summary.credits,
          balance: summary.balance,
          count: summary.count,
        });
      }
    });

    return Array.from(byCurrency.values()).sort((a, b) =>
      Math.abs(b.balance) - Math.abs(a.balance)
    );
  }, [productAccountSummaries]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color={colors.primaryColor} />
        <Text mt={4} color={colors.textColor}>
          {t('gle.loadingEntries', 'Cargando asientos contables...')}
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={10} color="red.500">
        <Text>{t('common.error')}: {error}</Text>
      </Box>
    );
  }

  if (!balance || !balance.found) {
    return (
      <Box textAlign="center" py={10}>
        <Text color={colors.textColor}>
          {t('gle.noEntriesFound', 'No se encontraron asientos contables para esta operación')}
        </Text>
      </Box>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {/* Header with summary cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
        {/* Total Entries Card */}
        <Box
          p={4}
          bg={isDark ? 'gray.800' : 'white'}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={isDark ? 'gray.700' : 'gray.200'}
        >
          <HStack mb={2}>
            <Box p={2} bg={isDark ? 'blue.900' : 'blue.100'} borderRadius="lg">
              <FiList color={isDark ? '#63B3ED' : '#3182CE'} size={18} />
            </Box>
            <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
              {t('gle.totalEntries', 'Total Asientos')}
            </Text>
          </HStack>
          <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>
            {balance.totalEntries}
          </Text>
        </Box>

        {/* Currency Balances */}
        {balance.byCurrency?.slice(0, 3).map((curr) => (
          <Box
            key={curr.currency}
            p={4}
            bg={isDark ? 'gray.800' : 'white'}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={curr.netBalance > 0 ? 'green.300' : curr.netBalance < 0 ? 'red.300' : (isDark ? 'gray.700' : 'gray.200')}
          >
            <HStack mb={2}>
              <Box
                p={2}
                bg={curr.netBalance > 0 ? (isDark ? 'green.900' : 'green.100') : (isDark ? 'orange.900' : 'orange.100')}
                borderRadius="lg"
              >
                <FiDollarSign color={curr.netBalance > 0 ? (isDark ? '#68D391' : '#38A169') : (isDark ? '#F6AD55' : '#DD6B20')} size={18} />
              </Box>
              <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
                {t('gle.balance', 'Saldo')} {curr.currency}
              </Text>
            </HStack>
            <Text
              fontSize="xl"
              fontWeight="bold"
              color={curr.netBalance > 0 ? 'green.500' : curr.netBalance < 0 ? 'red.500' : colors.textColor}
            >
              {formatCurrency(curr.netBalance, curr.currency)}
            </Text>
            <HStack fontSize="xs" color={colors.textColor} opacity={0.6} mt={1}>
              <HStack>
                <FiTrendingUp size={12} color="green" />
                <Text>{curr.debitCount} D</Text>
              </HStack>
              <Text>|</Text>
              <HStack>
                <FiTrendingDown size={12} color="red" />
                <Text>{curr.creditCount} C</Text>
              </HStack>
            </HStack>
          </Box>
        ))}
      </SimpleGrid>

      {/* Product Account Summary Table */}
      {productSummaryByCurrency.length > 0 && (
        <Box
          p={4}
          bg={isDark ? 'gray.800' : 'white'}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={isDark ? 'gray.700' : 'gray.200'}
        >
          <HStack justify="space-between" mb={3}>
            <VStack align="start" gap={0}>
              <Text fontWeight="bold" color={colors.textColor}>
                {t('gle.productAccountSummary', 'Saldo Cuenta Producto')}
              </Text>
              {productConfig?.accountPrefix && (
                <HStack fontSize="xs" color={colors.textColor} opacity={0.6}>
                  <FiFilter size={10} />
                  <Text>
                    {t('gle.filteredByPrefix', 'Filtrado por prefijo')}: {productConfig.accountPrefix}
                  </Text>
                </HStack>
              )}
            </VStack>
          </HStack>
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row bg={isDark ? 'gray.700' : 'gray.50'}>
                <Table.ColumnHeader color={colors.textColor}>{t('gle.account', 'Cuenta')}</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColor}>{t('gle.currency', 'Moneda')}</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColor} textAlign="right">{t('gle.debits', 'Débitos')}</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColor} textAlign="right">{t('gle.credits', 'Créditos')}</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColor} textAlign="right">{t('gle.balance', 'Saldo')}</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColor} textAlign="center">{t('gle.entries', 'Asientos')}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {productSummaryByCurrency.map((item) => {
                const isZeroBalance = item.balance === 0;
                return (
                  <Table.Row
                    key={`${item.account}-${item.currency}`}
                    _hover={{ bg: isDark ? 'gray.700' : 'gray.50' }}
                    opacity={isZeroBalance ? 0.5 : 1}
                    bg={isZeroBalance ? (isDark ? 'gray.900' : 'gray.100') : 'transparent'}
                  >
                    <Table.Cell>
                      <Text
                        fontFamily="mono"
                        fontSize="xs"
                        color={isZeroBalance ? (isDark ? 'gray.400' : 'gray.500') : colors.textColor}
                      >
                        {productConfig?.accountPrefix || item.account.substring(0, 4)}*
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={isZeroBalance ? 'gray' : 'blue'}>{item.currency}</Badge>
                    </Table.Cell>
                    <Table.Cell textAlign="right" color={isZeroBalance ? (isDark ? 'gray.400' : 'gray.500') : 'green.500'}>
                      {formatCurrency(item.debits, item.currency)}
                    </Table.Cell>
                    <Table.Cell textAlign="right" color={isZeroBalance ? (isDark ? 'gray.400' : 'gray.500') : 'red.500'}>
                      {formatCurrency(item.credits, item.currency)}
                    </Table.Cell>
                    <Table.Cell textAlign="right" fontWeight="bold">
                      <Text color={isZeroBalance ? (isDark ? 'gray.400' : 'gray.500') : (item.balance >= 0 ? 'green.500' : 'red.500')}>
                        {formatCurrency(item.balance, item.currency)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <Badge colorPalette="gray" opacity={isZeroBalance ? 0.5 : 1}>{item.count}</Badge>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* View Mode Toggle and Filter */}
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <Tabs.Root value={viewMode} onValueChange={(e) => setViewMode(e.value as 'summary' | 'detail')} size="sm">
          <Tabs.List>
            <Tabs.Trigger value="summary" color={colors.textColor}>
              <HStack gap={1}>
                <FiGrid size={14} />
                <Text>{t('gle.summaryView', 'Por Cuenta')}</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="detail" color={colors.textColor}>
              <HStack gap={1}>
                <FiList size={14} />
                <Text>{t('gle.detailView', 'Detalle')}</Text>
              </HStack>
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>

        <HStack maxW="300px">
          <FiSearch color={colors.textColor} />
          <Input
            placeholder={t('gle.searchEntries', 'Buscar asientos...')}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            size="sm"
            bg={isDark ? 'gray.700' : 'white'}
            borderColor={colors.borderColor}
          />
        </HStack>
      </HStack>

      {/* Summary View - Grouped by Account */}
      {viewMode === 'summary' && (
        <Box
          p={4}
          bg={isDark ? 'gray.800' : 'white'}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={isDark ? 'gray.700' : 'gray.200'}
          overflowX="auto"
        >
          <Text fontWeight="bold" color={colors.textColor} mb={3}>
            {t('gle.byAccount', 'Resumen por Cuenta Contable')}
          </Text>
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row bg={isDark ? 'gray.700' : 'gray.50'}>
                <Table.ColumnHeader color={colors.textColor}>{t('gle.account', 'Cuenta')}</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColor}>{t('gle.currency', 'Moneda')}</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColor} textAlign="right">{t('gle.debits', 'Débitos')}</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColor} textAlign="right">{t('gle.credits', 'Créditos')}</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColor} textAlign="right">{t('gle.balance', 'Saldo')}</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColor} textAlign="center">{t('gle.movements', 'Movs')}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {accountSummaries
                .filter(s => !filterText ||
                  s.account.toLowerCase().includes(filterText.toLowerCase()) ||
                  s.currency.toLowerCase().includes(filterText.toLowerCase())
                )
                .map((summary, idx) => {
                  const isZeroBalance = summary.balance === 0;
                  return (
                    <Table.Row
                      key={idx}
                      _hover={{ bg: isDark ? 'gray.700' : 'gray.50' }}
                      opacity={isZeroBalance ? 0.5 : 1}
                      bg={isZeroBalance ? (isDark ? 'gray.900' : 'gray.100') : 'transparent'}
                    >
                      <Table.Cell>
                        <Text
                          fontFamily="mono"
                          fontSize="sm"
                          color={isZeroBalance ? (isDark ? 'gray.500' : 'gray.400') : colors.textColor}
                        >
                          {summary.account}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={isZeroBalance ? 'gray' : 'purple'} opacity={isZeroBalance ? 0.6 : 1}>
                          {summary.currency}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="right" color={isZeroBalance ? (isDark ? 'gray.500' : 'gray.400') : 'green.500'} fontWeight="medium">
                        {summary.debits > 0 ? formatCurrency(summary.debits, summary.currency) : '-'}
                      </Table.Cell>
                      <Table.Cell textAlign="right" color={isZeroBalance ? (isDark ? 'gray.500' : 'gray.400') : 'red.500'} fontWeight="medium">
                        {summary.credits > 0 ? formatCurrency(summary.credits, summary.currency) : '-'}
                      </Table.Cell>
                      <Table.Cell textAlign="right" fontWeight="bold">
                        <Text color={isZeroBalance ? (isDark ? 'gray.600' : 'gray.400') : (summary.balance > 0 ? 'green.500' : summary.balance < 0 ? 'red.500' : colors.textColor)}>
                          {formatCurrency(summary.balance, summary.currency)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        <Badge colorPalette="gray" size="sm" opacity={isZeroBalance ? 0.5 : 1}>{summary.count}</Badge>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Detail View - All Entries */}
      {viewMode === 'detail' && (
        <Box
          p={4}
          bg={isDark ? 'gray.800' : 'white'}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={isDark ? 'gray.700' : 'gray.200'}
          overflowX="auto"
        >
          <Text fontWeight="bold" color={colors.textColor} mb={3}>
            {t('gle.allEntries', 'Todos los Asientos')} ({filteredEntries.length})
          </Text>
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row bg={isDark ? 'gray.700' : 'gray.50'}>
                <Table.ColumnHeader color={colors.textColor}>{t('gle.date', 'Fecha')}</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColor}>{t('gle.account', 'Cuenta')}</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColor}>{t('gle.type', 'Tipo')}</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColor}>{t('gle.currency', 'Mon')}</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColor} textAlign="right">{t('gle.amount', 'Monto')}</Table.ColumnHeader>
                <Table.ColumnHeader color={colors.textColor}>{t('gle.description', 'Descripción')}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredEntries.map((entry) => (
                <Table.Row key={entry.id} _hover={{ bg: isDark ? 'gray.700' : 'gray.50' }}>
                  <Table.Cell>
                    <HStack gap={1}>
                      <FiCalendar size={12} color={colors.textColor} />
                      <Text fontSize="xs" color={colors.textColor}>
                        {formatDate(entry.valueDate)}
                      </Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontFamily="mono" fontSize="xs" color={colors.textColor}>
                      {entry.account}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      colorPalette={entry.type === 'D' ? 'green' : 'red'}
                      size="sm"
                    >
                      {entry.type === 'D' ? 'Débito' : 'Crédito'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette="purple" size="sm">{entry.currency}</Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    <Text
                      fontWeight="medium"
                      color={entry.type === 'D' ? 'green.500' : 'red.500'}
                    >
                      {entry.type === 'D' ? '+' : '-'}{formatCurrency(entry.amount, entry.currency)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <VStack align="start" gap={0}>
                      <Text fontSize="xs" color={colors.textColor} isTruncated maxW="250px">
                        {entry.description}
                      </Text>
                      {entry.description2 && (
                        <Text fontSize="xs" color={colors.textColor} opacity={0.6} isTruncated maxW="250px">
                          {entry.description2}
                        </Text>
                      )}
                    </VStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          {filteredEntries.length === 0 && (
            <Box textAlign="center" py={8}>
              <Text color={colors.textColor} opacity={0.6}>
                {filterText
                  ? t('gle.noMatchingEntries', 'No se encontraron asientos que coincidan con la búsqueda')
                  : t('gle.noEntries', 'No hay asientos para mostrar')
                }
              </Text>
            </Box>
          )}
        </Box>
      )}
    </VStack>
  );
};

export default OperationAccountingPanel;
