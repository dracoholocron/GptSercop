import { Box, HStack, VStack, Text, Icon } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiShield } from 'react-icons/fi';
import type { CardComponentProps } from './types';
import { getPhaseColor } from './types';

const MotionBox = motion.create(Box as any);

const EntityInfoCard: React.FC<CardComponentProps> = ({
  fieldConfig, value, phaseIdx, isDark,
}) => {
  const color = getPhaseColor(phaseIdx, isDark);

  // Parse value: could be "EntityName\nRUC: 123456" or just entity name
  const lines = value.split('\n');
  const entityName = lines[0] || '';
  const rucLine = lines.find(l => l.startsWith('RUC:'));
  const ruc = rucLine ? rucLine.replace('RUC:', '').trim() : '';

  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, zIndex: 10 }}
      transition={{ duration: 0.3 }}
      bg={color.bg} border="1px solid" borderColor={color.border}
      borderRadius="md" p={3} boxShadow="md" cursor="default"
      minH="80px" position="relative"
      _before={{ content: '""', position: 'absolute', top: 0, left: '20%', right: '20%', height: '4px', bg: color.border, borderRadius: '0 0 4px 4px' }}
    >
      <HStack mb={2} gap={1}>
        <Icon as={FiShield} color={color.border} boxSize={4} />
        <Text fontSize="xs" fontWeight="bold" color={color.border} textTransform="uppercase" letterSpacing="wider">
          {fieldConfig.label || 'Entidad'}
        </Text>
      </HStack>
      <VStack align="start" gap={0.5}>
        <Text fontSize="sm" fontWeight="bold" color={color.text}>{entityName}</Text>
        {ruc && <Text fontSize="xs" color={color.text} opacity={0.7}>RUC: {ruc}</Text>}
      </VStack>
    </MotionBox>
  );
};

export default EntityInfoCard;
