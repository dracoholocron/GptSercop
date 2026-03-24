/**
 * useWorkspaceRealTime Hook
 * Subscribes to the workspace event bus, loads comments and participants,
 * provides real-time callbacks, a presence heartbeat, and change detection for toasts.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { subscribeToWorkspace } from '../realtime/workspaceEventBus';
import {
  type CPPAAWorkspaceComment,
  type CPPAAWorkspace,
  type WorkspaceParticipant,
  type PAAWorkspaceEvent,
  getWorkspaceComments,
  getWorkspaceParticipants,
  getWorkspace,
} from '../services/cpWorkspaceService';

// ============================================================================
// Types
// ============================================================================

export type RealtimeChangeType =
  | 'phase_edit'
  | 'items_edit'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'status_change'
  | 'comment'
  | 'proposal_created'
  | 'proposal_voted'
  | 'proposal_applied';

export interface RealtimeChange {
  id: string;
  changeType: RealtimeChangeType;
  modifiedByName: string;
  departmentName: string;
  departmentId?: number;
  timestamp: number;
}

interface UseWorkspaceRealTimeOptions {
  workspaceId: number | null;
  onDeptUpdate?: () => void;
  onDashboardRefresh?: () => void;
  onChangeDetected?: (change: RealtimeChange) => void;
  onFieldCommentCountsRefresh?: () => void;
  onProposalsRefresh?: () => void;
}

interface UseWorkspaceRealTimeReturn {
  comments: CPPAAWorkspaceComment[];
  participants: WorkspaceParticipant[];
  lastEvent: PAAWorkspaceEvent | null;
  refreshComments: () => Promise<void>;
  refreshParticipants: () => Promise<void>;
  updatedDeptId: number | null;
  recentChanges: RealtimeChange[];
  dismissChange: (id: string) => void;
}

// ============================================================================
// Event-to-change mapping
// ============================================================================

const EVENT_TO_CHANGE_TYPE: Record<string, RealtimeChangeType> = {
  PAA_DEPT_PHASE_UPDATE: 'phase_edit',
  PAA_DEPT_ITEMS_UPDATED: 'items_edit',
  PAA_DEPT_SUBMITTED: 'submitted',
  PAA_DEPT_APPROVED: 'approved',
  PAA_DEPT_REJECTED: 'rejected',
  PAA_WORKSPACE_STATUS_UPDATE: 'status_change',
  PAA_COMMENT_ADDED: 'comment',
  PAA_FIELD_COMMENT_ADDED: 'comment',
  PAA_PROPOSAL_CREATED: 'proposal_created',
  PAA_PROPOSAL_VOTED: 'proposal_voted',
  PAA_PROPOSAL_APPLIED: 'proposal_applied',
};

const MAX_RECENT_CHANGES = 20;
let changeIdCounter = 0;

// ============================================================================
// Hook
// ============================================================================

export function useWorkspaceRealTime({
  workspaceId,
  onDeptUpdate,
  onDashboardRefresh,
  onChangeDetected,
  onFieldCommentCountsRefresh,
  onProposalsRefresh,
}: UseWorkspaceRealTimeOptions): UseWorkspaceRealTimeReturn {
  const [comments, setComments] = useState<CPPAAWorkspaceComment[]>([]);
  const [participants, setParticipants] = useState<WorkspaceParticipant[]>([]);
  const [lastEvent, setLastEvent] = useState<PAAWorkspaceEvent | null>(null);
  const [updatedDeptId, setUpdatedDeptId] = useState<number | null>(null);
  const [recentChanges, setRecentChanges] = useState<RealtimeChange[]>([]);

  const onDeptUpdateRef = useRef(onDeptUpdate);
  const onDashboardRefreshRef = useRef(onDashboardRefresh);
  const onChangeDetectedRef = useRef(onChangeDetected);
  const onFieldCommentCountsRefreshRef = useRef(onFieldCommentCountsRefresh);
  const onProposalsRefreshRef = useRef(onProposalsRefresh);
  onDeptUpdateRef.current = onDeptUpdate;
  onDashboardRefreshRef.current = onDashboardRefresh;
  onChangeDetectedRef.current = onChangeDetected;
  onFieldCommentCountsRefreshRef.current = onFieldCommentCountsRefresh;
  onProposalsRefreshRef.current = onProposalsRefresh;

  const addChange = useCallback((change: RealtimeChange) => {
    setRecentChanges(prev => [change, ...prev].slice(0, MAX_RECENT_CHANGES));
    onChangeDetectedRef.current?.(change);
  }, []);

  const dismissChange = useCallback((id: string) => {
    setRecentChanges(prev => prev.filter(c => c.id !== id));
  }, []);

  const refreshComments = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const data = await getWorkspaceComments(workspaceId);
      setComments(data);
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  }, [workspaceId]);

  const refreshParticipants = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const data = await getWorkspaceParticipants(workspaceId);
      setParticipants(data);
    } catch (err) {
      console.error('Error loading participants:', err);
    }
  }, [workspaceId]);

  // Load initial data
  useEffect(() => {
    if (!workspaceId) return;
    refreshComments();
    refreshParticipants();
  }, [workspaceId, refreshComments, refreshParticipants]);

  // Subscribe to event bus
  useEffect(() => {
    if (!workspaceId) return;

    const unsubscribe = subscribeToWorkspace(workspaceId, (event: PAAWorkspaceEvent) => {
      setLastEvent(event);

      // Build RealtimeChange from event
      const changeType = EVENT_TO_CHANGE_TYPE[event.event];
      if (changeType) {
        const change: RealtimeChange = {
          id: `rt-${++changeIdCounter}-${Date.now()}`,
          changeType,
          modifiedByName: event.data.modifiedByName || event.data.authorUserName || event.data.proposerName || '',
          departmentName: event.data.departmentName || '',
          departmentId: event.data.departmentId || undefined,
          timestamp: event.timestamp,
        };
        addChange(change);
      }

      switch (event.event) {
        case 'PAA_COMMENT_ADDED':
          // Add comment locally from event data for instant feedback
          setComments(prev => [...prev, {
            id: event.data.commentId,
            workspaceId: event.workspaceId,
            departmentPlanId: event.data.departmentPlanId || null,
            authorUserId: event.data.authorUserId || '',
            authorUserName: event.data.authorUserName || '',
            authorRole: event.data.authorRole || 'COORDINATOR',
            content: event.data.content || '',
            createdAt: new Date(event.timestamp).toISOString(),
          }]);
          break;

        case 'PAA_DEPT_PHASE_UPDATE':
        case 'PAA_DEPT_SUBMITTED':
        case 'PAA_DEPT_APPROVED':
        case 'PAA_DEPT_REJECTED':
        case 'PAA_DEPT_ADDED':
        case 'PAA_DEPT_ITEMS_UPDATED':
          // Highlight the updated department card
          setUpdatedDeptId(event.data.departmentId || null);
          setTimeout(() => setUpdatedDeptId(null), 3000);
          // Trigger dashboard refresh
          onDeptUpdateRef.current?.();
          onDashboardRefreshRef.current?.();
          break;

        case 'PAA_WORKSPACE_STATUS_UPDATE':
        case 'PAA_WORKSPACE_CONSOLIDATED':
          onDashboardRefreshRef.current?.();
          break;

        case 'PAA_OBSERVER_ADDED':
        case 'PAA_OBSERVER_REMOVED':
          refreshParticipants();
          break;

        case 'PAA_FIELD_COMMENT_ADDED':
          onFieldCommentCountsRefreshRef.current?.();
          break;

        case 'PAA_PROPOSAL_CREATED':
        case 'PAA_PROPOSAL_VOTED':
        case 'PAA_PROPOSAL_APPLIED':
          onProposalsRefreshRef.current?.();
          break;
      }
    });

    return unsubscribe;
  }, [workspaceId, refreshParticipants, addChange]);

  // Presence heartbeat: refresh participants every 30s
  useEffect(() => {
    if (!workspaceId) return;
    const interval = setInterval(() => {
      refreshParticipants();
    }, 30000);
    return () => clearInterval(interval);
  }, [workspaceId, refreshParticipants]);

  // Polling real-time: check for changes every 5s by comparing updatedAt timestamps
  const timestampCacheRef = useRef<{ wsUpdatedAt: string; deptTimestamps: Record<number, string> }>({
    wsUpdatedAt: '',
    deptTimestamps: {},
  });

  useEffect(() => {
    if (!workspaceId) return;

    const pollForChanges = async () => {
      try {
        const ws: CPPAAWorkspace = await getWorkspace(workspaceId);

        const cache = timestampCacheRef.current;
        let changed = false;

        // Check workspace-level changes
        if (cache.wsUpdatedAt && cache.wsUpdatedAt !== ws.updatedAt) {
          changed = true;
          onDashboardRefreshRef.current?.();
        }
        cache.wsUpdatedAt = ws.updatedAt;

        // Check each department plan for changes
        if (ws.departmentPlans) {
          for (const dept of ws.departmentPlans) {
            const prevTs = cache.deptTimestamps[dept.id];
            if (prevTs && prevTs !== dept.updatedAt) {
              changed = true;
              setUpdatedDeptId(dept.id);
              setTimeout(() => setUpdatedDeptId(null), 3000);

              // Generate change from polling diff
              if (dept.lastModifiedByName) {
                addChange({
                  id: `poll-${++changeIdCounter}-${Date.now()}`,
                  changeType: 'phase_edit',
                  modifiedByName: dept.lastModifiedByName,
                  departmentName: dept.departmentName,
                  departmentId: dept.id,
                  timestamp: Date.now(),
                });
              }
            }
            cache.deptTimestamps[dept.id] = dept.updatedAt;
          }
        }

        if (changed) {
          onDeptUpdateRef.current?.();
        }
      } catch {
        // Silently ignore polling errors (network hiccups, etc.)
      }
    };

    const interval = setInterval(pollForChanges, 5000);
    return () => clearInterval(interval);
  }, [workspaceId, addChange]);

  return {
    comments,
    participants,
    lastEvent,
    refreshComments,
    refreshParticipants,
    updatedDeptId,
    recentChanges,
    dismissChange,
  };
}
