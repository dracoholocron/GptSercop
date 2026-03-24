/**
 * Custom Fields Service
 * API client for custom fields configuration and data
 */

import { get, post, put, del } from '../utils/apiClient';

// ==================== Types ====================

export interface CustomFieldDTO {
  id: string;
  fieldCode: string;
  fieldNameKey: string;
  fieldDescriptionKey?: string;
  fieldType: string;
  componentType: string;
  dataSourceType?: string;
  dataSourceCode?: string;
  dataSourceFilters?: string;
  displayOrder: number;
  placeholderKey?: string;
  helpTextKey?: string;
  spanColumns: number;
  isRequired: boolean;
  requiredCondition?: string;
  validationRules?: string;
  dependencies?: string;
  defaultValue?: string;
  defaultValueExpression?: string;
  fieldOptions?: string;
  embedAfterSwiftField?: string;
  embedInline?: boolean;
  aiEnabled?: boolean;
  aiHelpPrompt?: string;
  aiValidationPrompt?: string;
}

export interface CustomFieldSectionDTO {
  id: string;
  sectionCode: string;
  sectionNameKey: string;
  sectionDescriptionKey?: string;
  sectionType: 'SINGLE' | 'REPEATABLE';
  minRows?: number;
  maxRows?: number;
  displayOrder: number;
  collapsible: boolean;
  defaultCollapsed: boolean;
  columns: number;
  embedMode: string;
  embedTargetType?: string;
  embedTargetCode?: string;
  embedShowSeparator?: boolean;
  embedCollapsible?: boolean;
  embedSeparatorTitleKey?: string;
  fields: CustomFieldDTO[];
}

export interface CustomFieldStepDTO {
  id: string;
  stepCode: string;
  stepNameKey: string;
  stepDescriptionKey?: string;
  productType: string;
  displayOrder: number;
  icon?: string;
  embedMode: 'SEPARATE_STEP' | 'EMBEDDED_IN_SWIFT';
  embedSwiftStep?: string;
  sections: CustomFieldSectionDTO[];
}

export interface CustomFieldsConfiguration {
  productType: string;
  tenantId?: string;
  mode: string;
  steps: CustomFieldStepDTO[];
}

export interface FieldOption {
  value: string;
  label?: string;
  labelKey?: string;
  description?: string;
}

// Complex field value types for SWIFT components
export type CurrencyAmountValue = { currency: string; amount: string };
export type SwiftPartyValue = { text: string; participantId?: number };
export type ComplexFieldValue = CurrencyAmountValue | SwiftPartyValue | Record<string, unknown>;

export type CustomDataValue = string | number | boolean | null | CustomDataRow[] | ComplexFieldValue;
export interface CustomDataRow {
  [fieldCode: string]: string | number | boolean | null | ComplexFieldValue;
}
export interface CustomData {
  [key: string]: CustomDataValue;
}

// ==================== Configuration API ====================

/**
 * Check if the product type is for client portal.
 */
const isClientPortalProductType = (productType: string): boolean => {
  return productType.startsWith('CLIENT_');
};

/**
 * Get full custom fields configuration for a product.
 * Uses client portal endpoint for CLIENT_ prefixed product types.
 */
export const getCustomFieldsConfiguration = async (
  productType: string,
  tenantId?: string,
  mode: string = 'WIZARD'
): Promise<CustomFieldsConfiguration> => {
  const params = new URLSearchParams({ productType, mode });
  if (tenantId) params.append('tenantId', tenantId);

  // Use client portal endpoint for client product types
  const endpoint = isClientPortalProductType(productType)
    ? `/client-portal/custom-fields/config?${params.toString()}`
    : `/custom-fields/config?${params.toString()}`;

  const response = await get(endpoint);
  if (!response.ok) {
    throw new Error('Failed to fetch custom fields configuration');
  }
  return response.json();
};

/**
 * Get separate steps (not embedded in SWIFT).
 * Note: For client portal, the main config endpoint returns all needed data.
 */
export const getSeparateSteps = async (
  productType: string,
  tenantId?: string
): Promise<CustomFieldStepDTO[]> => {
  // For client portal product types, use the main config endpoint
  // and filter for separate steps
  if (isClientPortalProductType(productType)) {
    const config = await getCustomFieldsConfiguration(productType, tenantId, 'WIZARD');
    return config.steps.filter(step => step.embedMode === 'SEPARATE_STEP');
  }

  const params = new URLSearchParams({ productType });
  if (tenantId) params.append('tenantId', tenantId);

  const response = await get(`/custom-fields/config/steps/separate?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch separate steps');
  }
  return response.json();
};

/**
 * Get steps embedded in a SWIFT step.
 */
export const getEmbeddedSteps = async (
  swiftStep: string,
  productType: string,
  tenantId?: string
): Promise<CustomFieldStepDTO[]> => {
  const params = new URLSearchParams({ productType });
  if (tenantId) params.append('tenantId', tenantId);

  const response = await get(`/custom-fields/config/steps/embedded/${swiftStep}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch embedded steps');
  }
  return response.json();
};

/**
 * Get sections to embed after a SWIFT section.
 */
export const getSectionsToEmbedAfter = async (
  sectionCode: string,
  productType: string,
  tenantId?: string
): Promise<CustomFieldSectionDTO[]> => {
  const params = new URLSearchParams({ productType });
  if (tenantId) params.append('tenantId', tenantId);

  const response = await get(`/custom-fields/config/sections/embed-after/${sectionCode}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch sections to embed');
  }
  return response.json();
};

/**
 * Get fields to embed after a SWIFT field.
 */
export const getFieldsToEmbedAfter = async (
  swiftFieldCode: string,
  productType: string,
  tenantId?: string
): Promise<CustomFieldDTO[]> => {
  const params = new URLSearchParams({ productType });
  if (tenantId) params.append('tenantId', tenantId);

  const response = await get(`/custom-fields/config/fields/embed-after/${swiftFieldCode}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch fields to embed');
  }
  return response.json();
};

