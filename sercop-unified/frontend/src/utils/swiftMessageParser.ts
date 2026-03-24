/**
 * SwiftMessageParser - Utility to parse SWIFT message text into field data
 *
 * This utility converts a SWIFT message text back into the dynamic fields
 * data format (Record<string, any>) for editing in the UI.
 *
 * Example input:
 * :20:LC-IMP-2024-00001
 * :31C:20241204
 * :32B:USD100000,00
 * :50:JUAN PEREZ
 * CALLE PRINCIPAL 123
 * QUITO
 * ECUADOR
 * ...
 */

import type { SwiftFieldConfig } from '../types/swiftField';

interface CurrencyAmountValue {
  currency: string;
  amount: string;
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
 * Parse a SWIFT message into field data
 *
 * @param swiftMessage - The SWIFT message text
 * @param fieldConfigs - Optional field configurations for type inference
 * @returns The parsed fields as a Record<string, any>
 */
export function parseSwiftMessage(
  swiftMessage: string,
  fieldConfigs?: SwiftFieldConfig[]
): Record<string, any> {
  if (!swiftMessage || swiftMessage.trim() === '') {
    return {};
  }

  // Create config map for quick lookup (case-insensitive)
  const configByCode: Record<string, SwiftFieldConfig> = {};
  const configByCodeLower: Record<string, SwiftFieldConfig> = {};
  if (fieldConfigs) {
    for (const config of fieldConfigs) {
      configByCode[config.fieldCode] = config;
      configByCodeLower[config.fieldCode.toLowerCase()] = config;
    }
  }

  // Helper to find config case-insensitively and get the canonical fieldCode
  // Also handles multi-option fields where the incoming tag has a specific option (e.g., :41A:, :41D:)
  // but the config uses a base code (e.g., :41a:)
  const findConfig = (tag: string): { config?: SwiftFieldConfig; canonicalTag: string } => {
    // First try exact match
    if (configByCode[tag]) {
      return { config: configByCode[tag], canonicalTag: tag };
    }
    // Then try lowercase match
    const lowerTag = tag.toLowerCase();
    if (configByCodeLower[lowerTag]) {
      const config = configByCodeLower[lowerTag];
      return { config, canonicalTag: config.fieldCode }; // Use the canonical fieldCode from config
    }

    // For multi-option fields: try to find base config by number
    // e.g., :41A: -> :41a:, :57D: -> :57a:
    const multiOptionMatch = tag.match(/^:(\d+)[A-Za-z]:$/);
    if (multiOptionMatch) {
      const baseNumber = multiOptionMatch[1];
      // Try common option suffixes (a, A, lowercase preferred in config)
      for (const suffix of ['a', 'A', 'b', 'B', 'd', 'D']) {
        const potentialCode = `:${baseNumber}${suffix}:`;
        if (configByCode[potentialCode]) {
          return { config: configByCode[potentialCode], canonicalTag: configByCode[potentialCode].fieldCode };
        }
        const lowerPotential = potentialCode.toLowerCase();
        if (configByCodeLower[lowerPotential]) {
          const config = configByCodeLower[lowerPotential];
          return { config, canonicalTag: config.fieldCode };
        }
      }
    }

    return { canonicalTag: tag };
  };

  const fields: Record<string, any> = {};
  const lines = swiftMessage.split('\n');

  let currentTag = '';
  let currentCanonicalTag = '';
  let currentConfig: SwiftFieldConfig | undefined;
  let currentValue: string[] = [];

  for (const line of lines) {
    // Skip header/footer lines
    if (line.startsWith('{') || line === '-}') {
      continue;
    }

    // Check if line starts with a new tag (supports both uppercase and lowercase suffixes like :41a:)
    const tagMatch = line.match(/^(:[0-9A-Za-z]+:)/);

    if (tagMatch) {
      // Save previous field if exists
      if (currentTag) {
        fields[currentCanonicalTag] = parseFieldValue(
          currentCanonicalTag,
          currentValue.join('\n'),
          currentConfig,
          currentTag
        );
      }

      // Start new field - find config and canonical tag
      currentTag = tagMatch[1];
      const { config, canonicalTag } = findConfig(currentTag);
      currentConfig = config;
      currentCanonicalTag = canonicalTag;

      const valueAfterTag = line.substring(tagMatch[1].length);
      currentValue = valueAfterTag ? [valueAfterTag] : [];
    } else if (currentTag && line.trim()) {
      // Continuation of current field
      currentValue.push(line);
    }
  }

  // Save last field
  if (currentTag) {
    fields[currentCanonicalTag] = parseFieldValue(
      currentCanonicalTag,
      currentValue.join('\n'),
      currentConfig
    );
  }

  return fields;
}

/**
 * Clean a value from SF2/SWIFT files
 * Removes trailing backslashes, carriage returns, RTF codes, and other control characters
 */
function cleanSwiftValue(value: string): string {
  if (!value || typeof value !== 'string') return value;
  // Remove trailing backslashes, carriage returns, and trim whitespace
  // Also handle Windows line endings (\r\n) and standalone \r
  // Clean RTF escape codes like \uc0\u8288 or \u8288
  return value
    .replace(/\r\n/g, '\n')           // Normalize Windows line endings
    .replace(/\r/g, '')                // Remove standalone carriage returns
    .replace(/\\uc\d+/g, '')           // Remove RTF \ucN codes
    .replace(/\\u\d+\s?/g, '')         // Remove RTF \uNNNN codes (unicode escapes)
    .replace(/\\[a-z]+\d*\s?/gi, '')   // Remove other RTF control codes like \par, \tab, etc.
    .replace(/\\+$/gm, '')             // Remove trailing backslashes from each line
    .replace(/\u2060/g, '')            // Remove Word Joiner character (U+2060)
    .replace(/\u200B/g, '')            // Remove Zero Width Space (U+200B)
    .replace(/\u2028/g, '\n')          // Replace Line Separator with newline
    .replace(/\u2029/g, '\n')          // Replace Paragraph Separator with newline
    .replace(/[\u2000-\u200F]/g, '')   // Remove various Unicode spaces and control chars
    .trim();
}

/**
 * Parse a single field value based on its type
 */
function parseFieldValue(
  tag: string,
  value: string,
  config?: SwiftFieldConfig,
  originalTag?: string
): any {
  if (!value) return '';

  // Clean the value first - remove trailing backslashes and control characters
  const cleanedValue = cleanSwiftValue(value);
  if (!cleanedValue) return '';

  // Handle SWIFT_PARTY fields - uses database config to determine type
  if (isPartyTag(tag, config)) {
    return parseSwiftPartyValue(cleanedValue);
  }

  // Handle currency amount fields - uses database config to determine type
  if (isCurrencyAmountTag(tag, config)) {
    return parseCurrencyAmount(cleanedValue);
  }

  // Handle SWIFT_MULTI_OPTION fields (e.g., :41a:, :57a:)
  // Use originalTag to preserve the actual option letter (e.g., :41D: not :41a:)
  const multiOptionDetected = isMultiOptionTag(tag, config, originalTag);
  if (multiOptionDetected) {
    return parseMultiOptionValue(originalTag || tag, cleanedValue);
  }

  // Handle DATE_PLACE fields (e.g., :31D: Date and Place of Expiry)
  // Returns object { date: string, place: string }
  if (isDatePlaceTag(tag, config)) {
    return parseDatePlaceValue(cleanedValue);
  }

  // Handle date fields - uses database config OR auto-detection
  // Priority: 1) Database config says it's a date, 2) Value looks like a SWIFT date
  if (isDateTag(tag, config) || looksLikeSwiftDate(cleanedValue)) {
    return formatDateForUI(cleanedValue);
  }

  // Return cleaned string for other fields
  return cleanedValue;
}

/**
 * Check if a tag is a party field based on field configuration
 * The field type is determined by the component_type in swift_field_config_readmodel:
 * - SWIFT_PARTY: For participant fields
 * - FINANCIAL_INSTITUTION_SELECTOR: For bank fields
 *
 * @param tag - The SWIFT tag (e.g., ':50:', ':41a:')
 * @param config - Optional field configuration from the database
 * @returns true if the field should be treated as a party/institution field
 */
function isPartyTag(tag: string, config?: SwiftFieldConfig): boolean {
  // If we have config, use the field type from the database
  if (config) {
    return config.fieldType === 'SWIFT_PARTY' ||
           config.componentType === 'SWIFT_PARTY' ||
           config.componentType === 'FINANCIAL_INSTITUTION_SELECTOR';
  }
  // Without config, return false - the type cannot be determined
  // The field will be treated as a regular string field
  return false;
}

/**
 * Check if a tag is a date field based on field configuration
 *
 * @param tag - The SWIFT tag
 * @param config - Optional field configuration from the database
 * @returns true if the field is a date type
 */
function isDateTag(tag: string, config?: SwiftFieldConfig): boolean {
  // Use field type from database config
  if (config) {
    return config.fieldType === 'DATE' ||
           config.componentType === 'DATE_PICKER';
  }
  return false;
}

/**
 * Check if a tag is a DATE_PLACE field (date + location)
 * Used for :31D: (Date and Place of Expiry) and similar fields
 *
 * @param tag - The SWIFT tag
 * @param config - Optional field configuration from the database
 * @returns true if the field is a date+place composite type
 */
function isDatePlaceTag(tag: string, config?: SwiftFieldConfig): boolean {
  // Only return true if database config explicitly specifies DATE_PLACE component
  // This prevents automatic detection that could break existing drafts
  if (config) {
    return config.componentType === 'DATE_PLACE_INPUT' ||
           config.componentType === 'DATE_PLACE';
  }
  // Without explicit config, don't assume it's a date+place field
  // The field will be parsed as a regular date (extracting only the date part)
  return false;
}

/**
 * Parse a SWIFT date+place value into an object
 * Format: YYMMDD or YYYYMMDD followed by place text
 * Example: "251231QUITO" -> { date: "2025-12-31", place: "QUITO" }
 *
 * @param value - The raw SWIFT value
 * @returns Object with date (ISO format) and place
 */
function parseDatePlaceValue(value: string): { date: string; place: string } {
  if (!value || typeof value !== 'string') {
    return { date: '', place: '' };
  }

  const trimmedValue = value.trim().replace(/[\r\n\\]+$/g, '').trim();

  // Try YYYYMMDD format first (8 digits + text)
  const match8 = trimmedValue.match(/^(\d{8})(.*)$/);
  if (match8) {
    const datePart = match8[1];
    const placePart = match8[2].trim();
    const isoDate = `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`;
    return { date: isoDate, place: placePart };
  }

  // Try YYMMDD format (6 digits + text)
  const match6 = trimmedValue.match(/^(\d{6})(.*)$/);
  if (match6) {
    const datePart = match6[1];
    const placePart = match6[2].trim();
    const year = parseInt(datePart.slice(0, 2));
    const fullYear = year > 50 ? 1900 + year : 2000 + year;
    const isoDate = `${fullYear}-${datePart.slice(2, 4)}-${datePart.slice(4, 6)}`;
    return { date: isoDate, place: placePart };
  }

  // If no date pattern found, try to detect if it starts with a date-like string
  // or just return empty date with full value as place
  return { date: '', place: trimmedValue };
}

/**
 * Check if a value looks like a SWIFT date format
 * SWIFT dates are typically YYYYMMDD (8 digits) or YYMMDD (6 digits)
 *
 * @param value - The value to check
 * @returns true if the value appears to be a SWIFT date
 */
function looksLikeSwiftDate(value: string): boolean {
  if (!value || typeof value !== 'string') return false;

  // Clean the value: trim whitespace and remove control characters
  const trimmed = value.trim().replace(/[\r\n\\]+$/g, '').trim();

  // Check for YYYYMMDD format (8 digits that form a valid date)
  if (/^\d{8}$/.test(trimmed)) {
    const year = parseInt(trimmed.slice(0, 4));
    const month = parseInt(trimmed.slice(4, 6));
    const day = parseInt(trimmed.slice(6, 8));
    // Basic validation: year 1900-2100, month 1-12, day 1-31
    return year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31;
  }

  // Check for YYMMDD format (6 digits that form a valid date)
  if (/^\d{6}$/.test(trimmed)) {
    const month = parseInt(trimmed.slice(2, 4));
    const day = parseInt(trimmed.slice(4, 6));
    return month >= 1 && month <= 12 && day >= 1 && day <= 31;
  }

  return false;
}

/**
 * Check if a tag is a currency/amount field based on field configuration
 *
 * @param tag - The SWIFT tag
 * @param config - Optional field configuration from the database
 * @returns true if the field is a currency/amount type
 */
function isCurrencyAmountTag(tag: string, config?: SwiftFieldConfig): boolean {
  // Use component type from database config
  // Note: CURRENCY_AMOUNT and CURRENCY_AMOUNT_INPUT are both currency/amount components
  if (config) {
    return config.componentType === 'CURRENCY_AMOUNT' ||
           config.componentType === 'CURRENCY_AMOUNT_INPUT';
  }
  return false;
}

/**
 * Check if a tag is a SWIFT_MULTI_OPTION field based on field configuration
 *
 * @param tag - The SWIFT tag
 * @param config - Optional field configuration from the database
 * @returns true if the field is a multi-option type
 */
function isMultiOptionTag(tag: string, config?: SwiftFieldConfig, originalTag?: string): boolean {
  if (config) {
    // 1. Check componentType (DB config)
    if (config.componentType === 'SWIFT_MULTI_OPTION') return true;
    // 2. Check swiftFormat for multi-option patterns (e.g., "A or D", "A, B or D")
    const fmt = config.swiftFormat;
    if (fmt && (
      /\b[A-Z]\s+(or|,)\s+[A-Z]\b/i.test(fmt) ||
      /Option\s+[A-Z]/i.test(fmt)
    )) return true;
    // 3. Check swiftUsageNotes for option patterns
    const notes = config.swiftUsageNotes;
    if (notes && /Option\s+[A-Z]\s*:/i.test(notes)) return true;
  }
  // 4. Fallback: if original tag was a specific option (uppercase letter like :41D:, :57A:)
  //    and canonical tag is the base form (:41a:, :57a:), it's multi-option
  const effectiveOriginal = originalTag || tag;
  if (/^:\d+[A-Z]:$/.test(effectiveOriginal) && /^:\d+[a-z]:$/.test(tag)) {
    return true;
  }
  return false;
}

/**
 * Parse a SWIFT multi-option field value (e.g., :41a:, :57a:)
 * Detects the option from the tag suffix and parses the content accordingly
 *
 * @param tag - The SWIFT tag (e.g., ':41A:', ':57D:')
 * @param value - The field value (potentially multi-line)
 * @returns SwiftMultiOptionValue object
 */
function parseMultiOptionValue(tag: string, value: string): SwiftMultiOptionValue {
  if (!value) {
    return {
      detectedOption: null,
      inputMethod: 'manual',
      manualText: [],
      commonFields: {},
      additionalFields: {},
    };
  }

  // Extract the option letter from the tag (A, B, D, etc.)
  const optionMatch = tag.match(/:(\d+)([A-Za-z]):/);
  const detectedOption = optionMatch ? optionMatch[2].toUpperCase() : null;

  const lines = value.split('\n').map(l => l.trim());

  // Parse Party Identifier from the first line if present
  // Format: /X/ACCOUNT or /ACCOUNT
  const commonFields: Record<string, any> = {};
  let contentStartIndex = 0;

  if (lines[0] && lines[0].startsWith('/')) {
    const partyIdMatch = lines[0].match(/^\/([A-Z])?\/(.*)$/);
    if (partyIdMatch) {
      commonFields.partyIdentifier = {
        code: partyIdMatch[1] || '',
        account: partyIdMatch[2] || '',
      };
      contentStartIndex = 1;
    } else {
      // Just account without code: /ACCOUNT
      const accountMatch = lines[0].match(/^\/(.+)$/);
      if (accountMatch) {
        commonFields.partyIdentifier = {
          code: '',
          account: accountMatch[1],
        };
        contentStartIndex = 1;
      }
    }
  }

  const contentLines = lines.slice(contentStartIndex);

  // Determine input method based on detected option and content
  let inputMethod: 'bic' | 'manual' | 'location' = 'manual';
  let bic: string | undefined;
  let manualText: string[] = [];
  const additionalFields: Record<string, string> = {};

  // Trailing code pattern (e.g., "BY ACCEPTANCE", "BY DEF PAYMENT", "BY NEGOTIATION")
  const trailingCodePattern = /^BY\s+[A-Z]{2,}(?:\s+[A-Z]{2,})*$/;

  // Option A typically means BIC code (8 or 11 characters)
  if (detectedOption === 'A' && contentLines[0] && /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(contentLines[0])) {
    inputMethod = 'bic';
    bic = contentLines[0];
    // Capture remaining lines as additionalFields (e.g., "BY ACCEPTANCE")
    const remaining = contentLines.slice(1).filter(l => l.trim());
    if (remaining.length > 0) {
      additionalFields.code = remaining[0];
    }
  }
  // Option D typically means name and address (manual text)
  else if (detectedOption === 'D' || (contentLines.length > 1)) {
    inputMethod = 'manual';
    // Check if last line is a trailing code (e.g., "BY ACCEPTANCE")
    const lastLine = contentLines[contentLines.length - 1];
    if (contentLines.length > 1 && lastLine && trailingCodePattern.test(lastLine)) {
      manualText = contentLines.slice(0, -1);
      additionalFields.code = lastLine;
    } else {
      manualText = contentLines;
    }
  }
  // Single line content that's not a BIC
  else if (contentLines.length === 1 && contentLines[0]) {
    // Could be location or just text
    inputMethod = 'manual';
    manualText = contentLines;
  }
  else {
    manualText = contentLines;
  }

  return {
    detectedOption,
    inputMethod,
    bic,
    manualText,
    commonFields: Object.keys(commonFields).length > 0 ? commonFields : undefined,
    additionalFields,
  };
}

/**
 * Parse a SWIFT party value (4-line format)
 * Returns the cleaned text value directly - the UI component should handle
 * displaying the text or looking up the institution/participant
 */
function parseSwiftPartyValue(value: string): string {
  // Return the cleaned text value directly
  // The UI component (FinancialInstitutionsSelector, ParticipantSelector, etc.)
  // should handle the display and optional lookup of the entity
  return value;
}

/**
 * Parse a currency/amount field (e.g., "USD100000,00")
 */
function parseCurrencyAmount(value: string): CurrencyAmountValue | string {
  // Match currency code (3 letters) followed by amount
  const match = value.match(/^([A-Z]{3})(.+)$/);

  if (match) {
    return {
      currency: match[1],
      amount: match[2].replace(',', '.') // Convert SWIFT decimal separator to standard
    };
  }

  // Return as string if format doesn't match
  return value;
}

/**
 * Format a SWIFT date for UI display
 * Supports formats:
 * - YYYYMMDD (8 digits) -> YYYY-MM-DD
 * - YYMMDD (6 digits) -> YYYY-MM-DD (with century detection)
 * - YYYYMMDDPLACE (8 digits + text) -> YYYY-MM-DD (for :31D: with place)
 * - YYMMDDPLACE (6 digits + text) -> YYYY-MM-DD (for :31D: with place)
 */
function formatDateForUI(value: string): string {
  if (!value || typeof value !== 'string') {
    return value;
  }

  // Clean the value: trim whitespace and remove control characters like \r, \n, \
  const trimmedValue = value.trim().replace(/[\r\n\\]+$/g, '').trim();

  // Handle exact YYYYMMDD format (8 digits only)
  if (/^\d{8}$/.test(trimmedValue)) {
    return `${trimmedValue.slice(0, 4)}-${trimmedValue.slice(4, 6)}-${trimmedValue.slice(6, 8)}`;
  }

  // Handle exact YYMMDD format (6 digits only)
  if (/^\d{6}$/.test(trimmedValue)) {
    const year = parseInt(trimmedValue.slice(0, 2));
    const fullYear = year > 50 ? 1900 + year : 2000 + year;
    return `${fullYear}-${trimmedValue.slice(2, 4)}-${trimmedValue.slice(4, 6)}`;
  }

  // Handle :31D: format with place: YYYYMMDD followed by text (e.g., "20251208QUITO")
  const dateWithPlaceMatch8 = trimmedValue.match(/^(\d{8})([A-Z].*)$/);
  if (dateWithPlaceMatch8) {
    const datePart = dateWithPlaceMatch8[1];
    return `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`;
  }

  // Handle :31D: format with place: YYMMDD followed by text (e.g., "241208QUITO")
  const dateWithPlaceMatch6 = trimmedValue.match(/^(\d{6})([A-Z].*)$/);
  if (dateWithPlaceMatch6) {
    const datePart = dateWithPlaceMatch6[1];
    const year = parseInt(datePart.slice(0, 2));
    const fullYear = year > 50 ? 1900 + year : 2000 + year;
    return `${fullYear}-${datePart.slice(2, 4)}-${datePart.slice(4, 6)}`;
  }

  // Return as-is if already in correct format or unknown
  return value;
}

/**
 * Extract all tags from a SWIFT message
 *
 * @param swiftMessage - The SWIFT message text
 * @returns Array of tag strings found in the message
 */
export function extractTagsFromMessage(swiftMessage: string): string[] {
  if (!swiftMessage) return [];

  const tags: string[] = [];
  const tagRegex = /^(:[0-9A-Za-z]+:)/gm;
  let match;

  while ((match = tagRegex.exec(swiftMessage)) !== null) {
    if (!tags.includes(match[1])) {
      tags.push(match[1]);
    }
  }

  return tags;
}

/**
 * Validate that a SWIFT message has the required fields for a message type
 *
 * @param swiftMessage - The SWIFT message text
 * @param requiredTags - Array of required tag strings
 * @returns Object with validation result and missing tags
 */
export function validateRequiredFields(
  swiftMessage: string,
  requiredTags: string[]
): { isValid: boolean; missingTags: string[] } {
  const presentTags = extractTagsFromMessage(swiftMessage);
  const missingTags = requiredTags.filter(tag => !presentTags.includes(tag));

  return {
    isValid: missingTags.length === 0,
    missingTags
  };
}

/**
 * Get a specific field value from a SWIFT message
 *
 * @param swiftMessage - The SWIFT message text
 * @param tag - The tag to extract (e.g., ':20:')
 * @returns The field value or undefined if not found
 */
export function getFieldValue(swiftMessage: string, tag: string): string | undefined {
  if (!swiftMessage || !tag) return undefined;

  const lines = swiftMessage.split('\n');
  let inField = false;
  const valueLines: string[] = [];

  for (const line of lines) {
    // Check if line starts with the requested tag
    if (line.startsWith(tag)) {
      inField = true;
      const valueAfterTag = line.substring(tag.length);
      if (valueAfterTag) {
        valueLines.push(valueAfterTag);
      }
      continue;
    }

    // Check if we hit another tag (supports both uppercase and lowercase)
    if (line.match(/^:[0-9A-Za-z]+:/)) {
      if (inField) {
        break; // End of our field
      }
      continue;
    }

    // Collect continuation lines
    if (inField && line.trim()) {
      valueLines.push(line);
    }
  }

  return valueLines.length > 0 ? valueLines.join('\n') : undefined;
}

import type { SwiftFieldConfig } from '../types/swiftField';

/**
 * Find a field code from configurations by purpose/characteristic
 * Uses field config properties to identify fields dynamically
 *
 * @param fieldConfigs - Array of field configurations from database
 * @param criteria - Criteria to find the field
 * @returns The field code or undefined if not found
 */
export function findFieldCodeByPurpose(
  fieldConfigs: SwiftFieldConfig[],
  criteria: {
    sectionCode?: string;
    componentType?: string | string[];
    fieldNameContains?: string;
    fieldCodeStartsWith?: string;
  }
): string | undefined {
  const found = fieldConfigs.find(config => {
    if (criteria.sectionCode && config.sectionCode !== criteria.sectionCode) {
      return false;
    }
    if (criteria.componentType) {
      const types = Array.isArray(criteria.componentType) ? criteria.componentType : [criteria.componentType];
      if (!types.includes(config.componentType)) {
        return false;
      }
    }
    if (criteria.fieldNameContains) {
      const nameKey = (config.fieldNameKey || '').toLowerCase();
      if (!nameKey.includes(criteria.fieldNameContains.toLowerCase())) {
        return false;
      }
    }
    if (criteria.fieldCodeStartsWith) {
      if (!config.fieldCode.startsWith(criteria.fieldCodeStartsWith)) {
        return false;
      }
    }
    return true;
  });
  return found?.fieldCode;
}

/**
 * Get standard field values from swiftFieldsData using fieldConfigs
 * Returns commonly needed values (reference, amount, currency, dates) by finding them dynamically
 *
 * @param swiftFieldsData - The field values
 * @param fieldConfigs - Field configurations from database
 * @returns Object with extracted values
 */
export function getStandardFieldValues(
  swiftFieldsData: Record<string, any>,
  fieldConfigs: SwiftFieldConfig[]
): {
  reference: string;
  amount: number;
  currency: string;
  issueDate: string;
  expiryDate: string;
} {
  // Find reference field (usually in section REFERENCIA or starts with :20)
  const referenceCode = findFieldCodeByPurpose(fieldConfigs, { sectionCode: 'REFERENCIA' })
    || findFieldCodeByPurpose(fieldConfigs, { fieldCodeStartsWith: ':20' });

  // Find amount/currency field (componentType CURRENCY_AMOUNT or similar)
  const amountCode = findFieldCodeByPurpose(fieldConfigs, {
    componentType: ['CURRENCY_AMOUNT', 'CURRENCY_AMOUNT_INPUT']
  }) || findFieldCodeByPurpose(fieldConfigs, { fieldCodeStartsWith: ':32B' });

  // Find issue date field (:31C:)
  const issueDateCode = findFieldCodeByPurpose(fieldConfigs, { fieldCodeStartsWith: ':31C' });

  // Find expiry date field (:31D:)
  const expiryDateCode = findFieldCodeByPurpose(fieldConfigs, { fieldCodeStartsWith: ':31D' });

  return {
    reference: referenceCode ? formatFieldValueForDisplay(swiftFieldsData[referenceCode]) : '',
    amount: amountCode ? extractAmountFromFieldValue(swiftFieldsData[amountCode]) : 0,
    currency: amountCode ? extractCurrencyFromFieldValue(swiftFieldsData[amountCode]) : '',
    issueDate: issueDateCode ? extractDateFromFieldValue(swiftFieldsData[issueDateCode]) : '',
    expiryDate: expiryDateCode ? extractDateFromFieldValue(swiftFieldsData[expiryDateCode]) : '',
  };
}

/**
 * Extract date from a field value
 * Handles both string dates and composite objects like {date, place}
 *
 * @param value - The field value (string or object with date property)
 * @returns The date string (ISO format YYYY-MM-DD) or empty string
 */
export function extractDateFromFieldValue(value: any): string {
  if (!value) return '';

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && 'date' in value) {
    return value.date || '';
  }

