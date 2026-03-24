import { Box, Heading, Text, VStack, Card } from '@chakra-ui/react';
import type { IssuanceMode, SelectedEntities } from '../types';

interface SwiftPreviewSectionProps {
  mode: IssuanceMode;
  swiftFieldsData: Record<string, any>;
  selectedEntities: SelectedEntities;
  messageType: string;
}

/**
 * Sección de Vista Previa SWIFT para Collections
 * Muestra el mensaje SWIFT que se generará
 */
export const SwiftPreviewSection: React.FC<SwiftPreviewSectionProps> = ({
  mode,
  swiftFieldsData,
  selectedEntities,
  messageType,
}) => {
  // Generar vista previa del mensaje SWIFT
  const generateSwiftPreview = () => {
    const lines: string[] = [];

    lines.push(`{1:F01BANKXXXXAXXX0000000000}`);
    lines.push(`{2:I${messageType}BANKXXXXXN}`);
    lines.push(`{4:`);

    // Agregar campos del formulario
    Object.entries(swiftFieldsData).forEach(([fieldCode, value]) => {
      if (value && value !== '') {
        let displayValue = value;

        // Manejar diferentes tipos de valores
        if (typeof value === 'object') {
          if (value.currency && value.amount) {
            displayValue = `${value.currency}${value.amount}`;
          } else if (value.name) {
            displayValue = value.name;
          } else {
            displayValue = JSON.stringify(value);
          }
        }

        lines.push(`${fieldCode}${displayValue}`);
      }
    });

    lines.push(`-}`);

    return lines.join('\n');
  };

  return (
    <Box>
      <VStack align="stretch" gap={4} mb={6}>
        <Heading size="md" color="purple.600">
          Vista Previa SWIFT ({messageType})
        </Heading>
        <Text fontSize="sm" color="gray.600">
          Revise el mensaje SWIFT que se generará para esta cobranza.
        </Text>
      </VStack>

      <Card.Root>
        <Card.Body>
          <Box
            bg="gray.900"
            color="green.400"
            p={4}
            borderRadius="md"
            fontFamily="monospace"
            fontSize="sm"
            whiteSpace="pre-wrap"
            overflowX="auto"
          >
            {generateSwiftPreview()}
          </Box>
        </Card.Body>
      </Card.Root>
    </Box>
  );
};

export default SwiftPreviewSection;
