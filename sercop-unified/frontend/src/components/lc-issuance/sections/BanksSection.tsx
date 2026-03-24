import { Box, VStack, Heading, Text, Card, Flex } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { DynamicSwiftSection } from '../../DynamicSwiftSection';
import type { SectionProps } from '../types';

/**
 * Sección de Bancos Participantes (Paso 3)
 * Renderiza campos SWIFT de la sección: BANCOS
 */
export const BanksSection: React.FC<SectionProps> = ({
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
            {t('common.stepHeader', { number: 3, name: t('lcImportWizard.steps.participatingBanks') })}
          </Heading>
          <Text color={colors.textColorSecondary} fontSize="sm">
            {t('common.configureParticipatingBanks')}
          </Text>
        </Box>
      )}

      {mode === 'expert' && (
        <Box borderBottom="2px solid" borderColor={colors.primaryColor} pb={2} mb={4}>
          <Heading size="md" color={colors.textColor}>
            3. {t('lcImportWizard.steps.participatingBanks')}
          </Heading>
        </Box>
      )}

      {/* Campos dinámicos de la sección BANCOS */}
      <DynamicSwiftSection
        messageType="MT700"
        section="BANKS"
        sectionTitle={mode === 'wizard' ? t('common.participatingBanks') : undefined}
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
                  Roles de los Bancos
                </Text>
                <Text color={colors.textColorSecondary} fontSize="xs" mt={1}>
                  Banco Emisor: Emite la LC y garantiza el pago. Banco Notificador: Notifica al beneficiario.
                  Banco Confirmador: Añade su garantía de pago (opcional). Otros bancos pueden participar
                  según la estructura de la transacción.
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
