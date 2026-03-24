import { useState, useCallback } from 'react';
import {
  Box, HStack, Text, Icon, Textarea, Badge, Button, Spinner,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiEdit, FiCpu } from 'react-icons/fi';
import { getLegalHelp } from '../../../../services/cpAIService';
import type { CardComponentProps } from './types';
import { getPhaseColor } from './types';

const MotionBox = motion.create(Box as any);

const MissionCard: React.FC<CardComponentProps> = ({
  fieldConfig, value, phaseIdx, isDark, isEditing, onChange, entityName, fiscalYear,
}) => {
  const color = getPhaseColor(phaseIdx, isDark);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleSuggest = useCallback(async () => {
    if (!fieldConfig.aiAssistEnabled) return;
    setIsSuggesting(true);
    try {
      const resp = await getLegalHelp({
        processType: 'PAA',
        currentStep: fieldConfig.aiStep || 'PAA_ENTITY_VALIDATION',
        fieldId: `${fieldConfig.aiFieldId || 'MISSION'}_SUGGEST`,
        question: `${fieldConfig.aiSuggestionPrompt || 'Genera un resumen de mision institucional.'}\n\n${value ? `Contenido actual: "${value.substring(0, 500)}"` : 'Campo vacio.'}${entityName ? `\nENTIDAD: ${entityName}` : ''}${fiscalYear ? `\nANO: ${fiscalYear}` : ''}\n\nGenera SOLO el contenido.`,
      });
      if (resp.content) onChange?.(resp.content);
    } catch { /* silent */ }
    finally { setIsSuggesting(false); }
  }, [value, fieldConfig, entityName, fiscalYear, onChange]);

  if (isEditing && fieldConfig.isEditable) {
    return (
      <Box
        bg={color.bg} border="2px solid" borderColor="blue.400"
        borderRadius="md" p={4} boxShadow="md" minH="120px"
        position="relative"
        _before={{ content: '""', position: 'absolute', top: 0, left: '20%', right: '20%', height: '4px', bg: 'blue.400', borderRadius: '0 0 4px 4px' }}
      >
        <HStack mb={2} gap={1}>
          <Icon as={FiTrendingUp} color={color.border} boxSize={4} />
          <Text fontSize="xs" fontWeight="bold" color={color.border} textTransform="uppercase" letterSpacing="wider" flex={1}>
            {fieldConfig.label || 'Mision'}
          </Text>
          <Badge colorPalette="blue" fontSize="9px">Editando</Badge>
        </HStack>

        <Textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={fieldConfig.placeholder || 'Resuma la mision institucional...'}
          fontSize="sm" color={color.text} bg="transparent"
          border="1px dashed" borderColor={color.border}
          minH="70px" resize="vertical"
          _placeholder={{ color: isDark ? 'gray.500' : 'gray.400', fontSize: 'xs' }}
        />

        <HStack mt={2} gap={1}>
          {fieldConfig.aiAssistEnabled && (
            <Button size="xs" variant="ghost" colorPalette="purple" onClick={handleSuggest} disabled={isSuggesting}>
              {isSuggesting ? <Spinner size="xs" mr={1} /> : <Icon as={FiCpu} mr={1} />}
              Sugerir con IA
            </Button>
          )}
          <Text fontSize="9px" color="gray.500">{value.length}/{fieldConfig.maxLength || 2000}</Text>
        </HStack>
      </Box>
    );
  }

  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, zIndex: 10 }}
      transition={{ duration: 0.3 }}
      bg={color.bg} border="1px solid" borderColor={color.border}
      borderRadius="md" p={4} boxShadow="md" cursor="default"
      minH="120px" position="relative" role="group"
      _before={{ content: '""', position: 'absolute', top: 0, left: '20%', right: '20%', height: '4px', bg: color.border, borderRadius: '0 0 4px 4px' }}
    >
      <HStack mb={2} gap={1}>
        <Icon as={FiTrendingUp} color={color.border} boxSize={4} />
        <Text fontSize="xs" fontWeight="bold" color={color.border} textTransform="uppercase" letterSpacing="wider" flex={1}>
          {fieldConfig.label || 'Mision'}
        </Text>
        {fieldConfig.isEditable && (
          <Box opacity={0.5} _groupHover={{ opacity: 1 }} transition="opacity 0.2s" p={1}>
            <Icon as={FiEdit} color={color.border} boxSize={3.5} />
          </Box>
        )}
      </HStack>
      <Text fontSize="sm" color={color.text} lineHeight="tall" whiteSpace="pre-wrap">
        {value.length > 200 ? value.substring(0, 200) + '...' : value}
      </Text>
    </MotionBox>
  );
};

export default MissionCard;
