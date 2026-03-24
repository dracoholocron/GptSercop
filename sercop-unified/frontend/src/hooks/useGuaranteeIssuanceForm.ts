import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Participante } from '../services/participantService';
import type { Moneda } from '../services/currencyService';
import type { InstitucionFinanciera } from '../services/financialInstitutionService';
import type { SwiftFieldConfig } from '../types/swiftField';
import type { AccountingRuleTestResult } from '../services/accountingRulesService';
import type { ComisionResponse } from '../services/commissionService';
import { swiftFieldConfigService } from '../services/swiftFieldConfigService';
import { swiftDraftService, SwiftValidationError } from '../services/swiftDraftService';
import { toaster } from '../components/ui/toaster';
import { notify } from '../components/ui/toaster';
import { participanteService } from '../services/participantService';
import { monedaService } from '../services/currencyService';
import { institucionFinancieraService } from '../services/financialInstitutionService';
import {
  type GuaranteeIssuanceFormData,
  type SelectedEntities,
  type ValidationError,
  type IssuanceMode,
  type PaymentScheduleItem,
  initialFormData,
  MODE_CONFIGS,
} from '../components/guarantee-issuance/types';

interface UseGuaranteeIssuanceFormOptions {
  mode: IssuanceMode;
  draftId?: number;
  customDataRef?: React.MutableRefObject<Record<string, any> | undefined>;
}

interface UseGuaranteeIssuanceFormReturn {
  // Form data
  formData: GuaranteeIssuanceFormData;
  setFormData: React.Dispatch<React.SetStateAction<GuaranteeIssuanceFormData>>;
  handleFormDataChange: (field: keyof GuaranteeIssuanceFormData, value: string) => void;

  // Selected entities
  selectedEntities: SelectedEntities;
  handleEntitySelect: <K extends keyof SelectedEntities>(entity: K, value: SelectedEntities[K]) => void;

  // SWIFT configuration
  swiftConfigs: SwiftFieldConfig[];
  swiftFieldsData: Record<string, any>;
  handleSwiftFieldChange: (fieldCode: string, value: any) => void;
  isLoadingConfigs: boolean;

  // Validation
  fieldErrors: Record<string, ValidationError>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, ValidationError>>>;

  // Draft management
  editingDraftId: number | null;
  editingDraftAggregateId: string | null;
  editingDraftNumeroOperacion: string | null;
  isLoadingDraft: boolean;
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

  // Mode config
  modeConfig: typeof MODE_CONFIGS[IssuanceMode];

  // Custom data loaded from draft
  loadedCustomData: Record<string, any> | null;

  // Submission
  submitForm: () => Promise<void>;
  isSubmitting: boolean;
}

