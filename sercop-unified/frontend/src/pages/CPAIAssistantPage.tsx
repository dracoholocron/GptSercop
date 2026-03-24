/**
 * Página Principal de Asistencia IA para Compras Públicas
 * Panel integrado con todos los módulos de IA del sistema
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Heading,
  Card,
  Grid,
  Icon,
  Badge,
  Tabs,
  Button,
  Separator
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiShield,
  FiFileText,
  FiBarChart2,
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiZap,
  FiSearch,
  FiActivity
} from 'react-icons/fi';
import { LuScale, LuSparkles, LuBrain, LuLightbulb } from 'react-icons/lu';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Componentes de IA
import CPLegalHelpPanel from '../components/compras-publicas/ai/CPLegalHelpPanel';
import CPPriceAnalysisCard from '../components/compras-publicas/ai/CPPriceAnalysisCard';
import CPRiskAnalysisPanel from '../components/compras-publicas/ai/CPRiskAnalysisPanel';

const MotionBox = motion.create(Box as any);
const MotionCard = motion.create(Card.Root as any);

// Estadísticas de demostración
const aiStats = [
  { label: 'Análisis realizados', value: '1,247', icon: LuBrain, color: 'purple' },
  { label: 'Riesgos detectados', value: '89', icon: FiAlertTriangle, color: 'orange' },
  { label: 'Tiempo ahorrado', value: '320h', icon: FiClock, color: 'blue' },
  { label: 'Precisión promedio', value: '94%', icon: FiCheckCircle, color: 'green' }
];

// Módulos disponibles
const aiModules = [
  {
    id: 'legal',
    name: 'Asistente Legal',
    description: 'Ayuda contextual basada en LOSNCP, RGLOSNCP y resoluciones SERCOP',
    icon: LuScale,
    color: 'purple',
    features: ['Referencias legales exactas', 'Requisitos por tipo de proceso', 'Errores comunes a evitar', 'Ejemplos de redacción']
  },
  {
    id: 'prices',
    name: 'Análisis de Precios',
    description: 'Comparación con datos históricos de contratación pública',
    icon: FiTrendingUp,
    color: 'green',
    features: ['Precios históricos SERCOP', 'Detección de anomalías', 'Rango sugerido', 'Justificación automática']
  },
  {
    id: 'risks',
    name: 'Detección de Riesgos',
    description: 'Identificación de indicadores de irregularidades',
    icon: FiShield,
    color: 'red',
    features: ['8 indicadores de riesgo', 'Score ponderado', 'Patrones sospechosos', 'Recomendaciones de acción']
  },
  {
    id: 'extraction',
    name: 'Extracción de Documentos',
    description: 'Lectura automática de pliegos, TDR y especificaciones',
    icon: FiSearch,
    color: 'blue',
    features: ['OCR inteligente', 'Mapeo a formularios', 'Validación automática', 'Multi-formato']
  },
  {
    id: 'generator',
    name: 'Generador de Pliegos',
    description: 'Creación de documentos basados en modelos SERCOP',
    icon: FiFileText,
    color: 'teal',
    features: ['Modelos SERCOP', 'Personalización automática', 'Cláusulas obligatorias', 'Revisión legal']
  }
];

export const CPAIAssistantPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const bgGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  const cardBg = 'white';
  const borderColor = 'gray.200';

  const ModuleCard = ({ module, index }: { module: typeof aiModules[0]; index: number }) => {
    const colorMap: Record<string, { light: string; dark: string; border: string }> = {
      purple: { light: '#7C3AED', dark: '#4C1D95', border: '#8B5CF6' },
      green: { light: '#10B981', dark: '#065F46', border: '#34D399' },
      red: { light: '#EF4444', dark: '#7F1D1D', border: '#F87171' },
      blue: { light: '#3B82F6', dark: '#1E3A8A', border: '#60A5FA' },
      teal: { light: '#14B8A6', dark: '#134E4A', border: '#2DD4BF' },
      orange: { light: '#F97316', dark: '#7C2D12', border: '#FB923C' }
    };

    const colors = colorMap[module.color] || colorMap.purple;

    return (
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.02, y: -5 }}
        cursor="pointer"
        onClick={() => setSelectedModule(module.id)}
        bg={cardBg}
        borderWidth="2px"
        borderColor={selectedModule === module.id ? colors.border : borderColor}
        borderRadius="xl"
        overflow="hidden"
        boxShadow={selectedModule === module.id ? `0 0 20px ${colors.border}40` : 'lg'}
      >
        <Box
          h="4px"
          background={`linear-gradient(90deg, ${colors.light} 0%, ${colors.dark} 100%)`}
        />
        <Card.Body p={5}>
          <HStack mb={3}>
            <Box
              p={3}
              borderRadius="xl"
              background={`linear-gradient(135deg, ${colors.light}20 0%, ${colors.dark}20 100%)`}
            >
              <Icon as={module.icon} boxSize={6} color={colors.light} />
            </Box>
            <VStack align="start" gap={0} flex={1}>
              <Text fontWeight="bold" fontSize="lg">{module.name}</Text>
              <Badge colorPalette={module.color} variant="subtle" fontSize="xs">
                Potenciado por IA
              </Badge>
            </VStack>
          </HStack>

          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} mb={4}>
            {module.description}
          </Text>

          <VStack align="stretch" gap={1}>
            {module.features.map((feature, idx) => (
              <HStack key={idx} fontSize="xs" color="gray.500">
                <Icon as={FiCheckCircle} boxSize={3} color={colors.light} />
                <Text>{feature}</Text>
              </HStack>
            ))}
          </VStack>

          <Button
            mt={4}
            size="sm"
            variant={selectedModule === module.id ? 'solid' : 'outline'}
            colorPalette={module.color}
            w="full"
          >
            {selectedModule === module.id ? 'Seleccionado' : 'Usar módulo'}
            <Icon as={FiArrowRight} ml={2} />
          </Button>
        </Card.Body>
      </MotionCard>
    );
  };

  const StatCard = ({ stat, index }: { stat: typeof aiStats[0]; index: number }) => {
    const colorMap: Record<string, string> = {
      purple: '#8B5CF6',
      orange: '#F97316',
      blue: '#3B82F6',
      green: '#10B981'
    };

    return (
      <MotionBox
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        p={4}
        bg={cardBg}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={borderColor}
        textAlign="center"
      >
        <Icon as={stat.icon} boxSize={8} color={colorMap[stat.color]} mb={2} />
        <Text fontSize="2xl" fontWeight="bold" color={colorMap[stat.color]}>
          {stat.value}
        </Text>
        <Text fontSize="sm" color="gray.500">{stat.label}</Text>
      </MotionBox>
    );
  };

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      {/* Hero Header */}
      <Box
        background={bgGradient}
        color="white"
        py={12}
        px={6}
        position="relative"
        overflow="hidden"
      >
        {/* Animated background elements */}
        <MotionBox
          position="absolute"
          top="-50%"
          right="-20%"
          w="600px"
          h="600px"
          borderRadius="full"
          bg="whiteAlpha.100"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
        />

        <Container maxW="container.xl" position="relative">
          <HStack justify="space-between" align="start" flexWrap="wrap" gap={6}>
            <VStack align="start" gap={4} maxW="600px">
              <HStack>
                <Icon as={LuSparkles} boxSize={8} />
                <Badge colorPalette="whiteAlpha" variant="solid" fontSize="md" px={3}>
                  Inteligencia Artificial
                </Badge>
              </HStack>

              <Heading size="2xl" fontWeight="black">
                Asistente de Compras Públicas
              </Heading>

              <Text fontSize="xl" opacity={0.9}>
                Sistema de IA para optimizar procesos de contratación pública de Ecuador.
                Análisis legal, detección de riesgos y precios referenciales.
              </Text>

              <HStack gap={4} pt={2}>
                <Button
                  size="lg"
                  colorPalette="whiteAlpha"
                  variant="solid"
                  leftIcon={<Zap />}
                >
                  Iniciar Análisis
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  borderColor="whiteAlpha.500"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  leftIcon={<Lightbulb />}
                >
                  Ver Tutorial
                </Button>
              </HStack>
            </VStack>

            {/* Stats */}
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              {aiStats.map((stat, idx) => (
                <StatCard key={idx} stat={stat} index={idx} />
              ))}
            </Grid>
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={8}>
        <Tabs.Root defaultValue="overview">
          <Tabs.List mb={6}>
            <Tabs.Trigger value="overview">
              <Icon as={LuBrain} mr={2} />
              Visión General
            </Tabs.Trigger>
            <Tabs.Trigger value="legal">
              <Icon as={LuScale} mr={2} />
              Asistente Legal
            </Tabs.Trigger>
            <Tabs.Trigger value="prices">
              <Icon as={FiBarChart2} mr={2} />
              Análisis de Precios
            </Tabs.Trigger>
            <Tabs.Trigger value="risks">
              <Icon as={FiShield} mr={2} />
              Detección de Riesgos
            </Tabs.Trigger>
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Content value="overview">
            <VStack align="stretch" gap={8}>
              <Box>
                <Heading size="lg" mb={2}>Módulos Disponibles</Heading>
                <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                  Selecciona un módulo para comenzar a usar la asistencia de IA
                </Text>
              </Box>

              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                {aiModules.map((module, idx) => (
                  <ModuleCard key={module.id} module={module} index={idx} />
                ))}
              </Grid>

              {/* Features Section */}
              <Box mt={8}>
                <Heading size="lg" mb={6}>Características del Sistema</Heading>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
                  <Card.Root bg={cardBg} borderRadius="xl">
                    <Card.Body>
                      <Icon as={LuBrain} boxSize={10} color="purple.500" mb={4} />
                      <Heading size="md" mb={2}>100% Configurable</Heading>
                      <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                        Todos los prompts, indicadores y umbrales son configurables desde la base de datos sin necesidad de código.
                      </Text>
                    </Card.Body>
                  </Card.Root>

                  <Card.Root bg={cardBg} borderRadius="xl">
                    <Card.Body>
                      <Icon as={FiShield} boxSize={10} color="green.500" mb={4} />
                      <Heading size="md" mb={2}>Multi-Proveedor</Heading>
                      <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                        Compatible con Claude, OpenAI y Gemini. Cambia de proveedor sin modificar código.
                      </Text>
                    </Card.Body>
                  </Card.Root>

                  <Card.Root bg={cardBg} borderRadius="xl">
                    <Card.Body>
                      <Icon as={FiBarChart2} boxSize={10} color="blue.500" mb={4} />
                      <Heading size="md" mb={2}>Datos Históricos</Heading>
                      <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                        Análisis basado en datos reales de contratación pública de SERCOP para mayor precisión.
                      </Text>
                    </Card.Body>
                  </Card.Root>
                </Grid>
              </Box>
            </VStack>
          </Tabs.Content>

          {/* Legal Tab */}
          <Tabs.Content value="legal">
            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
              <VStack align="stretch" gap={4}>
                <Heading size="md">Solicitar Ayuda Legal</Heading>
                <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                  Obtén referencias legales precisas basadas en LOSNCP, RGLOSNCP y resoluciones SERCOP.
                </Text>

                <Card.Root bg={cardBg}>
                  <Card.Body>
                    <VStack align="stretch" gap={3}>
                      <Box>
                        <Text fontWeight="medium" mb={1}>Tipo de Proceso</Text>
                        <Text fontSize="sm" color="gray.500">Subasta Inversa Electrónica (SIE)</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="medium" mb={1}>Etapa Actual</Text>
                        <Text fontSize="sm" color="gray.500">Elaboración de Pliegos</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="medium" mb={1}>Campo</Text>
                        <Text fontSize="sm" color="gray.500">Especificaciones Técnicas</Text>
                      </Box>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </VStack>

              <CPLegalHelpPanel
                processType="SIE"
                currentStep="pliegos"
                fieldId="especificaciones_tecnicas"
                budget={50000}
              />
            </Grid>
          </Tabs.Content>

          {/* Prices Tab */}
          <Tabs.Content value="prices">
            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
              <CPPriceAnalysisCard />

              <Card.Root bg={cardBg}>
                <Card.Header>
                  <Heading size="md">Datos Históricos</Heading>
                </Card.Header>
                <Card.Body>
                  <VStack align="stretch" gap={4}>
                    <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                      El análisis de precios utiliza datos históricos de contratación pública para comparar
                      el precio propuesto con el mercado.
                    </Text>

                    <Box p={4} bg="blue.50" _dark={{ bg: 'blue.900' }} borderRadius="lg">
                      <HStack>
                        <Icon as={LuLightbulb} color="blue.500" />
                        <Text fontWeight="medium" color="blue.700" _dark={{ color: 'blue.200' }}>
                          Tip: Ingresa el código CPC correcto para obtener mejores resultados
                        </Text>
                      </HStack>
                    </Box>

                    <Separator />

                    <Text fontWeight="medium">Fuentes de datos:</Text>
                    <VStack align="start" gap={2}>
                      <HStack>
                        <Icon as={FiCheckCircle} color="green.500" boxSize={4} />
                        <Text fontSize="sm">Portal de Compras Públicas SERCOP</Text>
                      </HStack>
                      <HStack>
                        <Icon as={FiCheckCircle} color="green.500" boxSize={4} />
                        <Text fontSize="sm">Catálogo Electrónico</Text>
                      </HStack>
                      <HStack>
                        <Icon as={FiCheckCircle} color="green.500" boxSize={4} />
                        <Text fontSize="sm">Datos de adjudicaciones 2022-2026</Text>
                      </HStack>
                    </VStack>
                  </VStack>
                </Card.Body>
              </Card.Root>
            </Grid>
          </Tabs.Content>

          {/* Risks Tab */}
          <Tabs.Content value="risks">
            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
              <CPRiskAnalysisPanel
                processCode="SIE-2024-001234"
                processType="SIE"
                entityRuc="1790001234001"
                entityName="Municipio de Ejemplo"
                budget={150000}
                publicationDate="2024-02-01"
                deadlineDate="2024-02-15"
                bidders={[
                  { ruc: '1791234567001', name: 'Proveedor A', offeredPrice: 145000 },
                  { ruc: '1791234568001', name: 'Proveedor B', offeredPrice: 148000 }
                ]}
              />

              <Card.Root bg={cardBg}>
                <Card.Header>
                  <Heading size="md">Indicadores de Riesgo</Heading>
                </Card.Header>
                <Card.Body>
                  <VStack align="stretch" gap={4}>
                    <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                      El sistema evalúa 8 indicadores de riesgo configurables para detectar
                      posibles irregularidades en los procesos de contratación.
                    </Text>

                    <Box p={4} bg="red.50" _dark={{ bg: 'red.900' }} borderRadius="lg">
                      <HStack>
                        <Icon as={FiAlertTriangle} color="red.500" />
                        <Text fontWeight="medium" color="red.700" _dark={{ color: 'red.200' }}>
                          Los resultados son orientativos y requieren validación humana
                        </Text>
                      </HStack>
                    </Box>

                    <Separator />

                    <Text fontWeight="medium">Indicadores evaluados:</Text>
                    <Grid templateColumns="1fr 1fr" gap={2}>
                      {[
                        'Oferente Único',
                        'Precios Idénticos',
                        'Ganador Repetitivo',
                        'Fraccionamiento',
                        'Plazo Insuficiente',
                        'Especificaciones Dirigidas',
                        'Conflicto de Interés',
                        'Anomalía de Precio'
                      ].map((indicator, idx) => (
                        <HStack key={idx} fontSize="sm">
                          <Icon as={FiShield} boxSize={3} color="purple.500" />
                          <Text>{indicator}</Text>
                        </HStack>
                      ))}
                    </Grid>
                  </VStack>
                </Card.Body>
              </Card.Root>
            </Grid>
          </Tabs.Content>
        </Tabs.Root>
      </Container>
    </Box>
  );
};

export default CPAIAssistantPage;
