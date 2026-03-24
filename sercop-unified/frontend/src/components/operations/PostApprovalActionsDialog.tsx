import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Spinner,
  IconButton,
  Collapsible,
  Progress,
} from '@chakra-ui/react';
import {
  FiPlay,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiRefreshCw,
  FiSkipForward,
  FiChevronDown,
  FiChevronUp,
  FiSend,
  FiGlobe,
  FiMail,
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiArrowRight,
  FiExternalLink,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { API_V1_URL, TOKEN_STORAGE_KEY } from '../../config/api.config';

// Auth helper - use the same token key as the rest of the app
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  return fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
};

interface ActionPreview {
  order: number;
  ruleCode: string;
  ruleName: string;
  actionType: string;
  description: string | null;
  async: boolean;
  continueOnError: boolean;
  config: Record<string, unknown>;
}

interface ActionStatus {
  id: number;
  executionId: string;
  ruleCode: string;
  actionType: string;
  actionOrder: number;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  resultData: string | null;
  retryCount: number;
  maxRetries: number;
  canRetry: boolean;
  canSkip: boolean;
}

interface ActionTypeConfig {
  actionType: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  successMessage: string;
  errorMessage: string;
}

interface NextStepEvent {
  toEventCode: string;
  toEventName?: string;
  toEventDescription?: string;
  transitionLabel?: string;
  transitionHelp?: string;
  toEventIcon?: string;
  toEventColor?: string;
  isRequired: boolean;
  sequenceOrder: number;
}

interface PostApprovalActionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  operationType: string;
  triggerEvent: string;
  operationId: string;
  approvedBy: string;
  onComplete?: () => void;
  onNavigateToOperation?: (operationId: string) => void;
}

const API_BASE = API_V1_URL;

