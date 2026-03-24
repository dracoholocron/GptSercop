import {
  Box,
  Button,
  Grid,
  Heading,
  Input,
  VStack,
  Text,
  HStack,
  Card,
  Spinner,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { FiSave, FiRefreshCw } from 'react-icons/fi';
import { catalogoPersonalizadoService } from '../services/customCatalogService';
import { CATALOG_IDS } from '../config/catalogs.config';
import { notify } from '../components/ui/toaster';

interface ReferenceNumberFormat {
  id?: number;
  clientId: string;
  clientName: string;
  productCode: string; // M, B, E, O, I, S, J
  countryCode: string; // E, M, U, etc.
  agencyDigits: number; // 4 dígitos
  yearDigits: number; // 2 dígitos
  sequentialDigits: number; // 4 dígitos
  separator: string; // Separador opcional entre secciones
  example: string;
}

const countryCodes = [
  { value: 'E', label: 'E - Ecuador' },
  { value: 'M', label: 'M - México' },
  { value: 'U', label: 'U - Estados Unidos' },
  { value: 'C', label: 'C - Colombia' },
  { value: 'P', label: 'P - Perú' },
  { value: 'A', label: 'A - Argentina' },
  { value: 'B', label: 'B - Brasil' },
  { value: 'H', label: 'H - Chile' },
];

interface CatalogoItem {
  catalogoPersonalizadoId: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  nivel: number;
}

export const ReferenceNumberConfig = () => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const { bgColor, borderColor, cardBg, textColor, textColorSecondary, primaryColor } = colors;

  const [configs, setConfigs] = useState<ReferenceNumberFormat[]>([]);
  const [productCodes, setProductCodes] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [currentConfig, setCurrentConfig] = useState<ReferenceNumberFormat>({
    clientId: 'DEFAULT',
    clientName: 'Configuración por Defecto',
    productCode: 'M',
    countryCode: 'E',
    agencyDigits: 4,
    yearDigits: 2,
    sequentialDigits: 4,
    separator: '',
    example: '',
  });

  useEffect(() => {
    // Cargar productos desde el catálogo PRODUCT
    const loadProductCodes = async () => {
      try {
        setLoadingProducts(true);

        // Verificar que el catálogo PRODUCT esté configurado
        if (!CATALOG_IDS.PRODUCT) {
          throw new Error('El catálogo PRODUCT no está configurado en catalogs.config.ts');
        }

        // Obtener productos hijos del catálogo PRODUCT
        const catalogItems = await catalogoPersonalizadoService.getCatalogosByCatalogoPadreId(CATALOG_IDS.PRODUCT);

        // El campo 'nombre' contiene la letra para la referencia SWIFT (M, E, B, etc.)
        // El campo 'codigo' es el identificador del producto (LC_IMPORT, LC_EXPORT, etc.)
        const products = catalogItems.map((item) => ({
          value: item.nombre, // Usar 'nombre' que contiene la letra (M, E, B, etc.)
          label: `${item.nombre} - ${item.descripcion || item.codigo}`, // Mostrar: "M - CARTA DE CREDITO DE IMPORTACION"
        }));

        setProductCodes(products);
      } catch (error) {
        console.error('Error loading product codes:', error);
        // Fallback a valores por defecto si falla (usando la letra para referencia SWIFT)
        setProductCodes([
          { value: 'M', label: 'M - Carta de Crédito de Importación' },
          { value: 'E', label: 'E - Carta de Crédito de Exportación' },
        ]);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProductCodes();
  }, []);

  useEffect(() => {
    // Cargar configuraciones guardadas desde localStorage o API
    const savedConfigs = localStorage.getItem('referenceNumberConfigs');
    if (savedConfigs) {
      setConfigs(JSON.parse(savedConfigs));
    }
  }, []);

  useEffect(() => {
    // Generar ejemplo automáticamente
    generateExample();
  }, [currentConfig.productCode, currentConfig.countryCode, currentConfig.agencyDigits,
      currentConfig.yearDigits, currentConfig.sequentialDigits, currentConfig.separator]);

  const generateExample = () => {
    const year = new Date().getFullYear().toString().slice(-currentConfig.yearDigits);
    const agency = '0001'.padStart(currentConfig.agencyDigits, '0');
    const sequential = '1'.padStart(currentConfig.sequentialDigits, '0');

    let example = currentConfig.productCode + currentConfig.countryCode;
    if (currentConfig.separator) {
      example += currentConfig.separator + agency;
      example += currentConfig.separator + year;
      example += currentConfig.separator + sequential;
    } else {
      example += agency + year + sequential;
    }

    setCurrentConfig(prev => ({ ...prev, example }));
  };

  const handleSave = () => {
    // Validar que el formato no exceda 10 caracteres (sin contar separadores opcionales)
    const totalLength = 2 + currentConfig.agencyDigits + currentConfig.yearDigits + currentConfig.sequentialDigits;

    if (totalLength > 12) {
      notify.error('Error de formato', 'El formato excede la longitud máxima permitida (12 dígitos sin separadores)');
      return;
    }

    const newConfig = { ...currentConfig, id: Date.now() };
    const updatedConfigs = [...configs, newConfig];
    setConfigs(updatedConfigs);
    localStorage.setItem('referenceNumberConfigs', JSON.stringify(updatedConfigs));

    notify.success('Configuración guardada', 'La configuración se ha guardado exitosamente');

    // Reset form
    setCurrentConfig({
      clientId: 'DEFAULT',
      clientName: 'Configuración por Defecto',
      productCode: 'M',
      countryCode: 'E',
      agencyDigits: 4,
      yearDigits: 2,
      sequentialDigits: 4,
      separator: '',
      example: '',
    });
  };

  const handleDelete = (id: number) => {
    const updatedConfigs = configs.filter(config => config.id !== id);
    setConfigs(updatedConfigs);
    localStorage.setItem('referenceNumberConfigs', JSON.stringify(updatedConfigs));
  };

  const getTotalLength = () => {
    const baseLength = 2; // Producto + País
    const separatorLength = currentConfig.separator ? 3 * currentConfig.separator.length : 0;
    return baseLength + currentConfig.agencyDigits + currentConfig.yearDigits +
           currentConfig.sequentialDigits + separatorLength;
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" color={textColor} mb={2}>
            Configuración de Números de Referencia
          </Heading>
          <Text color={textColorSecondary}>
            Configure el formato de los números de referencia para cada tipo de producto
          </Text>
        </Box>

        {/* Formulario de Configuración */}
        <Box
          bg={cardBg}
          p={6}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
          boxShadow="sm"
        >
          <VStack spacing={6} align="stretch">
            <Text fontSize="md" fontWeight="semibold" color={textColor}>
              Nueva Configuración
            </Text>

            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color={textColorSecondary} mb={2}>
                  ID de Cliente
                </Text>
                <Input
                  placeholder="Ej: CLI001"
                  value={currentConfig.clientId}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, clientId: e.target.value })}
                  bg={bgColor}
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color={textColorSecondary} mb={2}>
                  Nombre del Cliente
                </Text>
                <Input
                  placeholder="Nombre del cliente"
                  value={currentConfig.clientName}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, clientName: e.target.value })}
                  bg={bgColor}
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color={textColorSecondary} mb={2}>
                  Código de Producto
                </Text>
                {loadingProducts ? (
                  <HStack gap={2} p={2} bg={bgColor} borderRadius="md">
                    <Spinner size="sm" color={primaryColor} />
                    <Text fontSize="sm" color={textColorSecondary}>
                      Cargando productos desde catálogo...
                    </Text>
                  </HStack>
                ) : (
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={currentConfig.productCode}
                      onChange={(e) => setCurrentConfig({ ...currentConfig, productCode: e.target.value })}
                      bg={bgColor}
                      disabled={productCodes.length === 0}
                    >
                      {productCodes.length === 0 ? (
                        <option value="">No hay productos disponibles</option>
                      ) : (
                        productCodes.map(product => (
                          <option key={product.value} value={product.value}>
                            {product.label}
                          </option>
                        ))
                      )}
                    </NativeSelectField>
                  </NativeSelectRoot>
                )}
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color={textColorSecondary} mb={2}>
                  Código de País
                </Text>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={currentConfig.countryCode}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, countryCode: e.target.value })}
                    bg={bgColor}
                  >
                    {countryCodes.map(country => (
                      <option key={country.value} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </NativeSelectField>
                </NativeSelectRoot>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color={textColorSecondary} mb={2}>
                  Dígitos para Agencia (4 recomendado)
                </Text>
                <Input
                  type="number"
                  min="1"
                  max="6"
                  value={currentConfig.agencyDigits}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, agencyDigits: parseInt(e.target.value) || 4 })}
                  bg={bgColor}
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color={textColorSecondary} mb={2}>
                  Dígitos para Año (2 recomendado)
                </Text>
                <Input
                  type="number"
                  min="2"
                  max="4"
                  value={currentConfig.yearDigits}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, yearDigits: parseInt(e.target.value) || 2 })}
                  bg={bgColor}
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color={textColorSecondary} mb={2}>
                  Dígitos para Secuencial (4 recomendado)
                </Text>
                <Input
                  type="number"
                  min="3"
                  max="6"
                  value={currentConfig.sequentialDigits}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, sequentialDigits: parseInt(e.target.value) || 4 })}
                  bg={bgColor}
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color={textColorSecondary} mb={2}>
                  Separador (opcional)
                </Text>
                <Input
                  placeholder="Ej: - o ninguno"
                  maxLength={1}
                  value={currentConfig.separator}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, separator: e.target.value })}
                  bg={bgColor}
                />
              </Box>
            </Grid>

            {/* Vista Previa */}
            <Box
              p={4}
              bg="rgba(0, 115, 230, 0.05)"
              borderRadius="md"
              border="1px"
              borderColor="rgba(0, 115, 230, 0.2)"
            >
              <VStack align="stretch" spacing={2}>
                <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                  Vista Previa del Formato:
                </Text>
                <HStack spacing={4}>
                  <Text fontSize="2xl" fontWeight="bold" color={primaryColor} fontFamily="monospace">
                    {currentConfig.example || 'ME0001250001'}
                  </Text>
                  <Box>
                    <Text fontSize="xs" color={textColorSecondary}>
                      Longitud total: {getTotalLength()} caracteres
                    </Text>
                    <Text fontSize="xs" color={getTotalLength() > 14 ? 'red.500' : 'green.600'}>
                      {getTotalLength() > 14 ? '⚠️ Excede límite recomendado' : '✓ Dentro del límite'}
                    </Text>
                  </Box>
                </HStack>
                <Text fontSize="xs" color={textColorSecondary}>
                  Estructura: [Producto][País][Agencia][Año][Secuencial]
                </Text>
              </VStack>
            </Box>

            <HStack spacing={4} justify="flex-end">
              <Button
                leftIcon={<FiRefreshCw />}
                variant="outline"
                borderColor={borderColor}
                color={textColor}
                onClick={generateExample}
              >
                Regenerar Ejemplo
              </Button>
              <Button
                leftIcon={<FiSave />}
                bg={primaryColor}
                color="white"
                _hover={{ opacity: 0.8 }}
                onClick={handleSave}
              >
                Guardar Configuración
              </Button>
            </HStack>
          </VStack>
        </Box>

        {/* Lista de Configuraciones Guardadas */}
        <Box>
          <Text fontSize="md" fontWeight="semibold" color={textColor} mb={4}>
            Configuraciones Guardadas
          </Text>
          <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={4}>
            {configs.map((config) => (
              <Card.Root key={config.id} bg={cardBg} borderColor={borderColor}>
                <Card.Body>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Text fontSize="md" fontWeight="bold" color={textColor}>
                        {config.clientName}
                      </Text>
                      <Button
                        size="xs"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => config.id && handleDelete(config.id)}
                      >
                        Eliminar
                      </Button>
                    </HStack>
                    <Box>
                      <Text fontSize="xs" color={textColorSecondary}>
                        Cliente ID: {config.clientId}
                      </Text>
                      <Text fontSize="xs" color={textColorSecondary}>
                        Producto: {productCodes.find(p => p.value === config.productCode)?.label}
                      </Text>
                      <Text fontSize="xs" color={textColorSecondary}>
                        País: {countryCodes.find(c => c.value === config.countryCode)?.label}
                      </Text>
                    </Box>
                    <Box
                      p={2}
                      bg={bgColor}
                      borderRadius="md"
                      border="1px"
                      borderColor={borderColor}
                    >
                      <Text fontSize="sm" fontFamily="monospace" fontWeight="bold" color={primaryColor}>
                        {config.example}
                      </Text>
                    </Box>
                  </VStack>
                </Card.Body>
              </Card.Root>
            ))}
          </Grid>
          {configs.length === 0 && (
            <Box
              p={8}
              textAlign="center"
              bg={cardBg}
              borderRadius="lg"
              border="1px"
              borderColor={borderColor}
            >
              <Text color={textColorSecondary}>
                No hay configuraciones guardadas. Cree una nueva configuración arriba.
              </Text>
            </Box>
          )}
        </Box>
      </VStack>
    </Box>
  );
};
