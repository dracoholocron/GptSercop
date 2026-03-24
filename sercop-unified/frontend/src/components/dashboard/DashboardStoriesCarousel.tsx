/**
 * DashboardStoriesCarousel Component
 * Horizontal carousel of unified story cards: alerts, drafts, pending registrations,
 * business requests, and exchange rates. Collapsible, compact design.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  FiClock,
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiLayers,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useDashboardStories } from '../../hooks/useDashboardStories';
import type { StoryItem, StoryCategory } from '../../hooks/useDashboardStories';

// ============================================================================
// ANIMATIONS (subtle)
// ============================================================================

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ============================================================================
// CATEGORY CONFIG
// ============================================================================

const CATEGORY_LABELS: Record<StoryCategory, string> = {
  PENDING_APPROVAL: 'storyApproval',
  ALERT: 'storyAlert',
  DRAFT: 'storyDraft',
  PENDING_REGISTRATION: 'storyPendingReg',
  BUSINESS_REQUEST: 'storyBusinessReq',
  EXCHANGE_RATE: 'storyExchangeRate',
};

const CATEGORY_BADGE_COLORS: Record<StoryCategory, { bg: string; bgDark: string; color: string; colorDark: string }> = {
  PENDING_APPROVAL: { bg: 'red.100', bgDark: 'rgba(254,178,178,0.25)', color: 'red.700', colorDark: 'red.200' },
  ALERT: { bg: 'red.50', bgDark: 'rgba(254,178,178,0.15)', color: 'red.600', colorDark: 'red.300' },
  DRAFT: { bg: 'purple.50', bgDark: 'rgba(183,148,244,0.15)', color: 'purple.600', colorDark: 'purple.300' },
  PENDING_REGISTRATION: { bg: 'teal.50', bgDark: 'rgba(129,230,217,0.15)', color: 'teal.600', colorDark: 'teal.300' },
  BUSINESS_REQUEST: { bg: 'orange.50', bgDark: 'rgba(251,211,141,0.15)', color: 'orange.600', colorDark: 'orange.300' },
  EXCHANGE_RATE: { bg: 'cyan.50', bgDark: 'rgba(118,200,234,0.15)', color: 'cyan.700', colorDark: 'cyan.300' },
};

const STORAGE_KEY = 'gcx-activity-panel-collapsed';

// ============================================================================
// EXCHANGE RATE CARD (compact)
// ============================================================================

interface ExchangeRateCardProps {
  item: StoryItem;
  index: number;
  isDark: boolean;
  onClick: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function ExchangeRateCard({ item, index, isDark, onClick, t }: ExchangeRateCardProps) {
  const parts = item.metadata?.split('|').map(s => s.trim()) || [];
  const buyValue = parts[0]?.replace('C: ', '') || '—';
  const sellValue = parts[1]?.replace('V: ', '') || '—';

  return (
    <Box
      minW="140px"
      maxW="140px"
      h="120px"
      borderRadius="lg"
      overflow="hidden"
      cursor="pointer"
      position="relative"
      bg={isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.98)'}
      border="1px solid"
      borderColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
      boxShadow={isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)'}
      transition="all 0.2s ease"
      _hover={{
        transform: 'translateY(-2px)',
        borderColor: isDark ? 'cyan.500/30' : 'cyan.300/50',
        boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.1)',
      }}
      onClick={onClick}
      scrollSnapAlign="start"
      css={{ animation: `${fadeIn} 0.3s ease ${index * 30}ms both` }}
      flexShrink={0}
    >
      {/* Compact Top Band */}
      <Box
        h="32px"
        background={item.bgGradient}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize="sm" fontWeight="bold" color="white" letterSpacing="wide">
          {item.title}
        </Text>
      </Box>

      {/* Rate Values */}
      <VStack px={2.5} py={1.5} gap={1} flex={1}>
        <HStack w="100%" justify="space-between" align="center">
          <HStack gap={1}>
            <Icon as={FiTrendingUp} boxSize={2.5} color="green.500" />
            <Text fontSize="9px" fontWeight="semibold" color={isDark ? 'gray.400' : 'gray.500'}>
              {t('businessDashboard.storyBuy')}
            </Text>
          </HStack>
          <Text fontSize="xs" fontWeight="bold" color={isDark ? 'green.300' : 'green.600'} fontFamily="mono">
            {buyValue}
          </Text>
        </HStack>
        <Box w="100%" h="1px" bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'} />
        <HStack w="100%" justify="space-between" align="center">
          <HStack gap={1}>
            <Icon as={FiTrendingDown} boxSize={2.5} color="red.400" />
            <Text fontSize="9px" fontWeight="semibold" color={isDark ? 'gray.400' : 'gray.500'}>
              {t('businessDashboard.storySell')}
            </Text>
          </HStack>
          <Text fontSize="xs" fontWeight="bold" color={isDark ? 'red.300' : 'red.600'} fontFamily="mono">
            {sellValue}
          </Text>
        </HStack>
      </VStack>

      {/* Status Bar */}
      <Box h="2px" w="100%" position="absolute" bottom={0} left={0} bg={item.statusColor} opacity={0.5} />
    </Box>
  );
}

