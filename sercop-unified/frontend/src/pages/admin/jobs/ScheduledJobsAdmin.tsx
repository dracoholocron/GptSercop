/**
 * Scheduled Jobs Administration Page
 * Manage and monitor scheduled background jobs
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Badge,
  Input,
  Spinner,
  Card,
  Grid,
  Tabs,
  Separator,
  Textarea,
} from '@chakra-ui/react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogTitle,
  DialogBackdrop,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  FiClock,
  FiPlay,
  FiPause,
  FiRefreshCw,
  FiSettings,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiActivity,
  FiList,
  FiInbox,
  FiTrash2,
  FiEye,
  FiRotateCcw,
  FiArchive,
  FiEdit2,
  FiPlus,
  FiCloud,
  FiServer,
  FiCode,
  FiDatabase,
} from 'react-icons/fi';
import { toaster } from '../../../components/ui/toaster';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { scheduledJobService } from '../../../services/scheduledJobService';
import { get } from '../../../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../../../config/api.config';
import { DataTable, type DataTableColumn, type DataTableAction } from '../../../components/ui/DataTable';
import type {
  ScheduledJob,
  ExecutionLog,
  DeadLetter,
  JobStatistics,
  JobType,
  ScheduleType,
  CreateScheduledJobCommand,
  UpdateScheduledJobCommand,
} from '../../../types/scheduledJobs';

// External API Config type
interface ExternalApiConfig {
  id: number;
  code: string;
  name: string;
  description?: string;
  active: boolean;
}

type TabType = 'jobs' | 'running' | 'history' | 'deadLetter';

export default function ScheduledJobsAdmin() {
  const { t } = useTranslation();
  const { colors, colorMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('jobs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Jobs tab state
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [jobsPage, setJobsPage] = useState(0);
  const [jobsTotalPages, setJobsTotalPages] = useState(0);
  const [jobsTotalElements, setJobsTotalElements] = useState(0);
  const [jobsPageSize, setJobsPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<JobType | ''>('');
  const [filterEnabled, setFilterEnabled] = useState<boolean | undefined>(undefined);

  // Running tab state
  const [runningJobs, setRunningJobs] = useState<ScheduledJob[]>([]);
  const [runningExecutions, setRunningExecutions] = useState<ExecutionLog[]>([]);

  // History tab state
  const [executions, setExecutions] = useState<ExecutionLog[]>([]);
  const [executionsPage, setExecutionsPage] = useState(0);
  const [executionsTotalPages, setExecutionsTotalPages] = useState(0);
  const [executionsTotalElements, setExecutionsTotalElements] = useState(0);
  const [executionsPageSize, setExecutionsPageSize] = useState(20);
  const [executionFilterJob, setExecutionFilterJob] = useState('');
  const [executionFilterStatus, setExecutionFilterStatus] = useState('');

  // Dead Letter tab state
  const [deadLetters, setDeadLetters] = useState<DeadLetter[]>([]);
  const [deadLettersPage, setDeadLettersPage] = useState(0);
  const [deadLettersTotalPages, setDeadLettersTotalPages] = useState(0);
  const [deadLettersTotalElements, setDeadLettersTotalElements] = useState(0);
  const [deadLettersPageSize, setDeadLettersPageSize] = useState(20);

  // Statistics
  const [statistics, setStatistics] = useState<JobStatistics | null>(null);

  // Modals
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<ExecutionLog | null>(null);
  const [selectedDeadLetter, setSelectedDeadLetter] = useState<DeadLetter | null>(null);
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);
  const [isExecutionDetailOpen, setIsExecutionDetailOpen] = useState(false);
  const [isDeadLetterDetailOpen, setIsDeadLetterDetailOpen] = useState(false);

  // Edit/Create modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingJob, setEditingJob] = useState<ScheduledJob | null>(null);
  const [editForm, setEditForm] = useState<CreateScheduledJobCommand | UpdateScheduledJobCommand>({});
  const [isSaving, setIsSaving] = useState(false);

  // External API configs for dropdown
  const [externalApis, setExternalApis] = useState<ExternalApiConfig[]>([]);

  // Load jobs
  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await scheduledJobService.listJobs({
        search: searchTerm || undefined,
        jobType: filterType || undefined,
        enabled: filterEnabled,
        page: jobsPage,
        size: jobsPageSize,
      });
      setJobs(response.data || []);
      setJobsTotalPages(response.totalPages || 0);
      setJobsTotalElements(response.totalElements || 0);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Error loading scheduled jobs');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterType, filterEnabled, jobsPage, jobsPageSize]);

  // Load running jobs
  const loadRunningJobs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await scheduledJobService.getRunningJobs();
      setRunningJobs(response.data?.jobs || []);
      setRunningExecutions(response.data?.executions || []);
    } catch (err) {
      console.error('Error loading running jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load execution history
  const loadExecutions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await scheduledJobService.getAllExecutions({
        page: executionsPage,
        size: executionsPageSize,
        jobCode: executionFilterJob || undefined,
        status: executionFilterStatus || undefined,
      });
      setExecutions(response.data || []);
      setExecutionsTotalPages(response.totalPages || 0);
      setExecutionsTotalElements(response.totalElements || 0);
    } catch (err) {
      console.error('Error loading executions:', err);
    } finally {
      setLoading(false);
    }
  }, [executionsPage, executionsPageSize, executionFilterJob, executionFilterStatus]);

  // Load dead letters
  const loadDeadLetters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await scheduledJobService.getDeadLetterQueue({
        page: deadLettersPage,
        size: deadLettersPageSize,
      });
      console.log('Dead letters response:', response);
      setDeadLetters(response.data || []);
      setDeadLettersTotalPages(response.totalPages || 0);
      setDeadLettersTotalElements(response.totalElements || 0);
    } catch (err) {
      console.error('Error loading dead letters:', err);
      toaster.create({
        title: 'Error loading dead letters',
        description: String(err),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [deadLettersPage, deadLettersPageSize]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const response = await scheduledJobService.getOverallStatistics();
      setStatistics(response.data || null);
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  }, []);

  // Load external APIs for dropdown
  const loadExternalApis = useCallback(async () => {
    try {
      const response = await get(`${API_BASE_URL}/admin/external-api/queries`);
      if (response.ok) {
        const result = await response.json();
        setExternalApis(result.data || []);
      }
    } catch (err) {
      console.error('Error loading external APIs:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadStatistics();
    loadExternalApis();
    loadJobs(); // Load jobs for filter dropdown
  }, [loadStatistics, loadExternalApis, loadJobs]);

  // Load data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case 'jobs':
        loadJobs();
        break;
      case 'running':
        loadRunningJobs();
        break;
      case 'history':
        loadExecutions();
        break;
      case 'deadLetter':
        loadDeadLetters();
        break;
    }
  }, [activeTab, loadJobs, loadRunningJobs, loadExecutions, loadDeadLetters]);

  // Trigger job manually
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);

  const handleTriggerJob = async (code: string) => {
    setTriggeringJob(code);
    try {
      const result = await scheduledJobService.triggerJob(code, {});
      console.log('Trigger result:', result);
      toaster.create({
        title: t('scheduledJobs.messages.triggered'),
        description: `Job ${code} ejecutado. ID: ${result.data?.executionId || 'N/A'}`,
        type: 'success',
        duration: 5000,
      });
      // Refresh data after a short delay to allow execution to complete
      setTimeout(() => {
        loadExecutions();
        loadStatistics();
      }, 2000);
    } catch (err: any) {
      console.error('Trigger error:', err);
      toaster.create({
        title: t('scheduledJobs.messages.triggerError'),
        description: err?.message || 'Error desconocido',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setTriggeringJob(null);
    }
  };

  // Toggle job enabled/disabled
  const handleToggleJob = async (code: string, currentEnabled: boolean) => {
    try {
      await scheduledJobService.toggleJob(code);
      toaster.create({
        title: currentEnabled
          ? t('scheduledJobs.messages.disabled')
          : t('scheduledJobs.messages.enabled'),
        type: 'success',
      });
      loadJobs();
      loadStatistics();
    } catch (err) {
      toaster.create({
        title: t('scheduledJobs.messages.toggleError'),
        type: 'error',
      });
    }
  };

  // Retry dead letter
  const handleRetryDeadLetter = async (id: number) => {
    try {
      await scheduledJobService.retryDeadLetter(id, {});
      toaster.create({
        title: t('scheduledJobs.messages.retryQueued'),
        type: 'success',
      });
      loadDeadLetters();
      loadStatistics();
    } catch (err) {
      toaster.create({
        title: t('scheduledJobs.messages.retryError'),
        type: 'error',
      });
    }
  };

  // Abandon dead letter
  const handleAbandonDeadLetter = async (id: number) => {
    try {
      await scheduledJobService.abandonDeadLetter(id, { reason: 'Manually abandoned' });
      toaster.create({
        title: t('scheduledJobs.messages.abandoned'),
        type: 'success',
      });
      loadDeadLetters();
      loadStatistics();
    } catch (err) {
      toaster.create({
        title: t('scheduledJobs.messages.abandonError'),
        type: 'error',
      });
    }
  };

  // Open create modal
  const handleOpenCreateModal = () => {
    setIsCreateMode(true);
    setEditingJob(null);
    setEditForm({
      code: '',
      name: '',
      description: '',
      jobType: 'EXTERNAL_API',
      scheduleType: 'CRON',
      cronExpression: '0 0 * * * *',
      timezone: 'America/Chicago',
      isEnabled: true,
      retryOnFailure: true,
      maxRetries: 3,
      retryDelaySeconds: 60,
      timeoutSeconds: 300,
      alertOnFailure: true,
      alertEmailRecipients: '',
      externalApiConfigCode: '',
      serviceBeanName: '',
      serviceMethodName: '',
      jobParameters: '',
    });
    setIsEditModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (job: ScheduledJob) => {
    setIsCreateMode(false);
    setEditingJob(job);
    setEditForm({
      name: job.name,
      description: job.description || '',
      jobType: job.jobType,
      scheduleType: job.scheduleType,
      cronExpression: job.cronExpression || '',
      fixedRateMs: job.fixedRateMs,
      fixedDelayMs: job.fixedDelayMs,
      initialDelayMs: job.initialDelayMs,
      timezone: job.timezone || 'America/Chicago',
      isEnabled: job.isEnabled,
      retryOnFailure: job.retryOnFailure,
      maxRetries: job.maxRetries,
      retryDelaySeconds: job.retryDelaySeconds,
      timeoutSeconds: job.timeoutSeconds,
      alertOnFailure: job.alertOnFailure,
      alertEmailRecipients: job.alertEmailRecipients || '',
      externalApiConfigCode: job.externalApiConfigCode || '',
      serviceBeanName: job.serviceBeanName || '',
      serviceMethodName: job.serviceMethodName || '',
      jobParameters: job.jobParameters || '',
    });
    setIsEditModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingJob(null);
    setIsCreateMode(false);
    setEditForm({});
  };

  // Save job (create or update)
  const handleSaveJob = async () => {
    setIsSaving(true);
    try {
      if (isCreateMode) {
        // Validate required fields for create
        const createForm = editForm as CreateScheduledJobCommand;
        if (!createForm.code || !createForm.name) {
          toaster.create({
            title: t('scheduledJobs.messages.validationError'),
            description: t('scheduledJobs.messages.codeNameRequired'),
            type: 'error',
          });
          setIsSaving(false);
          return;
        }
        await scheduledJobService.createJob(createForm);
        toaster.create({
          title: t('scheduledJobs.messages.created'),
          type: 'success',
        });
      } else {
        if (!editingJob) return;
        await scheduledJobService.updateJob(editingJob.code, editForm as UpdateScheduledJobCommand);
        toaster.create({
          title: t('scheduledJobs.messages.updated'),
          type: 'success',
        });
      }
      handleCloseModal();
      loadJobs();
      loadStatistics();
    } catch (err: any) {
      toaster.create({
        title: isCreateMode ? t('scheduledJobs.messages.createError') : t('scheduledJobs.messages.updateError'),
        description: err?.message || '',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      SUCCESS: 'green',
      FAILED: 'red',
      RUNNING: 'blue',
      PENDING: 'gray',
      SKIPPED: 'yellow',
      TIMEOUT: 'orange',
    };
    return (
      <Badge colorPalette={statusColors[status] || 'gray'}>
        {status}
      </Badge>
    );
  };

  // Job type badge
  const getJobTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      INTERNAL_SERVICE: 'purple',
      EXTERNAL_API: 'blue',
      RULE_ENGINE: 'orange',
      SQL_QUERY: 'teal',
    };
    return (
      <Badge colorPalette={typeColors[type] || 'gray'} size="sm">
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  // ========== DataTable column definitions ==========

  // Jobs tab columns
  const jobsColumns = useMemo<DataTableColumn<ScheduledJob>[]>(() => [
    {
      key: 'name',
      label: t('scheduledJobs.columns.name'),
      filterable: false,
      render: (job) => (
        <VStack align="start" gap={1}>
          <HStack>
            <Text fontWeight="medium">{job.name}</Text>
            {job.isEnabled ? (
              <Badge colorPalette="green" size="sm">{t('scheduledJobs.active')}</Badge>
            ) : (
              <Badge colorPalette="gray" size="sm">{t('scheduledJobs.disabled')}</Badge>
            )}
            {job.isSystemJob && (
              <Badge colorPalette="purple" size="sm">{t('scheduledJobs.system')}</Badge>
            )}
          </HStack>
          <Text fontSize="xs" color="gray.500">{job.code}</Text>
        </VStack>
      ),
    },
    {
      key: 'jobType',
      label: t('scheduledJobs.columns.type'),
      filterable: false,
      render: (job) => getJobTypeBadge(job.jobType),
    },
    {
      key: 'cronExpression',
      label: t('scheduledJobs.columns.schedule'),
      filterable: false,
      render: (job) => (
        <Text fontSize="sm">
          {job.scheduleType === 'CRON' && `Cron: ${job.cronExpression}`}
          {job.scheduleType === 'FIXED_RATE' && `Every ${job.fixedRateMs}ms`}
          {job.scheduleType === 'FIXED_DELAY' && `Delay: ${job.fixedDelayMs}ms`}
        </Text>
      ),
    },
    {
      key: 'lastExecutionStatus',
      label: t('scheduledJobs.columns.lastStatus'),
      filterable: false,
      render: (job) => getStatusBadge(job.lastExecutionStatus || 'PENDING'),
    },
    {
      key: 'nextExecutionAt',
      label: t('scheduledJobs.columns.nextRun'),
      filterable: false,
      render: (job) => (
        <Text fontSize="sm">
          {job.nextExecutionAt ? new Date(job.nextExecutionAt).toLocaleString() : '-'}
        </Text>
      ),
    },
  ], [t]);

  // Jobs tab actions (using render for complex trigger button)
  const jobsActionsColumn = useMemo<DataTableColumn<ScheduledJob>>(() => ({
    key: '_actions',
    label: t('scheduledJobs.columns.actions'),
    sortable: false,
    filterable: false,
    render: (job) => (
      <HStack gap={1}>
        <Button
          size="xs"
          variant="ghost"
          colorPalette="green"
          onClick={() => handleTriggerJob(job.code)}
          title={t('scheduledJobs.actions.trigger')}
          aria-label="Trigger"
          disabled={triggeringJob === job.code}
        >
          {triggeringJob === job.code ? <Spinner size="sm" /> : <FiPlay />}
        </Button>
        <Button
          size="xs"
          variant="ghost"
          colorPalette={job.isEnabled ? 'orange' : 'green'}
          onClick={() => handleToggleJob(job.code, job.isEnabled)}
          title={job.isEnabled ? t('scheduledJobs.actions.disable') : t('scheduledJobs.actions.enable')}
          aria-label="Toggle"
        >
          {job.isEnabled ? <FiPause /> : <FiPlay />}
        </Button>
        <Button
          size="xs"
          variant="ghost"
          colorPalette="blue"
          onClick={() => handleOpenEditModal(job)}
          title={t('scheduledJobs.actions.edit')}
          aria-label="Edit"
          disabled={job.isSystemJob}
        >
          <FiEdit2 />
        </Button>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => {
            setSelectedJob(job);
            setIsJobDetailOpen(true);
          }}
          title={t('scheduledJobs.actions.viewDetails')}
          aria-label="View"
        >
          <FiEye />
        </Button>
      </HStack>
    ),
  }), [t, triggeringJob]);

  const allJobsColumns = useMemo(() => [...jobsColumns, jobsActionsColumn], [jobsColumns, jobsActionsColumn]);

  // Running tab columns
  const runningColumns = useMemo<DataTableColumn<ExecutionLog>[]>(() => [
    {
      key: 'jobCode',
      label: t('scheduledJobs.columns.job'),
      render: (exec) => <Text fontWeight="medium">{exec.jobCode}</Text>,
    },
    {
      key: 'executionId',
      label: t('scheduledJobs.columns.executionId'),
      render: (exec) => <Text fontSize="xs" fontFamily="mono">{exec.executionId}</Text>,
    },
    {
      key: 'startedAt',
      label: t('scheduledJobs.columns.startedAt'),
      render: (exec) => <Text fontSize="sm">{new Date(exec.startedAt).toLocaleString()}</Text>,
    },
    {
      key: 'durationMs',
      label: t('scheduledJobs.columns.duration'),
      render: (exec) => (
        <HStack>
          <Spinner size="sm" />
          <Text fontSize="sm">
            {exec.durationMs ? `${exec.durationMs}ms` : t('scheduledJobs.inProgress')}
          </Text>
        </HStack>
      ),
    },
    {
      key: 'status',
      label: t('scheduledJobs.columns.status'),
      render: (exec) => getStatusBadge(exec.status),
    },
  ], [t]);

  // History tab columns
  const historyColumns = useMemo<DataTableColumn<ExecutionLog>[]>(() => [
    {
      key: 'jobCode',
      label: t('scheduledJobs.columns.job'),
      filterable: false,
      render: (exec) => <Text fontWeight="medium">{exec.jobCode}</Text>,
    },
    {
      key: 'status',
      label: t('scheduledJobs.columns.status'),
      filterable: false,
      render: (exec) => getStatusBadge(exec.status),
    },
    {
      key: 'triggeredBy',
      label: t('scheduledJobs.columns.triggeredBy'),
      filterable: false,
      render: (exec) => (
        <Badge colorPalette={exec.triggeredBy === 'MANUAL' ? 'blue' : 'gray'} size="sm">
          {exec.triggeredBy}
        </Badge>
      ),
    },
    {
      key: 'startedAt',
      label: t('scheduledJobs.columns.startedAt'),
      filterable: false,
      render: (exec) => <Text fontSize="sm">{new Date(exec.startedAt).toLocaleString()}</Text>,
    },
    {
      key: 'durationMs',
      label: t('scheduledJobs.columns.duration'),
      filterable: false,
      render: (exec) => <Text fontSize="sm">{exec.durationMs ? `${exec.durationMs}ms` : '-'}</Text>,
    },
    {
      key: 'itemsProcessed',
      label: t('scheduledJobs.columns.items'),
      filterable: false,
      render: (exec) =>
        exec.itemsProcessed !== undefined ? (
          <Text fontSize="sm">{exec.itemsSuccess}/{exec.itemsProcessed}</Text>
        ) : null,
    },
  ], [t]);

  // History tab actions
  const historyActions = useMemo<DataTableAction<ExecutionLog>[]>(() => [
    {
      key: 'view',
      label: t('scheduledJobs.actions.viewDetails'),
      icon: FiEye,
      onClick: (exec) => {
        setSelectedExecution(exec);
        setIsExecutionDetailOpen(true);
      },
    },
  ], [t]);

  // Dead Letter tab columns
  const deadLetterColumns = useMemo<DataTableColumn<DeadLetter>[]>(() => [
    {
      key: 'jobCode',
      label: t('scheduledJobs.columns.job'),
      render: (dl) => <Text fontWeight="medium">{dl.jobCode}</Text>,
    },
    {
      key: 'status',
      label: t('scheduledJobs.columns.status'),
      filterType: 'select',
      filterOptions: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'RETRYING', label: 'Retrying' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'ABANDONED', label: 'Abandoned' },
      ],
      render: (dl) => getStatusBadge(dl.status),
    },
    {
      key: 'errorMessage',
      label: t('scheduledJobs.columns.error'),
      render: (dl) => (
        <Text fontSize="sm" noOfLines={1} maxW="300px">
          {dl.errorMessage}
        </Text>
      ),
    },
    {
      key: 'retryCount',
      label: t('scheduledJobs.columns.retries'),
      render: (dl) => <Text fontSize="sm">{dl.retryCount}</Text>,
    },
    {
      key: 'createdAt',
      label: t('scheduledJobs.columns.createdAt'),
      render: (dl) => <Text fontSize="sm">{dl.createdAt ? new Date(dl.createdAt).toLocaleString() : '-'}</Text>,
    },
  ], [t]);

  // Dead Letter tab actions column (complex: conditional buttons)
  const deadLetterActionsColumn = useMemo<DataTableColumn<DeadLetter>>(() => ({
    key: '_actions',
    label: t('scheduledJobs.columns.actions'),
    sortable: false,
    filterable: false,
    render: (dl) => (
      <HStack gap={1}>
        {dl.status === 'PENDING' && (
          <>
            <Button
              size="xs"
              colorPalette="blue"
              onClick={() => handleRetryDeadLetter(dl.id)}
            >
              <FiRotateCcw />
              <Text ml={1}>{t('scheduledJobs.actions.retry')}</Text>
            </Button>
            <Button
              size="xs"
              colorPalette="red"
              variant="outline"
              onClick={() => handleAbandonDeadLetter(dl.id)}
            >
              <FiArchive />
              <Text ml={1}>{t('scheduledJobs.actions.abandon')}</Text>
            </Button>
          </>
        )}
        <Button
          size="xs"
          variant="ghost"
          onClick={() => {
            setSelectedDeadLetter(dl);
            setIsDeadLetterDetailOpen(true);
          }}
          aria-label="View"
        >
          <FiEye />
        </Button>
      </HStack>
    ),
  }), [t]);

  const allDeadLetterColumns = useMemo(() => [...deadLetterColumns, deadLetterActionsColumn], [deadLetterColumns, deadLetterActionsColumn]);

  const cardBg = colorMode === 'dark' ? 'gray.800' : 'white';
  const borderColor = colorMode === 'dark' ? 'gray.700' : 'gray.200';

  return (
    <Box p={6}>
      {/* Header */}
      <VStack align="stretch" gap={6}>
        <HStack justify="space-between">
          <VStack align="start" gap={1}>
            <HStack>
              <FiClock size={24} />
              <Heading size="lg">{t('scheduledJobs.title')}</Heading>
            </HStack>
            <Text color="gray.500">{t('scheduledJobs.subtitle')}</Text>
          </VStack>
          <Button colorPalette="blue" onClick={handleOpenCreateModal}>
            <FiPlus />
            <Text ml={2}>{t('scheduledJobs.createJob')}</Text>
          </Button>
        </HStack>

        {/* Statistics Cards */}
        {statistics && (
          <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
            <Card.Root bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <Card.Body>
                <HStack justify="space-between">
                  <VStack align="start" gap={1}>
                    <Text fontSize="sm" color="gray.500">{t('scheduledJobs.stats.totalJobs')}</Text>
                    <Heading size="xl">{statistics.totalJobs}</Heading>
                    <Text fontSize="xs" color="gray.400">
                      {statistics.enabledJobs} {t('scheduledJobs.stats.enabled')} / {statistics.disabledJobs} {t('scheduledJobs.stats.disabled')}
                    </Text>
                  </VStack>
                  <Box p={3} bg="blue.100" borderRadius="full">
                    <FiList size={24} color="var(--chakra-colors-blue-500)" />
                  </Box>
                </HStack>
              </Card.Body>
            </Card.Root>

            <Card.Root bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <Card.Body>
                <HStack justify="space-between">
                  <VStack align="start" gap={1}>
                    <Text fontSize="sm" color="gray.500">{t('scheduledJobs.stats.running')}</Text>
                    <Heading size="xl">{statistics.currentlyRunning}</Heading>
                    <Text fontSize="xs" color="gray.400">
                      {statistics.executionsToday} {t('scheduledJobs.stats.executionsToday')}
                    </Text>
                  </VStack>
                  <Box p={3} bg="blue.100" borderRadius="full">
                    <FiActivity size={24} color="var(--chakra-colors-blue-500)" />
                  </Box>
                </HStack>
              </Card.Body>
            </Card.Root>

            <Card.Root bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <Card.Body>
                <HStack justify="space-between">
                  <VStack align="start" gap={1}>
                    <Text fontSize="sm" color="gray.500">{t('scheduledJobs.stats.successRate')}</Text>
                    <Heading size="xl">{statistics.successRateToday?.toFixed(1) || 0}%</Heading>
                    <Text fontSize="xs" color="gray.400">
                      {statistics.successesToday || 0} / {statistics.executionsToday || 0} {t('scheduledJobs.stats.today')}
                    </Text>
                  </VStack>
                  <Box p={3} bg="green.100" borderRadius="full">
                    <FiCheckCircle size={24} color="var(--chakra-colors-green-500)" />
                  </Box>
                </HStack>
              </Card.Body>
            </Card.Root>

            <Card.Root bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <Card.Body>
                <HStack justify="space-between">
                  <VStack align="start" gap={1}>
                    <Text fontSize="sm" color="gray.500">{t('scheduledJobs.stats.deadLetters')}</Text>
                    <Heading size="xl">{statistics.pendingDeadLetters || 0}</Heading>
                    <Text fontSize="xs" color="gray.400">{t('scheduledJobs.stats.pendingResolution')}</Text>
                  </VStack>
                  <Box p={3} bg={statistics.pendingDeadLetters ? 'red.100' : 'gray.100'} borderRadius="full">
                    <FiAlertTriangle size={24} color={statistics.pendingDeadLetters ? 'var(--chakra-colors-red-500)' : 'var(--chakra-colors-gray-400)'} />
                  </Box>
                </HStack>
              </Card.Body>
            </Card.Root>
          </Grid>
        )}

        {/* Error Alert */}
        {error && (
          <Card.Root bg="red.50" borderColor="red.200" borderWidth="1px">
            <Card.Body>
              <HStack>
                <FiXCircle color="red" />
                <Text color="red.600">{error}</Text>
                <Button size="sm" variant="ghost" onClick={() => setError(null)}>
                  {t('common.dismiss')}
                </Button>
              </HStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value as TabType)}>
          <Tabs.List>
            <Tabs.Trigger value="jobs">
              <HStack gap={2}>
                <FiSettings size={16} />
                <Text>{t('scheduledJobs.tabs.configurations')}</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="running">
              <HStack gap={2}>
                <FiActivity size={16} />
                <Text>{t('scheduledJobs.tabs.running')}</Text>
                {statistics?.currentlyRunning ? (
                  <Badge colorPalette="blue" size="sm">{statistics.currentlyRunning}</Badge>
                ) : null}
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="history">
              <HStack gap={2}>
                <FiClock size={16} />
                <Text>{t('scheduledJobs.tabs.history')}</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="deadLetter">
              <HStack gap={2}>
                <FiInbox size={16} />
                <Text>{t('scheduledJobs.tabs.deadLetter')}</Text>
                {statistics?.pendingDeadLetters ? (
                  <Badge colorPalette="red" size="sm">{statistics.pendingDeadLetters}</Badge>
                ) : null}
              </HStack>
            </Tabs.Trigger>
          </Tabs.List>

          {/* Jobs Tab Content */}
          <Tabs.Content value="jobs">
            <Card.Root mt={4} bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <Card.Body>
                <DataTable<ScheduledJob>
                  data={jobs}
                  columns={allJobsColumns}
                  rowKey={(job) => job.code}
                  isLoading={loading}
                  emptyMessage={t('scheduledJobs.noJobs')}
                  emptyIcon={FiSettings}
                  searchable={false}
                  pagination="server"
                  defaultPageSize={jobsPageSize}
                  serverPagination={{
                    totalItems: jobsTotalElements,
                    currentPage: jobsPage,
                    pageSize: jobsPageSize,
                    onPageChange: (page) => setJobsPage(page),
                    onPageSizeChange: (size) => {
                      setJobsPageSize(size);
                      setJobsPage(0);
                    },
                  }}
                  toolbarRight={
                    <HStack gap={4} flexWrap="wrap">
                      <Input
                        placeholder={t('scheduledJobs.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        width="250px"
                        size="sm"
                      />
                      <NativeSelectRoot width="180px" size="sm">
                        <NativeSelectField
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value as JobType | '')}
                        >
                          <option value="">{t('scheduledJobs.filters.allTypes')}</option>
                          <option value="INTERNAL_SERVICE">{t('scheduledJobs.jobTypes.internalService')}</option>
                          <option value="EXTERNAL_API">{t('scheduledJobs.jobTypes.externalApi')}</option>
                          <option value="RULE_ENGINE">{t('scheduledJobs.jobTypes.ruleEngine')}</option>
                          <option value="SQL_QUERY">{t('scheduledJobs.jobTypes.sqlQuery')}</option>
                        </NativeSelectField>
                      </NativeSelectRoot>
                      <NativeSelectRoot width="150px" size="sm">
                        <NativeSelectField
                          value={filterEnabled === undefined ? '' : String(filterEnabled)}
                          onChange={(e) => setFilterEnabled(e.target.value === '' ? undefined : e.target.value === 'true')}
                        >
                          <option value="">{t('scheduledJobs.filters.allStatus')}</option>
                          <option value="true">{t('scheduledJobs.filters.enabled')}</option>
                          <option value="false">{t('scheduledJobs.filters.disabled')}</option>
                        </NativeSelectField>
                      </NativeSelectRoot>
                      <Button onClick={loadJobs} variant="outline" size="sm">
                        <FiRefreshCw />
                        <Text ml={2}>{t('common.refresh')}</Text>
                      </Button>
                    </HStack>
                  }
                />
              </Card.Body>
            </Card.Root>
          </Tabs.Content>

          {/* Running Tab Content */}
          <Tabs.Content value="running">
            <Card.Root mt={4} bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <Card.Body>
                <DataTable<ExecutionLog>
                  data={runningExecutions}
                  columns={runningColumns}
                  rowKey={(exec) => exec.executionId}
                  isLoading={loading}
                  emptyMessage={t('scheduledJobs.noRunningJobs')}
                  emptyIcon={FiActivity}
                  pagination="none"
                  searchable={false}
                  toolbarRight={
                    <Button onClick={loadRunningJobs} variant="outline" size="sm">
                      <FiRefreshCw />
                      <Text ml={2}>{t('common.refresh')}</Text>
                    </Button>
                  }
                />
              </Card.Body>
            </Card.Root>
          </Tabs.Content>

          {/* History Tab Content */}
          <Tabs.Content value="history">
            <Card.Root mt={4} bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <Card.Body>
                <DataTable<ExecutionLog>
                  data={executions}
                  columns={historyColumns}
                  rowKey={(exec) => exec.executionId}
                  actions={historyActions}
                  isLoading={loading}
                  emptyMessage={t('scheduledJobs.noExecutions')}
                  emptyIcon={FiClock}
                  searchable={false}
                  pagination="server"
                  defaultPageSize={executionsPageSize}
                  serverPagination={{
                    totalItems: executionsTotalElements,
                    currentPage: executionsPage,
                    pageSize: executionsPageSize,
                    onPageChange: (page) => setExecutionsPage(page),
                    onPageSizeChange: (size) => {
                      setExecutionsPageSize(size);
                      setExecutionsPage(0);
                    },
                  }}
                  toolbarRight={
                    <HStack gap={4} flexWrap="wrap">
                      <NativeSelectRoot width="200px" size="sm">
                        <NativeSelectField
                          value={executionFilterJob}
                          onChange={(e) => {
                            setExecutionFilterJob(e.target.value);
                            setExecutionsPage(0);
                          }}
                        >
                          <option value="">{t('scheduledJobs.filters.allJobs')}</option>
                          {jobs.map((job) => (
                            <option key={job.code} value={job.code}>
                              {job.name}
                            </option>
                          ))}
                        </NativeSelectField>
                      </NativeSelectRoot>
                      <NativeSelectRoot width="150px" size="sm">
                        <NativeSelectField
                          value={executionFilterStatus}
                          onChange={(e) => {
                            setExecutionFilterStatus(e.target.value);
                            setExecutionsPage(0);
                          }}
                        >
                          <option value="">{t('scheduledJobs.filters.allStatus')}</option>
                          <option value="SUCCESS">{t('scheduledJobs.status.success')}</option>
                          <option value="FAILED">{t('scheduledJobs.status.failed')}</option>
                          <option value="RUNNING">{t('scheduledJobs.status.running')}</option>
                          <option value="TIMEOUT">{t('scheduledJobs.status.timeout')}</option>
                          <option value="SKIPPED">{t('scheduledJobs.status.skipped')}</option>
                        </NativeSelectField>
                      </NativeSelectRoot>
                      <Button onClick={loadExecutions} variant="outline" size="sm">
                        <FiRefreshCw />
                        <Text ml={2}>{t('common.refresh')}</Text>
                      </Button>
                      {(executionFilterJob || executionFilterStatus) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setExecutionFilterJob('');
                            setExecutionFilterStatus('');
                            setExecutionsPage(0);
                          }}
                        >
                          <FiXCircle />
                          <Text ml={1}>{t('common.clearFilters')}</Text>
                        </Button>
                      )}
                    </HStack>
                  }
                />
              </Card.Body>
            </Card.Root>
          </Tabs.Content>

          {/* Dead Letter Tab Content */}
          <Tabs.Content value="deadLetter">
            <Card.Root mt={4} bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <Card.Body>
                <DataTable<DeadLetter>
                  data={deadLetters}
                  columns={allDeadLetterColumns}
                  rowKey={(dl) => String(dl.id)}
                  isLoading={loading}
                  emptyMessage={t('scheduledJobs.noDeadLetters')}
                  emptyIcon={FiCheckCircle}
                  pagination="server"
                  defaultPageSize={deadLettersPageSize}
                  serverPagination={{
                    totalItems: deadLettersTotalElements,
                    currentPage: deadLettersPage,
                    pageSize: deadLettersPageSize,
                    onPageChange: (page) => setDeadLettersPage(page),
                    onPageSizeChange: (size) => {
                      setDeadLettersPageSize(size);
                      setDeadLettersPage(0);
                    },
                  }}
                  toolbarRight={
                    <Button onClick={loadDeadLetters} variant="outline" size="sm">
                      <FiRefreshCw />
                      <Text ml={2}>{t('common.refresh')}</Text>
                    </Button>
                  }
                />
              </Card.Body>
            </Card.Root>
          </Tabs.Content>
        </Tabs.Root>
      </VStack>

      {/* Job Detail Modal */}
      <DialogRoot open={isJobDetailOpen} onOpenChange={(e) => setIsJobDetailOpen(e.open)}>
        <DialogBackdrop bg="rgba(0, 0, 0, 0.6)" />
        <DialogContent
          maxW="600px"
          bg={cardBg}
          borderColor={borderColor}
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={1400}
          borderRadius="lg"
          boxShadow="xl"
        >
          <DialogHeader>
            <DialogTitle>{selectedJob?.name}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            {selectedJob && (
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between">
                  <Text fontWeight="medium">{t('scheduledJobs.details.code')}</Text>
                  <Text fontFamily="mono">{selectedJob.code}</Text>
                </HStack>
                <Separator />
                <HStack justify="space-between">
                  <Text fontWeight="medium">{t('scheduledJobs.details.type')}</Text>
                  {getJobTypeBadge(selectedJob.jobType)}
                </HStack>
                <Separator />
                <HStack justify="space-between">
                  <Text fontWeight="medium">{t('scheduledJobs.details.schedule')}</Text>
                  <Text>
                    {selectedJob.scheduleType === 'CRON' && selectedJob.cronExpression}
                    {selectedJob.scheduleType === 'FIXED_RATE' && `Every ${selectedJob.fixedRateMs}ms`}
                    {selectedJob.scheduleType === 'FIXED_DELAY' && `Delay: ${selectedJob.fixedDelayMs}ms`}
                  </Text>
                </HStack>
                <Separator />
                <HStack justify="space-between">
                  <Text fontWeight="medium">{t('scheduledJobs.details.status')}</Text>
                  <HStack>
                    {selectedJob.isEnabled ? (
                      <Badge colorPalette="green">{t('scheduledJobs.active')}</Badge>
                    ) : (
                      <Badge colorPalette="gray">{t('scheduledJobs.disabled')}</Badge>
                    )}
                    {selectedJob.isSystemJob && (
                      <Badge colorPalette="purple">{t('scheduledJobs.system')}</Badge>
                    )}
                  </HStack>
                </HStack>
                <Separator />
                <VStack align="start" gap={1}>
                  <Text fontWeight="medium">{t('scheduledJobs.details.description')}</Text>
                  <Text fontSize="sm" color="gray.600">{selectedJob.description || '-'}</Text>
                </VStack>
                <Separator />
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <VStack align="start">
                    <Text fontSize="sm" color="gray.500">{t('scheduledJobs.details.lastExecution')}</Text>
                    <Text fontSize="sm">
                      {selectedJob.lastExecutionAt
                        ? new Date(selectedJob.lastExecutionAt).toLocaleString()
                        : '-'}
                    </Text>
                  </VStack>
                  <VStack align="start">
                    <Text fontSize="sm" color="gray.500">{t('scheduledJobs.details.nextExecution')}</Text>
                    <Text fontSize="sm">
                      {selectedJob.nextExecutionAt
                        ? new Date(selectedJob.nextExecutionAt).toLocaleString()
                        : '-'}
                    </Text>
                  </VStack>
                  <VStack align="start">
                    <Text fontSize="sm" color="gray.500">{t('scheduledJobs.details.totalExecutions')}</Text>
                    <Text fontSize="sm">{selectedJob.totalExecutions || 0}</Text>
                  </VStack>
                  <VStack align="start">
                    <Text fontSize="sm" color="gray.500">{t('scheduledJobs.details.successRate')}</Text>
                    <Text fontSize="sm">
                      {selectedJob.totalExecutions
                        ? `${((selectedJob.totalSuccesses / selectedJob.totalExecutions) * 100).toFixed(1)}%`
                        : '-'}
                    </Text>
                  </VStack>
                </Grid>
              </VStack>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJobDetailOpen(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Execution Detail Modal */}
      <DialogRoot open={isExecutionDetailOpen} onOpenChange={(e) => setIsExecutionDetailOpen(e.open)}>
        <DialogBackdrop bg="rgba(0, 0, 0, 0.6)" />
        <DialogContent
          width={{ base: "95vw", md: "800px" }}
          maxH="90vh"
          bg={cardBg}
          borderColor={borderColor}
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={1400}
          borderRadius="lg"
          boxShadow="xl"
          overflowY="auto"
        >
          <DialogHeader>
            <DialogTitle>{t('scheduledJobs.executionDetails')}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            {selectedExecution && (
              <VStack align="stretch" gap={4}>
                {/* Basic Info */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                  <HStack justify="space-between">
                    <Text fontWeight="medium">{t('scheduledJobs.columns.job')}</Text>
                    <Text fontFamily="mono">{selectedExecution.jobCode}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontWeight="medium">{t('scheduledJobs.columns.status')}</Text>
                    {getStatusBadge(selectedExecution.status)}
                  </HStack>
                </Grid>

                <Box p={3} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'} borderRadius="md">
                  <Text fontSize="xs" color="gray.500" mb={1}>{t('scheduledJobs.columns.executionId')}</Text>
                  <Text fontFamily="mono" fontSize="sm">{selectedExecution.executionId}</Text>
                </Box>

                <Separator />

                {/* Timing Info */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
                  <VStack align="start">
                    <Text fontSize="xs" color="gray.500">{t('scheduledJobs.columns.startedAt')}</Text>
                    <Text fontSize="sm">{new Date(selectedExecution.startedAt).toLocaleString()}</Text>
                  </VStack>
                  <VStack align="start">
                    <Text fontSize="xs" color="gray.500">{t('scheduledJobs.columns.completedAt')}</Text>
                    <Text fontSize="sm">
                      {selectedExecution.completedAt
                        ? new Date(selectedExecution.completedAt).toLocaleString()
                        : '-'}
                    </Text>
                  </VStack>
                  <VStack align="start">
                    <Text fontSize="xs" color="gray.500">{t('scheduledJobs.columns.duration')}</Text>
                    <Text fontSize="sm" fontWeight="medium">{selectedExecution.durationMs ? `${selectedExecution.durationMs}ms` : '-'}</Text>
                  </VStack>
                  <VStack align="start">
                    <Text fontSize="xs" color="gray.500">{t('scheduledJobs.columns.triggeredBy')}</Text>
                    <Badge colorPalette={selectedExecution.triggeredBy === 'MANUAL' ? 'blue' : 'gray'}>
                      {selectedExecution.triggeredBy}
                    </Badge>
                  </VStack>
                </Grid>

                {/* Items Processed */}
                {selectedExecution.itemsProcessed !== undefined && selectedExecution.itemsProcessed > 0 && (
                  <>
                    <Separator />
                    <Box>
                      <Text fontWeight="medium" mb={2}>{t('scheduledJobs.details.itemsProcessed')}</Text>
                      <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                        <Box p={3} bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'} borderRadius="md" textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold">{selectedExecution.itemsProcessed}</Text>
                          <Text fontSize="xs" color="gray.500">{t('scheduledJobs.details.processed')}</Text>
                        </Box>
                        <Box p={3} bg={colorMode === 'dark' ? 'green.900' : 'green.50'} borderRadius="md" textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="green.500">{selectedExecution.itemsSuccess || 0}</Text>
                          <Text fontSize="xs" color="gray.500">{t('scheduledJobs.details.success')}</Text>
                        </Box>
                        <Box p={3} bg={colorMode === 'dark' ? 'red.900' : 'red.50'} borderRadius="md" textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="red.500">{selectedExecution.itemsFailed || 0}</Text>
                          <Text fontSize="xs" color="gray.500">{t('scheduledJobs.details.failed')}</Text>
                        </Box>
                      </Grid>
                    </Box>
                  </>
                )}

                {/* Result Summary */}
                {selectedExecution.resultSummary && (
                  <>
                    <Separator />
                    <Box>
                      <Text fontWeight="medium" mb={2}>{t('scheduledJobs.details.resultSummary')}</Text>
                      <Box
                        p={3}
                        bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
                        borderRadius="md"
                        width="100%"
                      >
                        <Text fontSize="sm">{selectedExecution.resultSummary}</Text>
                      </Box>
                    </Box>
                  </>
                )}

                {/* Result Data */}
                {selectedExecution.resultData && (
                  <>
                    <Separator />
                    <Box>
                      <Text fontWeight="medium" mb={2}>{t('scheduledJobs.details.resultData')}</Text>
                      <Box
                        p={3}
                        bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'}
                        borderRadius="md"
                        width="100%"
                        maxH="300px"
                        overflowY="auto"
                        border="1px solid"
                        borderColor={borderColor}
                      >
                        <Text fontSize="xs" fontFamily="mono" whiteSpace="pre-wrap">
                          {(() => {
                            try {
                              const parsed = typeof selectedExecution.resultData === 'string'
                                ? JSON.parse(selectedExecution.resultData)
                                : selectedExecution.resultData;
                              return JSON.stringify(parsed, null, 2);
                            } catch {
                              return selectedExecution.resultData;
                            }
                          })()}
                        </Text>
                      </Box>
                    </Box>
                  </>
                )}

                {/* Error Message */}
                {selectedExecution.errorMessage && (
                  <>
                    <Separator />
                    <Box>
                      <Text fontWeight="medium" color="red.500" mb={2}>{t('scheduledJobs.error')}</Text>
                      <Box
                        p={3}
                        bg={colorMode === 'dark' ? 'red.900' : 'red.50'}
                        borderRadius="md"
                        width="100%"
                        maxH="200px"
                        overflowY="auto"
                      >
                        <Text fontSize="sm" fontFamily="mono" whiteSpace="pre-wrap">
                          {selectedExecution.errorMessage}
                        </Text>
                      </Box>
                    </Box>
                  </>
                )}

                {/* Stack Trace */}
                {selectedExecution.errorStackTrace && (
                  <Box>
                    <Text fontWeight="medium" mb={2}>{t('scheduledJobs.stackTrace')}</Text>
                    <Box
                      p={3}
                      bg={colorMode === 'dark' ? 'gray.900' : 'gray.100'}
                      borderRadius="md"
                      width="100%"
                      maxH="200px"
                      overflowY="auto"
                    >
                      <Text fontSize="xs" fontFamily="mono" whiteSpace="pre-wrap">
                        {selectedExecution.errorStackTrace}
                      </Text>
                    </Box>
                  </Box>
                )}
              </VStack>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExecutionDetailOpen(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Dead Letter Detail Modal */}
      <DialogRoot open={isDeadLetterDetailOpen} onOpenChange={(e) => setIsDeadLetterDetailOpen(e.open)}>
        <DialogBackdrop bg="rgba(0, 0, 0, 0.6)" />
        <DialogContent
          maxW="600px"
          bg={cardBg}
          borderColor={borderColor}
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={1400}
          borderRadius="lg"
          boxShadow="xl"
        >
          <DialogHeader>
            <DialogTitle>{t('scheduledJobs.deadLetterDetails')}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            {selectedDeadLetter && (
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between">
                  <Text fontWeight="medium">{t('scheduledJobs.columns.job')}</Text>
                  <Text>{selectedDeadLetter.jobCode}</Text>
                </HStack>
                <Separator />
                <HStack justify="space-between">
                  <Text fontWeight="medium">{t('scheduledJobs.columns.status')}</Text>
                  {getStatusBadge(selectedDeadLetter.status)}
                </HStack>
                <Separator />
                <HStack justify="space-between">
                  <Text fontWeight="medium">{t('scheduledJobs.columns.retries')}</Text>
                  <Text>{selectedDeadLetter.retryCount}</Text>
                </HStack>
                <Separator />
                <VStack align="start" gap={1}>
                  <Text fontWeight="medium" color="red.500">{t('scheduledJobs.error')}</Text>
                  <Box
                    p={3}
                    bg="red.50"
                    borderRadius="md"
                    width="100%"
                    maxH="200px"
                    overflowY="auto"
                  >
                    <Text fontSize="sm" fontFamily="mono" whiteSpace="pre-wrap">
                      {selectedDeadLetter.errorMessage}
                    </Text>
                  </Box>
                </VStack>
                {selectedDeadLetter.errorStackTrace && (
                  <VStack align="start" gap={1}>
                    <Text fontWeight="medium">{t('scheduledJobs.stackTrace')}</Text>
                    <Box
                      p={3}
                      bg="gray.50"
                      borderRadius="md"
                      width="100%"
                      maxH="200px"
                      overflowY="auto"
                    >
                      <Text fontSize="xs" fontFamily="mono" whiteSpace="pre-wrap">
                        {selectedDeadLetter.errorStackTrace}
                      </Text>
                    </Box>
                  </VStack>
                )}
              </VStack>
            )}
          </DialogBody>
          <DialogFooter>
            {selectedDeadLetter?.status === 'PENDING' && (
              <HStack>
                <Button
                  colorPalette="blue"
                  onClick={() => {
                    handleRetryDeadLetter(selectedDeadLetter.id);
                    setIsDeadLetterDetailOpen(false);
                  }}
                >
                  <FiRotateCcw />
                  <Text ml={2}>{t('scheduledJobs.actions.retry')}</Text>
                </Button>
                <Button
                  colorPalette="red"
                  variant="outline"
                  onClick={() => {
                    handleAbandonDeadLetter(selectedDeadLetter.id);
                    setIsDeadLetterDetailOpen(false);
                  }}
                >
                  <FiArchive />
                  <Text ml={2}>{t('scheduledJobs.actions.abandon')}</Text>
                </Button>
              </HStack>
            )}
            <Button variant="outline" onClick={() => setIsDeadLetterDetailOpen(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Edit/Create Job Modal */}
      <DialogRoot open={isEditModalOpen} onOpenChange={(e) => { if (!e.open) handleCloseModal(); }}>
        <DialogBackdrop bg="rgba(0, 0, 0, 0.6)" />
        <DialogContent
          width={{ base: "95vw", md: "800px" }}
          maxH="90vh"
          bg={cardBg}
          borderColor={borderColor}
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={1400}
          overflowY="auto"
          borderRadius="lg"
          boxShadow="xl"
        >
          <DialogHeader borderBottomWidth="1px" borderColor={borderColor} pb={4}>
            <DialogTitle>
              <HStack>
                {isCreateMode ? <FiPlus color="var(--chakra-colors-green-500)" /> : <FiEdit2 color="var(--chakra-colors-blue-500)" />}
                <Text>{isCreateMode ? t('scheduledJobs.createJob') : t('scheduledJobs.editJob')}</Text>
              </HStack>
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody py={4}>
            <VStack align="stretch" gap={5}>

              {/* ============ SECTION 1: BASIC INFO ============ */}
              <Box p={4} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'} borderRadius="md">
                <HStack mb={3}>
                  <FiSettings />
                  <Text fontWeight="semibold">{t('scheduledJobs.form.basicInfo')}</Text>
                </HStack>

                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                  {/* Code - only editable in create mode */}
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.details.code')} *</Text>
                    {isCreateMode ? (
                      <Input
                        value={(editForm as CreateScheduledJobCommand).code || ''}
                        onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                        placeholder="MY_JOB_CODE"
                        fontFamily="mono"
                      />
                    ) : (
                      <Text fontFamily="mono" p={2} bg={colorMode === 'dark' ? 'gray.600' : 'white'} borderRadius="md">{editingJob?.code}</Text>
                    )}
                  </Box>

                  {/* Name */}
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.form.name')} *</Text>
                    <Input
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder={t('scheduledJobs.form.namePlaceholder')}
                    />
                  </Box>
                </Grid>

                {/* Description */}
                <Box mt={4}>
                  <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.form.description')}</Text>
                  <Textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder={t('scheduledJobs.form.descriptionPlaceholder')}
                    rows={2}
                  />
                </Box>
              </Box>

              {/* ============ SECTION 2: JOB TYPE & TARGET ============ */}
              <Box p={4} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'} borderRadius="md">
                <HStack mb={4}>
                  <Box p={2} bg={colorMode === 'dark' ? 'gray.600' : 'gray.200'} borderRadius="full">
                    <FiCloud size={20} />
                  </Box>
                  <VStack align="start" gap={0}>
                    <Text fontWeight="semibold">{t('scheduledJobs.form.jobTypeConfig')}</Text>
                    <Text fontSize="xs" color="gray.500">{t('scheduledJobs.form.jobTypeConfigDesc')}</Text>
                  </VStack>
                </HStack>

                {/* Job Type Selector - Card Style */}
                <Text fontWeight="medium" fontSize="sm" mb={3}>{t('scheduledJobs.form.jobType')} *</Text>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3} mb={4}>
                  {/* External API Card */}
                  <Box
                    p={4}
                    borderRadius="lg"
                    borderWidth="2px"
                    borderColor={editForm.jobType === 'EXTERNAL_API' ? 'blue.500' : borderColor}
                    bg={editForm.jobType === 'EXTERNAL_API' ? (colorMode === 'dark' ? 'blue.900' : 'blue.50') : 'transparent'}
                    cursor={isCreateMode || editingJob?.jobType === 'EXTERNAL_API' ? 'pointer' : 'not-allowed'}
                    opacity={!isCreateMode && editingJob?.jobType !== 'EXTERNAL_API' ? 0.5 : 1}
                    onClick={() => (isCreateMode || editingJob?.jobType === 'EXTERNAL_API') && setEditForm({ ...editForm, jobType: 'EXTERNAL_API' })}
                    _hover={isCreateMode || editingJob?.jobType === 'EXTERNAL_API' ? { borderColor: 'blue.400' } : {}}
                    transition="all 0.2s"
                  >
                    <HStack gap={3}>
                      <Box p={3} bg={editForm.jobType === 'EXTERNAL_API' ? 'blue.500' : (colorMode === 'dark' ? 'gray.600' : 'gray.200')} borderRadius="lg">
                        <FiCloud size={24} color={editForm.jobType === 'EXTERNAL_API' ? 'white' : undefined} />
                      </Box>
                      <VStack align="start" gap={0}>
                        <Text fontWeight="bold" color={editForm.jobType === 'EXTERNAL_API' ? 'blue.500' : undefined}>
                          {t('scheduledJobs.jobTypes.externalApi')}
                        </Text>
                        <Text fontSize="xs" color="gray.500">{t('scheduledJobs.form.externalApiDesc')}</Text>
                      </VStack>
                    </HStack>
                  </Box>

                  {/* Internal Service Card */}
                  <Box
                    p={4}
                    borderRadius="lg"
                    borderWidth="2px"
                    borderColor={editForm.jobType === 'INTERNAL_SERVICE' ? 'purple.500' : borderColor}
                    bg={editForm.jobType === 'INTERNAL_SERVICE' ? (colorMode === 'dark' ? 'purple.900' : 'purple.50') : 'transparent'}
                    cursor={isCreateMode || editingJob?.jobType === 'INTERNAL_SERVICE' ? 'pointer' : 'not-allowed'}
                    opacity={!isCreateMode && editingJob?.jobType !== 'INTERNAL_SERVICE' ? 0.5 : 1}
                    onClick={() => (isCreateMode || editingJob?.jobType === 'INTERNAL_SERVICE') && setEditForm({ ...editForm, jobType: 'INTERNAL_SERVICE' })}
                    _hover={isCreateMode || editingJob?.jobType === 'INTERNAL_SERVICE' ? { borderColor: 'purple.400' } : {}}
                    transition="all 0.2s"
                  >
                    <HStack gap={3}>
                      <Box p={3} bg={editForm.jobType === 'INTERNAL_SERVICE' ? 'purple.500' : (colorMode === 'dark' ? 'gray.600' : 'gray.200')} borderRadius="lg">
                        <FiServer size={24} color={editForm.jobType === 'INTERNAL_SERVICE' ? 'white' : undefined} />
                      </Box>
                      <VStack align="start" gap={0}>
                        <Text fontWeight="bold" color={editForm.jobType === 'INTERNAL_SERVICE' ? 'purple.500' : undefined}>
                          {t('scheduledJobs.jobTypes.internalService')}
                        </Text>
                        <Text fontSize="xs" color="gray.500">{t('scheduledJobs.form.internalServiceDesc')}</Text>
                      </VStack>
                    </HStack>
                  </Box>

                  {/* Rule Engine Card */}
                  <Box
                    p={4}
                    borderRadius="lg"
                    borderWidth="2px"
                    borderColor={editForm.jobType === 'RULE_ENGINE' ? 'orange.500' : borderColor}
                    bg={editForm.jobType === 'RULE_ENGINE' ? (colorMode === 'dark' ? 'orange.900' : 'orange.50') : 'transparent'}
                    cursor={isCreateMode || editingJob?.jobType === 'RULE_ENGINE' ? 'pointer' : 'not-allowed'}
                    opacity={!isCreateMode && editingJob?.jobType !== 'RULE_ENGINE' ? 0.5 : 1}
                    onClick={() => (isCreateMode || editingJob?.jobType === 'RULE_ENGINE') && setEditForm({ ...editForm, jobType: 'RULE_ENGINE' })}
                    _hover={isCreateMode || editingJob?.jobType === 'RULE_ENGINE' ? { borderColor: 'orange.400' } : {}}
                    transition="all 0.2s"
                  >
                    <HStack gap={3}>
                      <Box p={3} bg={editForm.jobType === 'RULE_ENGINE' ? 'orange.500' : (colorMode === 'dark' ? 'gray.600' : 'gray.200')} borderRadius="lg">
                        <FiCode size={24} color={editForm.jobType === 'RULE_ENGINE' ? 'white' : undefined} />
                      </Box>
                      <VStack align="start" gap={0}>
                        <Text fontWeight="bold" color={editForm.jobType === 'RULE_ENGINE' ? 'orange.500' : undefined}>
                          {t('scheduledJobs.jobTypes.ruleEngine')}
                        </Text>
                        <Text fontSize="xs" color="gray.500">{t('scheduledJobs.form.ruleEngineDesc')}</Text>
                      </VStack>
                    </HStack>
                  </Box>

                  {/* SQL Query Card */}
                  <Box
                    p={4}
                    borderRadius="lg"
                    borderWidth="2px"
                    borderColor={editForm.jobType === 'SQL_QUERY' ? 'teal.500' : borderColor}
                    bg={editForm.jobType === 'SQL_QUERY' ? (colorMode === 'dark' ? 'teal.900' : 'teal.50') : 'transparent'}
                    cursor={isCreateMode || editingJob?.jobType === 'SQL_QUERY' ? 'pointer' : 'not-allowed'}
                    opacity={!isCreateMode && editingJob?.jobType !== 'SQL_QUERY' ? 0.5 : 1}
                    onClick={() => (isCreateMode || editingJob?.jobType === 'SQL_QUERY') && setEditForm({ ...editForm, jobType: 'SQL_QUERY' })}
                    _hover={isCreateMode || editingJob?.jobType === 'SQL_QUERY' ? { borderColor: 'teal.400' } : {}}
                    transition="all 0.2s"
                  >
                    <HStack gap={3}>
                      <Box p={3} bg={editForm.jobType === 'SQL_QUERY' ? 'teal.500' : (colorMode === 'dark' ? 'gray.600' : 'gray.200')} borderRadius="lg">
                        <FiDatabase size={24} color={editForm.jobType === 'SQL_QUERY' ? 'white' : undefined} />
                      </Box>
                      <VStack align="start" gap={0}>
                        <Text fontWeight="bold" color={editForm.jobType === 'SQL_QUERY' ? 'teal.500' : undefined}>
                          {t('scheduledJobs.jobTypes.sqlQuery')}
                        </Text>
                        <Text fontSize="xs" color="gray.500">{t('scheduledJobs.form.sqlQueryDesc')}</Text>
                      </VStack>
                    </HStack>
                  </Box>
                </Grid>

                {/* ========== TARGET CONFIGURATION BASED ON TYPE ========== */}

                {/* External API Config */}
                {editForm.jobType === 'EXTERNAL_API' && (
                  <Box p={4} bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'} borderRadius="lg" borderWidth="2px" borderColor="blue.500">
                    <HStack mb={3}>
                      <FiCloud color="var(--chakra-colors-blue-500)" />
                      <Text fontWeight="bold" color="blue.500">{t('scheduledJobs.form.targetConfig')}: {t('scheduledJobs.jobTypes.externalApi')}</Text>
                    </HStack>
                    <Box>
                      <Text fontWeight="medium" fontSize="sm" mb={2}>{t('scheduledJobs.form.selectExternalApiLabel')} *</Text>
                      <NativeSelectRoot>
                        <NativeSelectField
                          value={editForm.externalApiConfigCode || ''}
                          onChange={(e) => setEditForm({ ...editForm, externalApiConfigCode: e.target.value })}
                          bg={colorMode === 'dark' ? 'gray.800' : 'white'}
                        >
                          <option value="">{t('scheduledJobs.form.selectExternalApi')}</option>
                          {externalApis.filter(api => api.active).map((api) => (
                            <option key={api.code} value={api.code}>
                              {api.name} ({api.code})
                            </option>
                          ))}
                        </NativeSelectField>
                      </NativeSelectRoot>
                      {editForm.externalApiConfigCode && (
                        <HStack mt={3} p={2} bg={colorMode === 'dark' ? 'blue.800' : 'blue.100'} borderRadius="md">
                          <FiCheckCircle color="var(--chakra-colors-green-500)" />
                          <Text fontSize="sm">
                            <strong>{t('scheduledJobs.form.selectedApi')}:</strong> {externalApis.find(a => a.code === editForm.externalApiConfigCode)?.name || editForm.externalApiConfigCode}
                          </Text>
                        </HStack>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Internal Service Config */}
                {editForm.jobType === 'INTERNAL_SERVICE' && (
                  <Box p={4} bg={colorMode === 'dark' ? 'purple.900' : 'purple.50'} borderRadius="lg" borderWidth="2px" borderColor="purple.500">
                    <HStack mb={3}>
                      <FiServer color="var(--chakra-colors-purple-500)" />
                      <Text fontWeight="bold" color="purple.500">{t('scheduledJobs.form.targetConfig')}: {t('scheduledJobs.jobTypes.internalService')}</Text>
                    </HStack>
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <Box>
                        <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.form.beanName')} *</Text>
                        <Input
                          value={editForm.serviceBeanName || ''}
                          onChange={(e) => setEditForm({ ...editForm, serviceBeanName: e.target.value })}
                          placeholder="exchangeRateService"
                          fontFamily="mono"
                          bg={colorMode === 'dark' ? 'gray.800' : 'white'}
                        />
                      </Box>
                      <Box>
                        <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.form.methodName')} *</Text>
                        <Input
                          value={editForm.serviceMethodName || ''}
                          onChange={(e) => setEditForm({ ...editForm, serviceMethodName: e.target.value })}
                          placeholder="updateRates"
                          fontFamily="mono"
                          bg={colorMode === 'dark' ? 'gray.800' : 'white'}
                        />
                      </Box>
                    </Grid>
                  </Box>
                )}

                {/* Job Parameters - shown for all types */}
                <Box mt={4}>
                  <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.form.jobParameters')}</Text>
                  <Textarea
                    value={editForm.jobParameters || ''}
                    onChange={(e) => setEditForm({ ...editForm, jobParameters: e.target.value })}
                    placeholder='{"key": "value"}'
                    fontFamily="mono"
                    rows={2}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>{t('scheduledJobs.form.jobParametersHelp')}</Text>
                </Box>
              </Box>

              {/* ============ SECTION 3: SCHEDULE ============ */}
              <Box p={4} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'} borderRadius="md">
                <HStack mb={3}>
                  <FiClock />
                  <Text fontWeight="semibold">{t('scheduledJobs.form.scheduleConfig')}</Text>
                </HStack>

                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.form.scheduleType')}</Text>
                    <NativeSelectRoot>
                      <NativeSelectField
                        value={editForm.scheduleType || 'CRON'}
                        onChange={(e) => setEditForm({ ...editForm, scheduleType: e.target.value as ScheduleType })}
                      >
                        <option value="CRON">Cron Expression</option>
                        <option value="FIXED_RATE">Fixed Rate (Interval)</option>
                        <option value="FIXED_DELAY">Fixed Delay</option>
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Box>

                  <Box>
                    <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.form.timezone')}</Text>
                    <NativeSelectRoot>
                      <NativeSelectField
                        value={editForm.timezone || 'America/Chicago'}
                        onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                      >
                        <option value="America/Chicago">America/Chicago (CST)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                        <option value="America/Mexico_City">America/Mexico_City</option>
                        <option value="UTC">UTC</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="Europe/Paris">Europe/Paris</option>
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Box>
                </Grid>

                {/* Schedule value based on type */}
                <Box mt={4}>
                  {editForm.scheduleType === 'CRON' && (
                    <>
                      <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.form.cronExpression')} *</Text>
                      <Input
                        value={editForm.cronExpression || ''}
                        onChange={(e) => setEditForm({ ...editForm, cronExpression: e.target.value })}
                        placeholder="0 0 * * * *"
                        fontFamily="mono"
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>{t('scheduledJobs.form.cronHelp')}</Text>
                    </>
                  )}
                  {editForm.scheduleType === 'FIXED_RATE' && (
                    <>
                      <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.form.fixedRateMs')} *</Text>
                      <Input
                        type="number"
                        value={editForm.fixedRateMs || ''}
                        onChange={(e) => setEditForm({ ...editForm, fixedRateMs: parseInt(e.target.value) || undefined })}
                        placeholder="60000"
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>{t('scheduledJobs.form.fixedRateHelp')}</Text>
                    </>
                  )}
                  {editForm.scheduleType === 'FIXED_DELAY' && (
                    <>
                      <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.form.fixedDelayMs')} *</Text>
                      <Input
                        type="number"
                        value={editForm.fixedDelayMs || ''}
                        onChange={(e) => setEditForm({ ...editForm, fixedDelayMs: parseInt(e.target.value) || undefined })}
                        placeholder="60000"
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>{t('scheduledJobs.form.fixedDelayHelp')}</Text>
                    </>
                  )}
                </Box>
              </Box>

              {/* ============ SECTION 4: EXECUTION SETTINGS ============ */}
              <Box p={4} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'} borderRadius="md">
                <HStack mb={3}>
                  <FiActivity />
                  <Text fontWeight="semibold">{t('scheduledJobs.form.executionSettings')}</Text>
                </HStack>

                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.form.timeoutSeconds')}</Text>
                    <Input
                      type="number"
                      value={editForm.timeoutSeconds || ''}
                      onChange={(e) => setEditForm({ ...editForm, timeoutSeconds: parseInt(e.target.value) || undefined })}
                      placeholder="300"
                    />
                  </Box>
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.form.maxRetries')}</Text>
                    <Input
                      type="number"
                      value={editForm.maxRetries || ''}
                      onChange={(e) => setEditForm({ ...editForm, maxRetries: parseInt(e.target.value) || undefined })}
                      placeholder="3"
                    />
                  </Box>
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.form.retryDelaySeconds')}</Text>
                    <Input
                      type="number"
                      value={editForm.retryDelaySeconds || ''}
                      onChange={(e) => setEditForm({ ...editForm, retryDelaySeconds: parseInt(e.target.value) || undefined })}
                      placeholder="60"
                    />
                  </Box>
                </Grid>

                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4} mt={4}>
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.form.enabled')}</Text>
                    <NativeSelectRoot>
                      <NativeSelectField
                        value={editForm.isEnabled ? 'true' : 'false'}
                        onChange={(e) => setEditForm({ ...editForm, isEnabled: e.target.value === 'true' })}
                      >
                        <option value="true">{t('scheduledJobs.active')}</option>
                        <option value="false">{t('scheduledJobs.disabled')}</option>
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Box>
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.form.alertOnFailure')}</Text>
                    <NativeSelectRoot>
                      <NativeSelectField
                        value={editForm.alertOnFailure ? 'true' : 'false'}
                        onChange={(e) => setEditForm({ ...editForm, alertOnFailure: e.target.value === 'true' })}
                      >
                        <option value="true">{t('common.yes')}</option>
                        <option value="false">{t('common.no')}</option>
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Box>
                </Grid>

                {editForm.alertOnFailure && (
                  <Box mt={4}>
                    <Text fontWeight="medium" fontSize="sm" mb={1}>{t('scheduledJobs.form.alertEmailRecipients')}</Text>
                    <Input
                      value={editForm.alertEmailRecipients || ''}
                      onChange={(e) => setEditForm({ ...editForm, alertEmailRecipients: e.target.value })}
                      placeholder="admin@example.com, ops@example.com"
                    />
                  </Box>
                )}
              </Box>

            </VStack>
          </DialogBody>
          <DialogFooter borderTopWidth="1px" borderColor={borderColor} pt={4}>
            <HStack gap={3} width="100%" justify="flex-end">
              <Button variant="outline" onClick={handleCloseModal} disabled={isSaving}>
                {t('common.cancel')}
              </Button>
              <Button
                colorPalette={isCreateMode ? 'green' : 'blue'}
                onClick={handleSaveJob}
                disabled={isSaving || !editForm.name || (isCreateMode && !(editForm as CreateScheduledJobCommand).code)}
              >
                {isSaving ? <Spinner size="sm" /> : (isCreateMode ? <FiPlus /> : <FiCheckCircle />)}
                <Text ml={2}>{isCreateMode ? t('common.create') : t('common.save')}</Text>
              </Button>
            </HStack>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}