  return '';
}

/**
 * Extract amount from a field value
 * Handles both numeric values and composite objects like {currency, amount}
 *
 * @param value - The field value
 * @returns The amount as number or 0
 */
export function extractAmountFromFieldValue(value: any): number {
  if (!value) return 0;

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }

  if (typeof value === 'object' && 'amount' in value) {
    const amount = value.amount;
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount.replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    }
  }

  return 0;
}

/**
 * Extract currency from a field value
 * Handles composite objects like {currency, amount}
 *
 * @param value - The field value
 * @returns The currency code or empty string
 */
export function extractCurrencyFromFieldValue(value: any): string {
  if (!value) return '';

  if (typeof value === 'object' && 'currency' in value) {
    return value.currency || '';
  }

  return '';
}

/**
 * Parse SWIFT usage notes to extract available options for multi-option fields
 * Usage notes format: "Option A: 4!a2!a2!c[3!c]14x | Option D: 4*35x14x"
 *
 * @param usageNotes - The swiftUsageNotes field from configuration
 * @param swiftFormat - The swiftFormat field (e.g., "A or D")
 * @returns Object with parsed options and their configurations
 */
export function parseSwiftUsageNotes(
  usageNotes?: string,
  swiftFormat?: string
): {
  options: Record<string, {
    labelKey: string;
    format: string;
    inputMethod: 'bic' | 'manual' | 'location';
    maxLines?: number;
    maxLineLength?: number;
  }>;
  availableOptions: string[];
  trailingCode?: { maxLength: number };
} {
  const result: ReturnType<typeof parseSwiftUsageNotes> = {
    options: {},
    availableOptions: [],
  };

  // Parse available options from swiftFormat (e.g., "A or D", "A, B or D")
  if (swiftFormat) {
    const formatParts = swiftFormat.split(/\s*(?:or|,)\s*/i);
    result.availableOptions = formatParts.map(p => p.trim().toUpperCase()).filter(Boolean);
  }

  // Parse option details from usageNotes
  if (usageNotes) {
    // Pattern: "Option A: format | Option D: format"
    const optionPattern = /Option\s+([A-Za-z]):\s*([^|]+)/gi;
    let match;

    while ((match = optionPattern.exec(usageNotes)) !== null) {
      const optionLetter = match[1].toUpperCase();
      const format = match[2].trim();

      // Determine input method from format
      // BIC format: 4!a2!a2!c[3!c] = 8 or 11 alphanumeric
      // Manual format: n*35x = n lines of 35 chars
      let inputMethod: 'bic' | 'manual' | 'location' = 'manual';
      let maxLines: number | undefined;
      let maxLineLength: number | undefined;

      // Check for BIC pattern (4!a2!a2!c or 4!a2!a2!c[3!c])
      if (/4!a2!a2!c/.test(format)) {
        inputMethod = 'bic';
      }
      // Check for multi-line pattern (n*35x)
      else {
        const linesMatch = format.match(/(\d+)\*(\d+)[xz]/);
        if (linesMatch) {
          maxLines = parseInt(linesMatch[1]);
          maxLineLength = parseInt(linesMatch[2]);
          inputMethod = 'manual';
        }
      }

      // Detect trailing code field (e.g., "14x" after BIC or multi-line)
      // Pattern: after the main format, a standalone \d+x at the end
      const trailingMatch = format.match(/(?:\]|[xz])(\d+)x\s*$/);
      if (trailingMatch && !result.trailingCode) {
        result.trailingCode = { maxLength: parseInt(trailingMatch[1]) };
      }

      // Store labelKey for i18n translation in the component
      // The component will translate using these keys
      let labelKey = '';
      if (inputMethod === 'bic') {
        labelKey = 'bic'; // Will use common:swiftMultiOption.bic
      } else if (maxLines && maxLineLength) {
        labelKey = 'manualWithLimits'; // Will use common:swiftMultiOption.manualWithLimits
      } else {
        labelKey = 'manual'; // Will use common:swiftMultiOption.manual
      }

      result.options[optionLetter] = {
        labelKey,
        format,
        inputMethod,
        maxLines,
        maxLineLength,
      };

      // Add to available options if not already there
      if (!result.availableOptions.includes(optionLetter)) {
        result.availableOptions.push(optionLetter);
      }
    }
  }

  // If no options parsed but we have availableOptions from format, create defaults
  if (result.availableOptions.length > 0 && Object.keys(result.options).length === 0) {
    for (const opt of result.availableOptions) {
      if (opt === 'A') {
        result.options[opt] = {
          labelKey: 'bic',
          format: '',
          inputMethod: 'bic',
        };
      } else if (opt === 'D') {
        result.options[opt] = {
          labelKey: 'manualWithLimits',
          format: '',
          inputMethod: 'manual',
          maxLines: 4,
          maxLineLength: 35,
        };
      } else {
        result.options[opt] = {
          labelKey: 'manual',
          format: '',
          inputMethod: 'manual',
        };
      }
    }
  }

  return result;
}

