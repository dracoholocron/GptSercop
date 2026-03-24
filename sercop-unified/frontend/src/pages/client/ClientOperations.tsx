/**
 * ClientOperations - View client's trade finance operations
 * Shows operations where the client is the applicant with pagination
 */

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Input,
  Badge,
  Button,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFileText, FiShield, FiDollarSign, FiX } from 'react-icons/fi';
import clientPortalService from '../../services/clientPortalService';
import type { ClientOperation } from '../../services/clientPortalService';
import { useTheme } from '../../contexts/ThemeContext';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';

const productTypeLabels: Record<string, string> = {
  LC_IMPORT: 'LC Import',
  LC_EXPORT: 'LC Export',
  GUARANTEE: 'Guarantee',
  GUARANTEE_ISSUED: 'Guarantee Issued',
  GUARANTEE_RECEIVED: 'Guarantee Received',
  AVAL: 'Aval',
  COLLECTION: 'Collection',
  COLLECTION_IMPORT: 'Collection Import',
  COLLECTION_EXPORT: 'Collection Export',
};

const productTypeIcons: Record<string, React.ReactNode> = {
  LC_IMPORT: <FiFileText />,
  LC_EXPORT: <FiFileText />,
  GUARANTEE: <FiShield />,
  GUARANTEE_ISSUED: <FiShield />,
  GUARANTEE_RECEIVED: <FiShield />,
  AVAL: <FiShield />,
  COLLECTION: <FiDollarSign />,
  COLLECTION_IMPORT: <FiDollarSign />,
  COLLECTION_EXPORT: <FiDollarSign />,
};

const statusColors: Record<string, string> = {
  ACTIVE: 'green',
  PENDING: 'blue',
  CLOSED: 'gray',
  CANCELLED: 'red',
  EXPIRED: 'orange',
};

const PAGE_SIZE = 10;

export const ClientOperations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getColors } = useTheme();
  const colors = getColors();

  const [operations, setOperations] = useState<ClientOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [productTypeFilter, setProductTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [productTypeFilter, statusFilter]);

  const loadOperations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await clientPortalService.listOperations({
        page: currentPage,
        size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        productType: productTypeFilter || undefined,
        status: statusFilter || undefined,
      });
      setOperations(response.content || []);
      setTotalElements(response.totalElements || 0);
      setError(null);
    } catch (err) {
      console.error('Error loading operations:', err);
      setError(t('clientPortal.operations.loadError', 'Failed to load operations'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, productTypeFilter, statusFilter, t]);

  const hasActiveFilters = productTypeFilter || statusFilter || debouncedSearch;

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setProductTypeFilter('');
    setStatusFilter('');
    setCurrentPage(0);
  };

  useEffect(() => {
    loadOperations();
  }, [loadOperations]);

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return '-';
    return `${currency || 'USD'} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const columns: DataTableColumn<ClientOperation>[] = [
    {
      key: 'reference',
      label: t('clientPortal.operations.reference', 'Reference'),
      sortable: false,
      filterable: false,
      render: (row) => (
        <HStack>
          <Box color={colors.primaryColor}>
            {productTypeIcons[row.productType] || <FiFileText />}
          </Box>
          <Text fontWeight="medium">{row.reference}</Text>
        </HStack>
      ),
    },
    {
      key: 'productType',
      label: t('clientPortal.operations.product', 'Product'),
      sortable: false,
      filterable: false,
      render: (row) => <Text>{productTypeLabels[row.productType] || row.productType}</Text>,
    },
    {
      key: 'amount',
      label: t('clientPortal.operations.amount', 'Amount'),
      sortable: false,
      filterable: false,
      render: (row) => <Text>{formatAmount(row.amount, row.currency)}</Text>,
    },
    {
      key: 'beneficiaryName',
      label: t('clientPortal.operations.beneficiary', 'Beneficiary'),
      sortable: false,
      filterable: false,
      render: (row) => <Text>{row.beneficiaryName || '-'}</Text>,
    },
    {
      key: 'status',
      label: t('clientPortal.operations.status', 'Status'),
      sortable: false,
      filterable: false,
      render: (row) => (
        <Badge colorPalette={statusColors[row.status] || 'gray'}>
          {row.statusLabel || row.status}
        </Badge>
      ),
    },
    {
      key: 'expiryDate',
      label: t('clientPortal.operations.expiryDate', 'Expiry'),
      sortable: false,
      filterable: false,
      render: (row) => <Text>{formatDate(row.expiryDate)}</Text>,
    },
  ];

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        <Box>
          <Heading size="lg" mb={2}>
            {t('clientPortal.operations.title', 'My Operations')}
          </Heading>
          <Text color={colors.textColorSecondary}>
            {t('clientPortal.operations.subtitle', 'View your active and completed trade finance operations')}
          </Text>
        </Box>

        <Card.Root>
          <Card.Body>
            {/* Server-side Search and Filters */}
            <HStack gap={3} mb={4} flexWrap="wrap">
              <Box position="relative" maxW="280px" flex={1}>
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400">
                  <FiSearch />
                </Box>
                <Input
                  placeholder={t('common.search', 'Search...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  pl={10}
                  size="sm"
                />
              </Box>
              <NativeSelectRoot maxW="180px" size="sm">
                <NativeSelectField
                  value={productTypeFilter}
                  onChange={(e) => setProductTypeFilter(e.target.value)}
                >
                  <option value="">{t('clientPortal.operations.allProducts', 'All Products')}</option>
                  {Object.entries(productTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
              <NativeSelectRoot maxW="160px" size="sm">
                <NativeSelectField
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">{t('clientPortal.operations.allStatuses', 'All Statuses')}</option>
                  <option value="ACTIVE">{t('status.active', 'Active')}</option>
                  <option value="PENDING">{t('status.pending', 'Pending')}</option>
                  <option value="CLOSED">{t('status.closed', 'Closed')}</option>
                  <option value="CANCELLED">{t('status.cancelled', 'Cancelled')}</option>
                  <option value="EXPIRED">{t('status.expired', 'Expired')}</option>
                </NativeSelectField>
              </NativeSelectRoot>
              {hasActiveFilters && (
                <Button size="sm" variant="ghost" onClick={clearFilters}>
                  <FiX style={{ marginRight: 4 }} />
                  {t('common.clearFilters', 'Clear')}
                </Button>
              )}
            </HStack>

            {/* Error state */}
            {error && !loading && (
              <VStack py={8}>
                <Text color="red.500">{error}</Text>
                <Button onClick={loadOperations}>{t('common.retry', 'Retry')}</Button>
              </VStack>
            )}

            {/* DataTable */}
            {!error && (
              <DataTable<ClientOperation>
                data={operations}
                columns={columns}
                rowKey={(row) => row.operationId}
                isLoading={loading}
                emptyMessage={
                  debouncedSearch
                    ? t('clientPortal.operations.noMatchingOperations', 'No operations match your search')
                    : t('clientPortal.operations.noOperations', 'No operations found')
                }
                searchable={false}
                pagination="server"
                defaultPageSize={PAGE_SIZE}
                serverPagination={{
                  totalItems: totalElements,
                  currentPage: currentPage,
                  pageSize: PAGE_SIZE,
                  onPageChange: (page) => setCurrentPage(page),
                  onPageSizeChange: () => {},
                }}
                onRowClick={(row) => navigate(`/client/operations/${row.operationId}`)}
                size="sm"
              />
            )}
          </Card.Body>
        </Card.Root>
      </VStack>
    </Box>
  );
};

export default ClientOperations;