export const PostApprovalActionsDialog = ({
  isOpen,
  onClose,
  operationType,
  triggerEvent,
  operationId,
  approvedBy,
  onComplete,
  onNavigateToOperation,
}: PostApprovalActionsDialogProps) => {
  const { t, i18n } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const [actions, setActions] = useState<ActionPreview[]>([]);
  const [executionStatus, setExecutionStatus] = useState<ActionStatus[]>([]);
  const [actionConfigs, setActionConfigs] = useState<Record<string, ActionTypeConfig>>({});
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<'preview' | 'executing' | 'completed'>('preview');
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [nextSteps, setNextSteps] = useState<NextStepEvent[]>([]);
  const [loadingNextSteps, setLoadingNextSteps] = useState(false);

  // Load action previews and configs on open
  useEffect(() => {
    if (isOpen) {
      loadPreviewAndConfigs();
    }
  }, [isOpen, operationType, triggerEvent, i18n.language]);

  // Load next steps when phase becomes completed
  useEffect(() => {
    if (phase === 'completed') {
      loadNextSteps();
    }
  }, [phase, operationId, i18n.language]);

  const loadNextSteps = async () => {
    setLoadingNextSteps(true);
    try {
      // Get the newly created operation to know its current stage
      const operationResponse = await authFetch(
        `${API_BASE}/operations/${operationId}`
      );

      if (operationResponse.ok) {
        const operationResult = await operationResponse.json();
        const currentStage = operationResult.data?.stage;

        // Get available events for this operation
        const params = new URLSearchParams({ language: i18n.language });
        if (currentStage) params.append('currentStage', currentStage);

        const eventsResponse = await authFetch(
          `${API_BASE}/event-config/flows/operation/${operationId}/available?${params}`
        );

        if (eventsResponse.ok) {
          const eventsResult = await eventsResponse.json();
          setNextSteps(eventsResult.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading next steps:', error);
    } finally {
      setLoadingNextSteps(false);
    }
  };

  const loadPreviewAndConfigs = async () => {
    setLoading(true);
    try {
      // Load action type configs for current language
      const configResponse = await authFetch(
        `${API_BASE}/event-actions/action-types?language=${i18n.language}`
      );
      if (configResponse.ok) {
        const configResult = await configResponse.json();
        const configs: Record<string, ActionTypeConfig> = {};
        (configResult.data || []).forEach((c: ActionTypeConfig) => {
          configs[c.actionType] = c;
        });
        setActionConfigs(configs);
      }

      // Load action preview
      const previewResponse = await authFetch(
        `${API_BASE}/event-actions/preview?operationType=${operationType}&triggerEvent=${triggerEvent}&operationId=${operationId}`
      );
      if (previewResponse.ok) {
        const previewResult = await previewResponse.json();
        setActions(previewResult.data?.actions || []);
      }
    } catch (error) {
      console.error('Error loading preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeAllActions = async () => {
    setExecuting(true);
    setPhase('executing');
    try {
      const response = await authFetch(`${API_BASE}/event-actions/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationType,
          triggerEvent,
          operationId,
          executedBy: approvedBy,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setExecutionId(result.data?.executionId);
        setExecutionStatus(result.data?.actions || []);
        setPhase('completed');
      } else {
        // Show error in execution status
        console.error('Execution failed:', result);
        setExecutionStatus([{
          id: 0,
          executionId: '',
          ruleCode: 'ERROR',
          actionType: 'ERROR',
          actionOrder: 0,
          status: 'FAILED' as const,
          startedAt: null,
          completedAt: null,
          durationMs: null,
          errorMessage: result.message || t('postApprovalActions.executionError'),
          resultData: null,
          retryCount: 0,
          maxRetries: 0,
          canRetry: false,
          canSkip: false,
        }]);
        setPhase('completed');
      }
    } catch (error) {
      console.error('Error executing actions:', error);
      setExecutionStatus([{
        id: 0,
        executionId: '',
        ruleCode: 'ERROR',
        actionType: 'ERROR',
        actionOrder: 0,
        status: 'FAILED' as const,
        startedAt: null,
        completedAt: null,
        durationMs: null,
        errorMessage: t('postApprovalActions.executionError'),
        resultData: null,
        retryCount: 0,
        maxRetries: 0,
        canRetry: false,
        canSkip: false,
      }]);
      setPhase('completed');
    } finally {
      setExecuting(false);
    }
  };

  const retryAction = async (logId: number) => {
    try {
      const response = await authFetch(
        `${API_BASE}/event-actions/retry/${logId}?executedBy=${approvedBy}`,
        { method: 'POST' }
      );
      if (response.ok) {
        const result = await response.json();
        // Update the status
        setExecutionStatus(prev =>
          prev.map(a => (a.id === logId ? result.data : a))
        );
      }
    } catch (error) {
      console.error('Error retrying action:', error);
    }
  };

  const skipAction = async (logId: number) => {
    const reason = prompt(t('postApprovalActions.skipReasonPrompt'));
    if (!reason) return;

    try {
      const response = await authFetch(
        `${API_BASE}/event-actions/skip/${logId}?executedBy=${approvedBy}&reason=${encodeURIComponent(reason)}`,
        { method: 'POST' }
      );
      if (response.ok) {
        const result = await response.json();
        setExecutionStatus(prev =>
          prev.map(a => (a.id === logId ? result.data : a))
        );
      }
    } catch (error) {
      console.error('Error skipping action:', error);
    }
  };

  const toggleErrorExpanded = (id: number) => {
    setExpandedErrors(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getActionIcon = (actionType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      SWIFT_MESSAGE: <FiSend />,
      API_CALL: <FiGlobe />,
      EMAIL: <FiMail />,
      AUDITORIA: <FiFileText />,
    };
    return iconMap[actionType] || <FiPlay />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <FiCheckCircle color="green" />;
      case 'FAILED':
        return <FiXCircle color="red" />;
      case 'RUNNING':
        return <Spinner size="sm" />;
      case 'SKIPPED':
        return <FiSkipForward color="gray" />;
      default:
        return <FiClock color="orange" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'green';
      case 'FAILED':
        return 'red';
      case 'RUNNING':
        return 'blue';
      case 'SKIPPED':
        return 'gray';
      default:
        return 'orange';
    }
  };

  const getActionDisplayName = (actionType: string) => {
    return actionConfigs[actionType]?.displayName || actionType;
  };

  const getActionDescription = (actionType: string, configDesc?: string | null) => {
    return configDesc || actionConfigs[actionType]?.description || '';
  };

  const successCount = executionStatus.filter(a => a.status === 'SUCCESS').length;
  const failedCount = executionStatus.filter(a => a.status === 'FAILED').length;
  const skippedCount = executionStatus.filter(a => a.status === 'SKIPPED').length;
  const progress = executionStatus.length > 0
    ? ((successCount + failedCount + skippedCount) / executionStatus.length) * 100
    : 0;

  // Attempt to close - may show confirmation
  const attemptClose = useCallback(() => {
    // Block closing during execution
    if (phase === 'executing') {
      return;
    }

    // If in preview phase with pending actions, show confirmation
    if (phase === 'preview' && actions.length > 0) {
      setShowCloseConfirmation(true);
      return;
    }

    // Otherwise close normally
    handleCloseConfirmed();
  }, [phase, actions.length]);

  // Actually close the dialog
  const handleCloseConfirmed = useCallback(() => {
    if (phase === 'completed') {
      onComplete?.();
    }
    setShowCloseConfirmation(false);
    onClose();
    // Reset state
    setPhase('preview');
    setExecutionStatus([]);
    setExecutionId(null);
    setExpandedErrors(new Set());
    setNextSteps([]);
  }, [phase, onComplete, onClose]);

  // Cancel closing and stay on dialog
  const cancelClose = useCallback(() => {
    setShowCloseConfirmation(false);
  }, []);

  return (
    <>
    {/* Main Dialog */}
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && attemptClose()}>
      <Dialog.Backdrop bg="blackAlpha.600" />
      <Dialog.Positioner>
        <Dialog.Content bg={colors.cardBg} maxW="600px" borderRadius="xl" shadow="2xl">
          {/* Header */}
          <Dialog.Header
            bg={phase === 'completed' && failedCount === 0 ? 'green.500' :
                phase === 'completed' && failedCount > 0 ? 'orange.500' : 'blue.500'}
            color="white"
            borderTopRadius="xl"
            py={4}
          >
            <HStack justify="space-between" w="full">
              <HStack gap={3}>
                {phase === 'preview' && <FiPlay size={24} />}
                {phase === 'executing' && <Spinner size="md" />}
                {phase === 'completed' && failedCount === 0 && <FiCheckCircle size={24} />}
                {phase === 'completed' && failedCount > 0 && <FiAlertTriangle size={24} />}
                <VStack align="start" gap={0}>
                  <Text fontWeight="bold" fontSize="lg">
                    {phase === 'preview' && t('postApprovalActions.title')}
                    {phase === 'executing' && t('postApprovalActions.executing')}
                    {phase === 'completed' && failedCount === 0 && t('postApprovalActions.completed')}
                    {phase === 'completed' && failedCount > 0 && t('postApprovalActions.completedWithErrors')}
                  </Text>
                  <Text fontSize="sm" opacity={0.9}>
                    {operationId}
                  </Text>
                </VStack>
              </HStack>
              <IconButton
                aria-label="Close"
                variant="ghost"
                color="white"
                size="sm"
                onClick={attemptClose}
                disabled={phase === 'executing'}
              >
                <FiX />
              </IconButton>
            </HStack>
          </Dialog.Header>

          <Dialog.Body py={6}>
            {loading ? (
              <VStack py={8}>
                <Spinner size="xl" color={colors.primaryColor} />
                <Text color={colors.textColor}>{t('common.loading')}</Text>
              </VStack>
            ) : phase === 'preview' ? (
              /* Preview Phase */
              <VStack gap={4} align="stretch">
                <Box p={4} bg={colors.activeBg} borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                  <Text fontSize="sm" color={colors.textColor}>
                    {t('postApprovalActions.previewDescription', { count: actions.length })}
                  </Text>
                </Box>

                <VStack gap={3} align="stretch">
                  {actions.map((action, index) => (
                    <Box
                      key={index}
                      p={4}
                      bg={colors.bgColor}
                      borderRadius="md"
                      border="1px solid"
                      borderColor={colors.borderColor}
                    >
                      <HStack justify="space-between">
                        <HStack gap={3}>
                          <Box
                            p={2}
                            borderRadius="full"
                            bg={actionConfigs[action.actionType]?.color + '.100' || 'gray.100'}
                            color={actionConfigs[action.actionType]?.color + '.600' || 'gray.600'}
                          >
                            {getActionIcon(action.actionType)}
                          </Box>
                          <VStack align="start" gap={0}>
                            <HStack>
                              <Text fontWeight="medium" color={colors.textColor}>
                                {getActionDisplayName(action.actionType)}
                              </Text>
                              <Badge colorPalette="blue" size="sm">
                                #{action.order}
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color={colors.textColorSecondary}>
                              {getActionDescription(action.actionType, action.description)}
                            </Text>
                          </VStack>
                        </HStack>
                        {action.async && (
                          <Badge colorPalette="purple" size="sm">
                            {t('postApprovalActions.async')}
                          </Badge>
                        )}
                      </HStack>
                    </Box>
                  ))}
                </VStack>

                {actions.length === 0 && (
                  <Box textAlign="center" py={8}>
                    <Text color={colors.textColorSecondary}>
                      {t('postApprovalActions.noActions')}
                    </Text>
                  </Box>
                )}
              </VStack>
            ) : (
              /* Executing/Completed Phase */
              <VStack gap={4} align="stretch">
                {/* Progress Bar */}
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                      {t('postApprovalActions.progress')}
                    </Text>
                    <Text fontSize="sm" color={colors.textColorSecondary}>
                      {successCount + failedCount + skippedCount} / {executionStatus.length}
                    </Text>
                  </HStack>
                  <Progress.Root value={progress} size="md" borderRadius="full">
                    <Progress.Track bg={colors.borderColor}>
                      <Progress.Range
                        bg={failedCount > 0 ? 'orange.400' : 'green.400'}
                        transition="width 0.3s"
                      />
                    </Progress.Track>
                  </Progress.Root>
                </Box>

                {/* Summary Cards */}
                <HStack gap={3}>
                  <Box flex={1} p={3} bg="green.50" borderRadius="md" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                      {successCount}
                    </Text>
                    <Text fontSize="xs" color="green.700">
                      {t('postApprovalActions.success')}
                    </Text>
                  </Box>
                  <Box flex={1} p={3} bg="red.50" borderRadius="md" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="red.600">
                      {failedCount}
                    </Text>
                    <Text fontSize="xs" color="red.700">
                      {t('postApprovalActions.failed')}
                    </Text>
                  </Box>
                  <Box flex={1} p={3} bg="gray.50" borderRadius="md" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="gray.600">
                      {skippedCount}
                    </Text>
                    <Text fontSize="xs" color="gray.700">
                      {t('postApprovalActions.skipped')}
                    </Text>
                  </Box>
                </HStack>

                {/* Action Status List */}
                <VStack gap={2} align="stretch">
                  {executionStatus.map((status) => (
                    <Box
                      key={status.id}
                      p={3}
                      bg={status.status === 'FAILED' ? 'red.50' : colors.bgColor}
                      borderRadius="md"
                      border="1px solid"
                      borderColor={status.status === 'FAILED' ? 'red.200' : colors.borderColor}
                    >
                      <HStack justify="space-between">
                        <HStack gap={3}>
                          {getStatusIcon(status.status)}
                          <VStack align="start" gap={0}>
                            <HStack>
                              <Text fontWeight="medium" color={colors.textColor}>
                                {getActionDisplayName(status.actionType)}
                              </Text>
                              <Badge colorPalette={getStatusColor(status.status)} size="sm">
                                {t(`postApprovalActions.statuses.${status.status}`)}
                              </Badge>
                            </HStack>
                            {status.durationMs && (
                              <Text fontSize="xs" color={colors.textColorSecondary}>
                                {status.durationMs}ms
                              </Text>
                            )}
                          </VStack>
                        </HStack>

                        <HStack gap={1}>
                          {status.canRetry && (
                            <IconButton
                              aria-label={t('postApprovalActions.retry')}
                              size="sm"
                              variant="ghost"
                              colorPalette="blue"
                              onClick={() => retryAction(status.id)}
                              title={t('postApprovalActions.retry')}
                            >
                              <FiRefreshCw />
                            </IconButton>
                          )}
                          {status.canSkip && status.status === 'FAILED' && (
                            <IconButton
                              aria-label={t('postApprovalActions.skip')}
                              size="sm"
                              variant="ghost"
                              colorPalette="gray"
                              onClick={() => skipAction(status.id)}
                              title={t('postApprovalActions.skip')}
                            >
                              <FiSkipForward />
                            </IconButton>
                          )}
                          {status.status === 'FAILED' && status.errorMessage && (
                            <IconButton
                              aria-label="Toggle error"
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleErrorExpanded(status.id)}
                            >
                              {expandedErrors.has(status.id) ? <FiChevronUp /> : <FiChevronDown />}
                            </IconButton>
                          )}
                        </HStack>
                      </HStack>

                      {/* Error Details Collapsible */}
                      {status.status === 'FAILED' && status.errorMessage && (
                        <Collapsible.Root open={expandedErrors.has(status.id)}>
                          <Collapsible.Content>
                            <Box
                              mt={3}
                              p={3}
                              bg="red.100"
                              borderRadius="md"
                              border="1px solid"
                              borderColor="red.300"
                            >
                              <HStack align="start" gap={2}>
                                <Box color="red.600" mt={0.5}>
                                  <FiAlertTriangle />
                                </Box>
                                <VStack align="start" gap={1} flex={1}>
                                  <Text fontSize="sm" fontWeight="medium" color="red.700">
                                    {t('postApprovalActions.errorDetails')}
                                  </Text>
                                  <Text
                                    fontSize="sm"
                                    color="red.800"
                                    fontFamily="mono"
                                    whiteSpace="pre-wrap"
                                    wordBreak="break-word"
                                  >
                                    {status.errorMessage}
                                  </Text>
                                  {status.retryCount > 0 && (
                                    <Text fontSize="xs" color="red.600">
                                      {t('postApprovalActions.retryCount', {
                                        count: status.retryCount,
                                        max: status.maxRetries,
                                      })}
                                    </Text>
                                  )}
                                </VStack>
                              </HStack>
                            </Box>
                          </Collapsible.Content>
                        </Collapsible.Root>
                      )}
                    </Box>
                  ))}
                </VStack>

                {/* Next Steps Section - shown after completion */}
                {phase === 'completed' && (
                  <Box mt={4}>
                    <Box
                      p={4}
                      bg={colors.activeBg}
                      borderRadius="md"
                      borderLeft="4px solid"
                      borderColor="blue.400"
                    >
                      <HStack gap={2} mb={3}>
                        <FiArrowRight color={colors.primaryColor} />
                        <Text fontWeight="medium" color={colors.textColor}>
                          {t('postApprovalActions.nextSteps.title', 'Próximos Pasos')}
                        </Text>
                      </HStack>

                      {loadingNextSteps ? (
                        <HStack justify="center" py={2}>
                          <Spinner size="sm" color={colors.primaryColor} />
                          <Text fontSize="sm" color={colors.textColorSecondary}>
                            {t('postApprovalActions.nextSteps.loading', 'Cargando próximos pasos...')}
                          </Text>
                        </HStack>
                      ) : nextSteps.length > 0 ? (
                        <VStack align="stretch" gap={2}>
                          <Text fontSize="sm" color={colors.textColorSecondary} mb={1}>
                            {t('postApprovalActions.nextSteps.description', 'Estas son las acciones disponibles para continuar con la operación:')}
                          </Text>
                          {nextSteps.slice(0, 3).map((step, idx) => (
                            <HStack
                              key={idx}
                              p={3}
                              bg={colors.bgColor}
                              borderRadius="md"
                              border="1px solid"
                              borderColor={colors.borderColor}
                              justify="space-between"
                            >
                              <HStack gap={3}>
                                <Box
                                  p={2}
                                  borderRadius="full"
                                  bg={step.toEventColor ? `${step.toEventColor}.100` : 'blue.100'}
                                  color={step.toEventColor ? `${step.toEventColor}.600` : 'blue.600'}
                                >
                                  <FiPlay size={14} />
                                </Box>
                                <VStack align="start" gap={0}>
                                  <HStack gap={2}>
                                    <Text fontWeight="medium" fontSize="sm" color={colors.textColor}>
                                      {step.transitionLabel || step.toEventName || step.toEventCode}
                                    </Text>
                                    {step.isRequired && (
                                      <Badge colorPalette="red" size="sm">
                                        {t('postApprovalActions.nextSteps.required', 'Requerido')}
                                      </Badge>
                                    )}
                                  </HStack>
                                  {(step.transitionHelp || step.toEventDescription) && (
                                    <Text fontSize="xs" color={colors.textColorSecondary}>
                                      {step.transitionHelp || step.toEventDescription}
                                    </Text>
                                  )}
                                </VStack>
                              </HStack>
                            </HStack>
                          ))}
                          {nextSteps.length > 3 && (
                            <Text fontSize="xs" color={colors.textColorSecondary} textAlign="center">
                              {t('postApprovalActions.nextSteps.moreSteps', `y ${nextSteps.length - 3} más...`)}
                            </Text>
                          )}
                        </VStack>
                      ) : (
                        <Text fontSize="sm" color={colors.textColorSecondary}>
                          {t('postApprovalActions.nextSteps.noSteps', 'No hay acciones adicionales configuradas para esta etapa.')}
                        </Text>
                      )}
                    </Box>
                  </Box>
                )}
              </VStack>
            )}
          </Dialog.Body>

          <Dialog.Footer borderTop="1px solid" borderColor={colors.borderColor} py={4}>
            {phase === 'preview' && (
              <HStack justify="space-between" w="full">
                <Button variant="ghost" onClick={attemptClose}>
                  {t('common.cancel')}
                </Button>
                <Button
                  colorPalette="blue"
                  onClick={executeAllActions}
                  disabled={actions.length === 0 || executing}
                >
                  <FiPlay />
                  {t('postApprovalActions.executeAll')}
                </Button>
              </HStack>
            )}
            {phase === 'executing' && (
              <HStack justify="center" w="full">
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  {t('postApprovalActions.executingWait')}
                </Text>
              </HStack>
            )}
            {phase === 'completed' && (
              <HStack justify="space-between" w="full">
                <Button
                  variant="ghost"
                  onClick={handleCloseConfirmed}
                >
                  {t('common.close')}
                </Button>
                <HStack gap={2}>
                  {onNavigateToOperation && nextSteps.length > 0 && (
                    <Button
                      variant="outline"
                      colorPalette="blue"
                      onClick={() => {
                        handleCloseConfirmed();
                        onNavigateToOperation(operationId);
                      }}
                    >
                      <FiExternalLink />
                      {t('postApprovalActions.nextSteps.goToOperation', 'Ver Operación')}
                    </Button>
                  )}
                  <Button
                    colorPalette={failedCount === 0 ? 'green' : 'blue'}
                    onClick={handleCloseConfirmed}
                  >
                    <FiCheck />
                    {failedCount === 0
                      ? t('postApprovalActions.done')
                      : t('postApprovalActions.close')}
                  </Button>
                </HStack>
              </HStack>
            )}
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>

    {/* Close Confirmation Dialog */}
    <Dialog.Root open={showCloseConfirmation} onOpenChange={(e) => !e.open && cancelClose()}>
      <Dialog.Backdrop bg="blackAlpha.700" />
      <Dialog.Positioner>
        <Dialog.Content bg={colors.cardBg} maxW="450px" borderRadius="xl" shadow="2xl">
          <Dialog.Header bg="orange.500" color="white" borderTopRadius="xl" py={4}>
            <HStack gap={3}>
              <FiAlertCircle size={24} />
              <Text fontWeight="bold" fontSize="lg">
                {t('postApprovalActions.closeConfirmation.title')}
              </Text>
            </HStack>
          </Dialog.Header>

          <Dialog.Body py={6}>
            <VStack gap={4} align="stretch">
              <Box
                p={4}
                bg="orange.50"
                borderRadius="md"
                borderLeft="4px solid"
                borderColor="orange.400"
              >
                <HStack align="start" gap={3}>
                  <Box color="orange.500" mt={0.5}>
                    <FiAlertTriangle size={20} />
                  </Box>
                  <VStack align="start" gap={2}>
                    <Text fontWeight="medium" color="orange.800">
                      {t('postApprovalActions.closeConfirmation.warning')}
                    </Text>
                    <Text fontSize="sm" color="orange.700">
                      {t('postApprovalActions.closeConfirmation.description', { count: actions.length })}
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              {/* List of actions that won't execute */}
              <Box p={3} bg={colors.activeBg} borderRadius="md">
                <Text fontSize="sm" fontWeight="medium" color={colors.textColor} mb={2}>
                  {t('postApprovalActions.closeConfirmation.pendingActions')}
                </Text>
                <VStack align="stretch" gap={1}>
                  {actions.slice(0, 3).map((action, idx) => (
                    <HStack key={idx} gap={2} fontSize="sm">
                      <Box color="gray.400">
                        {getActionIcon(action.actionType)}
                      </Box>
                      <Text color={colors.textColorSecondary}>
                        {getActionDisplayName(action.actionType)}
                      </Text>
                    </HStack>
                  ))}
                  {actions.length > 3 && (
                    <Text fontSize="xs" color={colors.textColorSecondary} fontStyle="italic">
                      {t('postApprovalActions.closeConfirmation.moreActions', { count: actions.length - 3 })}
                    </Text>
                  )}
                </VStack>
              </Box>

              <Text fontSize="sm" color={colors.textColorSecondary}>
                {t('postApprovalActions.closeConfirmation.retryHint')}
              </Text>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer borderTop="1px solid" borderColor={colors.borderColor} py={4}>
            <HStack justify="space-between" w="full">
              <Button variant="ghost" onClick={cancelClose}>
                {t('postApprovalActions.closeConfirmation.stayButton')}
              </Button>
              <Button colorPalette="orange" onClick={handleCloseConfirmed}>
                <FiX />
                {t('postApprovalActions.closeConfirmation.closeButton')}
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
    </>
  );
};

export default PostApprovalActionsDialog;
