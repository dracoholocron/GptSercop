/**
 * DocumentCategorySelector - Hierarchical category and type selection
 */

import { useMemo } from 'react';
import { VStack, HStack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { DocumentCategory, DocumentType } from '../../types/documents';

interface DocumentCategorySelectorProps {
  categories: DocumentCategory[];
  documentTypes: DocumentType[];
  selectedCategory: string;
  selectedSubcategory?: string;
  selectedDocumentType: string;
  onCategoryChange: (categoryCode: string) => void;
  onSubcategoryChange?: (subcategoryCode: string) => void;
  onDocumentTypeChange: (typeCode: string) => void;
  language?: 'es' | 'en';
  disabled?: boolean;
}

export const DocumentCategorySelector = ({
  categories,
  documentTypes,
  selectedCategory,
  selectedSubcategory,
  selectedDocumentType,
  onCategoryChange,
  onSubcategoryChange,
  onDocumentTypeChange,
  language = 'es',
  disabled = false,
}: DocumentCategorySelectorProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  // Get name based on language
  const getName = (item: { nameEs: string; nameEn: string }) => {
    return language === 'en' ? item.nameEn : item.nameEs;
  };

  // Filter types by selected category
  const filteredTypes = useMemo(() => {
    if (!selectedCategory) return [];
    return documentTypes.filter(type => type.categoryCode === selectedCategory);
  }, [documentTypes, selectedCategory]);

  // Get subcategories for selected category
  const subcategories = useMemo(() => {
    if (!selectedCategory) return [];
    const category = categories.find(c => c.code === selectedCategory);
    return category?.children || [];
  }, [categories, selectedCategory]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onCategoryChange(value);
    // Reset dependent selections
    onSubcategoryChange?.('');
    onDocumentTypeChange('');
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSubcategoryChange?.(e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onDocumentTypeChange(e.target.value);
  };

  const selectStyles = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${colors.borderColor}`,
    backgroundColor: colors.cardBg,
    color: colors.textColor,
    fontSize: '14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <VStack gap={3} align="stretch">
      {/* Category Selection */}
      <VStack align="stretch" gap={1}>
        <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
          {t('documents.category')} *
        </Text>
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          disabled={disabled}
          style={selectStyles}
        >
          <option value="">{t('documents.selectCategory')}</option>
          {categories.map(category => (
            <option key={category.code} value={category.code}>
              {getName(category)}
            </option>
          ))}
        </select>
      </VStack>

      {/* Subcategory Selection (if available) */}
      {subcategories.length > 0 && (
        <VStack align="stretch" gap={1}>
          <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
            {t('documents.subcategory')}
          </Text>
          <select
            value={selectedSubcategory || ''}
            onChange={handleSubcategoryChange}
            disabled={disabled}
            style={selectStyles}
          >
            <option value="">{t('documents.selectSubcategory')}</option>
            {subcategories.map(sub => (
              <option key={sub.code} value={sub.code}>
                {getName(sub)}
              </option>
            ))}
          </select>
        </VStack>
      )}

      {/* Document Type Selection */}
      <VStack align="stretch" gap={1}>
        <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
          {t('documents.documentType')} *
        </Text>
        <select
          value={selectedDocumentType}
          onChange={handleTypeChange}
          disabled={disabled || !selectedCategory}
          style={{
            ...selectStyles,
            opacity: !selectedCategory ? 0.5 : (disabled ? 0.6 : 1),
          }}
        >
          <option value="">
            {selectedCategory
              ? t('documents.selectDocumentType')
              : t('documents.selectCategoryFirst')}
          </option>
          {filteredTypes.map(type => (
            <option key={type.code} value={type.code}>
              {getName(type)}
            </option>
          ))}
        </select>
      </VStack>
    </VStack>
  );
};

export default DocumentCategorySelector;
