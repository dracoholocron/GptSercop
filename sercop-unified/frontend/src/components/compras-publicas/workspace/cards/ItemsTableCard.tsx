import { useMemo } from 'react';
import {
  Box, HStack, VStack, Text, Icon, Badge, Flex,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiPackage } from 'react-icons/fi';
import type { CardComponentProps } from './types';
import { getPhaseColor } from './types';

const MotionBox = motion.create(Box as any);

interface ParsedItem {
  lineNumber: number;
  cpc: string;
  description: string;
  type: string;
  regime: string;
  procedure: string;
  quantity: number;
  unit: string;
  unitCost: string;
  total: string;
  department: string;
  period: string;
}

function parseEnrichedItems(text: string): ParsedItem[] {
  if (!text) return [];
  const items: ParsedItem[] = [];
  for (const line of text.split('\n')) {
    const parts = line.trim().split('|').map(p => p.trim());
    if (parts.length >= 6 && /^\d+$/.test(parts[0])) {
      items.push({
        lineNumber: parseInt(parts[0]),
        cpc: parts[1] || '',
        description: parts[2] || '',
        type: parts[3] || '',
        regime: parts[4] || '',
        procedure: parts[5] || '',
        quantity: parseInt(parts[6]) || 1,
        unit: parts[7] || '',
        unitCost: parts[8] || '',
        total: parts[9] || '',
        department: parts[10] || '',
        period: parts[11] || '',
      });
    }
  }
  return items;
}

const ItemsTableCard: React.FC<CardComponentProps> = ({
  fieldConfig, value, phaseIdx, isDark,
}) => {
  const color = getPhaseColor(phaseIdx, isDark);
  const items = useMemo(() => parseEnrichedItems(value), [value]);

  if (items.length === 0) return null;

  return (
    <Box
      bg={color.bg} border="1px solid" borderColor={color.border}
      borderRadius="md" p={3} boxShadow="md" cursor="default"
      gridColumn={{ md: `span ${fieldConfig.gridSpan || 4}` }}
      position="relative"
      _before={{ content: '""', position: 'absolute', top: 0, left: '20%', right: '20%', height: '4px', bg: color.border, borderRadius: '0 0 4px 4px' }}
    >
      <HStack mb={3} gap={1}>
        <Icon as={FiPackage} color={color.border} boxSize={4} />
        <Text fontSize="xs" fontWeight="bold" color={color.border} textTransform="uppercase" letterSpacing="wider">
          {fieldConfig.label || 'Items Identificados'} ({items.length})
        </Text>
      </HStack>

      <VStack gap={2} align="stretch">
        {items.map((item, i) => (
          <MotionBox
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, boxShadow: 'lg' }}
            transition={{ duration: 0.2 }}
            bg={color.bg} border="1px solid" borderColor={color.border}
            borderRadius="md" p={3} boxShadow="sm"
          >
            <HStack justify="space-between" mb={2}>
              <Badge bg={color.border} color="white" fontSize="xs" px={2} borderRadius="full">
                #{item.lineNumber}
              </Badge>
              <Badge variant="outline" borderColor={color.border} color={color.text} fontSize="9px">
                {item.type || 'B/S'}
              </Badge>
            </HStack>
            <Text fontSize="sm" fontWeight="bold" color={color.text} mb={1} noOfLines={2}>
              {item.description}
            </Text>
            <HStack gap={2} mt={2} flexWrap="wrap">
              {item.cpc && (
                <Badge variant="outline" fontSize="9px" borderColor={color.border} color={color.text}>
                  CPC: {item.cpc}
                </Badge>
              )}
              {item.procedure && (
                <Badge variant="outline" fontSize="9px" borderColor={color.border} color={color.text}>
                  {item.procedure}
                </Badge>
              )}
            </HStack>
            <Flex justify="space-between" mt={2}>
              <Text fontSize="xs" color={color.text} opacity={0.8}>
                {item.quantity} {item.unit} | {item.period}
              </Text>
              <Text fontSize="xs" fontWeight="bold" color={color.text}>
                {item.total || item.unitCost || ''}
              </Text>
            </Flex>
          </MotionBox>
        ))}
      </VStack>
    </Box>
  );
};

export default ItemsTableCard;
