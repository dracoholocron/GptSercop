/**
 * SmartCommandBar - Spotlight/Cmd+K style intelligent search overlay
 *
 * Premium search experience with:
 * - Animated entrance (spring physics)
 * - Live search with text highlighting on matches
 * - Categorized results (by product type)
 * - Shimmer loading states
 * - Rich operation detail with available actions
 * - Recent searches with quick actions
 * - Keyboard shortcut hints (desktop)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Input,
  Icon,
  IconButton,
  SimpleGrid,
  Badge,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiX,
  FiSearch,
  FiChevronRight,
  FiClock,
  FiArrowLeft,
  FiPlay,
  FiCommand,
  FiCornerDownLeft,
  FiArrowUp,
  FiArrowDown,
  FiExternalLink,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { operationsApi, eventConfigApi } from '../../services/operationsApi';
import { useQuickActions } from '../../hooks/useQuickActions';
import { getIcon } from '../../utils/iconMap';
import type { Operation, EventFlowConfig } from '../../types/operations';

const RECENT_SEARCHES_KEY = 'globalcmx-recent-searches';
const MAX_RECENT = 5;

interface SmartCommandBarProps {
  onClose: () => void;
}

// Map product types to workbox routes
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

const productTypeLabels: Record<string, string> = {
  LC_IMPORT: 'LC Import',
  LC_EXPORT: 'LC Export',
  GUARANTEE: 'Guarantee',
  COLLECTION: 'Collection',
  STANDBY_LC: 'Standby LC',
  COLLECTION_IMPORT: 'Coll. Import',
  COLLECTION_EXPORT: 'Coll. Export',
  GUARANTEE_MANDATARIA: 'Gar. Mandataria',
  TRADE_FINANCING: 'Trade Finance',
  AVAL_DESCUENTO: 'Aval/Desc.',
};

const productTypeColors: Record<string, { bg: string; text: string; gradient: string }> = {
  LC_IMPORT: { bg: 'rgba(59,130,246,0.10)', text: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F620, #06B6D415)' },
  LC_EXPORT: { bg: 'rgba(6,182,212,0.10)', text: '#06B6D4', gradient: 'linear-gradient(135deg, #06B6D420, #3B82F615)' },
  GUARANTEE: { bg: 'rgba(139,92,246,0.10)', text: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF620, #EC489915)' },
  COLLECTION: { bg: 'rgba(249,115,22,0.10)', text: '#F97316', gradient: 'linear-gradient(135deg, #F9731620, #F59E0B15)' },
  STANDBY_LC: { bg: 'rgba(20,184,166,0.10)', text: '#14B8A6', gradient: 'linear-gradient(135deg, #14B8A620, #10B98115)' },
};

function getProductColor(type: string) {
  return productTypeColors[type] || { bg: 'rgba(156,163,175,0.10)', text: '#9CA3AF', gradient: 'rgba(156,163,175,0.10)' };
}

function formatAmount(op: Operation): string {
  if (!op.amount) return '';
  const formatted = op.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${op.currency || 'USD'} ${formatted}`;
}

// Highlight matching text
function HighlightText({ text, query, color }: { text: string; query: string; color: string }) {
  if (!query || query.length < 2) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <Text key={i} as="span" fontWeight="800" color={color} bg={`${color}15`} px={0.5} borderRadius="2px">
            {part}
          </Text>
        ) : (
          <Text key={i} as="span">{part}</Text>
        )
      )}
    </>
  );
}

export const SmartCommandBar: React.FC<SmartCommandBarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { darkMode, getColors } = useTheme();
  const colors = getColors();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Operation[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [availableEvents, setAvailableEvents] = useState<EventFlowConfig[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const quickActions = useQuickActions();

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Auto-focus input with delay for animation
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedOperation) {
          setSelectedOperation(null);
          setAvailableEvents([]);
        } else {
          onClose();
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, -1));
      }
      if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < searchResults.length) {
        e.preventDefault();
        handleSelectOperation(searchResults[focusedIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, selectedOperation, focusedIndex, searchResults]);

  // Reset focus when results change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchResults]);

  const saveRecentSearch = useCallback((term: string) => {
    setRecentSearches(prev => {
      const updated = [term, ...prev.filter(s => s !== term)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  // Search uses ONLY /v1/operations?reference=query which does LIKE %query% on the backend.
  // getByOperationId (GET /v1/operations/{id}) is NOT used because it requires exact match
  // and spams 404 errors on every keystroke while the user types incrementally.
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const debounceMs = query.length >= 5 ? 150 : 250;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(true);
      try {
        const results = await operationsApi.searchByReference(query);
        setSearchResults(results.slice(0, 25));
        setTotalResults(results.length);
        if (results.length > 0) saveRecentSearch(query);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, saveRecentSearch]);

  // Group results by product type
  const groupedResults = useMemo(() => {
    const groups: Record<string, Operation[]> = {};
    for (const op of searchResults) {
      const key = op.productType || 'OTHER';
      if (!groups[key]) groups[key] = [];
      groups[key].push(op);
    }
    return groups;
  }, [searchResults]);

  const handleSelectOperation = async (op: Operation) => {
    setSelectedOperation(op);
    setIsLoadingEvents(true);
    try {
      const events = await eventConfigApi.getAvailableEventsForOperation(
        op.operationId, op.stage, undefined, i18n.language
      );
      setAvailableEvents(events.filter(e => e.isActive));
    } catch {
      setAvailableEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleBackToResults = () => {
    setSelectedOperation(null);
    setAvailableEvents([]);
  };

  const handleNavigateToOp = (op: Operation) => {
    onClose();
    navigate(productTypeRoutes[op.productType] || '/workbox/drafts');
  };

  const handleQuickAction = (path: string) => {
    onClose();
    navigate(path);
  };

  const overlayBg = darkMode ? 'rgba(0,0,0,0.60)' : 'rgba(0,0,0,0.40)';
  const cardBg = darkMode ? 'rgba(45,55,72,0.6)' : 'rgba(255,255,255,0.9)';
  const cardBorder = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={2000}
      className="animate-spotlight"
      display="flex"
      alignItems={{ base: 'flex-start', md: 'flex-start' }}
      justifyContent="center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      bg={overlayBg}
      style={{
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
      pt={{ base: 0, md: '8vh' }}
    >
      <Box
        w="100%"
        maxW="680px"
        mx="auto"
        px={4}
        py={3}
        maxH={{ base: '100vh', md: '80vh' }}
        display="flex"
        flexDirection="column"
        bg={darkMode ? 'rgba(26,32,44,0.98)' : 'rgba(255,255,255,0.98)'}
        borderRadius={{ base: 0, md: '20px' }}
        boxShadow={{ base: 'none', md: '0 25px 60px rgba(0,0,0,0.3)' }}
        border={{ base: 'none', md: '1px solid' }}
        borderColor={darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
        style={{
          paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
        }}
      >
        {/* Header - compact on mobile */}
        <Flex justify="space-between" align="center" mb={2}>
          <HStack gap={2} display={{ base: 'none', md: 'flex' }}>
            <KbdHint darkMode={darkMode}><Icon as={FiArrowUp} boxSize={3} /></KbdHint>
            <KbdHint darkMode={darkMode}><Icon as={FiArrowDown} boxSize={3} /></KbdHint>
            <Text fontSize="2xs" color={colors.textColorSecondary}>navigate</Text>
            <KbdHint darkMode={darkMode}><Icon as={FiCornerDownLeft} boxSize={3} /></KbdHint>
            <Text fontSize="2xs" color={colors.textColorSecondary}>select</Text>
            <KbdHint darkMode={darkMode}>esc</KbdHint>
            <Text fontSize="2xs" color={colors.textColorSecondary}>close</Text>
          </HStack>
          <Box flex={1} display={{ base: 'block', md: 'none' }} />
          <IconButton
            aria-label="Close"
            variant="ghost"
            size="sm"
            onClick={onClose}
            color={colors.textColorSecondary}
            borderRadius="full"
            _hover={{ bg: darkMode ? 'whiteAlpha.100' : 'blackAlpha.50' }}
          >
            <FiX size={20} />
          </IconButton>
        </Flex>

        {/* Search Input - Spotlight style */}
        <Box
          bg={cardBg}
          borderRadius="16px"
          px={4}
          py={1}
          mb={3}
          border="1px solid"
          borderColor={query ? colors.primaryColor : cardBorder}
          boxShadow={query
            ? `0 0 0 3px ${colors.primaryColor}15, 0 8px 32px rgba(0,0,0,0.12)`
            : '0 4px 24px rgba(0,0,0,0.08)'
          }
          transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
          style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          <HStack gap={3}>
            <Icon
              as={FiSearch}
              boxSize={5}
              color={query ? colors.primaryColor : colors.textColorSecondary}
              transition="color 0.2s"
            />
            <Input
              ref={inputRef}
              placeholder={t('mobileHome.search.placeholder', 'Search by ID, reference or applicant name...')}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selectedOperation) {
                  setSelectedOperation(null);
                  setAvailableEvents([]);
                }
              }}
              variant="unstyled"
              fontSize="lg"
              fontWeight="500"
              color={colors.textColor}
              _placeholder={{ color: colors.textColorSecondary, fontWeight: '400' }}
              py={3}
            />
            {query && (
              <IconButton
                aria-label="Clear"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setSelectedOperation(null);
                  setSearchResults([]);
                  setHasSearched(false);
                  inputRef.current?.focus();
                }}
                color={colors.textColorSecondary}
                borderRadius="full"
              >
                <FiX size={16} />
              </IconButton>
            )}
          </HStack>
        </Box>

        {/* Scrollable results area */}
        <Box
          flex={1}
          overflowY="auto"
          pb={4}
          style={{
            paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
          }}
        >
        {/* === SEARCHING: Shimmer loading === */}
        {isSearching && (
          <VStack gap={3} align="stretch" className="animate-fade-in">
            <ShimmerResultCard darkMode={darkMode} />
            <ShimmerResultCard darkMode={darkMode} />
            <ShimmerResultCard darkMode={darkMode} />
          </VStack>
        )}

        {/* === SELECTED OPERATION: Detail + Actions === */}
        {selectedOperation && !isSearching && (
          <VStack gap={4} align="stretch" className="animate-fade-in-up">
            {/* Back button */}
            <HStack
              cursor="pointer"
              onClick={handleBackToResults}
              color={colors.primaryColor}
              _active={{ opacity: 0.7 }}
              gap={1}
            >
              <FiArrowLeft size={16} />
              <Text fontSize="sm" fontWeight="600">
                {t('mobileHome.search.backToResults', 'Back to results')}
              </Text>
            </HStack>

            {/* Operation detail card - premium design */}
            <Box
              bg={cardBg}
              borderRadius="20px"
              overflow="hidden"
              border="1px solid"
              borderColor={cardBorder}
              boxShadow="0 8px 32px rgba(0,0,0,0.08)"
              style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            >
              {/* Product type header strip */}
              <Box
                h="4px"
                bg={getProductColor(selectedOperation.productType).gradient}
              />
              <Box p={5}>
                <Flex justify="space-between" align="start" mb={4}>
                  <VStack align="start" gap={1}>
                    <Text fontWeight="800" color={colors.textColor} fontSize="xl" letterSpacing="-0.02em">
                      {selectedOperation.operationId}
                    </Text>
                    <Box
                      px={2.5}
                      py={0.5}
                      borderRadius="full"
                      bg={getProductColor(selectedOperation.productType).bg}
                    >
                      <Text fontSize="xs" fontWeight="700" color={getProductColor(selectedOperation.productType).text}>
                        {productTypeLabels[selectedOperation.productType] || selectedOperation.productType}
                      </Text>
                    </Box>
                  </VStack>
                  {selectedOperation.amount && (
                    <VStack align="end" gap={0}>
                      <Text fontSize="xl" fontWeight="800" color={colors.primaryColor} letterSpacing="-0.02em">
                        {formatAmount(selectedOperation)}
                      </Text>
                    </VStack>
                  )}
                </Flex>

                <SimpleGrid columns={2} gap={4} mb={4}>
                  <DetailField label="Stage" value={selectedOperation.stage} darkMode={darkMode} colors={colors} />
                  <DetailField label="Status" value={selectedOperation.status} darkMode={darkMode} colors={colors} />
                  {selectedOperation.applicantName && (
                    <DetailField label="Applicant" value={selectedOperation.applicantName} darkMode={darkMode} colors={colors} />
                  )}
                  {selectedOperation.beneficiaryName && (
                    <DetailField label="Beneficiary" value={selectedOperation.beneficiaryName} darkMode={darkMode} colors={colors} />
                  )}
                </SimpleGrid>

                {/* Go to workbox */}
                <HStack
                  pt={3}
                  borderTopWidth="1px"
                  borderColor={cardBorder}
                  cursor="pointer"
                  onClick={() => handleNavigateToOp(selectedOperation)}
                  color={colors.primaryColor}
                  _active={{ opacity: 0.7 }}
                  justify="center"
                  gap={2}
                  transition="all 0.2s"
                >
                  <Icon as={FiExternalLink} boxSize={4} />
                  <Text fontSize="sm" fontWeight="700">
                    {t('mobileHome.search.viewInWorkbox', 'Open in Workbox')}
                  </Text>
                </HStack>
              </Box>
            </Box>

            {/* Available Actions */}
            <HStack gap={2} mt={1}>
              <Text fontWeight="700" color={colors.textColor} fontSize="md" letterSpacing="-0.01em">
                {t('mobileHome.search.availableActions', 'Available Actions')}
              </Text>
              {!isLoadingEvents && availableEvents.length > 0 && (
                <Box px={2} py={0.5} borderRadius="full" bg={colors.primaryColor} minW="20px" textAlign="center">
                  <Text fontSize="2xs" fontWeight="700" color="white">
                    {availableEvents.length}
                  </Text>
                </Box>
              )}
            </HStack>

            {isLoadingEvents ? (
              <VStack gap={2} align="stretch">
                <ShimmerActionCard darkMode={darkMode} />
                <ShimmerActionCard darkMode={darkMode} />
              </VStack>
            ) : availableEvents.length > 0 ? (
              <VStack gap={2} align="stretch">
                {availableEvents.map((event) => (
                  <HStack
                    key={event.id}
                    bg={cardBg}
                    borderRadius="14px"
                    p={4}
                    border="1px solid"
                    borderColor={cardBorder}
                    cursor="pointer"
                    transition="all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                    _hover={{ borderColor: colors.primaryColor, boxShadow: `0 0 0 1px ${colors.primaryColor}30` }}
                    _active={{ transform: 'scale(0.98)' }}
                    onClick={() => handleNavigateToOp(selectedOperation)}
                    boxShadow="0 2px 8px rgba(0,0,0,0.04)"
                    style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                    className="animate-fade-in-up"
                  >
                    <Box
                      w="42px"
                      h="42px"
                      borderRadius="12px"
                      bg={event.toEventColor ? `${event.toEventColor}15` : (darkMode ? 'whiteAlpha.100' : 'blue.50')}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Icon as={getIcon(event.toEventIcon || 'FiPlay')} boxSize={5} color={event.toEventColor || colors.primaryColor} />
                    </Box>
                    <VStack gap={0} align="start" flex={1}>
                      <Text fontWeight="700" fontSize="sm" color={colors.textColor}>
                        {event.toEventName || event.toEventCode}
                      </Text>
                      {event.toEventDescription && (
                        <Text fontSize="xs" color={colors.textColorSecondary} lineClamp={1}>
                          {event.toEventDescription}
                        </Text>
                      )}
                      {event.transitionLabel && (
                        <Text fontSize="2xs" color={colors.primaryColor} fontWeight="600" mt={0.5}>
                          {event.transitionLabel}
                        </Text>
                      )}
                    </VStack>
                    <Icon as={FiChevronRight} color={colors.textColorSecondary} boxSize={4} />
                  </HStack>
                ))}
              </VStack>
            ) : (
              <Flex
                bg={cardBg}
                borderRadius="14px"
                border="1px solid"
                borderColor={cardBorder}
                p={6}
                justify="center"
                align="center"
                direction="column"
                gap={2}
                style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
              >
                <Icon as={FiPlay} boxSize={5} color={colors.textColorSecondary} />
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  {t('mobileHome.noData', 'No actions available for this operation')}
                </Text>
              </Flex>
            )}
          </VStack>
        )}

        {/* === SEARCH RESULTS - Grouped by product type === */}
        {!selectedOperation && !isSearching && searchResults.length > 0 && (
          <VStack gap={4} align="stretch" className="animate-fade-in">
            <Text fontSize="xs" color={colors.textColorSecondary} fontWeight="500">
              {totalResults > 25
                ? `Mostrando 25 de ${totalResults} — escribe más para filtrar`
                : `${totalResults} ${totalResults === 1 ? 'resultado' : 'resultados'}`}
            </Text>

            {Object.entries(groupedResults).map(([productType, ops]) => (
              <Box key={productType}>
                {/* Category header */}
                <HStack gap={2} mb={2}>
                  <Box w="3px" h="14px" borderRadius="full" bg={getProductColor(productType).text} />
                  <Text fontSize="xs" fontWeight="700" color={getProductColor(productType).text} textTransform="uppercase" letterSpacing="0.05em">
                    {productTypeLabels[productType] || productType}
                  </Text>
                  <Text fontSize="2xs" color={colors.textColorSecondary}>({ops.length})</Text>
                </HStack>

                <VStack gap={2} align="stretch">
                  {ops.map((op, index) => {
                    const globalIndex = searchResults.indexOf(op);
                    const isFocused = globalIndex === focusedIndex;
                    return (
                      <HStack
                        key={op.operationId}
                        bg={isFocused ? (darkMode ? 'rgba(0,115,230,0.1)' : 'rgba(0,115,230,0.04)') : cardBg}
                        borderRadius="14px"
                        p={4}
                        border="1px solid"
                        borderColor={isFocused ? colors.primaryColor : cardBorder}
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ bg: darkMode ? 'whiteAlpha.100' : 'gray.50', borderColor: `${colors.primaryColor}50` }}
                        _active={{ transform: 'scale(0.98)' }}
                        onClick={() => handleSelectOperation(op)}
                        boxShadow={isFocused ? `0 0 0 2px ${colors.primaryColor}20` : '0 2px 8px rgba(0,0,0,0.04)'}
                        style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                        className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
                      >
                        {/* Product color dot */}
                        <Box
                          w="40px"
                          h="40px"
                          borderRadius="12px"
                          bg={getProductColor(op.productType).bg}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <Text fontSize="sm" fontWeight="800" color={getProductColor(op.productType).text}>
                            {(productTypeLabels[op.productType] || op.productType).charAt(0)}
                          </Text>
                        </Box>

                        <VStack gap={1} align="start" flex={1} minW={0}>
                          <HStack gap={2}>
                            <Text fontWeight="700" fontSize="sm" color={colors.textColor} lineClamp={1}>
                              <HighlightText text={op.operationId} query={query} color={colors.primaryColor} />
                            </Text>
                            <Box px={1.5} py={0.5} borderRadius="md" bg={darkMode ? 'whiteAlpha.100' : 'gray.100'} flexShrink={0}>
                              <Text fontSize="2xs" fontWeight="600" color={colors.textColorSecondary}>
                                {op.stage}
                              </Text>
                            </Box>
                          </HStack>
                          {op.reference && (
                            <Text fontSize="xs" color={colors.primaryColor} fontWeight="600" lineClamp={1}>
                              Ref: <HighlightText text={op.reference} query={query} color={colors.primaryColor} />
                            </Text>
                          )}
                          {op.applicantName && (
                            <Text fontSize="xs" color={colors.textColorSecondary} lineClamp={1}>
                              <HighlightText text={op.applicantName} query={query} color={colors.primaryColor} />
                            </Text>
                          )}
                          {op.amount && (
                            <Text fontSize="sm" fontWeight="700" color={colors.textColor}>
                              {formatAmount(op)}
                            </Text>
                          )}
                        </VStack>

                        <VStack gap={1} align="end">
                          {op.awaitingResponse && (
                            <Box px={2} py={0.5} borderRadius="full" bg="rgba(245,158,11,0.12)">
                              <Text fontSize="2xs" fontWeight="700" color="#F59E0B">Pending</Text>
                            </Box>
                          )}
                          {op.hasAlerts && (
                            <Box px={2} py={0.5} borderRadius="full" bg="rgba(239,68,68,0.12)">
                              <Text fontSize="2xs" fontWeight="700" color="#EF4444">Alert</Text>
                            </Box>
                          )}
                          <Icon as={FiChevronRight} color={colors.textColorSecondary} boxSize={4} />
                        </VStack>
                      </HStack>
                    );
                  })}
                </VStack>
              </Box>
            ))}
          </VStack>
        )}

        {/* No results */}
        {!selectedOperation && !isSearching && hasSearched && searchResults.length === 0 && (
          <VStack py={10} gap={3} className="animate-fade-in">
            <Box
              w="60px"
              h="60px"
              borderRadius="full"
              bg={darkMode ? 'whiteAlpha.50' : 'gray.100'}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={FiSearch} boxSize={6} color={colors.textColorSecondary} />
            </Box>
            <Text textAlign="center" color={colors.textColor} fontSize="md" fontWeight="600">
              {t('mobileHome.search.noResults', 'No operations found')}
            </Text>
            <Text textAlign="center" color={colors.textColorSecondary} fontSize="sm" maxW="300px">
              {t('mobileHome.search.noResultsHint', 'Try searching by operation ID, reference number, or applicant name')}
            </Text>
          </VStack>
        )}

        {/* === EMPTY STATE: Recent + Quick Actions === */}
        {!selectedOperation && !isSearching && !hasSearched && (
          <VStack gap={6} align="stretch" className="animate-fade-in">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <Box>
                <HStack justify="space-between" mb={3}>
                  <HStack gap={2}>
                    <Icon as={FiClock} boxSize={3.5} color={colors.textColorSecondary} />
                    <Text fontWeight="600" fontSize="sm" color={colors.textColor}>
                      {t('mobileHome.search.recentSearches', 'Recent Searches')}
                    </Text>
                  </HStack>
                  <Text
                    fontSize="xs"
                    color={colors.primaryColor}
                    cursor="pointer"
                    fontWeight="600"
                    onClick={clearRecentSearches}
                    _active={{ opacity: 0.7 }}
                  >
                    {t('mobileHome.search.clearRecent', 'Clear')}
                  </Text>
                </HStack>
                <Flex gap={2} flexWrap="wrap">
                  {recentSearches.map((term) => (
                    <HStack
                      key={term}
                      bg={cardBg}
                      px={3}
                      py={2}
                      borderRadius="full"
                      border="1px solid"
                      borderColor={cardBorder}
                      cursor="pointer"
                      transition="all 0.2s"
                      _active={{ transform: 'scale(0.95)' }}
                      _hover={{ borderColor: `${colors.primaryColor}50` }}
                      onClick={() => setQuery(term)}
                      style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                    >
                      <Icon as={FiSearch} boxSize={3} color={colors.textColorSecondary} />
                      <Text fontSize="sm" color={colors.textColor} fontWeight="500">{term}</Text>
                    </HStack>
                  ))}
                </Flex>
              </Box>
            )}

            {/* Quick Actions */}
            {quickActions.favorites.length > 0 && (
              <Box>
                <Text fontWeight="600" fontSize="sm" color={colors.textColor} mb={3}>
                  {t('mobileHome.search.quickActions', 'Quick Actions')}
                </Text>
                <SimpleGrid columns={2} gap={2}>
                  {quickActions.favorites.map((action, index) => {
                    const ActionIcon = getIcon(action.icon);
                    const accentColors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#EC4899'];
                    const accent = accentColors[index % accentColors.length];
                    return (
                      <HStack
                        key={action.id}
                        bg={cardBg}
                        borderRadius="14px"
                        p={3}
                        border="1px solid"
                        borderColor={cardBorder}
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ borderColor: `${accent}50` }}
                        _active={{ transform: 'scale(0.95)' }}
                        onClick={() => handleQuickAction(action.path)}
                        style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                        className={`animate-scale-in stagger-${index + 1}`}
                        gap={3}
                      >
                        <Box
                          w="36px"
                          h="36px"
                          borderRadius="10px"
                          bg={`${accent}12`}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <Icon as={ActionIcon} boxSize={4} color={accent} />
                        </Box>
                        <Text fontSize="sm" fontWeight="600" color={colors.textColor} lineClamp={1}>
                          {t(action.labelKey, action.code)}
                        </Text>
                      </HStack>
                    );
                  })}
                </SimpleGrid>
              </Box>
            )}

            {/* Keyboard shortcut hint (desktop) */}
            <Flex justify="center" display={{ base: 'none', md: 'flex' }} mt={4}>
              <HStack gap={2} color={colors.textColorSecondary}>
                <KbdHint darkMode={darkMode}><Icon as={FiCommand} boxSize={3} /></KbdHint>
                <KbdHint darkMode={darkMode}>K</KbdHint>
                <Text fontSize="xs">to open search anytime</Text>
              </HStack>
            </Flex>
          </VStack>
        )}
        </Box>{/* end scrollable results area */}
      </Box>
    </Box>
  );
};

