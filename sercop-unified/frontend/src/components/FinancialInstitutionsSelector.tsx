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
import { FiSearch, FiX, FiMapPin, FiCreditCard } from 'react-icons/fi';
import { institucionFinancieraService, type InstitucionFinanciera } from '../services/financialInstitutionService';
import { useTheme } from '../contexts/ThemeContext';

// Support for legacy text values from SWIFT message parser
interface SwiftPartyValue {
  text: string;
  participantId?: number;
}

interface FinancialInstitutionsSelectorProps {
  onSelect: (institucion: InstitucionFinanciera | null) => void;
  selectedInstitucion?: InstitucionFinanciera | SwiftPartyValue | string | null;
  disabled?: boolean;
  placeholder?: string;
  filterActive?: boolean; // Filtrar solo instituciones activas
  filterCorresponsal?: boolean; // Filtrar solo bancos corresponsales
  tipo?: string; // Filtrar por tipo (BANCO_COMERCIAL, BANCO_CENTRAL, etc.)
}

export const FinancialInstitutionsSelector = ({
  onSelect,
  selectedInstitucion,
  disabled = false,
  placeholder = 'Buscar institución financiera por código, nombre, SWIFT o país...',
  filterActive = true,
  filterCorresponsal = false,
  tipo,
}: FinancialInstitutionsSelectorProps) => {
  const { getColors } = useTheme();
  const colors = getColors();

  const [searchTerm, setSearchTerm] = useState('');
  const [instituciones, setInstituciones] = useState<InstitucionFinanciera[]>([]);
  const [filteredInstituciones, setFilteredInstituciones] = useState<InstitucionFinanciera[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Helper to check if value is a SwiftPartyValue (text from parser) vs InstitucionFinanciera
  const isSwiftPartyValue = (value: any): value is SwiftPartyValue => {
    return value && typeof value === 'object' && 'text' in value && !('codigo' in value);
  };

  // Helper to check if value is a real InstitucionFinanciera
  const isInstitucionFinanciera = (value: any): value is InstitucionFinanciera => {
    return value && typeof value === 'object' && 'codigo' in value && 'nombre' in value;
  };

  // Helper to check if value is a plain string (from new parser format)
  const isPlainString = (value: any): value is string => {
    return typeof value === 'string' && value.trim() !== '';
  };

  // Get the legacy text value if present (supports both object and string formats)
  const legacyTextValue = isSwiftPartyValue(selectedInstitucion)
    ? selectedInstitucion.text
    : isPlainString(selectedInstitucion)
      ? selectedInstitucion
      : null;
  const realInstitucion = isInstitucionFinanciera(selectedInstitucion) ? selectedInstitucion : null;

  // Cargar todas las instituciones al montar el componente
  useEffect(() => {
    loadInstituciones();
  }, []);

  const loadInstituciones = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      let data: InstitucionFinanciera[];

      // Si se filtra por corresponsal, usar el endpoint específico
      if (filterCorresponsal) {
        data = await institucionFinancieraService.getInstitucionesCorresponsales();
      } else {
        data = await institucionFinancieraService.getAllInstitucionesFinancieras();
      }

      // Aplicar filtros
      let filteredData = data;

      // Filtrar por estado activo (excluir solo los explícitamente inactivos)
      if (filterActive) {
        filteredData = filteredData.filter(i => i.activo !== false);
      }

      // Filtrar por tipo si se especifica
      if (tipo) {
        filteredData = filteredData.filter(i => i.tipo === tipo);
      }

      setInstituciones(filteredData);
    } catch (error) {
      console.error('Error loading instituciones financieras:', error);
      setLoadError('Error al cargar instituciones financieras');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar instituciones cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredInstituciones([]);
      setShowResults(false);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = instituciones.filter((i) => {
      return (
        i.codigo.toLowerCase().includes(term) ||
        i.nombre.toLowerCase().includes(term) ||
        (i.swiftCode && i.swiftCode.toLowerCase().includes(term)) ||
        (i.pais && i.pais.toLowerCase().includes(term)) ||
        (i.ciudad && i.ciudad.toLowerCase().includes(term))
      );
    });

    setFilteredInstituciones(filtered);
    setShowResults(true);
  }, [searchTerm, instituciones]);

  const handleSelect = (institucion: InstitucionFinanciera) => {
    onSelect(institucion);
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
    if (selectedInstitucion) {
      onSelect(null);
    }
  };

  // Obtener el icono del tipo de institución
  const getTipoIcon = (tipoInstitucion: string) => {
    switch (tipoInstitucion) {
      case 'BANCO_COMERCIAL':
        return <FiCreditCard />;
      case 'BANCO_CENTRAL':
        return <FiCreditCard />;
      default:
        return <FiCreditCard />;
    }
  };

  // Obtener el color del tipo de institución
  const getTipoColor = (tipoInstitucion: string) => {
    switch (tipoInstitucion) {
      case 'BANCO_COMERCIAL':
        return 'blue';
      case 'BANCO_CENTRAL':
        return 'purple';
      case 'COOPERATIVA':
        return 'green';
      case 'FINANCIERA':
        return 'orange';
      default:
        return 'gray';
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

          {(realInstitucion || legacyTextValue) && (
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

        {/* Valor de texto importado (parseado de mensaje SWIFT) */}
        {legacyTextValue && !realInstitucion && (
          <Box
            p={3}
            borderRadius="md"
            borderWidth={1}
            borderColor={colors.borderColor}
            bg={colors.cardBg}
          >
            <Box
              p={2}
              bg={colors.bgColor}
              borderRadius="md"
              fontFamily="mono"
              fontSize="sm"
            >
              {legacyTextValue.split('\n').map((line, idx) => (
                <Text key={idx} color={colors.textColor}>
                  {line || '\u00A0'}
                </Text>
              ))}
            </Box>
          </Box>
        )}

        {/* Institución seleccionada */}
        {realInstitucion && (
          <Box
            p={3}
            borderRadius="md"
            borderWidth={1}
            borderColor={colors.primaryColor}
            bg={colors.cardBg}
          >
            <HStack gap={3}>
              <Box
                p={2}
                borderRadius="full"
                bg={colors.primaryColor}
                color="white"
              >
                {getTipoIcon(realInstitucion.tipo)}
              </Box>
              <VStack align="start" gap={0} flex={1}>
                <Text fontWeight="bold" color={colors.textColor}>
                  {realInstitucion.nombre}
                </Text>
                <HStack gap={2} flexWrap="wrap">
                  <Badge colorScheme="blue" fontSize="xs">
                    {realInstitucion.codigo}
                  </Badge>
                  {realInstitucion.swiftCode && (
                    <Badge colorScheme="green" fontSize="xs">
                      SWIFT: {realInstitucion.swiftCode}
                    </Badge>
                  )}
                  <Badge colorScheme={getTipoColor(realInstitucion.tipo)} fontSize="xs">
                    {realInstitucion.tipo}
                  </Badge>
                  {realInstitucion.esCorresponsal && (
                    <Badge colorScheme="purple" fontSize="xs">
                      Corresponsal
                    </Badge>
                  )}
                  <Badge colorScheme={realInstitucion.activo ? 'green' : 'red'} fontSize="xs">
                    {realInstitucion.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </HStack>
                {(realInstitucion.pais || realInstitucion.ciudad) && (
                  <HStack gap={1} mt={1}>
                    <FiMapPin size={12} color={colors.textColorSecondary} />
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      {[realInstitucion.ciudad, realInstitucion.pais].filter(Boolean).join(', ')}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </HStack>
          </Box>
        )}

        {/* Resultados de búsqueda */}
        {showResults && !realInstitucion && (
          <Box
            position="absolute"
            top="100%"
            left={0}
            right={0}
            mt={1}
            maxH="400px"
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
                  Cargando instituciones financieras...
                </Text>
              </Box>
            ) : loadError ? (
              <Box p={4} textAlign="center">
                <Text fontSize="sm" color="red.500">
                  {loadError}
                </Text>
                <Button size="sm" mt={2} onClick={loadInstituciones}>
                  Reintentar
                </Button>
              </Box>
            ) : filteredInstituciones.length === 0 ? (
              <Box p={4} textAlign="center">
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  No se encontraron instituciones financieras
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" gap={0}>
                {filteredInstituciones.map((institucion) => (
                  <Box
                    key={institucion.id}
                    p={3}
                    cursor="pointer"
                    borderBottomWidth={1}
                    borderColor={colors.borderColor}
                    _hover={{
                      bg: colors.bgColor,
                    }}
                    onClick={() => handleSelect(institucion)}
                  >
                    <HStack gap={3}>
                      <Box
                        p={2}
                        borderRadius="full"
                        bg={colors.primaryColor + '20'}
                        color={colors.primaryColor}
                      >
                        {getTipoIcon(institucion.tipo)}
                      </Box>
                      <VStack align="start" gap={0} flex={1}>
                        <Text fontWeight="medium" fontSize="sm" color={colors.textColor}>
                          {institucion.nombre}
                        </Text>
                        <HStack gap={2} flexWrap="wrap">
                          <Badge colorScheme="blue" fontSize="xs">
                            {institucion.codigo}
                          </Badge>
                          {institucion.swiftCode && (
                            <Badge colorScheme="green" fontSize="xs">
                              SWIFT: {institucion.swiftCode}
                            </Badge>
                          )}
                          <Badge colorScheme={getTipoColor(institucion.tipo)} fontSize="xs">
                            {institucion.tipo}
                          </Badge>
                          {institucion.esCorresponsal && (
                            <Badge colorScheme="purple" fontSize="xs">
                              Corresponsal
                            </Badge>
                          )}
                          <Badge colorScheme={institucion.activo ? 'green' : 'red'} fontSize="xs">
                            {institucion.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </HStack>
                        {(institucion.pais || institucion.ciudad) && (
                          <HStack gap={1} mt={1}>
                            <FiMapPin size={12} color={colors.textColorSecondary} />
                            <Text fontSize="xs" color={colors.textColorSecondary}>
                              {[institucion.ciudad, institucion.pais].filter(Boolean).join(', ')}
                            </Text>
                          </HStack>
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
