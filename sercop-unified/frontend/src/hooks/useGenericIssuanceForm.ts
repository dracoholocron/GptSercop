/**
 * useGenericIssuanceForm - Generic hook for any product type issuance form.
 * Loads SWIFT field configs based on the product's messageType,
 * manages field data, draft save/load, and wizard navigation.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { SwiftFieldConfig } from '../types/swiftField';
import { swiftFieldConfigService } from '../services/swiftFieldConfigService';
import { swiftDraftService } from '../services/swiftDraftService';
import { toaster } from '../components/ui/toaster';
import type { SwiftSectionConfig } from '../services/swiftSectionConfigService';

export type IssuanceMode = 'wizard' | 'expert' | 'client';

export interface ModeConfig {
  mode: IssuanceMode;
  layout: 'steps' | 'scroll';
  totalSteps: number;
  showFloatingActions: boolean;
  help: {
    showContextualHelp: boolean;
    showFieldTooltips: boolean;
    showOptionalFieldsIndicator: boolean;
  };
}

interface UseGenericIssuanceFormOptions {
  mode: IssuanceMode;
  productType: string;
  messageType: string;
  draftId?: string | number;
  /** SWIFT sections loaded from useSwiftSections - used to compute totalSteps */
  sections?: SwiftSectionConfig[];
}

