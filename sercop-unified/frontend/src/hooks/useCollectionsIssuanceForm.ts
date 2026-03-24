import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { SwiftFieldConfig } from '../types/swiftField';
import type { AccountingRuleTestResult } from '../services/accountingRulesService';
import type { ComisionResponse } from '../services/commissionService';
import { swiftFieldConfigService } from '../services/swiftFieldConfigService';
import { swiftDraftService } from '../services/swiftDraftService';
import { toaster } from '../components/ui/toaster';
import { participanteService } from '../services/participantService';
import { monedaService } from '../services/currencyService';
import { institucionFinancieraService } from '../services/financialInstitutionService';
import {
  type CollectionsIssuanceFormData,
  type SelectedEntities,
  type ValidationError,
  type IssuanceMode,
  type PaymentScheduleItem,
  initialFormData,
  MODE_CONFIGS,
} from '../components/collections-issuance/types';

interface UseCollectionsIssuanceFormOptions {
  mode: IssuanceMode;
  draftId?: number;
  messageType?: string;
  customDataRef?: React.MutableRefObject<Record<string, any> | undefined>;
}

interface UseCollectionsIssuanceFormReturn {
  // Form data
  formData: CollectionsIssuanceFormData;
  setFormData: React.Dispatch<React.SetStateAction<CollectionsIssuanceFormData>>;
  handleFormDataChange: (field: keyof CollectionsIssuanceFormData, value: string) => void;

  // Selected entities
  selectedEntities: SelectedEntities;
  handleEntitySelect: <K extends keyof SelectedEntities>(entity: K, value: SelectedEntities[K]) => void;

  // SWIFT configuration
  swiftConfigs: SwiftFieldConfig[];
  swiftFieldsData: Record<string, any>;
  handleSwiftFieldChange: (fieldCode: string, value: any) => void;
  isLoadingConfigs: boolean;

  // Message type
  messageType: string;
  setMessageType: React.Dispatch<React.SetStateAction<string>>;

  // Validation
  fieldErrors: Record<string, ValidationError>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, ValidationError>>>;

  // Draft management
  editingDraftId: number | null;
  editingDraftAggregateId: string | null;
  editingDraftNumeroOperacion: string | null;
  isLoadingDraft: boolean;
  loadedCustomData: Record<string, any> | null;
  saveDraft: () => Promise<void>;

  // Navigation (for wizard mode)
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  totalSteps: number;
  goToNextStep: () => void;
  goToPreviousStep: () => void;

  // Accounting
  accountingResult: AccountingRuleTestResult | null;
  setAccountingResult: React.Dispatch<React.SetStateAction<AccountingRuleTestResult | null>>;
  loadingAccounting: boolean;
  setLoadingAccounting: React.Dispatch<React.SetStateAction<boolean>>;

  // Commission
  commissionResult: ComisionResponse | null;
  setCommissionResult: React.Dispatch<React.SetStateAction<ComisionResponse | null>>;
  calculatedCommission: number;
  setCalculatedCommission: React.Dispatch<React.SetStateAction<number>>;
  diasVigencia: number;
  setDiasVigencia: React.Dispatch<React.SetStateAction<number>>;

  // Deferred payments
  isCommissionDeferred: boolean;
  setIsCommissionDeferred: React.Dispatch<React.SetStateAction<boolean>>;
  paymentSchedule: PaymentScheduleItem[];
  setPaymentSchedule: React.Dispatch<React.SetStateAction<PaymentScheduleItem[]>>;

  // Optional fields stats
  optionalFieldsStats: { filled: number; total: number; percentage: number };

  // Mode config
  modeConfig: typeof MODE_CONFIGS[IssuanceMode];

  // Submission
  submitForm: () => Promise<void>;
  isSubmitting: boolean;
}

