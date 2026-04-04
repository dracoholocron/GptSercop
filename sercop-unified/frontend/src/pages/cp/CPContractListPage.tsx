/**
 * CPContractListPage - Lista de contratos de contratación pública
 * Filtros por estado, proveedor y proceso
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Button,
  Spinner,
  Icon,
  Flex,
  Input,
  Table,
  Card,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import {
  FiFileText,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiEye,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../../components/ui/toaster';
import { get } from '../../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

interface Contract {
  id: string;
  status: string;
  amount: number | null;
  contractNo: string | null;
  signedAt: string | null;
  administratorName: string | null;
  tender?: { id: string; title: string } | null;
  provider?: { id: string; name: string; identifier: string | null } | null;
}

interface ContractListResponse {
  data: Contract[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// Helpers
// ============================================================================

const STATUS_COLORS: Record<string, string> = {
  draft: 'gray',
  active: 'green',
  signed: 'blue',
  suspended: 'orange',
  terminated: 'red',
  completed: 'teal',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  active: 'Vigente',
  signed: 'Firmado',
  suspended: 'Suspendido',
  terminated: 'Terminado',
  completed: 'Concluido',
};

const formatCurrency = (v: number | null | undefined) =>
  v == null ? '—' : `$${Number(v).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;

const formatDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ============================================================================
// Main Component
// ============================================================================

export const CPContractListPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');

  const cardBg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.700' : 'gray.200';
  const totalPages = Math.ceil(total / pageSize);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (statusFilter) params.set('status', statusFilter);
      const res = await get(`/v1/contracts?${params.toString()}`);
      if (res.ok) {
        const data: ContractListResponse = await res.json();
        setContracts(data.data ?? []);
        setTotal(data.total ?? 0);
      } else {
        toaster.create({ title: t('common.error', 'Error al cargar contratos'), type: 'error' });
      }
    } catch {
      toaster.create({ title: t('common.networkError', 'Error de red'), type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, t]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const filtered = searchText.trim()
    ? contracts.filter(c =>
        c.tender?.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        c.provider?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        c.contractNo?.toLowerCase().includes(searchText.toLowerCase())
      )
    : contracts;

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
      <VStack gap={5} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <HStack gap={3}>
            <Icon as={FiFileText} boxSize={6} color={isDark ? 'teal.300' : 'teal.500'} />
            <VStack align="start" gap={0}>
              <Heading size="md">{t('cp.contracts.title', 'Gestión de Contratos')}</Heading>
              <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
                {total} {t('cp.contracts.subtitle', 'contratos registrados')}
              </Text>
            </VStack>
          </HStack>
          <Button size="sm" variant="outline" onClick={load}>
            <Icon as={FiRefreshCw} mr={2} />
            {t('common.refresh', 'Actualizar')}
          </Button>
        </Flex>

        {/* Summary stats */}
        <HStack gap={4} flexWrap="wrap">
          {['active', 'suspended', 'terminated', 'completed'].map(s => {
            const count = contracts.filter(c => c.status === s).length;
            return (
              <Card.Root key={s} flex={1} minW="120px" cursor="pointer" onClick={() => setStatusFilter(statusFilter === s ? '' : s)}>
                <Card.Body p={3}>
                  <HStack justify="space-between">
                    <VStack align="start" gap={0}>
                      <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} fontWeight="600" textTransform="uppercase">
                        {STATUS_LABELS[s] || s}
                      </Text>
                      <Text fontSize="xl" fontWeight="bold">{count}</Text>
                    </VStack>
                    <Badge colorPalette={STATUS_COLORS[s]} variant={statusFilter === s ? 'solid' : 'subtle'} fontSize="xs">
                      {statusFilter === s ? '✓' : STATUS_COLORS[s]}
                    </Badge>
                  </HStack>
                </Card.Body>
              </Card.Root>
            );
          })}
        </HStack>

        {/* Filters */}
        <HStack gap={3} flexWrap="wrap">
          <HStack flex={1} minW="200px" bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} px={3} py={2}>
            <Icon as={FiSearch} color={isDark ? 'gray.400' : 'gray.500'} boxSize={4} />
            <Input
              variant="unstyled"
              placeholder={t('cp.contracts.search', 'Buscar por proceso, proveedor o n° contrato...')}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              fontSize="sm"
            />
          </HStack>
          <Box minW="160px">
            <NativeSelectRoot>
              <NativeSelectField
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">{t('cp.contracts.allStatuses', 'Todos los estados')}</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </NativeSelectField>
            </NativeSelectRoot>
          </Box>
        </HStack>

        {/* Table */}
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
          {loading ? (
            <Flex justify="center" py={12}><Spinner size="lg" /></Flex>
          ) : filtered.length === 0 ? (
            <Box textAlign="center" py={12}>
              <Icon as={FiFileText} boxSize={10} color="gray.400" mb={3} />
              <Text color={isDark ? 'gray.400' : 'gray.500'}>
                {t('cp.contracts.empty', 'No se encontraron contratos')}
              </Text>
            </Box>
          ) : (
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>{t('cp.contracts.contractNo', 'N° Contrato')}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t('cp.contracts.process', 'Proceso')}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t('cp.contracts.provider', 'Proveedor')}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">{t('cp.contracts.amount', 'Monto')}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">{t('cp.contracts.status', 'Estado')}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">{t('cp.contracts.signedAt', 'Firmado')}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">{t('cp.contracts.administrator', 'Administrador')}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">{t('common.actions', 'Acciones')}</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filtered.map(c => (
                  <Table.Row key={c.id} _hover={{ bg: isDark ? 'gray.750' : 'gray.50' }}>
                    <Table.Cell>
                      <Text fontSize="sm" fontWeight="500" fontFamily="mono">{c.contractNo || `...${c.id.slice(-6)}`}</Text>
                    </Table.Cell>
                    <Table.Cell maxW="200px">
                      <Text fontSize="sm" truncate>{c.tender?.title || '—'}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <VStack align="start" gap={0}>
                        <Text fontSize="sm">{c.provider?.name || '—'}</Text>
                        {c.provider?.identifier && (
                          <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>{c.provider.identifier}</Text>
                        )}
                      </VStack>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <Text fontSize="sm" fontWeight="500">{formatCurrency(c.amount)}</Text>
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <Badge colorPalette={STATUS_COLORS[c.status] || 'gray'} variant="subtle" fontSize="xs">
                        {STATUS_LABELS[c.status] || c.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <Text fontSize="xs">{formatDate(c.signedAt)}</Text>
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      {c.administratorName ? (
                        <HStack justify="center" gap={1}>
                          <Icon as={FiCheckCircle} boxSize={3} color="green.400" />
                          <Text fontSize="xs">{c.administratorName}</Text>
                        </HStack>
                      ) : (
                        <HStack justify="center" gap={1}>
                          <Icon as={FiAlertTriangle} boxSize={3} color="orange.400" />
                          <Text fontSize="xs" color={isDark ? 'orange.300' : 'orange.600'}>Sin asignar</Text>
                        </HStack>
                      )}
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <Button
                        size="xs"
                        colorPalette="teal"
                        variant="outline"
                        onClick={() => navigate(`/cp/contracts/${c.id}`)}
                      >
                        <Icon as={FiEye} mr={1} />
                        {t('common.view', 'Ver')}
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="space-between" align="center">
            <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
              {t('common.showingOf', 'Mostrando')} {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} {t('common.of', 'de')} {total}
            </Text>
            <HStack gap={2}>
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <Icon as={FiChevronLeft} />
              </Button>
              <Text fontSize="sm">{page} / {totalPages}</Text>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <Icon as={FiChevronRight} />
              </Button>
            </HStack>
          </Flex>
        )}
      </VStack>
    </Box>
  );
};

export default CPContractListPage;
