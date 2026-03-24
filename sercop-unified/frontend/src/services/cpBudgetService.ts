import { get, post, put } from '../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

export interface CPBudgetCertificate {
  id: string;
  processId: string;
  paaItemId: string | null;
  certificateNumber: string;
  certificateDate: string;
  amount: number;
  budgetPartition: string;
  fundingSource: string;
  fiscalYear: number;
  status: string;
  erpReference: string | null;
  erpResponse: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CPBudgetExecution {
  id: string;
  certificateId: string;
  executionType: string;
  amount: number;
  executionDate: string;
  documentNumber: string;
  createdAt: string;
}

// ============================================================================
// API Functions
// ============================================================================

const BASE_URL = '/api/compras-publicas/budget';

export const createCertificate = async (data: {
  processId: string;
  paaItemId?: string;
  amount: number;
  budgetPartition: string;
  fundingSource: string;
  fiscalYear: number;
}): Promise<CPBudgetCertificate> => {
  const response = await post(`${BASE_URL}/certificates`, data);
  return response.json();
};

export const getCertificate = async (id: string): Promise<CPBudgetCertificate> => {
  const response = await get(`${BASE_URL}/certificates/${id}`);
  return response.json();
};

export const getCertificatesByProcess = async (processId: string): Promise<CPBudgetCertificate[]> => {
  const response = await get(`${BASE_URL}/certificates/process/${processId}`);
  return response.json();
};

export const updateCertificateStatus = async (
  id: string,
  status: string
): Promise<CPBudgetCertificate> => {
  const response = await put(`${BASE_URL}/certificates/${id}/status`, { status });
  return response.json();
};

export const addExecution = async (
  certId: string,
  data: {
    executionType: string;
    amount: number;
    documentNumber: string;
  }
): Promise<CPBudgetExecution> => {
  const response = await post(`${BASE_URL}/certificates/${certId}/executions`, data);
  return response.json();
};

export const getExecutions = async (certId: string): Promise<CPBudgetExecution[]> => {
  const response = await get(`${BASE_URL}/certificates/${certId}/executions`);
  return response.json();
};

// ============================================================================
// Helpers
// ============================================================================

export const getCertificateStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    SOLICITADO: 'blue',
    APROBADO: 'green',
    BLOQUEADO: 'orange',
    LIBERADO: 'teal',
    CANCELADO: 'red',
  };
  return colors[status] || 'gray';
};

export const getExecutionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    COMPROMISO: 'Compromiso',
    DEVENGADO: 'Devengado',
    PAGO: 'Pago',
  };
  return labels[type] || type;
};

export const getExecutionTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    COMPROMISO: 'blue',
    DEVENGADO: 'orange',
    PAGO: 'green',
  };
  return colors[type] || 'gray';
};
