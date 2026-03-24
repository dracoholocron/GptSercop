/**
 * ComprasPublicasExpert - Vista Expert para productos de Compras Públicas
 * Muestra todos los campos en una sola vista con secciones colapsables
 * Diseño profesional con mejor jerarquía visual
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Flex,
  Spinner,
  Center,
  Button,
  SimpleGrid,
  Icon,
  Badge,
  Progress,
  Drawer,
} from '@chakra-ui/react';
import {
  FiSave,
  FiSend,
  FiChevronDown,
  FiChevronRight,
  FiFileText,
  FiDollarSign,
  FiCalendar,
  FiFolder,
  FiTruck,
  FiShoppingCart,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowLeft,
  FiX,
} from 'react-icons/fi';
import { LuSparkles, LuShieldCheck, LuScale } from 'react-icons/lu';
import { useTheme } from '../contexts/ThemeContext';
import { toaster } from '../components/ui/toaster';
import { getAllConfigs, type ProductTypeConfig } from '../services/productTypeConfigService';
import { swiftFieldConfigService } from '../services/swiftFieldConfigService';
import { DynamicCustomField } from '../components/customfields/DynamicCustomField';
import type { CustomFieldDTO } from '../services/customFieldsService';
import type { SwiftFieldConfig } from '../types/swiftField';
import { getLegalHelp, type CPLegalHelpResponse, type LegalReference } from '../services/cpAIService';

/** Section built from swift_field_config_readmodel grouped by section */
interface CPSection {
  sectionCode: string;
  sectionName: string;
  fields: CustomFieldDTO[];
}

// Section icons mapping
const sectionIcons: Record<string, React.ElementType> = {
  PREPARACION: FiFileText,
  CONVOCATORIA: FiSend,
  CALIFICACION: FiCheckCircle,
  EVALUACION: FiCheckCircle,
  SUBASTA: FiDollarSign,
  ADJUDICACION: FiCheckCircle,
  CONTRATO: FiFolder,
  EJECUCION: FiTruck,
  LIQUIDACION: FiDollarSign,
  DATOS_PROCESO: FiFileText,
  DATOS_ORDEN: FiShoppingCart,
  PRESUPUESTO: FiDollarSign,
  CRONOGRAMA: FiCalendar,
  DOCUMENTOS: FiFolder,
  ENTREGA: FiTruck,
  PROVEEDORES: FiUsers,
};

// Section colors
const sectionColors: Record<string, string> = {
  PREPARACION: 'blue',
  CONVOCATORIA: 'purple',
  CALIFICACION: 'teal',
  EVALUACION: 'teal',
  SUBASTA: 'orange',
  ADJUDICACION: 'green',
  CONTRATO: 'cyan',
  EJECUCION: 'pink',
  LIQUIDACION: 'red',
  DATOS_PROCESO: 'blue',
  DATOS_ORDEN: 'purple',
  PRESUPUESTO: 'green',
  CRONOGRAMA: 'orange',
  DOCUMENTOS: 'teal',
  ENTREGA: 'cyan',
  PROVEEDORES: 'pink',
};

// Section display names
const sectionNames: Record<string, string> = {
  PREPARACION: 'Fase Preparatoria',
  CONVOCATORIA: 'Convocatoria',
  CALIFICACION: 'Calificacion',
  EVALUACION: 'Evaluacion',
  SUBASTA: 'Subasta / Puja',
  ADJUDICACION: 'Adjudicacion',
  CONTRATO: 'Contrato',
  EJECUCION: 'Ejecucion',
  LIQUIDACION: 'Liquidacion',
};

/** Map a SwiftFieldConfig to CustomFieldDTO for DynamicCustomField */
function swiftToCustomField(sf: SwiftFieldConfig): CustomFieldDTO {
  return {
    id: sf.id,
    fieldCode: sf.fieldCode,
    fieldNameKey: sf.fieldNameKey || sf.fieldName || sf.fieldCode,
    fieldDescriptionKey: sf.descriptionKey || sf.description,
    fieldType: sf.fieldType || 'TEXT',
    componentType: sf.componentType || 'INPUT',
    displayOrder: sf.displayOrder,
    placeholderKey: sf.placeholderKey || sf.placeholder,
    helpTextKey: sf.helpTextKey || sf.helpText,
    spanColumns: (sf.componentType === 'TEXTAREA' || sf.componentType === 'FILE_UPLOAD') ? 2 : 1,
    isRequired: sf.isRequired,
    validationRules: sf.validationRules ? JSON.stringify(sf.validationRules) : undefined,
    fieldOptions: sf.fieldOptions ? JSON.stringify(sf.fieldOptions) : undefined,
    defaultValue: sf.defaultValue,
    aiEnabled: !!(sf.helpTextKey || sf.helpText),
    aiHelpPrompt: sf.helpTextKey || sf.helpText,
  };
}

