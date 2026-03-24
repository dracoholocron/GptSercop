import { Box, VStack, Heading, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { SwiftMessageViewer } from '../../swift/SwiftMessageViewer';
import type { IssuanceMode, SelectedEntities } from '../types';
import type { SwiftFieldConfig } from '../../../types/swiftField';

interface SwiftPreviewSectionProps {
  mode: IssuanceMode;
  swiftFieldsData: Record<string, any>;
  selectedEntities: SelectedEntities;
  /** Configuraciones de campos SWIFT desde swift_field_config_readmodel */
  fieldConfigs: SwiftFieldConfig[];
}

/**
 * Sección de Vista Previa del Mensaje SWIFT (Paso 8)
 * Muestra el mensaje MT700 formateado
 */
export const SwiftPreviewSection: React.FC<SwiftPreviewSectionProps> = ({
  mode,
  swiftFieldsData,
  selectedEntities,
  fieldConfigs,
}) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  // Obtener nombre completo del ordenante
  const applicantName = selectedEntities.ordenante?.nombreCompleto
    || selectedEntities.ordenante?.razonSocial
    || 'N/A';

  // Obtener nombre completo del beneficiario
  const beneficiaryName = selectedEntities.beneficiario?.nombreCompleto
    || selectedEntities.beneficiario?.razonSocial
    || 'N/A';

  return (
    <VStack gap={6} align="stretch">
      {mode === 'wizard' && (
        <Box>
          <Heading size="lg" color={colors.textColor} mb={2}>
            {t('common.stepHeader', { number: 8, name: t('lcImportWizard.steps.swiftMessage') })}
          </Heading>
          <Text color={colors.textColorSecondary} fontSize="sm">
            {t('common.reviewSwiftMessage')}
          </Text>
        </Box>
      )}

      {mode === 'expert' && (
        <Box pb={2} mb={4} borderBottom="1px solid" borderColor={colors.borderColor}>
          <Heading size="md" color={colors.textColor}>
            {t('lcImportWizard.steps.swiftMessage')}
          </Heading>
        </Box>
      )}

      <SwiftMessageViewer
        messageType="MT700"
        fields={swiftFieldsData}
        fieldConfigs={fieldConfigs}
        title={t('lcImportWizard.swiftMessage.title')}
        description={t('lcImportWizard.swiftMessage.description')}
        showBadges={true}
        allowCopy={true}
        allowDownload={true}
        metadata={{
          applicant: applicantName,
          beneficiary: beneficiaryName,
        }}
      />
    </VStack>
  );
};

export default SwiftPreviewSection;
