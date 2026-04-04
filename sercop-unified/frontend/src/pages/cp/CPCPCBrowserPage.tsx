/**
 * CPCPCBrowserPage - Página de exploración del Clasificador Central de Productos (CPC)
 * Usa el componente CPCPCSelector reutilizable
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Button,
  Icon,
  Flex,
  Card,
} from '@chakra-ui/react';
import { FiTag, FiInfo, FiCopy, FiCheck } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../../components/ui/toaster';
import { CPCPCSelector } from '../../components/compras-publicas/CPCPCSelector';

export const CPCPCBrowserPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const cardBg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.700' : 'gray.200';

  const copyToClipboard = () => {
    if (selectedCodes.length === 0) return;
    navigator.clipboard.writeText(selectedCodes.join(', ')).then(() => {
      setCopied(true);
      toaster.create({ title: `${selectedCodes.length} código(s) copiados al portapapeles`, type: 'success' });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toaster.create({ title: 'No se pudo copiar', type: 'error' });
    });
  };

  return (
    <Box maxW="900px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <HStack gap={3}>
            <Icon as={FiTag} boxSize={6} color={isDark ? 'purple.300' : 'purple.500'} />
            <VStack align="start" gap={0}>
              <Heading size="md">{t('cp.cpc.title', 'Clasificador Central de Productos (CPC)')}</Heading>
              <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
                Explore y seleccione actividades del clasificador de bienes, obras y servicios
              </Text>
            </VStack>
          </HStack>
          {selectedCodes.length > 0 && (
            <Button size="sm" variant="outline" onClick={copyToClipboard}>
              <Icon as={copied ? FiCheck : FiCopy} mr={2} />
              {copied ? 'Copiado' : `Copiar ${selectedCodes.length} código(s)`}
            </Button>
          )}
        </HStack>

        {/* Info box */}
        <Box bg={isDark ? 'blue.900' : 'blue.50'} borderRadius="lg" p={4} borderWidth="1px" borderColor={isDark ? 'blue.700' : 'blue.200'}>
          <HStack gap={2} mb={2}>
            <Icon as={FiInfo} color={isDark ? 'blue.300' : 'blue.500'} boxSize={4} />
            <Text fontSize="sm" fontWeight="600" color={isDark ? 'blue.300' : 'blue.600'}>
              {t('cp.cpc.about', '¿Qué es el CPC?')}
            </Text>
          </HStack>
          <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.600'}>
            El Clasificador Central de Productos (CPC) es la nomenclatura oficial de Compras Públicas del Ecuador
            utilizada para clasificar bienes, obras y servicios en procesos de contratación. Los códigos CPC
            identifican las actividades registradas en el RUP de cada proveedor.
          </Text>
        </Box>

        {/* Two-column layout: selector + details */}
        <HStack gap={5} align="flex-start" flexWrap={{ base: 'wrap', lg: 'nowrap' }}>
          {/* Selector */}
          <Box flex={2} minW="300px">
            <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={4}>
              <Text fontWeight="600" fontSize="sm" mb={3}>
                <Icon as={FiTag} mr={2} />
                {t('cp.cpc.search', 'Buscar y seleccionar códigos')}
              </Text>
              <CPCPCSelector
                value={selectedCodes}
                onChange={setSelectedCodes}
                multiple
                placeholder="Buscar código CPC o descripción de actividad..."
              />
            </Box>
          </Box>

          {/* Selection summary */}
          <Box flex={1} minW="220px">
            <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={4}>
              <Text fontWeight="600" fontSize="sm" mb={3}>
                {t('cp.cpc.selected', 'Selección actual')}
                {selectedCodes.length > 0 && (
                  <Badge ml={2} colorPalette="purple" variant="solid" fontSize="xs">{selectedCodes.length}</Badge>
                )}
              </Text>
              {selectedCodes.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <Icon as={FiTag} boxSize={8} color="gray.400" mb={2} />
                  <Text fontSize="sm" color={isDark ? 'gray.500' : 'gray.400'}>
                    {t('cp.cpc.empty', 'Sin selección')}
                  </Text>
                  <Text fontSize="xs" color={isDark ? 'gray.600' : 'gray.400'} mt={1}>
                    Use el buscador o el árbol para seleccionar códigos
                  </Text>
                </Box>
              ) : (
                <VStack align="stretch" gap={2} maxH="400px" overflowY="auto">
                  {selectedCodes.map(code => (
                    <HStack
                      key={code}
                      bg={isDark ? 'gray.750' : 'gray.50'}
                      borderRadius="md"
                      px={3}
                      py={2}
                      justify="space-between"
                    >
                      <Text fontSize="xs" fontFamily="mono" fontWeight="700">{code}</Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => setSelectedCodes(prev => prev.filter(c => c !== code))}
                      >
                        ×
                      </Button>
                    </HStack>
                  ))}
                  {selectedCodes.length > 0 && (
                    <Button size="xs" variant="outline" colorPalette="gray" onClick={() => setSelectedCodes([])}>
                      Limpiar selección
                    </Button>
                  )}
                </VStack>
              )}
            </Box>

            {selectedCodes.length > 0 && (
              <Box mt={3}>
                <Button colorPalette="purple" size="sm" w="full" onClick={copyToClipboard}>
                  <Icon as={copied ? FiCheck : FiCopy} mr={2} />
                  {copied ? 'Copiado!' : 'Copiar códigos'}
                </Button>
              </Box>
            )}
          </Box>
        </HStack>
      </VStack>
    </Box>
  );
};

export default CPCPCBrowserPage;
