/**
 * PlanViewerMural - Multi-view plan visualizer with inline editing
 * Modes: Sticky Notes (Mural-style), Table, Document/Report
 * Parses AI-generated phase data + proposal items into rich visual cards.
 * Colors assigned by methodology phase for visual grouping.
 *
 * Edit Mode: A global toggle converts read-only views into editable inputs.
 * Changes are serialized back to phaseData/itemsData JSON and saved via onSave.
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Flex,
  Badge,
  Button,
  Icon,
  Heading,
  SimpleGrid,
  Table,
  Separator,
  Input,
  Textarea,
  Spinner,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid,
  FiList,
  FiFileText,
  FiEdit,
  FiCheckCircle,
  FiPackage,
  FiDollarSign,
  FiCalendar,
  FiTarget,
  FiShield,
  FiSearch,
  FiUser,
  FiTrendingUp,
  FiClipboard,
  FiLayers,
  FiSettings,
  FiZap,
  FiSave,
  FiX,
  FiAlertCircle,
  FiCpu,
  FiInfo,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatCurrency } from '../../../services/cpWorkspaceService';
import { getLegalHelp, type CPLegalHelpResponse } from '../../../services/cpAIService';
import { getMethodology, type CPPAAMethodology, type CPPAAPhaseFieldMapping } from '../../../services/cpMethodologyService';
import { CardRenderer } from './cards';
import { CardCommentOverlay } from './CardCommentOverlay';
import type { CPPAAFieldChangeLog } from '../../../services/cpWorkspaceService';
import type { FieldChangeInfo } from './cards/types';

const MotionBox = motion.create(Box as any);

// ============================================================================
// Types
// ============================================================================

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

/** Items from itemsData (proposal) — more flexible structure */
interface ProposalItem {
  idx: number;
  cpc: string;
  description: string;
  type: string;
  procedure: string;
  quantity: number;
  unitCost: number;
  total: number;
  period: string;
  raw: any;
}

interface ParsedPhase {
  phaseKey: string;
  phaseNumber: string;
  phaseName: string;
  rawData: any;
  needs: string;
  enrichedNeeds: string;
  items: ParsedItem[];
  additionalItems: string[];
  summary: string;
  entityName: string;
  entityRuc: string;
  priorities: string;
  timeline: string;
  missionSummary: string;
  extraFields: Record<string, string>;
  isCodeOnly: boolean; // true if phase value was just a code string
}

type ViewMode = 'mural' | 'table' | 'document';

// ============================================================================
// Phase methodology colors — each phase gets a consistent color
// ============================================================================

const methodologyColors = [
  { bg: '#E8EAF6', border: '#3F51B5', text: '#1A237E', label: 'Indigo',  icon: FiClipboard },    // Phase 1: Needs
  { bg: '#E3F2FD', border: '#1E88E5', text: '#0D47A1', label: 'Blue',    icon: FiSearch },        // Phase 2: Enrichment
  { bg: '#E8F5E9', border: '#43A047', text: '#1B5E20', label: 'Green',   icon: FiTarget },        // Phase 3: Proposal
  { bg: '#FFF3E0', border: '#FB8C00', text: '#E65100', label: 'Orange',  icon: FiCalendar },      // Phase 4: Calendar
  { bg: '#F3E5F5', border: '#8E24AA', text: '#4A148C', label: 'Purple',  icon: FiShield },        // Phase 5: Validation
  { bg: '#E0F2F1', border: '#00897B', text: '#004D40', label: 'Teal',    icon: FiTrendingUp },    // Phase 6: Risk
  { bg: '#FCE4EC', border: '#E91E63', text: '#880E4F', label: 'Pink',    icon: FiCheckCircle },   // Phase 7: Final
  { bg: '#FFF9C4', border: '#F9A825', text: '#5D4037', label: 'Yellow',  icon: FiZap },           // Extra
];

const methodologyColorsDark = [
  { bg: '#1A1F3D', border: '#5C6BC0', text: '#C5CAE9', label: 'Indigo',  icon: FiClipboard },
  { bg: '#0D2744', border: '#42A5F5', text: '#BBDEFB', label: 'Blue',    icon: FiSearch },
  { bg: '#1B3A1B', border: '#66BB6A', text: '#C8E6C9', label: 'Green',   icon: FiTarget },
  { bg: '#3E2510', border: '#FFA726', text: '#FFE0B2', label: 'Orange',  icon: FiCalendar },
  { bg: '#2A1038', border: '#AB47BC', text: '#E1BEE7', label: 'Purple',  icon: FiShield },
  { bg: '#0A3028', border: '#26A69A', text: '#B2DFDB', label: 'Teal',    icon: FiTrendingUp },
  { bg: '#3C1028', border: '#EC407A', text: '#F8BBD0', label: 'Pink',    icon: FiCheckCircle },
  { bg: '#4A4520', border: '#FFEE58', text: '#FFF9C4', label: 'Yellow',  icon: FiZap },
];

// Map phase code strings to human-readable names
const phaseCodeLabels: Record<string, string> = {
  NECESIDADES: 'Identificacion de Necesidades',
  NEEDS: 'Identificacion de Necesidades',
  ENRICHMENT: 'Enriquecimiento de Necesidades',
  ENRIQUECIMIENTO: 'Enriquecimiento de Necesidades',
  PROPOSAL: 'Propuesta de Plan',
  PROPUESTA: 'Propuesta de Plan',
  CALENDAR: 'Calendarizacion',
  CALENDARIZACION: 'Calendarizacion y Programacion',
  CALENDARIZACION_VALIDACION: 'Calendarizacion y Validacion',
  VALIDATION: 'Validacion Legal',
  VALIDACION: 'Validacion Legal',
  RISK: 'Analisis de Riesgos',
  RIESGO: 'Analisis de Riesgos',
  FINAL: 'Consolidacion Final',
  CONSOLIDACION: 'Consolidacion Final',
  BUDGET: 'Presupuesto',
  PRESUPUESTO: 'Presupuesto',
  MARKET: 'Estudio de Mercado',
  MERCADO: 'Estudio de Mercado',
};

// ============================================================================
// Parser - extract structured data from AI phase responses
// ============================================================================

function parsePhaseData(phaseKey: string, phaseValue: any, idx: number): ParsedPhase {
  const phaseNum = phaseKey.replace(/\D/g, '') || String(idx + 1);

  // Detect if the phase value is just a code string (like "PROPOSAL")
  if (typeof phaseValue === 'string') {
    const upper = phaseValue.trim().toUpperCase().replace(/\s+/g, '_');
    const isCode = /^[A-Z_]+$/.test(upper) && phaseValue.trim().length < 50;
    const phaseName = isCode
      ? (phaseCodeLabels[upper] || phaseValue.replace(/_/g, ' '))
      : `Fase ${phaseNum}`;

    return {
      phaseKey,
      phaseNumber: phaseNum,
      phaseName,
      rawData: phaseValue,
      needs: isCode ? '' : phaseValue,
      enrichedNeeds: '',
      items: [],
      additionalItems: [],
      summary: isCode ? `Fase completada: ${phaseName}` : '',
      entityName: '',
      entityRuc: '',
      priorities: '',
      timeline: '',
      missionSummary: '',
      extraFields: {},
      isCodeOnly: isCode,
    };
  }

  const obj = typeof phaseValue === 'object' ? phaseValue : {};

  // Parse items table from enrichedNeeds
  const items: ParsedItem[] = [];
  const additionalItems: string[] = [];
  const enriched = obj.enrichedNeeds || '';

  if (enriched) {
    const lines = enriched.split('\n');
    let inAdditional = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.includes('ITEMS ADICIONALES') || trimmed.includes('RECOMENDADOS')) {
        inAdditional = true;
        continue;
      }

      if (trimmed.startsWith('RESUMEN:') || trimmed.startsWith('SUMMARY:')) {
        continue;
      }

      if (inAdditional && trimmed.startsWith('-')) {
        additionalItems.push(trimmed.replace(/^-\s*/, ''));
        continue;
      }

      // Parse table rows: # | CPC | Desc | ...
      const parts = trimmed.split('|').map(p => p.trim());
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
  }

  // Collect extra fields not already handled
  const knownKeys = new Set(['needs', 'enrichedNeeds', 'sector', 'sectorLabel', 'timeline',
    'entityRuc', 'entityName', 'priorities', 'departments', 'totalBudget',
    'missionSummary', 'needsValidated']);
  const extraFields: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!knownKeys.has(k) && v && typeof v === 'string' && v.trim()) {
      extraFields[k] = v;
    }
  }

  // Extract summary from enrichedNeeds
  const summaryMatch = enriched.match(/RESUMEN:\s*(.+)/);

  return {
    phaseKey,
    phaseNumber: phaseNum,
    phaseName: `Fase ${phaseNum}`,
    rawData: phaseValue,
    needs: obj.needs || '',
    enrichedNeeds: enriched,
    items,
    additionalItems,
    summary: summaryMatch ? summaryMatch[1] : '',
    entityName: obj.entityName || '',
    entityRuc: obj.entityRuc || '',
    priorities: obj.priorities || '',
    timeline: obj.timeline || '',
    missionSummary: obj.missionSummary || '',
    extraFields,
    isCodeOnly: false,
  };
}

/** Parse itemsData from proposal submission */
function parseProposalItems(itemsData: string | null): ProposalItem[] {
  if (!itemsData) return [];
  try {
    const parsed = JSON.parse(itemsData);
    let arr: any[] = [];
    if (Array.isArray(parsed)) arr = parsed;
    else if (parsed?.examples && Array.isArray(parsed.examples)) arr = parsed.examples;
    else if (parsed?.items && Array.isArray(parsed.items)) arr = parsed.items;
    else if (typeof parsed === 'object') {
      const vals = Object.values(parsed);
      const found = vals.find(v => Array.isArray(v));
      if (found) arr = found as any[];
    }

    return arr.map((item, idx) => {
      if (typeof item === 'string') {
        return {
          idx: idx + 1,
          cpc: '',
          description: item,
          type: '',
          procedure: '',
          quantity: 1,
          unitCost: 0,
          total: 0,
          period: '',
          raw: item,
        };
      }
      return {
        idx: idx + 1,
        cpc: item.cpcCode || item.cpc || item.codigoCPC || '',
        description: item.description || item.itemDescription || item.cpcDescription || JSON.stringify(item),
        type: item.processType || item.tipoCompra || item.type || '',
        procedure: item.procedure || item.procedimiento || item.proceso || '',
        quantity: Number(item.quantity || item.cantidad) || 1,
        unitCost: Number(item.unitCost || item.costoUnitario) || 0,
        total: Number(item.budgetAmount || item.budget || item.valorTotal || item.costoTotal) || 0,
        period: item.period || item.periodo || item.estimatedPublicationDate || '',
        raw: item,
      };
    });
  } catch {
    return [];
  }
}

// ============================================================================
// Serialization — rebuild JSON from edited data
// ============================================================================

