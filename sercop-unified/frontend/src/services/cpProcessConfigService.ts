import { get } from '../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

export interface CPCountryConfig {
  id: number;
  countryCode: string;
  countryName: string;
  legalFrameworkName: string;
  currencyCode: string;
  taxIdName: string;
  taxIdPattern: string;
  catalogSystem: string;
  budgetIntegrationEnabled: boolean;
  erpApiCode: string;
  regulatoryBodyName: string;
  regulatoryBodyUrl: string;
  config: string;
  isActive: boolean;
}

export interface CPFieldDTO {
  id: string;
  fieldCode: string;
  fieldNameKey: string;
  fieldDescriptionKey: string;
  fieldType: string;
  componentType: string;
  dataSourceType: string;
  dataSourceCode: string;
  dataSourceFilters: string;
  displayOrder: number;
  placeholderKey: string;
  helpTextKey: string;
  isRequired: boolean;
  requiredCondition: string;
  validationRules: string;
  dependencies: string;
  fieldOptions: string;
  defaultValue: string;
  defaultValueExpression: string;
  legalReference: string;
  aiAssistEnabled: boolean;
  mapsToExternalField: string;
  showInWizard: boolean;
  showInExpert: boolean;
  showInView: boolean;
  showInList: boolean;
}

export interface CPSectionDTO {
  id: string;
  sectionCode: string;
  sectionNameKey: string;
  sectionDescriptionKey: string;
  sectionType: 'SINGLE' | 'REPEATABLE';
  minRows: number;
  maxRows: number;
  displayOrder: number;
  columnsCount: number;
  collapsible: boolean;
  defaultCollapsed: boolean;
  fields: CPFieldDTO[];
}

export interface CPStepDTO {
  id: string;
  stepCode: string;
  stepNameKey: string;
  stepDescriptionKey: string;
  phase: string;
  displayOrder: number;
  icon: string;
  color: string;
  showInWizard: boolean;
  showInExpert: boolean;
  requiredRole: string;
  sections: CPSectionDTO[];
}

export interface CPProcessConfiguration {
  country: CPCountryConfig;
  processType: string;
  steps: CPStepDTO[];
}

// ============================================================================
// API Functions
// ============================================================================

const BASE_URL = '/api/compras-publicas/config';

export const getActiveCountries = async (): Promise<CPCountryConfig[]> => {
  const response = await get(`${BASE_URL}/countries`);
  return response.json();
};

export const getCountryConfig = async (countryCode: string): Promise<CPCountryConfig> => {
  const response = await get(`${BASE_URL}/countries/${countryCode}`);
  return response.json();
};

export const getProcessConfiguration = async (
  countryCode: string,
  processType: string,
  tenantId?: string
): Promise<CPProcessConfiguration> => {
  const url = tenantId
    ? `${BASE_URL}/${countryCode}/${processType}?tenantId=${encodeURIComponent(tenantId)}`
    : `${BASE_URL}/${countryCode}/${processType}`;
  const response = await get(url);
  return response.json();
};
