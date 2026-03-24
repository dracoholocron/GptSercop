import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Table,
  Input,
  HStack,
  VStack,
  Text,
  IconButton,
  Spinner,
  Menu,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import {
  FiSearch,
  FiChevronUp,
  FiChevronDown,
  FiMinus,
  FiMoreVertical,
  FiX,
  FiInbox,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import type { DataTableProps, SortState } from './DataTableTypes';
import { DataTablePagination } from './DataTablePagination';
import { DataTableMobileCard } from './DataTableMobileCard';

export function DataTable<T>({
  data,
  columns,
  rowKey,
  actions,
  isLoading = false,
  emptyMessage,
  emptyIcon: EmptyIcon,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  pagination = 'client',
  serverPagination,
  defaultSort,
  onSortChange,
  searchable = true,
  searchPlaceholder,
  mobileBreakpoint = 'md',
  toolbarRight,
  onRowClick,
  size = 'sm',
  striped = false,
  resizable = true,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const { getColors, darkMode } = useTheme();
  const colors = getColors();

  // State
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortState | null>(defaultSort ?? null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // --- Column resize state ---
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    columns.forEach((col) => {
      if (col.width) initial[col.key] = col.width;
    });
    return initial;
  });
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, colKey: string, currentWidth: number) => {
      e.preventDefault();
      e.stopPropagation();
      resizingRef.current = { key: colKey, startX: e.clientX, startWidth: currentWidth };

      const handleMouseMove = (me: MouseEvent) => {
        if (!resizingRef.current) return;
        const delta = me.clientX - resizingRef.current.startX;
        const newWidth = Math.max(60, resizingRef.current.startWidth + delta);
        setColumnWidths((prev) => ({ ...prev, [resizingRef.current!.key]: newWidth }));
      };

      const handleMouseUp = () => {
        resizingRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [],
  );

  // --- Column filter handler ---
  const handleColumnFilter = useCallback((key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  }, []);

  // --- Sort handler ---
  const handleSort = useCallback(
    (field: string) => {
      setSort((prev) => {
        const next: SortState =
          prev?.field === field
            ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
            : { field, direction: 'asc' };
        onSortChange?.(next);
        return next;
      });
    },
    [onSortChange],
  );

  // --- Filter + sort + paginate data (client-side) ---
  const processedData = useMemo(() => {
    let result = [...data];

    // Global search
    if (globalSearch) {
      const searchLower = globalSearch.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const val = (row as Record<string, unknown>)[col.key];
          return val != null && String(val).toLowerCase().includes(searchLower);
        }),
      );
    }

    // Column filters (AND logic)
    const activeFilters = Object.entries(columnFilters).filter(([, v]) => v !== '');
    if (activeFilters.length > 0) {
      result = result.filter((row) =>
        activeFilters.every(([key, filterValue]) => {
          const col = columns.find((c) => c.key === key);
          const cellValue = (row as Record<string, unknown>)[key];
          if (cellValue == null) return false;

          if (col?.filterType === 'select') {
            return String(cellValue) === filterValue;
          }
          return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
        }),
      );
    }

    // Sorting
    if (sort) {
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sort.field];
        const bVal = (b as Record<string, unknown>)[sort.field];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // Try numeric comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // Date detection
        const aStr = String(aVal);
        const bStr = String(bVal);
        const aDate = Date.parse(aStr);
        const bDate = Date.parse(bStr);
        if (!isNaN(aDate) && !isNaN(bDate) && aStr.includes('-')) {
          return sort.direction === 'asc' ? aDate - bDate : bDate - aDate;
        }

        // String comparison
        return sort.direction === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return result;
  }, [data, globalSearch, columnFilters, sort, columns]);

  // Pagination
  const totalItems =
    pagination === 'server' ? (serverPagination?.totalItems ?? data.length) : processedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedData =
    pagination === 'client'
      ? processedData.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
      : processedData;

  const handlePageChange = (page: number) => {
    const safePage = Math.max(0, Math.min(page, totalPages - 1));
    setCurrentPage(safePage);
    serverPagination?.onPageChange?.(safePage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
    serverPagination?.onPageSizeChange?.(newSize);
  };

  // --- Sort icon ---
  const SortIndicator = ({ field }: { field: string }) => {
    if (sort?.field !== field) {
      return <FiMinus size={10} style={{ opacity: 0.3 }} />;
    }
    return sort.direction === 'asc' ? (
      <FiChevronUp size={12} />
    ) : (
      <FiChevronDown size={12} />
    );
  };

  // --- Visible actions logic ---
  const getVisibleActions = (row: T) => {
    if (!actions) return { inline: [], overflow: [] };
    const visible = actions.filter((a) => !a.isHidden?.(row));
    if (visible.length <= 2) return { inline: visible, overflow: [] };
    return { inline: visible.slice(0, 2), overflow: visible.slice(2) };
  };

  // --- Theme-aware colors ---
  const headerBg = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
  const headerBorderBottom = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const filterBg = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
  const rowHoverBg = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
  const stripedBg = darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)';
  const searchBg = darkMode ? 'rgba(255,255,255,0.06)' : 'white';
  const searchBorder = darkMode ? 'rgba(255,255,255,0.12)' : colors.borderColor;

  // Mobile display helpers
  const desktopDisplay = mobileBreakpoint === 'md'
    ? { base: 'none', md: 'block' }
    : { base: 'none', sm: 'block' };
  const mobileDisplay = mobileBreakpoint === 'md'
    ? { base: 'flex', md: 'none' }
    : { base: 'flex', sm: 'none' };

  // Active filter count for badge
  const activeFilterCount =
    Object.values(columnFilters).filter((v) => v !== '').length + (globalSearch ? 1 : 0);

  return (
    <Box>
      {/* ===== TOOLBAR ===== */}
      <HStack
        gap={3}
        mb={4}
        flexWrap="wrap"
        justify="space-between"
        align="center"
      >
        <HStack gap={3} flex={1} minW="200px" maxW="500px">
          {searchable && (
            <Box position="relative" flex={1}>
              <Box
                position="absolute"
                left="12px"
                top="50%"
                transform="translateY(-50%)"
                color={colors.textColorSecondary}
                zIndex={1}
              >
                <FiSearch size={14} />
              </Box>
              <Input
                placeholder={searchPlaceholder || t('dataTable.search', 'Buscar...')}
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setCurrentPage(0);
                }}
                size="sm"
                pl="36px"
                pr={globalSearch ? '32px' : '12px'}
                bg={searchBg}
                borderColor={searchBorder}
                color={colors.textColor}
                borderRadius="lg"
                _placeholder={{ color: colors.textColorSecondary }}
                _focus={{
                  borderColor: colors.primaryColor,
                  boxShadow: `0 0 0 1px ${colors.primaryColor}`,
                }}
              />
              {globalSearch && (
                <IconButton
                  aria-label="Clear search"
                  position="absolute"
                  right="4px"
                  top="50%"
                  transform="translateY(-50%)"
                  size="2xs"
                  variant="ghost"
                  onClick={() => {
                    setGlobalSearch('');
                    setCurrentPage(0);
                  }}
                  zIndex={1}
                >
                  <FiX size={12} />
                </IconButton>
              )}
            </Box>
          )}
        </HStack>
        <HStack gap={2}>
          {activeFilterCount > 0 && (
            <Text fontSize="xs" color={colors.primaryColor} fontWeight="medium">
              {activeFilterCount} {t('dataTable.activeFilters', 'filtro(s)')}
            </Text>
          )}
          {toolbarRight}
        </HStack>
      </HStack>

      {/* Results count */}
      <Text fontSize="xs" color={colors.textColorSecondary} mb={3}>
        {t('dataTable.showingResults', {
          defaultValue: 'Mostrando {{count}} de {{total}} resultados',
          count: pagination === 'client' ? processedData.length : totalItems,
          total: data.length,
        })}
      </Text>

      {/* ===== LOADING ===== */}
      {isLoading ? (
        <Box textAlign="center" py={12}>
          <Spinner size="lg" color={colors.primaryColor} />
          <Text mt={3} color={colors.textColorSecondary} fontSize="sm">
            {t('common.loading', 'Cargando...')}
          </Text>
        </Box>
      ) : paginatedData.length === 0 && processedData.length === 0 ? (
        /* ===== EMPTY STATE ===== */
        <Box textAlign="center" py={16}>
          <Box color={colors.textColorSecondary} mb={3} display="flex" justifyContent="center">
            {EmptyIcon ? <EmptyIcon size={48} /> : <FiInbox size={48} />}
          </Box>
          <Text color={colors.textColorSecondary} fontSize="md" fontWeight="medium">
            {emptyMessage || t('dataTable.noResults', 'No se encontraron resultados')}
          </Text>
          {activeFilterCount > 0 && (
            <Text
              fontSize="sm"
              color={colors.primaryColor}
              mt={2}
              cursor="pointer"
              _hover={{ textDecoration: 'underline' }}
              onClick={() => {
                setGlobalSearch('');
                setColumnFilters({});
                setCurrentPage(0);
              }}
            >
              {t('dataTable.clearFilters', 'Limpiar filtros')}
            </Text>
          )}
        </Box>
      ) : (
        <>
          {/* ===== DESKTOP TABLE ===== */}
          <Box
            display={desktopDisplay}
            overflowX="auto"
            borderRadius="xl"
            borderWidth="1px"
            borderColor={colors.borderColor}
            bg={colors.cardBg}
            shadow="sm"
          >
            <Table.Root size={size} variant="line" css={resizable ? { tableLayout: 'fixed', width: '100%' } : undefined}>
              <Table.Header>
                <Table.Row>
                  {columns.map((col) => {
                    const isSortable = col.sortable !== false;
                    const isFilterable = col.filterable !== false;
                    const isActive = sort?.field === col.key;
                    const colResizable = resizable && col.resizable !== false;
                    const colWidth = columnWidths[col.key];

                    return (
                      <Table.ColumnHeader
                        key={col.key}
                        textAlign={col.align || 'left'}
                        minW={col.minWidth}
                        w={colWidth ? `${colWidth}px` : undefined}
                        p={0}
                        bg={headerBg}
                        borderBottom={`2px solid ${headerBorderBottom}`}
                        verticalAlign="top"
                        position="relative"
                      >
                        <VStack gap={0} align="stretch">
                          {/* Header label + sort */}
                          <HStack
                            px={3}
                            py={2.5}
                            gap={1}
                            cursor={isSortable ? 'pointer' : 'default'}
                            onClick={() => isSortable && handleSort(col.key)}
                            _hover={
                              isSortable
                                ? { bg: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }
                                : {}
                            }
                            borderRadius="sm"
                            transition="background 0.15s"
                            userSelect="none"
                          >
                            <Text
                              fontSize="xs"
                              fontWeight="bold"
                              textTransform="uppercase"
                              letterSpacing="wider"
                              color={isActive ? colors.primaryColor : colors.textColorSecondary}
                              transition="color 0.15s"
                              overflow="hidden"
                              textOverflow="ellipsis"
                              whiteSpace="nowrap"
                            >
                              {col.label}
                            </Text>
                            {isSortable && (
                              <Box color={isActive ? colors.primaryColor : colors.textColorSecondary}>
                                <SortIndicator field={col.key} />
                              </Box>
                            )}
                          </HStack>

                          {/* Column filter */}
                          {isFilterable && (
                            <Box px={2} pb={2}>
                              {col.filterType === 'select' ? (
                                <NativeSelectRoot size="xs">
                                  <NativeSelectField
                                    value={columnFilters[col.key] || ''}
                                    onChange={(e) => handleColumnFilter(col.key, e.target.value)}
                                    bg={filterBg}
                                    borderColor="transparent"
                                    color={colors.textColor}
                                    fontSize="xs"
                                    borderRadius="md"
                                    _focus={{ borderColor: colors.primaryColor }}
                                  >
                                    <option value="">
                                      {t('dataTable.all', 'Todos')}
                                    </option>
                                    {col.filterOptions?.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </NativeSelectField>
                                </NativeSelectRoot>
                              ) : (
                                <Input
                                  size="xs"
                                  placeholder={t('dataTable.filter', 'Filtrar...')}
                                  value={columnFilters[col.key] || ''}
                                  onChange={(e) => handleColumnFilter(col.key, e.target.value)}
                                  bg={filterBg}
                                  borderColor="transparent"
                                  color={colors.textColor}
                                  fontSize="xs"
                                  borderRadius="md"
                                  _placeholder={{ color: colors.textColorSecondary, fontSize: 'xs' }}
                                  _focus={{ borderColor: colors.primaryColor, bg: searchBg }}
                                />
                              )}
                            </Box>
                          )}
                        </VStack>
                        {/* Resize handle */}
                        {colResizable && (
                          <Box
                            position="absolute"
                            right={0}
                            top={0}
                            bottom={0}
                            w="6px"
                            cursor="col-resize"
                            zIndex={2}
                            onMouseDown={(e) => {
                              const th = (e.target as HTMLElement).closest('th');
                              handleResizeStart(e, col.key, th?.offsetWidth ?? 120);
                            }}
                            _hover={{ bg: colors.primaryColor, opacity: 0.4 }}
                            transition="background 0.15s"
                          />
                        )}
                      </Table.ColumnHeader>
                    );
                  })}

                  {/* Actions column header (sticky right) */}
                  {actions && actions.length > 0 && (
                    <Table.ColumnHeader
                      textAlign="center"
                      bg={colors.cardBg}
                      borderBottom={`2px solid ${headerBorderBottom}`}
                      px={3}
                      py={2.5}
                      position="sticky"
                      right={0}
                      zIndex={1}
                      boxShadow={`-3px 0 6px -2px ${darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)'}`}
                    >
                      <Text
                        fontSize="xs"
                        fontWeight="bold"
                        textTransform="uppercase"
                        letterSpacing="wider"
                        color={colors.textColorSecondary}
                      >
                        {t('common.acciones', 'Acciones')}
                      </Text>
                    </Table.ColumnHeader>
                  )}
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {paginatedData.map((row, rowIndex) => {
                  const { inline, overflow } = getVisibleActions(row);
                  const isStriped = striped && rowIndex % 2 === 1;

                  return (
                    <Table.Row
                      key={rowKey(row)}
                      _hover={{ bg: rowHoverBg }}
                      bg={isStriped ? stripedBg : 'transparent'}
                      cursor={onRowClick ? 'pointer' : 'default'}
                      onClick={() => onRowClick?.(row)}
                      transition="background 0.15s"
                    >
                      {columns.map((col) => (
                        <Table.Cell
                          key={col.key}
                          textAlign={col.align || 'left'}
                          color={colors.textColor}
                          fontSize="sm"
                          py={2.5}
                          px={3}
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                          maxW={columnWidths[col.key] ? `${columnWidths[col.key]}px` : undefined}
                        >
                          {col.render
                            ? col.render(row, rowIndex + currentPage * pageSize)
                            : String((row as Record<string, unknown>)[col.key] ?? '-')}
                        </Table.Cell>
                      ))}

                      {/* Actions cell (sticky right) */}
                      {actions && actions.length > 0 && (
                        <Table.Cell
                          textAlign="center"
                          py={2}
                          px={2}
                          position="sticky"
                          right={0}
                          bg={isStriped ? colors.cardBg : colors.cardBg}
                          zIndex={1}
                          boxShadow={`-3px 0 6px -2px ${darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)'}`}
                        >
                          <HStack gap={1} justify="center">
                            {inline.map((action) => (
                              <IconButton
                                key={action.key}
                                aria-label={action.label}
                                size="xs"
                                variant="ghost"
                                colorPalette={action.colorPalette || 'gray'}
                                disabled={action.isDisabled?.(row)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.onClick(row);
                                }}
                                title={action.label}
                                borderRadius="md"
                              >
                                <action.icon />
                              </IconButton>
                            ))}
                            {overflow.length > 0 && (
                              <Menu.Root>
                                <Menu.Trigger asChild>
                                  <IconButton
                                    aria-label="More actions"
                                    size="xs"
                                    variant="ghost"
                                    onClick={(e) => e.stopPropagation()}
                                    borderRadius="md"
                                  >
                                    <FiMoreVertical />
                                  </IconButton>
                                </Menu.Trigger>
                                <Menu.Content
                                  bg={colors.cardBg}
                                  borderColor={colors.borderColor}
                                  shadow="lg"
                                  borderRadius="lg"
                                >
                                  {overflow.map((action) => (
                                    <Menu.Item
                                      key={action.key}
                                      value={action.key}
                                      onClick={() => action.onClick(row)}
                                      disabled={action.isDisabled?.(row)}
                                      color={colors.textColor}
                                      _hover={{ bg: rowHoverBg }}
                                      fontSize="sm"
                                    >
                                      <action.icon style={{ marginRight: 8 }} />
                                      {action.label}
                                    </Menu.Item>
                                  ))}
                                </Menu.Content>
                              </Menu.Root>
                            )}
                          </HStack>
                        </Table.Cell>
                      )}
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Box>

          {/* ===== MOBILE CARDS ===== */}
          <VStack display={mobileDisplay} gap={3} align="stretch">
            {paginatedData.map((row, index) => (
              <DataTableMobileCard
                key={rowKey(row)}
                row={row}
                index={index + currentPage * pageSize}
                columns={columns}
                actions={actions}
                onRowClick={onRowClick}
                colors={colors}
              />
            ))}
          </VStack>

          {/* ===== PAGINATION ===== */}
          {pagination !== 'none' && (
            <DataTablePagination
              currentPage={pagination === 'server' ? (serverPagination?.currentPage ?? 0) : currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              pageSizeOptions={pageSizeOptions}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              colors={colors}
            />
          )}
        </>
      )}
    </Box>
  );
}