interface ComprasPublicasExpertProps {
  productType: string;
  titleKey?: string;
}

export const ComprasPublicasExpert = ({ productType, titleKey }: ComprasPublicasExpertProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const navigate = useNavigate();

  const [productConfig, setProductConfig] = useState<ProductTypeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<CPSection[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [aiHelpStep, setAiHelpStep] = useState<string | null>(null);
  const [aiHelpLoading, setAiHelpLoading] = useState(false);
  const [aiHelpData, setAiHelpData] = useState<CPLegalHelpResponse | null>(null);
  const [aiValidating, setAiValidating] = useState(false);
  const [aiValidationResults, setAiValidationResults] = useState<CPLegalHelpResponse | null>(null);

  // Field values managed locally (no custom fields hook needed)
  const [customData, setCustomData] = useState<Record<string, any>>({});
  const updateFieldValue = useCallback((fieldCode: string, value: any) => {
    setCustomData(prev => ({ ...prev, [fieldCode]: value }));
  }, []);

  // Load swift field configs grouped by section
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [configs, allPtConfigs] = await Promise.all([
          swiftFieldConfigService.getAll(productType, true),
          getAllConfigs(),
        ]);

        // Find product config
        const cfg = allPtConfigs.find(c => c.productType === productType);
        setProductConfig(cfg || null);

        // Group by section and map to CustomFieldDTO
        const sectionMap = new Map<string, CustomFieldDTO[]>();
        const sectionOrder: string[] = [];
        configs.sort((a, b) => a.displayOrder - b.displayOrder);

        for (const sf of configs) {
          const sec = sf.section || 'GENERAL';
          if (!sectionMap.has(sec)) {
            sectionMap.set(sec, []);
            sectionOrder.push(sec);
          }
          sectionMap.get(sec)!.push(swiftToCustomField(sf));
        }

        const built: CPSection[] = sectionOrder.map(code => ({
          sectionCode: code,
          sectionName: sectionNames[code] || code.replace(/_/g, ' '),
          fields: sectionMap.get(code) || [],
        }));

        setSections(built);

        // Expand all by default
        const expanded: Record<string, boolean> = {};
        built.forEach(s => { expanded[s.sectionCode] = true; });
        setExpandedSteps(expanded);
      } catch (err) {
        console.error('Error loading CP field configs:', err);
        setSections([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productType]);

  // Calculate progress
  const progress = useMemo(() => {
    if (!sections.length) return { filled: 0, total: 0, percentage: 0 };

    let total = 0;
    let filled = 0;

    sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.isRequired) {
          total++;
          const value = customData[field.fieldCode];
          if (value !== null && value !== undefined && value !== '') {
            filled++;
          }
        }
      });
    });

    return {
      filled,
      total,
      percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
    };
  }, [sections, customData]);

  const toggleStep = (stepCode: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepCode]: !prev[stepCode],
    }));
  };

  const handleSubmit = useCallback(async (asDraft: boolean) => {
    setSubmitting(true);
    try {
      console.log('Submitting:', { productType, customData, asDraft });

      toaster.success({
        title: asDraft ? 'Borrador guardado' : 'Proceso creado exitosamente',
        duration: 3000,
      });

      if (!asDraft) {
        navigate('/operations');
      }
    } catch (error) {
      toaster.error({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setSubmitting(false);
    }
  }, [productType, customData, navigate]);

  // AI Help handler
  const handleAIHelp = useCallback(async (stepCode: string) => {
    setAiHelpStep(stepCode);
    setAiHelpLoading(true);
    setAiHelpData(null);
    try {
      const response = await getLegalHelp({
        processType: productType,
        currentStep: stepCode,
        fieldId: stepCode,
        budget: customData.PRESUPUESTO_REFERENCIAL ? Number(customData.PRESUPUESTO_REFERENCIAL) : undefined,
      });
      setAiHelpData(response);
    } catch (err) {
      toaster.error({ title: 'Error al obtener ayuda legal IA', duration: 3000 });
      setAiHelpStep(null);
    } finally {
      setAiHelpLoading(false);
    }
  }, [productType, customData]);

  // AI Validation handler
  const handleAIValidation = useCallback(async () => {
    setAiValidating(true);
    setAiValidationResults(null);
    try {
      const filledFields = Object.entries(customData)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k]) => k);
      const response = await getLegalHelp({
        processType: productType,
        currentStep: 'VALIDATION',
        fieldId: 'FULL_FORM',
        budget: customData.PRESUPUESTO_REFERENCIAL ? Number(customData.PRESUPUESTO_REFERENCIAL) : undefined,
        question: `Valida los siguientes campos completados del proceso ${productType}: ${filledFields.join(', ')}. Identifica campos faltantes, errores comunes y requisitos legales pendientes.`,
      });
      setAiValidationResults(response);
      setAiHelpStep('VALIDATION');
    } catch (err) {
      toaster.error({ title: 'Error en la validacion IA', duration: 3000 });
    } finally {
      setAiValidating(false);
    }
  }, [productType, customData]);

  // Per-field AI help handler
  const handleFieldAIHelp = useCallback(async (fieldCode: string, prompt: string) => {
    setAiHelpStep(fieldCode);
    setAiHelpLoading(true);
    setAiHelpData(null);
    try {
      const response = await getLegalHelp({
        processType: productType,
        currentStep: fieldCode,
        fieldId: fieldCode,
        budget: customData.PRESUPUESTO_REFERENCIAL ? Number(customData.PRESUPUESTO_REFERENCIAL) : undefined,
        question: prompt,
      });
      setAiHelpData(response);
    } catch (err) {
      toaster.error({ title: 'Error al obtener ayuda IA para el campo', duration: 3000 });
      setAiHelpStep(null);
    } finally {
      setAiHelpLoading(false);
    }
  }, [productType, customData]);

  // Per-field AI validation handler - checks if field value complies with law
  const handleFieldAIValidation = useCallback(async (fieldCode: string, fieldValue: string, prompt: string) => {
    setAiHelpStep(fieldCode);
    setAiHelpLoading(true);
    setAiHelpData(null);
    try {
      const response = await getLegalHelp({
        processType: productType,
        currentStep: fieldCode,
        fieldId: fieldCode,
        budget: customData.PRESUPUESTO_REFERENCIAL ? Number(customData.PRESUPUESTO_REFERENCIAL) : undefined,
        question: `VALIDACIÓN LEGAL: El usuario ingresó "${fieldValue}" en el campo "${prompt}". Verifica si este valor cumple con la LOSNCP y normativa vigente. Si hay problemas, indica qué artículos no se cumplen y qué correcciones se requieren. Si es correcto, confírmalo con la base legal.`,
      });
      setAiHelpData(response);
    } catch (err) {
      toaster.error({ title: 'Error al validar con IA', duration: 3000 });
      setAiHelpStep(null);
    } finally {
      setAiHelpLoading(false);
    }
  }, [productType, customData]);

  if (loading) {
    return (
      <Center h="400px">
        <VStack gap={4}>
          <Spinner size="xl" color={colors.primaryColor} />
          <Text color={colors.textColor}>{t('common.loading')}</Text>
        </VStack>
      </Center>
    );
  }

  if (!sections.length) {
    return (
      <Center h="400px">
        <VStack gap={4}>
          <Icon as={FiAlertCircle} boxSize={12} color="orange.400" />
          <Text color={colors.textColor} fontSize="lg">
            No hay configuracion de campos para este producto
          </Text>
          <Button variant="outline" onClick={() => navigate(-1)} leftIcon={<FiArrowLeft />}>
            Volver
          </Button>
        </VStack>
      </Center>
    );
  }

  const title = titleKey
    ? t(titleKey)
    : productConfig?.description || productType.replace(/_/g, ' ').replace('CP ', '');

  // Design tokens
  const cardBg = isDark ? 'gray.800' : 'white';
  const cardBorder = isDark ? 'gray.700' : 'gray.200';
  const headerBg = isDark ? 'gray.900' : 'gray.50';
  const sectionHeaderBg = isDark ? 'whiteAlpha.50' : 'gray.50';
  const accentGradient = isDark
    ? 'linear(to-r, blue.600, purple.600)'
    : 'linear(to-r, blue.500, purple.500)';

  return (
    <Box flex={1} p={{ base: 4, md: 6 }} maxW="1400px" mx="auto">
      <VStack gap={6} align="stretch">
        {/* Header with gradient accent */}
        <Box
          bg={cardBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={cardBorder}
          overflow="hidden"
          shadow="sm"
        >
          <Box
            bgGradient={accentGradient}
            h="4px"
          />
          <Box p={6}>
            <Flex
              direction={{ base: 'column', md: 'row' }}
              justify="space-between"
              align={{ base: 'start', md: 'center' }}
              gap={4}
            >
              <VStack align="start" gap={1}>
                <HStack>
                  <Icon as={FiFileText} boxSize={6} color={colors.primaryColor} />
                  <Heading size="lg" color={colors.textColor}>
                    {title}
                  </Heading>
                </HStack>
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  Modo Experto - Complete todos los campos requeridos
                </Text>
              </VStack>

              {/* Progress indicator */}
              <Box
                bg={sectionHeaderBg}
                px={4}
                py={3}
                borderRadius="lg"
                minW="200px"
              >
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary}>
                    Progreso
                  </Text>
                  <Badge
                    colorPalette={progress.percentage === 100 ? 'green' : 'blue'}
                    variant="subtle"
                  >
                    {progress.filled}/{progress.total} campos
                  </Badge>
                </HStack>
                <Progress.Root
                  value={progress.percentage}
                  size="sm"
                  colorPalette={progress.percentage === 100 ? 'green' : 'blue'}
                >
                  <Progress.Track>
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
              </Box>
            </Flex>

            {/* Action buttons */}
            <Flex justify="flex-end" mt={4} gap={3}>
              <Button
                variant="outline"
                colorPalette="purple"
                onClick={handleAIValidation}
                disabled={aiValidating}
                loading={aiValidating}
                size="sm"
              >
                <Icon as={LuShieldCheck} mr={2} />
                Validacion IA
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                size="sm"
              >
                <Icon as={FiSave} mr={2} />
                Guardar Borrador
              </Button>
              <Button
                colorPalette="blue"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                loading={submitting}
                size="sm"
              >
                <Icon as={FiSend} mr={2} />
                Crear Proceso
              </Button>
            </Flex>
          </Box>
        </Box>

        {/* Sections from swift_field_config_readmodel */}
        {sections.map((section, sectionIndex) => {
          const SectionIcon = sectionIcons[section.sectionCode] || FiFileText;
          const secColor = sectionColors[section.sectionCode] || 'blue';
          const isExpanded = expandedSteps[section.sectionCode] ?? true;

          // Count required fields in this section
          const requiredFields = section.fields.filter(f => f.isRequired);
          const filledRequired = requiredFields.filter(f => {
            const val = customData[f.fieldCode];
            return val !== null && val !== undefined && val !== '';
          });

          return (
            <Box
              key={section.sectionCode}
              bg={cardBg}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={cardBorder}
              overflow="hidden"
              shadow="sm"
              transition="all 0.2s"
              _hover={{ shadow: 'md', borderColor: isDark ? 'gray.600' : 'gray.300' }}
            >
              {/* Section Header */}
              <Box
                px={5}
                py={4}
                cursor="pointer"
                onClick={() => toggleStep(section.sectionCode)}
                bg={headerBg}
                borderBottomWidth={isExpanded ? '1px' : '0'}
                borderColor={cardBorder}
                transition="all 0.2s"
                _hover={{ bg: isDark ? 'gray.800' : 'gray.100' }}
              >
                <Flex justify="space-between" align="center">
                  <HStack gap={3}>
                    <Flex
                      w={10}
                      h={10}
                      borderRadius="lg"
                      bg={`${secColor}.${isDark ? '900' : '100'}`}
                      color={`${secColor}.${isDark ? '300' : '600'}`}
                      align="center"
                      justify="center"
                    >
                      <Icon as={SectionIcon} boxSize={5} />
                    </Flex>
                    <VStack align="start" gap={0}>
                      <HStack>
                        <Badge
                          colorPalette={secColor}
                          variant="subtle"
                          size="sm"
                        >
                          Paso {sectionIndex + 1}
                        </Badge>
                        <Heading size="sm" color={colors.textColor}>
                          {section.sectionName}
                        </Heading>
                      </HStack>
                    </VStack>
                  </HStack>

                  <HStack gap={3}>
                    {/* AI Help button */}
                    <Button
                      size="xs"
                      variant="outline"
                      colorPalette="purple"
                      onClick={(e) => { e.stopPropagation(); handleAIHelp(section.sectionCode); }}
                      disabled={aiHelpLoading && aiHelpStep === section.sectionCode}
                    >
                      <Icon as={LuSparkles} mr={1} />
                      Ayuda IA
                    </Button>
                    {/* Completion indicator */}
                    {requiredFields.length > 0 && (
                      <HStack gap={1}>
                        <Icon
                          as={filledRequired.length === requiredFields.length ? FiCheckCircle : FiAlertCircle}
                          color={filledRequired.length === requiredFields.length ? 'green.500' : 'orange.400'}
                          boxSize={4}
                        />
                        <Text fontSize="xs" color={colors.textColorSecondary}>
                          {filledRequired.length}/{requiredFields.length}
                        </Text>
                      </HStack>
                    )}
                    <Icon
                      as={isExpanded ? FiChevronDown : FiChevronRight}
                      color={colors.textColorSecondary}
                      boxSize={5}
                      transition="transform 0.2s"
                    />
                  </HStack>
                </Flex>
              </Box>

              {/* Section Content */}
              {isExpanded && (
                <Box p={5}>
                  <SimpleGrid
                    columns={{ base: 1, md: 2 }}
                    gap={5}
                  >
                    {section.fields.map((field: CustomFieldDTO) => (
                      <Box
                        key={field.id}
                        gridColumn={
                          field.spanColumns === 2
                            ? { base: 'span 1', md: 'span 2' }
                            : 'span 1'
                        }
                      >
                        <DynamicCustomField
                          field={field}
                          value={customData[field.fieldCode]}
                          onChange={(value) => updateFieldValue(field.fieldCode, value)}
                          onAIHelp={handleFieldAIHelp}
                          onAIValidation={handleFieldAIValidation}
                        />
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              )}
            </Box>
          );
        })}

        {/* Footer actions */}
        <Box
          bg={cardBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={cardBorder}
          p={4}
          shadow="sm"
        >
          <Flex justify="space-between" align="center">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              leftIcon={<FiArrowLeft />}
            >
              Cancelar
            </Button>
            <HStack gap={3}>
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
              >
                <Icon as={FiSave} mr={2} />
                Guardar Borrador
              </Button>
              <Button
                colorPalette="blue"
                onClick={() => handleSubmit(false)}
                disabled={submitting || progress.percentage < 100}
                loading={submitting}
              >
                <Icon as={FiSend} mr={2} />
                Crear Proceso
              </Button>
            </HStack>
          </Flex>
        </Box>
        {/* AI Help Slide-over Panel */}
        {aiHelpStep && (
          <Box
            position="fixed"
            top={0}
            right={0}
            bottom={0}
            w={{ base: '100%', md: '480px' }}
            bg={cardBg}
            borderLeftWidth="1px"
            borderColor={cardBorder}
            shadow="2xl"
            zIndex={1000}
            overflowY="auto"
          >
            {/* Panel Header */}
            <Box
              bgGradient="to-r"
              gradientFrom="purple.500"
              gradientTo="blue.600"
              p={4}
              color="white"
            >
              <Flex justify="space-between" align="center">
                <HStack>
                  <Icon as={LuSparkles} boxSize={5} />
                  <Text fontWeight="bold" fontSize="lg">
                    {aiHelpStep === 'VALIDATION' ? 'Validacion IA' : 'Asistente Legal IA'}
                  </Text>
                </HStack>
                <Button
                  size="sm"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => { setAiHelpStep(null); setAiHelpData(null); setAiValidationResults(null); }}
                >
                  <FiX />
                </Button>
              </Flex>
              {aiHelpStep !== 'VALIDATION' && (
                <Text fontSize="sm" mt={1} opacity={0.9}>
                  Paso: {aiHelpStep}
                </Text>
              )}
            </Box>

            {/* Panel Content */}
            <Box p={4}>
              {(aiHelpLoading || aiValidating) && (
                <Center py={10}>
                  <VStack gap={3}>
                    <Spinner size="xl" color="purple.500" />
                    <Text color={colors.textColorSecondary}>
                      {aiValidating ? 'Validando formulario...' : 'Consultando marco legal...'}
                    </Text>
                  </VStack>
                </Center>
              )}

              {(aiHelpData || aiValidationResults) && (() => {
                const data = aiValidationResults || aiHelpData;
                if (!data) return null;
                return (
                  <VStack align="stretch" gap={4}>
                    {/* Severity & Confidence */}
                    <HStack>
                      <Badge
                        colorPalette={data.severity === 'REQUIRED' ? 'red' : data.severity === 'WARNING' ? 'orange' : 'blue'}
                        variant="subtle"
                      >
                        {data.severity === 'REQUIRED' ? 'Obligatorio' : data.severity === 'WARNING' ? 'Advertencia' : 'Informacion'}
                      </Badge>
                      {data.confidence > 0 && (
                        <Badge colorPalette="green" variant="subtle">
                          {Math.round(data.confidence * 100)}% confianza
                        </Badge>
                      )}
                    </HStack>

                    {/* Title */}
                    <Heading size="md" color={colors.textColor}>{data.title}</Heading>

                    {/* Content */}
                    <Text color={colors.textColorSecondary} lineHeight="tall">{data.content}</Text>

                    {/* Legal References */}
                    {data.legalReferences?.length > 0 && (
                      <Box>
                        <HStack mb={2}>
                          <Icon as={LuScale} color="purple.500" boxSize={4} />
                          <Text fontWeight="semibold" color="purple.600">Referencias Legales</Text>
                        </HStack>
                        <VStack align="stretch" gap={2}>
                          {data.legalReferences.map((ref: LegalReference, i: number) => (
                            <Box key={i} p={3} borderWidth="1px" borderColor="purple.200" borderRadius="md" bg={isDark ? 'whiteAlpha.50' : 'purple.50'}>
                              <HStack justify="space-between" mb={1}>
                                <Badge colorPalette="purple" variant="solid">{ref.law}</Badge>
                                <Text fontWeight="bold" color="purple.600" fontSize="sm">{ref.article}</Text>
                              </HStack>
                              <Text fontSize="sm" color={colors.textColorSecondary}>{ref.summary}</Text>
                            </Box>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    {/* Requirements */}
                    {data.requirements?.length > 0 && (
                      <Box>
                        <Text fontWeight="semibold" color="green.600" mb={2}>Requisitos ({data.requirements.length})</Text>
                        <VStack align="stretch" gap={1}>
                          {data.requirements.map((req: string, i: number) => (
                            <HStack key={i} align="start">
                              <Icon as={FiCheckCircle} color="green.500" boxSize={3} mt={1} />
                              <Text fontSize="sm" color={colors.textColorSecondary}>{req}</Text>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    {/* Common Errors */}
                    {data.commonErrors?.length > 0 && (
                      <Box>
                        <Text fontWeight="semibold" color="orange.600" mb={2}>Errores Comunes ({data.commonErrors.length})</Text>
                        <VStack align="stretch" gap={1}>
                          {data.commonErrors.map((err: string, i: number) => (
                            <HStack key={i} align="start">
                              <Icon as={FiAlertCircle} color="orange.500" boxSize={3} mt={1} />
                              <Text fontSize="sm" color={colors.textColorSecondary}>{err}</Text>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    {/* Tips */}
                    {data.tips?.length > 0 && (
                      <Box>
                        <Text fontWeight="semibold" color="blue.600" mb={2}>Consejos ({data.tips.length})</Text>
                        <VStack align="stretch" gap={1}>
                          {data.tips.map((tip: string, i: number) => (
                            <HStack key={i} align="start">
                              <Icon as={LuSparkles} color="yellow.500" boxSize={3} mt={1} />
                              <Text fontSize="sm" color={colors.textColorSecondary}>{tip}</Text>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    {/* SERCOP Resolutions */}
                    {data.sercopResolutions?.length > 0 && (
                      <Box>
                        <Text fontWeight="semibold" fontSize="sm" mb={2}>Resoluciones SERCOP</Text>
                        <HStack flexWrap="wrap" gap={2}>
                          {data.sercopResolutions.map((res: string, i: number) => (
                            <Badge key={i} colorPalette="blue" variant="outline">{res}</Badge>
                          ))}
                        </HStack>
                      </Box>
                    )}

                    {/* Footer */}
                    <HStack justify="space-between" pt={2} borderTopWidth="1px" borderColor={cardBorder}>
                      <Text fontSize="xs" color={colors.textColorSecondary}>
                        {data.processingTimeMs}ms
                      </Text>
                      <Text fontSize="xs" color={colors.textColorSecondary}>
                        {data.provider} / {data.model}
                      </Text>
                    </HStack>
                  </VStack>
                );
              })()}
            </Box>
          </Box>
        )}

        {/* Backdrop when AI panel is open */}
        {aiHelpStep && (
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.400"
            zIndex={999}
            onClick={() => { setAiHelpStep(null); setAiHelpData(null); setAiValidationResults(null); }}
          />
        )}
      </VStack>
    </Box>
  );
};

export default ComprasPublicasExpert;