/** Rebuild phaseData JSON from edited phases, preserving rawData structure */
function serializePhases(editedPhases: ParsedPhase[]): string {
  const result: Record<string, any> = {};
  for (const phase of editedPhases) {
    if (phase.isCodeOnly) {
      // Code-only phases: preserve as-is
      result[phase.phaseKey] = phase.rawData;
    } else if (typeof phase.rawData === 'object' && phase.rawData !== null) {
      // Spread original raw data, overwrite editable fields
      result[phase.phaseKey] = {
        ...phase.rawData,
        needs: phase.needs,
        priorities: phase.priorities,
        timeline: phase.timeline,
        missionSummary: phase.missionSummary,
      };
      // summary is derived from enrichedNeeds — store if set
      if (phase.summary) {
        result[phase.phaseKey].summary = phase.summary;
      }
    } else {
      result[phase.phaseKey] = phase.rawData;
    }
  }
  return JSON.stringify(result);
}

/** Rebuild itemsData JSON from edited proposal items, detecting original wrapper format */
function serializeProposalItems(editedItems: ProposalItem[], originalItemsData: string | null): string {
  // Build items array from edited data, spreading raw + overwriting edited fields
  const serializedArr = editedItems.map(item => {
    if (typeof item.raw === 'string') {
      return item.description || item.raw;
    }
    const base = typeof item.raw === 'object' && item.raw !== null ? { ...item.raw } : {};
    // Overwrite with edited fields using the key names found in raw
    if (base.cpcCode !== undefined) base.cpcCode = item.cpc;
    else if (base.codigoCPC !== undefined) base.codigoCPC = item.cpc;
    else base.cpc = item.cpc;

    if (base.itemDescription !== undefined) base.itemDescription = item.description;
    else if (base.cpcDescription !== undefined) base.cpcDescription = item.description;
    else base.description = item.description;

    if (base.processType !== undefined) base.processType = item.type;
    else if (base.tipoCompra !== undefined) base.tipoCompra = item.type;
    else base.type = item.type;

    if (base.procedimiento !== undefined) base.procedimiento = item.procedure;
    else if (base.proceso !== undefined) base.proceso = item.procedure;
    else base.procedure = item.procedure;

    if (base.cantidad !== undefined) base.cantidad = item.quantity;
    else base.quantity = item.quantity;

    if (base.costoUnitario !== undefined) base.costoUnitario = item.unitCost;
    else base.unitCost = item.unitCost;

    if (base.budgetAmount !== undefined) base.budgetAmount = item.total;
    else if (base.budget !== undefined) base.budget = item.total;
    else if (base.valorTotal !== undefined) base.valorTotal = item.total;
    else if (base.costoTotal !== undefined) base.costoTotal = item.total;
    else base.total = item.total;

    if (base.periodo !== undefined) base.periodo = item.period;
    else if (base.estimatedPublicationDate !== undefined) base.estimatedPublicationDate = item.period;
    else base.period = item.period;

    return base;
  });

  // Detect original wrapper format to preserve it
  if (originalItemsData) {
    try {
      const parsed = JSON.parse(originalItemsData);
      if (parsed?.examples && Array.isArray(parsed.examples)) {
        return JSON.stringify({ ...parsed, examples: serializedArr });
      }
      if (parsed?.items && Array.isArray(parsed.items)) {
        return JSON.stringify({ ...parsed, items: serializedArr });
      }
    } catch { /* fall through */ }
  }

  return JSON.stringify(serializedArr);
}

// ============================================================================
// Field Metadata — placeholder prompts, validation rules, AI context per field
// ============================================================================

interface FieldMeta {
  placeholder: string;
  minLength: number;
  maxLength: number;
  aiStep: string;      // currentStep for AI validation
  aiFieldId: string;   // fieldId for AI validation
  aiPrompt: string;    // context prompt for AI suggestion
}

const FIELD_METADATA: Record<string, FieldMeta> = {
  needs: {
    placeholder: 'Describa las necesidades de contratacion del departamento: bienes, servicios, obras y consultorias requeridas...',
    minLength: 20,
    maxLength: 5000,
    aiStep: 'PAA_NEEDS_ENRICHMENT',
    aiFieldId: 'NEEDS_VALIDATE',
    aiPrompt: 'Valida si estas necesidades son coherentes y suficientemente detalladas para un PAA. Sugiere mejoras si es necesario.',
  },
  priorities: {
    placeholder: 'Indique las prioridades de contratacion: urgencia, impacto operativo, alineacion con objetivos institucionales...',
    minLength: 10,
    maxLength: 3000,
    aiStep: 'PAA_NEEDS_ENRICHMENT',
    aiFieldId: 'PRIORITIES_VALIDATE',
    aiPrompt: 'Valida si las prioridades estan bien definidas y son coherentes con las necesidades del PAA.',
  },
  timeline: {
    placeholder: 'Defina el cronograma: trimestres de ejecucion, fechas clave, hitos de contratacion...',
    minLength: 10,
    maxLength: 3000,
    aiStep: 'PAA_CALENDARIZACION',
    aiFieldId: 'TIMELINE_VALIDATE',
    aiPrompt: 'Valida si el cronograma es realista y cumple con los plazos de la LOSNCP para procesos de contratacion.',
  },
  missionSummary: {
    placeholder: 'Resuma la mision institucional y como se alinean las contrataciones con los objetivos estrategicos...',
    minLength: 10,
    maxLength: 2000,
    aiStep: 'PAA_ENTITY_VALIDATION',
    aiFieldId: 'MISSION_VALIDATE',
    aiPrompt: 'Valida si el resumen de mision es coherente y las contrataciones se alinean con los objetivos institucionales.',
  },
  summary: {
    placeholder: 'Resumen de la fase: hallazgos clave, decisiones tomadas, resultados esperados...',
    minLength: 5,
    maxLength: 2000,
    aiStep: 'PAA_PHASE_SUMMARY',
    aiFieldId: 'SUMMARY_VALIDATE',
    aiPrompt: 'Valida si el resumen es coherente con los datos de la fase y sugiere mejoras.',
  },
};

const getFieldMeta = (field: string): FieldMeta => FIELD_METADATA[field] || {
  placeholder: 'Ingrese el contenido...',
  minLength: 5,
  maxLength: 5000,
  aiStep: 'PAA_GENERAL',
  aiFieldId: 'GENERAL_VALIDATE',
  aiPrompt: 'Valida este contenido para un PAA.',
};

// ============================================================================
// Editable Sticky Note — with validation, AI check, and suggestions
// ============================================================================

interface ValidationState {
  status: 'idle' | 'valid' | 'warning' | 'error';
  message: string;
}

const EditableStickyNote: React.FC<{
  title: string;
  content: string;
  icon: any;
  phaseIdx: number;
  isDark: boolean;
  size?: 'sm' | 'md' | 'lg';
  fieldKey: string;
  entityName?: string;
  fiscalYear?: number;
  onChange: (value: string) => void;
}> = ({ title, content, icon, phaseIdx, isDark, size = 'md', fieldKey, entityName, fiscalYear, onChange }) => {
  const palette = isDark ? methodologyColorsDark : methodologyColors;
  const color = palette[phaseIdx % palette.length];
  const meta = getFieldMeta(fieldKey);

  const [validation, setValidation] = useState<ValidationState>({ status: 'idle', message: '' });
  const [isValidating, setIsValidating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>();

  // Basic validation
  const runBasicValidation = useCallback((value: string): ValidationState => {
    if (!value.trim()) return { status: 'error', message: 'Este campo no puede estar vacio' };
    if (value.trim().length < meta.minLength) return { status: 'warning', message: `Minimo ${meta.minLength} caracteres (actual: ${value.trim().length})` };
    if (value.trim().length > meta.maxLength) return { status: 'error', message: `Maximo ${meta.maxLength} caracteres excedido` };
    return { status: 'valid', message: '' };
  }, [meta]);

  // AI validation on blur
  const runAIValidation = useCallback(async (value: string) => {
    const basic = runBasicValidation(value);
    if (basic.status === 'error') {
      setValidation(basic);
      return;
    }
    setIsValidating(true);
    try {
      const resp = await getLegalHelp({
        processType: 'PAA',
        currentStep: meta.aiStep,
        fieldId: meta.aiFieldId,
        question: `${meta.aiPrompt}\n\nCONTENIDO A VALIDAR:\n"${value.substring(0, 1500)}"${entityName ? `\n\nENTIDAD: ${entityName}` : ''}${fiscalYear ? `\nANO FISCAL: ${fiscalYear}` : ''}`,
      });
      if (resp.severity === 'REQUIRED' || resp.title?.includes('ERROR')) {
        setValidation({ status: 'error', message: resp.content?.substring(0, 200) || 'La IA detecto problemas' });
      } else if (resp.severity === 'WARNING' || resp.commonErrors?.length > 0) {
        setValidation({ status: 'warning', message: resp.tips?.[0] || resp.content?.substring(0, 200) || 'Revise posibles mejoras' });
      } else {
        setValidation({ status: 'valid', message: resp.tips?.[0] || 'Contenido validado por IA' });
      }
    } catch {
      // If AI fails, fall back to basic validation
      setValidation(basic.status === 'valid' ? { status: 'valid', message: 'Validacion basica OK (IA no disponible)' } : basic);
    } finally {
      setIsValidating(false);
    }
  }, [meta, entityName, fiscalYear, runBasicValidation]);

  // Debounced blur handler
  const handleBlur = useCallback(() => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => {
      if (content.trim().length >= meta.minLength) {
        runAIValidation(content);
      } else {
        setValidation(runBasicValidation(content));
      }
    }, 500);
  }, [content, meta.minLength, runAIValidation, runBasicValidation]);

  // AI suggestion
  const handleSuggest = useCallback(async () => {
    setIsSuggesting(true);
    setShowSuggestion(false);
    try {
      const resp = await getLegalHelp({
        processType: 'PAA',
        currentStep: meta.aiStep,
        fieldId: `${meta.aiFieldId}_SUGGEST`,
        question: `Genera una sugerencia de contenido para el campo "${title}" de un PAA.\n\nCONTEXTO: ${content ? `El usuario ya escribio: "${content.substring(0, 500)}". Mejoralo y amplialo.` : 'El campo esta vacio. Genera un contenido de ejemplo.'}${entityName ? `\nENTIDAD: ${entityName}` : ''}${fiscalYear ? `\nANO FISCAL: ${fiscalYear}` : ''}\n\nGenera SOLO el contenido sugerido, sin explicaciones adicionales.`,
      });
      const suggestion = resp.content || resp.examples?.[0] || '';
      if (suggestion) {
        setAiSuggestion(suggestion);
        setShowSuggestion(true);
      }
    } catch {
      // silently fail
    } finally {
      setIsSuggesting(false);
    }
  }, [content, title, meta, entityName, fiscalYear]);

  const applySuggestion = useCallback(() => {
    if (aiSuggestion) {
      onChange(aiSuggestion);
      setShowSuggestion(false);
      setAiSuggestion(null);
      setValidation({ status: 'valid', message: 'Sugerencia aplicada' });
    }
  }, [aiSuggestion, onChange]);

  const validationBorderColor = validation.status === 'error' ? 'red.400' :
    validation.status === 'warning' ? 'orange.400' :
    validation.status === 'valid' ? 'green.400' : 'blue.400';

  return (
    <Box
      bg={color.bg}
      border="2px solid"
      borderColor={validationBorderColor}
      borderRadius="md"
      p={size === 'sm' ? 3 : 4}
      boxShadow="md"
      minH={size === 'sm' ? '80px' : size === 'lg' ? '180px' : '120px'}
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: '20%',
        right: '20%',
        height: '4px',
        bg: validationBorderColor,
        borderRadius: '0 0 4px 4px',
      }}
    >
      {/* Header */}
      <HStack mb={2} gap={1}>
        <Icon as={icon} color={color.border} boxSize={4} />
        <Text fontSize="xs" fontWeight="bold" color={color.border} textTransform="uppercase" letterSpacing="wider">
          {title}
        </Text>
        <HStack ml="auto" gap={1}>
          {isValidating && <Spinner size="xs" color="blue.400" />}
          <Badge colorPalette="blue" fontSize="9px">Editando</Badge>
        </HStack>
      </HStack>

      {/* Textarea */}
      <Textarea
        value={content}
        onChange={(e) => {
          onChange(e.target.value);
          // Real-time basic validation
          setValidation(runBasicValidation(e.target.value));
        }}
        onBlur={handleBlur}
        placeholder={meta.placeholder}
        fontSize={size === 'sm' ? 'xs' : 'sm'}
        color={color.text}
        bg="transparent"
        border="1px dashed"
        borderColor={color.border}
        minH={size === 'sm' ? '50px' : size === 'lg' ? '120px' : '70px'}
        resize="vertical"
        _placeholder={{ color: isDark ? 'gray.500' : 'gray.400', fontSize: 'xs' }}
      />

      {/* Validation message */}
      {validation.status !== 'idle' && validation.message && (
        <HStack mt={1} gap={1}>
          <Icon
            as={validation.status === 'error' ? FiAlertCircle : validation.status === 'warning' ? FiInfo : FiCheckCircle}
            color={validation.status === 'error' ? 'red.500' : validation.status === 'warning' ? 'orange.500' : 'green.500'}
            boxSize={3}
          />
          <Text
            fontSize="xs"
            color={validation.status === 'error' ? 'red.500' : validation.status === 'warning' ? 'orange.500' : 'green.500'}
          >
            {validation.message}
          </Text>
        </HStack>
      )}

      {/* AI Suggestion button */}
      <HStack mt={2} gap={1}>
        <Button
          size="xs"
          variant="ghost"
          colorPalette="purple"
          onClick={handleSuggest}
          disabled={isSuggesting}
        >
          {isSuggesting ? <Spinner size="xs" mr={1} /> : <Icon as={FiCpu} mr={1} />}
          Sugerir con IA
        </Button>
        <Text fontSize="9px" color="gray.500">{content.length}/{meta.maxLength}</Text>
      </HStack>

      {/* AI Suggestion box */}
      {showSuggestion && aiSuggestion && (
        <Box
          mt={2}
          p={2}
          bg={isDark ? 'purple.900' : 'purple.50'}
          border="1px solid"
          borderColor="purple.300"
          borderRadius="md"
        >
          <HStack mb={1}>
            <Icon as={FiCpu} color="purple.500" boxSize={3} />
            <Text fontSize="xs" fontWeight="bold" color="purple.500">Sugerencia IA</Text>
          </HStack>
          <Text fontSize="xs" color={isDark ? 'purple.200' : 'purple.800'} whiteSpace="pre-wrap" maxH="100px" overflowY="auto">
            {aiSuggestion.substring(0, 500)}
          </Text>
          <HStack mt={2} gap={1}>
            <Button size="xs" colorPalette="purple" onClick={applySuggestion}>
              Aplicar
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setShowSuggestion(false)}>
              Descartar
            </Button>
          </HStack>
        </Box>
      )}
    </Box>
  );
};

