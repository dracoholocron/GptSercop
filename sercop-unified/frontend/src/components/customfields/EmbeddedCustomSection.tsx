/**
 * EmbeddedCustomSection Component
 * Renders custom field sections embedded within SWIFT forms
 */

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Collapsible,
  IconButton,
} from '@chakra-ui/react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { RepeatableSection } from './RepeatableSection';
import { DynamicCustomField } from './DynamicCustomField';
import type {
  CustomFieldSectionDTO,
  CustomData,
  CustomDataRow,
} from '../../services/customFieldsService';
import {
  getSectionsToEmbedAfter,
  getFieldsToEmbedAfter,
} from '../../services/customFieldsService';

interface EmbeddedCustomSectionProps {
  // The SWIFT section or field code this is embedded after
  embedAfterCode: string;
  embedType: 'SECTION' | 'FIELD';
  // Product context
  productType: string;
  tenantId?: string;
  // Data
  customData: CustomData;
  onChange: (data: CustomData) => void;
  // State
  disabled?: boolean;
  readOnly?: boolean;
  errors?: Record<string, string | Record<string, string>[]>;
  // Data sources
  catalogData?: Record<string, Array<{ value: string; label: string }>>;
  userData?: Array<{ id: string; name: string }>;
  // Visual variant: 'default' = full styling, 'clean' = minimal styling for expert mode
  variant?: 'default' | 'clean';
}

export const EmbeddedCustomSection = ({
  embedAfterCode,
  embedType,
  productType,
  tenantId,
  customData,
  onChange,
  disabled = false,
  readOnly = false,
  errors = {},
  catalogData = {},
  userData = [],
  variant = 'default',
}: EmbeddedCustomSectionProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const [sections, setSections] = useState<CustomFieldSectionDTO[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load embedded sections/fields
  useEffect(() => {
    const loadEmbeddedConfig = async () => {
      setIsLoading(true);
      try {
        if (embedType === 'SECTION') {
          const embeddedSections = await getSectionsToEmbedAfter(
            embedAfterCode,
            productType,
            tenantId
          );
          setSections(embeddedSections);
        }
        // For FIELD type, we'd load individual fields
      } catch (error) {
        console.error('Error loading embedded custom sections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmbeddedConfig();
  }, [embedAfterCode, embedType, productType, tenantId]);

  // Container styles - match the parent form styling
  const containerStyles = {
    mt: 4,
    mb: 2,
  };

  // Handle field change
  const handleFieldChange = (fieldCode: string, value: string | number | boolean | null) => {
    onChange({
      ...customData,
      [fieldCode]: value,
    });
  };

  // Handle section change
  const handleSectionChange = (sectionCode: string, rows: CustomDataRow[]) => {
    onChange({
      ...customData,
      [sectionCode]: rows,
    });
  };

  // Get section rows
  const getSectionRows = (sectionCode: string): CustomDataRow[] => {
    const data = customData[sectionCode];
    if (Array.isArray(data)) {
      return data as CustomDataRow[];
    }
    return [];
  };

  // Get section errors
  const getSectionErrors = (sectionCode: string): Record<string, string>[] => {
    const error = errors[sectionCode];
    if (Array.isArray(error)) return error as Record<string, string>[];
    return [];
  };

  // Don't render if no sections
  if (!isLoading && sections.length === 0) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return null; // Or a subtle loading indicator
  }

  // Clean variant: minimal styling for expert mode
  const isClean = variant === 'clean';

  // Helper to render sections content
  const renderSectionsContent = () => (
    <VStack align="stretch" gap={isClean ? 3 : 4}>
      {sections.map((section) => {
        // Safely get section title - handle potential object values
        const getSafeTitle = (key: unknown, fallback: string): string => {
          if (typeof key === 'string') return t(key, fallback);
          if (typeof key === 'object' && key !== null) {
            if ('label' in key) return String((key as { label: unknown }).label);
            if ('name' in key) return String((key as { name: unknown }).name);
          }
          return fallback;
        };

        // Get section-specific header from embed config
        const separatorTitle = section.embedSeparatorTitleKey
          ? getSafeTitle(section.embedSeparatorTitleKey, getSafeTitle(section.sectionNameKey, section.sectionCode))
          : getSafeTitle(section.sectionNameKey, section.sectionCode);

        if (section.sectionType === 'REPEATABLE') {
          return (
            <RepeatableSection
              key={section.sectionCode}
              section={{
                ...section,
                embedSeparatorTitleKey: undefined, // Already showing header above
                embedShowSeparator: !isClean, // Hide separator in clean mode
              }}
              rows={getSectionRows(section.sectionCode)}
              onChange={(rows) => handleSectionChange(section.sectionCode, rows)}
              disabled={disabled}
              readOnly={readOnly}
              errors={getSectionErrors(section.sectionCode)}
              catalogData={catalogData}
              userData={userData}
              variant={variant}
            />
          );
        }

        // Single section
        return (
          <Box
            key={section.sectionCode}
            p={isClean ? 0 : 3}
            borderRadius={isClean ? 'none' : 'md'}
            bg={isClean ? 'transparent' : (isDark ? 'whiteAlpha.50' : 'white')}
          >
            {!isClean && section.embedShowSeparator !== false && (
              <Text fontWeight="medium" color={colors.textColor} mb={3}>
                {separatorTitle}
              </Text>
            )}
            <VStack align="stretch" gap={3}>
              {section.fields.map((field) => (
                <Box key={field.fieldCode}>
                  <DynamicCustomField
                    field={field}
                    value={
                      customData[field.fieldCode] as
                        | string
                        | number
                        | boolean
                        | null
                    }
                    onChange={(value) => handleFieldChange(field.fieldCode, value)}
                    disabled={disabled}
                    readOnly={readOnly}
                    error={
                      typeof errors[field.fieldCode] === 'string'
                        ? (errors[field.fieldCode] as string)
                        : undefined
                    }
                    catalogData={
                      field.dataSourceCode
                        ? catalogData[field.dataSourceCode]
                        : undefined
                    }
                    userData={
                      field.componentType === 'USER_LISTBOX' ? userData : undefined
                    }
                  />
                </Box>
              ))}
            </VStack>
          </Box>
        );
      })}
    </VStack>
  );

  // Clean variant: render without collapsible header
  if (isClean) {
    return (
      <Box mt={2}>
        {renderSectionsContent()}
      </Box>
    );
  }

  // Default variant: full styling with collapsible header
  return (
    <Box {...containerStyles}>
      {/* Section Header - same style as other form sections */}
      <HStack
        justify="space-between"
        mb={isExpanded ? 3 : 0}
        cursor="pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        py={2}
        borderBottomWidth={isExpanded ? '1px' : '0'}
        borderColor={isDark ? 'whiteAlpha.200' : 'gray.200'}
      >
        <Text fontWeight="semibold" fontSize="md" color={colors.textColor}>
          {t('customFields.additionalInfo', 'Información Adicional')}
        </Text>

        <IconButton
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          size="sm"
          variant="ghost"
        >
          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
        </IconButton>
      </HStack>

      {/* Content */}
      <Collapsible.Root open={isExpanded}>
        <Collapsible.Content>
          {renderSectionsContent()}
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};

export default EmbeddedCustomSection;
