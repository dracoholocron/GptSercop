import { get, post, put, del } from '../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

export interface CPPAAWorkspace {
  id: number;
  workspaceCode: string;
  entityRuc: string;
  entityName: string;
  fiscalYear: number;
  sectorCode: string;
  methodologyId: number | null;
  coordinatorUserId: string;
  coordinatorUserName: string;
  totalBudget: number | null;
  status: string;
  consolidatedData: string | null;
  consolidatedPaaId: string | null;
  notes: string | null;
  departmentPlans: CPPAADepartmentPlan[];
  createdAt: string;
  updatedAt: string;
}

export interface CPPAADepartmentPlan {
  id: number;
  workspaceId: number | null;
  departmentName: string;
  departmentCode: string;
  assignedUserId: string | null;
  assignedUserName: string | null;
  departmentBudget: number | null;
  currentPhase: number;
  totalPhases: number;
  phaseData: string | null;
  itemsData: string | null;
  itemsCount: number;
  itemsTotalBudget: number;
  status: string;
  rejectionReason: string | null;
  notes: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  lastModifiedBy: string | null;
  lastModifiedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceDashboard {
  workspace: CPPAAWorkspace;
  departments: CPPAADepartmentPlan[];
  totalItems: number;
  totalBudget: number;
  completedDepts: number;
  inProgressDepts: number;
  pendingDepts: number;
}

export interface CPPAAWorkspaceComment {
  id: number;
  workspaceId: number;
  departmentPlanId: number | null;
  authorUserId: string;
  authorUserName: string;
  authorRole: 'COORDINATOR' | 'DEPARTMENT' | 'OBSERVER';
  content: string;
  anchorField?: string | null;
  anchorPhaseIndex?: number | null;
  parentCommentId?: number | null;
  createdAt: string;
}

export interface CPPAAWorkspaceObserver {
  id: number;
  workspaceId: number;
  userId: string;
  userName: string;
  role: string;
  addedBy: string;
  addedAt: string;
}

export interface WorkspaceParticipant {
  userId: string;
  userName: string;
  role: 'COORDINATOR' | 'DEPARTMENT' | 'OBSERVER';
  departmentName?: string;
  online: boolean;
}

export interface PAAWorkspaceEvent {
  type: 'PAA_WORKSPACE_EVENT';
  workspaceId: number;
  event: string;
  data: Record<string, any>;
  timestamp: number;
}

// ============================================================================
// API Functions
// ============================================================================

const BASE_URL = '/api/compras-publicas/paa/workspaces';

/** Create a new workspace */
export const createWorkspace = async (data: {
  entityRuc: string;
  entityName: string;
  fiscalYear: number;
  sectorCode?: string;
  methodologyId?: number;
  totalBudget?: number;
  coordinatorUserName?: string;
}): Promise<CPPAAWorkspace> => {
  const response = await post(BASE_URL, data);
  return response.json();
};

/** Get workspace with department plans */
export const getWorkspace = async (id: number): Promise<CPPAAWorkspace> => {
  const response = await get(`${BASE_URL}/${id}`);
  return response.json();
};

/** List workspaces by fiscal year */
export const listWorkspaces = async (fiscalYear = 2026): Promise<CPPAAWorkspace[]> => {
  const response = await get(`${BASE_URL}?fiscalYear=${fiscalYear}`);
  return response.json();
};

/** List my workspaces as coordinator */
export const listMyWorkspaces = async (): Promise<CPPAAWorkspace[]> => {
  const response = await get(`${BASE_URL}/my`);
  return response.json();
};

/** Update workspace status */
export const updateWorkspaceStatus = async (id: number, status: string): Promise<CPPAAWorkspace> => {
  const response = await put(`${BASE_URL}/${id}/status`, { status });
  return response.json();
};

/** Get workspace dashboard data */
export const getWorkspaceDashboard = async (id: number): Promise<WorkspaceDashboard> => {
  const response = await get(`${BASE_URL}/${id}/dashboard`);
  return response.json();
};

/** Consolidate all approved department plans */
export const consolidateWorkspace = async (id: number): Promise<CPPAAWorkspace> => {
  const response = await post(`${BASE_URL}/${id}/consolidate`, {});
  return response.json();
};

// ========================================================================
// Department Plan endpoints
// ========================================================================

/** Add department to workspace */
export const addDepartment = async (workspaceId: number, data: {
  departmentName: string;
  departmentCode: string;
  assignedUserId?: string;
  assignedUserName?: string;
  departmentBudget?: number;
}): Promise<CPPAADepartmentPlan> => {
  const response = await post(`${BASE_URL}/${workspaceId}/departments`, data);
  return response.json();
};

/** Get department plan by ID */
export const getDepartmentPlan = async (id: number): Promise<CPPAADepartmentPlan> => {
  const response = await get(`${BASE_URL}/departments/${id}`);
  return response.json();
};

/** Get my assigned department plans */
export const getMyDepartmentPlans = async (): Promise<CPPAADepartmentPlan[]> => {
  const response = await get(`${BASE_URL}/departments/my`);
  return response.json();
};

/** Update phase data for a department plan (triggers real-time notification) */
export const updatePhaseData = async (
  departmentPlanId: number,
  phaseNumber: number,
  phaseData: string
): Promise<CPPAADepartmentPlan> => {
  const response = await put(`${BASE_URL}/departments/${departmentPlanId}/phase-data`, {
    phaseNumber,
    phaseData,
  });
  return response.json();
};

/** Update items data without changing status (inline edit) */
export const updateItemsData = async (
  departmentPlanId: number,
  itemsData: string,
  itemsCount: number,
  itemsTotalBudget: number
): Promise<CPPAADepartmentPlan> => {
  const response = await put(`${BASE_URL}/departments/${departmentPlanId}/items-data`, {
    itemsData,
    itemsCount,
    itemsTotalBudget,
  });
  return response.json();
};

/** Submit department plan for review */
export const submitDepartmentPlan = async (
  departmentPlanId: number,
  itemsData: string,
  itemsCount: number,
  itemsTotalBudget: number
): Promise<CPPAADepartmentPlan> => {
  const response = await put(`${BASE_URL}/departments/${departmentPlanId}/submit`, {
    itemsData,
    itemsCount,
    itemsTotalBudget,
  });
  return response.json();
};

/** Approve department plan */
export const approveDepartmentPlan = async (id: number): Promise<CPPAADepartmentPlan> => {
  const response = await put(`${BASE_URL}/departments/${id}/approve`, {});
  return response.json();
};

/** Reject department plan */
export const rejectDepartmentPlan = async (id: number, reason: string): Promise<CPPAADepartmentPlan> => {
  const response = await put(`${BASE_URL}/departments/${id}/reject`, { reason });
  return response.json();
};

// ========================================================================
// Comments
// ========================================================================

/** Get workspace comments/observations */
export const getWorkspaceComments = async (workspaceId: number): Promise<CPPAAWorkspaceComment[]> => {
  const response = await get(`${BASE_URL}/${workspaceId}/comments`);
  return response.json();
};

/** Add a comment/observation to workspace */
export const addWorkspaceComment = async (workspaceId: number, data: {
  content: string;
  authorUserName?: string;
  authorRole?: string;
  departmentPlanId?: number;
}): Promise<CPPAAWorkspaceComment> => {
  const response = await post(`${BASE_URL}/${workspaceId}/comments`, data);
  return response.json();
};

// ========================================================================
// Participants
// ========================================================================

/** Get workspace participants with online status */
export const getWorkspaceParticipants = async (workspaceId: number): Promise<WorkspaceParticipant[]> => {
  const response = await get(`${BASE_URL}/${workspaceId}/participants`);
  return response.json();
};

// ========================================================================
// Observers
// ========================================================================

/** Add observer to workspace */
export const addWorkspaceObserver = async (workspaceId: number, data: {
  userId: string;
  userName: string;
  role?: string;
}): Promise<CPPAAWorkspaceObserver> => {
  const response = await post(`${BASE_URL}/${workspaceId}/observers`, data);
  return response.json();
};

/** Get workspace observers */
export const getWorkspaceObservers = async (workspaceId: number): Promise<CPPAAWorkspaceObserver[]> => {
  const response = await get(`${BASE_URL}/${workspaceId}/observers`);
  return response.json();
};

/** Remove observer from workspace */
export const removeWorkspaceObserver = async (workspaceId: number, userId: string): Promise<void> => {
  await del(`${BASE_URL}/${workspaceId}/observers/${userId}`);
};

// ========================================================================
// Field-level (inline) comments
// ========================================================================

/** Add a field-anchored comment */
export const addFieldComment = async (workspaceId: number, data: {
  departmentPlanId: number;
  anchorField: string;
  anchorPhaseIndex: number;
  content: string;
  authorUserName?: string;
  authorRole?: string;
  parentCommentId?: number;
}): Promise<CPPAAWorkspaceComment> => {
  const response = await post(`${BASE_URL}/${workspaceId}/field-comments`, data);
  return response.json();
};

/** Get field comments for a specific field + phase */
export const getFieldComments = async (
  workspaceId: number,
  departmentPlanId: number,
  anchorField: string,
  anchorPhaseIndex: number
): Promise<CPPAAWorkspaceComment[]> => {
  const response = await get(
    `${BASE_URL}/${workspaceId}/field-comments?departmentPlanId=${departmentPlanId}&anchorField=${anchorField}&anchorPhaseIndex=${anchorPhaseIndex}`
  );
  return response.json();
};

/** Get comment counts per field for badge display */
export const getFieldCommentCounts = async (
  workspaceId: number,
  departmentPlanId: number
): Promise<Record<string, number>> => {
  const response = await get(`${BASE_URL}/${workspaceId}/field-comment-counts?departmentPlanId=${departmentPlanId}`);
  return response.json();
};

// ========================================================================
// Proposals with voting
// ========================================================================

export interface CPPAAWorkspaceProposal {
  id: number;
  workspaceId: number;
  departmentPlanId: number;
  anchorField: string;
  anchorPhaseIndex: number;
  proposerUserId: string;
  proposerName: string;
  currentValue: string;
  proposedValue: string;
  justification: string;
  status: 'OPEN' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'WITHDRAWN';
  votesRequired: number;
  votesApprove: number;
  votesReject: number;
  resolvedAt: string | null;
  resolvedBy: string | null;
  votes?: CPPAAWorkspaceProposalVote[];
  createdAt: string;
  updatedAt: string;
}

export interface CPPAAWorkspaceProposalVote {
  id: number;
  proposalId: number;
  voterUserId: string;
  voterName: string;
  voteType: 'APPROVE' | 'REJECT';
  comment: string | null;
  votedAt: string;
}

/** Create a change proposal */
export const createProposal = async (workspaceId: number, data: {
  departmentPlanId: number;
  anchorField: string;
  anchorPhaseIndex: number;
  currentValue: string;
  proposedValue: string;
  justification: string;
  proposerName?: string;
}): Promise<CPPAAWorkspaceProposal> => {
  const response = await post(`${BASE_URL}/${workspaceId}/proposals`, data);
  return response.json();
};

/** List proposals for a workspace */
export const getProposals = async (
  workspaceId: number,
  status?: string
): Promise<CPPAAWorkspaceProposal[]> => {
  const url = status
    ? `${BASE_URL}/${workspaceId}/proposals?status=${status}`
    : `${BASE_URL}/${workspaceId}/proposals`;
  const response = await get(url);
  return response.json();
};

/** Get proposal detail with votes */
export const getProposalDetail = async (
  workspaceId: number,
  proposalId: number
): Promise<CPPAAWorkspaceProposal> => {
  const response = await get(`${BASE_URL}/${workspaceId}/proposals/${proposalId}`);
  return response.json();
};

/** Vote on a proposal */
export const voteOnProposal = async (workspaceId: number, proposalId: number, data: {
  voteType: 'APPROVE' | 'REJECT';
  comment?: string;
  voterName?: string;
}): Promise<CPPAAWorkspaceProposal> => {
  const response = await post(`${BASE_URL}/${workspaceId}/proposals/${proposalId}/vote`, data);
  return response.json();
};

/** Apply an approved proposal (coordinator only) */
export const applyProposal = async (
  workspaceId: number,
  proposalId: number
): Promise<CPPAAWorkspaceProposal> => {
  const response = await post(`${BASE_URL}/${workspaceId}/proposals/${proposalId}/apply`, {});
  return response.json();
};

/** Withdraw a proposal (proposer only) */
export const withdrawProposal = async (
  workspaceId: number,
  proposalId: number
): Promise<void> => {
  await del(`${BASE_URL}/${workspaceId}/proposals/${proposalId}`);
};

/** Get open proposal counts per field for badge display */
export const getProposalCounts = async (
  workspaceId: number,
  departmentPlanId: number
): Promise<Record<string, number>> => {
  const response = await get(`${BASE_URL}/${workspaceId}/proposal-counts?departmentPlanId=${departmentPlanId}`);
  return response.json();
};

// ============================================================================
// Event parsing helper
// ============================================================================

/** Parse a workspace real-time event from an instant message */
export const parseWorkspaceEvent = (messageText: string): PAAWorkspaceEvent | null => {
  try {
    const parsed = JSON.parse(messageText);
    if (parsed && parsed.type === 'PAA_WORKSPACE_EVENT') {
      return parsed as PAAWorkspaceEvent;
    }
    return null;
  } catch {
    return null;
  }
};

// ============================================================================
// Helpers
// ============================================================================

export const getWorkspaceStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    ABIERTO: 'blue',
    EN_REVISION: 'yellow',
    CONSOLIDADO: 'orange',
    APROBADO: 'green',
    PUBLICADO: 'purple',
  };
  return colors[status] || 'gray';
};

