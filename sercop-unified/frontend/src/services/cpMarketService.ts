import { get, post } from '../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

export interface CPInflationIndex {
  id: number;
  countryCode: string;
  yearMonth: string;
  indexValue: number;
  source: string;
}

export interface CPRFI {
  id: string;
  processId: string | null;
  title: string;
  description: string;
  cpcCode: string;
  cpcDescription: string;
  estimatedQuantity: number;
  unit: string;
  status: string;
  closingDate: string;
  createdAt: string;
  responses: CPRFIResponse[];
}

export interface CPRFIResponse {
  id: string;
  supplierRuc: string;
  supplierName: string;
  unitPrice: number;
  totalPrice: number;
  deliveryDays: number;
  observations: string;
  attachmentUrl: string | null;
  respondedAt: string;
}

export interface RFIStatistics {
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  medianPrice: number;
  responseCount: number;
}

export interface InflationAdjustedPrice {
  originalPrice: number;
  adjustedPrice: number;
  fromMonth: string;
  toMonth: string;
  adjustmentFactor: number;
}

// ============================================================================
// API Functions
// ============================================================================

const BASE_URL = '/api/compras-publicas/market';
const ENABLE_CP_API = import.meta.env.VITE_ENABLE_CP_API !== 'false';

const safeJson = async (response: Response): Promise<any> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const getInflationIndices = async (countryCode: string = 'EC'): Promise<CPInflationIndex[]> => {
  if (!ENABLE_CP_API) return [];
  const response = await get(`${BASE_URL}/inflation/${countryCode}`);
  if (!response.ok) return [];
  const payload = await safeJson(response);
  if (Array.isArray(payload)) return payload as CPInflationIndex[];
  if (Array.isArray(payload?.data)) return payload.data as CPInflationIndex[];
  if (Array.isArray(payload?.content)) return payload.content as CPInflationIndex[];
  return [];
};

export const getInflationAdjustedPrice = async (
  price: number,
  fromMonth: string,
  toMonth: string,
  countryCode: string = 'EC'
): Promise<InflationAdjustedPrice> => {
  if (!ENABLE_CP_API) {
    return {
      originalPrice: price,
      adjustedPrice: price,
      fromMonth,
      toMonth,
      adjustmentFactor: 1,
    };
  }
  const searchParams = new URLSearchParams({
    price: String(price), fromMonth, toMonth, countryCode,
  });
  const response = await get(`${BASE_URL}/inflation/adjust-price?${searchParams.toString()}`);
  if (!response.ok) {
    return {
      originalPrice: price,
      adjustedPrice: price,
      fromMonth,
      toMonth,
      adjustmentFactor: 1,
    };
  }
  const payload = await safeJson(response);
  return (payload?.data ?? payload) as InflationAdjustedPrice;
};

export const createRFI = async (data: {
  processId?: string;
  title: string;
  description: string;
  cpcCode: string;
  cpcDescription: string;
  estimatedQuantity: number;
  unit: string;
  closingDate: string;
}): Promise<CPRFI> => {
  const response = await post(`${BASE_URL}/rfi`, data);
  return response.json();
};

export const getRFI = async (id: string): Promise<CPRFI> => {
  if (!ENABLE_CP_API) {
    throw new Error('CP API disabled');
  }
  const response = await get(`${BASE_URL}/rfi/${id}`);
  if (!response.ok) {
    throw new Error(`RFI ${id} not available`);
  }
  const payload = await safeJson(response);
  return (payload?.data ?? payload) as CPRFI;
};

export const addRFIResponse = async (
  rfiId: string,
  data: {
    supplierRuc: string;
    supplierName: string;
    unitPrice: number;
    totalPrice: number;
    deliveryDays: number;
    observations: string;
  }
): Promise<CPRFIResponse> => {
  const response = await post(`${BASE_URL}/rfi/${rfiId}/responses`, data);
  return response.json();
};

export const getRFIStatistics = async (rfiId: string): Promise<RFIStatistics> => {
  if (!ENABLE_CP_API) {
    return { averagePrice: 0, minPrice: 0, maxPrice: 0, medianPrice: 0, responseCount: 0 };
  }
  const response = await get(`${BASE_URL}/rfi/${rfiId}/statistics`);
  if (!response.ok) {
    return { averagePrice: 0, minPrice: 0, maxPrice: 0, medianPrice: 0, responseCount: 0 };
  }
  const payload = await safeJson(response);
  return ((payload?.data ?? payload) || {
    averagePrice: 0,
    minPrice: 0,
    maxPrice: 0,
    medianPrice: 0,
    responseCount: 0,
  }) as RFIStatistics;
};

// ============================================================================
// Helpers
// ============================================================================

export const getRFIStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    ABIERTO: 'green',
    CERRADO: 'gray',
    CANCELADO: 'red',
  };
  return colors[status] || 'gray';
};
