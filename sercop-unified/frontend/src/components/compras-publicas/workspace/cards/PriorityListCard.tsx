import { useState, useCallback, useMemo } from 'react';
import {
  Box, HStack, VStack, Text, Icon, Badge, Button, Input, Spinner,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiTarget, FiEdit, FiPlus, FiTrash2, FiCpu } from 'react-icons/fi';
import { getLegalHelp } from '../../../../services/cpAIService';
import type { CardComponentProps } from './types';
import { getPhaseColor } from './types';

const MotionBox = motion.create(Box as any);

interface PriorityEntry {
  level: string;
  text: string;
}

interface PrioritySchema {
  levels: string[];
  colors: Record<string, string>;
  maxItems?: number;
}

const DEFAULT_SCHEMA: PrioritySchema = {
  levels: ['CRITICA', 'ALTA', 'MEDIA', 'BAJA'],
  colors: { CRITICA: 'red', ALTA: 'orange', MEDIA: 'yellow', BAJA: 'blue' },
  maxItems: 10,
};

function parseSchema(dataSchema: string | null): PrioritySchema {
  if (!dataSchema) return DEFAULT_SCHEMA;
  try { return { ...DEFAULT_SCHEMA, ...JSON.parse(dataSchema) }; }
  catch { return DEFAULT_SCHEMA; }
}

/** Parse "CRITICA: text\nALTA: text" into entries */
function parsePriorities(text: string, levels: string[]): PriorityEntry[] {
  if (!text.trim()) return [];
  const entries: PriorityEntry[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(new RegExp(`^(${levels.join('|')}):\\s*(.*)`, 'i'));
    if (match) {
      entries.push({ level: match[1].toUpperCase(), text: match[2] });
    } else {
      entries.push({ level: 'MEDIA', text: trimmed });
    }
  }
  return entries;
}

function serializePriorities(entries: PriorityEntry[]): string {
  return entries.map(e => `${e.level}: ${e.text}`).join('\n');
}

const LEVEL_BADGE_COLORS: Record<string, string> = {
  CRITICA: 'red', ALTA: 'orange', MEDIA: 'yellow', BAJA: 'blue',
};