export function useCollectionsIssuanceForm({
  mode,
  draftId,
  messageType: initialMessageType = 'MT400',
  customDataRef
}: UseCollectionsIssuanceFormOptions): UseCollectionsIssuanceFormReturn {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const modeConfig = MODE_CONFIGS[mode];

  // Form state
  const [formData, setFormData] = useState<CollectionsIssuanceFormData>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, ValidationError>>({});

  // Message type (MT400, MT410, MT412, MT416, MT420)
  const [messageType, setMessageType] = useState<string>(initialMessageType);

  // Selected entities
  const [selectedEntities, setSelectedEntities] = useState<SelectedEntities>({
    librado: null,
    moneda: null,
    bancoRemitente: null,
    bancoCobrador: null,
  });

  // SWIFT configuration
  const [swiftConfigs, setSwiftConfigs] = useState<SwiftFieldConfig[]>([]);
  const [swiftFieldsData, setSwiftFieldsData] = useState<Record<string, any>>({});
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);

  // Draft state
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [editingDraftAggregateId, setEditingDraftAggregateId] = useState<string | null>(null);
  const [editingDraftNumeroOperacion, setEditingDraftNumeroOperacion] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [loadedCustomData, setLoadedCustomData] = useState<Record<string, any> | null>(null);

  // Navigation state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = modeConfig.totalSteps;

  // Accounting state
  const [accountingResult, setAccountingResult] = useState<AccountingRuleTestResult | null>(null);
  const [loadingAccounting, setLoadingAccounting] = useState(false);

  // Commission state
  const [commissionResult, setCommissionResult] = useState<ComisionResponse | null>(null);
  const [calculatedCommission, setCalculatedCommission] = useState<number>(0);
  const [diasVigencia, setDiasVigencia] = useState<number>(0);

  // Deferred payments state
  const [isCommissionDeferred, setIsCommissionDeferred] = useState<boolean>(false);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load SWIFT configurations based on message type
  useEffect(() => {
    const loadSwiftConfigs = async () => {
      try {
        setIsLoadingConfigs(true);
        const configs = await swiftFieldConfigService.getAll(messageType, true);
        setSwiftConfigs(configs);
      } catch (error) {
        console.error('Error al cargar configuraciones SWIFT:', error);
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
      productCode: 'C',
      countryCode: 'E',
      agencyCode: '0001',
      entityType: 'COLLECTION',
    }));
  }, []);

  // Load draft if draftId is provided or from URL
  useEffect(() => {
    const draftIdToLoad = draftId || searchParams.get('draft');
    if (!draftIdToLoad) return;

    const loadDraft = async () => {
      try {
        setIsLoadingDraft(true);

        const { draft, fields } = await swiftDraftService.getDraftWithFields(
          String(draftIdToLoad),
          swiftConfigs
        );

        setEditingDraftId(draft.id);
        setEditingDraftAggregateId(draft.draftId);
        setEditingDraftNumeroOperacion(draft.reference || null);

        // Update message type if available
        if (draft.messageType) {
          setMessageType(draft.messageType);
        }

        // Set SWIFT fields data from parsed message
        setSwiftFieldsData(prev => ({
          ...prev,
          ...fields,
          productCode: 'C',
          countryCode: 'E',
          agencyCode: '0001',
          entityType: 'COLLECTION',
        }));

        // Load related entities from metadata
        const promises: Promise<any>[] = [];

        if (draft.beneficiaryId) {
          promises.push(
            participanteService.getParticipanteById(draft.beneficiaryId)
              .then(p => setSelectedEntities(prev => ({ ...prev, librado: p })))
              .catch(console.error)
          );
        }

        if (draft.currency) {
          promises.push(
            monedaService.getAllMonedas()
              .then(monedas => {
                const moneda = monedas.find(m => m.codigo === draft.currency);
                if (moneda) setSelectedEntities(prev => ({ ...prev, moneda }));
              })
              .catch(console.error)
          );
        }

        if (draft.issuingBankId) {
          promises.push(
            institucionFinancieraService.getInstitucionFinancieraById(draft.issuingBankId)
              .then(b => setSelectedEntities(prev => ({ ...prev, bancoRemitente: b })))
              .catch(console.error)
          );
        }

        if (draft.advisingBankId) {
          promises.push(
            institucionFinancieraService.getInstitucionFinancieraById(draft.advisingBankId)
              .then(b => setSelectedEntities(prev => ({ ...prev, bancoCobrador: b })))
              .catch(console.error)
          );
        }

        await Promise.all(promises);

        // Restore customData (e.g., selectedAlertTemplateIds)
        if (draft.customData) {
          try {
            const parsed = typeof draft.customData === 'string'
              ? JSON.parse(draft.customData) : draft.customData;
            setLoadedCustomData(parsed);
          } catch (e) {
            console.warn('Error parsing draft customData:', e);
          }
        }

        // Update form data with draft metadata
        setFormData(prev => ({
          ...prev,
          librado: draft.beneficiaryId?.toString() || '',
          moneda: draft.currency || 'USD',
          monto: draft.amount?.toString() || '',
          referenciaRemitente: draft.reference || '',
          referenciaCobranza: draft.reference || '',
          tipoMensaje: (draft.messageType as any) || 'MT400',
        }));
      } catch (error) {
        console.error('Error loading draft:', error);
        toaster.error({
          title: 'Error al cargar borrador',
          description: error instanceof Error ? error.message : 'No se pudo cargar el borrador',
        });
      } finally {
        setIsLoadingDraft(false);
      }
    };

    loadDraft();
  }, [draftId, searchParams, swiftConfigs]);

  // Calculate optional fields stats
  const optionalFieldsStats = useCallback(() => {
    const optionalConfigs = swiftConfigs.filter(c => !c.mandatory);
    const total = optionalConfigs.length;
    const filled = optionalConfigs.filter(c => {
      const value = swiftFieldsData[c.fieldCode];
      return value !== undefined && value !== null && value !== '';
    }).length;
    const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;
    return { filled, total, percentage };
  }, [swiftConfigs, swiftFieldsData])();

  // Handle form data changes
  const handleFormDataChange = useCallback((field: keyof CollectionsIssuanceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field if exists
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [fieldErrors]);

  // Handle entity selection
  const handleEntitySelect = useCallback(<K extends keyof SelectedEntities>(
    entity: K,
    value: SelectedEntities[K]
  ) => {
    setSelectedEntities(prev => ({ ...prev, [entity]: value }));

    // Update corresponding form data field
    const entityToFormField: Record<string, keyof CollectionsIssuanceFormData> = {
      librado: 'librado',
      moneda: 'moneda',
    };

    const formField = entityToFormField[entity as string];
    if (formField && value) {
      const entityValue = value as any;
      const idValue = entityValue.id?.toString() || entityValue.codigo || '';
      setFormData(prev => ({ ...prev, [formField]: idValue }));
    }
  }, []);

  // Handle SWIFT field changes
  const handleSwiftFieldChange = useCallback((fieldCode: string, value: any) => {
    // Handle special bank fields for Collections
    const bankFieldMappings: Record<string, keyof SelectedEntities> = {
      ':52a:': 'bancoRemitente',
      ':53a:': 'bancoCobrador',
    };

    const entityField = bankFieldMappings[fieldCode];
    if (entityField && value && typeof value === 'object') {
      setSelectedEntities(prev => ({ ...prev, [entityField]: value }));
    }

    setSwiftFieldsData(prev => ({ ...prev, [fieldCode]: value }));
  }, []);

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

  // Save draft
  const saveDraft = useCallback(async () => {
    try {
      setIsSubmitting(true);

      if (editingDraftAggregateId) {
        // Update existing draft
        await swiftDraftService.updateDraftFromFields(
          editingDraftAggregateId,
          swiftFieldsData,
          swiftConfigs,
          user?.username || 'system',
          customDataRef?.current
        );
        toaster.success({
          title: 'Borrador actualizado',
          description: 'Los cambios se han guardado correctamente',
        });
      } else {
        // Create new draft using swiftDraftService
        const modeValue = mode === 'wizard' ? 'WIZARD' : 'EXPERT';
        const result = await swiftDraftService.createDraftFromFields(
          messageType,
          'COLLECTION',
          swiftFieldsData,
          swiftConfigs,
          user?.username || 'system',
          modeValue,
          false,
          customDataRef?.current
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
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, swiftFieldsData, swiftConfigs, editingDraftId, editingDraftAggregateId, mode, messageType]);

  // Submit form (emit collection)
  const submitForm = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await saveDraft();
      // Additional submission logic for collection emission
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [saveDraft]);

  return {
    // Form data
    formData,
    setFormData,
    handleFormDataChange,

    // Selected entities
    selectedEntities,
    handleEntitySelect,

    // SWIFT configuration
    swiftConfigs,
    swiftFieldsData,
    handleSwiftFieldChange,
    isLoadingConfigs,

    // Message type
    messageType,
    setMessageType,

    // Validation
    fieldErrors,
    setFieldErrors,

    // Draft management
    editingDraftId,
    editingDraftAggregateId,
    editingDraftNumeroOperacion,
    isLoadingDraft,
    loadedCustomData,
    saveDraft,

    // Navigation
    currentStep,
    setCurrentStep,
    totalSteps,
    goToNextStep,
    goToPreviousStep,

    // Accounting
    accountingResult,
    setAccountingResult,
    loadingAccounting,
    setLoadingAccounting,

    // Commission
    commissionResult,
    setCommissionResult,
    calculatedCommission,
    setCalculatedCommission,
    diasVigencia,
    setDiasVigencia,

    // Deferred payments
    isCommissionDeferred,
    setIsCommissionDeferred,
    paymentSchedule,
    setPaymentSchedule,

    // Optional fields stats
    optionalFieldsStats,

    // Mode config
    modeConfig,

    // Submission
    submitForm,
    isSubmitting,
  };
}

export default useCollectionsIssuanceForm;
