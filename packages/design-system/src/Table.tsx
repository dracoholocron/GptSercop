import type { ReactNode } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyState?: ReactNode;
  className?: string;
  /** Column keys that can be sorted; requires onSort */
  sortableColumns?: string[];
  /** Current sort key (if any) */
  sortBy?: string;
  /** Current sort direction */
  sortOrder?: SortDirection;
  /** Called when user clicks a sortable header */
  onSort?: (key: string, direction: SortDirection) => void;
  /** Keep header visible when scrolling */
  stickyHeader?: boolean;
}

function SortIcon({ direction }: { direction?: SortDirection }) {
  if (!direction) return <span className="ml-1 inline-block w-4 opacity-40">↕</span>;
  return <span className="ml-1">{direction === 'asc' ? '↑' : '↓'}</span>;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  emptyState = 'No hay datos',
  className = '',
  sortableColumns,
  sortBy,
  sortOrder,
  onSort,
  stickyHeader = false,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div
        className={`rounded border border-neutral-200 bg-white p-8 text-center text-neutral-500 ${className}`}
      >
        {emptyState}
      </div>
    );
  }

  const theadClass = stickyHeader
    ? 'sticky top-0 z-10 bg-neutral-50 shadow-sm'
    : 'bg-neutral-50';

  return (
    <div className={`overflow-x-auto rounded border border-neutral-200 ${className}`}>
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className={theadClass}>
          <tr>
            {columns.map((col) => {
              const isSortable = sortableColumns?.includes(col.key) && onSort;
              const currentDir = sortBy === col.key ? sortOrder : undefined;
              return (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 ${col.className || ''}`}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      className="flex items-center hover:text-text-primary"
                      onClick={() => {
                        const next = currentDir === 'asc' ? 'desc' : 'asc';
                        onSort(col.key, next);
                      }}
                    >
                      {col.header}
                      <SortIcon direction={currentDir} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {data.map((row) => (
            <tr key={keyExtractor(row)} className="hover:bg-neutral-50">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-sm text-text-primary ${col.className || ''}`}
                >
                  {col.render ? col.render(row) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
