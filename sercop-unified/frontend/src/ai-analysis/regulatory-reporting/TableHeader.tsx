/**
 * TableHeader component with sorting and filtering capabilities
 */

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  HStack,
  Text,
  Input,
  IconButton,
  Popover,
  VStack,
  Button,
  NativeSelect,
} from '@chakra-ui/react';
import {
  FiChevronUp,
  FiChevronDown,
  FiFilter,
  FiX,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import type { ColumnDefinition, SortConfig } from './types';

interface TableHeaderProps {
  column: ColumnDefinition;
  isSpanish: boolean;
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  filterValue: string;
  onFilterChange: (key: string, value: string) => void;
  uniqueValues?: string[];
}

export const TableHeader = ({
  column,
  isSpanish,
  sortConfig,
  onSort,
  filterValue,
  onFilterChange,
  uniqueValues = [],
}: TableHeaderProps) => {
  const { getColors } = useTheme();
  const colors = getColors();
  const [localFilter, setLocalFilter] = useState(filterValue);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSorted = sortConfig?.key === column.key;
  const sortDirection = isSorted ? sortConfig.direction : null;
  const hasFilter = Boolean(filterValue);

  useEffect(() => {
    setLocalFilter(filterValue);
  }, [filterValue]);

  useEffect(() => {
    if (isFilterOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFilterOpen]);

  const handleApplyFilter = () => {
    onFilterChange(column.key, localFilter);
    setIsFilterOpen(false);
  };

  const handleClearFilter = () => {
    setLocalFilter('');
    onFilterChange(column.key, '');
    setIsFilterOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilter();
    } else if (e.key === 'Escape') {
      setLocalFilter(filterValue);
      setIsFilterOpen(false);
    }
  };

  return (
    <Box
      as="th"
      position="relative"
      width={`${column.width}px`}
      minWidth={`${column.minWidth || column.width}px`}
      maxWidth={`${column.width}px`}
      p={2}
      bg={colors.cardBg}
      borderBottom="2px solid"
      borderColor={colors.borderColor}
      userSelect="none"
    >
      <HStack gap={1} justify="space-between">
        {/* Header Label with Sort */}
        <HStack
          flex={1}
          gap={1}
          cursor={column.sortable ? 'pointer' : 'default'}
          onClick={() => column.sortable && onSort(column.key)}
          _hover={column.sortable ? { color: 'blue.500' } : undefined}
        >
          <Text
            fontSize="xs"
            fontWeight="bold"
            color={colors.textColor}
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            title={isSpanish ? column.labelEs : column.label}
          >
            {isSpanish ? column.labelEs : column.label}
          </Text>

          {/* Sort Indicator */}
          {column.sortable && (
            <Box minW="14px">
              {sortDirection === 'asc' && <FiChevronUp size={14} color="var(--chakra-colors-blue-500)" />}
              {sortDirection === 'desc' && <FiChevronDown size={14} color="var(--chakra-colors-blue-500)" />}
            </Box>
          )}
        </HStack>

        {/* Filter Button */}
        {column.filterable && (
          <Popover.Root
            open={isFilterOpen}
            onOpenChange={({ open }) => setIsFilterOpen(open)}
            positioning={{ placement: 'bottom-start' }}
          >
            <Popover.Trigger asChild>
              <IconButton
                aria-label="Filter"
                size="xs"
                variant={hasFilter ? 'solid' : 'ghost'}
                colorPalette={hasFilter ? 'blue' : 'gray'}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFilterOpen(!isFilterOpen);
                }}
              >
                <FiFilter size={12} />
              </IconButton>
            </Popover.Trigger>
            <Popover.Positioner>
              <Popover.Content minW="200px" onClick={(e) => e.stopPropagation()}>
                <Popover.Body p={3}>
                  <VStack gap={2} align="stretch">
                    <Text fontSize="xs" fontWeight="bold" color={colors.textColorSecondary}>
                      {isSpanish ? 'Filtrar por' : 'Filter by'} {isSpanish ? column.labelEs : column.label}
                    </Text>

                    {column.filterType === 'select' && uniqueValues.length > 0 ? (
                      <NativeSelect.Root size="sm">
                        <NativeSelect.Field
                          value={localFilter}
                          onChange={(e) => {
                            setLocalFilter(e.target.value);
                            onFilterChange(column.key, e.target.value);
                            setIsFilterOpen(false);
                          }}
                        >
                          <option value="">{isSpanish ? 'Todos' : 'All'}</option>
                          {uniqueValues.map(val => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </NativeSelect.Field>
                      </NativeSelect.Root>
                    ) : (
                      <Input
                        ref={inputRef}
                        size="sm"
                        placeholder={isSpanish ? 'Buscar...' : 'Search...'}
                        value={localFilter}
                        onChange={(e) => setLocalFilter(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                    )}

                    <HStack justify="flex-end" gap={2}>
                      {hasFilter && (
                        <Button size="xs" variant="ghost" onClick={handleClearFilter}>
                          <FiX size={12} />
                          {isSpanish ? 'Limpiar' : 'Clear'}
                        </Button>
                      )}
                      {column.filterType !== 'select' && (
                        <Button size="xs" colorPalette="blue" onClick={handleApplyFilter}>
                          {isSpanish ? 'Aplicar' : 'Apply'}
                        </Button>
                      )}
                    </HStack>
                  </VStack>
                </Popover.Body>
              </Popover.Content>
            </Popover.Positioner>
          </Popover.Root>
        )}
      </HStack>
    </Box>
  );
};