/**
 * Get fields to show in operation list.
 */
export const getListFields = async (
  productType: string,
  tenantId?: string
): Promise<CustomFieldDTO[]> => {
  const params = new URLSearchParams({ productType });
  if (tenantId) params.append('tenantId', tenantId);

  const response = await get(`/custom-fields/config/fields/list?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch list fields');
  }
  return response.json();
};

// ==================== Operation Data API ====================

/**
 * Get custom data for an operation.
 */
export const getOperationCustomData = async (
  operationId: string
): Promise<CustomData> => {
  const response = await get(`/custom-fields/data/${operationId}`);
  if (!response.ok) {
    if (response.status === 404) {
      return {}; // No custom data yet
    }
    throw new Error('Failed to fetch operation custom data');
  }
  return response.json();
};

/**
 * Save custom data for an operation.
 */
export const saveOperationCustomData = async (
  operationId: string,
  operationType: string,
  customData: CustomData
): Promise<void> => {
  const response = await put(
    `/custom-fields/data/${operationId}?operationType=${operationType}`,
    customData
  );
  if (!response.ok) {
    throw new Error('Failed to save custom data');
  }
};

/**
 * Update a single field value.
 */
export const updateFieldValue = async (
  operationId: string,
  operationType: string,
  fieldCode: string,
  value: CustomDataValue
): Promise<void> => {
  const response = await put(
    `/custom-fields/data/${operationId}/field/${fieldCode}?operationType=${operationType}`,
    value
  );
  if (!response.ok) {
    throw new Error('Failed to update field value');
  }
};

/**
 * Add a row to a repeatable section.
 */
export const addRepeatableSectionRow = async (
  operationId: string,
  operationType: string,
  sectionCode: string,
  rowData: CustomDataRow
): Promise<void> => {
  const response = await post(
    `/custom-fields/data/${operationId}/section/${sectionCode}/row?operationType=${operationType}`,
    rowData
  );
  if (!response.ok) {
    throw new Error('Failed to add repeatable section row');
  }
};

/**
 * Update a row in a repeatable section.
 */
export const updateRepeatableSectionRow = async (
  operationId: string,
  operationType: string,
  sectionCode: string,
  rowIndex: number,
  rowData: CustomDataRow
): Promise<void> => {
  const response = await put(
    `/custom-fields/data/${operationId}/section/${sectionCode}/row/${rowIndex}?operationType=${operationType}`,
    rowData
  );
  if (!response.ok) {
    throw new Error('Failed to update repeatable section row');
  }
};

/**
 * Remove a row from a repeatable section.
 */
export const removeRepeatableSectionRow = async (
  operationId: string,
  operationType: string,
  sectionCode: string,
  rowIndex: number
): Promise<void> => {
  const response = await del(
    `/custom-fields/data/${operationId}/section/${sectionCode}/row/${rowIndex}?operationType=${operationType}`
  );
  if (!response.ok) {
    throw new Error('Failed to remove repeatable section row');
  }
};

/**
 * Validate custom data against configuration.
 */
export const validateCustomData = async (
  operationId: string,
  productType: string,
  customData: CustomData,
  tenantId?: string
): Promise<string[]> => {
  const params = new URLSearchParams({ productType });
  if (tenantId) params.append('tenantId', tenantId);

  const response = await post(
    `/custom-fields/data/${operationId}/validate?${params.toString()}`,
    customData
  );
  if (!response.ok) {
    throw new Error('Failed to validate custom data');
  }
  return response.json();
};

// ==================== Helper Functions ====================

/**
 * Parse field options from JSON string.
 * field_options can be either:
 * - An array of FieldOption objects for SELECT/RADIO fields
 * - A config object like {"prefix": "$"} for other field types
 * This function only returns arrays; config objects return empty array.
 */
export const parseFieldOptions = (optionsJson?: string): FieldOption[] => {
  if (!optionsJson) return [];
  try {
    const parsed = JSON.parse(optionsJson);
    // Only return if it's an array of options
    if (Array.isArray(parsed)) {
      return parsed;
    }
    // If it's a config object (not an array), return empty array
    return [];
  } catch {
    return [];
  }
};

/**
 * Parse validation rules from JSON string.
 */
export const parseValidationRules = (rulesJson?: string): Record<string, unknown> => {
  if (!rulesJson) return {};
  try {
    return JSON.parse(rulesJson);
  } catch {
    return {};
  }
};

/**
 * Parse dependencies from JSON string.
 */
export const parseDependencies = (dependenciesJson?: string): Record<string, unknown> => {
  if (!dependenciesJson) return {};
  try {
    return JSON.parse(dependenciesJson);
  } catch {
    return {};
  }
};

/**
 * Parse data source filters from JSON string.
 */
export const parseDataSourceFilters = (filtersJson?: string): Record<string, unknown> => {
  if (!filtersJson) return {};
  try {
    return JSON.parse(filtersJson);
  } catch {
    return {};
  }
};

export default {
  getCustomFieldsConfiguration,
  getSeparateSteps,
  getEmbeddedSteps,
  getSectionsToEmbedAfter,
  getFieldsToEmbedAfter,
  getListFields,
  getOperationCustomData,
  saveOperationCustomData,
  updateFieldValue,
  addRepeatableSectionRow,
  updateRepeatableSectionRow,
  removeRepeatableSectionRow,
  validateCustomData,
  parseFieldOptions,
  parseValidationRules,
  parseDependencies,
  parseDataSourceFilters,
};
