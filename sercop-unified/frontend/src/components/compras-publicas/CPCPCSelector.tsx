/**
 * CPCPCSelector - Selector reutilizable de códigos CPC (Clasificador de Productos)
 * Modo árbol (browse) + búsqueda por texto. Soporta selección múltiple o individual.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Spinner,
  Icon,
  Flex,
  Input,
} from '@chakra-ui/react';
import { FiSearch, FiChevronRight, FiChevronDown, FiX, FiCheck } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { get } from '../../utils/apiClient';

export interface CpcItem {
  code: string;
  description: string;
  level: number;
  isLeaf: boolean;
  parentCode?: string | null;
}

interface CPCPCSelectorProps {
  value: string[];
  onChange: (codes: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
}

export const CPCPCSelector: React.FC<CPCPCSelectorProps> = ({
  value,
  onChange,
  multiple = true,
  placeholder = 'Buscar código CPC...',
}) => {
  const { isDark } = useTheme();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CpcItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [childrenMap, setChildrenMap] = useState<Record<string, CpcItem[]>>({});
  const [rootItems, setRootItems] = useState<CpcItem[]>([]);
  const [loadingRoot, setLoadingRoot] = useState(false);
  const [showTree, setShowTree] = useState(false);

  const borderColor = isDark ? 'gray.700' : 'gray.200';
  const cardBg = isDark ? 'gray.800' : 'white';

  // Search debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await get(`/v1/cpc/suggestions?q=${encodeURIComponent(query)}&limit=20`);
        if (res.ok) { const d = await res.json(); setSearchResults(Array.isArray(d?.data) ? d.data : []); }
      } catch { /* silent */ } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Load root items for tree
  const loadRoot = useCallback(async () => {
    if (rootItems.length > 0) return;
    setLoadingRoot(true);
    try {
      const res = await get('/v1/cpc/tree');
      if (res.ok) { const d = await res.json(); setRootItems(Array.isArray(d?.data) ? d.data : []); }
    } catch { /* silent */ } finally { setLoadingRoot(false); }
  }, [rootItems.length]);

  const loadChildren = async (parentCode: string) => {
    if (childrenMap[parentCode]) return;
    try {
      const res = await get(`/v1/cpc/tree?parentCode=${encodeURIComponent(parentCode)}`);
      if (res.ok) {
        const d = await res.json();
        setChildrenMap(prev => ({ ...prev, [parentCode]: Array.isArray(d?.data) ? d.data : [] }));
      }
    } catch { /* silent */ }
  };

  const toggle = (code: string) => {
    if (multiple) {
      onChange(value.includes(code) ? value.filter(c => c !== code) : [...value, code]);
    } else {
      onChange(value.includes(code) ? [] : [code]);
    }
  };

  const toggleExpand = async (item: CpcItem) => {
    const willExpand = !expanded[item.code];
    setExpanded(prev => ({ ...prev, [item.code]: willExpand }));
    if (willExpand && !item.isLeaf) await loadChildren(item.code);
  };

  const renderItem = (item: CpcItem, depth = 0): React.ReactNode => {
    const isSelected = value.includes(item.code);
    const isExp = expanded[item.code];
    const children = childrenMap[item.code] || [];
    return (
      <Box key={item.code}>
        <HStack
          pl={`${depth * 16 + 8}px`}
          pr={2}
          py={2}
          cursor="pointer"
          bg={isSelected ? (isDark ? 'blue.900' : 'blue.50') : 'transparent'}
          _hover={{ bg: isDark ? 'gray.700' : 'gray.50' }}
          borderBottomWidth="1px"
          borderColor={borderColor}
          onClick={() => toggle(item.code)}
        >
          <Box onClick={e => { if (!item.isLeaf) { e.stopPropagation(); toggleExpand(item); } }} p={1}>
            {item.isLeaf ? (
              <Box w={4} h={4} />
            ) : (
              <Icon as={isExp ? FiChevronDown : FiChevronRight} boxSize={4} color={isDark ? 'gray.400' : 'gray.500'} />
            )}
          </Box>
          <Icon
            as={FiCheck}
            boxSize={4}
            color={isSelected ? 'blue.400' : 'transparent'}
          />
          <VStack align="start" gap={0} flex={1}>
            <Text fontSize="xs" fontFamily="mono" fontWeight="600" color={isDark ? 'gray.400' : 'gray.500'}>{item.code}</Text>
            <Text fontSize="sm">{item.description}</Text>
          </VStack>
        </HStack>
        {isExp && children.map(c => renderItem(c, depth + 1))}
      </Box>
    );
  };

  return (
    <VStack align="stretch" gap={3}>
      {/* Search */}
      <HStack bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} px={3} py={2}>
        <Icon as={FiSearch} color={isDark ? 'gray.400' : 'gray.500'} boxSize={4} />
        <Input
          variant="unstyled"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          fontSize="sm"
        />
        {searching && <Spinner size="xs" />}
      </HStack>

      {/* Search results dropdown */}
      {searchResults.length > 0 && query.trim() && (
        <Box
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          bg={cardBg}
          overflow="hidden"
          maxH="200px"
          overflowY="auto"
        >
          {searchResults.map(item => {
            const sel = value.includes(item.code);
            return (
              <HStack
                key={item.code}
                px={3}
                py={2}
                cursor="pointer"
                bg={sel ? (isDark ? 'blue.900' : 'blue.50') : 'transparent'}
                _hover={{ bg: isDark ? 'gray.700' : 'gray.50' }}
                borderBottomWidth="1px"
                borderColor={borderColor}
                onClick={() => toggle(item.code)}
              >
                <Icon as={FiCheck} boxSize={4} color={sel ? 'blue.400' : 'transparent'} />
                <VStack align="start" gap={0} flex={1}>
                  <Text fontSize="xs" fontFamily="mono" fontWeight="600">{item.code}</Text>
                  <Text fontSize="sm">{item.description}</Text>
                </VStack>
              </HStack>
            );
          })}
        </Box>
      )}

      {/* Tree toggle */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => { setShowTree(v => !v); if (!showTree) loadRoot(); }}
      >
        {showTree ? 'Ocultar árbol CPC' : 'Navegar árbol CPC'}
      </Button>

      {/* Tree */}
      {showTree && (
        <Box
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          bg={cardBg}
          overflow="hidden"
          maxH="300px"
          overflowY="auto"
        >
          {loadingRoot ? (
            <Flex justify="center" py={6}><Spinner size="sm" /></Flex>
          ) : (
            rootItems.map(item => renderItem(item, 0))
          )}
        </Box>
      )}

      {/* Selected badges */}
      {value.length > 0 && (
        <Box>
          <Text fontSize="xs" fontWeight="600" mb={2} color={isDark ? 'gray.400' : 'gray.500'}>
            Seleccionados ({value.length}):
          </Text>
          <Flex gap={2} flexWrap="wrap">
            {value.map(code => (
              <Badge
                key={code}
                colorPalette="blue"
                variant="solid"
                fontSize="xs"
                cursor="pointer"
                onClick={() => toggle(code)}
              >
                {code}
                <Icon as={FiX} ml={1} boxSize={3} />
              </Badge>
            ))}
          </Flex>
        </Box>
      )}
    </VStack>
  );
};

export default CPCPCSelector;
