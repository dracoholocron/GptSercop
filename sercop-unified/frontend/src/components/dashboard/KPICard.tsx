/**
 * KPICard Component
 * Animated KPI card with trend indicator and glassmorphism effect
 */

import { Box, HStack, VStack, Text } from '@chakra-ui/react';
import {
  FiDollarSign,
  FiActivity,
  FiUsers,
  FiZap,
  FiClock,
  FiAlertTriangle,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import type { KPICard as KPICardType } from '../../types/dashboard';

interface KPICardProps {
  kpi: KPICardType;
  index?: number;
}

const iconMap: Record<string, React.ElementType> = {
  dollar: FiDollarSign,
  activity: FiActivity,
  users: FiUsers,
  zap: FiZap,
  clock: FiClock,
  'alert-triangle': FiAlertTriangle,
};

export const KPICard = ({ kpi, index = 0 }: KPICardProps) => {
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const Icon = iconMap[kpi.icon] || FiActivity;
  const TrendIcon = kpi.trend === 'UP' ? FiTrendingUp : kpi.trend === 'DOWN' ? FiTrendingDown : FiMinus;

  const trendColor = kpi.trend === 'UP' ? 'green.500' : kpi.trend === 'DOWN' ? 'red.500' : 'gray.500';
  const trendBg = kpi.trend === 'UP' ? 'green.50' : kpi.trend === 'DOWN' ? 'red.50' : 'gray.50';

  return (
    <Box
      p={5}
      borderRadius="xl"
      bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)'}
      backdropFilter="blur(10px)"
      borderWidth="1px"
      borderColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
      boxShadow={isDark
        ? '0 4px 20px rgba(0,0,0,0.3)'
        : '0 4px 20px rgba(0,0,0,0.08)'
      }
      position="relative"
      overflow="hidden"
      transition="all 0.3s ease"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: isDark
          ? '0 8px 30px rgba(0,0,0,0.4)'
          : '0 8px 30px rgba(0,0,0,0.12)',
      }}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Gradient accent */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="3px"
        bgGradient={`linear(to-r, ${kpi.color}, ${kpi.color}88)`}
      />

      <VStack align="stretch" gap={3}>
        <HStack justify="space-between">
          <Box
            p={2}
            borderRadius="lg"
            bg={`${kpi.color}15`}
          >
            <Icon size={20} color={kpi.color} />
          </Box>

          {kpi.changePercent !== 0 && (
            <HStack
              gap={1}
              px={2}
              py={1}
              borderRadius="full"
              bg={isDark ? `${trendColor.replace('.500', '.900')}33` : trendBg}
            >
              <TrendIcon size={12} color={trendColor.includes('green') ? '#10B981' : trendColor.includes('red') ? '#EF4444' : '#6B7280'} />
              <Text fontSize="xs" fontWeight="bold" color={trendColor}>
                {Math.abs(kpi.changePercent).toFixed(1)}%
              </Text>
            </HStack>
          )}
        </HStack>

        <Box>
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color={colors.textColor}
            letterSpacing="-0.02em"
          >
            {kpi.formattedValue}
          </Text>
          <Text fontSize="sm" color={colors.textColor} opacity={0.6}>
            {kpi.label}
          </Text>
        </Box>

        <Text fontSize="xs" color={colors.textColor} opacity={0.5}>
          {kpi.changeLabel}
        </Text>
      </VStack>
    </Box>
  );
};

export default KPICard;
