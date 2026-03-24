import { Box, VStack, Heading, Text, Card, Flex } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import { useTheme } from '../../../contexts/ThemeContext';
import { DynamicSwiftSection } from '../../DynamicSwiftSection';
import type { SectionProps } from '../types';

/**
 * Sección de Información Adicional para Garantías (Paso 5)
 * Renderiza campos SWIFT de la sección: ADICIONAL
 */
export const AdditionalInfoSection: React.FC<SectionProps> = ({
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
            Paso 5: Información Adicional
          </Heading>
          <Text color={colors.textColorSecondary} fontSize="sm">
            Agregue referencias y observaciones adicionales
          </Text>
        </Box>
      )}

      {mode === 'expert' && (
        <Box borderBottom="2px solid" borderColor={colors.primaryColor} pb={2} mb={4}>
          <Heading size="md" color={colors.textColor}>
            5. Información Adicional
          </Heading>
        </Box>
      )}

      {/* Campos dinámicos de la sección ADICIONAL */}
      <DynamicSwiftSection
        messageType="MT760"
        section="ADDITIONAL"
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
                  Referencias del Contrato
                </Text>
                <Text color={colors.textColorSecondary} fontSize="xs" mt={1}>
                  Incluya el número de contrato, licitación o proyecto relacionado.
                  Esta información facilita la identificación y seguimiento de la garantía
                  tanto para el banco como para las partes involucradas.
                </Text>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
};

export default AdditionalInfoSection;
