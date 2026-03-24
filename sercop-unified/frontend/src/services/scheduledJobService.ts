import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';
import type {
  ScheduledJob,
  ExecutionLog,
  DeadLetter,
  JobStatistics,
  JobExecutionResult,
  CreateScheduledJobCommand,
  UpdateScheduledJobCommand,
  TriggerJobCommand,
  AbandonDeadLetterCommand,
  PaginatedResponse,
  SingleResponse,
  JobType,
} from '../types/scheduledJobs';

const BASE_PATH = `${API_BASE_URL}/v1/admin/scheduled-jobs`;

class ScheduledJobService {
  // ==================== Job Configuration Queries ====================

  async listJobs(params?: {
    search?: string;
    jobType?: JobType;
    enabled?: boolean;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<ScheduledJob>> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.jobType) queryParams.append('jobType', params.jobType);
    if (params?.enabled !== undefined) queryParams.append('enabled', String(params.enabled));
    if (params?.page !== undefined) queryParams.append('page', String(params.page));
    if (params?.size !== undefined) queryParams.append('size', String(params.size));

    const url = `${BASE_PATH}/queries${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await get(url);
    return response.json();
  }

  async getJob(code: string): Promise<SingleResponse<ScheduledJob>> {
    const response = await get(`${BASE_PATH}/queries/${code}`);
    return response.json();
  }

  async getJobExecutions(code: string, params?: {
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<ExecutionLog>> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', String(params.page));
    if (params?.size !== undefined) queryParams.append('size', String(params.size));

    const url = `${BASE_PATH}/queries/${code}/executions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await get(url);
    return response.json();
  }

  async getJobStatistics(code: string): Promise<SingleResponse<Record<string, any>>> {
    const response = await get(`${BASE_PATH}/queries/${code}/statistics`);
    return response.json();
  }

  async getOverallStatistics(): Promise<SingleResponse<JobStatistics>> {
    const response = await get(`${BASE_PATH}/queries/statistics`);
    return response.json();
  }

  async getRunningJobs(): Promise<SingleResponse<{
    jobs: ScheduledJob[];
    executions: ExecutionLog[];
  }>> {
    const response = await get(`${BASE_PATH}/queries/running`);
    return response.json();
  }

  async getDeadLetterQueue(params?: {
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<DeadLetter>> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', String(params.page));
    if (params?.size !== undefined) queryParams.append('size', String(params.size));

    const url = `${BASE_PATH}/queries/dead-letter${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await get(url);
    return response.json();
  }

  async getDeadLetter(id: number): Promise<SingleResponse<DeadLetter>> {
    const response = await get(`${BASE_PATH}/queries/dead-letter/${id}`);
    return response.json();
  }

  async getExecution(executionId: string): Promise<SingleResponse<ExecutionLog>> {
    const response = await get(`${BASE_PATH}/queries/executions/${executionId}`);
    return response.json();
  }

  async getAllExecutions(params?: {
    page?: number;
    size?: number;
    jobCode?: string;
    status?: string;
    from?: string;
    to?: string;
  }): Promise<PaginatedResponse<ExecutionLog>> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', String(params.page));
    if (params?.size !== undefined) queryParams.append('size', String(params.size));
    if (params?.jobCode) queryParams.append('jobCode', params.jobCode);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);

    const url = `${BASE_PATH}/queries/executions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await get(url);
    return response.json();
  }

  // ==================== Job Configuration Commands ====================

  async createJob(command: CreateScheduledJobCommand): Promise<SingleResponse<ScheduledJob>> {
    const response = await post(`${BASE_PATH}/commands`, command);
    return response.json();
  }

  async updateJob(code: string, command: UpdateScheduledJobCommand): Promise<SingleResponse<ScheduledJob>> {
    const response = await put(`${BASE_PATH}/commands/${code}`, command);
    return response.json();
  }

  async deleteJob(code: string): Promise<SingleResponse<void>> {
    const response = await del(`${BASE_PATH}/commands/${code}`);
    return response.json();
  }

  async toggleJob(code: string): Promise<SingleResponse<ScheduledJob>> {
    const response = await post(`${BASE_PATH}/commands/${code}/toggle`, {});
    return response.json();
  }

  async triggerJob(code: string, command?: TriggerJobCommand): Promise<SingleResponse<JobExecutionResult>> {
    const response = await post(`${BASE_PATH}/commands/${code}/trigger`, command || {});
    return response.json();
  }

  // ==================== Dead Letter Commands ====================

  async retryDeadLetter(id: number): Promise<SingleResponse<DeadLetter>> {
    const response = await post(`${BASE_PATH}/commands/dead-letter/${id}/retry`, {});
    return response.json();
  }

  async abandonDeadLetter(id: number, command: AbandonDeadLetterCommand): Promise<SingleResponse<DeadLetter>> {
    const response = await post(`${BASE_PATH}/commands/dead-letter/${id}/abandon`, command);
    return response.json();
  }

  // ==================== Helper Methods ====================

  formatDuration(ms?: number): string {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
    return `${(ms / 3600000).toFixed(2)}h`;
  }

  formatSchedule(job: ScheduledJob): string {
    switch (job.scheduleType) {
      case 'CRON':
        return `Cron: ${job.cronExpression}`;
      case 'FIXED_RATE':
        return `Every ${this.formatDuration(job.fixedRateMs)}`;
      case 'FIXED_DELAY':
        return `After ${this.formatDuration(job.fixedDelayMs)} delay`;
      default:
        return 'Unknown';
    }
  }

  getStatusColor(status?: string): string {
    switch (status) {
      case 'SUCCESS':
        return 'green';
      case 'RUNNING':
        return 'blue';
      case 'FAILED':
      case 'TIMEOUT':
        return 'red';
      case 'PENDING':
        return 'gray';
      case 'SKIPPED':
        return 'yellow';
      case 'CIRCUIT_OPEN':
        return 'orange';
      default:
        return 'gray';
    }
  }

  getJobTypeLabel(type: JobType): string {
    switch (type) {
      case 'INTERNAL_SERVICE':
        return 'Internal Service';
      case 'EXTERNAL_API':
        return 'External API';
      case 'RULE_ENGINE':
        return 'Rule Engine';
      case 'SQL_QUERY':
        return 'SQL Query';
      default:
        return type;
    }
  }
}

export const scheduledJobService = new ScheduledJobService();
