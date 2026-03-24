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
import { FiSearch, FiList, FiX } from 'react-icons/fi';
import { catalogoPersonalizadoService, type CatalogoPersonalizado } from '../services/customCatalogService';
import { useTheme } from '../contexts/ThemeContext';

interface CustomCatalogSelectorProps {
  onSelect: (catalogo: CatalogoPersonalizado | null) => void;
  selectedCatalogo?: CatalogoPersonalizado | null;
  disabled?: boolean;
  placeholder?: string;
  nivel?: number; // Filtrar por nivel si se especifica
  catalogoPadreId?: number; // Filtrar por catálogo padre si se especifica
  showOnlyActive?: boolean; // Mostrar solo catálogos activos
}

export const CustomCatalogSelector = ({
  onSelect,
  selectedCatalogo,
  disabled = false,
  placeholder = 'Buscar catálogo por código, nombre o descripción...',
  nivel,
  catalogoPadreId,
  showOnlyActive = true,
}: CustomCatalogSelectorProps) => {
  const { getColors } = useTheme();
  const colors = getColors();

  const [searchTerm, setSearchTerm] = useState('');
  const [catalogos, setCatalogos] = useState<CatalogoPersonalizado[]>([]);
  const [filteredCatalogos, setFilteredCatalogos] = useState<CatalogoPersonalizado[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Cargar catálogos al montar el componente o cuando cambien los filtros
  useEffect(() => {
    loadCatalogos();
  }, [nivel, catalogoPadreId]);

  const loadCatalogos = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      let data: CatalogoPersonalizado[];

      if (catalogoPadreId) {
        // Si hay catalogoPadreId, cargar solo los hijos de ese catálogo
        data = await catalogoPersonalizadoService.getCatalogosByCatalogoPadreId(catalogoPadreId);
      } else if (nivel) {
        // Si hay nivel, cargar catálogos de ese nivel
        data = await catalogoPersonalizadoService.getCatalogosByNivel(nivel);
      } else {
        // Cargar todos los catálogos
        data = await catalogoPersonalizadoService.getAllCatalogosPersonalizados();
      }

      // Filtrar por activos si se especifica
      if (showOnlyActive) {
        data = data.filter((c) => c.activo);
      }

      setCatalogos(data);
    } catch (error) {
      console.error('Error loading catálogos personalizados:', error);
      setLoadError('Error al cargar catálogos personalizados');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar catálogos cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCatalogos([]);
      setShowResults(false);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = catalogos.filter((c) => {
      return (
        c.codigo.toLowerCase().includes(term) ||
        c.nombre.toLowerCase().includes(term) ||
        (c.descripcion && c.descripcion.toLowerCase().includes(term)) ||
        (c.codigoCatalogoPadre && c.codigoCatalogoPadre.toLowerCase().includes(term)) ||
        (c.nombreCatalogoPadre && c.nombreCatalogoPadre.toLowerCase().includes(term))
      );
    });

    // Ordenar por orden y luego por nombre
    filtered.sort((a, b) => {
      if (a.orden !== b.orden) {
        return a.orden - b.orden;
      }
      return a.nombre.localeCompare(b.nombre);
    });

    setFilteredCatalogos(filtered);
    setShowResults(true);
  }, [searchTerm, catalogos]);

  const handleSelect = (catalogo: CatalogoPersonalizado) => {
    onSelect(catalogo);
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
    if (selectedCatalogo) {
      onSelect(null);
    }
  };

  const getNivelLabel = (nivelValue: number) => {
    return nivelValue === 1 ? 'Catálogo' : 'Registro';
  };

  const getNivelColor = (nivelValue: number) => {
    return nivelValue === 1 ? 'blue' : 'green';
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

          {selectedCatalogo && (
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

        {/* Catálogo seleccionado */}
        {selectedCatalogo && (
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
                <FiList size={20} />
              </Box>
              <VStack align="start" gap={0} flex={1}>
                <Text fontWeight="bold" color={colors.textColor}>
                  {selectedCatalogo.nombre}
                </Text>
                <HStack gap={2} flexWrap="wrap">
                  <Badge colorScheme="blue" fontSize="xs">
                    {selectedCatalogo.codigo}
                  </Badge>
                  <Badge colorScheme={getNivelColor(selectedCatalogo.nivel)} fontSize="xs">
                    {getNivelLabel(selectedCatalogo.nivel)}
                  </Badge>
                  {selectedCatalogo.nombreCatalogoPadre && (
                    <Badge colorScheme="purple" fontSize="xs">
                      Padre: {selectedCatalogo.nombreCatalogoPadre}
                    </Badge>
                  )}
                  {selectedCatalogo.descripcion && (
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      {selectedCatalogo.descripcion}
                    </Text>
                  )}
                </HStack>
              </VStack>
            </HStack>
          </Box>
        )}

        {/* Resultados de búsqueda */}
        {showResults && !selectedCatalogo && (
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
                  Cargando catálogos...
                </Text>
              </Box>
            ) : loadError ? (
              <Box p={4} textAlign="center">
                <Text fontSize="sm" color="red.500">
                  {loadError}
                </Text>
                <Button size="sm" mt={2} onClick={loadCatalogos}>
                  Reintentar
                </Button>
              </Box>
            ) : filteredCatalogos.length === 0 ? (
              <Box p={4} textAlign="center">
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  No se encontraron catálogos
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" gap={0}>
                {filteredCatalogos.map((catalogo) => (
                  <Box
                    key={catalogo.id}
                    p={3}
                    cursor="pointer"
                    borderBottomWidth={1}
                    borderColor={colors.borderColor}
                    _hover={{
                      bg: colors.bgColor,
                    }}
                    onClick={() => handleSelect(catalogo)}
                  >
                    <HStack gap={3}>
                      <Box
                        p={2}
                        borderRadius="full"
                        bg={colors.primaryColor + '20'}
                        color={colors.primaryColor}
                      >
                        <FiList size={16} />
                      </Box>
                      <VStack align="start" gap={0} flex={1}>
                        <Text fontWeight="medium" fontSize="sm" color={colors.textColor}>
                          {catalogo.nombre}
                        </Text>
                        <HStack gap={2} flexWrap="wrap">
                          <Badge colorScheme="blue" fontSize="xs">
                            {catalogo.codigo}
                          </Badge>
                          <Badge colorScheme={getNivelColor(catalogo.nivel)} fontSize="xs">
                            {getNivelLabel(catalogo.nivel)}
                          </Badge>
                          {catalogo.nombreCatalogoPadre && (
                            <Badge colorScheme="purple" fontSize="xs">
                              {catalogo.nombreCatalogoPadre}
                            </Badge>
                          )}
                          {catalogo.descripcion && (
                            <Text fontSize="xs" color={colors.textColorSecondary}>
                              {catalogo.descripcion}
                            </Text>
                          )}
                        </HStack>
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