/**
 * Parse CODES from SWIFT field description/helpText
 * Looks for pattern: "Code must contain one of the following codes...BY ACCEPTANCE BY DEF PAYMENT..."
 */
export function parseSwiftCodes(description?: string): string[] {
  if (!description) return [];
  // Find section mentioning "following codes" up to next "|" or "."
  const section = description.match(/following codes[^|]*?\|/is);
  if (!section) return [];
  // Extract all "BY WORD( WORD)*" codes
  const codes = section[0].match(/BY\s+[A-Z]{2,}(?:\s+[A-Z]{2,})*/g);
  if (!codes) return [];
  return [...new Set(codes.map(c => c.trim()))];
}

/**
 * Parse Party Identifier format from SWIFT usage notes
 * Format: [/1!a][/34x] where 1!a is the code and 34x is the account
 *
 * @param usageNotes - The swiftUsageNotes field
 * @returns Configuration for party identifier fields
 */
export function parsePartyIdentifierFormat(usageNotes?: string): {
  hasPartyIdentifier: boolean;
  codeMaxLength: number;
  accountMaxLength: number;
  codeOptions?: string[];
} {
  const result = {
    hasPartyIdentifier: false,
    codeMaxLength: 1,
    accountMaxLength: 34,
    codeOptions: undefined as string[] | undefined,
  };

  if (!usageNotes) return result;

  // Check for Party Identifier pattern: [/1!a][/34x] or /1!a/34x
  const partyIdPattern = /\[?\/(\d+)!?([ax])\]?\[?\/(\d+)([xnaz])\]?/i;
  const match = usageNotes.match(partyIdPattern);

  if (match) {
    result.hasPartyIdentifier = true;
    result.codeMaxLength = parseInt(match[1]) || 1;
    result.accountMaxLength = parseInt(match[3]) || 34;
  }

  // Also check for explicit pattern like [/1!a][/34x]
  if (usageNotes.includes('/1!a') || usageNotes.includes('[/1!a]')) {
    result.hasPartyIdentifier = true;
    result.codeMaxLength = 1;
  }

  return result;
}

