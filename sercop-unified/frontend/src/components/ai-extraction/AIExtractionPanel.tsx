/**
 * Panel de Extracción de Documentos con IA
 * Permite subir documentos, ver campos extraídos y aprobar/editar
 */

import { useState, useCallback, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Progress,
  IconButton,
  Input,
  Collapsible,
  Spinner,
} from '@chakra-ui/react';
import {
  FiUpload,
  FiCheck,
  FiX,
  FiEdit2,
  FiChevronDown,
  FiChevronUp,
  FiCpu,
  FiAlertCircle,
  FiCheckCircle,
  FiAlertTriangle,
  FiFile,
  FiTrash2,
  FiRefreshCw,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import {
  documentExtractionService,
  type ExtractionResult,
  type ExtractedField,
  type ExtractionProgressCallback,
  type AIProviderType,
  getConfidenceColor,
} from '../../services/ai-extraction';

interface AIExtractionPanelProps {
  /** Tipo de mensaje esperado (MT700, MT760, etc.) */
  messageType: string;
  /** Callback cuando se aplican campos al formulario */
  onApplyFields: (fieldCode: string, value: any) => void;
  /** Proveedor de IA a usar */
  provider?: AIProviderType;
  /** Si está en modo solo lectura */
  readOnly?: boolean;
  /** Si está colapsado inicialmente */
  defaultCollapsed?: boolean;
}

/**
 * Estado del progreso de extracción
 */
interface ExtractionProgress {
  stage: string;
  percent: number;
  message: string;
}

export const AIExtractionPanel: React.FC<AIExtractionPanelProps> = ({
  messageType,
  onApplyFields,
  provider = 'claude',
  readOnly = false,
  defaultCollapsed = true,
}) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  /**
   * Maneja la selección de archivo
   */
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setError(null);
    setExtraction(null);
    setProgress({ stage: 'uploading', percent: 0, message: t('common:aiExtraction.preparing', 'Preparando documento...') });

    try {
      const progressCallback: ExtractionProgressCallback = (p) => {
        setProgress({
          stage: p.stage,
          percent: p.percent,
          message: p.message,
        });
      };

      const result = await documentExtractionService.extractFromFile(
        file,
        {
          expectedMessageType: messageType,
          provider,
          language: 'es',
        },
        progressCallback
      );

      setExtraction(result);
      setIsExpanded(true);
    } catch (err: any) {
      setError(err.message || t('common:aiExtraction.error', 'Error en la extracción'));
    } finally {
      setIsExtracting(false);
      setProgress(null);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [messageType, provider, t]);

  /**
   * Aprueba un campo
   */
  const handleApprove = useCallback((fieldCode: string) => {
    if (!extraction) return;

    documentExtractionService.reviewField({
      extractionId: extraction.id,
      fieldCode,
      action: 'approve',
    });

    // Actualizar estado local
    setExtraction(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: prev.fields.map(f =>
          f.fieldCode === fieldCode ? { ...f, status: 'approved' } : f
        ),
        stats: {
          ...prev.stats,
          approved: prev.stats.approved + 1,
        },
      };
    });
  }, [extraction]);

  /**
   * Rechaza un campo
   */
  const handleReject = useCallback((fieldCode: string) => {
    if (!extraction) return;

    documentExtractionService.reviewField({
      extractionId: extraction.id,
      fieldCode,
      action: 'reject',
    });

    setExtraction(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: prev.fields.map(f =>
          f.fieldCode === fieldCode ? { ...f, status: 'rejected' } : f
        ),
        stats: {
          ...prev.stats,
          rejected: prev.stats.rejected + 1,
        },
      };
    });
  }, [extraction]);

  /**
   * Inicia edición de un campo
   */
  const handleStartEdit = useCallback((field: ExtractedField) => {
    setEditingField(field.fieldCode);
    setEditValue(typeof field.value === 'string' ? field.value : JSON.stringify(field.value));
  }, []);

  /**
   * Guarda edición de un campo
   */
  const handleSaveEdit = useCallback((fieldCode: string) => {
    if (!extraction) return;

    documentExtractionService.reviewField({
      extractionId: extraction.id,
      fieldCode,
      action: 'edit',
      newValue: editValue,
    });

    setExtraction(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: prev.fields.map(f =>
          f.fieldCode === fieldCode
            ? { ...f, value: editValue, status: 'edited', confidence: 1, confidenceLevel: 'high' }
            : f
        ),
        stats: {
          ...prev.stats,
          edited: prev.stats.edited + 1,
        },
      };
    });

    setEditingField(null);
    setEditValue('');
  }, [extraction, editValue]);

  /**
   * Aprueba todos los campos de alta confianza
   */
  const handleApproveAllHigh = useCallback(() => {
    if (!extraction) return;

    const count = documentExtractionService.approveAllHighConfidence(extraction.id);

    setExtraction(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: prev.fields.map(f =>
          f.confidenceLevel === 'high' && f.status === 'pending'
            ? { ...f, status: 'approved' }
            : f
        ),
        stats: {
          ...prev.stats,
          approved: prev.stats.approved + count,
        },
      };
    });
  }, [extraction]);

  /**
   * Aplica campos aprobados al formulario
   */
  const handleApplyToForm = useCallback(() => {
    if (!extraction) return;

    const count = documentExtractionService.applyToForm(
      extraction.id,
      onApplyFields,
      { filterByStatus: ['approved', 'edited'] }
    );

    // Mostrar notificación o feedback
    console.log(`✅ Applied ${count} fields to form`);
  }, [extraction, onApplyFields]);

  /**
   * Limpia la extracción actual
   */
  const handleClear = useCallback(() => {
    setExtraction(null);
    setError(null);
  }, []);

  /**
   * Renderiza el icono de confianza
   */
  const renderConfidenceIcon = (level: ExtractedField['confidenceLevel']) => {
    switch (level) {
      case 'high':
        return <FiCheckCircle color="var(--chakra-colors-green-500)" />;
      case 'medium':
        return <FiAlertTriangle color="var(--chakra-colors-yellow-500)" />;
      case 'low':
        return <FiAlertCircle color="var(--chakra-colors-red-500)" />;
    }
  };

  /**
   * Renderiza el badge de estado
   */
  const renderStatusBadge = (field: ExtractedField) => {
    switch (field.status) {
      case 'approved':
        return <Badge colorPalette="green" size="sm">{t('common:aiExtraction.approved', 'Aprobado')}</Badge>;
      case 'rejected':
        return <Badge colorPalette="red" size="sm">{t('common:aiExtraction.rejected', 'Rechazado')}</Badge>;
      case 'edited':
        return <Badge colorPalette="blue" size="sm">{t('common:aiExtraction.edited', 'Editado')}</Badge>;
      default:
        return <Badge colorPalette="gray" size="sm">{t('common:aiExtraction.pending', 'Pendiente')}</Badge>;
    }
  };

  const pendingCount = extraction?.fields.filter(f => f.status === 'pending').length || 0;
  const approvedCount = extraction?.stats.approved || 0;
  const totalCount = extraction?.stats.totalFields || 0;

  return (
    <Box
      bg={isDark ? 'gray.800' : 'white'}
      borderRadius="xl"
      overflow="hidden"
      boxShadow="md"
      border="1px solid"
      borderColor={colors.borderColor}
      mb={4}
    >
      {/* Header */}
      <HStack
        px={4}
        py={3}
        bg={isExpanded
          ? (isDark ? 'blue.900' : 'blue.600')
          : (isDark ? 'gray.700' : 'gray.100')
        }
        color={isExpanded ? 'white' : colors.textColor}
        cursor="pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        justify="space-between"
        transition="all 0.2s"
      >
        <HStack gap={3}>
          <Box
            p={2}
            borderRadius="lg"
            bg={isExpanded ? 'whiteAlpha.200' : (isDark ? 'blue.800' : 'blue.100')}
          >
            <FiCpu size={18} color={isExpanded ? 'white' : (isDark ? '#63B3ED' : '#3182CE')} />
          </Box>
          <Box>
            <Text fontWeight="600" fontSize="sm">
              {t('common:aiExtraction.title', 'Extracción con IA')}
            </Text>
            <Text fontSize="xs" opacity={0.8}>
              {t('common:aiExtraction.subtitle', 'Sube un documento para extraer campos automáticamente')}
            </Text>
          </Box>
        </HStack>

        <HStack gap={3}>
          {extraction && !isExpanded && (
            <Badge colorPalette="green" size="sm">
              {approvedCount}/{totalCount} {t('common:aiExtraction.approved', 'aprobados')}
            </Badge>
          )}
          <IconButton
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            size="sm"
            variant="ghost"
            color={isExpanded ? 'white' : colors.textColor}
          >
            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
          </IconButton>
        </HStack>
      </HStack>

      <Collapsible.Root open={isExpanded}>
        <Collapsible.Content>
          <VStack align="stretch" gap={0} p={4}>
            {/* Área de carga de archivo */}
            {!extraction && !isExtracting && (
              <Box
                border="2px dashed"
                borderColor={isDark ? 'gray.600' : 'gray.300'}
                borderRadius="lg"
                p={6}
                textAlign="center"
                cursor={readOnly ? 'default' : 'pointer'}
                onClick={() => !readOnly && fileInputRef.current?.click()}
                _hover={!readOnly ? {
                  borderColor: 'blue.400',
                  bg: isDark ? 'gray.750' : 'gray.50',
                } : {}}
                transition="all 0.2s"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.swift"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={readOnly}
                />
                <VStack gap={2}>
                  <Box
                    p={3}
                    borderRadius="full"
                    bg={isDark ? 'blue.800' : 'blue.100'}
                  >
                    <FiUpload size={24} color={isDark ? '#63B3ED' : '#3182CE'} />
                  </Box>
                  <Text fontWeight="500" color={colors.textColor}>
                    {t('common:aiExtraction.dropzone', 'Arrastra un documento o haz clic para seleccionar')}
                  </Text>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    PDF, imágenes, archivos SWIFT (.txt)
                  </Text>
                </VStack>
              </Box>
            )}

            {/* Progreso de extracción */}
            {isExtracting && progress && (
              <Box p={4} bg={isDark ? 'gray.750' : 'gray.50'} borderRadius="lg">
                <VStack gap={3}>
                  <HStack gap={2}>
                    <Spinner size="sm" color="blue.500" />
                    <Text fontSize="sm" fontWeight="500">
                      {progress.message}
                    </Text>
                  </HStack>
                  <Progress.Root value={progress.percent} size="sm" colorPalette="blue">
                    <Progress.Track>
                      <Progress.Range />
                    </Progress.Track>
                  </Progress.Root>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    {progress.percent}%
                  </Text>
                </VStack>
              </Box>
            )}

            {/* Error */}
            {error && (
              <Box p={4} bg="red.50" borderRadius="lg" border="1px solid" borderColor="red.200">
                <HStack gap={2}>
                  <FiAlertCircle color="var(--chakra-colors-red-500)" />
                  <Text fontSize="sm" color="red.700">{error}</Text>
                </HStack>
              </Box>
            )}

            {/* Resultados de extracción */}
            {extraction && (
              <VStack align="stretch" gap={3}>
                {/* Header de resultados */}
                <HStack justify="space-between" flexWrap="wrap" gap={2}>
                  <HStack gap={2}>
                    <FiFile />
                    <Text fontSize="sm" fontWeight="500">
                      {extraction.sourceDocument.fileName}
                    </Text>
                    <Badge colorPalette="purple" size="sm">
                      {extraction.messageType}
                    </Badge>
                  </HStack>
                  <HStack gap={2}>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={handleClear}
                    >
                      <FiTrash2 />
                      {t('common:clear', 'Limpiar')}
                    </Button>
                  </HStack>
                </HStack>

                {/* Estadísticas */}
                <HStack
                  gap={4}
                  p={3}
                  bg={isDark ? 'gray.750' : 'gray.50'}
                  borderRadius="lg"
                  flexWrap="wrap"
                >
                  <VStack gap={0} align="center">
                    <Text fontSize="lg" fontWeight="bold" color="green.500">
                      {extraction.stats.highConfidence}
                    </Text>
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      {t('common:aiExtraction.highConf', 'Alta confianza')}
                    </Text>
                  </VStack>
                  <VStack gap={0} align="center">
                    <Text fontSize="lg" fontWeight="bold" color="yellow.500">
                      {extraction.stats.mediumConfidence}
                    </Text>
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      {t('common:aiExtraction.mediumConf', 'Media')}
                    </Text>
                  </VStack>
                  <VStack gap={0} align="center">
                    <Text fontSize="lg" fontWeight="bold" color="red.500">
                      {extraction.stats.lowConfidence}
                    </Text>
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      {t('common:aiExtraction.lowConf', 'Baja')}
                    </Text>
                  </VStack>
                  <Box flex={1} />
                  <Button
                    size="sm"
                    colorPalette="green"
                    variant="outline"
                    onClick={handleApproveAllHigh}
                    disabled={extraction.stats.highConfidence === 0}
                  >
                    <FiCheck />
                    {t('common:aiExtraction.approveAllHigh', 'Aprobar alta confianza')}
                  </Button>
                </HStack>

                {/* Lista de campos */}
                <Box
                  maxH="300px"
                  overflowY="auto"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={colors.borderColor}
                >
                  {extraction.fields.map((field, index) => (
                    <HStack
                      key={field.fieldCode}
                      px={3}
                      py={2}
                      borderBottom={index < extraction.fields.length - 1 ? '1px solid' : 'none'}
                      borderColor={colors.borderColor}
                      bg={field.status === 'rejected'
                        ? (isDark ? 'red.900' : 'red.50')
                        : field.status === 'approved'
                          ? (isDark ? 'green.900' : 'green.50')
                          : 'transparent'
                      }
                      opacity={field.status === 'rejected' ? 0.6 : 1}
                    >
                      {/* Icono de confianza */}
                      <Box flexShrink={0}>
                        {renderConfidenceIcon(field.confidenceLevel)}
                      </Box>

                      {/* Código y valor */}
                      <VStack align="stretch" flex={1} gap={0} minW={0}>
                        <HStack gap={2}>
                          <Badge size="sm" colorPalette="purple">
                            {field.fieldCode}
                          </Badge>
                          <Text fontSize="xs" color={colors.textColorSecondary}>
                            {Math.round(field.confidence * 100)}%
                          </Text>
                          {renderStatusBadge(field)}
                        </HStack>

                        {editingField === field.fieldCode ? (
                          <HStack gap={1} mt={1}>
                            <Input
                              size="sm"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              autoFocus
                            />
                            <IconButton
                              aria-label="Save"
                              size="sm"
                              colorPalette="green"
                              onClick={() => handleSaveEdit(field.fieldCode)}
                            >
                              <FiCheck />
                            </IconButton>
                            <IconButton
                              aria-label="Cancel"
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingField(null)}
                            >
                              <FiX />
                            </IconButton>
                          </HStack>
                        ) : (
                          <Text
                            fontSize="sm"
                            color={colors.textColor}
                            noOfLines={2}
                            title={typeof field.value === 'string' ? field.value : JSON.stringify(field.value)}
                          >
                            {typeof field.value === 'string' ? field.value : JSON.stringify(field.value)}
                          </Text>
                        )}

                        {field.lowConfidenceReason && (
                          <Text fontSize="xs" color="red.500" mt={1}>
                            {field.lowConfidenceReason}
                          </Text>
                        )}
                      </VStack>

                      {/* Acciones */}
                      {field.status === 'pending' && !readOnly && editingField !== field.fieldCode && (
                        <HStack gap={1} flexShrink={0}>
                          <IconButton
                            aria-label="Approve"
                            size="sm"
                            colorPalette="green"
                            variant="ghost"
                            onClick={() => handleApprove(field.fieldCode)}
                          >
                            <FiCheck />
                          </IconButton>
                          <IconButton
                            aria-label="Edit"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(field)}
                          >
                            <FiEdit2 />
                          </IconButton>
                          <IconButton
                            aria-label="Reject"
                            size="sm"
                            colorPalette="red"
                            variant="ghost"
                            onClick={() => handleReject(field.fieldCode)}
                          >
                            <FiX />
                          </IconButton>
                        </HStack>
                      )}
                    </HStack>
                  ))}
                </Box>

                {/* Botón de aplicar */}
                <Button
                  colorPalette="blue"
                  size="md"
                  onClick={handleApplyToForm}
                  disabled={approvedCount === 0}
                >
                  <FiCheck />
                  {t('common:aiExtraction.applyToForm', 'Aplicar {{count}} campos al formulario', { count: approvedCount })}
                </Button>
              </VStack>
            )}
          </VStack>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};

export default AIExtractionPanel;
