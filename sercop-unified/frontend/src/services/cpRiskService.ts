import { get, post, put } from '../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

export interface CPRiskAssessment {
  id: string;
  processId: string;
  assessmentDate: string;
  overallScore: number;
  riskLevel: string;
  aiAnalysisId: string | null;
  assessor: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: CPRiskItem[];
}

export interface CPRiskItem {
  id: string;
  indicatorCode: string;
  indicatorName: string;
  probability: number;
  impact: number;
  riskScore: number;
  detected: boolean;
  evidence: string;
  mitigationPlan: string;
  responsible: string;
  allocation: string;
  status: string;
}

export interface HeatMapData {
  id: string;
  indicatorCode: string;
  indicatorName: string;
  probability: number;
  impact: number;
  riskScore: number;
  detected: boolean;
}

// ============================================================================
// API Functions
// ============================================================================

const BASE_URL = '/api/compras-publicas/risk';

export const createAssessment = async (data: {
  processId: string;
  assessor?: string;
}): Promise<CPRiskAssessment> => {
  const response = await post(`${BASE_URL}/assessments`, data);
  return response.json();
};

export const getAssessment = async (id: string): Promise<CPRiskAssessment> => {
  const response = await get(`${BASE_URL}/assessments/${id}`);
  return response.json();
};

export const getAssessmentsByProcess = async (processId: string): Promise<CPRiskAssessment[]> => {
  const response = await get(`${BASE_URL}/assessments/process/${processId}`);
  return response.json();
};

export const addRiskItem = async (
  assessmentId: string,
  data: {
    indicatorCode: string;
    indicatorName: string;
    probability: number;
    impact: number;
    detected: boolean;
    evidence: string;
    mitigationPlan: string;
    responsible: string;
    allocation: string;
  }
): Promise<CPRiskItem> => {
  const response = await post(`${BASE_URL}/assessments/${assessmentId}/items`, data);
  return response.json();
};

export const updateRiskItem = async (
  itemId: string,
  updates: Partial<CPRiskItem>
): Promise<CPRiskItem> => {
  const response = await put(`${BASE_URL}/items/${itemId}`, updates);
  return response.json();
};

export const calculateOverallScore = async (
  assessmentId: string
): Promise<CPRiskAssessment> => {
  const response = await post(`${BASE_URL}/assessments/${assessmentId}/calculate`);
  return response.json();
};

export const getHeatMapData = async (assessmentId: string): Promise<HeatMapData[]> => {
  const response = await get(`${BASE_URL}/assessments/${assessmentId}/heatmap`);
  return response.json();
};

// ============================================================================
// Helpers
// ============================================================================

export const getRiskLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    VERY_LOW: 'green',
    LOW: 'teal',
    MEDIUM: 'yellow',
    HIGH: 'orange',
    CRITICAL: 'red',
  };
  return colors[level] || 'gray';
};

export const getRiskLevelLabel = (level: string): string => {
  const labels: Record<string, string> = {
    VERY_LOW: 'Muy Bajo',
    LOW: 'Bajo',
    MEDIUM: 'Medio',
    HIGH: 'Alto',
    CRITICAL: 'Crítico',
  };
  return labels[level] || level;
};

export const getAllocationColor = (allocation: string): string => {
  const colors: Record<string, string> = {
    ESTADO: 'blue',
    CONTRATISTA: 'purple',
    COMPARTIDO: 'orange',
  };
  return colors[allocation] || 'gray';
};

export const getHeatMapCellColor = (probability: number, impact: number): string => {
  const score = probability * impact;
  if (score <= 4) return 'green.200';
  if (score <= 9) return 'yellow.200';
  if (score <= 14) return 'orange.300';
  if (score <= 19) return 'orange.500';
  return 'red.500';
};
