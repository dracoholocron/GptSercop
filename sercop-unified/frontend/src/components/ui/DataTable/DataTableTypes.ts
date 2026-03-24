import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select';
  filterOptions?: { value: string; label: string }[];
  render?: (row: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
  minWidth?: string;
  width?: number;
  resizable?: boolean;
}

export interface DataTableAction<T> {
  key: string;
  label: string;
  icon: React.ElementType;
  onClick: (row: T) => void;
  colorPalette?: string;
  isDisabled?: (row: T) => boolean;
  isHidden?: (row: T) => boolean;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ServerPaginationProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string | number;
  actions?: DataTableAction<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ElementType;
  // Pagination
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  pagination?: 'client' | 'server' | 'none';
  serverPagination?: ServerPaginationProps;
  // Sorting
  defaultSort?: SortState;
  onSortChange?: (sort: SortState) => void;
  // Global search
  searchable?: boolean;
  searchPlaceholder?: string;
  // Mobile
  mobileBreakpoint?: 'sm' | 'md';
  // Toolbar
  toolbarRight?: ReactNode;
  // Row click
  onRowClick?: (row: T) => void;
  // Table size
  size?: 'sm' | 'md';
  // Striped rows
  striped?: boolean;
  // Column resizing
  resizable?: boolean;
}
