/**
 * ProductJourneyTimeline - Illustrated journey map for product lifecycle
 *
 * Infographic-style horizontal journey with product-themed background,
 * spacious stage cards, road connectors, and speech-bubble help.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Flex, HStack, VStack, Text, Icon } from '@chakra-ui/react';
import {
  FiSend,
  FiBell,
  FiEdit3,
  FiFileText,
  FiDollarSign,
  FiAlertTriangle,
  FiLock,
  FiCode,
  FiHelpCircle,
  FiX,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { LuSparkles, LuWand } from 'react-icons/lu';
import { useTheme } from '../../contexts/ThemeContext';
import { getIcon } from '../../utils/iconMap';
import type { JourneyNode, StageGroup } from '../../hooks/useProductJourney';

export type CreationMode = 'wizard' | 'expert';

interface ProductJourneyTimelineProps {
  stages: StageGroup[];
  categoryColor: string;
  productCategory?: string;
  productDescription?: string;
  productLabel?: string;
  onEventClick: (node: JourneyNode) => void;
  onCreationClick?: (node: JourneyNode, mode: CreationMode) => void;
  selectedEventId?: number | null;
}

// Vibrant stage palette
const STAGE_COLORS: Record<string, string> = {
  ISSUANCE: '#3B82F6',
  ADVICE: '#8B5CF6',
  AMENDMENT: '#F59E0B',
  DOCUMENTS: '#10B981',
  PAYMENT: '#06B6D4',
  CLAIM: '#EF4444',
  CLOSURE: '#6B7280',
};

const STAGE_EMOJIS: Record<string, string> = {
  ISSUANCE: '🚢',
  ADVICE: '📨',
  AMENDMENT: '✏️',
  DOCUMENTS: '📄',
  PAYMENT: '💰',
  CLAIM: '⚠️',
  CLOSURE: '🔒',
};

const STAGE_ICONS: Record<string, React.ElementType> = {
  ISSUANCE: FiSend,
  ADVICE: FiBell,
  AMENDMENT: FiEdit3,
  DOCUMENTS: FiFileText,
  PAYMENT: FiDollarSign,
  CLAIM: FiAlertTriangle,
  CLOSURE: FiLock,
};

// Background gradients per product category — LIGHT mode (visible)
const PRODUCT_BG: Record<string, { gradient: string; pattern: string }> = {
  LETTERS_OF_CREDIT: {
    gradient: 'linear-gradient(135deg, #EBF2FF 0%, #F0EBFF 40%, #EBF5FF 100%)',
    pattern: 'radial-gradient(circle at 10% 90%, rgba(59,130,246,0.15) 0%, transparent 45%), radial-gradient(circle at 90% 10%, rgba(139,92,246,0.12) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(59,130,246,0.04) 0%, transparent 70%)',
  },
  GUARANTEES: {
    gradient: 'linear-gradient(135deg, #F0EBFF 0%, #F5EBFF 40%, #EDEBFF 100%)',
    pattern: 'radial-gradient(circle at 15% 85%, rgba(139,92,246,0.15) 0%, transparent 45%), radial-gradient(circle at 85% 15%, rgba(168,85,247,0.12) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(139,92,246,0.04) 0%, transparent 70%)',
  },
  COLLECTIONS: {
    gradient: 'linear-gradient(135deg, #FFF5EB 0%, #FFF0E0 40%, #FFF8F0 100%)',
    pattern: 'radial-gradient(circle at 10% 90%, rgba(249,115,22,0.15) 0%, transparent 45%), radial-gradient(circle at 90% 10%, rgba(245,158,11,0.12) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(249,115,22,0.04) 0%, transparent 70%)',
  },
  TRADE_FINANCE: {
    gradient: 'linear-gradient(135deg, #E6FFF9 0%, #E0FFFE 40%, #ECFDF5 100%)',
    pattern: 'radial-gradient(circle at 10% 90%, rgba(20,184,166,0.15) 0%, transparent 45%), radial-gradient(circle at 90% 10%, rgba(6,182,212,0.12) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(20,184,166,0.04) 0%, transparent 70%)',
  },
};

// Background gradients per product category — DARK mode
const PRODUCT_BG_DARK: Record<string, { gradient: string; pattern: string }> = {
  LETTERS_OF_CREDIT: {
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(139,92,246,0.08) 40%, rgba(59,130,246,0.05) 100%)',
    pattern: 'radial-gradient(circle at 10% 90%, rgba(59,130,246,0.18) 0%, transparent 45%), radial-gradient(circle at 90% 10%, rgba(139,92,246,0.14) 0%, transparent 45%)',
  },
  GUARANTEES: {
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.14) 0%, rgba(168,85,247,0.08) 40%, rgba(139,92,246,0.05) 100%)',
    pattern: 'radial-gradient(circle at 15% 85%, rgba(139,92,246,0.18) 0%, transparent 45%), radial-gradient(circle at 85% 15%, rgba(168,85,247,0.14) 0%, transparent 45%)',
  },
  COLLECTIONS: {
    gradient: 'linear-gradient(135deg, rgba(249,115,22,0.14) 0%, rgba(245,158,11,0.08) 40%, rgba(249,115,22,0.05) 100%)',
    pattern: 'radial-gradient(circle at 10% 90%, rgba(249,115,22,0.18) 0%, transparent 45%), radial-gradient(circle at 90% 10%, rgba(245,158,11,0.14) 0%, transparent 45%)',
  },
  TRADE_FINANCE: {
    gradient: 'linear-gradient(135deg, rgba(20,184,166,0.14) 0%, rgba(6,182,212,0.08) 40%, rgba(20,184,166,0.05) 100%)',
    pattern: 'radial-gradient(circle at 10% 90%, rgba(20,184,166,0.18) 0%, transparent 45%), radial-gradient(circle at 90% 10%, rgba(6,182,212,0.14) 0%, transparent 45%)',
  },
};

function getStageColor(cat: string, fb: string) { return STAGE_COLORS[cat] || fb; }
function getStageEmoji(cat: string) { return STAGE_EMOJIS[cat] || '📋'; }

/** Speech-bubble popover */
const SpeechBubble: React.FC<{ text: string; color: string; onClose: () => void }> = ({ text, color, onClose }) => {
  const { darkMode } = useTheme();
  return (
    <Box
      position="relative"
      bg={darkMode ? 'gray.700' : 'white'}
      borderRadius="16px"
      border="2px solid"
      borderColor={`${color}30`}
      px={3.5}
      py={2.5}
      boxShadow={`0 8px 24px ${color}15, 0 2px 6px rgba(0,0,0,0.06)`}
      className="animate-scale-in"
      mt={2}
      mx={1}
    >
      {/* Tail */}
      <Box
        position="absolute"
        top="-8px"
        left="20px"
        w="14px"
        h="14px"
        bg={darkMode ? 'var(--chakra-colors-gray-700)' : 'white'}
        border="2px solid"
        borderColor={`${color}30`}
        borderBottom="none"
        borderRight="none"
        transform="rotate(45deg)"
      />
      <Flex align="start" gap={2.5}>
        <Text fontSize="xs" color={darkMode ? 'gray.200' : 'gray.600'} lineHeight="1.5" flex={1}>
          {text}
        </Text>
        <Box
          as="button"
          flexShrink={0}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClose(); }}
          cursor="pointer"
          opacity={0.4}
          _hover={{ opacity: 1 }}
          p={0.5}
        >
          <Icon as={FiX} boxSize={3} />
        </Box>
      </Flex>
    </Box>
  );
};

