/**
 * CPPAADeptWizardPage - Department wizard page for collaborative PAA
 * Shows wizard for in-progress plans, or a professional PAC-style summary
 * (matching SERCOP compraspublicas.gob.ec format) for submitted/approved plans.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Spinner,
  Icon,
  Heading,
  SimpleGrid,
  Stat,
  Progress,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiPackage,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiFileText,
  FiEdit,
  FiAlertTriangle,
  FiShield,
  FiTrendingUp,
  FiClipboard,
} from 'react-icons/fi';
import { toaster } from '../../components/ui/toaster';
import { useTheme } from '../../contexts/ThemeContext';
import {
  type CPPAAWorkspace,
  type CPPAADepartmentPlan,
  getWorkspace,
  getDepartmentPlan,
  submitDepartmentPlan,
  updatePhaseData,
  updateItemsData,
  getDeptStatusColor,
  getDeptStatusIcon,
  formatCurrency,
  getFieldCommentCounts,
  getProposalCounts,
  getLatestFieldChanges,
  type CPPAAFieldChangeLog,
} from '../../services/cpWorkspaceService';
import { CPPAAWizardChat } from '../../components/compras-publicas/ai/CPPAAWizardChat';
import { PlanViewerMural } from '../../components/compras-publicas/workspace/PlanViewerMural';
import { useWorkspaceRealTime } from '../../hooks/useWorkspaceRealTime';
import { RealtimeChangeToastStack } from '../../components/compras-publicas/workspace/RealtimeChangeToast';
import { ProposalCreationModal } from '../../components/compras-publicas/workspace/ProposalCreationModal';
import { ProposalPanel } from '../../components/compras-publicas/workspace/ProposalPanel';
import { FiGitPullRequest, FiMessageCircle } from 'react-icons/fi';

const MotionBox = motion.create(Box as any);

/** Statuses where the plan is read-only (already submitted) */
const READ_ONLY_STATUSES = ['ENVIADO', 'APROBADO', 'RECHAZADO', 'CONSOLIDADO'];

/** Purchase type colors */
const purchaseTypeColors: Record<string, string> = {
  Bien: 'blue',
  Servicio: 'green',
  Obra: 'orange',
  Consultoria: 'purple',
};

// ============================================================================
// PAC-Style Plan Summary (matches compraspublicas.gob.ec format)
// ============================================================================

