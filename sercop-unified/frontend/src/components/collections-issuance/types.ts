import type { Participante } from '../../services/participantService';
import type { Moneda } from '../../services/currencyService';
import type { InstitucionFinanciera } from '../../services/financialInstitutionService';
import type { SwiftFieldConfig } from '../../types/swiftField';
import type { AccountingRuleTestResult } from '../../services/accountingRulesService';
import type { ComisionResponse } from '../../services/commissionService';

// Modos de edición disponibles (sin cliente para collections)
export type IssuanceMode = 'wizard' | 'expert';

// Configuración de visibilidad por sección
export interface SectionVisibility {
  basicInfo: boolean;
  amounts: boolean;
  parties: boolean;
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
  layout: 'steps' | 'scroll';
  totalSteps: number;
  showFloatingActions: boolean;
}

// Configuraciones predefinidas por modo
export const MODE_CONFIGS: Record<IssuanceMode, ModeConfig> = {
  wizard: {
    mode: 'wizard',
    visibility: {
      basicInfo: true,
      amounts: true,
      parties: true,
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
    totalSteps: 7,
    showFloatingActions: false,
  },
  expert: {
    mode: 'expert',
    visibility: {
      basicInfo: true,
      amounts: true,
      parties: true,
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
};

// Interface para los datos del formulario Collections
export interface CollectionsIssuanceFormData {
  // Información Básica
  referenciaRemitente: string;
  referenciaCobranza: string;
  tipoMensaje: 'MT400' | 'MT410' | 'MT412' | 'MT416' | 'MT420';

  // Montos
  moneda: string;
  monto: string;

  // Partes
  librado: string;

  // Adicional
  informacionAdicional: string;
  razonNoPago: string;
  narrativa: string;
}

// Valores iniciales del formulario
export const initialFormData: CollectionsIssuanceFormData = {
  referenciaRemitente: '',
  referenciaCobranza: '',
  tipoMensaje: 'MT400',
  moneda: 'USD',
  monto: '',
  librado: '',
  informacionAdicional: '',
  razonNoPago: '',
  narrativa: '',
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
  librado: Participante | null;
  moneda: Moneda | null;
  bancoRemitente: InstitucionFinanciera | null;
  bancoCobrador: InstitucionFinanciera | null;
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
  formData: CollectionsIssuanceFormData;
  selectedEntities: SelectedEntities;
  swiftFieldsData: Record<string, any>;
  swiftConfigs: SwiftFieldConfig[];
  fieldErrors: Record<string, ValidationError>;
  onFormDataChange: (field: keyof CollectionsIssuanceFormData, value: string) => void;
  onSwiftFieldChange: (fieldCode: string, value: any) => void;
  onEntitySelect: <K extends keyof SelectedEntities>(entity: K, value: SelectedEntities[K]) => void;
  showHelp?: boolean;
}

// Interface para props del componente principal
export interface CollectionsIssuanceFormProps {
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
    titleKey: 'collectionsWizard.steps.basicInfo',
    description: 'Referencias y tipo de mensaje',
    sections: ['basicInfo'],
  },
  {
    number: 2,
    title: 'Montos',
    titleKey: 'collectionsWizard.steps.amounts',
    description: 'Monto y moneda',
    sections: ['amounts'],
  },
  {
    number: 3,
    title: 'Partes',
    titleKey: 'collectionsWizard.steps.parties',
    description: 'Librado y partes involucradas',
    sections: ['parties'],
  },
  {
    number: 4,
    title: 'Información Adicional',
    titleKey: 'collectionsWizard.steps.additionalInfo',
    description: 'Detalles adicionales',
    sections: ['additional'],
  },
  {
    number: 5,
    title: 'Contabilidad',
    titleKey: 'collectionsWizard.steps.accounting',
    description: 'Asientos contables',
    sections: ['accounting'],
  },
  {
    number: 6,
    title: 'Alertas',
    titleKey: 'collectionsWizard.steps.alerts',
    description: 'Seguimiento y control de riesgo',
    sections: ['alerts'],
  },
  {
    number: 7,
    title: 'SWIFT',
    titleKey: 'collectionsWizard.steps.swiftMessage',
    description: 'Vista previa del mensaje',
    sections: ['swiftPreview'],
  },
];

// Pasos para modo cliente (sin contabilidad ni SWIFT) - Collections no tiene modo cliente
// pero se exporta para consistencia con otros módulos
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
  // Paso 2: Montos
  'AMOUNTS': 2,
  'MONTOS': 2,
  // Paso 3: Partes
  'PARTIES': 3,
  'PARTES': 3,
  // Paso 4: Adicional
  'ADDITIONAL': 4,
  'ADICIONAL': 4,
  // Paso 5: Contabilidad
  'ACCOUNTING': 5,
  'CONTABILIDAD': 5,
  // Paso 6: Alertas
  'ALERTS': 6,
  // Paso 7: SWIFT Preview
  'PREVIEW': 7,
  'SWIFT': 7,
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
