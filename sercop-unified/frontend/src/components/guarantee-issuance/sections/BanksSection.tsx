import { Box, VStack, Heading, Text, Card, Flex } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import { useTheme } from '../../../contexts/ThemeContext';
import { DynamicSwiftSection } from '../../DynamicSwiftSection';
import type { SectionProps } from '../types';

/**
 * Sección de Bancos Participantes para Garantías (Paso 3)
 * Renderiza campos SWIFT de la sección: BANCOS
 */
export const BanksSection: React.FC<SectionProps> = ({
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
            Paso 3: Bancos Participantes
          </Heading>
          <Text color={colors.textColorSecondary} fontSize="sm">
            Seleccione las instituciones financieras que participan en la garantía
          </Text>
        </Box>
      )}

      {mode === 'expert' && (
        <Box borderBottom="2px solid" borderColor={colors.primaryColor} pb={2} mb={4}>
          <Heading size="md" color={colors.textColor}>
            3. Bancos Participantes
          </Heading>
        </Box>
      )}

      {/* Campos dinámicos de la sección BANCOS */}
      <DynamicSwiftSection
        messageType="MT760"
        section="BANKS"
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
                  Bancos en Garantías
                </Text>
                <Text color={colors.textColorSecondary} fontSize="xs" mt={1}>
                  El Banco Emisor es quien emite y garantiza el compromiso. El Banco Notificador
                  comunica la garantía al beneficiario. Un Banco Confirmador puede agregar su propia
                  garantía, brindando mayor seguridad al beneficiario.
                </Text>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
};

export default BanksSection;
