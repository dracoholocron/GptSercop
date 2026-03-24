/**
 * Tipos de campos SWIFT configurables
 */
export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DECIMAL = 'DECIMAL',
  DATE = 'DATE',
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
  TEXTAREA = 'TEXTAREA',
  BOOLEAN = 'BOOLEAN',
  INSTITUTION = 'INSTITUTION',
  COUNTRY = 'COUNTRY',
  CURRENCY = 'CURRENCY',
  PARTICIPANT = 'PARTICIPANT',
  SWIFT_PARTY = 'SWIFT_PARTY'
}

/**
 * Severidad de validación
 */
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Condiciones para alertas contextuales
 */
export enum AlertCondition {
  NOT_EMPTY = 'NOT_EMPTY',
  EMPTY = 'EMPTY',
  EQUALS = 'EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  CONTAINS = 'CONTAINS'
}

/**
 * Reglas de validación para un campo
 */
export interface ValidationRules {
  pattern?: string;
  patternMessage?: string;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  customValidator?: string;
  errorMessage?: string;
  warningMessage?: string;
  // Validaciones de fecha
  dateFormat?: string;
  minDate?: string;
  minDateField?: string;
  minDateMessage?: string;
  // Validaciones de monto
  decimalSeparator?: string;
  maxDecimals?: number;
  minDecimals?: number;
  currencyRequired?: boolean;
  // Validaciones para campos multilínea (SWIFT_PARTY, TEXTAREA)
  maxLines?: number;
  maxLineLength?: number;
  lineLabels?: string[];
  // Validaciones para códigos BIC
  bicPattern?: string;
  bicMessage?: string;
  bicRequired?: boolean;
  // Valores permitidos para SELECT
  allowedValues?: string[];
  // === Configuración de formato de salida SWIFT ===
  // Formato de salida para el mensaje SWIFT (template con placeholders)
  // Ejemplo para :32B: "{currency}{amount}" -> "USD100000,00"
  // Ejemplo para :31D: "{date}{place}" -> "251231QUITO"
  outputFormat?: string;
  // Separador de líneas para campos multilínea
  lineSeparator?: string;
  // Campos a incluir del objeto (para PARTICIPANT, INSTITUTION)
  outputFields?: string[];
  // Padding/alineación
  padChar?: string;
  padLength?: number;
  padDirection?: 'left' | 'right';
}

/**
 * Condición para hacer un campo obligatorio
 */
export interface RequiredIfCondition {
  field: string;
  value: any;
  requires: string;
}

/**
 * Condición para deshabilitar un campo
 */
export interface DisabledIfCondition {
  field: string;
  value: any;
}

/**
 * Condición para mostrar/ocultar un campo
 */
export interface VisibleIfCondition {
  field: string;
  value: any;
}

/**
 * Dependencias entre campos
 */
export interface FieldDependencies {
  triggers?: string[];           // Campos que al cambiar disparan re-validación
  revalidates?: string[];        // Campos que deben re-validarse
  requiredIf?: RequiredIfCondition;
  disabledIf?: DisabledIfCondition;
  visibleIf?: VisibleIfCondition;
}

/**
 * Condición para mostrar alerta
 */
export interface ShowWhenCondition {
  field: string;
  condition: AlertCondition;
  value?: any;
}

/**
 * Alerta contextual
 */
export interface ContextualAlert {
  showWhen: ShowWhenCondition;
  alertType: ValidationSeverity;
  title: string;
  message: string;
  suggestedFields?: string[];
}

/**
 * Opción para campos SELECT
 */
export interface FieldOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

/**
 * Configuración de un campo SWIFT
 * Text fields now use translation keys resolved by frontend i18n
 * Backward compatible with old property names (fieldName, description, etc.)
 */
export interface SwiftFieldConfig {
  id: string;
  fieldCode: string;
  fieldNameKey: string;         // Translation key (e.g., "swift.mt700.20.fieldName")
  descriptionKey?: string;      // Translation key
  messageType: string;
  section: string;
  displayOrder: number;
  isRequired: boolean;
  isActive: boolean;
  fieldType: FieldType;
  draftFieldMapping?: string;
  componentType: string;
  placeholderKey?: string;      // Translation key
  validationRules?: ValidationRules;
  dependencies?: FieldDependencies;
  contextualAlerts?: ContextualAlert[];
  fieldOptions?: FieldOption[];
  defaultValue?: string;
  helpTextKey?: string;         // Translation key
  documentationUrl?: string;
  // SWIFT specification columns
  swiftFormat?: string;         // Formato SWIFT del estándar (ej: "4*35z", "2!a")
  swiftStatus?: string;         // M=Mandatory, O=Optional según especificación
  swiftUsageNotes?: string;     // Notas de uso del estándar SWIFT
  specVersion?: string;         // Versión de especificación (2024, 2025, 2026)
  effectiveDate?: string;       // Fecha de vigencia
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  updatedBy?: string;
  // Backward compatibility aliases (for transition period)
  fieldName?: string;           // @deprecated - use fieldNameKey with i18n
  description?: string;         // @deprecated - use descriptionKey with i18n
  placeholder?: string;         // @deprecated - use placeholderKey with i18n
  helpText?: string;            // @deprecated - use helpTextKey with i18n
}

