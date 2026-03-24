import { Box, HStack, Text, Icon } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiFileText } from 'react-icons/fi';
import type { CardComponentProps } from './types';
import { getPhaseColor } from './types';

const MotionBox = motion.create(Box as any);

const ReadonlyNoteCard: React.FC<CardComponentProps> = ({
  fieldConfig, value, phaseIdx, isDark,
}) => {
  const color = getPhaseColor(phaseIdx, isDark);

  if (!value.trim()) return null;

  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, zIndex: 10 }}
      transition={{ duration: 0.3 }}
      bg={color.bg} border="1px solid" borderColor={color.border}
      borderRadius="md" p={4} boxShadow="md" cursor="default"
      minH="100px" position="relative"
      _before={{ content: '""', position: 'absolute', top: 0, left: '20%', right: '20%', height: '4px', bg: color.border, borderRadius: '0 0 4px 4px' }}
    >
      <HStack mb={2} gap={1}>
        <Icon as={FiFileText} color={color.border} boxSize={4} />
        <Text fontSize="xs" fontWeight="bold" color={color.border} textTransform="uppercase" letterSpacing="wider">
          {fieldConfig.label || 'Resumen'}
        </Text>
      </HStack>
      <Text fontSize="sm" color={color.text} lineHeight="tall" whiteSpace="pre-wrap" opacity={0.9}>
        {value.length > 300 ? value.substring(0, 300) + '...' : value}
      </Text>
    </MotionBox>
  );
};

export default ReadonlyNoteCard;
