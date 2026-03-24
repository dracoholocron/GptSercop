/**
 * useActiveAlerts Hook
 * Fetches and combines today's + overdue alerts for the Stories carousel.
 * Deduplicates, filters out completed/cancelled, sorts by overdue > priority > time.
 */

import { useState, useEffect, useCallback } from 'react';
import { getTodayAlerts, getOverdueAlerts } from '../services/alertService';
import type { AlertResponse } from '../services/alertService';

const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
};

const MAX_ALERTS = 20;
const REFRESH_INTERVAL = 60000; // 60 seconds

interface UseActiveAlertsReturn {
  alerts: AlertResponse[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useActiveAlerts = (): UseActiveAlertsReturn => {
  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const [todayAlerts, overdueAlerts] = await Promise.all([
        getTodayAlerts(),
        getOverdueAlerts(),
      ]);

      // Combine and deduplicate by alertId
      const alertMap = new Map<string, AlertResponse>();
      for (const alert of [...overdueAlerts, ...todayAlerts]) {
        if (!alertMap.has(alert.alertId)) {
          alertMap.set(alert.alertId, alert);
        }
      }

      // Filter out completed and cancelled
      const active = Array.from(alertMap.values()).filter(
        (a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED'
      );

      // Sort: overdue first, then by priority, then by scheduled time
      active.sort((a, b) => {
        // Overdue first
        if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
        // Then by priority
        const pa = PRIORITY_ORDER[a.priority] ?? 2;
        const pb = PRIORITY_ORDER[b.priority] ?? 2;
        if (pa !== pb) return pa - pb;
        // Then by scheduled time
        const ta = a.scheduledTime || '';
        const tb = b.scheduledTime || '';
        return ta.localeCompare(tb);
      });

      setAlerts(active.slice(0, MAX_ALERTS));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return { alerts, loading, error, refresh: fetchAlerts };
};
