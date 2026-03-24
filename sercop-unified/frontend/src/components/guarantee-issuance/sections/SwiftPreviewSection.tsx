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
 * Sección de Vista Previa del Mensaje SWIFT (Paso 7)
 * Muestra el mensaje MT760 formateado
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

  // Obtener nombre completo del solicitante
  const applicantName = selectedEntities.solicitante?.nombreCompleto
    || selectedEntities.solicitante?.razonSocial
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
            Paso 7: Mensaje SWIFT MT760
          </Heading>
          <Text color={colors.textColorSecondary} fontSize="sm">
            Vista previa del mensaje SWIFT que se generará
          </Text>
        </Box>
      )}

      {mode === 'expert' && (
        <Box pb={2} mb={4} borderBottom="1px solid" borderColor={colors.borderColor}>
          <Heading size="md" color={colors.textColor}>
            {t('lcImportWizard.steps.swiftMessage', 'Mensaje SWIFT')}
          </Heading>
        </Box>
      )}

      <SwiftMessageViewer
        messageType="MT760"
        fields={swiftFieldsData}
        fieldConfigs={fieldConfigs}
        title="Mensaje SWIFT MT760 - Garantía Bancaria"
        description="Vista previa del mensaje SWIFT que será enviado"
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
