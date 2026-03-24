import { Box, Heading, Text, VStack, Card, Badge, Button, HStack, Tabs } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FiPlus, FiFileText, FiRefreshCw, FiEye } from 'react-icons/fi';
import clientPortalService from '../../services/clientPortalService';
import type { ClientRequest, MyEventRequest } from '../../services/clientPortalService';
import { useTheme } from '../../contexts/ThemeContext';
import { DataTable, type DataTableColumn, type DataTableAction } from '../../components/ui/DataTable';

const statusColors: Record<string, string> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  IN_REVIEW: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
  PENDING: 'blue',
  PROCESSING: 'yellow',
  COMPLETED: 'green',
};

const eventStatusLabels: Record<string, { es: string; en: string }> = {
  PENDING: { es: 'Pendiente', en: 'Pending' },
  APPROVED: { es: 'Aprobado', en: 'Approved' },
  REJECTED: { es: 'Rechazado', en: 'Rejected' },
  PROCESSING: { es: 'Procesando', en: 'Processing' },
  COMPLETED: { es: 'Completado', en: 'Completed' },
  CANCELLED: { es: 'Cancelado', en: 'Cancelled' },
};

export const ClientRequests = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { getColors } = useTheme();
  const colors = getColors();
  const isSpanish = i18n.language === 'es';

  // Client Requests state
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Event Requests state
  const [eventRequests, setEventRequests] = useState<MyEventRequest[]>([]);
  const [loadingEventRequests, setLoadingEventRequests] = useState(true);

  // Load client requests
  useEffect(() => {
    const loadRequests = async () => {
      try {
        const response = await clientPortalService.getMyRequests({ page: 0, size: 50 });
        setRequests(response.content);
      } catch (error) {
        console.error('Error loading requests:', error);
      } finally {
        setLoadingRequests(false);
      }
    };
    loadRequests();
  }, []);

  // Load event requests
  useEffect(() => {
    const loadEventRequests = async () => {
      try {
        const response = await clientPortalService.getMyEventRequests();
        setEventRequests(response);
      } catch (error) {
        console.error('Error loading event requests:', error);
      } finally {
        setLoadingEventRequests(false);
      }
    };
    loadEventRequests();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  // ─── New Operations columns ────────────────────────────────
  const requestColumns: DataTableColumn<ClientRequest>[] = [
    {
      key: 'requestNumber',
      label: t('clientPortal.requests.reference', 'Referencia'),
      render: (row) => (
        <VStack align="start" gap={0}>
          <Text fontSize="sm">{row.requestNumber || '-'}</Text>
          {row.operationReference && (
            <Text fontSize="xs" color="green.600" fontWeight="medium">
              {t('clientPortal.requests.operationRef', 'Op')}: {row.operationReference}
            </Text>
          )}
        </VStack>
      ),
    },
    {
      key: 'productType',
      label: t('clientPortal.requests.type', 'Tipo'),
      render: (row) => <Text fontSize="sm">{row.productTypeLabel || row.productType}</Text>,
    },
    {
      key: 'status',
      label: t('clientPortal.requests.status', 'Estado'),
      filterType: 'select',
      filterOptions: [
        { value: 'DRAFT', label: t('status.draft', 'Draft') },
        { value: 'SUBMITTED', label: t('status.submitted', 'Submitted') },
        { value: 'IN_REVIEW', label: t('status.inReview', 'In Review') },
        { value: 'APPROVED', label: t('status.approved', 'Approved') },
        { value: 'REJECTED', label: t('status.rejected', 'Rejected') },
      ],
      render: (row) => (
        <Badge colorPalette={statusColors[row.status] || 'gray'}>
          {row.statusLabel || t(`status.${row.status.toLowerCase()}`, row.status)}
        </Badge>
      ),
    },
    {
      key: 'createdByName',
      label: t('clientPortal.requests.createdBy', 'Creado por'),
      hideOnMobile: true,
      render: (row) => <Text fontSize="sm">{row.createdByName || '-'}</Text>,
    },
    {
      key: 'createdAt',
      label: t('clientPortal.requests.createdAt', 'Fecha'),
      hideOnMobile: true,
      render: (row) => <Text fontSize="sm">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</Text>,
    },
  ];

  const requestActions: DataTableAction<ClientRequest>[] = [
    {
      key: 'view',
      label: t('common.view', 'Ver'),
      icon: FiEye,
      colorPalette: 'blue',
      onClick: (row) => navigate(`/client/requests/${row.id}`),
    },
  ];

  // ─── Post-Issuance columns ─────────────────────────────────
  const eventColumns: DataTableColumn<MyEventRequest>[] = [
    {
      key: 'requestId',
      label: t('clientPortal.requests.requestId', 'ID Solicitud'),
      render: (row) => (
        <Text fontWeight="medium" fontSize="sm">
          {row.requestId?.substring(0, 8)}...
        </Text>
      ),
    },
    {
      key: 'operationId',
      label: t('clientPortal.requests.operation', 'Operación'),
      render: (row) => (
        <VStack align="start" gap={0}>
          <Text fontSize="sm">{row.operationId?.substring(0, 12)}...</Text>
          {row.operationReference && (
            <Text fontSize="xs" color="green.600">{row.operationReference}</Text>
          )}
        </VStack>
      ),
    },
    {
      key: 'eventCode',
      label: t('clientPortal.requests.eventType', 'Tipo de Evento'),
      render: (row) => (
        <VStack align="start" gap={0}>
          <Text fontWeight="medium" fontSize="sm">{row.eventName || row.eventCode}</Text>
          {row.eventDescription && (
            <Text fontSize="xs" color={colors.textColorSecondary}>{row.eventDescription}</Text>
          )}
        </VStack>
      ),
    },
    {
      key: 'status',
      label: t('clientPortal.requests.status', 'Estado'),
      filterType: 'select',
      filterOptions: [
        { value: 'PENDING', label: isSpanish ? 'Pendiente' : 'Pending' },
        { value: 'APPROVED', label: isSpanish ? 'Aprobado' : 'Approved' },
        { value: 'REJECTED', label: isSpanish ? 'Rechazado' : 'Rejected' },
        { value: 'PROCESSING', label: isSpanish ? 'Procesando' : 'Processing' },
        { value: 'COMPLETED', label: isSpanish ? 'Completado' : 'Completed' },
      ],
      render: (row) => (
        <Badge colorPalette={statusColors[row.status] || 'gray'}>
          {row.statusLabel || (isSpanish
            ? eventStatusLabels[row.status]?.es
            : eventStatusLabels[row.status]?.en) || row.status}
        </Badge>
      ),
    },
    {
      key: 'requestedAt',
      label: t('clientPortal.requests.requestedAt', 'Solicitado'),
      hideOnMobile: true,
      render: (row) => <Text fontSize="sm">{formatDate(row.requestedAt)}</Text>,
    },
  ];

  const eventActions: DataTableAction<MyEventRequest>[] = [
    {
      key: 'viewOperation',
      label: t('common.viewOperation', 'Ver Operación'),
      icon: FiEye,
      colorPalette: 'blue',
      onClick: (row) => navigate(`/client/operations/${row.operationId}`),
    },
  ];

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        <HStack justify="space-between">
          <Box>
            <Heading size="lg" mb={2}>
              {t('clientPortal.requests.title', 'My Requests')}
            </Heading>
            <Text color={colors.textColorSecondary}>
              {t('clientPortal.requests.subtitle', 'View and manage your trade finance requests')}
            </Text>
          </Box>
          <Button colorPalette="blue" onClick={() => navigate('/client/requests/new')}>
            <FiPlus style={{ marginRight: 8 }} />
            {t('clientPortal.requests.newRequest', 'New Request')}
          </Button>
        </HStack>

        <Card.Root>
          <Card.Body>
            <Tabs.Root defaultValue="new-operations" variant="line">
              <Tabs.List mb={4}>
                <Tabs.Trigger value="new-operations">
                  <HStack gap={2}>
                    <FiFileText />
                    <Text>{t('clientPortal.requests.newOperations', 'New Operations')}</Text>
                    {requests.length > 0 && (
                      <Badge colorPalette="blue" size="sm">{requests.length}</Badge>
                    )}
                  </HStack>
                </Tabs.Trigger>
                <Tabs.Trigger value="post-issuance">
                  <HStack gap={2}>
                    <FiRefreshCw />
                    <Text>{t('clientPortal.requests.postIssuance', 'Post-Issuance')}</Text>
                    {eventRequests.length > 0 && (
                      <Badge colorPalette="purple" size="sm">{eventRequests.length}</Badge>
                    )}
                  </HStack>
                </Tabs.Trigger>
              </Tabs.List>

              {/* New Operations Tab */}
              <Tabs.Content value="new-operations">
                <DataTable<ClientRequest>
                  data={requests}
                  columns={requestColumns}
                  rowKey={(row) => row.id}
                  actions={requestActions}
                  isLoading={loadingRequests}
                  emptyMessage={t('clientPortal.requests.noRequests', 'No requests found')}
                  emptyIcon={FiFileText}
                  defaultSort={{ field: 'createdAt', direction: 'desc' }}
                  defaultPageSize={10}
                />
              </Tabs.Content>

              {/* Post-Issuance Tab */}
              <Tabs.Content value="post-issuance">
                <DataTable<MyEventRequest>
                  data={eventRequests}
                  columns={eventColumns}
                  rowKey={(row) => row.requestId}
                  actions={eventActions}
                  isLoading={loadingEventRequests}
                  emptyMessage={t('clientPortal.requests.noEventRequests', 'No post-issuance requests found')}
                  emptyIcon={FiRefreshCw}
                  defaultPageSize={10}
                />
              </Tabs.Content>
            </Tabs.Root>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Box>
  );
};

export default ClientRequests;
