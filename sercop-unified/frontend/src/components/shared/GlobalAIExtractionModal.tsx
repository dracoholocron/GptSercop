/**
 * GlobalAIExtractionModal - Modal para extracción IA global desde el TopBar
 *
 * Permite usar la funcionalidad de extracción IA en cualquier momento,
 * sin integración con formularios. Solo muestra los resultados extraídos.
 */

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Progress,
  Spinner,
  Dialog,
  Portal,
  CloseButton,
  Collapsible,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiUpload,
  FiCpu,
  FiFileText,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiFile,
  FiTrash2,
  FiShield,
  FiExternalLink,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { generateSwiftExtractionPrompt } from '../../services/ai-extraction/AIProvider.interface';
import { AdditionalAnalysisSection } from './AdditionalAnalysisSection';
import type { AdditionalAnalysis } from './AdditionalAnalysisSection';
import { productTypeConfigService, type ProductTypeConfig } from '../../services/productTypeConfigService';

// Interfaces
interface ExtractedField {
  fieldCode: string;
  value: any;
  confidence: number;
  evidence: string;
  status: 'pending' | 'approved' | 'rejected' | 'edited';
}

interface AIExtractionResult {
  extractionId: string;
  fileName: string;
  provider: string;
  model: string;
  fields: ExtractedField[];
  processingTimeMs: number;
  totalTokens: number;
  estimatedCost?: number;
  additionalAnalysis?: AdditionalAnalysis;
}

interface FileUploadInfo {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  result?: AIExtractionResult;
}

interface GlobalAIExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_FILES = 5;

