// Scheduled Job Types

export type ScheduleType = 'CRON' | 'FIXED_RATE' | 'FIXED_DELAY';
export type JobType = 'INTERNAL_SERVICE' | 'EXTERNAL_API' | 'RULE_ENGINE' | 'SQL_QUERY';
export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'TIMEOUT' | 'CIRCUIT_OPEN';
export type LogStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'TIMEOUT' | 'CANCELLED';
export type TriggerType = 'SCHEDULER' | 'MANUAL' | 'SYSTEM' | 'RETRY' | 'API';
export type DeadLetterStatus = 'PENDING' | 'RETRYING' | 'RESOLVED' | 'ABANDONED';

export interface ScheduledJob {
  id: number;
  code: string;
  name: string;
  description?: string;

  // Schedule configuration
  scheduleType: ScheduleType;
  cronExpression?: string;
  fixedRateMs?: number;
  fixedDelayMs?: number;
  initialDelayMs?: number;
  timezone?: string;

  // Job type and execution target
  jobType: JobType;
  serviceBeanName?: string;
  serviceMethodName?: string;
  externalApiConfigCode?: string;
  ruleCode?: string;

  // Parameters
  jobParameters?: string;
  apiRequestContext?: string;

  // Retry configuration
  retryOnFailure?: boolean;
  maxRetries?: number;
  retryDelaySeconds?: number;
  retryBackoffMultiplier?: number;

  // Alerting configuration
  alertOnFailure?: boolean;
  alertEmailRecipients?: string;
  consecutiveFailuresThreshold?: number;

  // Circuit breaker
  circuitBreakerEnabled?: boolean;
  circuitBreakerThreshold?: number;
  circuitBreakerResetTimeoutSeconds?: number;

  // Timeout configuration
  timeoutSeconds?: number;
  lockAtMostSeconds?: number;
  lockAtLeastSeconds?: number;

  // Status
  isEnabled?: boolean;
  isSystemJob?: boolean;
  isClusterSafe?: boolean;

  // Execution tracking
  lastExecutionStatus?: ExecutionStatus;
  lastExecutionAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  nextExecutionAt?: string;
  consecutiveFailures?: number;
  totalExecutions?: number;
  totalSuccesses?: number;
  totalFailures?: number;

  // Computed fields
  successRate?: number;
  scheduleDescription?: string;

  // Audit fields
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  version?: number;
  tenantId?: string;
}

export interface ExecutionLog {
  id: number;
  executionId: string;
  jobCode: string;
  jobConfigId?: number;

  status: LogStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  durationFormatted?: string;

  itemsProcessed?: number;
  itemsSuccess?: number;
  itemsFailed?: number;
  resultSummary?: string;
  resultData?: string;

  errorMessage?: string;
  errorStackTrace?: string;
  errorCode?: string;

  retryAttempt?: number;
  isRetry?: boolean;
  originalExecutionId?: string;

  triggeredBy: TriggerType;
  triggeredByUser?: string;

  serverInstance?: string;
  serverIp?: string;
  threadName?: string;

  tenantId?: string;
}

export interface DeadLetter {
  id: number;
  jobCode: string;
  jobConfigId?: number;
  originalExecutionId: string;

  status: DeadLetterStatus;

  errorMessage: string;
  errorStackTrace?: string;
  errorCode?: string;

  retryCount?: number;
  maxRetriesReached?: boolean;
  lastRetryAt?: string;

  originalParameters?: string;
  originalStartedAt?: string;
  originalTriggeredBy?: string;

  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;

  createdAt?: string;
  updatedAt?: string;
  tenantId?: string;

  // Computed fields
  jobName?: string;
  ageInHours?: number;
}

export interface JobStatistics {
  totalJobs: number;
  enabledJobs: number;
  disabledJobs: number;
  systemJobs: number;
  customJobs: number;

  runningJobs: number;
  executionsToday: number;
  successesToday: number;
  failuresToday: number;
  successRateToday: number;

  pendingDeadLetters: number;
  totalDeadLetters: number;

  jobsByType: Record<string, number>;
  jobsByStatus: Record<string, number>;
  deadLettersByStatus: Record<string, number>;

  topFailingJobs: Record<string, number>;

  lastExecutionAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;

  averageExecutionDurationMs?: number;
  longestExecutionDurationMs?: number;
  longestRunningJobCode?: string;
}

export interface JobExecutionResult {
  executionId: string;
  jobCode: string;
  status: LogStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;

  itemsProcessed?: number;
  itemsSuccess?: number;
  itemsFailed?: number;

  resultSummary?: string;
  resultData?: Record<string, any>;

  errorMessage?: string;
  errorCode?: string;

  wasAsync?: boolean;
  message?: string;
}

// Command types
export interface CreateScheduledJobCommand {
  code: string;
  name: string;
  description?: string;

  scheduleType: ScheduleType;
  cronExpression?: string;
  fixedRateMs?: number;
  fixedDelayMs?: number;
  initialDelayMs?: number;
  timezone?: string;

  jobType: JobType;
  serviceBeanName?: string;
  serviceMethodName?: string;
  externalApiConfigCode?: string;
  ruleCode?: string;
  sqlQuery?: string;

  jobParameters?: string;
  apiRequestContext?: string;

  retryOnFailure?: boolean;
  maxRetries?: number;
  retryDelaySeconds?: number;
  retryBackoffMultiplier?: number;

  alertOnFailure?: boolean;
  alertEmailRecipients?: string;
  consecutiveFailuresThreshold?: number;

  circuitBreakerEnabled?: boolean;
  circuitBreakerThreshold?: number;
  circuitBreakerResetTimeoutSeconds?: number;

  timeoutSeconds?: number;
  lockAtMostSeconds?: number;
  lockAtLeastSeconds?: number;

  isEnabled?: boolean;
  isClusterSafe?: boolean;
}

export interface UpdateScheduledJobCommand {
  name?: string;
  description?: string;

  scheduleType?: ScheduleType;
  cronExpression?: string;
  fixedRateMs?: number;
  fixedDelayMs?: number;
  initialDelayMs?: number;
  timezone?: string;

  jobType?: JobType;
  serviceBeanName?: string;
  serviceMethodName?: string;
  externalApiConfigCode?: string;
  ruleCode?: string;
  sqlQuery?: string;

  jobParameters?: string;
  apiRequestContext?: string;

  retryOnFailure?: boolean;
  maxRetries?: number;
  retryDelaySeconds?: number;
  retryBackoffMultiplier?: number;

  alertOnFailure?: boolean;
  alertEmailRecipients?: string;
  consecutiveFailuresThreshold?: number;

  circuitBreakerEnabled?: boolean;
  circuitBreakerThreshold?: number;
  circuitBreakerResetTimeoutSeconds?: number;

  timeoutSeconds?: number;
  lockAtMostSeconds?: number;
  lockAtLeastSeconds?: number;

  isEnabled?: boolean;
  isClusterSafe?: boolean;
}

export interface TriggerJobCommand {
  overrideParameters?: string;
  async?: boolean;
}

export interface AbandonDeadLetterCommand {
  notes?: string;
}

// API Response types
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
