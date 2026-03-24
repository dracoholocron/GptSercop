/**
 * CPPAAMethodologyDashboard - Visual dashboard for PAA methodology phases
 * Shows progressive results as user completes each phase of the wizard.
 * All phase metadata (icons, colors, names) comes from BD via methodology service.
 */
import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Flex,
  Skeleton,
  SkeletonText,
  Tooltip,
  Separator,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiTarget,
  FiDollarSign,
  FiPackage,
  FiTrendingUp,
  FiLayers,
  FiShield,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiUser,
  FiLoader,
} from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import { useTheme } from '../../../contexts/ThemeContext';
import type { CPPAAMethodologyPhase } from '../../../services/cpMethodologyService';

// ============================================================================
// TYPES
// ============================================================================

export interface PhaseResult {
  phaseCode: string;
  status: 'pending' | 'active' | 'loading' | 'completed';
  data?: Record<string, unknown>;
  badges?: { label: string; color: string; icon?: string }[];
  stats?: { label: string; value: string | number; prefix?: string; suffix?: string }[];
  tableRows?: { cells: string[] }[];
  tableHeaders?: string[];
  legalRefs?: { article: string; summary: string }[];
  subSteps?: { label: string; status: 'pending' | 'done' | 'loading' }[];
}

interface CPPAAMethodologyDashboardProps {
  phases: CPPAAMethodologyPhase[];
  phaseResults: Record<string, PhaseResult>;
  currentPhaseCode: string | null;
  methodologyName?: string;
  entityName?: string;
  totalBudget?: number;
}

// ============================================================================
// ICON MAP - resolves string icon names to React components
// ============================================================================

const iconMap: Record<string, React.ComponentType> = {
  FiTarget,
  FiDollarSign,
  FiPackage,
  FiTrendingUp,
  FiLayers,
  FiShield,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiUser,
  FiLoader,
  LuSparkles,
};

const MotionBox = motion.create(Box as any);
const MotionFlex = motion.create(Flex as any);

// ============================================================================
// HOOKS
// ============================================================================

/** Animated count-up hook */
function useCountUp(target: number, duration = 1500, enabled = true): number {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!enabled || target === 0) {
      setCurrent(target);
      return;
    }
    const startTime = Date.now();
    const startVal = current;
    const diff = target - startVal;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(startVal + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, enabled]);
  return current;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Badge display for phase results */
