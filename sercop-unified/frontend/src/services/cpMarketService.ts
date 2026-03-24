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

export const getInflationIndices = async (countryCode: string = 'EC'): Promise<CPInflationIndex[]> => {
  const response = await get(`${BASE_URL}/inflation/${countryCode}`);
  return response.json();
};

export const getInflationAdjustedPrice = async (
  price: number,
  fromMonth: string,
  toMonth: string,
  countryCode: string = 'EC'
): Promise<InflationAdjustedPrice> => {
  const searchParams = new URLSearchParams({
    price: String(price), fromMonth, toMonth, countryCode,
  });
  const response = await get(`${BASE_URL}/inflation/adjust-price?${searchParams.toString()}`);
  return response.json();
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
  const response = await get(`${BASE_URL}/rfi/${id}`);
  return response.json();
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
  const response = await get(`${BASE_URL}/rfi/${rfiId}/statistics`);
  return response.json();
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
