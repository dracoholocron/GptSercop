import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { DynamicSwiftSection } from '../../DynamicSwiftSection';
import type { IssuanceMode } from '../types';
import type { SwiftFieldConfig } from '../../../types/swiftField';

interface AdditionalInfoSectionProps {
  mode: IssuanceMode;
  swiftFieldsData: Record<string, any>;
  swiftConfigs: SwiftFieldConfig[];
  onSwiftFieldChange: (fieldCode: string, value: any) => void;
  fieldErrors: Record<string, any>;
  showHelp?: boolean;
  messageType: string;
}

/**
 * Sección de Información Adicional para Collections
 * Renderiza campos SWIFT dinámicamente desde la base de datos
 */
export const AdditionalInfoSection: React.FC<AdditionalInfoSectionProps> = ({
  mode,
  swiftFieldsData,
  swiftConfigs,
  onSwiftFieldChange,
  fieldErrors,
  showHelp = true,
  messageType,
}) => {
  return (
    <Box>
      <VStack align="stretch" gap={4} mb={6}>
        <Heading size="md" color="purple.600">
          Información Adicional
        </Heading>
        {showHelp && (
          <Text fontSize="sm" color="gray.600">
            Complete la información adicional, narrativa y detalles complementarios de la cobranza.
          </Text>
        )}
      </VStack>

      <DynamicSwiftSection
        messageType={messageType}
        section="ADDITIONAL"
        formData={swiftFieldsData}
        onChange={onSwiftFieldChange}
        columns={mode === 'expert' ? 2 : 1}
        showOptionalFields={true}
        variant={mode === 'expert' ? 'clean' : 'default'}
      />
    </Box>
  );
};

export default AdditionalInfoSection;
