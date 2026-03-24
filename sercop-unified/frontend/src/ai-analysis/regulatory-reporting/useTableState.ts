/**
 * Hook for managing table state: sorting, filtering, pagination
 */

import { useState, useMemo, useCallback } from 'react';
import type { Operation } from '../../types/operations';
import type { SortConfig, ColumnFilter, PaginationConfig, ColumnDefinition } from './types';
import { DEFAULT_PAGE_SIZE } from './types';

interface UseTableStateProps {
  data: Operation[];
  columns: ColumnDefinition[];
}

interface UseTableStateReturn {
  // Sorting
  sortConfig: SortConfig | null;
  handleSort: (key: string) => void;

  // Column Filters
  columnFilters: Record<string, string>;
  setColumnFilter: (key: string, value: string) => void;
  clearColumnFilters: () => void;
  getUniqueValues: (key: string) => string[];

  // Pagination
  pagination: PaginationConfig;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Processed Data
  processedData: Operation[];
  paginatedData: Operation[];
}

export const useTableState = ({ data, columns }: UseTableStateProps): UseTableStateReturn => {
  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Column filters state
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Handle sort
  const handleSort = useCallback((key: string) => {
    const column = columns.find(c => c.key === key);
    if (!column?.sortable) return;

    setSortConfig(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        return null; // Reset sort
      }
      return { key, direction: 'asc' };
    });
    setPage(1); // Reset to first page on sort
  }, [columns]);

  // Set column filter
  const setColumnFilter = useCallback((key: string, value: string) => {
    setColumnFilters(prev => {
      if (!value) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
    setPage(1); // Reset to first page on filter
  }, []);

  // Clear all column filters
  const clearColumnFilters = useCallback(() => {
    setColumnFilters({});
    setPage(1);
  }, []);

  // Get unique values for select filters
  const getUniqueValues = useCallback((key: string): string[] => {
    const values = data
      .map(item => item[key as keyof Operation])
      .filter((value): value is string => Boolean(value) && typeof value === 'string');
    return [...new Set(values)].sort();
  }, [data]);

  // Filter data
  const filteredData = useMemo(() => {
    if (Object.keys(columnFilters).length === 0) {
      return data;
    }

    return data.filter(item => {
      return Object.entries(columnFilters).every(([key, filterValue]) => {
        const itemValue = item[key as keyof Operation];
        if (itemValue === null || itemValue === undefined) return false;

        const column = columns.find(c => c.key === key);

        if (column?.filterType === 'select') {
          return String(itemValue) === filterValue;
        }

        if (column?.filterType === 'number') {
          // For number filters, support range with format "min-max" or exact match
          const numValue = Number(itemValue);
          if (filterValue.includes('-')) {
            const [min, max] = filterValue.split('-').map(Number);
            return numValue >= min && numValue <= max;
          }
          return numValue === Number(filterValue);
        }

        // Text filter - case insensitive contains
        return String(itemValue).toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  }, [data, columnFilters, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Operation];
      const bValue = b[sortConfig.key as keyof Operation];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const column = columns.find(c => c.key === sortConfig.key);

      // Handle dates
      if (column?.filterType === 'date') {
        const dateA = new Date(aValue as string).getTime();
        const dateB = new Date(bValue as string).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // Handle numbers
      if (column?.filterType === 'number' || typeof aValue === 'number') {
        const numA = Number(aValue);
        const numB = Number(bValue);
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
      }

      // Handle strings
      const strA = String(aValue).toLowerCase();
      const strB = String(bValue).toLowerCase();
      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, columns]);

  // Calculate pagination
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(page, totalPages);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, validPage, pageSize]);

  // Handle page change
  const handleSetPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  // Handle page size change
  const handleSetPageSize = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page
  }, []);

  return {
    sortConfig,
    handleSort,
    columnFilters,
    setColumnFilter,
    clearColumnFilters,
    getUniqueValues,
    pagination: {
      page: validPage,
      pageSize,
      totalItems,
      totalPages,
    },
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    processedData: sortedData,
    paginatedData,
  };
};
