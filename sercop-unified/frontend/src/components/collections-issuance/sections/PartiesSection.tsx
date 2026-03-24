import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { DynamicSwiftSection } from '../../DynamicSwiftSection';
import type { IssuanceMode } from '../types';
import type { SwiftFieldConfig } from '../../../types/swiftField';

interface PartiesSectionProps {
  mode: IssuanceMode;
  swiftFieldsData: Record<string, any>;
  swiftConfigs: SwiftFieldConfig[];
  onSwiftFieldChange: (fieldCode: string, value: any) => void;
  fieldErrors: Record<string, any>;
  showHelp?: boolean;
  messageType: string;
}

/**
 * Sección de Partes para Collections
 * Renderiza campos SWIFT dinámicamente desde la base de datos
 */
export const PartiesSection: React.FC<PartiesSectionProps> = ({
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
          Partes Involucradas
        </Heading>
        {showHelp && (
          <Text fontSize="sm" color="gray.600">
            Ingrese la información del librado y otras partes involucradas en la cobranza.
          </Text>
        )}
      </VStack>

      <DynamicSwiftSection
        messageType={messageType}
        section="PARTIES"
        formData={swiftFieldsData}
        onChange={onSwiftFieldChange}
        columns={mode === 'expert' ? 2 : 1}
        showOptionalFields={true}
        variant={mode === 'expert' ? 'clean' : 'default'}
      />
    </Box>
  );
};

export default PartiesSection;
