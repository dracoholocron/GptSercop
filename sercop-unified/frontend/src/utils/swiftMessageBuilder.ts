/**
 * SwiftMessageBuilder - Utility to serialize SWIFT fields to message format
 *
 * IMPORTANTE: Este builder genera mensajes SWIFT usando EXCLUSIVAMENTE la configuración
 * de la tabla swift_field_config_readmodel. No hay lógica hardcodeada.
 *
 * La configuración de cada campo determina:
 * - fieldType: Tipo de dato (DATE, DECIMAL, TEXT, SWIFT_PARTY, etc.)
 * - validationRules.dateFormat: Formato de fecha (YYMMDD, YYYYMMDD, etc.)
 * - validationRules.decimalSeparator: Separador decimal (, o .)
 * - validationRules.outputFormat: Template de salida ({currency}{amount})
 * - validationRules.outputFields: Campos a incluir para objetos
 * - validationRules.lineSeparator: Separador de líneas
 *
 * Example output:
 * :20:LC-IMP-2024-00001
 * :31C:251204
 * :32B:USD100000,00
 * :50:JUAN PEREZ
 * CALLE PRINCIPAL 123
 * QUITO
 * ECUADOR
 */

import type { SwiftFieldConfig, ValidationRules } from '../types/swiftField';

interface SwiftPartyValue {
  participantId?: number;
  text: string;
}

interface CurrencyAmountValue {
  currency?: string;
  amount?: number | string;
}

interface SwiftMultiOptionValue {
  detectedOption: string | null;
  inputMethod: 'bic' | 'manual' | 'location';
  bic?: string;
  bicInstitution?: any;
  manualText?: string[];
  commonFields?: Record<string, any>;
  additionalFields?: Record<string, string>;
}

/**
 * Build a SWIFT message from field data using configuration from swift_field_config_readmodel
 *
 * @param fields - The SWIFT fields data (key-value pairs with tags like ':20:', ':32B:', etc.)
 * @param fieldConfigs - Field configurations from swift_field_config_readmodel (REQUIRED for proper formatting)
 * @param applyDefaults - Whether to apply default values from config for missing required fields (default: true)
 * @returns The formatted SWIFT message as text
 */
