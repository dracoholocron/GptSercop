/**
 * DataTable component with sorting, filtering, and pagination
 */

import { useMemo } from 'react';
import {
  Box,
  VStack,
  Text,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import { FiFileText } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import type { Operation } from '../../types/operations';
import type { ColumnDefinition, SortConfig, PaginationConfig } from './types';
import { TableHeader } from './TableHeader';
import { Pagination } from './Pagination';

interface DataTableProps {
  data: Operation[];
  columns: ColumnDefinition[];
  visibleColumns: string[];
  isSpanish: boolean;
  loading: boolean;
  // Sorting
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  // Filtering
  columnFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  getUniqueValues: (key: string) => string[];
  // Pagination
  pagination: PaginationConfig;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const DataTable = ({
  data,
  columns,
  visibleColumns,
  isSpanish,
  loading,
  sortConfig,
  onSort,
  columnFilters,
  onFilterChange,
  getUniqueValues,
  pagination,
  onPageChange,
  onPageSizeChange,
}: DataTableProps) => {
  const { getColors } = useTheme();
  const colors = getColors();

  // Get visible column definitions in order
  const visibleColumnDefs = useMemo(() =>
    columns.filter(c => visibleColumns.includes(c.key)),
    [columns, visibleColumns]
  );

  // Calculate total table width
  const tableWidth = useMemo(() =>
    visibleColumnDefs.reduce((sum, col) => sum + col.width, 0),
    [visibleColumnDefs]
  );

  if (loading) {
    return (
      <VStack py={12} flex={1}>
        <Spinner size="xl" color="blue.500" />
        <Text color={colors.textColorSecondary}>
          {isSpanish ? 'Cargando...' : 'Loading...'}
        </Text>
      </VStack>
    );
  }

  if (data.length === 0) {
    return (
      <VStack py={12} flex={1}>
        <FiFileText size={48} color={colors.textColorSecondary} />
        <Text color={colors.textColorSecondary}>
          {isSpanish ? 'No se encontraron operaciones' : 'No operations found'}
        </Text>
      </VStack>
    );
  }

  return (
    <Box display="flex" flexDirection="column" flex={1} overflow="hidden">
      {/* Scrollable table container */}
      <Box flex={1} overflow="auto">
        <Box
          as="table"
          width={`${tableWidth}px`}
          minWidth="100%"
          borderCollapse="separate"
          borderSpacing={0}
          css={{
            tableLayout: 'fixed',
          }}
        >
          {/* Header */}
          <Box as="thead" position="sticky" top={0} zIndex={10}>
            <Box as="tr">
              {visibleColumnDefs.map(col => (
                <TableHeader
                  key={col.key}
                  column={col}
                  isSpanish={isSpanish}
                  sortConfig={sortConfig}
                  onSort={onSort}
                  filterValue={columnFilters[col.key] || ''}
                  onFilterChange={onFilterChange}
                  uniqueValues={col.filterType === 'select' ? getUniqueValues(col.key) : undefined}
                />
              ))}
            </Box>
          </Box>

          {/* Body */}
          <Box as="tbody">
            {data.map((op, idx) => (
              <Box
                as="tr"
                key={op.id || idx}
                _hover={{ bg: colors.hoverBg }}
                borderBottom="1px solid"
                borderColor={colors.borderColor}
              >
                {visibleColumnDefs.map(col => {
                  const value = op[col.key as keyof Operation];
                  const displayValue = col.format
                    ? col.format(value, op)
                    : String(value || '');

                  return (
                    <Box
                      as="td"
                      key={col.key}
                      width={`${col.width}px`}
                      minWidth={`${col.minWidth || col.width}px`}
                      maxWidth={`${col.width}px`}
                      p={2}
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                      title={displayValue}
                      fontSize="sm"
                    >
                      {col.key === 'status' ? (
                        <Badge
                          colorPalette={
                            value === 'ACTIVE' ? 'green' :
                            value === 'PENDING' ? 'yellow' :
                            value === 'CANCELLED' ? 'red' : 'gray'
                          }
                          fontSize="xs"
                        >
                          {displayValue}
                        </Badge>
                      ) : (
                        displayValue
                      )}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Pagination */}
      <Pagination
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isSpanish={isSpanish}
      />
    </Box>
  );
};
