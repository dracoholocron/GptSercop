/**
 * Servicio de IA para Compras Públicas de Ecuador
 * @module cpAIService
 */

import { get, post } from '../utils/apiClient';
import { productTypeConfigService } from './productTypeConfigService';

// ============================================================================
// TIPOS
// ============================================================================

export interface CPLegalHelpRequest {
  processType: string;
  currentStep: string;
  fieldId: string;
  budget?: number;
  question?: string;
  cpcCode?: string;
  language?: string;
}

export interface LegalReference {
  law: string;
  article: string;
  summary: string;
}

export interface CPLegalHelpResponse {
  title: string;
  content: string;
  legalReferences: LegalReference[];
  requirements: string[];
  commonErrors: string[];
  tips: string[];
  examples: string[];
  sercopResolutions: string[];
  severity: 'INFO' | 'WARNING' | 'REQUIRED';
  provider: string;
  model: string;
  processingTimeMs: number;
  confidence: number;
}

export interface CPPriceAnalysisRequest {
  cpcCode: string;
  itemDescription: string;
  proposedPrice: number;
  unit: string;
  quantity?: number;
  processId?: string;
  province?: string;
}

export interface HistoricalStats {
  average: number;
  min: number;
  max: number;
  median: number;
  sampleCount: number;
  standardDeviation: number;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface CPPriceAnalysisResponse {
  analysisId: string;
  cpcCode: string;
  proposedPrice: number;
  historicalStats: HistoricalStats;
  percentileRank: number;
  deviationFromAverage: number;
  anomalyScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
  warnings: string[];
  justification: string;
  suggestedPriceRange: PriceRange;
  provider: string;
  model: string;
  processingTimeMs: number;
}

export interface Bidder {
  ruc: string;
  name: string;
  offeredPrice: number;
  offerDate?: string;
}

export interface CPRiskAnalysisRequest {
  processCode: string;
  processType: string;
  entityRuc: string;
  entityName: string;
  budget: number;
  publicationDate?: string;
  deadlineDate?: string;
  bidders?: Bidder[];
  indicatorCodes?: string[];
}

export interface DetectedIndicator {
  code: string;
  name: string;
  detected: boolean;
  score: number;
  evidence: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RiskPattern {
  type: string;
  description: string;
  entities: string[];
}

export interface RiskRecommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  responsible: string;
}

export interface CPRiskAnalysisResponse {
  assessmentId: string;
  processCode: string;
  overallRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedIndicators: DetectedIndicator[];
  patterns: RiskPattern[];
  recommendations: RiskRecommendation[];
  summary: string;
  provider: string;
  model: string;
  processingTimeMs: number;
}

export interface ProcessType {
  code: string;
  name: string;
  description: string;
}

export interface RiskIndicator {
  code: string;
  name: string;
  severity: string;
  weight: number;
}

export interface RiskLevel {
  code: string;
  name: string;
  color: string;
  minScore: number;
  maxScore: number;
}

export interface HistoricalPrice {
  id: number;
  cpcCode: string;
  cpcDescription: string;
  itemDescription: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  totalValue: number;
  processCode: string;
  processType: string;
  entityRuc: string;
  entityName: string;
  supplierRuc: string;
  supplierName: string;
  adjudicationDate: string;
  province: string;
}

// ============================================================================
// API CALLS
// ============================================================================

const BASE_URL = '/api/compras-publicas/ai';
const ENABLE_CP_API = import.meta.env.VITE_ENABLE_CP_API !== 'false';

const EMPTY_LEGAL_HELP: CPLegalHelpResponse = {
  title: 'Asistente legal no disponible',
  content: 'El modulo de ayuda legal no esta habilitado en este entorno.',
  legalReferences: [],
  requirements: [],
  commonErrors: [],
  tips: [],
  examples: [],
  sercopResolutions: [],
  severity: 'INFO',
  provider: 'N/A',
  model: 'N/A',
  processingTimeMs: 0,
  confidence: 0,
};

/**
 * Obtiene ayuda legal contextual
 */
export async function getLegalHelp(request: CPLegalHelpRequest): Promise<CPLegalHelpResponse> {
  if (!ENABLE_CP_API) return EMPTY_LEGAL_HELP;
  const response = await post(`${BASE_URL}/legal-help`, request);
  if (!response.ok) return EMPTY_LEGAL_HELP;
  const payload = await response.json().catch(() => null);
  const data = (payload?.data ?? payload ?? {}) as Partial<CPLegalHelpResponse>;
  return {
    ...EMPTY_LEGAL_HELP,
    ...data,
    legalReferences: Array.isArray(data.legalReferences) ? data.legalReferences : [],
    requirements: Array.isArray(data.requirements) ? data.requirements : [],
    commonErrors: Array.isArray(data.commonErrors) ? data.commonErrors : [],
    tips: Array.isArray(data.tips) ? data.tips : [],
    examples: Array.isArray(data.examples) ? data.examples : [],
    sercopResolutions: Array.isArray(data.sercopResolutions) ? data.sercopResolutions : [],
  };
}

/**
 * Analiza un precio propuesto
 */
export async function analyzePrices(request: CPPriceAnalysisRequest): Promise<CPPriceAnalysisResponse> {
  const response = await post(`${BASE_URL}/price-analysis`, request);
  return response.json();
}

/**
 * Obtiene precios históricos por CPC
 */
export async function getHistoricalPrices(cpcCode: string): Promise<HistoricalPrice[]> {
  const response = await get(`${BASE_URL}/prices/historical/${cpcCode}`);
  return response.json();
}

/**
 * Obtiene estadísticas de precios por CPC
 */
export async function getPriceStatistics(cpcCode: string): Promise<HistoricalStats> {
  const response = await get(`${BASE_URL}/prices/statistics/${cpcCode}`);
  return response.json();
}

/**
 * Busca precios por descripción
 */
export async function searchPrices(query: string): Promise<HistoricalPrice[]> {
  const response = await get(`${BASE_URL}/prices/search?query=${encodeURIComponent(query)}`);
  return response.json();
}

/**
 * Analiza riesgos en un proceso
 */
export async function analyzeRisks(request: CPRiskAnalysisRequest): Promise<CPRiskAnalysisResponse> {
  const response = await post(`${BASE_URL}/risk-analysis`, request);
  return response.json();
}

/**
 * Obtiene tipos de proceso de contratación desde product_type_config
 */
export async function getProcessTypes(): Promise<ProcessType[]> {
  const configs = await productTypeConfigService.getConfigsByCategory('COMPRAS_PUBLICAS');
  return configs.map(c => {
    const fullDesc = c.description || '';
    const dashIdx = fullDesc.indexOf(' - ');
    const name = dashIdx > 0 ? fullDesc.substring(0, dashIdx).trim() : fullDesc;
    const description = dashIdx > 0 ? fullDesc.substring(dashIdx + 3).trim() : fullDesc;
    return { code: c.productType, name, description };
  });
}

/**
 * Obtiene indicadores de riesgo configurados
 */
export async function getRiskIndicators(): Promise<RiskIndicator[]> {
  const response = await get(`${BASE_URL}/config/risk-indicators`);
  return response.json();
}

/**
 * Obtiene niveles de riesgo
 */
export async function getRiskLevels(): Promise<RiskLevel[]> {
  const response = await get(`${BASE_URL}/config/risk-levels`);
  return response.json();
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Obtiene el color para un nivel de riesgo
 */
export function getRiskColor(level: string): string {
  const colors: Record<string, string> = {
    LOW: '#10B981',
    MEDIUM: '#F59E0B',
    HIGH: '#F97316',
    CRITICAL: '#EF4444',
    UNKNOWN: '#6B7280'
  };
  return colors[level] || colors.UNKNOWN;
}

/**
 * Obtiene el label para un nivel de riesgo
 */
export function getRiskLabel(level: string): string {
  const labels: Record<string, string> = {
    LOW: 'Bajo',
    MEDIUM: 'Medio',
    HIGH: 'Alto',
    CRITICAL: 'Crítico',
    UNKNOWN: 'Desconocido'
  };
  return labels[level] || labels.UNKNOWN;
}

/**
 * Formatea un precio en USD
 */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}
