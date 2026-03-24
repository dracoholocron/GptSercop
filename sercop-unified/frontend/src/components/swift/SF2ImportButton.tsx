import { useRef, useState } from 'react';
import { Button, Tooltip, Box } from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { parseSwiftMessage } from '../../utils/swiftMessageParser';
import type { SwiftFieldConfig } from '../../types/swiftField';
import { notify } from '../ui/toaster';

export interface SF2ImportResult {
  parsedFields: Record<string, any>;
  rawContent: string;
}

export interface SF2ImportButtonProps {
  swiftConfigs: SwiftFieldConfig[];
  onImport: (result: SF2ImportResult) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'solid' | 'ghost';
  colorPalette?: string;
}

/**
 * Reusable SF2 Import Button component for importing SWIFT message files.
 * Handles file selection, validation, parsing and returns the parsed fields.
 *
 * Usage:
 * ```tsx
 * <SF2ImportButton
 *   swiftConfigs={swiftConfigs}
 *   onImport={({ parsedFields, rawContent }) => {
 *     setSwiftFieldsData(prev => ({ ...prev, ...parsedFields }));
 *     // Map fields to form data as needed
 *   }}
 * />
 * ```
 */
export const SF2ImportButton = ({
  swiftConfigs,
  onImport,
  size = 'sm',
  variant = 'outline',
  colorPalette = 'cyan'
}: SF2ImportButtonProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.sf2') && !fileName.endsWith('.txt')) {
      notify.warning(t('sf2Import.invalidFileTypeTitle', 'Archivo inválido'), t('sf2Import.invalidFileType', 'El archivo debe tener extensión .sf2 o .txt'));
      return;
    }

    setIsImporting(true);

    try {
      // Read file content
      const rawContent = await file.text();
      console.log('[SF2ImportButton] File content loaded:', file.name);

      // Parse SWIFT message using shared parser
      const parsedFields = parseSwiftMessage(rawContent, swiftConfigs);
      console.log('[SF2ImportButton] Parsed fields:', parsedFields);

      // Notify parent with results
      onImport({ parsedFields, rawContent });

      // Clear file input to allow re-importing same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      notify.success(t('sf2Import.successTitle', 'Importación exitosa'), t('sf2Import.success', 'Archivo SF2 importado exitosamente. Los campos han sido poblados.'));

    } catch (error) {
      console.error('[SF2ImportButton] Error parsing SF2 file:', error);
      notify.error(t('sf2Import.errorTitle', 'Error'), t('sf2Import.error', 'Error al procesar el archivo SF2'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Box>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".sf2,.txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button
            colorPalette={colorPalette}
            variant={variant}
            onClick={() => fileInputRef.current?.click()}
            loading={isImporting}
            size={size}
          >
            <FiUpload style={{ marginRight: 6 }} />
            {t('sf2Import.button', 'Importar SF2')}
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content bg="gray.700" color="white" px={3} py={2} borderRadius="md">
            {t('sf2Import.tooltip', 'Importar mensaje SWIFT desde archivo .sf2 o .txt para poblar el formulario')}
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Root>
    </Box>
  );
};

/**
 * Converts SWIFT date format (YYYYmmdd or YYMMDD) to ISO date format (YYYY-MM-DD)
 * @param swiftDate - Date string in SWIFT format (e.g., "20241215" or "241215")
 * @returns Date string in ISO format (e.g., "2024-12-15") or original value if not a valid date
 */
export const convertSwiftDateToISO = (swiftDate: string): string => {
  if (!swiftDate || typeof swiftDate !== 'string') return swiftDate;

  // Remove any whitespace
  const cleanDate = swiftDate.trim();

  // Handle YYYYmmdd format (8 digits)
  if (/^\d{8}$/.test(cleanDate)) {
    const year = cleanDate.substring(0, 4);
    const month = cleanDate.substring(4, 6);
    const day = cleanDate.substring(6, 8);
    return `${year}-${month}-${day}`;
  }

  // Handle YYMMDD format (6 digits)
  if (/^\d{6}$/.test(cleanDate)) {
    const yearShort = cleanDate.substring(0, 2);
    const month = cleanDate.substring(2, 4);
    const day = cleanDate.substring(4, 6);
    // Assume 20xx for years 00-50, 19xx for 51-99
    const century = parseInt(yearShort) <= 50 ? '20' : '19';
    return `${century}${yearShort}-${month}-${day}`;
  }

  // Return as-is if already in correct format or unrecognized
  return swiftDate;
};

/**
 * Helper function to get date field codes from swift field configs.
 * Uses the fieldType from swift_field_config_readmodel to identify date fields.
 * @param swiftConfigs - Array of SwiftFieldConfig from the database
 * @returns Set of field codes that are date fields
 */
export const getDateFieldCodes = (swiftConfigs: SwiftFieldConfig[]): Set<string> => {
  return new Set(
    swiftConfigs
      .filter(config => config.fieldType === 'DATE')
      .map(config => config.fieldCode)
  );
};

/**
 * Helper function to map common SWIFT fields to form data.
 * Can be used by wizards to transform parsed fields into their specific form structure.
 * Automatically converts SWIFT date formats (YYYYmmdd) to ISO format (YYYY-MM-DD)
 * based on the fieldType from swift_field_config_readmodel.
 *
 * @param parsedFields - Parsed fields from SF2 file
 * @param fieldMapping - Mapping from SWIFT field codes to form field names
 * @param swiftConfigs - SwiftFieldConfig array to determine which fields are dates
 */
export const mapSwiftFieldsToForm = (
  parsedFields: Record<string, any>,
  fieldMapping: Record<string, string>,
  swiftConfigs: SwiftFieldConfig[] = []
): Record<string, any> => {
  const formData: Record<string, any> = {};

  // Get date field codes from the swift configs
  const dateFieldCodes = getDateFieldCodes(swiftConfigs);

  Object.entries(fieldMapping).forEach(([swiftField, formField]) => {
    if (parsedFields[swiftField] !== undefined) {
      let value = parsedFields[swiftField];

      // Check if this is a date field based on swift_field_config_readmodel
      const isDateField = dateFieldCodes.has(swiftField);

      // Handle different value types
      if (typeof value === 'object' && value !== null) {
        // For complex fields like :32B: (currency/amount)
        if (value.currency && value.amount) {
          formData[formField] = value.amount;
          // Also set currency if the form has a currency field
          if (formField === 'monto' && fieldMapping[':32B:_currency']) {
            formData[fieldMapping[':32B:_currency']] = value.currency;
          }
        } else if (value.text) {
          formData[formField] = isDateField ? convertSwiftDateToISO(value.text) : value.text;
        } else if (value.value) {
          formData[formField] = isDateField ? convertSwiftDateToISO(value.value) : value.value;
        } else if (value.date) {
          // Handle objects with a date property (like :31D: which has date and place)
          formData[formField] = convertSwiftDateToISO(value.date);
        }
      } else if (typeof value === 'string') {
        // Convert string date values
        formData[formField] = isDateField ? convertSwiftDateToISO(value) : value;
      } else {
        formData[formField] = value;
      }
    }
  });

  return formData;
};

/**
 * Common SWIFT field mappings for LC (Letter of Credit) messages
 */
export const LC_SWIFT_FIELD_MAPPING: Record<string, string> = {
  ':20:': 'referenciaRemitente',
  ':31C:': 'fechaEmision',
  ':31D:': 'fechaVencimiento',
  ':32B:': 'monto',
  ':40E:': 'reglasAplicables',
  ':40A:': 'tipoLC',
  ':50:': 'ordenante',
  ':59:': 'beneficiario',
  ':44A:': 'lugarEmbarque',
  ':44E:': 'puertoDescarga',
  ':44F:': 'destinoFinal',
  ':44C:': 'ultimaFechaEmbarque',
  ':45A:': 'mercancia',
  ':46A:': 'documentosRequeridos',
  ':47A:': 'condicionesEspeciales',
  ':43P:': 'embarquesParciales',
  ':43T:': 'transbordo',
};

/**
 * Common SWIFT field mappings for Guarantee messages (MT760)
 */
export const GUARANTEE_SWIFT_FIELD_MAPPING: Record<string, string> = {
  ':20:': 'numeroContrato',
  ':21:': 'descripcionProyecto',
  ':23:': 'tipoGarantia',
  ':31C:': 'fechaEmision',
  ':31D:': 'fechaVencimiento',
  ':31E:': 'fechaExpiracion',
  ':32B:': 'monto',
  ':50:': 'solicitante',
  ':59:': 'beneficiario',
  ':77C:': 'proposito',
  ':77A:': 'documentosRequeridos',
  ':47A:': 'condicionesEspeciales',
  ':72:': 'observaciones',
};