// ============================================================================
// Sticky Note Component — color from methodology phase
// ============================================================================

const StickyNote: React.FC<{
  title: string;
  content: string;
  icon: any;
  phaseIdx: number;
  isDark: boolean;
  size?: 'sm' | 'md' | 'lg';
  onEdit?: () => void;
}> = ({ title, content, icon, phaseIdx, isDark, size = 'md', onEdit }) => {
  const palette = isDark ? methodologyColorsDark : methodologyColors;
  const color = palette[phaseIdx % palette.length];

  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.9, rotate: -1 + Math.random() * 2 }}
      animate={{ opacity: 1, scale: 1, rotate: -1 + Math.random() * 2 }}
      whileHover={{ scale: 1.03, rotate: 0, zIndex: 10 }}
      transition={{ duration: 0.3 }}
      bg={color.bg}
      border="1px solid"
      borderColor={color.border}
      borderRadius="md"
      p={size === 'sm' ? 3 : 4}
      boxShadow="md"
      cursor="default"
      minH={size === 'sm' ? '80px' : size === 'lg' ? '180px' : '120px'}
      position="relative"
      role="group"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: '20%',
        right: '20%',
        height: '4px',
        bg: color.border,
        borderRadius: '0 0 4px 4px',
      }}
    >
      <HStack mb={2} gap={1}>
        <Icon as={icon} color={color.border} boxSize={4} />
        <Text fontSize="xs" fontWeight="bold" color={color.border} textTransform="uppercase" letterSpacing="wider" flex={1}>
          {title}
        </Text>
        {onEdit && (
          <Box
            as="button"
            onClick={(e: any) => { e.stopPropagation(); onEdit(); }}
            opacity={0.5}
            _groupHover={{ opacity: 1 }}
            transition="opacity 0.2s"
            p={1}
            borderRadius="md"
            cursor="pointer"
            _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100', opacity: 1 }}
            title="Editar esta tarjeta"
          >
            <Icon as={FiEdit} color={color.border} boxSize={3.5} />
          </Box>
        )}
      </HStack>
      <Text fontSize={size === 'sm' ? 'xs' : 'sm'} color={color.text} lineHeight="tall" whiteSpace="pre-wrap">
        {content.length > (size === 'lg' ? 500 : 200)
          ? content.substring(0, size === 'lg' ? 500 : 200) + '...'
          : content}
      </Text>
    </MotionBox>
  );
};

// ============================================================================
// Gantt-style Timeline Sticky Note
// ============================================================================

const QUARTER_LABELS = ['Q1', 'Q2', 'Q3', 'Q4'];
const QUARTER_COLORS = ['#3F51B5', '#43A047', '#FB8C00', '#E91E63'];
const QUARTER_COLORS_DARK = ['#7986CB', '#81C784', '#FFB74D', '#F48FB1'];

/** Parse "Q1-Q3 2026" or "Q1 2026" into quarter indices (0-based) */
function parseQuarterRange(text: string): [number, number] | null {
  const match = text.match(/Q([1-4])(?:\s*[-–]\s*Q([1-4]))?/i);
  if (!match) return null;
  const start = parseInt(match[1]) - 1;
  const end = match[2] ? parseInt(match[2]) - 1 : start;
  return [Math.min(start, end), Math.max(start, end)];
}

/** Extract timeline entries from the Cronograma text */
function parseTimelineEntries(text: string): Array<{ label: string; startQ: number; endQ: number }> {
  const lines = text.split('\n').filter(l => l.trim());
  const entries: Array<{ label: string; startQ: number; endQ: number }> = [];
  for (const line of lines) {
    const range = parseQuarterRange(line);
    if (range) {
      // Remove the Q-range prefix to get the activity label
      const label = line.replace(/^Q[1-4](?:\s*[-–]\s*Q[1-4])?\s*\d{4}\s*:\s*/i, '').trim();
      entries.push({ label: label || line.trim(), startQ: range[0], endQ: range[1] });
    }
  }
  return entries;
}

const GanttStickyNote: React.FC<{
  content: string;
  phaseIdx: number;
  isDark: boolean;
  onEdit?: () => void;
}> = ({ content, phaseIdx, isDark, onEdit }) => {
  const palette = isDark ? methodologyColorsDark : methodologyColors;
  const color = palette[phaseIdx % palette.length];
  const entries = useMemo(() => parseTimelineEntries(content), [content]);
  const qColors = isDark ? QUARTER_COLORS_DARK : QUARTER_COLORS;

  // If parsing fails, fall back to a regular StickyNote
  if (entries.length === 0) {
    return <StickyNote title="Cronograma" content={content} icon={FiCalendar} phaseIdx={phaseIdx} isDark={isDark} size="lg" onEdit={onEdit} />;
  }

  return (
    <Box
      bg={color.bg}
      border="1px solid"
      borderColor={color.border}
      borderRadius="md"
      p={4}
      boxShadow="md"
      gridColumn={{ md: 'span 2' }}
      position="relative"
      role="group"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: '20%',
        right: '20%',
        height: '4px',
        bg: color.border,
        borderRadius: '0 0 4px 4px',
      }}
    >
      <HStack mb={3} gap={1}>
        <Icon as={FiCalendar} color={color.border} boxSize={4} />
        <Text fontSize="xs" fontWeight="bold" color={color.border} textTransform="uppercase" letterSpacing="wider" flex={1}>
          Cronograma
        </Text>
        {onEdit && (
          <Box
            as="button"
            onClick={(e: any) => { e.stopPropagation(); onEdit(); }}
            opacity={0.5}
            _groupHover={{ opacity: 1 }}
            transition="opacity 0.2s"
            p={1}
            borderRadius="md"
            cursor="pointer"
            _hover={{ bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100', opacity: 1 }}
            title="Editar esta tarjeta"
          >
            <Icon as={FiEdit} color={color.border} boxSize={3.5} />
          </Box>
        )}
      </HStack>

      {/* Quarter header row */}
      <Flex mb={2}>
        <Box w="40%" />
        {QUARTER_LABELS.map((q, i) => (
          <Box key={q} flex={1} textAlign="center">
            <Text fontSize="10px" fontWeight="bold" color={qColors[i]}>{q}</Text>
          </Box>
        ))}
      </Flex>

      {/* Gantt rows */}
      <VStack gap={1.5} align="stretch">
        {entries.map((entry, i) => (
          <Flex key={i} align="center" gap={1}>
            <Box w="40%" pr={2}>
              <Text fontSize="10px" color={color.text} noOfLines={2} lineHeight="short">
                {entry.label}
              </Text>
            </Box>
            <Flex flex={1} position="relative" h="18px" bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'} borderRadius="sm" overflow="hidden">
              {/* Grid lines */}
              {[1, 2, 3].map(qi => (
                <Box key={qi} position="absolute" left={`${qi * 25}%`} top={0} bottom={0} w="1px" bg={isDark ? 'whiteAlpha.200' : 'blackAlpha.100'} />
              ))}
              {/* Bar */}
              <Box
                position="absolute"
                left={`${entry.startQ * 25 + 1}%`}
                width={`${(entry.endQ - entry.startQ + 1) * 25 - 2}%`}
                top="2px"
                bottom="2px"
                bg={qColors[entry.startQ % 4]}
                borderRadius="sm"
                opacity={0.85}
              />
            </Flex>
          </Flex>
        ))}
      </VStack>
    </Box>
  );
};

// ============================================================================
// Editable Gantt — interactive timeline editor
// ============================================================================

interface GanttEntry {
  label: string;
  startQ: number; // 0-3
  endQ: number;   // 0-3
}

