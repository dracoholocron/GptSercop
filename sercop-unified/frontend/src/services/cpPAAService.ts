import { get, post, put, del } from '../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

export interface CPPAA {
  id: string;
  entityRuc: string;
  entityName: string;
  countryCode: string;
  fiscalYear: number;
  version: number;
  status: string;
  totalBudget: number;
  approvalDate: string | null;
  approvedBy: string | null;
  formData: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  items: CPPAAItem[];
}

export interface CPPAAItem {
  id: string;
  lineNumber: number;
  cpcCode: string;
  cpcDescription: string;
  itemDescription: string;
  processType: string;
  budgetAmount: number;
  budgetPartition: string;
  fundingSource: string;
  department: string;
  estimatedPublicationDate: string;
  estimatedAdjudicationDate: string;
  estimatedContractDurationDays: number;
  priority: string;
  status: string;
  linkedProcessId: string | null;
}

export interface CPPAAModification {
  id: string;
  modificationNumber: number;
  modificationDate: string;
  reason: string;
  approvedBy: string;
}

export interface DemandAggregation {
  cpcCode: string;
  cpcDescription: string;
  totalAmount: number;
  itemCount: number;
  departmentCount: number;
}

export interface BudgetByDepartment {
  department: string;
  totalAmount: number;
  itemCount: number;
}

// ============================================================================
// API Functions
// ============================================================================

const BASE_URL = '/api/compras-publicas/paa';

export const createPAA = async (data: {
  entityRuc: string;
  entityName: string;
  countryCode: string;
  fiscalYear: number;
}): Promise<CPPAA> => {
  const response = await post(BASE_URL, data);
  return response.json();
};

export const getPAA = async (id: string): Promise<CPPAA> => {
  const response = await get(`${BASE_URL}/${id}`);
  return response.json();
};

export const listPAAs = async (
  countryCode: string = 'EC',
  fiscalYear?: number
): Promise<CPPAA[]> => {
  const searchParams = new URLSearchParams({ countryCode });
  if (fiscalYear) searchParams.append('fiscalYear', String(fiscalYear));
  const response = await get(`${BASE_URL}?${searchParams.toString()}`);
  return response.json();
};

export const addPAAItem = async (
  paaId: string,
  item: Omit<CPPAAItem, 'id'>
): Promise<CPPAAItem> => {
  const response = await post(`${BASE_URL}/${paaId}/items`, item);
  return response.json();
};

export const updatePAA = async (
  id: string,
  updates: Partial<Pick<CPPAA, 'entityName' | 'entityRuc' | 'totalBudget'>>
): Promise<CPPAA> => {
  const response = await put(`${BASE_URL}/${id}`, updates);
  return response.json();
};

export const updatePAAItem = async (
  itemId: string,
  updates: Partial<CPPAAItem>
): Promise<CPPAAItem> => {
  const response = await put(`${BASE_URL}/items/${itemId}`, updates);
  return response.json();
};

export const removePAAItem = async (itemId: string): Promise<void> => {
  await del(`${BASE_URL}/items/${itemId}`);
};

export const getDemandAggregation = async (paaId: string): Promise<DemandAggregation[]> => {
  const response = await get(`${BASE_URL}/${paaId}/demand-aggregation`);
  return response.json();
};

export const getBudgetByDepartment = async (paaId: string): Promise<BudgetByDepartment[]> => {
  const response = await get(`${BASE_URL}/${paaId}/budget-by-department`);
  return response.json();
};

export const updatePAAStatus = async (id: string, status: string): Promise<CPPAA> => {
  const response = await put(`${BASE_URL}/${id}/status`, { status });
  return response.json();
};

// ============================================================================
// Helpers
// ============================================================================

export const getPAAStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    BORRADOR: 'gray',
    ENVIADO: 'blue',
    APROBADO: 'green',
    REFORMADO: 'orange',
  };
  return colors[status] || 'gray';
};

export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    HIGH: 'red',
    MEDIUM: 'orange',
    LOW: 'green',
  };
  return colors[priority] || 'gray';
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency }).format(amount);
};
