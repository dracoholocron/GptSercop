import { HStack, IconButton, Button, Text, Flex, Box } from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  colors: {
    textColor: string;
    textColorSecondary: string;
    primaryColor: string;
    bgColor: string;
    borderColor: string;
    cardBg: string;
  };
}

export const DataTablePagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  colors,
}: DataTablePaginationProps) => {
  const { t } = useTranslation();

  if (totalPages <= 1 && totalItems <= pageSizeOptions[0]) return null;

  const startItem = totalItems > 0 ? currentPage * pageSize + 1 : 0;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);

  const isFirst = currentPage === 0;
  const isLast = currentPage >= totalPages - 1;

  // Build sliding window of page numbers
  const getPageNumbers = (): number[] => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    if (currentPage < 3) {
      return Array.from({ length: maxVisible }, (_, i) => i);
    }
    if (currentPage > totalPages - 4) {
      return Array.from({ length: maxVisible }, (_, i) => totalPages - maxVisible + i);
    }
    return Array.from({ length: maxVisible }, (_, i) => currentPage - 2 + i);
  };

  return (
    <Flex
      justify="space-between"
      align="center"
      flexWrap="wrap"
      gap={3}
      pt={4}
      pb={2}
      px={1}
    >
      {/* Page size selector */}
      <HStack gap={2}>
        <Text fontSize="xs" color={colors.textColorSecondary} whiteSpace="nowrap">
          {t('dataTable.rowsPerPage', 'Filas por página')}
        </Text>
        <NativeSelectRoot size="xs" w="70px">
          <NativeSelectField
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            bg={colors.cardBg}
            borderColor={colors.borderColor}
            color={colors.textColor}
            fontSize="xs"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </NativeSelectField>
        </NativeSelectRoot>
      </HStack>

      {/* Showing X-Y of Z */}
      <Text fontSize="xs" color={colors.textColorSecondary} whiteSpace="nowrap">
        {t('dataTable.showing', 'Mostrando')} {startItem}-{endItem} {t('dataTable.of', 'de')} {totalItems}
      </Text>

      {/* Page navigation */}
      <HStack gap={1}>
        <IconButton
          aria-label={t('dataTable.firstPage', 'Primera página')}
          size="xs"
          variant="ghost"
          onClick={() => onPageChange(0)}
          disabled={isFirst}
          color={colors.textColor}
        >
          <FiChevronsLeft />
        </IconButton>
        <IconButton
          aria-label={t('dataTable.previousPage', 'Página anterior')}
          size="xs"
          variant="ghost"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirst}
          color={colors.textColor}
        >
          <FiChevronLeft />
        </IconButton>

        <HStack gap={0.5} display={{ base: 'none', sm: 'flex' }}>
          {getPageNumbers().map((pageNum) => (
            <Button
              key={pageNum}
              size="xs"
              variant={pageNum === currentPage ? 'solid' : 'ghost'}
              bg={pageNum === currentPage ? colors.primaryColor : 'transparent'}
              color={pageNum === currentPage ? 'white' : colors.textColor}
              _hover={{
                bg: pageNum === currentPage ? colors.primaryColor : colors.borderColor,
              }}
              onClick={() => onPageChange(pageNum)}
              minW="28px"
              h="28px"
              borderRadius="md"
              fontWeight={pageNum === currentPage ? 'bold' : 'normal'}
              fontSize="xs"
            >
              {pageNum + 1}
            </Button>
          ))}
        </HStack>

        {/* Mobile: just show "Page X of Y" */}
        <Box display={{ base: 'block', sm: 'none' }}>
          <Text fontSize="xs" color={colors.textColor} fontWeight="medium" px={2}>
            {currentPage + 1} / {totalPages}
          </Text>
        </Box>

        <IconButton
          aria-label={t('dataTable.nextPage', 'Página siguiente')}
          size="xs"
          variant="ghost"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLast}
          color={colors.textColor}
        >
          <FiChevronRight />
        </IconButton>
        <IconButton
          aria-label={t('dataTable.lastPage', 'Última página')}
          size="xs"
          variant="ghost"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={isLast}
          color={colors.textColor}
        >
          <FiChevronsRight />
        </IconButton>
      </HStack>
    </Flex>
  );
};