/** Serialize gantt entries back to the original timeline text format */
function serializeGanttEntries(entries: GanttEntry[]): string {
  return entries.map(e => {
    const qRange = e.startQ === e.endQ
      ? `Q${e.startQ + 1}`
      : `Q${e.startQ + 1}-Q${e.endQ + 1}`;
    return `${qRange} 2026: ${e.label}`;
  }).join('\n');
}

const EditableGanttNote: React.FC<{
  content: string;
  phaseIdx: number;
  isDark: boolean;
  onChange: (value: string) => void;
}> = ({ content, phaseIdx, isDark, onChange }) => {
  const palette = isDark ? methodologyColorsDark : methodologyColors;
  const color = palette[phaseIdx % palette.length];
  const qColors = isDark ? QUARTER_COLORS_DARK : QUARTER_COLORS;

  // Parse entries into editable state
  const [entries, setEntries] = useState<GanttEntry[]>(() => {
    const parsed = parseTimelineEntries(content);
    return parsed.length > 0 ? parsed : [{ label: '', startQ: 0, endQ: 0 }];
  });

  // Sync changes back to parent on every edit
  const syncToParent = useCallback((updated: GanttEntry[]) => {
    setEntries(updated);
    onChange(serializeGanttEntries(updated));
  }, [onChange]);

  const updateEntry = (idx: number, field: keyof GanttEntry, value: string | number) => {
    const updated = [...entries];
    updated[idx] = { ...updated[idx], [field]: value };
    // Ensure endQ >= startQ
    if (field === 'startQ' && (value as number) > updated[idx].endQ) {
      updated[idx].endQ = value as number;
    }
    if (field === 'endQ' && (value as number) < updated[idx].startQ) {
      updated[idx].startQ = value as number;
    }
    syncToParent(updated);
  };

  const addEntry = () => {
    syncToParent([...entries, { label: '', startQ: 0, endQ: 0 }]);
  };

  const removeEntry = (idx: number) => {
    if (entries.length <= 1) return;
    syncToParent(entries.filter((_, i) => i !== idx));
  };

  /** Toggle a quarter cell: click to set start/end, drag-like behavior */
  const handleQuarterClick = (entryIdx: number, q: number) => {
    const entry = entries[entryIdx];
    const updated = [...entries];
    if (q < entry.startQ || q > entry.endQ) {
      // Extend range to include clicked quarter
      updated[entryIdx] = {
        ...entry,
        startQ: Math.min(entry.startQ, q),
        endQ: Math.max(entry.endQ, q),
      };
    } else if (entry.startQ === entry.endQ) {
      // Single quarter selected, do nothing (can't shrink further)
    } else if (q === entry.startQ) {
      // Shrink from left
      updated[entryIdx] = { ...entry, startQ: entry.startQ + 1 };
    } else if (q === entry.endQ) {
      // Shrink from right
      updated[entryIdx] = { ...entry, endQ: entry.endQ - 1 };
    }
    syncToParent(updated);
  };

  return (
    <Box
      bg={color.bg}
      border="2px solid"
      borderColor="blue.400"
      borderRadius="md"
      p={4}
      boxShadow="md"
      gridColumn={{ md: 'span 2' }}
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: '20%',
        right: '20%',
        height: '4px',
        bg: 'blue.400',
        borderRadius: '0 0 4px 4px',
      }}
    >
      {/* Header */}
      <HStack mb={3} gap={1}>
        <Icon as={FiCalendar} color={color.border} boxSize={4} />
        <Text fontSize="xs" fontWeight="bold" color={color.border} textTransform="uppercase" letterSpacing="wider" flex={1}>
          Cronograma
        </Text>
        <Badge colorPalette="blue" fontSize="9px">Editando</Badge>
      </HStack>

      {/* Instruction */}
      <Text fontSize="10px" color={isDark ? 'gray.400' : 'gray.500'} mb={3}>
        Click en los trimestres para seleccionar/deseleccionar el rango. Edita el nombre de cada actividad.
      </Text>

      {/* Quarter header */}
      <Flex mb={2}>
        <Box w="45%" />
        <Box w="20px" />
        {QUARTER_LABELS.map((q, i) => (
          <Box key={q} flex={1} textAlign="center">
            <Text fontSize="11px" fontWeight="bold" color={qColors[i]}>{q}</Text>
          </Box>
        ))}
      </Flex>

      {/* Editable rows */}
      <VStack gap={2} align="stretch">
        {entries.map((entry, idx) => (
          <Flex key={idx} align="center" gap={1}>
            {/* Activity name input */}
            <Box w="45%">
              <Input
                size="xs"
                value={entry.label}
                onChange={(e) => updateEntry(idx, 'label', e.target.value)}
                placeholder="Nombre de la actividad..."
                fontSize="11px"
                bg={isDark ? 'whiteAlpha.100' : 'white'}
                border="1px solid"
                borderColor={isDark ? 'gray.600' : 'gray.300'}
                _placeholder={{ fontSize: '10px' }}
              />
            </Box>

            {/* Delete button */}
            <Box
              as="button"
              onClick={() => removeEntry(idx)}
              opacity={entries.length > 1 ? 0.5 : 0.2}
              cursor={entries.length > 1 ? 'pointer' : 'not-allowed'}
              _hover={entries.length > 1 ? { opacity: 1, color: 'red.500' } : {}}
              p={0.5}
              title="Eliminar actividad"
            >
              <Icon as={FiTrash2} boxSize={3} color={isDark ? 'gray.400' : 'gray.500'} />
            </Box>

            {/* Quarter cells — clickable */}
            {[0, 1, 2, 3].map(q => {
              const isActive = q >= entry.startQ && q <= entry.endQ;
              return (
                <Box
                  key={q}
                  flex={1}
                  h="28px"
                  borderRadius="sm"
                  cursor="pointer"
                  bg={isActive ? qColors[q] : (isDark ? 'whiteAlpha.100' : 'blackAlpha.50')}
                  opacity={isActive ? 0.85 : 1}
                  border="1px solid"
                  borderColor={isActive ? qColors[q] : 'transparent'}
                  onClick={() => handleQuarterClick(idx, q)}
                  transition="all 0.15s"
                  _hover={{
                    transform: 'scaleY(1.15)',
                    boxShadow: isActive ? 'md' : 'sm',
                    bg: isActive ? qColors[q] : (isDark ? 'whiteAlpha.200' : 'blackAlpha.100'),
                  }}
                  position="relative"
                >
                  {/* Left border between quarters */}
                  {q > 0 && (
                    <Box position="absolute" left="-1px" top={0} bottom={0} w="1px" bg={isDark ? 'whiteAlpha.200' : 'blackAlpha.100'} />
                  )}
                </Box>
              );
            })}
          </Flex>
        ))}
      </VStack>

      {/* Add row button */}
      <Button
        size="xs"
        variant="ghost"
        colorPalette="blue"
        mt={3}
        onClick={addEntry}
        w="full"
        borderStyle="dashed"
        borderWidth="1px"
        borderColor={isDark ? 'gray.600' : 'gray.300'}
      >
        <Icon as={FiPlus} mr={1} /> Agregar actividad
      </Button>
    </Box>
  );
};

// ============================================================================
// Item Sticky Note (for parsed items) — color from phase
// ============================================================================

const ItemStickyNote: React.FC<{
  item: ParsedItem;
  phaseIdx: number;
  isDark: boolean;
}> = ({ item, phaseIdx, isDark }) => {
  const palette = isDark ? methodologyColorsDark : methodologyColors;
  const color = palette[phaseIdx % palette.length];

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, boxShadow: 'lg' }}
      transition={{ duration: 0.2 }}
      bg={color.bg}
      border="1px solid"
      borderColor={color.border}
      borderRadius="md"
      p={3}
      boxShadow="sm"
      cursor="default"
      position="relative"
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
      <HStack justify="space-between" mt={2}>
        <Text fontSize="xs" color={color.text} opacity={0.8}>
          {item.quantity} {item.unit} | {item.period}
        </Text>
        <Text fontSize="xs" fontWeight="bold" color={color.text}>
          {item.total || item.unitCost || ''}
        </Text>
      </HStack>
    </MotionBox>
  );
};

// ============================================================================
// Proposal Item Sticky Note (from itemsData)
// ============================================================================

const ProposalItemStickyNote: React.FC<{
  item: ProposalItem;
  isDark: boolean;
}> = ({ item, isDark }) => {
  const palette = isDark ? methodologyColorsDark : methodologyColors;
  // Use green (idx 2) for proposal items
  const color = palette[2];

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, boxShadow: 'lg' }}
      transition={{ duration: 0.2 }}
      bg={color.bg}
      border="1px solid"
      borderColor={color.border}
      borderRadius="md"
      p={3}
      boxShadow="sm"
      cursor="default"
    >
      <HStack justify="space-between" mb={2}>
        <Badge bg={color.border} color="white" fontSize="xs" px={2} borderRadius="full">
          #{item.idx}
        </Badge>
        {item.type && (
          <Badge variant="outline" borderColor={color.border} color={color.text} fontSize="9px">
            {item.type}
          </Badge>
        )}
      </HStack>
      <Text fontSize="sm" fontWeight="bold" color={color.text} mb={1} noOfLines={3}>
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
      {(item.total > 0 || item.period) && (
        <HStack justify="space-between" mt={2}>
          <Text fontSize="xs" color={color.text} opacity={0.8}>
            {item.quantity > 1 ? `${item.quantity} u.` : ''} {item.period}
          </Text>
          {item.total > 0 && (
            <Text fontSize="xs" fontWeight="bold" color={color.text}>
              {formatCurrency(item.total)}
            </Text>
          )}
        </HStack>
      )}
    </MotionBox>
  );
};

// ============================================================================
// Phase Header — colored bar matching methodology
// ============================================================================

const PhaseHeader: React.FC<{
  phase: ParsedPhase;
  phaseIdx: number;
  totalPhases: number;
  isDark: boolean;
}> = ({ phase, phaseIdx, totalPhases, isDark }) => {
  const palette = isDark ? methodologyColorsDark : methodologyColors;
  const color = palette[phaseIdx % palette.length];
  const PhaseIcon = color.icon;

  return (
    <HStack mb={3} gap={2}>
      <Flex
        w="32px" h="32px" borderRadius="full"
        bg={color.border} align="center" justify="center" flexShrink={0}
      >
        <Icon as={PhaseIcon} color="white" boxSize={4} />
      </Flex>
      <VStack align="start" gap={0} flex={1}>
        <HStack>
          <Text fontSize="sm" fontWeight="bold" color={color.text}>
            Fase {phase.phaseNumber}: {phase.isCodeOnly ? phase.phaseName : phase.phaseName}
          </Text>
          <Badge bg={color.bg} color={color.border} border="1px solid" borderColor={color.border} fontSize="9px">
            {phaseIdx + 1}/{totalPhases}
          </Badge>
          <Icon as={FiCheckCircle} color="green.400" boxSize={4} />
        </HStack>
        {phase.isCodeOnly && (
          <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>
            {phase.summary || 'Procesado por IA'}
          </Text>
        )}
      </VStack>
      <Separator flex={1} borderColor={color.border} opacity={0.3} />
    </HStack>
  );
};

