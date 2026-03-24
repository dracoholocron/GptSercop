/**
 * AIQuickActions - Quick action chips for common queries
 */

import { Box, HStack, Button } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { AI_QUICK_ACTIONS, type AIQuickAction } from '../../config/aiCategories';

interface AIQuickActionsProps {
  onActionClick: (action: AIQuickAction) => void;
  loading?: boolean;
}

export const AIQuickActions = ({ onActionClick, loading }: AIQuickActionsProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  return (
    <Box>
      <Box
        fontSize="xs"
        color={colors.textColorSecondary}
        textTransform="uppercase"
        fontWeight="semibold"
        letterSpacing="wider"
        mb={3}
      >
        {t('ai.quickActions')}
      </Box>
      <HStack gap={2} flexWrap="wrap">
        {AI_QUICK_ACTIONS.map((action) => (
          <Button
            key={action.id}
            size="sm"
            variant="outline"
            colorPalette="purple"
            borderRadius="full"
            onClick={() => onActionClick(action)}
            disabled={loading}
            _hover={{
              bg: 'purple.50',
            }}
          >
            {t(action.labelKey)}
          </Button>
        ))}
      </HStack>
    </Box>
  );
};

export default AIQuickActions;
