/**
 * ClientRequestDetail - Detail view for a client portal request
 * Shows all request information, form data, documents, and history
 * Uses custom fields configuration for proper field labels and organization
 * Workflow configuration is loaded dynamically from the database
 * Multi-language support via i18n translation keys
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Badge,
  Spinner,
  Center,
  Heading,
  SimpleGrid,
  Icon,
  Separator,
  Dialog,
  Field,
  Textarea,
  Input,
  Flex,
  Tabs,
  Timeline,
  Collapsible,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiX,
  FiFileText,
  FiUser,
  FiCalendar,
  FiClock,
  FiDownload,
  FiUserCheck,
  FiEye,
  FiInfo,
  FiTruck,
  FiPackage,
  FiUpload,
  FiCheckCircle,
  FiDollarSign,
  FiList,
  FiShield,
  FiActivity,
  FiSend,
  FiEdit,
  FiAlertTriangle,
  FiMessageSquare,
  FiPlay,
  FiCircle,
  FiClipboard,
  FiDatabase,
  FiCornerUpLeft,
  FiLoader,
  FiChevronDown,
  FiChevronRight,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { notify } from '../../components/ui/toaster';
import backofficeRequestService from '../../services/backofficeRequestService';
import type {
  WorkflowConfig,
  StatusFlowResponse,
  EventTypeConfig,
  EventFlowConfig,
  InternalProcessingConfig,
  InternalProcessingStatus,
  ValidationResultsResponse,
  ComplianceResultsResponse,
  RetryPreviewResponse,
} from '../../services/backofficeRequestService';
import type { ClientRequest } from '../../services/clientPortalTypes';
import type { DocumentInfo } from '../../services/clientPortalService';
import { useCustomFields } from '../../hooks/useCustomFields';
import { openDocumentWithAuth } from '../../utils/documentUtils';

// Icon mapping for steps and events
const iconMap: Record<string, IconType> = {
  FiInfo,
  FiUser,
  FiTruck,
  FiPackage,
  FiUpload,
  FiCheckCircle,
  FiFileText,
  FiDollarSign,
  FiList,
  FiShield,
  FiSend,
  FiEdit,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiActivity,
  FiMessageSquare,
  FiPlay,
  FiClipboard,
  FiDatabase,
  FiUserCheck,
  FiCornerUpLeft,
  FiLoader,
  // Common icon mappings from backend
  send: FiSend,
  edit: FiEdit,
  check: FiCheck,
  document: FiFileText,
  payment: FiDollarSign,
  close: FiCheckCircle,
  alert: FiAlertTriangle,
  message: FiMessageSquare,
  create: FiPlay,
  review: FiEye,
  docs: FiFileText,
  approve: FiCheck,
  reject: FiX,
  // Internal processing icons
  FiClipboardCheck: FiClipboard,
  FiShieldCheck: FiShield,
  FiBadgeCheck: FiCheckCircle,
  FiCalculator: FiDollarSign,
};

// Map backend product type to custom fields product type
const customFieldsProductTypeMap: Record<string, string> = {
  LC_IMPORT_REQUEST: 'CLIENT_LC_IMPORT_REQUEST',
  LC_EXPORT_REQUEST: 'CLIENT_LC_EXPORT_REQUEST',
  GUARANTEE_REQUEST: 'CLIENT_GUARANTEE_REQUEST',
  COLLECTION_REQUEST: 'CLIENT_COLLECTION_REQUEST',
};

// Default fallback colors - actual colors come from statusFlow.statusColors
const defaultStatusColors: Record<string, string> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  IN_REVIEW: 'orange',
  PENDING_DOCUMENTS: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
};

// Default fallback labels - actual labels come from backend
const defaultProductTypeLabels: Record<string, string> = {
  LC_IMPORT_REQUEST: 'Carta de Crédito de Importación',
  LC_EXPORT_REQUEST: 'Carta de Crédito de Exportación',
  GUARANTEE_REQUEST: 'Garantía Bancaria',
  COLLECTION_REQUEST: 'Cobranza Documentaria',
};

// Get icon component from name
const getIcon = (iconName?: string): IconType => {
  if (!iconName) return FiCircle;
  return iconMap[iconName] || iconMap[iconName.toLowerCase()] || FiCircle;
};

export const ClientRequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { getColors, isDark } = useTheme();
  const { user } = useAuth();
  const colors = getColors();

  const [request, setRequest] = useState<ClientRequest | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig | null>(null);
  const [statusFlow, setStatusFlow] = useState<StatusFlowResponse | null>(null);
  const [internalProcessingConfig, setInternalProcessingConfig] = useState<InternalProcessingConfig | null>(null);
  const [internalProcessingStatus, setInternalProcessingStatus] = useState<InternalProcessingStatus | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResultsResponse | null>(null);
  const [complianceResults, setComplianceResults] = useState<ComplianceResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [transitionComments, setTransitionComments] = useState('');

  // Dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDocsDialog, setShowDocsDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [docsDetails, setDocsDetails] = useState('');

  // Skip validation/compliance state
  const [skipTarget, setSkipTarget] = useState<{ type: 'validation' | 'compliance'; code: string; name: string } | null>(null);
  const [skipReason, setSkipReason] = useState('');

  // API call history dialog state
  const [historyTarget, setHistoryTarget] = useState<{ code: string; name: string } | null>(null);
  const [historyEntries, setHistoryEntries] = useState<import('../../services/backofficeRequestService').ApiCallLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Retry modal state
  const [retryTarget, setRetryTarget] = useState<{ type: 'validation' | 'compliance'; code: string; name: string } | null>(null);
  const [retryPreview, setRetryPreview] = useState<RetryPreviewResponse | null>(null);
  const [retryEditData, setRetryEditData] = useState<Record<string, string>>({});
  const [retryPreviewLoading, setRetryPreviewLoading] = useState(false);

  // Get product type for custom fields
  const customFieldsProductType = request?.productType
    ? customFieldsProductTypeMap[request.productType] || ''
    : '';

  // Load custom fields configuration
  const {
    configuration: customFieldsConfig,
    isLoading: loadingConfig,
  } = useCustomFields({
    productType: customFieldsProductType,
    mode: 'VIEW',
    autoLoad: !!customFieldsProductType,
  });

  useEffect(() => {
    const loadRequest = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Load request, documents, workflow config, status flow, internal processing, and API results in parallel
        const [requestData, docsData, workflowData, statusFlowData, internalConfig, internalStatus, validations, compliance] = await Promise.all([
          backofficeRequestService.getRequest(id),
          backofficeRequestService.getRequestDocuments(id),
          backofficeRequestService.getWorkflowConfig(id, i18n.language),
          backofficeRequestService.getStatusFlow(id),
          backofficeRequestService.getInternalProcessingConfig(id, i18n.language),
          backofficeRequestService.getInternalProcessingStatus(id, i18n.language),
          backofficeRequestService.getValidationResults(id),
          backofficeRequestService.getComplianceResults(id),
        ]);
        setRequest(requestData);
        setDocuments(docsData);
        setWorkflowConfig(workflowData);
        setStatusFlow(statusFlowData);
        setInternalProcessingConfig(internalConfig);
        setInternalProcessingStatus(internalStatus);
        setValidationResults(validations);
        setComplianceResults(compliance);
      } catch (error) {
        console.error('Error loading request:', error);
        notify.error(t('backoffice.requests.loadError', 'Error loading request'));
        navigate('/operations/client-requests');
      } finally {
        setLoading(false);
      }
    };

    loadRequest();
  }, [id, navigate, t, i18n.language]);

  const handleAssign = async () => {
    if (!request) return;
    try {
      setActionLoading(true);
      const updated = await backofficeRequestService.assignRequest(
        request.id,
        user?.id || '',
        user?.name || user?.username || ''
      );
      setRequest(updated);
      // Reload status flow and internal processing status (backend initializes workflow on assign)
      const [newStatusFlow, newInternalStatus] = await Promise.all([
        backofficeRequestService.getStatusFlow(request.id),
        backofficeRequestService.getInternalProcessingStatus(request.id, i18n.language),
      ]);
      setStatusFlow(newStatusFlow);
      setInternalProcessingStatus(newInternalStatus);
      notify.success(t('backoffice.requests.assigned', 'Request assigned successfully'));
    } catch (error) {
      notify.error(t('backoffice.requests.assignError', 'Error assigning request'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!request) return;
    try {
      setActionLoading(true);
      const updated = await backofficeRequestService.approveRequest(
        request.id,
        user?.id,
        user?.name || user?.username
      );
      setRequest(updated);
      // Reload status flow
      const newStatusFlow = await backofficeRequestService.getStatusFlow(request.id);
      setStatusFlow(newStatusFlow);
      notify.success(t('backoffice.requests.approved', 'Request approved successfully'));
    } catch (error) {
      notify.error(t('backoffice.requests.approveError', 'Error approving request'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!request || !rejectReason.trim()) return;
    try {
      setActionLoading(true);
      const updated = await backofficeRequestService.rejectRequest(
        request.id,
        rejectReason,
        user?.id,
        user?.name || user?.username
      );
      setRequest(updated);
      setShowRejectDialog(false);
      setRejectReason('');
      // Reload status flow
      const newStatusFlow = await backofficeRequestService.getStatusFlow(request.id);
      setStatusFlow(newStatusFlow);
      notify.success(t('backoffice.requests.rejected', 'Request rejected'));
    } catch (error) {
      notify.error(t('backoffice.requests.rejectError', 'Error rejecting request'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestDocs = async () => {
    if (!request || !docsDetails.trim()) return;
    try {
      setActionLoading(true);
      const updated = await backofficeRequestService.requestDocuments(request.id, docsDetails);
      setRequest(updated);
      setShowDocsDialog(false);
      setDocsDetails('');
      // Reload status flow
      const newStatusFlow = await backofficeRequestService.getStatusFlow(request.id);
      setStatusFlow(newStatusFlow);
      notify.success(t('backoffice.requests.docsRequested', 'Documents requested'));
    } catch (error) {
      notify.error(t('backoffice.requests.docsError', 'Error requesting documents'));
    } finally {
      setActionLoading(false);
    }
  };

  // View API call history for a check
  const handleViewHistory = async (code: string, name: string) => {
    if (!request) return;
    setHistoryTarget({ code, name });
    setHistoryLoading(true);
    try {
      const result = await backofficeRequestService.getApiCallHistory(request.id, code);
      if (result) {
        setHistoryEntries(result.entries);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Open retry modal with preview data
  const handleOpenRetryModal = async (type: 'validation' | 'compliance', code: string, name: string) => {
    if (!request) return;
    setRetryTarget({ type, code, name });
    setRetryPreviewLoading(true);
    setRetryPreview(null);
    setRetryEditData({});
    try {
      const preview = type === 'validation'
        ? await backofficeRequestService.getRetryPreview(request.id, code)
        : await backofficeRequestService.getComplianceRetryPreview(request.id, code);
      if (preview) {
        setRetryPreview(preview);
        // Initialize edit data from context data (convert all values to strings for input fields)
        const editData: Record<string, string> = {};
        for (const [key, value] of Object.entries(preview.contextData)) {
          editData[key] = value != null ? String(value) : '';
        }
        setRetryEditData(editData);
      }
    } catch {
      notify.error(t('workflow.retryPreviewError', 'Error al cargar datos de reintento'));
    } finally {
      setRetryPreviewLoading(false);
    }
  };

  // Execute retry with optional overrides from edited data
  const handleExecuteRetry = async () => {
    if (!request || !retryTarget) return;
    try {
      setActionLoading(true);

      // Build contextOverrides: only include fields that changed
      const contextOverrides: Record<string, unknown> = {};
      if (retryPreview) {
        for (const [key, editedValue] of Object.entries(retryEditData)) {
          const originalValue = retryPreview.contextData[key];
          const originalStr = originalValue != null ? String(originalValue) : '';
          if (editedValue !== originalStr) {
            contextOverrides[key] = editedValue;
          }
        }
      }

      const hasOverrides = Object.keys(contextOverrides).length > 0;

      if (retryTarget.type === 'validation') {
        const result = await backofficeRequestService.retryValidation(
          request.id, retryTarget.code, hasOverrides ? contextOverrides : undefined
        );
        if (result.success) {
          notify.success(t('workflow.retrySuccess', 'Validación reintentada'));
          const [newValidations, newStatus] = await Promise.all([
            backofficeRequestService.getValidationResults(request.id),
            backofficeRequestService.getInternalProcessingStatus(request.id, i18n.language),
          ]);
          if (newValidations) setValidationResults(newValidations);
          if (newStatus) setInternalProcessingStatus(newStatus);
        } else {
          notify.error(result.error || t('workflow.retryError', 'Error al reintentar'));
        }
      } else {
        const result = await backofficeRequestService.retryCompliance(
          request.id, retryTarget.code, hasOverrides ? contextOverrides : undefined
        );
        if (result.success) {
          notify.success(t('workflow.retrySuccess', 'Screening reintentado'));
          const [newCompliance, newStatus] = await Promise.all([
            backofficeRequestService.getComplianceResults(request.id),
            backofficeRequestService.getInternalProcessingStatus(request.id, i18n.language),
          ]);
          if (newCompliance) setComplianceResults(newCompliance);
          if (newStatus) setInternalProcessingStatus(newStatus);
        } else {
          notify.error(result.error || t('workflow.retryError', 'Error al reintentar'));
        }
      }

      // Close modal
      setRetryTarget(null);
      setRetryPreview(null);
      setRetryEditData({});
    } catch {
      notify.error(t('workflow.retryError', 'Error al reintentar'));
    } finally {
      setActionLoading(false);
    }
  };

  // Skip a validation or compliance check with documented reason
  const handleSkipConfirm = async () => {
    if (!request || !skipTarget || !skipReason.trim()) return;
    try {
      setActionLoading(true);
      const result = skipTarget.type === 'validation'
        ? await backofficeRequestService.skipValidation(request.id, skipTarget.code, skipReason, user?.id, user?.name)
        : await backofficeRequestService.skipCompliance(request.id, skipTarget.code, skipReason, user?.id, user?.name);

      if (result.success) {
        notify.success(t('workflow.skipSuccess', 'Verificación omitida con justificación'));
        const [newValidations, newCompliance, newStatus] = await Promise.all([
          backofficeRequestService.getValidationResults(request.id),
          backofficeRequestService.getComplianceResults(request.id),
          backofficeRequestService.getInternalProcessingStatus(request.id, i18n.language),
        ]);
        if (newValidations) setValidationResults(newValidations);
        if (newCompliance) setComplianceResults(newCompliance);
        if (newStatus) setInternalProcessingStatus(newStatus);
      } else {
        notify.error(result.error || t('workflow.skipError', 'Error al omitir verificación'));
      }
    } catch (error) {
      notify.error(t('workflow.skipError', 'Error al omitir verificación'));
    } finally {
      setActionLoading(false);
      setSkipTarget(null);
      setSkipReason('');
    }
  };

  const handleInternalProcessingTransition = async (eventCode: string) => {
    if (!request) return;
    try {
      setActionLoading(true);
      const result = await backofficeRequestService.executeInternalProcessingTransition(
        request.id,
        eventCode,
        transitionComments || undefined,
        user?.id,
        user?.name || user?.username
      );

      if (result.success && result.request) {
        setRequest(result.request);
        setTransitionComments('');
        // Reload internal processing status, API results
        const [newInternalStatus, newStatusFlow, newValidations, newCompliance] = await Promise.all([
          backofficeRequestService.getInternalProcessingStatus(request.id, i18n.language),
          backofficeRequestService.getStatusFlow(request.id),
          backofficeRequestService.getValidationResults(request.id),
          backofficeRequestService.getComplianceResults(request.id),
        ]);
        setInternalProcessingStatus(newInternalStatus);
        setStatusFlow(newStatusFlow);
        setValidationResults(newValidations);
        setComplianceResults(newCompliance);
        notify.success(t('backoffice.requests.transitionSuccess', 'Transición ejecutada con éxito'));
      } else {
        notify.error(result.error || t('backoffice.requests.transitionError', 'Error al ejecutar transición'));
      }
    } catch (error) {
      notify.error(t('backoffice.requests.transitionError', 'Error al ejecutar transición'));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle transition action from Available Transitions
  const handleTransitionAction = (action: string) => {
    switch (action) {
      case 'assign':
        handleAssign();
        break;
      case 'approve':
        handleApprove();
        break;
      case 'reject':
        setShowRejectDialog(true);
        break;
      case 'request_docs':
        setShowDocsDialog(true);
        break;
      case 'submit':
        // TODO: Implement submit action if needed
        notify.info(t('backoffice.requests.submitNotImplemented', 'Submit action not implemented from backoffice'));
        break;
      case 'cancel':
        // TODO: Implement cancel action
        notify.info(t('backoffice.requests.cancelNotImplemented', 'Cancel action not yet implemented'));
        break;
      case 'resume_review':
        // TODO: Implement resume review action
        notify.info(t('backoffice.requests.resumeReviewNotImplemented', 'Resume review action not yet implemented'));
        break;
      default:
        notify.warning(t('backoffice.requests.unknownAction', 'Unknown action: {{action}}', { action }));
    }
  };

  // Parse custom data (form data)
  const parseFormData = () => {
    if (!request?.customData) return null;
    try {
      const data = typeof request.customData === 'string'
        ? JSON.parse(request.customData)
        : request.customData;

      // Filter out document fields (they're shown separately via the document service)
      if (data && typeof data === 'object') {
        const filtered: Record<string, unknown> = {};
        Object.entries(data).forEach(([key, value]) => {
          // Skip fields that look like document uploads
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            const obj = value as Record<string, unknown>;
            if (obj.documentId || obj.downloadUrl) {
              return; // Skip document fields
            }
          }
          filtered[key] = value;
        });
        return filtered;
      }
      return data;
    } catch {
      return request.customData;
    }
  };

  // Format complex field values for display based on component type
  const formatFieldValue = (value: unknown, componentType?: string): { formatted: string; isComplex: boolean } => {
    if (value === undefined || value === null || value === '') {
      return { formatted: '', isComplex: false };
    }

    // Try to parse if it's a JSON string
    let parsedValue = value;
    if (typeof value === 'string') {
      try {
        parsedValue = JSON.parse(value);
      } catch {
        // Not JSON, use as-is
        return { formatted: String(value), isComplex: false };
      }
    }

    // Handle different component types
    if (typeof parsedValue === 'object' && parsedValue !== null) {
      const obj = parsedValue as Record<string, unknown>;

      // DOCUMENT/FILE UPLOAD: {documentId: "...", name: "file.pdf", downloadUrl: "..."}
      // Skip documents - they're shown in the Documents tab
      if ('documentId' in obj || ('name' in obj && 'downloadUrl' in obj)) {
        // Return formatted filename for display instead of JSON
        const fileName = obj.name as string || 'Documento adjunto';
        const fileSize = obj.size ? ` (${((obj.size as number) / 1024).toFixed(1)} KB)` : '';
        return { formatted: `📎 ${fileName}${fileSize}`, isComplex: true };
      }

      // CURRENCY_AMOUNT_INPUT: {currency: "USD", amount: "50000"}
      if ('currency' in obj && 'amount' in obj) {
        const amount = Number(obj.amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
        return { formatted: `${obj.currency} ${amount}`, isComplex: true };
      }

      // SWIFT_PARTY: {text: "LINE1\nLINE2\nLINE3\nLINE4", participantId: 6}
      if ('text' in obj && typeof obj.text === 'string') {
        const lines = (obj.text as string).split('\n').filter(l => l.trim());
        return { formatted: lines.join(' • '), isComplex: true };
      }

      // TOLERANCE_PERCENTAGE: {plus: "5", minus: "5"} or just a number
      if ('plus' in obj || 'minus' in obj) {
        const plus = obj.plus || '0';
        const minus = obj.minus || '0';
        return { formatted: `+${plus}% / -${minus}%`, isComplex: true };
      }

      // Generic object - stringify nicely
      return { formatted: JSON.stringify(obj), isComplex: true };
    }

    return { formatted: String(value), isComplex: false };
  };

  // Group flows by stage for workflow visualization
  const groupFlowsByStage = (flows: EventFlowConfig[]) => {
    const stages: Record<string, EventFlowConfig[]> = {};
    flows.forEach(flow => {
      const stage = flow.fromStage || 'INITIAL';
      if (!stages[stage]) {
        stages[stage] = [];
      }
      stages[stage].push(flow);
    });
    return stages;
  };

  if (loading) {
    return (
      <Center p={8}>
        <Spinner size="xl" color={colors.primaryColor} />
      </Center>
    );
  }

  if (!request) {
    return (
      <Center p={8}>
        <Text color={colors.textColor}>Request not found</Text>
      </Center>
    );
  }

  const formData = parseFormData();
  const isAssignedToMe = request.assignedToUserId === user?.id;
  // Only allow direct approve/reject if there's NO internal processing workflow configured
  // If internal processing exists, user must use the internal workflow transitions instead
  const hasInternalProcessing = internalProcessingConfig && internalProcessingConfig.steps.length > 0;
  const canProcess = request.status === 'IN_REVIEW' && isAssignedToMe && !hasInternalProcessing;
  const canAssign = request.status === 'SUBMITTED' && !request.assignedToUserId;

  // Get status color from backend configuration or fallback to default
  const getStatusColor = (status: string): string => {
    return statusFlow?.statusColors?.[status] || defaultStatusColors[status] || 'gray';
  };

  // Get product type label from backend or fallback
  const productTypeLabel = statusFlow?.productTypeLabel ||
    request.productTypeLabel ||
    defaultProductTypeLabels[request.productType] ||
    request.productType;

  // Calculate total documents from both sources (document service + formData)
  const formDataDocsCount = (() => {
    if (!formData || !customFieldsConfig) return 0;
    let count = 0;
    customFieldsConfig.steps.forEach(step => {
      step.sections.forEach(section => {
        if (section.sectionType === 'REPEATABLE') {
          const isDocumentsSection = section.fields.some(f => f.fieldType === 'FILE');
          if (isDocumentsSection) {
            const sectionKey = section.sectionCode.toLowerCase();
            const arrayData = formData[section.sectionCode] ||
                            formData[sectionKey] ||
                            formData[sectionKey.replace('_', '')] ||
                            [];
            const items = Array.isArray(arrayData) ? arrayData : [];
            items.forEach((item: Record<string, unknown>) => {
              const fileField = section.fields.find(f => f.fieldType === 'FILE');
              if (fileField) {
                const rawValue = item[fileField.fieldCode];
                let fileValue: { name?: string } | null = null;
                // Handle both object and stringified JSON
                if (typeof rawValue === 'object' && rawValue !== null) {
                  fileValue = rawValue as { name?: string };
                } else if (typeof rawValue === 'string' && rawValue.startsWith('{')) {
                  try {
                    fileValue = JSON.parse(rawValue);
                  } catch {
                    // Not valid JSON
                  }
                }
                if (fileValue?.name) count++;
              }
            });
          }
        }
      });
    });
    return count;
  })();
  const totalDocumentsCount = documents.length + formDataDocsCount;

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justify="space-between" flexWrap="wrap" gap={4}>
          <HStack>
            <Button variant="ghost" onClick={() => navigate('/operations/client-requests')}>
              <Icon as={FiArrowLeft} mr={2} />
              {t('common.back', 'Back')}
            </Button>
            <Heading size="lg" color={colors.textColor}>
              {request.requestNumber}
            </Heading>
            <Badge colorPalette={getStatusColor(request.status) || 'gray'} size="lg">
              {request.statusLabel || request.status}
            </Badge>
          </HStack>

          {/* Action buttons */}
          <HStack gap={2}>
            {canAssign && (
              <Button
                colorPalette="green"
                onClick={handleAssign}
                disabled={actionLoading}
              >
                <Icon as={FiUserCheck} mr={2} />
                {t('backoffice.requests.assignToMe', 'Assign to Me')}
              </Button>
            )}
            {canProcess && (
              <>
                <Button
                  colorPalette="green"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  <Icon as={FiCheck} mr={2} />
                  {t('backoffice.requests.approve', 'Approve')}
                </Button>
                <Button
                  colorPalette="red"
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={actionLoading}
                >
                  <Icon as={FiX} mr={2} />
                  {t('backoffice.requests.reject', 'Reject')}
                </Button>
                <Button
                  colorPalette="orange"
                  variant="outline"
                  onClick={() => setShowDocsDialog(true)}
                  disabled={actionLoading}
                >
                  <Icon as={FiFileText} mr={2} />
                  {t('backoffice.requests.requestDocs', 'Request Documents')}
                </Button>
              </>
            )}
          </HStack>
        </HStack>

        {/* Main info cards */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          {/* Request Info */}
          <Card.Root>
            <Card.Header>
              <Heading size="md">{t('backoffice.requests.requestInfo', 'Request Information')}</Heading>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={3}>
                <HStack justify="space-between">
                  <Text fontWeight="medium">{t('backoffice.requests.product', 'Product')}:</Text>
                  <Badge colorPalette="purple">
                    {productTypeLabel}
                  </Badge>
                </HStack>
                <Separator />
                <HStack justify="space-between">
                  <Text fontWeight="medium">{t('backoffice.requests.status', 'Status')}:</Text>
                  <Badge colorPalette={getStatusColor(request.status)}>
                    {request.statusLabel || request.status}
                  </Badge>
                </HStack>
                <Separator />
                <HStack justify="space-between">
                  <HStack>
                    <Icon as={FiCalendar} color="gray.500" />
                    <Text fontWeight="medium">{t('backoffice.requests.created', 'Created')}:</Text>
                  </HStack>
                  <Text>{request.createdAt ? new Date(request.createdAt).toLocaleString() : '-'}</Text>
                </HStack>
                <Separator />
                <HStack justify="space-between">
                  <HStack>
                    <Icon as={FiClock} color="gray.500" />
                    <Text fontWeight="medium">{t('backoffice.requests.updated', 'Updated')}:</Text>
                  </HStack>
                  <Text>{request.updatedAt ? new Date(request.updatedAt).toLocaleString() : '-'}</Text>
                </HStack>
                {request.assignedToUserName && (
                  <>
                    <Separator />
                    <HStack justify="space-between">
                      <HStack>
                        <Icon as={FiUserCheck} color="gray.500" />
                        <Text fontWeight="medium">{t('backoffice.requests.assignedTo', 'Assigned To')}:</Text>
                      </HStack>
                      <Text>{request.assignedToUserName}</Text>
                    </HStack>
                  </>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Client Info */}
          <Card.Root>
            <Card.Header>
              <Heading size="md">{t('backoffice.requests.clientInfo', 'Client Information')}</Heading>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={3}>
                <HStack justify="space-between">
                  <HStack>
                    <Icon as={FiUser} color="gray.500" />
                    <Text fontWeight="medium">{t('backoffice.requests.client', 'Client')}:</Text>
                  </HStack>
                  <Text>{request.clientName}</Text>
                </HStack>
                <Separator />
                <HStack justify="space-between">
                  <Text fontWeight="medium">{t('backoffice.requests.identification', 'Identification')}:</Text>
                  <Text>{request.clientIdentification}</Text>
                </HStack>
                <Separator />
                <HStack justify="space-between">
                  <Text fontWeight="medium">{t('backoffice.requests.clientId', 'Client ID')}:</Text>
                  <Text>{request.clientId}</Text>
                </HStack>
                {request.participantId && (
                  <>
                    <Separator />
                    <HStack justify="space-between">
                      <Text fontWeight="medium">{t('backoffice.requests.participantId', 'Participant ID')}:</Text>
                      <Text>{request.participantId}</Text>
                    </HStack>
                  </>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {/* Tabs for Form Data, Operation Flow, Documents */}
        <Card.Root>
          <Card.Body p={0}>
            <Tabs.Root defaultValue="form-data" variant="line">
              <Tabs.List px={4} pt={2}>
                <Tabs.Trigger value="form-data">
                  <Icon as={FiList} mr={2} />
                  {t('backoffice.requests.formData', 'Datos del Formulario')}
                </Tabs.Trigger>
                {(request.operationId || statusFlow?.operationId) && (
                  <Tabs.Trigger value="operation-flow">
                    <Icon as={FiActivity} mr={2} />
                    {t('backoffice.requests.operationFlow', 'Flujo de Operación')}
                  </Tabs.Trigger>
                )}
                <Tabs.Trigger value="internal-processing">
                  <Icon as={FiLoader} mr={2} />
                  {t('backoffice.requests.internalProcessing', 'Procesamiento Interno')}
                </Tabs.Trigger>
                <Tabs.Trigger value="documents">
                  <Icon as={FiFileText} mr={2} />
                  {t('backoffice.requests.documents', 'Documentos')} ({totalDocumentsCount})
                </Tabs.Trigger>
                {request.comments && (
                  <Tabs.Trigger value="history">
                    <Icon as={FiMessageSquare} mr={2} />
                    {t('backoffice.requests.history', 'Historial')}
                  </Tabs.Trigger>
                )}
              </Tabs.List>

              {/* Form Data Tab */}
              <Tabs.Content value="form-data" p={4}>
                {loadingConfig ? (
                  <Center p={8}>
                    <Spinner size="md" />
                  </Center>
                ) : customFieldsConfig && customFieldsConfig.steps.length > 0 ? (
                  <VStack align="stretch" gap={6}>
                    {customFieldsConfig.steps.map((step) => (
                      <Box key={step.id}>
                        <HStack mb={3}>
                          {step.icon && iconMap[step.icon] && (
                            <Icon as={iconMap[step.icon]} color={colors.primaryColor} />
                          )}
                          <Heading size="sm" color={colors.textColor}>
                            {t(step.stepNameKey, step.stepCode)}
                          </Heading>
                        </HStack>
                        {step.sections.map((section) => {
                          // Handle REPEATABLE sections (like Guarantors, Co-debtors, Documents)
                          if (section.sectionType === 'REPEATABLE') {
                            // Try to find array data using section code variations
                            const sectionKey = section.sectionCode.toLowerCase();
                            const arrayData = formData?.[section.sectionCode] ||
                                            formData?.[sectionKey] ||
                                            formData?.[sectionKey.replace('_', '')] ||
                                            [];
                            const items = Array.isArray(arrayData) ? arrayData : [];

                            // Check if this is a documents section (has FILE type fields)
                            const isDocumentsSection = section.fields.some(f => f.fieldType === 'FILE');

                            // For documents sections, render a special view
                            if (isDocumentsSection) {
                              return (
                                <Box key={section.id} mb={4} pl={4}>
                                  <HStack mb={2}>
                                    <Icon as={FiUpload} color={colors.primaryColor} />
                                    <Text fontWeight="medium" color="gray.600">
                                      {t(section.sectionNameKey, section.sectionCode)}
                                    </Text>
                                    <Badge colorPalette={items.length > 0 ? 'green' : 'orange'} size="sm">
                                      {items.length} {items.length === 1 ? 'documento' : 'documentos'}
                                    </Badge>
                                  </HStack>

                                  {items.length > 0 ? (
                                    <VStack align="stretch" gap={2}>
                                      {items.map((item: Record<string, unknown>, idx: number) => {
                                        // Find the file field and type field
                                        const fileField = section.fields.find(f => f.fieldType === 'FILE');
                                        const typeField = section.fields.find(f => f.fieldCode.includes('TYPE') || f.fieldCode.includes('TIPO'));

                                        let fileValue: { name?: string; downloadUrl?: string; previewUrl?: string } | null = null;
                                        if (fileField) {
                                          const rawValue = item[fileField.fieldCode];
                                          // Handle both object and stringified JSON
                                          if (typeof rawValue === 'object' && rawValue !== null) {
                                            fileValue = rawValue as typeof fileValue;
                                          } else if (typeof rawValue === 'string' && rawValue.startsWith('{')) {
                                            try {
                                              fileValue = JSON.parse(rawValue);
                                            } catch {
                                              // Not valid JSON
                                            }
                                          }
                                        }
                                        const typeValue = typeField ? String(item[typeField.fieldCode] || '') : '';

                                        // Map common document type codes to friendly labels
                                        const docTypeLabels: Record<string, string> = {
                                          'COMMERCIAL_INVOICE': t('backoffice.requests.docType.commercialInvoice', 'Commercial Invoice'),
                                          'BILL_OF_LADING': t('backoffice.requests.docType.billOfLading', 'Bill of Lading'),
                                          'PACKING_LIST': t('backoffice.requests.docType.packingList', 'Packing List'),
                                          'CERTIFICATE_OF_ORIGIN': t('backoffice.requests.docType.certificateOfOrigin', 'Certificate of Origin'),
                                          'INSURANCE_CERTIFICATE': t('backoffice.requests.docType.insuranceCertificate', 'Insurance Certificate'),
                                          'PROFORMA_INVOICE': t('backoffice.requests.docType.proformaInvoice', 'Proforma Invoice'),
                                          'PURCHASE_ORDER': t('backoffice.requests.docType.purchaseOrder', 'Purchase Order'),
                                          'CONTRACT': t('backoffice.requests.docType.contract', 'Contract'),
                                          'OTHER': t('backoffice.requests.docType.other', 'Other'),
                                        };
                                        const typeLabel = docTypeLabels[typeValue] || typeValue;

                                        if (!fileValue?.name) return null;

                                        return (
                                          <HStack
                                            key={idx}
                                            p={3}
                                            bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                                            borderRadius="md"
                                            borderLeft="3px solid"
                                            borderLeftColor="green.400"
                                            justify="space-between"
                                          >
                                            <HStack>
                                              <Icon as={FiCheckCircle} color="green.500" boxSize={5} />
                                              <VStack align="start" gap={0}>
                                                <Text fontWeight="medium" fontSize="sm">{fileValue.name}</Text>
                                                <Text fontSize="xs" color="gray.500">{typeLabel}</Text>
                                              </VStack>
                                            </HStack>
                                            <HStack gap={1}>
                                              {fileValue.previewUrl && (
                                                <Button
                                                  size="xs"
                                                  variant="ghost"
                                                  colorPalette="gray"
                                                  onClick={() => openDocumentWithAuth(fileValue.previewUrl!)}
                                                  title="Vista previa"
                                                >
                                                  <Icon as={FiEye} />
                                                </Button>
                                              )}
                                              {fileValue.downloadUrl && (
                                                <Button
                                                  size="xs"
                                                  variant="ghost"
                                                  colorPalette="blue"
                                                  onClick={() => openDocumentWithAuth(fileValue.downloadUrl!)}
                                                  title="Descargar"
                                                >
                                                  <Icon as={FiDownload} />
                                                </Button>
                                              )}
                                            </HStack>
                                          </HStack>
                                        );
                                      })}
                                    </VStack>
                                  ) : (
                                    <Box
                                      p={4}
                                      bg={isDark ? 'whiteAlpha.50' : 'orange.50'}
                                      borderRadius="md"
                                      borderLeft="3px solid"
                                      borderLeftColor="orange.400"
                                    >
                                      <HStack color="orange.600">
                                        <Icon as={FiAlertTriangle} />
                                        <Text fontSize="sm">
                                          {t('backoffice.requests.noDocumentsUploaded', 'No se han subido documentos en esta sección')}
                                        </Text>
                                      </HStack>
                                    </Box>
                                  )}
                                </Box>
                              );
                            }

                            // For non-document repeatable sections (Guarantors, Co-debtors, etc.)
                            return (
                              <Box key={section.id} mb={4} pl={4}>
                                <HStack mb={2}>
                                  <Text fontWeight="medium" color="gray.600">
                                    {t(section.sectionNameKey, section.sectionCode)}
                                  </Text>
                                  <Badge colorPalette={items.length > 0 ? 'green' : 'gray'} size="sm">
                                    {items.length} {items.length === 1 ? 'registro' : 'registros'}
                                  </Badge>
                                </HStack>

                                {items.length > 0 ? (
                                  <VStack align="stretch" gap={3}>
                                    {items.map((item: Record<string, unknown>, idx: number) => (
                                      <Box
                                        key={idx}
                                        p={3}
                                        bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                                        borderRadius="md"
                                        borderLeft="3px solid"
                                        borderLeftColor={colors.primaryColor}
                                      >
                                        <Text fontSize="xs" color="gray.400" mb={2}>
                                          #{idx + 1}
                                        </Text>
                                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={2}>
                                          {section.fields.map((field) => {
                                            const fieldValue = item[field.fieldCode];
                                            if (fieldValue === undefined || fieldValue === null || fieldValue === '') return null;

                                            // Skip object values (files should be handled by documents section)
                                            if (typeof fieldValue === 'object') return null;

                                            // Skip stringified document objects
                                            if (typeof fieldValue === 'string' && fieldValue.startsWith('{')) {
                                              try {
                                                const parsed = JSON.parse(fieldValue);
                                                if (parsed.documentId || (parsed.name && parsed.downloadUrl)) {
                                                  // This is a document - show filename nicely
                                                  const fileName = parsed.name || 'Documento';
                                                  const fileSize = parsed.size ? ` (${(parsed.size / 1024).toFixed(1)} KB)` : '';
                                                  return (
                                                    <Box key={field.id}>
                                                      <Text fontSize="xs" color="gray.500">
                                                        {t(field.fieldNameKey, field.fieldCode)}
                                                      </Text>
                                                      <Text fontWeight="medium" fontSize="sm" color="blue.600">
                                                        📎 {fileName}{fileSize}
                                                      </Text>
                                                    </Box>
                                                  );
                                                }
                                              } catch {
                                                // Not JSON, continue normal rendering
                                              }
                                            }

                                            return (
                                              <Box key={field.id}>
                                                <Text fontSize="xs" color="gray.500">
                                                  {t(field.fieldNameKey, field.fieldCode)}
                                                </Text>
                                                <Text fontWeight="medium" fontSize="sm">
                                                  {String(fieldValue)}
                                                </Text>
                                              </Box>
                                            );
                                          })}
                                        </SimpleGrid>
                                      </Box>
                                    ))}
                                  </VStack>
                                ) : (
                                  <Box
                                    p={4}
                                    bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                                    borderRadius="md"
                                    borderLeft="3px solid"
                                    borderLeftColor="gray.300"
                                  >
                                    <HStack color="gray.500">
                                      <Icon as={FiInfo} />
                                      <Text fontSize="sm">
                                        {t('backoffice.requests.noItemsRegistered', 'No se han registrado datos en esta sección')}
                                      </Text>
                                    </HStack>
                                  </Box>
                                )}
                              </Box>
                            );
                          }

                          // Handle SINGLE sections (regular fields)
                          return (
                            <Box key={section.id} mb={4} pl={4}>
                              <Text fontWeight="medium" mb={2} color="gray.600">
                                {t(section.sectionNameKey, section.sectionCode)}
                              </Text>
                              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3}>
                                {section.fields.map((field) => {
                                  const value = formData?.[field.fieldCode];
                                  if (value === undefined || value === null || value === '') return null;

                                  // Format the value based on component type
                                  const { formatted, isComplex } = formatFieldValue(value, field.componentType);
                                  if (!formatted) return null;

                                  return (
                                    <Box
                                      key={field.id}
                                      p={3}
                                      bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                                      borderRadius="md"
                                      borderLeft="3px solid"
                                      borderLeftColor={isComplex ? 'blue.400' : colors.primaryColor}
                                      gridColumn={isComplex ? { base: 'span 1', md: 'span 2' } : undefined}
                                    >
                                      <Text fontSize="xs" color="gray.500">
                                        {t(field.fieldNameKey, field.fieldCode)}
                                      </Text>
                                      <Text fontWeight="medium" mt={1}>
                                        {formatted}
                                      </Text>
                                    </Box>
                                  );
                                })}
                              </SimpleGrid>
                            </Box>
                          );
                        })}
                      </Box>
                    ))}
                  </VStack>
                ) : formData && Object.keys(formData).length > 0 ? (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                    {Object.entries(formData).map(([key, value]) => {
                      const { formatted, isComplex } = formatFieldValue(value);
                      if (!formatted) return null;

                      return (
                        <Box
                          key={key}
                          p={3}
                          bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                          borderRadius="md"
                          borderLeft={isComplex ? '3px solid' : undefined}
                          borderLeftColor={isComplex ? 'blue.400' : undefined}
                          gridColumn={isComplex ? { base: 'span 1', md: 'span 2' } : undefined}
                        >
                          <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                          </Text>
                          <Text fontWeight="medium" mt={1}>
                            {formatted}
                          </Text>
                        </Box>
                      );
                    })}
                  </SimpleGrid>
                ) : (
                  <Center p={8}>
                    <Text color="gray.500">{t('backoffice.requests.noFormData', 'No hay datos del formulario')}</Text>
                  </Center>
                )}
              </Tabs.Content>

              {/* Operation Flow Tab - Workflow configuration from database */}
              <Tabs.Content value="operation-flow" p={4}>
                {workflowConfig ? (
                  <VStack align="stretch" gap={6}>
                    {/* Operation Type Info */}
                    <Box textAlign="center" p={4} bg={isDark ? 'whiteAlpha.100' : 'purple.50'} borderRadius="lg">
                      <Text fontSize="sm" color="gray.500" mb={1}>Tipo de Operación</Text>
                      <Badge colorPalette="purple" size="lg" fontSize="md" px={4} py={2}>
                        {workflowConfig.operationType}
                      </Badge>
                    </Box>

                    {/* Workflow Flows Visualization */}
                    <Box>
                      <Heading size="sm" mb={4}>Flujo de Trabajo Configurado</Heading>

                      {/* Group by fromStage */}
                      {(() => {
                        const groupedFlows = groupFlowsByStage(workflowConfig.flows);
                        const stages = Object.keys(groupedFlows);

                        return (
                          <VStack align="stretch" gap={4}>
                            {stages.map((stage, stageIndex) => (
                              <Box
                                key={stage}
                                p={4}
                                bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                                borderRadius="md"
                              >
                                <HStack mb={3}>
                                  <Badge colorPalette={getStatusColor(stage) || 'gray'} size="md">
                                    {stage === 'INITIAL' ? 'Estado Inicial' : stage}
                                  </Badge>
                                </HStack>
                                <VStack align="stretch" gap={2}>
                                  {groupedFlows[stage].map((flow, flowIndex) => (
                                    <Flex
                                      key={flow.id}
                                      wrap="wrap"
                                      gap={2}
                                      align="center"
                                      p={2}
                                      bg={isDark ? 'whiteAlpha.100' : 'white'}
                                      borderRadius="md"
                                      borderLeft="3px solid"
                                      borderLeftColor={flow.toEventColor ? `${flow.toEventColor}.500` : 'gray.300'}
                                    >
                                      <Badge
                                        colorPalette={flow.toEventColor || 'blue'}
                                        p={2}
                                      >
                                        <HStack gap={1}>
                                          {flow.toEventIcon && (
                                            <Icon as={getIcon(flow.toEventIcon)} />
                                          )}
                                          <Text>{flow.toEventName || flow.toEventCode}</Text>
                                        </HStack>
                                      </Badge>
                                      <Icon as={FiArrowRight} color="gray.400" />
                                      {/* Find the resulting stage from event types */}
                                      {(() => {
                                        const eventType = workflowConfig.eventTypes.find(
                                          et => et.eventCode === flow.toEventCode
                                        );
                                        return eventType?.resultingStage ? (
                                          <Badge colorPalette={getStatusColor(eventType.resultingStage) || 'gray'} variant="outline">
                                            {eventType.resultingStage}
                                          </Badge>
                                        ) : null;
                                      })()}
                                      {flow.transitionLabel && (
                                        <Text fontSize="xs" color="gray.500" ml={2}>
                                          {flow.transitionLabel}
                                        </Text>
                                      )}
                                    </Flex>
                                  ))}
                                </VStack>
                              </Box>
                            ))}
                          </VStack>
                        );
                      })()}
                    </Box>

                    {/* Event Types Reference */}
                    <Box>
                      <Heading size="sm" mb={3}>Eventos Configurados ({workflowConfig.eventTypes.length})</Heading>
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3}>
                        {workflowConfig.eventTypes.map((eventType) => (
                          <Box
                            key={eventType.id}
                            p={3}
                            bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                            borderRadius="md"
                            borderLeft="3px solid"
                            borderLeftColor={eventType.color ? `${eventType.color}.500` : 'gray.300'}
                          >
                            <HStack mb={1}>
                              {eventType.icon && (
                                <Icon as={getIcon(eventType.icon)} color={eventType.color ? `${eventType.color}.500` : 'gray.500'} />
                              )}
                              <Text fontWeight="medium" fontSize="sm">
                                {eventType.eventName}
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="gray.500" mb={1}>
                              {eventType.eventCode}
                            </Text>
                            {eventType.eventDescription && (
                              <Text fontSize="xs" color="gray.400">
                                {eventType.eventDescription}
                              </Text>
                            )}
                            {eventType.resultingStage && (
                              <HStack mt={2} gap={1}>
                                <Icon as={FiArrowRight} color="gray.400" boxSize={3} />
                                <Badge size="sm" colorPalette={getStatusColor(eventType.resultingStage) || 'gray'}>
                                  {eventType.resultingStage}
                                </Badge>
                              </HStack>
                            )}
                          </Box>
                        ))}
                      </SimpleGrid>
                    </Box>
                  </VStack>
                ) : (
                  <Center p={8}>
                    <VStack>
                      <Text color="gray.500">No se encontró configuración de flujo de trabajo</Text>
                      <Text fontSize="sm" color="gray.400">
                        Producto: {request.productType}
                      </Text>
                    </VStack>
                  </Center>
                )}
              </Tabs.Content>

              {/* Internal Processing Tab */}
              <Tabs.Content value="internal-processing" p={4}>
                {internalProcessingConfig && internalProcessingStatus ? (
                  <VStack align="stretch" gap={6}>
                    {/* Help Card - Workflow Overview (Collapsible) */}
                    <Collapsible.Root>
                      <Box
                        bg={isDark ? 'linear-gradient(135deg, rgba(66, 153, 225, 0.15) 0%, rgba(128, 90, 213, 0.15) 100%)' : 'linear-gradient(135deg, rgba(66, 153, 225, 0.1) 0%, rgba(128, 90, 213, 0.1) 100%)'}
                        borderRadius="xl"
                        border="1px solid"
                        borderColor={isDark ? 'blue.700' : 'blue.200'}
                        position="relative"
                        overflow="hidden"
                      >
                        <Collapsible.Trigger asChild>
                          <Box cursor="pointer" p={4} _hover={{ opacity: 0.85 }} transition="opacity 0.2s">
                            <HStack justify="space-between">
                              <HStack gap={3}>
                                <Box
                                  p={2}
                                  borderRadius="lg"
                                  bg={isDark ? 'blue.900' : 'blue.100'}
                                  color={isDark ? 'blue.200' : 'blue.600'}
                                >
                                  <Icon as={FiInfo} boxSize={5} />
                                </Box>
                                <Text fontWeight="bold" fontSize="md" color={isDark ? 'blue.200' : 'blue.700'}>
                                  {t('workflow.help.title', 'Flujo de Procesamiento Interno')}
                                </Text>
                              </HStack>
                              <Collapsible.Indicator>
                                <Icon as={FiChevronDown} color={isDark ? 'blue.300' : 'blue.500'} />
                              </Collapsible.Indicator>
                            </HStack>
                          </Box>
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                          <Box px={4} pb={4}>
                            <Text fontSize="sm" color={isDark ? 'gray.300' : 'gray.600'} mb={3}>
                              {t('workflow.help.description', 'Esta solicitud pasa por 7 etapas de verificación antes de ser aprobada. Cada etapa tiene validaciones específicas y requiere la aprobación del personal autorizado.')}
                            </Text>
                            <HStack gap={4} flexWrap="wrap">
                              <HStack gap={1}>
                                <Box w={3} h={3} borderRadius="full" bg="green.500" />
                                <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>{t('workflow.legend.completed', 'Completado')}</Text>
                              </HStack>
                              <HStack gap={1}>
                                <Box w={3} h={3} borderRadius="full" bg="blue.500" border="2px solid" borderColor="blue.600" />
                                <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>{t('workflow.legend.current', 'Etapa Actual')}</Text>
                              </HStack>
                              <HStack gap={1}>
                                <Box w={3} h={3} borderRadius="full" bg="gray.200" />
                                <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>{t('workflow.legend.pending', 'Pendiente')}</Text>
                              </HStack>
                            </HStack>
                          </Box>
                        </Collapsible.Content>
                      </Box>
                    </Collapsible.Root>

                    {/* Progress Summary Bar */}
                    <HStack justify="space-between" px={1}>
                      <Heading size="sm">
                        {t('backoffice.requests.internalProcessingSteps', 'Pasos del Procesamiento Interno')}
                      </Heading>
                      <Badge colorPalette={internalProcessingStatus.isCompleted ? 'green' : internalProcessingStatus.isRejected ? 'red' : 'blue'} size="lg">
                        {Math.max(
                          internalProcessingStatus.history.length,
                          internalProcessingConfig.steps.findIndex(s => s.resultingStage === internalProcessingStatus.currentStage)
                        )} / {internalProcessingConfig.steps.length} {t('workflow.stepsCompleted', 'completados')}
                      </Badge>
                    </HStack>

                    {/* Step Cards - Collapsible */}
                    <VStack gap={2} align="stretch">
                      {internalProcessingConfig.steps.map((step, index) => {
                        const historyEntry = internalProcessingStatus.history.find(
                          h => h.eventCode === step.eventCode
                        );
                        // A step is completed if it has a history entry OR if the current stage is past this step
                        const currentStageIndex = internalProcessingConfig.steps.findIndex(
                          s => s.resultingStage === internalProcessingStatus.currentStage
                        );
                        const isCompleted = !!historyEntry || (currentStageIndex > index);
                        const isCurrent = internalProcessingStatus.currentStage === step.resultingStage;
                        const isPending = !isCompleted && !isCurrent;

                        let stepColor = 'gray';
                        if (isCompleted) stepColor = 'green';
                        else if (isCurrent) stepColor = 'blue';

                        const stageDescriptions: Record<string, string> = {
                          RECEPCION: t('workflow.stageHelp.RECEPCION', 'Verificación inicial de documentos y datos de la solicitud'),
                          VALIDACION: t('workflow.stageHelp.VALIDACION', 'Validación contra sistemas del banco: cliente, líneas de crédito, límites'),
                          COMPLIANCE: t('workflow.stageHelp.COMPLIANCE', 'Verificación de listas de control: OFAC, ONU, UAFE, PEPs'),
                          APROBACION: t('workflow.stageHelp.APROBACION', 'Aprobación multinivel según montos y políticas'),
                          COMISIONES: t('workflow.stageHelp.COMISIONES', 'Cálculo y registro de comisiones aplicables'),
                          REGISTRO: t('workflow.stageHelp.REGISTRO', 'Creación de la operación en el sistema'),
                          FINALIZADO: t('workflow.stageHelp.FINALIZADO', 'Proceso completado exitosamente'),
                        };

                        // Get stage-specific results
                        const stageValidations = step.resultingStage === 'VALIDACION' ? validationResults : null;
                        const stageCompliance = step.resultingStage === 'COMPLIANCE' ? complianceResults : null;

                        return (
                          <Collapsible.Root key={step.eventCode} defaultOpen={isCurrent}>
                            <Box
                              borderRadius="lg"
                              border="1px solid"
                              borderColor={isCurrent ? `${stepColor}.400` : isCompleted ? `${stepColor}.200` : isDark ? 'whiteAlpha.100' : 'gray.200'}
                              bg={isDark ? 'whiteAlpha.50' : 'white'}
                              boxShadow={isCurrent ? `0 0 12px ${stepColor === 'blue' ? 'rgba(66,153,225,0.25)' : 'rgba(72,187,120,0.25)'}` : 'none'}
                              overflow="hidden"
                              opacity={isPending ? 0.6 : 1}
                            >
                              {/* Card Header - Always Visible */}
                              <Collapsible.Trigger asChild>
                                <HStack
                                  px={4}
                                  py={3}
                                  cursor="pointer"
                                  _hover={{ bg: isDark ? 'whiteAlpha.100' : 'gray.50' }}
                                  transition="background 0.2s"
                                  gap={3}
                                >
                                  {/* Step number + icon */}
                                  <Box
                                    w={9}
                                    h={9}
                                    borderRadius="full"
                                    bg={`${stepColor}.${isCompleted || isCurrent ? '500' : isDark ? '800' : '100'}`}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    flexShrink={0}
                                    border={isCurrent ? '3px solid' : 'none'}
                                    borderColor={isCurrent ? `${stepColor}.300` : 'transparent'}
                                  >
                                    <Icon
                                      as={getIcon(step.icon)}
                                      color={isCompleted || isCurrent ? 'white' : `${stepColor}.400`}
                                      boxSize={4}
                                    />
                                  </Box>

                                  {/* Step info */}
                                  <VStack align="start" gap={0} flex={1}>
                                    <HStack gap={2}>
                                      <Text fontWeight="semibold" fontSize="sm">
                                        {index + 1}. {step.eventName}
                                      </Text>
                                      <Badge
                                        colorPalette={stepColor}
                                        size="sm"
                                      >
                                        {isCompleted ? t('workflow.status.completed', 'Completado') :
                                         isCurrent ? t('workflow.status.inProgress', 'En Proceso') :
                                         t('workflow.status.pending', 'Pendiente')}
                                      </Badge>
                                    </HStack>
                                    <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
                                      {stageDescriptions[step.resultingStage || ''] || step.eventDescription || ''}
                                    </Text>
                                  </VStack>

                                  {/* Right side: date + results summary */}
                                  <HStack gap={2} flexShrink={0}>
                                    {historyEntry && (
                                      <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
                                        {new Date(historyEntry.createdAt).toLocaleDateString()} {new Date(historyEntry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </Text>
                                    )}
                                    {stageValidations && (
                                      <Badge colorPalette={stageValidations.allPassed ? 'green' : stageValidations.failedCount > 0 ? 'red' : 'gray'} size="sm">
                                        {stageValidations.passedCount}/{stageValidations.totalCount}
                                      </Badge>
                                    )}
                                    {stageCompliance && (
                                      <Badge colorPalette={!stageCompliance.hasMatches ? 'green' : 'red'} size="sm">
                                        {stageCompliance.clearCount}/{stageCompliance.totalCount}
                                      </Badge>
                                    )}
                                    <Collapsible.Indicator>
                                      <Icon as={FiChevronDown} color={isDark ? 'gray.400' : 'gray.500'} />
                                    </Collapsible.Indicator>
                                  </HStack>
                                </HStack>
                              </Collapsible.Trigger>

                              {/* Card Body - Collapsible */}
                              <Collapsible.Content>
                                <Box px={4} pb={4} pt={1}>
                                  <Separator mb={3} />

                                  {/* Execution details */}
                                  {historyEntry && (
                                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={3} mb={3}>
                                      <Box p={2} bg={isDark ? 'whiteAlpha.50' : 'gray.50'} borderRadius="md">
                                        <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>{t('workflow.executedBy', 'Ejecutado por')}</Text>
                                        <Text fontSize="sm" fontWeight="medium">{historyEntry.executedByName || historyEntry.executedBy}</Text>
                                      </Box>
                                      <Box p={2} bg={isDark ? 'whiteAlpha.50' : 'gray.50'} borderRadius="md">
                                        <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>{t('workflow.executionDate', 'Fecha de ejecución')}</Text>
                                        <Text fontSize="sm" fontWeight="medium">{new Date(historyEntry.createdAt).toLocaleString()}</Text>
                                      </Box>
                                      {historyEntry.executionTimeMs && historyEntry.executionTimeMs > 0 && (
                                        <Box p={2} bg={isDark ? 'whiteAlpha.50' : 'gray.50'} borderRadius="md">
                                          <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>{t('workflow.duration', 'Duración en etapa')}</Text>
                                          <Text fontSize="sm" fontWeight="medium">{Math.round(historyEntry.executionTimeMs / 1000 / 60)} min</Text>
                                        </Box>
                                      )}
                                    </SimpleGrid>
                                  )}
                                  {historyEntry?.comments && (
                                    <Box p={2} mb={3} bg={isDark ? 'whiteAlpha.50' : 'yellow.50'} borderRadius="md" border="1px solid" borderColor={isDark ? 'whiteAlpha.100' : 'yellow.200'}>
                                      <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} mb={1}>{t('workflow.comments', 'Comentarios')}</Text>
                                      <Text fontSize="sm" fontStyle="italic">"{historyEntry.comments}"</Text>
                                    </Box>
                                  )}

                                  {/* Stage-specific: Validation Results */}
                                  {stageValidations && stageValidations.validations.length > 0 && (
                                    <VStack align="stretch" gap={2} mb={3}>
                                      <Text fontSize="xs" fontWeight="bold" color={isDark ? 'gray.300' : 'gray.600'} textTransform="uppercase">
                                        {t('workflow.apiResults.validations', 'Validaciones Core Banking')}
                                      </Text>
                                      {stageValidations.validations.map((validation, idx) => {
                                        const vPending = validation.status === 'PENDING';
                                        const vPassed = validation.status === 'PASSED';
                                        const vFailed = validation.status === 'FAILED';
                                        const vBg = isDark
                                          ? vPending ? 'gray.800' : vPassed ? 'green.900' : 'red.900'
                                          : vPending ? 'gray.50' : vPassed ? 'green.50' : 'red.50';
                                        const vBorder = vPending ? 'gray.300' : vPassed ? 'green.300' : 'red.300';
                                        const VIcon = vPending ? FiClock : vPassed ? FiCheck : FiX;

                                        return (
                                          <HStack key={idx} p={2} bg={vBg} borderRadius="md" border="1px solid" borderColor={vBorder} gap={2}>
                                            <Box p={1.5} borderRadius="full" bg={vPending ? 'gray.500' : vPassed ? 'green.500' : 'red.500'}>
                                              <Icon as={VIcon} color="white" boxSize={3} />
                                            </Box>
                                            <VStack align="start" flex={1} gap={0}>
                                              <Text fontSize="sm" fontWeight="medium">{validation.checkName}</Text>
                                              {validation.message && (
                                                <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>{validation.message}</Text>
                                              )}
                                            </VStack>
                                            <HStack gap={1} flexShrink={0}>
                                              {validation.executedAt && (
                                                <Text fontSize="xs" color="gray.500">
                                                  {new Date(validation.executedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                              )}
                                              {validation.executionTimeMs && (
                                                <Badge colorPalette="gray" size="sm">{validation.executionTimeMs}ms</Badge>
                                              )}
                                              <Badge colorPalette={vPending ? 'gray' : vPassed ? 'green' : 'red'} size="sm">
                                                {vPending ? t('workflow.status.pending', 'Pendiente') :
                                                 vPassed ? t('workflow.status.passed', 'Aprobado') :
                                                 t('workflow.status.failed', 'Fallido')}
                                              </Badge>
                                              {(vFailed || vPending) && (
                                                <Button
                                                  size="xs"
                                                  variant="ghost"
                                                  colorPalette="blue"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenRetryModal('validation', validation.checkCode, validation.checkName);
                                                  }}
                                                  disabled={actionLoading}
                                                  title={t('workflow.retry', 'Reintentar')}
                                                >
                                                  <Icon as={FiCornerUpLeft} boxSize={3} />
                                                </Button>
                                              )}
                                              {(vFailed || vPending) && (
                                                <Button
                                                  size="xs"
                                                  variant="ghost"
                                                  colorPalette="orange"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSkipTarget({ type: 'validation', code: validation.checkCode, name: validation.checkName });
                                                  }}
                                                  disabled={actionLoading}
                                                  title={t('workflow.skip', 'Saltar')}
                                                >
                                                  <Icon as={FiArrowRight} boxSize={3} />
                                                </Button>
                                              )}
                                              <Button
                                                size="xs"
                                                variant="ghost"
                                                colorPalette="gray"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleViewHistory(validation.checkCode, validation.checkName);
                                                }}
                                                title={t('workflow.viewHistory', 'Ver historial')}
                                              >
                                                <Icon as={FiClock} boxSize={3} />
                                              </Button>
                                            </HStack>
                                          </HStack>
                                        );
                                      })}
                                    </VStack>
                                  )}

                                  {/* Stage-specific: Compliance Results */}
                                  {stageCompliance && stageCompliance.screenings.length > 0 && (
                                    <VStack align="stretch" gap={2} mb={3}>
                                      <Text fontSize="xs" fontWeight="bold" color={isDark ? 'gray.300' : 'gray.600'} textTransform="uppercase">
                                        {t('workflow.apiResults.compliance', 'Screening de Compliance')}
                                      </Text>
                                      {stageCompliance.screenings.map((screening, idx) => {
                                        const sPending = screening.status === 'PENDING';
                                        const sClear = screening.status === 'CLEAR';
                                        const sMatch = screening.status === 'MATCH';
                                        const sError = screening.status === 'ERROR';
                                        const sBg = isDark
                                          ? sMatch ? 'red.900' : sClear ? 'green.900' : sError ? 'orange.900' : 'gray.800'
                                          : sMatch ? 'red.50' : sClear ? 'green.50' : sError ? 'orange.50' : 'gray.50';
                                        const sBorder = sMatch ? 'red.300' : sClear ? 'green.300' : sError ? 'orange.300' : 'gray.300';
                                        const SIcon = sMatch ? FiAlertTriangle : sClear ? FiCheck : sError ? FiX : FiClock;

                                        return (
                                          <HStack key={idx} p={2} bg={sBg} borderRadius="md" border="1px solid" borderColor={sBorder} gap={2}>
                                            <Box p={1.5} borderRadius="full" bg={sMatch ? 'red.500' : sClear ? 'green.500' : sError ? 'orange.500' : 'gray.500'}>
                                              <Icon as={SIcon} color="white" boxSize={3} />
                                            </Box>
                                            <VStack align="start" flex={1} gap={0}>
                                              <Text fontSize="sm" fontWeight="medium">{screening.screeningName}</Text>
                                              {screening.matchDetails && (
                                                <Text fontSize="xs" color="red.400">{screening.matchDetails}</Text>
                                              )}
                                            </VStack>
                                            <HStack gap={1} flexShrink={0}>
                                              {screening.executionTimeMs && (
                                                <Badge colorPalette="gray" size="sm">{screening.executionTimeMs}ms</Badge>
                                              )}
                                              <Badge colorPalette={sPending ? 'gray' : sClear ? 'green' : sMatch ? 'red' : 'orange'} size="sm">
                                                {sPending ? t('workflow.status.pending', 'Pendiente') :
                                                 sClear ? t('workflow.status.clear', 'Limpio') :
                                                 sMatch ? t('workflow.status.match', 'Coincidencia') :
                                                 t('workflow.status.error', 'Error')}
                                              </Badge>
                                              {!sClear && (
                                                <Button
                                                  size="xs"
                                                  variant="ghost"
                                                  colorPalette="blue"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenRetryModal('compliance', screening.screeningCode, screening.screeningName);
                                                  }}
                                                  disabled={actionLoading}
                                                  title={t('workflow.retry', 'Reintentar')}
                                                >
                                                  <Icon as={FiCornerUpLeft} boxSize={3} />
                                                </Button>
                                              )}
                                              {(sMatch || sError || sPending) && (
                                                <Button
                                                  size="xs"
                                                  variant="ghost"
                                                  colorPalette="orange"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSkipTarget({ type: 'compliance', code: screening.screeningCode, name: screening.screeningName });
                                                  }}
                                                  disabled={actionLoading}
                                                  title={t('workflow.skip', 'Saltar')}
                                                >
                                                  <Icon as={FiArrowRight} boxSize={3} />
                                                </Button>
                                              )}
                                              <Button
                                                size="xs"
                                                variant="ghost"
                                                colorPalette="gray"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleViewHistory(screening.screeningCode, screening.screeningName);
                                                }}
                                                title={t('workflow.viewHistory', 'Ver historial')}
                                              >
                                                <Icon as={FiClock} boxSize={3} />
                                              </Button>
                                            </HStack>
                                          </HStack>
                                        );
                                      })}
                                    </VStack>
                                  )}

                                  {/* Pending state message */}
                                  {isPending && !stageValidations && !stageCompliance && (
                                    <Text fontSize="sm" color="gray.400" fontStyle="italic">
                                      {t('workflow.pendingExecution', 'Pendiente de ejecución')}
                                    </Text>
                                  )}

                                  {/* Current stage with no history yet */}
                                  {isCurrent && !historyEntry && (
                                    <Text fontSize="sm" color="blue.400">
                                      {t('workflow.awaitingAction', 'Esperando acción del operador para completar esta etapa.')}
                                    </Text>
                                  )}
                                </Box>
                              </Collapsible.Content>
                            </Box>
                          </Collapsible.Root>
                        );
                      })}
                    </VStack>

                    {/* Current Stage Info - Enhanced */}
                    <Box
                      p={5}
                      bg={isDark
                        ? internalProcessingStatus.isCompleted ? 'green.900' : internalProcessingStatus.isRejected ? 'red.900' : 'blue.900'
                        : internalProcessingStatus.isCompleted ? 'green.50' : internalProcessingStatus.isRejected ? 'red.50' : 'blue.50'
                      }
                      borderRadius="xl"
                      border="2px solid"
                      borderColor={
                        internalProcessingStatus.isCompleted ? 'green.400' :
                        internalProcessingStatus.isRejected ? 'red.400' : 'blue.400'
                      }
                    >
                      <VStack gap={3}>
                        <HStack gap={4}>
                          <Box
                            p={3}
                            borderRadius="full"
                            bg={internalProcessingStatus.isCompleted ? 'green.500' : internalProcessingStatus.isRejected ? 'red.500' : 'blue.500'}
                          >
                            <Icon
                              as={internalProcessingStatus.isCompleted ? FiCheckCircle : internalProcessingStatus.isRejected ? FiX : FiLoader}
                              boxSize={8}
                              color="white"
                            />
                          </Box>
                          <VStack align="start" gap={0}>
                            <Text fontSize="sm" color={isDark ? 'gray.300' : 'gray.600'}>
                              {t('backoffice.requests.currentInternalStage', 'Etapa Actual del Procesamiento')}
                            </Text>
                            <Text fontSize="2xl" fontWeight="bold" color={internalProcessingStatus.isCompleted ? 'green.600' : internalProcessingStatus.isRejected ? 'red.600' : 'blue.600'}>
                              {internalProcessingStatus.currentStage || t('workflow.notStarted', 'No Iniciado')}
                            </Text>
                          </VStack>
                        </HStack>
                        {internalProcessingStatus.processingStartedAt && (
                          <HStack gap={2} color={isDark ? 'gray.400' : 'gray.500'}>
                            <Icon as={FiClock} />
                            <Text fontSize="sm">
                              {t('workflow.startedAt', 'Iniciado')}: {new Date(internalProcessingStatus.processingStartedAt).toLocaleString()}
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </Box>

                    {/* API Validation Results - Core Banking (Collapsible) */}
                    {(internalProcessingStatus.currentStage === 'VALIDACION' ||
                      internalProcessingStatus.history.some(h => h.toStage === 'VALIDACION') ||
                      validationResults) && (
                      <Collapsible.Root>
                      <Box
                        bg={isDark ? 'whiteAlpha.50' : 'white'}
                        borderRadius="xl"
                        border="1px solid"
                        borderColor={isDark ? 'whiteAlpha.200' : 'gray.200'}
                        overflow="hidden"
                      >
                        <Collapsible.Trigger asChild>
                        <Box
                          px={5}
                          py={3}
                          bg={isDark ? 'purple.900' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}
                          color="white"
                          cursor="pointer"
                          _hover={{ opacity: 0.9 }}
                          transition="opacity 0.2s"
                        >
                          <HStack justify="space-between">
                            <HStack gap={3}>
                              <Icon as={FiDatabase} boxSize={5} />
                              <Text fontWeight="bold" fontSize="lg">
                                {t('workflow.apiResults.validations', 'Validaciones Core Banking')}
                              </Text>
                            </HStack>
                            <HStack gap={2}>
                              {validationResults && (
                                <>
                                  <Badge colorPalette={validationResults.allPassed ? 'green' : 'red'} size="lg">
                                    {validationResults.passedCount}/{validationResults.totalCount}
                                  </Badge>
                                  {validationResults.allPassed && <Icon as={FiCheckCircle} color="green.300" />}
                                </>
                              )}
                              <Collapsible.Indicator>
                                <Icon as={FiChevronDown} />
                              </Collapsible.Indicator>
                            </HStack>
                          </HStack>
                        </Box>
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                        <Box p={4}>
                          {validationResults && validationResults.validations.length > 0 ? (
                            <VStack align="stretch" gap={3}>
                              <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.600'} mb={2}>
                                {t('workflow.apiResults.validationsHelp', 'Verificaciones automáticas contra sistemas del banco')}
                              </Text>
                              {/* Summary badges */}
                              <HStack gap={2} wrap="wrap" mb={2}>
                                {validationResults.pendingCount > 0 && (
                                  <Badge colorPalette="gray" size="md">
                                    <Icon as={FiClock} mr={1} /> {validationResults.pendingCount} {t('workflow.status.pending', 'pendientes')}
                                  </Badge>
                                )}
                                {validationResults.passedCount > 0 && (
                                  <Badge colorPalette="green" size="md">
                                    <Icon as={FiCheck} mr={1} /> {validationResults.passedCount} {t('workflow.status.passed', 'aprobados')}
                                  </Badge>
                                )}
                                {validationResults.failedCount > 0 && (
                                  <Badge colorPalette="red" size="md">
                                    <Icon as={FiX} mr={1} /> {validationResults.failedCount} {t('workflow.status.failed', 'fallidos')}
                                  </Badge>
                                )}
                              </HStack>
                              {validationResults.validations.map((validation, idx) => {
                                const isPending = validation.status === 'PENDING';
                                const isPassed = validation.status === 'PASSED';
                                const isFailed = validation.status === 'FAILED';

                                const bgColor = isDark
                                  ? isPending ? 'gray.800' : isPassed ? 'green.900' : 'red.900'
                                  : isPending ? 'gray.50' : isPassed ? 'green.50' : 'red.50';
                                const borderColor = isPending ? 'gray.400' : isPassed ? 'green.300' : 'red.300';
                                const iconBg = isPending ? 'gray.500' : isPassed ? 'green.500' : 'red.500';
                                const StatusIcon = isPending ? FiClock : isPassed ? FiCheck : FiX;

                                return (
                                  <HStack
                                    key={idx}
                                    p={3}
                                    bg={bgColor}
                                    borderRadius="lg"
                                    border="1px solid"
                                    borderColor={borderColor}
                                  >
                                    <Box p={2} borderRadius="full" bg={iconBg}>
                                      <Icon as={StatusIcon} color="white" boxSize={4} />
                                    </Box>
                                    <VStack align="start" flex={1} gap={0}>
                                      <Text fontWeight="medium" fontSize="sm">
                                        {validation.checkName}
                                      </Text>
                                      {validation.message && (
                                        <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
                                          {validation.message}
                                        </Text>
                                      )}
                                    </VStack>
                                    <HStack gap={2}>
                                      {validation.executionTimeMs && (
                                        <Badge colorPalette="gray" size="sm">
                                          {validation.executionTimeMs}ms
                                        </Badge>
                                      )}
                                      <Badge
                                        colorPalette={isPending ? 'gray' : isPassed ? 'green' : 'red'}
                                        size="sm"
                                      >
                                        {isPending ? t('workflow.status.pending', 'Pendiente') :
                                         isPassed ? t('workflow.status.passed', 'Aprobado') :
                                         t('workflow.status.failed', 'Fallido')}
                                      </Badge>
                                    </HStack>
                                  </HStack>
                                );
                              })}
                            </VStack>
                          ) : (
                            <Center py={6}>
                              <VStack gap={2}>
                                <Icon as={FiInfo} boxSize={8} color="gray.400" />
                                <Text color="gray.500">{t('workflow.apiResults.noValidationsConfigured', 'No hay validaciones configuradas')}</Text>
                                <Text fontSize="sm" color="gray.400">
                                  {t('workflow.apiResults.noValidationsHelp', 'Las validaciones se configuran en las reglas de eventos')}
                                </Text>
                              </VStack>
                            </Center>
                          )}
                        </Box>
                        </Collapsible.Content>
                      </Box>
                      </Collapsible.Root>
                    )}

                    {/* API Compliance/Screening Results (Collapsible) */}
                    {(internalProcessingStatus.currentStage === 'COMPLIANCE' ||
                      internalProcessingStatus.history.some(h => h.toStage === 'COMPLIANCE') ||
                      complianceResults) && (
                      <Collapsible.Root>
                      <Box
                        bg={isDark ? 'whiteAlpha.50' : 'white'}
                        borderRadius="xl"
                        border="1px solid"
                        borderColor={isDark ? 'whiteAlpha.200' : 'gray.200'}
                        overflow="hidden"
                      >
                        <Collapsible.Trigger asChild>
                        <Box
                          px={5}
                          py={3}
                          bg={isDark ? 'teal.900' : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'}
                          color="white"
                          cursor="pointer"
                          _hover={{ opacity: 0.9 }}
                          transition="opacity 0.2s"
                        >
                          <HStack justify="space-between">
                            <HStack gap={3}>
                              <Icon as={FiShield} boxSize={5} />
                              <Text fontWeight="bold" fontSize="lg">
                                {t('workflow.apiResults.compliance', 'Screening de Compliance')}
                              </Text>
                            </HStack>
                            <HStack gap={2}>
                              {complianceResults && (
                                <>
                                  <Badge
                                    colorPalette={
                                      complianceResults.hasMatches ? 'red' :
                                      complianceResults.overallRiskLevel === 'LOW' ? 'green' :
                                      complianceResults.overallRiskLevel === 'MEDIUM' ? 'yellow' : 'red'
                                    }
                                    size="lg"
                                  >
                                    {complianceResults.completedCount}/{complianceResults.totalCount}
                                  </Badge>
                                  {!complianceResults.hasMatches && complianceResults.completedCount === complianceResults.totalCount && (
                                    <Icon as={FiCheckCircle} color="green.300" />
                                  )}
                                </>
                              )}
                              <Collapsible.Indicator>
                                <Icon as={FiChevronDown} />
                              </Collapsible.Indicator>
                            </HStack>
                          </HStack>
                        </Box>
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                        <Box p={4}>
                          {complianceResults && complianceResults.screenings.length > 0 ? (
                            <VStack align="stretch" gap={3}>
                              <HStack justify="space-between" mb={2}>
                                <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.600'}>
                                  {t('workflow.apiResults.complianceHelp', 'Verificación contra listas internacionales de control')}
                                </Text>
                                <HStack gap={2}>
                                  {complianceResults.pendingCount > 0 && (
                                    <Badge colorPalette="gray" size="sm">
                                      <Icon as={FiClock} mr={1} /> {complianceResults.pendingCount}
                                    </Badge>
                                  )}
                                  {complianceResults.clearCount > 0 && (
                                    <Badge colorPalette="green" size="sm">
                                      <Icon as={FiCheck} mr={1} /> {complianceResults.clearCount}
                                    </Badge>
                                  )}
                                  {complianceResults.matchCount > 0 && (
                                    <Badge colorPalette="red" size="sm">
                                      <Icon as={FiAlertTriangle} mr={1} /> {complianceResults.matchCount}
                                    </Badge>
                                  )}
                                  <Badge
                                    colorPalette={
                                      complianceResults.overallRiskLevel === 'LOW' ? 'green' :
                                      complianceResults.overallRiskLevel === 'MEDIUM' ? 'yellow' : 'red'
                                    }
                                    size="lg"
                                  >
                                    {t('workflow.apiResults.riskLevel', 'Riesgo')}: {complianceResults.overallRiskLevel}
                                  </Badge>
                                </HStack>
                              </HStack>
                              <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                                {complianceResults.screenings.map((screening, idx) => {
                                  const isPending = screening.status === 'PENDING';
                                  const isClear = screening.status === 'CLEAR';
                                  const isMatch = screening.status === 'MATCH';
                                  const isError = screening.status === 'ERROR';

                                  const bgColor = isDark
                                    ? isMatch ? 'red.900' : isClear ? 'green.900' : isError ? 'orange.900' : 'gray.800'
                                    : isMatch ? 'red.50' : isClear ? 'green.50' : isError ? 'orange.50' : 'gray.50';
                                  const borderColor = isMatch ? 'red.400' : isClear ? 'green.300' : isError ? 'orange.400' : 'gray.300';
                                  const StatusIcon = isMatch ? FiAlertTriangle : isClear ? FiCheck : isError ? FiX : FiClock;
                                  const iconColor = isMatch ? 'red.500' : isClear ? 'green.500' : isError ? 'orange.500' : 'gray.400';

                                  return (
                                    <Box
                                      key={idx}
                                      p={3}
                                      bg={bgColor}
                                      borderRadius="lg"
                                      border="1px solid"
                                      borderColor={borderColor}
                                    >
                                      <HStack justify="space-between" mb={2}>
                                        <HStack gap={2}>
                                          <Icon as={StatusIcon} color={iconColor} />
                                          <Text fontWeight="medium" fontSize="sm">
                                            {screening.screeningName}
                                          </Text>
                                        </HStack>
                                        <HStack gap={1}>
                                          <Badge
                                            colorPalette={isPending ? 'gray' : isClear ? 'green' : isMatch ? 'red' : 'orange'}
                                            size="sm"
                                          >
                                            {isPending ? t('workflow.status.pending', 'Pendiente') :
                                             isClear ? t('workflow.status.clear', 'Limpio') :
                                             isMatch ? t('workflow.status.match', 'Coincidencia') :
                                             t('workflow.status.error', 'Error')}
                                          </Badge>
                                          {!isPending && (
                                            <Badge
                                              colorPalette={
                                                screening.riskLevel === 'LOW' ? 'green' :
                                                screening.riskLevel === 'MEDIUM' ? 'yellow' : 'red'
                                              }
                                              size="sm"
                                            >
                                              {screening.riskLevel}
                                            </Badge>
                                          )}
                                        </HStack>
                                      </HStack>
                                      {screening.hasMatch && screening.matchDetails && (
                                        <Box
                                          mt={2}
                                          p={2}
                                          bg={isDark ? 'red.800' : 'red.100'}
                                          borderRadius="md"
                                        >
                                          <Text fontSize="xs" color={isDark ? 'red.200' : 'red.700'}>
                                            {screening.matchDetails}
                                          </Text>
                                        </Box>
                                      )}
                                      {screening.executionTimeMs && (
                                        <Text fontSize="xs" color="gray.500" mt={1}>
                                          {screening.executionTimeMs}ms
                                        </Text>
                                      )}
                                    </Box>
                                  );
                                })}
                              </SimpleGrid>
                            </VStack>
                          ) : (
                            <Center py={6}>
                              <VStack gap={2}>
                                <Icon as={FiInfo} boxSize={8} color="gray.400" />
                                <Text color="gray.500">{t('workflow.apiResults.noComplianceConfigured', 'No hay screenings configurados')}</Text>
                                <Text fontSize="sm" color="gray.400">
                                  {t('workflow.apiResults.noComplianceHelp', 'Los screenings se configuran en las reglas de eventos')}
                                </Text>
                              </VStack>
                            </Center>
                          )}
                        </Box>
                        </Collapsible.Content>
                      </Box>
                      </Collapsible.Root>
                    )}

                    {/* Available Transitions - Enhanced */}
                    {internalProcessingStatus.availableTransitions.length > 0 && !internalProcessingStatus.isCompleted && !internalProcessingStatus.isRejected && (
                      <Box
                        p={5}
                        bg={isDark ? 'whiteAlpha.50' : 'white'}
                        borderRadius="xl"
                        border="2px solid"
                        borderColor={isDark ? 'green.700' : 'green.300'}
                        boxShadow={isDark ? 'none' : 'lg'}
                      >
                        <VStack align="stretch" gap={4}>
                          <HStack>
                            <Box p={2} borderRadius="lg" bg={isDark ? 'green.900' : 'green.100'}>
                              <Icon as={FiPlay} color={isDark ? 'green.300' : 'green.600'} boxSize={5} />
                            </Box>
                            <VStack align="start" gap={0}>
                              <Heading size="sm">
                                {t('backoffice.requests.availableInternalActions', 'Acciones Disponibles')}
                              </Heading>
                              <Text fontSize="xs" color="gray.500">
                                {t('workflow.actionsHelp', 'Seleccione la siguiente acción para continuar el procesamiento')}
                              </Text>
                            </VStack>
                          </HStack>

                          <Field.Root>
                            <Field.Label fontSize="sm">{t('workflow.comments', 'Comentarios')} ({t('common.optional', 'opcional')})</Field.Label>
                            <Textarea
                              value={transitionComments}
                              onChange={(e) => setTransitionComments(e.target.value)}
                              placeholder={t('workflow.commentsPlaceholder', 'Agregar comentarios sobre esta transición...')}
                              size="sm"
                              rows={2}
                              bg={isDark ? 'whiteAlpha.100' : 'gray.50'}
                            />
                          </Field.Root>

                          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                            {internalProcessingStatus.availableTransitions.map((transition, index) => {
                              const isForward = !['DEVUELTO', 'RECHAZADO'].includes(transition.targetStage);
                              return (
                                <Button
                                  key={index}
                                  colorPalette={transition.color || (isForward ? 'green' : 'red')}
                                  variant={isForward ? 'solid' : 'outline'}
                                  size="lg"
                                  h="auto"
                                  py={4}
                                  disabled={actionLoading}
                                  onClick={() => handleInternalProcessingTransition(transition.eventCode)}
                                  justifyContent="start"
                                >
                                  <HStack gap={3} w="full">
                                    <Box
                                      p={2}
                                      borderRadius="lg"
                                      bg={isForward ? 'whiteAlpha.200' : 'transparent'}
                                    >
                                      {transition.icon && <Icon as={getIcon(transition.icon)} boxSize={5} />}
                                    </Box>
                                    <VStack align="start" gap={0} flex={1}>
                                      <Text fontWeight="bold">{transition.label}</Text>
                                      <HStack gap={1}>
                                        <Text fontSize="xs" opacity={0.8}>
                                          {t('workflow.goTo', 'Ir a')}:
                                        </Text>
                                        <Badge colorPalette={transition.color || 'gray'} size="sm">
                                          {transition.targetStage}
                                        </Badge>
                                      </HStack>
                                    </VStack>
                                    <Icon as={FiArrowRight} />
                                  </HStack>
                                </Button>
                              );
                            })}
                          </SimpleGrid>
                        </VStack>
                      </Box>
                    )}

                    {/* Processing History (Collapsible) */}
                    {internalProcessingStatus.history.length > 0 && (
                      <Collapsible.Root>
                      <Box
                        bg={isDark ? 'whiteAlpha.50' : 'white'}
                        borderRadius="xl"
                        border="1px solid"
                        borderColor={isDark ? 'whiteAlpha.200' : 'gray.200'}
                        overflow="hidden"
                      >
                        <Collapsible.Trigger asChild>
                          <Box
                            px={5}
                            py={3}
                            cursor="pointer"
                            _hover={{ bg: isDark ? 'whiteAlpha.100' : 'gray.50' }}
                            transition="background 0.2s"
                          >
                            <HStack justify="space-between">
                              <HStack gap={3}>
                                <Icon as={FiClock} boxSize={5} color={isDark ? 'gray.300' : 'gray.600'} />
                                <Heading size="sm">
                                  {t('backoffice.requests.internalProcessingHistory', 'Historial de Procesamiento')}
                                </Heading>
                              </HStack>
                              <HStack gap={2}>
                                <Badge colorPalette="gray" size="md">
                                  {internalProcessingStatus.history.length} {t('common.entries', 'registros')}
                                </Badge>
                                <Collapsible.Indicator>
                                  <Icon as={FiChevronDown} />
                                </Collapsible.Indicator>
                              </HStack>
                            </HStack>
                          </Box>
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                        <Box px={5} pb={4}>
                        <VStack align="stretch" gap={0}>
                          {internalProcessingStatus.history.map((entry, index) => (
                            <HStack key={entry.id || index} align="start" gap={4} pb={4}>
                              <Box position="relative">
                                <Box
                                  w={10}
                                  h={10}
                                  borderRadius="full"
                                  bg={entry.color ? `${entry.color}.100` : 'blue.100'}
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                >
                                  <Icon
                                    as={getIcon(entry.icon)}
                                    color={entry.color ? `${entry.color}.600` : 'blue.600'}
                                    boxSize={5}
                                  />
                                </Box>
                                {index < internalProcessingStatus.history.length - 1 && (
                                  <Box
                                    position="absolute"
                                    left="50%"
                                    top={10}
                                    bottom={-4}
                                    w="2px"
                                    bg="gray.200"
                                    transform="translateX(-50%)"
                                  />
                                )}
                              </Box>
                              <Box flex={1} pb={4}>
                                <HStack justify="space-between" mb={1}>
                                  <Text fontWeight="medium">{entry.eventName || entry.eventCode}</Text>
                                  <HStack gap={2}>
                                    {entry.fromStage && (
                                      <>
                                        <Badge colorPalette="gray" size="sm">{entry.fromStage}</Badge>
                                        <Icon as={FiArrowRight} color="gray.400" boxSize={3} />
                                      </>
                                    )}
                                    <Badge colorPalette={entry.color || 'blue'} size="sm">
                                      {entry.toStage}
                                    </Badge>
                                  </HStack>
                                </HStack>
                                {entry.eventDescription && (
                                  <Text fontSize="sm" color="gray.500" mb={1}>
                                    {entry.eventDescription}
                                  </Text>
                                )}
                                <Text fontSize="sm" color="gray.500">
                                  {new Date(entry.createdAt).toLocaleString()}
                                </Text>
                                {entry.executedByName && (
                                  <Text fontSize="sm" color="gray.400">
                                    Por: {entry.executedByName}
                                  </Text>
                                )}
                                {entry.comments && (
                                  <Box mt={2} p={2} bg={isDark ? 'whiteAlpha.50' : 'gray.50'} borderRadius="md">
                                    <Text fontSize="sm" fontStyle="italic">
                                      "{entry.comments}"
                                    </Text>
                                  </Box>
                                )}
                                {entry.executionTimeMs && entry.executionTimeMs > 0 && (
                                  <Text fontSize="xs" color="gray.400" mt={1}>
                                    Tiempo en etapa anterior: {Math.round(entry.executionTimeMs / 1000 / 60)} min
                                  </Text>
                                )}
                              </Box>
                            </HStack>
                          ))}
                        </VStack>
                        </Box>
                        </Collapsible.Content>
                      </Box>
                      </Collapsible.Root>
                    )}

                    {/* Completion/Rejection Status */}
                    {(internalProcessingStatus.isCompleted || internalProcessingStatus.isRejected) && (
                      <Box
                        p={4}
                        bg={internalProcessingStatus.isCompleted ? (isDark ? 'green.900' : 'green.50') : (isDark ? 'red.900' : 'red.50')}
                        borderRadius="md"
                        textAlign="center"
                      >
                        <Icon
                          as={internalProcessingStatus.isCompleted ? FiCheckCircle : FiX}
                          boxSize={8}
                          color={internalProcessingStatus.isCompleted ? 'green.500' : 'red.500'}
                          mb={2}
                        />
                        <Text fontWeight="bold" fontSize="lg">
                          {internalProcessingStatus.isCompleted
                            ? t('backoffice.requests.internalProcessingCompleted', 'Procesamiento Interno Completado')
                            : t('backoffice.requests.internalProcessingRejected', 'Solicitud Rechazada en Procesamiento Interno')}
                        </Text>
                        {statusFlow?.operationId && internalProcessingStatus.isCompleted && (
                          <Button
                            mt={3}
                            colorPalette="green"
                            onClick={() => navigate(`/operations/${statusFlow.operationId}`)}
                          >
                            Ver Operación Creada
                          </Button>
                        )}
                      </Box>
                    )}
                  </VStack>
                ) : (
                  <Center p={8}>
                    <VStack>
                      <Text color="gray.500">
                        {t('backoffice.requests.noInternalProcessingConfig', 'No se encontró configuración de procesamiento interno')}
                      </Text>
                      <Text fontSize="sm" color="gray.400">
                        Asegúrese de que la configuración de eventos de procesamiento interno esté configurada en la base de datos.
                      </Text>
                    </VStack>
                  </Center>
                )}
              </Tabs.Content>

              {/* Documents Tab */}
              <Tabs.Content value="documents" p={4}>
                {(() => {
                  // Extract documents from formData (customData) as well
                  const formDataDocs: Array<{ name: string; type: string; downloadUrl?: string; previewUrl?: string }> = [];

                  if (formData && customFieldsConfig) {
                    customFieldsConfig.steps.forEach(step => {
                      step.sections.forEach(section => {
                        if (section.sectionType === 'REPEATABLE') {
                          const isDocumentsSection = section.fields.some(f => f.fieldType === 'FILE');
                          if (isDocumentsSection) {
                            const sectionKey = section.sectionCode.toLowerCase();
                            const arrayData = formData[section.sectionCode] ||
                                            formData[sectionKey] ||
                                            formData[sectionKey.replace('_', '')] ||
                                            [];
                            const items = Array.isArray(arrayData) ? arrayData : [];

                            items.forEach((item: Record<string, unknown>) => {
                              const fileField = section.fields.find(f => f.fieldType === 'FILE');
                              const typeField = section.fields.find(f => f.fieldCode.includes('TYPE') || f.fieldCode.includes('TIPO'));

                              let fileValue: { name?: string; downloadUrl?: string; previewUrl?: string; size?: number } | null = null;

                              if (fileField) {
                                const rawValue = item[fileField.fieldCode];
                                // Handle both object and stringified JSON
                                if (typeof rawValue === 'object' && rawValue !== null) {
                                  fileValue = rawValue as typeof fileValue;
                                } else if (typeof rawValue === 'string' && rawValue.startsWith('{')) {
                                  try {
                                    fileValue = JSON.parse(rawValue);
                                  } catch {
                                    // Not valid JSON
                                  }
                                }
                              }

                              const typeValue = typeField ? String(item[typeField.fieldCode] || '') : '';

                              if (fileValue?.name) {
                                formDataDocs.push({
                                  name: fileValue.name,
                                  type: typeValue,
                                  downloadUrl: fileValue.downloadUrl,
                                  previewUrl: fileValue.previewUrl
                                });
                              }
                            });
                          }
                        }
                      });
                    });
                  }

                  // Combine documents from both sources
                  const totalDocs = documents.length + formDataDocs.length;

                  // Document type labels
                  const docTypeLabels: Record<string, string> = {
                    'COMMERCIAL_INVOICE': t('backoffice.requests.docType.commercialInvoice', 'Commercial Invoice'),
                    'BILL_OF_LADING': t('backoffice.requests.docType.billOfLading', 'Bill of Lading'),
                    'PACKING_LIST': t('backoffice.requests.docType.packingList', 'Packing List'),
                    'CERTIFICATE_OF_ORIGIN': t('backoffice.requests.docType.certificateOfOrigin', 'Certificate of Origin'),
                    'INSURANCE_CERTIFICATE': t('backoffice.requests.docType.insuranceCertificate', 'Insurance Certificate'),
                    'PROFORMA_INVOICE': t('backoffice.requests.docType.proformaInvoice', 'Proforma Invoice'),
                    'PURCHASE_ORDER': t('backoffice.requests.docType.purchaseOrder', 'Purchase Order'),
                    'CONTRACT': t('backoffice.requests.docType.contract', 'Contract'),
                    'OTHER': t('backoffice.requests.docType.other', 'Other'),
                  };

                  return (
                    <VStack align="stretch" gap={4}>
                      {/* Documents Summary */}
                      <Box
                        p={4}
                        bg={isDark ? 'whiteAlpha.100' : 'blue.50'}
                        borderRadius="lg"
                      >
                        <HStack justify="space-between" mb={2}>
                          <HStack>
                            <Icon as={FiUpload} color="blue.500" />
                            <Text fontWeight="bold">
                              {t('backoffice.requests.documentsAttached', 'Documentos Adjuntos')}
                            </Text>
                          </HStack>
                          <Badge colorPalette={totalDocs > 0 ? 'green' : 'orange'}>
                            {totalDocs} {totalDocs === 1 ? t('backoffice.requests.document', 'document') : t('backoffice.requests.documentsCount', 'documents')}
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          {request?.productType === 'LC_IMPORT_REQUEST'
                            ? t('backoffice.requests.docsHelpLcImport', 'Minimum 2 documents required: Proforma Invoice, Purchase Agreement, etc.')
                            : request?.productType === 'GUARANTEE_REQUEST'
                            ? t('backoffice.requests.docsHelpGuarantee', 'Minimum 1 document required: Signed application, Contract, etc.')
                            : request?.productType === 'COLLECTION_REQUEST'
                            ? t('backoffice.requests.docsHelpCollection', 'Minimum 2 documents required: Collection documents, Bill of exchange, etc.')
                            : t('backoffice.requests.docsHelpDefault', 'Attach the required documents for this request.')}
                        </Text>
                      </Box>

                      {/* Documents from Document Management System */}
                      {documents.length > 0 && (
                        <VStack align="stretch" gap={2}>
                          <Text fontWeight="medium" color="gray.600" mb={1}>
                            {t('backoffice.requests.documentsFromDMS', 'Documentos del Gestor Documental')}
                          </Text>
                          {documents.map((doc) => (
                            <HStack
                              key={doc.documentId}
                              p={3}
                              bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                              borderRadius="md"
                              justify="space-between"
                              borderLeft="3px solid"
                              borderLeftColor="green.400"
                            >
                              <HStack>
                                <Icon as={FiCheckCircle} color="green.500" boxSize={5} />
                                <VStack align="start" gap={0}>
                                  <Text fontWeight="medium">{doc.originalFileName}</Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {doc.documentTypeCode || doc.categoryCode || 'Documento'}
                                    {doc.formattedFileSize && ` - ${doc.formattedFileSize}`}
                                    {!doc.formattedFileSize && doc.fileSize && ` - ${(doc.fileSize / 1024).toFixed(1)} KB`}
                                  </Text>
                                  {doc.uploadedAt && (
                                    <Text fontSize="xs" color="gray.400">
                                      Subido: {new Date(doc.uploadedAt).toLocaleString()}
                                    </Text>
                                  )}
                                </VStack>
                              </HStack>
                              <HStack gap={1}>
                                {doc.previewUrl && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    colorPalette="gray"
                                    onClick={() => openDocumentWithAuth(doc.previewUrl!)}
                                    title="Vista previa"
                                  >
                                    <Icon as={FiEye} />
                                  </Button>
                                )}
                                {doc.downloadUrl && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    colorPalette="blue"
                                    onClick={() => openDocumentWithAuth(doc.downloadUrl!)}
                                    title="Descargar"
                                  >
                                    <Icon as={FiDownload} />
                                  </Button>
                                )}
                              </HStack>
                            </HStack>
                          ))}
                        </VStack>
                      )}

                      {/* Documents from Form Data (customData) */}
                      {formDataDocs.length > 0 && (
                        <VStack align="stretch" gap={2}>
                          <Text fontWeight="medium" color="gray.600" mb={1}>
                            {t('backoffice.requests.documentsFromForm', 'Documentos del Formulario')}
                          </Text>
                          {formDataDocs.map((doc, idx) => (
                            <HStack
                              key={idx}
                              p={3}
                              bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                              borderRadius="md"
                              justify="space-between"
                              borderLeft="3px solid"
                              borderLeftColor="green.400"
                            >
                              <HStack>
                                <Icon as={FiCheckCircle} color="green.500" boxSize={5} />
                                <VStack align="start" gap={0}>
                                  <Text fontWeight="medium">{doc.name}</Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {docTypeLabels[doc.type] || doc.type || 'Documento'}
                                  </Text>
                                </VStack>
                              </HStack>
                              <HStack gap={1}>
                                {doc.previewUrl && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    colorPalette="gray"
                                    onClick={() => openDocumentWithAuth(doc.previewUrl!)}
                                    title="Vista previa"
                                  >
                                    <Icon as={FiEye} />
                                  </Button>
                                )}
                                {doc.downloadUrl && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    colorPalette="blue"
                                    onClick={() => openDocumentWithAuth(doc.downloadUrl!)}
                                    title="Descargar"
                                  >
                                    <Icon as={FiDownload} />
                                  </Button>
                                )}
                              </HStack>
                            </HStack>
                          ))}
                        </VStack>
                      )}

                      {/* No documents message */}
                      {totalDocs === 0 && (
                        <Box
                          p={4}
                          bg={isDark ? 'whiteAlpha.50' : 'orange.50'}
                          borderRadius="md"
                          borderLeft="3px solid"
                          borderLeftColor="orange.400"
                        >
                          <HStack>
                            <Icon as={FiAlertTriangle} color="orange.500" />
                            <VStack align="start" gap={0}>
                              <Text fontWeight="medium" color="orange.700">
                                {t('backoffice.requests.noDocuments', 'No hay documentos adjuntos')}
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                El cliente aún no ha subido ningún documento a esta solicitud.
                              </Text>
                            </VStack>
                          </HStack>
                        </Box>
                      )}
                    </VStack>
                  );
                })()}
              </Tabs.Content>

              {/* History Tab */}
              {request.comments && (
                <Tabs.Content value="history" p={4}>
                  <Text whiteSpace="pre-wrap">{request.comments}</Text>
                </Tabs.Content>
              )}
            </Tabs.Root>
          </Card.Body>
        </Card.Root>
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

      {/* Skip Validation/Compliance Dialog */}
      <Dialog.Root open={!!skipTarget} onOpenChange={(e) => { if (!e.open) { setSkipTarget(null); setSkipReason(''); } }}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                {t('workflow.skipDialog.title', 'Omitir verificación')}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={3} align="stretch">
                <Text fontSize="sm">
                  {t('workflow.skipDialog.description', 'Está a punto de omitir la siguiente verificación. Debe documentar el motivo.')}
                </Text>
                <Box p={3} bg={isDark ? 'orange.900' : 'orange.50'} borderRadius="md" border="1px solid" borderColor="orange.300">
                  <HStack gap={2}>
                    <Icon as={FiAlertTriangle} color="orange.500" />
                    <Text fontSize="sm" fontWeight="medium">{skipTarget?.name}</Text>
                  </HStack>
                </Box>
                <Field.Root required>
                  <Field.Label fontSize="sm">{t('workflow.skipDialog.reason', 'Motivo de omisión')}</Field.Label>
                  <Textarea
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    placeholder={t('workflow.skipDialog.reasonPlaceholder', 'Explique el motivo por el cual se omite esta verificación...')}
                    rows={3}
                  />
                </Field.Root>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => { setSkipTarget(null); setSkipReason(''); }}>
                {t('common.cancel', 'Cancelar')}
              </Button>
              <Button
                colorPalette="orange"
                onClick={handleSkipConfirm}
                disabled={!skipReason.trim() || actionLoading}
              >
                {actionLoading ? <Spinner size="sm" /> : t('workflow.skipDialog.confirm', 'Omitir y documentar')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Retry Preview Modal */}
      <Dialog.Root open={!!retryTarget} onOpenChange={(e) => { if (!e.open) { setRetryTarget(null); setRetryPreview(null); setRetryEditData({}); } }} size="lg">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="750px">
            <Dialog.Header>
              <Dialog.Title>
                {t('workflow.retryDialog.title', 'Reintentar Validación')}
              </Dialog.Title>
              <Text fontSize="sm" color="gray.500">{retryTarget?.name}</Text>
            </Dialog.Header>
            <Dialog.Body>
              {retryPreviewLoading ? (
                <Center py={8}><Spinner size="lg" /></Center>
              ) : !retryPreview ? (
                <Center py={8}>
                  <VStack gap={2}>
                    <Icon as={FiInfo} boxSize={8} color="gray.400" />
                    <Text color="gray.500">{t('workflow.retryDialog.noData', 'No se pudieron cargar los datos')}</Text>
                  </VStack>
                </Center>
              ) : (
                <VStack align="stretch" gap={4}>
                  {/* API Info */}
                  <HStack gap={2} flexWrap="wrap">
                    <Badge colorPalette="blue" size="sm" fontFamily="mono">
                      {retryPreview.httpMethod}
                    </Badge>
                    <Text fontSize="sm" fontWeight="bold">{retryPreview.apiName}</Text>
                  </HStack>
                  <Box p={2} bg={isDark ? 'gray.800' : 'gray.50'} borderRadius="md" border="1px solid" borderColor={isDark ? 'gray.600' : 'gray.200'}>
                    <Text fontSize="xs" fontFamily="mono" color="gray.500" wordBreak="break-all">{retryPreview.resolvedUrl}</Text>
                  </Box>

                  {/* Editable Fields */}
                  <Text fontSize="sm" fontWeight="bold" color={isDark ? 'gray.300' : 'gray.600'}>
                    {t('workflow.retryDialog.fieldsTitle', 'Datos a enviar (editables)')}
                  </Text>
                  <SimpleGrid columns={2} gap={3}>
                    {Object.entries(retryEditData).map(([key, value]) => (
                      <Field.Root key={key}>
                        <Field.Label fontSize="xs" color="gray.500">
                          {retryPreview.fieldLabels[key] || key}
                        </Field.Label>
                        <Input
                          size="sm"
                          value={value}
                          onChange={(e) => setRetryEditData(prev => ({ ...prev, [key]: e.target.value }))}
                        />
                      </Field.Root>
                    ))}
                  </SimpleGrid>

                  {/* Collapsible Body Template */}
                  {retryPreview.bodyTemplate && (
                    <Collapsible.Root>
                      <Collapsible.Trigger asChild>
                        <Button variant="ghost" size="sm" width="100%">
                          <HStack gap={1}>
                            <Icon as={FiChevronRight} boxSize={3} />
                            <Text fontSize="xs">{t('workflow.retryDialog.showTemplate', 'Ver plantilla del body')}</Text>
                          </HStack>
                        </Button>
                      </Collapsible.Trigger>
                      <Collapsible.Content>
                        <Box p={3} bg={isDark ? 'gray.800' : 'gray.50'} borderRadius="md" border="1px solid" borderColor={isDark ? 'gray.600' : 'gray.200'} mt={2}>
                          <Text fontSize="xs" fontFamily="mono" whiteSpace="pre-wrap" wordBreak="break-all">
                            {retryPreview.bodyTemplate}
                          </Text>
                        </Box>
                      </Collapsible.Content>
                    </Collapsible.Root>
                  )}
                </VStack>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => { setRetryTarget(null); setRetryPreview(null); setRetryEditData({}); }}>
                {t('common.cancel', 'Cancelar')}
              </Button>
              <Button
                colorPalette="blue"
                onClick={handleExecuteRetry}
                disabled={actionLoading || retryPreviewLoading || !retryPreview}
                loading={actionLoading}
              >
                {t('workflow.retryDialog.execute', 'Ejecutar')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* API Call History Dialog */}
      <Dialog.Root open={!!historyTarget} onOpenChange={(e) => { if (!e.open) setHistoryTarget(null); }} size="lg">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="700px">
            <Dialog.Header>
              <Dialog.Title>
                {t('workflow.historyDialog.title', 'Historial de Ejecuciones')}
              </Dialog.Title>
              <Text fontSize="sm" color="gray.500">{historyTarget?.name}</Text>
            </Dialog.Header>
            <Dialog.Body>
              {historyLoading ? (
                <Center py={8}><Spinner size="lg" /></Center>
              ) : historyEntries.length === 0 ? (
                <Center py={8}>
                  <VStack gap={2}>
                    <Icon as={FiInfo} boxSize={8} color="gray.400" />
                    <Text color="gray.500">{t('workflow.historyDialog.noEntries', 'No hay ejecuciones registradas')}</Text>
                  </VStack>
                </Center>
              ) : (
                <VStack align="stretch" gap={3}>
                  {historyEntries.map((entry, idx) => (
                    <Box
                      key={entry.id || idx}
                      p={3}
                      bg={isDark
                        ? entry.skipped ? 'orange.900' : entry.success ? 'green.900' : 'red.900'
                        : entry.skipped ? 'orange.50' : entry.success ? 'green.50' : 'red.50'}
                      borderRadius="md"
                      border="1px solid"
                      borderColor={entry.skipped ? 'orange.300' : entry.success ? 'green.300' : 'red.300'}
                    >
                      <HStack justify="space-between" mb={2}>
                        <HStack gap={2}>
                          <Icon
                            as={entry.skipped ? FiArrowRight : entry.success ? FiCheck : FiX}
                            color={entry.skipped ? 'orange.500' : entry.success ? 'green.500' : 'red.500'}
                          />
                          <Badge
                            colorPalette={entry.skipped ? 'orange' : entry.success ? 'green' : 'red'}
                            size="sm"
                          >
                            {entry.skipped
                              ? t('workflow.historyDialog.skipped', 'Omitido')
                              : entry.success
                              ? t('workflow.status.passed', 'Aprobado')
                              : t('workflow.status.failed', 'Fallido')}
                          </Badge>
                          {entry.attemptNumber > 0 && (
                            <Text fontSize="xs" color="gray.500">
                              #{entry.attemptNumber}
                            </Text>
                          )}
                        </HStack>
                        <Text fontSize="xs" color="gray.500">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''}
                        </Text>
                      </HStack>

                      <SimpleGrid columns={2} gap={2} fontSize="xs">
                        {entry.triggeredBy && (
                          <>
                            <Text color="gray.500">{t('workflow.executedBy', 'Ejecutado por')}:</Text>
                            <Text fontWeight="medium">{entry.triggeredBy}</Text>
                          </>
                        )}
                        {entry.executionTimeMs != null && entry.executionTimeMs > 0 && (
                          <>
                            <Text color="gray.500">{t('workflow.duration', 'Duración')}:</Text>
                            <Text fontWeight="medium">{entry.executionTimeMs}ms</Text>
                          </>
                        )}
                        {entry.responseStatusCode != null && !entry.skipped && (
                          <>
                            <Text color="gray.500">HTTP Status:</Text>
                            <Text fontWeight="medium">{entry.responseStatusCode}</Text>
                          </>
                        )}
                        {entry.eventType && (
                          <>
                            <Text color="gray.500">{t('workflow.historyDialog.trigger', 'Origen')}:</Text>
                            <Text fontWeight="medium">{entry.eventType}</Text>
                          </>
                        )}
                      </SimpleGrid>

                      {entry.skipped && entry.skipReason && (
                        <Box mt={2} p={2} bg={isDark ? 'orange.800' : 'orange.100'} borderRadius="sm">
                          <Text fontSize="xs" fontWeight="bold" color="orange.600" mb={1}>
                            {t('workflow.skipDialog.reason', 'Motivo de omisión')}:
                          </Text>
                          <Text fontSize="xs">{entry.skipReason}</Text>
                          {entry.skippedByName && (
                            <Text fontSize="xs" color="gray.500" mt={1}>— {entry.skippedByName}</Text>
                          )}
                        </Box>
                      )}

                      {!entry.success && !entry.skipped && entry.errorMessage && (
                        <Box mt={2} p={2} bg={isDark ? 'red.800' : 'red.100'} borderRadius="sm">
                          <Text fontSize="xs" color={isDark ? 'red.200' : 'red.700'}>{entry.errorMessage}</Text>
                        </Box>
                      )}

                      {entry.responseBody && !entry.skipped && (
                        <Box mt={2} p={2} bg={isDark ? 'gray.700' : 'gray.50'} borderRadius="sm">
                          <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
                            {t('externalApiConfig.test.response', 'Respuesta')}:
                          </Text>
                          <Box
                            as="pre"
                            fontSize="xs"
                            fontFamily="mono"
                            whiteSpace="pre-wrap"
                            wordBreak="break-all"
                            maxH="200px"
                            overflowY="auto"
                          >
                            {(() => {
                              try {
                                return JSON.stringify(JSON.parse(entry.responseBody), null, 2);
                              } catch {
                                return entry.responseBody;
                              }
                            })()}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  ))}
                </VStack>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setHistoryTarget(null)}>
                {t('common.close', 'Cerrar')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

export default ClientRequestDetail;
