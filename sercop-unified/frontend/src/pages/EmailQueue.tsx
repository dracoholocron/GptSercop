import {
  Box,
  Text,
  Flex,
  Button,
  HStack,
  Badge,
  Spinner,
  Heading,
  VStack,
  SimpleGrid,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogCloseTrigger,
  Grid,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import {
  FiRefreshCw,
  FiEye,
  FiXCircle,
  FiRotateCw,
  FiMail,
  FiClock,
  FiCheck,
  FiX,
  FiAlertTriangle,
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import {
  emailQueueApi,
  type EmailQueue as EmailQueueType,
  type EmailStats,
  type EmailLog,
} from '../services/emailService';
import { notify } from '../components/ui/toaster';
import { DataTable, type DataTableColumn, type DataTableAction } from '../components/ui/DataTable';

export const EmailQueue = () => {
  const { getColors } = useTheme();
  const colors = getColors();
  const { bgColor, borderColor, cardBg, textColor, textColorSecondary, primaryColor } = colors;

  const [emails, setEmails] = useState<EmailQueueType[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailQueueType | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Server pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [e, s] = await Promise.all([
        emailQueueApi.getAll(page, pageSize),
        emailQueueApi.getStats(),
      ]);
      setEmails(e.content);
      setTotalItems(e.totalElements ?? e.content.length);
      setStats(s);
    } catch {
      notify.error('Error', 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewDetails = async (email: EmailQueueType) => {
    setSelectedEmail(email);
    try {
      setEmailLogs(await emailQueueApi.getLogs(email.id));
    } catch {
      setEmailLogs([]);
    }
    setIsDetailModalOpen(true);
  };

  const handleCancel = async (id: number) => {
    if (!confirm('¿Cancelar?')) return;
    try {
      await emailQueueApi.cancel(id);
      loadData();
      notify.success('OK', 'Cancelado');
    } catch {
      notify.error('Error', 'Error');
    }
  };

  const handleRetry = async (id: number) => {
    try {
      await emailQueueApi.retry(id);
      loadData();
      notify.success('OK', 'Programado para reintento');
    } catch {
      notify.error('Error', 'Error');
    }
  };

  const getStatusBadge = (status: string) => {
    const cfg: Record<string, { color: string; icon: React.ReactNode }> = {
      PENDING: { color: 'gray', icon: <FiClock /> },
      PROCESSING: { color: 'blue', icon: <Spinner size="xs" /> },
      SENT: { color: 'green', icon: <FiCheck /> },
      FAILED: { color: 'red', icon: <FiX /> },
      RETRY: { color: 'orange', icon: <FiRotateCw /> },
      CANCELLED: { color: 'gray', icon: <FiXCircle /> },
    };
    const c = cfg[status] || { color: 'gray', icon: null };
    return (
      <Badge colorPalette={c.color}>
        <HStack gap={1}>
          {c.icon}
          <Text>{status}</Text>
        </HStack>
      </Badge>
    );
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString('es-EC', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // --- DataTable columns ---
  const columns: DataTableColumn<EmailQueueType>[] = [
    {
      key: 'uuid',
      label: 'UUID',
      render: (row) => (
        <Text fontFamily="mono" fontSize="xs" color={textColorSecondary}>
          {row.uuid.substring(0, 8)}...
        </Text>
      ),
    },
    {
      key: 'toAddresses',
      label: 'Destinatario',
      render: (row) => <Text>{row.toAddresses?.join(', ').substring(0, 25)}...</Text>,
    },
    {
      key: 'subject',
      label: 'Asunto',
      render: (row) => <Text>{row.subject.substring(0, 30)}...</Text>,
    },
    {
      key: 'status',
      label: 'Estado',
      filterType: 'select',
      filterOptions: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'PROCESSING', label: 'Processing' },
        { value: 'SENT', label: 'Sent' },
        { value: 'FAILED', label: 'Failed' },
        { value: 'RETRY', label: 'Retry' },
        { value: 'CANCELLED', label: 'Cancelled' },
      ],
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'retryCount',
      label: 'Reintentos',
      hideOnMobile: true,
      render: (row) => (
        <Text color={textColorSecondary}>
          {row.retryCount}/{row.maxRetries}
        </Text>
      ),
    },
    {
      key: 'createdAt',
      label: 'Creado',
      hideOnMobile: true,
      render: (row) => (
        <Text fontSize="xs" color={textColorSecondary}>
          {formatDate(row.createdAt)}
        </Text>
      ),
    },
  ];

  // --- DataTable actions ---
  const actions: DataTableAction<EmailQueueType>[] = [
    {
      key: 'view',
      label: 'Ver',
      icon: FiEye,
      onClick: (row) => handleViewDetails(row),
    },
    {
      key: 'retry',
      label: 'Reintentar',
      icon: FiRotateCw,
      colorPalette: 'orange',
      onClick: (row) => handleRetry(row.id),
      isHidden: (row) => row.status !== 'FAILED',
    },
    {
      key: 'cancel',
      label: 'Cancelar',
      icon: FiXCircle,
      colorPalette: 'red',
      onClick: (row) => handleCancel(row.id),
      isHidden: (row) => !['PENDING', 'RETRY'].includes(row.status),
    },
  ];

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color={textColor}>
          Cola de Emails
        </Heading>
      </Flex>

      {/* Stats cards */}
      {stats && (
        <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} gap={4} mb={6}>
          <Box bg={cardBg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <HStack>
              <Box color="gray.500"><FiClock size={24} /></Box>
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>{stats.pending}</Text>
                <Text fontSize="sm" color={textColorSecondary}>Pendientes</Text>
              </Box>
            </HStack>
          </Box>
          <Box bg={cardBg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <HStack>
              <Box color="blue.500"><Spinner size="sm" /></Box>
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>{stats.processing}</Text>
                <Text fontSize="sm" color={textColorSecondary}>Procesando</Text>
              </Box>
            </HStack>
          </Box>
          <Box bg={cardBg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <HStack>
              <Box color="green.500"><FiCheck size={24} /></Box>
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>{stats.sent}</Text>
                <Text fontSize="sm" color={textColorSecondary}>Enviados</Text>
              </Box>
            </HStack>
          </Box>
          <Box bg={cardBg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <HStack>
              <Box color="red.500"><FiX size={24} /></Box>
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>{stats.failed}</Text>
                <Text fontSize="sm" color={textColorSecondary}>Fallidos</Text>
              </Box>
            </HStack>
          </Box>
          <Box bg={cardBg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <HStack>
              <Box color="orange.500"><FiRotateCw size={24} /></Box>
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>{stats.retry}</Text>
                <Text fontSize="sm" color={textColorSecondary}>Reintentos</Text>
              </Box>
            </HStack>
          </Box>
          <Box bg={cardBg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <HStack>
              <Box color="purple.500"><FiMail size={24} /></Box>
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>{stats.total}</Text>
                <Text fontSize="sm" color={textColorSecondary}>Total</Text>
              </Box>
            </HStack>
          </Box>
        </SimpleGrid>
      )}

      {/* DataTable replaces loading, manual Table, empty state, and pagination */}
      <DataTable<EmailQueueType>
        data={emails}
        columns={columns}
        rowKey={(row) => String(row.id)}
        actions={actions}
        isLoading={loading}
        emptyMessage="No hay emails"
        emptyIcon={FiMail}
        defaultPageSize={pageSize}
        pagination="server"
        serverPagination={{
          totalItems,
          currentPage: page,
          pageSize,
          onPageChange: (p) => setPage(p),
          onPageSizeChange: (s) => {
            setPageSize(s);
            setPage(0);
          },
        }}
        toolbarRight={
          <Button variant="outline" borderColor={borderColor} color={textColor} onClick={loadData} disabled={loading}>
            <HStack gap={2}>
              <FiRefreshCw />
              <Text>Actualizar</Text>
            </HStack>
          </Button>
        }
      />

      {/* Detail Modal - kept intact */}
      <DialogRoot open={isDetailModalOpen} onOpenChange={(e) => setIsDetailModalOpen(e.open)}>
        <DialogContent maxW="700px">
          <DialogHeader>
            <DialogTitle>Detalles del Email</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            {selectedEmail && (
              <VStack gap={4} align="stretch">
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontWeight="bold" color={textColorSecondary} fontSize="sm">UUID</Text>
                    <Text fontFamily="mono" fontSize="sm">{selectedEmail.uuid}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color={textColorSecondary} fontSize="sm">Estado</Text>
                    {getStatusBadge(selectedEmail.status)}
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color={textColorSecondary} fontSize="sm">Destinatarios</Text>
                    <Text fontSize="sm">{selectedEmail.toAddresses?.join(', ')}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color={textColorSecondary} fontSize="sm">Prioridad</Text>
                    <Badge>{selectedEmail.priority}</Badge>
                  </Box>
                </Grid>
                <Box>
                  <Text fontWeight="bold" color={textColorSecondary} fontSize="sm">Asunto</Text>
                  <Text>{selectedEmail.subject}</Text>
                </Box>
                {selectedEmail.lastError && (
                  <Box bg="red.50" p={3} borderRadius="md">
                    <HStack>
                      <FiAlertTriangle color="red" />
                      <Text color="red.600" fontSize="sm">{selectedEmail.lastError}</Text>
                    </HStack>
                  </Box>
                )}
                <Box>
                  <Text fontWeight="bold" color={textColorSecondary} fontSize="sm" mb={2}>
                    Historial
                  </Text>
                  <VStack gap={2} align="stretch" maxH="150px" overflowY="auto">
                    {emailLogs.map((log) => (
                      <HStack key={log.id} justify="space-between" p={2} bg={bgColor} borderRadius="md">
                        <Badge
                          colorPalette={
                            log.eventType === 'SENT'
                              ? 'green'
                              : log.eventType === 'FAILED'
                                ? 'red'
                                : 'gray'
                          }
                        >
                          {log.eventType}
                        </Badge>
                        <Text fontSize="xs" color={textColorSecondary}>
                          {formatDate(log.eventTimestamp)}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            )}
          </DialogBody>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
};

export default EmailQueue;