/**
 * Format a field value for display as text
 * Handles complex objects like {date, place} or {currency, amount}
 *
 * @param value - The field value (string, number, or object)
 * @returns A string suitable for display
 */
export function formatFieldValueForDisplay(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'object') {
    // Handle date+place objects (e.g., :31D:)
    if ('date' in value && 'place' in value) {
      const parts: string[] = [];
      if (value.date) parts.push(value.date);
      if (value.place) parts.push(value.place);
      return parts.join(' - ');
    }

    // Handle currency+amount objects (e.g., :32B:)
    if ('currency' in value && 'amount' in value) {
      return `${value.currency || ''} ${value.amount || ''}`.trim();
    }

    // Handle SwiftMultiOptionValue objects (e.g., :41a:, :57a:)
    if ('detectedOption' in value && 'inputMethod' in value) {
      if (value.bic) return value.bic;
      if (value.bicInstitution?.nombre) return `${value.bicInstitution.swiftCode || value.bicInstitution.swiftBic || ''} - ${value.bicInstitution.nombre}`.trim();
      if (value.manualText?.length) return value.manualText.filter((l: string) => l.trim()).join(' / ');
      return '';
    }

    // Handle SWIFT party objects
    if ('text' in value) {
      return value.text || '';
    }

    // Handle participant objects
    if ('nombre' in value || 'name' in value) {
      return value.nombre || value.name || '';
    }

    // Fallback: try to stringify
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }

  return String(value);
}
