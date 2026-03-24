/**
 * CPMethodologyConfigAdmin - Admin page for viewing/managing PAA methodologies
 * Master-detail layout: left panel shows methodology list, right shows phases + config
 */
import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Heading,
  Card,
  Alert,
  Icon,
  Grid,
  Separator,
} from '@chakra-ui/react';
import {
  FiSettings,
  FiCheck,
  FiX,
  FiLayers,
  FiChevronRight,
  FiTarget,
  FiDollarSign,
  FiPackage,
  FiTrendingUp,
  FiShield,
  FiCalendar,
  FiHash,
  FiCpu,
  FiInfo,
  FiList,
} from 'react-icons/fi';
import { LuSparkles, LuBrain } from 'react-icons/lu';
import { useTheme } from '../../contexts/ThemeContext';
import {
  getActiveMethodologies,
  getMethodology,
  type CPPAAMethodology,
  type CPPAAMethodologyPhase,
  type CPPAAPhaseFieldMapping,
  getPhaseColorScheme,
} from '../../services/cpMethodologyService';

// ============================================================================
// Icon resolver — same as dashboard
// ============================================================================
const iconMap: Record<string, React.ElementType> = {
  FiTarget, FiDollarSign, FiPackage, FiTrendingUp,
  FiLayers, FiShield, FiCalendar, FiHash, FiCpu,
  FiSettings, FiCheck, FiList,
  LuSparkles, LuBrain,
};

const resolveIcon = (iconName: string | null): React.ElementType => {
  if (!iconName) return FiSettings;
  return iconMap[iconName] || FiSettings;
};

// ============================================================================
// Sub-components
// ============================================================================

const PhaseCard: React.FC<{
  phase: CPPAAMethodologyPhase;
  isSelected: boolean;
  onClick: () => void;
  isDark: boolean;
  colors: ReturnType<ReturnType<typeof useTheme>['getColors']>;
}> = ({ phase, isSelected, onClick, isDark, colors }) => {
  const scheme = getPhaseColorScheme(phase.color || 'blue');
  const PhaseIcon = resolveIcon(phase.icon);

  return (
    <Box
      p={3}
      borderRadius="lg"
      borderWidth="2px"
      borderColor={isSelected ? scheme.border : (isDark ? 'gray.600' : 'gray.200')}
      bg={isSelected ? (isDark ? `${phase.color}.900` : scheme.bg) : (isDark ? 'gray.750' : 'white')}
      cursor="pointer"
      onClick={onClick}
      _hover={{ borderColor: scheme.border, transform: 'translateY(-1px)' }}
      transition="all 0.2s"
    >
      <HStack gap={3}>
        <Flex
          w={8} h={8} borderRadius="md" align="center" justify="center"
          bg={isDark ? `${phase.color}.800` : `${phase.color}.100`}
          flexShrink={0}
        >
          <Icon as={PhaseIcon} boxSize={4} color={`${phase.color}.500`} />
        </Flex>
        <Box flex="1" minW={0}>
          <HStack gap={1}>
            <Badge size="xs" colorPalette={phase.color || 'gray'} variant="subtle">
              Fase {phase.phaseNumber}
            </Badge>
            {phase.requiresAiCall && (
              <Badge size="xs" colorPalette="purple" variant="outline">IA</Badge>
            )}
          </HStack>
          <Text fontSize="sm" fontWeight="medium" color={colors.textColor} truncate>
            {phase.phaseName}
          </Text>
        </Box>
        <Icon as={FiChevronRight} color={colors.textColorSecondary} />
      </HStack>
    </Box>
  );
};

const FieldMappingRow: React.FC<{
  mapping: CPPAAPhaseFieldMapping;
  colors: ReturnType<ReturnType<typeof useTheme>['getColors']>;
  isDark: boolean;
}> = ({ mapping, colors, isDark }) => (
  <HStack
    p={2} borderRadius="md" gap={3}
    bg={isDark ? 'gray.750' : 'gray.50'}
    borderWidth="1px" borderColor={isDark ? 'gray.600' : 'gray.200'}
  >
    <Badge size="xs" colorPalette="blue" variant="subtle" fontFamily="mono">
      {mapping.fieldCode}
    </Badge>
    <Text fontSize="xs" color={colors.textColorSecondary} flex="1">
      {mapping.extractionPath || '-'}
    </Text>
    <Badge size="xs" colorPalette="gray" variant="outline">
      {mapping.transformType || 'DIRECT'}
    </Badge>
  </HStack>
);

