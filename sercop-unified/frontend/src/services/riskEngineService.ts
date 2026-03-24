import { get, put, apiClient } from '../utils/apiClient';
import { RISK_ENGINE_ROUTES, buildUrlWithParams } from '../config/api.routes';

export interface RiskRule {
  id: number;
  code: string;
  name: string;
  description: string;
  category: 'LOCATION' | 'TIME' | 'DEVICE' | 'VELOCITY' | 'AMOUNT' | 'BEHAVIOR';
  scorePoints: number;
  isEnabled: boolean;
  configJson: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface RiskThreshold {
  id: number;
  name: string;
  minScore: number;
  maxScore: number | null;
  action: 'ALLOW' | 'MFA_REQUIRED' | 'STEP_UP_AUTH' | 'BLOCK' | 'NOTIFY_ADMIN';
  notificationEnabled: boolean;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TriggeredRule {
  ruleCode: string;
  ruleName: string;
  points: number;
  reason: string;
}

export interface RiskEvent {
  id: number;
  userId: number;
  username: string;
  eventType: 'LOGIN' | 'OPERATION' | 'APPROVAL' | 'DATA_ACCESS';
  ipAddress: string;
  deviceFingerprint: string;
  userAgent: string;
  locationCountry: string;
  locationCity: string;
  operationType: string;
  operationAmount: number;
  totalRiskScore: number;
  triggeredRules: TriggeredRule[];
  actionTaken: 'ALLOWED' | 'MFA_REQUESTED' | 'BLOCKED' | 'ADMIN_NOTIFIED';
  createdAt: string;
}

export interface RiskStats {
  totalEvents: number;
  blockedEvents: number;
  mfaRequestedEvents: number;
  averageScore: number;
  topTriggeredRules: { code: string; name: string; count: number }[];
}

// Helper to make PATCH requests
const patch = async (endpoint: string, data?: any): Promise<Response> => {
  return apiClient(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const riskEngineService = {
  // Rules
  async getRules(): Promise<RiskRule[]> {
    const response = await get(RISK_ENGINE_ROUTES.RULES);
    const data = await response.json();
    return data.data || data;
  },

  async getRule(id: number): Promise<RiskRule> {
    const response = await get(RISK_ENGINE_ROUTES.RULE_BY_ID(id));
    const data = await response.json();
    return data.data || data;
  },

  async updateRule(id: number, rule: Partial<RiskRule>): Promise<RiskRule> {
    const response = await put(RISK_ENGINE_ROUTES.RULE_BY_ID(id), rule);
    const data = await response.json();
    return data.data || data;
  },

  async toggleRule(id: number, enabled: boolean): Promise<RiskRule> {
    const response = await patch(RISK_ENGINE_ROUTES.RULE_TOGGLE(id), { enabled });
    const data = await response.json();
    return data.data || data;
  },

  async updateRulePoints(id: number, points: number): Promise<RiskRule> {
    const response = await patch(RISK_ENGINE_ROUTES.RULE_POINTS(id), { points });
    const data = await response.json();
    return data.data || data;
  },

  // Thresholds
  async getThresholds(): Promise<RiskThreshold[]> {
    const response = await get(RISK_ENGINE_ROUTES.THRESHOLDS);
    const data = await response.json();
    return data.data || data;
  },

  async updateThreshold(id: number, threshold: Partial<RiskThreshold>): Promise<RiskThreshold> {
    const response = await put(RISK_ENGINE_ROUTES.THRESHOLD_BY_ID(id), threshold);
    const data = await response.json();
    return data.data || data;
  },

  async toggleThreshold(id: number, enabled: boolean): Promise<RiskThreshold> {
    const response = await patch(RISK_ENGINE_ROUTES.THRESHOLD_TOGGLE(id), { enabled });
    const data = await response.json();
    return data.data || data;
  },

  // Events (read-only)
  async getEvents(params: {
    page?: number;
    size?: number;
    username?: string;
    minScore?: number;
    eventType?: string;
    actionTaken?: string;
  }): Promise<{ content: RiskEvent[]; totalElements: number; totalPages: number }> {
    const url = buildUrlWithParams(RISK_ENGINE_ROUTES.EVENTS, params);
    const response = await get(url);
    const data = await response.json();
    return data.data || data;
  },

  async getEventStats(days: number = 7): Promise<RiskStats> {
    const url = buildUrlWithParams(RISK_ENGINE_ROUTES.STATS, { days });
    const response = await get(url);
    const data = await response.json();
    return data.data || data;
  },

  // Category helpers
  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      LOCATION: 'Ubicación',
      TIME: 'Horario',
      DEVICE: 'Dispositivo',
      VELOCITY: 'Velocidad',
      AMOUNT: 'Monto',
      BEHAVIOR: 'Comportamiento',
    };
    return labels[category] || category;
  },

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      LOCATION: 'blue',
      TIME: 'purple',
      DEVICE: 'orange',
      VELOCITY: 'red',
      AMOUNT: 'green',
      BEHAVIOR: 'cyan',
    };
    return colors[category] || 'gray';
  },

  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      ALLOW: 'Permitir',
      MFA_REQUIRED: 'Requiere MFA',
      STEP_UP_AUTH: 'Verificación Adicional',
      BLOCK: 'Bloquear',
      NOTIFY_ADMIN: 'Notificar Admin',
      ALLOWED: 'Permitido',
      MFA_REQUESTED: 'MFA Solicitado',
      BLOCKED: 'Bloqueado',
      ADMIN_NOTIFIED: 'Admin Notificado',
    };
    return labels[action] || action;
  },

  getActionColor(action: string): string {
    const colors: Record<string, string> = {
      ALLOW: 'green',
      ALLOWED: 'green',
      MFA_REQUIRED: 'yellow',
      MFA_REQUESTED: 'yellow',
      STEP_UP_AUTH: 'orange',
      BLOCK: 'red',
      BLOCKED: 'red',
      NOTIFY_ADMIN: 'purple',
      ADMIN_NOTIFIED: 'purple',
    };
    return colors[action] || 'gray';
  },
};
