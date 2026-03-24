/**
 * CPPAAEditPage - Detalle y edicion de un Plan Anual de Adquisiciones
 * Muestra los items del PAA, resumen presupuestario, agregacion de demanda
 * y presupuesto por departamento. Permite gestionar el workflow de estados.
 * Incluye asistente de IA para validacion LOSNCP, deteccion de fraccionamiento,
 * y recomendaciones por item.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Table,
  Card,
  IconButton,
  Textarea,
  Input,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiTrash2,
  FiEdit,
  FiArrowLeft,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiUsers,
  FiAlertTriangle,
  FiCheck,
  FiSend,
  FiX,
} from 'react-icons/fi';
import { LuSparkles, LuShieldCheck, LuBrain, LuScale } from 'react-icons/lu';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../../components/ui/toaster';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import {
  getPAA,
  updatePAA,
  updatePAAStatus,
  addPAAItem,
  removePAAItem,
  getDemandAggregation,
  getBudgetByDepartment,
  getPAAStatusColor,
  getPriorityColor,
  formatCurrency,
  type CPPAA,
  type CPPAAItem,
  type DemandAggregation,
  type BudgetByDepartment,
} from '../../services/cpPAAService';
import { getProcessTypes, type ProcessType } from '../../services/cpAIService';
import {
  getLegalHelp,
  type CPLegalHelpResponse,
} from '../../services/cpAIService';
import CPAIResponseDisplay from '../../components/compras-publicas/ai/CPAIResponseDisplay';

// Status workflow definition
const STATUS_WORKFLOW: Record<string, { next: string; label: string; color: string }> = {
  BORRADOR: { next: 'ENVIADO', label: 'Enviar para Aprobacion', color: 'blue' },
  ENVIADO: { next: 'APROBADO', label: 'Aprobar PAA', color: 'green' },
};

export const CPPAAEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const navigate = useNavigate();

  // State
  const [paa, setPaa] = useState<CPPAA | null>(null);
  const [loading, setLoading] = useState(true);
  const [demandAggregation, setDemandAggregation] = useState<DemandAggregation[]>([]);
  const [budgetByDept, setBudgetByDept] = useState<BudgetByDepartment[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  // Inline editing state
  const [editingEntity, setEditingEntity] = useState(false);
  const [editEntityName, setEditEntityName] = useState('');
  const [editEntityRuc, setEditEntityRuc] = useState('');
  const [savingEntity, setSavingEntity] = useState(false);

  // AI State
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<CPLegalHelpResponse | null>(null);
  const [aiContext, setAiContext] = useState<string>(''); // tracks what was queried
  const [aiQuery, setAiQuery] = useState('');
  // Per-item AI
  const [itemAiId, setItemAiId] = useState<string | null>(null);
  const [itemAiLoading, setItemAiLoading] = useState(false);

  // Add Item state
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
  const [newItem, setNewItem] = useState({
    cpcCode: '', cpcDescription: '', itemDescription: '',
    processType: '', budgetAmount: '', budgetPartition: '',
    fundingSource: '', department: '', estimatedPublicationDate: '',
    estimatedAdjudicationDate: '', estimatedContractDurationDays: '90',
    priority: 'MEDIUM',
  });
  const [itemAiResponse, setItemAiResponse] = useState<CPLegalHelpResponse | null>(null);

  // Design tokens
  const cardBg = isDark ? 'gray.800' : 'white';
  const cardBorder = isDark ? 'gray.700' : 'gray.200';
  const headerBg = isDark ? 'gray.900' : 'gray.50';
  const accentGradient = isDark
    ? 'linear(to-r, blue.600, purple.600)'
    : 'linear(to-r, blue.500, purple.500)';
  const rowHoverBg = isDark ? 'gray.700' : 'gray.50';
  const warningBg = isDark ? 'orange.900' : 'orange.50';
  const warningBorder = isDark ? 'orange.700' : 'orange.200';

  // Load PAA data
  const loadPAA = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [paaData, demandData, budgetData] = await Promise.all([
        getPAA(id),
        getDemandAggregation(id),
        getBudgetByDepartment(id),
      ]);
      setPaa(paaData);
      setDemandAggregation(demandData);
      setBudgetByDept(budgetData);
    } catch (error) {
      toaster.create({
        title: t('cpPAA.errorLoading', 'Error al cargar PAA'),
        description: error instanceof Error ? error.message : t('common.unknownError', 'Error desconocido'),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadPAA();
  }, [loadPAA]);

  // Load process types for add-item dropdown
  useEffect(() => {
    getProcessTypes().then(setProcessTypes).catch(() => {});
  }, []);

  // Reset new item form
  const resetNewItem = () => {
    setNewItem({
      cpcCode: '', cpcDescription: '', itemDescription: '',
      processType: '', budgetAmount: '', budgetPartition: '',
      fundingSource: '', department: '', estimatedPublicationDate: '',
      estimatedAdjudicationDate: '', estimatedContractDurationDays: '90',
      priority: 'MEDIUM',
    });
  };

  // Open add item dialog
  const openAddItem = () => {
    resetNewItem();
    setAddItemOpen(true);
  };

  // Add item handler
  const handleAddItem = async () => {
    if (!paa || !newItem.itemDescription.trim() || !newItem.cpcCode.trim()) {
      toaster.create({
        title: 'Campos requeridos',
        description: 'Codigo CPC y descripcion son obligatorios',
        type: 'warning',
        duration: 3000,
      });
      return;
    }
    setAddingItem(true);
    try {
      const nextLine = (paa.items?.length ?? 0) + 1;
      await addPAAItem(paa.id, {
        lineNumber: nextLine,
        cpcCode: newItem.cpcCode.trim(),
        cpcDescription: newItem.cpcDescription.trim(),
        itemDescription: newItem.itemDescription.trim(),
        processType: newItem.processType || 'CP_MENOR_CUANTIA',
        budgetAmount: parseFloat(newItem.budgetAmount) || 0,
        budgetPartition: newItem.budgetPartition.trim(),
        fundingSource: newItem.fundingSource.trim(),
        department: newItem.department.trim(),
        estimatedPublicationDate: newItem.estimatedPublicationDate || '',
        estimatedAdjudicationDate: newItem.estimatedAdjudicationDate || '',
        estimatedContractDurationDays: parseInt(newItem.estimatedContractDurationDays) || 90,
        priority: newItem.priority,
        status: 'PLANIFICADO',
        linkedProcessId: null,
      });
      setAddItemOpen(false);
      toaster.create({ title: 'Item agregado exitosamente', type: 'success', duration: 3000 });
      await loadPAA();
    } catch (error) {
      toaster.create({
        title: 'Error al agregar item',
        description: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setAddingItem(false);
    }
  };

  // Status transition
  const handleStatusChange = async (newStatus: string) => {
    if (!paa) return;
    setUpdatingStatus(true);
    try {
      const updated = await updatePAAStatus(paa.id, newStatus);
      setPaa(updated);
      toaster.create({
        title: t('cpPAA.statusUpdated', 'Estado actualizado'),
        description: `${paa.status} -> ${newStatus}`,
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      toaster.create({
        title: t('cpPAA.errorUpdatingStatus', 'Error al actualizar estado'),
        description: error instanceof Error ? error.message : t('common.unknownError', 'Error desconocido'),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Remove item
  const handleRemoveItem = async (itemId: string) => {
    setRemovingItemId(itemId);
    try {
      await removePAAItem(itemId);
      toaster.create({
        title: t('cpPAA.itemRemoved', 'Item eliminado'),
        type: 'success',
        duration: 3000,
      });
      // Reload data
      await loadPAA();
    } catch (error) {
      toaster.create({
        title: t('cpPAA.errorRemovingItem', 'Error al eliminar item'),
        description: error instanceof Error ? error.message : t('common.unknownError', 'Error desconocido'),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setRemovingItemId(null);
    }
  };

  // ============================================================================
  // Entity Editing
  // ============================================================================

  const startEditEntity = () => {
    if (!paa) return;
    setEditEntityName(paa.entityName || '');
    setEditEntityRuc(paa.entityRuc || '');
    setEditingEntity(true);
  };

  const saveEntity = async () => {
    if (!paa || !editEntityName.trim()) return;
    setSavingEntity(true);
    try {
      const updated = await updatePAA(paa.id, {
        entityName: editEntityName.trim(),
        entityRuc: editEntityRuc.trim(),
      });
      setPaa(updated);
      setEditingEntity(false);
      toaster.create({
        title: 'Entidad actualizada',
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      toaster.create({
        title: 'Error al actualizar entidad',
        description: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setSavingEntity(false);
    }
  };

  // ============================================================================
  // AI Handlers
  // ============================================================================

  /** Analyze entire PAA for LOSNCP compliance */
  const handleAnalyzePAA = useCallback(async () => {
    if (!paa) return;
    setAiPanelOpen(true);
    setAiLoading(true);
    setAiResponse(null);
    setAiContext('PAA_FULL_ANALYSIS');
    try {
      const itemsSummary = (paa.items || []).map((item) =>
        `- ${item.cpcCode} (${item.cpcDescription}): ${formatCurrency(item.budgetAmount)} | Tipo: ${item.processType} | Depto: ${item.department} | Prioridad: ${item.priority}`
      ).join('\n');

      const response = await getLegalHelp({
        processType: 'PAA',
        currentStep: 'PAA_ANALYSIS',
        fieldId: 'FULL_PAA',
        budget: paa.totalBudget,
        question: `ANÁLISIS COMPLETO DEL PAA según LOSNCP y normativa SERCOP:

ENTIDAD: ${paa.entityName} (RUC: ${paa.entityRuc})
AÑO FISCAL: ${paa.fiscalYear}
PRESUPUESTO TOTAL: ${formatCurrency(paa.totalBudget)}
CANTIDAD DE ITEMS: ${paa.items?.length || 0}
DEPARTAMENTOS: ${new Set((paa.items || []).map(i => i.department)).size}
ESTADO: ${paa.status}

ITEMS DEL PAA:
${itemsSummary}

Analiza:
1. FRACCIONAMIENTO (Art. 62 LOSNCP): ¿Hay items con el mismo código CPC que deberían consolidarse para evitar fraccionamiento?
2. TIPO DE PROCESO vs PRESUPUESTO: ¿El tipo de proceso asignado a cada item es correcto según los montos y el coeficiente PIE del presupuesto?
3. PLAZOS: ¿Las fechas de publicación estimadas son razonables?
4. PRIORIDADES: ¿La distribución de prioridades es adecuada?
5. CUMPLIMIENTO LOSNCP: Verificar cumplimiento general con la Ley Orgánica del Sistema Nacional de Contratación Pública.
6. RECOMENDACIONES: Sugerencias de mejora para el PAA.`,
      });
      setAiResponse(response);
    } catch (err) {
      toaster.create({
        title: 'Error al analizar PAA',
        description: err instanceof Error ? err.message : 'Error desconocido',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setAiLoading(false);
    }
  }, [paa]);

  /** Analyze a single PAA item */
  const handleItemAIHelp = useCallback(async (item: CPPAAItem) => {
    setItemAiId(item.id);
    setItemAiLoading(true);
    setItemAiResponse(null);
    setAiPanelOpen(true);
    setAiContext(`ITEM_${item.lineNumber}`);
    try {
      const response = await getLegalHelp({
        processType: item.processType || 'PAA',
        currentStep: 'PAA_ITEM_ANALYSIS',
        fieldId: item.cpcCode,
        budget: item.budgetAmount,
        cpcCode: item.cpcCode,
        question: `ANÁLISIS DE ITEM DEL PAA según LOSNCP:

ITEM #${item.lineNumber}: ${item.itemDescription}
CPC: ${item.cpcCode} - ${item.cpcDescription}
PRESUPUESTO: ${formatCurrency(item.budgetAmount)}
TIPO DE PROCESO ASIGNADO: ${item.processType}
DEPARTAMENTO: ${item.department}
PRIORIDAD: ${item.priority}
FECHA PUBLICACIÓN ESTIMADA: ${item.estimatedPublicationDate || 'No definida'}
PARTIDA PRESUPUESTARIA: ${item.budgetPartition}
FUENTE DE FINANCIAMIENTO: ${item.fundingSource}

Analiza:
1. ¿El tipo de proceso "${item.processType}" es correcto para el monto de ${formatCurrency(item.budgetAmount)} según los umbrales LOSNCP y coeficiente PIE?
2. ¿El código CPC ${item.cpcCode} es adecuado para "${item.itemDescription}"?
3. ¿Qué documentos y requisitos se necesitan para este tipo de proceso?
4. ¿Cuáles son los plazos legales que se deben cumplir?
5. ¿Hay algún riesgo o consideración especial para este item?
6. Proporciona las referencias legales específicas (artículos LOSNCP, resoluciones SERCOP).`,
      });
      setItemAiResponse(response);
      setAiResponse(response);
    } catch (err) {
      toaster.create({
        title: 'Error al analizar item',
        description: err instanceof Error ? err.message : 'Error desconocido',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setItemAiLoading(false);
    }
  }, []);

  /** Analyze demand aggregation for fraccionamiento */
  const handleAnalyzeDemand = useCallback(async () => {
    if (!paa || demandAggregation.length === 0) return;
    setAiPanelOpen(true);
    setAiLoading(true);
    setAiResponse(null);
    setAiContext('DEMAND_AGGREGATION');
    try {
      const aggSummary = demandAggregation.map((agg) =>
        `- CPC ${agg.cpcCode} (${agg.cpcDescription}): ${formatCurrency(agg.totalAmount)} | ${agg.itemCount} items en ${agg.departmentCount} departamentos`
      ).join('\n');

      const response = await getLegalHelp({
        processType: 'PAA',
        currentStep: 'DEMAND_AGGREGATION',
        fieldId: 'CONSOLIDATION',
        budget: paa.totalBudget,
        question: `ANÁLISIS DE AGREGACIÓN DE DEMANDA según Art. 62 LOSNCP (Prohibición de Fraccionamiento):

ENTIDAD: ${paa.entityName}
AÑO FISCAL: ${paa.fiscalYear}

CÓDIGOS CPC CON MÚLTIPLES ITEMS:
${aggSummary}

Analiza según la LOSNCP y resoluciones SERCOP:
1. ¿Cuáles de estas agregaciones representan FRACCIONAMIENTO según Art. 62 LOSNCP?
2. ¿Qué items DEBEN consolidarse obligatoriamente?
3. ¿Cuál sería el tipo de proceso correcto si se consolidan los montos?
4. ¿Qué excepciones aplican según la normativa?
5. ¿Cuáles son las consecuencias legales del fraccionamiento?
6. Proporciona recomendaciones específicas para cada código CPC.`,
      });
      setAiResponse(response);
    } catch (err) {
      toaster.create({
        title: 'Error al analizar demanda',
        description: err instanceof Error ? err.message : 'Error desconocido',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setAiLoading(false);
    }
  }, [paa, demandAggregation]);

  /** Free-form AI query about the PAA */
  const handleAIQuery = useCallback(async () => {
    if (!paa || !aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    setAiContext('QUERY');
    try {
      const response = await getLegalHelp({
        processType: 'PAA',
        currentStep: 'PAA_QUERY',
        fieldId: 'FREE_QUERY',
        budget: paa.totalBudget,
        question: `Contexto: PAA de "${paa.entityName}", año fiscal ${paa.fiscalYear}, presupuesto total ${formatCurrency(paa.totalBudget)}, ${paa.items?.length || 0} items.

Pregunta del usuario: ${aiQuery}

Responde en el contexto de la LOSNCP, normativa SERCOP y contratación pública ecuatoriana.`,
      });
      setAiResponse(response);
    } catch (err) {
      toaster.create({
        title: 'Error en consulta IA',
        description: err instanceof Error ? err.message : 'Error desconocido',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setAiLoading(false);
    }
  }, [paa, aiQuery]);

  /** Close AI panel */
  const closeAiPanel = useCallback(() => {
    setAiPanelOpen(false);
    setAiResponse(null);
    setItemAiId(null);
    setItemAiResponse(null);
    setAiContext('');
  }, []);

  // Calculate max budget for bar chart
  const maxBudget = budgetByDept.length > 0
    ? Math.max(...budgetByDept.map((d) => d.totalAmount))
    : 0;

  // Get unique departments count
  const uniqueDepartments = paa?.items
    ? new Set(paa.items.map((item) => item.department)).size
    : 0;

  if (loading) {
    return (
      <Center h="400px">
        <VStack gap={4}>
          <Spinner size="xl" color={colors.primaryColor} />
          <Text color={colors.textColor}>{t('common.loading', 'Cargando...')}</Text>
        </VStack>
      </Center>
    );
  }

  if (!paa) {
    return (
      <Center h="400px">
        <VStack gap={4}>
          <Icon as={FiAlertTriangle} boxSize={12} color="orange.400" />
          <Text color={colors.textColor} fontSize="lg">
            {t('cpPAA.notFound', 'Plan Anual de Adquisiciones no encontrado')}
          </Text>
          <Button variant="outline" onClick={() => navigate('/cp/paa')}>
            <Icon as={FiArrowLeft} mr={2} />
            {t('cpPAA.backToList', 'Volver a la lista')}
          </Button>
        </VStack>
      </Center>
    );
  }

  const workflowAction = STATUS_WORKFLOW[paa.status];

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
          <Box bgGradient={accentGradient} h="4px" />
          <Box p={6}>
            <Flex
              direction={{ base: 'column', md: 'row' }}
              justify="space-between"
              align={{ base: 'start', md: 'center' }}
              gap={4}
            >
              <VStack align="start" gap={2}>
                {editingEntity ? (
                  /* Inline edit mode */
                  <VStack align="start" gap={2} w="100%">
                    <HStack>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/cp/paa')} p={1}>
                        <Icon as={FiArrowLeft} boxSize={5} />
                      </Button>
                      <Icon as={FiFileText} boxSize={6} color={colors.primaryColor} />
                      <Input
                        value={editEntityName}
                        onChange={(e) => setEditEntityName(e.target.value)}
                        placeholder="Nombre de la entidad contratante"
                        size="sm"
                        fontWeight="bold"
                        maxW="400px"
                        bg={isDark ? 'gray.700' : 'white'}
                        color={colors.textColor}
                        autoFocus
                      />
                    </HStack>
                    <HStack gap={2} ml={14}>
                      <Text fontSize="xs" color={colors.textColorSecondary}>RUC:</Text>
                      <Input
                        value={editEntityRuc}
                        onChange={(e) => setEditEntityRuc(e.target.value)}
                        placeholder="RUC (13 dígitos)"
                        size="xs"
                        maxW="180px"
                        fontFamily="mono"
                        bg={isDark ? 'gray.700' : 'white'}
                        color={colors.textColor}
                        maxLength={13}
                      />
                      <Button
                        size="xs"
                        colorPalette="green"
                        onClick={saveEntity}
                        loading={savingEntity}
                        disabled={!editEntityName.trim()}
                      >
                        <Icon as={FiCheck} mr={1} />
                        Guardar
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => setEditingEntity(false)}>
                        Cancelar
                      </Button>
                    </HStack>
                  </VStack>
                ) : (
                  /* Display mode */
                  <>
                    <HStack>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/cp/paa')} p={1}>
                        <Icon as={FiArrowLeft} boxSize={5} />
                      </Button>
                      <Icon as={FiFileText} boxSize={6} color={colors.primaryColor} />
                      <Heading size="lg" color={colors.textColor}>
                        {paa.entityName || t('cpPAA.noEntityName', 'Sin nombre de entidad')}
                      </Heading>
                      <IconButton
                        aria-label="Editar entidad"
                        variant="ghost"
                        size="xs"
                        onClick={startEditEntity}
                      >
                        <Icon as={FiEdit} />
                      </IconButton>
                    </HStack>
                    <HStack gap={3} flexWrap="wrap">
                      <Badge colorPalette="blue" variant="subtle">
                        <Icon as={FiCalendar} boxSize={3} mr={1} />
                        {t('cpPAA.fiscalYear', 'Anio Fiscal')}: {paa.fiscalYear}
                      </Badge>
                      <Badge colorPalette={getPAAStatusColor(paa.status)} variant="solid">
                        {paa.status}
                      </Badge>
                      <Badge colorPalette="purple" variant="subtle">
                        v{paa.version}
                      </Badge>
                      {paa.entityRuc && (
                        <Badge colorPalette="gray" variant="outline">
                          RUC: {paa.entityRuc}
                        </Badge>
                      )}
                    </HStack>
                  </>
                )}
              </VStack>

              {/* Workflow + AI actions */}
              <HStack gap={3}>
                <Button
                  colorPalette="purple"
                  variant="outline"
                  onClick={handleAnalyzePAA}
                  loading={aiLoading && aiContext === 'PAA_FULL_ANALYSIS'}
                  disabled={aiLoading}
                  size="sm"
                >
                  <Icon as={LuBrain} mr={2} />
                  Analizar PAA con IA
                </Button>
                <Button
                  colorPalette="blue"
                  variant="ghost"
                  onClick={() => { setAiPanelOpen(true); setAiContext('QUERY'); }}
                  size="sm"
                >
                  <Icon as={LuSparkles} mr={2} />
                  Asistente IA
                </Button>
                {workflowAction && (
                  <Button
                    colorPalette={workflowAction.color}
                    onClick={() => handleStatusChange(workflowAction.next)}
                    loading={updatingStatus}
                    disabled={updatingStatus}
                    size="sm"
                  >
                    <Icon as={FiCheck} mr={2} />
                    {t(`cpPAA.workflow.${workflowAction.next}`, workflowAction.label)}
                  </Button>
                )}
              </HStack>
            </Flex>
          </Box>
        </Box>

        {/* Budget Summary Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <Card.Root bg={cardBg} borderColor={cardBorder} borderWidth="1px">
            <Card.Body p={4}>
              <HStack gap={3}>
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg={isDark ? 'green.900' : 'green.100'}
                  color={isDark ? 'green.300' : 'green.600'}
                  align="center"
                  justify="center"
                >
                  <Icon as={FiDollarSign} boxSize={5} />
                </Flex>
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    {t('cpPAA.summary.totalBudget', 'Presupuesto Total')}
                  </Text>
                  <Text fontSize="xl" fontWeight="700" color={colors.textColor}>
                    {formatCurrency(paa.totalBudget)}
                  </Text>
                </VStack>
              </HStack>
            </Card.Body>
          </Card.Root>

          <Card.Root bg={cardBg} borderColor={cardBorder} borderWidth="1px">
            <Card.Body p={4}>
              <HStack gap={3}>
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg={isDark ? 'blue.900' : 'blue.100'}
                  color={isDark ? 'blue.300' : 'blue.600'}
                  align="center"
                  justify="center"
                >
                  <Icon as={FiFileText} boxSize={5} />
                </Flex>
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    {t('cpPAA.summary.itemCount', 'Cantidad de Items')}
                  </Text>
                  <Text fontSize="xl" fontWeight="700" color={colors.textColor}>
                    {paa.items?.length ?? 0}
                  </Text>
                </VStack>
              </HStack>
            </Card.Body>
          </Card.Root>

          <Card.Root bg={cardBg} borderColor={cardBorder} borderWidth="1px">
            <Card.Body p={4}>
              <HStack gap={3}>
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg={isDark ? 'purple.900' : 'purple.100'}
                  color={isDark ? 'purple.300' : 'purple.600'}
                  align="center"
                  justify="center"
                >
                  <Icon as={FiUsers} boxSize={5} />
                </Flex>
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    {t('cpPAA.summary.departments', 'Departamentos')}
                  </Text>
                  <Text fontSize="xl" fontWeight="700" color={colors.textColor}>
                    {uniqueDepartments}
                  </Text>
                </VStack>
              </HStack>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {/* PAA Items Table */}
        <Box
          bg={cardBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={cardBorder}
          overflow="hidden"
          shadow="sm"
        >
          <Box px={5} py={4} bg={headerBg} borderBottomWidth="1px" borderColor={cardBorder}>
            <Flex justify="space-between" align="center">
              <HStack gap={3}>
                <Flex
                  w={8}
                  h={8}
                  borderRadius="lg"
                  bg={isDark ? 'blue.900' : 'blue.100'}
                  color={isDark ? 'blue.300' : 'blue.600'}
                  align="center"
                  justify="center"
                >
                  <Icon as={FiFileText} boxSize={4} />
                </Flex>
                <Heading size="sm" color={colors.textColor}>
                  {t('cpPAA.items.title', 'Items del PAA')}
                </Heading>
                <Badge colorPalette="blue" variant="subtle" size="sm">
                  {paa.items?.length ?? 0}
                </Badge>
              </HStack>
              <Button colorPalette="blue" size="sm" variant="outline" onClick={openAddItem}>
                <Icon as={FiPlus} mr={2} />
                {t('cpPAA.items.add', 'Agregar Item')}
              </Button>
            </Flex>
          </Box>

          {(!paa.items || paa.items.length === 0) ? (
            <Center py={12}>
              <VStack gap={3}>
                <Icon as={FiFileText} boxSize={10} color={colors.textColorSecondary} />
                <Text color={colors.textColorSecondary}>
                  {t('cpPAA.items.empty', 'No hay items en este PAA')}
                </Text>
                <Button colorPalette="blue" size="sm" onClick={openAddItem}>
                  <Icon as={FiPlus} mr={2} />
                  {t('cpPAA.items.addFirst', 'Agregar primer item')}
                </Button>
              </VStack>
            </Center>
          ) : (
            <Box overflowX="auto">
              <Table.Root size="sm" variant="outline">
                <Table.Header>
                  <Table.Row bg={headerBg}>
                    <Table.ColumnHeader color={colors.textColor} px={3} py={3} w="60px">
                      #
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={3} py={3}>
                      {t('cpPAA.items.cpcCode', 'CPC')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={3} py={3}>
                      {t('cpPAA.items.description', 'Descripcion')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={3} py={3}>
                      {t('cpPAA.items.processType', 'Tipo Proceso')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={3} py={3} textAlign="right">
                      {t('cpPAA.items.budget', 'Presupuesto')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={3} py={3}>
                      {t('cpPAA.items.department', 'Departamento')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={3} py={3} textAlign="center">
                      {t('cpPAA.items.priority', 'Prioridad')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={3} py={3} textAlign="center">
                      {t('cpPAA.items.status', 'Estado')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={3} py={3} textAlign="center">
                      <Icon as={FiCalendar} boxSize={3} mr={1} />
                      {t('cpPAA.items.publicationDate', 'Publicacion Est.')}
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={3} py={3} w="40px" textAlign="center">
                      <Icon as={LuSparkles} boxSize={3} color="purple.500" />
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color={colors.textColor} px={3} py={3} w="40px" textAlign="center">
                      {t('cpPAA.items.actions', '')}
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {paa.items.map((item) => (
                    <Table.Row
                      key={item.id}
                      _hover={{ bg: rowHoverBg }}
                      transition="background 0.15s"
                    >
                      <Table.Cell px={3} py={3}>
                        <Text fontSize="sm" color={colors.textColorSecondary} fontWeight="600">
                          {item.lineNumber}
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={3} py={3}>
                        <VStack align="start" gap={0}>
                          <Text fontSize="sm" fontWeight="600" color={colors.textColor} fontFamily="mono">
                            {item.cpcCode}
                          </Text>
                          {item.cpcDescription && (
                            <Text fontSize="xs" color={colors.textColorSecondary} lineClamp={1}>
                              {item.cpcDescription}
                            </Text>
                          )}
                        </VStack>
                      </Table.Cell>
                      <Table.Cell px={3} py={3}>
                        <Text fontSize="sm" color={colors.textColor} lineClamp={2}>
                          {item.itemDescription}
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={3} py={3}>
                        <Badge colorPalette="blue" variant="outline" size="sm">
                          {item.processType}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell px={3} py={3} textAlign="right">
                        <Text fontSize="sm" fontWeight="600" color={colors.textColor} fontFamily="mono">
                          {formatCurrency(item.budgetAmount)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={3} py={3}>
                        <Text fontSize="sm" color={colors.textColor}>
                          {item.department}
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={3} py={3} textAlign="center">
                        <Badge
                          colorPalette={getPriorityColor(item.priority)}
                          variant="subtle"
                          size="sm"
                        >
                          {item.priority}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell px={3} py={3} textAlign="center">
                        <Badge
                          colorPalette={getPAAStatusColor(item.status)}
                          variant="subtle"
                          size="sm"
                        >
                          {item.status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell px={3} py={3} textAlign="center">
                        <Text fontSize="xs" color={colors.textColorSecondary}>
                          {item.estimatedPublicationDate
                            ? new Date(item.estimatedPublicationDate).toLocaleDateString('es-EC')
                            : '-'}
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={2} py={3} textAlign="center">
                        <IconButton
                          aria-label="Analizar item con IA"
                          variant="ghost"
                          size="xs"
                          colorPalette="purple"
                          onClick={(e) => { e.stopPropagation(); handleItemAIHelp(item); }}
                          disabled={itemAiLoading && itemAiId === item.id}
                        >
                          {itemAiLoading && itemAiId === item.id ? (
                            <Spinner size="xs" />
                          ) : (
                            <Icon as={LuSparkles} />
                          )}
                        </IconButton>
                      </Table.Cell>
                      <Table.Cell px={2} py={3} textAlign="center">
                        <IconButton
                          aria-label={t('cpPAA.items.remove', 'Eliminar item')}
                          variant="ghost"
                          size="xs"
                          colorPalette="red"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removingItemId === item.id}
                        >
                          {removingItemId === item.id ? (
                            <Spinner size="xs" />
                          ) : (
                            <Icon as={FiTrash2} />
                          )}
                        </IconButton>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}
        </Box>

        {/* Bottom panels: Demand Aggregation + Budget by Department */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
          {/* Demand Aggregation Panel */}
          <Box
            bg={cardBg}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={cardBorder}
            overflow="hidden"
            shadow="sm"
          >
            <Box px={5} py={4} bg={headerBg} borderBottomWidth="1px" borderColor={cardBorder}>
              <HStack gap={3}>
                <Flex
                  w={8}
                  h={8}
                  borderRadius="lg"
                  bg={isDark ? 'orange.900' : 'orange.100'}
                  color={isDark ? 'orange.300' : 'orange.600'}
                  align="center"
                  justify="center"
                >
                  <Icon as={FiAlertTriangle} boxSize={4} />
                </Flex>
                <VStack align="start" gap={0} flex={1}>
                  <Heading size="sm" color={colors.textColor}>
                    {t('cpPAA.demand.title', 'Agregacion de Demanda')}
                  </Heading>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    {t('cpPAA.demand.subtitle', 'Oportunidades de consolidacion por codigo CPC')}
                  </Text>
                </VStack>
                {demandAggregation.length > 0 && (
                  <Button
                    size="xs"
                    colorPalette="purple"
                    variant="ghost"
                    onClick={handleAnalyzeDemand}
                    loading={aiLoading && aiContext === 'DEMAND_AGGREGATION'}
                    disabled={aiLoading}
                  >
                    <Icon as={LuScale} mr={1} />
                    Analizar Fraccionamiento
                  </Button>
                )}
              </HStack>
            </Box>

            <Box p={4}>
              {demandAggregation.length === 0 ? (
                <Center py={8}>
                  <Text fontSize="sm" color={colors.textColorSecondary}>
                    {t('cpPAA.demand.empty', 'No hay datos de agregacion de demanda')}
                  </Text>
                </Center>
              ) : (
                <VStack gap={3} align="stretch">
                  {demandAggregation.map((agg) => {
                    const isConsolidatable = agg.departmentCount > 1;
                    return (
                      <Card.Root
                        key={agg.cpcCode}
                        bg={isConsolidatable ? warningBg : (isDark ? 'gray.750' : 'gray.50')}
                        borderColor={isConsolidatable ? warningBorder : cardBorder}
                        borderWidth="1px"
                      >
                        <Card.Body p={3}>
                          <VStack align="stretch" gap={2}>
                            <Flex justify="space-between" align="start">
                              <VStack align="start" gap={0} flex={1}>
                                <Text fontSize="sm" fontWeight="700" color={colors.textColor} fontFamily="mono">
                                  {agg.cpcCode}
                                </Text>
                                <Text fontSize="xs" color={colors.textColorSecondary} lineClamp={1}>
                                  {agg.cpcDescription}
                                </Text>
                              </VStack>
                              <Text fontSize="sm" fontWeight="700" color={colors.textColor} fontFamily="mono">
                                {formatCurrency(agg.totalAmount)}
                              </Text>
                            </Flex>
                            <HStack gap={3}>
                              <Badge colorPalette="blue" variant="subtle" size="sm">
                                {agg.itemCount} {t('cpPAA.demand.items', 'items')}
                              </Badge>
                              <Badge
                                colorPalette={isConsolidatable ? 'orange' : 'gray'}
                                variant={isConsolidatable ? 'solid' : 'subtle'}
                                size="sm"
                              >
                                <Icon as={FiUsers} boxSize={3} mr={1} />
                                {agg.departmentCount} {t('cpPAA.demand.departments', 'departamentos')}
                              </Badge>
                              {isConsolidatable && (
                                <Badge colorPalette="orange" variant="outline" size="sm">
                                  <Icon as={FiAlertTriangle} boxSize={3} mr={1} />
                                  {t('cpPAA.demand.consolidatable', 'Consolidable')}
                                </Badge>
                              )}
                            </HStack>
                          </VStack>
                        </Card.Body>
                      </Card.Root>
                    );
                  })}
                </VStack>
              )}
            </Box>
          </Box>

          {/* Budget by Department Panel */}
          <Box
            bg={cardBg}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={cardBorder}
            overflow="hidden"
            shadow="sm"
          >
            <Box px={5} py={4} bg={headerBg} borderBottomWidth="1px" borderColor={cardBorder}>
              <HStack gap={3}>
                <Flex
                  w={8}
                  h={8}
                  borderRadius="lg"
                  bg={isDark ? 'green.900' : 'green.100'}
                  color={isDark ? 'green.300' : 'green.600'}
                  align="center"
                  justify="center"
                >
                  <Icon as={FiDollarSign} boxSize={4} />
                </Flex>
                <VStack align="start" gap={0}>
                  <Heading size="sm" color={colors.textColor}>
                    {t('cpPAA.budgetDept.title', 'Presupuesto por Departamento')}
                  </Heading>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    {t('cpPAA.budgetDept.subtitle', 'Distribucion del presupuesto entre areas')}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box p={4}>
              {budgetByDept.length === 0 ? (
                <Center py={8}>
                  <Text fontSize="sm" color={colors.textColorSecondary}>
                    {t('cpPAA.budgetDept.empty', 'No hay datos de presupuesto por departamento')}
                  </Text>
                </Center>
              ) : (
                <VStack gap={3} align="stretch">
                  {budgetByDept.map((dept) => {
                    const percentage = maxBudget > 0
                      ? Math.round((dept.totalAmount / maxBudget) * 100)
                      : 0;
                    return (
                      <Box key={dept.department}>
                        <Flex justify="space-between" align="center" mb={1}>
                          <HStack gap={2}>
                            <Text fontSize="sm" fontWeight="600" color={colors.textColor}>
                              {dept.department}
                            </Text>
                            <Badge colorPalette="gray" variant="subtle" size="sm">
                              {dept.itemCount} {t('cpPAA.budgetDept.items', 'items')}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" fontWeight="700" color={colors.textColor} fontFamily="mono">
                            {formatCurrency(dept.totalAmount)}
                          </Text>
                        </Flex>
                        {/* Horizontal bar */}
                        <Box
                          w="100%"
                          h="8px"
                          bg={isDark ? 'gray.700' : 'gray.200'}
                          borderRadius="full"
                          overflow="hidden"
                        >
                          <Box
                            h="100%"
                            w={`${percentage}%`}
                            bgGradient={isDark
                              ? 'linear(to-r, green.600, teal.500)'
                              : 'linear(to-r, green.400, teal.400)'}
                            borderRadius="full"
                            transition="width 0.5s ease"
                          />
                        </Box>
                      </Box>
                    );
                  })}

                  {/* Total row */}
                  <Box
                    pt={3}
                    mt={1}
                    borderTopWidth="1px"
                    borderColor={cardBorder}
                  >
                    <Flex justify="space-between" align="center">
                      <Text fontSize="sm" fontWeight="700" color={colors.textColor}>
                        {t('cpPAA.budgetDept.total', 'Total')}
                      </Text>
                      <Text fontSize="md" fontWeight="700" color={colors.primaryColor} fontFamily="mono">
                        {formatCurrency(budgetByDept.reduce((sum, d) => sum + d.totalAmount, 0))}
                      </Text>
                    </Flex>
                  </Box>
                </VStack>
              )}
            </Box>
          </Box>
        </SimpleGrid>

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
              onClick={() => navigate('/cp/paa')}
            >
              <Icon as={FiArrowLeft} mr={2} />
              {t('cpPAA.backToList', 'Volver a la lista')}
            </Button>
            <HStack gap={3}>
              {workflowAction && (
                <Button
                  colorPalette={workflowAction.color}
                  onClick={() => handleStatusChange(workflowAction.next)}
                  loading={updatingStatus}
                  disabled={updatingStatus}
                >
                  <Icon as={FiCheck} mr={2} />
                  {t(`cpPAA.workflow.${workflowAction.next}`, workflowAction.label)}
                </Button>
              )}
              {paa.status === 'APROBADO' && (
                <Badge colorPalette="green" variant="solid" fontSize="sm" px={4} py={2}>
                  <Icon as={FiCheck} mr={2} />
                  {t('cpPAA.workflow.approved', 'PAA Aprobado')}
                </Badge>
              )}
            </HStack>
          </Flex>
        </Box>
      </VStack>

      {/* ================================================================== */}
      {/* Add Item Dialog                                                     */}
      {/* ================================================================== */}
      <DialogRoot open={addItemOpen} onOpenChange={(e) => setAddItemOpen(e.open)}>
        <DialogContent css={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, minWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
          <DialogHeader>
            <Heading size="md" color={colors.textColor}>
              <HStack gap={2}>
                <Icon as={FiPlus} color={colors.primaryColor} />
                <Text>Agregar Item al PAA</Text>
              </HStack>
            </Heading>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch">
              <SimpleGrid columns={2} gap={3}>
                <Box>
                  <Text fontSize="xs" fontWeight="600" color={colors.textColor} mb={1}>Codigo CPC *</Text>
                  <Input
                    value={newItem.cpcCode}
                    onChange={(e) => setNewItem(prev => ({ ...prev, cpcCode: e.target.value }))}
                    placeholder="Ej: 43211503"
                    size="sm" fontFamily="mono"
                    bg={cardBg} borderColor={cardBorder} color={colors.textColor}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="600" color={colors.textColor} mb={1}>Descripcion CPC</Text>
                  <Input
                    value={newItem.cpcDescription}
                    onChange={(e) => setNewItem(prev => ({ ...prev, cpcDescription: e.target.value }))}
                    placeholder="Ej: Computadoras portatiles"
                    size="sm"
                    bg={cardBg} borderColor={cardBorder} color={colors.textColor}
                  />
                </Box>
              </SimpleGrid>
              <Box>
                <Text fontSize="xs" fontWeight="600" color={colors.textColor} mb={1}>Descripcion del Item *</Text>
                <Textarea
                  value={newItem.itemDescription}
                  onChange={(e) => setNewItem(prev => ({ ...prev, itemDescription: e.target.value }))}
                  placeholder="Descripcion detallada del bien, servicio u obra a contratar"
                  size="sm" rows={2} resize="none"
                  bg={cardBg} borderColor={cardBorder} color={colors.textColor}
                />
              </Box>
              <SimpleGrid columns={2} gap={3}>
                <Box>
                  <Text fontSize="xs" fontWeight="600" color={colors.textColor} mb={1}>Tipo de Proceso</Text>
                  <NativeSelectRoot size="sm">
                    <NativeSelectField
                      value={newItem.processType}
                      onChange={(e) => setNewItem(prev => ({ ...prev, processType: e.target.value }))}
                      bg={cardBg} borderColor={cardBorder} color={colors.textColor}
                    >
                      <option value="">Seleccionar...</option>
                      {processTypes.map(pt => (
                        <option key={pt.code} value={pt.code}>{pt.name}</option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="600" color={colors.textColor} mb={1}>Presupuesto Referencial ($)</Text>
                  <Input
                    value={newItem.budgetAmount}
                    onChange={(e) => setNewItem(prev => ({ ...prev, budgetAmount: e.target.value }))}
                    placeholder="Ej: 50000"
                    size="sm" type="number" fontFamily="mono"
                    bg={cardBg} borderColor={cardBorder} color={colors.textColor}
                  />
                </Box>
              </SimpleGrid>
              <SimpleGrid columns={2} gap={3}>
                <Box>
                  <Text fontSize="xs" fontWeight="600" color={colors.textColor} mb={1}>Departamento</Text>
                  <Input
                    value={newItem.department}
                    onChange={(e) => setNewItem(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Ej: Direccion Administrativa"
                    size="sm"
                    bg={cardBg} borderColor={cardBorder} color={colors.textColor}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="600" color={colors.textColor} mb={1}>Prioridad</Text>
                  <NativeSelectRoot size="sm">
                    <NativeSelectField
                      value={newItem.priority}
                      onChange={(e) => setNewItem(prev => ({ ...prev, priority: e.target.value }))}
                      bg={cardBg} borderColor={cardBorder} color={colors.textColor}
                    >
                      <option value="HIGH">Alta</option>
                      <option value="MEDIUM">Media</option>
                      <option value="LOW">Baja</option>
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
              </SimpleGrid>
              <SimpleGrid columns={2} gap={3}>
                <Box>
                  <Text fontSize="xs" fontWeight="600" color={colors.textColor} mb={1}>Partida Presupuestaria</Text>
                  <Input
                    value={newItem.budgetPartition}
                    onChange={(e) => setNewItem(prev => ({ ...prev, budgetPartition: e.target.value }))}
                    placeholder="Ej: 530801"
                    size="sm" fontFamily="mono"
                    bg={cardBg} borderColor={cardBorder} color={colors.textColor}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="600" color={colors.textColor} mb={1}>Fuente de Financiamiento</Text>
                  <Input
                    value={newItem.fundingSource}
                    onChange={(e) => setNewItem(prev => ({ ...prev, fundingSource: e.target.value }))}
                    placeholder="Ej: Recursos Fiscales"
                    size="sm"
                    bg={cardBg} borderColor={cardBorder} color={colors.textColor}
                  />
                </Box>
              </SimpleGrid>
              <SimpleGrid columns={3} gap={3}>
                <Box>
                  <Text fontSize="xs" fontWeight="600" color={colors.textColor} mb={1}>Fecha Publicacion Est.</Text>
                  <Input
                    value={newItem.estimatedPublicationDate}
                    onChange={(e) => setNewItem(prev => ({ ...prev, estimatedPublicationDate: e.target.value }))}
                    type="date" size="sm"
                    bg={cardBg} borderColor={cardBorder} color={colors.textColor}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="600" color={colors.textColor} mb={1}>Fecha Adjudicacion Est.</Text>
                  <Input
                    value={newItem.estimatedAdjudicationDate}
                    onChange={(e) => setNewItem(prev => ({ ...prev, estimatedAdjudicationDate: e.target.value }))}
                    type="date" size="sm"
                    bg={cardBg} borderColor={cardBorder} color={colors.textColor}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="600" color={colors.textColor} mb={1}>Duracion Contrato (dias)</Text>
                  <Input
                    value={newItem.estimatedContractDurationDays}
                    onChange={(e) => setNewItem(prev => ({ ...prev, estimatedContractDurationDays: e.target.value }))}
                    type="number" size="sm" fontFamily="mono"
                    bg={cardBg} borderColor={cardBorder} color={colors.textColor}
                  />
                </Box>
              </SimpleGrid>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddItemOpen(false)} size="sm">Cancelar</Button>
            <Button
              colorPalette="blue"
              onClick={handleAddItem}
              loading={addingItem}
              disabled={addingItem || !newItem.cpcCode.trim() || !newItem.itemDescription.trim()}
              size="sm"
            >
              <Icon as={FiPlus} mr={2} /> Agregar Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* ================================================================== */}
      {/* AI Assistant Slide-Over Panel                                       */}
      {/* ================================================================== */}

      {/* Backdrop */}
      {aiPanelOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.400"
          zIndex={40}
          onClick={closeAiPanel}
        />
      )}

      {/* Slide-over Panel */}
      <Box
        position="fixed"
        top={0}
        right={0}
        h="100vh"
        w={{ base: '100vw', md: '520px' }}
        bg={isDark ? 'gray.900' : 'white'}
        borderLeftWidth="1px"
        borderColor={cardBorder}
        shadow="2xl"
        zIndex={50}
        transform={aiPanelOpen ? 'translateX(0)' : 'translateX(100%)'}
        transition="transform 0.3s ease-in-out"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {/* Panel Header */}
        <Box
          bgGradient={isDark ? 'to-r' : 'to-r'}
          gradientFrom="purple.600"
          gradientTo="blue.600"
          px={5}
          py={4}
          color="white"
          flexShrink={0}
        >
          <Flex justify="space-between" align="center">
            <HStack gap={3}>
              <Flex w={10} h={10} borderRadius="full" bg="whiteAlpha.200" align="center" justify="center">
                <Icon as={LuBrain} boxSize={5} />
              </Flex>
              <VStack align="start" gap={0}>
                <Text fontWeight="bold" fontSize="md">Asistente IA - PAA</Text>
                <Text fontSize="xs" opacity={0.85}>
                  {aiContext === 'PAA_FULL_ANALYSIS' ? 'Análisis completo del PAA' :
                   aiContext === 'DEMAND_AGGREGATION' ? 'Análisis de fraccionamiento' :
                   aiContext.startsWith('ITEM_') ? `Análisis Item #${aiContext.replace('ITEM_', '')}` :
                   'Consulta libre sobre LOSNCP'}
                </Text>
              </VStack>
            </HStack>
            <IconButton
              aria-label="Cerrar panel"
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              size="sm"
              onClick={closeAiPanel}
              borderRadius="full"
            >
              <Icon as={FiX} />
            </IconButton>
          </Flex>
        </Box>

        {/* AI Quick Actions */}
        <Box px={4} py={3} borderBottomWidth="1px" borderColor={cardBorder} bg={isDark ? 'gray.850' : 'gray.50'} flexShrink={0}>
          <Text fontSize="xs" fontWeight="600" color={colors.textColorSecondary} mb={2}>
            Acciones rápidas
          </Text>
          <Flex gap={2} flexWrap="wrap">
            <Button
              size="xs"
              colorPalette="purple"
              variant={aiContext === 'PAA_FULL_ANALYSIS' ? 'solid' : 'outline'}
              onClick={handleAnalyzePAA}
              disabled={aiLoading}
            >
              <Icon as={LuShieldCheck} mr={1} />
              Validar PAA
            </Button>
            {demandAggregation.length > 0 && (
              <Button
                size="xs"
                colorPalette="orange"
                variant={aiContext === 'DEMAND_AGGREGATION' ? 'solid' : 'outline'}
                onClick={handleAnalyzeDemand}
                disabled={aiLoading}
              >
                <Icon as={LuScale} mr={1} />
                Fraccionamiento
              </Button>
            )}
          </Flex>
        </Box>

        {/* AI Response Content */}
        <Box flex={1} overflowY="auto" p={4}>
          {aiLoading ? (
            <Center py={16}>
              <VStack gap={4}>
                <Spinner size="xl" color="purple.500" />
                <Text color={colors.textColorSecondary} fontSize="sm">
                  {aiContext === 'PAA_FULL_ANALYSIS' ? 'Analizando PAA según LOSNCP...' :
                   aiContext === 'DEMAND_AGGREGATION' ? 'Analizando riesgo de fraccionamiento...' :
                   aiContext.startsWith('ITEM_') ? 'Analizando item según normativa...' :
                   'Consultando marco legal...'}
                </Text>
                <Text color={colors.textColorSecondary} fontSize="xs">
                  Verificando LOSNCP, SERCOP y normativa vigente
                </Text>
              </VStack>
            </Center>
          ) : aiResponse ? (
            <CPAIResponseDisplay
              response={aiResponse}
              headerSubtitle={
                aiContext === 'PAA_FULL_ANALYSIS' ? 'Análisis completo según LOSNCP' :
                aiContext === 'DEMAND_AGGREGATION' ? 'Detección de fraccionamiento Art. 62' :
                aiContext.startsWith('ITEM_') ? `Item #${aiContext.replace('ITEM_', '')} - Marco Legal` :
                'Respuesta basada en LOSNCP'
              }
              gradientFrom={aiContext === 'DEMAND_AGGREGATION' ? 'orange.500' : 'purple.500'}
              gradientTo={aiContext === 'DEMAND_AGGREGATION' ? 'red.500' : 'blue.600'}
            />
          ) : (
            <Center py={12}>
              <VStack gap={4}>
                <Flex w={16} h={16} borderRadius="full" bg={isDark ? 'purple.900' : 'purple.50'} align="center" justify="center">
                  <Icon as={LuBrain} boxSize={8} color="purple.500" />
                </Flex>
                <VStack gap={1}>
                  <Text fontWeight="600" color={colors.textColor} fontSize="sm">
                    Asistente IA para PAA
                  </Text>
                  <Text color={colors.textColorSecondary} fontSize="xs" textAlign="center" maxW="300px">
                    Consulta sobre normativa LOSNCP, valida tu PAA, detecta fraccionamiento o pregunta cualquier duda legal.
                  </Text>
                </VStack>
              </VStack>
            </Center>
          )}
        </Box>

        {/* Query input */}
        <Box
          px={4}
          py={3}
          borderTopWidth="1px"
          borderColor={cardBorder}
          bg={isDark ? 'gray.850' : 'gray.50'}
          flexShrink={0}
        >
          <HStack gap={2}>
            <Textarea
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ej: ¿Puedo usar Catálogo Electrónico para comprar equipos de cómputo por $45,000?"
              size="sm"
              rows={2}
              resize="none"
              bg={isDark ? 'gray.800' : 'white'}
              borderColor={cardBorder}
              color={colors.textColor}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAIQuery();
                }
              }}
            />
            <IconButton
              aria-label="Enviar consulta"
              colorPalette="purple"
              onClick={handleAIQuery}
              disabled={!aiQuery.trim() || aiLoading}
              loading={aiLoading && aiContext === 'QUERY'}
              borderRadius="lg"
              size="md"
            >
              <Icon as={FiSend} />
            </IconButton>
          </HStack>
        </Box>
      </Box>
    </Box>
  );
};

export default CPPAAEditPage;