// ============================================================================
// View: Mural (Sticky Notes)
// ============================================================================

const MuralView: React.FC<{
  phases: ParsedPhase[];
  proposalItems: ProposalItem[];
  isDark: boolean;
  isEditing: boolean;
  allowInlineEdit?: boolean;
  entityName?: string;
  fiscalYear?: number;
  fieldMappingsByPhase?: Record<number, CPPAAPhaseFieldMapping[]>;
  onPhaseFieldChange?: (phaseIdx: number, field: string, value: string) => void;
  onProposalItemChange?: (itemIdx: number, field: string, value: string | number) => void;
  onStartEditing?: () => void;
  workspaceId?: number;
  departmentPlanId?: number;
  fieldCommentCounts?: Record<string, number>;
  fieldProposalCounts?: Record<string, number>;
  currentUserName?: string;
  currentUserRole?: string;
  onProposeChange?: (fieldCode: string, phaseIdx: number, currentValue: string) => void;
  fieldChanges?: CPPAAFieldChangeLog[];
}> = ({ phases, proposalItems, isDark, isEditing, allowInlineEdit, entityName, fiscalYear, fieldMappingsByPhase, onPhaseFieldChange, onProposalItemChange, onStartEditing, workspaceId, departmentPlanId, fieldCommentCounts, fieldProposalCounts, currentUserName, currentUserRole, onProposeChange, fieldChanges }) => {
  // Per-card editing: track which cards are being edited individually
  const [editingCards, setEditingCards] = useState<Set<string>>(new Set());

  const isCardEditing = (cardId: string) => isEditing || editingCards.has(cardId);

  const startCardEdit = (cardId: string) => {
    // If global edit mode is available, enter it and the card will be editable
    if (allowInlineEdit && onStartEditing && !isEditing) {
      onStartEditing();
    }
    setEditingCards(prev => new Set(prev).add(cardId));
  };

  // Clear per-card editing when global editing changes
  const prevIsEditing = useRef(isEditing);
  if (prevIsEditing.current && !isEditing) {
    // Exited global edit mode — clear per-card
    if (editingCards.size > 0) setEditingCards(new Set());
  }
  prevIsEditing.current = isEditing;

  /** Render a field: show EditableStickyNote if editing, Gantt for timeline, or StickyNote with edit icon */
  const renderField = (
    phaseIdx: number,
    fieldKey: string,
    title: string,
    content: string,
    icon: any,
    size: 'sm' | 'md' | 'lg' = 'md',
  ) => {
    const cardId = `phase-${phaseIdx}-${fieldKey}`;

    if (isCardEditing(cardId)) {
      // Special: timeline → interactive Gantt editor
      if (fieldKey === 'timeline') {
        return (
          <EditableGanttNote
            key={cardId}
            content={content}
            phaseIdx={phaseIdx}
            isDark={isDark}
            onChange={(v) => onPhaseFieldChange?.(phaseIdx, fieldKey, v)}
          />
        );
      }

      return (
        <EditableStickyNote
          key={cardId}
          title={title}
          content={content}
          icon={icon}
          phaseIdx={phaseIdx}
          isDark={isDark}
          size={size}
          fieldKey={fieldKey}
          entityName={entityName}
          fiscalYear={fiscalYear}
          onChange={(v) => onPhaseFieldChange?.(phaseIdx, fieldKey, v)}
        />
      );
    }

    // Special: timeline → Gantt chart (read-only)
    if (fieldKey === 'timeline') {
      return (
        <GanttStickyNote
          key={cardId}
          content={content}
          phaseIdx={phaseIdx}
          isDark={isDark}
          onEdit={allowInlineEdit ? () => startCardEdit(cardId) : undefined}
        />
      );
    }

    return (
      <StickyNote
        key={cardId}
        title={title}
        content={content}
        icon={icon}
        phaseIdx={phaseIdx}
        isDark={isDark}
        size={size}
        onEdit={allowInlineEdit ? () => startCardEdit(cardId) : undefined}
      />
    );
  };

  return (
    <VStack gap={6} align="stretch">
      {phases.map((phase, phaseIdx) => (
        <Box key={phase.phaseKey}>
          <PhaseHeader phase={phase} phaseIdx={phaseIdx} totalPhases={phases.length} isDark={isDark} />

          {/* Code-only phase WITHOUT methodology fields: show a single summary card */}
          {phase.isCodeOnly && !(fieldMappingsByPhase?.[parseInt(phase.phaseNumber) || (phaseIdx + 1)]?.length) && (
            <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
              <StickyNote
                title={phase.phaseName}
                content={phase.summary || `Esta fase fue procesada automaticamente por el asistente de IA.\n\nResultado: ${phase.rawData}`}
                icon={methodologyColors[phaseIdx % methodologyColors.length].icon}
                phaseIdx={phaseIdx}
                isDark={isDark}
              />
            </SimpleGrid>
          )}

          {/* Rich phase or code-only WITH methodology fields: DB-driven cards */}
          {(() => {
            const phaseNum = parseInt(phase.phaseNumber) || (phaseIdx + 1);
            const mappings = fieldMappingsByPhase?.[phaseNum];

            if (mappings && mappings.length > 0) {
              // DB-driven rendering via CardRenderer
              return (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={3} mb={4}>
                  {mappings
                    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                    .map((fm) => {
                      // Extract value from parsed phase data using fieldCode
                      const fieldCode = fm.fieldCode;
                      let fieldValue = '';

                      // Map fieldCode to parsed data
                      if (fieldCode === 'needs') fieldValue = phase.needs || '';
                      else if (fieldCode === 'priorities') fieldValue = phase.priorities || '';
                      else if (fieldCode === 'timeline') fieldValue = phase.timeline || '';
                      else if (fieldCode === 'entityName' || fieldCode === 'ENTIDAD_NOMBRE')
                        fieldValue = phase.entityName ? `${phase.entityName}\nRUC: ${phase.entityRuc || ''}` : '';
                      else if (fieldCode === 'missionSummary') fieldValue = phase.missionSummary || '';
                      else if (fieldCode === 'summary') fieldValue = phase.summary || '';
                      else if (fieldCode === 'enrichedNeeds') fieldValue = phase.enrichedNeeds || '';
                      else if (fieldCode === 'additionalItems')
                        fieldValue = phase.additionalItems.join('\n');
                      else fieldValue = phase.extraFields[fieldCode] || '';

                      const cardId = `phase-${phaseIdx}-${fieldCode}`;

                      const commentKey = `${fieldCode}:${phaseIdx}`;

                      // Build field change info for diff highlighting
                      const matchingChange = fieldChanges?.find(
                        c => c.fieldCode === fieldCode && c.phaseIndex === phaseIdx
                      );
                      if (fieldChanges && fieldChanges.length > 0 && !matchingChange) {
                        // Debug: log first time to see what's in fieldChanges vs what we're looking for
                        if (phaseIdx === 0 && fm === mappings[0]) {
                          console.log('[MuralView] fieldChanges available:', fieldChanges.length,
                            'Looking for fieldCode:', fieldCode, 'phaseIdx:', phaseIdx,
                            'Available:', fieldChanges.map(c => `${c.fieldCode}:${c.phaseIndex}`));
                        }
                      }
                      const fieldChangeInfo: FieldChangeInfo | undefined = matchingChange
                        ? { oldValue: matchingChange.oldValue, changedByName: matchingChange.changedByName, changedAt: matchingChange.changedAt }
                        : undefined;
                      if (matchingChange) {
                        console.log('[MuralView] MATCH for', fieldCode, ':', matchingChange);
                      }

                      const cardContent = (
                        <CardRenderer
                          fieldConfig={fm}
                          value={fieldValue}
                          phaseIdx={phaseIdx}
                          isDark={isDark}
                          isEditing={isCardEditing(cardId)}
                          onChange={(v) => onPhaseFieldChange?.(phaseIdx, fieldCode, v)}
                          entityName={entityName}
                          fiscalYear={fiscalYear}
                          fieldChangeInfo={fieldChangeInfo}
                        />
                      );

                      return (
                        <Box
                          key={cardId}
                          gridColumn={fm.gridSpan > 1 ? { md: `span ${fm.gridSpan}` } : undefined}
                          onClick={
                            fm.isEditable && allowInlineEdit && !isCardEditing(cardId)
                              ? () => startCardEdit(cardId)
                              : undefined
                          }
                          cursor={fm.isEditable && allowInlineEdit && !isCardEditing(cardId) ? 'pointer' : undefined}
                        >
                          {workspaceId && departmentPlanId ? (
                            <CardCommentOverlay
                              workspaceId={workspaceId}
                              departmentPlanId={departmentPlanId}
                              fieldCode={fieldCode}
                              phaseIdx={phaseIdx}
                              commentCount={fieldCommentCounts?.[commentKey] || 0}
                              proposalCount={fieldProposalCounts?.[commentKey] || 0}
                              currentUserName={currentUserName}
                              currentUserRole={currentUserRole}
                              isEditable={fm.isEditable}
                              currentValue={fieldValue}
                              onProposeChange={onProposeChange}
                            >
                              {cardContent}
                            </CardCommentOverlay>
                          ) : cardContent}
                        </Box>
                      );
                    })}
                </SimpleGrid>
              );
            }

            // Fallback: hardcoded field rendering (no methodology loaded)
            return (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={3} mb={4}>
                {phase.needs && renderField(phaseIdx, 'needs', 'Necesidades', phase.needs, FiClipboard, 'lg')}
                {phase.priorities && renderField(phaseIdx, 'priorities', 'Prioridades', phase.priorities, FiTarget)}
                {phase.timeline && renderField(phaseIdx, 'timeline', 'Cronograma', phase.timeline, FiCalendar)}
                {phase.entityName && (
                  <StickyNote title="Entidad" content={`${phase.entityName}\nRUC: ${phase.entityRuc}`} icon={FiShield} phaseIdx={phaseIdx} isDark={isDark} size="sm" />
                )}
                {phase.missionSummary && renderField(phaseIdx, 'missionSummary', 'Mision', phase.missionSummary, FiTrendingUp)}
                {phase.summary && renderField(phaseIdx, 'summary', 'Resumen', phase.summary, FiFileText)}
                {Object.entries(phase.extraFields).map(([key, value]) => (
                  <StickyNote key={key} title={key.replace(/([A-Z])/g, ' $1').trim()} content={value} icon={FiLayers} phaseIdx={phaseIdx} isDark={isDark} />
                ))}
              </SimpleGrid>
            );
          })()}

          {/* Item sticky notes from enrichedNeeds */}
          {phase.items.length > 0 && (
            <>
              <Text fontSize="sm" fontWeight="bold" color="gray.500" mb={2} mt={2}>
                Items de Contratacion ({phase.items.length})
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={3}>
                {phase.items.map((item, i) => (
                  <ItemStickyNote key={i} item={item} phaseIdx={phaseIdx} isDark={isDark} />
                ))}
              </SimpleGrid>
            </>
          )}

          {/* Additional recommended items */}
          {phase.additionalItems.length > 0 && (
            <Box mt={3}>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2}>
                Items Adicionales Recomendados
              </Text>
              <HStack gap={2} flexWrap="wrap">
                {phase.additionalItems.map((item, i) => (
                  <Badge key={i} colorPalette="purple" variant="outline" fontSize="xs" px={2} py={1}>
                    + {item}
                  </Badge>
                ))}
              </HStack>
            </Box>
          )}
        </Box>
      ))}

      {/* Proposal items (from itemsData) */}
      {proposalItems.length > 0 && (
        <Box>
          <HStack mb={3} gap={2}>
            <Flex w="32px" h="32px" borderRadius="full" bg="green.500" align="center" justify="center" flexShrink={0}>
              <Icon as={FiPackage} color="white" boxSize={4} />
            </Flex>
            <Text fontSize="sm" fontWeight="bold" color={isDark ? 'green.300' : 'green.700'}>
              Propuesta Final — {proposalItems.length} Items
            </Text>
            <Separator flex={1} borderColor="green.300" opacity={0.3} />
          </HStack>
          {isEditing ? (
            /* Editable proposal items as compact cards */
            <VStack gap={3} align="stretch">
              {proposalItems.map((item, idx) => (
                <Box
                  key={item.idx}
                  p={3}
                  bg={isDark ? 'gray.700' : 'green.50'}
                  borderRadius="md"
                  border="2px solid"
                  borderColor="blue.400"
                >
                  <HStack mb={2}>
                    <Badge colorPalette="green">#{item.idx}</Badge>
                    <Badge colorPalette="blue" fontSize="9px">Editando</Badge>
                  </HStack>
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={2}>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" mb={1}>CPC</Text>
                      <Input size="xs" value={item.cpc} onChange={(e) => onProposalItemChange?.(idx, 'cpc', e.target.value)} />
                    </Box>
                    <Box gridColumn={{ sm: 'span 2' }}>
                      <Text fontSize="xs" fontWeight="bold" mb={1}>Descripcion</Text>
                      <Input size="xs" value={item.description} onChange={(e) => onProposalItemChange?.(idx, 'description', e.target.value)} />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" mb={1}>Tipo</Text>
                      <Input size="xs" value={item.type} onChange={(e) => onProposalItemChange?.(idx, 'type', e.target.value)} />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" mb={1}>Procedimiento</Text>
                      <Input size="xs" value={item.procedure} onChange={(e) => onProposalItemChange?.(idx, 'procedure', e.target.value)} />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" mb={1}>Cantidad</Text>
                      <Input size="xs" type="number" value={item.quantity} onChange={(e) => onProposalItemChange?.(idx, 'quantity', Number(e.target.value))} />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" mb={1}>C. Unitario</Text>
                      <Input size="xs" type="number" value={item.unitCost} onChange={(e) => onProposalItemChange?.(idx, 'unitCost', Number(e.target.value))} />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" mb={1}>Total</Text>
                      <Input size="xs" type="number" value={item.total} onChange={(e) => onProposalItemChange?.(idx, 'total', Number(e.target.value))} />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" mb={1}>Periodo</Text>
                      <Input size="xs" value={item.period} onChange={(e) => onProposalItemChange?.(idx, 'period', e.target.value)} />
                    </Box>
                  </SimpleGrid>
                </Box>
              ))}
            </VStack>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={3}>
              {proposalItems.map((item) => (
                <ProposalItemStickyNote key={item.idx} item={item} isDark={isDark} />
              ))}
            </SimpleGrid>
          )}
        </Box>
      )}
    </VStack>
  );
};

