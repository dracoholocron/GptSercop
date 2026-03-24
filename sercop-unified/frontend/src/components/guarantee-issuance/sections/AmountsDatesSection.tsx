import { Box, VStack, Heading, Text, Card, Flex } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import { useTheme } from '../../../contexts/ThemeContext';
import { DynamicSwiftSection } from '../../DynamicSwiftSection';
import type { SectionProps } from '../types';

/**
 * Sección de Montos y Fechas para Garantías (Paso 2)
 * Renderiza campos SWIFT de las secciones: MONTOS, FECHAS
 */
export const AmountsDatesSection: React.FC<SectionProps> = ({
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
            Paso 2: Montos y Fechas
          </Heading>
          <Text color={colors.textColorSecondary} fontSize="sm">
            Defina el monto y vigencia de la garantía
          </Text>
        </Box>
      )}

      {mode === 'expert' && (
        <Box borderBottom="2px solid" borderColor={colors.primaryColor} pb={2} mb={4}>
          <Heading size="md" color={colors.textColor}>
            2. Montos y Fechas
          </Heading>
        </Box>
      )}

      {/* Campos dinámicos de la sección MONTOS */}
      <DynamicSwiftSection
        messageType="MT760"
        section="AMOUNTS"
        sectionTitle={mode === 'wizard' ? 'Monto de la Garantía' : undefined}
        formData={swiftFieldsData}
        onChange={onSwiftFieldChange}
        columns={mode === 'expert' ? 2 : 1}
        showOptionalFields={showOptionalFields}
        variant={mode === 'expert' ? 'clean' : 'default'}
      />

      {/* Campos dinámicos de la sección FECHAS */}
      <DynamicSwiftSection
        messageType="MT760"
        section="DATES"
        sectionTitle={mode === 'wizard' ? 'Fechas de Vigencia' : undefined}
        formData={swiftFieldsData}
        onChange={onSwiftFieldChange}
        columns={mode === 'expert' ? 2 : 1}
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
                  Montos Típicos de Garantías
                </Text>
                <Text color={colors.textColorSecondary} fontSize="xs" mt={1}>
                  Performance Bond: típicamente 10-20% del valor del contrato.
                  Advance Payment: 100% del anticipo recibido.
                  Bid Bond: 2-5% del valor de la oferta.
                  La reducción automática permite disminuir el monto según avance del proyecto.
                </Text>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
};

export default AmountsDatesSection;
