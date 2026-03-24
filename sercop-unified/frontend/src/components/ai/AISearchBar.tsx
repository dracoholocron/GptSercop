/**
 * AISearchBar - Enhanced search bar with autocomplete, examples, and free-form support
 */

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Input,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  Kbd,
} from '@chakra-ui/react';
import { FiSearch, FiX, FiCornerDownLeft, FiCpu } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { searchOptions, type AIOption, type AICategory } from '../../config/aiCategories';

interface AISearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onOptionSelect?: (option: AIOption, category: AICategory) => void;
  onFreeFormSubmit?: (query: string) => void;
}

const SEARCH_EXAMPLES = [
  { key: 'example.statistics', query: 'estadísticas' },
  { key: 'example.expiring', query: 'vencimientos' },
  { key: 'example.balance', query: 'balance' },
  { key: 'example.swift', query: 'swift' },
];

const CATEGORY_COLORS: Record<string, string> = {
  blue: 'blue',
  green: 'green',
  purple: 'purple',
  orange: 'orange',
  teal: 'teal',
  cyan: 'cyan',
};

export const AISearchBar = ({
  value,
  onChange,
  onClear,
  onOptionSelect,
  onFreeFormSubmit,
}: AISearchBarProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Get search results
  const results = value.length >= 2 ? searchOptions(value) : [];
  const showDropdown = isFocused && value.length >= 2;

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [value]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown && e.key === 'Enter' && value.trim()) {
      // Free-form submit when no dropdown is shown
      e.preventDefault();
      onFreeFormSubmit?.(value.trim());
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          const { option, category } = results[selectedIndex];
          onOptionSelect?.(option, category);
        } else if (value.trim()) {
          // Free-form submit
          onFreeFormSubmit?.(value.trim());
        }
        break;
      case 'Escape':
        inputRef.current?.blur();
        setIsFocused(false);
        break;
    }
  };

  const handleExampleClick = (query: string) => {
    onChange(query);
    inputRef.current?.focus();
  };

  const handleOptionClick = (option: AIOption, category: AICategory) => {
    onOptionSelect?.(option, category);
  };

  return (
    <Box position="relative" mb={4}>
      {/* Enhanced Input Field */}
      <Box
        position="relative"
        borderRadius="2xl"
        bg={isFocused ? colors.cardBg : colors.bgColor}
        borderWidth="2px"
        borderColor={isFocused ? 'purple.400' : colors.borderColor}
        boxShadow={isFocused ? 'lg' : 'sm'}
        transition="all 0.2s ease-in-out"
        _hover={{
          borderColor: isFocused ? 'purple.400' : 'purple.200',
          boxShadow: 'md',
        }}
      >
        <HStack gap={0} p={1}>
          {/* Search Icon with animation */}
          <Box
            pl={4}
            pr={2}
            color={isFocused ? 'purple.500' : colors.textColorSecondary}
            transition="color 0.2s"
          >
            <Icon as={FiSearch} boxSize={5} />
          </Box>

          {/* Input */}
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={t('ai.searchPlaceholder')}
            size="lg"
            variant="unstyled"
            py={3}
            px={2}
            fontSize="md"
            _placeholder={{ color: colors.textColorSecondary }}
          />

          {/* Clear button or Enter hint */}
          {value ? (
            <Box
              as="button"
              px={3}
              py={2}
              mr={1}
              borderRadius="lg"
              color={colors.textColorSecondary}
              _hover={{ bg: 'gray.100', color: 'gray.700' }}
              onClick={() => {
                onClear();
                inputRef.current?.focus();
              }}
              transition="all 0.15s"
            >
              <FiX size={18} />
            </Box>
          ) : (
            <HStack gap={1} pr={3} color={colors.textColorSecondary}>
              <Kbd size="sm" bg={colors.bgColor}>Enter</Kbd>
            </HStack>
          )}
        </HStack>
      </Box>

      {/* Autocomplete Dropdown */}
      {showDropdown && results.length > 0 && (
        <Box
          ref={dropdownRef}
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={2}
          bg={colors.cardBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={colors.borderColor}
          boxShadow="xl"
          zIndex={100}
          maxH="320px"
          overflowY="auto"
          py={2}
        >
          {results.slice(0, 6).map(({ option, category }, idx) => {
            const OptionIcon = option.icon;
            const badgeColor = CATEGORY_COLORS[category.color] || 'gray';
            const isSelected = idx === selectedIndex;

            return (
              <Box
                key={`${category.id}-${option.id}`}
                px={3}
                py={2}
                mx={2}
                borderRadius="lg"
                cursor="pointer"
                bg={isSelected ? `${category.color}.50` : 'transparent'}
                borderWidth={isSelected ? '1px' : '0'}
                borderColor={isSelected ? `${category.color}.200` : 'transparent'}
                _hover={{
                  bg: `${category.color}.50`,
                }}
                onClick={() => handleOptionClick(option, category)}
                transition="all 0.1s"
              >
                <HStack justify="space-between">
                  <HStack gap={3}>
                    <Box
                      p={1.5}
                      bg={`${category.color}.100`}
                      borderRadius="md"
                    >
                      <Icon
                        as={OptionIcon}
                        boxSize={4}
                        color={`${category.color}.600`}
                      />
                    </Box>
                    <Box>
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color={colors.textColor}
                      >
                        {t(option.titleKey)}
                      </Text>
                      <Text fontSize="xs" color={colors.textColorSecondary}>
                        {t(option.descriptionKey)}
                      </Text>
                    </Box>
                  </HStack>
                  <Badge
                    colorPalette={badgeColor}
                    variant="subtle"
                    fontSize="2xs"
                  >
                    {t(category.titleKey)}
                  </Badge>
                </HStack>
              </Box>
            );
          })}

          {/* Free-form option at the bottom */}
          {onFreeFormSubmit && (
            <Box
              px={3}
              py={2}
              mx={2}
              mt={2}
              borderRadius="lg"
              cursor="pointer"
              borderTop="1px"
              borderColor={colors.borderColor}
              pt={3}
              _hover={{ bg: 'purple.50' }}
              onClick={() => onFreeFormSubmit(value.trim())}
            >
              <HStack gap={3}>
                <Box p={1.5} bg="purple.100" borderRadius="md">
                  <Icon as={FiCpu} boxSize={4} color="purple.600" />
                </Box>
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                    {t('ai.askFreeForm', 'Preguntar')}: "{value}"
                  </Text>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    {t('ai.freeFormHint', 'Consulta con texto libre')}
                  </Text>
                </Box>
                <HStack gap={1}>
                  <Kbd size="sm">Enter</Kbd>
                </HStack>
              </HStack>
            </Box>
          )}
        </Box>
      )}

      {/* No results message */}
      {showDropdown && results.length === 0 && onFreeFormSubmit && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={2}
          bg={colors.cardBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={colors.borderColor}
          boxShadow="xl"
          zIndex={100}
          p={4}
        >
          <Box
            px={3}
            py={2}
            borderRadius="lg"
            cursor="pointer"
            _hover={{ bg: 'purple.50' }}
            onClick={() => onFreeFormSubmit(value.trim())}
          >
            <HStack gap={3}>
              <Box p={2} bg="purple.100" borderRadius="md">
                <Icon as={FiCpu} boxSize={5} color="purple.600" />
              </Box>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                  {t('ai.askFreeForm', 'Preguntar')}: "{value}"
                </Text>
                <Text fontSize="xs" color={colors.textColorSecondary}>
                  {t('ai.noResultsFreeForm', 'No se encontraron opciones, pero puedes hacer una consulta libre')}
                </Text>
              </Box>
              <Icon as={FiCornerDownLeft} color={colors.textColorSecondary} />
            </HStack>
          </Box>
        </Box>
      )}

      {/* Example chips - shown when field is empty or focused without query */}
      {(!value || (isFocused && value.length < 2)) && (
        <HStack gap={2} mt={3} flexWrap="wrap">
          <Text fontSize="xs" color={colors.textColorSecondary} mr={1}>
            {t('ai.trySearching', 'Prueba buscar')}:
          </Text>
          {SEARCH_EXAMPLES.map((example) => (
            <Badge
              key={example.query}
              as="button"
              colorPalette="purple"
              variant="outline"
              cursor="pointer"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="normal"
              _hover={{
                bg: 'purple.50',
                borderColor: 'purple.400',
              }}
              onClick={() => handleExampleClick(example.query)}
              transition="all 0.15s"
            >
              {example.query}
            </Badge>
          ))}
        </HStack>
      )}
    </Box>
  );
};

export default AISearchBar;
