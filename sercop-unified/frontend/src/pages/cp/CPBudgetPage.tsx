/**
 * CPBudgetPage - Gestion de Certificados Presupuestarios
 * Muestra certificados presupuestarios de un proceso, con detalle de ejecuciones.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Center,
} from '@chakra-ui/react';
import {
  FiDollarSign,
  FiFileText,
  FiCalendar,
  FiBarChart2,
  FiTrendingUp,
  FiSearch,
  FiArrowRight,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../../components/ui/toaster';
import {
  listProcesses,
  getStatusColor,
  getStatusLabel,
  type CPProcessData,
} from '../../services/cpProcessService';
import {
  getCertificatesByProcess,
  getCertificate,
  updateCertificateStatus,
  getExecutions,
  addExecution,
  getCertificateStatusColor,
  getExecutionTypeLabel,
  getExecutionTypeColor,
  type CPBudgetCertificate,
  type CPBudgetExecution,
} from '../../services/cpBudgetService';

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

// ============================================================================
// Component
// ============================================================================

interface CPBudgetPageProps {
  processId?: string;
}

export const CPBudgetPage: React.FC<CPBudgetPageProps> = ({ processId: propProcessId }) => {
  const params = useParams<{ processId: string }>();
  const [selectedProcessId, setSelectedProcessId] = useState<string | undefined>(propProcessId || params.processId);
  const processId = selectedProcessId;
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const navigate = useNavigate();

  // State
  const [certificates, setCertificates] = useState<CPBudgetCertificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<CPBudgetCertificate | null>(null);
  const [executions, setExecutions] = useState<CPBudgetExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [executionsLoading, setExecutionsLoading] = useState(false);

  // Process list state (when no processId)
  const [processList, setProcessList] = useState<CPProcessData[]>([]);
  const [processListLoading, setProcessListLoading] = useState(false);

  // Design tokens
  const cardBg = isDark ? 'gray.800' : 'white';
  const cardBorder = isDark ? 'gray.700' : 'gray.200';
  const headerBg = isDark ? 'gray.900' : 'gray.50';
  const accentGradient = isDark
    ? 'linear(to-r, green.600, teal.600)'
    : 'linear(to-r, green.500, teal.500)';
  const tableBg = isDark ? 'gray.750' : 'gray.50';
  const hoverBg = isDark ? 'gray.700' : 'gray.100';

  // ============================================================================
  // Data loading
  // ============================================================================

  const loadCertificates = useCallback(async () => {
    if (!processId) return;
    setLoading(true);
    try {
      const data = await getCertificatesByProcess(processId);
      setCertificates(data);
    } catch (error) {
      toaster.create({
        title: t('common.error', 'Error'),
        description: t('cpBudget.loadError', 'No se pudieron cargar los certificados presupuestarios'),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [processId, t]);

  const loadExecutions = useCallback(async (certId: string) => {
    setExecutionsLoading(true);
    try {
      const data = await getExecutions(certId);
      // Sort by date ascending
      const sorted = [...data].sort(
        (a, b) => new Date(a.executionDate).getTime() - new Date(b.executionDate).getTime()
      );
      setExecutions(sorted);
    } catch (error) {
      toaster.create({
        title: t('common.error', 'Error'),
        description: t('cpBudget.executionsLoadError', 'No se pudieron cargar las ejecuciones'),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setExecutionsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSelectCertificate = useCallback(
    (cert: CPBudgetCertificate) => {
      setSelectedCertificate(cert);
      loadExecutions(cert.id);
    },
    [loadExecutions]
  );

  const handleStatusChange = useCallback(
    async (certId: string, newStatus: string) => {
      try {
        await updateCertificateStatus(certId, newStatus);
        toaster.create({
          title: t('common.success', 'Actualizado'),
          description: t('cpBudget.statusUpdated', 'Estado actualizado correctamente'),
          type: 'success',
          duration: 3000,
        });
        // Reload data
        await loadCertificates();
        if (selectedCertificate?.id === certId) {
          const updated = await getCertificate(certId);
          setSelectedCertificate(updated);
        }
      } catch (error) {
        toaster.create({
          title: t('common.error', 'Error'),
          description: t('cpBudget.statusUpdateError', 'No se pudo actualizar el estado'),
          type: 'error',
          duration: 5000,
        });
      }
    },
    [loadCertificates, selectedCertificate, t]
  );

  // ============================================================================
  // Computed values
  // ============================================================================

  const totalAmount = certificates.reduce((sum, c) => sum + c.amount, 0);
  const statusCounts = certificates.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  // Determine which workflow buttons to show based on current status
  const getAvailableTransitions = (status: string): { label: string; newStatus: string; color: string }[] => {
    const transitions: Record<string, { label: string; newStatus: string; color: string }[]> = {
      SOLICITADO: [
        { label: 'Aprobar', newStatus: 'APROBADO', color: 'green' },
        { label: 'Bloquear', newStatus: 'BLOQUEADO', color: 'orange' },
        { label: 'Cancelar', newStatus: 'CANCELADO', color: 'red' },
      ],
      APROBADO: [
        { label: 'Bloquear', newStatus: 'BLOQUEADO', color: 'orange' },
        { label: 'Liberar', newStatus: 'LIBERADO', color: 'teal' },
      ],
      BLOQUEADO: [
        { label: 'Liberar', newStatus: 'LIBERADO', color: 'teal' },
        { label: 'Cancelar', newStatus: 'CANCELADO', color: 'red' },
      ],
      LIBERADO: [],
      CANCELADO: [],
    };
    return transitions[status] || [];
  };

  // ============================================================================
  // Render: No processId provided
  // ============================================================================

  // Load process list when no processId
  useEffect(() => {
    if (!processId) {
      setProcessListLoading(true);
      listProcesses('EC', undefined, undefined, undefined, 0, 50)
        .then((result) => setProcessList(result.content || []))
        .catch(() => setProcessList([]))
        .finally(() => setProcessListLoading(false));
    }
  }, [processId]);

  if (!processId) {
    return (
      <Box flex={1} p={{ base: 4, md: 6 }} maxW="1400px" mx="auto">
        <VStack gap={6} align="stretch">
          {/* Header */}
          <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={cardBorder} overflow="hidden" shadow="sm">
            <Box bgGradient={accentGradient} h="4px" />
            <Box p={6}>
              <HStack>
                <Icon as={FiDollarSign} boxSize={6} color="green.500" />
                <Heading size="lg" color={colors.textColor}>Certificados Presupuestarios</Heading>
              </HStack>
              <Text fontSize="sm" color={colors.textColorSecondary} mt={1}>
                Seleccione un proceso para visualizar sus certificados presupuestarios
              </Text>
            </Box>
          </Box>

          {/* Process List */}
          <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={cardBorder} overflow="hidden" shadow="sm">
            {processListLoading ? (
              <Center py={10}>
                <Spinner size="lg" />
              </Center>
            ) : processList.length === 0 ? (
              <Center py={10}>
                <VStack gap={3}>
                  <Icon as={FiSearch} boxSize={10} color="gray.400" />
                  <Text color={colors.textColorSecondary}>No hay procesos disponibles</Text>
                  <Button size="sm" colorPalette="blue" onClick={() => navigate('/cp/processes')}>
                    Ir a Procesos
                  </Button>
                </VStack>
              </Center>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Código</Table.ColumnHeader>
                      <Table.ColumnHeader>Tipo</Table.ColumnHeader>
                      <Table.ColumnHeader>Entidad</Table.ColumnHeader>
                      <Table.ColumnHeader>Estado</Table.ColumnHeader>
                      <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">Acción</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {processList.map((proc) => (
                      <Table.Row
                        key={proc.id}
                        cursor="pointer"
                        _hover={{ bg: isDark ? 'whiteAlpha.50' : 'gray.50' }}
                        onClick={() => setSelectedProcessId(proc.processId)}
                      >
                        <Table.Cell fontWeight="medium" fontSize="sm">{proc.processCode || '---'}</Table.Cell>
                        <Table.Cell fontSize="sm">
                          <Badge colorPalette="purple" variant="subtle" size="sm">{proc.processType}</Badge>
                        </Table.Cell>
                        <Table.Cell fontSize="sm">{proc.entityName || '---'}</Table.Cell>
                        <Table.Cell>
                          <Badge colorPalette={getStatusColor(proc.status)} size="sm">
                            {getStatusLabel(proc.status)}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell fontSize="xs" color={colors.textColorSecondary}>
                          {proc.createdAt ? formatDate(proc.createdAt) : '---'}
                        </Table.Cell>
                        <Table.Cell textAlign="center">
                          <Button
                            size="xs"
                            colorPalette="green"
                            variant="ghost"
                            onClick={() => setSelectedProcessId(proc.processId)}
                          >
                            <Icon as={FiArrowRight} />
                            Ver Presupuesto
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>
        </VStack>
      </Box>
    );
  }

  // ============================================================================
  // Render: Loading
  // ============================================================================

  if (loading) {
    return (
      <Center h="400px">
        <VStack gap={4}>
          <Spinner size="xl" color={colors.primaryColor} />
          <Text color={colors.textColor}>{t('common.loading', 'Cargando...')}</Text>
        </VStack>
      </Center>
    );
  }

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
            <Flex
              direction={{ base: 'column', md: 'row' }}
              justify="space-between"
              align={{ base: 'start', md: 'center' }}
              gap={4}
            >
              <VStack align="start" gap={1}>
                <HStack>
                  <Icon as={FiDollarSign} boxSize={6} color={colors.primaryColor} />
                  <Heading size="lg" color={colors.textColor}>
                    {t('cpBudget.title', 'Certificados Presupuestarios')}
                  </Heading>
                </HStack>
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  {t('cpBudget.subtitle', 'Gestion y seguimiento de certificaciones presupuestarias del proceso')}
                </Text>
              </VStack>
              <Badge colorPalette="green" variant="subtle" fontSize="sm" px={3} py={1}>
                {t('cpBudget.processId', 'Proceso')}: {processId}
              </Badge>
            </Flex>
          </Box>
        </Box>

        {/* Overview Cards */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
          {/* Total Certificates */}
          <Card.Root bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="xl" shadow="sm">
            <Card.Body p={4}>
              <HStack justify="space-between">
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary}>
                    {t('cpBudget.totalCertificates', 'Total Certificados')}
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>
                    {certificates.length}
                  </Text>
                </VStack>
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg={isDark ? 'blue.900' : 'blue.50'}
                  align="center"
                  justify="center"
                >
                  <Icon as={FiFileText} boxSize={5} color="blue.500" />
                </Flex>
              </HStack>
            </Card.Body>
          </Card.Root>

          {/* Total Amount */}
          <Card.Root bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="xl" shadow="sm">
            <Card.Body p={4}>
              <HStack justify="space-between">
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary}>
                    {t('cpBudget.totalAmount', 'Monto Total')}
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {formatCurrency(totalAmount)}
                  </Text>
                </VStack>
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg={isDark ? 'green.900' : 'green.50'}
                  align="center"
                  justify="center"
                >
                  <Icon as={FiDollarSign} boxSize={5} color="green.500" />
                </Flex>
              </HStack>
            </Card.Body>
          </Card.Root>

          {/* By Status: SOLICITADO + APROBADO */}
          <Card.Root bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="xl" shadow="sm">
            <Card.Body p={4}>
              <HStack justify="space-between">
                <VStack align="start" gap={1}>
                  <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary}>
                    {t('cpBudget.byStatus', 'Por Estado')}
                  </Text>
                  <HStack gap={3}>
                    <VStack gap={0} align="start">
                      <Badge colorPalette="blue" variant="subtle" fontSize="xs">
                        {t('cpBudget.statusSolicitado', 'Solicitado')}
                      </Badge>
                      <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
                        {statusCounts['SOLICITADO'] || 0}
                      </Text>
                    </VStack>
                    <VStack gap={0} align="start">
                      <Badge colorPalette="green" variant="subtle" fontSize="xs">
                        {t('cpBudget.statusAprobado', 'Aprobado')}
                      </Badge>
                      <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
                        {statusCounts['APROBADO'] || 0}
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg={isDark ? 'purple.900' : 'purple.50'}
                  align="center"
                  justify="center"
                >
                  <Icon as={FiBarChart2} boxSize={5} color="purple.500" />
                </Flex>
              </HStack>
            </Card.Body>
          </Card.Root>

          {/* BLOQUEADO count */}
          <Card.Root bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="xl" shadow="sm">
            <Card.Body p={4}>
              <HStack justify="space-between">
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary}>
                    {t('cpBudget.statusBloqueado', 'Bloqueados')}
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                    {statusCounts['BLOQUEADO'] || 0}
                  </Text>
                </VStack>
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg={isDark ? 'orange.900' : 'orange.50'}
                  align="center"
                  justify="center"
                >
                  <Icon as={FiTrendingUp} boxSize={5} color="orange.500" />
                </Flex>
              </HStack>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {/* Certificates Table */}
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
                <Icon as={FiFileText} boxSize={5} color={colors.primaryColor} />
                <Heading size="sm" color={colors.textColor}>
                  {t('cpBudget.certificatesTable', 'Listado de Certificados')}
                </Heading>
              </HStack>
              <Text fontSize="xs" color={colors.textColorSecondary}>
                {certificates.length} {t('cpBudget.records', 'registros')}
              </Text>
            </HStack>
          </Box>

          {certificates.length === 0 ? (
            <Center py={12}>
              <VStack gap={3}>
                <Icon as={FiFileText} boxSize={10} color={colors.textColorSecondary} />
                <Text color={colors.textColorSecondary}>
                  {t('cpBudget.noCertificates', 'No hay certificados presupuestarios para este proceso')}
                </Text>
              </VStack>
            </Center>
          ) : (
            <Box overflowX="auto">
              <Table.Root size="sm" variant="outline">
                <Table.Header>
                  <Table.Row bg={tableBg}>
                    <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600">
                      {t('cpBudget.certNumber', 'No. Certificado')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600">
                      {t('cpBudget.certDate', 'Fecha')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600" textAlign="right">
                      {t('cpBudget.amount', 'Monto')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600">
                      {t('cpBudget.budgetPartition', 'Partida')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600">
                      {t('cpBudget.fundingSource', 'Fuente')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600" textAlign="center">
                      {t('cpBudget.fiscalYear', 'Anio Fiscal')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColorSecondary} fontSize="xs" fontWeight="600" textAlign="center">
                      {t('cpBudget.status', 'Estado')}
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {certificates.map((cert) => {
                    const isSelected = selectedCertificate?.id === cert.id;
                    return (
                      <Table.Row
                        key={cert.id}
                        cursor="pointer"
                        onClick={() => handleSelectCertificate(cert)}
                        bg={isSelected ? (isDark ? 'blue.900' : 'blue.50') : 'transparent'}
                        _hover={{ bg: isSelected ? undefined : hoverBg }}
                        transition="background 0.15s"
                        borderLeftWidth={isSelected ? '3px' : '0px'}
                        borderLeftColor="blue.500"
                      >
                        <Table.Cell>
                          <Text fontWeight="600" fontSize="sm" color={colors.textColor}>
                            {cert.certificateNumber}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <HStack gap={1}>
                            <Icon as={FiCalendar} boxSize={3} color={colors.textColorSecondary} />
                            <Text fontSize="sm" color={colors.textColor}>
                              {formatDate(cert.certificateDate)}
                            </Text>
                          </HStack>
                        </Table.Cell>
                        <Table.Cell textAlign="right">
                          <Text fontWeight="600" fontSize="sm" color="green.500">
                            {formatCurrency(cert.amount)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="sm" color={colors.textColor}>
                            {cert.budgetPartition}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="sm" color={colors.textColor}>
                            {cert.fundingSource}
                          </Text>
                        </Table.Cell>
                        <Table.Cell textAlign="center">
                          <Text fontSize="sm" color={colors.textColor}>
                            {cert.fiscalYear}
                          </Text>
                        </Table.Cell>
                        <Table.Cell textAlign="center">
                          <Badge
                            colorPalette={getCertificateStatusColor(cert.status)}
                            variant="subtle"
                            fontSize="xs"
                          >
                            {cert.status}
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

        {/* Execution Details (shown when a certificate is selected) */}
        {selectedCertificate && (
          <Box
            bg={cardBg}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={cardBorder}
            overflow="hidden"
            shadow="sm"
          >
            <Box px={5} py={4} bg={headerBg} borderBottomWidth="1px" borderColor={cardBorder}>
              <Flex
                direction={{ base: 'column', md: 'row' }}
                justify="space-between"
                align={{ base: 'start', md: 'center' }}
                gap={3}
              >
                <VStack align="start" gap={1}>
                  <HStack gap={2}>
                    <Icon as={FiTrendingUp} boxSize={5} color={colors.primaryColor} />
                    <Heading size="sm" color={colors.textColor}>
                      {t('cpBudget.executionDetails', 'Detalle de Ejecucion')}
                    </Heading>
                  </HStack>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    {t('cpBudget.certificateLabel', 'Certificado')}: {selectedCertificate.certificateNumber} |{' '}
                    {t('cpBudget.amountLabel', 'Monto')}: {formatCurrency(selectedCertificate.amount)}
                  </Text>
                </VStack>

                {/* Workflow buttons */}
                <HStack gap={2} flexWrap="wrap">
                  {getAvailableTransitions(selectedCertificate.status).map((transition) => (
                    <Button
                      key={transition.newStatus}
                      size="xs"
                      colorPalette={transition.color}
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(selectedCertificate.id, transition.newStatus);
                      }}
                    >
                      {transition.label}
                    </Button>
                  ))}
                  {getAvailableTransitions(selectedCertificate.status).length === 0 && (
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      {t('cpBudget.noTransitions', 'Sin transiciones disponibles')}
                    </Text>
                  )}
                </HStack>
              </Flex>
            </Box>

            <Box p={5}>
              {executionsLoading ? (
                <Center py={8}>
                  <Spinner size="md" color={colors.primaryColor} />
                </Center>
              ) : executions.length === 0 ? (
                <Center py={8}>
                  <VStack gap={2}>
                    <Icon as={FiBarChart2} boxSize={8} color={colors.textColorSecondary} />
                    <Text fontSize="sm" color={colors.textColorSecondary}>
                      {t('cpBudget.noExecutions', 'No hay ejecuciones registradas para este certificado')}
                    </Text>
                  </VStack>
                </Center>
              ) : (
                <VStack gap={3} align="stretch">
                  <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary} mb={1}>
                    {t('cpBudget.executionTimeline', 'Linea de tiempo de ejecuciones')}
                  </Text>

                  {executions.map((exec, index) => {
                    const typeColor = getExecutionTypeColor(exec.executionType);
                    const isLast = index === executions.length - 1;

                    return (
                      <HStack key={exec.id} gap={4} align="start">
                        {/* Timeline connector */}
                        <VStack gap={0} align="center" minW="24px">
                          <Box
                            w="12px"
                            h="12px"
                            borderRadius="full"
                            bg={`${typeColor}.500`}
                            borderWidth="2px"
                            borderColor={cardBg}
                            boxShadow={`0 0 0 2px var(--chakra-colors-${typeColor}-200)`}
                          />
                          {!isLast && (
                            <Box w="2px" h="40px" bg={isDark ? 'gray.600' : 'gray.200'} />
                          )}
                        </VStack>

                        {/* Execution card */}
                        <Box
                          flex={1}
                          p={3}
                          bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                          borderRadius="lg"
                          borderWidth="1px"
                          borderColor={cardBorder}
                        >
                          <Flex
                            direction={{ base: 'column', sm: 'row' }}
                            justify="space-between"
                            align={{ base: 'start', sm: 'center' }}
                            gap={2}
                          >
                            <HStack gap={3}>
                              <Badge
                                colorPalette={typeColor}
                                variant="subtle"
                                fontSize="xs"
                                px={2}
                              >
                                {getExecutionTypeLabel(exec.executionType)}
                              </Badge>
                              <Text fontWeight="600" fontSize="sm" color={colors.textColor}>
                                {formatCurrency(exec.amount)}
                              </Text>
                            </HStack>
                            <HStack gap={3}>
                              <HStack gap={1}>
                                <Icon as={FiCalendar} boxSize={3} color={colors.textColorSecondary} />
                                <Text fontSize="xs" color={colors.textColorSecondary}>
                                  {formatDate(exec.executionDate)}
                                </Text>
                              </HStack>
                              <Text fontSize="xs" color={colors.textColorSecondary}>
                                Doc: {exec.documentNumber}
                              </Text>
                            </HStack>
                          </Flex>
                        </Box>
                      </HStack>
                    );
                  })}
                </VStack>
              )}
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default CPBudgetPage;
