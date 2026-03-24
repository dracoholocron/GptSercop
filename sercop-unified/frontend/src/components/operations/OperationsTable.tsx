import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Badge,
  HStack,
  Text,
  Spinner,
} from '@chakra-ui/react';
import { toaster } from '../ui/toaster';
import {
  FiEye,
  FiMessageSquare,
  FiActivity,
  FiFileText,
  FiUserCheck,
  FiAlertCircle,
  FiClock,
  FiEdit2,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Operation, ProductType, OperationStage, OperationStatus } from '../../types/operations';
import { operationsApi } from '../../services/operationsApi';
import { pendingApprovalQueries } from '../../services/pendingApprovalService';
import { operationLockService, type OperationLock } from '../../services/operationLockService';
import { AlertBadge } from './AlertBadge';
import { OperationLockIndicator } from '../locks/OperationLockIndicator';
import { productTypeConfigService, type ProductTypeRoutingMap } from '../../services/productTypeConfigService';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/DataTable';

interface OperationsTableProps {
  productType?: ProductType;
  onViewDetails?: (operation: Operation) => void;
  onViewMessages?: (operation: Operation) => void;
  onViewEvents?: (operation: Operation) => void;
  onExecuteEvent?: (operation: Operation) => void;
}

export const OperationsTable = ({
  productType,
  onViewDetails,
  onViewMessages,
  onViewEvents,
  onExecuteEvent,
}: OperationsTableProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingApprovalOperationIds, setPendingApprovalOperationIds] = useState<Set<string>>(new Set());
  const [routingMap, setRoutingMap] = useState<ProductTypeRoutingMap>({});
  const [lockStatuses, setLockStatuses] = useState<Record<string, OperationLock>>({});

  useEffect(() => {
    loadOperations();
    loadPendingApprovalOperationIds();
    loadRoutingMap();
  }, [productType]);

  useEffect(() => {
    if (operations.length > 0) {
      loadLockStatuses();
      const interval = setInterval(loadLockStatuses, 30000);
      return () => clearInterval(interval);
    }
  }, [operations]);

  const loadLockStatuses = async () => {
    try {
      const operationIds = operations
        .slice(0, Math.min(operations.length, 100))
        .map(op => op.operationId);
      if (operationIds.length === 0) return;
      const statuses = await operationLockService.getBulkLockStatus(operationIds);
      setLockStatuses(statuses);
    } catch (error) {
      console.error('Error loading lock statuses:', error);
    }
  };

  const loadRoutingMap = async () => {
    try {
      const map = await productTypeConfigService.getRoutingMap();
      setRoutingMap(map);
    } catch (error) {
      console.error('Error loading routing map:', error);
    }
  };

  const loadPendingApprovalOperationIds = async () => {
    try {
      const ids = await pendingApprovalQueries.getPendingOperationIds();
      setPendingApprovalOperationIds(new Set(ids));
    } catch (error) {
      console.error('Error loading pending approval operation IDs:', error);
    }
  };

  const loadOperations = async () => {
    setLoading(true);
    try {
      const data = productType
        ? await operationsApi.getByProductType(productType)
        : await operationsApi.getOperations();
      setOperations(data);
    } catch (error) {
      toaster.create({
        title: t('common.error'),
        description: String(error),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter out CLOSED by default
  const visibleOperations = useMemo(() =>
    operations.filter((op) => op.status !== 'CLOSED'),
    [operations],
  );

  const getStageColor = (stage: OperationStage): string => {
    const stageColors: Record<OperationStage, string> = {
      ISSUED: 'blue', ADVISED: 'cyan', CONFIRMED: 'green', AMENDED: 'orange',
      UTILIZED: 'purple', CANCELLED: 'red', EXPIRED: 'gray', CLOSED: 'gray',
    };
    return stageColors[stage] || 'gray';
  };

  const getStatusColor = (status: OperationStatus): string => {
    const statusColors: Record<OperationStatus, string> = {
      ACTIVE: 'green', PENDING_RESPONSE: 'orange', PENDING_DOCUMENTS: 'yellow',
      ON_HOLD: 'gray', COMPLETED: 'blue', CANCELLED: 'red', CLOSED: 'gray',
    };
    return statusColors[status] || 'gray';
  };

  const formatAmount = (amount?: number, currency?: string): string => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
  };

  const formatDate = (date?: string): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const handleViewForm = (operation: Operation) => {
    const routing = routingMap[operation.productType];
    if (routing) {
      navigate(`${routing.wizardUrl}?operation=${operation.operationId}&mode=view`);
    } else {
      navigate(`/lc-imports/issuance-wizard?operation=${operation.operationId}&mode=view`);
    }
  };

  const handleEditFields = (operation: Operation) => {
    const routing = routingMap[operation.productType];
    if (routing) {
      navigate(`${routing.wizardUrl}?operation=${operation.operationId}&mode=edit-fields`);
    }
  };

  // Build unique filter options from data
  const stageOptions = useMemo(() => {
    const stages = new Set<string>();
    operations.forEach(op => stages.add(op.stage));
    return Array.from(stages).sort().map(s => ({
      value: s,
      label: t(`operations.stages.${s}`, s),
    }));
  }, [operations, t]);

  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    operations.forEach(op => statuses.add(op.status));
    return Array.from(statuses).sort().map(s => ({
      value: s,
      label: t(`operations.statuses.${s}`, s),
    }));
  }, [operations, t]);

  const currencyOptions = useMemo(() => {
    const currencies = new Set<string>();
    operations.forEach(op => { if (op.currency) currencies.add(op.currency); });
    return Array.from(currencies).sort().map(c => ({ value: c, label: c }));
  }, [operations]);

  // ─── Column definitions ────────────────────────────────────
  const columns: DataTableColumn<Operation>[] = [
    {
      key: 'reference',
      label: t('operations.reference', 'Referencia'),
      render: (row) => (
        <HStack>
          <Text fontWeight="medium" color={colors.textColor} fontSize="sm">
            {row.reference}
          </Text>
          <OperationLockIndicator lock={lockStatuses[row.operationId]} size="xs" />
          {row.hasAlerts && row.alertCount && row.alertCount > 0 && (
            <AlertBadge operationId={row.operationId} alertCount={row.alertCount} />
          )}
          {pendingApprovalOperationIds.has(row.operationId) && (
            <Badge colorPalette="yellow" size="sm" title={t('operations.pendingApproval', 'Pendiente de aprobación')}>
              <FiUserCheck style={{ marginRight: 4 }} />
              {t('operations.pendingApprovalShort', 'Aprobación')}
            </Badge>
          )}
          {row.awaitingResponse && (
            <Box color="orange.500" title={t('operations.awaitingResponse')}>
              <FiClock />
            </Box>
          )}
          {row.responseDueDate && new Date(row.responseDueDate) < new Date() && (
            <Box color="red.500" title={t('swiftMessages.overdueResponses')}>
              <FiAlertCircle />
            </Box>
          )}
        </HStack>
      ),
    },
    ...(!productType ? [{
      key: 'productType' as const,
      label: t('operations.productType', 'Producto'),
      filterType: 'select' as const,
      filterOptions: [
        { value: 'LC_IMPORT', label: t('operations.productTypes.LC_IMPORT', 'LC Import') },
        { value: 'LC_EXPORT', label: t('operations.productTypes.LC_EXPORT', 'LC Export') },
        { value: 'GUARANTEE', label: t('operations.productTypes.GUARANTEE', 'Guarantee') },
        { value: 'COLLECTION', label: t('operations.productTypes.COLLECTION', 'Collection') },
      ],
      render: (row: Operation) => (
        <Badge colorPalette="purple">
          {t(`operations.productTypes.${row.productType}`)}
        </Badge>
      ),
    }] : []),
    {
      key: 'messageType',
      label: t('operations.messageType', 'Tipo Mensaje'),
      hideOnMobile: true,
    },
    {
      key: 'stage',
      label: t('operations.stage', 'Etapa'),
      filterType: 'select',
      filterOptions: stageOptions,
      render: (row) => (
        <Badge colorPalette={getStageColor(row.stage)}>
          {t(`operations.stages.${row.stage}`)}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: t('operations.status', 'Estado'),
      filterType: 'select',
      filterOptions: statusOptions,
      render: (row) => (
        <Badge colorPalette={getStatusColor(row.status)}>
          {t(`operations.statuses.${row.status}`)}
        </Badge>
      ),
    },
    {
      key: 'amount',
      label: t('operations.amount', 'Monto'),
      align: 'right',
      hideOnMobile: true,
      render: (row) => <Text fontSize="sm">{formatAmount(row.amount, row.currency)}</Text>,
    },
    {
      key: 'pendingBalance',
      label: t('operations.pendingBalance', 'Saldo Pendiente'),
      align: 'right',
      hideOnMobile: true,
      render: (row) => <Text fontSize="sm">{formatAmount(row.pendingBalance, row.currency)}</Text>,
    },
    {
      key: 'expiryDate',
      label: t('operations.expiryDate', 'Vencimiento'),
      hideOnMobile: true,
      render: (row) => <Text fontSize="sm">{formatDate(row.expiryDate)}</Text>,
    },
    {
      key: 'applicantName',
      label: t('operations.applicant', 'Solicitante'),
      hideOnMobile: true,
      render: (row) => <Text fontSize="sm">{row.applicantName || '-'}</Text>,
    },
  ];

  // ─── Actions ───────────────────────────────────────────────
  const actions: DataTableAction<Operation>[] = [
    {
      key: 'viewForm',
      label: t('operations.viewForm', 'Ver Formulario'),
      icon: FiFileText,
      colorPalette: 'blue',
      onClick: (row) => handleViewForm(row),
    },
    {
      key: 'edit-fields',
      label: t('operations.editFields', 'Editar Campos'),
      icon: FiEdit2,
      colorPalette: 'orange',
      onClick: (row) => handleEditFields(row),
      isHidden: () => !isAdmin,
    },
    {
      key: 'viewDetails',
      label: t('operations.viewDetails', 'Ver Detalles'),
      icon: FiEye,
      onClick: (row) => onViewDetails?.(row),
    },
    {
      key: 'viewMessages',
      label: t('operations.viewMessages', 'Ver Mensajes'),
      icon: FiMessageSquare,
      onClick: (row) => onViewMessages?.(row),
    },
    {
      key: 'viewEvents',
      label: t('operations.viewEvents', 'Ver Eventos'),
      icon: FiActivity,
      onClick: (row) => onViewEvents?.(row),
    },
    {
      key: 'executeEvent',
      label: t('operations.executeEvent', 'Ejecutar Evento'),
      icon: FiActivity,
      onClick: (row) => onExecuteEvent?.(row),
      isDisabled: (row) => pendingApprovalOperationIds.has(row.operationId),
    },
  ];

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color={colors.primaryColor} />
        <Text mt={4} color={colors.textColor}>
          {t('common.loading')}
        </Text>
      </Box>
    );
  }

  return (
    <DataTable<Operation>
      data={visibleOperations}
      columns={columns}
      rowKey={(row) => row.id}
      actions={actions}
      isLoading={loading}
      emptyMessage={t('operations.noResults', 'No se encontraron operaciones')}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 50, 100]}
      defaultSort={{ field: 'reference', direction: 'asc' }}
      striped
    />
  );
};
