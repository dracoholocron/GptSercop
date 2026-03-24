/**
 * ExpandableStatCard Component
 * Stat card with expand/maximize functionality to show operation details
 */

import { useState } from 'react';
import {
  Box,
  Text,
  HStack,
  VStack,
  Badge,
  IconButton,
  Portal,
  Card,
} from '@chakra-ui/react';
import { FiMaximize2, FiX, FiEye, FiMessageSquare, FiActivity } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { Operation } from '../../types/operations';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/DataTable';

interface ExpandableStatCardProps {
  title: string;
  count: number;
  subtitle?: string;
  icon: React.ReactNode;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  isGradient?: boolean;
  gradientColors?: string;
  operations?: Operation[];
  onViewDetails?: (operation: Operation) => void;
  onViewMessages?: (operation: Operation) => void;
  onExecuteEvent?: (operation: Operation) => void;
  /** Extra content to show in expanded view */
  extraContent?: React.ReactNode;
  /** Currency amounts breakdown */
  amountsByCurrency?: Record<string, number>;
}

export const ExpandableStatCard = ({
  title,
  count,
  subtitle,
  icon,
  bgColor,
  textColor = 'white',
  borderColor,
  isGradient = false,
  gradientColors,
  operations = [],
  onViewDetails,
  onViewMessages,
  onExecuteEvent,
  extraContent,
  amountsByCurrency,
}: ExpandableStatCardProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const [isMaximized, setIsMaximized] = useState(false);

  const handleOpen = () => {
    setIsMaximized(true);
  };

  const formatAmount = (amount?: number, currency?: string): string => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date?: string): string => {
    if (!date) return '-';
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const cardBg = isGradient && gradientColors ? gradientColors : bgColor || colors.cardBg;
  const cardTextColor = bgColor || isGradient ? textColor : colors.textColor;
  const showExpandButton = operations.length > 0 || amountsByCurrency || extraContent;

  // ─── DataTable columns for the expanded modal ──────────────
  const operationColumns: DataTableColumn<Operation>[] = [
    {
      key: 'reference',
      label: t('operations.reference', 'Referencia'),
      render: (row) => (
        <HStack>
          <Text fontWeight="medium" color={colors.textColor} fontSize="sm">
            {row.reference}
          </Text>
          <Badge size="sm" colorPalette="purple">
            {row.messageType}
          </Badge>
        </HStack>
      ),
    },
    {
      key: 'applicantName',
      label: t('operations.applicant', 'Ordenante'),
      hideOnMobile: true,
      render: (row) => (
        <Text fontSize="sm" color={colors.textColor} maxW="200px" truncate>
          {row.applicantName || '-'}
        </Text>
      ),
    },
    {
      key: 'beneficiaryName',
      label: t('operations.beneficiary', 'Beneficiario'),
      hideOnMobile: true,
      render: (row) => (
        <Text fontSize="sm" color={colors.textColor} maxW="200px" truncate>
          {row.beneficiaryName || '-'}
        </Text>
      ),
    },
    {
      key: 'amount',
      label: t('operations.amount', 'Monto'),
      align: 'right',
      render: (row) => (
        <Text fontWeight="semibold" color={colors.textColor} fontSize="sm">
          {formatAmount(row.amount, row.currency)}
        </Text>
      ),
    },
    {
      key: 'expiryDate',
      label: t('operations.expiryDate', 'Vencimiento'),
      align: 'center',
      hideOnMobile: true,
      render: (row) => <Text fontSize="sm" color={colors.textColor}>{formatDate(row.expiryDate)}</Text>,
    },
    {
      key: 'stage',
      label: t('operations.stage', 'Etapa'),
      align: 'center',
      filterType: 'select',
      filterOptions: (() => {
        const stages = new Set<string>();
        operations.forEach(op => stages.add(op.stage));
        return Array.from(stages).sort().map(s => ({
          value: s,
          label: t(`operations.stages.${s}`, s),
        }));
      })(),
      render: (row) => (
        <Badge
          colorPalette={
            row.stage === 'EXPIRED' ? 'red' :
            row.stage === 'CANCELLED' ? 'gray' :
            row.stage === 'ISSUED' ? 'blue' :
            row.stage === 'CONFIRMED' ? 'green' : 'cyan'
          }
          size="sm"
        >
          {t(`operations.stages.${row.stage}`)}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: t('operations.status', 'Estado'),
      align: 'center',
      filterType: 'select',
      filterOptions: (() => {
        const statuses = new Set<string>();
        operations.forEach(op => statuses.add(op.status));
        return Array.from(statuses).sort().map(s => ({
          value: s,
          label: t(`operations.statuses.${s}`, s),
        }));
      })(),
      render: (row) => (
        <Badge
          variant="outline"
          colorPalette={
            row.status === 'ACTIVE' ? 'green' :
            row.status === 'PENDING_RESPONSE' ? 'orange' :
            row.status === 'ON_HOLD' ? 'gray' : 'blue'
          }
          size="sm"
        >
          {t(`operations.statuses.${row.status}`)}
        </Badge>
      ),
    },
  ];

  // ─── DataTable actions ─────────────────────────────────────
  const operationActions: DataTableAction<Operation>[] = [
    ...(onViewDetails ? [{
      key: 'viewDetails',
      label: t('operations.viewDetails', 'Ver Detalles'),
      icon: FiEye,
      onClick: (row: Operation) => {
        setIsMaximized(false);
        onViewDetails(row);
      },
    }] : []),
    ...(onViewMessages ? [{
      key: 'viewMessages',
      label: t('operations.viewMessages', 'Ver Mensajes'),
      icon: FiMessageSquare,
      onClick: (row: Operation) => {
        setIsMaximized(false);
        onViewMessages(row);
      },
    }] : []),
    ...(onExecuteEvent ? [{
      key: 'executeEvent',
      label: t('operations.executeEvent', 'Ejecutar Evento'),
      icon: FiActivity,
      colorPalette: 'green',
      onClick: (row: Operation) => {
        setIsMaximized(false);
        onExecuteEvent(row);
      },
    }] : []),
  ];

  return (
    <>
      <Card.Root
        bg={cardBg}
        color={cardTextColor}
        borderWidth={borderColor ? '1px' : undefined}
        borderColor={borderColor}
        shadow="md"
        borderRadius="xl"
        position="relative"
        overflow="hidden"
      >
        {isGradient && (
          <Box
            position="absolute"
            top="-20px"
            right="-20px"
            width="80px"
            height="80px"
            borderRadius="50%"
            bg="rgba(255,255,255,0.1)"
          />
        )}
        <Card.Body p={4}>
          <VStack align="start" gap={1}>
            <HStack justify="space-between" width="100%">
              <HStack>
                {icon}
                <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
                  {title}
                </Text>
              </HStack>
              {showExpandButton && (
                <IconButton
                  aria-label="Expandir"
                  size="xs"
                  variant="ghost"
                  color={cardTextColor}
                  opacity={0.7}
                  _hover={{ opacity: 1, bg: 'whiteAlpha.200' }}
                  onClick={handleOpen}
                >
                  <FiMaximize2 size={14} />
                </IconButton>
              )}
            </HStack>
            <Text fontSize="3xl" fontWeight="bold">
              {count}
            </Text>
            {subtitle && (
              <Text fontSize="xs" opacity={0.9}>
                {subtitle}
              </Text>
            )}
            {amountsByCurrency && Object.keys(amountsByCurrency).length > 0 && (
              <VStack align="start" gap={0} width="100%" mt={1}>
                {Object.entries(amountsByCurrency)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([currency, amount]) => (
                    <HStack key={currency} justify="space-between" width="100%">
                      <Text fontSize="xs" opacity={0.8}>{currency}</Text>
                      <Text fontSize="sm" fontWeight="bold">
                        {new Intl.NumberFormat('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(amount)}
                      </Text>
                    </HStack>
                  ))}
                {Object.keys(amountsByCurrency).length > 3 && (
                  <Text fontSize="xs" opacity={0.7}>
                    +{Object.keys(amountsByCurrency).length - 3} más
                  </Text>
                )}
              </VStack>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Maximized View */}
      {isMaximized && (
        <Portal>
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg={isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)'}
            zIndex={1000}
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={4}
            onClick={() => setIsMaximized(false)}
          >
            <Box
              bg={isDark ? 'gray.900' : 'white'}
              borderRadius="xl"
              maxW="1200px"
              w="100%"
              maxH="90vh"
              overflowY="auto"
              p={6}
              onClick={(e) => e.stopPropagation()}
              boxShadow="2xl"
            >
              {/* Header */}
              <HStack justify="space-between" align="center" mb={6}>
                <HStack gap={3}>
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg={isGradient && gradientColors ? gradientColors : bgColor || colors.primaryColor}
                    color="white"
                  >
                    {icon}
                  </Box>
                  <VStack align="start" gap={0}>
                    <Text fontSize="xl" fontWeight="bold" color={colors.textColor}>
                      {title}
                    </Text>
                    {subtitle && (
                      <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
                        {subtitle}
                      </Text>
                    )}
                  </VStack>
                </HStack>
                <HStack gap={3}>
                  <Badge colorPalette="blue" variant="subtle" fontSize="lg" px={4} py={2}>
                    {count} {t('operations.operations', 'operaciones')}
                  </Badge>
                  <IconButton
                    aria-label="Cerrar"
                    size="md"
                    variant="ghost"
                    onClick={() => setIsMaximized(false)}
                  >
                    <FiX />
                  </IconButton>
                </HStack>
              </HStack>

              {/* Currency Breakdown if available */}
              {amountsByCurrency && Object.keys(amountsByCurrency).length > 0 && (
                <Box mb={6}>
                  <Text fontSize="md" fontWeight="semibold" color={colors.textColor} mb={3}>
                    {t('operations.expiry.amountsByCurrency', 'Montos por Moneda')}
                  </Text>
                  <HStack gap={4} flexWrap="wrap">
                    {Object.entries(amountsByCurrency)
                      .sort((a, b) => b[1] - a[1])
                      .map(([currency, amount]) => (
                        <Box
                          key={currency}
                          p={3}
                          borderRadius="lg"
                          bg={isDark ? 'whiteAlpha.100' : 'gray.50'}
                          borderWidth="1px"
                          borderColor={colors.borderColor}
                        >
                          <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
                            {currency}
                          </Text>
                          <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
                            {formatAmount(amount, currency)}
                          </Text>
                        </Box>
                      ))}
                  </HStack>
                </Box>
              )}

              {/* Extra Content */}
              {extraContent}

              {/* Operations Table - Now using DataTable */}
              {operations.length > 0 && (
                <DataTable<Operation>
                  data={operations}
                  columns={operationColumns}
                  rowKey={(row) => row.operationId}
                  actions={operationActions}
                  defaultPageSize={10}
                  pageSizeOptions={[5, 10, 20, 50]}
                  defaultSort={{ field: 'expiryDate', direction: 'asc' }}
                  searchPlaceholder={t('operations.filter', 'Buscar operaciones...')}
                  striped
                />
              )}

              {operations.length === 0 && !amountsByCurrency && !extraContent && (
                <Box textAlign="center" py={8}>
                  <Text color={colors.textColor} opacity={0.5}>
                    {t('operations.noOperations', 'No hay operaciones en esta categoría')}
                  </Text>
                </Box>
              )}
            </Box>
          </Box>
        </Portal>
      )}
    </>
  );
};

export default ExpandableStatCard;
