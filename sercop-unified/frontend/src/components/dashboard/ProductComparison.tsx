/**
 * ProductComparison Component
 * Product performance comparison cards
 */

import { Box, Text, HStack, VStack, SimpleGrid, Badge } from '@chakra-ui/react';
import {
  FiDownload,
  FiUpload,
  FiShield,
  FiFileText,
  FiUsers,
  FiTrendingUp,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import type { ProductComparison as ProductComparisonType } from '../../types/dashboard';

interface ProductComparisonProps {
  data: ProductComparisonType[];
}

const PRODUCT_ICONS: Record<string, React.ElementType> = {
  download: FiDownload,
  upload: FiUpload,
  shield: FiShield,
  'shield-check': FiShield,
  'file-text': FiFileText,
  file: FiFileText,
};

export const ProductComparison = ({ data }: ProductComparisonProps) => {
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const formatVolume = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <Box
      p={5}
      borderRadius="xl"
      bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)'}
      backdropFilter="blur(10px)"
      borderWidth="1px"
      borderColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
      boxShadow={isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'}
    >
      <Text fontSize="lg" fontWeight="bold" color={colors.textColor} mb={4}>
        Comparación por Producto
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
        {data.map((product) => {
          const Icon = PRODUCT_ICONS[product.icon] || FiFileText;

          return (
            <Box
              key={product.productType}
              p={4}
              borderRadius="lg"
              bg={isDark ? 'whiteAlpha.50' : 'blackAlpha.25'}
              borderWidth="1px"
              borderColor={`${product.color}40`}
              position="relative"
              overflow="hidden"
            >
              {/* Color accent */}
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="3px"
                bg={product.color}
              />

              <HStack justify="space-between" mb={3}>
                <Box p={2} borderRadius="lg" bg={`${product.color}20`}>
                  <Icon size={18} color={product.color} />
                </Box>
                <Badge
                  px={2}
                  py={1}
                  borderRadius="full"
                  bg={`${product.color}20`}
                  color={product.color}
                  fontSize="xs"
                >
                  {product.volumePercentage.toFixed(0)}%
                </Badge>
              </HStack>

              <Text fontWeight="bold" color={colors.textColor} mb={2}>
                {product.productLabel}
              </Text>

              <Text fontSize="xl" fontWeight="bold" color={product.color} mb={3}>
                {formatVolume(product.totalVolume)}
              </Text>

              <SimpleGrid columns={2} gap={2}>
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color={colors.textColor} opacity={0.5}>
                    Operaciones
                  </Text>
                  <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                    {product.totalOperations}
                  </Text>
                </VStack>
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color={colors.textColor} opacity={0.5}>
                    Activas
                  </Text>
                  <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                    {product.activeOperations}
                  </Text>
                </VStack>
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color={colors.textColor} opacity={0.5}>
                    Clientes
                  </Text>
                  <HStack gap={1}>
                    <FiUsers size={12} color={colors.textColor} />
                    <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                      {product.uniqueClients}
                    </Text>
                  </HStack>
                </VStack>
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color={colors.textColor} opacity={0.5}>
                    Promedio
                  </Text>
                  <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                    {formatVolume(product.avgOperationSize)}
                  </Text>
                </VStack>
              </SimpleGrid>
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
};

export default ProductComparison;
