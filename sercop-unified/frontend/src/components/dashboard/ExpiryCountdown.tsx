/**
 * ExpiryCountdown Component
 * Widget showing upcoming operation expirations by urgency with product breakdown
 */

import { useState } from 'react';
import { Box, Text, HStack, VStack, Badge, IconButton, Portal, Progress } from '@chakra-ui/react';
import { FiAlertCircle, FiAlertTriangle, FiClock, FiCheckCircle, FiMaximize2, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { ExpiryCountdown as ExpiryCountdownType } from '../../types/dashboard';

interface ExpiryCountdownProps {
  data: ExpiryCountdownType[];
}

const URGENCY_ICONS = {
  CRITICAL: FiAlertCircle,
  HIGH: FiAlertTriangle,
  MEDIUM: FiClock,
  LOW: FiCheckCircle,
};

export const ExpiryCountdown = ({ data }: ExpiryCountdownProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const [isMaximized, setIsMaximized] = useState(false);
  const [showProductBreakdown, setShowProductBreakdown] = useState(true);

  const formatVolume = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const totalCount = data.reduce((sum, d) => sum + d.count, 0);
  const totalVolume = data.reduce((sum, d) => sum + d.totalVolume, 0);

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
        <FiClock size={20} color={colors.primaryColor} />
        <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
          {t('businessDashboard.upcomingExpiries', 'Próximos Vencimientos')}
        </Text>
      </HStack>
      <HStack gap={2}>
        <Badge colorPalette={totalCount > 0 ? 'orange' : 'green'} variant="subtle">
          {totalCount} ops · {formatVolume(totalVolume)}
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

  const renderExpiryItem = (item: ExpiryCountdownType, showBreakdown: boolean = false) => {
    const Icon = URGENCY_ICONS[item.urgencyLevel];
    const maxCount = Math.max(...data.map(d => d.count), 1);

    return (
      <Box key={item.range}>
        <HStack
          p={3}
          borderRadius="lg"
          bg={isDark ? 'whiteAlpha.50' : 'blackAlpha.25'}
          borderLeftWidth="4px"
          borderLeftColor={item.color}
          transition="all 0.2s"
          _hover={{
            bg: isDark ? 'whiteAlpha.100' : 'blackAlpha.50',
            transform: 'translateX(4px)',
          }}
        >
          <Box
            p={2}
            borderRadius="lg"
            bg={`${item.color}20`}
          >
            <Icon size={18} color={item.color} />
          </Box>

          <VStack align="start" gap={0} flex={1}>
            <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
              {item.rangeLabel}
            </Text>
            <Text fontSize="xs" color={colors.textColor} opacity={0.6}>
              {formatVolume(item.totalVolume)}
            </Text>
          </VStack>

          <Badge
            px={3}
            py={1}
            borderRadius="full"
            bg={`${item.color}20`}
            color={item.color}
            fontWeight="bold"
            fontSize="md"
          >
            {item.count}
          </Badge>
        </HStack>

        {/* Product Breakdown */}
        {showBreakdown && item.productBreakdown && item.productBreakdown.length > 0 && (
          <VStack align="stretch" gap={1} mt={2} ml={10} mb={3}>
            {item.productBreakdown.map((pb) => (
              <HStack key={pb.productType} gap={2}>
                <Box
                  w={3}
                  h={3}
                  borderRadius="sm"
                  bg={pb.color}
                  flexShrink={0}
                />
                <Text fontSize="xs" color={colors.textColor} flex={1}>
                  {pb.productLabel}
                </Text>
                <Badge size="sm" colorPalette="gray" variant="subtle">
                  {pb.count}
                </Badge>
                <Text fontSize="xs" color={colors.textColor} opacity={0.6} minW="60px" textAlign="right">
                  {formatVolume(pb.volume)}
                </Text>
              </HStack>
            ))}
          </VStack>
        )}
      </Box>
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
              maxW="900px"
              w="100%"
              maxH="90vh"
              overflowY="auto"
              onClick={(e) => e.stopPropagation()}
            >
              {renderHeader(true)}

              {/* Summary */}
              <HStack gap={6} mb={4} flexWrap="wrap">
                {data.map((item) => {
                  const Icon = URGENCY_ICONS[item.urgencyLevel];
                  return (
                    <VStack key={item.range} align="center" gap={1}>
                      <Icon size={24} color={item.color} />
                      <Text fontSize="2xl" fontWeight="bold" color={item.color}>
                        {item.count}
                      </Text>
                      <Text fontSize="xs" color={colors.textColor} opacity={0.6}>
                        {item.rangeLabel}
                      </Text>
                    </VStack>
                  );
                })}
              </HStack>

              {/* Toggle breakdown view */}
              <HStack mb={4}>
                <Text
                  fontSize="sm"
                  color={colors.primaryColor}
                  cursor="pointer"
                  onClick={() => setShowProductBreakdown(!showProductBreakdown)}
                  _hover={{ textDecoration: 'underline' }}
                >
                  {showProductBreakdown ? 'Ocultar desglose por producto' : 'Mostrar desglose por producto'}
                </Text>
              </HStack>

              <VStack gap={3} align="stretch">
                {data.map((item) => renderExpiryItem(item, showProductBreakdown))}
              </VStack>

              {data.every(d => d.count === 0) && (
                <Box textAlign="center" py={6}>
                  <FiCheckCircle size={32} color="#10B981" style={{ margin: '0 auto' }} />
                  <Text mt={2} color={colors.textColor} opacity={0.7}>
                    {t('businessDashboard.noUpcomingExpiries', 'Sin vencimientos próximos')}
                  </Text>
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

      <VStack gap={3} align="stretch">
        {data.map((item) => renderExpiryItem(item, false))}
      </VStack>

      {data.every(d => d.count === 0) && (
        <Box textAlign="center" py={6}>
          <FiCheckCircle size={32} color="#10B981" style={{ margin: '0 auto' }} />
          <Text mt={2} color={colors.textColor} opacity={0.7}>
            {t('businessDashboard.noUpcomingExpiries', 'Sin vencimientos próximos')}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default ExpiryCountdown;
