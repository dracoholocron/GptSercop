/**
 * TopClientsTable Component
 * Table showing top clients by volume with expandable operations view
 */

import { useState, useMemo, useEffect } from 'react';
import { Box, Text, HStack, VStack, Badge, Table, IconButton, Portal, Spinner, Flex } from '@chakra-ui/react';
import { FiMaximize2, FiX, FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { TopClient, DashboardFilters } from '../../types/dashboard';
import type { Operation } from '../../types/operations';
import { operationsApi } from '../../services/operationsApi';

interface TopClientsTableProps {
  data: TopClient[];
  limit?: number;
  onLimitChange?: (limit: number) => void;
  filters?: DashboardFilters;
}

const getProductLabel = (product: string, t: (key: string) => string): string => {
  const labels: Record<string, string> = {
    LC_IMPORT: t('businessDashboard.lcImport'),
    LC_EXPORT: t('businessDashboard.lcExport'),
    GUARANTEE: t('businessDashboard.guarantees'),
    STANDBY_LC: 'Standby LC',
    STANDBY: 'Standby LC',
    COLLECTION: t('businessDashboard.collections'),
    COLLECTION_IMPORT: t('businessDashboard.collectionImport', 'Cobranza Import'),
    COLLECTION_EXPORT: t('businessDashboard.collectionExport', 'Cobranza Export'),
  };
  return labels[product] || product;
};

const PRODUCT_COLORS: Record<string, string> = {
  LC_IMPORT: 'blue',
  LC_EXPORT: 'green',
  GUARANTEE: 'purple',
  STANDBY_LC: 'orange',
  STANDBY: 'orange',
  COLLECTION: 'pink',
  COLLECTION_IMPORT: 'pink',
  COLLECTION_EXPORT: 'cyan',
};

const LIMIT_OPTIONS = [5, 10, 15, 20, 25, 50];

export const TopClientsTable = ({ data, limit = 10, onLimitChange, filters: dashboardFilters }: TopClientsTableProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const [selectedClient, setSelectedClient] = useState<TopClient | null>(null);
  const [clientOperations, setClientOperations] = useState<Operation[]>([]);
  const [loadingOperations, setLoadingOperations] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const pageSize = 10;

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

  const formatVolume = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
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

  const fetchClientOperations = async (client: TopClient, status?: string) => {
    setLoadingOperations(true);
    setCurrentPage(1);

    try {
      // Filter by applicantName or beneficiaryName depending on client type
      const baseFilter = client.clientType === 'APPLICANT'
        ? { applicantName: client.clientName }
        : { beneficiaryName: client.clientName };

      // Add status filter - if no status selected, exclude CLOSED operations
      const filter = status
        ? { ...baseFilter, status }
        : baseFilter;

      const operations = await operationsApi.getOperations(filter);

      // If no status filter, exclude CLOSED operations (matching dashboard behavior)
      let filteredOperations = status
        ? operations
        : operations.filter(op => op.status !== 'CLOSED');

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
            const idx = op.swiftMessage!.indexOf(fieldTag);
            if (idx === -1) return false;
            const afterTag = op.swiftMessage!.substring(idx + fieldTag.length);
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

      setClientOperations(filteredOperations);
    } catch (error) {
      console.error('Error loading client operations:', error);
      setClientOperations([]);
    } finally {
      setLoadingOperations(false);
    }
  };

  const handleViewClientOperations = async (client: TopClient) => {
    setSelectedClient(client);
    setIsMaximized(true);
    setStatusFilter('');
    await fetchClientOperations(client);
  };

  const handleStatusFilterChange = async (newStatus: string) => {
    setStatusFilter(newStatus);
    if (selectedClient) {
      await fetchClientOperations(selectedClient, newStatus);
    }
  };

  const handleClose = () => {
    setIsMaximized(false);
    setSelectedClient(null);
    setClientOperations([]);
  };

  // Re-fetch operations when dashboard filters change while detail is open
  useEffect(() => {
    if (selectedClient) {
      fetchClientOperations(selectedClient, statusFilter || undefined);
    }
  }, [dashboardFilters?.swiftSearch, dashboardFilters?.swiftFreeText, dashboardFilters?.customFieldFilters]);

  // Pagination
  const totalPages = Math.ceil(clientOperations.length / pageSize);
  const paginatedOperations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return clientOperations.slice(start, end);
  }, [clientOperations, currentPage, pageSize]);

  const containerStyles = {
    p: 5,
    borderRadius: 'xl',
    bg: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    borderWidth: '1px',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
  };

  return (
    <>
      <Box {...containerStyles} overflowX="auto">
        <HStack justify="space-between" align="center" mb={4}>
          <HStack gap={3}>
            <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
              {t('businessDashboard.topClients')}
            </Text>
            <Badge colorPalette="blue" variant="subtle">
              {data.reduce((sum, c) => sum + c.operationCount, 0).toLocaleString()} ops · {formatVolume(data.reduce((sum, c) => sum + c.totalVolume, 0))}
            </Badge>
          </HStack>
          {onLimitChange && (
            <HStack gap={2}>
              <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
                {t('businessDashboard.showingTop', 'Mostrar')}:
              </Text>
              <select
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.borderColor}`,
                  background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'white',
                  color: colors.textColor,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {LIMIT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    Top {opt}
                  </option>
                ))}
              </select>
            </HStack>
          )}
        </HStack>

        <Table.Root size="sm">
          <Table.Header>
            <Table.Row bg="transparent">
              <Table.ColumnHeader color={colors.textColor} opacity={0.7} fontSize="xs" textTransform="uppercase">
                {t('businessDashboard.client')}
              </Table.ColumnHeader>
              <Table.ColumnHeader color={colors.textColor} opacity={0.7} fontSize="xs" textTransform="uppercase" textAlign="center">
                {t('businessDashboard.currency', 'Moneda')}
              </Table.ColumnHeader>
              <Table.ColumnHeader color={colors.textColor} opacity={0.7} fontSize="xs" textTransform="uppercase" textAlign="right">
                {t('businessDashboard.volume')}
              </Table.ColumnHeader>
              <Table.ColumnHeader color={colors.textColor} opacity={0.7} fontSize="xs" textTransform="uppercase" textAlign="center">
                Ops
              </Table.ColumnHeader>
              <Table.ColumnHeader color={colors.textColor} opacity={0.7} fontSize="xs" textTransform="uppercase">
                {t('businessDashboard.product')}
              </Table.ColumnHeader>
              <Table.ColumnHeader color={colors.textColor} opacity={0.7} fontSize="xs" textTransform="uppercase" textAlign="center">
                {t('common.acciones', 'Acciones')}
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((client, index) => (
              <Table.Row
                key={`${client.clientId}-${client.primaryCurrency}-${index}`}
                _hover={{ bg: isDark ? 'whiteAlpha.50' : 'blackAlpha.25' }}
                cursor="pointer"
                onClick={() => handleViewClientOperations(client)}
              >
                <Table.Cell>
                  <HStack>
                    <Box
                      w={8}
                      h={8}
                      borderRadius="lg"
                      bg={`${colors.primaryColor}20`}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontWeight="bold"
                      fontSize="sm"
                      color={colors.primaryColor}
                    >
                      {index + 1}
                    </Box>
                    <VStack align="start" gap={0}>
                      <Text fontSize="sm" fontWeight="medium" color={colors.textColor} isTruncated maxW="180px">
                        {client.clientName}
                      </Text>
                      <Text fontSize="xs" color={colors.textColor} opacity={0.6}>
                        {client.clientType === 'APPLICANT' ? t('operations.applicant', 'Solicitante') : t('operations.beneficiary', 'Beneficiario')}
                      </Text>
                    </VStack>
                  </HStack>
                </Table.Cell>
                <Table.Cell textAlign="center">
                  <Badge colorPalette="gray" variant="subtle" fontWeight="bold">
                    {client.primaryCurrency}
                  </Badge>
                </Table.Cell>
                <Table.Cell textAlign="right">
                  <Text fontWeight="bold" color={colors.textColor}>
                    {formatVolume(client.totalVolume)}
                  </Text>
                </Table.Cell>
                <Table.Cell textAlign="center">
                  <Badge colorPalette="blue" variant="subtle">
                    {client.operationCount}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={PRODUCT_COLORS[client.preferredProduct] || 'gray'} variant="subtle">
                    {getProductLabel(client.preferredProduct, t)}
                  </Badge>
                </Table.Cell>
                <Table.Cell textAlign="center">
                  <IconButton
                    aria-label="Ver operaciones"
                    size="sm"
                    variant="ghost"
                    bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
                    _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewClientOperations(client);
                    }}
                  >
                    <FiEye />
                  </IconButton>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Client Operations Modal */}
      {isMaximized && selectedClient && (
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
            onClick={handleClose}
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
                    bg={colors.primaryColor}
                    color="white"
                    fontWeight="bold"
                    fontSize="lg"
                  >
                    {data.findIndex(c => c.clientId === selectedClient.clientId) + 1}
                  </Box>
                  <VStack align="start" gap={0}>
                    <Text fontSize="xl" fontWeight="bold" color={colors.textColor}>
                      {selectedClient.clientName}
                    </Text>
                    <HStack gap={2}>
                      <Badge colorPalette={selectedClient.clientType === 'APPLICANT' ? 'blue' : 'green'}>
                        {selectedClient.clientType === 'APPLICANT' ? t('operations.applicant', 'Solicitante') : t('operations.beneficiary', 'Beneficiario')}
                      </Badge>
                      <Badge colorPalette={PRODUCT_COLORS[selectedClient.preferredProduct] || 'gray'}>
                        {getProductLabel(selectedClient.preferredProduct, t)}
                      </Badge>
                    </HStack>
                  </VStack>
                </HStack>
                <HStack gap={3}>
                  <VStack align="end" gap={0}>
                    <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
                      {formatVolume(selectedClient.totalVolume)}
                    </Text>
                    <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
                      {selectedClient.operationCount} {t('operations.operations', 'operaciones')}
                    </Text>
                  </VStack>
                  <IconButton
                    aria-label="Cerrar"
                    size="md"
                    variant="ghost"
                    bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
                    _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
                    onClick={handleClose}
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
              ) : clientOperations.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text color={colors.textColor} opacity={0.5}>
                    {t('operations.noOperations', 'No hay operaciones para este cliente')}
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
                        end: Math.min(currentPage * pageSize, clientOperations.length),
                        total: clientOperations.length
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
                          <Table.ColumnHeader color={colors.textColor} textAlign="center">
                            {t('operations.createdBy', 'Ingresado por')}
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
                                  op.status === 'ON_HOLD' ? 'gray' : 'blue'
                                }
                                size="sm"
                              >
                                {t(`operations.statuses.${op.status}`)}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell textAlign="center">
                              <Text fontSize="sm" color={colors.textColor}>
                                {op.createdBy || '-'}
                              </Text>
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
    </>
  );
};

export default TopClientsTable;