export function useGuaranteeIssuanceForm({ mode, draftId, customDataRef }: UseGuaranteeIssuanceFormOptions): UseGuaranteeIssuanceFormReturn {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const modeConfig = MODE_CONFIGS[mode];

  // Form state
  const [formData, setFormData] = useState<GuaranteeIssuanceFormData>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, ValidationError>>({});

  // Selected entities
  const [selectedEntities, setSelectedEntities] = useState<SelectedEntities>({
    solicitante: null,
    beneficiario: null,
    moneda: null,
    bancoEmisor: null,
    bancoNotificador: null,
    bancoConfirmador: null,
    bancoSolicitante: null,
    bancoIntermediario: null,
    bancoBeneficiario: null,
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

  // Load SWIFT configurations for MT760
  useEffect(() => {
    const loadSwiftConfigs = async () => {
      try {
        setIsLoadingConfigs(true);
        const configs = await swiftFieldConfigService.getAll('MT760', true);
        setSwiftConfigs(configs);
      } catch (error) {
        console.error('Error al cargar configuraciones SWIFT:', error);
      } finally {
        setIsLoadingConfigs(false);
      }
    };
    loadSwiftConfigs();
  }, []);

  // Initialize SWIFT metadata
  useEffect(() => {
    setSwiftFieldsData(prev => ({
      ...prev,
      productCode: 'B',  // B = Bank Guarantees (según reference_number_config)
      countryCode: 'E',
      agencyCode: '0001',
      entityType: 'GUARANTEE',
    }));
  }, []);

  // Load draft if draftId is provided or from URL
  useEffect(() => {
    const draftIdToLoad = draftId || searchParams.get('draft');
    if (!draftIdToLoad) return;

    const loadDraft = async () => {
      try {
        setIsLoadingDraft(true);

        // Use swiftDraftService to load draft with parsed SWIFT fields
        const { draft, fields } = await swiftDraftService.getDraftWithFields(
          String(draftIdToLoad),
          swiftConfigs
        );

        setEditingDraftId(draft.id);
        setEditingDraftAggregateId(draft.draftId);
        setEditingDraftNumeroOperacion(draft.reference || null);

        // Set SWIFT fields data from parsed message
        setSwiftFieldsData(prev => ({
          ...prev,
          ...fields,
          productCode: 'B',  // B = Bank Guarantees (según reference_number_config)
          countryCode: 'E',
          agencyCode: '0001',
          entityType: 'GUARANTEE',
        }));

        // Load related entities from metadata
        const promises: Promise<any>[] = [];

        if (draft.applicantId) {
          promises.push(
            participanteService.getParticipanteById(draft.applicantId)
              .then(p => setSelectedEntities(prev => ({ ...prev, solicitante: p })))
              .catch(console.error)
          );
        }

        if (draft.beneficiaryId) {
          promises.push(
            participanteService.getParticipanteById(draft.beneficiaryId)
              .then(p => setSelectedEntities(prev => ({ ...prev, beneficiario: p })))
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
              .then(b => setSelectedEntities(prev => ({ ...prev, bancoEmisor: b })))
              .catch(console.error)
          );
        }

        if (draft.advisingBankId) {
          promises.push(
            institucionFinancieraService.getInstitucionFinancieraById(draft.advisingBankId)
              .then(b => setSelectedEntities(prev => ({ ...prev, bancoNotificador: b })))
              .catch(console.error)
          );
        }

        await Promise.all(promises);

        // Update form data with draft metadata
        setFormData(prev => ({
          ...prev,
          solicitante: draft.applicantId?.toString() || '',
          beneficiario: draft.beneficiaryId?.toString() || '',
          moneda: draft.currency || 'USD',
          monto: draft.amount?.toString() || '',
          fechaEmision: draft.issueDate || '',
          fechaVencimiento: draft.expiryDate || '',
          referenciaRemitente: draft.reference || '',
          bancoEmisor: draft.issuingBankId?.toString() || '',
          bancoNotificador: draft.advisingBankId?.toString() || '',
        }));

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

  // Handle form data changes
  const handleFormDataChange = useCallback((field: keyof GuaranteeIssuanceFormData, value: string) => {
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
    const entityToFormField: Record<string, keyof GuaranteeIssuanceFormData> = {
      solicitante: 'solicitante',
      beneficiario: 'beneficiario',
      moneda: 'moneda',
      bancoEmisor: 'bancoEmisor',
      bancoNotificador: 'bancoNotificador',
      bancoConfirmador: 'bancoConfirmador',
      bancoSolicitante: 'bancoSolicitante',
      bancoIntermediario: 'bancoIntermediario',
      bancoBeneficiario: 'bancoBeneficiario',
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
    // Handle special bank fields for MT760
    const bankFieldMappings: Record<string, keyof SelectedEntities> = {
      ':56a:': 'bancoIntermediario',
      ':58a:': 'bancoBeneficiario',
      ':51a:': 'bancoSolicitante',
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
        const modeValue = mode === 'wizard' ? 'WIZARD' : mode === 'expert' ? 'EXPERT' : 'CLIENT';
        const result = await swiftDraftService.createDraftFromFields(
          'MT760',
          'GUARANTEE',
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
  }, [formData, swiftFieldsData, swiftConfigs, editingDraftId, editingDraftAggregateId, mode]);

  // Submit form (emit guarantee) - Usa método centralizado con validación
  const submitForm = useCallback(async () => {
    try {
      setIsSubmitting(true);

      // Usar el método centralizado que valida y envía para aprobación
      const draftMode = mode === 'wizard' ? 'WIZARD' : mode === 'expert' ? 'EXPERT' : 'CLIENT';

      console.log('🚀 Enviando Garantía para aprobación usando método centralizado');
      const result = await swiftDraftService.createAndSubmitForApproval(
        'MT760', // MT760 para Garantías
        'GUARANTEE',
        swiftFieldsData,
        swiftConfigs,
        user?.username || 'system',
        draftMode,
        editingDraftAggregateId || undefined,
        customDataRef?.current
      );

      console.log('✅ Garantía enviada para aprobación:', result.draftId);
      notify.success('Enviado a aprobación', 'La Garantía Bancaria se ha enviado para aprobación');
      navigate('/workbox/drafts');
    } catch (error) {
      console.error('Error submitting form:', error);

      // Capture draftId from error to prevent duplicate drafts on retry
      const errorDraftId = (error as any)?.draftId;
      if (errorDraftId && !editingDraftAggregateId) {
        setEditingDraftAggregateId(errorDraftId);
      }

      // Si es un error de validación SWIFT y la notificación ya se mostró, no mostrar duplicado
      if (error instanceof SwiftValidationError && error.notificationShown) {
        return;
      }
      notify.error('Error', 'Error al enviar la Garantía para aprobación');
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, swiftFieldsData, swiftConfigs, editingDraftAggregateId, navigate]);

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

    // Validation
    fieldErrors,
    setFieldErrors,

    // Draft management
    editingDraftId,
    editingDraftAggregateId,
    editingDraftNumeroOperacion,
    isLoadingDraft,
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

    // Mode config
    modeConfig,

    // Custom data loaded from draft
    loadedCustomData,

    // Submission
    submitForm,
    isSubmitting,
  };
}

export default useGuaranteeIssuanceForm;
