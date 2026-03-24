import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Participante } from '../services/participantService';
import type { Moneda } from '../services/currencyService';
import type { InstitucionFinanciera } from '../services/financialInstitutionService';
import type { CatalogoPersonalizado } from '../services/customCatalogService';
import type { SwiftFieldConfig } from '../types/swiftField';
import type { AccountingRuleTestResult } from '../services/accountingRulesService';
import type { ComisionResponse } from '../services/commissionService';
import { swiftFieldConfigService } from '../services/swiftFieldConfigService';
import { swiftDraftService } from '../services/swiftDraftService';
import { toaster } from '../components/ui/toaster';
import { participanteService } from '../services/participantService';
import { monedaService } from '../services/currencyService';
import { institucionFinancieraService } from '../services/financialInstitutionService';
import { catalogoPersonalizadoService } from '../services/customCatalogService';
import {
  type LCIssuanceFormData,
  type SelectedEntities,
  type ValidationError,
  type IssuanceMode,
  type PaymentScheduleItem,
  initialFormData,
  MODE_CONFIGS,
} from '../components/lc-issuance/types';

interface UseLCIssuanceFormOptions {
  mode: IssuanceMode;
  draftId?: number;
  operationType?: 'LC_IMPORT' | 'LC_EXPORT';
  /** Ref to additional customData to include when saving draft (e.g., selectedAlertTemplateIds) */
  customDataRef?: React.MutableRefObject<Record<string, any> | undefined>;
}

interface UseLCIssuanceFormReturn {
  // Form data
  formData: LCIssuanceFormData;
  setFormData: React.Dispatch<React.SetStateAction<LCIssuanceFormData>>;
  handleFormDataChange: (field: keyof LCIssuanceFormData, value: string) => void;

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

  // Submission
  submitForm: () => Promise<void>;
  isSubmitting: boolean;

  // Custom data from loaded draft
  loadedCustomData: Record<string, any> | null;
}

