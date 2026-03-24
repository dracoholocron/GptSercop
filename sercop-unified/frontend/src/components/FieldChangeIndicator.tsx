import { Box, HStack } from '@chakra-ui/react';
import { FiEdit } from 'react-icons/fi';
import { Tooltip } from '@chakra-ui/react';

interface FieldChangeIndicatorProps {
  oldValue: string;
  newValue: string;
  isHighlighted: boolean;
}

export const FieldChangeIndicator = ({
  oldValue,
  newValue,
  isHighlighted,
}: FieldChangeIndicatorProps) => {
  return (
    <Tooltip.Root positioning={{ placement: 'top' }} openDelay={200}>
      <Tooltip.Trigger asChild>
        <Box
          position="absolute"
          right="8px"
          top="50%"
          transform="translateY(-50%)"
          zIndex={2}
          cursor="pointer"
        >
          <Box
            bg={isHighlighted ? 'orange.500' : 'blue.500'}
            p={1.5}
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow={isHighlighted ? '0 0 0 3px rgba(251, 146, 60, 0.3)' : 'sm'}
            transition="all 0.2s"
            animation={isHighlighted ? 'pulse 2s infinite' : 'none'}
          >
            <FiEdit size={12} color="white" />
          </Box>
        </Box>
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content
          bg="gray.800"
          color="white"
          px={3}
          py={2}
          borderRadius="md"
          fontSize="sm"
          maxW="300px"
          boxShadow="lg"
        >
          <HStack spacing={2} align="flex-start">
            <Box>
              <Box fontWeight="semibold" fontSize="xs" color="gray.300" mb={1}>
                Valor Anterior:
              </Box>
              <Box
                bg="rgba(239, 68, 68, 0.2)"
                px={2}
                py={1}
                borderRadius="sm"
                fontSize="xs"
                border="1px solid"
                borderColor="red.400"
                color="red.200"
                mb={2}
              >
                {oldValue || '(vacío)'}
              </Box>
              <Box fontWeight="semibold" fontSize="xs" color="gray.300" mb={1}>
                Valor Nuevo:
              </Box>
              <Box
                bg="rgba(34, 197, 94, 0.2)"
                px={2}
                py={1}
                borderRadius="sm"
                fontSize="xs"
                border="1px solid"
                borderColor="green.400"
                color="green.200"
              >
                {newValue || '(vacío)'}
              </Box>
            </Box>
          </HStack>
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
};
