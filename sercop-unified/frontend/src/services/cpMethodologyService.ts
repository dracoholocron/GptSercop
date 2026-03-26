import { get } from '../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

export interface CPPAAMethodology {
  id: number;
  code: string;
  name: string;
  description: string;
  sourceFramework: string;
  countryCode: string;
  welcomeMessage: string;
  totalPhases: number;
  isDefault: boolean;
  isActive: boolean;
  version: number;
  phases: CPPAAMethodologyPhase[];
}

export interface CPPAAMethodologyPhase {
  id: number;
  phaseNumber: number;
  phaseCode: string;
  phaseName: string;
  phaseSubtitle: string;
  icon: string;
  color: string;
  guidancePromptKey: string | null;
  validationPromptKey: string | null;
  extractionPromptKey: string | null;
  confirmationPromptKey: string | null;
  resultDisplayType: 'BADGES' | 'STATS' | 'TABLE';
  resultTemplate: string | null;
  inputType: 'TEXT' | 'TEXTAREA' | 'OPTIONS' | 'NONE';
  inputPlaceholder: string | null;
  optionsSource: string | null;
  isRequired: boolean;
  canSkip: boolean;
  autoAdvance: boolean;
  requiresAiCall: boolean;
  displayOrder: number;
  isActive: boolean;
  fieldMappings: CPPAAPhaseFieldMapping[];
}

export interface CPPAAPhaseFieldMapping {
  id: number;
  fieldCode: string;
  extractionPath: string;
  transformType: string;
  defaultValue: string | null;
  displayOrder: number;
  // Enhanced fields for DB-driven UI rendering
  componentType: string;        // TEXT, PRIORITY_LIST, GANTT_TIMELINE, ITEMS_TABLE, etc.
  cardSize: string;             // sm, md, lg
  gridSpan: number;             // 1-4
  label: string | null;
  icon: string | null;
  placeholder: string | null;
  helpText: string | null;
  isEditable: boolean;
  isRequired: boolean;
  minLength: number;
  maxLength: number;
  aiAssistEnabled: boolean;
  aiValidationOnBlur: boolean;
  aiStep: string | null;
  aiFieldId: string | null;
  aiValidationPrompt: string | null;
  aiSuggestionPrompt: string | null;
  dataSchema: string | null;    // JSON string
}

export interface CPLegalContext {
  id: number;
  contextCode: string;
  contextType: string;
  authority: string;
  title: string;
  summary: string;
  articleNumber: string | null;
  applicablePhases: string | null;
  priority: number;
  isActive: boolean;
}

export interface CPKnownEntity {
  id: number;
  entityName: string;
  entityRuc: string | null;
  entityType: string;
  sectorCode: string;
  sectorLabel: string;
  missionSummary: string;
  typicalDepartments: string | null;
  isActive: boolean;
}

export interface CPProcurementThreshold {
  id: number;
  countryCode: string;
  fiscalYear: number;
  pieValue: number;
  thresholdCode: string;
  procedureName: string;
  minCoefficient: number | null;
  maxCoefficient: number | null;
  minValue: number | null;
  maxValue: number | null;
  applicableTypes: string | null;
  legalReference: string;
  isActive: boolean;
}

// ============================================================================
// API Functions
// ============================================================================

const BASE_URL = '/api/compras-publicas/ai/methodology';
const ENABLE_CP_API = import.meta.env.VITE_ENABLE_CP_API !== 'false';

/** Get all active methodologies (user can choose) */
export const getActiveMethodologies = async (countryCode = 'EC'): Promise<CPPAAMethodology[]> => {
  if (!ENABLE_CP_API) return [];
  const response = await get(`${BASE_URL}/active?countryCode=${countryCode}`);
  if (!response.ok) return [];
  const payload = await response.json().catch(() => []);
  if (Array.isArray(payload)) return payload as CPPAAMethodology[];
  if (Array.isArray(payload?.data)) return payload.data as CPPAAMethodology[];
  if (Array.isArray(payload?.content)) return payload.content as CPPAAMethodology[];
  return [];
};

/** Get a specific methodology by ID */
export const getMethodology = async (id: number): Promise<CPPAAMethodology> => {
  const response = await get(`${BASE_URL}/${id}`);
  return response.json();
};

/** Get a methodology by code */
export const getMethodologyByCode = async (code: string): Promise<CPPAAMethodology> => {
  const response = await get(`${BASE_URL}/by-code/${code}`);
  return response.json();
};

/** Get the default methodology */
export const getDefaultMethodology = async (countryCode = 'EC'): Promise<CPPAAMethodology> => {
  if (!ENABLE_CP_API) {
    return {
      id: 0,
      code: 'DEFAULT',
      name: 'Default',
      description: '',
      sourceFramework: '',
      countryCode,
      welcomeMessage: '',
      totalPhases: 0,
      isDefault: true,
      isActive: false,
      version: 1,
      phases: [],
    };
  }
  const response = await get(`${BASE_URL}/default?countryCode=${countryCode}`);
  if (!response.ok) {
    return {
      id: 0,
      code: 'DEFAULT',
      name: 'Default',
      description: '',
      sourceFramework: '',
      countryCode,
      welcomeMessage: '',
      totalPhases: 0,
      isDefault: true,
      isActive: false,
      version: 1,
      phases: [],
    };
  }
  const payload = await response.json().catch(() => null);
  return (payload?.data ?? payload) as CPPAAMethodology;
};

/** Get all active legal context */
export const getLegalContext = async (): Promise<CPLegalContext[]> => {
  const response = await get(`${BASE_URL}/legal-context`);
  return response.json();
};

/** Get legal context for a specific phase */
export const getLegalContextForPhase = async (phaseCode: string): Promise<string> => {
  const response = await get(`${BASE_URL}/legal-context/phase/${phaseCode}`);
  const data = await response.json();
  return data.legalContext;
};

/** Get all known public entities */
export const getKnownEntities = async (): Promise<CPKnownEntity[]> => {
  const response = await get(`${BASE_URL}/known-entities`);
  return response.json();
};

/** Get procurement thresholds for current year */
export const getProcurementThresholds = async (): Promise<CPProcurementThreshold[]> => {
  const response = await get(`${BASE_URL}/procurement-thresholds`);
  return response.json();
};

// ============================================================================
// Helpers
// ============================================================================

/** Parse options_source JSON string to array */
export const parseOptionsSource = (optionsSource: string | null): string[] => {
  if (!optionsSource) return [];
  try {
    return JSON.parse(optionsSource);
  } catch {
    return [];
  }
};

/** Parse typical_departments JSON string to array */
export const parseDepartments = (typicalDepartments: string | null): string[] => {
  if (!typicalDepartments) return [];
  try {
    return JSON.parse(typicalDepartments);
  } catch {
    return [];
  }
};

/** Get color scheme for a phase */
export const getPhaseColorScheme = (color: string): { bg: string; border: string; text: string } => {
  const schemes: Record<string, { bg: string; border: string; text: string }> = {
    purple: { bg: 'purple.50', border: 'purple.400', text: 'purple.700' },
    green: { bg: 'green.50', border: 'green.400', text: 'green.700' },
    blue: { bg: 'blue.50', border: 'blue.400', text: 'blue.700' },
    cyan: { bg: 'cyan.50', border: 'cyan.400', text: 'cyan.700' },
    orange: { bg: 'orange.50', border: 'orange.400', text: 'orange.700' },
    red: { bg: 'red.50', border: 'red.400', text: 'red.700' },
    teal: { bg: 'teal.50', border: 'teal.400', text: 'teal.700' },
  };
  return schemes[color] || schemes.blue;
};
