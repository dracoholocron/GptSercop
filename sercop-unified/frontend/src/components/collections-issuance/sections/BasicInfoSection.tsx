import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { DynamicSwiftSection } from '../../DynamicSwiftSection';
import type { IssuanceMode } from '../types';
import type { SwiftFieldConfig } from '../../../types/swiftField';

interface BasicInfoSectionProps {
  mode: IssuanceMode;
  swiftFieldsData: Record<string, any>;
  swiftConfigs: SwiftFieldConfig[];
  onSwiftFieldChange: (fieldCode: string, value: any) => void;
  fieldErrors: Record<string, any>;
  showHelp?: boolean;
  messageType: string;
}

/**
 * Sección de Información Básica para Collections
 * Renderiza campos SWIFT dinámicamente desde la base de datos
 */
export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
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
          Información Básica
        </Heading>
        {showHelp && (
          <Text fontSize="sm" color="gray.600">
            Complete la información de referencias e identificación del mensaje de cobranza.
          </Text>
        )}
      </VStack>

      <DynamicSwiftSection
        messageType={messageType}
        section="BASIC"
        formData={swiftFieldsData}
        onChange={onSwiftFieldChange}
        columns={mode === 'expert' ? 2 : 1}
        showOptionalFields={true}
        variant={mode === 'expert' ? 'clean' : 'default'}
      />
    </Box>
  );
};

export default BasicInfoSection;
