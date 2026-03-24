import { Box, HStack, Text, Icon, Badge } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiLayers } from 'react-icons/fi';
import type { CardComponentProps } from './types';
import { getPhaseColor } from './types';

const MotionBox = motion.create(Box as any);

const BadgeListCard: React.FC<CardComponentProps> = ({
  fieldConfig, value, phaseIdx, isDark,
}) => {
  const color = getPhaseColor(phaseIdx, isDark);

  // Parse items: could be JSON array or newline-separated list with "- " prefix
  let items: string[] = [];
  if (value.trim().startsWith('[')) {
    try { items = JSON.parse(value); } catch { /* fallback */ }
  }
  if (items.length === 0) {
    items = value.split('\n')
      .map(l => l.replace(/^-\s*/, '').trim())
      .filter(Boolean);
  }

  if (items.length === 0) return null;

  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, zIndex: 10 }}
      transition={{ duration: 0.3 }}
      bg={color.bg} border="1px solid" borderColor={color.border}
      borderRadius="md" p={3} boxShadow="md" cursor="default"
      gridColumn={{ md: `span ${fieldConfig.gridSpan || 2}` }}
      position="relative"
      _before={{ content: '""', position: 'absolute', top: 0, left: '20%', right: '20%', height: '4px', bg: color.border, borderRadius: '0 0 4px 4px' }}
    >
      <HStack mb={2} gap={1}>
        <Icon as={FiLayers} color={color.border} boxSize={4} />
        <Text fontSize="xs" fontWeight="bold" color={color.border} textTransform="uppercase" letterSpacing="wider">
          {fieldConfig.label || 'Items'}
        </Text>
      </HStack>
      <HStack gap={2} flexWrap="wrap">
        {items.map((item, i) => (
          <Badge key={i} colorPalette="purple" variant="outline" fontSize="xs" px={2} py={1}>
            + {item}
          </Badge>
        ))}
      </HStack>
    </MotionBox>
  );
};

export default BadgeListCard;
