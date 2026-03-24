/**
 * RadialActionMenu - Product journey timeline for quick actions
 *
 * ALL configuration comes from the database:
 * - Products: productTypeConfigService.getAllConfigs()
 * - Routes: productTypeConfigService.getRoutingMap()
 * - Events: eventConfigApi.getEventTypes() (full lifecycle)
 * - Labels: i18n productTypes.{code}
 * - Colors: derived from category (DB field)
 *
 * Visual: Product tabs + horizontal journey timeline grouped by eventCategory
 * (ISSUANCE → ADVICE → AMENDMENT → DOCUMENTS → PAYMENT → CLAIM → CLOSURE)
 * with search panel for non-creation events.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Input,
  Icon,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiX,
  FiSearch,
  FiChevronRight,
  FiFileText,
  FiShield,
  FiDollarSign,
  FiBriefcase,
  FiLayers,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { operationsApi } from '../../services/operationsApi';
import { productTypeConfigService, type ProductTypeConfig, type ProductTypeRoutingMap } from '../../services/productTypeConfigService';
import { getIcon } from '../../utils/iconMap';
import { useProductJourney, type JourneyNode } from '../../hooks/useProductJourney';
import { JourneyMapIllustrated, CircuitBoardBg, type JourneyVariant, getJourneyTheme } from './JourneyMapIllustrated';
import { OperationCard } from '../shared/OperationCard';
import type { Operation } from '../../types/operations';

const VARIANT_STORAGE_KEY = 'globalcmx-journey-variant';

// Derive color from DB category field
function getCategoryStyle(category: string): { bg: string; text: string } {
  switch (category) {
    case 'LETTERS_OF_CREDIT':
      return { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6' };
    case 'GUARANTEES':
      return { bg: 'rgba(139,92,246,0.12)', text: '#8B5CF6' };
    case 'COLLECTIONS':
      return { bg: 'rgba(249,115,22,0.12)', text: '#F97316' };
    case 'TRADE_FINANCE':
      return { bg: 'rgba(20,184,166,0.12)', text: '#14B8A6' };
    default:
      return { bg: 'rgba(156,163,175,0.12)', text: '#9CA3AF' };
  }
}

function getCategoryIcon(category: string): React.ElementType {
  switch (category) {
    case 'LETTERS_OF_CREDIT': return FiFileText;
    case 'GUARANTEES': return FiShield;
    case 'COLLECTIONS': return FiDollarSign;
    case 'TRADE_FINANCE': return FiBriefcase;
    default: return FiLayers;
  }
}

interface RadialActionMenuProps {
  onNavigate?: (path: string) => void;
}

export const RadialActionMenu: React.FC<RadialActionMenuProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { darkMode, getColors } = useTheme();
  const colors = getColors();

  // Journey variant (Pro / Blueprint)
  const [journeyVariant, setJourneyVariant] = useState<JourneyVariant>(() => {
    try {
      const saved = localStorage.getItem(VARIANT_STORAGE_KEY);
      if (saved === 'pro' || saved === 'blueprint') return saved;
    } catch { /* ignore */ }
    return 'pro';
  });

  const toggleVariant = useCallback(() => {
    setJourneyVariant(prev => {
      const next = prev === 'pro' ? 'blueprint' : 'pro';
      try { localStorage.setItem(VARIANT_STORAGE_KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Products from DB
  const [products, setProducts] = useState<ProductTypeConfig[]>([]);
  const [routingMap, setRoutingMap] = useState<ProductTypeRoutingMap>({});
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<string>('');

  // Search panel state
  const [selectedEvent, setSelectedEvent] = useState<JourneyNode | null>(null);
  const [operationQuery, setOperationQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Operation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const cardBg = darkMode ? 'rgba(45,55,72,0.6)' : 'rgba(255,255,255,0.8)';
  const cardBorder = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const currentProduct = products.find(p => p.productType === selectedProduct);
  const productStyle = getCategoryStyle(currentProduct?.category || '');

  // Load journey events grouped by stage
  const { stages, isLoading: isLoadingEvents } = useProductJourney(selectedProduct, i18n.language);

  // Load products from DB
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoadingProducts(true);
      try {
        const [configs, routing] = await Promise.all([
          productTypeConfigService.getAllConfigs(),
          productTypeConfigService.getRoutingMap(),
        ]);
        if (cancelled) return;
        const sorted = configs
          .filter(c => c.active)
          .sort((a, b) => a.displayOrder - b.displayOrder);
        setProducts(sorted);
        setRoutingMap(routing);
        if (sorted.length > 0) setSelectedProduct(sorted[0].productType);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Search debounce
  useEffect(() => {
    if (operationQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await operationsApi.searchByReference(operationQuery);
        setSearchResults(results.slice(0, 10));
      } catch { setSearchResults([]); }
      finally { setIsSearching(false); }
    }, 200);
    return () => clearTimeout(timer);
  }, [operationQuery]);

  const searchPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedEvent) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 250);
    }
  }, [selectedEvent]);

  const handleProductChange = useCallback((pt: string) => {
    setSelectedProduct(pt);
    setSelectedEvent(null);
    setOperationQuery('');
    setSearchResults([]);
  }, []);

  const handleEventTap = useCallback((node: JourneyNode) => {
    // Creation events are now handled by handleCreationClick (wizard/expert)
    // If somehow a creation event reaches here, default to wizard
    if (node.isInitialEvent || node.fromStage === 'DRAFT') {
      const routing = routingMap[selectedProduct];
      const route = routing?.wizardUrl
        ? routing.wizardUrl
        : routing?.baseUrl
          ? `${routing.baseUrl}/issuance-wizard`
          : '/workbox/drafts';
      if (onNavigate) onNavigate(route);
      else navigate(route);
      return;
    }
    // Otherwise, show search panel to find an existing operation
    setSelectedEvent(node);
    setOperationQuery('');
    setSearchResults([]);
  }, [selectedProduct, routingMap, navigate, onNavigate]);

  const handleCreationClick = useCallback((node: JourneyNode, mode: 'wizard' | 'expert') => {
    const routing = routingMap[selectedProduct];
    if (mode === 'wizard') {
      const route = routing?.wizardUrl
        ? routing.wizardUrl
        : routing?.baseUrl
          ? `${routing.baseUrl}/issuance-wizard`
          : '/workbox/drafts';
      if (onNavigate) onNavigate(route);
      else navigate(route);
    } else {
      // Expert mode
      const route = routing?.baseUrl
        ? `${routing.baseUrl}/issuance-expert`
        : '/workbox/drafts';
      if (onNavigate) onNavigate(route);
      else navigate(route);
    }
  }, [selectedProduct, routingMap, navigate, onNavigate]);

  const handleCloseSearch = useCallback(() => {
    setSelectedEvent(null);
    setOperationQuery('');
    setSearchResults([]);
  }, []);

  // Operation action handlers - navigate directly to the right view
  const handleViewForm = useCallback((op: Operation) => {
    const routing = routingMap[selectedProduct] || routingMap[op.productType];
    const route = routing?.wizardUrl
      ? `${routing.wizardUrl}?operation=${op.operationId}&mode=view`
      : `/lc-imports/issuance-wizard?operation=${op.operationId}&mode=view`;
    navigate(route);
  }, [selectedProduct, routingMap, navigate]);

  const handleViewDetails = useCallback((op: Operation) => {
    const routing = routingMap[selectedProduct] || routingMap[op.productType];
    const route = routing?.baseUrl
      ? `/workbox${routing.baseUrl}?operation=${op.operationId}&tab=summary`
      : `/workbox/lc-imports?operation=${op.operationId}&tab=summary`;
    navigate(route);
  }, [selectedProduct, routingMap, navigate]);

  const handleViewMessages = useCallback((op: Operation) => {
    const routing = routingMap[selectedProduct] || routingMap[op.productType];
    const route = routing?.baseUrl
      ? `/workbox${routing.baseUrl}?operation=${op.operationId}&tab=messages`
      : `/workbox/lc-imports?operation=${op.operationId}&tab=messages`;
    navigate(route);
  }, [selectedProduct, routingMap, navigate]);

  const handleExecuteEvent = useCallback((op: Operation) => {
    const routing = routingMap[selectedProduct] || routingMap[op.productType];
    const route = routing?.baseUrl
      ? `/workbox${routing.baseUrl}?operation=${op.operationId}&tab=execute`
      : `/workbox/lc-imports?operation=${op.operationId}&tab=execute`;
    navigate(route);
  }, [selectedProduct, routingMap, navigate]);


  const getProductLabel = (pt: string): string => {
    // Try operations.productTypes.{code} first (main translations)
    const key1 = `operations.productTypes.${pt}`;
    const val1 = t(key1);
    if (val1 !== key1) return val1;
    // Fallback to DB description
    const config = products.find(p => p.productType === pt);
    return config?.description || pt;
  };

  const getShortLabel = (pt: string): string =>
    getProductLabel(pt).replace(/\s*\([^)]*\)\s*$/, '');

  // === LOADING STATE ===
  if (isLoadingProducts) {
    return (
      <Box>
        <HStack gap={2} pb={3} mb={4} px={1}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} w="80px" h="32px" borderRadius="full" className="skeleton-shimmer" flexShrink={0} />
          ))}
        </HStack>
        <HStack gap={3} overflowX="auto" className="hide-scrollbar" px={1}>
          {Array.from({ length: 3 }).map((_, i) => (
            <VStack key={i} gap={2} align="stretch" minW="140px" flexShrink={0}>
              <Box h="28px" borderRadius="10px" className="skeleton-shimmer" />
              <Box h="44px" borderRadius="10px" className="skeleton-shimmer" />
              <Box h="44px" borderRadius="10px" className="skeleton-shimmer" />
            </VStack>
          ))}
        </HStack>
      </Box>
    );
  }

  if (products.length === 0) return null;

  // Compute theme for unified container styling
  const jTheme = getJourneyTheme(journeyVariant, darkMode);

  return (
    <Box
      borderRadius="20px"
      background={jTheme.containerBg}
      position="relative"
      overflow="hidden"
      border="1.5px solid"
      borderColor={jTheme.circleBorder}
      boxShadow={darkMode
        ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)'
        : '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
      }
    >
      {/* === Circuit board background === */}
      <CircuitBoardBg theme={jTheme} />

      {/* === HEADER: Variant toggle + Product tabs === */}
      <Box px={4} pt={4} pb={2} position="relative" zIndex={2}>
        {/* Top row: title + toggle */}
        <Flex align="center" justify="space-between" mb={3}>
          <Text
            fontSize="10px"
            fontWeight="800"
            color={jTheme.textSecondary}
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            Productos
          </Text>

          {/* Variant segmented toggle */}
          <HStack
            gap={0}
            borderRadius="full"
            bg={jTheme.chipBg}
            border="1px solid"
            borderColor={jTheme.chipBorder}
            p="2px"
          >
            <Flex
              as="button"
              align="center"
              gap={1}
              px={2.5}
              py={1}
              borderRadius="full"
              bg={journeyVariant === 'pro' ? jTheme.accent : 'transparent'}
              cursor="pointer"
              transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
              _active={{ transform: 'scale(0.95)' }}
              onClick={() => { if (journeyVariant !== 'pro') toggleVariant(); }}
            >
              <Text fontSize="10px" lineHeight="1" userSelect="none">🎯</Text>
              <Text
                fontSize="9px"
                fontWeight="700"
                color={journeyVariant === 'pro' ? (darkMode ? '#0A1628' : '#FFFFFF') : jTheme.textMuted}
                letterSpacing="0.03em"
              >
                Pro
              </Text>
            </Flex>
            <Flex
              as="button"
              align="center"
              gap={1}
              px={2.5}
              py={1}
              borderRadius="full"
              bg={journeyVariant === 'blueprint' ? jTheme.accent : 'transparent'}
              cursor="pointer"
              transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
              _active={{ transform: 'scale(0.95)' }}
              onClick={() => { if (journeyVariant !== 'blueprint') toggleVariant(); }}
            >
              <Text fontSize="10px" lineHeight="1" userSelect="none">📐</Text>
              <Text
                fontSize="9px"
                fontWeight="700"
                color={journeyVariant === 'blueprint' ? (darkMode ? '#0A1628' : '#FFFFFF') : jTheme.textMuted}
                letterSpacing="0.03em"
              >
                Blueprint
              </Text>
            </Flex>
          </HStack>
        </Flex>

        {/* Product tabs */}
        <HStack
          gap={2}
          overflowX="auto"
          className="hide-scrollbar"
        >
          {products.map((product) => {
            const isActive = product.productType === selectedProduct;
            const hasSwift = !!product.swiftMessageType;
            return (
              <Flex
                key={product.productType}
                as="button"
                align="center"
                gap={1.5}
                flexShrink={0}
                px={3.5}
                py={1.5}
                borderRadius="full"
                bg={isActive ? jTheme.accent : jTheme.chipBg}
                color={isActive ? (darkMode ? '#0A1628' : '#FFFFFF') : jTheme.textSecondary}
                fontWeight={isActive ? '700' : '500'}
                fontSize="10px"
                transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                _active={{ transform: 'scale(0.93)' }}
                onClick={() => handleProductChange(product.productType)}
                border="1px solid"
                borderColor={isActive ? jTheme.accent : jTheme.chipBorder}
                whiteSpace="nowrap"
              >
                {getShortLabel(product.productType)}
                {hasSwift ? (
                  <Text
                    fontSize="7px"
                    fontWeight="800"
                    letterSpacing="0.04em"
                    px={1}
                    py={0.5}
                    borderRadius="3px"
                    bg={isActive
                      ? (darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)')
                      : `${jTheme.accent}18`
                    }
                    color={isActive
                      ? (darkMode ? '#0A1628' : '#FFFFFF')
                      : jTheme.accent
                    }
                    lineHeight="1"
                  >
                    {product.swiftMessageType}
                  </Text>
                ) : (
                  <Box
                    w="5px" h="5px"
                    borderRadius="full"
                    bg={isActive
                      ? (darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)')
                      : jTheme.textMuted
                    }
                    opacity={0.6}
                  />
                )}
              </Flex>
            );
          })}
        </HStack>
      </Box>

      {/* === PRODUCT JOURNEY TIMELINE === */}
      {isLoadingEvents ? (
        <HStack gap={3} overflowX="auto" className="hide-scrollbar" pb={4} px={4}>
          {Array.from({ length: 3 }).map((_, i) => (
            <VStack key={i} gap={2} align="stretch" minW="140px" flexShrink={0}>
              <Box h="28px" borderRadius="10px" className="skeleton-shimmer" />
              <Box h="44px" borderRadius="10px" className="skeleton-shimmer" />
              <Box h="44px" borderRadius="10px" className="skeleton-shimmer" />
            </VStack>
          ))}
        </HStack>
      ) : stages.length > 0 ? (
        <JourneyMapIllustrated
          stages={stages}
          categoryColor={productStyle.text}
          productCategory={currentProduct?.category}
          productLabel={getShortLabel(selectedProduct)}
          productDescription={t(`operations.productDescriptions.${selectedProduct}`, '')}
          onEventClick={handleEventTap}
          onCreationClick={handleCreationClick}
          selectedEventId={selectedEvent?.id}
          variant={journeyVariant}
          embedded
        />
      ) : selectedProduct ? (
        <Flex
          justify="center"
          py={6}
          px={4}
        >
          <Text fontSize="xs" color={jTheme.textMuted}>
            {t('radialMenu.noEvents', 'No events configured for this product')}
          </Text>
        </Flex>
      ) : null}

      {/* === SEARCH PANEL (inside unified container) === */}
      {selectedEvent && (
        <Box
          ref={searchPanelRef}
          mx={3} mb={4}
          bg={jTheme.panelBg}
          borderRadius="16px"
          border="1.5px solid"
          borderColor={jTheme.panelBorder}
          overflow="hidden"
          className="animate-fade-in-up"
          style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
          boxShadow={`0 4px 20px ${jTheme.accent}10`}
        >
          <Flex px={4} py={3} borderBottomWidth="1px" borderColor={jTheme.chipBorder} align="center" justify="space-between">
            <HStack gap={2}>
              <Flex
                w="28px" h="28px" borderRadius="8px"
                bg={`${jTheme.accent}12`}
                align="center" justify="center"
              >
                <Icon
                  as={getIcon(selectedEvent.icon || null)}
                  boxSize={3.5}
                  color={selectedEvent.color || jTheme.accent}
                />
              </Flex>
              <VStack gap={0} align="start">
                <Text fontSize="sm" fontWeight="700" color={jTheme.textPrimary}>
                  {selectedEvent.eventName || selectedEvent.eventCode}
                </Text>
                <Text fontSize="2xs" color={jTheme.textMuted}>
                  {getShortLabel(selectedProduct)}
                </Text>
              </VStack>
            </HStack>
            <Box
              as="button" w="28px" h="28px" borderRadius="full"
              bg={jTheme.chipBg}
              display="flex" alignItems="center" justifyContent="center"
              cursor="pointer" _active={{ transform: 'scale(0.9)' }}
              onClick={handleCloseSearch}
            >
              <Icon as={FiX} boxSize={3.5} color={jTheme.textSecondary} />
            </Box>
          </Flex>

          <Box px={4} py={3}>
            <HStack
              bg={jTheme.chipBg}
              borderRadius="12px" px={3} py={2.5} gap={2}
              border="1px solid"
              borderColor={jTheme.chipBorder}
            >
              <Icon as={FiSearch} boxSize={4} color={jTheme.textSecondary} />
              <Input
                ref={searchInputRef}
                variant="unstyled"
                placeholder={t('radialMenu.searchPlaceholder', 'Search by reference, ID...')}
                fontSize="sm"
                value={operationQuery}
                onChange={(e) => setOperationQuery(e.target.value)}
                color={jTheme.textPrimary}
                _placeholder={{ color: jTheme.textMuted }}
              />
              {operationQuery && (
                <Box as="button" cursor="pointer" onClick={() => setOperationQuery('')} _active={{ opacity: 0.6 }}>
                  <Icon as={FiX} boxSize={3.5} color={jTheme.textSecondary} />
                </Box>
              )}
            </HStack>
          </Box>

          {isSearching && (
            <VStack gap={0} px={4} pb={3}>
              {Array.from({ length: 3 }).map((_, i) => (
                <HStack key={i} w="100%" py={2.5} gap={3}>
                  <Box w="40px" h="40px" borderRadius="10px" className="skeleton-shimmer" />
                  <VStack gap={1} align="start" flex={1}>
                    <Box w="120px" h="12px" borderRadius="4px" className="skeleton-shimmer" />
                    <Box w="80px" h="10px" borderRadius="4px" className="skeleton-shimmer" />
                  </VStack>
                </HStack>
              ))}
            </VStack>
          )}

          {!isSearching && searchResults.length > 0 && (
            <VStack gap={2} maxH="400px" overflowY="auto" className="hide-scrollbar" px={3} pb={3}>
              {searchResults.map((op, index) => (
                <OperationCard
                  key={op.operationId}
                  op={op}
                  darkMode={darkMode}
                  cardBg={jTheme.chipBg}
                  cardBorder={jTheme.chipBorder}
                  colors={colors}
                  onViewForm={handleViewForm}
                  onViewDetails={handleViewDetails}
                  onViewMessages={handleViewMessages}
                  onExecuteEvent={handleExecuteEvent}
                  delay={index + 1}
                  accentColor={selectedEvent?.color || jTheme.accent}
                />
              ))}
            </VStack>
          )}

          {!isSearching && operationQuery.length >= 2 && searchResults.length === 0 && (
            <Flex px={4} py={6} justify="center" align="center" direction="column" gap={1}>
              <Icon as={FiSearch} boxSize={5} color={jTheme.textMuted} />
              <Text fontSize="sm" color={jTheme.textSecondary}>
                {t('radialMenu.noResults', 'No operations found')}
              </Text>
            </Flex>
          )}

          {!isSearching && operationQuery.length < 2 && (
            <Flex px={4} py={5} justify="center" align="center" direction="column" gap={2}>
              <Icon as={FiSearch} boxSize={6} color={jTheme.accent} opacity={0.5} />
              <Text fontSize="sm" fontWeight="600" color={jTheme.textPrimary}>
                {t('radialMenu.searchHintTitle', 'Search for an operation')}
              </Text>
              <Text fontSize="xs" color={jTheme.textSecondary} textAlign="center">
                {t('radialMenu.searchHint', 'Enter at least 2 characters to search')}
              </Text>
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
};

export default RadialActionMenu;
