/**
 * PeriodSummary Component
 * Widget showing period summary with product breakdown
 */

import { useState } from 'react';
import { Box, Text, HStack, VStack, Badge, IconButton, Portal, Progress } from '@chakra-ui/react';
import { FiPieChart, FiMaximize2, FiX, FiDollarSign, FiActivity, FiUsers, FiClock, FiAlertTriangle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { KPICard, ProductComparison } from '../../types/dashboard';

interface PeriodSummaryProps {
  volumeByC: KPICard[];
  operationsByC: KPICard[];
  clientsByC: KPICard[];
  pendingApprovals: KPICard;
  operationsWithAlerts: KPICard;
  productComparison: ProductComparison[];
  periodLabel: string;
}

const PRODUCT_COLORS: Record<string, string> = {
  LC_IMPORT: 'blue',
  LC_EXPORT: 'green',
  GUARANTEE: 'purple',
  STANDBY_LC: 'orange',
  COLLECTION: 'pink',
};

export const PeriodSummary = ({
  volumeByC,
  operationsByC,
  clientsByC,
  pendingApprovals,
  operationsWithAlerts,
  productComparison,
  periodLabel,
}: PeriodSummaryProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const [isMaximized, setIsMaximized] = useState(false);

  const formatVolume = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const containerStyles = {
    p: 5,
    borderRadius: 'xl',
    bg: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    borderWidth: '1px',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)',
  };

  const renderHeader = (showClose: boolean = false) => (
    <HStack justify="space-between" align="center" mb={4}>
      <HStack>
        <FiPieChart size={20} color={colors.primaryColor} />
        <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
          {t('businessDashboard.periodSummary', 'Resumen del Período')}
        </Text>
      </HStack>
      <HStack gap={2}>
        <Badge colorPalette="blue" variant="subtle">
          {periodLabel}
        </Badge>
        {showClose ? (
          <IconButton
            aria-label="Cerrar"
            size="sm"
            variant="ghost"
            bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
            _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
            onClick={() => setIsMaximized(false)}
          >
            <FiX />
          </IconButton>
        ) : (
          <IconButton
            aria-label="Expandir"
            size="sm"
            variant="ghost"
            bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
            _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100' }}
            onClick={() => setIsMaximized(true)}
          >
            <FiMaximize2 />
          </IconButton>
        )}
      </HStack>
    </HStack>
  );

  const renderKPISummary = () => (
    <VStack gap={3} align="stretch">
      {/* Volume by Currency - Compact */}
      {volumeByC && volumeByC.length > 0 && (
        <Box>
          <HStack mb={2}>
            <FiDollarSign size={16} color={colors.primaryColor} />
            <Text color={colors.textColor} opacity={0.7}>Volumen:</Text>
          </HStack>
          <VStack gap={1} align="stretch" pl={6}>
            {volumeByC.map((vol, index) => (
              <HStack key={`period-vol-${vol.currency || 'unknown'}-${index}`} justify="space-between">
                <Text fontSize="sm" color={colors.textColor} opacity={0.7}>{vol.currency}:</Text>
                <Text fontSize="sm" fontWeight="bold" color={colors.textColor}>
                  {vol.formattedValue?.replace(` ${vol.currency}`, '')}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
      {/* Operations by Currency - Compact */}
      {operationsByC && operationsByC.length > 0 && (
        <Box>
          <HStack mb={2}>
            <FiActivity size={16} color="#10B981" />
            <Text color={colors.textColor} opacity={0.7}>Operaciones:</Text>
          </HStack>
          <VStack gap={1} align="stretch" pl={6}>
            {operationsByC.map((op, index) => (
              <HStack key={`period-op-${op.currency || 'unknown'}-${index}`} justify="space-between">
                <Text fontSize="sm" color={colors.textColor} opacity={0.7}>{op.currency}:</Text>
                <Text fontSize="sm" fontWeight="bold" color={colors.textColor}>
                  {op.formattedValue}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
      {/* Clients by Currency - Compact */}
      {clientsByC && clientsByC.length > 0 && (
        <Box>
          <HStack mb={2}>
            <FiUsers size={16} color="#8B5CF6" />
            <Text color={colors.textColor} opacity={0.7}>Clientes Activos:</Text>
          </HStack>
          <VStack gap={1} align="stretch" pl={6}>
            {clientsByC.map((client, index) => (
              <HStack key={`period-client-${client.currency || 'unknown'}-${index}`} justify="space-between">
                <Text fontSize="sm" color={colors.textColor} opacity={0.7}>{client.currency}:</Text>
                <Text fontSize="sm" fontWeight="bold" color={colors.textColor}>
                  {client.formattedValue}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
      <HStack justify="space-between">
        <HStack>
          <FiClock size={16} color="#F59E0B" />
          <Text color={colors.textColor} opacity={0.7}>Pendientes:</Text>
        </HStack>
        <Text fontWeight="bold" color="orange.500">
          {pendingApprovals.formattedValue}
        </Text>
      </HStack>
      <HStack justify="space-between">
        <HStack>
          <FiAlertTriangle size={16} color="#EF4444" />
          <Text color={colors.textColor} opacity={0.7}>Con Alertas:</Text>
        </HStack>
        <Text fontWeight="bold" color="red.500">
          {operationsWithAlerts.formattedValue}
        </Text>
      </HStack>
    </VStack>
  );

  const renderProductBreakdown = () => {
    const maxVolume = Math.max(...productComparison.map(p => p.totalVolume), 1);
    const totalVolume = productComparison.reduce((sum, p) => sum + p.totalVolume, 0);

    return (
      <VStack gap={3} align="stretch">
        <Text fontSize="md" fontWeight="semibold" color={colors.textColor}>
          Distribución por Producto
        </Text>
        {productComparison.map((product) => (
          <Box key={product.productType}>
            <HStack justify="space-between" mb={1}>
              <HStack>
                <Box
                  w={3}
                  h={3}
                  borderRadius="sm"
                  bg={product.color}
                  flexShrink={0}
                />
                <Text fontSize="sm" color={colors.textColor}>
                  {product.productLabel}
                </Text>
              </HStack>
              <HStack gap={3}>
                <Badge colorPalette={PRODUCT_COLORS[product.productType] || 'gray'} variant="subtle">
                  {product.totalOperations} ops
                </Badge>
                <Text fontSize="sm" fontWeight="bold" color={colors.textColor}>
                  {formatVolume(product.totalVolume)}
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="orange.500" title="Saldo Pendiente">
                  ({formatVolume(product.pendingBalance || 0)})
                </Text>
              </HStack>
            </HStack>
            <Progress.Root
              value={totalVolume > 0 ? (product.totalVolume / totalVolume) * 100 : 0}
              size="sm"
              colorPalette={PRODUCT_COLORS[product.productType] || 'gray'}
            >
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
            <HStack justify="space-between" mt={1}>
              <Text fontSize="xs" color={colors.textColor} opacity={0.5}>
                {product.uniqueClients} clientes
              </Text>
              <Text fontSize="xs" color={colors.textColor} opacity={0.5}>
                {product.volumePercentage.toFixed(1)}% del total
              </Text>
            </HStack>
          </Box>
        ))}
      </VStack>
    );
  };

  // Maximized view (fullscreen modal)
  if (isMaximized) {
    return (
      <>
        {/* Placeholder to maintain grid layout */}
        <Box {...containerStyles} minH="200px">
          {renderHeader(false)}
          <Text color={colors.textColor} opacity={0.5} textAlign="center" py={8}>
            Vista expandida abierta...
          </Text>
        </Box>

        {/* Fullscreen overlay */}
        <Portal>
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg={isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)'}
            zIndex={1000}
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={4}
            onClick={() => setIsMaximized(false)}
          >
            <Box
              {...containerStyles}
              bg={isDark ? 'gray.900' : 'white'}
              maxW="1000px"
              w="100%"
              maxH="90vh"
              overflowY="auto"
              onClick={(e) => e.stopPropagation()}
            >
              {renderHeader(true)}

              {/* Two column layout */}
              <HStack align="start" gap={8} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
                {/* KPIs */}
                <Box flex={1} minW="280px">
                  <Text fontSize="md" fontWeight="semibold" color={colors.textColor} mb={4}>
                    Indicadores Clave
                  </Text>
                  {renderKPISummary()}
                </Box>

                {/* Product Breakdown */}
                <Box flex={2} minW="400px">
                  {renderProductBreakdown()}
                </Box>
              </HStack>

              {/* Product comparison table in expanded view */}
              {productComparison.length > 0 && (
                <Box mt={6}>
                  <Text fontSize="md" fontWeight="semibold" color={colors.textColor} mb={3}>
                    Detalle por Producto
                  </Text>
                  <Box overflowX="auto">
                    <HStack
                      bg={isDark ? 'whiteAlpha.50' : 'blackAlpha.25'}
                      p={2}
                      borderRadius="md"
                      mb={2}
                    >
                      <Text flex={2} fontSize="xs" fontWeight="bold" color={colors.textColor} opacity={0.7}>
                        PRODUCTO
                      </Text>
                      <Text flex={1} fontSize="xs" fontWeight="bold" color={colors.textColor} opacity={0.7} textAlign="center">
                        OPERACIONES
                      </Text>
                      <Text flex={1} fontSize="xs" fontWeight="bold" color={colors.textColor} opacity={0.7} textAlign="center">
                        ACTIVAS
                      </Text>
                      <Text flex={1} fontSize="xs" fontWeight="bold" color={colors.textColor} opacity={0.7} textAlign="right">
                        VOLUMEN
                      </Text>
                      <Text flex={1} fontSize="xs" fontWeight="bold" color={colors.textColor} opacity={0.7} textAlign="right">
                        SALDO PEND.
                      </Text>
                      <Text flex={1} fontSize="xs" fontWeight="bold" color={colors.textColor} opacity={0.7} textAlign="right">
                        PROMEDIO
                      </Text>
                      <Text flex={1} fontSize="xs" fontWeight="bold" color={colors.textColor} opacity={0.7} textAlign="center">
                        CLIENTES
                      </Text>
                    </HStack>
                    {productComparison.map((product) => (
                      <HStack
                        key={product.productType}
                        p={2}
                        borderRadius="md"
                        _hover={{ bg: isDark ? 'whiteAlpha.50' : 'blackAlpha.25' }}
                      >
                        <HStack flex={2}>
                          <Box w={3} h={3} borderRadius="sm" bg={product.color} />
                          <Text fontSize="sm" color={colors.textColor}>
                            {product.productLabel}
                          </Text>
                        </HStack>
                        <Text flex={1} fontSize="sm" color={colors.textColor} textAlign="center">
                          {product.totalOperations}
                        </Text>
                        <Text flex={1} fontSize="sm" color={colors.textColor} textAlign="center">
                          <Badge colorPalette="green" variant="subtle">
                            {product.activeOperations}
                          </Badge>
                        </Text>
                        <Text flex={1} fontSize="sm" fontWeight="bold" color={colors.textColor} textAlign="right">
                          {formatVolume(product.totalVolume)}
                        </Text>
                        <Text flex={1} fontSize="sm" fontWeight="bold" color="orange.500" textAlign="right">
                          {formatVolume(product.pendingBalance || 0)}
                        </Text>
                        <Text flex={1} fontSize="sm" color={colors.textColor} textAlign="right">
                          {formatVolume(product.avgOperationSize)}
                        </Text>
                        <Text flex={1} fontSize="sm" color={colors.textColor} textAlign="center">
                          {product.uniqueClients}
                        </Text>
                      </HStack>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Portal>
      </>
    );
  }

  // Normal view
  return (
    <Box {...containerStyles}>
      {renderHeader(false)}
      {renderKPISummary()}
    </Box>
  );
};

export default PeriodSummary;