// === Sub-components ===

// Detail field in operation card
const DetailField: React.FC<{
  label: string;
  value: string;
  darkMode: boolean;
  colors: ReturnType<ReturnType<typeof useTheme>['getColors']>;
}> = ({ label, value, darkMode, colors }) => (
  <Box>
    <Text fontSize="2xs" fontWeight="600" color={colors.textColorSecondary} textTransform="uppercase" letterSpacing="0.05em">
      {label}
    </Text>
    <Text fontSize="sm" fontWeight="600" color={colors.textColor} mt={0.5}>
      {value}
    </Text>
  </Box>
);

// Keyboard hint badge
const KbdHint: React.FC<{ darkMode: boolean; children: React.ReactNode }> = ({ darkMode, children }) => (
  <Box
    px={1.5}
    py={0.5}
    borderRadius="md"
    bg={darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
    border="1px solid"
    borderColor={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
    fontSize="2xs"
    fontWeight="600"
    color={darkMode ? '#A0AEC0' : '#718096'}
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    minW="22px"
    fontFamily="mono"
  >
    {children}
  </Box>
);

// Shimmer loading cards
const ShimmerResultCard: React.FC<{ darkMode: boolean }> = ({ darkMode }) => (
  <Box
    bg={darkMode ? 'rgba(45,55,72,0.5)' : 'rgba(255,255,255,0.8)'}
    borderRadius="14px"
    p={4}
    border="1px solid"
    borderColor={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
    style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
  >
    <HStack gap={3}>
      <Box w="40px" h="40px" borderRadius="12px" className="skeleton-shimmer" flexShrink={0} />
      <VStack gap={2} align="start" flex={1}>
        <HStack gap={2}>
          <Box w="120px" h="14px" borderRadius="4px" className="skeleton-shimmer" />
          <Box w="50px" h="14px" borderRadius="full" className="skeleton-shimmer" />
        </HStack>
        <Box w="160px" h="12px" borderRadius="4px" className="skeleton-shimmer" />
        <Box w="100px" h="14px" borderRadius="4px" className="skeleton-shimmer" />
      </VStack>
    </HStack>
  </Box>
);

const ShimmerActionCard: React.FC<{ darkMode: boolean }> = ({ darkMode }) => (
  <Box
    bg={darkMode ? 'rgba(45,55,72,0.5)' : 'rgba(255,255,255,0.8)'}
    borderRadius="14px"
    p={4}
    border="1px solid"
    borderColor={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
    style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
  >
    <HStack gap={3}>
      <Box w="42px" h="42px" borderRadius="12px" className="skeleton-shimmer" flexShrink={0} />
      <VStack gap={2} align="start" flex={1}>
        <Box w="140px" h="14px" borderRadius="4px" className="skeleton-shimmer" />
        <Box w="200px" h="12px" borderRadius="4px" className="skeleton-shimmer" />
      </VStack>
    </HStack>
  </Box>
);

export default SmartCommandBar;
