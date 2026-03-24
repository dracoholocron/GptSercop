/**
 * Email Service - Handles email providers, queue, and action configurations
 */
import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL } from '../config/api.config';

export interface EmailProviderConfig {
  id: number;
  tenantId?: string;
  name: string;
  providerType: 'SMTP' | 'SENDGRID' | 'AWS_SES' | 'MAILGUN';
  smtpHost?: string;
  smtpPort?: string;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpUseTls?: boolean;
  smtpUseSsl?: boolean;
  apiKey?: string;
  apiEndpoint?: string;
  apiRegion?: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  rateLimitPerDay?: number;
  isActive: boolean;
  isDefault: boolean;
  priority: number;
  createdAt?: string;
  updatedAt?: string;
}

export type EmailPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type EmailStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'RETRY' | 'CANCELLED';

export interface EmailQueue {
  id: number;
  uuid: string;
  tenantId?: string;
  toAddresses: string[];
  ccAddresses?: string[];
  bccAddresses?: string[];
  fromEmail?: string;
  fromName?: string;
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  templateCode?: string;
  templateVariables?: Record<string, unknown>;
  priority: EmailPriority;
  status: EmailStatus;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  referenceType?: string;
  referenceId?: string;
  providerId?: number;
  providerUsed?: string;
  providerMessageId?: string;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  createdBy?: string;
}

export interface EmailLog {
  id: number;
  emailQueueId: number;
  eventType: string;
  eventData?: string;
  providerResponse?: string;
  eventTimestamp: string;
}

export interface EmailStats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  retry: number;
  cancelled: number;
  total: number;
}

export type ActionType = 'OPERATION_CREATED' | 'OPERATION_APPROVED' | 'OPERATION_REJECTED' | 'STATUS_CHANGED' | 'DOCUMENT_UPLOADED' | 'AMENDMENT_REQUESTED' | 'PAYMENT_DUE' | 'EXPIRY_WARNING';
export type RecipientType = 'OPERATION_OWNER' | 'APPROVERS' | 'PARTICIPANTS' | 'CUSTOM';

export interface EmailActionConfig {
  id: number;
  actionType: ActionType;
  eventTypeCode?: string;
  productTypeCode?: string;
  isActive: boolean;
  templateCode: string;
  recipientType: RecipientType;
  customRecipients?: string[];
  conditions?: Record<string, unknown>;
  createdAt?: string;
  createdBy?: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

const EMAIL_PROVIDERS_BASE = `${API_BASE_URL}/v1/admin/email/providers`;

export const emailProviderApi = {
  async getAll(): Promise<EmailProviderConfig[]> {
    const response = await get(EMAIL_PROVIDERS_BASE);
    if (!response.ok) throw new Error('Failed to fetch providers');
    const data = await response.json();
    return data.data || data || [];
  },
  async getById(id: number): Promise<EmailProviderConfig> {
    const response = await get(`${EMAIL_PROVIDERS_BASE}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch provider');
    const data = await response.json();
    return data.data || data;
  },
  async create(dto: Partial<EmailProviderConfig>): Promise<EmailProviderConfig> {
    const response = await post(EMAIL_PROVIDERS_BASE, dto);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to create');
    }
    const data = await response.json();
    return data.data || data;
  },
  async update(id: number, dto: Partial<EmailProviderConfig>): Promise<EmailProviderConfig> {
    const response = await put(`${EMAIL_PROVIDERS_BASE}/${id}`, dto);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to update');
    }
    const data = await response.json();
    return data.data || data;
  },
  async delete(id: number): Promise<void> {
    const response = await del(`${EMAIL_PROVIDERS_BASE}/${id}`);
    if (!response.ok) throw new Error('Failed to delete');
  },
  async setDefault(id: number): Promise<void> {
    const response = await post(`${EMAIL_PROVIDERS_BASE}/${id}/set-default`, {});
    if (!response.ok) throw new Error('Failed to set default');
  },
  async testConnection(id: number): Promise<{ success: boolean; message: string }> {
    const response = await post(`${EMAIL_PROVIDERS_BASE}/${id}/test`, {});
    if (!response.ok) throw new Error('Test failed');
    return response.json();
  },
};

export const emailQueueApi = {
  async getAll(page = 0, size = 20): Promise<PagedResponse<EmailQueue>> {
    const response = await get(`${API_BASE_URL}/v1/admin/email/queue?page=${page}&size=${size}&sort=createdAt,desc`);
    if (!response.ok) throw new Error('Failed to fetch emails');
    return (await response.json()).data || await response.json();
  },
  async getById(id: number): Promise<EmailQueue> {
    const response = await get(`${API_BASE_URL}/v1/admin/email/queue/${id}`);
    if (!response.ok) throw new Error('Failed to fetch email');
    return (await response.json()).data || await response.json();
  },
  async getLogs(emailId: number): Promise<EmailLog[]> {
    const response = await get(`${API_BASE_URL}/v1/admin/email/queue/${emailId}/logs`);
    if (!response.ok) throw new Error('Failed to fetch logs');
    return (await response.json()).data || await response.json() || [];
  },
  async getStats(): Promise<EmailStats> {
    const response = await get(`${API_BASE_URL}/v1/admin/email/queue/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return (await response.json()).data || await response.json();
  },
  async cancel(id: number): Promise<void> {
    const response = await post(`${API_BASE_URL}/v1/admin/email/queue/${id}/cancel`, {});
    if (!response.ok) throw new Error('Failed to cancel');
  },
  async retry(id: number): Promise<void> {
    const response = await post(`${API_BASE_URL}/v1/admin/email/queue/${id}/retry`, {});
    if (!response.ok) throw new Error('Failed to retry');
  },
};

const EMAIL_ACTIONS_BASE = `${API_BASE_URL}/v1/admin/email/actions`;

export const emailActionApi = {
  async getAll(): Promise<EmailActionConfig[]> {
    const response = await get(EMAIL_ACTIONS_BASE);
    if (!response.ok) throw new Error('Failed to fetch actions');
    const data = await response.json();
    return data.data || data || [];
  },
  async getById(id: number): Promise<EmailActionConfig> {
    const response = await get(`${EMAIL_ACTIONS_BASE}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch action');
    const data = await response.json();
    return data.data || data;
  },
  async create(dto: Partial<EmailActionConfig>): Promise<EmailActionConfig> {
    const response = await post(EMAIL_ACTIONS_BASE, dto);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to create');
    }
    const data = await response.json();
    return data.data || data;
  },
  async update(id: number, dto: Partial<EmailActionConfig>): Promise<EmailActionConfig> {
    const response = await put(`${EMAIL_ACTIONS_BASE}/${id}`, dto);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to update');
    }
    const data = await response.json();
    return data.data || data;
  },
  async delete(id: number): Promise<void> {
    const response = await del(`${EMAIL_ACTIONS_BASE}/${id}`);
    if (!response.ok) throw new Error('Failed to delete');
  },
};

export default { providers: emailProviderApi, queue: emailQueueApi, actions: emailActionApi };