export function useGenericIssuanceForm({
  mode,
  productType,
  messageType,
  draftId,
  sections = [],
}: UseGenericIssuanceFormOptions) {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Compute totalSteps dynamically from sections
  // Client mode: no SWIFT preview step. Wizard: +2 for alerts + preview. Expert: always 1.
  const totalSteps = useMemo(() => {
    if (mode === 'expert') return 1;
    if (mode === 'client') return Math.max(sections.length, 1); // no preview/alerts step
    return Math.max(sections.length + 2, 3); // sections + alerts + preview, min 3
  }, [mode, sections.length]);

  const modeConfig: ModeConfig = useMemo(() => ({
    mode,
    layout: mode === 'expert' ? 'scroll' : 'steps',
    totalSteps,
    showFloatingActions: mode === 'expert',
    help: {
      showContextualHelp: mode === 'wizard',
      showFieldTooltips: mode === 'wizard',
      showOptionalFieldsIndicator: mode === 'wizard',
    },
  }), [mode, totalSteps]);

  // SWIFT configuration
  const [swiftConfigs, setSwiftConfigs] = useState<SwiftFieldConfig[]>([]);
  const [swiftFieldsData, setSwiftFieldsData] = useState<Record<string, any>>({});
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);

  // Draft state
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [editingDraftAggregateId, setEditingDraftAggregateId] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);

  // Navigation state (wizard)
  const [currentStep, setCurrentStep] = useState(1);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, any>>({});

  // Error sections (for expert accordion highlighting)
  const [errorSections, setErrorSections] = useState<string[]>([]);

  // Selected alert template IDs (persisted in draft customData)
  const [selectedAlertTemplateIds, setSelectedAlertTemplateIds] = useState<Set<number>>(new Set());

  // Load SWIFT configurations
  useEffect(() => {
    const loadSwiftConfigs = async () => {
      if (!messageType) {
        setIsLoadingConfigs(false);
        return;
      }
      try {
        setIsLoadingConfigs(true);
        const configs = await swiftFieldConfigService.getAll(messageType, true);
        setSwiftConfigs(configs);
      } catch (error) {
        console.error('Error loading SWIFT configs:', error);
      } finally {
        setIsLoadingConfigs(false);
      }
    };
    loadSwiftConfigs();
  }, [messageType]);

  // Initialize SWIFT metadata
  useEffect(() => {
    setSwiftFieldsData(prev => ({
      ...prev,
      productCode: productType.charAt(0),
      countryCode: 'E',
      agencyCode: '0001',
      entityType: productType,
    }));
  }, [productType]);

  // Load draft if draftId is provided or from URL
  useEffect(() => {
    const draftIdToLoad = draftId || searchParams.get('draft');
    if (!draftIdToLoad || swiftConfigs.length === 0) return;

    const loadDraft = async () => {
      try {
        setIsLoadingDraft(true);
        const { draft, fields } = await swiftDraftService.getDraftWithFields(
          String(draftIdToLoad),
          swiftConfigs
        );

        setEditingDraftId(draft.id);
        setEditingDraftAggregateId(draft.draftId);

        setSwiftFieldsData(prev => ({
          ...prev,
          ...fields,
          productCode: productType.charAt(0),
          countryCode: 'E',
          agencyCode: '0001',
          entityType: productType,
        }));

        // Restore selected alert template IDs from customData
        if (draft.customData) {
          try {
            const customData = typeof draft.customData === 'string'
              ? JSON.parse(draft.customData) : draft.customData;
            if (customData._selectedAlertTemplateIds && Array.isArray(customData._selectedAlertTemplateIds)) {
              setSelectedAlertTemplateIds(new Set(customData._selectedAlertTemplateIds));
            }
          } catch (e) {
            console.warn('Error parsing customData for alert IDs:', e);
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error);
        toaster.error({
          title: 'Error al cargar borrador',
          description: error instanceof Error ? error.message : 'Error desconocido',
        });
      } finally {
        setIsLoadingDraft(false);
      }
    };

    loadDraft();
  }, [draftId, searchParams, swiftConfigs.length, productType]);

  // Handle SWIFT field change
  const handleSwiftFieldChange = useCallback((fieldCode: string, value: any) => {
    setSwiftFieldsData(prev => ({ ...prev, [fieldCode]: value }));
    // Clear error for this field
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldCode];
      return newErrors;
    });
    // Clear section error
    if (errorSections.length > 0 && swiftConfigs.length > 0) {
      const fieldConfig = swiftConfigs.find(c => c.fieldCode === fieldCode);
      if (fieldConfig?.section) {
        setErrorSections(prev => prev.filter(s => s !== fieldConfig.section));
      }
    }
  }, [errorSections, swiftConfigs]);

  // Navigation
  const goToNextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Compute optional field stats
  const optionalFieldsStats = useMemo(() => {
    const optional = swiftConfigs.filter(f => !f.isRequired && f.isActive !== false);
    const filled = optional.filter(f => {
      const val = swiftFieldsData[f.fieldCode];
      return val !== undefined && val !== null && val !== '';
    }).length;
    return {
      total: optional.length,
      filled,
      percentage: optional.length > 0 ? Math.round((filled / optional.length) * 100) : 0,
    };
  }, [swiftConfigs, swiftFieldsData]);

  // Build customData including selected alert template IDs
  const buildCustomData = useCallback((): Record<string, any> | undefined => {
    if (selectedAlertTemplateIds.size === 0) return undefined;
    return { _selectedAlertTemplateIds: Array.from(selectedAlertTemplateIds) };
  }, [selectedAlertTemplateIds]);

  // Save draft
  const saveDraft = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const customData = buildCustomData();

      if (editingDraftAggregateId) {
        await swiftDraftService.updateDraftFromFields(
          editingDraftAggregateId,
          swiftFieldsData,
          swiftConfigs,
          user?.username || 'system',
          customData
        );
        toaster.success({
          title: 'Borrador actualizado',
          description: 'Los cambios se han guardado correctamente',
        });
      } else {
        const modeValue = mode === 'client' ? 'CLIENT' : mode === 'wizard' ? 'WIZARD' : 'EXPERT';
        const result = await swiftDraftService.createDraftFromFields(
          messageType,
          productType,
          swiftFieldsData,
          swiftConfigs,
          user?.username || 'system',
          modeValue,
          false,
          customData
        );
        if (result.id) {
          setEditingDraftId(result.id);
          setEditingDraftAggregateId(result.draftId);
        }
        toaster.success({
          title: 'Borrador guardado',
          description: 'El borrador se ha creado correctamente',
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toaster.error({
        title: 'Error al guardar',
        description: error instanceof Error ? error.message : 'No se pudo guardar el borrador',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [editingDraftAggregateId, swiftFieldsData, swiftConfigs, mode, messageType, productType, user, buildCustomData]);

  // Submit form
  const submitForm = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setErrorSections([]);

      const modeValue = mode === 'client' ? 'CLIENT' : mode === 'wizard' ? 'WIZARD' : 'EXPERT';
      const customData = buildCustomData();

      if (editingDraftAggregateId) {
        await swiftDraftService.updateDraftFromFields(
          editingDraftAggregateId,
          swiftFieldsData,
          swiftConfigs,
          user?.username || 'system',
          customData
        );
        await swiftDraftService.submitDraft(editingDraftAggregateId);
      } else {
        const result = await swiftDraftService.createDraftFromFields(
          messageType,
          productType,
          swiftFieldsData,
          swiftConfigs,
          user?.username || 'system',
          modeValue,
          false,
          customData
        );
        if (result.draftId) {
          await swiftDraftService.submitDraft(result.draftId);
        }
      }

      toaster.success({
        title: 'Operación enviada',
        description: 'La operación ha sido enviada para aprobación',
      });
    } catch (error: any) {
      console.error('Error submitting:', error);
      // Extract error sections for accordion highlighting
      if (error?.errors) {
        const sectionsWithErrors = new Set<string>();
        for (const validationError of error.errors) {
          if (validationError.section) {
            sectionsWithErrors.add(validationError.section);
          }
        }
        setErrorSections(Array.from(sectionsWithErrors));
      }
      toaster.error({
        title: 'Error al enviar',
        description: error instanceof Error ? error.message : 'No se pudo enviar la operación',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [editingDraftAggregateId, swiftFieldsData, swiftConfigs, mode, messageType, productType, buildCustomData]);

  return {
    // SWIFT
    swiftConfigs,
    swiftFieldsData,
    handleSwiftFieldChange,
    isLoadingConfigs,

    // Draft
    editingDraftId,
    editingDraftAggregateId,
    isLoadingDraft,
    saveDraft,

    // Navigation
    currentStep,
    setCurrentStep,
    totalSteps,
    goToNextStep,
    goToPreviousStep,

    // Validation
    fieldErrors,
    setFieldErrors,
    errorSections,
    setErrorSections,

    // Stats
    optionalFieldsStats,

    // Mode
    modeConfig,

    // Submission
    submitForm,
    isSubmitting,

    // Alert template selection (persisted in draft)
    selectedAlertTemplateIds,
    setSelectedAlertTemplateIds,
  };
}
