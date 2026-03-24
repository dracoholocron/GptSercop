/**
 * AISearchResults - Display filtered search results with category badges
 */

import { Box, VStack, HStack, Text, Badge, Icon } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { type AIOption, type AICategory } from '../../config/aiCategories';

interface AISearchResultsProps {
  query: string;
  results: Array<{ option: AIOption; category: AICategory }>;
  onOptionSelect: (option: AIOption, category: AICategory) => void;
}

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  blue: 'blue',
  green: 'green',
  purple: 'purple',
  orange: 'orange',
  teal: 'teal',
  cyan: 'cyan',
};

export const AISearchResults = ({ query, results, onOptionSelect }: AISearchResultsProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  if (results.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color={colors.textColorSecondary}>
          {t('ai.noResults', { query })}
        </Text>
      </Box>
    );
  }

  return (
    <VStack gap={3} align="stretch">
      <Text fontSize="sm" color={colors.textColorSecondary} mb={2}>
        {t('ai.searchResults', { query })}
      </Text>
      {results.map(({ option, category }) => {
        const OptionIcon = option.icon;
        const badgeColor = CATEGORY_BADGE_COLORS[category.color] || 'gray';

        return (
          <Box
            key={`${category.id}-${option.id}`}
            as="button"
            p={4}
            bg={colors.cardBg}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={colors.borderColor}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              bg: colors.bgColor,
              borderColor: 'purple.300',
            }}
            onClick={() => onOptionSelect(option, category)}
            textAlign="left"
            w="100%"
          >
            <HStack justify="space-between" align="start">
              <HStack gap={3}>
                <Box p={2} bg={`${category.color}.50`} borderRadius="md">
                  <Icon as={OptionIcon} boxSize={5} color={`${category.color}.600`} />
                </Box>
                <Box>
                  <Text fontWeight="medium" color={colors.textColor}>
                    {t(option.titleKey)}
                  </Text>
                  <Text fontSize="sm" color={colors.textColorSecondary} mt={0.5}>
                    {t(option.descriptionKey)}
                  </Text>
                </Box>
              </HStack>
              <Badge colorPalette={badgeColor} variant="subtle" fontSize="xs">
                {t(category.titleKey)}
              </Badge>
            </HStack>
          </Box>
        );
      })}
    </VStack>
  );
};

export default AISearchResults;
