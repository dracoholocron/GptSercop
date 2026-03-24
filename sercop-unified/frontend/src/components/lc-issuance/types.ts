import type { Participante } from '../../services/participantService';
import type { Moneda } from '../../services/currencyService';
import type { InstitucionFinanciera } from '../../services/financialInstitutionService';
import type { CatalogoPersonalizado } from '../../services/customCatalogService';
import type { SwiftFieldConfig } from '../../types/swiftField';
import type { AccountingRuleTestResult } from '../../services/accountingRulesService';
import type { ComisionResponse } from '../../services/commissionService';

// Modos de edición disponibles
export type IssuanceMode = 'wizard' | 'expert' | 'client';

// Configuración de visibilidad por sección
export interface SectionVisibility {
  basicInfo: boolean;
  amounts: boolean;
  banks: boolean;
  shipping: boolean;
  goodsDocs: boolean;
  conditions: boolean;
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
      amounts: true,
      banks: true,
      shipping: true,
      goodsDocs: true,
      conditions: true,
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
    totalSteps: 9,
    showFloatingActions: false,
  },
  expert: {
    mode: 'expert',
    visibility: {
      basicInfo: true,
      amounts: true,
      banks: true,
      shipping: true,
      goodsDocs: true,
      conditions: true,
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
      amounts: true,
      banks: true,
      shipping: true,
      goodsDocs: true,
      conditions: true,
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
    totalSteps: 6,
    showFloatingActions: false,
  },
};

// Interface para los datos del formulario LC
export interface LCIssuanceFormData {
  // Paso 1: Información Básica
  referenciaRemitente: string;
  ordenante: string;
  beneficiario: string;
  tipoLC: string;
  reglasAplicables: string;

  // Paso 2: Montos y Fechas
  moneda: string;
  monto: string;
  fechaEmision: string;
  fechaVencimiento: string;
  lugarVencimiento: string;
  referenciaPreAviso: string;
  numeroEnmienda: string;
  toleranciaPorcentaje: string;
  montoMaximo: string;
  montoAdicional: string;

  // Paso 3: Bancos Participantes
  bancoEmisor: string;
  bancoNotificador: string;
  bancoConfirmador: string;
  bancoOrdenante: string;
  bancoEmisorAlternativo: string;
  bancoIntermediario: string;
  bancoBeneficiario: string;
  bancoPagador: string;
  bancoDisponible: string;
  instruccionesConfirmacion: string;

  // Paso 4: Detalles de Embarque
  paisOrigen: string;
  paisDestino: string;
  incoterm: string;
  puertoEmbarque: string;
  puertoDestino: string;
  periodoEmbarque: string;
  embarquesParciales: string;
  transbordo: string;
  rutaPuertoAPuerto: string;
  lugarEmbarqueDestino: string;
  destinoFinal: string;
  periodoPresentacion: string;

  // Paso 5: Mercancía y Documentos
  mercancia: string;
  cantidadMercancia: string;
  documentosRequeridos: string;

  // Paso 6: Condiciones Especiales
  condicionesEspeciales: string;
  instruccionesAdicionales: string;
  observaciones: string;
  responsableComisiones: string;
  instruccionesBancoPagador: string;
  narrativaAdicional: string;
  detallesPagoDiferido: string;
  detallesPagoMixto: string;
}

// Valores iniciales del formulario
export const initialFormData: LCIssuanceFormData = {
  referenciaRemitente: '',
  ordenante: '',
  beneficiario: '',
  tipoLC: 'IRREVOCABLE',
  reglasAplicables: 'UCP LATEST VERSION',
  moneda: 'USD',
  monto: '',
  fechaEmision: '',
  fechaVencimiento: '',
  lugarVencimiento: '',
  referenciaPreAviso: '',
  numeroEnmienda: '',
  toleranciaPorcentaje: '',
  montoMaximo: '',
  montoAdicional: '',
  bancoEmisor: '',
  bancoNotificador: '',
  bancoConfirmador: '',
  bancoOrdenante: '',
  bancoEmisorAlternativo: '',
  bancoIntermediario: '',
  bancoBeneficiario: '',
  bancoPagador: '',
  bancoDisponible: '',
  instruccionesConfirmacion: '',
  paisOrigen: '',
  paisDestino: '',
  incoterm: 'FOB',
  puertoEmbarque: '',
  puertoDestino: '',
  periodoEmbarque: '',
  embarquesParciales: 'ALLOWED',
  transbordo: 'NOT_ALLOWED',
  rutaPuertoAPuerto: '',
  lugarEmbarqueDestino: '',
  destinoFinal: '',
  periodoPresentacion: '',
  mercancia: '',
  cantidadMercancia: '',
  documentosRequeridos: '',
  condicionesEspeciales: '',
  instruccionesAdicionales: '',
  observaciones: '',
  responsableComisiones: '',
  instruccionesBancoPagador: '',
  narrativaAdicional: '',
  detallesPagoDiferido: '',
  detallesPagoMixto: '',
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
  ordenante: Participante | null;
  beneficiario: Participante | null;
  moneda: Moneda | null;
  bancoEmisor: InstitucionFinanciera | null;
  bancoNotificador: InstitucionFinanciera | null;
  bancoConfirmador: InstitucionFinanciera | null;
  bancoOrdenante: InstitucionFinanciera | null;
  bancoIntermediario: InstitucionFinanciera | null;
  bancoBeneficiario: InstitucionFinanciera | null;
  bancoPagador: InstitucionFinanciera | null;
  bancoDisponible: InstitucionFinanciera | null;
  paisOrigen: CatalogoPersonalizado | null;
  paisDestino: CatalogoPersonalizado | null;
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
  formData: LCIssuanceFormData;
  selectedEntities: SelectedEntities;
  swiftFieldsData: Record<string, any>;
  swiftConfigs: SwiftFieldConfig[];
  fieldErrors: Record<string, ValidationError>;
  onFormDataChange: (field: keyof LCIssuanceFormData, value: string) => void;
  onSwiftFieldChange: (fieldCode: string, value: any) => void;
  onEntitySelect: <K extends keyof SelectedEntities>(entity: K, value: SelectedEntities[K]) => void;
  showHelp?: boolean;
  showOptionalFields?: boolean;
}