// ============================================================================
// View: Table
// ============================================================================

const TableView: React.FC<{
  phases: ParsedPhase[];
  proposalItems: ProposalItem[];
  isDark: boolean;
  isEditing: boolean;
  onProposalItemChange?: (itemIdx: number, field: string, value: string | number) => void;
}> = ({ phases, proposalItems, isDark, isEditing, onProposalItemChange }) => {
  const [search, setSearch] = useState('');

  // Combine items from phases and proposal
  const phaseItems = phases.flatMap(p => p.items);
  const hasPhaseItems = phaseItems.length > 0;
  const hasProposalItems = proposalItems.length > 0;

  const filteredPhaseItems = search
    ? phaseItems.filter(i => i.description.toLowerCase().includes(search.toLowerCase()) || i.cpc.includes(search))
    : phaseItems;

  const filteredProposalItems = search
    ? proposalItems.filter(i => i.description.toLowerCase().includes(search.toLowerCase()) || i.cpc.includes(search))
    : proposalItems;

  // For editing we need the original index, not the filtered index
  const getOriginalIdx = (item: ProposalItem) => proposalItems.findIndex(p => p.idx === item.idx);

  return (
    <VStack gap={4} align="stretch">
      {/* Search */}
      <HStack>
        <Box position="relative" flex={1} maxW="300px">
          <Input
            placeholder="Buscar en items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="sm"
            pl={8}
          />
          <Box position="absolute" left={2} top="50%" transform="translateY(-50%)" color="gray.400">
            <FiSearch size={14} />
          </Box>
        </Box>
        <Text fontSize="xs" color="gray.500">
          {filteredPhaseItems.length + filteredProposalItems.length} items
        </Text>
      </HStack>

      {/* Phase items table */}
      {hasPhaseItems && (
        <Box overflowX="auto" borderRadius="lg" border="1px solid" borderColor={isDark ? 'gray.600' : 'gray.200'}>
          <Table.Root size="sm" striped>
            <Table.Header>
              <Table.Row bg={isDark ? 'blue.900' : 'blue.600'}>
                <Table.ColumnHeader color="white" fontSize="xs">#</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs">CPC</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs">Descripcion</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs">Tipo</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs">Regimen</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs">Procedimiento</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs" textAlign="center">Cant.</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs">Unidad</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs" textAlign="right">C. Unit.</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs" textAlign="right">Total</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs">Periodo</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredPhaseItems.map((item, idx) => (
                <Table.Row key={idx} _hover={{ bg: isDark ? 'gray.600' : 'blue.50' }}>
                  <Table.Cell fontSize="xs">{item.lineNumber}</Table.Cell>
                  <Table.Cell fontSize="xs" fontFamily="mono" color="blue.500">{item.cpc}</Table.Cell>
                  <Table.Cell fontSize="xs" maxW="250px"><Text truncate>{item.description}</Text></Table.Cell>
                  <Table.Cell><Badge fontSize="9px" colorPalette={item.type === 'S' ? 'green' : 'blue'}>{item.type}</Badge></Table.Cell>
                  <Table.Cell fontSize="xs">{item.regime}</Table.Cell>
                  <Table.Cell fontSize="xs">{item.procedure}</Table.Cell>
                  <Table.Cell fontSize="xs" textAlign="center">{item.quantity}</Table.Cell>
                  <Table.Cell fontSize="xs">{item.unit}</Table.Cell>
                  <Table.Cell fontSize="xs" textAlign="right">{item.unitCost}</Table.Cell>
                  <Table.Cell fontSize="xs" textAlign="right" fontWeight="bold" color="green.500">{item.total}</Table.Cell>
                  <Table.Cell fontSize="xs">{item.period}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Proposal items table (from itemsData) */}
      {hasProposalItems && (
        <Box overflowX="auto" borderRadius="lg" border="1px solid" borderColor={isDark ? 'gray.600' : 'gray.200'}>
          {hasPhaseItems && (
            <Box bg={isDark ? 'green.900' : 'green.600'} color="white" px={4} py={2}>
              <HStack>
                <Icon as={FiPackage} />
                <Text fontSize="sm" fontWeight="bold">Propuesta Final — {filteredProposalItems.length} Items</Text>
              </HStack>
            </Box>
          )}
          <Table.Root size="sm" striped>
            <Table.Header>
              <Table.Row bg={isDark ? 'green.900' : 'green.600'}>
                <Table.ColumnHeader color="white" fontSize="xs">#</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs">CPC</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs">Descripcion</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs">Tipo</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs">Procedimiento</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs" textAlign="center">Cant.</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs" textAlign="right">C. Unit.</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs" textAlign="right">Total</Table.ColumnHeader>
                <Table.ColumnHeader color="white" fontSize="xs">Periodo</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredProposalItems.map((item) => {
                const origIdx = getOriginalIdx(item);
                return (
                  <Table.Row key={item.idx} _hover={{ bg: isDark ? 'gray.600' : 'green.50' }}>
                    <Table.Cell fontSize="xs">{item.idx}</Table.Cell>
                    <Table.Cell fontSize="xs" fontFamily="mono" color="blue.500">
                      {isEditing ? (
                        <Input size="xs" value={item.cpc} onChange={(e) => onProposalItemChange?.(origIdx, 'cpc', e.target.value)} w="100px" />
                      ) : (item.cpc || '-')}
                    </Table.Cell>
                    <Table.Cell fontSize="xs" maxW="300px">
                      {isEditing ? (
                        <Input size="xs" value={item.description} onChange={(e) => onProposalItemChange?.(origIdx, 'description', e.target.value)} w="200px" />
                      ) : (<Text truncate>{item.description}</Text>)}
                    </Table.Cell>
                    <Table.Cell>
                      {isEditing ? (
                        <Input size="xs" value={item.type} onChange={(e) => onProposalItemChange?.(origIdx, 'type', e.target.value)} w="80px" />
                      ) : (item.type ? <Badge fontSize="9px" colorPalette="green">{item.type}</Badge> : '-')}
                    </Table.Cell>
                    <Table.Cell fontSize="xs">
                      {isEditing ? (
                        <Input size="xs" value={item.procedure} onChange={(e) => onProposalItemChange?.(origIdx, 'procedure', e.target.value)} w="100px" />
                      ) : (item.procedure || '-')}
                    </Table.Cell>
                    <Table.Cell fontSize="xs" textAlign="center">
                      {isEditing ? (
                        <Input size="xs" type="number" value={item.quantity} onChange={(e) => onProposalItemChange?.(origIdx, 'quantity', Number(e.target.value))} w="60px" />
                      ) : item.quantity}
                    </Table.Cell>
                    <Table.Cell fontSize="xs" textAlign="right">
                      {isEditing ? (
                        <Input size="xs" type="number" value={item.unitCost} onChange={(e) => onProposalItemChange?.(origIdx, 'unitCost', Number(e.target.value))} w="80px" />
                      ) : (item.unitCost > 0 ? formatCurrency(item.unitCost) : '-')}
                    </Table.Cell>
                    <Table.Cell fontSize="xs" textAlign="right" fontWeight="bold" color="green.500">
                      {isEditing ? (
                        <Input size="xs" type="number" value={item.total} onChange={(e) => onProposalItemChange?.(origIdx, 'total', Number(e.target.value))} w="80px" />
                      ) : (item.total > 0 ? formatCurrency(item.total) : '-')}
                    </Table.Cell>
                    <Table.Cell fontSize="xs">
                      {isEditing ? (
                        <Input size="xs" value={item.period} onChange={(e) => onProposalItemChange?.(origIdx, 'period', e.target.value)} w="100px" />
                      ) : (item.period || '-')}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
          {hasProposalItems && (
            <Box bg={isDark ? 'gray.700' : 'gray.100'} px={4} py={2} borderTop="1px solid" borderColor={isDark ? 'gray.600' : 'gray.300'}>
              <Flex justify="flex-end">
                <Text fontSize="sm" fontWeight="bold" color="green.500">
                  Total: {formatCurrency(filteredProposalItems.reduce((sum, i) => sum + i.total, 0))}
                </Text>
              </Flex>
            </Box>
          )}
        </Box>
      )}

      {!hasPhaseItems && !hasProposalItems && (
        <Text textAlign="center" color="gray.500" py={4}>
          No hay items estructurados — use la vista Mural o Documento para ver los datos de las fases
        </Text>
      )}

      {/* Phase summaries below table */}
      {phases.filter(p => p.needs && !p.isCodeOnly).map(phase => (
        <Box key={phase.phaseKey} p={3} bg={isDark ? 'gray.700' : 'gray.50'} borderRadius="lg">
          <Badge colorPalette="blue" mb={2}>Fase {phase.phaseNumber} — Necesidades</Badge>
          <Text fontSize="sm" whiteSpace="pre-wrap">{phase.needs}</Text>
        </Box>
      ))}
    </VStack>
  );
};

// ============================================================================
// View: Document / Report
// ============================================================================

const DocumentView: React.FC<{
  phases: ParsedPhase[];
  proposalItems: ProposalItem[];
  isDark: boolean;
  departmentName: string;
  entityName: string;
  fiscalYear: number;
  isEditing: boolean;
  onPhaseFieldChange?: (phaseIdx: number, field: string, value: string) => void;
  onProposalItemChange?: (itemIdx: number, field: string, value: string | number) => void;
}> = ({ phases, proposalItems, isDark, departmentName, entityName, fiscalYear, isEditing, onPhaseFieldChange, onProposalItemChange }) => {
  const bgColor = isDark ? 'gray.750' : 'white';
  const textColor = isDark ? 'gray.100' : 'gray.800';

  return (
    <Box
      bg={bgColor}
      p={8}
      borderRadius="xl"
      border="1px solid"
      borderColor={isDark ? 'gray.600' : 'gray.300'}
      maxW="900px"
      mx="auto"
      boxShadow="lg"
      fontFamily="serif"
    >
      {/* Document header */}
      <VStack gap={1} mb={6} textAlign="center">
        <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="widest">
          Republica del Ecuador
        </Text>
        <Heading size="md" color={textColor}>
          Plan Anual de Contratacion
        </Heading>
        <Heading size="sm" color="blue.500">
          {entityName}
        </Heading>
        <Text fontSize="sm" color={textColor}>
          Departamento: {departmentName} — Anio Fiscal {fiscalYear}
        </Text>
        <Separator my={3} />
      </VStack>

      {/* Phases as document sections */}
      {phases.map((phase, phaseIdx) => {
        const palette = isDark ? methodologyColorsDark : methodologyColors;
        const color = palette[phaseIdx % palette.length];

        return (
          <Box key={phase.phaseKey} mb={8}>
            <Heading
              size="sm"
              color={color.border}
              mb={3}
              borderBottom="2px solid"
              borderColor={color.border}
              pb={1}
            >
              {phaseIdx + 1}. {phase.isCodeOnly ? phase.phaseName : `Fase ${phase.phaseNumber}`}
            </Heading>

            {/* Code-only phases */}
            {phase.isCodeOnly && (
              <Box mb={4} bg={color.bg} p={3} borderRadius="md" borderLeft="4px solid" borderColor={color.border}>
                <Text fontSize="sm" color={color.text}>
                  {phase.summary || `Fase completada: ${phase.phaseName}`}
                </Text>
              </Box>
            )}

            {phase.needs && (
              <Box mb={4}>
                <Text fontSize="sm" fontWeight="bold" color={textColor} mb={1}>
                  {phaseIdx + 1}.1 Necesidades Identificadas
                </Text>
                {isEditing ? (
                  <Textarea
                    value={phase.needs}
                    onChange={(e) => onPhaseFieldChange?.(phaseIdx, 'needs', e.target.value)}
                    fontSize="sm"
                    border="2px solid"
                    borderColor="blue.400"
                    ml={2}
                    minH="80px"
                  />
                ) : (
                  <Text fontSize="sm" color={textColor} whiteSpace="pre-wrap" pl={4} borderLeft="3px solid" borderColor={color.border} ml={2}>
                    {phase.needs}
                  </Text>
                )}
              </Box>
            )}

            {phase.priorities && (
              <Box mb={4}>
                <Text fontSize="sm" fontWeight="bold" color={textColor} mb={1}>
                  {phaseIdx + 1}.2 Prioridades
                </Text>
                {isEditing ? (
                  <Textarea
                    value={phase.priorities}
                    onChange={(e) => onPhaseFieldChange?.(phaseIdx, 'priorities', e.target.value)}
                    fontSize="sm"
                    border="2px solid"
                    borderColor="blue.400"
                    pl={4}
                    minH="60px"
                  />
                ) : (
                  <Text fontSize="sm" color={textColor} pl={4}>{phase.priorities}</Text>
                )}
              </Box>
            )}

            {phase.timeline && (
              <Box mb={4}>
                <Text fontSize="sm" fontWeight="bold" color={textColor} mb={1}>
                  {phaseIdx + 1}.3 Cronograma
                </Text>
                {isEditing ? (
                  <Textarea
                    value={phase.timeline}
                    onChange={(e) => onPhaseFieldChange?.(phaseIdx, 'timeline', e.target.value)}
                    fontSize="sm"
                    border="2px solid"
                    borderColor="blue.400"
                    pl={4}
                    minH="60px"
                  />
                ) : (
                  <Text fontSize="sm" color={textColor} pl={4}>{phase.timeline}</Text>
                )}
              </Box>
            )}

            {phase.items.length > 0 && (
              <Box mb={4}>
                <Text fontSize="sm" fontWeight="bold" color={textColor} mb={2}>
                  {phaseIdx + 1}.4 Items de Contratacion Propuestos
                </Text>
                <Box overflowX="auto">
                  <Table.Root size="sm" variant="outline">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader fontSize="xs" fontWeight="bold">#</Table.ColumnHeader>
                        <Table.ColumnHeader fontSize="xs" fontWeight="bold">CPC</Table.ColumnHeader>
                        <Table.ColumnHeader fontSize="xs" fontWeight="bold">Descripcion</Table.ColumnHeader>
                        <Table.ColumnHeader fontSize="xs" fontWeight="bold">Tipo</Table.ColumnHeader>
                        <Table.ColumnHeader fontSize="xs" fontWeight="bold">Procedimiento</Table.ColumnHeader>
                        <Table.ColumnHeader fontSize="xs" fontWeight="bold" textAlign="center">Cant.</Table.ColumnHeader>
                        <Table.ColumnHeader fontSize="xs" fontWeight="bold">Periodo</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {phase.items.map((item, i) => (
                        <Table.Row key={i}>
                          <Table.Cell fontSize="xs">{item.lineNumber}</Table.Cell>
                          <Table.Cell fontSize="xs" fontFamily="mono">{item.cpc}</Table.Cell>
                          <Table.Cell fontSize="xs">{item.description}</Table.Cell>
                          <Table.Cell fontSize="xs">{item.type}</Table.Cell>
                          <Table.Cell fontSize="xs">{item.procedure}</Table.Cell>
                          <Table.Cell fontSize="xs" textAlign="center">{item.quantity} {item.unit}</Table.Cell>
                          <Table.Cell fontSize="xs">{item.period}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              </Box>
            )}

            {phase.additionalItems.length > 0 && (
              <Box mb={4}>
                <Text fontSize="sm" fontWeight="bold" color={textColor} mb={1}>
                  Items Adicionales Recomendados
                </Text>
                <VStack align="start" pl={4} gap={1}>
                  {phase.additionalItems.map((item, i) => (
                    <Text key={i} fontSize="sm" color={textColor}>- {item}</Text>
                  ))}
                </VStack>
              </Box>
            )}

            {Object.entries(phase.extraFields).map(([key, value]) => (
              <Box key={key} mb={4}>
                <Text fontSize="sm" fontWeight="bold" color={textColor} mb={1}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Text>
                <Text fontSize="sm" color={textColor} pl={4} whiteSpace="pre-wrap">{value}</Text>
              </Box>
            ))}

            {phase.summary && !phase.isCodeOnly && (
              <Box bg={isDark ? `${color.bg}` : color.bg} p={3} borderRadius="md" mt={2}>
                {isEditing ? (
                  <Textarea
                    value={phase.summary}
                    onChange={(e) => onPhaseFieldChange?.(phaseIdx, 'summary', e.target.value)}
                    fontSize="sm"
                    fontWeight="bold"
                    color={color.border}
                    border="2px solid"
                    borderColor="blue.400"
                    minH="40px"
                  />
                ) : (
                  <Text fontSize="sm" fontWeight="bold" color={color.border}>
                    Resumen: {phase.summary}
                  </Text>
                )}
              </Box>
            )}
          </Box>
        );
      })}

      {/* Proposal items section */}
      {proposalItems.length > 0 && (
        <Box mb={8}>
          <Heading size="sm" color="green.600" mb={3} borderBottom="2px solid" borderColor="green.300" pb={1}>
            {phases.length + 1}. Propuesta Final de Contratacion
          </Heading>
          <Box overflowX="auto">
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader fontSize="xs" fontWeight="bold">#</Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="xs" fontWeight="bold">CPC</Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="xs" fontWeight="bold">Descripcion</Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="xs" fontWeight="bold">Tipo</Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="xs" fontWeight="bold">Procedimiento</Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="xs" fontWeight="bold" textAlign="center">Cant.</Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="xs" fontWeight="bold" textAlign="right">Total</Table.ColumnHeader>
                  <Table.ColumnHeader fontSize="xs" fontWeight="bold">Periodo</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {proposalItems.map((item, idx) => (
                  <Table.Row key={item.idx}>
                    <Table.Cell fontSize="xs">{item.idx}</Table.Cell>
                    <Table.Cell fontSize="xs" fontFamily="mono">
                      {isEditing ? (
                        <Input size="xs" value={item.cpc} onChange={(e) => onProposalItemChange?.(idx, 'cpc', e.target.value)} w="100px" />
                      ) : (item.cpc || '-')}
                    </Table.Cell>
                    <Table.Cell fontSize="xs">
                      {isEditing ? (
                        <Input size="xs" value={item.description} onChange={(e) => onProposalItemChange?.(idx, 'description', e.target.value)} w="200px" />
                      ) : item.description}
                    </Table.Cell>
                    <Table.Cell fontSize="xs">
                      {isEditing ? (
                        <Input size="xs" value={item.type} onChange={(e) => onProposalItemChange?.(idx, 'type', e.target.value)} w="80px" />
                      ) : (item.type || '-')}
                    </Table.Cell>
                    <Table.Cell fontSize="xs">
                      {isEditing ? (
                        <Input size="xs" value={item.procedure} onChange={(e) => onProposalItemChange?.(idx, 'procedure', e.target.value)} w="100px" />
                      ) : (item.procedure || '-')}
                    </Table.Cell>
                    <Table.Cell fontSize="xs" textAlign="center">
                      {isEditing ? (
                        <Input size="xs" type="number" value={item.quantity} onChange={(e) => onProposalItemChange?.(idx, 'quantity', Number(e.target.value))} w="60px" />
                      ) : item.quantity}
                    </Table.Cell>
                    <Table.Cell fontSize="xs" textAlign="right" fontWeight="bold">
                      {isEditing ? (
                        <Input size="xs" type="number" value={item.total} onChange={(e) => onProposalItemChange?.(idx, 'total', Number(e.target.value))} w="80px" />
                      ) : (item.total > 0 ? formatCurrency(item.total) : '-')}
                    </Table.Cell>
                    <Table.Cell fontSize="xs">
                      {isEditing ? (
                        <Input size="xs" value={item.period} onChange={(e) => onProposalItemChange?.(idx, 'period', e.target.value)} w="100px" />
                      ) : (item.period || '-')}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
          {proposalItems.some(i => i.total > 0) && (
            <Box textAlign="right" mt={2}>
              <Text fontSize="sm" fontWeight="bold" color="green.600">
                Presupuesto Total: {formatCurrency(proposalItems.reduce((sum, i) => sum + i.total, 0))}
              </Text>
            </Box>
          )}
        </Box>
      )}

      {/* Footer */}
      <Separator my={4} />
      <Text fontSize="xs" color="gray.500" textAlign="center">
        Documento generado automaticamente — Plan Anual de Contratacion {fiscalYear}
      </Text>
    </Box>
  );
};

// ============================================================================
// Main Component
// ============================================================================

interface PlanViewerMuralProps {
  phaseData: string | null;
  itemsData: string | null;
  departmentName: string;
  entityName: string;
  fiscalYear: number;
  isDark: boolean;
  onEdit: () => void;
  onSave?: (phaseDataJson: string, itemsDataJson: string) => Promise<void>;
  allowInlineEdit?: boolean;
  methodologyId?: number | null;
  workspaceId?: number;
  departmentPlanId?: number;
  fieldCommentCounts?: Record<string, number>;
  fieldProposalCounts?: Record<string, number>;
  currentUserName?: string;
  currentUserRole?: string;
  onProposeChange?: (fieldCode: string, phaseIdx: number, currentValue: string) => void;
  fieldChanges?: CPPAAFieldChangeLog[];
}

export const PlanViewerMural: React.FC<PlanViewerMuralProps> = ({
  phaseData,
  itemsData,
  departmentName,
  entityName,
  fiscalYear,
  isDark,
  onEdit,
  onSave,
  allowInlineEdit = false,
  methodologyId,
  workspaceId,
  departmentPlanId,
  fieldCommentCounts,
  fieldProposalCounts,
  currentUserName,
  currentUserRole,
  onProposeChange,
  fieldChanges,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('mural');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { getColors } = useTheme();
  const colors = getColors();
  const cardBg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.600' : 'gray.200';

  // Fetch methodology fieldMappings for DB-driven card rendering
  const [fieldMappingsByPhase, setFieldMappingsByPhase] = useState<Record<number, CPPAAPhaseFieldMapping[]>>({});

  useEffect(() => {
    if (!methodologyId) return;
    let cancelled = false;
    getMethodology(methodologyId).then((meth: CPPAAMethodology) => {
      if (cancelled) return;
      const byPhase: Record<number, CPPAAPhaseFieldMapping[]> = {};
      for (const phase of meth.phases || []) {
        if (phase.fieldMappings && phase.fieldMappings.length > 0) {
          // Include any phase that has fieldMappings with a label or non-default componentType
          const hasConfigured = phase.fieldMappings.some(
            fm => fm.label || (fm.componentType && fm.componentType !== 'TEXT')
          );
          if (hasConfigured) {
            // Only include configured mappings (those with label set)
            byPhase[phase.phaseNumber] = phase.fieldMappings.filter(fm => fm.label);
          }
        }
      }
      console.log('[PlanViewerMural] Loaded fieldMappingsByPhase:', byPhase);
      setFieldMappingsByPhase(byPhase);
    }).catch((err) => {
      console.warn('[PlanViewerMural] Failed to load methodology fieldMappings:', err);
    });
    return () => { cancelled = true; };
  }, [methodologyId]);

  // Parse all phases (read-only source)
  const parsedPhases = useMemo(() => {
    let phases: Record<string, any> = {};
    try {
      if (phaseData) phases = JSON.parse(phaseData);
    } catch { /* ignore */ }
    return Object.entries(phases).map(([key, value], idx) => parsePhaseData(key, value, idx));
  }, [phaseData]);

  // Parse proposal items (read-only source)
  const parsedProposalItems = useMemo(() => parseProposalItems(itemsData), [itemsData]);

  // Editable copies (only used when editing)
  const [editedPhases, setEditedPhases] = useState<ParsedPhase[]>([]);
  const [editedProposalItems, setEditedProposalItems] = useState<ProposalItem[]>([]);

  // Active data: use edited copies when editing, originals otherwise
  const activePhases = isEditing ? editedPhases : parsedPhases;
  const activeProposalItems = isEditing ? editedProposalItems : parsedProposalItems;

  const totalPhaseItems = activePhases.reduce((sum, p) => sum + p.items.length, 0);
  const totalItems = totalPhaseItems + activeProposalItems.length;

  // Enter edit mode
  const handleStartEditing = useCallback(() => {
    setEditedPhases(structuredClone(parsedPhases));
    setEditedProposalItems(structuredClone(parsedProposalItems));
    setIsEditing(true);
  }, [parsedPhases, parsedProposalItems]);

  // Cancel edit mode
  const handleCancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditedPhases([]);
    setEditedProposalItems([]);
  }, []);

  // Save changes
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      const phaseJson = serializePhases(editedPhases);
      const itemsJson = serializeProposalItems(editedProposalItems, itemsData);
      await onSave(phaseJson, itemsJson);
      setIsEditing(false);
      setEditedPhases([]);
      setEditedProposalItems([]);
    } catch {
      // Error handling is done by the parent via onSave
    } finally {
      setIsSaving(false);
    }
  }, [onSave, editedPhases, editedProposalItems, itemsData]);

  // Phase field change handler
  const handlePhaseFieldChange = useCallback((phaseIdx: number, field: string, value: string) => {
    setEditedPhases(prev => {
      const copy = [...prev];
      copy[phaseIdx] = { ...copy[phaseIdx], [field]: value };
      return copy;
    });
  }, []);

  // Proposal item field change handler
  const handleProposalItemChange = useCallback((itemIdx: number, field: string, value: string | number) => {
    setEditedProposalItems(prev => {
      const copy = [...prev];
      copy[itemIdx] = { ...copy[itemIdx], [field]: value };
      return copy;
    });
  }, []);

  return (
    <Box>
      {/* View mode toolbar */}
      <MotionBox
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        bg={cardBg}
        p={3}
        borderRadius="xl"
        border={isEditing ? '2px solid' : '1px solid'}
        borderColor={isEditing ? 'blue.400' : borderColor}
        mb={4}
      >
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
          <HStack>
            <Text fontSize="sm" fontWeight="bold" color={colors.text}>Vista:</Text>
            <HStack gap={1} bg={isDark ? 'gray.700' : 'gray.100'} p={1} borderRadius="lg">
              <Button
                size="xs"
                variant={viewMode === 'mural' ? 'solid' : 'ghost'}
                colorPalette={viewMode === 'mural' ? 'blue' : undefined}
                onClick={() => setViewMode('mural')}
              >
                <Icon as={FiGrid} mr={1} /> Mural
              </Button>
              <Button
                size="xs"
                variant={viewMode === 'table' ? 'solid' : 'ghost'}
                colorPalette={viewMode === 'table' ? 'blue' : undefined}
                onClick={() => setViewMode('table')}
              >
                <Icon as={FiList} mr={1} /> Tabla
              </Button>
              <Button
                size="xs"
                variant={viewMode === 'document' ? 'solid' : 'ghost'}
                colorPalette={viewMode === 'document' ? 'blue' : undefined}
                onClick={() => setViewMode('document')}
              >
                <Icon as={FiFileText} mr={1} /> Documento
              </Button>
            </HStack>
          </HStack>
          <HStack>
            <Badge colorPalette="blue">{activePhases.length} fases</Badge>
            {totalItems > 0 && <Badge colorPalette="green">{totalItems} items</Badge>}

            {isEditing ? (
              /* Edit mode toolbar */
              <>
                <Badge colorPalette="blue" variant="solid" fontSize="xs" px={2} py={1}>
                  <Icon as={FiEdit} mr={1} /> Modo Edicion
                </Badge>
                <Button
                  size="xs"
                  variant="ghost"
                  colorPalette="gray"
                  onClick={handleCancelEditing}
                  disabled={isSaving}
                >
                  <Icon as={FiX} mr={1} /> Cancelar
                </Button>
                <Button
                  size="xs"
                  variant="solid"
                  colorPalette="green"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? <Spinner size="xs" mr={1} /> : <Icon as={FiSave} mr={1} />}
                  Guardar Todo
                </Button>
              </>
            ) : (
              /* Normal toolbar */
              <>
                {allowInlineEdit && onSave && (
                  <Button size="xs" variant="outline" colorPalette="purple" onClick={handleStartEditing}>
                    <Icon as={FiEdit} mr={1} /> Modo Edicion
                  </Button>
                )}
                <Button size="xs" variant="outline" colorPalette="blue" onClick={onEdit}>
                  <Icon as={FiEdit} mr={1} /> Editar con IA
                </Button>
              </>
            )}
          </HStack>
        </Flex>
      </MotionBox>

      {/* Content */}
      <AnimatePresence mode="wait">
        <MotionBox
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === 'mural' && (
            <MuralView
              phases={activePhases}
              proposalItems={activeProposalItems}
              isDark={isDark}
              isEditing={isEditing}
              allowInlineEdit={allowInlineEdit}
              entityName={entityName}
              fiscalYear={fiscalYear}
              fieldMappingsByPhase={Object.keys(fieldMappingsByPhase).length > 0 ? fieldMappingsByPhase : undefined}
              onPhaseFieldChange={handlePhaseFieldChange}
              onProposalItemChange={handleProposalItemChange}
              onStartEditing={handleStartEditing}
              workspaceId={workspaceId}
              departmentPlanId={departmentPlanId}
              fieldCommentCounts={fieldCommentCounts}
              fieldProposalCounts={fieldProposalCounts}
              currentUserName={currentUserName}
              currentUserRole={currentUserRole}
              onProposeChange={onProposeChange}
              fieldChanges={fieldChanges}
            />
          )}
          {viewMode === 'table' && (
            <TableView
              phases={activePhases}
              proposalItems={activeProposalItems}
              isDark={isDark}
              isEditing={isEditing}
              onProposalItemChange={handleProposalItemChange}
            />
          )}
          {viewMode === 'document' && (
            <DocumentView
              phases={activePhases}
              proposalItems={activeProposalItems}
              isDark={isDark}
              departmentName={departmentName}
              entityName={entityName}
              fiscalYear={fiscalYear}
              isEditing={isEditing}
              onPhaseFieldChange={handlePhaseFieldChange}
              onProposalItemChange={handleProposalItemChange}
            />
          )}
        </MotionBox>
      </AnimatePresence>
    </Box>
  );
};

export default PlanViewerMural;
