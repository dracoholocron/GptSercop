/**
 * useDashboardStories Hook
 * Fetches and normalizes 5 data sources into a unified StoryItem[] for the dashboard carousel:
 *   1. Active alerts (today + overdue)
 *   2. SWIFT drafts pending
 *   3. Pending registration requests
 *   4. Business requests (my pending)
 *   5. Latest exchange rates (cotizaciones) per currency
 *
 * All sources are fetched in parallel and mapped to a common StoryItem type.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FiBell, FiCalendar, FiClock, FiCheckSquare, FiFileText, FiUsers, FiTrendingUp, FiShield, FiVideo, FiEdit, FiInbox, FiBriefcase, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { getTodayAlerts, getOverdueAlerts, getMyPendingRequests } from '../services/alertService';
import { swiftDraftService } from '../services/swiftDraftService';
import { backofficeRequestService } from '../services/backofficeRequestService';
import { cotizacionService } from '../services/exchangeRateService';
import { pendingApprovalQueries } from '../services/pendingApprovalService';
import type { AlertResponse, AlertType } from '../services/alertService';
import type { IconType } from 'react-icons';

// ============================================================================
// TYPES
// ============================================================================

export type StoryCategory = 'PENDING_APPROVAL' | 'ALERT' | 'DRAFT' | 'PENDING_REGISTRATION' | 'BUSINESS_REQUEST' | 'EXCHANGE_RATE';

export interface StoryItem {
  id: string;
  category: StoryCategory;
  title: string;
  subtitle?: string;
  icon: IconType;
  bgGradient: string;
  priorityBadge?: string;
  statusColor: string;
  isOverdue?: boolean;
  isUrgent?: boolean;
  timestamp?: string;
  navigateTo: string;
  metadata?: string;
}

export interface StoryCounts {
  approvals: number;
  alerts: number;
  drafts: number;
  pending: number;
  requests: number;
  rates: number;
}

export interface UseDashboardStoriesReturn {
  items: StoryItem[];
  loading: boolean;
  error: string | null;
  counts: StoryCounts;
  refresh: () => Promise<void>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_ITEMS = 30;
const REFRESH_INTERVAL = 60000; // 60s

const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
};

const ALERT_TYPE_ICONS: Record<AlertType, IconType> = {
  FOLLOW_UP: FiCalendar,
  REMINDER: FiBell,
  DEADLINE: FiClock,
  TASK: FiCheckSquare,
  DOCUMENT_REVIEW: FiFileText,
  CLIENT_CONTACT: FiUsers,
  OPERATION_UPDATE: FiTrendingUp,
  COMPLIANCE_CHECK: FiShield,
  VIDEO_CALL: FiVideo,
};

const ALERT_TYPE_GRADIENTS: Record<AlertType, string> = {
  FOLLOW_UP: 'linear-gradient(135deg, #4299E1 0%, #3182CE 100%)',
  REMINDER: 'linear-gradient(135deg, #9F7AEA 0%, #805AD5 100%)',
  DEADLINE: 'linear-gradient(135deg, #FC8181 0%, #E53E3E 100%)',
  TASK: 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)',
  DOCUMENT_REVIEW: 'linear-gradient(135deg, #ED8936 0%, #DD6B20 100%)',
  CLIENT_CONTACT: 'linear-gradient(135deg, #38B2AC 0%, #319795 100%)',
  OPERATION_UPDATE: 'linear-gradient(135deg, #0BC5EA 0%, #00B5D8 100%)',
  COMPLIANCE_CHECK: 'linear-gradient(135deg, #ECC94B 0%, #D69E2E 100%)',
  VIDEO_CALL: 'linear-gradient(135deg, #48BB78 0%, #2F855A 100%)',
};

const PENDING_APPROVAL_GRADIENT = 'linear-gradient(135deg, #E53E3E 0%, #C53030 50%, #9B2C2C 100%)';
const DRAFT_GRADIENT = 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)';
const PENDING_REG_GRADIENT = 'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)';
const BUSINESS_REQ_GRADIENT = 'linear-gradient(135deg, #F7971E 0%, #FFD200 100%)';
const EXCHANGE_RATE_GRADIENT = 'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)';

// Currency flag emojis for visual flair
const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  CHF: '🇨🇭',
  CAD: '🇨🇦',
  MXN: '🇲🇽',
  BRL: '🇧🇷',
  COP: '🇨🇴',
  CLP: '🇨🇱',
  PEN: '🇵🇪',
  ARS: '🇦🇷',
  CNY: '🇨🇳',
};

const CURRENCY_GRADIENTS: Record<string, string> = {
  USD: 'linear-gradient(135deg, #1a5276 0%, #2e86c1 100%)',
  EUR: 'linear-gradient(135deg, #1b4f72 0%, #2874a6 100%)',
  GBP: 'linear-gradient(135deg, #4a235a 0%, #7d3c98 100%)',
  JPY: 'linear-gradient(135deg, #7b241c 0%, #c0392b 100%)',
  CHF: 'linear-gradient(135deg, #7b241c 0%, #a93226 100%)',
  CAD: 'linear-gradient(135deg, #641e16 0%, #c0392b 100%)',
  MXN: 'linear-gradient(135deg, #0e6251 0%, #148f77 100%)',
  BRL: 'linear-gradient(135deg, #0b5345 0%, #1e8449 100%)',
};

// ============================================================================
// MAPPERS
// ============================================================================

function mapAlerts(alerts: AlertResponse[]): StoryItem[] {
  // Deduplicate by alertId
  const alertMap = new Map<string, AlertResponse>();
  for (const alert of alerts) {
    if (!alertMap.has(alert.alertId)) {
      alertMap.set(alert.alertId, alert);
    }
  }

  // Filter out completed/cancelled
  const active = Array.from(alertMap.values()).filter(
    (a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED'
  );

  return active.map((alert): StoryItem => {
    const alertType = alert.alertType || 'TASK';
    return {
      id: `alert-${alert.alertId}`,
      category: 'ALERT',
      title: alert.title,
      subtitle: alert.clientName,
      icon: ALERT_TYPE_ICONS[alertType] || FiCheckSquare,
      bgGradient: ALERT_TYPE_GRADIENTS[alertType] || ALERT_TYPE_GRADIENTS.TASK,
      priorityBadge: (alert.priority === 'URGENT' || alert.priority === 'HIGH') ? alert.priority : undefined,
      statusColor: alert.status === 'IN_PROGRESS' ? '#4299E1' : alert.status === 'SNOOZED' ? '#9F7AEA' : '#48BB78',
      isOverdue: alert.overdue,
      isUrgent: alert.priority === 'URGENT',
      timestamp: alert.scheduledTime,
      navigateTo: '/alerts',
      metadata: alert.alertTypeLabel || alertType,
    };
  });
}

function mapPendingApprovals(approvals: { approvalId: string; productType: string; productTypeLabel?: string; reference?: string; currency?: string; amount?: number; submittedBy: string; submittedAt: string; messageType?: string; applicantName?: string; fieldComments?: Record<string, any> }[], t: (key: string, opts?: any) => string): StoryItem[] {
  return approvals.map((approval): StoryItem => {
    const hasFieldComments = approval.fieldComments && Object.keys(approval.fieldComments).length > 0;
    const label = approval.productTypeLabel || approval.productType?.replace(/_/g, ' ');
    return {
      id: `approval-${approval.approvalId}`,
      category: 'PENDING_APPROVAL',
      title: t('fieldComments.approveLabel', { label }),
      subtitle: approval.reference || approval.applicantName || approval.submittedBy,
      icon: FiAlertCircle,
      bgGradient: PENDING_APPROVAL_GRADIENT,
      priorityBadge: 'URGENT',
      statusColor: '#E53E3E',
      isUrgent: true,
      timestamp: approval.submittedAt,
      navigateTo: `/workbox/pending-approval`,
      metadata: approval.currency && approval.amount
        ? `${approval.currency} ${approval.amount.toLocaleString()}${hasFieldComments ? ` • ${t('fieldComments.withObservations')}` : ''}`
        : hasFieldComments ? t('fieldComments.withPreviousObservations') : undefined,
    };
  });
}

function mapDrafts(drafts: { draftId: string; messageType: string; productType: string; reference?: string; currency?: string; amount?: number; createdBy?: string; creationDate?: string }[]): StoryItem[] {
  return drafts.map((draft): StoryItem => ({
    id: `draft-${draft.draftId}`,
    category: 'DRAFT',
    title: `${draft.messageType} — ${draft.productType?.replace(/_/g, ' ')}`,
    subtitle: draft.reference || draft.createdBy,
    icon: FiEdit,
    bgGradient: DRAFT_GRADIENT,
    statusColor: '#667EEA',
    timestamp: draft.creationDate,
    navigateTo: '/workbox/drafts',
    metadata: draft.currency && draft.amount ? `${draft.currency} ${draft.amount.toLocaleString()}` : undefined,
  }));
}

function mapPendingRegistrations(requests: { id: string; clientName: string; productType: string; productTypeLabel?: string; requestNumber: string; amount?: number; currency?: string; createdAt: string }[]): StoryItem[] {
  return requests.map((req): StoryItem => ({
    id: `reg-${req.id}`,
    category: 'PENDING_REGISTRATION',
    title: req.clientName,
    subtitle: req.productTypeLabel || req.productType?.replace(/_/g, ' '),
    icon: FiInbox,
    bgGradient: PENDING_REG_GRADIENT,
    statusColor: '#11998E',
    timestamp: req.createdAt,
    navigateTo: '/workbox/drafts',
    metadata: req.currency && req.amount ? `${req.currency} ${req.amount.toLocaleString()}` : `#${req.requestNumber}`,
  }));
}

function mapBusinessRequests(requests: { requestId: string; title: string; clientName?: string; operationType?: string; status: string; createdAt?: string }[]): StoryItem[] {
  return requests
    .filter((r) => r.status === 'PENDING')
    .map((req): StoryItem => ({
      id: `biz-${req.requestId}`,
      category: 'BUSINESS_REQUEST',
      title: req.title,
      subtitle: req.clientName,
      icon: FiBriefcase,
      bgGradient: BUSINESS_REQ_GRADIENT,
      statusColor: '#F7971E',
      timestamp: req.createdAt,
      navigateTo: '/workbox/drafts',
      metadata: req.operationType?.replace(/_/g, ' '),
    }));
}

function mapExchangeRates(cotizaciones: { id: number; codigoMoneda: string; fecha: string; valorCompra: number; valorVenta: number }[]): StoryItem[] {
  // API already returns only the most recent date
  return cotizaciones.map((cot): StoryItem => {
    const flag = CURRENCY_FLAGS[cot.codigoMoneda] || '💱';
    return {
      id: `rate-${cot.codigoMoneda}`,
      category: 'EXCHANGE_RATE',
      title: `${flag} ${cot.codigoMoneda}`,
      subtitle: cot.fecha,
      icon: FiDollarSign,
      bgGradient: CURRENCY_GRADIENTS[cot.codigoMoneda] || EXCHANGE_RATE_GRADIENT,
      statusColor: '#2C5364',
      timestamp: cot.fecha,
      navigateTo: '/cotizaciones',
      metadata: `C: ${cot.valorCompra.toFixed(4)} | V: ${cot.valorVenta.toFixed(4)}`,
    };
  });
}

// ============================================================================
// SORTING
// ============================================================================

// Category display order: alerts first → pending ops → exchange rates last
const CATEGORY_ORDER: Record<StoryCategory, number> = {
  PENDING_APPROVAL: 0,
  ALERT: 1,
  DRAFT: 2,
  PENDING_REGISTRATION: 3,
  BUSINESS_REQUEST: 4,
  EXCHANGE_RATE: 5,
};

function sortStoryItems(items: StoryItem[]): StoryItem[] {
  return [...items].sort((a, b) => {
    // 1. Category group: alerts → operations → rates
    const ca = CATEGORY_ORDER[a.category];
    const cb = CATEGORY_ORDER[b.category];
    if (ca !== cb) return ca - cb;

    // 2. Within same category: overdue first
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    // 3. Urgent next
    if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
    // 4. By priority badge
    const pa = PRIORITY_ORDER[a.priorityBadge || ''] ?? 99;
    const pb = PRIORITY_ORDER[b.priorityBadge || ''] ?? 99;
    if (pa !== pb) return pa - pb;
    // 5. By timestamp (newest first)
    const ta = a.timestamp || '';
    const tb = b.timestamp || '';
    return tb.localeCompare(ta);
  });
}

// ============================================================================
// HOOK
// ============================================================================

export const useDashboardStories = (): UseDashboardStoriesReturn => {
  const { t } = useTranslation();
  const [items, setItems] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<StoryCounts>({ approvals: 0, alerts: 0, drafts: 0, pending: 0, requests: 0, rates: 0 });

  const fetchAll = useCallback(async () => {
    try {
      setError(null);

      const [todayAlerts, overdueAlerts, drafts, pendingRegs, bizRequests, cotizaciones, pendingApprovals] = await Promise.all([
        getTodayAlerts().catch(() => []),
        getOverdueAlerts().catch(() => []),
        swiftDraftService.searchDrafts({ status: 'DRAFT' as const }).catch(() => []),
        backofficeRequestService.getPendingRegistration().catch(() => []),
        getMyPendingRequests().catch(() => []),
        cotizacionService.getLatestCotizaciones().catch(() => []),
        pendingApprovalQueries.getAllPending().catch(() => []),
      ]);

      const approvalItems = mapPendingApprovals(pendingApprovals, t);
      const alertItems = mapAlerts([...overdueAlerts, ...todayAlerts]);
      const draftItems = mapDrafts(drafts);
      const pendingItems = mapPendingRegistrations(pendingRegs);
      const bizItems = mapBusinessRequests(bizRequests);
      const rateItems = mapExchangeRates(cotizaciones);

      setCounts({
        approvals: approvalItems.length,
        alerts: alertItems.length,
        drafts: draftItems.length,
        pending: pendingItems.length,
        requests: bizItems.length,
        rates: rateItems.length,
      });

      const all = sortStoryItems([...approvalItems, ...alertItems, ...draftItems, ...pendingItems, ...bizItems, ...rateItems]);
      setItems(all.slice(0, MAX_ITEMS));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading dashboard stories');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { items, loading, error, counts, refresh: fetchAll };
};
