import React from 'react';
import {
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  Select,
  Checkbox,
  Badge,
  Tooltip,
  InputGroup,
  InputLeftAddon,
  Icon,
  HStack,
  Text,
} from '@chakra-ui/react';
import { FiHelpCircle, FiBookOpen } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { CPFieldDTO } from '../../../services/cpProcessConfigService';

type FieldValue = string | number | boolean | null;

interface CPDynamicFieldProps {
  field: CPFieldDTO;
  value: FieldValue;
  onChange: (fieldCode: string, value: FieldValue) => void;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  catalogData?: Array<{ value: string; label: string }>;
  onAIAssist?: (fieldCode: string, legalReference: string) => void;
}

const CPDynamicField: React.FC<CPDynamicFieldProps> = ({
  field,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  error,
  catalogData,
  onAIAssist,
}) => {
  const { t } = useTranslation();

  const label = t(field.fieldNameKey, field.fieldCode);
  const placeholder = field.placeholderKey ? t(field.placeholderKey) : '';
  const helpText = field.helpTextKey ? t(field.helpTextKey) : '';

  const handleChange = (newValue: FieldValue) => {
    onChange(field.fieldCode, newValue);
  };

  const renderField = () => {
    switch (field.componentType) {
      case 'TEXT_INPUT':
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            isDisabled={disabled}
            isReadOnly={readOnly}
            size="sm"
          />
        );

      case 'TEXTAREA':
        return (
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            isDisabled={disabled}
            isReadOnly={readOnly}
            rows={4}
            size="sm"
          />
        );

      case 'NUMBER_INPUT':
        return (
          <NumberInput
            value={(value as number) || ''}
            onChange={(_, val) => handleChange(isNaN(val) ? null : val)}
            isDisabled={disabled}
            isReadOnly={readOnly}
            size="sm"
          >
            <NumberInputField placeholder={placeholder} />
          </NumberInput>
        );

      case 'CURRENCY_INPUT':
        return (
          <InputGroup size="sm">
            <InputLeftAddon>$</InputLeftAddon>
            <NumberInput
              value={(value as number) || ''}
              onChange={(_, val) => handleChange(isNaN(val) ? null : val)}
              precision={2}
              isDisabled={disabled}
              isReadOnly={readOnly}
              w="100%"
            >
              <NumberInputField placeholder={placeholder} borderLeftRadius={0} />
            </NumberInput>
          </InputGroup>
        );

      case 'DATE_PICKER':
        return (
          <Input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            isDisabled={disabled}
            isReadOnly={readOnly}
            size="sm"
          />
        );

      case 'CATALOG_SELECT':
        return (
          <Select
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`-- ${t('common.select', 'Seleccionar')} --`}
            isDisabled={disabled}
            size="sm"
          >
            {catalogData?.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        );

      case 'CPC_TREE_SELECTOR':
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={t('cp.placeholders.cpcCode', 'Ej: 43211503')}
            isDisabled={disabled}
            isReadOnly={readOnly}
            size="sm"
          />
        );

      case 'TAX_ID_LOOKUP':
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={t('cp.placeholders.taxId', 'Ej: 1791234567001')}
            isDisabled={disabled}
            isReadOnly={readOnly}
            size="sm"
          />
        );

      case 'FILE_UPLOAD':
        return (
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleChange(file.name);
            }}
            isDisabled={disabled}
            size="sm"
            pt={1}
          />
        );

      case 'CHECKBOX':
        return (
          <Checkbox
            isChecked={!!value}
            onChange={(e) => handleChange(e.target.checked)}
            isDisabled={disabled}
            isReadOnly={readOnly}
          >
            {label}
          </Checkbox>
        );

      default:
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            isDisabled={disabled}
            isReadOnly={readOnly}
            size="sm"
          />
        );
    }
  };

  if (field.componentType === 'CHECKBOX') {
    return (
      <FormControl isInvalid={!!error} isRequired={field.isRequired}>
        {renderField()}
        {error && <FormHelperText color="red.500">{error}</FormHelperText>}
      </FormControl>
    );
  }

  return (
    <FormControl isInvalid={!!error} isRequired={field.isRequired}>
      <FormLabel fontSize="sm" mb={1}>
        <HStack spacing={1}>
          <Text>{label}</Text>
          {field.legalReference && (
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <span>
                  <Icon as={FiBookOpen} color="blue.400" boxSize={3} />
                </span>
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content fontSize="xs" px={2} py={1}>
                  {field.legalReference}
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          )}
          {field.aiAssistEnabled && onAIAssist && (
            <Badge
              colorScheme="purple"
              fontSize="2xs"
              cursor="pointer"
              onClick={() => onAIAssist(field.fieldCode, field.legalReference || '')}
            >
              IA
            </Badge>
          )}
          {helpText && (
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <span>
                  <Icon as={FiHelpCircle} color="gray.400" boxSize={3} />
                </span>
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content fontSize="xs" px={2} py={1}>
                  {helpText}
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          )}
        </HStack>
      </FormLabel>
      {renderField()}
      {error && <FormHelperText color="red.500">{error}</FormHelperText>}
    </FormControl>
  );
};

export default CPDynamicField;
