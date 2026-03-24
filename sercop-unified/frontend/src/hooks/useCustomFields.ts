/**
 * useCustomFields Hook
 * Manages custom fields configuration and data for operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getCustomFieldsConfiguration,
  getSeparateSteps,
  getEmbeddedSteps,
  getSectionsToEmbedAfter,
  getOperationCustomData,
  saveOperationCustomData,
  validateCustomData,
  parseDataSourceFilters,
  type CustomFieldsConfiguration,
  type CustomFieldStepDTO,
  type CustomFieldSectionDTO,
  type CustomFieldDTO,
  type CustomData,
  type CustomDataRow,
  type CustomDataValue,
} from '../services/customFieldsService';
import { userService } from '../services/userService';

export interface UseCustomFieldsOptions {
  productType: string;
  mode?: 'WIZARD' | 'EXPERT' | 'CUSTOM' | 'VIEW';
  tenantId?: string;
  operationId?: string;
  autoLoad?: boolean;
}

export interface UseCustomFieldsReturn {
  // Configuration
  configuration: CustomFieldsConfiguration | null;
  separateSteps: CustomFieldStepDTO[];
  isLoading: boolean;
  error: string | null;

  // Data
  customData: CustomData;
  setCustomData: (data: CustomData) => void;
  updateFieldValue: (fieldCode: string, value: CustomDataValue) => void;
  updateSectionRows: (sectionCode: string, rows: CustomDataRow[]) => void;

  // Data sources for fields
  userData: Array<{ id: string; name: string }>;

  // Operations
  loadConfiguration: () => Promise<void>;
  loadOperationData: (operationId: string) => Promise<void>;
  saveData: (operationId: string, operationType: string) => Promise<void>;
  validate: () => Promise<string[]>;

  // Helpers
  getEmbeddedStepsForSwiftStep: (swiftStepCode: string) => CustomFieldStepDTO[];
  getSectionsToEmbedAfterSwiftSection: (swiftSectionCode: string) => Promise<CustomFieldSectionDTO[]>;
  hasCustomFieldsForStep: (swiftStepCode: string) => boolean;
}

/**
 * Hook for managing custom fields in operation wizards
 */
