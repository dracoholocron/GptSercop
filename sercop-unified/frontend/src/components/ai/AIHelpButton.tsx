/**
 * AIHelpButton - Help button with examples and usage guide
 */

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Badge,
  Icon,
  Heading,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  FiHelpCircle,
  FiX,
  FiMessageSquare,
  FiPieChart,
  FiDollarSign,
  FiTrendingUp,
  FiClock,
  FiBook,
  FiMail,
  FiSearch,
  FiZap,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

interface AIHelpButtonProps {
  onExampleClick?: (query: string) => void;
}

interface ExampleItem {
  icon: React.ElementType;
  category: string;
  categoryColor: string;
  examples: Array<{
    query: string;
    description: string;
  }>;
}

const HELP_EXAMPLES: ExampleItem[] = [
  {
    icon: FiPieChart,
    category: 'Estadísticas',
    categoryColor: 'blue',
    examples: [
      { query: 'estadísticas generales', description: 'Ver resumen del sistema' },
      { query: 'distribución por tipo', description: 'Operaciones por producto' },
    ],
  },
  {
    icon: FiDollarSign,
    category: 'Montos',
    categoryColor: 'green',
    examples: [
      { query: 'resumen de montos', description: 'Totales por moneda' },
      { query: 'operaciones mayores a 100000', description: 'Filtrar por monto' },
    ],
  },
  {
    icon: FiTrendingUp,
    category: 'Tendencias',
    categoryColor: 'purple',
    examples: [
      { query: 'comparación mensual', description: 'Evolución mes a mes' },
      { query: 'tendencia últimos 6 meses', description: 'Histórico reciente' },
    ],
  },
  {
    icon: FiClock,
    category: 'Vencimientos',
    categoryColor: 'orange',
    examples: [
      { query: 'operaciones por vencer esta semana', description: 'Próximos 7 días' },
      { query: 'alertas pendientes', description: 'Requieren atención' },
    ],
  },
  {
    icon: FiBook,
    category: 'Contabilidad',
    categoryColor: 'teal',
    examples: [
      { query: 'resumen contable', description: 'Débitos y créditos' },
      { query: 'balance cuenta 1101', description: 'Busca cuentas que contengan 1101' },
      { query: 'balance cuenta 6302', description: 'Todas las cuentas con 6302' },
      { query: 'saldo operación B145061', description: 'Asientos de operación' },
      { query: 'buscar referencia LC-2024-001', description: 'Buscar por referencia GLE' },
    ],
  },
  {
    icon: FiMail,
    category: 'SWIFT',
    categoryColor: 'cyan',
    examples: [
      { query: 'mensajes swift', description: 'Análisis de mensajería' },
      { query: 'MT700 pendientes', description: 'Mensajes por tipo' },
      { query: 'buscar en swift BENEFICIARY', description: 'Buscar texto en mensajes' },
      { query: 'swift que contenga USD', description: 'Buscar por contenido' },
    ],
  },
];