// ============================================================================
// GENERIC STORY CARD (compact)
// ============================================================================

interface StoryCardProps {
  item: StoryItem;
  index: number;
  isDark: boolean;
  onClick: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function StoryCard({ item, index, isDark, onClick, t }: StoryCardProps) {
  const categoryBadge = CATEGORY_BADGE_COLORS[item.category];

  return (
    <Box
      minW="160px"
      maxW="160px"
      h="120px"
      borderRadius="lg"
      overflow="hidden"
      cursor="pointer"
      position="relative"
      bg={isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.95)'}
      border="1px solid"
      borderColor={item.isOverdue
        ? isDark ? 'red.500/50' : 'red.300'
        : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
      }
      boxShadow={isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)'}
      transition="all 0.2s ease"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.1)',
      }}
      onClick={onClick}
      scrollSnapAlign="start"
      css={{ animation: `${fadeIn} 0.3s ease ${index * 30}ms both` }}
      flexShrink={0}
    >
      {/* Compact Gradient Band with icon + category */}
      <Box
        h="36px"
        background={item.bgGradient}
        display="flex"
        alignItems="center"
        px={2.5}
        gap={2}
      >
        <Icon as={item.icon} boxSize={3.5} color="white" />
        <Badge
          bg="rgba(255,255,255,0.2)"
          color="white"
          fontSize="8px"
          px={1.5}
          borderRadius="full"
          fontWeight="bold"
          textTransform="uppercase"
        >
          {t(`businessDashboard.${CATEGORY_LABELS[item.category]}`)}
        </Badge>
        {item.isOverdue && (
          <Badge bg="red.500" color="white" fontSize="7px" px={1} borderRadius="full" fontWeight="bold" ml="auto">
            {t('businessDashboard.storyOverdue')}
          </Badge>
        )}
        {item.priorityBadge === 'URGENT' && !item.isOverdue && (
          <Badge bg="red.500" color="white" fontSize="7px" px={1} borderRadius="full" fontWeight="bold" ml="auto">
            {t('businessDashboard.storyUrgent')}
          </Badge>
        )}
      </Box>

      {/* Card Body */}
      <VStack px={2.5} py={1.5} align="start" gap={0.5} flex={1} overflow="hidden">
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color={isDark ? 'gray.100' : 'gray.800'}
          lineHeight="short"
          noOfLines={2}
          w="100%"
        >
          {item.title}
        </Text>
        <HStack gap={1}>
          <Icon as={FiClock} boxSize={2.5} color={isDark ? 'gray.500' : 'gray.400'} />
          <Text fontSize="9px" color={isDark ? 'gray.500' : 'gray.400'}>
            {item.timestamp || t('businessDashboard.storyNoTime')}
          </Text>
        </HStack>
        {item.subtitle && (
          <Text fontSize="9px" color={isDark ? 'gray.500' : 'gray.400'} noOfLines={1}>
            {item.subtitle}
          </Text>
        )}
      </VStack>

      {/* Status Bar */}
      <Box h="2px" w="100%" position="absolute" bottom={0} left={0} bg={item.statusColor} opacity={0.5} />
    </Box>
  );
}

