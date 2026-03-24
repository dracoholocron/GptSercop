import {
  Box,
  Input,
  VStack,
  Text,
  HStack,
  Badge,
  Spinner,
  Button,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiSearch, FiUser, FiX } from 'react-icons/fi';
import { participanteService, type Participante } from '../services/participantService';
import { useTheme } from '../contexts/ThemeContext';

interface NonClientSelectorProps {
  onSelect: (participante: Participante | null) => void;
  selectedParticipante?: Participante | null;
  disabled?: boolean;
  placeholder?: string;
  onConfirmSelection?: () => void; // Callback cuando se confirma la selección (para colapsar)
}

export const NonClientSelector = ({
  onSelect,
  selectedParticipante,
  disabled = false,
  placeholder = 'Buscar no cliente por identificación, nombre o apellido...',
  onConfirmSelection,
}: NonClientSelectorProps) => {
  const { getColors } = useTheme();
  const colors = getColors();

  const [searchTerm, setSearchTerm] = useState('');
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [filteredParticipantes, setFilteredParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Helper to check if value is a SwiftPartyValue (with text and participantId)
  const isSwiftPartyValue = (value: any): boolean => {
    return value && typeof value === 'object' && 'text' in value && 'participantId' in value;
  };

  // Helper to check if value is a real Participante object
  const isParticipante = (value: any): value is Participante => {
    return value && typeof value === 'object' && 'identificacion' in value && 'nombres' in value;
  };

  /**
   * Format participant data for SWIFT message (max 4 lines of 35 characters each)
   * Format:
   * Line 1: NOMBRES APELLIDOS
   * Line 2-4: Dirección (split if needed)
   */
  const formatParticipantForSwift = (participante: Participante): string => {
    const MAX_LINE_LENGTH = 35;
    const MAX_LINES = 4;
    const lines: string[] = [];

    // Line 1: Name
    const fullName = `${participante.nombres} ${participante.apellidos}`.toUpperCase();
    lines.push(fullName.substring(0, MAX_LINE_LENGTH));

    // Lines 2-4: Address
    if (participante.direccion) {
      const address = participante.direccion.toUpperCase();
      // Split address into chunks of MAX_LINE_LENGTH
      let remaining = address;
      while (remaining.length > 0 && lines.length < MAX_LINES) {
        lines.push(remaining.substring(0, MAX_LINE_LENGTH));
        remaining = remaining.substring(MAX_LINE_LENGTH);
      }
    }

    // Add city if there's room
    if (participante.ciudad && lines.length < MAX_LINES) {
      lines.push(participante.ciudad.toUpperCase().substring(0, MAX_LINE_LENGTH));
    }

    return lines.join('\n');
  };

  // Get the real Participante from various input formats
  const swiftPartyValue = isSwiftPartyValue(selectedParticipante) ? selectedParticipante : null;
  const realParticipante = isParticipante(selectedParticipante) ? selectedParticipante :
                           (swiftPartyValue?.participant ? swiftPartyValue.participant : null);

  // Cargar todos los participantes al montar el componente
  useEffect(() => {
    loadParticipantes();
  }, []);

  const loadParticipantes = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await participanteService.getAllParticipantes();
      setParticipantes(data);
    } catch (error) {
      console.error('Error loading participantes:', error);
      setLoadError('Error al cargar participantes');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar participantes cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredParticipantes([]);
      setShowResults(false);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = participantes.filter((p) => {
      // Incluir solo participantes del tipo "No cliente"
      if (p.tipo !== 'No cliente') {
        return false;
      }

      return (
        p.identificacion.toLowerCase().includes(term) ||
        p.nombres.toLowerCase().includes(term) ||
        p.apellidos.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        (p.telefono && p.telefono.toLowerCase().includes(term))
      );
    });

    setFilteredParticipantes(filtered);
    setShowResults(true);
  }, [searchTerm, participantes]);

  const handleSelect = (participante: Participante) => {
    // Create SwiftPartyValue with formatted text for SWIFT message
    const swiftPartyValue = {
      text: formatParticipantForSwift(participante),
      participantId: participante.id,
      participant: participante, // Keep reference for display
    };
    onSelect(swiftPartyValue as any);
    setSearchTerm('');
    setShowResults(false);
  };

  const handleClear = () => {
    onSelect(null);
    setSearchTerm('');
    setShowResults(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (selectedParticipante) {
      onSelect(null);
    }
  };

  return (
    <Box position="relative" width="100%">
      <VStack align="stretch" gap={2}>
        {/* Campo de búsqueda */}
        <HStack>
          <Box position="relative" flex={1}>
            <Input
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              paddingLeft={10}
              bg={colors.cardBg}
              borderColor={colors.borderColor}
              color={colors.textColor}
              _focus={{
                borderColor: colors.primaryColor,
                boxShadow: `0 0 0 1px ${colors.primaryColor}`,
              }}
            />
            <Box
              position="absolute"
              left={3}
              top="50%"
              transform="translateY(-50%)"
              color={colors.textColorSecondary}
            >
              <FiSearch />
            </Box>
          </Box>

          {realParticipante && (
            <Button
              onClick={handleClear}
              size="sm"
              variant="outline"
              colorScheme="red"
              disabled={disabled}
            >
              <FiX /> Limpiar
            </Button>
          )}
        </HStack>

        {/* Participante seleccionado */}
        {realParticipante && (
          <Box
            p={3}
            borderRadius="md"
            borderWidth={1}
            borderColor={colors.primaryColor}
            bg={colors.cardBg}
          >
            <HStack gap={3} align="start">
              <Box
                p={2}
                borderRadius="full"
                bg={colors.primaryColor}
                color="white"
              >
                <FiUser size={20} />
              </Box>
              <VStack align="start" gap={1} flex={1}>
                <Text fontWeight="bold" color={colors.textColor}>
                  {realParticipante.nombres} {realParticipante.apellidos}
                </Text>
                <HStack gap={2} flexWrap="wrap">
                  <Badge colorScheme="blue" fontSize="xs">
                    {realParticipante.identificacion}
                  </Badge>
                  <Badge colorScheme="orange" fontSize="xs">
                    No cliente
                  </Badge>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    {realParticipante.email}
                  </Text>
                </HStack>
                {realParticipante.direccion && (
                  <Text fontSize="xs" color={colors.textColorSecondary} mt={1}>
                    <Text as="span" fontWeight="semibold">Dirección:</Text> {realParticipante.direccion}
                  </Text>
                )}
              </VStack>
            </HStack>
            {/* Botón Guardar para confirmar selección */}
            {onConfirmSelection && (
              <HStack justify="flex-end" mt={3}>
                <Button
                  size="sm"
                  colorScheme="green"
                  onClick={onConfirmSelection}
                  disabled={disabled}
                >
                  Guardar
                </Button>
              </HStack>
            )}
          </Box>
        )}

        {/* Resultados de búsqueda */}
        {showResults && !realParticipante && (
          <Box
            position="absolute"
            top="100%"
            left={0}
            right={0}
            mt={1}
            maxH="300px"
            overflowY="auto"
            bg={colors.cardBg}
            borderRadius="md"
            borderWidth={1}
            borderColor={colors.borderColor}
            boxShadow="lg"
            zIndex={1000}
          >
            {loading ? (
              <Box p={4} textAlign="center">
                <Spinner size="sm" color={colors.primaryColor} />
                <Text fontSize="sm" color={colors.textColorSecondary} mt={2}>
                  Cargando participantes...
                </Text>
              </Box>
            ) : loadError ? (
              <Box p={4} textAlign="center">
                <Text fontSize="sm" color="red.500">
                  {loadError}
                </Text>
                <Button size="sm" mt={2} onClick={loadParticipantes}>
                  Reintentar
                </Button>
              </Box>
            ) : filteredParticipantes.length === 0 ? (
              <Box p={4} textAlign="center">
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  No se encontraron no clientes
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" gap={0}>
                {filteredParticipantes.map((participante) => (
                  <Box
                    key={participante.id}
                    p={3}
                    cursor="pointer"
                    borderBottomWidth={1}
                    borderColor={colors.borderColor}
                    _hover={{
                      bg: colors.bgColor,
                    }}
                    onClick={() => handleSelect(participante)}
                  >
                    <HStack gap={3} align="start">
                      <Box
                        p={2}
                        borderRadius="full"
                        bg={colors.primaryColor + '20'}
                        color={colors.primaryColor}
                      >
                        <FiUser size={16} />
                      </Box>
                      <VStack align="start" gap={1} flex={1}>
                        <Text fontWeight="medium" fontSize="sm" color={colors.textColor}>
                          {participante.nombres} {participante.apellidos}
                        </Text>
                        <HStack gap={2} flexWrap="wrap">
                          <Badge colorScheme="blue" fontSize="xs">
                            {participante.identificacion}
                          </Badge>
                          <Badge colorScheme="orange" fontSize="xs">
                            No cliente
                          </Badge>
                          <Text fontSize="xs" color={colors.textColorSecondary}>
                            {participante.email}
                          </Text>
                        </HStack>
                        {participante.direccion && (
                          <Text fontSize="xs" color={colors.textColorSecondary}>
                            <Text as="span" fontWeight="semibold">Dirección:</Text> {participante.direccion}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        )}
      </VStack>
    </Box>
  );
};