export const AIHelpButton = ({ onExampleClick }: AIHelpButtonProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const [isOpen, setIsOpen] = useState(false);

  const handleExampleClick = (query: string) => {
    onExampleClick?.(query);
    setIsOpen(false);
  };

  return (
    <>
      {/* Help Button */}
      <IconButton
        aria-label={t('ai.help.title', 'Ayuda')}
        variant="ghost"
        colorPalette="purple"
        size="sm"
        borderRadius="full"
        onClick={() => setIsOpen(true)}
      >
        <FiHelpCircle size={20} />
      </IconButton>

      {/* Help Modal/Drawer */}
      {isOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.500"
          zIndex={1000}
          onClick={() => setIsOpen(false)}
        >
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            bg={colors.cardBg}
            borderRadius="2xl"
            boxShadow="2xl"
            maxW="700px"
            w="90%"
            maxH="80vh"
            overflowY="auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <HStack
              justify="space-between"
              p={4}
              borderBottom="1px"
              borderColor={colors.borderColor}
              position="sticky"
              top={0}
              bg={colors.cardBg}
              zIndex={1}
            >
              <HStack gap={3}>
                <Box p={2} bg="purple.100" borderRadius="lg">
                  <FiHelpCircle size={20} color="var(--chakra-colors-purple-600)" />
                </Box>
                <Box>
                  <Heading size="md" color={colors.textColor}>
                    {t('ai.help.title', 'Ayuda del Asistente')}
                  </Heading>
                  <Text fontSize="sm" color={colors.textColorSecondary}>
                    {t('ai.help.subtitle', 'Ejemplos de consultas que puedes hacer')}
                  </Text>
                </Box>
              </HStack>
              <IconButton
                aria-label="Cerrar"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <FiX />
              </IconButton>
            </HStack>

            {/* Content */}
            <Box p={4}>
              {/* Quick Tips */}
              <Box
                p={4}
                bg="purple.50"
                borderRadius="xl"
                mb={6}
              >
                <HStack gap={2} mb={2}>
                  <Icon as={FiZap} color="purple.600" />
                  <Text fontWeight="semibold" color="purple.700">
                    {t('ai.help.tips', 'Consejos rápidos')}
                  </Text>
                </HStack>
                <VStack align="start" gap={1} fontSize="sm" color="purple.700">
                  <Text>• {t('ai.help.tip1', 'Usa las categorías para navegación guiada')}</Text>
                  <Text>• {t('ai.help.tip2', 'Escribe en el buscador para filtrar opciones')}</Text>
                  <Text>• {t('ai.help.tip3', 'Presiona Enter para hacer consultas libres')}</Text>
                  <Text>• {t('ai.help.tip4', 'Usa las flechas ↑↓ para navegar sugerencias')}</Text>
                  <Text>• {t('ai.help.tip5', 'La búsqueda de cuentas es parcial: "1101" encuentra todas las cuentas que contengan 1101')}</Text>
                </VStack>
              </Box>

              {/* Examples by Category */}
              <Heading size="sm" mb={4} color={colors.textColor}>
                {t('ai.help.examples', 'Ejemplos por categoría')}
              </Heading>

              <VStack gap={4} align="stretch">
                {HELP_EXAMPLES.map((category) => (
                  <Box
                    key={category.category}
                    p={4}
                    bg={colors.bgColor}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={colors.borderColor}
                  >
                    <HStack gap={2} mb={3}>
                      <Box p={1.5} bg={`${category.categoryColor}.100`} borderRadius="md">
                        <Icon
                          as={category.icon}
                          boxSize={4}
                          color={`${category.categoryColor}.600`}
                        />
                      </Box>
                      <Text fontWeight="semibold" color={colors.textColor}>
                        {category.category}
                      </Text>
                    </HStack>

                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
                      {category.examples.map((example, idx) => (
                        <Box
                          key={idx}
                          as="button"
                          p={3}
                          bg={colors.cardBg}
                          borderRadius="lg"
                          borderWidth="1px"
                          borderColor={colors.borderColor}
                          textAlign="left"
                          cursor="pointer"
                          transition="all 0.2s"
                          _hover={{
                            borderColor: `${category.categoryColor}.300`,
                            bg: `${category.categoryColor}.50`,
                          }}
                          onClick={() => handleExampleClick(example.query)}
                        >
                          <HStack justify="space-between" mb={1}>
                            <Text
                              fontSize="sm"
                              fontWeight="medium"
                              color={colors.textColor}
                            >
                              "{example.query}"
                            </Text>
                            <Icon
                              as={FiMessageSquare}
                              boxSize={3}
                              color={colors.textColorSecondary}
                            />
                          </HStack>
                          <Text fontSize="xs" color={colors.textColorSecondary}>
                            {example.description}
                          </Text>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </Box>
                ))}
              </VStack>

              {/* Search Hint */}
              <Box
                mt={6}
                p={4}
                bg={colors.bgColor}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={colors.borderColor}
              >
                <HStack gap={2} mb={2}>
                  <Icon as={FiSearch} color={colors.textColorSecondary} />
                  <Text fontWeight="semibold" color={colors.textColor}>
                    {t('ai.help.searchTitle', 'Búsqueda inteligente')}
                  </Text>
                </HStack>
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  {t('ai.help.searchDesc', 'Puedes escribir cualquier consulta en lenguaje natural. El asistente interpretará tu pregunta y mostrará los resultados más relevantes.')}
                </Text>
              </Box>
            </Box>

            {/* Footer */}
            <Box
              p={4}
              borderTop="1px"
              borderColor={colors.borderColor}
              textAlign="center"
            >
              <Button
                colorPalette="purple"
                onClick={() => setIsOpen(false)}
              >
                {t('ai.help.gotIt', 'Entendido')}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
};

export default AIHelpButton;
