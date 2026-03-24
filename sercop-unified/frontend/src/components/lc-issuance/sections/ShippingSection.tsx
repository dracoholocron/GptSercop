import { Box, VStack, Heading, Text, Card, Flex } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { DynamicSwiftSection } from '../../DynamicSwiftSection';
import type { SectionProps } from '../types';

/**
 * Sección de Detalles de Embarque (Paso 4)
 * Renderiza campos SWIFT de la sección: TRANSPORTE
 */
export const ShippingSection: React.FC<SectionProps> = ({
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
            {t('common.stepHeader', { number: 4, name: t('lcImportWizard.steps.shipmentDetails') })}
          </Heading>
          <Text color={colors.textColorSecondary} fontSize="sm">
            {t('common.configureShipmentDetails')}
          </Text>
        </Box>
      )}

      {mode === 'expert' && (
        <Box borderBottom="2px solid" borderColor={colors.primaryColor} pb={2} mb={4}>
          <Heading size="md" color={colors.textColor}>
            4. {t('lcImportWizard.steps.shipmentDetails')}
          </Heading>
        </Box>
      )}

      {/* Campos dinámicos de la sección TRANSPORTE */}
      <DynamicSwiftSection
        messageType="MT700"
        section="TRANSPORT"
        sectionTitle={mode === 'wizard' ? t('common.shipmentDetails') : undefined}
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
                  Incoterms y Transporte
                </Text>
                <Text color={colors.textColorSecondary} fontSize="xs" mt={1}>
                  Los Incoterms definen responsabilidades entre comprador y vendedor. FOB (Free On Board),
                  CIF (Cost, Insurance & Freight) y CFR (Cost & Freight) son los más comunes en LCs.
                </Text>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
};

export default ShippingSection;