export function buildSwiftMessage(
  fields: Record<string, any>,
  fieldConfigs: SwiftFieldConfig[],
  applyDefaults: boolean = true
): string {
  const lines: string[] = [];

  // Create config map for quick lookup
  const configByCode: Record<string, SwiftFieldConfig> = {};
  for (const config of fieldConfigs) {
    configByCode[config.fieldCode] = config;
  }

  // Apply default values for required fields that are missing
  const fieldsWithDefaults = { ...fields };
  if (applyDefaults) {
    for (const config of fieldConfigs) {
      const fieldCode = config.fieldCode;
      const hasValue = fieldsWithDefaults[fieldCode] !== null &&
                       fieldsWithDefaults[fieldCode] !== undefined &&
                       String(fieldsWithDefaults[fieldCode]).trim() !== '';

      // If field is required, has a default value, and no current value - apply default
      if (config.isRequired && config.defaultValue && !hasValue) {
        fieldsWithDefaults[fieldCode] = config.defaultValue;
      }
    }
  }

  // Sort fields by displayOrder from config, then by tag number as fallback
  const sortedEntries = Object.entries(fieldsWithDefaults)
    .filter(([key, value]) => {
      // Only include SWIFT tags (start with ':')
      if (!key.startsWith(':')) return false;
      // Filter empty values
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      if (typeof value === 'object') {
        if ('text' in value) {
          return value.text && value.text.trim() !== '';
        }
        if ('amount' in value) {
          return value.amount !== null && value.amount !== undefined;
        }
        const objValues = Object.values(value);
        return objValues.some(v => v !== null && v !== undefined && String(v).trim() !== '');
      }
      return true;
    })
    .sort(([keyA], [keyB]) => {
      const configA = configByCode[keyA];
      const configB = configByCode[keyB];

      // Use displayOrder from config; unconfigured fields go to the end (9999)
      const orderA = configA?.displayOrder ?? 9999;
      const orderB = configB?.displayOrder ?? 9999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Tie-breaker: sort by tag number
      const numA = parseInt(keyA.replace(/[:\D]/g, '')) || 0;
      const numB = parseInt(keyB.replace(/[:\D]/g, '')) || 0;
      return numA - numB;
    });

  // Helper: find config with fallback for multi-option tags (:41D: → :41a:)
  const findConfig = (tag: string): SwiftFieldConfig | undefined => {
    if (configByCode[tag]) return configByCode[tag];
    // Try lowercase
    const lower = tag.toLowerCase();
    for (const [code, cfg] of Object.entries(configByCode)) {
      if (code.toLowerCase() === lower) return cfg;
    }
    // Multi-option fallback: :41D: → :41a:, :57A: → :57a:
    const baseMatch = tag.match(/^:(\d+)[A-Za-z]:$/);
    if (baseMatch) {
      for (const suffix of ['a', 'A']) {
        const baseCode = `:${baseMatch[1]}${suffix}:`;
        if (configByCode[baseCode]) return configByCode[baseCode];
      }
    }
    return undefined;
  };

  // Format each field using its configuration
  for (const [tag, value] of sortedEntries) {
    const config = findConfig(tag);
    const formattedValue = formatFieldValue(value, config, tag);

    if (formattedValue) {
      // Handle multi-option fields - replace the option letter with the detected one
      // Detect by value structure (detectedOption) OR by componentType config
      let finalTag = tag;
      const isMultiOption = typeof value === 'object' && value !== null && value.detectedOption;
      if (isMultiOption) {
        const baseCodeMatch = tag.match(/:(\d+)[a-zA-Z]?:/);
        if (baseCodeMatch) {
          finalTag = `:${baseCodeMatch[1]}${value.detectedOption}:`;
        }
      }
      lines.push(`${finalTag}${formattedValue}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format a single field value according to its configuration in swift_field_config_readmodel
 */
function formatFieldValue(
  value: any,
  config?: SwiftFieldConfig,
  fieldCode?: string
): string {
  if (value === null || value === undefined) return '';

  const rules = config?.validationRules;
  const fieldType = config?.fieldType;
  const componentType = config?.componentType;

  // If no config, log warning with field code for debugging and return value as-is
  if (!config) {
    console.warn(`SwiftMessageBuilder: No configuration found for field ${fieldCode || 'unknown'}. Value returned as-is.`);
    return stringifyValue(value);
  }

  // IMPORTANT: Detect multi-option fields using swiftFormat from swift_field_config_readmodel
  // swiftFormat contains patterns like "A or D", "A, B or D" indicating multiple format options
  // This detection is DATA-DRIVEN from the database, not hardcoded field codes
  const swiftFormat = config.swiftFormat;
  // Check if swiftFormat contains multiple option letters (A, B, C, D, etc.) separated by "or" or ","
  const isMultiOptionByFormat = swiftFormat && (
    /\b[A-Z]\s+(or|,)\s+[A-Z]\b/i.test(swiftFormat) ||  // "A or D", "A, B or D"
    /Option\s+[A-Z]/i.test(swiftFormat)                   // "Option A", "Option D"
  );

  // Check if this is a multi-option field (by swiftFormat pattern OR by value structure)
  if (isMultiOptionByFormat ||
      (typeof value === 'object' && value !== null &&
       ('detectedOption' in value || 'inputMethod' in value || 'bic' in value || 'manualText' in value))) {
    return formatMultiOption(value, rules, fieldCode);
  }

  // DatePlace detection by structure OR componentType
  // Check componentType first (from swift_field_config_readmodel)
  const componentTypeUpper = componentType?.toUpperCase() || '';
  const isDatePlaceByComponentType = componentTypeUpper.includes('DATE_PLACE') ||
                                      componentTypeUpper.includes('DATEPLACE') ||
                                      componentTypeUpper === 'DATE_PLACE_INPUT';

  // Check structure: has date and/or place properties
  const isDatePlaceByStructure = typeof value === 'object' && value !== null &&
                                  ('date' in value || 'place' in value);

  if (isDatePlaceByComponentType || isDatePlaceByStructure) {
    return formatDatePlace(value, rules);
  }

  // Also check componentType for multi-option as backup
  if (componentTypeUpper === 'SWIFT_MULTI_OPTION') {
    return formatMultiOption(value, rules, fieldCode);
  }

  // Format based on fieldType from configuration
  switch (fieldType) {
    case 'DATE':
      return formatDate(value, rules);

    case 'DECIMAL':
    case 'NUMBER':
      return formatNumber(value, rules);

    case 'CURRENCY':
      // Currency code, return as-is or with outputFormat
      return applyOutputFormat(value, rules);

    case 'SWIFT_PARTY':
    case 'PARTICIPANT':
      return formatParty(value, rules);

    case 'INSTITUTION':
      return formatInstitution(value, rules);

    case 'TEXTAREA':
      return formatMultiline(value, rules);

    // NOTE: SWIFT_MULTI_OPTION is handled by componentType check above the switch

    case 'TEXT':
    case 'SELECT':
    case 'BOOLEAN':
    case 'COUNTRY':
    default:
      return applyOutputFormat(value, rules);
  }
}

/**
 * Format date according to dateFormat in validation_rules
 *
 * IMPORTANT: SWIFT dates must be in YYMMDD format (6 digits)
 * This function converts various date formats to YYMMDD
 */
function formatDate(value: any, rules?: ValidationRules): string {
  if (!value) return '';

  const format = rules?.dateFormat || 'YYMMDD'; // Default to SWIFT standard

  // Parse the date
  let date: Date | null = null;

  if (typeof value === 'string') {
    // Already in YYMMDD format (6 digits) - return as-is if format matches
    if (/^\d{6}$/.test(value)) {
      if (format === 'YYMMDD') {
        return value;
      }
      const yy = parseInt(value.slice(0, 2));
      const fullYear = yy > 50 ? 1900 + yy : 2000 + yy;
      date = new Date(fullYear, parseInt(value.slice(2, 4)) - 1, parseInt(value.slice(4, 6)));
    }
    // YYYYMMDD format (8 digits) - needs conversion to YYMMDD
    else if (/^\d{8}$/.test(value)) {
      date = new Date(
        parseInt(value.slice(0, 4)),
        parseInt(value.slice(4, 6)) - 1,
        parseInt(value.slice(6, 8))
      );
    }
    // ISO format YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
    // Parse manually to avoid UTC timezone shift (new Date("2026-02-28") creates UTC midnight,
    // which becomes previous day in negative-offset timezones like Ecuador UTC-5)
    else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const parts = value.split('T')[0].split('-');
      date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }

  if (!date) {
    date = new Date(value);
  }

  if (date && !isNaN(date.getTime())) {
    const year = date.getFullYear();
    const yy = String(year).slice(-2);
    const yyyy = String(year);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    // Apply format from configuration
    return format
      .replace(/YYYY/g, yyyy)
      .replace(/YY/g, yy)
      .replace(/MM/g, mm)
      .replace(/DD/g, dd);
  }

  return String(value);
}

/**
 * Format number/decimal according to validation_rules
 */
function formatNumber(value: any, rules?: ValidationRules): string {
  if (value === null || value === undefined) return '';

  const decimalSeparator = rules?.decimalSeparator || ',';
  const maxDecimals = rules?.maxDecimals;

  let numValue: number;
  if (typeof value === 'string') {
    numValue = parseFloat(value.replace(',', '.'));
  } else {
    numValue = Number(value);
  }

  if (isNaN(numValue)) {
    return String(value);
  }

  let formatted: string;
  if (maxDecimals !== undefined) {
    formatted = numValue.toFixed(maxDecimals);
  } else {
    formatted = String(numValue);
  }

  // Apply decimal separator from config
  if (decimalSeparator !== '.') {
    formatted = formatted.replace('.', decimalSeparator);
  }

  // Apply padding if configured
  formatted = applyPadding(formatted, rules);

  return formatted;
}

/**
 * Format party/participant field
 */
function formatParty(value: any, rules?: ValidationRules): string {
  if (!value) return '';

  // If it's a SwiftPartyValue with text
  if (typeof value === 'object' && 'text' in value) {
    return value.text || '';
  }

  // If outputFields configured, use those
  if (rules?.outputFields && typeof value === 'object') {
    return formatObjectWithFields(value, rules.outputFields, rules.lineSeparator || '\n');
  }

  // If outputFormat configured, use template
  if (rules?.outputFormat && typeof value === 'object') {
    return applyTemplate(rules.outputFormat, value);
  }

  // Default: stringify
  return stringifyValue(value);
}

/**
 * Format date+place field (e.g., :31D: Date and Place of Expiry)
 * Handles objects with date and/or place properties
 * Output format: YYMMDD + place (e.g., "260328QUITO")
 */
function formatDatePlace(value: any, rules?: ValidationRules): string {
  if (!value) return '';

  // If it's a string, return as-is
  if (typeof value === 'string') return value;

  // If it's not an object, stringify it
  if (typeof value !== 'object') return String(value);

  const outputFormat = rules?.outputFormat || '{date}{place}';
  const dateFormat = rules?.dateFormat || 'YYMMDD';

  // Extract date - check multiple possible property names
  let dateValue = value.date || value.fecha || value.expiryDate || value.fechaVencimiento || '';

  // Extract place - check multiple possible property names
  let placeValue = value.place || value.lugar || value.city || value.ciudad || '';

  // Format the date
  let formattedDate = '';
  if (dateValue) {
    const dateStr = String(dateValue);

    // Already in YYMMDD format (6 digits)
    if (/^\d{6}$/.test(dateStr)) {
      formattedDate = dateStr;
    }
    // YYYYMMDD format (8 digits)
    else if (/^\d{8}$/.test(dateStr)) {
      formattedDate = dateFormat === 'YYYYMMDD'
        ? dateStr
        : dateStr.slice(2); // Convert to YYMMDD
    }
    // ISO format YYYY-MM-DD
    else if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const parts = dateStr.split('-');
      if (parts.length >= 3) {
        const [year, month, day] = parts;
        if (dateFormat === 'YYYYMMDD') {
          formattedDate = `${year}${month}${day.slice(0, 2)}`;
        } else {
          // Default YYMMDD
          formattedDate = `${year.slice(-2)}${month}${day.slice(0, 2)}`;
        }
      }
    }
  }

  // Apply output format template
  return outputFormat
    .replace('{date}', formattedDate)
    .replace('{place}', placeValue);
}

/**
 * Format institution field
 */
function formatInstitution(value: any, rules?: ValidationRules): string {
  if (!value) return '';

  // If outputFields configured, use those
  if (rules?.outputFields && typeof value === 'object') {
    return formatObjectWithFields(value, rules.outputFields, rules.lineSeparator || '\n');
  }

  // If outputFormat configured, use template
  if (rules?.outputFormat && typeof value === 'object') {
    return applyTemplate(rules.outputFormat, value);
  }

  // Default: stringify
  return stringifyValue(value);
}

/**
 * Format multi-option SWIFT field (e.g., :41a:, :57a:, :58a:)
 *
 * These fields have multiple format options (A, B, D) and the correct option
 * is determined by the detectedOption in the SwiftMultiOptionValue.
 *
 * Format:
 * - Option A: BIC code only
 * - Option D: Name and address (4 lines max, 35 chars each)
 * - Some fields have Party Identifier prefix: [/1!a][/34x]
 */
function formatMultiOption(value: any, rules?: ValidationRules, fieldCode?: string): string {
  if (!value) return '';

  // Handle SwiftMultiOptionValue objects - check for ANY of the characteristic properties
  // to be more robust against partial or variant structures
  if (typeof value === 'object') {
    const hasMultiOptionStructure = 'detectedOption' in value ||
                                     'inputMethod' in value ||
                                     'bic' in value ||
                                     'manualText' in value;

    if (hasMultiOptionStructure) {
      const parts: string[] = [];

      // Add Party Identifier (common fields) if present
      if (value.commonFields && typeof value.commonFields === 'object') {
        for (const cfValue of Object.values(value.commonFields)) {
          if (cfValue && typeof cfValue === 'object') {
            const cf = cfValue as { code?: string; account?: string };
            if (cf.code || cf.account) {
              let partyId = '';
              if (cf.code) partyId += `/${cf.code}`;
              if (cf.account) partyId += `/${cf.account}`;
              if (partyId) parts.push(partyId);
            }
          }
        }
      }

      // Add main content - check bic first, then manualText
      if (value.bic && typeof value.bic === 'string' && value.bic.trim()) {
        parts.push(value.bic.trim());
      } else if (Array.isArray(value.manualText) && value.manualText.length > 0) {
        const filteredLines = value.manualText
          .filter((line: any) => line && typeof line === 'string' && line.trim())
          .map((line: string) => line.trim());
        if (filteredLines.length > 0) {
          parts.push(filteredLines.join('\n'));
        }
      }

      // Add additional fields (e.g., BY NEGOTIATION)
      if (value.additionalFields && typeof value.additionalFields === 'object') {
        for (const afValue of Object.values(value.additionalFields)) {
          if (afValue && typeof afValue === 'string' && afValue.trim()) {
            parts.push(afValue.trim());
          }
        }
      }

      // Only return if we have actual content
      if (parts.length > 0) {
        return parts.join('\n');
      }

      // If no content found but structure matches, return empty (field should be skipped)
      return '';
    }
  }

  // Fallback for string values
  return stringifyValue(value);
}

/**
 * Format multiline textarea field
 *
 * NOTA: Este método NO trunca los valores. La validación debe hacerse
 * antes de llegar aquí usando SwiftValidationService. Si el valor excede
 * los límites, el mensaje SWIFT se generará con el valor completo y la
 * validación fallará al momento de enviar.
 */
function formatMultiline(value: any, rules?: ValidationRules): string {
  if (!value) return '';

  const lineSeparator = rules?.lineSeparator || '\n';

  let text = String(value);

  // Split into lines and rejoin with configured separator
  const lines = text.split(/\r?\n/);

  return lines.join(lineSeparator);
}

/**
 * Apply outputFormat template or return value as-is
 */
function applyOutputFormat(value: any, rules?: ValidationRules): string {
  if (value === null || value === undefined) return '';

  // Handle date+place objects (e.g., :31D: Date and Place of Expiry)
  // Formato: YYMMDD + lugar (hasta 29 caracteres)
  if (typeof value === 'object' && 'date' in value && 'place' in value) {
    const outputFormat = rules?.outputFormat || '{date}{place}';
    const dateFormat = rules?.dateFormat || 'YYMMDD';

    // Convert ISO date (YYYY-MM-DD) to SWIFT format
    let formattedDate = '';
    if (value.date) {
      const dateParts = String(value.date).split('-');
      if (dateParts.length === 3) {
        const [year, month, day] = dateParts;
        if (dateFormat === 'YYYYMMDD') {
          formattedDate = `${year}${month}${day}`;
        } else {
          // Default YYMMDD
          formattedDate = `${year.slice(-2)}${month}${day}`;
        }
      }
    }

    return outputFormat
      .replace('{date}', formattedDate)
      .replace('{place}', value.place || '');
  }

  // Handle currency+amount objects (e.g., :32B:)
  // Formato determinado por configuración en swift_field_config_readmodel
  if (typeof value === 'object' && 'currency' in value && 'amount' in value) {
    const outputFormat = rules?.outputFormat || '{currency}{amount}';
    const decimalSeparator = rules?.decimalSeparator || ',';
    const maxDecimals = rules?.maxDecimals;
    const minDecimals = rules?.minDecimals;

    // Parsear el monto como número
    let numAmount = typeof value.amount === 'number'
      ? value.amount
      : parseFloat(String(value.amount || '0').replace(',', '.'));

    let amount: string;

    if (maxDecimals !== undefined) {
      // Si hay maxDecimals configurado, formatear con esa cantidad
      // minDecimals indica el mínimo de decimales a mostrar (default: mismos que maxDecimals)
      const decimalsToShow = minDecimals !== undefined ? minDecimals : maxDecimals;
      amount = numAmount.toFixed(decimalsToShow);
    } else {
      // Sin configuración de decimales, usar el valor tal cual
      amount = String(numAmount);
    }

    // Aplicar separador decimal configurado
    if (decimalSeparator && decimalSeparator !== '.') {
      amount = amount.replace('.', decimalSeparator);
    }

    return outputFormat
      .replace('{currency}', value.currency || '')
      .replace('{amount}', amount);
  }

  // If outputFormat configured, apply template
  if (rules?.outputFormat && typeof value === 'object') {
    return applyTemplate(rules.outputFormat, value);
  }

  // Apply padding if configured
  let result = stringifyValue(value);
  result = applyPadding(result, rules);

  return result;
}

/**
 * Apply template with placeholders
 */
function applyTemplate(template: string, obj: Record<string, any>): string {
  let result = template;

  for (const [key, val] of Object.entries(obj)) {
    const placeholder = `{${key}}`;
    if (result.includes(placeholder)) {
      result = result.replace(new RegExp(placeholder, 'g'), val != null ? String(val) : '');
    }
  }

  // Remove any unused placeholders
  result = result.replace(/\{[^}]+\}/g, '');

  return result;
}

/**
 * Format object using specific fields
 */
function formatObjectWithFields(
  obj: Record<string, any>,
  fields: string[],
  separator: string
): string {
  const values: string[] = [];

  for (const field of fields) {
    const val = obj[field];
    if (val != null && String(val).trim() !== '') {
      values.push(String(val));
    }
  }

  return values.join(separator);
}

/**
 * Apply padding according to configuration
 */
function applyPadding(value: string, rules?: ValidationRules): string {
  if (!rules?.padLength || !rules?.padChar) {
    return value;
  }

  const { padLength, padChar, padDirection } = rules;

  if (value.length >= padLength) {
    return value;
  }

  const padding = padChar.repeat(padLength - value.length);

  if (padDirection === 'left') {
    return padding + value;
  } else {
    return value + padding;
  }
}

/**
 * Convert any value to string
 * Handles nested objects recursively to avoid [object Object] in output
 */
function stringifyValue(value: any): string {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string') return value;

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    // For arrays (like manualText), filter empty values and join with newlines
    return value
      .filter(v => v != null && String(v).trim() !== '')
      .map(v => typeof v === 'object' ? stringifyValue(v) : String(v))
      .join('\n');
  }

  if (typeof value === 'object') {
    // SwiftPartyValue - prioritize text field
    if ('text' in value && value.text) {
      return String(value.text);
    }

    // SwiftMultiOptionValue - extract the meaningful content
    if ('inputMethod' in value && 'detectedOption' in value) {
      const parts: string[] = [];

      // BIC code
      if (value.bic && typeof value.bic === 'string' && value.bic.trim()) {
        parts.push(value.bic.trim());
      }

      // Manual text lines
      if (Array.isArray(value.manualText)) {
        const textLines = value.manualText.filter((t: any) => t && String(t).trim() !== '');
        if (textLines.length > 0) {
          parts.push(...textLines.map((t: any) => String(t).trim()));
        }
      }

      // Additional fields
      if (value.additionalFields && typeof value.additionalFields === 'object') {
        for (const afValue of Object.values(value.additionalFields)) {
          if (afValue && typeof afValue === 'string' && afValue.trim()) {
            parts.push(afValue.trim());
          }
        }
      }

      return parts.join('\n');
    }

    // CurrencyAmount - format as currency+amount
    if ('currency' in value && 'amount' in value) {
      const currency = value.currency || '';
      const amount = value.amount != null ? String(value.amount).replace('.', ',') : '';
      return `${currency}${amount}`;
    }

    // DatePlace - format as date+place
    if ('date' in value && 'place' in value) {
      const parts: string[] = [];
      if (value.date) parts.push(String(value.date));
      if (value.place) parts.push(String(value.place));
      return parts.join('');
    }

    // Try to get meaningful string representation from common keys
    const meaningfulKeys = ['nombre', 'name', 'codigo', 'code', 'value', 'text', 'razonSocial', 'bic'];
    for (const key of meaningfulKeys) {
      if (key in value && value[key] && typeof value[key] !== 'object') {
        return String(value[key]);
      }
    }

    // Last resort: join non-null primitive values only (skip nested objects)
    const primitiveValues = Object.values(value)
      .filter(v => v != null && typeof v !== 'object' && String(v).trim() !== '')
      .map(v => String(v));

    return primitiveValues.join(' ');
  }

  return String(value);
}

/**
 * Extract metadata from SWIFT fields for database storage
 * This function extracts common fields for quick access in the database
 * Uses fieldConfigs to determine field types dynamically - NO HARDCODED FIELD CODES
 */
export function extractMetadataFromFields(
  fields: Record<string, any>,
  fieldConfigs?: SwiftFieldConfig[]
): {
  reference?: string;
  currency?: string;
  amount?: number;
  issueDate?: string;
  expiryDate?: string;
  applicantId?: number;
  beneficiaryId?: number;
  issuingBankId?: number;
  issuingBankBic?: string;
  advisingBankId?: number;
  advisingBankBic?: string;
} {
  const metadata: Record<string, any> = {};

  if (!fieldConfigs || fieldConfigs.length === 0) {
    return metadata;
  }

  // Helper to check if fieldName matches keywords
  const fieldNameMatches = (config: SwiftFieldConfig, ...keywords: string[]): boolean => {
    const fieldNameLower = config.fieldName?.toLowerCase() || '';
    const descriptionLower = config.description?.toLowerCase() || '';
    return keywords.some(kw => fieldNameLower.includes(kw) || descriptionLower.includes(kw));
  };

  // Helper to parse date from field value
  const extractDate = (value: any): string | undefined => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      return parseDateForDatabase(value);
    } else if (typeof value === 'object' && 'date' in value) {
      return parseDateForDatabase(value.date);
    }
    return undefined;
  };

  // Helper to extract participant ID
  const extractParticipantId = (value: any): number | undefined => {
    if (value && typeof value === 'object') {
      if ('participantId' in value) return value.participantId;
      if ('id' in value) return value.id;
    }
    return undefined;
  };

  // Helper to extract currency/amount
  const extractCurrencyAmount = (value: any): { currency?: string; amount?: number } => {
    if (!value) return {};
    if (typeof value === 'object' && 'currency' in value && 'amount' in value) {
      return {
        currency: value.currency,
        amount: parseFloat(String(value.amount).replace(',', '.'))
      };
    } else if (typeof value === 'string') {
      const match = value.match(/^([A-Z]{3})(.+)$/);
      if (match) {
        return {
          currency: match[1],
          amount: parseFloat(match[2].replace(',', '.'))
        };
      }
    }
    return {};
  };

  // Iterate through all field configs to extract metadata
  for (const config of fieldConfigs) {
    const fieldValue = fields[config.fieldCode];
    if (!fieldValue) continue;

    const componentType = config.componentType?.toUpperCase() || '';
    const fieldType = config.fieldType?.toUpperCase() || '';

    // Reference field (SwiftReferenceField or TEXT with reference keywords)
    if (!metadata.reference) {
      if (componentType === 'SWIFTREFERENCEFIELD' ||
          fieldNameMatches(config, 'referencia', 'reference', 'sender\'s reference')) {
        metadata.reference = stringifyValue(fieldValue).trim();
      }
    }

    // Currency and Amount (CURRENCY_AMOUNT_INPUT or CURRENCY type)
    if (!metadata.currency || !metadata.amount) {
      if (componentType === 'CURRENCY_AMOUNT_INPUT' || fieldType === 'CURRENCY') {
        const { currency, amount } = extractCurrencyAmount(fieldValue);
        if (currency) metadata.currency = currency;
        if (amount) metadata.amount = amount;
      }
    }

    // Issue Date (DATE type with issue/emission keywords)
    if (!metadata.issueDate) {
      if ((componentType === 'DATE_PICKER' || fieldType === 'DATE') &&
          fieldNameMatches(config, 'emisión', 'emision', 'issue', 'fecha de emisión')) {
        metadata.issueDate = extractDate(fieldValue);
      }
    }

    // Expiry Date (DATE type with expiry/vencimiento keywords)
    if (!metadata.expiryDate) {
      if ((componentType === 'DATE_PICKER' || fieldType === 'DATE') &&
          fieldNameMatches(config, 'vencimiento', 'expiración', 'expiracion', 'expiry', 'validity')) {
        metadata.expiryDate = extractDate(fieldValue);
      }
    }

    // Applicant (PARTICIPANT_SELECTOR with applicant/solicitante keywords)
    if (!metadata.applicantId) {
      if (componentType === 'PARTICIPANT_SELECTOR' &&
          fieldNameMatches(config, 'solicitante', 'applicant', 'ordenante')) {
        metadata.applicantId = extractParticipantId(fieldValue);
      }
    }

    // Beneficiary (NON_CLIENT_SELECTOR with beneficiary keywords)
    if (!metadata.beneficiaryId) {
      if (componentType === 'NON_CLIENT_SELECTOR' &&
          fieldNameMatches(config, 'beneficiario', 'beneficiary')) {
        metadata.beneficiaryId = extractParticipantId(fieldValue);
      }
    }

    // Institution fields: use draftFieldMapping from config (generic, no keyword matching)
    if ((componentType === 'FINANCIAL_INSTITUTION_SELECTOR' ||
         componentType === 'INSTITUTION_SELECTOR' ||
         fieldType === 'INSTITUTION') &&
        config.draftFieldMapping &&
        fieldValue && typeof fieldValue === 'object') {
      // Extract ID using the configured mapping name
      if ('id' in fieldValue && fieldValue.id != null) {
        metadata[config.draftFieldMapping] = fieldValue.id;
      }
      // Also extract BIC by convention: if mapping ends in "Id", derive "Bic" field
      const bic = fieldValue.swiftCode || fieldValue.bic;
      if (bic && config.draftFieldMapping.endsWith('Id')) {
        metadata[config.draftFieldMapping.replace(/Id$/, 'Bic')] = bic;
      }
    }
  }

  return metadata;
}

/**
 * Parse date value to database format (YYYY-MM-DD)
 */
function parseDateForDatabase(dateValue: any): string | undefined {
  if (!dateValue) return undefined;

  if (typeof dateValue === 'string') {
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    // YYYYMMDD
    if (/^\d{8}$/.test(dateValue)) {
      return `${dateValue.slice(0, 4)}-${dateValue.slice(4, 6)}-${dateValue.slice(6, 8)}`;
    }
    // YYMMDD
    if (/^\d{6}$/.test(dateValue)) {
      const yy = parseInt(dateValue.slice(0, 2));
      const fullYear = yy > 50 ? 1900 + yy : 2000 + yy;
      return `${fullYear}-${dateValue.slice(2, 4)}-${dateValue.slice(4, 6)}`;
    }
  }

  const date = new Date(dateValue);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  return undefined;
}
