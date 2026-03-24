/**
 * Tarjeta de Análisis de Precios para Compras Públicas
 * Visualización del análisis de precios con comparación histórica
 */

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Spinner,
  Alert,
  Button,
  Card,
  Progress,
  Stat,
  Grid,
  Input
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiAlertTriangle,
  FiCheckCircle,
  FiBarChart2,
  FiSearch,
  FiArrowRight
} from 'react-icons/fi';
import { LuHistory, LuSparkles } from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';
import {
  analyzePrices,
  formatPrice,
  formatPercentage,
  getRiskColor,
  getRiskLabel
} from '../../../services/cpAIService';
import type { CPPriceAnalysisRequest, CPPriceAnalysisResponse } from '../../../services/cpAIService';

const MotionBox = motion.create(Box as any);
const MotionCard = motion.create(Card.Root as any);

interface CPPriceAnalysisCardProps {
  cpcCode?: string;
  itemDescription?: string;
  onPriceAnalyzed?: (response: CPPriceAnalysisResponse) => void;
}

export const CPPriceAnalysisCard: React.FC<CPPriceAnalysisCardProps> = ({
  cpcCode: initialCpcCode,
  itemDescription: initialDescription,
  onPriceAnalyzed
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CPPriceAnalysisResponse | null>(null);

  // Form state
  const [cpcCode, setCpcCode] = useState(initialCpcCode || '');
  const [itemDescription, setItemDescription] = useState(initialDescription || '');
  const [proposedPrice, setProposedPrice] = useState<string>('');
  const [unit, setUnit] = useState('Unidad');
  const [quantity, setQuantity] = useState<string>('1');

  const cardBg = 'white';
  const borderColor = 'gray.200';

  const handleAnalyze = async () => {
    if (!cpcCode || !proposedPrice) {
      setError('Por favor ingrese el código CPC y el precio propuesto');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: CPPriceAnalysisRequest = {
        cpcCode,
        itemDescription,
        proposedPrice: parseFloat(proposedPrice),
        unit,
        quantity: parseFloat(quantity) || 1
      };

      const response = await analyzePrices(request);
      setAnalysis(response);
      onPriceAnalyzed?.(response);
    } catch (err: any) {
      setError(err.message || 'Error al analizar precio');
    } finally {
      setLoading(false);
    }
  };

  const RiskBadge = ({ level }: { level: string }) => {
    const colorMap: Record<string, string> = {
      LOW: 'green',
      MEDIUM: 'orange',
      HIGH: 'red',
      CRITICAL: 'red'
    };

    return (
      <Badge
        colorPalette={colorMap[level] || 'gray'}
        variant="solid"
        fontSize="md"
        px={3}
        py={1}
        borderRadius="full"
      >
        {getRiskLabel(level)}
      </Badge>
    );
  };

  const PriceGauge = () => {
    if (!analysis) return null;

    const { historicalStats, proposedPrice, percentileRank } = analysis;
    const range = historicalStats.max - historicalStats.min;
    const normalizedPrice = range > 0
      ? ((proposedPrice - historicalStats.min) / range) * 100
      : 50;

    return (
      <Box position="relative" h="80px" mt={4}>
        {/* Barra de rango */}
        <Box
          position="absolute"
          top="30px"
          left="0"
          right="0"
          h="20px"
          borderRadius="full"
          bgGradient="linear(to-r, green.400, yellow.400, orange.400, red.400)"
        />

        {/* Indicadores de precios */}
        <HStack position="absolute" top="55px" left="0" right="0" justify="space-between">
          <Text fontSize="xs" color="green.500" fontWeight="bold">
            {formatPrice(historicalStats.min)}
          </Text>
          <Text fontSize="xs" color="gray.500">
            Prom: {formatPrice(historicalStats.average)}
          </Text>
          <Text fontSize="xs" color="red.500" fontWeight="bold">
            {formatPrice(historicalStats.max)}
          </Text>
        </HStack>

        {/* Marcador del precio propuesto */}
        <MotionBox
          position="absolute"
          top="15px"
          left={`${Math.min(Math.max(normalizedPrice, 5), 95)}%`}
          transform="translateX(-50%)"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <VStack gap={0}>
            <Box
              bg={getRiskColor(analysis.riskLevel)}
              color="white"
              px={2}
              py={1}
              borderRadius="md"
              fontSize="sm"
              fontWeight="bold"
              boxShadow="lg"
            >
              {formatPrice(proposedPrice)}
            </Box>
            <Box
              w={0}
              h={0}
              borderLeft="8px solid transparent"
              borderRight="8px solid transparent"
              borderTop={`8px solid ${getRiskColor(analysis.riskLevel)}`}
            />
          </VStack>
        </MotionBox>
      </Box>
    );
  };

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      bg={cardBg}
      borderColor={borderColor}
      borderWidth="1px"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="lg"
    >
      {/* Header */}
      <Box
        background="linear-gradient(135deg, #059669 0%, #10B981 100%)"
        p={4}
        color="white"
      >
        <HStack>
          <Icon as={FiBarChart2} boxSize={6} />
          <VStack align="start" gap={0}>
            <Text fontWeight="bold" fontSize="lg">Análisis de Precios</Text>
            <Text fontSize="sm" opacity={0.9}>Comparación con datos históricos SERCOP</Text>
          </VStack>
        </HStack>
      </Box>

      <Card.Body p={4}>
        <VStack align="stretch" gap={4}>
          {/* Formulario de búsqueda */}
          {!analysis && (
            <VStack align="stretch" gap={3}>
              <Grid templateColumns="1fr 1fr" gap={3}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>Código CPC</Text>
                  <Input
                    placeholder="Ej: 43211503"
                    value={cpcCode}
                    onChange={(e) => setCpcCode(e.target.value)}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>Precio Propuesto ($)</Text>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                  />
                </Box>
              </Grid>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>Descripción del Item</Text>
                <Input
                  placeholder="Descripción del bien o servicio"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                />
              </Box>

              <Grid templateColumns="1fr 1fr" gap={3}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>Unidad</Text>
                  <Input
                    placeholder="Unidad"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>Cantidad</Text>
                  <Input
                    type="number"
                    placeholder="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </Box>
              </Grid>

              {error && (
                <Alert.Root status="error" borderRadius="md">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Description>{error}</Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              )}

              <Button
                colorPalette="green"
                size="lg"
                onClick={handleAnalyze}
                loading={loading}
                loadingText="Analizando..."
              >
                <Icon as={FiSearch} mr={2} />
                Analizar Precio
              </Button>
            </VStack>
          )}

          {/* Resultados del análisis */}
          <AnimatePresence>
            {analysis && (
              <MotionBox
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <VStack align="stretch" gap={4}>
                  {/* Score y nivel de riesgo */}
                  <HStack justify="space-between" align="center">
                    <VStack align="start" gap={1}>
                      <Text fontSize="sm" color="gray.500">Nivel de Riesgo</Text>
                      <RiskBadge level={analysis.riskLevel} />
                    </VStack>
                    <VStack align="end" gap={1}>
                      <Text fontSize="sm" color="gray.500">Score de Anomalía</Text>
                      <HStack>
                        <Progress.Root
                          value={analysis.anomalyScore}
                          w="100px"
                          h="8px"
                          colorPalette={analysis.anomalyScore < 30 ? 'green' : analysis.anomalyScore < 60 ? 'orange' : 'red'}
                        >
                          <Progress.Track>
                            <Progress.Range />
                          </Progress.Track>
                        </Progress.Root>
                        <Text fontWeight="bold">{analysis.anomalyScore}</Text>
                      </HStack>
                    </VStack>
                  </HStack>

                  {/* Gauge de precio */}
                  <PriceGauge />

                  {/* Estadísticas */}
                  <Grid templateColumns="repeat(3, 1fr)" gap={3} mt={4}>
                    <Stat.Root textAlign="center" p={3} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="lg">
                      <Stat.Label fontSize="xs">Promedio</Stat.Label>
                      <Stat.ValueText fontSize="lg" color="blue.500">
                        {formatPrice(analysis.historicalStats.average)}
                      </Stat.ValueText>
                    </Stat.Root>
                    <Stat.Root textAlign="center" p={3} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="lg">
                      <Stat.Label fontSize="xs">Desviación</Stat.Label>
                      <Stat.ValueText fontSize="lg" color={analysis.deviationFromAverage > 0 ? 'red.500' : 'green.500'}>
                        <HStack justify="center">
                          <Icon as={analysis.deviationFromAverage > 0 ? FiTrendingUp : FiTrendingDown} />
                          <span>{formatPercentage(analysis.deviationFromAverage)}</span>
                        </HStack>
                      </Stat.ValueText>
                    </Stat.Root>
                    <Stat.Root textAlign="center" p={3} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="lg">
                      <Stat.Label fontSize="xs">Muestras</Stat.Label>
                      <Stat.ValueText fontSize="lg" color="purple.500">
                        <HStack justify="center">
                          <Icon as={LuHistory} boxSize={4} />
                          <span>{analysis.historicalStats.sampleCount}</span>
                        </HStack>
                      </Stat.ValueText>
                    </Stat.Root>
                  </Grid>

                  {/* Recomendación */}
                  <Box
                    p={4}
                    bg={analysis.riskLevel === 'LOW' ? 'green.50' : analysis.riskLevel === 'CRITICAL' ? 'red.50' : 'orange.50'}
                    _dark={{
                      bg: analysis.riskLevel === 'LOW' ? 'green.900' : analysis.riskLevel === 'CRITICAL' ? 'red.900' : 'orange.900'
                    }}
                    borderRadius="lg"
                    borderLeftWidth="4px"
                    borderLeftColor={getRiskColor(analysis.riskLevel)}
                  >
                    <HStack mb={2}>
                      <Icon
                        as={analysis.riskLevel === 'LOW' ? CheckCircle : AlertTriangle}
                        color={getRiskColor(analysis.riskLevel)}
                      />
                      <Text fontWeight="bold">Recomendación</Text>
                    </HStack>
                    <Text fontSize="sm">{analysis.recommendation}</Text>
                  </Box>

                  {/* Advertencias */}
                  {analysis.warnings.length > 0 && (
                    <VStack align="stretch" gap={2}>
                      {analysis.warnings.map((warning, idx) => (
                        <HStack key={idx} p={2} bg="orange.50" _dark={{ bg: 'orange.900' }} borderRadius="md">
                          <Icon as={FiAlertTriangle} color="orange.500" boxSize={4} />
                          <Text fontSize="sm">{warning}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  )}

                  {/* Rango sugerido */}
                  {analysis.suggestedPriceRange && (
                    <HStack
                      justify="center"
                      p={3}
                      bg="blue.50"
                      _dark={{ bg: 'blue.900' }}
                      borderRadius="lg"
                    >
                      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                        Rango sugerido:
                      </Text>
                      <Text fontWeight="bold" color="blue.600" _dark={{ color: 'blue.300' }}>
                        {formatPrice(analysis.suggestedPriceRange.min)}
                      </Text>
                      <Icon as={FiArrowRight} color="gray.400" />
                      <Text fontWeight="bold" color="blue.600" _dark={{ color: 'blue.300' }}>
                        {formatPrice(analysis.suggestedPriceRange.max)}
                      </Text>
                    </HStack>
                  )}

                  {/* Botón para nuevo análisis */}
                  <Button
                    variant="outline"
                    onClick={() => setAnalysis(null)}
                    size="sm"
                  >
                    Nuevo Análisis
                  </Button>

                  {/* Footer */}
                  <HStack justify="space-between" pt={2} borderTopWidth="1px" borderColor={borderColor}>
                    <Text fontSize="xs" color="gray.400">
                      Procesado en {analysis.processingTimeMs}ms
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      {analysis.provider} / {analysis.model}
                    </Text>
                  </HStack>
                </VStack>
              </MotionBox>
            )}
          </AnimatePresence>
        </VStack>
      </Card.Body>
    </MotionCard>
  );
};

export default CPPriceAnalysisCard;
