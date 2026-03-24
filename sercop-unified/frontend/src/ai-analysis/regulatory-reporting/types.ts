/**
 * Types for Regulatory Reporting Module
 */

import type { Operation } from '../../types/operations';

export interface ColumnDefinition {
  key: string;
  label: string;
  labelEs: string;
  category: 'operation' | 'client' | 'bank' | 'amount' | 'dates' | 'other';
  defaultVisible: boolean;
  width: number; // Fixed width in pixels
  minWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'date' | 'number';
  format?: (value: unknown, row: Operation) => string;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface ColumnFilter {
  key: string;
  value: string;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250];

export const DEFAULT_PAGE_SIZE = 25;