/** Road connector with visible arrow between stages */
const RoadConnector: React.FC<{ color: string; nextColor: string; darkMode: boolean }> = ({ color, nextColor, darkMode }) => (
  <Flex
    align="center"
    justify="center"
    px={1}
    flexShrink={0}
    position="relative"
    minH="60px"
  >
    <VStack gap={0.5} align="center">
      {/* Dot start */}
      <Box
        w="8px"
        h="8px"
        borderRadius="full"
        bg={color}
        opacity={0.7}
      />
      {/* Gradient line */}
      <Box
        w="40px"
        h="4px"
        borderRadius="full"
        background={`linear-gradient(90deg, ${color}, ${nextColor})`}
        opacity={0.6}
      />
      {/* Arrow */}
      <Icon
        as={FiArrowRight}
        boxSize={4.5}
        color={nextColor}
        opacity={0.8}
        fontWeight="bold"
      />
    </VStack>
  </Flex>
);

export const ProductJourneyTimeline: React.FC<ProductJourneyTimelineProps> = ({
  stages,
  categoryColor,
  productCategory,
  productDescription,
  productLabel,
  onEventClick,
  onCreationClick,
  selectedEventId,
}) => {
  const { darkMode, getColors } = useTheme();
  const colors = getColors();
  const [helpNodeId, setHelpNodeId] = useState<number | null>(null);

  // Scroll navigation
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, stages]);

  // Convert vertical mouse wheel to horizontal scroll
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  }, []);

  const scrollBy = useCallback((amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  // Product-themed background
  const bgMap = darkMode ? PRODUCT_BG_DARK : PRODUCT_BG;
  const bg = bgMap[productCategory || ''] || bgMap['LETTERS_OF_CREDIT'];

  if (stages.length === 0) return null;

  return (
    <Box
      borderRadius="20px"
      background={bg.gradient}
      position="relative"
      overflow="hidden"
      mb={3}
      border="1px solid"
      borderColor={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
    >
      {/* Decorative background pattern */}
      <Box
        position="absolute"
        inset={0}
        background={bg.pattern}
        pointerEvents="none"
      />

      {/* Product description banner */}
      {productDescription && (
        <HStack
          px={4}
          pt={4}
          pb={2}
          gap={3}
          position="relative"
        >
          <Flex
            w="36px"
            h="36px"
            borderRadius="12px"
            bg={`${categoryColor}15`}
            align="center"
            justify="center"
            flexShrink={0}
            border="2px solid"
            borderColor={`${categoryColor}20`}
          >
            <Icon as={FiFileText} boxSize={4.5} color={categoryColor} />
          </Flex>
          <VStack gap={0.5} align="start" flex={1} minW={0}>
            {productLabel && (
              <Text fontSize="xs" fontWeight="800" color={categoryColor} lineClamp={1}>
                {productLabel}
              </Text>
            )}
            <Text
              fontSize="xs"
              color={colors.textColorSecondary}
              lineHeight="1.4"
              lineClamp={2}
            >
              {productDescription}
            </Text>
          </VStack>
        </HStack>
      )}

      {/* Scrollable content with navigation arrows */}
      <Box position="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <Flex
            position="absolute"
            left={0}
            top={0}
            bottom={0}
            w="36px"
            align="center"
            justify="center"
            zIndex={2}
            cursor="pointer"
            onClick={() => scrollBy(-200)}
            background={darkMode
              ? 'linear-gradient(90deg, rgba(26,32,44,0.95) 40%, transparent)'
              : 'linear-gradient(90deg, rgba(255,255,255,0.95) 40%, transparent)'
            }
            transition="opacity 0.2s"
            _hover={{ '& svg': { transform: 'scale(1.2)' } }}
          >
            <Flex
              w="28px"
              h="28px"
              borderRadius="full"
              bg={darkMode ? 'whiteAlpha.200' : 'blackAlpha.100'}
              align="center"
              justify="center"
            >
              <Icon as={FiChevronLeft} boxSize={4} color={colors.textColor} transition="transform 0.15s" />
            </Flex>
          </Flex>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <Flex
            position="absolute"
            right={0}
            top={0}
            bottom={0}
            w="36px"
            align="center"
            justify="center"
            zIndex={2}
            cursor="pointer"
            onClick={() => scrollBy(200)}
            background={darkMode
              ? 'linear-gradient(270deg, rgba(26,32,44,0.95) 40%, transparent)'
              : 'linear-gradient(270deg, rgba(255,255,255,0.95) 40%, transparent)'
            }
            transition="opacity 0.2s"
            _hover={{ '& svg': { transform: 'scale(1.2)' } }}
          >
            <Flex
              w="28px"
              h="28px"
              borderRadius="full"
              bg={darkMode ? 'whiteAlpha.200' : 'blackAlpha.100'}
              align="center"
              justify="center"
            >
              <Icon as={FiChevronRight} boxSize={4} color={colors.textColor} transition="transform 0.15s" />
            </Flex>
          </Flex>
        )}

        <Box
          ref={scrollRef}
          overflowX="auto"
          className="hide-scrollbar"
          px={4}
          py={5}
          onWheel={handleWheel}
        >
          <HStack
            gap={0}
            align="start"
            minW="max-content"
          >
          {stages.map((stage, stageIndex) => {
            const stageColor = getStageColor(stage.category, categoryColor);
            const emoji = getStageEmoji(stage.category);
            const isLast = stageIndex === stages.length - 1;
            const nextColor = !isLast
              ? getStageColor(stages[stageIndex + 1].category, categoryColor)
              : stageColor;

            return (
              <HStack key={stage.category} gap={0} align="start">
                {/* Stage column */}
                <VStack
                  gap={3}
                  align="stretch"
                  w="170px"
                  className={`animate-timeline-slide-in timeline-stagger-${Math.min(stageIndex + 1, 8)}`}
                >
                  {/* ── STAGE HEADER ── */}
                  <VStack gap={0} align="center">
                    {/* Big emoji circle */}
                    <Flex
                      w="48px"
                      h="48px"
                      borderRadius="16px"
                      bg={`${stageColor}15`}
                      align="center"
                      justify="center"
                      border="2.5px solid"
                      borderColor={`${stageColor}30`}
                      boxShadow={`0 4px 12px ${stageColor}15`}
                      mb={2}
                    >
                      <Text fontSize="xl" lineHeight="1">{emoji}</Text>
                    </Flex>

                    {/* Label + step indicator */}
                    <HStack gap={1.5} mb={0.5}>
                      <Flex
                        w="18px"
                        h="18px"
                        borderRadius="full"
                        bg={stageColor}
                        align="center"
                        justify="center"
                        flexShrink={0}
                      >
                        <Text fontSize="8px" fontWeight="900" color="white">{stageIndex + 1}</Text>
                      </Flex>
                      <Text
                        fontSize="xs"
                        fontWeight="800"
                        color={stageColor}
                        lineClamp={1}
                      >
                        {stage.label}
                      </Text>
                    </HStack>

                    <Text fontSize="9px" color={colors.textColorSecondary}>
                      {stage.events.length} {stage.events.length === 1 ? 'evento' : 'eventos'}
                    </Text>
                  </VStack>

                  {/* ── EVENT NODES ── */}
                  <VStack gap={2} align="stretch">
                    {stage.events.map((node) => {
                      const NodeIcon = getIcon(node.icon || null);
                      const nodeColor = node.color || stageColor;
                      const isSelected = selectedEventId === node.id;
                      const showHelp = helpNodeId === node.id;

                      // ── Creation event: wizard + expert ──
                      if (node.isInitialEvent && onCreationClick) {
                        return (
                          <VStack key={node.id} gap={2} align="stretch">
                            <HStack px={0.5} gap={1.5}>
                              <Text fontSize="sm" lineHeight="1">⭐</Text>
                              <Text fontSize="xs" fontWeight="800" color={nodeColor}>
                                {node.eventName}
                              </Text>
                            </HStack>

                            {/* Wizard */}
                            <Box
                              as="button"
                              bg={darkMode ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.06)'}
                              borderRadius="16px"
                              px={3}
                              py={3}
                              border="2px solid"
                              borderColor={darkMode ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.15)'}
                              cursor="pointer"
                              transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                              _hover={{
                                borderColor: '#3B82F680',
                                boxShadow: '0 8px 24px rgba(59,130,246,0.18)',
                                transform: 'translateY(-3px)',
                              }}
                              _active={{ transform: 'scale(0.96)' }}
                              onClick={() => onCreationClick(node, 'wizard')}
                              boxShadow="0 2px 12px rgba(59,130,246,0.08)"
                              textAlign="left"
                              w="100%"
                            >
                              <VStack gap={2} align="center">
                                <Flex
                                  w="40px"
                                  h="40px"
                                  borderRadius="14px"
                                  bg="linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,160,255,0.15))"
                                  align="center"
                                  justify="center"
                                  border="2px solid rgba(59,130,246,0.2)"
                                >
                                  <Icon as={LuWand} boxSize={5} color="#3B82F6" />
                                </Flex>
                                <VStack gap={0}>
                                  <Text fontSize="xs" fontWeight="800" color="#3B82F6">
                                    Wizard
                                  </Text>
                                  <Text fontSize="2xs" color={colors.textColorSecondary}>
                                    Paso a paso
                                  </Text>
                                </VStack>
                              </VStack>
                            </Box>

                            {/* Expert */}
                            <Box
                              as="button"
                              bg={darkMode ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.06)'}
                              borderRadius="16px"
                              px={3}
                              py={3}
                              border="2px solid"
                              borderColor={darkMode ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.15)'}
                              cursor="pointer"
                              transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                              _hover={{
                                borderColor: '#8B5CF680',
                                boxShadow: '0 8px 24px rgba(139,92,246,0.18)',
                                transform: 'translateY(-3px)',
                              }}
                              _active={{ transform: 'scale(0.96)' }}
                              onClick={() => onCreationClick(node, 'expert')}
                              boxShadow="0 2px 12px rgba(139,92,246,0.08)"
                              textAlign="left"
                              w="100%"
                            >
                              <VStack gap={2} align="center">
                                <Flex
                                  w="40px"
                                  h="40px"
                                  borderRadius="14px"
                                  bg="linear-gradient(135deg, rgba(139,92,246,0.2), rgba(168,120,255,0.15))"
                                  align="center"
                                  justify="center"
                                  border="2px solid rgba(139,92,246,0.2)"
                                >
                                  <Icon as={FiCode} boxSize={5} color="#8B5CF6" />
                                </Flex>
                                <VStack gap={0}>
                                  <Text fontSize="xs" fontWeight="800" color="#8B5CF6">
                                    Experto
                                  </Text>
                                  <Text fontSize="2xs" color={colors.textColorSecondary}>
                                    Formulario completo
                                  </Text>
                                </VStack>
                              </VStack>
                            </Box>
                          </VStack>
                        );
                      }

                      // ── Regular event node ──
                      return (
                        <Box key={node.id}>
                          <HStack
                            as="button"
                            bg={isSelected
                              ? (darkMode ? `${nodeColor}22` : `${nodeColor}12`)
                              : (darkMode ? `${stageColor}10` : `${stageColor}06`)
                            }
                            borderRadius="14px"
                            px={3}
                            py={2.5}
                            gap={2.5}
                            border="2px solid"
                            borderColor={isSelected ? `${nodeColor}50` : `${stageColor}15`}
                            cursor="pointer"
                            transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                            _hover={{
                              borderColor: `${nodeColor}40`,
                              boxShadow: `0 6px 20px ${nodeColor}12`,
                              transform: 'translateY(-2px)',
                            }}
                            _active={{ transform: 'scale(0.96)' }}
                            onClick={() => onEventClick(node)}
                            boxShadow={isSelected
                              ? `0 4px 16px ${nodeColor}18`
                              : '0 2px 8px rgba(0,0,0,0.04)'
                            }
                            textAlign="left"
                            w="100%"
                          >
                            <Flex
                              w="32px"
                              h="32px"
                              borderRadius="11px"
                              bg={`${nodeColor}12`}
                              align="center"
                              justify="center"
                              flexShrink={0}
                              border="2px solid"
                              borderColor={`${nodeColor}20`}
                            >
                              <Icon as={NodeIcon} boxSize={4} color={nodeColor} />
                            </Flex>

                            <Text
                              fontSize="xs"
                              fontWeight="700"
                              color={colors.textColor}
                              lineClamp={2}
                              lineHeight="1.35"
                              flex={1}
                              minW={0}
                            >
                              {node.eventName}
                            </Text>

                            {node.description && (
                              <Box
                                role="button"
                                tabIndex={0}
                                flexShrink={0}
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  setHelpNodeId(showHelp ? null : node.id);
                                }}
                                onMouseEnter={() => setHelpNodeId(node.id)}
                                onMouseLeave={() => { if (helpNodeId === node.id) setHelpNodeId(null); }}
                                cursor="pointer"
                                p={1}
                                borderRadius="full"
                                transition="all 0.15s"
                                bg={showHelp ? `${nodeColor}15` : 'transparent'}
                                _hover={{ bg: `${nodeColor}12` }}
                              >
                                <Icon
                                  as={FiHelpCircle}
                                  boxSize={3.5}
                                  color={showHelp ? nodeColor : colors.textColorSecondary}
                                  opacity={showHelp ? 1 : 0.45}
                                />
                              </Box>
                            )}
                          </HStack>

                          {showHelp && node.description && (
                            <SpeechBubble
                              text={node.description}
                              color={nodeColor}
                              onClose={() => setHelpNodeId(null)}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </VStack>
                </VStack>

                {/* Road connector */}
                {!isLast && (
                  <RoadConnector
                    color={stageColor}
                    nextColor={nextColor}
                    darkMode={darkMode}
                  />
                )}
              </HStack>
            );
          })}
        </HStack>
        </Box>
      </Box>
    </Box>
  );
};

export default ProductJourneyTimeline;
