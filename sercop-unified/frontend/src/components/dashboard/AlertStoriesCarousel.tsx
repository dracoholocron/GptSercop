/**
 * AlertStoriesCarousel Component
 * Horizontal carousel of active alerts styled like Facebook Stories.
 * Drag-to-scroll on desktop, swipe on mobile, with gradient cards per alert type.
 */

import { useRef, useState, useCallback } from 'react';
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
  FiCalendar,
  FiBell,
  FiClock,
  FiCheckSquare,
  FiFileText,
  FiUsers,
  FiTrendingUp,
  FiShield,
  FiVideo,
  FiChevronLeft,
  FiChevronRight,
  FiAlertTriangle,
  FiArrowRight,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useActiveAlerts } from '../../hooks/useActiveAlerts';
import type { AlertResponse, AlertType, AlertPriority } from '../../services/alertService';

// ============================================================================
// ANIMATIONS
// ============================================================================

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const urgentPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(229, 62, 62, 0.6);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(229, 62, 62, 0);
  }
`;

const overdueGlow = keyframes`
  0%, 100% {
    border-color: rgba(229, 62, 62, 0.6);
    box-shadow: 0 0 8px rgba(229, 62, 62, 0.3);
  }
  50% {
    border-color: rgba(229, 62, 62, 1);
    box-shadow: 0 0 16px rgba(229, 62, 62, 0.5);
  }
