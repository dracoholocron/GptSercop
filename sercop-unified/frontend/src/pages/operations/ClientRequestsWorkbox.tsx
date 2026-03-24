/**
 * ClientRequestsWorkbox - Workbox for processing client portal requests
 * Internal bank users use this to review, approve, reject, and process client requests
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Spinner,
  SimpleGrid,
  Stat,
  Icon,
  Heading,
  Dialog,
  Field,
  Textarea,
  Progress,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiInbox,
  FiUserCheck,
  FiClock,
  FiAlertTriangle,
  FiEye,
  FiCheck,
  FiX,
  FiFileText,
  FiRefreshCw,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { notify } from '../../components/ui/toaster';
import { DataTable, type DataTableColumn, type DataTableAction } from '../../components/ui/DataTable';
import backofficeRequestService from '../../services/backofficeRequestService';
import type { ClientRequest, BackofficeStats } from '../../services/clientPortalTypes';

const statusColors: Record<string, string> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  IN_REVIEW: 'orange',
  PENDING_DOCUMENTS: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
};

const productTypeLabels: Record<string, string> = {
  LC_IMPORT_REQUEST: 'LC Import',
  LC_EXPORT_REQUEST: 'LC Export',
  GUARANTEE_REQUEST: 'Guarantee',
  COLLECTION_REQUEST: 'Collection',
};


interface ClientRequestsWorkboxProps {
  filter?: 'all' | 'assigned' | 'pending-approval' | 'sla';
  stageFilter?: string;
}

export const ClientRequestsWorkbox = ({ filter = 'all', stageFilter }: ClientRequestsWorkboxProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getColors } = useTheme();
  const { user } = useAuth();
  const colors = getColors();

  // State
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [stats, setStats] = useState<BackofficeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDocsDialog, setShowDocsDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [docsDetails, setDocsDetails] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Build filters based on the current filter mode
      const params: Record<string, string | number | undefined> = {
        page,
        size: pageSize,
        status: searchParams.get('status') || undefined,
        productType: searchParams.get('productType') || undefined,
        internalProcessingStage: stageFilter || undefined,
      };

      // Apply filter mode
      if (filter === 'assigned') {
        params.assignedToUserId = user?.id;
      } else if (filter === 'pending-approval') {
        params.status = 'IN_REVIEW';
      }

      const response = await backofficeRequestService.listRequests(params);
      setRequests(response.content);
      setTotalElements(response.totalElements);

      // Load stats
      const statsData = await backofficeRequestService.getStatistics();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading requests:', error);
      notify.error(t('backoffice.requests.loadError', 'Error loading requests'));
    } finally {
      setLoading(false);
    }
  }, [filter, stageFilter, page, pageSize, searchParams, user?.id, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions
  const handleAssign = async (request: ClientRequest) => {
    try {
      setActionLoading(true);
      // Pass user ID as string and ensure name is provided
      const userId = String(user?.id || '');
      const userName = user?.name || user?.username || 'Usuario ' + userId;
      await backofficeRequestService.assignRequest(request.id, userId, userName);
      notify.success(t('backoffice.requests.assigned', 'Request assigned successfully'));
      loadData();
    } catch (error) {
      notify.error(t('backoffice.requests.assignError', 'Error assigning request'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (request: ClientRequest) => {
    try {
      setActionLoading(true);
      await backofficeRequestService.approveRequest(
        request.id,
        user?.id,
        user?.name || user?.username
      );
      notify.success(t('backoffice.requests.approved', 'Request approved successfully'));
      loadData();
    } catch (error) {
      notify.error(t('backoffice.requests.approveError', 'Error approving request'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;

    try {
      setActionLoading(true);
      await backofficeRequestService.rejectRequest(
        selectedRequest.id,
        rejectReason,
        user?.id,
        user?.name || user?.username
      );
      notify.success(t('backoffice.requests.rejected', 'Request rejected'));
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedRequest(null);
      loadData();
    } catch (error) {
      notify.error(t('backoffice.requests.rejectError', 'Error rejecting request'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestDocs = async () => {
    if (!selectedRequest || !docsDetails.trim()) return;

    try {
      setActionLoading(true);
      await backofficeRequestService.requestDocuments(selectedRequest.id, docsDetails);
      notify.success(t('backoffice.requests.docsRequested', 'Documents requested'));
      setShowDocsDialog(false);
      setDocsDetails('');
      setSelectedRequest(null);
      loadData();
    } catch (error) {
      notify.error(t('backoffice.requests.docsError', 'Error requesting documents'));
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (request: ClientRequest) => {
    setSelectedRequest(request);
    setRejectReason('');
    setShowRejectDialog(true);
  };

  const openDocsDialog = (request: ClientRequest) => {
    setSelectedRequest(request);
    setDocsDetails('');
    setShowDocsDialog(true);
  };

  // Get title based on filter or stage
  const getTitle = () => {
    if (stageFilter) {
      const stageKey = stageFilter.toLowerCase();
      return t(`menu.stage.${stageKey}`, stageFilter);
    }
    switch (filter) {
      case 'assigned':
        return t('backoffice.requests.myAssigned', 'My Assigned Requests');
      case 'pending-approval':
        return t('backoffice.requests.pendingApproval', 'Pending Approval');
      case 'sla':
        return t('backoffice.requests.slaDashboard', 'SLA Dashboard');
      default:
        return t('backoffice.requests.inbox', 'Request Inbox');
    }
  };

  // Render SLA timeline with progress bar
  const renderSlaTimeline = (request: ClientRequest) => {
    // If no SLA data, show simple text
    if (!request.slaHours || !request.submittedAt) {
      return <Text color="gray.400" fontSize="xs">-</Text>;
    }

    const submittedDate = new Date(request.submittedAt);
    const isFinished = ['APPROVED', 'REJECTED', 'CANCELLED'].includes(request.status);
    const endDate = isFinished
      ? new Date(request.approvedAt || request.rejectedAt || request.updatedAt || new Date())
      : new Date();
    const elapsedMs = endDate.getTime() - submittedDate.getTime();
    const elapsedHours = Math.max(0, elapsedMs / (1000 * 60 * 60));
    const totalHours = request.slaHours;
    const remainingHours = Math.max(0, totalHours - elapsedHours);

    // Calculate progress percentage (0-100)
    const progressPercent = Math.min(100, (elapsedHours / totalHours) * 100);

    // Determine color based on status
    let progressColor = 'green';
    let statusText = '';

    if (request.slaBreached || remainingHours <= 0) {
      progressColor = isFinished ? 'gray' : 'red';
      const exceededHours = Math.abs(remainingHours);
      const exceededLabel = isFinished ? 'Finalizado' : 'Excedido';
      statusText = exceededHours < 24
        ? `${exceededLabel} ${Math.round(exceededHours)}h`
        : `${exceededLabel} ${Math.round(exceededHours / 24)}d`;
    } else if (isFinished) {
      progressColor = 'green';
      const usedHours = elapsedHours;
      statusText = usedHours < 24
        ? `Finalizado en ${Math.round(usedHours)}h`
        : `Finalizado en ${Math.round(usedHours / 24)}d`;
    } else if (request.slaStatus === 'CRITICAL' || remainingHours <= 2) {
      progressColor = 'red';
      statusText = `${Math.round(remainingHours)}h restantes`;
    } else if (request.slaStatus === 'WARNING' || remainingHours <= totalHours * 0.25) {
      progressColor = 'orange';
      statusText = remainingHours < 24
        ? `${Math.round(remainingHours)}h restantes`
        : `${Math.round(remainingHours / 24)}d restantes`;
    } else {
      progressColor = 'green';
      statusText = remainingHours < 24
        ? `${Math.round(remainingHours)}h restantes`
        : `${Math.round(remainingHours / 24)}d restantes`;
    }

    // Format elapsed time
    const elapsedText = elapsedHours < 24
      ? `${Math.round(elapsedHours)}h`
      : `${Math.round(elapsedHours / 24)}d`;

    return (
      <VStack align="stretch" gap={1} minW="100px">
        <Progress.Root
          value={progressPercent}
          size="xs"
          colorPalette={progressColor}
        >
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
        <HStack justify="space-between" fontSize="xs">
          <Text color="gray.500">{elapsedText}</Text>
          <Text
            color={progressColor === 'green' ? 'green.500' : progressColor === 'orange' ? 'orange.500' : 'red.500'}
            fontWeight="medium"
          >
            {statusText}
          </Text>
        </HStack>
      </VStack>
    );
  };

  // Render stats cards
  const renderStats = () => (
    <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
      <Stat.Root>
        <Stat.Label>
          <HStack>
            <Icon as={FiInbox} color="blue.500" />
            <Text>{t('backoffice.stats.pendingTotal', 'Pending')}</Text>
          </HStack>
        </Stat.Label>
        <Stat.ValueText>{stats?.pendingTotal || 0}</Stat.ValueText>
      </Stat.Root>

      <Stat.Root>
        <Stat.Label>
          <HStack>
            <Icon as={FiUserCheck} color="green.500" />
            <Text>{t('backoffice.stats.myAssigned', 'My Assigned')}</Text>
          </HStack>
        </Stat.Label>
        <Stat.ValueText>{stats?.myAssigned || 0}</Stat.ValueText>
      </Stat.Root>

      <Stat.Root>
        <Stat.Label>
          <HStack>
            <Icon as={FiClock} color="orange.500" />
            <Text>{t('backoffice.stats.slaAtRisk', 'SLA At Risk')}</Text>
          </HStack>
        </Stat.Label>
        <Stat.ValueText>{stats?.slaAtRisk || 0}</Stat.ValueText>
      </Stat.Root>

      <Stat.Root>
        <Stat.Label>
          <HStack>
            <Icon as={FiAlertTriangle} color="red.500" />
            <Text>{t('backoffice.stats.slaBreached', 'SLA Breached')}</Text>
          </HStack>
        </Stat.Label>
        <Stat.ValueText>{stats?.slaBreached || 0}</Stat.ValueText>
      </Stat.Root>
    </SimpleGrid>
  );

  // --- DataTable columns ---
  const columns: DataTableColumn<ClientRequest>[] = [
    {
      key: 'requestNumber',
      label: t('backoffice.requests.reference', 'Reference'),
      render: (row) => (
        <VStack align="start" gap={0}>
          <Text fontWeight="medium">{row.requestNumber}</Text>
          {row.operationReference && (
            <Text fontSize="xs" color="green.600" fontWeight="medium">
              Op: {row.operationReference}
            </Text>
          )}
        </VStack>
      ),
    },
    {
      key: 'clientName',
      label: t('backoffice.requests.client', 'Client'),
      render: (row) => (
        <VStack align="start" gap={0}>
          <Text fontSize="sm">{row.clientName}</Text>
          <Text fontSize="xs" color="gray.500">{row.clientIdentification}</Text>
        </VStack>
      ),
    },
    {
      key: 'productType',
      label: t('backoffice.requests.product', 'Product'),
      filterType: 'select',
      filterOptions: [
        { value: 'LC_IMPORT_REQUEST', label: 'LC Import' },
        { value: 'LC_EXPORT_REQUEST', label: 'LC Export' },
        { value: 'GUARANTEE_REQUEST', label: 'Guarantee' },
        { value: 'COLLECTION_REQUEST', label: 'Collection' },
      ],
      render: (row) => (
        <Badge colorPalette="purple" size="sm">
          {productTypeLabels[row.productType] || row.productType}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: t('backoffice.requests.status', 'Status'),
      filterType: 'select',
      filterOptions: [
        { value: 'SUBMITTED', label: t('status.submitted', 'Submitted') },
        { value: 'IN_REVIEW', label: t('status.inReview', 'In Review') },
        { value: 'PENDING_DOCUMENTS', label: t('status.pendingDocuments', 'Pending Documents') },
        { value: 'APPROVED', label: t('status.approved', 'Approved') },
        { value: 'REJECTED', label: t('status.rejected', 'Rejected') },
      ],
      render: (row) => (
        <Badge colorPalette={statusColors[row.status] || 'gray'}>
          {row.statusLabel || row.status}
        </Badge>
      ),
    },
    {
      key: 'internalProcessingStage',
      label: t('backoffice.requests.internalStage', 'Etapa Interna'),
      filterType: 'select',
      filterOptions: [
        { value: 'RECEIVED', label: 'Recibido' },
        { value: 'COMPLIANCE', label: 'Cumplimiento' },
        { value: 'OPERATIONS', label: 'Operaciones' },
        { value: 'APPROVED', label: 'Aprobado' },
      ],
      render: (row) => (
        <Badge
          colorPalette={row.internalProcessingStageColor || 'gray'}
          size="sm"
        >
          {row.internalProcessingStageLabel || row.internalProcessingStage || 'No Iniciado'}
        </Badge>
      ),
    },
    {
      key: 'assignedToUserName',
      label: t('backoffice.requests.assignedTo', 'Assigned To'),
      render: (row) =>
        row.assignedToUserName || <Text color="gray.400" fontSize="sm">-</Text>,
    },
    {
      key: 'slaHours',
      label: t('backoffice.requests.sla', 'SLA'),
      sortable: false,
      filterable: false,
      render: (row) => renderSlaTimeline(row),
      minWidth: '120px',
    },
    {
      key: 'createdAt',
      label: t('backoffice.requests.created', 'Created'),
      hideOnMobile: true,
      render: (row) => (
        <Text fontSize="sm">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}
        </Text>
      ),
    },
  ];

  // --- DataTable actions ---
  const actions: DataTableAction<ClientRequest>[] = [
    {
      key: 'view',
      label: t('common.view', 'View'),
      icon: FiEye,
      colorPalette: 'blue',
      onClick: (row) => navigate(`/operations/client-requests/${row.id}`),
    },
    {
      key: 'assign',
      label: t('backoffice.requests.assign', 'Assign'),
      icon: FiUserCheck,
      colorPalette: 'green',
      onClick: (row) => handleAssign(row),
      isDisabled: () => actionLoading,
      isHidden: (row) => !(row.status === 'SUBMITTED' && !row.assignedToUserId),
    },
    {
      key: 'approve',
      label: t('backoffice.requests.approve', 'Approve'),
      icon: FiCheck,
      colorPalette: 'green',
      onClick: (row) => handleApprove(row),
      isDisabled: () => actionLoading,
      isHidden: (row) => !(row.status === 'IN_REVIEW' && String(row.assignedToUserId) === String(user?.id)),
    },
    {
      key: 'reject',
      label: t('backoffice.requests.reject', 'Reject'),
      icon: FiX,
      colorPalette: 'red',
      onClick: (row) => openRejectDialog(row),
      isDisabled: () => actionLoading,
      isHidden: (row) => !(row.status === 'IN_REVIEW' && String(row.assignedToUserId) === String(user?.id)),
    },
    {
      key: 'requestDocs',
      label: t('backoffice.requests.requestDocs', 'Request Documents'),
      icon: FiFileText,
      colorPalette: 'orange',
      onClick: (row) => openDocsDialog(row),
      isDisabled: () => actionLoading,
      isHidden: (row) => !(row.status === 'IN_REVIEW' && String(row.assignedToUserId) === String(user?.id)),
    },
  ];

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <Box>
          <Heading size="lg" color={colors.textColor}>
            {getTitle()}
          </Heading>
          <Text color={colors.textColor} opacity={0.7}>
            {t('backoffice.requests.subtitle', 'Process client portal requests')}
          </Text>
        </Box>

        {/* Stats */}
        {renderStats()}

        {/* DataTable */}
        <DataTable<ClientRequest>
          data={requests}
          columns={columns}
          rowKey={(row) => row.id}
          actions={actions}
          isLoading={loading}
          emptyMessage={t('backoffice.requests.noRequests', 'No requests found')}
          emptyIcon={FiInbox}
          pagination="server"
          serverPagination={{
            totalItems: totalElements,
            currentPage: page,
            pageSize,
            onPageChange: (p) => setPage(p),
            onPageSizeChange: (s) => setPageSize(s),
          }}
          defaultPageSize={20}
          pageSizeOptions={[10, 20, 50]}
          size="sm"
          toolbarRight={
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <HStack gap={2}>
                <FiRefreshCw />
                <Text>{t('common.refresh', 'Refresh')}</Text>
              </HStack>
            </Button>
          }
        />
      </VStack>

      {/* Reject Dialog */}
      <Dialog.Root open={showRejectDialog} onOpenChange={(e) => setShowRejectDialog(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('backoffice.requests.rejectTitle', 'Reject Request')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Field.Root>
                <Field.Label>{t('backoffice.requests.rejectReason', 'Rejection Reason')}</Field.Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('backoffice.requests.rejectPlaceholder', 'Enter the reason for rejection...')}
                  rows={4}
                />
              </Field.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                colorPalette="red"
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
              >
                {actionLoading ? <Spinner size="sm" /> : t('backoffice.requests.reject', 'Reject')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Request Documents Dialog */}
      <Dialog.Root open={showDocsDialog} onOpenChange={(e) => setShowDocsDialog(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('backoffice.requests.requestDocsTitle', 'Request Documents')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Field.Root>
                <Field.Label>{t('backoffice.requests.docsDetails', 'Document Details')}</Field.Label>
                <Textarea
                  value={docsDetails}
                  onChange={(e) => setDocsDetails(e.target.value)}
                  placeholder={t('backoffice.requests.docsPlaceholder', 'Describe the documents needed...')}
                  rows={4}
                />
              </Field.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setShowDocsDialog(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                colorPalette="orange"
                onClick={handleRequestDocs}
                disabled={!docsDetails.trim() || actionLoading}
              >
                {actionLoading ? <Spinner size="sm" /> : t('backoffice.requests.requestDocs', 'Request')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

export default ClientRequestsWorkbox;
