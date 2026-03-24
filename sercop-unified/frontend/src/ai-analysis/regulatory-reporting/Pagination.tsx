/**
 * Pagination component for Regulatory Reporting
 */

import {
  HStack,
  Button,
  Text,
  IconButton,
  NativeSelect,
} from '@chakra-ui/react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import type { PaginationConfig } from './types';
import { PAGE_SIZE_OPTIONS } from './types';

interface PaginationProps {
  pagination: PaginationConfig;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isSpanish: boolean;
}

export const Pagination = ({
  pagination,
  onPageChange,
  onPageSizeChange,
  isSpanish,
}: PaginationProps) => {
  const { getColors } = useTheme();
  const colors = getColors();
  const { page, pageSize, totalItems, totalPages } = pagination;

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <HStack
      justify="space-between"
      align="center"
      p={3}
      bg={colors.cardBg}
      borderTop="1px solid"
      borderColor={colors.borderColor}
      wrap="wrap"
      gap={4}
    >
      {/* Items per page */}
      <HStack gap={2}>
        <Text fontSize="sm" color={colors.textColorSecondary} whiteSpace="nowrap">
          {isSpanish ? 'Mostrar' : 'Show'}
        </Text>
        <NativeSelect.Root size="sm" width="80px">
          <NativeSelect.Field
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
        <Text fontSize="sm" color={colors.textColorSecondary} whiteSpace="nowrap">
          {isSpanish ? 'por página' : 'per page'}
        </Text>
      </HStack>

      {/* Info */}
      <Text fontSize="sm" color={colors.textColorSecondary}>
        {isSpanish
          ? `Mostrando ${startItem}-${endItem} de ${totalItems}`
          : `Showing ${startItem}-${endItem} of ${totalItems}`
        }
      </Text>

      {/* Page navigation */}
      <HStack gap={1}>
        {/* First page */}
        <IconButton
          aria-label="First page"
          size="sm"
          variant="ghost"
          disabled={page === 1}
          onClick={() => onPageChange(1)}
        >
          <FiChevronsLeft />
        </IconButton>

        {/* Previous page */}
        <IconButton
          aria-label="Previous page"
          size="sm"
          variant="ghost"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <FiChevronLeft />
        </IconButton>

        {/* Page numbers */}
        <HStack gap={1}>
          {getPageNumbers().map((pageNum, idx) => (
            pageNum === 'ellipsis' ? (
              <Text key={`ellipsis-${idx}`} px={2} color={colors.textColorSecondary}>...</Text>
            ) : (
              <Button
                key={pageNum}
                size="sm"
                variant={page === pageNum ? 'solid' : 'ghost'}
                colorPalette={page === pageNum ? 'blue' : 'gray'}
                onClick={() => onPageChange(pageNum)}
                minW="36px"
              >
                {pageNum}
              </Button>
            )
          ))}
        </HStack>

        {/* Next page */}
        <IconButton
          aria-label="Next page"
          size="sm"
          variant="ghost"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <FiChevronRight />
        </IconButton>

        {/* Last page */}
        <IconButton
          aria-label="Last page"
          size="sm"
          variant="ghost"
          disabled={page === totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          <FiChevronsRight />
        </IconButton>
      </HStack>
    </HStack>
  );
};
