/**
 * AIOptionsList - List of options within a selected category
 */

import { useState } from 'react';
import { Box, VStack, HStack, Text, Icon, Input, Button } from '@chakra-ui/react';
import { FiArrowLeft } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { type AICategory, type AIOption } from '../../config/aiCategories';

interface AIOptionsListProps {
  category: AICategory;
  onBack: () => void;
  onExecute: (option: AIOption, inputValue?: string) => void;
  loading?: boolean;
}

export const AIOptionsList = ({ category, onBack, onExecute, loading }: AIOptionsListProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const [expandedOption, setExpandedOption] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const CategoryIcon = category.icon;

  const handleOptionClick = (option: AIOption) => {
    if (option.requiresInput) {
      setExpandedOption(expandedOption === option.id ? null : option.id);
    } else {
      onExecute(option);
    }
  };

  const handleInputChange = (optionId: string, value: string) => {
    setInputValues(prev => ({ ...prev, [optionId]: value }));
  };

  const handleSubmit = (option: AIOption) => {
    const value = inputValues[option.id];
    if (value?.trim()) {
      onExecute(option, value.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, option: AIOption) => {
    if (e.key === 'Enter') {
      handleSubmit(option);
    }
  };

  return (
    <VStack gap={4} align="stretch">
      {/* Back button and category header */}
      <HStack gap={3}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          leftIcon={<FiArrowLeft />}
        >
          {t('ai.back')}
        </Button>
      </HStack>

      <HStack gap={3} mb={2}>
        <Box p={3} bg={`${category.color}.100`} borderRadius="lg">
          <Icon as={CategoryIcon} boxSize={6} color={`${category.color}.600`} />
        </Box>
        <Box>
          <Text fontWeight="semibold" fontSize="lg" color={colors.textColor}>
            {t(category.titleKey)}
          </Text>
          <Text fontSize="sm" color={colors.textColorSecondary}>
            {t(category.descriptionKey)}
          </Text>
        </Box>
      </HStack>

      <Text fontSize="sm" color={colors.textColorSecondary}>
        {t('ai.selectOption')}
      </Text>

      {/* Options list */}
      <VStack gap={3} align="stretch">
        {category.options.map((option) => {
          const OptionIcon = option.icon;
          const isExpanded = expandedOption === option.id;
          const inputValue = inputValues[option.id] || '';

          return (
            <Box
              key={option.id}
              bg={colors.cardBg}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={isExpanded ? `${category.color}.300` : colors.borderColor}
              overflow="hidden"
              transition="all 0.2s"
            >
              <Box
                as="button"
                p={4}
                w="100%"
                textAlign="left"
                cursor="pointer"
                _hover={{ bg: colors.bgColor }}
                onClick={() => handleOptionClick(option)}
                disabled={loading}
              >
                <HStack gap={3}>
                  <Box p={2} bg={`${category.color}.50`} borderRadius="md">
                    <Icon as={OptionIcon} boxSize={5} color={`${category.color}.600`} />
                  </Box>
                  <Box flex={1}>
                    <Text fontWeight="medium" color={colors.textColor}>
                      {t(option.titleKey)}
                    </Text>
                    <Text fontSize="sm" color={colors.textColorSecondary}>
                      {t(option.descriptionKey)}
                    </Text>
                  </Box>
                </HStack>
              </Box>

              {/* Input field for options that require input */}
              {option.requiresInput && isExpanded && (
                <Box p={4} pt={0} borderTop="1px" borderColor={colors.borderColor}>
                  <VStack gap={3} align="stretch">
                    <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                      {t(option.inputConfig?.labelKey || '')}
                    </Text>
                    <HStack gap={2}>
                      {option.inputConfig?.type === 'select' && option.inputConfig?.selectOptions ? (
                        <Box flex={1}>
                          <select
                            value={inputValue}
                            onChange={(e) => handleInputChange(option.id, e.target.value)}
                            disabled={loading}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: `1px solid ${colors.borderColor}`,
                              backgroundColor: colors.bgColor,
                              color: colors.textColor,
                              fontSize: '14px',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="">{t('ai.selectPeriod')}</option>
                            {option.inputConfig.selectOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {t(opt.labelKey)}
                              </option>
                            ))}
                          </select>
                        </Box>
                      ) : (
                        <Input
                          value={inputValue}
                          onChange={(e) => handleInputChange(option.id, e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, option)}
                          placeholder={option.inputConfig?.placeholderKey || ''}
                          size="md"
                          bg={colors.bgColor}
                          borderColor={colors.borderColor}
                          _focus={{
                            borderColor: `${category.color}.500`,
                            boxShadow: `0 0 0 1px var(--chakra-colors-${category.color}-500)`,
                          }}
                          disabled={loading}
                        />
                      )}
                      <Button
                        colorPalette={category.color}
                        onClick={() => handleSubmit(option)}
                        disabled={!inputValue.trim() || loading}
                        loading={loading}
                      >
                        {t('ai.execute')}
                      </Button>
                    </HStack>
                    {option.inputConfig?.exampleKey && (
                      <Text fontSize="xs" color={colors.textColorSecondary}>
                        {t(option.inputConfig.exampleKey)}
                      </Text>
                    )}
                  </VStack>
                </Box>
              )}
            </Box>
          );
        })}
      </VStack>
    </VStack>
  );
};

export default AIOptionsList;
