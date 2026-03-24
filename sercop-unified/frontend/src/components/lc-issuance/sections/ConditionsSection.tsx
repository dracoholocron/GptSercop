import { Box, VStack, Heading, Text, Card, Flex } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { DynamicSwiftSection } from '../../DynamicSwiftSection';
import type { SectionProps } from '../types';

/**
 * Sección de Condiciones Especiales (Paso 6)
 * Renderiza campos SWIFT de la sección: CONDICIONES
 */
export const ConditionsSection: React.FC<SectionProps> = ({
  mode,
  swiftFieldsData,
  onSwiftFieldChange,
  showHelp = true,
  showOptionalFields = true,
}) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  return (
    <VStack gap={6} align="stretch">
      {mode === 'wizard' && (
        <Box>
          <Heading size="lg" color={colors.textColor} mb={2}>
            {t('common.stepHeader', { number: 6, name: t('lcImportWizard.steps.specialConditions') })}
          </Heading>
          <Text color={colors.textColorSecondary} fontSize="sm">
            {t('common.defineSpecialConditions')}
          </Text>
        </Box>
      )}

      {mode === 'expert' && (
        <Box borderBottom="2px solid" borderColor={colors.primaryColor} pb={2} mb={4}>
          <Heading size="md" color={colors.textColor}>
            6. {t('lcImportWizard.steps.specialConditions')}
          </Heading>
        </Box>
      )}

      {/* Campos dinámicos de la sección CONDICIONES */}
      <DynamicSwiftSection
        messageType="MT700"
        section="CONDITIONS"
        sectionTitle={mode === 'wizard' ? t('common.specialConditions') : undefined}
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
                  Condiciones Adicionales
                </Text>
                <Text color={colors.textColorSecondary} fontSize="xs" mt={1}>
                  Las condiciones especiales pueden incluir instrucciones específicas para el pago,
                  requisitos adicionales de documentación, o condiciones particulares del contrato comercial.
                </Text>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
};

export default ConditionsSection;
