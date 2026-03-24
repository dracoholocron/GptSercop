import type { Participante } from '../../services/participantService';
import type { Moneda } from '../../services/currencyService';
import type { InstitucionFinanciera } from '../../services/financialInstitutionService';
import type { SwiftFieldConfig } from '../../types/swiftField';
import type { AccountingRuleTestResult } from '../../services/accountingRulesService';
import type { ComisionResponse } from '../../services/commissionService';

// Modos de edición disponibles
export type IssuanceMode = 'wizard' | 'expert' | 'client';

// Configuración de visibilidad por sección
export interface SectionVisibility {
  basicInfo: boolean;
  amountsDates: boolean;
  banks: boolean;
  terms: boolean;
  additional: boolean;
  accounting: boolean;
  alerts: boolean;
  swiftPreview: boolean;
}

// Configuración de ayuda por modo
export interface HelpConfig {
  showContextualHelp: boolean;
  showFieldTooltips: boolean;
  showOptionalFieldsIndicator: boolean;
}

// Configuración completa por modo
export interface ModeConfig {
  mode: IssuanceMode;
  visibility: SectionVisibility;
  help: HelpConfig;
  layout: 'steps' | 'scroll' | 'accordion';
  totalSteps: number;
  showFloatingActions: boolean;
}

// Configuraciones predefinidas por modo
export const MODE_CONFIGS: Record<IssuanceMode, ModeConfig> = {
  wizard: {
    mode: 'wizard',
    visibility: {
      basicInfo: true,
      amountsDates: true,
      banks: true,
      terms: true,
      additional: true,
      accounting: true,
      alerts: true,
      swiftPreview: true,
    },
    help: {
      showContextualHelp: true,
      showFieldTooltips: true,
      showOptionalFieldsIndicator: true,
    },
    layout: 'steps',
    totalSteps: 8,
    showFloatingActions: false,
  },
  expert: {
    mode: 'expert',
    visibility: {
      basicInfo: true,
      amountsDates: true,
      banks: true,
      terms: true,
      additional: true,
      accounting: true,
      alerts: true,
      swiftPreview: true,
    },
    help: {
      showContextualHelp: false,
      showFieldTooltips: false,
      showOptionalFieldsIndicator: false,
    },
    layout: 'scroll',
    totalSteps: 1,
    showFloatingActions: true,
  },
  client: {
    mode: 'client',
    visibility: {
      basicInfo: true,
      amountsDates: true,
      banks: true,
      terms: true,
      additional: true,
      accounting: false,
      alerts: false,
      swiftPreview: false,
    },
    help: {
      showContextualHelp: true,
      showFieldTooltips: true,
      showOptionalFieldsIndicator: true,
    },
    layout: 'steps',
    totalSteps: 5,
    showFloatingActions: false,
  },
};

// Interface para los datos del formulario Guarantee
export interface GuaranteeIssuanceFormData {
  // Paso 1: Información Básica
  referenciaRemitente: string;
  tipoGarantia: string;
  solicitante: string;
  beneficiario: string;

  // Paso 2: Montos y Fechas
  moneda: string;
  monto: string;
  fechaEmision: string;
  fechaVencimiento: string;
  fechaExpiracion: string;
  montoMaximo: string;
  reduccionAutomatica: string;

  // Paso 3: Bancos Participantes
  bancoEmisor: string;
  bancoNotificador: string;
  bancoConfirmador: string;
  bancoSolicitante: string;
  bancoIntermediario: string;
  bancoBeneficiario: string;

  // Paso 4: Términos y Condiciones
  terminosCondiciones: string;
  condicionesAdicionales: string;
  condicionesEspeciales: string;

  // Paso 5: Información Adicional
  referenciaRelacionada: string;
  informacionAdicional: string;
}

// Valores iniciales del formulario
export const initialFormData: GuaranteeIssuanceFormData = {
  referenciaRemitente: '',
  tipoGarantia: 'PERFORMANCE',
  solicitante: '',
  beneficiario: '',
  moneda: 'USD',
  monto: '',
  fechaEmision: '',
  fechaVencimiento: '',
  fechaExpiracion: '',
  montoMaximo: '',
  reduccionAutomatica: '',
  bancoEmisor: '',
  bancoNotificador: '',
  bancoConfirmador: '',
  bancoSolicitante: '',
  bancoIntermediario: '',
  bancoBeneficiario: '',
  terminosCondiciones: '',
  condicionesAdicionales: '',
  condicionesEspeciales: '',
  referenciaRelacionada: '',
  informacionAdicional: '',
};

// Interface para errores de validación
export interface ValidationError {
  field: string;
  fieldName?: string;
  section?: string;        // Código de sección (BASIC, AMOUNTS, etc.)
  sectionLabel?: string;   // Etiqueta traducida de la sección
  message: string;
  severity: 'error' | 'warning';
}

// Interface para las entidades seleccionadas
export interface SelectedEntities {
  solicitante: Participante | null;
  beneficiario: Participante | null;
  moneda: Moneda | null;
  bancoEmisor: InstitucionFinanciera | null;
  bancoNotificador: InstitucionFinanciera | null;
  bancoConfirmador: InstitucionFinanciera | null;
  bancoSolicitante: InstitucionFinanciera | null;
  bancoIntermediario: InstitucionFinanciera | null;
  bancoBeneficiario: InstitucionFinanciera | null;
}

