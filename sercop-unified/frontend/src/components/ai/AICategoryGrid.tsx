/**
 * AICategoryGrid - Grid of category cards for guided AI navigation
 */

import { SimpleGrid, Box, Text, VStack, Icon } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { AI_CATEGORIES, type AICategory } from '../../config/aiCategories';

interface AICategoryGridProps {
  onCategorySelect: (category: AICategory) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; icon: string; hover: string }> = {
  blue: { bg: 'blue.50', border: 'blue.200', icon: 'blue.600', hover: 'blue.100' },
  green: { bg: 'green.50', border: 'green.200', icon: 'green.600', hover: 'green.100' },
  purple: { bg: 'purple.50', border: 'purple.200', icon: 'purple.600', hover: 'purple.100' },
  orange: { bg: 'orange.50', border: 'orange.200', icon: 'orange.600', hover: 'orange.100' },
  teal: { bg: 'teal.50', border: 'teal.200', icon: 'teal.600', hover: 'teal.100' },
  cyan: { bg: 'cyan.50', border: 'cyan.200', icon: 'cyan.600', hover: 'cyan.100' },
};

export const AICategoryGrid = ({ onCategorySelect }: AICategoryGridProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4}>
      {AI_CATEGORIES.map((category) => {
        const colorScheme = CATEGORY_COLORS[category.color] || CATEGORY_COLORS.blue;
        const CategoryIcon = category.icon;

        return (
          <Box
            key={category.id}
            as="button"
            p={5}
            bg={colorScheme.bg}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={colorScheme.border}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              bg: colorScheme.hover,
              transform: 'translateY(-2px)',
              shadow: 'md',
            }}
            _active={{ transform: 'translateY(0)' }}
            onClick={() => onCategorySelect(category)}
            textAlign="left"
          >
            <VStack align="start" gap={3}>
              <Box
                p={3}
                bg="white"
                borderRadius="lg"
                shadow="sm"
              >
                <Icon
                  as={CategoryIcon}
                  boxSize={6}
                  color={colorScheme.icon}
                />
              </Box>
              <Box>
                <Text fontWeight="semibold" fontSize="md" color={colors.textColor}>
                  {t(category.titleKey)}
                </Text>
                <Text fontSize="sm" color={colors.textColorSecondary} mt={1}>
                  {t(category.descriptionKey)}
                </Text>
              </Box>
            </VStack>
          </Box>
        );
      })}
    </SimpleGrid>
  );
};

export default AICategoryGrid;
