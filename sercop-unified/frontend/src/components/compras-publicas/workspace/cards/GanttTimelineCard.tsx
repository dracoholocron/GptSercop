import { useState, useMemo, useCallback } from 'react';
import {
  Box, HStack, VStack, Flex, Text, Icon, Badge, Button, Input,
} from '@chakra-ui/react';
import { FiCalendar, FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';
import type { CardComponentProps } from './types';
import { getPhaseColor } from './types';

const QUARTER_LABELS = ['Q1', 'Q2', 'Q3', 'Q4'];
const QUARTER_COLORS = ['#3F51B5', '#43A047', '#FB8C00', '#E91E63'];
const QUARTER_COLORS_DARK = ['#7986CB', '#81C784', '#FFB74D', '#F48FB1'];

interface GanttEntry {
  label: string;
  startQ: number;
  endQ: number;
}

function parseQuarterRange(text: string): [number, number] | null {
  const match = text.match(/Q([1-4])(?:\s*[-–]\s*Q([1-4]))?/i);
  if (!match) return null;
  const start = parseInt(match[1]) - 1;
  const end = match[2] ? parseInt(match[2]) - 1 : start;
  return [Math.min(start, end), Math.max(start, end)];
}

function parseTimelineEntries(text: string): GanttEntry[] {
  const entries: GanttEntry[] = [];
  for (const line of text.split('\n').filter(l => l.trim())) {
    const range = parseQuarterRange(line);
    if (range) {
      const label = line.replace(/^Q[1-4](?:\s*[-–]\s*Q[1-4])?\s*\d{4}\s*:\s*/i, '').trim();
      entries.push({ label: label || line.trim(), startQ: range[0], endQ: range[1] });
    }
  }
  return entries;
}

function serializeGanttEntries(entries: GanttEntry[]): string {
  return entries.map(e => {
    const qRange = e.startQ === e.endQ ? `Q${e.startQ + 1}` : `Q${e.startQ + 1}-Q${e.endQ + 1}`;
    return `${qRange} 2026: ${e.label}`;
  }).join('\n');
}

const GanttTimelineCard: React.FC<CardComponentProps> = ({
  fieldConfig, value, phaseIdx, isDark, isEditing, onChange,
}) => {
  const color = getPhaseColor(phaseIdx, isDark);
  const qColors = isDark ? QUARTER_COLORS_DARK : QUARTER_COLORS;
  const entries = useMemo(() => parseTimelineEntries(value), [value]);

  const [editEntries, setEditEntries] = useState<GanttEntry[]>(() =>
    entries.length > 0 ? entries : [{ label: '', startQ: 0, endQ: 0 }]
  );

  const syncToParent = useCallback((updated: GanttEntry[]) => {
    setEditEntries(updated);
    onChange?.(serializeGanttEntries(updated));
  }, [onChange]);

  const updateEntry = (idx: number, field: keyof GanttEntry, val: string | number) => {
    const updated = [...editEntries];
    updated[idx] = { ...updated[idx], [field]: val };
    if (field === 'startQ' && (val as number) > updated[idx].endQ) updated[idx].endQ = val as number;
    if (field === 'endQ' && (val as number) < updated[idx].startQ) updated[idx].startQ = val as number;
    syncToParent(updated);
  };

  const addEntry = () => syncToParent([...editEntries, { label: '', startQ: 0, endQ: 0 }]);
  const removeEntry = (idx: number) => { if (editEntries.length > 1) syncToParent(editEntries.filter((_, i) => i !== idx)); };

  const handleQuarterClick = (entryIdx: number, q: number) => {
    const entry = editEntries[entryIdx];
    const updated = [...editEntries];
    if (q < entry.startQ || q > entry.endQ) {
      updated[entryIdx] = { ...entry, startQ: Math.min(entry.startQ, q), endQ: Math.max(entry.endQ, q) };
    } else if (entry.startQ !== entry.endQ) {
      if (q === entry.startQ) updated[entryIdx] = { ...entry, startQ: entry.startQ + 1 };
      else if (q === entry.endQ) updated[entryIdx] = { ...entry, endQ: entry.endQ - 1 };
    }
    syncToParent(updated);
  };

  // --- Editing mode ---
  if (isEditing && fieldConfig.isEditable) {
    return (
      <Box
        bg={color.bg} border="2px solid" borderColor="blue.400"
        borderRadius="md" p={4} boxShadow="md"
        gridColumn={{ md: `span ${fieldConfig.gridSpan || 2}` }}
        position="relative"
        _before={{ content: '""', position: 'absolute', top: 0, left: '20%', right: '20%', height: '4px', bg: 'blue.400', borderRadius: '0 0 4px 4px' }}
      >
        <HStack mb={3} gap={1}>
          <Icon as={FiCalendar} color={color.border} boxSize={4} />
          <Text fontSize="xs" fontWeight="bold" color={color.border} textTransform="uppercase" letterSpacing="wider" flex={1}>
            {fieldConfig.label || 'Cronograma'}
          </Text>
          <Badge colorPalette="blue" fontSize="9px">Editando</Badge>
        </HStack>

        <Text fontSize="10px" color={isDark ? 'gray.400' : 'gray.500'} mb={3}>
          Click en los trimestres para seleccionar/deseleccionar el rango.
        </Text>

        <Flex mb={2}>
          <Box w="45%" />
          <Box w="20px" />
          {QUARTER_LABELS.map((q, i) => (
            <Box key={q} flex={1} textAlign="center">
              <Text fontSize="11px" fontWeight="bold" color={qColors[i]}>{q}</Text>
            </Box>
          ))}
        </Flex>

        <VStack gap={2} align="stretch">
          {editEntries.map((entry, idx) => (
            <Flex key={idx} align="center" gap={1}>
              <Box w="45%">
                <Input
                  size="xs" value={entry.label}
                  onChange={(e) => updateEntry(idx, 'label', e.target.value)}
                  placeholder="Nombre de la actividad..."
                  fontSize="11px" bg={isDark ? 'whiteAlpha.100' : 'white'}
                  border="1px solid" borderColor={isDark ? 'gray.600' : 'gray.300'}
                />
              </Box>
              <Box as="button" onClick={() => removeEntry(idx)}
                opacity={editEntries.length > 1 ? 0.5 : 0.2}
                cursor={editEntries.length > 1 ? 'pointer' : 'not-allowed'}
                _hover={editEntries.length > 1 ? { opacity: 1, color: 'red.500' } : {}} p={0.5}
              >
                <Icon as={FiTrash2} boxSize={3} color={isDark ? 'gray.400' : 'gray.500'} />
              </Box>
              {[0, 1, 2, 3].map(q => {
                const isActive = q >= entry.startQ && q <= entry.endQ;
                return (
                  <Box key={q} flex={1} h="28px" borderRadius="sm" cursor="pointer"
                    bg={isActive ? qColors[q] : (isDark ? 'whiteAlpha.100' : 'blackAlpha.50')}
                    opacity={isActive ? 0.85 : 1}
                    border="1px solid" borderColor={isActive ? qColors[q] : 'transparent'}
                    onClick={() => handleQuarterClick(idx, q)}
                    transition="all 0.15s"
                    _hover={{ transform: 'scaleY(1.15)', boxShadow: isActive ? 'md' : 'sm' }}
                  />
                );
              })}
            </Flex>
          ))}
        </VStack>

        <Button size="xs" variant="ghost" colorPalette="blue" mt={3} onClick={addEntry} w="full"
          borderStyle="dashed" borderWidth="1px" borderColor={isDark ? 'gray.600' : 'gray.300'}
        >
          <Icon as={FiPlus} mr={1} /> Agregar actividad
        </Button>
      </Box>
    );
  }

  // --- Read-only Gantt ---
  if (entries.length === 0) {
    // Fallback to text display if no entries can be parsed
    return (
      <Box bg={color.bg} border="1px solid" borderColor={color.border} borderRadius="md"
        p={4} boxShadow="md" gridColumn={{ md: `span ${fieldConfig.gridSpan || 2}` }}
        position="relative" role="group"
        _before={{ content: '""', position: 'absolute', top: 0, left: '20%', right: '20%', height: '4px', bg: color.border, borderRadius: '0 0 4px 4px' }}
      >
        <HStack mb={2} gap={1}>
          <Icon as={FiCalendar} color={color.border} boxSize={4} />
          <Text fontSize="xs" fontWeight="bold" color={color.border} textTransform="uppercase" letterSpacing="wider" flex={1}>
            {fieldConfig.label || 'Cronograma'}
          </Text>
          {fieldConfig.isEditable && (
            <Box opacity={0.5} _groupHover={{ opacity: 1 }} p={1}>
              <Icon as={FiEdit} color={color.border} boxSize={3.5} />
            </Box>
          )}
        </HStack>
        <Text fontSize="sm" color={color.text} whiteSpace="pre-wrap">{value}</Text>
      </Box>
    );
  }

  return (
    <Box
      bg={color.bg} border="1px solid" borderColor={color.border}
      borderRadius="md" p={4} boxShadow="md"
      gridColumn={{ md: `span ${fieldConfig.gridSpan || 2}` }}
      position="relative" role="group"
      _before={{ content: '""', position: 'absolute', top: 0, left: '20%', right: '20%', height: '4px', bg: color.border, borderRadius: '0 0 4px 4px' }}
    >
      <HStack mb={3} gap={1}>
        <Icon as={FiCalendar} color={color.border} boxSize={4} />
        <Text fontSize="xs" fontWeight="bold" color={color.border} textTransform="uppercase" letterSpacing="wider" flex={1}>
          {fieldConfig.label || 'Cronograma'}
        </Text>
        {fieldConfig.isEditable && (
          <Box opacity={0.5} _groupHover={{ opacity: 1 }} transition="opacity 0.2s" p={1}>
            <Icon as={FiEdit} color={color.border} boxSize={3.5} />
          </Box>
        )}
      </HStack>

      <Flex mb={2}>
        <Box w="40%" />
        {QUARTER_LABELS.map((q, i) => (
          <Box key={q} flex={1} textAlign="center">
            <Text fontSize="10px" fontWeight="bold" color={qColors[i]}>{q}</Text>
          </Box>
        ))}
      </Flex>

      <VStack gap={1.5} align="stretch">
        {entries.map((entry, i) => (
          <Flex key={i} align="center" gap={1}>
            <Box w="40%" pr={2}>
              <Text fontSize="10px" color={color.text} noOfLines={2} lineHeight="short">{entry.label}</Text>
            </Box>
            <Flex flex={1} position="relative" h="18px" bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'} borderRadius="sm" overflow="hidden">
              {[1, 2, 3].map(qi => (
                <Box key={qi} position="absolute" left={`${qi * 25}%`} top={0} bottom={0} w="1px" bg={isDark ? 'whiteAlpha.200' : 'blackAlpha.100'} />
              ))}
              <Box
                position="absolute"
                left={`${entry.startQ * 25 + 1}%`}
                width={`${(entry.endQ - entry.startQ + 1) * 25 - 2}%`}
                top="2px" bottom="2px"
                bg={qColors[entry.startQ % 4]} borderRadius="sm" opacity={0.85}
              />
            </Flex>
          </Flex>
        ))}
      </VStack>
    </Box>
  );
};

export default GanttTimelineCard;
