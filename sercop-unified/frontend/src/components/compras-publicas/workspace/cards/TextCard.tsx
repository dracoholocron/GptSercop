import { useState, useCallback, useRef, useMemo } from 'react';
import {
  Box, HStack, VStack, Text, Icon, Textarea, Badge, Button, Spinner,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiEdit, FiCheckCircle, FiAlertCircle, FiInfo, FiCpu, FiEye } from 'react-icons/fi';
import { getLegalHelp } from '../../../../services/cpAIService';
import type { CardComponentProps } from './types';
import { getPhaseColor } from './types';
import { DiffHighlightedText } from '../DiffHighlightedText';
import { keyframes } from '@emotion/react';

const MotionBox = motion.create(Box as any);

/** Pulse glow animation for recently modified cards — strong enough for dark mode */
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(56, 178, 172, 0.7); }
  40% { box-shadow: 0 0 20px 6px rgba(56, 178, 172, 0.5); }
  100% { box-shadow: 0 0 0 0 rgba(56, 178, 172, 0); }
`;

/** Check if a change happened within the last N minutes */
function isRecentChange(changedAt: string, minutesThreshold = 30): boolean {
  const diff = Date.now() - new Date(changedAt).getTime();
  return diff < minutesThreshold * 60 * 1000;
}

const TextCard: React.FC<CardComponentProps> = ({
  fieldConfig, value, phaseIdx, isDark, isEditing, onChange, entityName, fiscalYear, fieldChangeInfo, onDismissChange,
}) => {
  const color = getPhaseColor(phaseIdx, isDark);
  const size = (fieldConfig.cardSize || 'md') as 'sm' | 'md' | 'lg';

  const [showDiff, setShowDiff] = useState(true);
  const [validation, setValidation] = useState<{ status: string; message: string }>({ status: 'idle', message: '' });
  const [isValidating, setIsValidating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>();

  const minLen = fieldConfig.minLength || 0;
  const maxLen = fieldConfig.maxLength || 10000;

  const runBasicValidation = useCallback((val: string) => {
    if (!val.trim()) return { status: 'error', message: 'Este campo no puede estar vacio' };
    if (val.trim().length < minLen) return { status: 'warning', message: `Minimo ${minLen} caracteres (actual: ${val.trim().length})` };
    if (val.trim().length > maxLen) return { status: 'error', message: `Maximo ${maxLen} caracteres excedido` };
    return { status: 'valid', message: '' };
  }, [minLen, maxLen]);

  const runAIValidation = useCallback(async (val: string) => {
    if (!fieldConfig.aiValidationOnBlur || !fieldConfig.aiStep) return;
    const basic = runBasicValidation(val);
    if (basic.status === 'error') { setValidation(basic); return; }
    setIsValidating(true);
    try {
      const resp = await getLegalHelp({
        processType: 'PAA',
        currentStep: fieldConfig.aiStep,
        fieldId: fieldConfig.aiFieldId || 'GENERAL',
        question: `${fieldConfig.aiValidationPrompt || 'Valida este contenido.'}\n\nCONTENIDO:\n"${val.substring(0, 1500)}"${entityName ? `\nENTIDAD: ${entityName}` : ''}${fiscalYear ? `\nANO FISCAL: ${fiscalYear}` : ''}`,
      });
      if (resp.severity === 'REQUIRED') {
        setValidation({ status: 'error', message: resp.content?.substring(0, 200) || 'Error detectado' });
      } else if (resp.severity === 'WARNING') {
        setValidation({ status: 'warning', message: resp.tips?.[0] || 'Revise posibles mejoras' });
      } else {
        setValidation({ status: 'valid', message: resp.tips?.[0] || 'Validado por IA' });
      }
    } catch {
      setValidation(runBasicValidation(val));
    } finally {
      setIsValidating(false);
    }
  }, [fieldConfig, entityName, fiscalYear, runBasicValidation]);

  const handleBlur = useCallback(() => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => {
      if (value.trim().length >= minLen) runAIValidation(value);
      else setValidation(runBasicValidation(value));
    }, 500);
  }, [value, minLen, runAIValidation, runBasicValidation]);

  const handleSuggest = useCallback(async () => {
    if (!fieldConfig.aiAssistEnabled) return;
    setIsSuggesting(true);
    setShowSuggestion(false);
    try {
      const resp = await getLegalHelp({
        processType: 'PAA',
        currentStep: fieldConfig.aiStep || 'PAA_GENERAL',
        fieldId: `${fieldConfig.aiFieldId || 'GENERAL'}_SUGGEST`,
        question: `${fieldConfig.aiSuggestionPrompt || 'Genera contenido sugerido.'}\n\nCONTEXTO: ${value ? `Contenido actual: "${value.substring(0, 500)}"` : 'Campo vacio.'}${entityName ? `\nENTIDAD: ${entityName}` : ''}${fiscalYear ? `\nANO: ${fiscalYear}` : ''}\n\nGenera SOLO el contenido sugerido.`,
      });
      const suggestion = resp.content || '';
      if (suggestion) { setAiSuggestion(suggestion); setShowSuggestion(true); }
    } catch { /* silent */ }
    finally { setIsSuggesting(false); }
  }, [value, fieldConfig, entityName, fiscalYear]);

  const toggleDiff = useCallback(() => {
    setShowDiff(prev => !prev);
  }, []);

  const validationBorderColor = validation.status === 'error' ? 'red.400' :
    validation.status === 'warning' ? 'orange.400' :
    validation.status === 'valid' ? 'green.400' : color.border;

  // --- Editing mode ---
  if (isEditing && fieldConfig.isEditable) {
    return (
      <Box
        bg={color.bg} border="2px solid" borderColor={validationBorderColor}
        borderRadius="md" p={size === 'sm' ? 3 : 4} boxShadow="md"
        minH={size === 'sm' ? '80px' : size === 'lg' ? '180px' : '120px'}
        position="relative"
        _before={{ content: '""', position: 'absolute', top: 0, left: '20%', right: '20%', height: '4px', bg: validationBorderColor, borderRadius: '0 0 4px 4px' }}
      >
        <HStack mb={2} gap={1}>
          <Text fontSize="xs" fontWeight="bold" color={color.border} textTransform="uppercase" letterSpacing="wider">
            {fieldConfig.label || fieldConfig.fieldCode}
          </Text>
          <HStack ml="auto" gap={1}>
            {isValidating && <Spinner size="xs" color="blue.400" />}
            <Badge colorPalette="blue" fontSize="9px">Editando</Badge>
          </HStack>
        </HStack>

        <Textarea
          value={value}
          onChange={(e) => { onChange?.(e.target.value); setValidation(runBasicValidation(e.target.value)); }}
          onBlur={handleBlur}
          placeholder={fieldConfig.placeholder || 'Ingrese el contenido...'}
          fontSize={size === 'sm' ? 'xs' : 'sm'}
          color={color.text} bg="transparent"
          border="1px dashed" borderColor={color.border}
          minH={size === 'sm' ? '50px' : size === 'lg' ? '120px' : '70px'}
          resize="vertical"
          _placeholder={{ color: isDark ? 'gray.500' : 'gray.400', fontSize: 'xs' }}
        />

        {validation.status !== 'idle' && validation.message && (
          <HStack mt={1} gap={1}>
            <Icon
              as={validation.status === 'error' ? FiAlertCircle : validation.status === 'warning' ? FiInfo : FiCheckCircle}
              color={validation.status === 'error' ? 'red.500' : validation.status === 'warning' ? 'orange.500' : 'green.500'}
              boxSize={3}
            />
            <Text fontSize="xs" color={validation.status === 'error' ? 'red.500' : validation.status === 'warning' ? 'orange.500' : 'green.500'}>
              {validation.message}
            </Text>
          </HStack>
        )}

        <HStack mt={2} gap={1}>
          {fieldConfig.aiAssistEnabled && (
            <Button size="xs" variant="ghost" colorPalette="purple" onClick={handleSuggest} disabled={isSuggesting}>
              {isSuggesting ? <Spinner size="xs" mr={1} /> : <Icon as={FiCpu} mr={1} />}
              Sugerir con IA
            </Button>
          )}
          <Text fontSize="9px" color="gray.500">{value.length}/{maxLen}</Text>
        </HStack>

        {showSuggestion && aiSuggestion && (
          <Box mt={2} p={2} bg={isDark ? 'purple.900' : 'purple.50'} border="1px solid" borderColor="purple.300" borderRadius="md">
            <HStack mb={1}>
              <Icon as={FiCpu} color="purple.500" boxSize={3} />
              <Text fontSize="xs" fontWeight="bold" color="purple.500">Sugerencia IA</Text>
            </HStack>
            <Text fontSize="xs" color={isDark ? 'purple.200' : 'purple.800'} whiteSpace="pre-wrap" maxH="100px" overflowY="auto">
              {aiSuggestion.substring(0, 500)}
            </Text>
            <HStack mt={2} gap={1}>
              <Button size="xs" colorPalette="purple" onClick={() => { onChange?.(aiSuggestion); setShowSuggestion(false); setAiSuggestion(null); }}>
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
  }

  // --- Read-only mode ---
  const rawHasChange = fieldChangeInfo && fieldChangeInfo.oldValue !== null && fieldChangeInfo.oldValue !== value;
  const hasRecentChange = rawHasChange && isRecentChange(fieldChangeInfo!.changedAt);
  const hasDiff = showDiff && rawHasChange;

  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, zIndex: 10 }}
      transition={{ duration: 0.3 }}
      bg={hasRecentChange ? (isDark ? 'rgba(56, 178, 172, 0.12)' : 'rgba(56, 178, 172, 0.08)') : color.bg}
      border={hasRecentChange ? '3px solid' : '1px solid'}
      borderColor={hasRecentChange ? (isDark ? 'teal.300' : 'teal.500') : color.border}
      borderRadius="md" p={size === 'sm' ? 3 : 4}
      boxShadow={hasRecentChange ? (isDark ? '0 0 16px rgba(56, 178, 172, 0.45)' : '0 0 12px rgba(56, 178, 172, 0.3)') : 'md'}
      cursor="default"
      minH={size === 'sm' ? '80px' : size === 'lg' ? '180px' : '120px'}
      position="relative" role="group"
      css={hasRecentChange ? { animation: `${pulseGlow} 2s ease-in-out 3` } : undefined}
      _before={{ content: '""', position: 'absolute', top: 0, left: '20%', right: '20%', height: '4px', bg: hasRecentChange ? (isDark ? 'teal.300' : 'teal.500') : color.border, borderRadius: '0 0 4px 4px' }}
    >
      <HStack mb={2} gap={1}>
        <Text fontSize="xs" fontWeight="bold" color={hasRecentChange ? (isDark ? 'teal.200' : 'teal.600') : color.border} textTransform="uppercase" letterSpacing="wider" flex={1}>
          {fieldConfig.label || fieldConfig.fieldCode}
        </Text>
        {hasRecentChange && fieldChangeInfo && (
          <Badge colorPalette="teal" fontSize="9px" variant="solid">
            {fieldChangeInfo.changedByName}
          </Badge>
        )}
        {rawHasChange && (
          <Button
            size="xs" variant="ghost" colorPalette={showDiff ? 'teal' : 'gray'}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleDiff(); }}
            px={2} h="20px" minW="auto"
            title={showDiff ? 'Ver texto final' : 'Ver cambios'}
          >
            <Icon as={showDiff ? FiEye : FiEdit} boxSize={3} />
            <Text fontSize="9px" ml={1}>{showDiff ? 'Final' : 'Cambios'}</Text>
          </Button>
        )}
        {fieldConfig.isEditable && (
          <Box opacity={0.5} _groupHover={{ opacity: 1 }} transition="opacity 0.2s" p={1}>
            <Icon as={FiEdit} color={color.border} boxSize={3.5} />
          </Box>
        )}
      </HStack>
      {hasDiff && fieldChangeInfo ? (
        <DiffHighlightedText
          currentText={value.length > (size === 'lg' ? 500 : 200) ? value.substring(0, size === 'lg' ? 500 : 200) + '...' : value}
          previousText={fieldChangeInfo.oldValue!.length > (size === 'lg' ? 500 : 200) ? fieldChangeInfo.oldValue!.substring(0, size === 'lg' ? 500 : 200) + '...' : fieldChangeInfo.oldValue!}
          changedByName={fieldChangeInfo.changedByName}
          changedAt={fieldChangeInfo.changedAt}
        />
      ) : (
        <Text fontSize={size === 'sm' ? 'xs' : 'sm'} color={color.text} lineHeight="tall" whiteSpace="pre-wrap">
          {value.length > (size === 'lg' ? 500 : 200) ? value.substring(0, size === 'lg' ? 500 : 200) + '...' : value}
        </Text>
      )}
    </MotionBox>
  );
};

export default TextCard;
