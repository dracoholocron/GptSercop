/**
 * ProductVolume3D Component
 * 3D Bar Chart visualization for product volumes
 * Uses CSS 3D transforms and SVG for realistic 3D effect
 */

import { useState, useMemo } from 'react';
import { Box, Text, HStack, VStack, Flex, Badge, Spinner } from '@chakra-ui/react';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { ProductComparison } from '../../types/dashboard';

interface ProductVolume3DProps {
  productComparison: ProductComparison[];
  onProductClick?: (productType: string) => void;
  isLoading?: boolean;
}

// Color palette for products
const COLOR_PALETTE = [
  { main: '#3B82F6', light: '#93C5FD', dark: '#1E40AF', shadow: 'rgba(59, 130, 246, 0.4)' },
  { main: '#10B981', light: '#6EE7B7', dark: '#047857', shadow: 'rgba(16, 185, 129, 0.4)' },
  { main: '#8B5CF6', light: '#C4B5FD', dark: '#5B21B6', shadow: 'rgba(139, 92, 246, 0.4)' },
  { main: '#F59E0B', light: '#FCD34D', dark: '#B45309', shadow: 'rgba(245, 158, 11, 0.4)' },
  { main: '#EC4899', light: '#F9A8D4', dark: '#BE185D', shadow: 'rgba(236, 72, 153, 0.4)' },
  { main: '#06B6D4', light: '#67E8F9', dark: '#0E7490', shadow: 'rgba(6, 182, 212, 0.4)' },
  { main: '#EF4444', light: '#FCA5A5', dark: '#B91C1C', shadow: 'rgba(239, 68, 68, 0.4)' },
  { main: '#84CC16', light: '#BEF264', dark: '#4D7C0F', shadow: 'rgba(132, 204, 22, 0.4)' },
];