const BadgesDisplay: React.FC<{ badges: PhaseResult['badges'] }> = ({ badges }) => {
  if (!badges || badges.length === 0) return null;
  return (
    <Flex flexWrap="wrap" gap={1} mt={1}>
      <AnimatePresence>
        {badges.map((badge, i) => (
          <MotionBox
            key={`${badge.label}-${i}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.15, type: 'spring', stiffness: 300, damping: 25 }}
          >
            <Badge
              colorScheme={badge.color || 'blue'}
              fontSize="10px"
              px={2}
              py={0.5}
              borderRadius="full"
            >
              {badge.label}
            </Badge>
          </MotionBox>
        ))}
      </AnimatePresence>
    </Flex>
  );
};

/** Stats display for phase results */
const StatsDisplay: React.FC<{ stats: PhaseResult['stats']; enabled: boolean }> = ({ stats, enabled }) => {
  if (!stats || stats.length === 0) return null;
  return (
    <Flex flexWrap="wrap" gap={2} mt={1}>
      {stats.map((stat, i) => (
        <Box key={i} textAlign="center" minW="60px">
          <Text fontSize="xs" color="gray.500">{stat.label}</Text>
          <Text fontSize="sm" fontWeight="bold" color="blue.600">
            {stat.prefix || ''}{typeof stat.value === 'number' ? <CountUpValue target={stat.value} enabled={enabled} /> : stat.value}{stat.suffix || ''}
          </Text>
        </Box>
      ))}
    </Flex>
  );
};

/** Inline count-up value */
const CountUpValue: React.FC<{ target: number; enabled: boolean }> = ({ target, enabled }) => {
  const value = useCountUp(target, 1500, enabled);
  if (target >= 1000) {
    return <>{new Intl.NumberFormat('es-EC').format(value)}</>;
  }
  return <>{value}</>;
};

/** Table display for phase results */
const TableDisplay: React.FC<{ headers?: string[]; rows?: PhaseResult['tableRows'] }> = ({ headers, rows }) => {
  if (!rows || rows.length === 0) return null;
  return (
    <Box mt={1} maxH="100px" overflowY="auto" fontSize="10px">
      {headers && (
        <Flex fontWeight="bold" borderBottom="1px solid" borderColor="gray.200" pb={0.5} mb={0.5} gap={2}>
          {headers.map((h, i) => <Text key={i} flex={1} isTruncated>{h}</Text>)}
        </Flex>
      )}
      <AnimatePresence>
        {rows.map((row, i) => (
          <MotionFlex
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            gap={2}
            py={0.5}
            borderBottom="1px solid"
            borderColor="gray.100"
          >
            {row.cells.map((cell, j) => <Text key={j} flex={1} isTruncated>{cell}</Text>)}
          </MotionFlex>
        ))}
      </AnimatePresence>
    </Box>
  );
};

/** AI thinking sub-steps */
const SubStepsDisplay: React.FC<{ subSteps: PhaseResult['subSteps'] }> = ({ subSteps }) => {
  if (!subSteps || subSteps.length === 0) return null;
  return (
    <VStack align="start" spacing={0.5} mt={1} pl={1}>
      {subSteps.map((step, i) => (
        <MotionBox
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.3 }}
        >
          <HStack spacing={1}>
            <Text fontSize="10px">
              {step.status === 'done' ? '✅' : step.status === 'loading' ? '🔄' : '⬜'}
            </Text>
            <Text fontSize="10px" color={step.status === 'done' ? 'green.600' : 'gray.500'}>
              {step.label}
            </Text>
          </HStack>
        </MotionBox>
      ))}
    </VStack>
  );
};

/** Legal reference badges */
const LegalRefsDisplay: React.FC<{ refs: PhaseResult['legalRefs'] }> = ({ refs }) => {
  if (!refs || refs.length === 0) return null;
  return (
    <Flex flexWrap="wrap" gap={1} mt={1}>
      {refs.map((ref, i) => (
        <Tooltip.Root key={i}>
          <Tooltip.Trigger asChild>
            <Badge variant="outline" colorPalette="gray" fontSize="9px" cursor="help">
              {ref.article}
            </Badge>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content fontSize="xs" px={2} py={1}>
              {ref.summary}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      ))}
    </Flex>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CPPAAMethodologyDashboard: React.FC<CPPAAMethodologyDashboardProps> = ({
  phases,
  phaseResults,
  currentPhaseCode,
  methodologyName,
  entityName,
  totalBudget,
}) => {
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const cardBg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.600' : 'gray.200';

  const sortedPhases = useMemo(
    () => [...phases].filter(p => p.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [phases]
  );

  const completedCount = Object.values(phaseResults).filter(r => r.status === 'completed').length;
  const progressPercent = sortedPhases.length > 0 ? Math.round((completedCount / sortedPhases.length) * 100) : 0;

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      border="1px solid"
      borderColor={borderColor}
      p={3}
      h="full"
      maxH="580px"
      overflowY="auto"
      css={{
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': { background: isDark ? '#4A5568' : '#CBD5E0', borderRadius: '4px' },
      }}
    >
      {/* Header */}
      <VStack spacing={1} mb={3} align="start">
        <HStack justify="space-between" w="full">
          <Text fontSize="sm" fontWeight="bold" color={colors.text}>
            {methodologyName || 'Metodologia PAA'}
          </Text>
          <Badge colorScheme="blue" fontSize="10px">{progressPercent}%</Badge>
        </HStack>
        {entityName && (
          <Text fontSize="xs" color="gray.500" isTruncated maxW="full">{entityName}</Text>
        )}
        {/* Progress bar */}
        <Box w="full" h="3px" bg={isDark ? 'gray.700' : 'gray.100'} borderRadius="full" overflow="hidden">
          <MotionBox
            h="full"
            bg="blue.500"
            borderRadius="full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </Box>
      </VStack>

      <Separator mb={2} />

      {/* Phase Cards */}
      <VStack spacing={2} align="stretch">
        <AnimatePresence>
          {sortedPhases.map((phase, index) => {
            const result = phaseResults[phase.phaseCode];
            const isActive = currentPhaseCode === phase.phaseCode;
            const isCompleted = result?.status === 'completed';
            const isLoading = result?.status === 'loading';
            const IconComponent = iconMap[phase.icon] || FiTarget;

            const phaseColorMap: Record<string, string> = {
              purple: 'purple', green: 'green', blue: 'blue',
              cyan: 'cyan', orange: 'orange', red: 'red', teal: 'teal',
            };
            const colorScheme = phaseColorMap[phase.color] || 'blue';

            return (
              <MotionBox
                key={phase.phaseCode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
                p={2}
                borderRadius="lg"
                border="1px solid"
                borderColor={isActive ? `${colorScheme}.400` : isCompleted ? `${colorScheme}.200` : borderColor}
                bg={isActive ? (isDark ? `${colorScheme}.900` : `${colorScheme}.50`) : 'transparent'}
                position="relative"
                overflow="hidden"
                _before={isActive ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 'lg',
                  border: '2px solid',
                  borderColor: `${colorScheme}.400`,
                  animation: 'pulseBorder 2s ease-in-out infinite',
                } : undefined}
                css={isActive ? {
                  '@keyframes pulseBorder': {
                    '0%, 100%': { opacity: 0.4 },
                    '50%': { opacity: 1 },
                  },
                } : undefined}
              >
                {/* Phase header */}
                <HStack spacing={2}>
                  <Flex
                    w="28px"
                    h="28px"
                    borderRadius="full"
                    bg={isCompleted ? `${colorScheme}.500` : isActive ? `${colorScheme}.100` : isDark ? 'gray.700' : 'gray.100'}
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    {isCompleted ? (
                      <MotionBox
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      >
                        <Icon as={FiCheck} color="white" boxSize="14px" />
                      </MotionBox>
                    ) : isLoading ? (
                      <MotionBox
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      >
                        <Icon as={FiLoader} color={`${colorScheme}.500`} boxSize="14px" />
                      </MotionBox>
                    ) : (
                      <Icon
                        as={IconComponent}
                        color={isActive ? `${colorScheme}.600` : 'gray.400'}
                        boxSize="14px"
                      />
                    )}
                  </Flex>

                  <VStack spacing={0} align="start" flex={1} minW={0}>
                    <Text fontSize="xs" fontWeight="bold" color={isActive ? `${colorScheme}.700` : colors.text} isTruncated maxW="full">
                      {phase.phaseName}
                    </Text>
                    {phase.phaseSubtitle && !isCompleted && (
                      <Text fontSize="10px" color="gray.500" isTruncated maxW="full">
                        {phase.phaseSubtitle}
                      </Text>
                    )}
                  </VStack>

                  <Text fontSize="10px" color="gray.400" flexShrink={0}>
                    {phase.phaseNumber}/{sortedPhases.length}
                  </Text>
                </HStack>

                {/* Phase results (shown when completed or loading) */}
                {result && (result.status === 'completed' || result.status === 'loading') && (
                  <Box mt={1} pl="36px">
                    {isLoading && result.subSteps && (
                      <SubStepsDisplay subSteps={result.subSteps} />
                    )}
                    {isLoading && !result.subSteps && (
                      <SkeletonText noOfLines={2} spacing={1} skeletonHeight="8px" mt={1} />
                    )}
                    {isCompleted && phase.resultDisplayType === 'BADGES' && (
                      <BadgesDisplay badges={result.badges} />
                    )}
                    {isCompleted && phase.resultDisplayType === 'STATS' && (
                      <StatsDisplay stats={result.stats} enabled={isCompleted} />
                    )}
                    {isCompleted && phase.resultDisplayType === 'TABLE' && (
                      <TableDisplay headers={result.tableHeaders} rows={result.tableRows} />
                    )}
                    {isCompleted && result.legalRefs && result.legalRefs.length > 0 && (
                      <LegalRefsDisplay refs={result.legalRefs} />
                    )}
                  </Box>
                )}

                {/* Skeleton for loading phases */}
                {isLoading && !result?.subSteps && (
                  <Box mt={1} pl="36px">
                    <Skeleton h="8px" w="80%" mb={1} />
                    <Skeleton h="8px" w="60%" />
                  </Box>
                )}
              </MotionBox>
            );
          })}
        </AnimatePresence>
      </VStack>

      {/* Summary footer */}
      {totalBudget !== undefined && totalBudget > 0 && (
        <>
          <Separator mt={3} mb={2} />
          <HStack justify="space-between" px={1}>
            <Text fontSize="xs" color="gray.500">Presupuesto</Text>
            <Text fontSize="xs" fontWeight="bold" color="green.600">
              ${new Intl.NumberFormat('es-EC').format(totalBudget)}
            </Text>
          </HStack>
        </>
      )}
    </Box>
  );
};

export default CPPAAMethodologyDashboard;