`;

// ============================================================================
// ALERT TYPE CONFIG (mirrors AlertNotificationToast)
// ============================================================================

const ALERT_TYPE_CONFIG: Record<AlertType, {
  icon: typeof FiCalendar;
  bgGradient: string;
  label: string;
}> = {
  FOLLOW_UP: { icon: FiCalendar, bgGradient: 'linear-gradient(135deg, #4299E1 0%, #3182CE 100%)', label: 'Seguimiento' },
  REMINDER: { icon: FiBell, bgGradient: 'linear-gradient(135deg, #9F7AEA 0%, #805AD5 100%)', label: 'Recordatorio' },
  DEADLINE: { icon: FiClock, bgGradient: 'linear-gradient(135deg, #FC8181 0%, #E53E3E 100%)', label: 'Fecha Límite' },
  TASK: { icon: FiCheckSquare, bgGradient: 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)', label: 'Tarea' },
  DOCUMENT_REVIEW: { icon: FiFileText, bgGradient: 'linear-gradient(135deg, #ED8936 0%, #DD6B20 100%)', label: 'Doc. Review' },
  CLIENT_CONTACT: { icon: FiUsers, bgGradient: 'linear-gradient(135deg, #38B2AC 0%, #319795 100%)', label: 'Contacto' },
  OPERATION_UPDATE: { icon: FiTrendingUp, bgGradient: 'linear-gradient(135deg, #0BC5EA 0%, #00B5D8 100%)', label: 'Operación' },
  COMPLIANCE_CHECK: { icon: FiShield, bgGradient: 'linear-gradient(135deg, #ECC94B 0%, #D69E2E 100%)', label: 'Compliance' },
  VIDEO_CALL: { icon: FiVideo, bgGradient: 'linear-gradient(135deg, #48BB78 0%, #2F855A 100%)', label: 'Videollamada' },
};

const PRIORITY_COLORS: Record<AlertPriority, { bg: string; color: string }> = {
  LOW: { bg: 'gray.100', color: 'gray.600' },
  NORMAL: { bg: 'blue.100', color: 'blue.700' },
  HIGH: { bg: 'orange.100', color: 'orange.700' },
  URGENT: { bg: 'red.100', color: 'red.700' },
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#48BB78',
  IN_PROGRESS: '#4299E1',
  SNOOZED: '#9F7AEA',
};

// ============================================================================
// ALERT STORY CARD (sub-component)
// ============================================================================

interface AlertStoryCardProps {
  alert: AlertResponse;
  index: number;
  isDark: boolean;
  onClick: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function AlertStoryCard({ alert, index, isDark, onClick, t }: AlertStoryCardProps) {
  const typeConfig = ALERT_TYPE_CONFIG[alert.alertType] || ALERT_TYPE_CONFIG.TASK;
  const priorityColor = PRIORITY_COLORS[alert.priority] || PRIORITY_COLORS.NORMAL;
  const statusColor = STATUS_COLORS[alert.status] || STATUS_COLORS.PENDING;
  const isUrgent = alert.priority === 'URGENT';
  const isOverdue = alert.overdue;

  return (
    <Box
      minW="180px"
      maxW="180px"
      h="220px"
      borderRadius="xl"
      overflow="hidden"
      cursor="pointer"
      position="relative"
      bg={isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.95)'}
      border="2px solid"
      borderColor={isOverdue
        ? 'red.500'
        : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
      }
      boxShadow={isDark
        ? '0 4px 20px rgba(0,0,0,0.3)'
        : '0 4px 20px rgba(0,0,0,0.08)'
      }
      transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        transform: 'translateY(-6px) scale(1.03)',
        boxShadow: isDark
          ? '0 12px 40px rgba(0,0,0,0.5)'
          : '0 12px 40px rgba(0,0,0,0.15)',
      }}
      onClick={onClick}
      scrollSnapAlign="start"
      css={{
        animation: `${fadeInUp} 0.5s ease-out ${index * 80}ms both`,
        ...(isOverdue ? { animation: `${fadeInUp} 0.5s ease-out ${index * 80}ms both, ${overdueGlow} 2s ease-in-out infinite` } : {}),
      }}
      flexShrink={0}
    >
      {/* Gradient Top Band */}
      <Box
        h="60px"
        background={typeConfig.bgGradient}
        position="relative"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {/* Icon Circle (glassmorphism) */}
        <Box
          bg="rgba(255,255,255,0.2)"
          backdropFilter="blur(10px)"
          borderRadius="full"
          w="40px"
          h="40px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={typeConfig.icon} boxSize={5} color="white" />
        </Box>

        {/* Priority Badge */}
        {(isUrgent || alert.priority === 'HIGH') && (
          <Badge
            position="absolute"
            top={1.5}
            right={1.5}
            bg={priorityColor.bg}
            color={priorityColor.color}
            fontSize="9px"
            px={1.5}
            py={0.5}
            borderRadius="full"
            fontWeight="bold"
            css={isUrgent ? { animation: `${urgentPulse} 1.5s ease-in-out infinite` } : undefined}
          >
            {isUrgent ? t('businessDashboard.alertUrgent') : 'HIGH'}
          </Badge>
        )}

        {/* Overdue Badge */}
        {isOverdue && (
          <Badge
            position="absolute"
            top={1.5}
            left={1.5}
            bg="red.500"
            color="white"
            fontSize="9px"
            px={1.5}
            py={0.5}
            borderRadius="full"
            fontWeight="bold"
          >
            {t('businessDashboard.alertOverdue')}
          </Badge>
        )}
      </Box>

      {/* Card Body */}
      <VStack
        px={2.5}
        py={2}
        align="start"
        gap={1}
        flex={1}
        overflow="hidden"
      >
        {/* Title (max 2 lines) */}
        <Text
          fontSize="xs"
          fontWeight="bold"
          color={isDark ? 'gray.100' : 'gray.800'}
          lineHeight="short"
          noOfLines={2}
          w="100%"
        >
          {alert.title}
        </Text>

        {/* Scheduled Time */}
        <HStack gap={1}>
          <Icon as={FiClock} boxSize={3} color={isDark ? 'gray.400' : 'gray.500'} />
          <Text fontSize="10px" color={isDark ? 'gray.400' : 'gray.500'}>
            {alert.scheduledTime || t('businessDashboard.alertNoTime')}
          </Text>
        </HStack>

        {/* Client Name */}
        {alert.clientName && (
          <HStack gap={1}>
            <Icon as={FiUsers} boxSize={3} color={isDark ? 'gray.500' : 'gray.400'} />
            <Text fontSize="10px" color={isDark ? 'gray.500' : 'gray.400'} noOfLines={1}>
              {alert.clientName}
            </Text>
          </HStack>
        )}
      </VStack>

      {/* Status Bar */}
      <Box
        h="4px"
        w="100%"
        position="absolute"
        bottom={0}
        left={0}
        bg={statusColor}
        opacity={0.8}
      />
    </Box>
  );
}

// ============================================================================
// VIEW ALL CARD
// ============================================================================

interface ViewAllCardProps {
  isDark: boolean;
  onClick: () => void;
  count: number;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function ViewAllCard({ isDark, onClick, count, t }: ViewAllCardProps) {
  return (
    <Box
      minW="120px"
      maxW="120px"
      h="220px"
      borderRadius="xl"
      overflow="hidden"
      cursor="pointer"
      bg={isDark
        ? 'linear-gradient(135deg, rgba(66, 153, 225, 0.15) 0%, rgba(49, 130, 206, 0.25) 100%)'
        : 'linear-gradient(135deg, rgba(66, 153, 225, 0.08) 0%, rgba(49, 130, 206, 0.15) 100%)'
      }
      border="2px dashed"
      borderColor={isDark ? 'blue.500/30' : 'blue.300/50'}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={3}
      transition="all 0.25s ease"
      _hover={{
        transform: 'translateY(-4px)',
        borderColor: isDark ? 'blue.400/60' : 'blue.400/70',
        bg: isDark
          ? 'linear-gradient(135deg, rgba(66, 153, 225, 0.25) 0%, rgba(49, 130, 206, 0.35) 100%)'
          : 'linear-gradient(135deg, rgba(66, 153, 225, 0.15) 0%, rgba(49, 130, 206, 0.25) 100%)',
      }}
      onClick={onClick}
      scrollSnapAlign="start"
      flexShrink={0}
      css={{
        animation: `${fadeInUp} 0.5s ease-out ${count * 80}ms both`,
      }}
    >
      <Box
        bg={isDark ? 'blue.500/20' : 'blue.100'}
        borderRadius="full"
        w="44px"
        h="44px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Icon as={FiArrowRight} boxSize={5} color={isDark ? 'blue.300' : 'blue.500'} />
      </Box>
      <Text
        fontSize="xs"
        fontWeight="bold"
        color={isDark ? 'blue.300' : 'blue.600'}
        textAlign="center"
        px={2}
      >
        {t('businessDashboard.viewAllAlerts')}
      </Text>
    </Box>
  );
}

// ============================================================================
// MAIN CAROUSEL COMPONENT
// ============================================================================

export function AlertStoriesCarousel() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { alerts, loading } = useActiveAlerts();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // --- Scroll arrow visibility ---
  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 10);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

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
    setScrollLeft(el.scrollLeft);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5;
    el.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Don't render if no alerts and not loading
  if (!loading && alerts.length === 0) return null;

  // Show minimal loader
  if (loading && alerts.length === 0) {
    return (
      <Box mb={6} display="flex" alignItems="center" gap={3} px={2}>
        <Spinner size="sm" color="blue.400" />
        <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
          {t('businessDashboard.alertStories')}...
        </Text>
      </Box>
    );
  }

  return (
    <Box mb={6} position="relative">
      {/* Section Header */}
      <HStack mb={3} px={1} justify="space-between" align="center">
        <HStack gap={2} align="center">
          <Icon as={FiAlertTriangle} boxSize={4} color={isDark ? 'orange.300' : 'orange.500'} />
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={isDark ? 'gray.200' : 'gray.700'}
            letterSpacing="tight"
          >
            {t('businessDashboard.alertStories')}
          </Text>
          <Badge
            bg={isDark ? 'orange.500/20' : 'orange.100'}
            color={isDark ? 'orange.300' : 'orange.600'}
            fontSize="xs"
            borderRadius="full"
            px={2}
          >
            {alerts.length}
          </Badge>
        </HStack>
        <Text
          fontSize="xs"
          color={isDark ? 'blue.300' : 'blue.500'}
          cursor="pointer"
          fontWeight="semibold"
          _hover={{ textDecoration: 'underline' }}
          onClick={() => navigate('/alerts')}
        >
          {t('businessDashboard.viewAllAlerts')} &rarr;
        </Text>
      </HStack>

      {/* Carousel Container */}
      <Box position="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <Box
            position="absolute"
            left={-2}
            top="50%"
            transform="translateY(-50%)"
            zIndex={10}
            w="32px"
            h="32px"
            borderRadius="full"
            bg={isDark ? 'gray.700' : 'white'}
            boxShadow="0 2px 10px rgba(0,0,0,0.2)"
            display={{ base: 'none', md: 'flex' }}
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            _hover={{
              bg: isDark ? 'gray.600' : 'gray.50',
              transform: 'translateY(-50%) scale(1.1)',
            }}
            transition="all 0.2s"
            onClick={() => scrollBy('left')}
          >
            <Icon as={FiChevronLeft} boxSize={4} color={isDark ? 'gray.200' : 'gray.600'} />
          </Box>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <Box
            position="absolute"
            right={-2}
            top="50%"
            transform="translateY(-50%)"
            zIndex={10}
            w="32px"
            h="32px"
            borderRadius="full"
            bg={isDark ? 'gray.700' : 'white'}
            boxShadow="0 2px 10px rgba(0,0,0,0.2)"
            display={{ base: 'none', md: 'flex' }}
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            _hover={{
              bg: isDark ? 'gray.600' : 'gray.50',
              transform: 'translateY(-50%) scale(1.1)',
            }}
            transition="all 0.2s"
            onClick={() => scrollBy('right')}
          >
            <Icon as={FiChevronRight} boxSize={4} color={isDark ? 'gray.200' : 'gray.600'} />
          </Box>
        )}

        {/* Scrollable Row */}
        <Box
          ref={scrollRef}
          display="flex"
          gap={3}
          overflowX="auto"
          py={2}
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
          {alerts.map((alert, index) => (
            <AlertStoryCard
              key={alert.alertId}
              alert={alert}
              index={index}
              isDark={isDark}
              onClick={() => {
                if (!isDragging) navigate('/alerts');
              }}
              t={t}
            />
          ))}

          {/* View All Card */}
          <ViewAllCard
            isDark={isDark}
            onClick={() => navigate('/alerts')}
            count={alerts.length}
            t={t}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default AlertStoriesCarousel;
