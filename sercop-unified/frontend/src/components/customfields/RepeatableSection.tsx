/**
 * RepeatableSection Component
 * Renders a multi-row section with add/edit/delete capabilities
 */

import { useState } from 'react';
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  IconButton,
  SimpleGrid,
  Collapsible,
  Badge,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiEdit2, FiChevronDown, FiChevronUp, FiSave, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { DynamicCustomField } from './DynamicCustomField';
import type { CustomFieldSectionDTO, CustomDataRow } from '../../services/customFieldsService';

interface RepeatableSectionProps {
  section: CustomFieldSectionDTO;
  rows: CustomDataRow[];
  onChange: (rows: CustomDataRow[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
  errors?: Record<string, string>[];
  // Data sources for listbox fields
  catalogData?: Record<string, Array<{ value: string; label: string }>>;
  userData?: Array<{ id: string; name: string }>;
  financialInstitutions?: Array<{ value: string; label: string }>;
  // Visual variant: 'default' = full styling, 'clean' = minimal styling for expert mode
  variant?: 'default' | 'clean';
  /** Draft ID for file uploads - links documents to this request */
  draftId?: string;
}

export const RepeatableSection = ({
  section,
  rows,
  onChange,
  disabled = false,
  readOnly = false,
  errors = [],
  catalogData = {},
  userData = [],
  financialInstitutions = [],
  variant = 'default',
  draftId,
}: RepeatableSectionProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const [isExpanded, setIsExpanded] = useState(!section.defaultCollapsed);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingRowData, setEditingRowData] = useState<CustomDataRow | null>(null);

  // Safely get string value - handle potential object values
  const getSafeString = (value: unknown, fallback: string): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      if ('label' in value) return String((value as { label: unknown }).label);
      if ('name' in value) return String((value as { name: unknown }).name);
    }
    return fallback;
  };

  // Get translated strings safely
  const sectionNameKey = getSafeString(section.sectionNameKey, section.sectionCode);
  const sectionName = t(sectionNameKey, section.sectionCode);
  const separatorTitleKey = section.embedSeparatorTitleKey
    ? getSafeString(section.embedSeparatorTitleKey, sectionNameKey)
    : sectionNameKey;
  const separatorTitle = t(separatorTitleKey, sectionName);

  // Clean variant: minimal styling for expert mode
  const isClean = variant === 'clean';

  // Container styles
  const containerStyles = isClean
    ? {
        p: 0,
        bg: 'transparent',
      }
    : {
        p: 4,
        borderRadius: 'lg',
        bg: isDark ? 'whiteAlpha.50' : 'gray.50',
        borderWidth: '1px',
        borderColor: isDark ? 'whiteAlpha.100' : 'gray.200',
      };

  // Header styles
  const headerStyles = isClean
    ? {
        p: 2,
        bg: 'transparent',
        cursor: section.collapsible ? 'pointer' : 'default',
      }
    : {
        p: 3,
        borderRadius: 'md',
        bg: isDark ? 'whiteAlpha.100' : 'white',
        cursor: section.collapsible ? 'pointer' : 'default',
        _hover: section.collapsible ? { bg: isDark ? 'whiteAlpha.150' : 'gray.100' } : {},
      };

  // Row styles
  const rowStyles = isClean
    ? {
        p: 2,
        borderRadius: 'md',
        bg: isDark ? 'whiteAlpha.50' : 'gray.50',
        borderWidth: '1px',
        borderColor: isDark ? 'whiteAlpha.100' : 'gray.100',
      }
    : {
        p: 3,
        borderRadius: 'md',
        bg: isDark ? 'whiteAlpha.50' : 'white',
        borderWidth: '1px',
        borderColor: isDark ? 'whiteAlpha.100' : 'gray.100',
        _hover: { borderColor: isDark ? 'whiteAlpha.200' : 'gray.200' },
      };

  // Add a new row
  const handleAddRow = () => {
    if (rows.length >= (section.maxRows || 100)) {
      return;
    }

    const newRow: CustomDataRow = {};
    section.fields.forEach((field) => {
      newRow[field.fieldCode] = field.defaultValue || null;
    });

    onChange([...rows, newRow]);
    setEditingRowIndex(rows.length);
    setEditingRowData(newRow);
  };

  // Start editing a row
  const handleEditRow = (index: number) => {
    setEditingRowIndex(index);
    setEditingRowData({ ...rows[index] });
  };

  // Save edited row
  const handleSaveRow = () => {
    if (editingRowIndex !== null && editingRowData) {
      const updatedRows = [...rows];
      updatedRows[editingRowIndex] = editingRowData;
      onChange(updatedRows);
    }
    setEditingRowIndex(null);
    setEditingRowData(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    // If it's a new row that wasn't saved, remove it
    if (editingRowIndex !== null && editingRowIndex === rows.length) {
      // Don't remove, just cancel
    }
    setEditingRowIndex(null);
    setEditingRowData(null);
  };

  // Delete a row
  const handleDeleteRow = (index: number) => {
    if (rows.length <= (section.minRows || 0)) {
      return;
    }

    const updatedRows = rows.filter((_, i) => i !== index);
    onChange(updatedRows);

    if (editingRowIndex === index) {
      setEditingRowIndex(null);
      setEditingRowData(null);
    }
  };

  // Auto-fill related fields when a participant is selected
  const autoFillFromParticipant = (participant: Record<string, unknown>, currentData: CustomDataRow): CustomDataRow => {
    const updatedData = { ...currentData };

    // Map participant fields to common custom field codes
    const fieldMappings: Record<string, string[]> = {
      // Name fields
      'nombres': ['name', 'nombre', 'fullname', 'full_name', 'guarantor_name', 'codeudor_name', 'solidary_name'],
      // Identification fields - expanded patterns
      'identificacion': ['document', 'documento', 'identification', 'identificacion', 'id_number', 'ruc', 'cedula', 'tax_id', 'doc_', '_doc', 'id_', '_id', 'ident'],
      // Email fields
      'email': ['email', 'correo', 'mail'],
      // Phone fields
      'telefono': ['phone', 'telefono', 'tel', 'mobile', 'celular'],
      // Address fields
      'direccion': ['address', 'direccion', 'domicilio'],
    };

    // Get participant data
    const participantData: Record<string, string> = {
      nombres: String(participant.nombres || participant.name || ''),
      identificacion: String(participant.identificacion || participant.identification || ''),
      email: String(participant.email || participant.correo || ''),
      telefono: String(participant.telefono || participant.phone || ''),
      direccion: String(participant.direccion || participant.address || ''),
    };

    // Label patterns for matching (in Spanish and English)
    const labelMappings: Record<string, string[]> = {
      'nombres': ['nombre', 'name', 'codeudor', 'garante', 'guarantor', 'solidario'],
      'identificacion': ['documento', 'document', 'identificación', 'identificacion', 'ruc', 'cédula', 'cedula', 'tax'],
      'email': ['email', 'correo', 'mail'],
      'telefono': ['teléfono', 'telefono', 'phone', 'celular', 'móvil', 'movil'],
      'direccion': ['dirección', 'direccion', 'address', 'domicilio'],
    };

    // For each field in the section, check if it should be auto-filled
    section.fields.forEach((field) => {
      const fieldCodeLower = field.fieldCode.toLowerCase();
      // Get translated label and also check the key
      const translatedLabel = t(field.fieldNameKey, field.fieldCode).toLowerCase();
      const fieldKeyLower = (field.fieldNameKey || '').toLowerCase();

      // Skip participant selector fields
      if (field.componentType === 'PARTICIPANT_SELECTOR') return;

      // Check each participant field mapping against code, key, and translated label
      Object.entries(fieldMappings).forEach(([participantField, codePatterns]) => {
        // Check field code patterns
        const codeMatch = codePatterns.some((pattern) => fieldCodeLower.includes(pattern));

        // Check field label patterns against both key and translated text
        const labelPatterns = labelMappings[participantField] || [];
        const keyMatch = labelPatterns.some((pattern) => fieldKeyLower.includes(pattern));
        const labelMatch = labelPatterns.some((pattern) => translatedLabel.includes(pattern));

        if ((codeMatch || keyMatch || labelMatch) && participantData[participantField]) {
          updatedData[field.fieldCode] = participantData[participantField];
        }
      });
    });

    return updatedData;
  };

  // Update field in editing row
  const handleFieldChange = (fieldCode: string, value: string | number | boolean | null | Record<string, unknown>) => {
    if (editingRowData) {
      let updatedData: CustomDataRow = {
        ...editingRowData,
        [fieldCode]: value as string | number | boolean | null,
      };

      // Check if this is a participant selector field
      const field = section.fields.find(f => f.fieldCode === fieldCode);
      if (field?.componentType === 'PARTICIPANT_SELECTOR' && value && typeof value === 'object') {
        // Auto-fill related fields from participant data
        const participant = 'participant' in value ? value.participant as Record<string, unknown> : value;
        if (participant) {
          updatedData = autoFillFromParticipant(participant, updatedData);
        }
      }

      setEditingRowData(updatedData);
    }
  };

  // Get display value for a field
  const getDisplayValue = (row: CustomDataRow, fieldCode: string): string => {
    const value = row[fieldCode];
    if (value === null || value === undefined) return '-';

    // Handle string values that might be JSON (like FILE_UPLOAD)
    if (typeof value === 'string') {
      // Check if it looks like a file upload JSON (base64 or server-stored)
      if (value.startsWith('{') && (value.includes('"name":') || value.includes('"documentId":'))) {
        try {
          const fileInfo = JSON.parse(value);
          if (fileInfo.name) {
            return `📎 ${fileInfo.name}`;
          }
        } catch {
          // Not valid JSON, return truncated string
        }
      }
      // Truncate long strings
      if (value.length > 50) {
        return value.substring(0, 47) + '...';
      }
      return value;
    }

    // Handle objects (like participant selectors, listbox options, etc.)
    if (typeof value === 'object') {
      // Try common display properties in order of preference
      if ('text' in value && value.text) return String(value.text).split('\n')[0]; // First line only
      if ('label' in value && value.label) return String(value.label);
      if ('name' in value && value.name) return String(value.name);
      if ('nombres' in value && value.nombres) return String(value.nombres);
      if ('value' in value && value.value) return String(value.value);
      // For participant objects, try to get the name
      if ('participant' in value && value.participant) {
        const p = value.participant as Record<string, unknown>;
        if (p.nombres) return String(p.nombres);
        if (p.name) return String(p.name);
      }
      return '-';
    }
    return String(value);
  };

  // Render row in view mode
  const renderViewRow = (row: CustomDataRow, index: number) => (
    <Box {...rowStyles}>
      <HStack justify="space-between" align="start">
        <SimpleGrid columns={section.columns || 2} gap={4} flex={1}>
          {section.fields.slice(0, 4).map((field) => {
            // Safely get the field label
            const fieldLabel = typeof field.fieldNameKey === 'string'
              ? t(field.fieldNameKey, field.fieldCode)
              : (typeof field.fieldCode === 'string' ? field.fieldCode : '-');

            return (
              <VStack key={field.fieldCode} align="start" gap={0}>
                <Text fontSize="xs" color={colors.textColor} opacity={0.6}>
                  {fieldLabel}
                </Text>
                <Text fontSize="sm" color={colors.textColor}>
                  {getDisplayValue(row, field.fieldCode)}
                </Text>
              </VStack>
            );
          })}
        </SimpleGrid>

        {!readOnly && !disabled && (
          <HStack>
            <IconButton
              aria-label={t('common.edit', 'Editar')}
              size="sm"
              variant="ghost"
              onClick={() => handleEditRow(index)}
            >
              <FiEdit2 />
            </IconButton>
            <IconButton
              aria-label={t('common.delete', 'Eliminar')}
              size="sm"
              variant="ghost"
              colorPalette="red"
              onClick={() => handleDeleteRow(index)}
              disabled={rows.length <= (section.minRows || 0)}
            >
              <FiTrash2 />
            </IconButton>
          </HStack>
        )}
      </HStack>
    </Box>
  );

  // Render row in edit mode
  const renderEditRow = () => {
    if (editingRowIndex === null || !editingRowData) return null;

    const rowErrors = errors[editingRowIndex] || {};

    return (
      <Box {...rowStyles} borderColor="blue.400" borderWidth="2px">
        <VStack align="stretch" gap={4}>
          <SimpleGrid columns={section.columns || 2} gap={4}>
            {section.fields.map((field) => (
              <Box
                key={field.fieldCode}
                gridColumn={field.spanColumns === 2 ? 'span 2' : 'auto'}
              >
                <DynamicCustomField
                  field={field}
                  value={editingRowData[field.fieldCode] as string | number | boolean | null}
                  onChange={(value) => handleFieldChange(field.fieldCode, value)}
                  disabled={disabled}
                  error={rowErrors[field.fieldCode]}
                  catalogData={field.dataSourceCode ? catalogData[field.dataSourceCode] : undefined}
                  userData={field.componentType === 'USER_LISTBOX' ? userData : undefined}
                  financialInstitutions={financialInstitutions}
                  draftId={draftId}
                />
              </Box>
            ))}
          </SimpleGrid>

          <HStack justify="flex-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelEdit}
            >
              <FiX />
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button
              size="sm"
              colorPalette="blue"
              onClick={handleSaveRow}
            >
              <FiSave />
              {t('common.save', 'Guardar')}
            </Button>
          </HStack>
        </VStack>
      </Box>
    );
  };

  // Render section content
  const renderContent = () => (
    <VStack align="stretch" gap={3}>
      {/* Existing rows */}
      {rows.map((row, index) => (
        <Box key={`row-${index}`}>
          {editingRowIndex === index ? renderEditRow() : renderViewRow(row, index)}
        </Box>
      ))}

      {/* New row being added */}
      {editingRowIndex === rows.length && renderEditRow()}

      {/* Add button */}
      {!readOnly && !disabled && rows.length < (section.maxRows || 100) && editingRowIndex === null && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddRow}
          w="full"
        >
          <FiPlus />
          {t('common.addRow', 'Agregar')}
        </Button>
      )}

      {/* Min/Max rows indicator */}
      <HStack justify="space-between">
        <Text fontSize="xs" color={colors.textColor} opacity={0.5}>
          {t('customFields.rowCount', '{{count}} de {{max}} registros', {
            count: rows.length,
            max: section.maxRows || 100,
          })}
        </Text>
        {section.minRows && section.minRows > 0 && (
          <Text fontSize="xs" color={rows.length < section.minRows ? 'red.500' : colors.textColor} opacity={0.5}>
            {t('customFields.minRows', 'Mínimo: {{min}}', { min: section.minRows })}
          </Text>
        )}
      </HStack>
    </VStack>
  );

  return (
    <Box {...containerStyles}>
      {/* Header */}
      {section.embedShowSeparator && (
        <Box
          {...headerStyles}
          mb={3}
          onClick={() => section.collapsible && setIsExpanded(!isExpanded)}
        >
          <HStack justify="space-between">
            <HStack>
              <Text fontWeight="semibold" color={colors.textColor}>
                {separatorTitle}
              </Text>
              <Badge colorPalette="blue" variant="subtle">
                {rows.length}
              </Badge>
            </HStack>

            {section.collapsible && (
              <IconButton
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                size="sm"
                variant="ghost"
              >
                {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
              </IconButton>
            )}
          </HStack>
        </Box>
      )}

      {/* Content */}
      {section.collapsible ? (
        <Collapsible.Root open={isExpanded}>
          <Collapsible.Content>
            {renderContent()}
          </Collapsible.Content>
        </Collapsible.Root>
      ) : (
        renderContent()
      )}
    </Box>
  );
};

export default RepeatableSection;
