import {
  Box,
  VStack,
  Heading,
  Text,
  Flex,
  Button,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { FiSave, FiCheck, FiArrowUp } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import type { ModeConfig } from '../types';

interface ExpertLayoutProps {
  modeConfig: ModeConfig;
  onSaveDraft?: (() => void) | undefined;
  onSubmit?: (() => void) | undefined;
  isSubmitting: boolean;
  title?: string;
  readOnly?: boolean;
  children: React.ReactNode;
}

/**
 * Layout para el modo Experto de Garantías (scroll continuo)
 * Todo el contenido visible en una sola página con acciones flotantes
 */
export const ExpertLayout: React.FC<ExpertLayoutProps> = ({
  modeConfig,
  onSaveDraft,
  onSubmit,
  isSubmitting,
  title,
  readOnly = false,
  children,
}) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Detectar scroll para mostrar botón "Ir arriba"
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box flex={1} p={6}>
      <VStack gap={6} align="stretch">
        {/* Header fijo */}
        <Box
          position="sticky"
          top={0}
          zIndex={10}
          bg={colors.bgColor}
          pb={4}
          borderBottom="1px solid"
          borderColor={colors.borderColor}
        >
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="xl" color={colors.textColor} mb={1}>
                {title || t('expertMode.guaranteeTitle')}
              </Heading>
              <Text color={colors.textColorSecondary} fontSize="sm">
                {t('expertMode.subtitle')}
              </Text>
            </Box>

            {!readOnly && (
              <HStack gap={3}>
                <Button
                  onClick={onSaveDraft}
                  variant="outline"
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                  size="md"
                  disabled={isSubmitting}
                >
                  <FiSave />
                  Guardar Borrador
                </Button>
                <Button
                  onClick={onSubmit}
                  bg="green.500"
                  color="white"
                  size="md"
                  _hover={{ opacity: 0.9 }}
                  disabled={isSubmitting}
                >
                  <FiCheck />
                  Emitir Garantía
                </Button>
              </HStack>
            )}
          </Flex>
        </Box>

        {/* Contenido scrollable */}
        <Box
          bg={colors.cardBg}
          borderRadius="lg"
          border="1px"
          borderColor={colors.borderColor}
          p={8}
        >
          {children}
        </Box>

        {/* Acciones flotantes inferiores */}
        {modeConfig.showFloatingActions && (
          <Box
            position="fixed"
            bottom={6}
            right={6}
            zIndex={20}
          >
            <VStack gap={3}>
              {/* Botón Ir Arriba */}
              {showScrollTop && (
                <IconButton
                  aria-label="Ir arriba"
                  onClick={scrollToTop}
                  bg={colors.cardBg}
                  border="1px solid"
                  borderColor={colors.borderColor}
                  borderRadius="full"
                  size="lg"
                  boxShadow="lg"
                  _hover={{ transform: 'scale(1.1)' }}
                >
                  <FiArrowUp />
                </IconButton>
              )}

              {/* Botones de acción flotantes */}
              {!readOnly && (
                <HStack
                  bg={colors.cardBg}
                  p={3}
                  borderRadius="lg"
                  boxShadow="xl"
                  border="1px solid"
                  borderColor={colors.borderColor}
                >
                  <Button
                    onClick={onSaveDraft}
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    <FiSave />
                    Guardar
                  </Button>
                  <Button
                    onClick={onSubmit}
                    bg="green.500"
                    color="white"
                    size="sm"
                    _hover={{ opacity: 0.9 }}
                    disabled={isSubmitting}
                  >
                    <FiCheck />
                    Emitir
                  </Button>
                </HStack>
              )}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default ExpertLayout;
