/**
 * RegulatoryReporting - Reporte para Entes de Control
 *
 * Permite visualizar todas las operaciones vigentes con:
 * - Selección de columnas visibles
 * - Ordenamiento por columna
 * - Filtrado por columna
 * - Paginamiento
 * - Exportación a CSV (formato compatible con InfoComex)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  IconButton,
  Input,
  Badge,
  Flex,
  NativeSelect,
} from '@chakra-ui/react';
import { notify } from '../../components/ui/toaster';
import {
  FiDownload,
  FiSearch,
  FiRefreshCw,
  FiFileText,
  FiX,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { operationsApi } from '../../services/operationsApi';
import type { Operation } from '../../types/operations';

import { COLUMN_DEFINITIONS } from './columns';
import { useTableState } from './useTableState';
import { DataTable } from './DataTable';
import { ColumnSelector } from './ColumnSelector';

export const RegulatoryReporting = () => {
  const { t, i18n } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const isSpanish = i18n.language === 'es';

  // Data state
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    COLUMN_DEFINITIONS.filter(c => c.defaultVisible).map(c => c.key)
  );

  // Global search (quick filter)
  const [globalSearch, setGlobalSearch] = useState('');

  // Apply global search filter to data
  const filteredByGlobalSearch = globalSearch
    ? operations.filter(op =>
        op.reference?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        op.applicantName?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        op.beneficiaryName?.toLowerCase().includes(globalSearch.toLowerCase())
      )
    : operations;

  // Table state (sorting, column filters, pagination)
  const {
    sortConfig,
    handleSort,
    columnFilters,
    setColumnFilter,
    clearColumnFilters,
    getUniqueValues,
    pagination,
    setPage,
    setPageSize,
    processedData,
    paginatedData,
  } = useTableState({
    data: filteredByGlobalSearch,
    columns: COLUMN_DEFINITIONS,
  });

  // Fetch operations
  const fetchOperations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await operationsApi.getOperations();
      setOperations(data);
    } catch (error) {
      console.error('Error fetching operations:', error);
      notify.error(t('regulatoryReporting.errorFetching'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  // Column visibility handlers
  const handleColumnToggle = (columnKey: string) => {
    setVisibleColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleSelectCategory = (category: string) => {
    const categoryColumns = COLUMN_DEFINITIONS
      .filter(c => c.category === category)
      .map(c => c.key);

    const allSelected = categoryColumns.every(key => visibleColumns.includes(key));

    if (allSelected) {
      setVisibleColumns(prev => prev.filter(key => !categoryColumns.includes(key)));
    } else {
      setVisibleColumns(prev => [...new Set([...prev, ...categoryColumns])]);
    }
  };

  // Export to CSV
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const visibleColumnDefs = COLUMN_DEFINITIONS.filter(c => visibleColumns.includes(c.key));

      // Create CSV header
      const headers = visibleColumnDefs.map(c => isSpanish ? c.labelEs : c.label);

      // Use processed data (filtered + sorted) for export
      const rows = processedData.map(op => {
        return visibleColumnDefs.map(col => {
          const value = op[col.key as keyof Operation];
          if (col.format) {
            return `"${col.format(value, op).replace(/"/g, '""')}"`;
          }
          return `"${String(value || '').replace(/"/g, '""')}"`;
        });
      });

      // Combine header and rows
      const csvContent = [
        headers.map(h => `"${h}"`).join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');

      // Add BOM for Excel compatibility with UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

      // Download file
      const link = document.createElement('a');
      const fileName = `reporte_entes_control_${new Date().toISOString().split('T')[0]}.csv`;
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);

      notify.success(t('regulatoryReporting.exportSuccess', { count: processedData.length }));
    } catch (error) {
      console.error('Error exporting:', error);
      notify.error(t('regulatoryReporting.exportError'));
    } finally {
      setExporting(false);
    }
  }, [processedData, visibleColumns, isSpanish, t]);

  // Count active filters
  const activeFiltersCount = Object.keys(columnFilters).length + (globalSearch ? 1 : 0);

  return (
    <Box h="calc(100vh - 120px)" display="flex" flexDirection="column">
      {/* Header */}
      <Box p={4} borderBottom="1px" borderColor={colors.borderColor}>
        <HStack justify="space-between" wrap="wrap" gap={4}>
          <HStack gap={3}>
            <Box p={2} bg="blue.100" borderRadius="lg">
              <FiFileText size={24} color="var(--chakra-colors-blue-600)" />
            </Box>
            <Box>
              <Heading size="md" color={colors.textColor}>
                {t('regulatoryReporting.title', 'Entes de Control')}
              </Heading>
              <Text fontSize="sm" color={colors.textColorSecondary}>
                {t('regulatoryReporting.subtitle', 'Reporte de operaciones vigentes para entes reguladores')}
              </Text>
            </Box>
          </HStack>

          <HStack gap={2}>
            <Badge colorPalette="blue" fontSize="sm" px={3} py={1}>
              {pagination.totalItems} {t('regulatoryReporting.operations', 'operaciones')}
            </Badge>

            <IconButton
              aria-label={t('common.refresh')}
              onClick={fetchOperations}
              loading={loading}
              variant="outline"
            >
              <FiRefreshCw />
            </IconButton>

            <Button
              colorPalette="green"
              onClick={handleExport}
              loading={exporting}
            >
              <FiDownload />
              {t('regulatoryReporting.exportCSV', 'Exportar CSV')}
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Filters Toolbar */}
      <Box p={4} bg={colors.cardBg} borderBottom="1px" borderColor={colors.borderColor}>
        <Flex wrap="wrap" gap={4} align="center">
          {/* Global Search */}
          <Box position="relative" maxW="300px" flex="1" minW="200px">
            <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color={colors.textColorSecondary} zIndex={1}>
              <FiSearch size={14} />
            </Box>
            <Input
              placeholder={t('regulatoryReporting.searchPlaceholder', 'Buscar operación, cliente...')}
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              bg={colors.inputBg}
              pl={10}
            />
          </Box>

          {/* Active Filters Badge */}
          {activeFiltersCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              colorPalette="orange"
              onClick={() => {
                setGlobalSearch('');
                clearColumnFilters();
              }}
            >
              <FiX />
              {isSpanish ? `${activeFiltersCount} filtro(s)` : `${activeFiltersCount} filter(s)`}
            </Button>
          )}

          {/* Spacer */}
          <Box flex={1} />

          {/* Column Selector */}
          <ColumnSelector
            columns={COLUMN_DEFINITIONS}
            visibleColumns={visibleColumns}
            onColumnToggle={handleColumnToggle}
            onSelectCategory={handleSelectCategory}
            isSpanish={isSpanish}
          />
        </Flex>
      </Box>

      {/* Data Table */}
      <DataTable
        data={paginatedData}
        columns={COLUMN_DEFINITIONS}
        visibleColumns={visibleColumns}
        isSpanish={isSpanish}
        loading={loading}
        sortConfig={sortConfig}
        onSort={handleSort}
        columnFilters={columnFilters}
        onFilterChange={setColumnFilter}
        getUniqueValues={getUniqueValues}
        pagination={pagination}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </Box>
  );
};

export default RegulatoryReporting;