export const ProductVolume3D = ({ productComparison, onProductClick, isLoading }: ProductVolume3DProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [rotateX, setRotateX] = useState(-15);
  const [rotateY, setRotateY] = useState(25);

  // Calculate max volume for scaling
  const maxVolume = useMemo(() => {
    if (!productComparison || productComparison.length === 0) return 1;
    return Math.max(...productComparison.map(p => p.totalVolume || 0));
  }, [productComparison]);

  // Format currency values
  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  // Get product label with i18n
  const getProductLabel = (productType: string): string => {
    const translationKey = `productTypes.${productType}`;
    const translated = t(translationKey, { defaultValue: '' });
    if (translated && translated !== translationKey && translated !== '') {
      return translated;
    }
    return productType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Handle mouse drag for rotation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return; // Only when mouse button is pressed
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;

    setRotateY(Math.max(-45, Math.min(45, x / 10)));
    setRotateX(Math.max(-30, Math.min(10, -y / 15)));
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color={colors.primaryColor} />
        <Text mt={4} color={colors.textColorSecondary}>
          {t('common.loading', 'Cargando...')}
        </Text>
      </Box>
    );
  }

  if (!productComparison || productComparison.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text color={colors.textColorSecondary}>
          {t('businessDashboard.noDataAvailable', 'No hay datos disponibles')}
        </Text>
      </Box>
    );
  }

  // Sort by volume descending
  const sortedProducts = [...productComparison].sort((a, b) => (b.totalVolume || 0) - (a.totalVolume || 0));
  const barWidth = 60;
  const barDepth = 40;
  const maxBarHeight = 250;
  const spacing = 100;
  const totalWidth = sortedProducts.length * spacing;

  return (
    <Box position="relative" w="100%" minH="500px" overflow="hidden">
      {/* Controls hint */}
      <Text
        position="absolute"
        top={2}
        right={4}
        fontSize="xs"
        color={colors.textColorSecondary}
        zIndex={10}
      >
        {t('businessDashboard.dragToRotate', 'Arrastra para rotar')}
      </Text>

      {/* 3D Scene Container */}
      <Box
        w="100%"
        h="450px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        style={{ perspective: '1200px' }}
        onMouseMove={handleMouseMove}
        cursor="grab"
        _active={{ cursor: 'grabbing' }}
      >
        {/* 3D Rotating Container */}
        <Box
          position="relative"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          {/* Floor Grid */}
          <Box
            position="absolute"
            w={`${totalWidth + 100}px`}
            h="200px"
            left={`-${(totalWidth + 100) / 2}px`}
            style={{
              transform: 'rotateX(90deg) translateZ(-5px)',
              transformStyle: 'preserve-3d',
            }}
          >
            <svg width="100%" height="100%" style={{ opacity: 0.3 }}>
              <defs>
                <pattern id="grid3d" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke={isDark ? '#4B5563' : '#D1D5DB'}
                    strokeWidth="1"
                  />
                </pattern>
                <linearGradient id="floorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isDark ? '#1F2937' : '#F3F4F6'} stopOpacity="1" />
                  <stop offset="100%" stopColor={isDark ? '#111827' : '#E5E7EB'} stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#floorGradient)" />
              <rect width="100%" height="100%" fill="url(#grid3d)" />
            </svg>
          </Box>

          {/* 3D Bars */}
          {sortedProducts.map((product, index) => {
            const palette = COLOR_PALETTE[index % COLOR_PALETTE.length];
            const heightPercent = maxVolume > 0 ? (product.totalVolume || 0) / maxVolume : 0;
            const barHeight = Math.max(20, heightPercent * maxBarHeight);
            const xPos = (index - (sortedProducts.length - 1) / 2) * spacing;
            const isHovered = hoveredIndex === index;

            return (
              <Box
                key={product.productType}
                position="absolute"
                style={{
                  transform: `translateX(${xPos}px) translateZ(0px)`,
                  transformStyle: 'preserve-3d',
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onProductClick?.(product.productType)}
                cursor="pointer"
              >
                {/* Bar Container */}
                <Box
                  position="relative"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `translateY(${-barHeight / 2}px) ${isHovered ? 'scale(1.05) translateY(-10px)' : ''}`,
                    transition: 'transform 0.3s ease-out',
                  }}
                >
                  {/* Front Face */}
                  <Box
                    position="absolute"
                    w={`${barWidth}px`}
                    h={`${barHeight}px`}
                    style={{
                      transform: `translateZ(${barDepth / 2}px)`,
                      background: `linear-gradient(180deg, ${palette.light} 0%, ${palette.main} 50%, ${palette.dark} 100%)`,
                      boxShadow: isHovered ? `0 0 30px ${palette.shadow}` : 'none',
                    }}
                    borderRadius="md"
                  />

                  {/* Back Face */}
                  <Box
                    position="absolute"
                    w={`${barWidth}px`}
                    h={`${barHeight}px`}
                    style={{
                      transform: `translateZ(${-barDepth / 2}px) rotateY(180deg)`,
                      background: palette.dark,
                    }}
                    borderRadius="md"
                  />

                  {/* Left Face */}
                  <Box
                    position="absolute"
                    w={`${barDepth}px`}
                    h={`${barHeight}px`}
                    style={{
                      transform: `translateX(${-barDepth / 2}px) rotateY(-90deg)`,
                      background: `linear-gradient(180deg, ${palette.main} 0%, ${palette.dark} 100%)`,
                    }}
                    borderRadius="md"
                  />

                  {/* Right Face */}
                  <Box
                    position="absolute"
                    w={`${barDepth}px`}
                    h={`${barHeight}px`}
                    style={{
                      transform: `translateX(${barWidth - barDepth / 2}px) rotateY(90deg)`,
                      background: `linear-gradient(180deg, ${palette.light} 0%, ${palette.main} 100%)`,
                    }}
                    borderRadius="md"
                  />

                  {/* Top Face */}
                  <Box
                    position="absolute"
                    w={`${barWidth}px`}
                    h={`${barDepth}px`}
                    style={{
                      transform: `translateY(${-barDepth / 2}px) rotateX(90deg)`,
                      background: `linear-gradient(135deg, ${palette.light} 0%, ${palette.main} 100%)`,
                    }}
                    borderRadius="md"
                  />

                  {/* Bottom Face */}
                  <Box
                    position="absolute"
                    w={`${barWidth}px`}
                    h={`${barDepth}px`}
                    style={{
                      transform: `translateY(${barHeight - barDepth / 2}px) rotateX(-90deg)`,
                      background: palette.dark,
                    }}
                    borderRadius="md"
                  />

                  {/* Glow effect when hovered */}
                  {isHovered && (
                    <Box
                      position="absolute"
                      w={`${barWidth + 20}px`}
                      h={`${barHeight + 20}px`}
                      left="-10px"
                      top="-10px"
                      style={{
                        background: `radial-gradient(ellipse at center, ${palette.shadow} 0%, transparent 70%)`,
                        transform: `translateZ(${barDepth / 2 + 5}px)`,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </Box>

                {/* Value Label on top */}
                <Box
                  position="absolute"
                  left="50%"
                  style={{
                    transform: `translateX(-50%) translateY(${-barHeight - 35}px) translateZ(${barDepth}px)`,
                  }}
                  textAlign="center"
                  whiteSpace="nowrap"
                >
                  <Text
                    fontSize="md"
                    fontWeight="bold"
                    color={palette.main}
                    textShadow={isDark ? '0 2px 4px rgba(0,0,0,0.8)' : '0 2px 4px rgba(255,255,255,0.8)'}
                  >
                    {formatValue(product.totalVolume || 0)}
                  </Text>
                </Box>

                {/* Label at bottom */}
                <Box
                  position="absolute"
                  left="50%"
                  style={{
                    transform: `translateX(-50%) translateY(20px) rotateX(-90deg) translateZ(-10px)`,
                  }}
                  textAlign="center"
                  whiteSpace="nowrap"
                >
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color={colors.textColor}
                    maxW="120px"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {getProductLabel(product.productType).substring(0, 12)}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Product Cards Grid */}
      <Flex
        justify="center"
        flexWrap="wrap"
        gap={4}
        mt={4}
        px={4}
      >
        {sortedProducts.map((product, index) => {
          const palette = COLOR_PALETTE[index % COLOR_PALETTE.length];
          const trend = product.previousVolume && product.previousVolume > 0
            ? ((product.totalVolume - product.previousVolume) / product.previousVolume) * 100
            : 0;

          return (
            <Box
              key={product.productType}
              p={4}
              borderRadius="xl"
              bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'white'}
              borderWidth="2px"
              borderColor={hoveredIndex === index ? palette.main : 'transparent'}
              boxShadow={hoveredIndex === index
                ? `0 8px 30px ${palette.shadow}`
                : isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'
              }
              minW="180px"
              cursor="pointer"
              transition="all 0.3s ease"
              transform={hoveredIndex === index ? 'translateY(-4px) scale(1.02)' : 'none'}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onProductClick?.(product.productType)}
              _hover={{
                borderColor: palette.main,
              }}
            >
              <HStack justify="space-between" mb={2}>
                <Box
                  w={3}
                  h={3}
                  borderRadius="full"
                  bg={palette.main}
                  boxShadow={`0 0 10px ${palette.shadow}`}
                />
                <Badge
                  colorPalette={trend >= 0 ? 'green' : 'red'}
                  variant="subtle"
                  fontSize="xs"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  {trend >= 0 ? <FiTrendingUp size={10} /> : <FiTrendingDown size={10} />}
                  {Math.abs(trend).toFixed(1)}%
                </Badge>
              </HStack>

              <Text
                fontSize="sm"
                fontWeight="medium"
                color={colors.textColorSecondary}
                mb={1}
                lineHeight="1.2"
              >
                {getProductLabel(product.productType)}
              </Text>

              <Text
                fontSize="xl"
                fontWeight="bold"
                color={palette.main}
                lineHeight="1"
              >
                {formatValue(product.totalVolume || 0)}
              </Text>

              <HStack mt={2} gap={3} fontSize="xs" color={colors.textColorSecondary}>
                <Text>
                  {product.totalOperations?.toLocaleString() || 0} ops
                </Text>
                {product.pendingBalance && product.pendingBalance > 0 && (
                  <Text color="orange.500">
                    Pend: {formatValue(product.pendingBalance)}
                  </Text>
                )}
              </HStack>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
};

export default ProductVolume3D;
