/**
 * MobileHomeDashboard - Premium home page with cards, KPIs, and quick actions
 *
 * Visual design:
 * - Gradient hero header with greeting
 * - Glassmorphism stat cards
 * - Skeleton loading states (not spinners)
 * - Staggered entrance animations
 * - Rich operation cards with depth
 * - Recent activity timeline
 * - Configurable quick actions
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Icon,
  Badge,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiActivity,
  FiClock,
  FiAlertTriangle,
  FiChevronRight,
  FiEdit3,
  FiCheck,
  FiStar,
  FiTrendingUp,
  FiRefreshCw,
  FiEye,
  FiChevronDown,
  FiChevronUp,
  FiLoader,
  FiFilter,
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useMobileHomeData } from '../hooks/useMobileHomeData';
import { useQuickActions } from '../hooks/useQuickActions';
import { useOperationFilters } from '../hooks/useOperationFilters';
import { DashboardFilterBar } from '../components/shared/DashboardFilterBar';
import { getIcon } from '../utils/iconMap';
import { eventLogApi, operationsApi } from '../services/operationsApi';
import { RadialActionMenu } from '../components/mobile/RadialActionMenu';
import { OperationCard } from '../components/shared/OperationCard';
import type { Operation, OperationEventLog } from '../types/operations';

// Product type to workbox route mapping
const productTypeRoutes: Record<string, string> = {
  LC_IMPORT: '/workbox/lc-imports',
  LC_EXPORT: '/workbox/lc-exports',
  GUARANTEE: '/workbox/guarantees',
  COLLECTION: '/workbox/collections',
  STANDBY_LC: '/workbox/standby-lc',
  COLLECTION_IMPORT: '/workbox/collection-imports',
  COLLECTION_EXPORT: '/workbox/collection-exports',
  GUARANTEE_MANDATARIA: '/workbox/guarantee-mandataria',
  TRADE_FINANCING: '/workbox/trade-financing',
  AVAL_DESCUENTO: '/workbox/aval-descuento',
};

const ACCENT_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#EC4899'];

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'mobileHome.greeting.morning';
  if (hour < 18) return 'mobileHome.greeting.afternoon';
  return 'mobileHome.greeting.evening';
}

function getFormattedDate(lang: string): string {
  return new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getDaysUntilExpiry(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getExpiryBadge(days: number | null): { color: string; bg: string } {
  if (days === null) return { color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' };
  if (days <= 0) return { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' };
  if (days < 7) return { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' };
  if (days < 15) return { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
  return { color: '#10B981', bg: 'rgba(16,185,129,0.12)' };
}


function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export const MobileHomeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { darkMode, getColors } = useTheme();
  const colors = getColors();
  const { user } = useAuth();
  const { filters, setFilters, filterOptions, isOperator, activeAdvancedCount, activeSwiftCount } = useOperationFilters();
  const data = useMobileHomeData(filters);
  const quickActions = useQuickActions();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isEditingFavorites, setIsEditingFavorites] = useState(false);
  const [recentEvents, setRecentEvents] = useState<OperationEventLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Expiry detail expansion
  const [expandedExpiryRange, setExpandedExpiryRange] = useState<string | null>(null);
  const [expiryOps, setExpiryOps] = useState<Operation[]>([]);
  const [isLoadingExpiryOps, setIsLoadingExpiryOps] = useState(false);
  const [expiryVisibleCount, setExpiryVisibleCount] = useState(5);
  // Stat card expansion
  const [expandedStat, setExpandedStat] = useState<string | null>(null);
  const [statVisibleCount, setStatVisibleCount] = useState(5);

  const userName = user?.name || user?.username || '';
  const firstName = userName.split(' ')[0];

  // Load recent events from the first few attention ops
  useEffect(() => {
    const loadRecentEvents = async () => {
      const attentionOps = [...data.awaitingResponseOps, ...data.opsWithAlerts];
      if (attentionOps.length === 0) return;
      try {
        const eventPromises = attentionOps.slice(0, 3).map(op =>
          eventLogApi.getRecentEvents(op.operationId, i18n.language).catch(() => [])
        );
        const allEvents = await Promise.all(eventPromises);
        const merged = allEvents.flat()
          .sort((a, b) => new Date(b.executedAt || '').getTime() - new Date(a.executedAt || '').getTime())
          .slice(0, 5);
        setRecentEvents(merged);
      } catch { /* ignore */ }
    };
    if (!data.isLoading) loadRecentEvents();
  }, [data.isLoading, data.awaitingResponseOps, data.opsWithAlerts, i18n.language]);

  // Combine awaiting response + alerts, dedup by operationId
  const attentionOps = (() => {
    const seen = new Set<string>();
    const combined: Operation[] = [];
    for (const op of [...data.awaitingResponseOps, ...data.opsWithAlerts]) {
      if (!seen.has(op.operationId)) {
        seen.add(op.operationId);
        combined.push(op);
      }
    }
    return combined.slice(0, 5);
  })();

  // Handle stat card click - toggle expansion (data already loaded in useMobileHomeData)
  const handleStatCardClick = (statType: string) => {
    setExpandedStat(expandedStat === statType ? null : statType);
    setStatVisibleCount(5);
  };

  // Get operations for the currently expanded stat card
  const getStatOps = (): Operation[] => {
    if (expandedStat === 'active') return data.activeOps;
    if (expandedStat === 'awaiting') return data.awaitingResponseOps;
    if (expandedStat === 'alerts') return data.opsWithAlerts;
    return [];
  };

  // Handle expiry card click - filter active operations by expiry date range
  const handleExpiryCardClick = async (range: string) => {
    if (expandedExpiryRange === range) {
      setExpandedExpiryRange(null);
      setExpiryOps([]);
      return;
    }
    setExpandedExpiryRange(range);
    setExpiryVisibleCount(5);
    setIsLoadingExpiryOps(true);
    try {
      // Backend range format: "3_DAYS", "7_DAYS", "15_DAYS", "30_DAYS"
      const maxDaysMap: Record<string, number> = {
        '3_DAYS': 3,
        '7_DAYS': 7,
        '15_DAYS': 15,
        '30_DAYS': 30,
      };
      const maxDays = maxDaysMap[range] || 30;

      // Use existing getOperations endpoint and filter by expiryDate on frontend
      const allOps = data.activeOps.length > 0
        ? data.activeOps
        : await operationsApi.getOperations({ status: 'ACTIVE' as any });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const limitDate = new Date(today);
      limitDate.setDate(limitDate.getDate() + maxDays);

      const filtered = allOps.filter(op => {
        if (!op.expiryDate) return false;
        const expiry = new Date(op.expiryDate);
        expiry.setHours(0, 0, 0, 0);
        return expiry >= today && expiry <= limitDate;
      });

      // Sort by expiry date ascending (most urgent first)
      filtered.sort((a, b) => {
        const dateA = new Date(a.expiryDate!).getTime();
        const dateB = new Date(b.expiryDate!).getTime();
        return dateA - dateB;
      });

      setExpiryOps(filtered);
    } catch {
      setExpiryOps([]);
    } finally {
      setIsLoadingExpiryOps(false);
    }
  };

  // Operation action handlers - navigate directly with deep-link params
  const handleViewForm = (op: Operation) => {
    const base = productTypeRoutes[op.productType] || '/workbox/lc-imports';
    // Replace /workbox/xxx with /xxx/issuance-wizard for form view
    const wizardPath = base.replace('/workbox/', '/') + '/issuance-wizard';
    navigate(`${wizardPath}?operation=${op.operationId}&mode=view`);
  };

  const handleViewDetails = (op: Operation) => {
    const route = productTypeRoutes[op.productType] || '/workbox/lc-imports';
    navigate(`${route}?operation=${op.operationId}&tab=summary`);
  };

  const handleViewMessages = (op: Operation) => {
    const route = productTypeRoutes[op.productType] || '/workbox/lc-imports';
    navigate(`${route}?operation=${op.operationId}&tab=messages`);
  };

  const handleExecuteEvent = (op: Operation) => {
    const route = productTypeRoutes[op.productType] || '/workbox/lc-imports';
    navigate(`${route}?operation=${op.operationId}&tab=execute`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await data.refresh();
    setIsRefreshing(false);
  };

  // Gradient colors for hero
  const heroGradient = darkMode
    ? 'linear-gradient(135deg, rgba(0,115,230,0.15) 0%, rgba(139,92,246,0.1) 50%, rgba(16,185,129,0.08) 100%)'
    : 'linear-gradient(135deg, rgba(0,115,230,0.08) 0%, rgba(139,92,246,0.06) 50%, rgba(16,185,129,0.04) 100%)';

  const cardBg = darkMode ? 'rgba(45,55,72,0.6)' : 'rgba(255,255,255,0.8)';
  const cardBorder = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <Box minH="100vh" bg={colors.bgColorSecondary}>

      {/* === HERO HEADER with gradient === */}
      <Box
        bg={heroGradient}
        px={5}
        pt={6}
        pb={8}
        position="relative"
        overflow="hidden"
        className="animate-fade-in"
      >
        {/* Decorative circle */}
        <Box
          position="absolute"
          top="-40px"
          right="-30px"
          w="160px"
          h="160px"
          borderRadius="full"
          bg={darkMode ? 'rgba(0,115,230,0.06)' : 'rgba(0,115,230,0.04)'}
        />
        <Box
          position="absolute"
          bottom="-20px"
          left="-20px"
          w="100px"
          h="100px"
          borderRadius="full"
          bg={darkMode ? 'rgba(139,92,246,0.05)' : 'rgba(139,92,246,0.03)'}
        />

        <Flex justify="space-between" align="flex-start" position="relative" zIndex={1}>
          <Box>
            <Text fontSize="2xl" fontWeight="800" color={colors.textColor} letterSpacing="-0.02em">
              {t(getGreetingKey())}, {firstName}
            </Text>
            <Text fontSize="sm" color={colors.textColorSecondary} mt={1} textTransform="capitalize">
              {getFormattedDate(i18n.language)}
            </Text>
          </Box>
          <Box
            as="button"
            w="36px"
            h="36px"
            borderRadius="full"
            bg={cardBg}
            border="1px solid"
            borderColor={cardBorder}
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            transition="all 0.2s"
            _active={{ transform: 'scale(0.9)' }}
            onClick={handleRefresh}
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <Icon
              as={FiRefreshCw}
              boxSize={4}
              color={colors.textColorSecondary}
              style={{
                transition: 'transform 0.5s ease',
                transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
              }}
            />
          </Box>
        </Flex>

        {/* === FILTERS - Compact toggle === */}
        <Box mt={3} position="relative" zIndex={1}>
          <HStack
            as="button"
            gap={1}
            px={3}
            py={1.5}
            borderRadius="lg"
            bg={showMobileFilters
              ? (darkMode ? 'blue.900/40' : 'blue.50')
              : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')
            }
            border="1px solid"
            borderColor={showMobileFilters
              ? (darkMode ? 'blue.500/40' : 'blue.200')
              : 'transparent'
            }
            cursor="pointer"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <FiFilter size={12} />
            <Text fontSize="xs" fontWeight="medium" color={colors.textColor}>
              {t('mobileHome.filters', 'Filtros')}
            </Text>
            {activeAdvancedCount > 0 && (
              <Badge colorPalette="blue" variant="solid" borderRadius="full" fontSize="2xs" px={1.5}>
                {activeAdvancedCount}
              </Badge>
            )}
          </HStack>
          {showMobileFilters && (
            <Box mt={2}>
              <DashboardFilterBar
                filters={filters}
                filterOptions={filterOptions}
                onFilterChange={setFilters}
                isOperator={isOperator}
                compact
                activeAdvancedCount={activeAdvancedCount}
                activeSwiftCount={activeSwiftCount}
              />
            </Box>
          )}
        </Box>

        {/* === QUICK STATS - Glassmorphism cards === */}
        <SimpleGrid columns={3} gap={3} mt={5} position="relative" zIndex={1}>
          {data.isLoading ? (
            <>
              <SkeletonStatCard darkMode={darkMode} />
              <SkeletonStatCard darkMode={darkMode} />
              <SkeletonStatCard darkMode={darkMode} />
            </>
          ) : (
            <>
              <GlassStatCard
                icon={FiTrendingUp}
                value={data.activeOpsCount}
                label={t('mobileHome.stats.activeOps', 'Active Ops')}
                gradientFrom="#3B82F6"
                gradientTo="#06B6D4"
                darkMode={darkMode}
                onClick={() => handleStatCardClick('active')}
                delay={0}
                isExpanded={expandedStat === 'active'}
              />
              <GlassStatCard
                icon={FiClock}
                value={data.awaitingResponseCount}
                label={t('mobileHome.stats.awaitingResponse', 'Pending')}
                gradientFrom="#F59E0B"
                gradientTo="#F97316"
                darkMode={darkMode}
                onClick={() => handleStatCardClick('awaiting')}
                delay={1}
                isExpanded={expandedStat === 'awaiting'}
              />
              <GlassStatCard
                icon={FiAlertTriangle}
                value={data.alertCount}
                label={t('mobileHome.stats.alerts', 'Alerts')}
                gradientFrom="#EF4444"
                gradientTo="#EC4899"
                darkMode={darkMode}
                onClick={() => handleStatCardClick('alerts')}
                delay={2}
                isExpanded={expandedStat === 'alerts'}
              />
            </>
          )}
        </SimpleGrid>

        {/* Expanded stat operations */}
        {expandedStat && (() => {
          const ops = getStatOps();
          return (
            <Box mt={3} px={1} className="animate-fade-in-up">
              {ops.length > 0 ? (
                <VStack gap={2} align="stretch">
                  <Text fontSize="xs" fontWeight="600" color={darkMode ? '#A0AEC0' : '#718096'} px={1}>
                    {ops.length} {t('mobileHome.expiry.operations', 'operations')}
                    {ops.length > statVisibleCount && (
                      <> · {t('mobileHome.expiry.showing', 'showing')} {Math.min(statVisibleCount, ops.length)}</>
                    )}
                  </Text>
                  {ops.slice(0, statVisibleCount).map((op, index) => (
                    <OperationCard
                      key={op.operationId}
                      op={op}
                      darkMode={darkMode}
                      cardBg={cardBg}
                      cardBorder={cardBorder}
                      colors={colors}
                      onViewForm={handleViewForm}
                      onViewDetails={handleViewDetails}
                      onViewMessages={handleViewMessages}
                      onExecuteEvent={handleExecuteEvent}
                      delay={index + 1}
                    />
                  ))}
                  {ops.length > statVisibleCount && (
                    <Flex
                      justify="center"
                      py={2}
                      cursor="pointer"
                      onClick={() => setStatVisibleCount(prev => prev + 10)}
                      _active={{ opacity: 0.7 }}
                    >
                      <HStack gap={1} color={colors.primaryColor}>
                        <Icon as={FiChevronDown} boxSize={4} />
                        <Text fontSize="sm" fontWeight="600">
                          {t('mobileHome.expiry.showMore', 'Show more')} ({ops.length - statVisibleCount} {t('mobileHome.expiry.remaining', 'remaining')})
                        </Text>
                      </HStack>
                    </Flex>
                  )}
                </VStack>
              ) : (
                <Flex py={4} justify="center">
                  <Text fontSize="sm" color={darkMode ? '#A0AEC0' : '#718096'}>
                    {t('mobileHome.expiry.noOperations', 'No operations')}
                  </Text>
                </Flex>
              )}
            </Box>
          );
        })()}
      </Box>

      {/* === MAIN CONTENT === */}
      <VStack gap={0} align="stretch" px={4} mt={-3} position="relative" zIndex={2}>

        {/* C. Need Attention */}
        {(data.isLoading || attentionOps.length > 0) && (
          <Box mb={5} className="animate-fade-in-up stagger-1">
            <SectionHeader
              title={t('mobileHome.sections.needAttention', 'Need Your Attention')}
              count={attentionOps.length}
              colors={colors}
              onViewAll={() => navigate('/operations/awaiting-response')}
              viewAllLabel={t('mobileHome.viewAll', 'View all')}
            />

            {data.isLoading ? (
              <VStack gap={3} align="stretch">
                <SkeletonCard darkMode={darkMode} />
                <SkeletonCard darkMode={darkMode} />
              </VStack>
            ) : (
              <VStack gap={3} align="stretch">
                {attentionOps.map((op, index) => (
                  <OperationCard
                    key={op.operationId}
                    op={op}
                    darkMode={darkMode}
                    cardBg={cardBg}
                    cardBorder={cardBorder}
                    colors={colors}
                    onViewForm={handleViewForm}
                    onViewDetails={handleViewDetails}
                    onViewMessages={handleViewMessages}
                    onExecuteEvent={handleExecuteEvent}
                    delay={index}
                  />
                ))}
              </VStack>
            )}
          </Box>
        )}

        {/* D. Upcoming Expiries (from dashboard summary) */}
        {(data.isLoading || data.upcomingExpiries.length > 0) && (
          <Box mb={5} className="animate-fade-in-up stagger-2">
            <SectionHeader
              title={t('mobileHome.sections.expiringSoon', 'Expiring Soon')}
              colors={colors}
            />

            {data.isLoading ? (
              <VStack gap={3} align="stretch">
                <SkeletonCard darkMode={darkMode} />
              </VStack>
            ) : (
              <VStack gap={3} align="stretch">
                <SimpleGrid columns={2} gap={3}>
                  {data.upcomingExpiries.map((expiry, index) => {
                    const isExpanded = expandedExpiryRange === expiry.range;
                    return (
                      <Box
                        key={expiry.range}
                        bg={isExpanded
                          ? (darkMode ? `${expiry.color}12` : `${expiry.color}08`)
                          : cardBg
                        }
                        borderRadius="16px"
                        p={4}
                        border="2px solid"
                        borderColor={isExpanded ? expiry.color : cardBorder}
                        transition="all 0.2s"
                        cursor="pointer"
                        _hover={{ borderColor: `${expiry.color}80` }}
                        _active={{ transform: 'scale(0.97)' }}
                        onClick={() => handleExpiryCardClick(expiry.range)}
                        className={`animate-fade-in-up stagger-${index + 1}`}
                        style={{
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                        }}
                        boxShadow={isExpanded ? `0 4px 16px ${expiry.color}20` : '0 2px 8px rgba(0,0,0,0.04)'}
                        position="relative"
                        overflow="hidden"
                      >
                        {/* Color accent bar */}
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          right={0}
                          h="3px"
                          bg={expiry.color}
                          borderTopRadius="16px"
                        />
                        <VStack gap={1} align="start">
                          <HStack justify="space-between" w="100%">
                            <Text fontSize="2xl" fontWeight="800" color={colors.textColor} lineHeight="1">
                              {expiry.count}
                            </Text>
                            <HStack gap={1}>
                              <Box
                                px={2}
                                py={0.5}
                                borderRadius="full"
                                bg={`${expiry.color}15`}
                              >
                                <Text fontSize="2xs" fontWeight="700" color={expiry.color}>
                                  {expiry.urgencyLevel}
                                </Text>
                              </Box>
                              <Icon
                                as={isExpanded ? FiChevronUp : FiEye}
                                boxSize={3.5}
                                color={isExpanded ? expiry.color : colors.textColorSecondary}
                              />
                            </HStack>
                          </HStack>
                          <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary}>
                            {expiry.rangeLabel}
                          </Text>
                          {expiry.totalVolume > 0 && (
                            <Text fontSize="2xs" color={colors.textColorSecondary}>
                              ${(expiry.totalVolume / 1000).toFixed(0)}K
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    );
                  })}
                </SimpleGrid>

                {/* Expanded operation list for selected expiry range */}
                {expandedExpiryRange && (
                  <Box className="animate-fade-in-up">
                    {isLoadingExpiryOps ? (
                      <VStack gap={3} align="stretch">
                        <SkeletonCard darkMode={darkMode} />
                        <SkeletonCard darkMode={darkMode} />
                      </VStack>
                    ) : expiryOps.length > 0 ? (
                      <VStack gap={2} align="stretch">
                        <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary} px={1}>
                          {expiryOps.length} {t('mobileHome.expiry.operations', 'operations')}
                          {expiryOps.length > expiryVisibleCount && (
                            <> · {t('mobileHome.expiry.showing', 'showing')} {Math.min(expiryVisibleCount, expiryOps.length)}</>
                          )}
                        </Text>
                        {expiryOps.slice(0, expiryVisibleCount).map((op, index) => (
                          <OperationCard
                            key={op.operationId}
                            op={op}
                            darkMode={darkMode}
                            cardBg={cardBg}
                            cardBorder={cardBorder}
                            colors={colors}
                            onViewForm={handleViewForm}
                            onViewDetails={handleViewDetails}
                            onViewMessages={handleViewMessages}
                            onExecuteEvent={handleExecuteEvent}
                            delay={index + 1}
                          />
                        ))}
                        {expiryOps.length > expiryVisibleCount && (
                          <Flex
                            justify="center"
                            py={2}
                            cursor="pointer"
                            onClick={() => setExpiryVisibleCount(prev => prev + 10)}
                            _active={{ opacity: 0.7 }}
                          >
                            <HStack gap={1} color={colors.primaryColor}>
                              <Icon as={FiChevronDown} boxSize={4} />
                              <Text fontSize="sm" fontWeight="600">
                                {t('mobileHome.expiry.showMore', 'Show more')} ({expiryOps.length - expiryVisibleCount} {t('mobileHome.expiry.remaining', 'remaining')})
                              </Text>
                            </HStack>
                          </Flex>
                        )}
                      </VStack>
                    ) : (
                      <Flex py={4} justify="center">
                        <Text fontSize="sm" color={colors.textColorSecondary}>
                          {t('mobileHome.expiry.noOperations', 'No operations in this range')}
                        </Text>
                      </Flex>
                    )}
                  </Box>
                )}
              </VStack>
            )}
          </Box>
        )}

        {/* E. Recent Activity Timeline */}
        {recentEvents.length > 0 && (
          <Box mb={5} className="animate-fade-in-up stagger-3">
            <SectionHeader
              title={t('mobileHome.sections.recentActivity', 'Recent Activity')}
              colors={colors}
            />
            <Box
              bg={cardBg}
              borderRadius="16px"
              border="1px solid"
              borderColor={cardBorder}
              overflow="hidden"
              style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
              boxShadow="0 2px 8px rgba(0,0,0,0.04)"
            >
              {recentEvents.map((event, index) => (
                <HStack
                  key={event.id}
                  px={4}
                  py={3}
                  borderBottomWidth={index < recentEvents.length - 1 ? '1px' : '0'}
                  borderColor={cardBorder}
                  gap={3}
                >
                  <Box
                    w="32px"
                    h="32px"
                    borderRadius="full"
                    bg={event.color ? `${event.color}15` : (darkMode ? 'whiteAlpha.100' : 'gray.100')}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    {event.icon ? (
                      <Text fontSize="sm">{event.icon}</Text>
                    ) : (
                      <Icon as={FiActivity} boxSize={3.5} color={event.color || colors.primaryColor} />
                    )}
                  </Box>
                  <VStack gap={0} align="start" flex={1}>
                    <Text fontSize="xs" fontWeight="600" color={colors.textColor} lineClamp={1}>
                      {event.eventName || event.eventCode}
                    </Text>
                    <Text fontSize="2xs" color={colors.textColorSecondary}>
                      {event.operationId} · {timeAgo(event.executedAt)}
                    </Text>
                  </VStack>
                  {event.newStage && (
                    <Badge
                      fontSize="2xs"
                      px={1.5}
                      borderRadius="full"
                      bg={darkMode ? 'whiteAlpha.100' : 'gray.100'}
                      color={colors.textColorSecondary}
                    >
                      {event.newStage}
                    </Badge>
                  )}
                </HStack>
              ))}
            </Box>
          </Box>
        )}

        {/* F. Favorite Quick Actions */}
        <Box mb={6} className="animate-fade-in-up stagger-4">

          <HStack justify="space-between" mb={3}>
            <Text fontWeight="700" fontSize="md" color={colors.textColor} letterSpacing="-0.01em">
              {t('mobileHome.sections.favorites', 'Favorites')}
            </Text>
            <HStack
              cursor="pointer"
              onClick={() => setIsEditingFavorites(!isEditingFavorites)}
              color={colors.primaryColor}
              _active={{ opacity: 0.7 }}
              gap={1}
            >
              <Icon as={isEditingFavorites ? FiCheck : FiEdit3} boxSize={3.5} />
              <Text fontSize="xs" fontWeight="600">
                {isEditingFavorites
                  ? t('mobileHome.favorites.done', 'Done')
                  : t('mobileHome.favorites.edit', 'Edit')
                }
              </Text>
            </HStack>
          </HStack>

          {isEditingFavorites ? (
            <VStack gap={3} align="stretch">
              <Text fontSize="xs" color={colors.textColorSecondary}>
                {t('mobileHome.favorites.subtitle', 'Select up to {{max}} favorites', { max: quickActions.maxFavorites })}
                {' '} ({quickActions.favorites.length}/{quickActions.maxFavorites})
              </Text>
              <SimpleGrid columns={2} gap={2}>
                {quickActions.allActions.map((action) => {
                  const isFav = quickActions.isFavorite(action.id);
                  const ActionIcon = getIcon(action.icon);
                  return (
                    <HStack
                      key={action.id}
                      bg={isFav
                        ? (darkMode ? 'rgba(0, 115, 230, 0.15)' : 'rgba(0, 115, 230, 0.06)')
                        : cardBg
                      }
                      borderRadius="12px"
                      p={2.5}
                      border="1px solid"
                      borderColor={isFav ? colors.primaryColor : cardBorder}
                      cursor="pointer"
                      transition="all 0.2s"
                      _active={{ transform: 'scale(0.97)' }}
                      onClick={() => quickActions.toggleFavorite(action.id)}
                      style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                    >
                      <Icon
                        as={isFav ? FiStar : ActionIcon}
                        boxSize={4}
                        color={isFav ? colors.primaryColor : colors.textColorSecondary}
                      />
                      <Text fontSize="xs" color={colors.textColor} flex={1} lineClamp={1}>
                        {t(action.labelKey, action.code)}
                      </Text>
                    </HStack>
                  );
                })}
              </SimpleGrid>
            </VStack>
          ) : quickActions.isLoading ? (
            <SimpleGrid columns={3} gap={3}>
              <SkeletonQuickAction darkMode={darkMode} />
              <SkeletonQuickAction darkMode={darkMode} />
              <SkeletonQuickAction darkMode={darkMode} />
            </SimpleGrid>
          ) : quickActions.favorites.length > 0 ? (
            <SimpleGrid columns={3} gap={3}>
              {quickActions.favorites.map((action, index) => {
                const ActionIcon = getIcon(action.icon);
                const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];
                return (
                  <VStack
                    key={action.id}
                    bg={cardBg}
                    borderRadius="16px"
                    p={3}
                    border="1px solid"
                    borderColor={cardBorder}
                    cursor="pointer"
                    transition="all 0.2s"
                    _active={{ transform: 'scale(0.93)' }}
                    onClick={() => navigate(action.path)}
                    gap={2}
                    className={`animate-scale-in stagger-${index + 1}`}
                    style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                    boxShadow="0 2px 8px rgba(0,0,0,0.04)"
                  >
                    <Box
                      w="44px"
                      h="44px"
                      borderRadius="14px"
                      bg={`${accentColor}12`}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon as={ActionIcon} boxSize={5} color={accentColor} />
                    </Box>
                    <Text
                      fontSize="2xs"
                      fontWeight="600"
                      color={colors.textColor}
                      textAlign="center"
                      lineClamp={2}
                      lineHeight="1.3"
                    >
                      {t(action.labelKey, action.code)}
                    </Text>
                  </VStack>
                );
              })}
            </SimpleGrid>
          ) : (
            <Flex
              bg={cardBg}
              borderRadius="16px"
              border="1px solid"
              borderColor={cardBorder}
              p={6}
              justify="center"
              align="center"
              direction="column"
              gap={2}
              style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            >
              <Icon as={FiStar} boxSize={6} color={colors.textColorSecondary} />
              <Text fontSize="sm" color={colors.textColorSecondary} textAlign="center">
                {t('mobileHome.favorites.empty', 'Tap Edit to add your favorite actions')}
              </Text>
            </Flex>
          )}
        </Box>

        {/* G. Radial Action Menu (Apple Watch style) */}
        <Box mb={6} className="animate-fade-in-up stagger-5">
          <Text fontWeight="700" fontSize="md" color={colors.textColor} letterSpacing="-0.01em" mb={3}>
            {t('mobileHome.sections.quickActions', 'Quick Actions')}
          </Text>
          <RadialActionMenu onNavigate={(path) => navigate(path)} />
        </Box>

        {/* Error state */}
        {data.error && (
          <Box
            bg="rgba(239,68,68,0.08)"
            borderRadius="12px"
            p={3}
            mb={4}
            border="1px solid rgba(239,68,68,0.2)"
          >
            <Text textAlign="center" color="#EF4444" fontSize="sm">
              {data.error}
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

// === SUB-COMPONENTS ===

// Glassmorphism stat card with gradient icon background
interface GlassStatCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  gradientFrom: string;
  gradientTo: string;
  darkMode: boolean;
  onClick: () => void;
  delay: number;
  isExpanded?: boolean;
}

const GlassStatCard: React.FC<GlassStatCardProps> = ({
  icon: IconComponent,
  value,
  label,
  gradientFrom,
  gradientTo,
  darkMode,
  onClick,
  delay,
  isExpanded = false,
}) => (
  <VStack
    bg={isExpanded
      ? (darkMode ? `${gradientFrom}18` : `${gradientFrom}08`)
      : (darkMode ? 'rgba(45,55,72,0.5)' : 'rgba(255,255,255,0.7)')
    }
    borderRadius="16px"
    p={3}
    border="2px solid"
    borderColor={isExpanded ? gradientFrom : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')}
    cursor="pointer"
    transition="all 0.2s"
    _active={{ transform: 'scale(0.93)' }}
    _hover={{ borderColor: `${gradientFrom}60` }}
    onClick={onClick}
    gap={1.5}
    className={`animate-scale-in stagger-${delay + 1}`}
    style={{
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}
    boxShadow={isExpanded ? `0 4px 16px ${gradientFrom}20` : '0 4px 16px rgba(0,0,0,0.06)'}
    position="relative"
    overflow="hidden"
  >
    {/* Subtle gradient accent at top */}
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      h="3px"
      bg={`linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`}
      borderTopRadius="16px"
    />
    <HStack justify="space-between" w="100%">
      <Box
        w="32px"
        h="32px"
        borderRadius="10px"
        bg={`linear-gradient(135deg, ${gradientFrom}20, ${gradientTo}15)`}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Icon as={IconComponent} boxSize={4} color={gradientFrom} />
      </Box>
      <Icon
        as={isExpanded ? FiChevronUp : FiEye}
        boxSize={3.5}
        color={isExpanded ? gradientFrom : (darkMode ? '#A0AEC0' : '#718096')}
      />
    </HStack>
    <Text
      fontSize="2xl"
      fontWeight="800"
      color={darkMode ? '#F7FAFC' : '#1A202C'}
      lineHeight="1"
      letterSpacing="-0.02em"
    >
      {value}
    </Text>
    <Text
      fontSize="2xs"
      color={darkMode ? '#A0AEC0' : '#718096'}
      textAlign="center"
      fontWeight="500"
    >
      {label}
    </Text>
  </VStack>
);

// Section header with optional count and view all
interface SectionHeaderProps {
  title: string;
  count?: number;
  colors: ReturnType<ReturnType<typeof useTheme>['getColors']>;
  onViewAll?: () => void;
  viewAllLabel?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  count,
  colors,
  onViewAll,
  viewAllLabel,
}) => (
  <HStack justify="space-between" mb={3}>
    <HStack gap={2}>
      <Text fontWeight="700" fontSize="md" color={colors.textColor} letterSpacing="-0.01em">
        {title}
      </Text>
      {count !== undefined && count > 0 && (
        <Box
          px={2}
          py={0.5}
          borderRadius="full"
          bg={colors.primaryColor}
          minW="22px"
          textAlign="center"
        >
          <Text fontSize="2xs" fontWeight="700" color="white">
            {count}
          </Text>
        </Box>
      )}
    </HStack>
    {onViewAll && (
      <HStack
        cursor="pointer"
        onClick={onViewAll}
        color={colors.primaryColor}
        _active={{ opacity: 0.7 }}
        gap={0.5}
      >
        <Text fontSize="xs" fontWeight="600">{viewAllLabel}</Text>
        <Icon as={FiChevronRight} boxSize={3.5} />
      </HStack>
    )}
  </HStack>
);

// Skeleton loading components
const SkeletonStatCard: React.FC<{ darkMode: boolean }> = ({ darkMode }) => (
  <VStack
    bg={darkMode ? 'rgba(45,55,72,0.5)' : 'rgba(255,255,255,0.7)'}
    borderRadius="16px"
    p={3}
    gap={2}
    border="1px solid"
    borderColor={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
    style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
  >
    <Box w="32px" h="32px" borderRadius="10px" className="skeleton-shimmer" />
    <Box w="40px" h="28px" borderRadius="6px" className="skeleton-shimmer" />
    <Box w="50px" h="12px" borderRadius="4px" className="skeleton-shimmer" />
  </VStack>
);

const SkeletonCard: React.FC<{ darkMode: boolean }> = ({ darkMode }) => (
  <Box
    bg={darkMode ? 'rgba(45,55,72,0.5)' : 'rgba(255,255,255,0.7)'}
    borderRadius="16px"
    p={4}
    border="1px solid"
    borderColor={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
    style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
  >
    <HStack gap={3}>
      <VStack gap={2} align="start" flex={1}>
        <HStack gap={2}>
          <Box w="120px" h="16px" borderRadius="4px" className="skeleton-shimmer" />
          <Box w="60px" h="16px" borderRadius="full" className="skeleton-shimmer" />
        </HStack>
        <Box w="150px" h="12px" borderRadius="4px" className="skeleton-shimmer" />
        <Box w="100px" h="14px" borderRadius="4px" className="skeleton-shimmer" />
      </VStack>
      <Box w="16px" h="16px" borderRadius="4px" className="skeleton-shimmer" />
    </HStack>
  </Box>
);

const SkeletonQuickAction: React.FC<{ darkMode: boolean }> = ({ darkMode }) => (
  <VStack
    bg={darkMode ? 'rgba(45,55,72,0.5)' : 'rgba(255,255,255,0.7)'}
    borderRadius="16px"
    p={3}
    gap={2}
    border="1px solid"
    borderColor={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
    style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
  >
    <Box w="44px" h="44px" borderRadius="14px" className="skeleton-shimmer" />
    <Box w="50px" h="10px" borderRadius="4px" className="skeleton-shimmer" />
  </VStack>
);

export default MobileHomeDashboard;