export function useLCIssuanceForm({ mode, draftId, operationType = 'LC_IMPORT', customDataRef }: UseLCIssuanceFormOptions): UseLCIssuanceFormReturn {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const modeConfig = MODE_CONFIGS[mode];

  // Determinar productCode basado en el tipo de operación
  // M = LC Import (Importaciones), E = LC Export (Exportaciones)
  const productCode = operationType === 'LC_EXPORT' ? 'E' : 'M';

  // Form state
  const [formData, setFormData] = useState<LCIssuanceFormData>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, ValidationError>>({});

  // Selected entities
  const [selectedEntities, setSelectedEntities] = useState<SelectedEntities>({
    ordenante: null,
    beneficiario: null,
    moneda: null,
    bancoEmisor: null,
    bancoNotificador: null,
    bancoConfirmador: null,
    bancoOrdenante: null,
    bancoIntermediario: null,
    bancoBeneficiario: null,
    bancoPagador: null,
    bancoDisponible: null,
    paisOrigen: null,
    paisDestino: null,
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

  // Load SWIFT configurations
  useEffect(() => {
    const loadSwiftConfigs = async () => {
      try {
        setIsLoadingConfigs(true);
        const configs = await swiftFieldConfigService.getAll('MT700', true);
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
      productCode: productCode,
      countryCode: 'E',
      agencyCode: '0001',
      entityType: operationType,
    }));
  }, [productCode, operationType]);

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
          productCode: productCode,
          countryCode: 'E',
          agencyCode: '0001',
          entityType: operationType,
        }));

        // Load related entities from metadata
        const promises: Promise<any>[] = [];

        if (draft.applicantId) {
          promises.push(
            participanteService.getParticipanteById(draft.applicantId)
              .then(p => setSelectedEntities(prev => ({ ...prev, ordenante: p })))
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
          ordenante: draft.applicantId?.toString() || '',
          beneficiario: draft.beneficiaryId?.toString() || '',
          moneda: draft.currency || 'USD',
          monto: draft.amount?.toString() || '',
          fechaEmision: draft.issueDate || '',
          fechaVencimiento: draft.expiryDate || '',
          referenciaRemitente: draft.reference || '',
          bancoEmisor: draft.issuingBankId?.toString() || '',
          bancoNotificador: draft.advisingBankId?.toString() || '',
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

  // Handle form data changes
  const handleFormDataChange = useCallback((field: keyof LCIssuanceFormData, value: string) => {
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
    const entityToFormField: Record<string, keyof LCIssuanceFormData> = {
      ordenante: 'ordenante',
      beneficiario: 'beneficiario',
      moneda: 'moneda',
      bancoEmisor: 'bancoEmisor',
      bancoNotificador: 'bancoNotificador',
      bancoConfirmador: 'bancoConfirmador',
      bancoOrdenante: 'bancoOrdenante',
      bancoIntermediario: 'bancoIntermediario',
      bancoBeneficiario: 'bancoBeneficiario',
      bancoPagador: 'bancoPagador',
      bancoDisponible: 'bancoDisponible',
      paisOrigen: 'paisOrigen',
      paisDestino: 'paisDestino',
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
    // Handle special bank fields
    const bankFieldMappings: Record<string, keyof SelectedEntities> = {
      ':56a:': 'bancoIntermediario',
      ':58a:': 'bancoBeneficiario',
      ':54a:': 'bancoPagador',
      ':41a:': 'bancoDisponible',
      ':51a:': 'bancoOrdenante',
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

      // DEBUG: Ver qué valores están llegando
      console.log('🔍 DEBUG saveDraft - swiftFieldsData:', JSON.stringify(swiftFieldsData, null, 2));

      // Extraer IDs de ordenante y beneficiario desde swiftFieldsData si están disponibles
      const applicantField = swiftFieldsData[':50:'];
      const beneficiaryField = swiftFieldsData[':59:'];
      const ordenanteId = applicantField?.participantId
        || (formData.ordenante ? parseInt(formData.ordenante) : undefined);
      const beneficiarioId = beneficiaryField?.participantId
        || (formData.beneficiario ? parseInt(formData.beneficiario) : undefined);

      // Extraer monto y moneda desde :32B: (Currency/Amount)
      const currencyAmountField = swiftFieldsData[':32B:'];
      const montoValue = currencyAmountField?.amount
        ? parseFloat(String(currencyAmountField.amount).replace(/\./g, '').replace(',', '.'))
        : (formData.monto ? parseFloat(formData.monto.replace(/\./g, '').replace(',', '.')) : undefined);
      const monedaValue = currencyAmountField?.currency || formData.moneda;

      // Extraer fechas desde swiftFieldsData
      const fechaEmisionValue = swiftFieldsData[':31C:'] || formData.fechaEmision;
      const fechaVencimientoField = swiftFieldsData[':31D:'];
      const fechaVencimientoValue = fechaVencimientoField?.date || fechaVencimientoField || formData.fechaVencimiento;

      const extraCustomData = customDataRef?.current;

      if (editingDraftAggregateId) {
        // Update existing draft
        await swiftDraftService.updateDraftFromFields(
          editingDraftAggregateId,
          swiftFieldsData,
          swiftConfigs,
          user?.username || 'system',
          extraCustomData
        );
        toaster.success({
          title: 'Borrador actualizado',
          description: 'Los cambios se han guardado correctamente',
        });
      } else {
        // Create new draft using swiftDraftService with mode 'EXPERT'
        const result = await swiftDraftService.createDraftFromFields(
          'MT700',
          operationType,
          swiftFieldsData,
          swiftConfigs,
          user?.username || 'system',
          'EXPERT', // Mode for expert issuance
          false,
          extraCustomData
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
  }, [formData, swiftFieldsData, swiftConfigs, editingDraftId, editingDraftAggregateId]);

  // Submit form (emit LC) - Usar método centralizado con validación
  const submitForm = useCallback(async () => {
    try {
      setIsSubmitting(true);

      // Mapear IssuanceMode a DraftMode
      const draftMode = mode.toUpperCase() as 'WIZARD' | 'EXPERT' | 'CLIENT';

      // Usar el método centralizado que valida y envía para aprobación
      const extraCustomData = customDataRef?.current;
      const result = await swiftDraftService.createAndSubmitForApproval(
        'MT700',
        operationType,
        swiftFieldsData,
        swiftConfigs,
        user?.username || 'system',
        draftMode,
        editingDraftAggregateId || undefined,
        extraCustomData
      );

      // Actualizar IDs si es nuevo
      if (result.id) {
        setEditingDraftId(result.id);
        setEditingDraftAggregateId(result.draftId);
      }

      toaster.success({
        title: 'Enviado a aprobación',
        description: 'El borrador se ha enviado para aprobación correctamente',
      });

    } catch (error) {
      console.error('Error submitting form:', error);

      // Capture draftId from error to prevent duplicate drafts on retry
      const errorDraftId = (error as any)?.draftId;
      if (errorDraftId && !editingDraftAggregateId) {
        setEditingDraftAggregateId(errorDraftId);
      }

      // El error de validación ya muestra notificación, no mostrar otra
      if (!(error instanceof Error && error.message === 'Errores de validación SWIFT')) {
        toaster.error({
          title: 'Error al enviar',
          description: error instanceof Error ? error.message : 'No se pudo enviar para aprobación',
        });
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, swiftFieldsData, swiftConfigs, editingDraftAggregateId]);

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

    // Submission
    submitForm,
    isSubmitting,

    // Custom data from loaded draft (for restoring alert selections etc.)
    loadedCustomData,
  };
}

export default useLCIssuanceForm;