/**
 * DTO para crear configuración de campo
 */
export interface CreateSwiftFieldConfigCommand {
  fieldCode: string;
  fieldNameKey: string;      // Translation key
  descriptionKey?: string;   // Translation key
  messageType: string;
  section: string;
  displayOrder: number;
  isRequired: boolean;
  fieldType: FieldType;
  componentType: string;
  placeholderKey?: string;   // Translation key
  validationRules?: string;  // JSON string
  dependencies?: string;     // JSON string
  contextualAlerts?: string; // JSON string
  fieldOptions?: string;     // JSON string
  defaultValue?: string;
  helpTextKey?: string;      // Translation key
  draftFieldMapping?: string;
  documentationUrl?: string;
  createdBy: string;
}

/**
 * DTO para actualizar configuración de campo
 */
export interface UpdateSwiftFieldConfigCommand {
  id: string;
  fieldNameKey?: string;     // Translation key
  descriptionKey?: string;   // Translation key
  section?: string;
  displayOrder?: number;
  isRequired?: boolean;
  fieldType?: FieldType;
  componentType?: string;
  placeholderKey?: string;   // Translation key
  validationRules?: string;  // JSON string
  dependencies?: string;     // JSON string
  contextualAlerts?: string; // JSON string
  fieldOptions?: string;     // JSON string
  defaultValue?: string;
  helpTextKey?: string;      // Translation key
  draftFieldMapping?: string;
  documentationUrl?: string;
  updatedBy: string;
}

/**
 * Error de validación
 */
export interface ValidationError {
  field: string;
  fieldName?: string;
  section?: string;        // Código de sección (BASIC, AMOUNTS, etc.)
  sectionLabel?: string;   // Etiqueta traducida de la sección
  message: string;
  severity: ValidationSeverity;
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Diferencia entre campos de dos versiones de especificación SWIFT
 */
export interface FieldDifference {
  fieldCode: string;
  fieldNameKeyV1?: string;     // Translation key
  fieldNameKeyV2?: string;     // Translation key
  swiftFormatV1?: string;
  swiftFormatV2?: string;
  swiftStatusV1?: string;      // M or O
  swiftStatusV2?: string;
  isRequiredV1?: boolean;
  isRequiredV2?: boolean;
  descriptionKeyV1?: string;   // Translation key
  descriptionKeyV2?: string;   // Translation key
  sectionV1?: string;
  sectionV2?: string;
  successorFieldCode?: string;
  specNotes?: string;
  changedAttributes?: string[];
}

/**
 * Resumen de comparación de versiones
 */
export interface ComparisonSummary {
  totalFieldsV1: number;
  totalFieldsV2: number;
  newFieldsCount: number;
  removedFieldsCount: number;
  modifiedFieldsCount: number;
  unchangedFieldsCount: number;
  formatChangesCount: number;
  statusChangesCount: number;
}

/**
 * Resultado de comparación entre versiones de especificación SWIFT
 */
export interface SwiftVersionComparisonResult {
  messageType: string;
  version1: string;
  version2: string;
  removedFields: FieldDifference[];
  newFields: FieldDifference[];
  modifiedFields: FieldDifference[];
  unchangedFields: FieldDifference[];
  summary: ComparisonSummary;
}

/**
 * Detalle de una versión de especificación SWIFT
 */
export interface VersionDetail {
  version_code: string;
  version_name: string;
  effective_date: string;
  is_current: boolean;
  release_notes: string | null;
}

/**
 * Información de versiones de especificación disponibles
 */
export interface SpecVersionsInfo {
  messageType: string;
  currentActiveVersion: string;
  availableVersions: string[];
  versionDetails: VersionDetail[];
  overrideActive: boolean;
  overrideVersion: string;
  overrideCatalogCode: string;
  hint: string;
}

/**
 * Diferencia de campo entre dos tipos de mensaje SWIFT
 */
export interface MessageFieldDifference {
  fieldCode: string;
  fieldNameKey?: string;
  section?: string;
  swiftFormat?: string;
  swiftStatus?: string;
  isRequired?: boolean;
  fieldType?: string;
  componentType?: string;
  // Cuando hay diferencias en configuración
  configDifferences?: {
    attribute: string;
    valueMsg1?: string;
    valueMsg2?: string;
  }[];
}

/**
 * Resumen de comparación entre mensajes
 */
export interface MessageComparisonSummary {
  totalFieldsMsg1: number;
  totalFieldsMsg2: number;
  commonFieldsCount: number;
  uniqueToMsg1Count: number;
  uniqueToMsg2Count: number;
  configDifferencesCount: number;
}

/**
 * Resultado de comparación entre dos tipos de mensaje SWIFT
 */
export interface SwiftMessageComparisonResult {
  messageType1: string;
  messageType2: string;
  specVersion: string;
  commonFields: MessageFieldDifference[];
  uniqueToMessage1: MessageFieldDifference[];
  uniqueToMessage2: MessageFieldDifference[];
  fieldsWithDifferences: MessageFieldDifference[];
  summary: MessageComparisonSummary;
}