// Interface para props del componente principal
export interface LCImportIssuanceFormProps {
  mode?: IssuanceMode;
  draftId?: number;
  approvalMode?: boolean; // When true, form is read-only with approve/reject buttons
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
    titleKey: 'lcImportWizard.steps.basicInfo',
    description: 'Datos generales de la LC',
    sections: ['basicInfo'],
  },
  {
    number: 2,
    title: 'Montos y Fechas',
    titleKey: 'lcImportWizard.steps.amountsAndDates',
    description: 'Importes y vigencia',
    sections: ['amounts'],
  },
  {
    number: 3,
    title: 'Bancos',
    titleKey: 'lcImportWizard.steps.participatingBanks',
    description: 'Instituciones participantes',
    sections: ['banks'],
  },
  {
    number: 4,
    title: 'Embarque',
    titleKey: 'lcImportWizard.steps.shipmentDetails',
    description: 'Detalles de transporte',
    sections: ['shipping'],
  },
  {
    number: 5,
    title: 'Mercancía',
    titleKey: 'lcImportWizard.steps.goodsAndDocuments',
    description: 'Productos y documentos',
    sections: ['goodsDocs'],
  },
  {
    number: 6,
    title: 'Condiciones',
    titleKey: 'lcImportWizard.steps.specialConditions',
    description: 'Condiciones especiales',
    sections: ['conditions'],
  },
  {
    number: 7,
    title: 'Contabilidad',
    titleKey: 'lcImportWizard.steps.accounting',
    description: 'Asientos contables',
    sections: ['accounting'],
  },
  {
    number: 8,
    title: 'Alertas',
    titleKey: 'lcImportWizard.steps.alerts',
    description: 'Alertas de seguimiento',
    sections: ['alerts'],
  },
  {
    number: 9,
    title: 'SWIFT',
    titleKey: 'lcImportWizard.steps.swiftMessage',
    description: 'Mensaje MT700',
    sections: ['swiftPreview'],
  },
];

// Pasos para modo cliente (sin contabilidad ni SWIFT)
export const CLIENT_STEPS: StepDefinition[] = WIZARD_STEPS.filter(
  step => !step.sections.includes('accounting') && !step.sections.includes('alerts') && !step.sections.includes('swiftPreview')
).map((step, index) => ({ ...step, number: index + 1 }));

/**
 * Mapeo de códigos de sección SWIFT a números de paso del wizard
 * Este mapeo se carga dinámicamente desde SwiftSectionConfig.displayOrder
 * y se agrupa según los rangos de displayOrder
 */
export interface SectionStepMapping {
  sectionCode: string;
  wizardStep: number;
}

/**
 * Mapeo por defecto de secciones SWIFT a pasos del wizard
 * Basado en displayOrder de swift_section_config_readmodel:
 * - Step 1 (Basic Info): BASIC(1), PARTIES(2), TERMS(3)
 * - Step 2 (Amounts/Dates): AMOUNTS(4), DATES(5)
 * - Step 3 (Banks): BANKS(6)
 * - Step 4 (Transport): TRANSPORT(7)
 * - Step 5 (Goods/Docs): GOODS(8), DOCUMENTS(9)
 * - Step 6 (Conditions): CONDITIONS(10)
 * - Step 7 (Accounting): ACCOUNTING
 * - Step 8 (SWIFT Preview): SWIFT_PREVIEW
 *
 * NOTA: Este mapeo puede ser sobrescrito cargándolo desde la base de datos
 */
export const DEFAULT_SECTION_STEP_MAP: Record<string, number> = {
  'BASIC': 1,
  'PARTIES': 1,
  'TERMS': 1,
  'AMOUNTS': 2,
  'DATES': 2,
  'BANKS': 3,
  'TRANSPORT': 4,
  'GOODS': 5,
  'DOCUMENTS': 5,
  'CONDITIONS': 6,
  'ACCOUNTING': 7,
  'ALERTS': 8,
  'SWIFT_PREVIEW': 9,
};

/**
 * Obtiene el número de paso del wizard para un código de sección dado
 * @param sectionCode - Código de sección SWIFT (ej: 'GOODS', 'TERMS')
 * @param customMapping - Mapeo personalizado (opcional, para sobreescribir el default)
 */
export function getWizardStepForSection(
  sectionCode: string,
  customMapping?: Record<string, number>
): number | undefined {
  const mapping = customMapping || DEFAULT_SECTION_STEP_MAP;
  return mapping[sectionCode];
}

/**
 * Obtiene los códigos de sección para un paso del wizard dado
 * @param stepNumber - Número del paso del wizard
 * @param customMapping - Mapeo personalizado (opcional)
 */
export function getSectionsForWizardStep(
  stepNumber: number,
  customMapping?: Record<string, number>
): string[] {
  const mapping = customMapping || DEFAULT_SECTION_STEP_MAP;
  return Object.entries(mapping)
    .filter(([_, step]) => step === stepNumber)
    .map(([sectionCode]) => sectionCode);
}

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
