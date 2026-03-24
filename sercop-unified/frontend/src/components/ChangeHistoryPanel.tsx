import {
  Box,
  VStack,
  Text,
  HStack,
  IconButton,
  Flex,
} from '@chakra-ui/react';
import { FiClock, FiX } from 'react-icons/fi';
import { useState } from 'react';

export interface HistoryChange {
  id: string;
  date: string;
  type: 'amendment' | 'negotiation' | 'payment' | 'other';
  description: string;
  aiReasoning: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
}

interface ChangeHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  changes: HistoryChange[];
  textColor: string;
  textColorSecondary: string;
  cardBg: string;
  borderColor: string;
  bgColor: string;
  primaryColor: string;
  onSelectChange?: (change: HistoryChange | null) => void;
}

export const ChangeHistoryPanel = ({
  isOpen,
  onClose,
  changes,
  textColor,
  textColorSecondary,
  cardBg,
  borderColor,
  bgColor,
  primaryColor,
  onSelectChange,
}: ChangeHistoryPanelProps) => {
  const [selectedChange, setSelectedChange] = useState<HistoryChange | null>(null);

  const handleSelectChange = (change: HistoryChange) => {
    setSelectedChange(change);
    onSelectChange?.(change);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      amendment: 'Enmienda',
      negotiation: 'Negociación',
      payment: 'Pago',
      other: 'Otro',
    };
    return labels[type] || 'Evento';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      amendment: 'orange.500',
      negotiation: 'blue.500',
      payment: 'green.500',
      other: 'gray.500',
    };
    return colors[type] || 'gray.500';
  };

  return (
    <Box
      position="fixed"
      right={0}
      top={0}
      bottom={0}
      width="30%"
      bg={cardBg}
      borderLeft="1px"
      borderColor={borderColor}
      transform={isOpen ? 'translateX(0)' : 'translateX(100%)'}
      transition="transform 0.3s ease-in-out"
      zIndex={1000}
      boxShadow="-4px 0 10px rgba(0, 0, 0, 0.1)"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Flex
        p={4}
        borderBottom="1px"
        borderColor={borderColor}
        justify="space-between"
        align="center"
        bg={bgColor}
      >
        <HStack>
          <FiClock size={20} color={primaryColor} />
          <Text fontSize="lg" fontWeight="bold" color={textColor}>
            Historial de Cambios
          </Text>
        </HStack>
        <IconButton
          size="sm"
          variant="ghost"
          onClick={onClose}
          aria-label="Cerrar panel"
        >
          <FiX />
        </IconButton>
      </Flex>

      {/* Lista de cambios - 50% superior */}
      <Box
        flex="1"
        overflowY="auto"
        p={4}
        maxH="50%"
        borderBottom="2px"
        borderColor={borderColor}
      >
        <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={3}>
          Cronología de Eventos
        </Text>
        {changes.length === 0 ? (
          <Text fontSize="sm" color={textColorSecondary} textAlign="center" mt={8}>
            No hay cambios registrados
          </Text>
        ) : (
          <VStack spacing={2} align="stretch">
            {changes.map((change) => (
              <Box
                key={change.id}
                p={3}
                bg={selectedChange?.id === change.id ? 'rgba(0, 115, 230, 0.1)' : bgColor}
                borderRadius="md"
                border="1px"
                borderColor={selectedChange?.id === change.id ? primaryColor : borderColor}
                cursor="pointer"
                _hover={{ bg: 'rgba(0, 115, 230, 0.05)' }}
                onClick={() => handleSelectChange(change)}
                transition="all 0.2s"
              >
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="xs" color={textColorSecondary}>
                    {change.date}
                  </Text>
                  <Box
                    px={2}
                    py={0.5}
                    bg={getTypeColor(change.type)}
                    borderRadius="full"
                    fontSize="xs"
                    color="white"
                    fontWeight="medium"
                  >
                    {getTypeLabel(change.type)}
                  </Box>
                </HStack>
                <Text fontSize="sm" color={textColor} noOfLines={2}>
                  {change.description}
                </Text>
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      {/* Razonamiento IA - 50% inferior */}
      <Box flex="1" overflowY="auto" p={4} bg={bgColor}>
        <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={3}>
          Análisis del Cambio
        </Text>
        {selectedChange ? (
          <VStack spacing={3} align="stretch">
            <Box
              p={3}
              bg="rgba(99, 102, 241, 0.05)"
              borderRadius="md"
              border="1px"
              borderColor="rgba(99, 102, 241, 0.2)"
            >
              <HStack mb={2}>
                <Box
                  w={2}
                  h={2}
                  bg="rgba(99, 102, 241, 0.8)"
                  borderRadius="full"
                />
                <Text fontSize="xs" fontWeight="bold" color="rgba(99, 102, 241, 0.9)">
                  ANÁLISIS ASISTIDO POR IA
                </Text>
              </HStack>
              <Text fontSize="sm" color={textColor} lineHeight="tall">
                {selectedChange.aiReasoning}
              </Text>
            </Box>
            <Box
              p={3}
              bg="rgba(245, 158, 11, 0.05)"
              borderRadius="md"
              border="1px"
              borderColor="rgba(245, 158, 11, 0.2)"
            >
              <Text fontSize="xs" fontWeight="semibold" color={textColor} mb={1}>
                Detalles del Evento:
              </Text>
              <VStack spacing={1} align="stretch" fontSize="xs" color={textColorSecondary}>
                <Text>
                  <strong>Tipo:</strong> {getTypeLabel(selectedChange.type)}
                </Text>
                <Text>
                  <strong>Fecha:</strong> {selectedChange.date}
                </Text>
                <Text>
                  <strong>Descripción:</strong> {selectedChange.description}
                </Text>
              </VStack>
            </Box>
          </VStack>
        ) : (
          <Box
            p={8}
            textAlign="center"
            bg="rgba(0, 115, 230, 0.02)"
            borderRadius="md"
            border="1px dashed"
            borderColor={borderColor}
          >
            <Text fontSize="sm" color={textColorSecondary}>
              Selecciona un cambio de la lista superior para ver el análisis detallado generado por IA
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
