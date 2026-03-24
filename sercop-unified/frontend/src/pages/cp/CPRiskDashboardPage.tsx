/**
 * CPRiskDashboardPage - Matriz de Riesgos para Compras Publicas
 * Dashboard completo con heat map 5x5, tabla de items, cards de resumen y acciones
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  SimpleGrid,
  Badge,
  Button,
  Spinner,
  Icon,
  Flex,
  Card,
  Table,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiShield,
  FiAlertTriangle,
  FiRefreshCw,
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiTarget,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../../components/ui/toaster';
import {
  getAssessment,
  getAssessmentsByProcess,
  calculateOverallScore,
  getHeatMapData,
  getRiskLevelColor,
  getRiskLevelLabel,
  getAllocationColor,
  type CPRiskAssessment,
  type HeatMapData,
} from '../../services/cpRiskService';

// ============================================================================
// Constants
// ============================================================================

const IMPACT_LABELS = ['Insignificante', 'Menor', 'Moderado', 'Mayor', 'Catastrofico'];
const PROBABILITY_LABELS = ['Raro', 'Improbable', 'Posible', 'Probable', 'Casi Seguro'];

// ============================================================================
// Types
// ============================================================================

interface CPRiskDashboardPageProps {
  processId?: string;
}

// ============================================================================
// Sub-components
// ============================================================================

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon: IconComp, color, subtitle }) => {
  const { isDark } = useTheme();
  return (
    <Card.Root>
      <Card.Body p={4}>
        <HStack justify="space-between">
          <VStack align="start" gap={0}>
            <Text fontSize="xs" fontWeight="600" color={isDark ? 'gray.400' : 'gray.500'} textTransform="uppercase">
              {label}
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {value}
            </Text>
            {subtitle && (
              <Text fontSize="xs" color={isDark ? 'gray.500' : 'gray.400'}>
                {subtitle}
              </Text>
            )}
          </VStack>
          <Flex
            w={12}
            h={12}
            borderRadius="xl"
            bg={`${color}.${isDark ? '900' : '100'}`}
            color={`${color}.${isDark ? '300' : '600'}`}
            align="center"
            justify="center"
          >
            <Icon as={IconComp} boxSize={6} />
          </Flex>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
};

// ============================================================================
// Heat Map Component
// ============================================================================

interface HeatMapProps {
  heatMapItems: HeatMapData[];
  isDark: boolean;
}

const HeatMap: React.FC<HeatMapProps> = ({ heatMapItems, isDark }) => {
  /**
   * Build a lookup: key = "probability-impact" -> list of items at that cell
   */
  const cellMap = useMemo(() => {
    const map: Record<string, HeatMapData[]> = {};
    for (const item of heatMapItems) {
      const key = `${item.probability}-${item.impact}`;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, [heatMapItems]);

  /**
   * Resolve a Chakra color token to an actual hex/rgb for the cell background.
   * We use inline styles because Chakra's bg prop in a CSS grid div won't
   * resolve semantic tokens automatically.
   */
  const resolveColor = (probability: number, impact: number): string => {
    const score = probability * impact;
    if (score <= 4) return isDark ? '#276749' : '#C6F6D5';
    if (score <= 9) return isDark ? '#744210' : '#FEFCBF';
    if (score <= 14) return isDark ? '#7B341E' : '#FEEBC8';
    if (score <= 19) return isDark ? '#652B19' : '#FBD38D';
    return isDark ? '#742A2A' : '#FEB2B2';
  };

  // Rows go from probability 5 (top) to 1 (bottom)
  const rows = [5, 4, 3, 2, 1];

  return (
    <Box>
      {/* Impact header labels */}
      <SimpleGrid columns={6} gap={1} mb={1}>
        {/* Top-left corner: empty label cell */}
        <Flex
          align="center"
          justify="center"
          minH="36px"
          fontSize="xs"
          fontWeight="bold"
          color={isDark ? 'gray.400' : 'gray.600'}
        >
          P / I
        </Flex>
        {IMPACT_LABELS.map((label, idx) => (
          <Flex
            key={`impact-label-${idx}`}
            align="center"
            justify="center"
            minH="36px"
            bg={isDark ? 'gray.700' : 'gray.100'}
            borderRadius="md"
            px={1}
          >
            <Text fontSize="2xs" fontWeight="bold" textAlign="center" color={isDark ? 'gray.300' : 'gray.600'}>
              {label}
            </Text>
          </Flex>
        ))}
      </SimpleGrid>

      {/* Grid rows: probability 5 -> 1 */}
      {rows.map((prob) => (
        <SimpleGrid key={`row-${prob}`} columns={6} gap={1} mb={1}>
          {/* Row label: probability */}
          <Flex
            align="center"
            justify="center"
            minH="60px"
            bg={isDark ? 'gray.700' : 'gray.100'}
            borderRadius="md"
            px={1}
          >
            <Text fontSize="2xs" fontWeight="bold" textAlign="center" color={isDark ? 'gray.300' : 'gray.600'}>
              {PROBABILITY_LABELS[prob - 1]}
            </Text>
          </Flex>

          {/* 5 impact columns */}
          {[1, 2, 3, 4, 5].map((imp) => {
            const key = `${prob}-${imp}`;
            const items = cellMap[key] || [];
            const score = prob * imp;
            const bgColor = resolveColor(prob, imp);

            return (
              <Box
                key={`cell-${prob}-${imp}`}
                bg={bgColor}
                borderRadius="md"
                minH="60px"
                p={1}
                position="relative"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                gap={1}
              >
                {/* Score number in corner */}
                <Text
                  position="absolute"
                  top={1}
                  right={1}
                  fontSize="2xs"
                  fontWeight="bold"
                  opacity={0.6}
                  color={isDark ? 'whiteAlpha.700' : 'blackAlpha.600'}
                >
                  {score}
                </Text>

                {/* Risk item dots/badges */}
                {items.length > 0 && (
                  <Flex wrap="wrap" gap={0.5} justify="center" align="center">
                    {items.map((item) => (
                      <Tooltip.Root key={item.id} openDelay={200} closeDelay={100}>
                        <Tooltip.Trigger asChild>
                          <Box
                            w="22px"
                            h="22px"
                            borderRadius="full"
                            bg={item.detected
                              ? (isDark ? 'red.300' : 'red.600')
                              : (isDark ? 'whiteAlpha.800' : 'blackAlpha.700')
                            }
                            color={item.detected
                              ? 'white'
                              : (isDark ? 'gray.800' : 'white')
                            }
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="2xs"
                            fontWeight="bold"
                            cursor="pointer"
                            border="2px solid"
                            borderColor={item.detected
                              ? (isDark ? 'red.400' : 'red.700')
                              : (isDark ? 'whiteAlpha.600' : 'blackAlpha.500')
                            }
                            _hover={{ transform: 'scale(1.3)' }}
                            transition="transform 0.15s"
                          >
                            {item.indicatorCode.slice(0, 2)}
                          </Box>
                        </Tooltip.Trigger>
                        <Tooltip.Positioner>
                          <Tooltip.Content
                            bg={isDark ? 'gray.700' : 'gray.800'}
                            color="white"
                            px={3}
                            py={2}
                            borderRadius="md"
                            fontSize="xs"
                            maxW="250px"
                          >
                            <Text fontWeight="bold">{item.indicatorCode}</Text>
                            <Text>{item.indicatorName}</Text>
                            <Text mt={1}>
                              Score: {item.riskScore} | {item.detected ? 'Detectado' : 'No detectado'}
                            </Text>
                          </Tooltip.Content>
                        </Tooltip.Positioner>
                      </Tooltip.Root>
                    ))}
                  </Flex>
                )}
              </Box>
            );
          })}
        </SimpleGrid>
      ))}

      {/* Legend */}
      <HStack mt={3} gap={3} justify="center" flexWrap="wrap">
        {[
          { label: '1-4 Bajo', bg: isDark ? '#276749' : '#C6F6D5' },
          { label: '5-9 Medio', bg: isDark ? '#744210' : '#FEFCBF' },
          { label: '10-14 Alto', bg: isDark ? '#7B341E' : '#FEEBC8' },
          { label: '15-19 Muy Alto', bg: isDark ? '#652B19' : '#FBD38D' },
          { label: '20-25 Critico', bg: isDark ? '#742A2A' : '#FEB2B2' },
        ].map((item) => (
          <HStack key={item.label} gap={1}>
            <Box w={3} h={3} borderRadius="sm" bg={item.bg} borderWidth="1px" borderColor={isDark ? 'gray.600' : 'gray.300'} />
            <Text fontSize="2xs" color={isDark ? 'gray.400' : 'gray.500'}>{item.label}</Text>
          </HStack>
        ))}
      </HStack>
    </Box>
  );
};

// ============================================================================
// Main Page Component
// ============================================================================

export const CPRiskDashboardPage: React.FC<CPRiskDashboardPageProps> = ({ processId: propProcessId }) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const navigate = useNavigate();
  const { assessmentId: paramAssessmentId } = useParams<{ assessmentId?: string }>();

  // State
  const [assessment, setAssessment] = useState<CPRiskAssessment | null>(null);
  const [heatMapItems, setHeatMapItems] = useState<HeatMapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  // Card / border colors following CPDashboardPage pattern
  const cardBg = isDark ? 'gray.800' : 'white';
  const cardBorder = isDark ? 'gray.700' : 'gray.200';
  const accentGradient = isDark
    ? 'linear(to-r, orange.600, red.600)'
    : 'linear(to-r, orange.400, red.500)';

  // ---- Data loading ----

  const loadAssessment = useCallback(async () => {
    try {
      setLoading(true);

      let data: CPRiskAssessment | null = null;

      if (paramAssessmentId) {
        // Direct assessment ID from URL params
        data = await getAssessment(paramAssessmentId);
      } else if (propProcessId) {
        // Load latest assessment for this process
        const assessments = await getAssessmentsByProcess(propProcessId);
        if (assessments.length > 0) {
          // Pick the most recent one (first item, assuming sorted desc)
          data = assessments[0];
        }
      }

      setAssessment(data);

      // Load heat map data if we have an assessment
      if (data?.id) {
        try {
          const heatData = await getHeatMapData(data.id);
          setHeatMapItems(heatData);
        } catch {
          // Heat map endpoint may not be available; build from items
          if (data.items) {
            setHeatMapItems(
              data.items.map((item) => ({
                id: item.id,
                indicatorCode: item.indicatorCode,
                indicatorName: item.indicatorName,
                probability: item.probability,
                impact: item.impact,
                riskScore: item.riskScore,
                detected: item.detected,
              }))
            );
          }
        }
      }
    } catch (err) {
      toaster.create({
        title: t('common.error', 'Error'),
        description: t('cp.risk.loadError', 'No se pudo cargar la evaluacion de riesgos'),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [paramAssessmentId, propProcessId, t]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  // ---- Recalculate ----

  const handleRecalculate = useCallback(async () => {
    if (!assessment?.id) return;
    try {
      setRecalculating(true);
      const updated = await calculateOverallScore(assessment.id);
      setAssessment(updated);
      toaster.create({
        title: t('cp.risk.recalculated', 'Score recalculado'),
        description: `Nuevo score: ${updated.overallScore} (${getRiskLevelLabel(updated.riskLevel)})`,
        type: 'success',
        duration: 4000,
      });
    } catch {
      toaster.create({
        title: t('common.error', 'Error'),
        description: t('cp.risk.recalcError', 'No se pudo recalcular el score'),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setRecalculating(false);
    }
  }, [assessment?.id, t]);

  // ---- Computed values ----

  const sortedItems = useMemo(() => {
    if (!assessment?.items) return [];
    return [...assessment.items].sort((a, b) => b.riskScore - a.riskScore);
  }, [assessment?.items]);

  const stats = useMemo(() => {
    const items = assessment?.items || [];
    const total = items.length;
    const detected = items.filter((i) => i.detected).length;
    const avgScore = total > 0 ? Math.round((items.reduce((s, i) => s + i.riskScore, 0) / total) * 10) / 10 : 0;
    const allocationBreakdown = items.reduce(
      (acc, i) => {
        const key = i.allocation || 'OTRO';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return { total, detected, avgScore, allocationBreakdown };
  }, [assessment?.items]);

  // ---- Loading state ----

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <VStack gap={4}>
          <Spinner size="xl" color={colors.primaryColor} />
          <Text>{t('common.loading', 'Cargando...')}</Text>
        </VStack>
      </Flex>
    );
  }

  // ---- Empty state ----

  if (!assessment) {
    return (
      <Box flex={1} p={{ base: 4, md: 6 }} maxW="1400px" mx="auto">
        <VStack gap={6} align="stretch">
          <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={cardBorder} overflow="hidden" shadow="sm">
            <Box bgGradient={accentGradient} h="4px" />
            <Box p={8} textAlign="center">
              <Icon as={FiShield} boxSize={12} color="gray.400" mb={4} />
              <Heading size="md" mb={2}>
                {t('cp.risk.noAssessment', 'No hay evaluacion de riesgos')}
              </Heading>
              <Text color={isDark ? 'gray.400' : 'gray.500'} mb={4}>
                {t('cp.risk.noAssessmentDesc', 'No se encontro una evaluacion de riesgos para este proceso. Cree una nueva evaluacion desde el modulo de procesos.')}
              </Text>
              <Button size="sm" variant="outline" onClick={() => navigate(-1)}>
                <Icon as={FiArrowLeft} mr={2} />
                {t('common.back', 'Volver')}
              </Button>
            </Box>
          </Box>
        </VStack>
      </Box>
    );
  }

  // ---- Allocation breakdown for display ----

  const allocationEntries = Object.entries(stats.allocationBreakdown);

  return (
    <Box flex={1} p={{ base: 4, md: 6 }} maxW="1400px" mx="auto">
      <VStack gap={6} align="stretch">
        {/* ================================================================ */}
        {/* Header */}
        {/* ================================================================ */}
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={cardBorder} overflow="hidden" shadow="sm">
          <Box bgGradient={accentGradient} h="4px" />
          <Box p={6}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <VStack align="start" gap={1}>
                <HStack>
                  <Icon as={FiShield} boxSize={6} color={colors.primaryColor} />
                  <Heading size="lg">
                    {t('cp.risk.title', 'Matriz de Riesgos')}
                  </Heading>
                  <Badge
                    colorPalette={assessment.status === 'COMPLETADO' ? 'green' : 'blue'}
                    variant="subtle"
                    ml={2}
                  >
                    {assessment.status}
                  </Badge>
                </HStack>
                <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
                  {t('cp.risk.subtitle', 'Evaluacion:')} {assessment.id.slice(0, 8)}...
                  {assessment.assessmentDate && ` | ${new Date(assessment.assessmentDate).toLocaleDateString('es-EC')}`}
                  {assessment.assessor && ` | ${assessment.assessor}`}
                </Text>
              </VStack>

              {/* Overall score */}
              <HStack gap={4}>
                <VStack gap={0} align="center">
                  <Text fontSize="xs" fontWeight="600" color={isDark ? 'gray.400' : 'gray.500'} textTransform="uppercase">
                    Score Global
                  </Text>
                  <HStack>
                    <Text fontSize="3xl" fontWeight="bold">
                      {assessment.overallScore}
                    </Text>
                    <Badge
                      colorPalette={getRiskLevelColor(assessment.riskLevel)}
                      variant="solid"
                      fontSize="sm"
                      px={3}
                      py={1}
                    >
                      {getRiskLevelLabel(assessment.riskLevel)}
                    </Badge>
                  </HStack>
                </VStack>
              </HStack>
            </Flex>
          </Box>
        </Box>

        {/* ================================================================ */}
        {/* Summary Cards */}
        {/* ================================================================ */}
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
          <SummaryCard
            label={t('cp.risk.totalItems', 'Indicadores')}
            value={stats.total}
            icon={FiTarget}
            color="purple"
          />
          <SummaryCard
            label={t('cp.risk.detectedRisks', 'Riesgos Detectados')}
            value={stats.detected}
            icon={FiAlertTriangle}
            color="red"
            subtitle={stats.total > 0 ? `${Math.round((stats.detected / stats.total) * 100)}% del total` : undefined}
          />
          <SummaryCard
            label={t('cp.risk.avgScore', 'Score Promedio')}
            value={stats.avgScore}
            icon={FiShield}
            color="orange"
          />
          <SummaryCard
            label={t('cp.risk.allocation', 'Asignacion')}
            value={allocationEntries.length > 0
              ? allocationEntries.map(([k, v]) => `${k}: ${v}`).join(' | ')
              : '-'
            }
            icon={FiCheckCircle}
            color="blue"
            subtitle={t('cp.risk.allocationBreakdown', 'Distribucion de responsabilidad')}
          />
        </SimpleGrid>

        {/* ================================================================ */}
        {/* Heat Map */}
        {/* ================================================================ */}
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={cardBorder} overflow="hidden" shadow="sm">
          <Box px={5} py={4} borderBottomWidth="1px" borderColor={cardBorder}>
            <HStack justify="space-between">
              <HStack>
                <Icon as={FiTarget} boxSize={5} color={isDark ? 'orange.300' : 'orange.500'} />
                <Heading size="sm">{t('cp.risk.heatMap', 'Mapa de Calor')}</Heading>
              </HStack>
              <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
                Probabilidad (Y) vs Impacto (X)
              </Text>
            </HStack>
          </Box>
          <Box p={4} overflowX="auto">
            <HeatMap heatMapItems={heatMapItems} isDark={isDark} />
          </Box>
        </Box>

        {/* ================================================================ */}
        {/* Risk Items Table */}
        {/* ================================================================ */}
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={cardBorder} overflow="hidden" shadow="sm">
          <Box px={5} py={4} borderBottomWidth="1px" borderColor={cardBorder}>
            <Flex justify="space-between" align="center">
              <HStack>
                <Icon as={FiAlertTriangle} boxSize={5} color={isDark ? 'orange.300' : 'orange.500'} />
                <Heading size="sm">{t('cp.risk.riskItems', 'Indicadores de Riesgo')}</Heading>
                <Badge colorPalette="gray" variant="subtle" ml={1}>{stats.total}</Badge>
              </HStack>
            </Flex>
          </Box>
          <Box overflowX="auto">
            {sortedItems.length === 0 ? (
              <Box p={8} textAlign="center">
                <Icon as={FiShield} boxSize={8} color="gray.400" mb={2} />
                <Text color={isDark ? 'gray.400' : 'gray.500'}>
                  {t('cp.risk.noItems', 'No hay indicadores de riesgo en esta evaluacion')}
                </Text>
              </Box>
            ) : (
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Codigo</Table.ColumnHeader>
                    <Table.ColumnHeader>Indicador</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center">Prob.</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center">Impacto</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center">Score</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center">Detectado</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center">Asignacion</Table.ColumnHeader>
                    <Table.ColumnHeader>Estado</Table.ColumnHeader>
                    <Table.ColumnHeader>Plan Mitigacion</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {sortedItems.map((item) => (
                    <Table.Row
                      key={item.id}
                      bg={item.detected
                        ? (isDark ? 'rgba(254, 178, 178, 0.08)' : 'rgba(254, 215, 215, 0.5)')
                        : undefined
                      }
                      _hover={{ bg: isDark ? 'whiteAlpha.50' : 'gray.50' }}
                    >
                      <Table.Cell fontWeight="medium" fontSize="sm">
                        {item.indicatorCode}
                      </Table.Cell>
                      <Table.Cell fontSize="sm" maxW="200px">
                        <Text truncate>{item.indicatorName}</Text>
                      </Table.Cell>
                      <Table.Cell textAlign="center" fontSize="sm">
                        {item.probability}
                      </Table.Cell>
                      <Table.Cell textAlign="center" fontSize="sm">
                        {item.impact}
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        <Badge
                          colorPalette={
                            item.riskScore <= 4 ? 'green'
                              : item.riskScore <= 9 ? 'yellow'
                                : item.riskScore <= 14 ? 'orange'
                                  : 'red'
                          }
                          variant="subtle"
                          fontWeight="bold"
                        >
                          {item.riskScore}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        {item.detected ? (
                          <Badge colorPalette="red" variant="solid" fontSize="xs">
                            <Icon as={FiXCircle} mr={1} />
                            Si
                          </Badge>
                        ) : (
                          <Badge colorPalette="green" variant="subtle" fontSize="xs">
                            <Icon as={FiCheckCircle} mr={1} />
                            No
                          </Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        <Badge
                          colorPalette={getAllocationColor(item.allocation)}
                          variant="subtle"
                          fontSize="xs"
                        >
                          {item.allocation}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell fontSize="sm">
                        <Badge colorPalette="gray" variant="outline" fontSize="xs">
                          {item.status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell fontSize="xs" maxW="180px" color={isDark ? 'gray.400' : 'gray.500'}>
                        <Text truncate>
                          {item.mitigationPlan || '-'}
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Box>
        </Box>

        {/* ================================================================ */}
        {/* Actions */}
        {/* ================================================================ */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <Icon as={FiArrowLeft} mr={2} />
            {t('common.back', 'Volver')}
          </Button>

          <Button
            size="sm"
            colorPalette="orange"
            onClick={handleRecalculate}
            disabled={recalculating}
          >
            {recalculating ? (
              <Spinner size="xs" mr={2} />
            ) : (
              <Icon as={FiRefreshCw} mr={2} />
            )}
            {t('cp.risk.recalculate', 'Recalcular Score')}
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};

export default CPRiskDashboardPage;
