/**
 * Service for External API Variable Mappings and Response Listeners
 */
import { get, post, put, del } from '../utils/apiClient';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL, API_V1_URL } from '../config/api.config';

// Types
export interface RequestMapping {
  id?: number;
  apiConfigId: number;
  // Source type and values
  sourceType: string; // TEMPLATE_VARIABLE, CONSTANT, CALCULATED
  variableCode?: string;
  variableName?: string;
  constantValue?: string;
  calculatedExpression?: string;
  // Parameter config
  parameterName: string;
  parameterLocation: string;
  defaultValue?: string;
  required: boolean;
  transformationType?: string;
  transformationPattern?: string;
  displayOrder: number;
  active: boolean;
}

export interface SourceTypeOption {
  value: string;
  label: string;
  description: string;
}

export interface CalculatedFunctionOption {
  value: string;
  label: string;
  category: string;
  description: string;
}

export interface ResponseMapping {
  id?: number;
  apiConfigId: number;
  fieldName: string;
  jsonPath: string;
  dataType: string;
  defaultValue?: string;
  required: boolean;
  transformationType?: string;
  transformationPattern?: string;
  validationRegex?: string;
  description?: string;
  displayOrder: number;
  active: boolean;
}

export interface ResponseListener {
  id?: number;
  apiConfigId: number;
  name: string;
  description?: string;
  actionType: string;
  actionConfigJson: string;
  conditionExpression?: string;
  executeOnSuccess: boolean;
  executeOnFailure: boolean;
  executeAsync: boolean;
  executionOrder: number;
  retryCount: number;
  retryDelayMs: number;
  active: boolean;
}

export interface ActionTypeOption {
  value: string;
  label: string;
  description: string;
}

// Request Mappings
export const getRequestMappings = async (apiConfigId: number): Promise<RequestMapping[]> => {
  const response = await get(`${API_BASE_URL}/admin/external-api/queries/${apiConfigId}/request-mappings`);
  if (response.ok) {
    const result = await response.json();
    return result.data || [];
  }
  throw new Error('Failed to fetch request mappings');
};

export const createRequestMapping = async (mapping: RequestMapping): Promise<RequestMapping> => {
  const response = await post(`${API_BASE_URL}/admin/external-api/commands/request-mappings`, mapping);
  if (response.ok) {
    const result = await response.json();
    return result.data;
  }
  const error = await response.json();
  throw new Error(error.message || 'Failed to create request mapping');
};

export const updateRequestMapping = async (id: number, mapping: RequestMapping): Promise<RequestMapping> => {
  const response = await put(`${API_BASE_URL}/admin/external-api/commands/request-mappings/${id}`, mapping);
  if (response.ok) {
    const result = await response.json();
    return result.data;
  }
  const error = await response.json();
  throw new Error(error.message || 'Failed to update request mapping');
};

export const deleteRequestMapping = async (id: number): Promise<void> => {
  const response = await del(`${API_BASE_URL}/admin/external-api/commands/request-mappings/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete request mapping');
  }
};

// Response Mappings
export const getResponseMappings = async (apiConfigId: number): Promise<ResponseMapping[]> => {
  const response = await get(`${API_BASE_URL}/admin/external-api/queries/${apiConfigId}/response-mappings`);
  if (response.ok) {
    const result = await response.json();
    return result.data || [];
  }
  throw new Error('Failed to fetch response mappings');
};

export const createResponseMapping = async (mapping: ResponseMapping): Promise<ResponseMapping> => {
  const response = await post(`${API_BASE_URL}/admin/external-api/commands/response-mappings`, mapping);
  if (response.ok) {
    const result = await response.json();
    return result.data;
  }
  const error = await response.json();
  throw new Error(error.message || 'Failed to create response mapping');
};

export const updateResponseMapping = async (id: number, mapping: ResponseMapping): Promise<ResponseMapping> => {
  const response = await put(`${API_BASE_URL}/admin/external-api/commands/response-mappings/${id}`, mapping);
  if (response.ok) {
    const result = await response.json();
    return result.data;
  }
  const error = await response.json();
  throw new Error(error.message || 'Failed to update response mapping');
};

export const deleteResponseMapping = async (id: number): Promise<void> => {
  const response = await del(`${API_BASE_URL}/admin/external-api/commands/response-mappings/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete response mapping');
  }
};

// Response Listeners
export const getResponseListeners = async (apiConfigId: number): Promise<ResponseListener[]> => {
  const response = await get(`${API_BASE_URL}/admin/external-api/queries/${apiConfigId}/response-listeners`);
  if (response.ok) {
    const result = await response.json();
    return result.data || [];
  }
  throw new Error('Failed to fetch response listeners');
};

export const createResponseListener = async (listener: ResponseListener): Promise<ResponseListener> => {
  const response = await post(`${API_BASE_URL}/admin/external-api/commands/response-listeners`, listener);
  if (response.ok) {
    const result = await response.json();
    return result.data;
  }
  const error = await response.json();
  throw new Error(error.message || 'Failed to create response listener');
};