// ============================================================================
// Main component
// ============================================================================
export const CPMethodologyConfigAdmin: React.FC = () => {
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const [methodologies, setMethodologies] = useState<CPPAAMethodology[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethodologyId, setSelectedMethodologyId] = useState<number | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailMethodology, setDetailMethodology] = useState<CPPAAMethodology | null>(null);

  useEffect(() => {
    loadMethodologies();
  }, []);

  const loadMethodologies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActiveMethodologies();
      setMethodologies(data);
      if (data.length > 0) {
        selectMethodology(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar metodologias');
    } finally {
      setLoading(false);
    }
  };

  const selectMethodology = async (id: number) => {
    setSelectedMethodologyId(id);
    setSelectedPhaseId(null);
    setDetailLoading(true);
    try {
      const detail = await getMethodology(id);
      setDetailMethodology(detail);
      if (detail.phases?.length > 0) {
        setSelectedPhaseId(detail.phases[0].id);
      }
    } catch {
      // fallback to list data
      const fallback = methodologies.find(m => m.id === id) || null;
      setDetailMethodology(fallback);
    } finally {
      setDetailLoading(false);
    }
  };

  const selectedPhase = useMemo(() => {
    if (!detailMethodology || !selectedPhaseId) return null;
    return detailMethodology.phases?.find(p => p.id === selectedPhaseId) || null;
  }, [detailMethodology, selectedPhaseId]);

  const cardBg = isDark ? 'gray.800' : 'white';
  const cardBorder = isDark ? 'gray.700' : 'gray.200';

  return (
    <Box p={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <HStack gap={3}>
            <Box p={2} borderRadius="lg" bg={isDark ? 'purple.900' : 'purple.50'}>
              <FiLayers size={24} color={isDark ? '#B794F4' : '#6B46C1'} />
            </Box>
            <Box>
              <Heading size="lg" color={colors.textColor}>
                Metodologias PAA
              </Heading>
              <Text color={colors.textColorSecondary} fontSize="sm">
                Configuracion de metodologias para el Plan Anual de Adquisiciones
              </Text>
            </Box>
          </HStack>
          <HStack gap={2}>
            <Badge colorPalette="purple" variant="subtle" fontSize="sm" px={3} py={1}>
              {methodologies.length} metodologia{methodologies.length !== 1 ? 's' : ''}
            </Badge>
          </HStack>
        </Flex>

        {/* Error */}
        {error && (
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Error</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {/* Info */}
        <Card.Root bg={cardBg} borderColor={cardBorder}>
          <Card.Body py={3}>
            <HStack gap={3}>
              <Icon as={FiInfo} color={isDark ? 'blue.300' : 'blue.500'} />
              <Text color={colors.textColor} fontSize="sm">
                Las metodologias definen las fases que guian al usuario en la elaboracion del PAA con asistencia de IA.
                Cada fase tiene prompts de IA configurables, tipo de entrada, y mapeo a campos del formulario final.
                El usuario puede seleccionar la metodologia al iniciar el wizard.
              </Text>
            </HStack>
          </Card.Body>
        </Card.Root>

        {loading ? (
          <Flex justify="center" py={12}>
            <Spinner size="lg" color="purple.500" />
          </Flex>
        ) : (
          <Grid templateColumns={{ base: '1fr', lg: '280px 1fr' }} gap={4}>
            {/* LEFT: Methodology list */}
            <VStack gap={3} align="stretch">
              <Text fontSize="sm" fontWeight="bold" color={colors.textColorSecondary} px={1}>
                METODOLOGIAS
              </Text>
              {methodologies.map(m => (
                <Box
                  key={m.id}
                  p={3}
                  borderRadius="lg"
                  borderWidth="2px"
                  borderColor={selectedMethodologyId === m.id ? 'purple.400' : cardBorder}
                  bg={selectedMethodologyId === m.id ? (isDark ? 'purple.900' : 'purple.50') : cardBg}
                  cursor="pointer"
                  onClick={() => selectMethodology(m.id)}
                  _hover={{ borderColor: 'purple.300' }}
                  transition="all 0.2s"
                >
                  <HStack justify="space-between" mb={1}>
                    <Badge colorPalette="purple" variant="subtle" size="xs" fontFamily="mono">
                      {m.code}
                    </Badge>
                    {m.isDefault && (
                      <Badge colorPalette="green" variant="solid" size="xs">
                        Por defecto
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="sm" fontWeight="semibold" color={colors.textColor}>
                    {m.name}
                  </Text>
                  <HStack gap={2} mt={1}>
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      {m.totalPhases} fases
                    </Text>
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      v{m.version}
                    </Text>
                    {m.isActive ? (
                      <Icon as={FiCheck} boxSize={3} color="green.500" />
                    ) : (
                      <Icon as={FiX} boxSize={3} color="red.500" />
                    )}
                  </HStack>
                </Box>
              ))}
            </VStack>

            {/* RIGHT: Detail panel */}
            <Box>
              {detailLoading ? (
                <Flex justify="center" py={12}>
                  <Spinner size="md" color="purple.500" />
                </Flex>
              ) : detailMethodology ? (
                <VStack gap={4} align="stretch">
                  {/* Methodology header */}
                  <Card.Root bg={cardBg} borderColor={cardBorder}>
                    <Card.Body>
                      <VStack align="stretch" gap={3}>
                        <HStack justify="space-between" flexWrap="wrap">
                          <VStack align="start" gap={0}>
                            <Heading size="md" color={colors.textColor}>
                              {detailMethodology.name}
                            </Heading>
                            <Text fontSize="sm" color={colors.textColorSecondary}>
                              {detailMethodology.sourceFramework}
                            </Text>
                          </VStack>
                          <HStack gap={2}>
                            <Badge colorPalette="gray" variant="outline" fontFamily="mono">
                              {detailMethodology.code}
                            </Badge>
                            <Badge colorPalette={detailMethodology.isActive ? 'green' : 'red'}>
                              {detailMethodology.isActive ? 'Activa' : 'Inactiva'}
                            </Badge>
                            {detailMethodology.isDefault && (
                              <Badge colorPalette="blue">Por defecto</Badge>
                            )}
                          </HStack>
                        </HStack>

                        {detailMethodology.description && (
                          <Text fontSize="sm" color={colors.textColor}>
                            {detailMethodology.description}
                          </Text>
                        )}

                        {detailMethodology.welcomeMessage && (
                          <Box p={3} borderRadius="md" bg={isDark ? 'gray.750' : 'gray.50'} borderWidth="1px" borderColor={cardBorder}>
                            <HStack gap={2} mb={1}>
                              <Icon as={LuBrain} boxSize={3.5} color="purple.500" />
                              <Text fontSize="xs" fontWeight="bold" color="purple.500">
                                Mensaje de bienvenida IA
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color={colors.textColorSecondary} whiteSpace="pre-wrap">
                              {detailMethodology.welcomeMessage}
                            </Text>
                          </Box>
                        )}

                        {/* Stats row */}
                        <HStack gap={4} flexWrap="wrap">
                          <HStack gap={1}>
                            <Icon as={FiLayers} boxSize={3.5} color={colors.textColorSecondary} />
                            <Text fontSize="sm" color={colors.textColor}>
                              <strong>{detailMethodology.totalPhases}</strong> fases
                            </Text>
                          </HStack>
                          <HStack gap={1}>
                            <Icon as={LuSparkles} boxSize={3.5} color={colors.textColorSecondary} />
                            <Text fontSize="sm" color={colors.textColor}>
                              <strong>{detailMethodology.phases?.filter(p => p.requiresAiCall).length || 0}</strong> con IA
                            </Text>
                          </HStack>
                          <HStack gap={1}>
                            <Icon as={FiHash} boxSize={3.5} color={colors.textColorSecondary} />
                            <Text fontSize="sm" color={colors.textColor}>
                              <strong>
                                {detailMethodology.phases?.reduce((sum, p) => sum + (p.fieldMappings?.length || 0), 0) || 0}
                              </strong> field mappings
                            </Text>
                          </HStack>
                          <Text fontSize="xs" color={colors.textColorSecondary}>
                            Pais: {detailMethodology.countryCode}
                          </Text>
                        </HStack>
                      </VStack>
                    </Card.Body>
                  </Card.Root>

                  {/* Phases section */}
                  <Grid templateColumns={{ base: '1fr', xl: '250px 1fr' }} gap={4}>
                    {/* Phase list */}
                    <VStack gap={2} align="stretch">
                      <Text fontSize="sm" fontWeight="bold" color={colors.textColorSecondary} px={1}>
                        FASES ({detailMethodology.phases?.length || 0})
                      </Text>
                      {detailMethodology.phases
                        ?.sort((a, b) => a.phaseNumber - b.phaseNumber)
                        .map(phase => (
                          <PhaseCard
                            key={phase.id}
                            phase={phase}
                            isSelected={selectedPhaseId === phase.id}
                            onClick={() => setSelectedPhaseId(phase.id)}
                            isDark={isDark}
                            colors={colors}
                          />
                        ))}
                    </VStack>

                    {/* Phase detail */}
                    {selectedPhase ? (
                      <Card.Root bg={cardBg} borderColor={cardBorder}>
                        <Card.Body>
                          <VStack align="stretch" gap={4}>
                            {/* Phase header */}
                            <HStack gap={3}>
                              <Flex
                                w={10} h={10} borderRadius="lg" align="center" justify="center"
                                bg={isDark ? `${selectedPhase.color}.800` : `${selectedPhase.color}.100`}
                              >
                                <Icon
                                  as={resolveIcon(selectedPhase.icon)}
                                  boxSize={5}
                                  color={`${selectedPhase.color}.500`}
                                />
                              </Flex>
                              <Box flex="1">
                                <Heading size="sm" color={colors.textColor}>
                                  Fase {selectedPhase.phaseNumber}: {selectedPhase.phaseName}
                                </Heading>
                                {selectedPhase.phaseSubtitle && (
                                  <Text fontSize="sm" color={colors.textColorSecondary}>
                                    {selectedPhase.phaseSubtitle}
                                  </Text>
                                )}
                              </Box>
                              <VStack gap={1} align="end">
                                <Badge colorPalette={selectedPhase.isActive ? 'green' : 'red'} size="xs">
                                  {selectedPhase.isActive ? 'Activa' : 'Inactiva'}
                                </Badge>
                                {selectedPhase.isRequired && (
                                  <Badge colorPalette="orange" variant="outline" size="xs">Requerida</Badge>
                                )}
                              </VStack>
                            </HStack>

                            <Separator />

                            {/* Phase properties grid */}
                            <Grid templateColumns="repeat(auto-fill, minmax(180px, 1fr))" gap={3}>
                              <Box>
                                <Text fontSize="xs" fontWeight="bold" color={colors.textColorSecondary} mb={1}>
                                  Tipo de entrada
                                </Text>
                                <Badge colorPalette="blue" fontFamily="mono">
                                  {selectedPhase.inputType}
                                </Badge>
                              </Box>
                              <Box>
                                <Text fontSize="xs" fontWeight="bold" color={colors.textColorSecondary} mb={1}>
                                  Tipo de resultado
                                </Text>
                                <Badge colorPalette="cyan" fontFamily="mono">
                                  {selectedPhase.resultDisplayType}
                                </Badge>
                              </Box>
                              <Box>
                                <Text fontSize="xs" fontWeight="bold" color={colors.textColorSecondary} mb={1}>
                                  Requiere IA
                                </Text>
                                {selectedPhase.requiresAiCall ? (
                                  <Badge colorPalette="purple"><Icon as={LuSparkles} mr={1} /> Si</Badge>
                                ) : (
                                  <Badge colorPalette="gray">No</Badge>
                                )}
                              </Box>
                              <Box>
                                <Text fontSize="xs" fontWeight="bold" color={colors.textColorSecondary} mb={1}>
                                  Auto-avance
                                </Text>
                                <Badge colorPalette={selectedPhase.autoAdvance ? 'green' : 'gray'}>
                                  {selectedPhase.autoAdvance ? 'Si' : 'No'}
                                </Badge>
                              </Box>
                              <Box>
                                <Text fontSize="xs" fontWeight="bold" color={colors.textColorSecondary} mb={1}>
                                  Se puede omitir
                                </Text>
                                <Badge colorPalette={selectedPhase.canSkip ? 'yellow' : 'gray'}>
                                  {selectedPhase.canSkip ? 'Si' : 'No'}
                                </Badge>
                              </Box>
                              <Box>
                                <Text fontSize="xs" fontWeight="bold" color={colors.textColorSecondary} mb={1}>
                                  Orden
                                </Text>
                                <Text fontSize="sm" color={colors.textColor} fontFamily="mono">
                                  {selectedPhase.displayOrder}
                                </Text>
                              </Box>
                            </Grid>

                            {/* Placeholder */}
                            {selectedPhase.inputPlaceholder && (
                              <Box>
                                <Text fontSize="xs" fontWeight="bold" color={colors.textColorSecondary} mb={1}>
                                  Placeholder del input
                                </Text>
                                <Text fontSize="sm" color={colors.textColor} fontStyle="italic">
                                  "{selectedPhase.inputPlaceholder}"
                                </Text>
                              </Box>
                            )}

                            {/* Options source */}
                            {selectedPhase.optionsSource && (
                              <Box>
                                <Text fontSize="xs" fontWeight="bold" color={colors.textColorSecondary} mb={1}>
                                  Fuente de opciones
                                </Text>
                                <Text fontSize="xs" color={colors.textColor} fontFamily="mono" bg={isDark ? 'gray.750' : 'gray.50'} p={2} borderRadius="md">
                                  {selectedPhase.optionsSource}
                                </Text>
                              </Box>
                            )}

                            {/* Result template */}
                            {selectedPhase.resultTemplate && (
                              <Box>
                                <Text fontSize="xs" fontWeight="bold" color={colors.textColorSecondary} mb={1}>
                                  Template de resultado
                                </Text>
                                <Box fontSize="xs" color={colors.textColor} fontFamily="mono" bg={isDark ? 'gray.750' : 'gray.50'} p={2} borderRadius="md" maxH="100px" overflowY="auto">
                                  <Text whiteSpace="pre-wrap">{selectedPhase.resultTemplate}</Text>
                                </Box>
                              </Box>
                            )}

                            <Separator />

                            {/* AI Prompt Keys */}
                            <Box>
                              <HStack gap={2} mb={2}>
                                <Icon as={LuBrain} boxSize={4} color="purple.500" />
                                <Text fontSize="sm" fontWeight="bold" color={colors.textColor}>
                                  Prompts de IA
                                </Text>
                              </HStack>
                              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={2}>
                                {[
                                  { label: 'Guia', key: selectedPhase.guidancePromptKey },
                                  { label: 'Validacion', key: selectedPhase.validationPromptKey },
                                  { label: 'Extraccion', key: selectedPhase.extractionPromptKey },
                                  { label: 'Confirmacion', key: selectedPhase.confirmationPromptKey },
                                ].map(({ label, key }) => (
                                  <HStack
                                    key={label}
                                    p={2} borderRadius="md"
                                    bg={isDark ? 'gray.750' : 'gray.50'}
                                    borderWidth="1px" borderColor={key ? 'purple.200' : cardBorder}
                                    opacity={key ? 1 : 0.5}
                                  >
                                    <Text fontSize="xs" fontWeight="bold" color={colors.textColorSecondary} w="80px">
                                      {label}:
                                    </Text>
                                    <Text fontSize="xs" color={colors.textColor} fontFamily="mono" truncate>
                                      {key || '—'}
                                    </Text>
                                  </HStack>
                                ))}
                              </Grid>
                            </Box>

                            {/* Field Mappings */}
                            {selectedPhase.fieldMappings && selectedPhase.fieldMappings.length > 0 && (
                              <Box>
                                <HStack gap={2} mb={2}>
                                  <Icon as={FiHash} boxSize={4} color="blue.500" />
                                  <Text fontSize="sm" fontWeight="bold" color={colors.textColor}>
                                    Field Mappings ({selectedPhase.fieldMappings.length})
                                  </Text>
                                </HStack>
                                <VStack gap={1} align="stretch">
                                  {selectedPhase.fieldMappings
                                    .sort((a, b) => a.displayOrder - b.displayOrder)
                                    .map(mapping => (
                                      <FieldMappingRow
                                        key={mapping.id}
                                        mapping={mapping}
                                        colors={colors}
                                        isDark={isDark}
                                      />
                                    ))}
                                </VStack>
                              </Box>
                            )}
                          </VStack>
                        </Card.Body>
                      </Card.Root>
                    ) : (
                      <Flex justify="center" align="center" h="200px">
                        <Text color={colors.textColorSecondary}>Selecciona una fase para ver su configuracion</Text>
                      </Flex>
                    )}
                  </Grid>
                </VStack>
              ) : (
                <Flex justify="center" align="center" h="200px">
                  <Text color={colors.textColorSecondary}>Selecciona una metodologia</Text>
                </Flex>
              )}
            </Box>
          </Grid>
        )}
      </VStack>
    </Box>
  );
};

export default CPMethodologyConfigAdmin;