const PriorityListCard: React.FC<CardComponentProps> = ({
  fieldConfig, value, phaseIdx, isDark, isEditing, onChange, entityName, fiscalYear,
}) => {
  const color = getPhaseColor(phaseIdx, isDark);
  const schema = useMemo(() => parseSchema(fieldConfig.dataSchema), [fieldConfig.dataSchema]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const entries = useMemo(() => parsePriorities(value, schema.levels), [value, schema.levels]);

  const updateEntries = useCallback((updated: PriorityEntry[]) => {
    onChange?.(serializePriorities(updated));
  }, [onChange]);

  const addEntry = () => {
    if (entries.length >= (schema.maxItems || 10)) return;
    updateEntries([...entries, { level: 'MEDIA', text: '' }]);
  };

  const removeEntry = (idx: number) => {
    updateEntries(entries.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx: number, field: 'level' | 'text', val: string) => {
    const updated = [...entries];
    updated[idx] = { ...updated[idx], [field]: val };
    updateEntries(updated);
  };

  const handleSuggest = useCallback(async () => {
    if (!fieldConfig.aiAssistEnabled) return;
    setIsSuggesting(true);
    try {
      const resp = await getLegalHelp({
        processType: 'PAA',
        currentStep: fieldConfig.aiStep || 'PAA_NEEDS_ENRICHMENT',
        fieldId: `${fieldConfig.aiFieldId || 'PRIORITIES'}_SUGGEST`,
        question: `${fieldConfig.aiSuggestionPrompt || 'Genera prioridades sugeridas.'}\n\nCONTEXTO: ${value ? `Prioridades actuales: "${value.substring(0, 500)}"` : 'Sin prioridades.'}${entityName ? `\nENTIDAD: ${entityName}` : ''}${fiscalYear ? `\nANO: ${fiscalYear}` : ''}\n\nFormato requerido (una por linea):\nCRITICA: descripcion\nALTA: descripcion\nMEDIA: descripcion\nBAJA: descripcion`,
      });
      if (resp.content) onChange?.(resp.content);
    } catch { /* silent */ }
    finally { setIsSuggesting(false); }
  }, [value, fieldConfig, entityName, fiscalYear, onChange]);

  // --- Editing mode ---
  if (isEditing && fieldConfig.isEditable) {
    return (
      <Box
        bg={color.bg} border="2px solid" borderColor="blue.400"
        borderRadius="md" p={4} boxShadow="md"
        position="relative"
        _before={{ content: '""', position: 'absolute', top: 0, left: '20%', right: '20%', height: '4px', bg: 'blue.400', borderRadius: '0 0 4px 4px' }}
      >
        <HStack mb={3} gap={1}>
          <Icon as={FiTarget} color={color.border} boxSize={4} />
          <Text fontSize="xs" fontWeight="bold" color={color.border} textTransform="uppercase" letterSpacing="wider" flex={1}>
            {fieldConfig.label || 'Prioridades'}
          </Text>
          <Badge colorPalette="blue" fontSize="9px">Editando</Badge>
        </HStack>

        <VStack gap={2} align="stretch">
          {entries.map((entry, idx) => (
            <HStack key={idx} gap={2}>
              <Box minW="100px">
                <select
                  value={entry.level}
                  onChange={(e) => updateEntry(idx, 'level', e.target.value)}
                  style={{
                    fontSize: '11px', padding: '4px 8px', borderRadius: '4px',
                    border: '1px solid', borderColor: isDark ? '#4A5568' : '#CBD5E0',
                    background: isDark ? '#2D3748' : 'white', color: isDark ? '#E2E8F0' : '#1A202C',
                    width: '100%',
                  }}
                >
                  {schema.levels.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </Box>
              <Input
                size="xs" flex={1}
                value={entry.text}
                onChange={(e) => updateEntry(idx, 'text', e.target.value)}
                placeholder="Descripcion de la prioridad..."
                fontSize="11px"
                bg={isDark ? 'whiteAlpha.100' : 'white'}
              />
              <Box
                as="button" onClick={() => removeEntry(idx)}
                opacity={0.5} cursor="pointer" p={0.5}
                _hover={{ opacity: 1, color: 'red.500' }}
              >
                <Icon as={FiTrash2} boxSize={3} color={isDark ? 'gray.400' : 'gray.500'} />
              </Box>
            </HStack>
          ))}
        </VStack>

        <HStack mt={3} gap={2}>
          <Button size="xs" variant="ghost" colorPalette="blue" onClick={addEntry}
            disabled={entries.length >= (schema.maxItems || 10)}
            borderStyle="dashed" borderWidth="1px" borderColor={isDark ? 'gray.600' : 'gray.300'}
          >
            <Icon as={FiPlus} mr={1} /> Agregar prioridad
          </Button>
          {fieldConfig.aiAssistEnabled && (
            <Button size="xs" variant="ghost" colorPalette="purple" onClick={handleSuggest} disabled={isSuggesting}>
              {isSuggesting ? <Spinner size="xs" mr={1} /> : <Icon as={FiCpu} mr={1} />}
              Sugerir con IA
            </Button>
          )}
        </HStack>
      </Box>
    );
  }

  // --- Read-only mode ---
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
        <Icon as={FiTarget} color={color.border} boxSize={4} />
        <Text fontSize="xs" fontWeight="bold" color={color.border} textTransform="uppercase" letterSpacing="wider" flex={1}>
          {fieldConfig.label || 'Prioridades'}
        </Text>
        {fieldConfig.isEditable && (
          <Box opacity={0.5} _groupHover={{ opacity: 1 }} transition="opacity 0.2s" p={1}>
            <Icon as={FiEdit} color={color.border} boxSize={3.5} />
          </Box>
        )}
      </HStack>

      <VStack gap={1.5} align="stretch">
        {entries.length === 0 && (
          <Text fontSize="xs" color="gray.500" fontStyle="italic">Sin prioridades definidas</Text>
        )}
        {entries.map((entry, idx) => {
          const badgeColor = schema.colors[entry.level] || LEVEL_BADGE_COLORS[entry.level] || 'gray';
          return (
            <HStack key={idx} gap={2}>
              <Badge
                colorPalette={badgeColor}
                fontSize={entry.level === 'CRITICA' ? '10px' : '9px'}
                fontWeight={entry.level === 'CRITICA' ? 'bold' : 'semibold'}
                px={2} minW="65px" textAlign="center"
              >
                {entry.level}
              </Badge>
              <Text
                fontSize={entry.level === 'CRITICA' ? 'sm' : 'xs'}
                fontWeight={entry.level === 'CRITICA' ? 'semibold' : 'normal'}
                color={color.text} lineHeight="short"
              >
                {entry.text}
              </Text>
            </HStack>
          );
        })}
      </VStack>
    </MotionBox>
  );
};

export default PriorityListCard;