const PlanSummaryView: React.FC<{
  plan: CPPAADepartmentPlan;
  workspace: CPPAAWorkspace;
  isDark: boolean;
  onEdit: () => void;
  onInlineSave?: (phaseDataJson: string, itemsDataJson: string) => Promise<void>;
  fieldCommentCounts?: Record<string, number>;
  fieldProposalCounts?: Record<string, number>;
  currentUserName?: string;
  currentUserRole?: string;
  onProposeChange?: (fieldCode: string, phaseIdx: number, currentValue: string) => void;
  fieldChanges?: CPPAAFieldChangeLog[];
}> = ({ plan, workspace, isDark, onEdit, onInlineSave, fieldCommentCounts, fieldProposalCounts, currentUserName, currentUserRole, onProposeChange, fieldChanges }) => {
  const cardBg = isDark ? 'gray.800' : 'white';
  const headerBg = isDark ? 'blue.900' : 'blue.600';
  const borderColor = isDark ? 'gray.600' : 'gray.200';
  const statusColor = getDeptStatusColor(plan.status);

  // Parse phase data
  let phases: Record<string, any> = {};
  try {
    if (plan.phaseData) phases = JSON.parse(plan.phaseData);
  } catch { /* ignore */ }

  // Parse items data — detect if structured objects or plain text
  const { items, isStructured, rawTexts } = useMemo(() => {
    try {
      if (!plan.itemsData) return { items: [], isStructured: false, rawTexts: [] };
      const parsed = JSON.parse(plan.itemsData);
      let arr: any[] = [];
      if (Array.isArray(parsed)) arr = parsed;
      else if (parsed?.examples && Array.isArray(parsed.examples)) arr = parsed.examples;
      else if (parsed?.items && Array.isArray(parsed.items)) arr = parsed.items;
      else if (typeof parsed === 'object') {
        const vals = Object.values(parsed);
        const found = vals.find(v => Array.isArray(v));
        if (found) arr = found as any[];
      }

      if (arr.length === 0) return { items: [], isStructured: false, rawTexts: [] };

      // Detect if items are structured objects or plain strings
      const structured = arr.some(item =>
        typeof item === 'object' && item !== null &&
        (item.cpcCode || item.cpc || item.budgetAmount || item.budget || item.processType)
      );

      if (structured) {
        return { items: arr, isStructured: true, rawTexts: [] };
      } else {
        // Items are plain text (AI responses)
        const texts = arr.map(item => typeof item === 'string' ? item : JSON.stringify(item));
        return { items: [], isStructured: false, rawTexts: texts };
      }
    } catch {
      return { items: [], isStructured: false, rawTexts: [] };
    }
  }, [plan.itemsData]);

  // Compute totals (only for structured items)
  const totals = useMemo(() => {
    let totalBudget = 0;
    let byType: Record<string, { count: number; budget: number }> = {};

    for (const item of items) {
      const budget = Number(item?.budgetAmount || item?.budget || item?.costoTotal || item?.valorTotal || 0);
      totalBudget += budget;

      const type = item?.processType || item?.tipoCompra || item?.type || 'Bien';
      if (!byType[type]) byType[type] = { count: 0, budget: 0 };
      byType[type].count++;
      byType[type].budget += budget;
    }
    return { totalBudget, byType };
  }, [items]);

  return (
    <VStack gap={4} align="stretch">
      {/* ================================================================
          PAC-STYLE HEADER (like SERCOP portal)
          ================================================================ */}
      <MotionBox
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        bg={headerBg}
        color="white"
        p={5}
        borderRadius="xl"
        boxShadow="lg"
      >
        <Flex justify="space-between" align="start" flexWrap="wrap" gap={3}>
          <VStack align="start" gap={1}>
            <HStack>
              <Icon as={FiShield} boxSize={5} />
              <Heading size="md">Plan Anual de Contratacion</Heading>
            </HStack>
            <Text fontSize="sm" opacity={0.9}>
              Departamento: <strong>{plan.departmentName}</strong>
            </Text>
            <Text fontSize="xs" opacity={0.8}>
              {workspace.entityName} | RUC: {workspace.entityRuc} | Anio Fiscal: {workspace.fiscalYear}
            </Text>
            {plan.assignedUserName && (
              <Text fontSize="xs" opacity={0.8}>
                <Icon as={FiUser} mr={1} />Responsable: {plan.assignedUserName}
              </Text>
            )}
          </VStack>
          <VStack align="end" gap={1}>
            <Badge
              colorPalette={statusColor}
              fontSize="md"
              px={4}
              py={2}
              borderRadius="full"
              fontWeight="bold"
            >
              {getDeptStatusIcon(plan.status)} {plan.status}
            </Badge>
            <Text fontSize="xs" opacity={0.8}>
              Codigo: {workspace.workspaceCode}-{plan.departmentCode}
            </Text>
          </VStack>
        </Flex>
      </MotionBox>

      {/* Status-specific banners */}
      {plan.status === 'RECHAZADO' && plan.rejectionReason && (
        <MotionBox
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          bg={isDark ? 'red.900' : 'red.50'}
          border="2px solid"
          borderColor="red.400"
          borderRadius="lg"
          p={4}
        >
          <HStack mb={2}>
            <Icon as={FiAlertTriangle} color="red.500" boxSize={5} />
            <Text fontWeight="bold" color="red.500" fontSize="md">Plan Rechazado</Text>
          </HStack>
          <Text color={isDark ? 'red.200' : 'red.700'} fontSize="sm" mb={3}>
            {plan.rejectionReason}
          </Text>
          <Button size="sm" colorPalette="blue" onClick={onEdit}>
            <Icon as={FiEdit} mr={1} /> Corregir y Reenviar
          </Button>
        </MotionBox>
      )}

      {plan.status === 'APROBADO' && (
        <MotionBox
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          bg={isDark ? 'green.900' : 'green.50'}
          border="2px solid"
          borderColor="green.400"
          borderRadius="lg"
          p={4}
        >
          <HStack>
            <Icon as={FiCheckCircle} color="green.500" boxSize={5} />
            <VStack align="start" gap={0}>
              <Text fontWeight="bold" color="green.500">Plan Aprobado</Text>
              <Text fontSize="sm" color={isDark ? 'green.200' : 'green.700'}>
                Aprobado por <strong>{plan.approvedBy}</strong> el{' '}
                {plan.approvedAt ? new Date(plan.approvedAt).toLocaleDateString('es-EC', {
                  day: '2-digit', month: 'long', year: 'numeric'
                }) : ''}
              </Text>
            </VStack>
          </HStack>
        </MotionBox>
      )}

      {/* ================================================================
          STATS DASHBOARD
          ================================================================ */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          bg={cardBg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor}
          boxShadow="sm"
        >
          <Stat.Root>
            <Stat.Label fontSize="xs" color="gray.500">
              <Icon as={FiPackage} mr={1} />Total Items
            </Stat.Label>
            <Stat.ValueText fontSize="3xl" fontWeight="bold" color="blue.500">
              {plan.itemsCount || items.length || 0}
            </Stat.ValueText>
            <Stat.HelpText fontSize="xs">partidas presupuestarias</Stat.HelpText>
          </Stat.Root>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          bg={cardBg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor}
          boxShadow="sm"
        >
          <Stat.Root>
            <Stat.Label fontSize="xs" color="gray.500">
              <Icon as={FiDollarSign} mr={1} />Presupuesto Asignado
            </Stat.Label>
            <Stat.ValueText fontSize="xl" fontWeight="bold" color="green.500">
              {formatCurrency(plan.itemsTotalBudget || totals.totalBudget || 0)}
            </Stat.ValueText>
            <Stat.HelpText fontSize="xs">presupuesto referencial total</Stat.HelpText>
          </Stat.Root>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          bg={cardBg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor}
          boxShadow="sm"
        >
          <Stat.Root>
            <Stat.Label fontSize="xs" color="gray.500">
              <Icon as={FiCalendar} mr={1} />Fecha de Envio
            </Stat.Label>
            <Stat.ValueText fontSize="md" fontWeight="bold">
              {plan.submittedAt ? new Date(plan.submittedAt).toLocaleDateString('es-EC', {
                day: '2-digit', month: 'short', year: 'numeric'
              }) : 'Pendiente'}
            </Stat.ValueText>
            <Stat.HelpText fontSize="xs">enviado para revision</Stat.HelpText>
          </Stat.Root>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          bg={cardBg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor}
          boxShadow="sm"
        >
          <Stat.Root>
            <Stat.Label fontSize="xs" color="gray.500">
              <Icon as={FiTrendingUp} mr={1} />Metodologia
            </Stat.Label>
            <Stat.ValueText fontSize="xl" fontWeight="bold" color="purple.500">
              {plan.currentPhase}/{plan.totalPhases}
            </Stat.ValueText>
            <Stat.HelpText fontSize="xs">fases completadas</Stat.HelpText>
          </Stat.Root>
          <Progress.Root
            value={(plan.currentPhase / plan.totalPhases) * 100}
            size="xs"
            mt={2}
            borderRadius="full"
            colorPalette="purple"
          >
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </MotionBox>
      </SimpleGrid>

      {/* ================================================================
          BREAKDOWN BY TYPE (only for structured items)
          ================================================================ */}
      {isStructured && Object.keys(totals.byType).length > 0 && (
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          bg={cardBg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor}
        >
          <Heading size="sm" mb={3}>
            <Icon as={FiClipboard} mr={2} />
            Resumen por Tipo de Contratacion
          </Heading>
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
            {Object.entries(totals.byType).map(([type, data]) => (
              <Box
                key={type}
                p={3}
                bg={isDark ? 'gray.700' : 'gray.50'}
                borderRadius="lg"
                borderLeft="4px solid"
                borderColor={`${purchaseTypeColors[type] || 'gray'}.400`}
              >
                <Text fontSize="xs" fontWeight="bold" color={`${purchaseTypeColors[type] || 'gray'}.500`}>
                  {type}
                </Text>
                <Text fontSize="lg" fontWeight="bold">{data.count}</Text>
                <Text fontSize="xs" color="gray.500">{formatCurrency(data.budget)}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </MotionBox>
      )}

      {/* ================================================================
          PLAN VIEWER — Mural / Table / Document views
          ================================================================ */}
      {(Object.keys(phases).length > 0 || plan.itemsData) ? (
        <PlanViewerMural
          phaseData={plan.phaseData}
          itemsData={plan.itemsData}
          departmentName={plan.departmentName}
          entityName={workspace.entityName}
          fiscalYear={workspace.fiscalYear}
          isDark={isDark}
          onEdit={onEdit}
          onSave={onInlineSave}
          allowInlineEdit={!!onInlineSave}
          methodologyId={workspace.methodologyId}
          workspaceId={workspace.id}
          departmentPlanId={plan.id}
          fieldCommentCounts={fieldCommentCounts}
          fieldProposalCounts={fieldProposalCounts}
          currentUserName={currentUserName}
          currentUserRole={currentUserRole}
          onProposeChange={onProposeChange}
          fieldChanges={fieldChanges}
        />
      ) : (
        <Box bg={cardBg} p={8} borderRadius="xl" border="1px solid" borderColor={borderColor} textAlign="center">
          <Icon as={FiFileText} boxSize={10} color="gray.400" mb={3} />
          <Text color="gray.500">Este plan aun no tiene datos detallados</Text>
        </Box>
      )}
    </VStack>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const CPPAADeptWizardPage: React.FC = () => {
  const { workspaceId, deptId } = useParams<{ workspaceId: string; deptId: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [workspace, setWorkspace] = useState<CPPAAWorkspace | null>(null);
  const [deptPlan, setDeptPlan] = useState<CPPAADepartmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [forceEdit, setForceEdit] = useState(false);

  // Collaborative features state
  const [fieldCommentCounts, setFieldCommentCounts] = useState<Record<string, number>>({});
  const [fieldProposalCounts, setFieldProposalCounts] = useState<Record<string, number>>({});
  const [fieldChanges, setFieldChanges] = useState<CPPAAFieldChangeLog[]>([]);
  const [isProposalsOpen, setIsProposalsOpen] = useState(false);
  const [proposalModal, setProposalModal] = useState<{
    fieldCode: string; phaseIdx: number; currentValue: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    if (!workspaceId || !deptId) return;
    try {
      const [ws, dept] = await Promise.all([
        getWorkspace(Number(workspaceId)),
        getDepartmentPlan(Number(deptId)),
      ]);
      setWorkspace(ws);
      setDeptPlan(dept);
    } catch (err) {
      console.error('Error loading department wizard data:', err);
      toaster.create({ title: 'Error al cargar datos del departamento', type: 'error', duration: 3000 });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, deptId]);

  // Load field comment counts, proposal counts, and field changes
  const loadCollaborativeCounts = useCallback(async () => {
    if (!workspaceId || !deptId) return;
    const wsId = Number(workspaceId);
    const dpId = Number(deptId);

    // Load each independently so one failure doesn't block others
    getFieldCommentCounts(wsId, dpId)
      .then(setFieldCommentCounts)
      .catch(e => console.warn('[DeptWizard] comment counts error:', e));

    getProposalCounts(wsId, dpId)
      .then(setFieldProposalCounts)
      .catch(e => console.warn('[DeptWizard] proposal counts error:', e));

    getLatestFieldChanges(wsId, dpId)
      .then(changes => {
        console.log('[DeptWizard] fieldChanges:', changes?.length, changes);
        setFieldChanges(changes || []);
      })
      .catch(e => console.warn('[DeptWizard] field changes error:', e));
  }, [workspaceId, deptId]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadCollaborativeCounts(); }, [loadCollaborativeCounts]);

  // Real-time: refresh when another session edits this workspace's departments
  const { recentChanges, dismissChange } = useWorkspaceRealTime({
    workspaceId: workspace?.id || null,
    onDeptUpdate: loadData,
    onDashboardRefresh: loadData,
    onFieldCommentCountsRefresh: loadCollaborativeCounts,
    onProposalsRefresh: loadCollaborativeCounts,
  });

  const currentUserName = workspace?.coordinatorUserName || 'Usuario';

  const handleInlineSave = useCallback(async (phaseDataJson: string, itemsDataJson: string) => {
    if (!deptPlan) return;
    try {
      // Save phase data
      await updatePhaseData(deptPlan.id, deptPlan.currentPhase, phaseDataJson);

      // Save items data — compute count and total from the JSON
      let itemsCount = 0;
      let itemsTotalBudget = 0;
      try {
        const parsed = JSON.parse(itemsDataJson);
        let arr: any[] = [];
        if (Array.isArray(parsed)) arr = parsed;
        else if (parsed?.examples) arr = parsed.examples;
        else if (parsed?.items) arr = parsed.items;
        itemsCount = arr.length;
        itemsTotalBudget = arr.reduce((sum: number, item: any) => {
          if (typeof item === 'object' && item !== null) {
            return sum + (Number(item.budgetAmount || item.budget || item.valorTotal || item.costoTotal || item.total) || 0);
          }
          return sum;
        }, 0);
      } catch { /* ignore parse error */ }

      await updateItemsData(deptPlan.id, itemsDataJson, itemsCount, itemsTotalBudget || (deptPlan.departmentBudget || 0));

      toaster.create({ title: 'Cambios guardados exitosamente', type: 'success', duration: 3000 });
      // Refresh data + collaborative counts (field changes, comments, proposals)
      await Promise.all([loadData(), loadCollaborativeCounts()]);
    } catch (err) {
      console.error('Error saving inline edits:', err);
      toaster.create({ title: 'Error al guardar cambios', type: 'error', duration: 3000 });
      throw err; // Re-throw so PlanViewerMural knows the save failed
    }
  }, [deptPlan, loadData]);

  const handleSubmitPlan = async (proposalResponse: any) => {
    if (!deptPlan) return;
    try {
      const itemsData = JSON.stringify(proposalResponse);
      const itemsCount = proposalResponse?.examples?.length || 0;
      // Calculate budget only from structured items that have explicit budget fields
      const itemsTotalBudget = proposalResponse?.examples?.reduce(
        (sum: number, item: any) => {
          if (typeof item === 'object' && item !== null) {
            return sum + (Number(item.budgetAmount || item.budget || item.valorTotal || item.costoTotal) || 0);
          }
          return sum;
        },
        0
      ) || (deptPlan.departmentBudget || 0);
      await submitDepartmentPlan(deptPlan.id, itemsData, itemsCount, itemsTotalBudget);
      toaster.create({ title: 'Plan enviado exitosamente', type: 'success', duration: 3000 });
      navigate(`/cp/paa/workspaces/${workspaceId}`);
    } catch (err) {
      console.error('Error submitting department plan:', err);
      toaster.create({ title: 'Error al enviar plan', type: 'error', duration: 3000 });
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!workspace || !deptPlan) {
    return (
      <Flex direction="column" align="center" justify="center" h="300px" gap={4}>
        <Text color="gray.500">No se encontraron datos del departamento</Text>
        <Button onClick={() => navigate('/cp/paa/workspaces')}>Volver a Workspaces</Button>
      </Flex>
    );
  }

  const statusColor = getDeptStatusColor(deptPlan.status);
  const isReadOnly = READ_ONLY_STATUSES.includes(deptPlan.status) && !forceEdit;

  return (
    <Box p={4} bg={isDark ? 'gray.900' : 'gray.50'} minH="100vh">
      {/* Header */}
      <HStack mb={4} gap={3}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate(`/cp/paa/workspaces/${workspaceId}`)}
        >
          <Icon as={FiArrowLeft} mr={1} /> Volver
        </Button>
        <VStack align="start" gap={0} flex={1}>
          <Text fontWeight="bold" fontSize="md">
            {getDeptStatusIcon(deptPlan.status)} {deptPlan.departmentName}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {workspace.entityName} — PAA {workspace.fiscalYear}
            {deptPlan.assignedUserName && ` — ${deptPlan.assignedUserName}`}
          </Text>
        </VStack>
        <HStack>
          <Button
            size="sm"
            variant="outline"
            colorPalette="teal"
            onClick={() => setIsProposalsOpen(!isProposalsOpen)}
          >
            <FiGitPullRequest /> Propuestas
          </Button>
          {isReadOnly && deptPlan.status !== 'CONSOLIDADO' && (
            <Button size="sm" variant="outline" onClick={() => setForceEdit(true)}>
              <Icon as={FiEdit} mr={1} /> Editar
            </Button>
          )}
          <Badge colorPalette={statusColor} fontSize="sm" px={3} py={1}>
            {deptPlan.status}
          </Badge>
        </HStack>
      </HStack>

      {/* Show PAC-style summary for read-only, wizard for editable */}
      {isReadOnly ? (
        <PlanSummaryView
          plan={deptPlan}
          workspace={workspace}
          isDark={isDark}
          onEdit={() => setForceEdit(true)}
          onInlineSave={handleInlineSave}
          fieldCommentCounts={fieldCommentCounts}
          fieldProposalCounts={fieldProposalCounts}
          currentUserName={currentUserName}
          currentUserRole="COORDINATOR"
          onProposeChange={(fieldCode, phaseIdx, currentValue) =>
            setProposalModal({ fieldCode, phaseIdx, currentValue })
          }
          fieldChanges={fieldChanges}
        />
      ) : (
        <CPPAAWizardChat
          fiscalYear={workspace.fiscalYear}
          workspaceId={String(workspace.id)}
          departmentPlanId={String(deptPlan.id)}
          departmentName={deptPlan.departmentName}
          entityName={workspace.entityName}
          entityRuc={workspace.entityRuc}
          defaultExpanded={true}
          onSubmitDepartmentPlan={handleSubmitPlan}
        />
      )}

      {/* Proposal Panel */}
      {isProposalsOpen && (
        <ProposalPanel
          workspaceId={workspace.id}
          currentUserName={currentUserName}
          isCoordinator={true}
          onClose={() => setIsProposalsOpen(false)}
        />
      )}

      {/* Proposal Creation Modal */}
      {proposalModal && (
        <ProposalCreationModal
          isOpen={true}
          onClose={() => setProposalModal(null)}
          workspaceId={workspace.id}
          departmentPlanId={deptPlan.id}
          fieldCode={proposalModal.fieldCode}
          phaseIdx={proposalModal.phaseIdx}
          currentValue={proposalModal.currentValue}
          currentUserName={currentUserName}
          onProposalCreated={loadCollaborativeCounts}
        />
      )}

      {/* Realtime toasts */}
      <RealtimeChangeToastStack changes={recentChanges} onDismiss={dismissChange} />
    </Box>
  );
};

export default CPPAADeptWizardPage;
