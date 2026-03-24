/**
 * CustomFieldsPanel Component
 * Renders a complete custom fields step with all sections and fields
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Collapsible,
  IconButton,
  Spinner,
  Alert,
} from '@chakra-ui/react';
import { FiChevronDown, FiChevronUp, FiAlertCircle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { DynamicCustomField } from './DynamicCustomField';
import { RepeatableSection } from './RepeatableSection';
import type {
  CustomFieldStepDTO,
  CustomFieldSectionDTO,
  CustomData,
  CustomDataRow,
} from '../../services/customFieldsService';

interface CustomFieldsPanelProps {
  step: CustomFieldStepDTO;
  customData: CustomData;
  onChange: (data: CustomData) => void;
  disabled?: boolean;
  readOnly?: boolean;
  errors?: Record<string, string | Record<string, string>[]>;
  // Data sources
  catalogData?: Record<string, Array<{ value: string; label: string }>>;
  userData?: Array<{ id: string; name: string }>;
  // Loading state
  isLoading?: boolean;
}

export const CustomFieldsPanel = ({
  step,
  customData,
  onChange,
  disabled = false,
  readOnly = false,
  errors = {},
  catalogData = {},
  userData = [],
  isLoading = false,
}: CustomFieldsPanelProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  // Track collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(
      step.sections
        .filter((s) => s.defaultCollapsed)
        .map((s) => s.sectionCode)
    )
  );

  // Container styles
  const containerStyles = {
    p: 4,
    borderRadius: 'xl',
    bg: isDark ? 'rgba(30, 41, 59, 0.5)' : 'white',
    borderWidth: '1px',
    borderColor: isDark ? 'whiteAlpha.100' : 'gray.200',
  };

  // Section styles
  const sectionStyles = {
    p: 4,
    borderRadius: 'lg',
    bg: isDark ? 'whiteAlpha.50' : 'gray.50',
    borderWidth: '1px',
    borderColor: isDark ? 'whiteAlpha.100' : 'gray.100',
  };

  // Toggle section collapse
  const toggleSection = (sectionCode: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionCode)) {
        newSet.delete(sectionCode);
      } else {
        newSet.add(sectionCode);
      }
      return newSet;
    });
  };

  // Handle single field change
  const handleFieldChange = useCallback(
    (fieldCode: string, value: string | number | boolean | null) => {
      onChange({
        ...customData,
        [fieldCode]: value,
      });
    },
    [customData, onChange]
  );

  // Handle repeatable section change
  const handleSectionChange = useCallback(
    (sectionCode: string, rows: CustomDataRow[]) => {
      onChange({
        ...customData,
        [sectionCode]: rows,
      });
    },
    [customData, onChange]
  );

  // Get section data as rows
  const getSectionRows = (sectionCode: string): CustomDataRow[] => {
    const data = customData[sectionCode];
    if (Array.isArray(data)) {
      return data as CustomDataRow[];
    }
    return [];
  };

  // Get field value
  const getFieldValue = (fieldCode: string): string | number | boolean | null => {
    const value = customData[fieldCode];
    if (value === undefined) return null;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    return null;
  };

  // Get field error
  const getFieldError = (fieldCode: string): string | undefined => {
    const error = errors[fieldCode];
    if (typeof error === 'string') return error;
    return undefined;
  };

  // Get section errors
  const getSectionErrors = (sectionCode: string): Record<string, string>[] => {
    const error = errors[sectionCode];
    if (Array.isArray(error)) return error as Record<string, string>[];
    return [];
  };

  // Render a single section
  const renderSingleSection = (section: CustomFieldSectionDTO) => {
    const isCollapsed = collapsedSections.has(section.sectionCode);
    const sectionName = t(section.sectionNameKey, section.sectionCode);

    return (
      <Box key={section.sectionCode} {...sectionStyles}>
        {/* Section Header */}
        <HStack
          justify="space-between"
          mb={isCollapsed ? 0 : 4}
          cursor={section.collapsible ? 'pointer' : 'default'}
          onClick={() => section.collapsible && toggleSection(section.sectionCode)}
        >
          <Text fontWeight="semibold" color={colors.textColor}>
            {sectionName}
          </Text>
          {section.collapsible && (
            <IconButton
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
              size="sm"
              variant="ghost"
            >
              {isCollapsed ? <FiChevronDown /> : <FiChevronUp />}
            </IconButton>
          )}
        </HStack>

        {/* Section Content */}
        {section.collapsible ? (
          <Collapsible.Root open={!isCollapsed}>
            <Collapsible.Content>
              <SimpleGrid columns={section.columns || 2} gap={4}>
                {section.fields.map((field) => (
                  <Box
                    key={field.fieldCode}
                    gridColumn={field.spanColumns === 2 ? 'span 2' : 'auto'}
                  >
                    <DynamicCustomField
                      field={field}
                      value={getFieldValue(field.fieldCode)}
                      onChange={(value) => handleFieldChange(field.fieldCode, value)}
                      disabled={disabled}
                      readOnly={readOnly}
                      error={getFieldError(field.fieldCode)}
                      catalogData={
                        field.dataSourceCode ? catalogData[field.dataSourceCode] : undefined
                      }
                      userData={field.componentType === 'USER_LISTBOX' ? userData : undefined}
                    />
                  </Box>
                ))}
              </SimpleGrid>
            </Collapsible.Content>
          </Collapsible.Root>
        ) : (
          <SimpleGrid columns={section.columns || 2} gap={4}>
            {section.fields.map((field) => (
              <Box
                key={field.fieldCode}
                gridColumn={field.spanColumns === 2 ? 'span 2' : 'auto'}
              >
                <DynamicCustomField
                  field={field}
                  value={getFieldValue(field.fieldCode)}
                  onChange={(value) => handleFieldChange(field.fieldCode, value)}
                  disabled={disabled}
                  readOnly={readOnly}
                  error={getFieldError(field.fieldCode)}
                  catalogData={
                    field.dataSourceCode ? catalogData[field.dataSourceCode] : undefined
                  }
                  userData={field.componentType === 'USER_LISTBOX' ? userData : undefined}
                />
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>
    );
  };

  // Render a repeatable section
  const renderRepeatableSection = (section: CustomFieldSectionDTO) => (
    <RepeatableSection
      key={section.sectionCode}
      section={section}
      rows={getSectionRows(section.sectionCode)}
      onChange={(rows) => handleSectionChange(section.sectionCode, rows)}
      disabled={disabled}
      readOnly={readOnly}
      errors={getSectionErrors(section.sectionCode)}
      catalogData={catalogData}
      userData={userData}
    />
  );

  // Loading state
  if (isLoading) {
    return (
      <Box {...containerStyles} textAlign="center" py={8}>
        <Spinner size="lg" color="blue.400" />
        <Text mt={4} color={colors.textColor} opacity={0.7}>
          {t('common.loading', 'Cargando...')}
        </Text>
      </Box>
    );
  }

  // Empty state
  if (!step.sections || step.sections.length === 0) {
    return (
      <Box {...containerStyles}>
        <Alert.Root status="info">
          <Alert.Indicator>
            <FiAlertCircle />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>
              {t('customFields.noFields', 'No hay campos configurados')}
            </Alert.Title>
            <Alert.Description>
              {t(
                'customFields.noFieldsDescription',
                'Esta sección no tiene campos personalizados configurados.'
              )}
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      </Box>
    );
  }

  return (
    <Box {...containerStyles}>
      <VStack align="stretch" gap={4}>
        {step.sections.map((section) =>
          section.sectionType === 'REPEATABLE'
            ? renderRepeatableSection(section)
            : renderSingleSection(section)
        )}
      </VStack>
    </Box>
  );
};

export default CustomFieldsPanel;
