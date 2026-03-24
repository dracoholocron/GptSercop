import { Card, HStack, VStack, Text, IconButton, Box, Separator } from '@chakra-ui/react';
import type { DataTableColumn, DataTableAction } from './DataTableTypes';

interface DataTableMobileCardProps<T> {
  row: T;
  index: number;
  columns: DataTableColumn<T>[];
  actions?: DataTableAction<T>[];
  onRowClick?: (row: T) => void;
  colors: {
    cardBg: string;
    borderColor: string;
    textColor: string;
    textColorSecondary: string;
    hoverBg: string;
    primaryColor: string;
  };
}

export function DataTableMobileCard<T>({
  row,
  index,
  columns,
  actions,
  onRowClick,
  colors,
}: DataTableMobileCardProps<T>) {
  const visibleColumns = columns.filter((col) => !col.hideOnMobile);
  const visibleActions = actions?.filter((a) => !a.isHidden?.(row)) ?? [];

  // First column is the "title" of the card
  const [titleColumn, ...restColumns] = visibleColumns;

  return (
    <Card.Root
      bg={colors.cardBg}
      borderWidth="1px"
      borderColor={colors.borderColor}
      borderRadius="lg"
      overflow="hidden"
      cursor={onRowClick ? 'pointer' : 'default'}
      onClick={() => onRowClick?.(row)}
      _hover={onRowClick ? { borderColor: colors.primaryColor, shadow: 'md' } : {}}
      transition="all 0.2s"
      w="100%"
    >
      <Card.Body p={4}>
        <VStack align="stretch" gap={3}>
          {/* Title row - first column rendered prominently */}
          {titleColumn && (
            <Box>
              <Text fontSize="2xs" fontWeight="semibold" color={colors.textColorSecondary} textTransform="uppercase" letterSpacing="wider">
                {titleColumn.label}
              </Text>
              <Box fontWeight="bold" color={colors.textColor} fontSize="sm">
                {titleColumn.render
                  ? titleColumn.render(row, index)
                  : String((row as Record<string, unknown>)[titleColumn.key] ?? '-')}
              </Box>
            </Box>
          )}

          <Separator borderColor={colors.borderColor} />

          {/* Remaining columns as label/value pairs in a 2-column grid */}
          <Box
            display="grid"
            gridTemplateColumns="1fr 1fr"
            gap={3}
          >
            {restColumns.map((col) => (
              <Box key={col.key}>
                <Text fontSize="2xs" color={colors.textColorSecondary} fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" mb={0.5}>
                  {col.label}
                </Text>
                <Box fontSize="sm" color={colors.textColor}>
                  {col.render
                    ? col.render(row, index)
                    : String((row as Record<string, unknown>)[col.key] ?? '-')}
                </Box>
              </Box>
            ))}
          </Box>

          {/* Actions row */}
          {visibleActions.length > 0 && (
            <>
              <Separator borderColor={colors.borderColor} />
              <HStack gap={2} justify="flex-end">
                {visibleActions.map((action) => (
                  <IconButton
                    key={action.key}
                    aria-label={action.label}
                    size="sm"
                    variant="ghost"
                    colorPalette={action.colorPalette || 'gray'}
                    disabled={action.isDisabled?.(row)}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick(row);
                    }}
                    title={action.label}
                  >
                    <action.icon />
                  </IconButton>
                ))}
              </HStack>
            </>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