export const useCustomFields = ({
  productType,
  mode = 'WIZARD',
  tenantId,
  operationId,
  autoLoad = true,
}: UseCustomFieldsOptions): UseCustomFieldsReturn => {
  // State
  const [configuration, setConfiguration] = useState<CustomFieldsConfiguration | null>(null);
  const [separateSteps, setSeparateSteps] = useState<CustomFieldStepDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customData, setCustomData] = useState<CustomData>({});
  const [userData, setUserData] = useState<Array<{ id: string; name: string }>>([]);

  // Load configuration on mount or when product type changes
  useEffect(() => {
    if (autoLoad && productType) {
      loadConfiguration();
    }
  }, [productType, mode, tenantId, autoLoad]);

  // Load operation data when operationId is provided
  useEffect(() => {
    if (operationId) {
      loadOperationData(operationId);
    }
  }, [operationId]);

  /**
   * Load full custom fields configuration
   */
  const loadConfiguration = useCallback(async () => {
    if (!productType) return;

    setIsLoading(true);
    setError(null);

    try {
      const [config, separate] = await Promise.all([
        getCustomFieldsConfiguration(productType, tenantId, mode),
        getSeparateSteps(productType, tenantId),
      ]);

      setConfiguration(config);
      setSeparateSteps(separate);

      // Load users for USER_LISTBOX fields if needed
      await loadUsersForConfiguration(config);
    } catch (err) {
      console.error('Error loading custom fields configuration:', err);
      setError(err instanceof Error ? err.message : 'Error loading configuration');
    } finally {
      setIsLoading(false);
    }
  }, [productType, mode, tenantId]);

  /**
   * Load users for USER_LISTBOX fields based on dataSourceFilters
   */
  const loadUsersForConfiguration = useCallback(async (config: CustomFieldsConfiguration) => {
    // Find all USER_LISTBOX fields in the configuration
    const userListboxFields: CustomFieldDTO[] = [];

    config.steps.forEach(step => {
      step.sections.forEach(section => {
        section.fields.forEach(field => {
          if (field.componentType === 'USER_LISTBOX') {
            userListboxFields.push(field);
          }
        });
      });
    });

    if (userListboxFields.length === 0) {
      return;
    }

    try {
      // Check if any field has a role filter
      let roleFilter: string | null = null;

      for (const field of userListboxFields) {
        if (field.dataSourceFilters) {
          const filters = parseDataSourceFilters(field.dataSourceFilters);
          if (filters.role && typeof filters.role === 'string') {
            roleFilter = filters.role;
            break; // Use the first role filter found
          }
        }
      }

      // Load users based on filter
      let users;
      if (roleFilter) {
        users = await userService.getUsersByRole(roleFilter);
      } else {
        // Default: load internal users (account executives)
        users = await userService.getInternalUsers();
      }

      // Map to the format expected by CustomFieldsPanel
      const mappedUsers = users.map(user => ({
        id: String(user.id),
        name: user.username,
      }));

      setUserData(mappedUsers);
    } catch (err) {
      console.error('Error loading users for custom fields:', err);
      // Don't fail the whole configuration load if users fail to load
    }
  }, []);

  /**
   * Load custom data for an operation
   */
  const loadOperationData = useCallback(async (opId: string) => {
    try {
      const data = await getOperationCustomData(opId);
      setCustomData(data);
    } catch (err) {
      console.error('Error loading operation custom data:', err);
      // Don't set error - it's okay if there's no custom data yet
      setCustomData({});
    }
  }, []);

  /**
   * Save custom data for an operation
   */
  const saveData = useCallback(
    async (opId: string, operationType: string) => {
      await saveOperationCustomData(opId, operationType, customData);
    },
    [customData]
  );

  /**
   * Validate custom data against configuration
   */
  const validate = useCallback(async (): Promise<string[]> => {
    if (!operationId) return [];
    return validateCustomData(operationId, productType, customData, tenantId);
  }, [operationId, productType, customData, tenantId]);

  /**
   * Update a single field value
   */
  const updateFieldValue = useCallback(
    (fieldCode: string, value: CustomDataValue) => {
      setCustomData((prev) => ({
        ...prev,
        [fieldCode]: value,
      }));
    },
    []
  );

  /**
   * Update rows for a repeatable section
   */
  const updateSectionRows = useCallback(
    (sectionCode: string, rows: CustomDataRow[]) => {
      setCustomData((prev) => ({
        ...prev,
        [sectionCode]: rows,
      }));
    },
    []
  );

  /**
   * Get embedded steps for a SWIFT step
   */
  const getEmbeddedStepsForSwiftStep = useCallback(
    (swiftStepCode: string): CustomFieldStepDTO[] => {
      if (!configuration) return [];
      return configuration.steps.filter(
        (step) =>
          step.embedMode === 'EMBEDDED_IN_SWIFT' &&
          step.embedSwiftStep === swiftStepCode
      );
    },
    [configuration]
  );

  /**
   * Get sections to embed after a SWIFT section
   */
  const getSectionsToEmbedAfterSwiftSection = useCallback(
    async (swiftSectionCode: string): Promise<CustomFieldSectionDTO[]> => {
      try {
        return await getSectionsToEmbedAfter(swiftSectionCode, productType, tenantId);
      } catch (err) {
        console.error('Error loading embedded sections:', err);
        return [];
      }
    },
    [productType, tenantId]
  );

  /**
   * Check if there are custom fields for a SWIFT step
   */
  const hasCustomFieldsForStep = useCallback(
    (swiftStepCode: string): boolean => {
      if (!configuration) return false;
      return configuration.steps.some(
        (step) =>
          step.embedMode === 'EMBEDDED_IN_SWIFT' &&
          step.embedSwiftStep === swiftStepCode &&
          step.sections.length > 0
      );
    },
    [configuration]
  );

  return {
    // Configuration
    configuration,
    separateSteps,
    isLoading,
    error,

    // Data
    customData,
    setCustomData,
    updateFieldValue,
    updateSectionRows,

    // Data sources
    userData,

    // Operations
    loadConfiguration,
    loadOperationData,
    saveData,
    validate,

    // Helpers
    getEmbeddedStepsForSwiftStep,
    getSectionsToEmbedAfterSwiftSection,
    hasCustomFieldsForStep,
  };
};

export default useCustomFields;