// Interface para el estado del borrador
export interface DraftState {
  editingDraftId: number | null;
  editingDraftAggregateId: string | null;
  editingDraftNumeroOperacion: string | null;
  isLoadingDraft: boolean;
}

// Interface para el estado de contabilidad
export interface AccountingState {
  accountingResult: AccountingRuleTestResult | null;
  loadingAccounting: boolean;
  commissionResult: ComisionResponse | null;
  calculatedCommission: number;
  diasVigencia: number;
  isCommissionDeferred: boolean;
  paymentSchedule: PaymentScheduleItem[];
}

// Interface para items del cronograma de pagos
export interface PaymentScheduleItem {
  date: string;
  amount: number;
  percentage: number;
}

// Interface para props de secciones
export interface SectionProps {
  mode: IssuanceMode;
  formData: GuaranteeIssuanceFormData;
  selectedEntities: SelectedEntities;
  swiftFieldsData: Record<string, any>;
  swiftConfigs: SwiftFieldConfig[];
  fieldErrors: Record<string, ValidationError>;
  onFormDataChange: (field: keyof GuaranteeIssuanceFormData, value: string) => void;
  onSwiftFieldChange: (fieldCode: string, value: any) => void;
  onEntitySelect: <K extends keyof SelectedEntities>(entity: K, value: SelectedEntities[K]) => void;
  showHelp?: boolean;
  showOptionalFields?: boolean;
}

// Interface para props del componente principal
export interface GuaranteeIssuanceFormProps {
  mode?: IssuanceMode;
  draftId?: number;
}

// Definición de los pasos del wizard
export interface StepDefinition {
  number: number;
  title: string;
  titleKey: string; // i18n key for translated title
  description: string;
  sections: (keyof SectionVisibility)[];
}

export const WIZARD_STEPS: StepDefinition[] = [
  {
    number: 1,
    title: 'Información Básica',
    titleKey: 'guaranteeWizard.steps.basicInfo',
    description: 'Datos generales de la garantía',
    sections: ['basicInfo'],
  },
  {
    number: 2,
    title: 'Montos y Fechas',
    titleKey: 'guaranteeWizard.steps.amountsAndDates',
    description: 'Importes y vigencia',
    sections: ['amountsDates'],
  },
  {
    number: 3,
    title: 'Bancos',
    titleKey: 'guaranteeWizard.steps.participatingBanks',
    description: 'Instituciones participantes',
    sections: ['banks'],
  },
  {
    number: 4,
    title: 'Términos',
    titleKey: 'guaranteeWizard.steps.termsAndConditions',
    description: 'Condiciones de la garantía',
    sections: ['terms'],
  },
  {
    number: 5,
    title: 'Adicional',
    titleKey: 'guaranteeWizard.steps.additionalInfo',
    description: 'Información adicional',
    sections: ['additional'],
  },
  {
    number: 6,
    title: 'Contabilidad',
    titleKey: 'lcImportWizard.steps.accounting',
    description: 'Asientos contables',
    sections: ['accounting'],
  },
  {
    number: 7,
    title: 'Alertas',
    titleKey: 'guaranteeWizard.steps.alerts',
    description: 'Seguimiento y control de riesgo',
    sections: ['alerts'],
  },
  {
    number: 8,
    title: 'SWIFT',
    titleKey: 'lcImportWizard.steps.swiftMessage',
    description: 'Mensaje MT760',
    sections: ['swiftPreview'],
  },
];

// Pasos para modo cliente (sin contabilidad ni SWIFT)
export const CLIENT_STEPS: StepDefinition[] = WIZARD_STEPS.filter(
  step => !step.sections.includes('accounting') && !step.sections.includes('alerts') && !step.sections.includes('swiftPreview')
).map((step, index) => ({ ...step, number: index + 1 }));

/**
 * Mapeo de códigos de sección SWIFT a número de paso del wizard
 * Usado para determinar qué paso tiene errores de validación
 */
export const DEFAULT_SECTION_STEP_MAP: Record<string, number> = {
  // Paso 1: Información Básica
  'BASIC': 1,
  'BASICA': 1,
  'REFERENCE': 1,
  // Paso 2: Montos y Fechas
  'AMOUNTS': 2,
  'MONTOS': 2,
  'DATES': 2,
  'FECHAS': 2,
  // Paso 3: Bancos
  'BANKS': 3,
  'BANCOS': 3,
  // Paso 4: Términos
  'TERMS': 4,
  'TERMINOS': 4,
  'CONDITIONS': 4,
  // Paso 5: Adicional
  'ADDITIONAL': 5,
  'ADICIONAL': 5,
  // Paso 6: Contabilidad
  'ACCOUNTING': 6,
  'CONTABILIDAD': 6,
  // Paso 7: Alertas
  'ALERTS': 7,
  // Paso 8: SWIFT Preview
  'PREVIEW': 8,
  'SWIFT': 8,
};

/**
 * Obtiene los pasos del wizard que tienen errores basado en las secciones con error
 * @param errorSections - Array de códigos de sección con errores
 * @param customMapping - Mapeo personalizado (opcional)
 */
export function getWizardStepsWithErrors(
  errorSections: string[],
  customMapping?: Record<string, number>
): number[] {
  const mapping = customMapping || DEFAULT_SECTION_STEP_MAP;
  const stepsWithErrors = new Set<number>();

  for (const sectionCode of errorSections) {
    const step = mapping[sectionCode];
    if (step !== undefined) {
      stepsWithErrors.add(step);
    }
  }

  return Array.from(stepsWithErrors).sort((a, b) => a - b);
}
