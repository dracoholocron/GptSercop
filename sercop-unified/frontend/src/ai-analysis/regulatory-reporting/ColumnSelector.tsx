/**
 * Column Selector component for choosing visible columns
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Checkbox,
  Popover,
  Stack,
} from '@chakra-ui/react';
import {
  FiColumns,
  FiFileText,
  FiUsers,
  FiGlobe,
  FiDollarSign,
  FiCalendar,
  FiCheckCircle,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import type { ColumnDefinition } from './types';
import { CATEGORY_LABELS } from './columns';

const CATEGORY_ICONS = {
  operation: FiFileText,
  client: FiUsers,
  bank: FiGlobe,
  amount: FiDollarSign,
  dates: FiCalendar,
  other: FiCheckCircle,
};

interface ColumnSelectorProps {
  columns: ColumnDefinition[];
  visibleColumns: string[];
  onColumnToggle: (key: string) => void;
  onSelectCategory: (category: string) => void;
  isSpanish: boolean;
}

export const ColumnSelector = ({
  columns,
  visibleColumns,
  onColumnToggle,
  onSelectCategory,
  isSpanish,
}: ColumnSelectorProps) => {
  const { getColors } = useTheme();
  const colors = getColors();

  // Group columns by category
  const columnsByCategory: Record<string, ColumnDefinition[]> = {};
  columns.forEach(col => {
    if (!columnsByCategory[col.category]) {
      columnsByCategory[col.category] = [];
    }
    columnsByCategory[col.category].push(col);
  });

  return (
    <Popover.Root positioning={{ placement: 'bottom-end' }}>
      <Popover.Trigger asChild>
        <Button variant="outline">
          <FiColumns />
          {isSpanish ? 'Columnas' : 'Columns'} ({visibleColumns.length})
        </Button>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content w="400px" maxH="500px" overflowY="auto">
          <Popover.Header fontWeight="bold">
            {isSpanish ? 'Seleccionar Columnas' : 'Select Columns'}
          </Popover.Header>
          <Popover.Body>
            <VStack align="stretch" gap={4}>
              {Object.entries(columnsByCategory).map(([category, cols]) => {
                const CategoryIcon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                const categoryLabel = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS];
                const allSelected = cols.every(c => visibleColumns.includes(c.key));
                const someSelected = cols.some(c => visibleColumns.includes(c.key));

                return (
                  <Box key={category}>
                    <HStack
                      mb={2}
                      cursor="pointer"
                      onClick={() => onSelectCategory(category)}
                      _hover={{ bg: colors.hoverBg }}
                      p={1}
                      borderRadius="md"
                    >
                      <Checkbox.Root
                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                        onCheckedChange={() => onSelectCategory(category)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                      </Checkbox.Root>
                      <CategoryIcon />
                      <Text fontWeight="semibold" fontSize="sm">
                        {isSpanish ? categoryLabel.es : categoryLabel.en}
                      </Text>
                    </HStack>
                    <Stack pl={6} gap={1}>
                      {cols.map(col => (
                        <Checkbox.Root
                          key={col.key}
                          checked={visibleColumns.includes(col.key)}
                          onCheckedChange={() => onColumnToggle(col.key)}
                          size="sm"
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Text fontSize="sm">{isSpanish ? col.labelEs : col.label}</Text>
                          </Checkbox.Label>
                        </Checkbox.Root>
                      ))}
                    </Stack>
                  </Box>
                );
              })}
            </VStack>
          </Popover.Body>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
};
