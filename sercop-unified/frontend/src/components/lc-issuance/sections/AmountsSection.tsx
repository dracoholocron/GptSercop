import { Box, VStack, Heading, Text, Card, Flex } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { DynamicSwiftSection } from '../../DynamicSwiftSection';
import type { SectionProps } from '../types';

/**
 * Sección de Montos y Fechas (Paso 2)
 * Renderiza campos SWIFT de las secciones: MONTOS, FECHAS
 */
export const AmountsSection: React.FC<SectionProps> = ({
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
            {t('common.stepHeader', { number: 2, name: t('lcImportWizard.steps.amountsAndDates') })}
          </Heading>
          <Text color={colors.textColorSecondary} fontSize="sm">
            {t('common.defineFinancialAspects')}
          </Text>
        </Box>
      )}

      {mode === 'expert' && (
        <Box borderBottom="2px solid" borderColor={colors.primaryColor} pb={2} mb={4}>
          <Heading size="md" color={colors.textColor}>
            2. {t('lcImportWizard.steps.amountsAndDates')}
          </Heading>
        </Box>
      )}

      {/* Campos dinámicos de la sección MONTOS */}
      <DynamicSwiftSection
        messageType="MT700"
        section="AMOUNTS"
        sectionTitle={mode === 'wizard' ? t('common.amountsAndTolerances') : undefined}
        formData={swiftFieldsData}
        onChange={onSwiftFieldChange}
        columns={2}
        showOptionalFields={showOptionalFields}
        variant={mode === 'expert' ? 'clean' : 'default'}
      />

      {/* Campos dinámicos de la sección FECHAS */}
      <DynamicSwiftSection
        messageType="MT700"
        section="DATES"
        sectionTitle={mode === 'wizard' ? 'Fechas' : undefined}
        formData={swiftFieldsData}
        onChange={onSwiftFieldChange}
        columns={2}
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
                  Recomendación de Fechas
                </Text>
                <Text color={colors.textColorSecondary} fontSize="xs" mt={1}>
                  La fecha de vencimiento debe considerar: tiempo de producción, tiempo de embarque,
                  tiempo de tránsito y tiempo para preparar documentos. Se recomienda dejar al menos
                  15-21 días después del último día permitido para el embarque.
                </Text>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
};

export default AmountsSection;
