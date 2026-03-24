/**
 * CMXChat - Versión simplificada para debugging
 */

import { Box, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

export const CMXChatSimple = () => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  return (
    <Box p={8}>
      <VStack spacing={4}>
        <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>
          {t('ai.chat.title')}
        </Text>
        <Text color={colors.textColorSecondary}>
          Chat CMX - Versión de prueba
        </Text>
      </VStack>
    </Box>
  );
};





