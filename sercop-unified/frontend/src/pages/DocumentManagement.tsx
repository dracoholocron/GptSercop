import { Box, VStack, Text, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

export const DocumentManagement = () => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const { bgColor, borderColor, cardBg, textColor, textColorSecondary } = colors;

  return (
    <Box flex={1} p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color={textColor}>
              Gestión Documental
            </Text>
            <Text fontSize="sm" color={textColorSecondary} mt={1}>
              Sistema integral de gestión de documentos de comercio exterior
            </Text>
          </Box>
        </Flex>

        {/* Content */}
        <Box
          bg={cardBg}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
          p={6}
        >
          <Text color={textColor}>
            Contenido de Gestión Documental
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};
