import { get, post, put, del } from '../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

export interface CPProcessData {
  id: string;
  processId: string;
  countryCode: string;
  processType: string;
  processCode: string;
  entityRuc: string;
  entityName: string;
  status: string;
  formData: string; // JSON string
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface CreateProcessRequest {
  countryCode: string;
  processType: string;
  entityRuc?: string;
  entityName?: string;
  formData?: Record<string, unknown>;
}

export interface UpdateProcessRequest {
  formData?: Record<string, unknown>;
  status?: string;
}

export interface ProcessListResponse {
  content: CPProcessData[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ============================================================================
// API Functions
// ============================================================================

const BASE_URL = '/api/compras-publicas/process';
const ENABLE_CP_API = import.meta.env.VITE_ENABLE_CP_API !== 'false';

export const createProcess = async (request: CreateProcessRequest): Promise<CPProcessData> => {
  const response = await post(BASE_URL, request);
  return response.json();
};

export const updateProcess = async (
  processId: string,
  request: UpdateProcessRequest
): Promise<CPProcessData> => {
  const response = await put(`${BASE_URL}/${processId}`, request);
  return response.json();
};

export const getProcess = async (processId: string): Promise<CPProcessData> => {
  const response = await get(`${BASE_URL}/${processId}`);
  return response.json();
};

export const listProcesses = async (
  countryCode: string = 'EC',
  processType?: string,
  status?: string,
  entityRuc?: string,
  page: number = 0,
  size: number = 20
): Promise<ProcessListResponse> => {
  if (!ENABLE_CP_API) {
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: page,
      size,
    };
  }
  const searchParams = new URLSearchParams({
    countryCode, page: String(page), size: String(size),
  });
  if (processType) searchParams.append('processType', processType);
  if (status) searchParams.append('status', status);
  if (entityRuc) searchParams.append('entityRuc', entityRuc);

  const response = await get(`${BASE_URL}?${searchParams.toString()}`);
  if (!response.ok) {
    // Compare/hybrid mode may not expose CP endpoints for all roles.
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: page,
      size,
    };
  }

  const payload = await response.json();
  if (Array.isArray(payload)) {
    return {
      content: payload as CPProcessData[],
      totalElements: payload.length,
      totalPages: 1,
      number: page,
      size,
    };
  }
  if (Array.isArray(payload?.data)) {
    return {
      content: payload.data as CPProcessData[],
      totalElements: payload.data.length,
      totalPages: 1,
      number: page,
      size,
    };
  }
  return payload as ProcessListResponse;
};

export const deleteProcess = async (processId: string): Promise<void> => {
  await del(`${BASE_URL}/${processId}`);
};

// ============================================================================
// Helpers
// ============================================================================

export const parseFormData = (process: CPProcessData): Record<string, unknown> => {
  try {
    return JSON.parse(process.formData || '{}');
  } catch {
    return {};
  }
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    BORRADOR: 'gray',
    EN_REVISION: 'blue',
    APROBADO: 'green',
    PUBLICADO: 'teal',
    ADJUDICADO: 'purple',
    CANCELADO: 'red',
    DESIERTO: 'orange',
    FINALIZADO: 'cyan',
  };
  return colors[status] || 'gray';
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    BORRADOR: 'Borrador',
    EN_REVISION: 'En Revisión',
    APROBADO: 'Aprobado',
    PUBLICADO: 'Publicado',
    ADJUDICADO: 'Adjudicado',
    CANCELADO: 'Cancelado',
    DESIERTO: 'Desierto',
    FINALIZADO: 'Finalizado',
  };
  return labels[status] || status;
};