// ============================================================================
// MAIN CAROUSEL COMPONENT
// ============================================================================

export function DashboardStoriesCarousel() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { items, loading, counts } = useDashboardStories();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Collapsible state persisted in localStorage
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
  });

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // --- Scroll arrow visibility ---
  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 10);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  // Update arrows when expanded
  useEffect(() => {
    if (!collapsed) {
      setTimeout(updateArrows, 100);
    }
  }, [collapsed, updateArrows, items.length]);

  const scrollBy = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -300 : 300;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  // --- Drag-to-scroll handlers ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftPos(el.scrollLeft);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5;
    el.scrollLeft = scrollLeftPos - walk;
  }, [isDragging, startX, scrollLeftPos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Don't render if no items and not loading
  if (!loading && items.length === 0) return null;

  // Show minimal loader
  if (loading && items.length === 0) {
    return (
      <Box mb={4} display="flex" alignItems="center" gap={3} px={2}>
        <Spinner size="sm" color="blue.400" />
        <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
          {t('businessDashboard.storiesTitle')}...
        </Text>
      </Box>
    );
  }

  const totalCount = items.length;

  return (
    <Box mb={4} position="relative">
      {/* Section Header — clickable to collapse/expand */}
      <HStack
        mb={collapsed ? 0 : 2}
        px={1}
        justify="space-between"
        align="center"
        cursor="pointer"
        onClick={toggleCollapsed}
        userSelect="none"
        _hover={{ '& .toggle-icon': { color: isDark ? 'cyan.300' : 'cyan.600' } }}
        role="button"
        aria-expanded={!collapsed}
      >
        <HStack gap={2} align="center">
          <Icon as={FiLayers} boxSize={3.5} color={isDark ? 'gray.400' : 'gray.500'} />
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color={isDark ? 'gray.300' : 'gray.600'}
            letterSpacing="tight"
          >
            {t('businessDashboard.storiesTitle')}
          </Text>
          <Badge
            bg={isDark ? 'whiteAlpha.100' : 'gray.100'}
            color={isDark ? 'gray.400' : 'gray.600'}
            fontSize="10px"
            borderRadius="full"
            px={1.5}
            fontWeight="medium"
          >
            {totalCount}
          </Badge>

          {/* Summary badges when collapsed */}
          {collapsed && (
            <HStack gap={1} ml={2}>
              {counts.approvals > 0 && (
                <Badge
                  bg={isDark ? 'red.500/20' : 'red.50'}
                  color={isDark ? 'red.300' : 'red.600'}
                  fontSize="9px"
                  borderRadius="full"
                  px={1.5}
                >
                  {counts.approvals}
                </Badge>
              )}
              {counts.alerts > 0 && (
                <Badge
                  bg={isDark ? 'orange.500/15' : 'orange.50'}
                  color={isDark ? 'orange.300' : 'orange.600'}
                  fontSize="9px"
                  borderRadius="full"
                  px={1.5}
                >
                  {counts.alerts}
                </Badge>
              )}
              {counts.drafts > 0 && (
                <Badge
                  bg={isDark ? 'purple.500/15' : 'purple.50'}
                  color={isDark ? 'purple.300' : 'purple.600'}
                  fontSize="9px"
                  borderRadius="full"
                  px={1.5}
                >
                  {counts.drafts}
                </Badge>
              )}
              {counts.rates > 0 && (
                <Badge
                  bg={isDark ? 'cyan.500/15' : 'cyan.50'}
                  color={isDark ? 'cyan.300' : 'cyan.600'}
                  fontSize="9px"
                  borderRadius="full"
                  px={1.5}
                >
                  {counts.rates}
                </Badge>
              )}
            </HStack>
          )}
        </HStack>

        <HStack gap={1.5}>
          {/* Category mini-badges (only when expanded) */}
          {!collapsed && (
            <HStack gap={1} display={{ base: 'none', md: 'flex' }}>
              {counts.approvals > 0 && (
                <Badge bg={isDark ? 'red.500/20' : 'red.50'} color={isDark ? 'red.300' : 'red.600'} fontSize="9px" borderRadius="full" px={1.5}>
                  {counts.approvals} {t('businessDashboard.storyApproval')}
                </Badge>
              )}
              {counts.alerts > 0 && (
                <Badge bg={isDark ? 'red.500/15' : 'red.50'} color={isDark ? 'red.300' : 'red.600'} fontSize="9px" borderRadius="full" px={1.5}>
                  {counts.alerts} {t('businessDashboard.storyAlert')}
                </Badge>
              )}
              {counts.drafts > 0 && (
                <Badge bg={isDark ? 'purple.500/15' : 'purple.50'} color={isDark ? 'purple.300' : 'purple.600'} fontSize="9px" borderRadius="full" px={1.5}>
                  {counts.drafts} {t('businessDashboard.storyDraft')}
                </Badge>
              )}
              {counts.rates > 0 && (
                <Badge bg={isDark ? 'cyan.500/15' : 'cyan.50'} color={isDark ? 'cyan.300' : 'cyan.600'} fontSize="9px" borderRadius="full" px={1.5}>
                  {counts.rates} {t('businessDashboard.storyExchangeRate')}
                </Badge>
              )}
            </HStack>
          )}
          <Icon
            className="toggle-icon"
            as={collapsed ? FiChevronDown : FiChevronUp}
            boxSize={3.5}
            color={isDark ? 'gray.500' : 'gray.400'}
            transition="color 0.2s"
          />
        </HStack>
      </HStack>

      {/* Carousel Container — hidden when collapsed */}
      {!collapsed && (
        <Box position="relative">
          {/* Left Arrow */}
          {showLeftArrow && (
            <Box
              position="absolute"
              left={-1}
              top="50%"
              transform="translateY(-50%)"
              zIndex={10}
              w="28px"
              h="28px"
              borderRadius="full"
              bg={isDark ? 'gray.700' : 'white'}
              boxShadow="0 1px 6px rgba(0,0,0,0.15)"
              display={{ base: 'none', md: 'flex' }}
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              _hover={{ bg: isDark ? 'gray.600' : 'gray.50' }}
              transition="all 0.2s"
              onClick={() => scrollBy('left')}
            >
              <Icon as={FiChevronLeft} boxSize={3.5} color={isDark ? 'gray.200' : 'gray.600'} />
            </Box>
          )}

          {/* Right Arrow */}
          {showRightArrow && (
            <Box
              position="absolute"
              right={-1}
              top="50%"
              transform="translateY(-50%)"
              zIndex={10}
              w="28px"
              h="28px"
              borderRadius="full"
              bg={isDark ? 'gray.700' : 'white'}
              boxShadow="0 1px 6px rgba(0,0,0,0.15)"
              display={{ base: 'none', md: 'flex' }}
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              _hover={{ bg: isDark ? 'gray.600' : 'gray.50' }}
              transition="all 0.2s"
              onClick={() => scrollBy('right')}
            >
              <Icon as={FiChevronRight} boxSize={3.5} color={isDark ? 'gray.200' : 'gray.600'} />
            </Box>
          )}

          {/* Scrollable Row */}
          <Box
            ref={scrollRef}
            display="flex"
            gap={2.5}
            overflowX="auto"
            py={1}
            px={1}
            cursor={isDragging ? 'grabbing' : 'grab'}
            userSelect="none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onScroll={updateArrows}
            css={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {items.map((item, index) =>
              item.category === 'EXCHANGE_RATE' ? (
                <ExchangeRateCard
                  key={item.id}
                  item={item}
                  index={index}
                  isDark={isDark}
                  onClick={() => {
                    if (!isDragging) navigate(item.navigateTo);
                  }}
                  t={t}
                />
              ) : (
                <StoryCard
                  key={item.id}
                  item={item}
                  index={index}
                  isDark={isDark}
                  onClick={() => {
                    if (!isDragging) navigate(item.navigateTo);
                  }}
                  t={t}
                />
              )
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default DashboardStoriesCarousel;
