/**
 * Panel de Análisis de Riesgos para Compras Públicas
 * Detección de indicadores de riesgo de corrupción
 */

import React, { useState, useEffect } from 'react';
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
  Grid,
  Separator
} from '@chakra-ui/react';
import {
  FiShield,
  FiAlertTriangle,
  FiAlertOctagon,
  FiEye,
  FiUsers,
  FiTrendingUp,
  FiClock,
  FiSearch,
  FiChevronRight,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import { LuShieldCheck, LuShieldAlert, LuSparkles } from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';
import {
  analyzeRisks,
  getRiskColor,
  getRiskLabel
} from '../../../services/cpAIService';
import type {
  CPRiskAnalysisRequest,
  CPRiskAnalysisResponse,
  DetectedIndicator,
  RiskPattern,
  RiskRecommendation
} from '../../../services/cpAIService';

const MotionBox = motion.create(Box as any);
const MotionCard = motion.create(Card.Root as any);

interface CPRiskAnalysisPanelProps {
  processCode: string;
  processType: string;
  entityRuc: string;
  entityName: string;
  budget: number;
  publicationDate?: string;
  deadlineDate?: string;
  bidders?: Array<{ ruc: string; name: string; offeredPrice: number }>;
  onAnalysisComplete?: (response: CPRiskAnalysisResponse) => void;
}

export const CPRiskAnalysisPanel: React.FC<CPRiskAnalysisPanelProps> = ({
  processCode,
  processType,
  entityRuc,
  entityName,
  budget,
  publicationDate,
  deadlineDate,
  bidders,
  onAnalysisComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CPRiskAnalysisResponse | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const cardBg = 'white';
  const borderColor = 'gray.200';

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const request: CPRiskAnalysisRequest = {
        processCode,
        processType,
        entityRuc,
        entityName,
        budget,
        publicationDate,
        deadlineDate,
        bidders: bidders?.map(b => ({
          ruc: b.ruc,
          name: b.name,
          offeredPrice: b.offeredPrice
        }))
      };

      const response = await analyzeRisks(request);
      setAnalysis(response);
      onAnalysisComplete?.(response);
    } catch (err: any) {
      setError(err.message || 'Error al analizar riesgos');
    } finally {
      setLoading(false);
    }
  };

  const RiskScoreGauge = ({ score, level }: { score: number; level: string }) => {
    const getGradient = () => {
      if (score < 25) return 'linear-gradient(135deg, #10B981 0%, #34D399 100%)';
      if (score < 50) return 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)';
      if (score < 75) return 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)';
      return 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)';
    };

    const getIcon = () => {
      if (score < 25) return LuShieldCheck;
      if (score < 50) return FiShield;
      if (score < 75) return LuShieldAlert;
      return FiAlertOctagon;
    };

    return (
      <MotionBox
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        position="relative"
        w="200px"
        h="200px"
        mx="auto"
      >
        {/* Círculo exterior */}
        <Box
          position="absolute"
          inset="0"
          borderRadius="full"
          background={getGradient()}
          opacity={0.2}
        />

        {/* Círculo de progreso */}
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="12"
          />
          <motion.circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke={getRiskColor(level)}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 534} 534`}
            transform="rotate(-90 100 100)"
            initial={{ strokeDasharray: '0 534' }}
            animate={{ strokeDasharray: `${(score / 100) * 534} 534` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>

        {/* Contenido central */}
        <VStack
          position="absolute"
          inset="0"
          justify="center"
          align="center"
        >
          <Icon as={getIcon()} boxSize={10} color={getRiskColor(level)} />
          <Text fontSize="4xl" fontWeight="bold" color={getRiskColor(level)}>
            {score}
          </Text>
          <Badge
            colorPalette={score < 25 ? 'green' : score < 50 ? 'orange' : 'red'}
            variant="solid"
            fontSize="md"
            px={3}
          >
            {getRiskLabel(level)}
          </Badge>
        </VStack>
      </MotionBox>
    );
  };

  const IndicatorCard = ({ indicator, index }: { indicator: DetectedIndicator; index: number }) => {
    const iconMap: Record<string, any> = {
      SINGLE_BIDDER: FiUsers,
      IDENTICAL_PRICES: FiTrendingUp,
      REPEAT_WINNER: FiUsers,
      FRACTIONING: FiSearch,
      SHORT_DEADLINE: FiClock,
      SPECIFIC_SPECS: FiSearch,
      CONFLICT_INTEREST: FiAlertOctagon,
      PRICE_ANOMALY: FiTrendingUp
    };

    return (
      <MotionCard
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        size="sm"
        variant={indicator.detected ? 'elevated' : 'outline'}
        borderColor={indicator.detected ? getRiskColor(indicator.severity) : borderColor}
        borderWidth={indicator.detected ? '2px' : '1px'}
        bg={indicator.detected ?
          `${indicator.severity === 'CRITICAL' ? 'red' : indicator.severity === 'HIGH' ? 'orange' : 'yellow'}.50` :
          'transparent'
        }
        _dark={{ bg: indicator.detected ? 'gray.800' : 'transparent' }}
      >
        <Card.Body p={3}>
          <HStack justify="space-between">
            <HStack>
              <Box
                p={2}
                borderRadius="lg"
                bg={indicator.detected ? getRiskColor(indicator.severity) : 'gray.200'}
                _dark={{ bg: indicator.detected ? getRiskColor(indicator.severity) : 'gray.600' }}
              >
                <Icon
                  as={iconMap[indicator.code] || AlertTriangle}
                  boxSize={4}
                  color={indicator.detected ? 'white' : 'gray.500'}
                />
              </Box>
              <VStack align="start" gap={0}>
                <Text fontWeight="semibold" fontSize="sm">{indicator.name}</Text>
                <Text fontSize="xs" color="gray.500">{indicator.code}</Text>
              </VStack>
            </HStack>
            <HStack>
              <Badge
                colorPalette={indicator.detected ? (
                  indicator.severity === 'CRITICAL' ? 'red' :
                  indicator.severity === 'HIGH' ? 'orange' :
                  indicator.severity === 'MEDIUM' ? 'yellow' : 'green'
                ) : 'gray'}
                variant="subtle"
              >
                {indicator.severity}
              </Badge>
              <Icon
                as={indicator.detected ? FiXCircle : FiCheckCircle}
                color={indicator.detected ? 'red.500' : 'green.500'}
                boxSize={5}
              />
            </HStack>
          </HStack>
          {indicator.detected && indicator.evidence && (
            <Box mt={2} p={2} bg="white" _dark={{ bg: 'gray.900' }} borderRadius="md">
              <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>
                <strong>Evidencia:</strong> {indicator.evidence}
              </Text>
            </Box>
          )}
        </Card.Body>
      </MotionCard>
    );
  };

  const RecommendationItem = ({ rec, index }: { rec: RiskRecommendation; index: number }) => (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
    >
      <HStack
        p={3}
        bg="gray.50"
        _dark={{ bg: 'gray.700' }}
        borderRadius="lg"
        borderLeftWidth="4px"
        borderLeftColor={
          rec.priority === 'HIGH' ? 'red.500' :
          rec.priority === 'MEDIUM' ? 'orange.500' : 'green.500'
        }
      >
        <VStack align="start" flex={1} gap={1}>
          <HStack>
            <Badge
              colorPalette={rec.priority === 'HIGH' ? 'red' : rec.priority === 'MEDIUM' ? 'orange' : 'green'}
              variant="subtle"
              fontSize="xs"
            >
              {rec.priority}
            </Badge>
            <Text fontSize="xs" color="gray.500">{rec.responsible}</Text>
          </HStack>
          <Text fontSize="sm">{rec.action}</Text>
        </VStack>
        <Icon as={FiChevronRight} color="gray.400" />
      </HStack>
    </MotionBox>
  );

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <MotionBox
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          display="inline-block"
        >
          <Icon as={FiShield} boxSize={12} color="purple.500" />
        </MotionBox>
        <Text mt={4} color="gray.500" fontWeight="medium">
          Analizando indicadores de riesgo...
        </Text>
        <Text fontSize="sm" color="gray.400" mt={2}>
          Evaluando {bidders?.length || 0} oferentes y patrones históricos
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      {!analysis ? (
        <MotionCard
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
        >
          <Box
            background="linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)"
            p={4}
            color="white"
          >
            <HStack>
              <Icon as={FiShield} boxSize={6} />
              <VStack align="start" gap={0}>
                <Text fontWeight="bold" fontSize="lg">Detección de Riesgos</Text>
                <Text fontSize="sm" opacity={0.9}>Análisis de indicadores de corrupción</Text>
              </VStack>
            </HStack>
          </Box>

          <Card.Body p={4}>
            <VStack gap={4}>
              <Grid templateColumns="1fr 1fr" gap={3} w="full">
                <Box p={3} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="lg">
                  <Text fontSize="xs" color="gray.500">Proceso</Text>
                  <Text fontWeight="semibold">{processCode}</Text>
                </Box>
                <Box p={3} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="lg">
                  <Text fontSize="xs" color="gray.500">Tipo</Text>
                  <Text fontWeight="semibold">{processType}</Text>
                </Box>
                <Box p={3} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="lg">
                  <Text fontSize="xs" color="gray.500">Entidad</Text>
                  <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>{entityName}</Text>
                </Box>
                <Box p={3} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="lg">
                  <Text fontSize="xs" color="gray.500">Presupuesto</Text>
                  <Text fontWeight="semibold">${budget.toLocaleString()}</Text>
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
                colorPalette="purple"
                size="lg"
                w="full"
                onClick={handleAnalyze}
              >
                <Icon as={FiEye} mr={2} />
                Analizar Riesgos
              </Button>
            </VStack>
          </Card.Body>
        </MotionCard>
      ) : (
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <VStack gap={4} align="stretch">
            {/* Score principal */}
            <Card.Root bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl">
              <Box
                background={`linear-gradient(135deg, ${getRiskColor(analysis.riskLevel)}22 0%, ${getRiskColor(analysis.riskLevel)}44 100%)`}
                p={6}
              >
                <RiskScoreGauge score={analysis.overallRiskScore} level={analysis.riskLevel} />
              </Box>

              <Card.Body p={4}>
                <Text textAlign="center" color="gray.600" _dark={{ color: 'gray.400' }}>
                  {analysis.summary}
                </Text>
              </Card.Body>
            </Card.Root>

            {/* Indicadores detectados */}
            <Card.Root bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl">
              <Card.Header pb={2}>
                <HStack justify="space-between">
                  <HStack>
                    <Icon as={FiAlertTriangle} color="orange.500" />
                    <Text fontWeight="bold">Indicadores Evaluados</Text>
                  </HStack>
                  <Badge colorPalette="red" variant="subtle">
                    {analysis.detectedIndicators.filter(i => i.detected).length} detectados
                  </Badge>
                </HStack>
              </Card.Header>

              <Card.Body pt={0}>
                <VStack align="stretch" gap={2}>
                  {analysis.detectedIndicators.map((indicator, idx) => (
                    <IndicatorCard key={indicator.code} indicator={indicator} index={idx} />
                  ))}
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Recomendaciones */}
            {analysis.recommendations.length > 0 && (
              <Card.Root bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl">
                <Card.Header pb={2}>
                  <HStack>
                    <Icon as={LuSparkles} color="blue.500" />
                    <Text fontWeight="bold">Recomendaciones</Text>
                  </HStack>
                </Card.Header>

                <Card.Body pt={0}>
                  <VStack align="stretch" gap={2}>
                    {analysis.recommendations.map((rec, idx) => (
                      <RecommendationItem key={idx} rec={rec} index={idx} />
                    ))}
                  </VStack>
                </Card.Body>
              </Card.Root>
            )}

            {/* Footer */}
            <HStack justify="space-between" px={2}>
              <Button variant="outline" size="sm" onClick={() => setAnalysis(null)}>
                Nuevo Análisis
              </Button>
              <Text fontSize="xs" color="gray.400">
                {analysis.provider} / {analysis.model} | {analysis.processingTimeMs}ms
              </Text>
            </HStack>
          </VStack>
        </MotionBox>
      )}
    </Box>
  );
};

export default CPRiskAnalysisPanel;
