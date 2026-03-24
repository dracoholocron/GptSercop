import { Box, VStack, Heading, Text, Card, Flex } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import { useTheme } from '../../../contexts/ThemeContext';
import { DynamicSwiftSection } from '../../DynamicSwiftSection';
import type { SectionProps } from '../types';

/**
 * Sección de Términos y Condiciones para Garantías (Paso 4)
 * Renderiza campos SWIFT de la sección: TERMINOS
 */
export const TermsSection: React.FC<SectionProps> = ({
  mode,
  swiftFieldsData,
  onSwiftFieldChange,
  showHelp = true,
  showOptionalFields = true,
}) => {
  const { getColors } = useTheme();
  const colors = getColors();

  return (
    <VStack gap={6} align="stretch">
      {mode === 'wizard' && (
        <Box>
          <Heading size="lg" color={colors.textColor} mb={2}>
            Paso 4: Términos y Condiciones
          </Heading>
          <Text color={colors.textColorSecondary} fontSize="sm">
            Defina los términos, condiciones y documentos requeridos para la ejecución
          </Text>
        </Box>
      )}

      {mode === 'expert' && (
        <Box borderBottom="2px solid" borderColor={colors.primaryColor} pb={2} mb={4}>
          <Heading size="md" color={colors.textColor}>
            4. Términos y Condiciones
          </Heading>
        </Box>
      )}

      {/* Campos dinámicos de la sección TERMINOS */}
      <DynamicSwiftSection
        messageType="MT760"
        section="TERMS"
        formData={swiftFieldsData}
        onChange={onSwiftFieldChange}
        columns={1}
        showOptionalFields={showOptionalFields}
        variant={mode === 'expert' ? 'clean' : 'default'}
      />

      {/* Ayuda contextual */}
      {showHelp && mode !== 'expert' && (
        <Card.Root bg={colors.activeBg} border="1px" borderColor={colors.borderColor}>
          <Card.Body p={4}>
            <Flex gap={3}>
              <FiInfo size={20} color={colors.activeColor} />
              <Box>
                <Text fontWeight="semibold" color={colors.textColor} fontSize="sm">
                  Condiciones de Ejecución
                </Text>
                <Text color={colors.textColorSecondary} fontSize="xs" mt={1}>
                  Los términos definen bajo qué circunstancias el beneficiario puede reclamar el pago.
                  Puede ser a simple demanda (on first demand) o contra presentación de documentos
                  específicos que demuestren incumplimiento.
                </Text>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
};

export default TermsSection;
