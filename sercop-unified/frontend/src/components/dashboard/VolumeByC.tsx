/**
 * VolumeByC Component
 * Shows volume breakdown by currency in a single compact card
 */

import { Box, Text, VStack, HStack } from '@chakra-ui/react';
import { FiDollarSign } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import type { KPICard } from '../../types/dashboard';

interface VolumeByCProps {
  volumes: KPICard[];
}

export const VolumeByC = ({ volumes }: VolumeByCProps) => {
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  if (!volumes || volumes.length === 0) {
    return null;
  }

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
    >
      {/* Gradient accent */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="3px"
        bgGradient="linear(to-r, #3B82F6, #10B981)"
      />

      <VStack align="stretch" gap={2}>
        <HStack>
          <Box
            p={2}
            borderRadius="lg"
            bg="rgba(59, 130, 246, 0.15)"
          >
            <FiDollarSign size={18} color="#3B82F6" />
          </Box>
          <Text fontSize="sm" color={colors.textColor} opacity={0.6}>
            Volumen por Moneda
          </Text>
        </HStack>

        <VStack align="stretch" gap={1}>
          {volumes.map((vol, index) => (
            <HStack key={`vol-${vol.currency || 'unknown'}-${index}`} justify="space-between">
              <HStack gap={2}>
                <Box
                  w={2}
                  h={2}
                  borderRadius="full"
                  bg={vol.color || '#6B7280'}
                />
                <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                  {vol.currency}
                </Text>
              </HStack>
              <Text fontSize="sm" fontWeight="bold" color={colors.textColor}>
                {vol.formattedValue?.replace(` ${vol.currency}`, '') || vol.value}
              </Text>
            </HStack>
          ))}
        </VStack>

        <Text fontSize="xs" color={colors.textColor} opacity={0.5} mt={1}>
          {volumes[0]?.changeLabel || 'período actual'}
        </Text>
      </VStack>
    </Box>
  );
};

export default VolumeByC;
