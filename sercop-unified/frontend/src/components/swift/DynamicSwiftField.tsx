import React, { useMemo } from 'react';
import {
  Box,
  Input,
  Textarea,
  Text,
  HStack,
  VStack,
  Field,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { FiInfo } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import type { SwiftFieldConfig, ValidationError } from '../../types/swiftField';
import { FinancialInstitutionsSelector } from '../FinancialInstitutionsSelector';
import { CountrySelector } from '../CountrySelector';
import { ParticipantSelector } from '../ParticipantSelector';
import { DateSelector } from '../DateSelector';
import { DatePlaceInput } from '../DatePlaceInput';

/**
 * Helper to get field text property
 * Priority: 1) Translate fieldNameKey as i18n key 2) Generated key fallback
 */
const useSwiftFieldTranslation = (config: SwiftFieldConfig) => {
  const { t } = useTranslation();

  const getFieldText = (property: 'fieldName' | 'description' | 'placeholder' | 'helpText'): string => {
    const keyProperty = `${property}Key` as keyof SwiftFieldConfig;
    const configValue = (config[keyProperty] as string) || (config as any)[property];

    // If we have a value from config, try to translate it as a key
    if (configValue && configValue.trim() !== '') {
      // Try to translate the value as an i18n key
      const translated = t(configValue, { defaultValue: '' });

      // If translation found (different from key), return it
      if (translated && translated !== configValue && translated !== '') {
        return translated;
      }

      // If no translation, return raw value (backward compatibility)
      return configValue;
    }

    // Fallback: try generated i18n key pattern
    const messageTypeLower = config.messageType?.toLowerCase() || 'mt700';
    const translationKey = `swift.${messageTypeLower}.${config.fieldCode}.${property}`;
    const translation = t(translationKey, { defaultValue: '' });

    if (translation && translation !== translationKey && translation !== '') {
      return translation;
    }

    return '';
  };

  return {
    fieldName: getFieldText('fieldName'),
    description: getFieldText('description'),
    placeholder: getFieldText('placeholder'),
    helpText: getFieldText('helpText'),
  };
};

/**
 * Props del componente DynamicSwiftField
 */
interface DynamicSwiftFieldProps {
  /** Configuración del campo SWIFT */
  config: SwiftFieldConfig;
  /** Valor actual del campo */
  value: any;
  /** Callback al cambiar el valor */
  onChange: (fieldCode: string, value: any) => void;
  /** Todos los datos del formulario (para validaciones que dependen de otros campos) */
  formData: Record<string, any>;
  /** Error de validación (si existe) */
  error?: ValidationError | null;
  /** Si el campo está deshabilitado por dependencias */
  disabled?: boolean;
  /** Si el campo está oculto por dependencias */
  hidden?: boolean;
  /** Si mostrar el campo como obligatorio (puede ser dinámico) */
  required?: boolean;
}

/**
 * Componente que renderiza dinámicamente un campo SWIFT según su configuración
 *
 * Este componente es el corazón del sistema de campos configurables.
 * Selecciona el componente apropiado basándose en el componentType de la configuración.
 *
 * @example
 * ```tsx
 * <DynamicSwiftField
 *   config={fieldConfig}
 *   value={formData[':39A:']}
 *   onChange={handleFieldChange}
 *   formData={formData}
 *   error={errors[':39A:']}
 * />
 * ```
 */
export const DynamicSwiftField: React.FC<DynamicSwiftFieldProps> = ({
  config,
  value,
  onChange,
  formData,
  error,
  disabled = false,
  hidden = false,
  required: requiredProp,
}) => {
  // Get translated field texts
  const { fieldName, description, placeholder, helpText } = useSwiftFieldTranslation(config);

  // Determinar si el campo es requerido (config base o prop dinámica)
  const isRequired = requiredProp !== undefined ? requiredProp : config.isRequired;

  // Si está oculto, no renderizar nada
  if (hidden) {
    return null;
  }

  // Handler común para cambios
  const handleChange = (newValue: any) => {
    onChange(config.fieldCode, newValue);
  };

  // Renderizar el componente apropiado según componentType
  const renderFieldComponent = useMemo(() => {
    switch (config.componentType) {
      case 'INPUT':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            borderColor={error ? 'red.500' : undefined}
          />
        );

      case 'TEXTAREA': {
        const maxLineLength = config.validationRules?.maxLineLength;
        const maxLines = config.validationRules?.maxLines;
        const textValue = value || '';
        const lines = textValue.split('\n');

        // Verificar si alguna línea excede el máximo
        const lineErrors = maxLineLength
          ? lines.map((line: string, idx: number) => ({
              lineNum: idx + 1,
              length: line.length,
              exceeds: line.length > maxLineLength
            })).filter((l: { exceeds: boolean }) => l.exceeds)
          : [];

        const hasLineError = lineErrors.length > 0;
        const hasTooManyLines = maxLines && lines.length > maxLines;

        return (
          <Box>
            <Textarea
              value={textValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              borderColor={error || hasLineError || hasTooManyLines ? 'red.500' : undefined}
              minHeight="100px"
            />
            {(maxLineLength || maxLines) && (
              <HStack justify="space-between" mt={1}>
                <Text fontSize="xs" color={hasLineError || hasTooManyLines ? 'red.500' : 'gray.500'}>
                  {maxLines && `${lines.length}/${maxLines} líneas`}
                  {maxLines && maxLineLength && ' · '}
                  {maxLineLength && `máx ${maxLineLength} chars/línea`}
                </Text>
                {hasLineError && (
                  <Text fontSize="xs" color="red.500">
                    ⚠ Línea {lineErrors[0].lineNum}: {lineErrors[0].length}/{maxLineLength} chars
                  </Text>
                )}
              </HStack>
            )}
          </Box>
        );
      }

      case 'NUMBER_INPUT':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            borderColor={error ? 'red.500' : undefined}
          />
        );

      case 'SELECT': {
        // Get options from fieldOptions or validationRules.options
        let selectOptions: Array<{ value: string; label: string }> = [];
        if (config.fieldOptions && config.fieldOptions.length > 0) {
          selectOptions = config.fieldOptions;
        } else if (config.validationRules?.options && Array.isArray(config.validationRules.options)) {
          // Support both formats: [{value, label}] or ["VALUE1", "VALUE2"]
          selectOptions = config.validationRules.options.map((opt: any) => {
            if (typeof opt === 'string') {
              return { value: opt, label: opt };
            }
            return { value: opt.value, label: opt.label || opt.value };
          });
        }

        return (
          <NativeSelectRoot>
            <NativeSelectField
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
            >
              <option value="">{placeholder || 'Seleccione una opción'}</option>
              {selectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
        );
      }

      case 'FINANCIAL_INSTITUTION_SELECTOR':
        return (
          <FinancialInstitutionsSelector
            onSelect={(institution) => handleChange(institution)}
            selectedInstitucion={value}
            placeholder={placeholder}
            filterActive={true}
            disabled={disabled}
          />
        );

      case 'COUNTRY_SELECTOR':
        return (
          <CountrySelector
            value={value}
            onChange={(country) => handleChange(country)}
            placeholder={placeholder}
            disabled={disabled}
          />
        );

      case 'PARTICIPANT_SELECTOR':
        return (
          <ParticipantSelector
            onSelect={(participant) => handleChange(participant)}
            selectedParticipante={value}
            placeholder={placeholder}
            disabled={disabled}
          />
        );

      case 'DATE_PICKER':
        return (
          <DateSelector
            value={value || ''}
            onChange={(val) => handleChange(val)}
            placeholder={placeholder}
            disabled={disabled}
            required={isRequired}
          />
        );

      case 'DATE_PLACE_INPUT':
      case 'DATE_PLACE':
        return (
          <DatePlaceInput
            value={value}
            onChange={(val) => handleChange(val)}
            placeholder={placeholder}
            required={isRequired}
            disabled={disabled}
          />
        );

      case 'CURRENCY_AMOUNT_INPUT':
        return (
          <HStack gap={2}>
            <NativeSelectRoot width="120px">
              <NativeSelectField
                value={formData[`${config.fieldCode}_currency`] || 'USD'}
                onChange={(e) => onChange(`${config.fieldCode}_currency`, e.target.value)}
                disabled={disabled}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="MXN">MXN</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </NativeSelectField>
            </NativeSelectRoot>
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              borderColor={error ? 'red.500' : undefined}
              flex={1}
            />
          </HStack>
        );

      default:
        // Por defecto, mostrar un Input
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            borderColor={error ? 'red.500' : undefined}
          />
        );
    }
  }, [config, value, disabled, error, formData, placeholder]);

  return (
    <Field.Root invalid={!!error} required={isRequired} disabled={disabled}>
      <Field.Label>
        <HStack gap={2}>
          <Text>
            {fieldName}
            {config.fieldCode && (
              <Text as="span" fontSize="sm" color="gray.500" ml={2}>
                {config.fieldCode}
              </Text>
            )}
          </Text>
          {helpText && (
            <Box
              as="span"
              cursor="help"
              color="blue.500"
              title={helpText}
            >
              <FiInfo size={12} />
            </Box>
          )}
        </HStack>
      </Field.Label>

      {renderFieldComponent}

      {error && (
        <Field.ErrorText>
          {error.message}
        </Field.ErrorText>
      )}

      {!error && description && (
        <Field.HelperText>{description}</Field.HelperText>
      )}

      {config.documentationUrl && (
        <Field.HelperText>
          <a href={config.documentationUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3182CE', textDecoration: 'underline' }}>
            Ver documentación SWIFT
          </a>
        </Field.HelperText>
      )}
    </Field.Root>
  );
};

export default DynamicSwiftField;
