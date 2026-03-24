/**
 * DynamicCustomField Component
 * Renders a custom field based on its configuration
 */

import { useMemo, useRef, useState } from 'react';
import {
  Box,
  Input,
  Textarea,
  Text,
  HStack,
  VStack,
  Badge,
  Field,
  Button,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { FiUpload, FiFile, FiX, FiCheck, FiDownload, FiHelpCircle } from 'react-icons/fi';
import { LuSparkles, LuShieldCheck } from 'react-icons/lu';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { CustomFieldDTO, FieldOption } from '../../services/customFieldsService';
import { parseFieldOptions, parseValidationRules } from '../../services/customFieldsService';
import { ParticipantSelector } from '../ParticipantSelector';
import type { Participante } from '../../services/participantService';
import clientPortalDocumentService from '../../services/clientPortalDocumentService';
// Homologated field components
import { TolerancePercentageField } from '../TolerancePercentageField';
import { DateSelector } from '../DateSelector';
import { CustomCatalogDropdown } from '../CustomCatalogDropdown';

// File Upload Field Component
interface FileUploadFieldProps {
  value: string;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  validationRules: Record<string, unknown>;
  isDark: boolean;
  colors: { textColor: string; primaryColor: string };
  t: (key: string, fallback?: string) => string;
  fieldCode?: string;
  draftId?: string;
}

const FileUploadField = ({
  value,
  onChange,
  disabled,
  placeholder,
  validationRules,
  isDark,
  colors,
  t,
  fieldCode,
  draftId,
}: FileUploadFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Parse accept types from validation rules
  const acceptTypes = (validationRules.accept as string) || '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.png';
  const maxSize = (validationRules.maxSize as number) || 10485760; // 10MB default

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      setError(t('validation.fileTooLarge', `El archivo excede el tamaño máximo (${Math.round(maxSize / 1024 / 1024)}MB)`));
      return;
    }

    // Validate that we have a draftId for proper document association
    if (!draftId) {
      setError(t('error.noDraftId', 'Cannot upload file: form not properly initialized. Please refresh the page.'));
      console.error('Upload attempted without draftId - documents will not be linked to the request');
      return;
    }

    setUploading(true);
    setFileName(file.name);
    setError(null);

    try {
      // Upload to server repository with draftId for proper association
      const response = await clientPortalDocumentService.uploadFile(file, {
        fieldCode,
        draftId, // This links the document to the client request via event_id
      });

      if (response.success && response.documentId) {
        // Store reference to server document
        const fileInfo = clientPortalDocumentService.toStorageString(response);
        onChange(fileInfo);
      } else {
        // Fallback to base64 if server upload fails
        console.warn('Server upload failed, falling back to base64:', response.message);
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          const fileInfo = JSON.stringify({
            name: file.name,
            size: file.size,
            type: file.type,
            data: base64,
          });
          onChange(fileInfo);
        };
        reader.onerror = () => {
          setError(t('error.fileRead', 'Error al leer el archivo'));
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      // Fallback to base64 on error
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const fileInfo = JSON.stringify({
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64,
        });
        onChange(fileInfo);
      };
      reader.onerror = () => {
        setError(t('error.fileRead', 'Error al leer el archivo'));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setFileName(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Check if we have a stored file
  const hasFile = value && value.length > 0;
  let displayFileName = fileName;
  let downloadUrl: string | null = null;
  let isServerStored = false;
  let base64Data: string | null = null;
  let mimeType: string | null = null;

  if (hasFile && !fileName) {
    try {
      const fileInfo = JSON.parse(value);
      displayFileName = fileInfo.name;
      downloadUrl = fileInfo.downloadUrl || null;
      isServerStored = !!fileInfo.documentId;
      // Check for base64 data (fallback storage)
      if (fileInfo.data && fileInfo.data.startsWith('data:')) {
        base64Data = fileInfo.data;
        mimeType = fileInfo.type || 'application/octet-stream';
      }
    } catch {
      displayFileName = t('common.fileUploaded', 'Archivo cargado');
    }
  }

  const handleDownload = async () => {
    if (downloadUrl) {
      // Server-stored file - fetch with auth token and open
      try {
        // Fix legacy URLs: /api/api/ -> /api/ and /v1/documents/ -> /client-portal/documents/
        let fixedUrl = downloadUrl
          .replace('/api/api/', '/api/')
          .replace('/api/v1/documents/', '/api/client-portal/documents/')
          .replace('/v1/documents/', '/api/client-portal/documents/');

        // Get token from localStorage
        const token = localStorage.getItem('globalcmx_token');

        const response = await fetch(fixedUrl, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');

        // Cleanup after a delay
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      } catch (err) {
        console.error('Error downloading file:', err);
        // Fallback: try opening URL directly (may work for public files)
        window.open(downloadUrl, '_blank');
      }
    } else if (base64Data) {
      // Base64 file - create blob and download
      try {
        // Convert base64 to blob
        const byteString = atob(base64Data.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);

        // Open in new tab for preview
        window.open(url, '_blank');

        // Cleanup after a delay
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } catch (err) {
        console.error('Error opening file:', err);
      }
    }
  };

  // Determine if we can show the view/download button
  const canDownload = isServerStored && downloadUrl;
  const canView = !!base64Data;

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        style={{ display: 'none' }}
      />

      {!hasFile ? (
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          w="full"
          justifyContent="flex-start"
          borderStyle="dashed"
        >
          {uploading ? (
            <>
              <Spinner size="sm" mr={2} />
              {t('common.uploading', 'Subiendo...')}
            </>
          ) : (
            <>
              <Icon as={FiUpload} mr={2} />
              {placeholder || t('common.selectFile', 'Seleccionar archivo...')}
            </>
          )}
        </Button>
      ) : (
        <HStack
          p={3}
          borderRadius="md"
          bg={isDark ? 'whiteAlpha.100' : 'gray.50'}
          borderWidth="1px"
          borderColor={isDark ? 'whiteAlpha.200' : 'gray.200'}
        >
          <Icon as={FiFile} color={colors.primaryColor} />
          <Text flex={1} fontSize="sm" color={colors.textColor} isTruncated>
            {displayFileName}
          </Text>
          <Icon as={FiCheck} color="green.500" />
          {(canDownload || canView) && (
            <Button
              size="xs"
              variant="ghost"
              colorPalette="blue"
              onClick={handleDownload}
              title={t('common.view', 'Ver archivo')}
            >
              <FiDownload />
            </Button>
          )}
          {!disabled && (
            <Button
              size="xs"
              variant="ghost"
              colorPalette="red"
              onClick={handleRemove}
            >
              <FiX />
            </Button>
          )}
        </HStack>
      )}
      {error && (
        <Text fontSize="xs" color="red.500" mt={1}>
          {error}
        </Text>
      )}
    </Box>
  );
};

// Types for complex field values
type CurrencyAmountValue = { currency: string; amount: string };
type SwiftPartyValueType = { text: string; participantId?: number };
type FieldValue = string | number | boolean | null | Participante | CurrencyAmountValue | SwiftPartyValueType | Record<string, unknown>;

interface DynamicCustomFieldProps {
  field: CustomFieldDTO;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  // Data source props for listbox components
  catalogData?: Array<{ value: string; label: string }>;
  userData?: Array<{ id: string; name: string }>;
  financialInstitutions?: Array<{ value: string; label: string }>;
  // Draft ID for file uploads
  draftId?: string;
  // AI assistance callback
  onAIHelp?: (fieldCode: string, prompt: string) => void;
  // AI validation callback - checks if field value complies with the law
  onAIValidation?: (fieldCode: string, fieldValue: string, prompt: string) => void;
}

export const DynamicCustomField = ({
  field,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  error,
  catalogData,
  userData,
  financialInstitutions,
  draftId,
  onAIHelp,
  onAIValidation,
}: DynamicCustomFieldProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  // Parse field configuration
  const options = useMemo(() => parseFieldOptions(field.fieldOptions), [field.fieldOptions]);
  const validationRules = useMemo(() => parseValidationRules(field.validationRules), [field.validationRules]);

  // Get translated strings
  const fieldName = t(field.fieldNameKey, { defaultValue: field.fieldNameKey });
  const placeholder = field.placeholderKey ? t(field.placeholderKey, { defaultValue: field.placeholderKey }) : '';
  const helpText = field.helpTextKey ? t(field.helpTextKey, { defaultValue: field.helpTextKey }) : '';

  // Translate options
  const translatedOptions = useMemo(() => {
    return options.map((opt: FieldOption) => ({
      value: opt.value,
      label: opt.labelKey ? t(opt.labelKey, opt.label || opt.value) : opt.label || opt.value,
    }));
  }, [options, t]);

  // Input styles - Enhanced for professional look
  const inputStyles = {
    bg: isDark ? 'whiteAlpha.50' : 'white',
    borderColor: error ? 'red.500' : isDark ? 'whiteAlpha.200' : 'gray.300',
    borderRadius: 'lg',
    color: colors.textColor,
    fontSize: 'sm',
    _placeholder: { color: isDark ? 'whiteAlpha.400' : 'gray.400', fontSize: 'sm' },
    _hover: { borderColor: isDark ? 'blue.400' : 'blue.300', bg: isDark ? 'whiteAlpha.100' : 'gray.50' },
    _focus: { borderColor: 'blue.500', boxShadow: '0 0 0 2px var(--chakra-colors-blue-200)', bg: isDark ? 'whiteAlpha.100' : 'white' },
    transition: 'all 0.2s ease-in-out',
  };

  // Render field based on component type
  const renderField = () => {
    const stringValue = value !== null && value !== undefined ? String(value) : '';
    const numericValue = typeof value === 'number' ? value : (value ? Number(value) : 0);

    switch (field.componentType) {
      case 'TEXT_INPUT':
        return (
          <Input
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            maxLength={validationRules.maxLength as number}
            {...inputStyles}
          />
        );

      case 'NUMBER_INPUT':
        return (
          <Input
            type="number"
            value={numericValue || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            min={validationRules.min as number}
            max={validationRules.max as number}
            step={validationRules.decimals ? Math.pow(10, -(validationRules.decimals as number)) : 1}
            {...inputStyles}
          />
        );

      case 'MULTILINE_TEXT':
      case 'TEXTAREA':
        return (
          <Textarea
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            maxLength={validationRules.maxLength as number}
            rows={validationRules.rows as number || 3}
            {...inputStyles}
          />
        );

      case 'SELECT':
      case 'DROPDOWN':
        return (
          <NativeSelectRoot>
            <NativeSelectField
              value={stringValue}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
            >
              <option value="">{placeholder || t('common.select', 'Seleccione...')}</option>
              {translatedOptions.map((opt: { value: string; label: string }) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
        );

      case 'CATALOG_LISTBOX':
        // Usa CustomCatalogDropdown que carga automáticamente las opciones del catálogo
        // basándose en field.dataSourceCode (código del catálogo padre)
        return (
          <CustomCatalogDropdown
            catalogCode={field.dataSourceCode || ''}
            value={stringValue}
            onChange={(val) => onChange(val)}
            placeholder={placeholder || t('common.select', 'Seleccione...')}
            disabled={disabled || readOnly}
          />
        );

      case 'USER_LISTBOX':
        return (
          <NativeSelectRoot>
            <NativeSelectField
              value={stringValue}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
            >
              <option value="">{placeholder || t('common.select', 'Seleccione...')}</option>
              {(userData || []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
        );

      case 'PARTICIPANT_SELECTOR':
        return (
          <ParticipantSelector
            onSelect={(participant) => onChange(participant)}
            selectedParticipante={value as Participante | string | null}
            placeholder={placeholder || t('common.searchParticipant', 'Buscar participante...')}
            disabled={disabled}
          />
        );

      case 'DATE_PICKER':
        return (
          <DateSelector
            value={stringValue}
            onChange={(val) => onChange(val)}
            placeholder={placeholder}
            disabled={disabled || readOnly}
            required={field.isRequired}
          />
        );

      case 'DATETIME_PICKER':
        return (
          <Input
            type="datetime-local"
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            {...inputStyles}
          />
        );

      case 'CHECKBOX':
        return (
          <Box
            as="input"
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
            disabled={disabled}
            style={{ width: '20px', height: '20px' }}
          />
        );

      case 'PERCENTAGE':
        return (
          <HStack>
            <Input
              type="number"
              value={numericValue || ''}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
              min={0}
              max={100}
              step={0.01}
              {...inputStyles}
            />
            <Text color={colors.textColor}>%</Text>
          </HStack>
        );

      case 'CURRENCY_AMOUNT':
        return (
          <HStack>
            <Box width="100px">
              <NativeSelectRoot>
                <NativeSelectField
                  value=""
                  onChange={() => {}}
                  disabled={disabled}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="MXN">MXN</option>
                </NativeSelectField>
              </NativeSelectRoot>
            </Box>
            <Input
              type="number"
              value={numericValue || ''}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
              placeholder="0.00"
              disabled={disabled}
              readOnly={readOnly}
              min={0}
              step={0.01}
              flex={1}
              {...inputStyles}
            />
          </HStack>
        );

      case 'EMAIL':
        return (
          <Input
            type="email"
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'email@example.com'}
            disabled={disabled}
            readOnly={readOnly}
            {...inputStyles}
          />
        );

      case 'PHONE':
        return (
          <Input
            type="tel"
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || '+XX XXX XXX XXXX'}
            disabled={disabled}
            readOnly={readOnly}
            {...inputStyles}
          />
        );

      case 'COUNTRY_SELECT':
        // Uses catalogData which should contain country options from COUNTRIES catalog
        return (
          <NativeSelectRoot>
            <NativeSelectField
              value={stringValue}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
            >
              <option value="">{placeholder || t('common.selectCountry', 'Seleccione país...')}</option>
              {(catalogData || []).map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
        );

      case 'TAGS_INPUT':
        // Simple tags display for now
        return (
          <Box>
            <Input
              value={stringValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || t('common.addTags', 'Agregue etiquetas separadas por coma...')}
              disabled={disabled}
              readOnly={readOnly}
              {...inputStyles}
            />
            {stringValue && (
              <HStack mt={2} flexWrap="wrap" gap={1}>
                {stringValue.split(',').filter(Boolean).map((tag, idx) => (
                  <Badge key={idx} colorPalette="blue" variant="subtle">
                    {tag.trim()}
                  </Badge>
                ))}
              </HStack>
            )}
          </Box>
        );

      case 'FILE_UPLOAD':
        // File upload component - uploads to server repository
        return (
          <FileUploadField
            value={stringValue}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            validationRules={validationRules}
            isDark={isDark}
            colors={colors}
            t={t}
            fieldCode={field.fieldCode}
            draftId={draftId}
          />
        );

      case 'BANK_SELECTOR':
      case 'SWIFT_SELECTOR':
      case 'FINANCIAL_INSTITUTION_SELECTOR':
        // Financial institution selector - shows SWIFT code and bank name
        // Use index in key to handle duplicate SWIFT codes in the database
        return (
          <NativeSelectRoot>
            <NativeSelectField
              value={stringValue}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
            >
              <option value="">{placeholder || t('common.selectBank', 'Seleccione banco...')}</option>
              {(financialInstitutions || []).map((item, idx) => (
                <option key={`${item.value}-${idx}`} value={item.value}>
                  {item.label}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
        );

      // SWIFT homologated components
      case 'TOLERANCE_PERCENTAGE':
        // SWIFT :39A: format "NN/NN" (e.g., "05/05" = +5%/-5%)
        return (
          <TolerancePercentageField
            value={stringValue}
            onChange={(val) => onChange(val)}
            placeholder={placeholder}
            required={field.isRequired}
            disabled={disabled}
            readOnly={readOnly}
          />
        );

      case 'CURRENCY_AMOUNT_INPUT': {
        // Inline currency+amount input (no external Swift component needed)
        const parsedVal = (() => {
          if (typeof value === 'object' && value !== null && 'currency' in (value as object)) {
            return value as { currency: string; amount: string };
          }
          try { 
            const p = JSON.parse(String(value || '{}')); 
            return p && 'currency' in p ? p as { currency: string; amount: string } : { currency: 'USD', amount: '' }; 
          } catch { return { currency: 'USD', amount: '' }; }
        })();
        return (
          <HStack>
            <Box width="90px">
              <NativeSelectRoot><NativeSelectField value={parsedVal.currency} onChange={e => onChange({...parsedVal, currency: e.target.value})} disabled={disabled}>
                {['USD','EUR','GBP','JPY','CHF','CAD'].map(c => <option key={c} value={c}>{c}</option>)}
              </NativeSelectField></NativeSelectRoot>
            </Box>
            <Input type="number" flex={1} value={parsedVal.amount} onChange={e => onChange({...parsedVal, amount: e.target.value})} placeholder="0.00" disabled={disabled} readOnly={readOnly} min={0} step={0.01} {...inputStyles} />
          </HStack>
        );
      }

      case 'SWIFT_PARTY': {
        // Inline party textarea (no external Swift component needed)
        const partyText = typeof value === 'object' && value !== null && 'text' in (value as object) 
          ? (value as {text: string}).text 
          : String(value || '');
        return (
          <Textarea value={partyText} onChange={e => onChange({text: e.target.value})} placeholder={placeholder} disabled={disabled} readOnly={readOnly} rows={4} {...inputStyles} />
        );
      }

      default:
        // Default to text input
        return (
          <Input
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            {...inputStyles}
          />
        );
    }
  };

  return (
    <Field.Root invalid={!!error}>
      <Field.Label
        fontSize="sm"
        fontWeight="500"
        color={colors.textColor}
        mb={1}
        display="flex"
        alignItems="center"
        gap={1}
      >
        {fieldName}
        {field.isRequired && (
          <Text as="span" color="red.400" fontSize="xs" ml={0.5}>
            *
          </Text>
        )}
        {field.aiEnabled && onAIHelp && (
          <Button
            size="xs"
            variant="ghost"
            colorPalette="purple"
            ml={1}
            px={1}
            minW="auto"
            h="auto"
            py={0.5}
            onClick={() => onAIHelp(field.fieldCode, field.aiHelpPrompt || field.fieldNameKey)}
            title="Ayuda IA"
          >
            <Icon as={LuSparkles} boxSize={3} />
          </Button>
        )}
        {field.aiEnabled && onAIValidation && value && (
          <Button
            size="xs"
            variant="ghost"
            colorPalette="green"
            px={1}
            minW="auto"
            h="auto"
            py={0.5}
            onClick={() => onAIValidation(field.fieldCode, String(value), field.aiValidationPrompt || field.fieldNameKey)}
            title="Validar con IA según LOSNCP"
          >
            <Icon as={LuShieldCheck} boxSize={3} />
          </Button>
        )}
      </Field.Label>

      {renderField()}

      {helpText && (
        <Field.HelperText
          fontSize="xs"
          color={colors.textColorSecondary || colors.textColor}
          mt={1.5}
          lineHeight="1.4"
        >
          {helpText}
        </Field.HelperText>
      )}

      {error && (
        <Field.ErrorText fontSize="xs" mt={1}>
          {error}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
};

export default DynamicCustomField;