export const GlobalAIExtractionModal: React.FC<GlobalAIExtractionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const { isDark, getColors } = useTheme();
  const colors = getColors();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados
  const [files, setFiles] = useState<FileUploadInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [mergedResult, setMergedResult] = useState<AIExtractionResult | null>(null);
  const [isFieldsSectionExpanded, setIsFieldsSectionExpanded] = useState(true);
  const [productConfigs, setProductConfigs] = useState<ProductTypeConfig[]>([]);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);

  // Cargar configuraciones de productos al abrir el modal
  useEffect(() => {
    if (isOpen && productConfigs.length === 0) {
      setIsLoadingConfigs(true);
      productTypeConfigService.getAllConfigs()
        .then(configs => {
          // Filtrar solo los activos y ordenar por displayOrder
          const activeConfigs = configs
            .filter(c => c.active)
            .sort((a, b) => a.displayOrder - b.displayOrder);
          setProductConfigs(activeConfigs);
          // Seleccionar el primero si no hay selección válida
          if (activeConfigs.length > 0) {
            const currentIsValid = activeConfigs.some(c => c.productType === selectedProductType);
            if (!currentIsValid) {
              setSelectedProductType(activeConfigs[0].productType);
            }
          }
        })
        .catch(err => console.error('Error loading product configs:', err))
        .finally(() => setIsLoadingConfigs(false));
    }
  }, [isOpen]);

  // Obtener el mensaje SWIFT del producto seleccionado
  const getSelectedMessageType = (): string => {
    const config = productConfigs.find(c => c.productType === selectedProductType);
    return config?.swiftMessageType || 'MT700';
  };

  // Obtener label traducido del producto
  const getProductLabel = (productType: string, fallback: string): string => {
    const translationKey = `productTypes.${productType}`;
    const translated = t(translationKey, { defaultValue: '' });
    if (translated && translated !== translationKey && translated !== '') {
      return translated;
    }
    return fallback || productType.replace(/_/g, ' ');
  };

  // Manejar selección de archivos
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles: FileUploadInfo[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      // Validar tamaño
      if (file.size > MAX_FILE_SIZE_BYTES) {
        newFiles.push({
          file,
          id: `${Date.now()}-${i}`,
          status: 'error',
          progress: 0,
          error: t('aiExtraction.fileTooLarge', { maxSize: MAX_FILE_SIZE_MB }),
        });
        continue;
      }

      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'];
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
        newFiles.push({
          file,
          id: `${Date.now()}-${i}`,
          status: 'error',
          progress: 0,
          error: t('aiExtraction.invalidFileType'),
        });
        continue;
      }

      newFiles.push({
        file,
        id: `${Date.now()}-${i}`,
        status: 'pending',
        progress: 0,
      });
    }

    // Verificar límite de archivos
    const totalFiles = files.filter(f => f.status !== 'error').length + newFiles.filter(f => f.status !== 'error').length;
    if (totalFiles > MAX_FILES) {
      alert(t('aiExtraction.maxFilesExceeded', { maxFiles: MAX_FILES }));
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Eliminar archivo
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (files.length === 1) {
      setMergedResult(null);
    }
  };

  // Procesar archivos
  const processFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsProcessing(true);
    const results: AIExtractionResult[] = [];

    for (const fileInfo of pendingFiles) {
      // Actualizar estado a procesando
      setFiles(prev => prev.map(f =>
        f.id === fileInfo.id ? { ...f, status: 'processing', progress: 10 } : f
      ));

      try {
        // Leer archivo
        const base64 = await readFileAsBase64(fileInfo.file);

        setFiles(prev => prev.map(f =>
          f.id === fileInfo.id ? { ...f, progress: 30 } : f
        ));

        // Llamar a la API (mismo formato que QuickFieldAssistant)
        const response = await fetch('/api/ai/extraction/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('globalcmx_token')}`,
          },
          body: JSON.stringify({
            file: {
              content: base64,
              type: 'base64',
              fileName: fileInfo.file.name,
              mimeType: fileInfo.file.type || 'application/octet-stream',
            },
            messageType: getSelectedMessageType(),
            provider: 'openai',
            prompt: generateSwiftExtractionPrompt([], getSelectedMessageType()),
            language: 'es',
          }),
        });

        setFiles(prev => prev.map(f =>
          f.id === fileInfo.id ? { ...f, progress: 80 } : f
        ));

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          const extractionData = data.data;
          const { fields, additionalAnalysis } = parseExtractionResponse(extractionData);

          const result: AIExtractionResult = {
            extractionId: extractionData.id || `ext-${Date.now()}`,
            fileName: fileInfo.file.name,
            provider: extractionData.provider || 'openai',
            model: extractionData.model || 'gpt-4-vision',
            fields,
            processingTimeMs: extractionData.processingTimeMs || 0,
            totalTokens: (extractionData.inputTokens || 0) + (extractionData.outputTokens || 0),
            estimatedCost: extractionData.estimatedCost,
            additionalAnalysis,
          };

          results.push(result);

          setFiles(prev => prev.map(f =>
            f.id === fileInfo.id ? { ...f, status: 'completed', progress: 100, result } : f
          ));
        } else {
          throw new Error(data.message || 'Error en la extracción');
        }
      } catch (error: any) {
        setFiles(prev => prev.map(f =>
          f.id === fileInfo.id ? {
            ...f,
            status: 'error',
            progress: 0,
            error: error.message || 'Error desconocido'
          } : f
        ));
      }
    }

    // Combinar resultados si hay múltiples archivos
    if (results.length > 0) {
      const merged = mergeExtractionResults(results);
      setMergedResult(merged);
    }

    setIsProcessing(false);
  };

  // Leer archivo como base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Parsear respuesta de extracción (misma lógica que QuickFieldAssistant)
  const parseExtractionResponse = (extractionData: any): { fields: ExtractedField[]; additionalAnalysis?: AdditionalAnalysis } => {
    let parsedFields: any[] = [];
    let additionalAnalysis: AdditionalAnalysis | undefined;

    // Primero intentar parsear desde content (si existe)
    if (extractionData.content) {
      try {
        let contentJson = extractionData.content;
        // Buscar JSON en bloques de código markdown
        const jsonMatch = contentJson.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          contentJson = jsonMatch[1].trim();
        }
        const parsed = JSON.parse(contentJson);
        parsedFields = parsed.fields || [];
        additionalAnalysis = parsed.additionalAnalysis;
      } catch {
        // Si no se puede parsear content, continuar
      }
    }

    // Si no hay campos en content, intentar desde extractionData.fields directamente
    if (parsedFields.length === 0 && extractionData.fields) {
      parsedFields = extractionData.fields;
    }

    // Mapear campos al formato esperado
    const fields: ExtractedField[] = parsedFields.map((f: any) => ({
      fieldCode: f.fieldCode || f.field_code || f.code || '',
      value: f.value || f.extractedValue || '',
      confidence: f.confidence || f.certainty || 0.8,
      evidence: f.evidence || f.source || f.context || '',
      status: 'pending' as const,
    }));

    return { fields, additionalAnalysis };
  };

  // Combinar resultados de múltiples archivos
  const mergeExtractionResults = (results: AIExtractionResult[]): AIExtractionResult => {
    if (results.length === 1) return results[0];

    const mergedFields: Map<string, ExtractedField> = new Map();

    for (const result of results) {
      for (const field of result.fields) {
        const existing = mergedFields.get(field.fieldCode);
        if (!existing || field.confidence > existing.confidence) {
          mergedFields.set(field.fieldCode, field);
        }
      }
    }

    return {
      extractionId: `merged-${Date.now()}`,
      fileName: results.map(r => r.fileName).join(', '),
      provider: results[0].provider,
      model: results[0].model,
      fields: Array.from(mergedFields.values()),
      processingTimeMs: results.reduce((sum, r) => sum + r.processingTimeMs, 0),
      totalTokens: results.reduce((sum, r) => sum + r.totalTokens, 0),
      estimatedCost: results.reduce((sum, r) => sum + (r.estimatedCost || 0), 0),
      additionalAnalysis: results[0].additionalAnalysis,
    };
  };

  // Helper para el color del nivel de confianza
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'green';
    if (confidence >= 0.7) return 'yellow';
    return 'red';
  };

  // Limpiar todo
  const clearAll = () => {
    setFiles([]);
    setMergedResult(null);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="cover" placement="center">
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" backdropFilter="blur(8px)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg={isDark ? 'gray.900' : 'white'}
            maxW="900px"
            maxH="90vh"
            overflow="hidden"
            borderRadius="2xl"
            display="flex"
            flexDirection="column"
          >
            {/* Header */}
            <Dialog.Header
              px={6}
              py={4}
              borderBottom="1px solid"
              borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
              flexShrink={0}
            >
              <HStack justify="space-between" w="full">
                <HStack gap={3}>
                  <Box
                    p={2}
                    borderRadius="lg"
                    bg={isDark ? 'purple.900' : 'purple.100'}
                  >
                    <FiCpu size={24} color={isDark ? '#D6BCFA' : '#805AD5'} />
                  </Box>
                  <Box>
                    <Dialog.Title fontSize="lg" fontWeight="bold" color={colors.textColor}>
                      {t('aiExtraction.globalToolTitle', 'Extracción IA')}
                    </Dialog.Title>
                    <HStack gap={1}>
                      <Text fontSize="sm" color={colors.textColorSecondary}>
                        {t('aiExtraction.globalToolDescription', 'Información referencial para facilitar la gestión. Debe ser validada y confirmada por el usuario.')}
                      </Text>
                      <Tooltip.Root positioning={{ placement: 'bottom-start' }} openDelay={200}>
                        <Tooltip.Trigger asChild>
                          <Box
                            as="button"
                            p={1}
                            borderRadius="full"
                            _hover={{ bg: isDark ? 'gray.700' : 'gray.100' }}
                            transition="all 0.2s"
                          >
                            <FiShield size={14} color={isDark ? '#68D391' : '#276749'} />
                          </Box>
                        </Tooltip.Trigger>
                        <Tooltip.Positioner>
                          <Tooltip.Content
                            bg={isDark ? 'gray.700' : 'white'}
                            color={colors.textColor}
                            borderRadius="lg"
                            boxShadow="lg"
                            border="1px solid"
                            borderColor={isDark ? 'gray.600' : 'gray.200'}
                            p={4}
                            maxW="380px"
                            zIndex={9999}
                          >
                            <VStack align="start" gap={3}>
                              <HStack gap={2}>
                                <FiShield size={18} color={isDark ? '#68D391' : '#276749'} />
                                <Text fontWeight="bold" fontSize="sm">
                                  {t('aiExtraction.securityTitle', 'Seguridad y Privacidad')}
                                </Text>
                              </HStack>

                              <VStack align="start" gap={2} fontSize="xs" color={colors.textColorSecondary}>
                                <Box>
                                  <Text fontWeight="600" color={colors.textColor}>
                                    {t('aiExtraction.securityProcessing', '¿Cómo se procesan los documentos?')}
                                  </Text>
                                  <Text>
                                    {t('aiExtraction.securityProcessingDesc', 'Los documentos son procesados mediante APIs de IA (Claude/OpenAI) de forma segura. El contenido se envía cifrado y no se almacena en los servidores de IA.')}
                                  </Text>
                                </Box>

                                <Box>
                                  <Text fontWeight="600" color={colors.textColor}>
                                    {t('aiExtraction.securityStorage', '¿Se almacenan mis documentos?')}
                                  </Text>
                                  <Text>
                                    {t('aiExtraction.securityStorageDesc', 'Los documentos originales no se almacenan permanentemente. Solo se guarda un registro de la extracción para auditoría, sin el contenido original.')}
                                  </Text>
                                </Box>

                                <Box>
                                  <Text fontWeight="600" color={colors.textColor}>
                                    {t('aiExtraction.securityConfidential', '¿Puedo subir documentos confidenciales?')}
                                  </Text>
                                  <Text>
                                    {t('aiExtraction.securityConfidentialDesc', 'Los proveedores de IA cumplen con estándares SOC 2 y no utilizan los datos para entrenar modelos. Sin embargo, consulte con su oficial de compliance antes de procesar información altamente sensible.')}
                                  </Text>
                                </Box>

                                <Box>
                                  <Text fontWeight="600" color={colors.textColor}>
                                    {t('aiExtraction.securityAccuracy', '¿Qué tan precisa es la extracción?')}
                                  </Text>
                                  <Text>
                                    {t('aiExtraction.securityAccuracyDesc', 'La IA tiene alta precisión pero no es infalible. Por eso es obligatorio que el usuario valide y confirme cada campo extraído antes de utilizarlo.')}
                                  </Text>
                                </Box>
                              </VStack>

                              {/* Links a políticas de proveedores */}
                              <Box w="100%">
                                <Text fontSize="xs" fontWeight="600" color={colors.textColor} mb={1}>
                                  {t('aiExtraction.securityProviders', 'Políticas de Seguridad de Proveedores:')}
                                </Text>
                                <VStack align="start" gap={1}>
                                  <HStack gap={2}>
                                    <Box
                                      as="a"
                                      href="https://www.anthropic.com/privacy"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      fontSize="xs"
                                      color={isDark ? 'purple.300' : 'purple.600'}
                                      _hover={{ textDecoration: 'underline' }}
                                      display="flex"
                                      alignItems="center"
                                      gap={1}
                                    >
                                      <Text>Anthropic (Claude) - Privacy</Text>
                                      <FiExternalLink size={10} />
                                    </Box>
                                  </HStack>
                                  <HStack gap={2}>
                                    <Box
                                      as="a"
                                      href="https://trust.anthropic.com"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      fontSize="xs"
                                      color={isDark ? 'purple.300' : 'purple.600'}
                                      _hover={{ textDecoration: 'underline' }}
                                      display="flex"
                                      alignItems="center"
                                      gap={1}
                                    >
                                      <Text>Anthropic Trust Center (SOC 2)</Text>
                                      <FiExternalLink size={10} />
                                    </Box>
                                  </HStack>
                                  <HStack gap={2}>
                                    <Box
                                      as="a"
                                      href="https://openai.com/enterprise-privacy"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      fontSize="xs"
                                      color={isDark ? 'green.300' : 'green.600'}
                                      _hover={{ textDecoration: 'underline' }}
                                      display="flex"
                                      alignItems="center"
                                      gap={1}
                                    >
                                      <Text>OpenAI - Enterprise Privacy</Text>
                                      <FiExternalLink size={10} />
                                    </Box>
                                  </HStack>
                                  <HStack gap={2}>
                                    <Box
                                      as="a"
                                      href="https://openai.com/security"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      fontSize="xs"
                                      color={isDark ? 'green.300' : 'green.600'}
                                      _hover={{ textDecoration: 'underline' }}
                                      display="flex"
                                      alignItems="center"
                                      gap={1}
                                    >
                                      <Text>OpenAI Security Portal</Text>
                                      <FiExternalLink size={10} />
                                    </Box>
                                  </HStack>
                                </VStack>
                              </Box>

                              <Box
                                w="100%"
                                p={2}
                                borderRadius="md"
                                bg={isDark ? 'blue.900' : 'blue.50'}
                                borderLeft="3px solid"
                                borderLeftColor="blue.500"
                              >
                                <Text fontSize="xs" color={isDark ? 'blue.200' : 'blue.700'}>
                                  {t('aiExtraction.securityNote', 'Esta herramienta es un asistente de productividad. La responsabilidad final de la información ingresada al sistema recae en el usuario.')}
                                </Text>
                              </Box>
                            </VStack>
                          </Tooltip.Content>
                        </Tooltip.Positioner>
                      </Tooltip.Root>
                    </HStack>
                  </Box>
                </HStack>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="lg" />
                </Dialog.CloseTrigger>
              </HStack>
            </Dialog.Header>

            {/* Body */}
            <Dialog.Body p={0} overflow="auto" flex={1}>
              <VStack align="stretch" gap={0}>
                {/* Selector de producto y zona de carga */}
                <Box p={4} borderBottom="1px solid" borderColor={colors.borderColor}>
                  <HStack mb={3} gap={2} flexWrap="wrap" align="center">
                    <Text fontSize="sm" fontWeight="600" color={colors.textColorSecondary}>
                      {t('aiExtraction.product', 'Producto')}:
                    </Text>
                    {isLoadingConfigs ? (
                      <Spinner size="sm" color="purple.500" />
                    ) : (
                      productConfigs.map(config => (
                        <Badge
                          key={config.productType}
                          px={3}
                          py={1}
                          borderRadius="full"
                          cursor="pointer"
                          bg={selectedProductType === config.productType
                            ? (isDark ? 'purple.600' : 'purple.500')
                            : (isDark ? 'gray.700' : 'gray.100')
                          }
                          color={selectedProductType === config.productType ? 'white' : colors.textColor}
                          onClick={() => setSelectedProductType(config.productType)}
                          _hover={{
                            bg: selectedProductType === config.productType
                              ? (isDark ? 'purple.500' : 'purple.600')
                              : (isDark ? 'gray.600' : 'gray.200'),
                          }}
                          title={config.swiftMessageType}
                        >
                          {getProductLabel(config.productType, config.description)}
                        </Badge>
                      ))
                    )}
                  </HStack>

                  {/* Zona de carga de archivos */}
                  <Box
                    border="2px dashed"
                    borderColor={isDark ? 'gray.600' : 'gray.300'}
                    borderRadius="xl"
                    p={6}
                    textAlign="center"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{
                      borderColor: 'purple.400',
                      bg: isDark ? 'whiteAlpha.50' : 'purple.50',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                    <FiUpload size={32} color={isDark ? '#A78BFA' : '#805AD5'} style={{ margin: '0 auto' }} />
                    <Text mt={2} fontWeight="600" color={colors.textColor}>
                      {t('aiExtraction.dropFiles', 'Haz clic o arrastra archivos aquí')}
                    </Text>
                    <Text fontSize="sm" color={colors.textColorSecondary}>
                      {t('aiExtraction.supportedFormats', 'PDF, JPG, PNG, WEBP, TXT')} - {t('aiExtraction.maxFileInfo', 'Máximo {maxFiles} archivos, {maxSize}MB cada uno', { maxFiles: MAX_FILES, maxSize: MAX_FILE_SIZE_MB })}
                    </Text>
                  </Box>

                  {/* Lista de archivos */}
                  {files.length > 0 && (
                    <VStack align="stretch" mt={4} gap={2}>
                      {files.map(fileInfo => (
                        <HStack
                          key={fileInfo.id}
                          p={3}
                          borderRadius="lg"
                          bg={isDark ? 'gray.800' : 'gray.50'}
                          border="1px solid"
                          borderColor={
                            fileInfo.status === 'error' ? 'red.400' :
                            fileInfo.status === 'completed' ? 'green.400' :
                            colors.borderColor
                          }
                        >
                          <FiFile size={20} color={colors.textColorSecondary} />
                          <Box flex={1}>
                            <Text fontSize="sm" fontWeight="500" color={colors.textColor} noOfLines={1}>
                              {fileInfo.file.name}
                            </Text>
                            {fileInfo.status === 'processing' && (
                              <Progress.Root
                                value={fileInfo.progress}
                                size="xs"
                                colorPalette="purple"
                                mt={1}
                              >
                                <Progress.Track borderRadius="full">
                                  <Progress.Range />
                                </Progress.Track>
                              </Progress.Root>
                            )}
                            {fileInfo.status === 'error' && (
                              <Text fontSize="xs" color="red.500">
                                {fileInfo.error}
                              </Text>
                            )}
                          </Box>
                          {fileInfo.status === 'completed' && (
                            <FiCheckCircle color="var(--chakra-colors-green-500)" />
                          )}
                          {fileInfo.status === 'processing' && (
                            <Spinner size="sm" color="purple.500" />
                          )}
                          <Box
                            as="button"
                            p={1}
                            borderRadius="md"
                            _hover={{ bg: isDark ? 'whiteAlpha.100' : 'blackAlpha.50' }}
                            onClick={() => removeFile(fileInfo.id)}
                          >
                            <FiTrash2 size={16} color={colors.textColorSecondary} />
                          </Box>
                        </HStack>
                      ))}

                      <HStack justify="space-between" mt={2}>
                        <Box
                          as="button"
                          fontSize="sm"
                          color="red.500"
                          _hover={{ textDecoration: 'underline' }}
                          onClick={clearAll}
                        >
                          {t('common.clearAll', 'Limpiar todo')}
                        </Box>
                        <Box
                          as="button"
                          px={4}
                          py={2}
                          borderRadius="lg"
                          bg={isProcessing ? 'gray.400' : 'purple.500'}
                          color="white"
                          fontWeight="600"
                          fontSize="sm"
                          disabled={isProcessing || files.filter(f => f.status === 'pending').length === 0}
                          _hover={{ bg: isProcessing ? 'gray.400' : 'purple.600' }}
                          _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
                          onClick={processFiles}
                        >
                          {isProcessing ? (
                            <HStack>
                              <Spinner size="sm" />
                              <Text>{t('aiExtraction.processing', 'Procesando...')}</Text>
                            </HStack>
                          ) : (
                            <HStack>
                              <FiCpu />
                              <Text>{t('aiExtraction.extract', 'Extraer')}</Text>
                            </HStack>
                          )}
                        </Box>
                      </HStack>
                    </VStack>
                  )}
                </Box>


                {/* Resultados */}
                {mergedResult && (
                  <>
                    {/* Análisis adicional - usando componente compartido */}
                    {mergedResult.additionalAnalysis && (
                      <AdditionalAnalysisSection
                        analysis={mergedResult.additionalAnalysis}
                        isDark={isDark}
                        colors={colors}
                        t={t}
                      />
                    )}

                    {/* Campos extraídos colapsable */}
                    <Box>
                      <Box
                        as="button"
                        w="full"
                        px={4}
                        py={3}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        _hover={{ bg: isDark ? 'whiteAlpha.50' : 'blackAlpha.25' }}
                        onClick={() => setIsFieldsSectionExpanded(!isFieldsSectionExpanded)}
                      >
                        <HStack>
                          <FiFileText size={18} color={colors.textColorSecondary} />
                          <Text fontWeight="600" color={colors.textColor}>
                            {t('aiExtraction.extractedFields', 'Campos extraídos')}
                          </Text>
                          <Badge colorPalette="blue">{mergedResult.fields.length}</Badge>
                        </HStack>
                        {isFieldsSectionExpanded ? <FiChevronUp /> : <FiChevronDown />}
                      </Box>

                      <Collapsible.Root open={isFieldsSectionExpanded}>
                        <Collapsible.Content>
                          <Box px={4} pb={4}>
                            <VStack align="stretch" gap={2}>
                              {mergedResult.fields.map((field, index) => (
                                <Box
                                  key={index}
                                  p={3}
                                  borderRadius="lg"
                                  border="1px solid"
                                  borderColor={colors.borderColor}
                                  bg={isDark ? 'gray.800' : 'gray.50'}
                                >
                                  <HStack justify="space-between" mb={1}>
                                    <Text fontSize="sm" fontWeight="600" color={colors.textColor}>
                                      {field.fieldCode}
                                    </Text>
                                    <Badge
                                      colorPalette={getConfidenceColor(field.confidence)}
                                      size="sm"
                                    >
                                      {Math.round(field.confidence * 100)}%
                                    </Badge>
                                  </HStack>
                                  <Text fontSize="sm" color={colors.textColor} wordBreak="break-word">
                                    {typeof field.value === 'object'
                                      ? JSON.stringify(field.value, null, 2)
                                      : String(field.value)
                                    }
                                  </Text>
                                  {field.evidence && (
                                    <Text fontSize="xs" color={colors.textColorSecondary} mt={1} fontStyle="italic">
                                      {field.evidence}
                                    </Text>
                                  )}
                                </Box>
                              ))}
                            </VStack>
                          </Box>
                        </Collapsible.Content>
                      </Collapsible.Root>
                    </Box>
                  </>
                )}
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default GlobalAIExtractionModal;