export const getDeptStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    PENDIENTE: 'gray',
    EN_PROGRESO: 'blue',
    ENVIADO: 'yellow',
    APROBADO: 'green',
    RECHAZADO: 'red',
    CONSOLIDADO: 'purple',
  };
  return colors[status] || 'gray';
};

export const getDeptStatusIcon = (status: string): string => {
  const icons: Record<string, string> = {
    PENDIENTE: '⚪',
    EN_PROGRESO: '🔵',
    ENVIADO: '🟡',
    APROBADO: '✅',
    RECHAZADO: '🔴',
    CONSOLIDADO: '🟣',
  };
  return icons[status] || '⚪';
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ========================================================================
// Field Change Log — Track Changes
// ========================================================================

export interface CPPAAFieldChangeLog {
  id: number;
  workspaceId: number;
  departmentPlanId: number;
  fieldCode: string;
  phaseIndex: number;
  oldValue: string | null;
  newValue: string | null;
  changedByUserId: string;
  changedByName: string;
  changedAt: string;
}

export async function getLatestFieldChanges(workspaceId: number, departmentPlanId: number): Promise<CPPAAFieldChangeLog[]> {
  const url = `${BASE_URL}/${workspaceId}/field-changes?departmentPlanId=${departmentPlanId}`;
  const response = await get(url);
  return response.json();
}

export async function getFieldChangeHistory(
  workspaceId: number, departmentPlanId: number,
  fieldCode: string, phaseIndex: number
): Promise<CPPAAFieldChangeLog[]> {
  const url = `${BASE_URL}/${workspaceId}/field-change-history?departmentPlanId=${departmentPlanId}&fieldCode=${encodeURIComponent(fieldCode)}&phaseIndex=${phaseIndex}`;
  const response = await get(url);
  return response.json();
}