export const updateResponseListener = async (id: number, listener: ResponseListener): Promise<ResponseListener> => {
  const response = await put(`${API_BASE_URL}/admin/external-api/commands/response-listeners/${id}`, listener);
  if (response.ok) {
    const result = await response.json();
    return result.data;
  }
  const error = await response.json();
  throw new Error(error.message || 'Failed to update response listener');
};

export const deleteResponseListener = async (id: number): Promise<void> => {
  const response = await del(`${API_BASE_URL}/admin/external-api/commands/response-listeners/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete response listener');
  }
};

// Enums
export const getParameterLocations = async (): Promise<string[]> => {
  const response = await get(`${API_BASE_URL}/admin/external-api/queries/parameter-locations`);
  if (response.ok) {
    const result = await response.json();
    return result.data || [];
  }
  return ['PATH', 'QUERY', 'HEADER', 'BODY', 'BODY_JSON_PATH'];
};

export const getDataTypes = async (): Promise<string[]> => {
  const response = await get(`${API_BASE_URL}/admin/external-api/queries/data-types`);
  if (response.ok) {
    const result = await response.json();
    return result.data || [];
  }
  return ['STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'JSON_OBJECT', 'JSON_ARRAY'];
};

export const getTransformationTypes = async (): Promise<string[]> => {
  const response = await get(`${API_BASE_URL}/admin/external-api/queries/transformation-types`);
  if (response.ok) {
    const result = await response.json();
    return result.data || [];
  }
  return ['NONE', 'UPPERCASE', 'LOWERCASE', 'DATE_FORMAT', 'NUMBER_FORMAT', 'CUSTOM'];
};

export const getSourceTypes = async (): Promise<SourceTypeOption[]> => {
  const response = await get(`${API_BASE_URL}/admin/external-api/queries/source-types`);
  if (response.ok) {
    const result = await response.json();
    return result.data || [];
  }
  return [
    { value: 'TEMPLATE_VARIABLE', label: 'Template Variable', description: 'Value from operation template variable' },
    { value: 'CONSTANT', label: 'Constant', description: 'Fixed constant value' },
    { value: 'CALCULATED', label: 'Calculated', description: 'Computed value using formulas/functions' },
  ];
};

export const getCalculatedFunctions = async (): Promise<CalculatedFunctionOption[]> => {
  const response = await get(`${API_BASE_URL}/admin/external-api/queries/calculated-functions`);
  if (response.ok) {
    const result = await response.json();
    return result.data || [];
  }
  return [
    { value: 'NOW()', label: 'Current DateTime', category: 'DateTime', description: 'Current date and time in ISO format' },
    { value: 'TODAY()', label: 'Current Date', category: 'DateTime', description: 'Current date in ISO format' },
    { value: 'TIMESTAMP()', label: 'Unix Timestamp', category: 'DateTime', description: 'Unix timestamp in seconds' },
    { value: 'UUID()', label: 'UUID', category: 'Identifiers', description: 'Random UUID (36 characters)' },
    { value: 'UUID_SHORT()', label: 'Short UUID', category: 'Identifiers', description: 'Short UUID (first 8 characters)' },
  ];
};

export const getActionTypes = async (): Promise<ActionTypeOption[]> => {
  const response = await get(`${API_BASE_URL}/admin/external-api/queries/action-types`);
  if (response.ok) {
    const result = await response.json();
    return result.data || [];
  }
  return [
    { value: 'UPDATE_CATALOG', label: 'Update Catalog Table', description: 'Updates a database catalog table with response data' },
    { value: 'UPDATE_OPERATION', label: 'Update Operation', description: 'Updates fields in the current operation' },
    { value: 'UPDATE_ENTITY', label: 'Update Entity', description: 'Updates any JPA entity with response data' },
    { value: 'TRIGGER_RULE', label: 'Trigger Rule', description: 'Triggers a business rule with response data' },
    { value: 'SEND_NOTIFICATION', label: 'Send Notification', description: 'Sends email or push notification' },
    { value: 'QUEUE_JOB', label: 'Queue Job', description: 'Queues a scheduled job for execution' },
    { value: 'CUSTOM_SERVICE', label: 'Custom Service', description: 'Calls a custom Spring service method' },
    { value: 'UPSERT_EXCHANGE_RATE', label: 'Upsert Exchange Rate', description: 'Creates or updates exchange rate using CQRS service with event sourcing' },
  ];
};

// Template Variables (for dropdown)
export const getTemplateVariables = async (): Promise<{ code: string; name: string; description?: string }[]> => {
  const response = await get(`${API_V1_URL}/admin/template-variables`);
  if (response.ok) {
    const result = await response.json();
    // Map from TemplateVariable entity to simpler format for dropdown
    return (result.data || []).map((v: { code: string; labelKey: string; descriptionKey?: string }) => ({
      code: v.code,
      name: v.labelKey,
      description: v.descriptionKey
    }));
  }
  return [];
};
